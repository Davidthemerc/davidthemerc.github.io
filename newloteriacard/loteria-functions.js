'use strict';

// Random number function
// Accepts minimum and maximum number as parameters
const ranBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const playAudio = (list, id) => {
  list[id].play();
};

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
  winCheck();
  checkCallButton();

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
        nonActiveCards = nonActiveCards.sort(function (a, b) {
          return a - b;
        });

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
          // If the bean is active, hide it
          trackerArray[i] = 0;
          beans[i].style.display = 'none';
        } else {
          // If the bean isn't active, show it
          trackerArray[i] = 1;
          beans[i].style.display = 'flex';
        }
        // Update winning check variable
        winCheck();
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
    (winCond.row1 === 4 ||
      winCond.row2 === 4 ||
      winCond.row3 === 4 ||
      winCond.row4 === 4)
  ) {
    buenasPues();
  }
  // Vertical row checks
  // If any of the Vertical rows are complete, buenas!
  if (
    conditionsValue === '0' &&
    (winCond.col1 === 4 ||
      winCond.col2 === 4 ||
      winCond.col3 === 4 ||
      winCond.col4 === 4)
  ) {
    buenasPues();
  }
  // Diagonal checks
  // If any of the Diagonals are complete, buenas!
  if (conditionsValue === '0' && (winCond.diag1 === 4 || winCond.diag2 === 4)) {
    buenasPues();
  }
  // Corners checks
  // If any of the corners are complete, buenas!
  if (
    conditionsValue === '1' &&
    (winCond.corners1 === 4 ||
      winCond.corners2 === 4 ||
      winCond.corners3 === 4 ||
      winCond.corners4 === 4)
  ) {
    buenasPues();
  }
  // Four card corners
  // If all four corners are filled, buenas!
  if (conditionsValue === '2' && winCond.fourCorners === 4) {
    buenasPues();
  }

  // X Cross checks
  // If the X Cross is complete, buenas!
  if (conditionsValue === '3' && winCond.xCross === 8) {
    buenasPues();
  }
  // Frame checks
  // If the Frame is complete, buenas!
  if (conditionsValue === '4' && winCond.frame === 12) {
    buenasPues();
  }
  // Center checks
  // If the center is complete, buenas!
  if (conditionsValue === '5' && winCond.center === 4) {
    buenasPues();
  }
  // Full card check
  // If all cards are complete, buenas!
  if (conditionsValue === '6' && winCond.all === 16) {
    buenasPues();
  }
};

let buenasPues = () => {
  // Buenas!
  // If the voice dropdown is set to Female/0, then play the female voice
  if (voiceValue === '0') {
    playAudio(gameAudio, 0);
  } else {
    // Otherwise play the male voice
    playAudio(gameAudio, 1);
  }

  trackerArray[16] = true;
  saveJSON(trackerArray, 'newLoteriaTracker');

  // If victory is achieved, create an extra button in the DOM
  // This button will be used to call out the winning cards
  checkCallButton();
};

let buenasCards = () => {
  let winners = [];

  // Check rows & columns
  if (conditionsValue === '0') {
    // Check the rows to identify the winning cards
    if (winCond.row1 === 4) {
      winners = [
        currentCard[0],
        currentCard[1],
        currentCard[2],
        currentCard[3],
      ];
    } else if (winCond.row2 === 4) {
      winners = [
        currentCard[4],
        currentCard[5],
        currentCard[6],
        currentCard[7],
      ];
    } else if (winCond.row3 === 4) {
      winners = [
        currentCard[8],
        currentCard[9],
        currentCard[10],
        currentCard[11],
      ];
    } else if (winCond.row4 === 4) {
      winners = [
        currentCard[12],
        currentCard[13],
        currentCard[14],
        currentCard[15],
      ];
    }
    // Check the columns to identify the winning cards
    if (winCond.col1 === 4) {
      winners = [
        currentCard[0],
        currentCard[4],
        currentCard[8],
        currentCard[12],
      ];
    } else if (winCond.col2 === 4) {
      winners = [
        currentCard[1],
        currentCard[5],
        currentCard[9],
        currentCard[13],
      ];
    } else if (winCond.col3 === 4) {
      winners = [
        currentCard[2],
        currentCard[6],
        currentCard[10],
        currentCard[14],
      ];
    } else if (winCond.col4 === 4) {
      winners = [
        currentCard[3],
        currentCard[7],
        currentCard[11],
        currentCard[15],
      ];
    }
    // Check the diagnoals to identify the winning cards
    if (winCond.diag1 === 4) {
      winners = [
        currentCard[0],
        currentCard[5],
        currentCard[10],
        currentCard[15],
      ];
    } else if (winCond.diag2 === 4) {
      winners = [
        currentCard[3],
        currentCard[6],
        currentCard[9],
        currentCard[12],
      ];
    }
  }

  //Check the corners blocks to identify the winning cards
  if (conditionsValue === '1') {
    if (winCond.corners1 === 4) {
      winners = [
        currentCard[0],
        currentCard[1],
        currentCard[4],
        currentCard[5],
      ];
    } else if (winCond.corners2 === 4) {
      winners = [
        currentCard[2],
        currentCard[3],
        currentCard[6],
        currentCard[7],
      ];
    } else if (winCond.corners3 === 4) {
      winners = [
        currentCard[8],
        currentCard[9],
        currentCard[12],
        currentCard[13],
      ];
    } else if (winCond.corners4 === 4) {
      winners = [
        currentCard[10],
        currentCard[11],
        currentCard[14],
        currentCard[15],
      ];
    }
  }

  // Checking for the four corners
  if (conditionsValue === '2') {
    if (winCond.fourCorners === 4) {
      winners = [
        currentCard[0],
        currentCard[3],
        currentCard[12],
        currentCard[15],
      ];
    }
  }

  // Checking for the x cross
  if (conditionsValue === '3') {
    if (winCond.xCross === 8) {
      winners = [
        currentCard[0],
        currentCard[3],
        currentCard[5],
        currentCard[6],
        currentCard[9],
        currentCard[10],
        currentCard[12],
        currentCard[15],
      ];
    }
  }

  // Checking for the frame
  if (conditionsValue === '4') {
    if (winCond.xCross === 12) {
      winners = [
        currentCard[0],
        currentCard[1],
        currentCard[2],
        currentCard[3],
        currentCard[4],
        currentCard[7],
        currentCard[8],
        currentCard[11],
        currentCard[12],
        currentCard[13],
        currentCard[14],
        currentCard[15],
      ];
    }
  }

  // Checking for the center
  if (conditionsValue === '5') {
    if (winCond.center === 4) {
      winners = [
        currentCard[5],
        currentCard[6],
        currentCard[9],
        currentCard[10],
      ];
    }
  }

  // Checking for the full card
  if (conditionsValue === '6') {
    if (winCond.all === 16) {
      winners = [
        currentCard[0],
        currentCard[1],
        currentCard[2],
        currentCard[3],
        currentCard[4],
        currentCard[5],
        currentCard[6],
        currentCard[7],
        currentCard[8],
        currentCard[9],
        currentCard[10],
        currentCard[11],
        currentCard[12],
        currentCard[13],
        currentCard[14],
        currentCard[15],
      ];
    }
  }

  // Create a loop using a promise to force it to resolve only after the duration
  // of the audio being played, plus 200 milliseconds
  let interval; // how much time should the delay between two iterations be (in milliseconds)?
  let promise = Promise.resolve();
  winners.forEach((card) => {
    promise = promise.then(() => {
      interval = femaleCardAudio[card + 1].duration * 1000 + 200;
      voiceValue === '0'
        ? playAudio(femaleCardAudio, card + 1)
        : playAudio(maleCardAudio, card + 1);
      return new Promise((resolve) => {
        setTimeout(resolve, interval);
      });
    });
  });

  promise.then(() => {
    // Loop finished
  });
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
};

let customCardArranger = (set) => {
  for (let i = 0; i < 16; i++) {
    // Assign each card an image and append it to the appropriate div
    lesserArranger(i);
    saveJSON(shuffled, 'newLoteriaCard');
  }
};

let clearBeanTracking = () => {
  trackerArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false];
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

const checkCallButton = () => {
  const div = document.getElementById('last');
  if (trackerArray[16] === true) {
    const button = document.createElement('button');
    location.href.includes('espanol.html')
      ? (button.textContent = 'Llama las tarjetas')
      : (button.textContent = 'Call out Cards');
    button.style.margin = '1rem';
    // Add event listener for calling out cards
    button.addEventListener('click', () => {
      buenasCards();
    });
    div.innerHTML = '';
    div.appendChild(button);
  } else {
    div.innerHTML = '';
  }
};
