let getJSON = (savedName) => {
  const saveJSON = localStorage.getItem(savedName);

  if (savedName === 'newLoteriaCard') {
    if (saveJSON !== null) {
      return JSON.parse(saveJSON);
    } else return shuffle(loteriaArray);
  } else if (savedName === 'newLoteriaTracker') {
    if (saveJSON !== null) {
      return JSON.parse(saveJSON);
    } else return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false];
  } else if (savedName === 'newLoteriaLock') {
    if (saveJSON !== null) {
      return JSON.parse(saveJSON);
    } else return 0;
  }
};

let saveJSON = (savedItem, savedName) => {
  localStorage.setItem(savedName, JSON.stringify(savedItem));
};

// This is the code to preload the images
let imageList = Array();
for (let i = 0; i <= 53; i++) {
  imageList[i] = new Image(264, 390);
  imageList[i].src = 'images/loteria 5x7 ' + i + '.png';
}

// Define global variables
let image;
let beans;
let oldIndex;
let lockColor = 'rgb(152, 163, 214)';
let lockStatus = document.getElementById('lockStatus');
let beanSelect = document.getElementById('beanselect');
let currentBean = 0;
let winCond;

// Define game audio
const gameAudio = [
  { id: 0, dir: 'audio/Buenas.mp3' }, // Female voice,
  { id: 1, dir: 'audio/Buenas2.mp3' }, // Male voice
  { id: 2, dir: 'audio/paper.mp3' },
];

gameAudio.forEach((sound, index) => {
  gameAudio[index] = new Audio();
  gameAudio[index].src = sound.dir;
});

// Define card name audio
const femaleCardAudio = [];
const maleCardAudio = [];

for (let i = 1; i <= 54; i++) {
  femaleCardAudio[i] = new Audio();
  femaleCardAudio[i].src = `../loteriacaller/audio/female/Sound ${i}.mp3`;
}

for (let i = 1; i <= 54; i++) {
  maleCardAudio[i] = new Audio();
  maleCardAudio[i].src = `../loteriacaller/audio/male/Sound ${i}.mp3`;
}

let bean = new Image(264, 390);
bean.src = 'images/bean.png';

const theBeans = [
  { id: 0, dir: 'images/bean.png', name: 'bean1' },
  { id: 1, dir: 'images/bean2.png', name: 'bean2' },
  { id: 2, dir: 'images/bean3.png', name: 'bean3' },
  { id: 2, dir: 'images/bean4.png', name: 'bean4' },
];

// Define the "Loteria Array" as 0-53 to represent the 54 possible cards
let loteriaArray = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53,
];

// Define the loteria card names
let cardNames = [
  'El Gallo',
  'El Diablito',
  'La Dama',
  'El Catrin',
  'El Paraguas',
  'La Sirena',
  'La Escalera',
  'La Botella',
  'El Barril',
  'El Arbol',
  'El Melon',
  'El Valiente',
  'El Gorrito',
  'La Muerte',
  'La Pera',
  'La Bandera',
  'El Bandolon',
  'El Violoncello',
  'La Garza',
  'El Pajaro',
  'La Mano',
  'La Bota',
  'La Luna',
  'El Cotorro',
  'El Borracho',
  'El Negrito',
  'El Corazon',
  'La Sandia',
  'El Tambor',
  'El Camaron',
  'Las Jaras',
  'El Musico',
  'La Arana',
  'El Soldado',
  'La Estrella',
  'El Cazo',
  'El Mundo',
  'El Apache',
  'El Nopal',
  'El Alacran',
  'La Rosa',
  'La Calavera',
  'La Campana',
  'El Cantarito',
  'El Venado',
  'El Sol',
  'La Corona',
  'La Chalupa',
  'El Pino',
  'El Pescado',
  'La Palma',
  'La Maceta',
  'El Arpa',
  'La Rana',
];

// This array keeps track of which cards have beans
let trackerArray = getJSON('newLoteriaTracker');
saveJSON(trackerArray, 'newLoteriaTracker');

// This array tracks if the card is locked
let locked = getJSON('newLoteriaLock');
saveJSON(locked, 'newLoteriaLock');

// Define currentCard variable to track cards currently displayed
let currentCard;

// Define my preferred cards with arrays
const defaultCard = [
  48, 8, 23, 14, 15, 9, 7, 4, 22, 21, 24, 33, 45, 32, 36, 50,
];
const theDeadDrunk = [
  51, 8, 0, 10, 41, 9, 7, 16, 22, 44, 13, 31, 11, 29, 34, 38,
];
const fuckedUpCard = [
  51, 8, 0, 27, 13, 9, 7, 25, 22, 10, 14, 23, 49, 29, 47, 38,
];
const variety = [36, 49, 15, 28, 19, 29, 39, 17, 51, 50, 43, 46, 14, 20, 0, 38];

// Define grid divs for assignment
let grid = document.getElementsByClassName('grid');

// Capture current winning conditions
let conditions = document.getElementById('conditions');
let conditionsValue = document.getElementById('conditions').value;

// Capture current voice value
let voice = document.getElementById('voice');
let voiceValue = document.getElementById('voice').value;

// Define button
let clearButton = document.getElementById('clear');
let newButton = document.getElementById('newCard');
let lockButton = document.getElementById('lockCard');

// Defined winning possibilities
// Horizontal Rows
const winCheck = () => {
  winCond = {
    row1: trackerArray[0] + trackerArray[1] + trackerArray[2] + trackerArray[3],
    row2: trackerArray[4] + trackerArray[5] + trackerArray[6] + trackerArray[7],
    row3:
      trackerArray[8] + trackerArray[9] + trackerArray[10] + trackerArray[11],
    row4:
      trackerArray[12] + trackerArray[13] + trackerArray[14] + trackerArray[15],
    col1:
      trackerArray[0] + trackerArray[4] + trackerArray[8] + trackerArray[12],
    col2:
      trackerArray[1] + trackerArray[5] + trackerArray[9] + trackerArray[13],
    col3:
      trackerArray[2] + trackerArray[6] + trackerArray[10] + trackerArray[14],
    col4:
      trackerArray[3] + trackerArray[7] + trackerArray[11] + trackerArray[15],
    diag1:
      trackerArray[0] + trackerArray[5] + trackerArray[10] + trackerArray[15],
    diag2:
      trackerArray[3] + trackerArray[6] + trackerArray[9] + trackerArray[12],
    corners1:
      trackerArray[0] + trackerArray[1] + trackerArray[4] + trackerArray[5],
    corners2:
      trackerArray[2] + trackerArray[3] + trackerArray[6] + trackerArray[7],
    corners3:
      trackerArray[8] + trackerArray[9] + trackerArray[12] + trackerArray[13],
    corners4:
      trackerArray[10] + trackerArray[11] + trackerArray[14] + trackerArray[15],
    fourCorners:
      trackerArray[0] + trackerArray[3] + trackerArray[12] + trackerArray[15],
    xCross:
      trackerArray[0] +
      trackerArray[3] +
      trackerArray[5] +
      trackerArray[6] +
      trackerArray[9] +
      trackerArray[10] +
      trackerArray[12] +
      trackerArray[15],
    frame:
      trackerArray[0] +
      trackerArray[1] +
      trackerArray[2] +
      trackerArray[3] +
      trackerArray[4] +
      trackerArray[7] +
      trackerArray[8] +
      trackerArray[11] +
      trackerArray[12] +
      trackerArray[13] +
      trackerArray[14] +
      trackerArray[15],
    center:
      trackerArray[5] + trackerArray[6] + trackerArray[9] + trackerArray[10],
    all:
      trackerArray[0] +
      trackerArray[1] +
      trackerArray[2] +
      trackerArray[3] +
      trackerArray[4] +
      trackerArray[5] +
      trackerArray[6] +
      trackerArray[7] +
      trackerArray[8] +
      trackerArray[9] +
      trackerArray[10] +
      trackerArray[11] +
      trackerArray[12] +
      trackerArray[13] +
      trackerArray[14] +
      trackerArray[15],
  };
};
