const statusEl = document.getElementById('status');
const wordEl = document.getElementById('worddisplay');
const quizEl = document.getElementById('quiz');
const resetButton = document.getElementById('reset');
const nextWordButton = document.getElementById('nextword');
let currentWord = '';
const row0 = document.getElementsByClassName('wordrow0');
const row1 = document.getElementsByClassName('wordrow1');
const row2 = document.getElementsByClassName('wordrow2');
const row3 = document.getElementsByClassName('wordrow3');
const row4 = document.getElementsByClassName('wordrow4');
const row5 = document.getElementsByClassName('wordrow5');
const boxRow0 = document.getElementsByClassName('boxrow0');
const boxRow1 = document.getElementsByClassName('boxrow1');
const boxRow2 = document.getElementsByClassName('boxrow2');
const boxRow3 = document.getElementsByClassName('boxrow3');
const boxRow4 = document.getElementsByClassName('boxrow4');
const boxRow5 = document.getElementsByClassName('boxrow5');
const keyboardKeys = document.getElementsByClassName('keyboardkey');
const rowArray = [];
const boxRowArray = [];
rowArray.push(Array.from(row0));
rowArray.push(Array.from(row1));
rowArray.push(Array.from(row2));
rowArray.push(Array.from(row3));
rowArray.push(Array.from(row4));
rowArray.push(Array.from(row5));
boxRowArray.push(Array.from(boxRow0));
boxRowArray.push(Array.from(boxRow1));
boxRowArray.push(Array.from(boxRow2));
boxRowArray.push(Array.from(boxRow3));
boxRowArray.push(Array.from(boxRow4));
boxRowArray.push(Array.from(boxRow5));

const buzzer = new Audio('assets/audio/buzzer.mp3');
const success = new Audio('assets/audio/success.mp3');
const keyboardArray = Array.from(keyboardKeys);

let gameStatus = loadGameStatus();
let savedWords = loadSavedWords();
let winningWord = words[gameStatus.currentWord];
wordEl.innerHTML = `Word # ${gameStatus.currentWord + 1}`;

displaySavedWords(savedWords);

// Add event listener for reset button
resetButton.addEventListener('click', () => {
  gameStatus = {
    currentRow: 0,
    currentColumn: 0,
    currentWord: 0,
  };
  wordEl.innerHTML = `Word # ${gameStatus.currentWord + 1}`;
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
  displayMessage('Game reset!', statusEl);
  setTimeout(() => {
    displayMessage('', statusEl);
  }, 2000);
});

nextWordButton.addEventListener('click', () => {
  // Confirm option temporarily disabled during development
  // let confirmAction = confirm(
  //   'Are you sure you want to proceed to the next word?'
  // );
  // if (confirmAction) {
  //   // Proceed to next word
  // } else {
  //   alert('Cancelled!');
  //   return;
  // }

  gameStatus = {
    currentRow: 0,
    currentColumn: 0,
    currentWord: gameStatus.currentWord + 1,
  };
  wordEl.innerHTML = `Word # ${gameStatus.currentWord + 1}`;
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
});

// Add event listeners for all keys on the virtual keyboard
keyboardArray.forEach((key) => {
  if (gameStatus.currentRow > 5) {
    return;
  }

  let keyValue;
  key.addEventListener('click', (e) => {
    keyValue = key.innerHTML;

    // If the html for the 'Enter' key is detected, submit the current word
    if (keyValue === '<i class="fa fa-play"></i>') {
      lookupWord(currentWord.toLowerCase());

      // Else, if the key is longer than 1 character, then it's backspace
    } else if (keyValue.length > 1) {
      deleteLetter();
      // The rest should be all the letter keys, so output the letter key
    } else {
      keyValue = key.innerHTML;
      try {
        enterLetter(keyValue);
      } catch (error) {
        displayMessage(error, statusEl);
      }
    }
  });
});
