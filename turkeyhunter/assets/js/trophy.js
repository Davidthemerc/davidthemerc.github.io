// Define page elements
const moneyEl = document.getElementById('money');
const trophyCaseEl = document.getElementById('trophycase');
const backToLodge = document.getElementById('backtolodge');

// Load hunter data
hunter = loadHunter();

// Trophy Case Function
trophyCase();

// Assign event listener to return to lodge button
// So the user can return to the main page
backToLodge.addEventListener('click', () => {
  location.assign('index.html');
});
