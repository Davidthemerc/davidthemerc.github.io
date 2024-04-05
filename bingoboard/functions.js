// Function to display data on hover
const displayDataOnHover = (position) => {
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

    // Replace 'dataDisplayElement' with the appropriate element where you want to display the data
    textBox.innerHTML = `
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
  }
};

// Function to clear data display
const clearDataDisplay = () => {
  // Replace 'dataDisplayElement' with the appropriate element where you want to display the data
  textBox.textContent = '';
};
