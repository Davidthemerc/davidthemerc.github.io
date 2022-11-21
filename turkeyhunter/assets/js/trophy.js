// Define page elements
const backToLodge = document.getElementById('backtolodge');

// Assign event listener to return to lodge button
// So the user can return to the main page
backToLodge.addEventListener('click', () => {
  location.assign('index.html');
});
