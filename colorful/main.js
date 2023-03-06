const expenseCardsButton = document.getElementById('expenseCardsButton');
const expenseCategoriesButton = document.getElementById(
  'manageExpenseCategoriesButton'
);
const rearrangeExpenseCategoriesButton = document.getElementById(
  'rearrangeExpenseCategoriesButton'
);

expenseCardsButton.addEventListener('click', () => {
  location.assign('expensecards.html');
});

expenseCategoriesButton.addEventListener('click', () => {
  location.assign('categories.html');
});

rearrangeExpenseCategoriesButton.addEventListener('click', () => {
  location.assign('rearrange.html');
});
