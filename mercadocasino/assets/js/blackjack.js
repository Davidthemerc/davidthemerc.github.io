// Declare page elements needed for game
const dealerCounterEl = document.getElementById('dealercounter');
const dealerTrayEl = document.getElementById('dealertray');
const playerNameEl = document.getElementById('playername');
const playerMoneyEl = document.getElementById('playermoney');
const playerBetEl = document.getElementById('playerbet');
const playerCounterEl = document.getElementById('playercounter');
const playerTrayEl = document.getElementById('playertray');
const player = getPlayer();

// Define player buttons
const dealButton = document.getElementById('dealbutton');
const clearButton = document.getElementById('clearbutton');
const betButton = document.getElementById('betbutton');
const betAmountEl = document.getElementById('betamount');
const rebetButton = document.getElementById('rebetbutton');
const hitButton = document.getElementById('hitbutton');
const stayButton = document.getElementById('staybutton');
const splitButton = document.getElementById('splitbutton');
const doubleDownButton = document.getElementById('doubledownbutton');

// Spades, Clubs, Hearts, Diamonds
// We'll use three decks in one to deter card counters
const deckArray = getBlackjackDeck();
saveJSON(deckArray, 'MC-blackjackDeck');

// Preload images
const cardImages = Array();
for (let i = 0; i <= 51; i++) {
  cardImages[i] = new Image(500, 726);
  cardImages[i].src = `assets/img/${i}.png`;
}

// Define dealer and player hands
let dealerHand = getDealerHand();
let playerHand = getPlayerHand();
let gameStatus = getGameStatus();

// Re-render game
reRenderGame();

// Update player name and money
playerNameEl.innerHTML = player.playerName;
playerMoneyEl.innerHTML = `$${player.playerMoney}`;
playerBetEl.innerHTML = `$${gameStatus.currentBet}`;

// Event listener for deal button
dealButton.addEventListener('click', () => {
  try {
    if (gameStatus.currentBet === 0) {
      throw new Error(`You have to place a bet!`);
    }
    blackjackDeal();
  } catch (error) {
    displayMessage(error);
  }
});

// Event listener for bet button
betButton.addEventListener('click', () => {
  try {
    if (gameStatus.gameStarted === 1) {
      throw new Error(`You can't change the bet during the game!`);
    }

    // Take the bet amount from the input
    let betAmount = betAmountEl.value;
    // If it's not acceptable, error out
    if (betAmount === undefined || betAmount === '') {
      displayMessage('The bet amount is INVALID!');
      return;
    }

    // Set the gamestatus object current bet to the bet amount
    gameStatus.currentBet = betAmount;
    // Display the bet message
    displayMessage(`${player.playerName} bets $${betAmount}.`);
    // Change the bet amount display
    playerBetEl.innerHTML = `$${betAmount}`;
    // Clear the bet input box
    betAmountEl.value = '';
  } catch (error) {
    displayMessage(error);
  }
});

// Event listener for clear bet button
clearButton.addEventListener('click', () => {
  try {
    if (gameStatus.gameStarted === 1) {
      throw new Error(`You can't clear the bet during the game!`);
    }
    gameStatus.currentBet = 0;
    playerBetEl.innerHTML = `$0`;
    displayMessage(`Bet cleared.`);
    saveJSON(gameStatus, 'MC-blackjackGameInfo');
  } catch (error) {
    displayMessage(error);
  }
});

// Event listener for re-bet button
rebetButton.addEventListener('click', () => {
  try {
    if (gameStatus.gameStarted === 1) {
      throw new Error(`You can't change the bet during the game!`);
    }
    if (gameStatus.currentBet === 0) {
      displayMessage('No previous bet to repeat.');
      return;
    }
    displayMessage(`${player.playerName} re-bets $${gameStatus.currentBet}.`);
  } catch (error) {
    displayMessage(error);
  }
});

// Proper hand counting with Ace handling
const countHandProper = (who) => {
  let count = 0;
  let aces = 0;
  let hand = who === 'Dealer' ? dealerHand : playerHand;

  hand.forEach((card) => {
    if (card.name.includes('Ace')) {
      aces++;
      count += 11;
    } else {
      count += card.value;
    }
  });

  // Adjust for aces if busting
  while (count > 21 && aces > 0) {
    count -= 10;
    aces--;
  }

  return count;
};

// Check if hand is a blackjack (21 with 2 cards)
const isBlackjack = (who) => {
  let hand = who === 'Dealer' ? dealerHand : playerHand;
  return hand.length === 2 && countHandProper(who) === 21;
};

// Draw a card for player
const playerHit = () => {
  try {
    if (gameStatus.gameStarted !== 1) {
      throw new Error('No game in progress!');
    }

    let playerCount = countHandProper('Player');
    if (playerCount > 21) {
      throw new Error('You have already busted!');
    }

    // Draw a card
    blackjackCreateCard(playerTrayEl, 'Player');
    playerCounterEl.value = countHandProper('Player');
    saveJSON(playerHand, 'MC-blackjackPlayerHand');

    // Check for bust
    if (countHandProper('Player') > 21) {
      displayMessage(
        `${player.playerName} busts with ${countHandProper('Player')}!`,
      );
      player.playerMoney -= parseInt(gameStatus.currentBet);
      playerMoneyEl.innerHTML = `$${player.playerMoney}`;
      saveJSON(player, 'MC-playerInfo');
      endGame();
    }
  } catch (error) {
    displayMessage(error);
  }
};

// Dealer plays out their hand
const dealerPlay = () => {
  // Reveal the dealer's hidden card (the second card with cardDir === 1)
  const hiddenCard = dealerHand[1];
  if (hiddenCard && hiddenCard.cardDir === 1) {
    hiddenCard.cardDir = 0;
    // Update the DOM - find the second card image and update it
    const dealerCards = dealerTrayEl.querySelectorAll('img');
    if (dealerCards.length > 1) {
      // Update the second card (the hidden one) to show the actual card
      dealerCards[1].src = `assets/img/${hiddenCard.cardID}.png`;
    }
  }

  let dealerCount = countHandProper('Dealer');
  dealerCounterEl.value = dealerCount;

  // Dealer must hit on 16 or less, stay on 17 or more
  while (dealerCount < 17) {
    blackjackCreateCard(dealerTrayEl, 'Dealer');
    dealerCount = countHandProper('Dealer');
    dealerCounterEl.value = dealerCount;
  }

  saveJSON(dealerHand, 'MC-blackjackDealerHand');
};

// Player stays - end their turn and let dealer play
const playerStay = () => {
  try {
    if (gameStatus.gameStarted !== 1) {
      throw new Error('No game in progress!');
    }

    displayMessage(
      `${player.playerName} stays with ${countHandProper('Player')}.`,
    );
    dealerPlay();
    determineWinner();
  } catch (error) {
    displayMessage(error);
  }
};

// Determine the winner
const determineWinner = () => {
  let playerCount = countHandProper('Player');
  let dealerCount = countHandProper('Dealer');

  // Check for dealer bust
  if (dealerCount > 21) {
    displayMessage(
      `Dealer busts with ${dealerCount}! ${player.playerName} wins $${gameStatus.currentBet * 2}!`,
    );
    player.playerMoney += parseInt(gameStatus.currentBet) * 2;
  }
  // Player bust (already handled in playerHit)
  else if (playerCount > 21) {
    displayMessage(`${player.playerName} busts! Dealer wins.`);
    player.playerMoney -= parseInt(gameStatus.currentBet);
  }
  // Both under 21 - compare
  else if (playerCount > dealerCount) {
    displayMessage(
      `${player.playerName} wins with ${playerCount} vs ${dealerCount}! Wins $${gameStatus.currentBet * 2}!`,
    );
    player.playerMoney += parseInt(gameStatus.currentBet) * 2;
  } else if (dealerCount > playerCount) {
    displayMessage(`Dealer wins with ${dealerCount} vs ${playerCount}!`);
    player.playerMoney -= parseInt(gameStatus.currentBet);
  } else {
    displayMessage(`Push! Both have ${playerCount}. Bet returned.`);
    player.playerMoney += parseInt(gameStatus.currentBet);
  }

  // Update display and save
  playerMoneyEl.innerHTML = `$${player.playerMoney}`;
  saveJSON(player, 'MC-playerInfo');
  endGame();
};

// End the game and reset for next round
const endGame = () => {
  gameStatus.gameStarted = 0;
  gameStatus.currentBet = 0;
  dealerHand = [];
  playerHand = [];

  saveJSON(gameStatus, 'MC-blackjackGameInfo');
  saveJSON(dealerHand, 'MC-blackjackDealerHand');
  saveJSON(playerHand, 'MC-blackjackPlayerHand');

  playerBetEl.innerHTML = `$0`;
  // Cards will be cleared when Deal button is clicked for next game
};

// Event listener for hit button
hitButton.addEventListener('click', () => {
  playerHit();
});

// Event listener for stay button
stayButton.addEventListener('click', () => {
  playerStay();
});

// Event listener for split button
splitButton.addEventListener('click', () => {
  try {
    displayMessage('Split feature coming soon!');
  } catch (error) {
    displayMessage(error);
  }
});

// Player double down - double bet, draw one card, then stay
const playerDoubleDown = () => {
  try {
    if (gameStatus.gameStarted !== 1) {
      throw new Error('No game in progress!');
    }

    // Can only double down on first two cards
    if (playerHand.length !== 2) {
      throw new Error('You can only double down on your first two cards!');
    }

    // Check if player has enough money
    const doubleBetAmount = parseInt(gameStatus.currentBet);
    if (player.playerMoney < doubleBetAmount) {
      throw new Error("You don't have enough money to double down!");
    }

    // Double the bet
    gameStatus.currentBet = doubleBetAmount * 2;
    player.playerMoney -= doubleBetAmount;
    playerBetEl.innerHTML = `$${gameStatus.currentBet}`;
    playerMoneyEl.innerHTML = `$${player.playerMoney}`;

    displayMessage(
      `${player.playerName} doubles down! Bet is now $${gameStatus.currentBet}.`,
    );

    // Draw one card and automatically stay
    blackjackCreateCard(playerTrayEl, 'Player');
    playerCounterEl.value = countHandProper('Player');
    saveJSON(playerHand, 'MC-blackjackPlayerHand');

    // Check for bust
    if (countHandProper('Player') > 21) {
      displayMessage(
        `${player.playerName} busts with ${countHandProper('Player')}!`,
      );
      player.playerMoney -= parseInt(gameStatus.currentBet);
      playerMoneyEl.innerHTML = `$${player.playerMoney}`;
      saveJSON(player, 'MC-playerInfo');
      endGame();
    } else {
      // Auto stay after double down
      displayMessage(
        `${player.playerName} stays with ${countHandProper('Player')}.`,
      );
      dealerPlay();
      determineWinner();
    }
  } catch (error) {
    displayMessage(error);
  }
};

// Event listener for double down button
doubleDownButton.addEventListener('click', () => {
  playerDoubleDown();
});
