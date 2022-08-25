const statusEl = document.getElementById('status');
const playerNameEl = document.getElementById('playername');
const playerMoneyEl = document.getElementById('playermoney');
const returnToGameButton = document.getElementById('returntogame');
const player = getPlayer();

// Show player name and money
playerNameEl.value = player.playerName;
playerMoneyEl.value = `${player.playerMoney}`;

returnToGameButton.addEventListener('click', (e) => {
  history.back();
});

playerNameEl.addEventListener('change', (e) => {
  player.playerName = e.target.value;
  displayMessage(`Updated Player Name to "${e.target.value}".`, statusEl);
  saveJSON(player, 'MC-playerInfo');
});

playerMoneyEl.addEventListener('change', (e) => {
  player.playerMoney = e.target.value;
  displayMessage(`Updated Player Money to $${e.target.value}.`, statusEl);
  saveJSON(player, 'MC-playerInfo');
});
