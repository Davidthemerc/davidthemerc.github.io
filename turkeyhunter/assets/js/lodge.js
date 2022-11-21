// Define page elements
const goHuntButton = document.getElementById('gohunt');
const armoryButton = document.getElementById('armory');
const trophyRoomButton = document.getElementById('trophies');
const hunterNameEl = document.getElementById('huntername');
const statusWeaponEl = document.getElementById('statusweapon');

// Load hunter data
const hunter = loadHunter();

// Assign the hunter's saved name to the link on the page
hunterNameEl.innerHTML = hunter.name;

// Assign the hunter's current weapon to the weapon status element
statusWeaponEl.innerHTML = hunter.weapons[hunter.currentWeapon].weaponName;

// Assign event listener to the go hunting button
goHuntButton.addEventListener('click', () => {
  location.assign('hunting.html');
});

// Assign event listener to the trophy room button
trophyRoomButton.addEventListener('click', () => {
  location.assign('trophyroom.html');
});
