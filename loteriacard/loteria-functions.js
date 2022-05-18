'use strict';

// Shuffle the card array so that we'll get a random, non-repeating set
let shuffle = (array) => {
  let i = array.length,
    j = 0,
    temp;

  while (i--) {
    j = Math.floor(Math.random() * (i + 1));

    // swap randomly chosen element with current element
    temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }

  return array;
};

// This function runs when the page is initialized
let initialSetup = () => {
  for (let i = 0; i < 16; i++) {
    // Setup the event listener to click on the card
    grid[i].addEventListener('click', () => {
      // Assign each card an image and append it to the appropriate div
      // But, we want to show the bean instead if the card has been clicked
      if (trackerArray[i] === 1) {
        image = imageList[shuffled[i]];
        grid[i].innerHTML = '';
        grid[i].appendChild(image);
        trackerArray[i] = 0;
      } else {
        image = beanedImageList[shuffled[i]];
        grid[i].innerHTML = '';
        grid[i].appendChild(image);
        trackerArray[i] = 1;
      }

      // Lastly, check if there was a winning combination
      buenasCheck();
    });
    image = imageList[shuffled[i]];
    grid[i].innerHTML = '';
    grid[i].appendChild(image);
  }
};

// Function to reload cards
let reloadCard = () => {
  for (let i = 0; i < 16; i++) {
    // Assign each card an image and append it to the appropriate div
    // But, we want to show the bean instead if the card has been clicked

    image = imageList[shuffled[i]];
    grid[i].innerHTML = '';
    grid[i].appendChild(image);
  }
};

// Check if there's a winning condition
let buenasCheck = () => {
  // Horizontal row checks
  // If any of the horizontal rows are complete, buenas!
  if (
    conditionsValue === '0' &&
    ((trackerArray[0] &&
      trackerArray[1] &&
      trackerArray[2] &&
      trackerArray[3]) ||
      (trackerArray[4] &&
        trackerArray[5] &&
        trackerArray[6] &&
        trackerArray[7]) ||
      (trackerArray[8] &&
        trackerArray[9] &&
        trackerArray[10] &&
        trackerArray[11]) ||
      (trackerArray[12] &&
        trackerArray[13] &&
        trackerArray[14] &&
        trackerArray[15]))
  ) {
    buenasPues();
  }
  // Vertical row checks
  // If any of the Vertical rows are complete, buenas!
  if (
    conditionsValue === '0' &&
    ((trackerArray[0] &&
      trackerArray[4] &&
      trackerArray[8] &&
      trackerArray[12]) ||
      (trackerArray[1] &&
        trackerArray[5] &&
        trackerArray[9] &&
        trackerArray[13]) ||
      (trackerArray[2] &&
        trackerArray[6] &&
        trackerArray[10] &&
        trackerArray[14]) ||
      (trackerArray[3] &&
        trackerArray[7] &&
        trackerArray[11] &&
        trackerArray[15]))
  ) {
    buenasPues();
  }
  // Diagonal checks
  // If any of the Diagonals are complete, buenas!
  if (
    conditionsValue === '0' &&
    ((trackerArray[0] &&
      trackerArray[5] &&
      trackerArray[10] &&
      trackerArray[15]) ||
      (trackerArray[3] &&
        trackerArray[6] &&
        trackerArray[9] &&
        trackerArray[12]))
  ) {
    buenasPues();
  }
  // Corners checks
  // If any of the corners are complete, buenas!
  if (
    conditionsValue === '1' &&
    ((trackerArray[0] &&
      trackerArray[1] &&
      trackerArray[4] &&
      trackerArray[5]) ||
      (trackerArray[2] &&
        trackerArray[3] &&
        trackerArray[6] &&
        trackerArray[7]) ||
      (trackerArray[8] &&
        trackerArray[9] &&
        trackerArray[12] &&
        trackerArray[13]) ||
      (trackerArray[10] &&
        trackerArray[11] &&
        trackerArray[14] &&
        trackerArray[15]))
  ) {
    buenasPues();
  }
  // X Cross checks
  // If the X Cross is complete, buenas!
  if (
    conditionsValue === '2' &&
    trackerArray[0] &&
    trackerArray[3] &&
    trackerArray[5] &&
    trackerArray[6] &&
    trackerArray[9] &&
    trackerArray[10] &&
    trackerArray[12] &&
    trackerArray[15]
  ) {
    buenasPues();
  }
  // Frame checks
  // If the Frame is complete, buenas!
  if (
    conditionsValue === '3' &&
    trackerArray[0] &&
    trackerArray[1] &&
    trackerArray[2] &&
    trackerArray[3] &&
    trackerArray[4] &&
    trackerArray[7] &&
    trackerArray[8] &&
    trackerArray[11] &&
    trackerArray[12] &&
    trackerArray[13] &&
    trackerArray[14] &&
    trackerArray[15]
  ) {
    buenasPues();
  }
  // Center checks
  // If the center is complete, buenas!
  if (
    conditionsValue === '4' &&
    trackerArray[5] &&
    trackerArray[6] &&
    trackerArray[9] &&
    trackerArray[10]
  ) {
    buenasPues();
  }
  // Full card check
  // If all cards are complete, buenas!
  if (
    conditionsValue === '5' &&
    trackerArray.every((val, i, arr) => val === arr[0])
  ) {
    buenasPues();
  }
};

let buenasPues = () => {
  // Buenas!
  // If the voice dropdown is set to Female/0, then play the female voice
  if (voiceValue === '0') {
    audio.play();
  } else {
    // Otherwise play the male voice
    audio2.play();
  }
};

let selectorDetector = () => {
  let sel = document.getElementById('customCards').value;

  if (sel === '1') {
    customCardArranger(defaultCard);
    shuffled = defaultCard;
  } else if (sel === '2') {
    customCardArranger(theDeadDrunk);
    shuffled = theDeadDrunk;
  } else if (sel === '3') {
    customCardArranger(fuckedUpCard);
    shuffled = fuckedUpCard;
  } else if (sel === '4') {
    customCardArranger(variety);
    shuffled = variety;
  }

  // This array keeps track of which cards have beans
  trackerArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  reloadCard();
};

let customCardArranger = (set) => {
  for (let i = 0; i < 16; i++) {
    // Assign each card an image and append it to the appropriate div
    // But, we want to show the bean instead if the card has been clicked

    image = imageList[set[i]];
    grid[i].innerHTML = '';
    grid[i].appendChild(image);
  }
};
