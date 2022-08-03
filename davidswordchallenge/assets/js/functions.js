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
      currentWord: 0,
    };
  }
};

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

const submitWord = (word) => {
  console.log(`Checking the word ${word}`);

  const yourWord = [
    word.substring(0, 1),
    word.substring(1, 2),
    word.substring(2, 3),
    word.substring(3, 4),
    word.substring(4, 5),
  ];

  savedWords[gameStatus.currentRow] = yourWord;
  saveJSON(savedWords, 'DWC-savedWords');

  const theRightWord = [
    winningWord.substring(0, 1),
    winningWord.substring(1, 2),
    winningWord.substring(2, 3),
    winningWord.substring(3, 4),
    winningWord.substring(4, 5),
  ];

  const dupeCheck = [0, 0, 0, 0, 0];

  // Green tile coloring system
  yourWord.forEach((checkedLetter, index) => {
    if (checkedLetter === theRightWord[index]) {
      boxRowArray[gameStatus.currentRow][
        index
      ].className = `boxrow${gameStatus.currentRow} boxgreen`;

      dupeCheck[index] += 1;
    } else {
      boxRowArray[gameStatus.currentRow][
        index
      ].className = `boxrow${gameStatus.currentRow} boxred`;
    }
  });

  yourWord.forEach((checkedLetter, index) => {
    for (let y = 0; y < 5; y++) {
      if (dupeCheck[y] > 0) {
        continue;
      }
      if (checkedLetter !== undefined) {
        console.log(`Checking ${checkedLetter} against ${theRightWord[y]}`);
        if (checkedLetter === theRightWord[y] && dupeCheck[y] === 0) {
          boxRowArray[gameStatus.currentRow][
            index
          ].className = `boxrow${gameStatus.currentRow} boxyellow`;
          dupeCheck[y] += 1;
        }
      }
    }
  });

  // End of submitWord function
};

function shuffle(array) {
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
}

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

  button.addEventListener('click', () => {
    if (bword === rightDefinedWord) {
      if (bword === winningWord) {
        displayMessage('SUPER! You guessed the word!', statusEl);
        success.play();
        submitWord(bword);
        setTimeout(() => {
          displayMessage('', statusEl);
          let victory = `DWC Word # ${gameStatus.currentWord}: ${
            gameStatus.currentRow + 1
          }/6`;
          displayMessage(victory, statusEl);
          gameStatus.currentRow = 6;
          saveJSON(gameStatus, 'DWC-gameStatus');
          quizEl.innerHTML = '';
          // Add button to hide letters to allow for result bragging screenshots
          const div = document.createElement('div');
          div.className = 'text-center';
          const button = document.createElement('button');
          button.textContent = 'Hide Words for Screenshot';
          button.addEventListener('click', () => {
            toggleWordsVisibility();
          });
          div.appendChild(button);
          quizEl.appendChild(div);
          return;
        }, 3000);
      } else {
        displayMessage('Great, but you did not guess the word.', statusEl);
        setTimeout(() => {
          displayMessage('', statusEl);
        }, 3000);
        submitWord(bword);
        // Reset the position of the 'cursor' and reset the current word. This essentially starts a new row.
        gameStatus.currentRow += 1;
        gameStatus.currentColumn = 0;
        saveJSON(gameStatus, 'DWC-gameStatus');
        currentWord = '';
      }
      quizEl.innerHTML = '';
    } else {
      displayMessage(
        `You did not pick the correct definition. NO COLOR TILES FOR YOU!`,
        statusEl
      );
      setTimeout(() => {
        displayMessage('', statusEl);
      }, 3000);
      // Place the punishment tiles
      buzzer.play();
      quizEl.innerHTML = '';
      boxRowArray[gameStatus.currentRow].forEach((tile) => {
        tile.className = `boxrow${gameStatus.currentRow} boxred`;
      });
      // Save the failed word as asterisks. No help here.
      const yourWord = ['*', '*', '*', '*', '*'];
      savedWords[gameStatus.currentRow] = yourWord;
      saveJSON(savedWords, 'DWC-savedWords');
      // Reset the position of the 'cursor' and reset the current word. This essentially starts a new row.
      gameStatus.currentRow += 1;
      gameStatus.currentColumn = 0;
      saveJSON(gameStatus, 'DWC-gameStatus');
      currentWord = '';
    }

    if (gameStatus.currentRow > 5) {
      displayMessage('Haha, you have lost!', statusEl);
    }
  });
};

const displaySavedWords = (arrayLoop) => {
  const theRightWord = [
    winningWord.substring(0, 1),
    winningWord.substring(1, 2),
    winningWord.substring(2, 3),
    winningWord.substring(3, 4),
    winningWord.substring(4, 5),
  ];

  const dupeCheck = [0, 0, 0, 0, 0];

  // Green tile coloring code
  arrayLoop.forEach((letter, index) => {
    for (let x = 0; x < 5; x++) {
      if (letter[x] !== undefined) {
        rowArray[index][x].innerHTML = letter[x].toUpperCase();
        if (letter[x] === theRightWord[x]) {
          boxRowArray[index][
            x
          ].className = `boxrow${gameStatus.currentRow} boxgreen`;
          dupeCheck[x] += 1;
        } else {
          boxRowArray[index][
            x
          ].className = `boxrow${gameStatus.currentRow} boxred`;
        }
      }
    }
  });

  arrayLoop.forEach((letter, index) => {
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        if (dupeCheck[y] > 0) {
          continue;
        }
        if (letter[x] !== undefined) {
          console.log(`Checking ${letter[x]} against ${theRightWord[y]}`);
          if (letter[x] === theRightWord[y] && dupeCheck[y] === 0) {
            boxRowArray[index][
              x
            ].className = `boxrow${gameStatus.currentRow} boxyellow`;
            dupeCheck[y] += 1;
          }
        }
      }
    }
  });

  // Function ends here
};

const resetGameFunction = (val) => {
  if (val === 1) {
    gameStatus = {
      currentRow: 0,
      currentColumn: 0,
      currentWord: 0,
    };
  } else {
    gameStatus = {
      currentRow: 0,
      currentColumn: 0,
      currentWord: gameStatus.currentWord + 1,
    };
  }
  wordEl.innerHTML = `Word # ${gameStatus.currentWord}`;
  currentWord = '';
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
  winningWord = words[gameStatus.currentWord];
  location.reload();
};

const checkWord = (word) => {
  if (currentWord.length < 5) {
    throw new Error('Your word is too short!');
  }
};

const toggleWordsVisibility = () => {
  if (toggler === 0) {
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        rowArray[x][y].style.display = 'block';
      }
    }
    toggler = 1;
  } else {
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        rowArray[x][y].style.display = 'none';
      }
    }
    toggler = 0;
  }
};
