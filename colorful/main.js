const expenseCardsButton = document.getElementById('expenseCardsButton');
const ExpenseCategoriesButton = document.getElementById(
  'manageExpenseCategoriesButton'
);

expenseCardsButton.addEventListener('click', () => {
  location.assign('expensecards.html');
});

ExpenseCategoriesButton.addEventListener('click', () => {
  location.assign('categories.html');
});
