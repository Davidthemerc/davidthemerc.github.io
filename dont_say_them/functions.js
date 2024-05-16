// Random number function
// Accepts minimum and maximum number as parameters
const ranBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Function to save localstorage data
const saveJSON = (savedItem, savedName) => {
  localStorage.setItem(savedName, JSON.stringify(savedItem));
};

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

  // Load up game area elements
  loadWords();

  // Start timer
  startTimer(59);
};

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

const resetGame = () => {
  // Reset game: Clear game area, set score to 0
  wordDisplayEl.innerHTML = '';
  illegalWordsEl.innerHTML = '';
  gameStatus.started = 0;
  gameStatus.points = 0;
  timerEl.innerHTML = `Time: 01:00`;
  updateScore();

  // Clear timer interval
  clearInterval(interval);
};

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

const clearWordDisplay = () => {
  wordDisplayEl.innerHTML = '';
  illegalWordsEl.innerHTML = '';
};

const updateScore = () => {
  pointsEl.innerHTML = `Points: ${gameStatus.points}`;
  saveJSON(gameStatus, 'DST-gameData');
};

const loadWords = () => {
  const num = ranBetween(0, wordArray.length - 1);
  let selectedWord = wordArray[num].targetWord;

  // Load Target Word Display
  const theword = document.createElement('span');
  theword.className = 'theword';
  theword.textContent = `Word:`;
  const word = document.createElement('span');
  word.className = 'word';
  // selectedWord = selectedWord.charAt(0).toUpperCase() + selectedWord.slice(1);
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
    // thisIllegalWord =
    //   thisIllegalWord.charAt(0).toUpperCase() + thisIllegalWord.slice(1);
    p.textContent = thisIllegalWord;
    illegalWordsEl.appendChild(p);
  }
};

const timesUp = () => {
  // Update the score display
  updateScore();

  // Play the penalty buzzer audio
  playAudio(0);

  // Clear the word display
  clearWordDisplay();

  // Set game started status to 0
  gameStatus.started = 0;

  // Reset timer display
  timerEl.innerHTML = `Time: 01:00`;
};

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
