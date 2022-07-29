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

  const theRightWord = [
    winningWord.substring(0, 1),
    winningWord.substring(1, 2),
    winningWord.substring(2, 3),
    winningWord.substring(3, 4),
    winningWord.substring(4, 5),
  ];

  yourWord.forEach((checkedLetter, index) => {
    if (checkedLetter === theRightWord[index]) {
      boxRowArray[gameStatus.currentRow][
        index
      ].className = `boxrow${gameStatus.currentRow} boxgreen`;
    } else if (theRightWord.indexOf(checkedLetter) > -1) {
      boxRowArray[gameStatus.currentRow][
        index
      ].className = `boxrow${gameStatus.currentRow} boxyellow`;
    }
  });

  // yourWord.forEach((checkedLetter) => {
  //   theRightWord.forEach((letter) => {
  //     if (checkedLetter === letter) {
  //       // Green tile!
  //       console.log(`${checkedLetter} matches ${letter}! Green tile!`);
  //     } else if (theRightWord.indexOf(checkedLetter) > -1) {
  //       console.log(
  //         `${checkedLetter} isn't located this spot but it is located at spot ${
  //           theRightWord.indexOf(checkedLetter) + 1
  //         }. Yellow tile!`
  //       );
  //     }
  //   });
  // });
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

// This is where I have currently left off.
// This is where I have currently left off.
// This is where I have currently left off.
// This is where I have currently left off.
// This is where I have currently left off.
const definitionsDOM = (definition, bword, rightDefinedWord) => {
  const div = document.createElement('div');
  const paragraph = document.createElement('li');
  const button = document.createElement('button');
  button.textContent = 'Select';
  button.className = 'selectbutton';
  paragraph.textContent = `Definition: ${definition[0].meanings[0].definitions[0].definition} `;
  paragraph.className = 'definition';
  div.appendChild(paragraph);
  div.appendChild(button);
  quizEl.appendChild(div);

  button.addEventListener('click', () => {
    if (bword === rightDefinedWord) {
      if (bword === winningWord) {
        displayMessage('SUPER! You guessed the word!', statusEl);
        success.play();
        submitWord(bword);
        gameStatus.currentRow = 6;
        saveJSON(gameStatus, 'DWC-gameStatus');
        quizEl.innerHTML = '';
        return;
      } else {
        miss.play();
        displayMessage('Great, but you did not guess the word.', statusEl);

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
      // Place the punishment tiles
      buzzer.play();
      boxRowArray[gameStatus.currentRow].forEach((tile) => {
        tile.className = `boxrow${gameStatus.currentRow} boxred`;
      });
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
