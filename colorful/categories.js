// Define the select menu
const selectMenu = document.getElementById('categorySelect');
const categoryName = document.getElementById('categoryName');
const categoryColor = document.getElementById('categoryColor');
const saveCategory = document.getElementById('saveCategory');
const addCategory = document.getElementById('addCategory');
const deleteCategory = document.getElementById('deleteCategory');
const messagesEl = document.getElementById('messages');
const backtomain = document.getElementById('backtomain');

// Run functions for categories page
// First, load up the categories in the drop down so the user can pick what they want to edit
loadSelectCategories();

// Next, listen for any selected categories picked via the dropdown
selectMenu.addEventListener('change', () => {
  // Pull the value of the category selected in the drop down, this will tell us which category is being edited
  let changedCategory = selectMenu.value;

  if (changedCategory === '-1') {
    // If it's on Select a Category, stop and do nothing
    return;
  }
  // Run a function to load up the selected category
  populateSelectedCategory(selectMenu.value);
});

// Next, listen for the save category changes button click
saveCategory.addEventListener('click', () => {
  // Pull the category ID from the select dropdown
  const selectedCategory = selectMenu.value;

  // Do nothing if we're "saving" with Select a Category selected...
  if (selectedCategory === '-1') {
    return;
  }

  masterExpenses[selectedCategory].expenseName = categoryName.value;
  masterExpenses[selectedCategory].expenseColor = categoryColor.value;

  // Save the changes to local storage
  saveJSON(masterExpenses, 'CET-masterExpenses');

  // Display save message
  displayMessage(
    `Saved changes to category ${categoryName.value}.`,
    messagesEl,
    2
  );

  // Reload the categories in the dropdown
  loadSelectCategories();
});

// Next, listen for the add category button click
addCategory.addEventListener('click', () => {
  // If the category name is a length of zero (as in not typed) do nothing
  if (categoryName.value.length < 1) {
    return;
  }

  const response = confirm(
    `Please confirm, you wish to add new category ${categoryName.value}?`
  );

  if (response) {
    alert(`Added new category ${categoryName.value}.`);
    masterExpenses.push({
      expenseName: categoryName.value,
      expenseColor: categoryColor.value,
      expenseExpenses: [],
      expenseBudget: 0,
      expenseBalance: 0,
    });

    // Save the changes to local storage
    saveJSON(masterExpenses, 'CET-masterExpenses');

    // Reload the categories in the dropdown
    loadSelectCategories();
  } else {
    alert(`Did not add new category ${categoryName.value}.`);
  }
});

// Next, listen for the delete category button click
deleteCategory.addEventListener('click', () => {
  if (selectMenu.value === '-1') {
    // If it's on Select a Category, stop and do nothing
    return;
  }

  const response = confirm(
    `Please confirm, you wish to delete category ${categoryName.value}?`
  );

  if (response) {
    alert(`Deleted category ${categoryName.value}.`);
    masterExpenses.splice(selectMenu.value, 1);
    // Save the changes to local storage
    saveJSON(masterExpenses, 'CET-masterExpenses');

    // Reload the categories in the dropdown
    loadSelectCategories();
  } else {
    alert(`Did not add delete category ${categoryName.value}.`);
  }
});

// Last, listen for the back to main menu button
backtomain.addEventListener('click', () => {
  location.assign('index.html');
});
