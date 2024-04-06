// Variables
const hoverBox = document.getElementById('hoverbox');
const randomButton = document.getElementById('randomtile');
const duraRow = document.getElementById('durarow');
const duraRow2 = document.getElementById('durarow2');
const randomTileBox = document.getElementById('randomtilebox');
const ty = document.getElementById('thanks');
const fu = document.getElementById('fu');

// Add event listeners to each image to trigger displayDataOnHover function
document.querySelectorAll('.cube img').forEach(function (img) {
  img.addEventListener('mouseover', function (event) {
    var position = event.target.alt;
    displayDataOnHover(position, event);
  });
});

// Add event listeners to each image to trigger hideHoverBox function when mouse leaves the image
document.querySelectorAll('.cube img').forEach(function (img) {
  img.addEventListener('mouseleave', function () {
    hideHoverBox();
  });
});

randomButton.addEventListener('click', () => {
  let random = ranBetween(0, 54);
  duraRow.style.display = 'flex';
  duraRow2.style.display = 'flex';
  randomTileBox.textContent = `${
    duraGreet[ranBetween(0, duraGreet.length - 1)]
  } ${bingoTiles[random].tileCoordinates}, ${bingoTiles[random].tileName}`;
});

ty.addEventListener('click', () => {
  randomTileBox.textContent = duraGText[ranBetween(0, duraGText.length - 1)];
  duraRow2.style.display = 'none';
});

fu.addEventListener('click', () => {
  randomTileBox.textContent = duraText[ranBetween(0, duraText.length - 1)];
  duraRow2.style.display = 'none';
});
