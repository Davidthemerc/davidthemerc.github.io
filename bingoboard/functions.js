// Function to display data on hover
const displayDataOnHover = (position, event) => {
  // Find the corresponding tile object
  var tileObject = bingoTiles.find(function (tile) {
    return tile.tileCoordinates === position;
  });

  // Display data if found
  if (tileObject) {
    if (tileObject.difficulties.easy === '') {
      tileObject.difficulties.easy = 'N/A';
    }
    if (tileObject.difficulties.medium === '') {
      tileObject.difficulties.medium = 'N/A';
    }
    if (tileObject.difficulties.hard === '') {
      tileObject.difficulties.hard = 'N/A';
    }
    if (tileObject.difficulties.elite === '') {
      tileObject.difficulties.elite = 'N/A';
    }

    hoverBox.innerHTML = `
          <h3>${tileObject.tileName}</h3>
          <p>${tileObject.tileDescription}</p>
          <h4>Difficulties:</h4>
          <ul>
              <li>Easy: ${tileObject.difficulties.easy}</li>
              <li>Medium: ${tileObject.difficulties.medium}</li>
              <li>Hard: ${tileObject.difficulties.hard}</li>
              <li>Elite: ${tileObject.difficulties.elite}</li>
          </ul>
      `;

    // Position the hover box just below the hover point
    hoverBox.style.top = event.clientY + 'px';
    hoverBox.style.left = event.clientX + 'px';

    // Show the hover box
    hoverBox.style.display = 'block';
  }
};

// Function to hide the hover box when mouse leaves the image
const hideHoverBox = () => {
  hoverBox.style.display = 'none';
};

// Random number function
// Accepts minimum and maximum number as parameters
const ranBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
