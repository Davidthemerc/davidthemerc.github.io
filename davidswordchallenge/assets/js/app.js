const statusEl = document.getElementById('status');
let currentWord = '';
const row0 = document.getElementsByClassName('wordrow0');
const row1 = document.getElementsByClassName('wordrow1');
const row2 = document.getElementsByClassName('wordrow2');
const row3 = document.getElementsByClassName('wordrow3');
const row4 = document.getElementsByClassName('wordrow4');
const row5 = document.getElementsByClassName('wordrow5');
const keyboardKeys = document.getElementsByClassName('keyboardkey');
const rowArray = [];
rowArray.push(Array.from(row0));
rowArray.push(Array.from(row1));
rowArray.push(Array.from(row2));
rowArray.push(Array.from(row3));
rowArray.push(Array.from(row4));
rowArray.push(Array.from(row5));

const keyboardArray = Array.from(keyboardKeys);

const gameStatus = loadGameStatus();

// Add event listeners for all keys on the virtual keyboard
keyboardArray.forEach((key) => {
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
