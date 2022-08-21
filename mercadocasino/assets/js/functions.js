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
  messageEl.innerHTML = message;
};

const blackjackCreateCard = (element, who) => {
  // Pick a card, any card
  const pick = ranBetween(0, deckArray.length);

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

const blackjackCreateHiddenCard = (element, who) => {
  // Pick a card, any card
  const pick = ranBetween(0, deckArray.length);

  // Define card attributes and place in DOM
  const card = document.createElement('img');
  card.src = `assets/img/back.png`;
  card.className = 'playingcard';
  element.appendChild(card);

  // Assign card to their hand
  who === 'Dealer'
    ? dealerHand.push(deckArray[pick])
    : playerHand.push(deckArray[pick]);
};

const blackjackDrawCard = (who) => {
  if (who === 'Dealer') {
    blackjackCreateCard(dealerTrayEl, who);
    blackjackCreateHiddenCard(dealerTrayEl, who);
    dealerCounterEl.value = '???';
  } else {
    blackjackCreateCard(playerTrayEl, who);
    blackjackCreateCard(playerTrayEl, who);
    playerCounterEl.value = countHand('Player');
  }
};

// Function for blackjack, to deal the first cards
const blackjackDeal = () => {
  // Dealer drawing first...
  blackjackDrawCard('Dealer');
  blackjackDrawCard('Player');
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
