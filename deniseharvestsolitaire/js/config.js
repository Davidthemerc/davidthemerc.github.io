window.DSH=window.DSH||{};
DSH.Config={
  build:'42.2',
  draws:{cards:5,maxPacks:3,prices:[175,275,400],levelSurchargeEvery:10,levelSurcharge:50},
  difficulty:{stockFloor:24,stockCeiling:44,weatherCeiling:48,tableauCeiling:30,simulationMaxLevel:1000,campaignMaxLevel:1000},
  crops:{
    clover:{name:'Clover',icon:'🌿',cost:15,payout:45,grow:1,wind:.12,minRegion:0,homeRegion:0},
    sunflower:{name:'Sunflower',icon:'🌻',cost:35,payout:110,grow:2,wind:.18,minRegion:1,homeRegion:1},
    berry:{name:'Strawberries',icon:'🍓',cost:60,payout:200,grow:2,wind:.25,minRegion:2,homeRegion:2},
    apple:{name:'Orchard Apples',icon:'🍎',cost:80,payout:275,grow:2,wind:.20,minRegion:3,homeRegion:3},
    pumpkin:{name:'Pumpkin',icon:'🎃',cost:100,payout:340,grow:3,wind:.34,minRegion:4,homeRegion:4}
  },
  farmRegions:[
    {name:'Meadow Patch',icon:'🌿',unlockLevel:1,bonus:'Breezy Meadow: +5% crop Windmill chance.',windBonus:.05,
      theme:'meadow',decor:{key:'birdbath',name:'Songbird Bath',icon:'🐦',cost:3,desc:'+5% chance to find Rosie Treats.'},
      reward:{coins:0,gems:0,treats:0}},
    {name:'Sunflower Hollow',icon:'🌻',unlockLevel:5,bonus:'Golden Sun: +10% crop coin payouts.',cropPayBonus:.10,
      theme:'sunflower',decor:{key:'lanterns',name:'Sunflower Lanterns',icon:'🏮',cost:5,desc:'+5% crop payouts in every region.'},
      reward:{coins:250,gems:1,treats:1}},
    {name:'Rosie Creek',icon:'💧',unlockLevel:9,bonus:'Rosie Creek: +8% Rosie Find chance.',rosieFindBonus:.08,
      theme:'creek',decor:{key:'footbridge',name:'Creek Footbridge',icon:'🌉',cost:6,desc:'+5% Rosie Find chance everywhere.'},
      reward:{coins:300,gems:1,rescues:1}},
    {name:'Golden Orchard',icon:'🍎',unlockLevel:13,bonus:'Orchard Luck: +3% timed-harvest gem chance.',timedGemBonus:.03,
      theme:'orchard',decor:{key:'bench',name:'Orchard Bench',icon:'🪑',cost:7,desc:'+2% timed-harvest gem chance everywhere.'},
      reward:{coins:400,gems:2,gates:1}},
    {name:'Harvest Ridge',icon:'⛰️',unlockLevel:17,bonus:'Highland Yield: +15% timed-harvest coins.',timedCoinBonus:.15,
      theme:'ridge',decor:{key:'weatherVane',name:'Harvest Weather Vane',icon:'🧭',cost:8,desc:'+5% timed-harvest coins everywhere.'},
      reward:{coins:600,gems:2,windmills:1,treats:1}}
  ],
  regionalFarm:{homeCropBonus:.15,lanternCropBonus:.05,birdbathTreatBonus:.05,footbridgeFindBonus:.05,benchGemBonus:.02,weatherVaneCoinBonus:.05},
  cropRewards:{
    gateChance:.28,gateDoubleChance:.25,
    rescueChance:.30,rescueDoubleChance:.25,
    treatChance:.15,butterflyMultiplier:1.20
  },
  timedHarvest:{
    ms:30*60*1000,cap:3,baseCoins:150,regionCoins:25,gemChance:.09,
    rosieFindChance:.12,treatChance:.08,harvestStreakStep:.05,harvestStreakMax:.25
  },
  happiness:{
    start:50,max:100,treasureReset:75,
    levelComplete:2,cropHarvest:2,timedHarvest:3,decoration:5,
    rosieFind:1,visit:1,visitCooldownMs:30*60*1000,
    pet:3,petCooldownMs:30*60*1000,treat:10,
    findTierBonuses:[0,.05,.10,.15,.20]
  },
  rosieTreasure:{
    coinsMin:400,coinsMax:700,gemsMin:1,gemsMax:2,consumables:2
  },
  streak:{
    coinBase:35,happinessEvery:10,
    phases:{coin:5,draw:10,reveal:15,wild:20}
  },
  scoring:{
    perfectBase:100,perfectPerLevel:15,perfectGemChance:.25,
    starCoinBonus:40,threeStarStreak:5
  },
  specialCards:{
    chainRequiredStreak:3,
    goldBaseCoins:40,goldPerLevelCoins:3,goldGemChance:.06,
    rainbowCoins:90,rainbowBonusDraws:1,
    flowerBonusDraws:1,wateringCanBonusCoins:25,harvestChain2Coins:25,harvestChain3Coins:50,
    heavyHits:2,sleepingClears:4,luckyHandChance:.083,previewChoiceChance:.16,challengeCoins:750,challengeGems:2
  },
  shears:{
    maxCharges:2,cardsPerCharge:8,startOnObstacleLevel:1
  },
  dailyChallenge:{
    minLevel:18,levelRange:13,extraStock:2,
    coins:300,gems:3,perfectGem:1,
    weeklyStreakEvery:7,weeklyBonusGems:2,weeklyBonusTreats:1
  },
  rewardShopTier2:{
    dice:{cost:45,name:'Enchanted Dice',maxRoll:10},
    seed:{cost:55,name:'Twin Lucky Seed',uses:2},
    sun:{cost:50,name:'Brilliant Sun Charm',lookAhead:5}
  },
  rosieRescue:{
    clearTwoChance:.50,
    nudgeChance:.70
  },
  missions:{
    coinBase:110,coinPerLevel:7,
    gemChance:.16,
    powerChance:.24
  },
  chapters:[
    {start:1,end:10,name:'Meadow Beginnings',icon:'🌱',tone:'#83b85b'},
    {start:11,end:20,name:'Sunflower Season',icon:'🌻',tone:'#d7aa37'},
    {start:21,end:30,name:'Rosie Creek',icon:'🐾',tone:'#6da8b5'},
    {start:31,end:40,name:'Golden Orchard',icon:'🍎',tone:'#c99138'},
    {start:41,end:50,name:'Harvest Ridge',icon:'⛰️',tone:'#8a765d'},
    {start:51,end:60,name:'Autumn Fields',icon:'🍂',tone:'#b96f3d'},
    {start:61,end:70,name:'Moonlit Harvest',icon:'🌙',tone:'#6c6aa5'},
    {start:71,end:80,name:'Winter Garden',icon:'❄️',tone:'#74a8c5'},
    {start:81,end:90,name:'Spring Return',icon:'🌷',tone:'#9bbd69'},
    {start:91,end:100,name:'Centennial Harvest',icon:'🏆',tone:'#c89a2f'}
  ],
  milestones:{
    interval:10,
    stockBonus:4,
    coinBase:450,
    coinPerLevel:12,
    gemsBase:2,
    campaignHorizon:1000,
    landmarks:{
      250:{icon:'🌾',title:'Quarter Harvest',coins:5000,gems:8,rescues:2,treats:1,stockBonus:6,desc:'One quarter of the authored campaign complete.'},
      500:{icon:'🏅',title:'Golden Seasons Summit',coins:9000,gems:14,rescues:2,gates:1,stockBonus:7,desc:'Halfway to Ultra Harvest.'},
      750:{icon:'🐾',title:"Rosie's Long Road",coins:13000,gems:20,rescues:3,windmills:1,stockBonus:8,desc:'Three quarters of the authored campaign complete.'},
      1000:{icon:'🏆',title:'Ultra Harvest Finale',coins:20000,gems:30,rescues:3,gates:2,treats:2,stockBonus:10,desc:'The authored campaign is complete. Endless Harvest is now open.'}
    }
  },
  weather:{
    periodMs:21600000,
    types:[
      {key:'sunny',icon:'☀️',name:'Sunny',desc:'+15% crop coins • Golden Cards appear more often'},
      {key:'rain',icon:'🌧️',name:'Rain',desc:'Crops gain an extra growth step • Watering Cans appear more often'},
      {key:'windy',icon:'🌬️',name:'Windy',desc:'Better Windmill harvest finds • +1 Solitaire stock'},
      {key:'rainbow',icon:'🌈',name:'Rainbow',desc:'Better farm/adventure gem odds • Rainbow Cards appear more often'},
      {key:'fog',icon:'🌫️',name:'Fog',desc:'Trickier boards • +15% level coin reward'},
      {key:'storm',icon:'⛈️',name:'Storm',desc:'Tougher special-card mix • +2 compensating stock • richer Rosie finds'},
      {key:'perfect',icon:'🌤️',name:'Perfect Day',desc:'+20% crop coins • +10% level coins • Rosie gets luckier'}
    ],
    events:[
      {key:'market',icon:'🪙',name:'Market Day',desc:'Farm Orders pay +30%.'},
      {key:'bumper',icon:'🌻',name:'Bumper Crop',desc:'Today’s featured crop pays double.'},
      {key:'rosie',icon:'🐕',name:'Rosie Day',desc:'Adventures are 25% shorter and rare finds are more likely.'},
      {key:'gems',icon:'💎',name:'Gem Rush',desc:'Better gem odds from crops, Golden Cards, and Rosie.'},
      {key:'festival',icon:'🎪',name:'Harvest Festival',desc:'Clear 3 levels for 500 coins + 2 gems.'}
    ]
  },
  seasons:{
    cycleLevels:10,pointGoal:18,
    points:{level:2,crop:1,order:3,adventure:4,timed:1},
    definitions:[
      {key:'spring',icon:'🌷',name:'Spring Bloom',keepsake:'Pressed Spring Blossom',desc:'Crops gain +1 extra growth step after normal level clears • +8% crop coins.',effects:{extraGrowth:1,cropCoin:1.08},reward:{coins:450,gems:2,treats:1},variants:[
        {key:'wildflowers',icon:'🌼',name:'Wildflower Week',desc:'Crop coins +5% more • Lucky Hands hide an extra Flower Card.',effects:{cropCoin:1.05},orderCrops:['clover','sunflower'],lucky:{kind:'flower',label:'Wildflower Favor',desc:'an extra Flower Card'},challengeBonusCoins:100},
        {key:'gentle-rain',icon:'🌦️',name:'Gentle Rain',desc:'Farm Orders +5% • Rosie rare-find chance +5%.',effects:{orderCoin:1.05,rosieRareBonus:.05},orderCrops:['clover','berry'],lucky:{kind:'stock',label:'Rainy-Day Reserve',desc:'+1 stock card'},challengeBonusCoins:125},
        {key:'busy-bees',icon:'🐝',name:'Busy Bees',desc:'Farm Orders +8% • crop coins +3%.',effects:{orderCoin:1.08,cropCoin:1.03},orderCrops:['sunflower','clover'],lucky:{kind:'flower',label:'Bee Garden',desc:'an extra Flower Card'},challengeBonusCoins:150}
      ]},
      {key:'summer',icon:'☀️',name:'Summer Sun',keepsake:'Golden Sun Ribbon',desc:'+12% crop coins • +10% normal Solitaire level coins.',effects:{cropCoin:1.12,levelCoin:1.10},reward:{coins:650,gems:3,windmills:1},variants:[
        {key:'golden-hour',icon:'🌅',name:'Golden Hour',desc:'Normal level coins +5% more • Lucky Hands hide an extra Golden Card.',effects:{levelCoin:1.05},orderCrops:['sunflower','apple'],lucky:{kind:'gold',label:'Golden Hour Favor',desc:'an extra Golden Card'},challengeBonusCoins:175},
        {key:'berry-picnic',icon:'🍓',name:'Berry Picnic',desc:'Crop coins +6% more.',effects:{cropCoin:1.06},orderCrops:['berry','sunflower'],lucky:{kind:'stock',label:'Picnic Basket',desc:'+1 stock card'},challengeBonusCoins:150},
        {key:'long-evening',icon:'🌇',name:'Long Evening',desc:'Rosie Adventures are 8% shorter • rare-find chance +3%.',effects:{adventureTime:.92,rosieRareBonus:.03},orderCrops:['berry','apple'],lucky:{kind:'gold',label:'Sunset Shine',desc:'an extra Golden Card'},challengeBonusCoins:175}
      ]},
      {key:'autumn',icon:'🍂',name:'Autumn Market',keepsake:'Harvest Leaf Medallion',desc:'Farm Orders pay +20% • Harvest Chain coin rewards +35%.',effects:{orderCoin:1.20,harvestChainCoin:1.35},reward:{coins:800,gems:3,gates:1},variants:[
        {key:'market-rush',icon:'🧺',name:'Market Rush',desc:'Farm Orders +10% more.',effects:{orderCoin:1.10},orderCrops:['apple','pumpkin'],lucky:{kind:'stock',label:'Market Basket',desc:'+1 stock card'},challengeBonusCoins:225},
        {key:'orchard-fair',icon:'🍎',name:'Orchard Fair',desc:'Crop coins +8%.',effects:{cropCoin:1.08},orderCrops:['apple','berry'],lucky:{kind:'gold',label:'Orchard Prize',desc:'an extra Golden Card'},challengeBonusCoins:200},
        {key:'windfall',icon:'🍃',name:'Windfall',desc:'Harvest Chain coins +10% more • +8% Windmill find chance from crops.',effects:{harvestChainCoin:1.10,windBonus:.08},orderCrops:['pumpkin','apple'],lucky:{kind:'stock',label:'Windfall Reserve',desc:'+1 stock card'},challengeBonusCoins:225}
      ]},
      {key:'winter',icon:'❄️',name:'Winter Trails',keepsake:'Crystal Snow Bell',desc:'+2 normal Solitaire stock • Rosie Adventures are 10% shorter with +12% rare-find chance.',effects:{extraStock:2,adventureTime:.90,rosieRareBonus:.12},reward:{coins:950,gems:4,rescues:1},variants:[
        {key:'clear-frost',icon:'🧊',name:'Clear Frost',desc:'Normal level coins +5% more.',effects:{levelCoin:1.05},orderCrops:['clover','apple'],lucky:{kind:'stock',label:'Frost Reserve',desc:'+1 stock card'},challengeBonusCoins:200},
        {key:'cozy-trails',icon:'🧣',name:'Cozy Trails',desc:'Rosie Adventures are another 12% shorter • rare-find chance +4%.',effects:{adventureTime:.88,rosieRareBonus:.04},orderCrops:['pumpkin','apple'],lucky:{kind:'gold',label:'Cozy Find',desc:'an extra Golden Card'},challengeBonusCoins:225},
        {key:'snowdrift',icon:'🌨️',name:'Snowdrift',desc:'+1 additional normal Solitaire stock card.',effects:{extraStock:1},orderCrops:['pumpkin','clover'],lucky:{kind:'stock',label:'Snowdrift Reserve',desc:'+1 stock card'},challengeBonusCoins:200}
      ]}
    ]
  },
  farmhouse:{
    toys:{
      bear:{icon:'🧸',name:'Squeaky Bear'},
      ball:{icon:'🎾',name:'Tennis Ball'},
      bone:{icon:'🦴',name:'Giant Bone'},
      rope:{icon:'🪢',name:'Rope Toy'},
      duck:{icon:'🦆',name:'Squeaky Duck'},
      shoe:{icon:'👟',name:'Mysteriously Acquired Shoe'},
      frisbee:{icon:'🥏',name:'Red Frisbee'},
      sock:{icon:'🧦',name:'Absolutely Not Denise’s Sock'},
      stick:{icon:'🪵',name:'Perfect Adventure Stick'},
      carrot:{icon:'🥕',name:'Squeaky Carrot'},
      blossomCrown:{icon:'🌸',name:"Rosie's Blossom Crown",season:'spring'},
      sunshineBall:{icon:'🌞',name:'Sunshine Squeaker',season:'summer'},
      leafScarf:{icon:'🍁',name:'Crunchy Leaf Scarf',season:'autumn'},
      snowPup:{icon:'☃️',name:'Tiny Snow-Pup Plush',season:'winter'}
    },
    trophies:{
      meadowGate:{icon:'🏆',name:'Meadow Gate Cup',desc:'Clear Level 10.',rewardGems:1},
      rosieCreek:{icon:'🎗️',name:'Rosie Creek Ribbon',desc:'Clear Level 30.',rewardGems:2},
      centennial:{icon:'👑',name:'Centennial Crown',desc:'Clear Level 100.',rewardGems:5},
      unbroken:{icon:'🔥',name:'Unbroken',desc:'Reach a 10-card streak.',rewardGems:2},
      perfectHarvest:{icon:'⭐',name:'Perfect Harvest',desc:'Earn 3 stars on 10 levels.',rewardGems:2},
      supplier:{icon:'📋',name:'Reliable Supplier',desc:'Complete 25 Farm Orders.',rewardGems:2},
      explorer:{icon:'🐕',name:'Seasoned Explorer',desc:'Rosie completes 25 adventures.',rewardGems:2},
      shiny:{icon:'💎',name:'Shiny Things!',desc:'Earn 50 lifetime gems.',rewardGems:2},
      rosiePlease:{icon:'🐾',name:'Rosie, Please.',desc:'Use Rosie Rescue at least 3 times.',rewardGems:1},
      empire:{icon:'🪙',name:'Agricultural Empire',desc:'Earn 100,000 lifetime coins.',rewardGems:3},
      close:{icon:'🃏',name:'That Was Close',desc:'Win with no stock cards remaining.',rewardGems:1},
      drawPacks:{icon:'😅',name:'Well, That Worked.',desc:'Win after buying all three extra-draw packs.',rewardGems:1},
      shoe:{icon:'👟',name:'She Brought WHAT Home?',desc:'Rosie finds the mysterious shoe.',rewardGems:2},
      goodest:{icon:'🐾',name:'The Goodest Girl',desc:'???',rewardGems:5,secret:true},
      reserveMind:{icon:'🧠',name:'Five Moves Ahead',desc:'Win after using the Reserve Slot.',rewardGems:2},
      challengeWin:{icon:'🔥',name:'Bring It On',desc:'Win a Challenge Hand.',rewardGems:2},
      highRoller:{icon:'💎',name:'High Roller',desc:'Win 10 Challenge Hands.',rewardGems:4},
      luckyGirl:{icon:'🌟',name:'Lucky Girl',desc:'Complete a Lucky Hand without purchased draws or powers.',rewardGems:2},
      quarterHarvest:{icon:'🌾',name:'Quarter Harvest',desc:'Clear Level 250.',rewardGems:4},
      halfwayHome:{icon:'🏅',name:'Halfway Home',desc:'Clear Level 500.',rewardGems:6},
      longRoad:{icon:'🐾',name:"Rosie's Long Road",desc:'Clear Level 750.',rewardGems:8},
      ultraHarvest:{icon:'🏆',name:'Ultra Harvester',desc:'Clear the Level 1000 Ultra Harvest Finale.',rewardGems:12},
      rosieVeteran:{icon:'🗺️',name:'Rosie the Explorer',desc:'Rosie completes 100 Adventures.',rewardGems:5},
      fourSeasons:{icon:'🧺',name:'Four Seasons',desc:'Collect all four seasonal keepsakes.',rewardGems:5},
      seasonalSniffer:{icon:'🐾',name:'Seasonal Sniffer',desc:'Rosie discovers all four seasonal Adventure mementos.',rewardGems:6}
    },
    tiers:{
      farmhand:{name:'Farmhand',icon:'🌾',values:[25,100,500],stat:'harvests'},
      cardSharp:{name:'Card Sharp',icon:'🃏',values:[25,100,250],stat:'levelsCompleted'},
      explorer:{name:"Rosie's Explorer",icon:'🐕',values:[10,50,150],stat:'rosieAdventuresCompleted'}
    }
  },
  rosieAdventures:{
    durations:[
      {key:'sniff',name:'Quick Sniff',icon:'🐾',ms:1800000,coin:[90,170],gemChance:.04,powerChance:.10,rareChance:.035,toyChance:.025,mementoChance:.012},
      {key:'patrol',name:'Farm Patrol',icon:'🌳',ms:3600000,coin:[190,330],gemChance:.09,powerChance:.18,rareChance:.07,toyChance:.055,mementoChance:.028},
      {key:'big',name:'Big Adventure',icon:'🗺️',ms:7200000,coin:[390,650],gemChance:.18,powerChance:.28,rareChance:.13,toyChance:.10,mementoChance:.055}
    ],
    seasonal:{
      spring:{icon:'🌷',name:'Spring Trails',desc:'Rosie is especially curious in spring.',eventBonus:.06,rareBonus:.03,toyBonus:.025,coinMult:1.02,
        preferredEvents:['butterflies','muddyPaws'],memento:{icon:'🌸',name:'Pressed Paw Blossom',desc:'A little flower Rosie somehow brought home intact.'}},
      summer:{icon:'☀️',name:'Summer Rambles',desc:'Long sunny outings tend to bring home more coins.',eventBonus:.03,rareBonus:.01,toyBonus:.02,coinMult:1.10,
        preferredEvents:['picnic','sprinkler'],memento:{icon:'🌞',name:'Sun-Warmed Tag',desc:'A warm little tag from one of Rosie’s summer routes.'}},
      autumn:{icon:'🍂',name:'Autumn Sniffari',desc:'Harvest season is excellent for useful farm finds.',eventBonus:.05,rareBonus:.02,toyBonus:.02,powerBonus:.07,coinMult:1.04,
        preferredEvents:['leafPile','pumpkinCart'],memento:{icon:'🍁',name:'Perfect Red Leaf',desc:'Rosie selected the best leaf in the entire farm.'}},
      winter:{icon:'❄️',name:'Winter Tracks',desc:'Cold trails reveal unusual tracks and hidden finds.',eventBonus:.05,rareBonus:.06,toyBonus:.03,powerBonus:.02,
        preferredEvents:['snowTracks','warmPorch'],memento:{icon:'🔔',name:'Tiny Snow Bell',desc:'A tiny bell Rosie found along a winter trail.'}}
    },
    rareFinds:{
      clover:{icon:'🍀',name:'Lucky Clover',desc:'Next completed Farm Order pays double coins.'},
      feather:{icon:'🪶',name:'Curious Feather',desc:'Next normal Solitaire level starts with +3 stock cards.'},
      star:{icon:'🌟',name:'Shooting Star',desc:'Next completed normal Solitaire level guarantees +1 gem.'},
      pawprint:{icon:'🐾',name:'Lucky Pawprint',desc:'Next normal Solitaire hand hides an extra Wild card in the tableau.'},
      snacks:{icon:'👜',name:'Trail Snack Bag',desc:'Open it for 2–4 Rosie Treats.'},
      cache:{icon:'🎁',name:'Rosie Cache',desc:'Open for a bundle of random farm rewards.'}
    },
    events:{
      neighbor:{icon:'🧑‍🌾',name:'Friendly Neighbor',desc:'A friendly farmer spoiled Rosie a little.',coinMult:1.25},
      squirrel:{icon:'🐿️',name:'Squirrel Chase',desc:'Rosie followed a very important lead.',powerBonus:.20},
      creek:{icon:'✨',name:'Creekside Sparkle',desc:'Something shiny caught Rosie’s eye.',rareBonus:.18},
      shortcut:{icon:'🛤️',name:'Secret Shortcut',desc:'Rosie discovered a faster trail home.',timeMult:.85},
      butterflies:{icon:'🦋',name:'Butterfly Parade',desc:'Spring butterflies led Rosie toward something fun.',seasons:['spring'],toyBonus:.12},
      muddyPaws:{icon:'🐾',name:'Muddy Pawprints',desc:'A muddy spring detour turned up an unusual find.',seasons:['spring'],rareBonus:.10},
      picnic:{icon:'🧺',name:'Picnic Patrol',desc:'Rosie performed a thorough summer picnic inspection.',seasons:['summer'],coinMult:1.22,bonusTreats:1},
      sprinkler:{icon:'💦',name:'Sprinkler Dash',desc:'A summer sprinkler sprint energized the whole trip.',seasons:['summer'],powerBonus:.14},
      leafPile:{icon:'🍁',name:'Leaf-Pile Investigation',desc:'Rosie disappeared into the leaves and came out with possibilities.',seasons:['autumn'],toyBonus:.14,rareBonus:.04},
      pumpkinCart:{icon:'🎃',name:'Pumpkin Cart Escort',desc:'Rosie supervised a harvest cart and earned a useful find.',seasons:['autumn'],powerBonus:.16},
      snowTracks:{icon:'🐾',name:'Tracks in the Snow',desc:'Rosie followed mysterious winter tracks to a hidden spot.',seasons:['winter'],rareBonus:.16},
      warmPorch:{icon:'🧣',name:'Warm Porch Stop',desc:'A cozy winter stop sent Rosie home with a treat.',seasons:['winter'],bonusTreats:1,timeMult:.92}
    }
  },
  farmOrders:{
    slots:['easy','standard','premium'],
    inDemandMultiplier:1.25,
    tiers:{
      easy:{label:'Easy',icon:'🧺',types:[1,1],qty:[1,2],rewardMult:1.65,gemChance:.04,powerChance:.08},
      standard:{label:'Standard',icon:'📦',types:[1,2],qty:[2,3],rewardMult:1.90,gemChance:.10,powerChance:.16},
      premium:{label:'Premium',icon:'⭐',types:[2,3],qty:[2,4],rewardMult:2.25,gemChance:.22,powerChance:.30}
    }
  },
  almanac:{
    specials:{
      vine:{icon:'🌿',name:'Vines',level:8,desc:'Clear a nearby card to free the vine-wrapped card.'},
      flower:{icon:'🌼',name:'Flower Card',level:12,desc:'Clearing it adds a draw to the stock.'},
      crate:{icon:'📦',name:'Crate',level:16,desc:'Clear its nearby requirements before it opens.'},
      gold:{icon:'💰',name:'Golden Card',level:20,desc:'Pays bonus coins and can rarely contain a gem.'},
      mud:{icon:'🟤',name:'Mud Card',level:24,desc:'Cannot be transformed with Lucky Seed.'},
      chain:{icon:'⛓️',name:'Chained Card',level:30,desc:'Build the required streak before playing it.'},
      rainbow:{icon:'🌈',name:'Rainbow Card',level:36,desc:'A rare Wild card with an extra reward.'},
      key:{icon:'🔑',name:'Barn Key',level:42,desc:'Clear the Key to unlock its matching Barn Lock.'},
      barnlock:{icon:'🔒',name:'Barn Lock',level:42,desc:'Cannot be played until its matching Key has been cleared.'},
      watering:{icon:'💧',name:'Watering Can',level:46,desc:'Clearing it turns a random exposed ordinary card Wild.'},
      bee:{icon:'🐝',name:'Bee Card',level:50,desc:'When you draw, an exposed Bee may buzz to another open field position.'},
      harvestchain:{icon:'🌾',name:'Harvest Chain',level:54,desc:'Clear linked Harvest Chain cards consecutively for bonus coins.'},
      heavy:{icon:'🪨',name:'Heavy Card',level:58,desc:'The first valid play cracks it; the second removes it.'},
      sleeping:{icon:'🌙',name:'Sleeping Card',level:62,desc:'Wakes after several other cards have been cleared.'},
      sunflower:{icon:'🌻',name:'Sunflower Card',level:66,desc:'Clearing it immediately uncovers a nearby hidden card.'}
    }
  },
  achievements:{
    firstHarvest:{name:'First Harvest',gems:1},
    level10:{name:'Ten Levels Down',gems:2},
    bestFriend:{name:"Rosie's Best Friend",gems:2},
    perfectFarmer:{name:'Perfect Farmer',gems:2},
    bigHarvest:{name:'Big Harvest',gems:3}
  }
};
DSH.Progress={
  clampHappiness(state){
    const C=DSH.Config.happiness;
    state.rosieHappiness=Math.max(0,Math.min(C.max,Number(state.rosieHappiness)||0));
    return state.rosieHappiness;
  },
  addHappiness(state,amount){
    const before=this.clampHappiness(state);
    state.rosieHappiness=Math.min(DSH.Config.happiness.max,before+Math.max(0,amount||0));
    return state.rosieHappiness-before;
  },
  happinessFindBonus(state){
    const h=this.clampHappiness(state),tiers=DSH.Config.happiness.findTierBonuses;
    if(h>=100)return tiers[4];
    if(h>=75)return tiers[3];
    if(h>=50)return tiers[2];
    if(h>=25)return tiers[1];
    return tiers[0];
  },
  checkAchievements(state){
    state.achievements=state.achievements||{};
    state.stats=state.stats||{};
    const A=DSH.Config.achievements,newOnes=[];
    const checks={
      firstHarvest:(state.harvests||0)+(state.stats.timedHarvestClaims||0)>=1,
      level10:(state.stats.levelsCompleted||0)>=10,
      bestFriend:(state.rosieHappiness||0)>=100,
      perfectFarmer:(state.stats.threeStarClears||0)>=1,
      bigHarvest:(state.harvests||0)>=100
    };
    Object.entries(checks).forEach(([key,ok])=>{
      if(ok&&!state.achievements[key]){
        state.achievements[key]=true;
        const def=A[key];state.gems=(state.gems||0)+def.gems;
        state.stats.achievementsUnlocked=(state.stats.achievementsUnlocked||0)+1;
        newOnes.push({...def,key});
      }
    });
    return newOnes;
  }
};