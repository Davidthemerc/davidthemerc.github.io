'use strict';

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

// Define buenas audio
const audio = new Audio('audio/Buenas.mp3'); // Female voice
const audio2 = new Audio('audio/Buenas2.mp3'); // Male voice
const audio3 = new Audio('audio/CambioMale.mp3'); // Male voice
const audio4 = new Audio('audio/CambioFemale.mp3'); // Female voice
const audio5 = new Audio('audio/paper.mp3');

let bean = new Image(264, 390);
bean.src = 'images/bean.png';

// Define the "Loteria Array" as 0-53 to represent the 54 possible cards
let loteriaArray = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53,
];

// This array keeps track of which cards have beans
let trackerArray = getJSON('newLoteriaTracker');
saveJSON(trackerArray, 'newLoteriaTracker');

// This array tracks if the card is locked
let locked = getJSON('newLoteriaLock');
saveJSON(locked, 'newLoteriaLock');

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

// Call the function to assign the shuffled array to the shuffled variable
// We'll reference this to draw the card
let shuffled = getJSON('newLoteriaCard');
saveJSON(shuffled, 'newLoteriaCard');

// Assign part of the shuffled variable to a variable to track just the 16 displayed cards
let currentCard = shuffled.slice(0, -38);

// Call the function to assign individual cards randomly to the entire loteria card
// Unless there's a card already, then we'll just load that
initialSetup();

// Game Type/Conditions Selector
conditions.addEventListener('change', (e) => {
  conditionsValue = document.getElementById('conditions').value;
});

// Voice Selector
voice.addEventListener('change', (e) => {
  voiceValue = document.getElementById('voice').value;
});

// Clear card event listener
clearButton.addEventListener('click', (e) => {
  // This array keeps track of which cards have beans
  clearBeanTracking();
});

// New card event listener
newButton.addEventListener('click', (e) => {
  if (locked === 1) {
    // Card is locked. Do nothing!
    return;
  }

  // This array keeps track of which cards have beans
  shuffled = shuffle(loteriaArray);
  saveJSON(shuffled, 'newLoteriaCard');
  for (let i = 0; i < 16; i++) {
    lesserArranger(i);
  }
  clearBeanTracking();

  // Play the paper shuffle audio
  audio5.play();

  // Assign part of the shuffled variable to a variable to track just the 16 displayed cards
  currentCard = shuffled.slice(0, -38);
});

// Lock card event listener
lockButton.addEventListener('click', () => {
  lockCard();
});

// Check if the card is locked
checkIfLocked();
