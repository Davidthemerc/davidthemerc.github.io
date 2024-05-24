// Variable definitions
const startButton = document.getElementById('startButton');
const successButton = document.getElementById('successButton');
const skipButton = document.getElementById('skipButton');
const penaltyButton = document.getElementById('penaltyButton');
const resetButton = document.getElementById('resetButton');
const pointsEl = document.getElementById('points');
const gameAreaEl = document.getElementById('gameArea');
const wordDisplayEl = document.getElementById('wordDisplay');
const illegalWordsEl = document.getElementById('illegalWords');
const gameStatus = retrieveGameStatus();
const timerEl = document.getElementById('timer');
let interval;
let timer;
let minutes, seconds;

// Update Saved Score
updateScore();

// Execute the refresh reset function to clear the game state on refresh
refreshReset();

// Button event listeners
// Start Button Event Listener
startButton.addEventListener('click', () => {
  if (gameStatus.started === 0) {
    startGame();
  } else {
    // Do nothing
  }
});

// Success Button Event Listener
successButton.addEventListener('click', () => {
  if (gameStatus.started === 1) {
    successFunction();
  } else {
    // Do nothing
  }
});

// Skip Button Event Listener
skipButton.addEventListener('click', () => {
  if (gameStatus.started === 1) {
    skipFunction();
  } else {
    // Do nothing
  }
});

// Penalty Button Event listener
penaltyButton.addEventListener('click', () => {
  if (gameStatus.started === 1) {
    penaltyFunction();
  } else {
    // Do nothing
  }
});

resetButton.addEventListener('click', () => {
  resetGame();
});
