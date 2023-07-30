// Define sounds
const audio = [
  {
    id: 0,
    dir: 'assets/audio/registeropen.mp3',
    name: 'Cash register open',
  },
  {
    id: 1,
    dir: 'assets/audio/chaching.mp3',
    name: 'Chaching',
  },
  {
    id: 2,
    dir: 'assets/audio/scanner.mp3',
    name: 'Scan Item',
  },
  {
    id: 3,
    dir: 'assets/audio/cash.mp3',
    name: 'Count Cash',
  },
  {
    id: 4,
    dir: 'assets/audio/card.mp3',
    name: 'Pay with Card',
  },
  {
    id: 5,
    dir: 'assets/audio/backspace.mp3',
    name: 'Backspace',
  },
  {
    id: 6,
    dir: 'assets/audio/erase.mp3',
    name: 'Erase',
  },
  {
    id: 7,
    dir: 'assets/audio/close.mp3',
    name: 'Close Cash Drawer',
  },
  {
    id: 8,
    dir: 'assets/audio/checkout.mp3',
    name: 'Checkout',
  },
];

const audioList = Array();

audio.forEach((sound, index) => {
  audioList[index] = new Audio();
  audioList[index].src = sound.dir;
});

const getCashierData = () => {
  const saveJSON = localStorage.getItem('ACR-data');

  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else {
    return {
      cashierName: 'Cashier',
      colorOne: '#f357a5',
      colorTwo: '#ff69b4',
      colorThree: '#ffd7ff',
      colorFour: '#ebd6ff',
    };
  }
};

const cashierData = getCashierData();
