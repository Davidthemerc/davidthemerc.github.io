'use strict';

// Shuffle the deck array so that we'll get a random, non-repeating set
let shuffle = (array) => {
  let i = array.length,
    j = 0,
    temp;

  while (i--) {
    j = Math.floor(Math.random() * (i + 1));

    // swap randomly chosen element with current element
    temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }

  return array;
};

// Function to draw the 'El Gallo' image as the default image
let initialSetup = () => {
  let defaultImage = imageList[0];
  cardArea.appendChild(defaultImage);
};

// Function to start the game
let startOff = () => {
  try {
    if (shuffledDeck.length < 54) {
      throw new Error('The game has already started!');
    }
    saveJSON(shuffledDeck, 'loteriaDeck');
    // Call the Calling function
    calling();
  } catch (error) {
    errorDeclare(error);
  }
};

// Function to repeat the currently shown card
let repeatCall = () => {
  try {
    if (shuffledDeck.length === 54) {
      throw new Error(`You haven't started the game yet!`);
    }
    if (shuffledDeck.length === 0) {
      throw new Error(`All cards have been called! Please reset the game!`);
    }
    let messages = [];
    errorDeclare(messages);
    audioList[currentCard.ID + 1].play();
  } catch (error) {
    errorDeclare(error);
  }
};

// Function to call the next card, once the game has started
let callCard = () => {
  try {
    if (shuffledDeck.length === 0) {
      throw new Error(`All cards have been called! Please reset the game!`);
    }
    if (shuffledDeck.length === 54) {
      throw new Error(`You haven't started the game yet!`);
    }
    // Call the Calling function
    calling();
  } catch (error) {
    errorDeclare(error);
  }
};

let errorDeclare = (message) => {
  let messages = [];
  messages.push(message);
  errorMessageDiv.innerHTML = messages.join(' ');
};

// Contains code common to both the 'callCard' and 'startOff' functions
let calling = () => {
  count += 1;
  saveJSON(count, 'count');
  let messages = [];
  errorDeclare(messages);
  currentCard = shuffledDeck[0];
  cardArea.innerHTML = '';
  cardArea.appendChild(imageList[currentCard.ID]);
  audioList[currentCard.ID + 1].play();
  const span = document.createElement('span');
  span.textContent = `${count}. ${currentCard.Name} `;
  span.className = 'rocks';
  calledCardsDiv.appendChild(span);
  savedCalls.push(span.textContent);
  saveJSON(savedCalls, 'savedCalls');
  shuffledDeck.splice(0, 1);
  saveJSON(shuffledDeck, 'loteriaDeck');
};

let getJSON = (savedName) => {
  const saveJSON = localStorage.getItem(savedName);

  if (savedName === 'loteriaDeck') {
    if (saveJSON !== null) {
      return JSON.parse(saveJSON);
    } else {
      return shuffle(loteriaDeckArray);
    }
  } else if (savedName === 'count') {
    if (saveJSON !== null) {
      return parseInt(JSON.parse(saveJSON));
    } else {
      return 0;
    }
  } else {
    if (saveJSON !== null) {
      return JSON.parse(saveJSON);
    } else {
      return [];
    }
  }
};

let saveJSON = (savedItem, savedName) => {
  localStorage.setItem(savedName, JSON.stringify(savedItem));
};

let resetGame = () => {
  let confirmAction = confirm(`Are you sure you want to reset the game?`);
  if (confirmAction) {
    localStorage.removeItem('loteriaDeck');
    localStorage.removeItem('savedCalls');
    localStorage.removeItem('count');
    location.reload();
  } else {
    alert(`The game was not reset.`);
  }
};

let showCalledCards = () => {
  savedCalls.forEach((item) => {
    const span = document.createElement('span');
    span.textContent = item;
    span.className = 'rocks';
    calledCardsDiv.appendChild(span);
  });
};
