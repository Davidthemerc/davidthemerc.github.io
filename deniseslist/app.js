const results = getSavedResults();
const removedItems = [];

// Render results on startup
generateResultsDOM(results);

// Event listener for submit button for form
document.querySelector('form').addEventListener('submit', function (run) {
  run.preventDefault();

  // Push the form values to the array
  pushValues(form.elements.listitem.value);
  // Call the generateResultsDOM function based on the results array
  generateResultsDOM(results);

  // Reset form
  document.getElementById('form').reset();
});
