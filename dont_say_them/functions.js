// Random number function
// Accepts minimum and maximum number as parameters
const ranBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Function to save localstorage data
const saveJSON = (savedItem, savedName) => {
  localStorage.setItem(savedName, JSON.stringify(savedItem));
};

// Function to retrieve game status from local storage
const retrieveGameStatus = () => {
  const saveJSON = localStorage.getItem('DST-gameData');

  // If there's saved data, pull it from localstorage
  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  }
  // If there isn't saved data, or if it is null, initialize new data
  else return defaultGameStatus;
};

const playAudio = (audioIndex) => {
  audioList[audioIndex].play();
};

// Start Game Function
const startGame = () => {
  // Set Game Status to Started
  gameStatus.started = 1;
  updateScore();

  // Clear word display
  clearWordDisplay();

  // Load up game area elements
  loadWords();

  // Start timer
  startTimer(59);
};

// Function to run when success button is used
const successFunction = () => {
  // Add a point
  gameStatus.points += 1;

  // Update the points display
  updateScore();

  // Play the success audio
  playAudio(1);

  // Clear the word display
  clearWordDisplay();

  // Update word display with new words
  loadWords();
};

// Function to run when penalty button is used
const penaltyFunction = () => {
  // Penalty function, of course
  // Let's lose a point, after all this is a penalty
  if (gameStatus.points > 0) {
    gameStatus.points -= 1;
  } else {
    gameStatus.points = 0;
  }

  // Run times up function
  timesUp();

  // Clear timer interval
  clearInterval(interval);
};

// Function to run when reset button is used
const resetGame = () => {
  // Reset game: Clear game area, set score to 0
  wordDisplayEl.innerHTML = '';
  illegalWordsEl.innerHTML = '';
  gameStatus.started = 0;
  gameStatus.points = 0;
  timerEl.innerHTML = `Time: 01:00`;
  updateScore();

  // Clear active timer interval
  clearInterval(interval);
};

// Function to run when the user refreshes the page - specifically, when the page is loaded into the browser
// We don't want the game to keep running if refreshed - this can cause an error state
// Technically, this should result in a penalty, but we'll leave it to users to enforce
const refreshReset = () => {
  // Reset game: Clear game area, set score to 0
  wordDisplayEl.innerHTML = '';
  illegalWordsEl.innerHTML = '';
  gameStatus.started = 0;
  timerEl.innerHTML = `Time: 01:00`;
  updateScore();

  // Clear timer interval
  clearInterval(interval);
};

// Function to run when clearing word display
const clearWordDisplay = () => {
  wordDisplayEl.innerHTML = '';
  illegalWordsEl.innerHTML = '';
};

// Function to run when updating score
const updateScore = () => {
  pointsEl.innerHTML = `Points: ${gameStatus.points}`;
  saveJSON(gameStatus, 'DST-gameData');
};

// Function to load words (target and illegal) into the word display
const loadWords = () => {
  const num = ranBetween(0, wordArray.length - 1);
  let selectedWord = wordArray[num].targetWord;

  // Load Target Word Display
  const theword = document.createElement('span');
  theword.className = 'theword';
  theword.textContent = `Word:`;
  const word = document.createElement('span');
  word.className = 'word';
  word.textContent = ` ${selectedWord}`;
  wordDisplayEl.appendChild(theword);
  wordDisplayEl.appendChild(word);

  // Load Illegal Words Display
  const dontTitle = document.createElement('p');
  dontTitle.className = `donttitle`;
  dontTitle.textContent = `Illegal Words:`;
  illegalWordsEl.appendChild(dontTitle);

  // Load illegal words
  for (let i = 0; i < 4; i++) {
    let thisIllegalWord = wordArray[num].illegalWords[i];
    let p = document.createElement('p');
    p.className = 'dontsay';
    p.textContent = thisIllegalWord;
    illegalWordsEl.appendChild(p);
  }

  // Let's do a 1/15 chance that all words are banned! Charades only!
  let charadesChance = ranBetween(0, 15);

  // Good luck with the Charades lol
  if (charadesChance === 15) {
    illegalWordsEl.innerHTML = '';
    const charades = document.createElement('p');
    charades.className = 'donttitle';
    charades.textContent = 'All words are illegal! Charades only!';
    illegalWordsEl.appendChild(charades);
  }
};

// Function to run when time is up
const timesUp = () => {
  // Update the score display
  updateScore();

  // Play the penalty buzzer audio
  playAudio(0);

  // Update - Don't clear the word display - we want the user to show the word
  // clearWordDisplay();

  // Clear active interval
  clearInterval(interval);

  // Set game started status to 0
  gameStatus.started = 0;

  // Reset timer display
  timerEl.innerHTML = `Time: 01:00`;
};

// Function to start the countdown timer. Default is 1 minute.
const startTimer = (duration) => {
  let timer = duration,
    minutes,
    seconds;
  interval = setInterval(() => {
    minutes = parseInt(timer / 60, 10);
    seconds = parseInt(timer % 60, 10);

    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    timerEl.textContent = `Time: ${minutes + ':' + seconds}`;

    if (--timer < 0) {
      clearInterval(interval);
      timesUp();
    }
  }, 1000);
};
