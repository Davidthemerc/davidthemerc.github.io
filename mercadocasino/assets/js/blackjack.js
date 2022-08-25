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
