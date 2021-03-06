const quantityControlNum = [16, 32, 64, 128, 256, 512];
const vendingControlNum = [20, 16, 12, 8, 4, 2, 1];

const quantityControlNames = [
  '16 Units',
  '32 Units',
  '64 Units',
  '128 Units',
  '256 Units',
  '512 Units',
];

const currentMoney = document.getElementById('currentMoney');

const statusEl = document.getElementById('status');

const dayTable = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// Friendly Name should be plural, because it will/should be referenced as such in all situations
const itemPriceTable = [
  {
    refName: 'whamchipz',
    friendlyName: 'Wham Chipz',
    itemType: 'snack',
    itemPrice: 0.5,
    size: 6,
    maxNum: 12,
  },
  {
    refName: 'pythagoroos',
    friendlyName: 'Pythagoroos',
    itemType: 'snack',
    itemPrice: 0.7,
    size: 4,
    maxNum: 16,
  },
  {
    refName: 'chompers',
    friendlyName: 'Chompers',
    itemType: 'snack',
    itemPrice: 0.8,
    size: 3,
    maxNum: 20,
  },
];

// This is the table of "fair" prices for each item, which can be affected by the placement location
const fairPriceTable = [
  {
    friendlyName: 'Wham Chipz',
    tierPrice0: 1.5,
    tierPrice1: 1.75,
    tierPrice2: 2.0,
  },
  {
    friendlyName: 'Pythagoroos',
    tierPrice0: 1.75,
    tierPrice1: 2.0,
    tierPrice2: 2.25,
  },
  {
    friendlyName: 'Chompers',
    tierPrice0: 1.0,
    tierPrice1: 1.25,
    tierPrice2: 1.5,
  },
];

// This is the code to preload the item images for Warehouse Mart
let warehouseMartItemImages = Array();
for (let i = 0; i <= 2; i++) {
  warehouseMartItemImages[i] = new Image(75, 75);
  warehouseMartItemImages[
    i
  ].src = `/vendingmachinemanager/assets/img/items/item${i}.png`;
}

// Random number function
// Accepts minimum and maximum number as parameters
const ranBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const defaultLocations = [
  // There are two possible terms a location can request.
  // Term 1: They will request you to pay a monthly flat fee in rent in exchange for placement.'
  // Term 2: They will request a percentage of your gross sales in exchange for placement.'
  {
    name: 'BobRock Library',
    terms: `BobRock Library would like you to pay`,
    termVar: 2,
    // termCost will actually be defined inside the generate location function. It will be different each time
    // the location is generated until the location is selected. So you could turn them down one time and possibly
    // get a better offer later on. Or, maybe a worse offer!
    termCost: ranBetween(5, 9),
    termCostLow: 5,
    termCostHigh: 9,
    termText: '',
    termNum: 0,
    priceTier: 0,
    locationID: uuidv4(),
  },
  {
    name: 'Warehouse Mart',
    terms: `Warehouse Mart would like you to pay`,
    termVar: 1,
    termCost: ranBetween(80, 130),
    termCostLow: 80,
    termCostHigh: 130,
    termText: '',
    termNum: 0,
    priceTier: 2,
    locationID: uuidv4(),
  },
  {
    name: `Tob's Gym`,
    terms: `Tob's Gym Mart would like you to pay`,
    termVar: 1,
    termCost: ranBetween(50, 95),
    termCostLow: 50,
    termCostHigh: 95,
    termText: '',
    termNum: 0,
    priceTier: 2,
    locationID: uuidv4(),
  },
  {
    name: 'Gilded Train Station',
    terms: `The Gilded Train Station would like you to pay`,
    termVar: 2,
    termCost: ranBetween(7, 11),
    termCostLow: 7,
    termCostHigh: 11,
    termText: '',
    termNum: 0,
    priceTier: 1,
    locationID: uuidv4(),
  },
  {
    name: 'Vargas Adult School',
    terms: `Vargas Adult School would like you to pay`,
    termVar: 1,
    termCost: ranBetween(55, 125),
    termCostLow: 55,
    termCostHigh: 125,
    termText: '',
    termNum: 0,
    priceTier: 1,
    locationID: uuidv4(),
  },
];

const snackVariants = [
  {
    variantID: 0,
    numOfSlots: 34,
    leftSlots: [
      { size: 6, position: 0 },
      { size: 6, position: 1 },
      { size: 6, position: 4 },
      { size: 6, position: 5 },
      { size: 6, position: 8 },
      { size: 6, position: 9 },
      { size: 3, position: 12 },
      { size: 3, position: 13 },
      { size: 3, position: 14 },
      { size: 3, position: 15 },
      { size: 3, position: 20 },
      { size: 3, position: 21 },
      { size: 3, position: 22 },
      { size: 3, position: 23 },
      { size: 4, position: 28 },
      { size: 4, position: 29 },
      { size: 4, position: 30 },
    ],
    rightSlots: [
      { size: 6, position: 2 },
      { size: 6, position: 3 },
      { size: 6, position: 6 },
      { size: 6, position: 7 },
      { size: 6, position: 10 },
      { size: 6, position: 11 },
      { size: 3, position: 16 },
      { size: 3, position: 17 },
      { size: 3, position: 18 },
      { size: 3, position: 19 },
      { size: 3, position: 24 },
      { size: 3, position: 25 },
      { size: 3, position: 26 },
      { size: 3, position: 27 },
      { size: 4, position: 31 },
      { size: 4, position: 32 },
      { size: 4, position: 33 },
    ],
  },
];
const sodaVariants = [];
