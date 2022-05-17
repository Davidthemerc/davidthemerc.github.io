'use strict';

// This is the code to preload the images
let imageList = Array();
for (let i = 0; i <= 53; i++) {
  imageList[i] = new Image(273, 390);
  imageList[i].src = 'images/loteria 5x7 ' + i + '.jpg';
}
// Define image as global variable
let image;

// Define buenas audio
const audio = new Audio('audio/Buenas.mp3');

// This is the code to preload the images
let beanedImageList = Array();
for (let i = 0; i <= 53; i++) {
  beanedImageList[i] = new Image(273, 390);
  beanedImageList[i].src = 'images/beaned/loteria 5x7 ' + i + '.jpg';
}

// Define the "Loteria Array" as 0-53 to represent the 54 possible cards
let loteriaArray = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53,
];

// This array keeps track of which cards have beans
let trackerArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

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

// Define button
let button = document.getElementById('reset');

// Call the function to assign the shuffled array to the shuffled variable
// We'll reference this to draw the card
let shuffled = shuffle(loteriaArray);

// Call the function to assign individual cards randomly to the entire loteria card
initialSetup();

// Game Type/Conditions Selector
conditions.addEventListener('change', (e) => {
  conditionsValue = document.getElementById('conditions').value;
});

// Reset card event listener
button.addEventListener('click', (e) => {
  // This array keeps track of which cards have beans
  trackerArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  reloadCard();
});
