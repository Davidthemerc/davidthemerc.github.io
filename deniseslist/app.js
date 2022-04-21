let results = getSavedResults();
let removedItems = getRemovedItems();
let categoryNames = [
  'Clothing',
  'Produce',
  'Bakery',
  'Other Grocery',
  'Dairy',
  'Beverages',
  'Cleaning Supplies',
  'Pet Supplies',
  'Electronics/Home Office',
  'Crafts/Party Supplies',
  'Home Goods',
  'Home Improvement',
  'Sporting Goods',
  'Toys',
  'Clearance',
  'Garden/Outdoor',
  'Cosmetic/Health',
  'Seasonal',
  'Frozen Food',
  'Checkout Area',
];

// Render results on startup
generateResultsDOM(results);
displayRemoved(removedItems);

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
  // Call the generateResultsDOM function based on the results array
  generateResultsDOM(results);

  // Reset form
  document.getElementById('form').reset();
});
