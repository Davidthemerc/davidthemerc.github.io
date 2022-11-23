const audio = [
  { id: 0, dir: 'assets/audio/bullet_hit.mp3', name: 'hit' },
  { id: 1, dir: 'assets/audio/revolver_shot.mp3', name: 'revshot' },
  { id: 2, dir: 'assets/audio/revolver_reload.mp3', name: 'revreload' },
  { id: 3, dir: 'assets/audio/revolver_empty.mp3', name: 'revempty' },
  { id: 4, dir: 'assets/audio/turkey_taunt.mp3', name: 'turktaunt' },
  { id: 5, dir: 'assets/audio/punch_hit.mp3', name: 'punch hit' },
  { id: 6, dir: 'assets/audio/punch_reload.mp3', name: 'reload a...punch?' },
  { id: 7, dir: 'assets/audio/man_welcome.mp3', name: 'welcome' },
  { id: 8, dir: 'assets/audio/man_hunterintro.mp3', name: 'hunter intro' },
  { id: 9, dir: 'assets/audio/man_great.mp3', name: 'great shot' },
  { id: 10, dir: 'assets/audio/man_wonderful.mp3', name: 'wonderful' },
  { id: 11, dir: 'assets/audio/man_marvelous.mp3', name: 'marvelous' },
  { id: 12, dir: 'assets/audio/man_excellent.mp3', name: 'excellent' },
  { id: 13, dir: 'assets/audio/man_goodjob.mp3', name: 'good job' },
  { id: 14, dir: 'assets/audio/man_wounded1.mp3', name: 'wounded1' },
  { id: 15, dir: 'assets/audio/man_wounded2.mp3', name: 'wounded2' },
  { id: 16, dir: 'assets/audio/man_wounded3.mp3', name: 'wounded3' },
  { id: 17, dir: 'assets/audio/man_wounded4.mp3', name: 'wounded4' },
  { id: 18, dir: 'assets/audio/man_unfortunately.mp3', name: 'unfortunately' },
  { id: 19, dir: 'assets/audio/shotgun_empty.mp3', name: 'NA' },
  { id: 20, dir: 'assets/audio/shotgun_shot.mp3', name: 'shotgunshot' },
  { id: 21, dir: 'assets/audio/shotgun_reload.mp3', name: 'shotgunreload' },
  { id: 22, dir: 'assets/audio/man_sniped1.mp3', name: 'sniped1' },
  { id: 23, dir: 'assets/audio/man_sniped2.mp3', name: 'sniped2' },
  { id: 24, dir: 'assets/audio/man_sniped3.mp3', name: 'sniped3' },
  { id: 25, dir: 'assets/audio/man_trophy1.mp3', name: 'trophy1' },
  { id: 26, dir: 'assets/audio/man_trophy2.mp3', name: 'trophy2' },
  { id: 27, dir: 'assets/audio/man_trophy3.mp3', name: 'trophy3' },
  {
    id: 28,
    dir: 'assets/audio/shotgun_reload6.mp3',
    name: 'shotgun reload 6 shell',
  },
  {
    id: 29,
    dir: 'assets/audio/shotgun_reload5.mp3',
    name: 'shotgun reload 5 shells',
  },
  {
    id: 30,
    dir: 'assets/audio/shotgun_reload4.mp3',
    name: 'shotgun reload 4 shells',
  },
  {
    id: 31,
    dir: 'assets/audio/shotgun_reload3.mp3',
    name: 'shotgun reload 3 shells',
  },
  {
    id: 32,
    dir: 'assets/audio/shotgun_reload2.mp3',
    name: 'shotgun reload 2 shells',
  },
  {
    id: 33,
    dir: 'assets/audio/shotgun_reload1.mp3',
    name: 'shotgun reload 1 shells',
  },
  { id: 34, dir: 'assets/audio/rifle_shot.mp3', name: 'rifle shot' },
  { id: 35, dir: 'assets/audio/rifle_reload.mp3', name: 'rifle reload' },
  { id: 36, dir: 'assets/audio/rifle_empty.mp3', name: 'rifle empty' },
  { id: 37, dir: 'assets/audio/sale1.mp3', name: 'turkey sale 1' },
  { id: 38, dir: 'assets/audio/sale2.mp3', name: 'turkey sale 2' },
  { id: 39, dir: 'assets/audio/sale3.mp3', name: 'turkey sale 3' },
];

const audioList = Array();

audio.forEach((sound, index) => {
  audioList[index] = new Audio();
  audioList[index].src = sound.dir;
});

const defaultHunter = {
  name: 'Hunter',
  money: 5000,
  turkeysBagged: [],
  turkeysBaggedCount: 0,
  currentWeapon: 0,
  introPlayed: false,
  profileIntro: false,
  weapons: [
    {
      weaponName: 'Fists',
      basicName: 'fists',
      weaponID: 0,
      currentMag: 1,
      weaponDamage: 0,
      weaponMag: 1,
      weaponAmmo: 0,
      weaponFireSound: 5,
      weaponFiringTime: 1,
      weaponReloadSound: 6,
      weaponReloadTime: 5.5,
      weaponEmptySound: 8,
    },
    {
      weaponName: 'G2 Revolver',
      basicName: 'revolver',
      weaponID: 1,
      currentMag: 0,
      weaponDamage: 1,
      weaponMag: 6,
      weaponAmmo: 120,
      weaponFireSound: 1,
      weaponFiringTime: 1.9,
      weaponReloadSound: 2,
      weaponReloadTime: 3.5,
      weaponEmptySound: 3,
    },
  ],
};

const armoryWeapons = [
  {
    weaponName: 'Fists',
    basicName: 'fists',
    weaponID: 0,
    currentMag: 1,
    weaponDamage: 0,
    weaponMag: 1,
    weaponAmmo: 0,
    weaponFireSound: 5,
    weaponFiringTime: 1,
    weaponReloadSound: 6,
    weaponReloadTime: 5.5,
    weaponEmptySound: 8,
  },
  {
    weaponName: 'G2 Revolver',
    basicName: 'revolver',
    weaponID: 1,
    currentMag: 0,
    weaponDamage: 1,
    weaponMag: 6,
    weaponAmmo: 72,
    weaponFireSound: 1,
    weaponFiringTime: 1.9,
    weaponReloadSound: 2,
    weaponReloadTime: 3.5,
    weaponEmptySound: 3,
  },
  {
    weaponName: 'XR Shotgun',
    basicName: 'shotgun',
    weaponID: 2,
    currentMag: 0,
    weaponDamage: 3,
    weaponMag: 7,
    weaponAmmo: 84,
    weaponFireSound: 20,
    weaponFiringTime: 2.1,
    weaponReloadSound: 21,
    weaponReloadTime: 4.7,
    weaponEmptySound: 19,
  },
  {
    weaponName: 'T-3 Rifle',
    basicName: 'rifle',
    weaponID: 3,
    currentMag: 0,
    weaponDamage: 4,
    weaponMag: 5,
    weaponAmmo: 60,
    weaponFireSound: 34,
    weaponFiringTime: 1.6,
    weaponReloadSound: 35,
    weaponReloadTime: 4.5,
    weaponEmptySound: 36,
  },
];

const armoryWeaponCosts = [
  { weaponName: 'Fists (Not Used Here)', weaponID: 2, weaponCost: 250 },
  { weaponName: 'G2 Revolver (Not Used Here)', weaponID: 2, weaponCost: 250 },
  { weaponName: 'XR Shotgun', weaponID: 2, weaponCost: 500 },
  { weaponName: 'T-3 Rifle', weaponID: 3, weaponCost: 1000 },
];

const armoryAmmo = [
  // Fist Ammo. Lol. Not used
  { ammoName: 'Fist Ammo', cost: 20, amount: 120 },
  { ammoName: 'Revolver rounds', cost: 20, amount: 120 },
  { ammoName: 'Shotgun shells', cost: 40, amount: 84 },
  { ammoName: 'Rifle rounds', cost: 50, amount: 60 },
];

const armoryUpgrades = [
  // Brass Knuckles are never to be used LOL
  { upgradeName: 'Brass Knuckles', upgradeCost: 150, upgradeTier: 1 },
  { upgradeName: 'G2+ Revolver', upgradeCost: 150, upgradeTier: 2 },
  { upgradeName: 'ZR Shotgun', upgradeCost: 250, upgradeTier: 4 },
  { upgradeName: 'T-4 Rifle', upgradeCost: 400, upgradeTier: 5 },
];

const turkeyNames = {
  first: [
    'Wild',
    'Pumpkin',
    'Nell',
    'Cranberry',
    'Pudgy',
    'Puddin',
    'Tom',
    'Ms',
    'Bless',
    'Autumn',
    'Acorn',
    'Pecan',
    'Jive',
    'Joy',
    'Rafter',
    'Happy',
    'Remy',
    'Sleepy',
    'Chick',
    'Snood',
    'Caruncles',
    'Stuffy',
  ],
  last: [
    `O'Turkey`,
    `O'McBird`,
    `O'Gizzard`,
    `O'Gobbler`,
    `O'McFeathers`,
    `O'Buzzard`,
    `O'Wishbone`,
    `O'Bird`,
    `O'Gobble`,
    `O'Stuffin`,
    `O'MacStuffin`,
    `O'Gobbles`,
    `O'Butterball`,
    'Drumstick',
    'Feathers',
    'Wattle',
    'Cornucopia',
    'Gobbler',
    'Roast',
    'Giblets',
    'Wattle',
    'Giblets',
    'Gobble',
    'Feather',
    'MacGravy',
    'Giblet',
  ],
};

const shotgunReloadTimes = [2.3, 2.6, 3.1, 3.4, 3.8, 4.2];
