// Random number function
// Accepts minimum and maximum number as parameters
const ranBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Game status localstorage function
const loadGameStatus = () => {
  return {
    currentRow: 0,
    currentColumn: 0,
  };
  //   const saveJSON = localStorage.getItem('DWC-gameStatus');

  //   if (saveJSON !== null) {
  //     return JSON.parse(saveJSON);
  //   } else {
  //     return {
  //       currentRow: 0,
  //       currentColumn: 0,
  //     };
  //   }
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
  if (gameStatus.currentColumn === 5) {
    throw new Error(`Stop! You've entered too many letters!`);
  }

  rowArray[gameStatus.currentRow][gameStatus.currentColumn].innerHTML = key;
  gameStatus.currentColumn += 1;
  currentWord += key;
  saveJSON(gameStatus, 'DWC-gameStatus');
};

const deleteLetter = () => {
  rowArray[gameStatus.currentRow][gameStatus.currentColumn - 1].innerHTML = '';
  gameStatus.currentColumn -= 1;
  currentWord = currentWord.substring(0, currentWord.length - 1);
};

const submitWord = (word) => {
  displayMessage('', statusEl);
  const one = word.substring(0, 1);
  const two = word.substring(1, 2);
  const three = word.substring(2, 3);
  const four = word.substring(3, 4);
  const five = word.substring(4, 5);

  console.log(`Submitting word ${word}`);

  if (words.indexOf(word) > -1) {
    console.log(`It's in there!`);
  }
  // We'll continue with the function
};
