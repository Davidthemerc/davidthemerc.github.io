const boostElements = [
  { name: 'p1defpray1', player: 1, boostID: 0, group: 3, status: 0 },
  { name: 'p1strpray1', player: 1, boostID: 1, group: 2, status: 0 },
  { name: 'p1atkpray1', player: 1, boostID: 2, group: 1, status: 0 },
  { name: 'p1defpray2', player: 1, boostID: 3, group: 3, status: 0 },
  { name: 'p1strpray2', player: 1, boostID: 4, group: 2, status: 0 },
  { name: 'p1atkpray2', player: 1, boostID: 5, group: 1, status: 0 },
  { name: 'p1defpray3', player: 1, boostID: 6, group: 3, status: 0 },
  { name: 'p1strpray3', player: 1, boostID: 7, group: 2, status: 0 },
  { name: 'p1atkpray3', player: 1, boostID: 8, group: 1, status: 0 },
  { name: 'p1melpray1', player: 1, boostID: 9, group: 7, status: 0 },
  { name: 'p1melpray2', player: 1, boostID: 10, group: 7, status: 0 },
  { name: 'p1atkpot1', player: 1, boostID: 11, group: 4, status: 0 },
  { name: 'p1strpot1', player: 1, boostID: 12, group: 5, status: 0 },
  { name: 'p1defpot1', player: 1, boostID: 13, group: 6, status: 0 },
  { name: 'p1atkpot2', player: 1, boostID: 14, group: 4, status: 0 },
  { name: 'p1strpot2', player: 1, boostID: 15, group: 5, status: 0 },
  { name: 'p1defpot2', player: 1, boostID: 16, group: 6, status: 0 },
  { name: 'p1zampot', player: 1, boostID: 17, group: 8, status: 0 },
  { name: 'p2defpray1', player: 2, boostID: 0, group: 3, status: 0 },
  { name: 'p2strpray1', player: 2, boostID: 1, group: 2, status: 0 },
  { name: 'p2atkpray1', player: 2, boostID: 2, group: 1, status: 0 },
  { name: 'p2defpray2', player: 2, boostID: 3, group: 3, status: 0 },
  { name: 'p2strpray2', player: 2, boostID: 4, group: 2, status: 0 },
  { name: 'p2atkpray2', player: 2, boostID: 5, group: 1, status: 0 },
  { name: 'p2defpray3', player: 2, boostID: 6, group: 3, status: 0 },
  { name: 'p2strpray3', player: 2, boostID: 7, group: 2, status: 0 },
  { name: 'p2atkpray3', player: 2, boostID: 8, group: 1, status: 0 },
  { name: 'p2melpray1', player: 2, boostID: 9, group: 7, status: 0 },
  { name: 'p2melpray2', player: 2, boostID: 10, group: 7, status: 0 },
  { name: 'p2atkpot1', player: 2, boostID: 11, group: 4, status: 0 },
  { name: 'p2strpot1', player: 2, boostID: 12, group: 5, status: 0 },
  { name: 'p2defpot1', player: 2, boostID: 13, group: 6, status: 0 },
  { name: 'p2atkpot2', player: 2, boostID: 14, group: 4, status: 0 },
  { name: 'p2strpot2', player: 2, boostID: 15, group: 5, status: 0 },
  { name: 'p2defpot2', player: 2, boostID: 16, group: 6, status: 0 },
  { name: 'p2zampot', player: 2, boostID: 17, group: 8, status: 0 },
];

const activeBoosts = [
  [
    { name: 'p1atkpray', bonus: 1 },
    { name: 'p1strpray', bonus: 1 },
    { name: 'p1defpray', bonus: 1 },
    { name: 'p1atkpot', bonus: 1 },
    { name: 'p1strpot', bonus: 1 },
    { name: 'p1defpot', bonus: 1 },
    { name: 'p1hpBoosted', bonus: 1 },
  ],
  [
    { name: 'p2atkpray', bonus: 1 },
    { name: 'p2strpray', bonus: 1 },
    { name: 'p2defpray', bonus: 1 },
    { name: 'p2atkpot', bonus: 1 },
    { name: 'p2strpot', bonus: 1 },
    { name: 'p2defpot', bonus: 1 },
    { name: 'p2hpBoosted', bonus: 1 },
  ],
];

let playerLevels = [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
];

let definedBoosts = [
  {
    name: 'Thick Skin',
    boost: 1.05,
  },
  {
    name: 'Burst of Strength',
    boost: 1.05,
  },
  {
    name: 'Clarity of Thought',
    boost: 1.05,
  },
  {
    name: 'Rock Skin',
    boost: 1.1,
  },
  {
    name: 'Superhuman Strength',
    boost: 1.1,
  },
  {
    name: 'Improved Reflexes',
    boost: 1.1,
  },
  {
    name: 'Steel Skin',
    boost: 1.15,
  },
  {
    name: 'Ultimate Strength',
    boost: 1.15,
  },
  {
    name: 'Incredible Reflexes',
    boost: 1.15,
  },
  {
    name: 'Chivalry',
    atkBoost: 1.15,
    defBoost: 1.2,
    strBoost: 1.18,
  },
  {
    name: 'Piety',
    atkBoost: 1.2,
    defBoost: 1.25,
    strBoost: 1.23,
  },
  {
    name: 'Attack Potion',
    boost: 0.1,
    inc: 3,
  },
  {
    name: 'Strength Potion',
    boost: 0.1,
    inc: 3,
  },
  {
    name: 'Defense Potion',
    boost: 0.1,
    inc: 3,
  },
  {
    name: 'Super Attack Potion',
    boost: 0.15,
    inc: 5,
  },
  {
    name: 'Super Strength Potion',
    boost: 0.15,
    inc: 5,
  },
  {
    name: 'Super Defense Potion',
    boost: 0.15,
    inc: 5,
  },
  {
    name: 'Zamorak Brew',
    atkBoost: 0.2,
    defBoost: -0.1,
    strBoost: 0.12,
    atkInc: 2,
    defInc: -2,
    strInc: 0.12,
  },
];

const differentialValues = [
  // DPS - Lower Bound, Middle Bound, Upper Bound
  [0.2, 0.5, 1],
  // HP - Lower, Middle, Upper
  [0, 2, 6],
];

const hpBoosts = [{ name: 'Guthix Rest', boost: 5, p1status: 0, p2status: 0 }];

const allBoostElements = document.getElementsByClassName('boost');
const allBoostElementsArray = Array.from(allBoostElements);

const audio = [{ id: 0, dir: 'assets/audio/sword_hit.mp3' }];

const audioList = Array();

audio.forEach((sound, index) => {
  audioList[index] = new Audio();
  audioList[index].src = sound.dir;
});
