// Define page elements
const statusEl = document.getElementById('status');
const moneyEl = document.getElementById('money');
const revolverUpgradeButton = document.getElementById('revolver-upgrade');
const revolverAmmoButton = document.getElementById('revolver-ammo');
const shotgunBuyButton = document.getElementById('shotgun-buy');
const shotgunUpgradeButton = document.getElementById('shotgun-upgrade');
const shotgunAmmoButton = document.getElementById('shotgun-ammo');
const backToLodge = document.getElementById('backtolodge');

// Load hunter data
const hunter = loadHunter();

// Assign the hunter's money to the money element
moneyEl.innerHTML = `$${hunter.money.toFixed(2)}`;

// Assign event listener to the revolver upgrade button
revolverUpgradeButton.addEventListener('click', () => {
  armoryHandling(1, 'upgrade');
});

// Assign event listener to the revolver ammo button
revolverAmmoButton.addEventListener('click', () => {
  ammoHandling(1, 'buying');
});

// Assign event listener to the shotgun buy button
shotgunBuyButton.addEventListener('click', () => {
  armoryHandling(2, 'buying');
});
// Assign event listener to the shotgun upgrade button
shotgunUpgradeButton.addEventListener('click', () => {
  armoryHandling(2, 'upgrade');
});

// Assign event listener to the shotgun ammo button
shotgunAmmoButton.addEventListener('click', () => {
  ammoHandling(2, 'buying');
});

// Assign event listener to return to lodge button
// So the user can return to the main page
backToLodge.addEventListener('click', () => {
  location.assign('index.html');
});
