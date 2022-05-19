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

let initialSetup = () => {
  let defaultImage = imageList[0];
  cardArea.appendChild(defaultImage);
};

let startOff = () => {
  try {
    if (shuffledDeck.length < 54) {
      throw new Error('The game has already started!');
    }
    let messages = [];
    errorDeclare(messages);
    currentCard = shuffledDeck[0];
    console.log(`Current Card:${currentCard.Name}`);
    audioList[currentCard.ID + 1].play();
    const paragraph = document.createElement('span');
    paragraph.textContent = `${currentCard.Name} `;
    paragraph.className = 'rocks';
    calledCardsDiv.appendChild(paragraph);
    shuffledDeck.splice(0, 1);
  } catch (error) {
    errorDeclare(error);
  }
};

let repeatCall = () => {
  try {
    if (shuffledDeck.length === 54) {
      throw new Error(`You haven't started the game yet!`);
    }
    let messages = [];
    errorDeclare(messages);
    console.log(`Current Card:${currentCard.Name}`);
    audioList[currentCard.ID + 1].play();
  } catch (error) {
    errorDeclare(error);
  }
};

let callCard = () => {
  try {
    if (!shuffledDeck.length > 0) {
      throw new Error('The deck is empty!');
    }
    if (shuffledDeck.length === 54) {
      throw new Error(`You haven't started the game yet!`);
    }
    let messages = [];
    errorDeclare(messages);
    currentCard = shuffledDeck[0];
    console.log(`Current Card:${currentCard.Name}`);
    audioList[currentCard.ID + 1].play();
    const paragraph = document.createElement('span');
    paragraph.textContent = `${currentCard.Name} `;
    paragraph.className = 'rocks';
    calledCardsDiv.appendChild(paragraph);
    shuffledDeck.splice(0, 1);
  } catch (error) {
    errorDeclare(error);
  }
};

let errorDeclare = (message) => {
  let messages = [];
  messages.push(message);
  errorMessageDiv.innerHTML = messages.join(' ');
};
