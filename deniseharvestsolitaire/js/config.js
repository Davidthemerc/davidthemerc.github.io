window.DSH=window.DSH||{};
DSH.Config={
  build:'40.1',
  draws:{cards:5,maxPacks:3,prices:[175,275,400],levelSurchargeEvery:10,levelSurcharge:50},
  difficulty:{stockFloor:24,stockCeiling:44,weatherCeiling:48,tableauCeiling:30,simulationMaxLevel:500},
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
    gemsBase:2
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
  farmhouse:{
    toys:{
      bear:{icon:'🧸',name:'Squeaky Bear'},
      ball:{icon:'🎾',name:'Tennis Ball'},
      bone:{icon:'🦴',name:'Giant Bone'},
      rope:{icon:'🪢',name:'Rope Toy'},
      duck:{icon:'🦆',name:'Squeaky Duck'},
      shoe:{icon:'👟',name:'Mysteriously Acquired Shoe'}
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
      luckyGirl:{icon:'🌟',name:'Lucky Girl',desc:'Complete a Lucky Hand without purchased draws or powers.',rewardGems:2}
    },
    tiers:{
      farmhand:{name:'Farmhand',icon:'🌾',values:[25,100,500],stat:'harvests'},
      cardSharp:{name:'Card Sharp',icon:'🃏',values:[25,100,250],stat:'levelsCompleted'},
      explorer:{name:"Rosie's Explorer",icon:'🐕',values:[10,50,150],stat:'rosieAdventuresCompleted'}
    }
  },
  rosieAdventures:{
    durations:[
      {key:'sniff',name:'Quick Sniff',icon:'🐾',ms:1800000,coin:[90,170],gemChance:.04,powerChance:.10,rareChance:.035,toyChance:.025},
      {key:'patrol',name:'Farm Patrol',icon:'🌳',ms:3600000,coin:[190,330],gemChance:.09,powerChance:.18,rareChance:.07,toyChance:.055},
      {key:'big',name:'Big Adventure',icon:'🗺️',ms:7200000,coin:[390,650],gemChance:.18,powerChance:.28,rareChance:.13,toyChance:.10}
    ],
    rareFinds:{
      clover:{icon:'🍀',name:'Lucky Clover',desc:'Next completed Farm Order pays double coins.'},
      feather:{icon:'🪶',name:'Curious Feather',desc:'Next normal Solitaire level starts with +3 stock cards.'},
      star:{icon:'🌟',name:'Shooting Star',desc:'Next completed normal Solitaire level guarantees +1 gem.'},
      cache:{icon:'🎁',name:'Rosie Cache',desc:'Open for a bundle of random farm rewards.'}
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