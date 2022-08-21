// Declare page elements needed for game
const dealerCounterEl = document.getElementById('dealercounter');
const dealerTrayEl = document.getElementById('dealertray');
const playerNameEl = document.getElementById('playername');
const playerMoneyEl = document.getElementById('playermoney');
const playerCounterEl = document.getElementById('playercounter');
const playerTrayEl = document.getElementById('playertray');

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

// Define dealer and player hands
let dealerHand = [];
let playerHand = [];

dealButton.addEventListener('click', () => {
  blackjackDeal();
});
