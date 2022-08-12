const darkwoodsVenture = document.getElementById('venture-darkwoods');
const returnToTown = document.getElementById('returntotown');

darkwoodsVenture.addEventListener('click', () => {
  location.assign('combat.html');
});

returnToTown.addEventListener('click', () => {
  location.assign('town.html');
});
