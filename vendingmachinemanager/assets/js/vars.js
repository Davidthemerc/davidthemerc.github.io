const quantityControlNum = [16, 32, 64, 128];
const vendingControlNum = [16, 12, 8, 4, 2, 1];

const quantityControlNames = ['16 Units', '32 Units', '64 Units', '128 Units'];

const currentMoney = document.getElementById('currentMoney');

const statusEl = document.getElementById('status');

// Friendly Name should be plural, because it will/should be referenced as such in all situations
const itemPriceTable = [
  { refName: 'whamchipz', friendlyName: 'Wham Chipz', itemPrice: 0.5 },
  { refName: 'pythagoroos', friendlyName: 'Pythagoroos', itemPrice: 0.7 },
  { refName: 'chompers', friendlyName: 'Chompers', itemPrice: 0.8 },
];

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
    terms: `BobRock Library is criminally underfunded. `,
    termVar: 2,
    // termCost will actually be defined inside the generate location function. It will be different each time
    // the location is generated until the location is selected. So you could turn them down one time and possibly
    // get a better offer later on. Or, maybe a worse offer!
    termCost: ranBetween(5, 9),
    termText: '',
    termNum: 0,
    locationID: uuidv4(),
  },
  {
    name: 'Warehouse Mart',
    terms: `Warehouse Mart would like you to pay`,
    termVar: 1,
    termCost: ranBetween(80, 130),
    termText: '',
    termNum: 0,
    locationID: uuidv4(),
  },
  {
    name: `Tob's Gym`,
    terms: `Tob's Gym Mart would like you to pay`,
    termVar: 1,
    termCost: ranBetween(50, 95),
    termText: '',
    termNum: 0,
    locationID: uuidv4(),
  },
  {
    name: 'Gilded Train Station',
    terms: `The Gilded Train Station is getting a bit run down and could use extra funds. `,
    termVar: 2,
    termCost: ranBetween(7, 11),
    termText: '',
    termNum: 0,
    locationID: uuidv4(),
  },
  {
    name: 'Vargas Adult School',
    terms: `Vargas Adult School would like you to pay`,
    termVar: 1,
    termCost: ranBetween(55, 125),
    termText: '',
    termNum: 0,
    locationID: uuidv4(),
  },
];
