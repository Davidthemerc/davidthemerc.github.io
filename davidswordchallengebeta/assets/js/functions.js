// Random number function
// Accepts minimum and maximum number as parameters
const ranBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Game status localstorage function
const loadGameStatus = () => {
  const saveJSON = localStorage.getItem('DWC-gameStatus');

  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else {
    return {
      currentRow: 0,
      currentColumn: 0,
      currentWord: checkDayWord(),
      currentScore: 0,
      doneInRows: 0,
      wonMode: 0,
      midnightTime: moment()
        .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
        .valueOf(),
    };
  }
};

// Function to load saved words from localstorage into an array
const loadSavedWords = () => {
  const saveJSON = localStorage.getItem('DWC-savedWords');

  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else {
    return ['', '', '', '', '', ''];
  }
};

// Function to load saved localstorage data
const getJSON = (savedName) => {
  const saveJSON = localStorage.getItem(savedName);

  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else return [];
};

// Function to save localstorage data
const saveJSON = (savedArray, savedName) => {
  localStorage.setItem(savedName, JSON.stringify(savedArray));
};

// Function to display messages in an area of the page
const displayMessage = (message, messageEl) => {
  messageEl.innerHTML = message;
};

// Function to initially put entered letters into the word tiles
const enterLetter = (key) => {
  if (gameStatus.currentRow > 5) {
    return;
  }

  if (gameStatus.currentColumn === 5) {
    throw new Error(`Stop! You've entered too many letters!`);
  }

  rowArray[gameStatus.currentRow][gameStatus.currentColumn].innerHTML = key;
  gameStatus.currentColumn += 1;
  currentWord += key;
};

// Function to remove letters from the word tiles when using the delete key
const deleteLetter = () => {
  if (gameStatus.currentRow > 5) {
    return;
  }
  if (gameStatus.currentColumn !== 0) {
    rowArray[gameStatus.currentRow][gameStatus.currentColumn - 1].innerHTML =
      '';
    gameStatus.currentColumn -= 1;
    currentWord = currentWord.substring(0, currentWord.length - 1);
  }
};

// Function to initially check a submitted word and color the tiles appropriately
const submitWord = (word) => {
  //console.log(`Checking the word ${word}`);

  const yourWord = [
    word.substring(0, 1),
    word.substring(1, 2),
    word.substring(2, 3),
    word.substring(3, 4),
    word.substring(4, 5),
  ];

  // Save word into the correct position in the localstorage item
  savedWords[gameStatus.currentRow] = yourWord;
  saveJSON(savedWords, 'DWC-savedWords');

  const theRightWord = [
    winningWord.substring(0, 1),
    winningWord.substring(1, 2),
    winningWord.substring(2, 3),
    winningWord.substring(3, 4),
    winningWord.substring(4, 5),
  ];

  // We'll use this to tell the code not to re-check a letter in the same position.
  // Example Word: crier
  // If someone guesses the word "error", the first two R's in error will match up with the R's in
  // crier, but the third R will not match up, because when the R's are initially matched up, the
  // dupeCheck array is set to 1 at these positions: [0,1,0,0,1] e.g. [c,R,i,e,R]. The loop will skip
  // at positions 1 and 4, not checking for R's any more by the time the third R in 'error' is to be checked.
  // Therefore, the third R in 'error' will result in a red tile instead of an erroneous extra yellow
  // tile, because the code will not check for R again, due to skipping. Devising this system was the
  //result of repeated trial and error over a couple of days!
  const dupeCheck = [0, 0, 0, 0, 0];

  // Green tile coloring code. Also handles red (wrong letter) tiles.
  yourWord.forEach((checkedLetter, index) => {
    if (checkedLetter === theRightWord[index]) {
      boxRowArray[gameStatus.currentRow][
        index
      ].className = `boxrow${gameStatus.currentRow} boxgreen`;
      document
        .getElementById(`keyboard-` + checkedLetter)
        .classList.add('buttongreen');
      dupeCheck[index] += 1;
    } else {
      boxRowArray[gameStatus.currentRow][
        index
      ].className = `boxrow${gameStatus.currentRow} boxred`;
      document
        .getElementById(`keyboard-` + checkedLetter)
        .classList.add('buttonred');
    }
  });

  // Yellow tile coloring system
  yourWord.forEach((checkedLetter, index) => {
    for (let y = 0; y < 5; y++) {
      if (dupeCheck[index] > 0) {
        continue;
      }
      if (checkedLetter !== undefined) {
        //console.log(`Checking ${checkedLetter} against ${theRightWord[y]}`);
        if (checkedLetter === theRightWord[y] && dupeCheck[index] === 0) {
          boxRowArray[gameStatus.currentRow][
            index
          ].className = `boxrow${gameStatus.currentRow} boxyellow`;
          document
            .getElementById(`keyboard-` + checkedLetter)
            .classList.add('buttonyellow');
          dupeCheck[index] += 1;
        }
      }
    }
  });

  // End of submitWord function
};

// Function to shuffle the array containing the winning word and three words selected at random
// This way, you can't guess the correct definition by always just picking the first one, which
// happened before I utilized this shuffle function. The correct definition can now appear at
// any of the four spots in the array, meaning it could be rendered in the DOM first thru fourth.
const shuffle = (array) => {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

// Function to render the definitions and the corresponding response buttons on the DOM
const definitionsDOM = (definition, bword, rightDefinedWord) => {
  const div = document.createElement('div');
  const paragraph = document.createElement('li');
  const button = document.createElement('button');
  div.className = 'definebox';
  button.textContent = `Select`;
  button.className = 'selectbutton';
  paragraph.textContent = `${definition[0].meanings[0].definitions[0].definition} `;
  paragraph.className = 'definition';
  div.appendChild(paragraph);
  div.appendChild(button);
  quizEl.appendChild(div);
  window.scrollTo({
    left: 0,
    top: document.body.scrollHeight,
    behavior: 'smooth',
  });

  // Event listener for definition buttons
  button.addEventListener('click', () => {
    window.scrollTo(0, 0);

    // If the correct definition is selected
    if (bword === rightDefinedWord) {
      //If the word is correct
      if (bword === winningWord) {
        displayMessage('SUPER! You guessed the word!', statusEl);
        success.play();
        submitWord(rightDefinedWord);
        setTimeout(() => {
          displayMessage('', statusEl);
          gameStatus.currentRow += 1;
          gameStatus.doneInRows = gameStatus.currentRow;
          gameStatus.currentScore += 1;
          gameStatus.wonMode = 1;
          gameStatus.currentScore += scoreTable[gameStatus.currentRow - 1];
          victoryMessage();
          gameStatus.currentRow = 6;
          saveJSON(gameStatus, 'DWC-gameStatus');
          quizEl.innerHTML = '';
          cheaterStopper = 0;
          addHideButton();
          return;
        }, 3000);
      } else {
        // Else, did not guess the word, but did get the definition right.
        displayMessage(
          'You did not guess the word, but +1 point for the correct definition.',
          statusEl
        );
        setTimeout(() => {
          displayMessage('', statusEl);
        }, 3000);
        submitWord(rightDefinedWord);
        // Reset the position of the 'cursor' and reset the current word. This essentially starts a new row.
        gameStatus.currentRow += 1;
        gameStatus.currentScore += 1;
        gameStatus.currentColumn = 0;
        saveJSON(gameStatus, 'DWC-gameStatus');
        currentWord = '';
      }
      quizEl.innerHTML = '';
      cheaterStopper = 0;
    } else {
      if (rightDefinedWord === winningWord) {
        displayMessage(
          'SUPER! You guessed the word, although you did not get the definition right.',
          statusEl
        );
        success.play();
        submitWord(rightDefinedWord);
        setTimeout(() => {
          displayMessage('', statusEl);
          gameStatus.currentRow += 1;
          gameStatus.doneInRows = gameStatus.currentRow;
          gameStatus.wonMode = 1;
          gameStatus.currentScore += scoreTable[gameStatus.currentRow - 1];
          victoryMessage();
          gameStatus.currentRow = 6;
          saveJSON(gameStatus, 'DWC-gameStatus');
          quizEl.innerHTML = '';
          cheaterStopper = 0;
          addHideButton();
          return;
        }, 4000);
      } else {
        // Else, did not get the right definition! No point for the player!
        displayMessage(
          `You did not pick the correct definition. Sorry, you do not get a point.`,
          statusEl
        );
        setTimeout(() => {
          displayMessage('', statusEl);
        }, 3000);
        submitWord(rightDefinedWord);
        // Play the buzzer sound
        buzzer.play();
        quizEl.innerHTML = '';
        cheaterStopper = 0;

        // Reset the position of the 'cursor' and reset the current word. This essentially starts a new row.
        gameStatus.currentRow += 1;
        gameStatus.currentColumn = 0;
        saveJSON(gameStatus, 'DWC-gameStatus');
        currentWord = '';
      }
    }

    if (gameStatus.currentRow > 5) {
      displayMessage(
        `Haha, you have lost! The word was: ${winningWord}`,
        statusEl
      );
    }
  });
};

// Function to display previously placed words, color tiles, color keys, etc., when reloading page
const displaySavedWords = (arrayLoop) => {
  if (gameStatus.currentWord === null) {
    gameStatus.currentWord = 0;
    winningWord = words[gameStatus.currentWord];
    saveJSON(gameStatus, 'DWC-gameStatus');
  }

  const theRightWord = [
    winningWord.substring(0, 1),
    winningWord.substring(1, 2),
    winningWord.substring(2, 3),
    winningWord.substring(3, 4),
    winningWord.substring(4, 5),
  ];

  // Works just like the one on line 113, but the functionality is slightly different because this code has to be run to render
  // all of the potential words on the board, not just the word being entered. This code renders the tile colors for the entire
  // board whenever the user comes back to the page via a refresh or page open.
  const dupeCheck = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ];

  // Green tile coloring code. Also handles red (wrong letter) tiles.
  arrayLoop.forEach((letter, index) => {
    for (let x = 0; x < 5; x++) {
      if (letter[x] !== undefined) {
        rowArray[index][x].innerHTML = letter[x].toUpperCase();
        if (letter[x] === theRightWord[x]) {
          boxRowArray[index][
            x
          ].className = `boxrow${gameStatus.currentRow} boxgreen`;
          document
            .getElementById(`keyboard-` + letter[x])
            .classList.add('buttongreen');
          dupeCheck[index][x] += 1;
        } else {
          boxRowArray[index][
            x
          ].className = `boxrow${gameStatus.currentRow} boxred`;
          document
            .getElementById(`keyboard-` + letter[x])
            .classList.add('buttonred');
        }
      }
    }
  });

  // Yellow tile coloring code
  arrayLoop.forEach((letter, index) => {
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        if (dupeCheck[index][x] > 0) {
          continue;
        }
        if (letter[x] !== undefined) {
          //console.log(`Checking ${letter[x]} against ${theRightWord[y]}`);
          if (letter[x] === theRightWord[y] && dupeCheck[index][x] === 0) {
            boxRowArray[index][x].className = `boxrow${index} boxyellow`;
            dupeCheck[index][x] += 1;
            document
              .getElementById(`keyboard-` + letter[x])
              .classList.add('buttonyellow');
          }
        }
      }
    }
  });

  // If we're still in "won" mode, e.g. the player hasn't reset the game
  // after winning yet, show the hide button so they can still take a screenshot
  // if they want to.
  if (gameStatus.wonMode === 1) {
    addHideButton();
    victoryMessage();
  }

  // Function ends here
};

// Function containing game reset values
const resetGameFunction = (val) => {
  if (val === 1) {
    gameStatus = {
      currentRow: 0,
      currentColumn: 0,
      currentWord: checkDayWord(),
      currentScore: 0,
      doneInRows: 0,
      wonMode: 0,
      midnightTime: moment()
        .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
        .valueOf(),
    };
  }

  wordEl.innerHTML = `Word # ${gameStatus.currentWord} (${moment().format(
    'MMMM D, YYYY'
  )})`;
  currentWord = '';
  winningWord = words[gameStatus.currentWord];
  saveJSON(gameStatus, 'DWC-gameStatus');
  savedWords = ['', '', '', '', '', ''];
  saveJSON(savedWords, 'DWC-savedWords');
  quizEl.innerHTML = '';
  rowArray.forEach((row) => {
    row.forEach((subCell) => {
      subCell.innerHTML = '';
    });
  });
  boxRowArray.forEach((row, index) => {
    row.forEach((subCell) => {
      subCell.className = `box boxrow${index}`;
    });
  });
  keyboardArray.forEach((key) => {
    key.className = 'btnkey btn-primary align-self-center';
  });

  winningWord = words[gameStatus.currentWord];
};

// Simple function to ensure that the submitted word is the right length
const checkWord = (word) => {
  if (currentWord.length < 5) {
    throw new Error('Your word is too short!');
  }
};

// Function to allow for hiding the letters, especially after a victory, to allow for taking a result/bragging screenshot
const toggleWordsVisibility = () => {
  if (toggler === 0) {
    for (let x = 0; x < 6; x++) {
      for (let y = 0; y < 5; y++) {
        rowArray[x][y].style.display = 'block';
        keyboardTray.style.display = 'block';
      }
    }
    toggler = 1;
  } else {
    for (let x = 0; x < 6; x++) {
      for (let y = 0; y < 5; y++) {
        rowArray[x][y].style.display = 'none';
        keyboardTray.style.display = 'none';
      }
    }
    toggler = 0;
  }
};

// Function to clear localstorage to prevent users of older versions from encountering issues
const clearLocal = () => {
  localStorage.removeItem('DWC-gameStatus');
};

const addHideButton = () => {
  // Add button to hide letters to allow for result bragging screenshots
  const div = document.createElement('div');
  div.className = 'text-center';
  const button = document.createElement('button');
  button.textContent = 'Hide Words for Screenshot';
  button.addEventListener('click', () => {
    toggleWordsVisibility();
  });
  div.appendChild(button);
  ssButton.appendChild(div);
};

const checkDayWord = () => {
  let momentDay = moment();
  let duration = moment.duration(momentDay.diff(originalDate));
  let dayDiff = duration.as('days');

  if (dayDiff >= 1) {
    //At least one day has passed since the end of the original day (reset)!'
    let word = Math.floor(dayDiff);
    //We'll select the Word # based on the difference of days
    return word;
  } else {
    let word = 0;
    // Day One! August 7th, 2022. The beginning of the game!
    return word;
  }
};

const checkDate = () => {
  let currentTime = moment().valueOf();
  let difference = moment.duration(currentTime - gameStatus.midnightTime);
  difference = Math.abs(difference.as('days'));
  if (difference >= 1) {
    // At least one day has passed since the end of the original day (reset)!
    // Advance the word of the day.
    clearLocal();
    resetGameFunction(1);
    gameStatus.currentWord = checkDayWord();
    saveJSON(gameStatus, 'DWC-gameStatus');
  }
};

const victoryMessage = () => {
  let div = document.createElement('div');
  div.className = 'victory';
  let paragraph = document.createElement('p');
  paragraph.className = 'm-0 p-1';
  paragraph.textContent = `DWC Word # ${gameStatus.currentWord}: ${gameStatus.doneInRows}/6, Score: ${gameStatus.currentScore} Points`;
  div.appendChild(paragraph);
  statusEl.appendChild(div);
};
