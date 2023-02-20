// Define budget buttons
const addRowButton = document.getElementById('budgetaddrow');
const goBackButton = document.getElementById('budgetgoback');

// Define budget category ID
const categoryID = location.hash.substring(1);

// Define budget table
const budgetTableEl = document.getElementById('budgetTable');

// Run the Card Budget Display function for the Card Budget Page
cardBudgetDisplay();

// Add listeners to budget buttons
addRowButton.addEventListener('click', () => {
  addNewBudgetRow();
});

goBackButton.addEventListener('click', () => {
  location.assign('expensecards.html');
});
