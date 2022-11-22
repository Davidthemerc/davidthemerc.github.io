// Define page elements
const resetButton = document.getElementById('reset');
const backToLodge = document.getElementById('backtolodge');
const hunterNameEl = document.getElementById('huntername');
const weaponSelectEl = document.getElementById('weaponselect');
const weaponAmmo = document.getElementById('ammo');
const moneyEl = document.getElementById('money');

// Load hunter data
let hunter = loadHunter();

// Populate the hunter name field
hunterNameEl.value = hunter.name;

// Populate the hunter weapons field
hunter.weapons.forEach((weapon) => {
  let opt = document.createElement('option');
  opt.innerHTML = weapon.weaponName;
  opt.value = weapon.weaponID;
  weaponSelectEl.appendChild(opt);
});
// But let's pick the previously selected weapon
weaponSelectEl.selectedIndex = hunter.currentWeapon;

// Populate the weapon ammo field
weaponAmmo.innerHTML = hunter.weapons[hunter.currentWeapon].weaponAmmo;
// If the weapon is fists, show the infinity symbol
if (hunter.currentWeapon === 0) {
  weaponAmmo.innerHTML = '∞';
}

// Assign the hunter's money to the money element
moneyEl.innerHTML = `$${hunter.money.toFixed(2)}`;

// Assign event listener to Hunter name input
// So the user can change their name if they like
hunterNameEl.addEventListener('change', (e) => {
  hunter.name = e.target.value;
  saveJSON(hunter, 'TH-HunterData');
});

// Assign event listener to weapon select menu
weaponSelectEl.addEventListener('change', (e) => {
  // Assign the selected weapon (via ID) to the Hunter
  hunter.currentWeapon = parseInt(e.target.value);
  saveJSON(hunter, 'TH-HunterData');
  // Display confirmation message

  if (hunter.currentWeapon === 0) {
    displayMessage(
      `Equipped...the mighty fist. Hope you know what you're doing!`,
      statusEl
    );
  } else {
    displayMessage(
      `Equipped ${hunter.weapons[hunter.currentWeapon].weaponName}.`,
      statusEl
    );
  }

  // Repopulate the weapon ammo field
  weaponAmmo.innerHTML = hunter.weapons[hunter.currentWeapon].weaponAmmo;
  // If the weapon is fists, show the infinity symbol
  if (hunter.currentWeapon === 0) {
    weaponAmmo.innerHTML = '∞';
  }
});

// Reset game button
resetButton.addEventListener('click', () => {
  let decision = confirm('Are you sure you want to reset?');

  console.log(decision);

  if (decision === true) {
    hunter = defaultHunter;
    saveJSON(hunter, 'TH-HunterData');
    location.reload();
  } else {
    alert('Game was not reset.');
  }
});

// Assign event listener to return to lodge button
// So the user can return to the main page
backToLodge.addEventListener('click', () => {
  location.assign('index.html');
});
