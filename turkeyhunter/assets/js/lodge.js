// Define page elements
const hunterNameEl = document.getElementById('huntername');
const goHuntButton = document.getElementById('gohunt');
const armoryButton = document.getElementById('armory');
const trophyRoomButton = document.getElementById('trophies');
const hunterButton = document.getElementById('hunterbutton');
const statusWeaponEl = document.getElementById('statusweapon');
const baggedEl = document.getElementById('bagged');
const moneyEl = document.getElementById('money');

// Load hunter data
const hunter = loadHunter();

// Assign the hunter's saved name to the link on the page
hunterNameEl.innerHTML = `Welcome ${hunter.name}!`;

if (hunter.name === 'Developer') {
  hunterNameEl.innerHTML = "Welcome Developer! You're awesome!";
}

// Assign the hunter's current weapon to the weapon status element
statusWeaponEl.innerHTML = hunter.weapons[hunter.currentWeapon].weaponName;

// Assign the count of bagged turkeys to the bagged turkeys status element
baggedEl.innerHTML = hunter.turkeysBaggedCount;

// Assign the hunter's money to the money element
moneyEl.innerHTML = `$${hunter.money.toFixed(2)}`;

// Assign event listener to the go hunting button
goHuntButton.addEventListener('click', () => {
  location.assign('hunting.html');
  // Run function to reload hunter's ammo upon going hunting
  goHuntingReload();
});

// Assign event listener to the armory button
armoryButton.addEventListener('click', () => {
  location.assign('armory.html');
});

// Assign event listener to the trophy room button
trophyRoomButton.addEventListener('click', () => {
  location.assign('trophyroom.html');
});

// Assign event listener to the hunter name/inventory button
hunterButton.addEventListener('click', () => {
  hunter.name === 'Developer'
    ? location.assign('dev.html')
    : location.assign('hunter.html');
});
