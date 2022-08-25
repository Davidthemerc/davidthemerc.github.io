const getBlackjackDeck = () => {
  const deck = localStorage.getItem('MC-blackjackDeck');

  if (deck !== null) {
    return JSON.parse(deck);
  } else
    return [
      // Deck One
      { name: 'Two of Spades', value: 2, cardID: 0, cardDir: 0 },
      { name: 'Two of Clubs', value: 2, cardID: 1, cardDir: 0 },
      { name: 'Two of Hearts', value: 2, cardID: 2, cardDir: 0 },
      { name: 'Two of Diamonds', value: 2, cardID: 3, cardDir: 0 },
      { name: 'Three of Spades', value: 3, cardID: 4, cardDir: 0 },
      { name: 'Three of Clubs', value: 3, cardID: 5, cardDir: 0 },
      { name: 'Three of Hearts', value: 3, cardID: 6, cardDir: 0 },
      { name: 'Three of Diamonds', value: 3, cardID: 7, cardDir: 0 },
      { name: 'Four of Spades', value: 4, cardID: 8, cardDir: 0 },
      { name: 'Four of Clubs', value: 4, cardID: 9, cardDir: 0 },
      { name: 'Four of Hearts', value: 4, cardID: 10, cardDir: 0 },
      { name: 'Four of Diamonds', value: 4, cardID: 11, cardDir: 0 },
      { name: 'Five of Spades', value: 5, cardID: 12, cardDir: 0 },
      { name: 'Five of Clubs', value: 5, cardID: 13, cardDir: 0 },
      { name: 'Five of Hearts', value: 5, cardID: 14, cardDir: 0 },
      { name: 'Five of Diamonds', value: 5, cardID: 15, cardDir: 0 },
      { name: 'Six of Spades', value: 6, cardID: 16, cardDir: 0 },
      { name: 'Six of Clubs', value: 6, cardID: 17, cardDir: 0 },
      { name: 'Six of Hearts', value: 6, cardID: 18, cardDir: 0 },
      { name: 'Six of Diamonds', value: 6, cardID: 19, cardDir: 0 },
      { name: 'Seven of Spades', value: 7, cardID: 20, cardDir: 0 },
      { name: 'Seven of Clubs', value: 7, cardID: 21, cardDir: 0 },
      { name: 'Seven of Hearts', value: 7, cardID: 22, cardDir: 0 },
      { name: 'Seven of Diamonds', value: 7, cardID: 23, cardDir: 0 },
      { name: 'Eight of Spades', value: 8, cardID: 24, cardDir: 0 },
      { name: 'Eight of Clubs', value: 8, cardID: 25, cardDir: 0 },
      { name: 'Eight of Hearts', value: 8, cardID: 26, cardDir: 0 },
      { name: 'Eight of Diamonds', value: 8, cardID: 27, cardDir: 0 },
      { name: 'Nine of Spades', value: 9, cardID: 28, cardDir: 0 },
      { name: 'Nine of Clubs', value: 9, cardID: 29, cardDir: 0 },
      { name: 'Nine of Hearts', value: 9, cardID: 30, cardDir: 0 },
      { name: 'Nine of Diamonds', value: 9, cardID: 31, cardDir: 0 },
      { name: 'Ten of Spades', value: 10, cardID: 32, cardDir: 0 },
      { name: 'Ten of Clubs', value: 10, cardID: 33, cardDir: 0 },
      { name: 'Ten of Hearts', value: 10, cardID: 34, cardDir: 0 },
      { name: 'Ten of Diamonds', value: 10, cardID: 35, cardDir: 0 },
      { name: 'Jack of Spades', value: 10, cardID: 36, cardDir: 0 },
      { name: 'Jack of Clubs', value: 10, cardID: 37, cardDir: 0 },
      { name: 'Jack of Hearts', value: 10, cardID: 38, cardDir: 0 },
      { name: 'Jack of Diamonds', value: 10, cardID: 39, cardDir: 0 },
      { name: 'Queen of Spades', value: 10, cardID: 40, cardDir: 0 },
      { name: 'Queen of Clubs', value: 10, cardID: 41, cardDir: 0 },
      { name: 'Queen of Hearts', value: 10, cardID: 42, cardDir: 0 },
      { name: 'Queen of Diamonds', value: 10, cardID: 43, cardDir: 0 },
      { name: 'King of Spades', value: 10, cardID: 44, cardDir: 0 },
      { name: 'King of Clubs', value: 10, cardID: 45, cardDir: 0 },
      { name: 'King of Hearts', value: 10, cardID: 46, cardDir: 0 },
      { name: 'King of Diamonds', value: 10, cardID: 47, cardDir: 0 },
      { name: 'Ace of Spades', value: 11, cardID: 48, cardDir: 0 },
      { name: 'Ace of Clubs', value: 11, cardID: 49, cardDir: 0 },
      { name: 'Ace of Hearts', value: 11, cardID: 50, cardDir: 0 },
      { name: 'Ace of Diamonds', value: 11, cardID: 51, cardDir: 0 },
    ];
};

const getPlayer = () => {
  const saveJSON = localStorage.getItem('MC-playerInfo');

  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else
    return {
      playerName: 'Player',
      playerMoney: 1000,
    };
};

const getDealerHand = () => {
  const saveJSON = localStorage.getItem('MC-blackjackDealerHand');

  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else return [];
};

const getPlayerHand = () => {
  const saveJSON = localStorage.getItem('MC-blackjackPlayerHand');

  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else return [];
};

const reRenderGame = () => {
  // We'll need some kind of value stored with each of the dealer's cards
  // to identify if the card is one of the dealer's cards, so when the player
  // reloads the page, the card won't just be instantly revealed.
  dealerCounterEl.value = '???';
  playerCounterEl.value = countHand('Player');
  dealerHand.forEach((card) => {
    if (card.cardDir === 0) {
      blackjackCreateCard(dealerTrayEl, 'Dealer', card.cardID);
    } else {
      blackjackCreateHiddenCard(dealerTrayEl, 'Dealer', card.cardID);
    }
  });
  playerHand.forEach((card) => {
    blackjackCreateCard(playerTrayEl, 'Player', card.cardID);
  });
};

const getGameStatus = () => {
  const saveJSON = localStorage.getItem('MC-blackjackGameInfo');
  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else
    return {
      gameStarted: 0,
      currentBet: 0,
      busted: 0,
    };
};

const shuffle = (array) => {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

// Random number function
// Accepts minimum and maximum number as parameters
const ranBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

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
  if (messageEl === undefined || messageEl === null) {
    statusEl.innerHTML = message;
    setTimeout(() => {
      statusEl.innerHTML = '';
    }, 3000);
    return;
  }

  messageEl.innerHTML = message;
  setTimeout(() => {
    statusEl.innerHTML = '';
  }, 3000);
};

const blackjackCreateCard = (element, who, cardID) => {
  // Pick a card, any card, unless we specifically choose one
  let pick;
  cardID === undefined
    ? (pick = ranBetween(0, deckArray.length))
    : (pick = cardID);

  // Define card attributes and place in DOM
  const card = document.createElement('img');
  card.src = cardImages[deckArray[pick].cardID].src;
  card.className = 'playingcard';
  element.appendChild(card);

  // Assign card to their hand
  who === 'Dealer'
    ? dealerHand.push(deckArray[pick])
    : playerHand.push(deckArray[pick]);
};

const blackjackCreateHiddenCard = (element, who, cardID) => {
  // Pick a card, any card, unless we specifically choose one
  let pick;
  cardID === undefined
    ? (pick = ranBetween(0, deckArray.length))
    : (pick = cardID);

  // Define card attributes and place in DOM
  const card = document.createElement('img');
  card.src = `assets/img/back.png`;
  card.className = 'playingcard';
  element.appendChild(card);

  deckArray[pick].cardDir = 1;

  // Assign card to their hand
  who === 'Dealer'
    ? dealerHand.push(deckArray[pick])
    : playerHand.push(deckArray[pick]);
};

const blackjackFirstDraw = (who) => {
  if (who === 'Dealer') {
    blackjackCreateCard(dealerTrayEl, who);
    blackjackCreateHiddenCard(dealerTrayEl, who);
    dealerCounterEl.value = '???';
    saveJSON(dealerHand, 'MC-blackjackDealerHand');
  } else {
    blackjackCreateCard(playerTrayEl, who);
    blackjackCreateCard(playerTrayEl, who);
    playerCounterEl.value = countHand('Player');
    saveJSON(playerHand, 'MC-blackjackPlayerHand');
  }
};

// Function for blackjack, to deal the first cards
const blackjackDeal = () => {
  try {
    if (gameStatus.gameStarted === 1) {
      throw new Error('A game is already in progress!');
    } else {
      // Rest of function
      // Set game status to started
      gameStatus.gameStarted = 1;
      saveJSON(gameStatus, 'MC-blackjackGameInfo');
      // Dealer drawing first...
      blackjackFirstDraw('Dealer');
      blackjackFirstDraw('Player');
    }
  } catch (error) {
    displayMessage(error, statusEl);
  }
};

const countHand = (who) => {
  let count = 0;
  if (who === 'Dealer') {
    dealerHand.forEach((card) => {
      count += card.value;
    });
  } else {
    playerHand.forEach((card) => {
      count += card.value;
    });
  }
  return count;
};
