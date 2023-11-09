// Define page elements
const statusEl = document.getElementById('status');
const moneyEl = document.getElementById('money');
const revolverUpgradeButton = document.getElementById('revolver-upgrade');
const revolverAmmoButton = document.getElementById('revolver-ammo');
const shotgunBuyButton = document.getElementById('shotgun-buy');
const shotgunUpgradeButton = document.getElementById('shotgun-upgrade');
const shotgunAmmoButton = document.getElementById('shotgun-ammo');
const rifleBuyButton = document.getElementById('rifle-buy');
const rifleUpgradeButton = document.getElementById('rifle-upgrade');
const rifleAmmoButton = document.getElementById('rifle-ammo');
const laserBuyButton = document.getElementById('laser-buy');
const laserUpgradeButton = document.getElementById('laser-upgrade');
const laserAmmoButton = document.getElementById('laser-ammo');
const backToLodge = document.getElementById('backtolodge');

// Load hunter data
const hunter = loadHunter();

// Assign the hunter's money to the money element
moneyEl.innerHTML = `$${hunter.money.toFixed(2)}`;

// Load armory price colors
armoryPriceColors();

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

// Assign event listener to the rifle buy button
rifleBuyButton.addEventListener('click', () => {
  armoryHandling(3, 'buying');
});
// Assign event listener to the rifle upgrade button
rifleUpgradeButton.addEventListener('click', () => {
  armoryHandling(3, 'upgrade');
});

// Assign event listener to the rifle ammo button
rifleAmmoButton.addEventListener('click', () => {
  ammoHandling(3, 'buying');
});

// Assign event listener to the laser buy button
laserBuyButton.addEventListener('click', () => {
  armoryHandling(4, 'buying');
});
// Assign event listener to the laser upgrade button
laserUpgradeButton.addEventListener('click', () => {
  armoryHandling(4, 'upgrade');
});

// Assign event listener to the laser ammo button
laserAmmoButton.addEventListener('click', () => {
  ammoHandling(4, 'buying');
});

// Assign event listener to return to lodge button
// So the user can return to the main page
backToLodge.addEventListener('click', () => {
  location.assign('index.html');
});
