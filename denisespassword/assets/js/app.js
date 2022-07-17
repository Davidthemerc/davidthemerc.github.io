const scoreEl = document.getElementById('score');
const newWord = document.getElementById('newword');
const goodGuessButton = document.getElementById('guessedword');
const resetButton = document.getElementById('resetscore');
const passwordEl = document.getElementById('password');
const definitionEl = document.getElementById('definition');
const penaltyButton = document.getElementById('penalty');
const hideButton = document.getElementById('hide');
const main = document.getElementById('main');
const buzzer = new Audio('assets/audio/buzzer.mp3');
const success = new Audio('assets/audio/success.mp3');
let score = retrieveScore();
let currentWord;

retrieveWord();
lookupWord(currentWord);
displayScore();

newWord.addEventListener('click', () => {
  newPassword();
});

goodGuessButton.addEventListener('click', () => {
  chgScore(1);
  success.play();
  newPassword();
});

resetButton.addEventListener('click', () => {
  resetScore();
  newPassword();
});

penaltyButton.addEventListener('click', () => {
  buzzer.play();
  chgScore(-1);
  newPassword();
});

hideButton.addEventListener('click', () => {
  hideStuff();
});
