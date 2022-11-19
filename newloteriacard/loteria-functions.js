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
    selectorArranger(i);

    // Setup the event listener to click on the card
    grid[i].addEventListener('click', () => {
      // Assign each card an image and append it to the appropriate div
      // But, we want to show the bean instead if the card has been clicked

      if (trackerArray[i] === 1) {
        // If the bean isn't active, show it
        trackerArray[i] = 0;
        beans[i].style.display = 'none';
      } else {
        // If the bean is active, hide it
        trackerArray[i] = 1;
        beans[i].style.display = 'flex';
      }
      // Save the change to local storage
      saveJSON(trackerArray, 'newLoteriaTracker');
      // Lastly, check if there was a winning combination
      buenasCheck();
    });

    image = imageList[shuffled[i]];
    grid[i].innerHTML = '';
    grid[i].appendChild(image);
    beanSetup(i);

    if (trackerArray[i] === 0) {
      beans[i].style.display = 'none';
    } else {
      beans[i].style.display = 'flex';
    }
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
    beanSetup(i);

    if (trackerArray[i] === 0) {
      beans[i].style.display = 'none';
    } else {
      beans[i].style.display = 'flex';
    }
  }
};

// Check if there's a winning condition
let buenasCheck = () => {
  if (conditionsValue === '6') {
    // No audio call; full manual
    return;
  }
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

let cambio = () => {
  //voiceValue === '0' ? audio4.play() : audio3.play();
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

  // Clear the tracker array and save to local storage, since we're changing cards
  clearBeanTracking();

  // Announce 'cambio' to prevent cheating
  cambio();
};

let customCardArranger = (set) => {
  for (let i = 0; i < 16; i++) {
    // Assign each card an image and append it to the appropriate div
    image = imageList[set[i]];
    grid[i].innerHTML = '';
    grid[i].appendChild(image);
    shuffled[i] = set[i];
    selectorArranger(i);
    saveJSON(shuffled, 'newLoteriaCard');
  }
};

let getJSON = (savedName) => {
  const saveJSON = localStorage.getItem(savedName);

  if (savedName === 'newLoteriaCard') {
    if (saveJSON !== null) {
      return JSON.parse(saveJSON);
    } else return shuffle(loteriaArray);
  } else if (savedName === 'newLoteriaTracker') {
    if (saveJSON !== null) {
      return JSON.parse(saveJSON);
    } else return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  } else if (savedName === 'newLoteriaLock') {
    if (saveJSON !== null) {
      return JSON.parse(saveJSON);
    } else return 0;
  }
};

let saveJSON = (savedItem, savedName) => {
  localStorage.setItem(savedName, JSON.stringify(savedItem));
};

let clearBeanTracking = () => {
  trackerArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  saveJSON(trackerArray, 'newLoteriaTracker');
  reloadCard();
};

let selectorArranger = (i) => {
  // Arrange the input selectors to match the card
  let currentInput = document.getElementById(`grid${i}`);
  currentInput.selectedIndex = shuffled[i];
  let oldIndex = currentInput.selectedIndex;

  // Add an event listener for each input selector
  currentInput.addEventListener('change', () => {
    if (locked === 1) {
      // Card is locked. Do nothing!
      currentInput.selectedIndex = oldIndex;
      return;
    }

    if (currentCard.includes(currentInput.selectedIndex)) {
      // Don't allow selecting the loteria tile already in use on this card
      alert(
        `#${
          currentInput.selectedIndex + 1
        } is already in use! Pick a different one!`
      );
      currentInput.selectedIndex = oldIndex;
      return;
    }

    // Announce 'cambio' to prevent cheating
    cambio();

    image = imageList[currentInput.selectedIndex];
    shuffled[i] = currentInput.selectedIndex;
    grid[i].innerHTML = '';
    grid[i].appendChild(image);
    beanSetup(i);

    beans = document.getElementsByClassName('bean');

    clearBeanTracking();

    // Save the change to local storage
    saveJSON(shuffled, 'newLoteriaCard');
  });
};

const lockCard = () => {
  if (locked === 0) {
    // Lock the card. Show the locked card background color style.
    document.getElementsByTagName('body')[0].style.backgroundColor =
      'rgb(255,255,255)';
    locked = 1;
    saveJSON(locked, 'newLoteriaLock');
  } else {
    locked = 0;
    saveJSON(locked, 'newLoteriaLock');
    document.getElementsByTagName('body')[0].style.backgroundColor =
      'rgb(224, 215, 255)';
  }
};

const beanSetup = (i) => {
  let bean = document.createElement('img');
  bean.style.display = 'none';
  bean.src = 'images/bean.png';
  bean.className = 'bean';
  grid[i].appendChild(bean);
  beans = document.getElementsByClassName('bean');
};

const checkIfLocked = () => {
  if (locked === 1) {
    // Card is locked. Show the locked card background color style.
    document.getElementsByTagName('body')[0].style.backgroundColor =
      'rgb(255,255,255)';
  }
  // Else, card isn't locked. Do nothing.
};
