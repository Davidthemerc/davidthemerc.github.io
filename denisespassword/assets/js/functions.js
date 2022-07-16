const newPassword = async () => {
  currentWord = words[ranBetween(1, words.length)];
  displayWord(currentWord);
  saveWord(currentWord);
  lookupWord(currentWord);
};

// Random number function
// Accepts minimum and maximum number as parameters
const ranBetween = function randomNumbersBetweenMinAndMax(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Check for locally saved data
const retrieveWord = () => {
  const resultsJSON = localStorage.getItem('DP-word');

  if (resultsJSON !== null) {
    return displayWord(JSON.parse(resultsJSON));
  } else {
    return newPassword();
  }
};

// Save results to local storage
const saveWord = (word) => {
  localStorage.setItem('DP-word', JSON.stringify(word));
};

const displayWord = (text) => {
  passwordEl.innerHTML = text;
  currentWord = text;
};

const chgScore = (chg) => {
  score += chg;
  saveScore();
};

const resetScore = () => {
  score = 0;
  saveScore();
};

const saveScore = () => {
  localStorage.setItem('DP-1-score', JSON.stringify(score));
  displayScore();
};

const displayScore = () => {
  scoreEl.innerHTML = `${retrieveScore()} Points`;
};

const retrieveScore = () => {
  const score = localStorage.getItem('DP-1-score');

  if (score !== null) {
    return JSON.parse(score);
  } else {
    return 0;
  }
};
