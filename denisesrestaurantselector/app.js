let restaurants = getSavedRestaurants();
let selectedRestaurants = getSelectedRestaurants();

// Render restaurants on startup
generateResultsDOM(restaurants);
displayRemoved(selectedRestaurants);

// Clear saved items data (powerful!)
document.querySelector('#clearitems').addEventListener('click', function () {
  confirmDeletedSaved();
});

// Clear removed items data (powerful!)
document.querySelector('#clearremoved').addEventListener('click', function () {
  confirmDeleteRemoved();
  resetRemoved();
});

// Event listener for submit button for form
document.querySelector('form').addEventListener('submit', function (run) {
  run.preventDefault();

  // Push the form values to the array
  pushValues(form.elements.listItem.value);
  // Call the generateResultsDOM function based on the restaurants array
  generateResultsDOM(restaurants);

  // Reset form
  document.getElementById('form').reset();
});

// Event listener for restaurant selector button
document.querySelector('#select').addEventListener('click', () => {
  selectRandomRestaurant(ranBetween(0, restaurants.length - 1));
});
