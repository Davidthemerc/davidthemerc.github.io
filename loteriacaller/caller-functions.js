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
// Unless if there is a card stored, then use that instead
let initialSetup = () => {
  if (currentCard.ID) {
    let defaultImage = imageList[currentCard.ID];
    cardArea.appendChild(defaultImage);
  } else {
    let defaultImage = imageList[0];
    cardArea.appendChild(defaultImage);
  }
};

// Function to start the game
let startOff = () => {
  let message = '';
  location.href.includes('espanol.html')
    ? (message = 'El juego ya empecé!')
    : (message = 'The game has already started!');
  try {
    if (shuffledDeck.length < 54) {
      throw new Error(message);
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
      let message = '';
      location.href.includes('espanol.html')
        ? (message = '¡Todavía no has empezado el juego!')
        : (message = `You haven't started the game yet!`);
      throw new Error(message);
    }
    if (shuffledDeck.length === 0) {
      let message = '';
      location.href.includes('espanol.html')
        ? (message = '¡Todas las cartas han sido pagadas! ¡Reinicia el juego!')
        : (message = 'All cards have been called! Please reset the game!');
      throw new Error(message);
    }
    let messages = [];
    errorDeclare(messages);
    audioPlay(currentCard.ID + 1);
  } catch (error) {
    errorDeclare(error);
  }
};

// Function to call the next card, once the game has started
let callCard = () => {
  try {
    if (shuffledDeck.length === 0) {
      let message = '';
      location.href.includes('espanol.html')
        ? (message = '¡Todas las cartas han sido pagadas! ¡Reinicia el juego!')
        : (message = 'All cards have been called! Please reset the game!');
      throw new Error(message);
    }
    if (shuffledDeck.length === 54) {
      let message = '';
      location.href.includes('espanol.html')
        ? (message = '¡Todavía no has empezado el juego!')
        : (message = `You haven't started the game yet!`);
      throw new Error(message);
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
  setTimeout(() => {
    errorMessageDiv.innerHTML = '';
  }, 3000);
};

// Contains code common to both the 'callCard' and 'startOff' functions
let calling = () => {
  count += 1;
  saveJSON(count, 'count');
  let messages = [];
  errorDeclare(messages);
  currentCard = shuffledDeck[0];
  saveJSON(currentCard, 'currentCard');
  cardArea.innerHTML = '';
  cardArea.appendChild(imageList[currentCard.ID]);
  audioPlay(currentCard.ID + 1);
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
  } else if (savedName === 'currentCard') {
    if (saveJSON !== null) {
      return JSON.parse(saveJSON);
    } else {
      return {};
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
  let message = '';
  let message2 = '';
  location.href.includes('espanol.html')
    ? (message = '¿Estás seguro de que quieres reiniciar el juego?')
    : (message = `Are you sure you want to reset the game?`);
  location.href.includes('espanol.html')
    ? (message2 = 'El juego no fue reiniciado.')
    : (message2 = 'The game was not reset.');
  let confirmAction = confirm(message);
  if (confirmAction) {
    localStorage.removeItem('loteriaDeck');
    localStorage.removeItem('savedCalls');
    localStorage.removeItem('count');
    localStorage.removeItem('currentCard');
    location.reload();
  } else {
    alert(message2);
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

const audioPlay = (ID) => {
  if (voiceValue === '0') {
    femaleAudioList[ID].play();
  } else if (voiceValue === '1') {
    maleAudioList[ID].play();
  } else if (voiceValue === '2') {
    cesarAudioList[ID].play();
  } else if (voiceValue === '3') {
    marcelaAudioList[ID].play();
  }
};
