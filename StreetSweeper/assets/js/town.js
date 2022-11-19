// Define Hero Name link and rename to Hero's name
let heroName = document.getElementById('herolink');
heroName.innerHTML = `${hero.name}, <small>${hero.hitpoints} HP, ${hero.gold} cents</small>`;

// Define status messages element
const statusEl = document.getElementById('status');

// Define Temple of Skyrios elements
const healingButton = document.getElementById('healing');

// Define Leave Town button
const leaveTownButton = document.getElementById('leave-town');

// Add event listeners for the Temple
healingButton.addEventListener('click', () => {
  try {
    townHealing();
  } catch (error) {
    displayMessage(error, statusEl, 3);
  }
});

// Add event listener to leave town button
leaveTownButton.addEventListener('click', () => {
  console.log('Leaving town');
  location.assign('adventure.html');
});
