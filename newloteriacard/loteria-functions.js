'use strict';

// Random number function
// Accepts minimum and maximum number as parameters
const ranBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

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
    lesserArranger(i);

    // Setup the event listener to click on the card
    grid[i].addEventListener('click', () => {
      // Assign each card an image and append it to the appropriate div
      // We want to show a bean if the card has been clicked

      // To be defined immediately below
      let titleText = '';
      location.href.includes('espanol.html')
        ? (titleText = 'Seleccionas una tarjeta')
        : (titleText = 'Select A Card');

      if (locked === 0) {
        // Card isn't locked. No adding beans while unlocked.
        // The card must be locked to be usable for play.
        // Use experimental card selector code.
        let win = window.open();
        win.document.body.style.display = 'flex';
        win.document.body.style.flexDirection = 'column';
        win.document.body.style.justifyContent = 'center';
        win.document.body.style.alignContent = 'center';
        win.document.body.style.padding = '2rem';

        // Add page title
        let title = document.createElement('p');
        title.textContent = titleText;
        title.style.marginTop = '0';
        title.style.marginBottom = '2rem';
        title.style.fontSize = '5rem';
        title.style.textAlign = 'center';
        title.style.fontWeight = 'bold';
        win.document.body.appendChild(title);

        // Add back link
        let backLink = document.createElement('a');
        backLink.href = 'javascript:window.close();';
        titleText.length > 16
          ? (backLink.textContent = 'Cerrar')
          : (backLink.textContent = 'Close');
        backLink.style.color = 'red';
        backLink.style.display = 'flex';
        backLink.style.justifyContent = 'center';
        backLink.style.fontSize = '3rem';
        win.document.body.appendChild(backLink);

        // Run a for each for all the loteria card images
        // But first, pull an array of all non-selected cards (not currently active on the card)
        let nonActiveCards = shuffled.slice(16, 54);
        console.log(nonActiveCards);
        nonActiveCards = nonActiveCards.sort(function (a, b) {
          return a - b;
        });
        console.log(nonActiveCards);

        // Outer Loop, this creates rows for the cards
        for (let x = 0; x < 10; x++) {
          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.justifyContent = 'center';
          row.style.flexDirection = 'row';

          // Define blank image
          let blank = new Image(264, 390);
          blank.src = 'images/blank.png';

          // Inner loop, this creates the cards
          for (let y = 0; y < 4; y++) {
            const div = document.createElement('div');
            div.style.margin = '1rem;';
            const image = document.createElement('img');
            y + x * 4 > 37
              ? (image.src = blank.src)
              : (image.src = imageList[nonActiveCards[y + x * 4]].src);

            image.style.width = '90%';
            image.style.padding = '1rem';
            image.id = nonActiveCards[y + x * 4];
            div.appendChild(image);
            row.appendChild(div);

            // Don't create event listeners for the blank spaces
            if (y + x * 4 <= 37) {
              // Create event listener for clicking on the card
              image.addEventListener('click', (e) => {
                win.close();

                let selectedCard = parseInt(e.target.id);

                let warnText = '';
                location.href.includes('espanol.html')
                  ? (warnText = `¡El #${
                      selectedCard + 1
                    } ya está en uso! ¡Elige otra carta!`)
                  : (warnText = `#${
                      selectedCard + 1
                    } is already in use! Pick a different card!`);

                // Define the card to be replaced and its position in the array so we can move it to the selected card's old position in the shuffled array
                // If this doesn't happen, we'll have two of the selected card in the same array
                let oldCard = shuffled[i];
                let oldspot = shuffled.findIndex(
                  (shuffled) => shuffled === selectedCard
                );

                // Don't allow selecting the loteria tile already in use on this card
                if (currentCard.includes(selectedCard)) {
                  setTimeout(() => {
                    alert(warnText);
                  }, 50);
                  return;
                }

                // Position the ID of the new card in the appropriate position in the shuffled array
                shuffled[i] = selectedCard;
                // Position the ID of the replaced card in the selected card's former position in the shuffled array
                shuffled[oldspot] = oldCard;
                // Prime the correct image for appending
                let cardImage = imageList[selectedCard];
                // Clear the previous image
                grid[i].innerHTML = '';
                // Append the image to the grid square
                grid[i].appendChild(cardImage);
                // Reset beans setup
                beanSetup(i);

                // Assign part of the shuffled variable to a variable to track just the 16 displayed cards
                currentCard = shuffled.slice(0, -38);

                // Save the change to local storage
                saveJSON(shuffled, 'newLoteriaCard');
              });
            }
            win.document.body.appendChild(row);
          }
        }
      } else {
        // Card is locked. Run bean code.
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
      }
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

    if (beanSelect.selectedIndex >= 4) {
      currentBean = ranBetween(0, 3);
    }
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
  if (locked === 0) {
    // Card isn't locked. No audio calls while locked.
    // The card must be locked to be usable for play.
    return;
  }

  if (conditionsValue === '7') {
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
  // Four card corners
  // If all four corners are filled, buenas!
  if (
    conditionsValue === '2' &&
    trackerArray[0] &&
    trackerArray[3] &&
    trackerArray[12] &&
    trackerArray[15]
  ) {
    buenasPues();
  }

  // X Cross checks
  // If the X Cross is complete, buenas!
  if (
    conditionsValue === '3' &&
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
    conditionsValue === '4' &&
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
    conditionsValue === '5' &&
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
    conditionsValue === '6' &&
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
  let sel = document.getElementById('customCards');

  sel.addEventListener('click', () => {
    oldIndex = sel.selectedIndex;
  });

  if (locked === 1) {
    // Card is locked. Do nothing!
    sel.selectedIndex = oldIndex;
    return;
  }

  if (sel.value === '1') {
    customCardArranger(defaultCard);
    shuffled = defaultCard;
  } else if (sel.value === '2') {
    customCardArranger(theDeadDrunk);
    shuffled = theDeadDrunk;
  } else if (sel.value === '3') {
    customCardArranger(fuckedUpCard);
    shuffled = fuckedUpCard;
  } else if (sel.value === '4') {
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
    lesserArranger(i);
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

let lesserArranger = (i) => {
  image = imageList[currentCard[i]];
  grid[i].innerHTML = '';
  grid[i].appendChild(image);
  beanSetup(i);

  beans = document.getElementsByClassName('bean');

  // Save the change to local storage
  saveJSON(shuffled, 'newLoteriaCard');
};

const lockCard = () => {
  if (locked === 0) {
    // Lock the card. Show the locked card background color style.
    lockDOM('lock');
  } else {
    // We're unlocking the card, so clear the beans
    clearBeanTracking();
    // Unlock the card
    lockDOM('unlock');
  }
};

const beanSetup = (i) => {
  let bean = document.createElement('img');
  bean.style.display = 'none';
  bean.src = theBeans[currentBean].dir;
  bean.className = 'bean';
  grid[i].appendChild(bean);
  beans = document.getElementsByClassName('bean');
};

const checkIfLocked = () => {
  if (locked === 1) {
    // Card is locked. Show the locked card background color style.
    lockDOM('lock');
  } else {
    lockDOM('unlock');
  }
};

const lockDOM = (status) => {
  if (status === 'lock') {
    locked = 1;
    saveJSON(locked, 'newLoteriaLock');
    document.getElementsByTagName('body')[0].style.backgroundColor = lockColor;
    location.href.includes('espanol.html')
      ? (lockStatus.innerHTML = 'Bloqueada')
      : (lockStatus.innerHTML = 'Locked');

    lockStatus.style = '';
    lockStatus.style.border = '';
  } else {
    locked = 0;
    saveJSON(locked, 'newLoteriaLock');
    document.getElementsByTagName('body')[0].style.backgroundColor =
      'rgb(255, 255, 255)';
    // Else, card isn't locked. Do nothing.
    location.href.includes('espanol.html')
      ? (lockStatus.innerHTML = 'Desbloqueada')
      : (lockStatus.innerHTML = 'Unlocked');
    lockStatus.style.padding = '.1rem';
    lockStatus.style.border = '1px black solid';
  }
};
