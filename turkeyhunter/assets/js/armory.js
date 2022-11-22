// Define page elements
const revolverUpgradeButton = document.getElementById('revolver-upgrade');
const revolverAmmoButton = document.getElementById('revolver-ammo');
const moneyEl = document.getElementById('money');
const backToLodge = document.getElementById('backtolodge');
const statusEl = document.getElementById('status');

// Load hunter data
const hunter = loadHunter();

// Assign the count of bagged turkeys to the bagged turkeys status element
moneyEl.innerHTML = `$${hunter.money}`;

// Assign event listener to the revolver upgrade button
revolverUpgradeButton.addEventListener('click', () => {
  weaponUpgrade(1);
});

// Assign event listener to the revolver ammo button
revolverAmmoButton.addEventListener('click', () => {
  ammoHandling(1, 'buying');
});

// Assign event listener to return to lodge button
// So the user can return to the main page
backToLodge.addEventListener('click', () => {
  location.assign('index.html');
});
