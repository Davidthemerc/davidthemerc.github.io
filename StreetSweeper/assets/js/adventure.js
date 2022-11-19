const hoodVenture = document.getElementById('venture-hood');
const returnToTown = document.getElementById('returntotown');

hoodVenture.addEventListener('click', () => {
  location.assign('combat.html');
});

returnToTown.addEventListener('click', () => {
  location.assign('home.html');
});
