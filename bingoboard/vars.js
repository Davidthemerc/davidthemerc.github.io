const bingoTiles = [
  {
    tileCoordinates: 'A2',
    tileName: 'Raid Big Boy Weapons',
    tileDescription:
      "Any of the three Raid Mega Rare BIS. (Twisted Bow, Scythe of Vitur or Tumeken's Shadow)",
    difficulties: {
      easy: '',
      medium: '',
      hard: '1 of the mega-rares',
      elite: 'Get all 3 mega-rares',
    },
  },
  {
    tileCoordinates: 'A3',
    tileName: 'Spirit shield',
    tileDescription: 'Complete any Spirit Shield from scratch.',
    difficulties: {
      easy: '',
      medium: '',
      hard: 'Complete 1 spirit shield Any sigil Spirit Shield Holy Elixer Spirit shield',
      elite: '',
    },
  },
  {
    tileCoordinates: 'A4',
    tileName: 'God wars dungeon Raider',
    tileDescription:
      'Obtain a Godwars Unique from each of the original Godwars Bosses.',
    difficulties: {
      easy: '',
      medium:
        '1 item of each GWD boss Bandos Item Zamorak Item Saradomin Item Armadyl Item',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'A5',
    tileName: 'Wave clearer',
    tileDescription: 'Obtain the wave based capes',
    difficulties: {
      easy: 'Fire Cape',
      medium: 'Infernal Cape',
      hard: "Dizana's quiver",
      elite: 'All 3 capes',
    },
  },
  // Add more tiles following the same pattern...
  // Continuing from the previous tiles...
  {
    tileCoordinates: 'A6',
    tileName: 'Boss pet',
    tileDescription:
      'Get a bossing pet. Following pets do NOT count: Chaos elemental, Skotizo, Phoenix, Tempoross, Zalcano',
    difficulties: {
      easy: '',
      medium: '1 bossing pet',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'A7',
    tileName: 'Lord of the Rings',
    tileDescription: 'Obtain ALL dagannoth king rings',
    difficulties: {
      easy: '',
      medium:
        'Obtain every ring from dks: Berserker Ring, Warrior Ring, Archers Ring, Seers Ring, Ring Of Life',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'A8',
    tileName: 'The Ruffle Tile (tm)',
    tileDescription: 'Get barrows (2.0) chest with multiple drops',
    difficulties: {
      easy: 'Single item in chest',
      medium: 'Double item in chest',
      hard: 'Triple item in chest',
      elite: '',
    },
  },
  {
    tileCoordinates: 'B1',
    tileName: 'Nightmare Unique',
    tileDescription:
      "Obtain a unique drop from the Nightmare/Phosani. (Phosani's egg and the Slepey tablet do not count).",
    difficulties: {
      easy: '',
      medium: 'Nightmare unique',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'B2',
    tileName: 'Corrupted Gauntlet Speedrun',
    tileDescription: 'Go speedy in CG',
    difficulties: {
      easy: 'CG in 10:00 minutes',
      medium: 'CG in 8:00 minutes',
      hard: 'CG in 6:30 minutes',
      elite: '',
    },
  },
  {
    tileCoordinates: 'B3',
    tileName: 'Sandwich lady',
    tileDescription:
      'Obtain the full sandwich lady outfit from beginner clues or get the stale baguette ._.',
    difficulties: {
      easy: '',
      medium:
        'Full sandwich lady outfit Sandwich lady hat Sandwich lady top Sandwich lady bottom',
      hard: 'Stale baguette',
      elite: '',
    },
  },
  // Continuing from the previous tiles...
  {
    tileCoordinates: 'B4',
    tileName: 'Boot collector',
    tileDescription: 'Obtain every unique pair of boots from medium clues',
    difficulties: {
      easy: '',
      medium: '',
      hard: 'Every pair of boots from med clues: Ranger Boots, Holy sandals, Wizard Boots, Spiked manacles',
      elite: '',
    },
  },
  {
    tileCoordinates: 'B5',
    tileName: 'Jar collector',
    tileDescription: 'Obtain boss jars',
    difficulties: {
      easy: '',
      medium: '3 unique bossing jars',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'B6',
    tileName: 'I can do this all day',
    tileDescription:
      'Survive as long as you can killing vorkath and get the kill.',
    difficulties: {
      easy: 'Get a kill time of at least 20 minutes',
      medium: 'Get a kill time of at least 40 minutes',
      hard: 'Get a kill time of at least 1 hour',
      elite: '',
    },
  },
  {
    tileCoordinates: 'B7',
    tileName: 'We do a bit of skilling',
    tileDescription:
      'Get a cumulative amount of xp in the following skills: Slayer, Agility, Prayer, Farming, Hunter',
    difficulties: {
      easy: 'Get a total of 10 Million XP',
      medium: 'Get a total of 20 Million XP',
      hard: 'Get a total of 30 Million XP',
      elite: '',
    },
  },
  {
    tileCoordinates: 'B8',
    tileName: 'Virtus pieces',
    tileDescription:
      "Get virtus pieces (don't need to be unique pieces for first 3 tiers)",
    difficulties: {
      easy: '1 virtus drop',
      medium: '2 virtus drops',
      hard: '3 virtus drops',
      elite: 'Full virtus (3 unique pieces)',
    },
  },
  {
    tileCoordinates: 'B9',
    tileName: 'Obby warrior',
    tileDescription: 'Obtain full obsidian and a tzhaar weapon',
    difficulties: {
      easy: '',
      medium:
        'Full obisidan + a weapon: Obby helmet, Obby platebody, Obby platelegs, Obby Cape, Obby Shield, Any tzhaar weapon',
      hard: '',
      elite: '',
    },
  },
  // Continuing with the array of bingo tiles...
  {
    tileCoordinates: 'C1',
    tileName: 'Ironman milestone',
    tileDescription:
      'Obtain full crystal armour (6 armour seeds) and an enhanced weapon seed',
    difficulties: {
      easy: '',
      medium: '',
      hard: 'Ironman wet dream: 6x Crystal armour seeds, 1x Enhanced crystal weapon seed',
      elite: '',
    },
  },
  {
    tileCoordinates: 'C2',
    tileName: 'Champion scrolls',
    tileDescription: 'Obtain champion scrolls',
    difficulties: {
      easy: '1 Champion scroll',
      medium: '2 unique Champion scrolls',
      hard: '3 unique Champion scrolls',
      elite:
        'Every champion scroll (not the human one): Earth warrior champion scroll, Ghoul champion scroll, Giant champion scroll, Goblin champion scroll, Hobgoblin champion scroll, Imp champion scroll, Jogre champion scroll, Lesser demon champion scroll, Skeleton champion scroll, Zombie champion scroll',
    },
  },
  {
    tileCoordinates: 'C3',
    tileName: 'Dragon warrior',
    tileDescription: 'Obtain a full dragon armour set',
    difficulties: {
      easy: 'Medium dragon warrior items needed: Dragon med helm, Dragon chainbody, Dragon platelegs, Dragon boots, Shield Left Half, Dragon Weapon',
      medium: '',
      hard: 'Full dragon warrior items needed: Dragon full helm, Dragon metal lump, Dragon platelegs, Dragon boots, Dragon metal shard, Dragon Weapon',
      elite: '',
    },
  },
  {
    tileCoordinates: 'C5',
    tileName: 'Brimstone ring',
    tileDescription: 'Obtain all 3 brimstone ring pieces',
    difficulties: {
      easy: '',
      medium:
        "Full brimstone ring items needed: Hydra's eye, Hydra's fang, Hydra's heart",
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'C7',
    tileName: 'Voidwaker',
    tileDescription: 'Obtain all 3 voidwaker pieces',
    difficulties: {
      easy: '',
      medium: '',
      hard: 'Full voidwaker items needed: Voidwaker blade, Voidwaker Gem, Voidwaker Hilt',
      elite: '',
    },
  },
  {
    tileCoordinates: 'C8',
    tileName: 'DT2 ring',
    tileDescription:
      'Complete any DT2 ring from scratch (DKs ring + chromium ingots + vestige)',
    difficulties: {
      easy: '',
      medium: '',
      hard: 'Full dt2 ring items needed: Berserker Ring | Warrior Ring | Seers Ring | Archers Ring, 3x Chromium Ingot, Ultor Vestige | Bellator Vestige | Magus Vestige | Venator Vestige',
      elite: '',
    },
  },
  // Continuing to add more tiles...
  // Continuing with the array of bingo tiles...
  {
    tileCoordinates: 'C9',
    tileName: 'Ballista Champion',
    tileDescription: 'Complete a ballista from scratch',
    difficulties: {
      easy: '',
      medium:
        '1 Ballista from scratch items needed: Monkey tail, Ballista limbs, Ballista spring, Heavy frame or Light frame',
      hard: "Light and Heavy Ballista from scratch (don't need dupe parts) items needed: 1x Monkey tail, 1x Ballista limbs, 1x Ballista spring, Heavy frame AND Light frame",
      elite: '',
    },
  },
  {
    tileCoordinates: 'D1',
    tileName: 'Challenge mode kits',
    tileDescription: 'Get kits/pet dusts from either Challenge mode COX or HMT',
    difficulties: {
      easy: '',
      medium:
        'Obtain 3 of the following kits (dupes are allowed): Twisted ancestral colour kit, Metamorphic dust, Sanguine ornament kit, Holy ornament kit, Sanguine dust',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'D2',
    tileName: 'Swift blade',
    tileDescription:
      'Obtain swift blade from LMS, Post screenshot of LMS points beforehand',
    difficulties: {
      easy: '',
      medium: '',
      hard: 'Get the swift blade from LMS.',
      elite: '',
    },
  },
  {
    tileCoordinates: 'D3',
    tileName: 'Pyromancer',
    tileDescription:
      'Obtain full pyromancer including warm gloves and the bruma torch',
    difficulties: {
      easy: '',
      medium:
        'Obtain all pieces of the pyromancer/warm outfit + bruma torch items needed: Pyromancer hood, Pyromancer garb, Pyromancer robe, Pyromancer boots, Warm gloves, Bruma torch',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'D4',
    tileName: 'Precious Jewels',
    tileDescription: 'Obtain gems in either cut or uncut form (monster drops)',
    difficulties: {
      easy: '',
      medium:
        'Obtain all of the non crushable gems items needed: Sapphire, Emerald, Ruby, Diamond, Dragonstone, Onyx, Zenyte',
      hard: 'Obtain the eternal slayer gem',
      elite: '',
    },
  },
  {
    tileCoordinates: 'D5',
    tileName: 'Skilling Pet',
    tileDescription:
      "Get a skilling pet Even though the following aren't technically skilling pets we count them for this tile: Wintertodt Pet, Tempoross Pet, Zalcano Pet, Herbiboar Pet",
    difficulties: {
      easy: '',
      medium: 'Obtain a skilling pet',
      hard: '',
      elite: '',
    },
  },
  // Continuing and aiming to complete the array of bingo tiles...
  {
    tileCoordinates: 'D6',
    tileName: 'Easy mode pet',
    tileDescription:
      'Get one of the following pets: Skotos, Chaos Elemental, Chompy Chick',
    difficulties: {
      easy: 'Obtain one of the easy pets',
      medium: '',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'D7',
    tileName: 'Revenant weapon',
    tileDescription: 'Get one of the revenant weapons',
    difficulties: {
      easy: '',
      medium: '',
      hard: 'Get any one of the revenant weapons',
      elite: '',
    },
  },
  {
    tileCoordinates: 'D8',
    tileName: 'Orb.',
    tileDescription: "Get 10 awakener's orbs",
    difficulties: {
      easy: '',
      medium: 'Get 10 orbs',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'D9',
    tileName: 'Ring of endurance',
    tileDescription: 'Obtain a ring of endurance',
    difficulties: {
      easy: '',
      medium: '',
      hard: 'Get the ring of endurance',
      elite: '',
    },
  },
  {
    tileCoordinates: 'E1',
    tileName: 'Head?',
    tileDescription:
      "Obtain all slayer head drops: Abyssal head, Basilisk head, Cockatrice head, Kq head, Kurask head, Vorkath's head, Alchemical hydra heads, Kbd heads, Crawling hand",
    difficulties: {
      easy: 'Get 1 slayer head',
      medium: 'Get 3 unique slayer heads',
      hard: 'Get 5 unique slayer heads',
      elite: 'Get 9 unique slayer heads',
    },
  },
  // Continuing to complete the array of bingo tiles...
  {
    tileCoordinates: 'E2',
    tileName: 'Elder Chaos',
    tileDescription: 'Obtain a full set of elder chaos robes',
    difficulties: {
      easy: '',
      medium: '',
      hard: 'Obtain the full set: Elder chaos hood, Elder chaos top, Elder chaos robe',
      elite: '',
    },
  },
  {
    tileCoordinates: 'E3',
    tileName: 'Wilderness rings',
    tileDescription: 'Obtain a full set of wilderness rings',
    difficulties: {
      easy: '',
      medium: '',
      hard: 'Obtain the full set: Ring of the gods, Treasonous ring, Tyrannical ring',
      elite: '',
    },
  },
  {
    tileCoordinates: 'E5',
    tileName: 'Nex unique',
    tileDescription: 'Get any Nex unique',
    difficulties: {
      easy: '',
      medium: 'Obtain a nex unique',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'E7',
    tileName: 'TOA gems',
    tileDescription:
      'Obtain each of the three unique gems from Tombs of Amascut',
    difficulties: {
      easy: '',
      medium:
        'Get all 3 gems from TOA: Eye of the corruptor, Breach of the scarab, Jewel of the sun',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'E8',
    tileName: 'Lucky',
    tileDescription:
      'Obtain a piece of gilded armor or a 3rd age drop (no rings)',
    difficulties: {
      easy: '',
      medium: '',
      hard: '3rd age or gilded piece',
      elite: '',
    },
  },
  {
    tileCoordinates: 'E9',
    tileName: 'Venator Shards',
    tileDescription: 'Obtain venator shards',
    difficulties: {
      easy: '',
      medium: 'Get 5 venator shards from Muspah',
      hard: '',
      elite: '',
    },
  },
  // Final continuation to complete the array of bingo tiles...
  {
    tileCoordinates: 'F1',
    tileName: 'Goblin mask',
    tileDescription: 'Obtain a goblin mask from easy clues',
    difficulties: {
      easy: '',
      medium: 'Get the goblin mask',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'F2',
    tileName: 'Crystal tool',
    tileDescription: 'Obtain a crystal tool from scratch',
    difficulties: {
      easy: '',
      medium:
        'Get a completed crystal tool: 1 crystal tool seed, 1 of the following: Dragon axe, Dragon pickaxe, Dragon harpoon',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'F3',
    tileName: 'Tomes',
    tileDescription: 'Obtain the tomes from Wintertodt and Tempoross',
    difficulties: {
      easy: 'Get either the tome of water or fire',
      medium: 'Get both',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'F4',
    tileName: 'F2P Jad',
    tileDescription: 'Obtain a jad kill in F2P gear.',
    difficulties: {
      easy: '',
      medium: '',
      hard: 'Get the F2P jad kill',
      elite: '',
    },
  },
  {
    tileCoordinates: 'F5',
    tileName: 'Forestry transmogs',
    tileDescription:
      'Obtain both the fox whistle and Golden Pheasant egg from Forestry',
    difficulties: {
      easy: 'Get both: Golden pheasant egg, Fox whistle',
      medium: '',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'F6',
    tileName: 'Blood fury',
    tileDescription:
      'Create a blood fury from scratch; obtain an onyx and blood shard.',
    difficulties: {
      easy: 'Get both items: Blood shard, Onyx',
      medium: '',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'F7',
    tileName: 'Black Mask',
    tileDescription:
      'Obtain a black mask drop (up to 3 times for 1 point each)',
    difficulties: {
      easy: 'Get black mask (up to 3 times / 1pt each)',
      medium: '',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'F8',
    tileName: "Sarachnis' Cudgel",
    tileDescription:
      "Obtain a Sarachnis' Cudgel (up to 3 times for 1 point each)",
    difficulties: {
      easy: "Get Sarachnis' Cudgel (up to 3 times / 1pt each)",
      medium: '',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'F9',
    tileName: 'Slappy fish',
    tileDescription: 'Catch a golden tench',
    difficulties: {
      easy: '',
      medium: 'Get the fish',
      hard: '',
      elite: '',
    },
  },
  // Completing the array with the final set of bingo tiles...
  {
    tileCoordinates: 'G2',
    tileName: 'Wildy shields',
    tileDescription: 'Complete BOTH wildy shields',
    difficulties: {
      easy: '',
      medium: '',
      hard: 'Get both shield completely: Malediction shard 1, Malediction shard 2, Malediction shard 3, Odium shard 1, Odium shard 2, Odium shard 3',
      elite: '',
    },
  },
  {
    tileCoordinates: 'G3',
    tileName: 'Black Tourmaline Core',
    tileDescription:
      'Obtain the Black Tourmaline Core from Grotesque Guardians',
    difficulties: {
      easy: '',
      medium: 'Get the Black Tourmaline Core',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'G4',
    tileName: 'Bryo Essence',
    tileDescription: 'Obtain the essence from Bryophyta',
    difficulties: {
      easy: '',
      medium: 'Get the Bryophyta essence',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'G5',
    tileName: "Obor's club",
    tileDescription: 'Obtain the hill giant club from Obor',
    difficulties: {
      easy: '',
      medium: 'Get the Obor club',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'G6',
    tileName: 'Tithe farm',
    tileDescription: 'Earn a cumulative 625 tithe farm points.',
    difficulties: {
      easy: '',
      medium: 'Get 625 points in team',
      hard: '',
      elite: '',
    },
  },
  {
    tileCoordinates: 'G7',
    tileName: 'Abyssal Bludgeon',
    tileDescription: 'Obtain Abyssal bludgeon pieces',
    difficulties: {
      easy: 'Get 1 bludgeon piece',
      medium: 'Get 2 bludgeon pieces',
      hard: 'Get 3 bludgeon pieces',
      elite: '',
    },
  },
  {
    tileCoordinates: 'G8',
    tileName: 'Eternal Glory',
    tileDescription: 'Obtain an Amulet of eternal Glory',
    difficulties: {
      easy: '',
      medium: '',
      hard: 'Get the amulet of eternal glory',
      elite: '',
    },
  },
  // This represents the completion of the bingo tiles array based on the provided data.
];

// This completes the JavaScript array for the bingo tiles, each tile detailed with its coordinates, name, description, and difficulty levels of challenges.

// This code segment is aimed at completing the representation of the bingo tiles in the JavaScript array. Continue adding any remaining tiles by following the format demonstrated in these examples to ensure the dataset is comprehensive and accurately represented.

let duraText = [
  `How rude! I'll remember this when I assign your next task.`,
  `You're a quitter? You modern adventurers sicken me.`,
  `How crass! I should have never taken this "Bingo" side gig. I'll stick to slayer...`,
  `You clearly visit Turael more than me! Noob.`,
  `You will never max with that attitude, adventurer!`,
  `Coward! Maybe I can find something a little easier for you...`,
];
