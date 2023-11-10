// Module variable definitions
const personNameEl = document.getElementById('person');
const talkToHunter = document.getElementById('talktohunter');
const backTohunt = document.getElementById('backtohunt');
const backToLodge = document.getElementById('backtolodge');
const findHunter = document.getElementById('findhunter');
const robHunter = document.getElementById('robhunter');
const otherHunterWeaponEl = document.getElementById('otherhunterweapon');

// Load hunter data
const hunter = loadHunter();

// Pick a random hunter name
const hunterFirst = randomHunterNames.first[ranBetween(0, 74)];
const hunterLast = randomHunterNames.last[ranBetween(0, 74)];
personNameEl.innerHTML = `Name: ${hunterFirst} ${hunterLast}`;
const hunterFullName = `${hunterFirst} ${hunterLast}`;

// Assign a random weapon to the hunter
let otherHunterWeapon = randomHunterWeapons[ranBetween(0, 16)];
otherHunterWeaponEl.textContent += otherHunterWeapon;

// Event listener for the talk to hunter button
talkToHunter.addEventListener('click', () => {
  talkToHunterFunc();
});

// Assign event listener for find new hunter button
// It's basically just a refresh button.
findHunter.addEventListener('click', () => {
  location.reload();
});

// Assign event listener to return to lodge button
// So the hunter can return to the main page
backTohunt.addEventListener('click', () => {
  location.assign('hunting.html');
});

// Assign event listener to return to lodge button
// So the hunter can return to the main page
backToLodge.addEventListener('click', () => {
  location.assign('index.html');
});

// Assign event listener to the rob hunter button
// This button is only visible after they've talked to the hunter once
// To ensure they can't totally dehumanize them before they harm them LOL
robHunter.addEventListener('click', () => {
  robThisHunter(hunterFullName);
});
