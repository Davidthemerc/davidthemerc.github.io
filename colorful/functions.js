// Function to load saved localstorage data
const getJSON = (savedName) => {
  const saveJSON = localStorage.getItem(savedName);

  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else return [];
};

// Function to save localstorage data
const saveJSON = (savedArray, savedName) => {
  localStorage.setItem(savedName, JSON.stringify(savedArray));
};

// Card Display function for the Expense Cards page

const cardDisplay = () => {
  // Define card element/attributes
  // Run a forEach loop for each card defined in the masterExpenses array
  masterExpenses.forEach((card, index) => {
    // Card main div
    const cardDiv = document.createElement('div');
    cardDiv.id = card.expenseName;
    cardDiv.className = 'card';
    cardDiv.style.backgroundColor = card.expenseColor;
    // Card title
    const cardTitle = document.createElement('h3');
    cardTitle.textContent = card.expenseName;
    cardTitle.className = 'cardinfo';
    // Card Balance info
    const cardBal = document.createElement('p');
    cardBal.textContent = `Balance: $${card.expenseBalance}`;

    if (card.expenseBalance < 0) {
      let balance = Math.abs(card.expenseBalance);
      cardBal.textContent = `Balance -$${balance.toFixed(2)}`;
      if (balance >= 50 && balance < 100) {
        cardBal.textContent += ' (!!)';
      } else if (balance >= 100) {
        cardBal.textContent += ' (!!!)';
      } else {
        cardBal.textContent += ' (!)';
      }
      cardBal.className = 'negative';
    }

    cardBal.style.marginTop = '2rem';
    // Tap info
    const tapInfo = document.createElement('p');
    tapInfo.textContent = 'Tap to Open';
    tapInfo.style.marginTop = '2rem';
    tapInfo.style.fontWeight = 'bold';

    // Append the card title, balance, and tap info to the card div
    cardDiv.appendChild(cardTitle);
    cardDiv.appendChild(cardBal);
    cardDiv.appendChild(tapInfo);

    // Append the tap listener to the card
    cardDiv.addEventListener('click', (e) => {
      //console.log(card.expenseName);
      location.assign(`card.html#${index}`);
    });

    // Append the card to the main cards [page] element
    cardsMainEl.appendChild(cardDiv);
  });
};

const cardBudgetDisplay = () => {
  // Create the actual element that displays which Category budget this is
  // Reads the hash substring to determine which budget to refer
  // to (by array position passed through from the forEach index)
  const budgetTitleEl = document.getElementById('budgetTitle');
  const category = masterExpenses[categoryID].expenseName;
  const budgetTitle = document.createElement('h3');
  budgetTitle.textContent = `${category} Budget`;
  budgetTitleEl.appendChild(budgetTitle);

  showExistingBudgetRows();
};

const showExistingBudgetRows = () => {
  // Get a count of the expenseExpenses array for this category
  const expenseRows = masterExpenses[categoryID].expenseExpenses;

  // Run a forEach to display all of the saved expenses
  expenseRows.forEach((expense, index) => {
    // Add a new budget row
    const row = document.createElement('tr');

    // Assign this row a number based on its position in the table
    row.id = budgetTableEl.rows.length - 1;

    // Add one table "cell" for each budget category defined (currently 4)
    budgetCategories.forEach((category, index) => {
      const cell = document.createElement('td');
      cell.className = 'budgetcell';
      // Create an input to fit in this cell
      const input = document.createElement('input');
      input.id = `${row.id}-${index}`;

      if (category === 'Amount' || category == 'Balance') {
        input.setAttribute('type', 'number');
        input.className = 'budgetinput';
        // If this is the balance cell
        if (category === 'Balance') {
          input.setAttribute('readonly', 'true');
          input.className = 'budgetBalance';
        }
      } else if (category === 'Description') {
        input.setAttribute('type', 'text');
        input.className = 'budgetdesc';
      } else {
        input.setAttribute('type', 'date');
        input.className = 'budgetDate';
      }
      cell.appendChild(input);

      if (index === 0) {
        input.value =
          masterExpenses[categoryID].expenseExpenses[row.id].itemDate;
      } else if (index === 1) {
        input.value =
          masterExpenses[categoryID].expenseExpenses[row.id].itemDescription;
      } else if (index === 2) {
        input.value =
          masterExpenses[categoryID].expenseExpenses[row.id].itemCost;
        input.value = parseFloat(input.value).toFixed(2);
      } else if (index === 3) {
        // Code to resolve the balance in cell 4
        resolveLineBalance(index, row, input);
      }

      // Create event listener to listen for expense changes
      input.addEventListener('change', (e) => {
        // Modify the expense data

        if (index === 0) {
          masterExpenses[categoryID].expenseExpenses[row.id].itemDate =
            e.target.value;
        } else if (index === 1) {
          masterExpenses[categoryID].expenseExpenses[row.id].itemDescription =
            e.target.value;
          // Resolve the line balance again if there's a change
          let inlineInput = document.getElementById(`${row.id}-${3}`);
          resolveLineBalance(index, row, inlineInput);
        } else if (index === 2) {
          masterExpenses[categoryID].expenseExpenses[row.id].itemCost =
            parseFloat(e.target.value);
          input.value = parseFloat(input.value).toFixed(2);
          // Resolve the line balance again if there's a change
          let inlineInput = document.getElementById(`${row.id}-${3}`);
          resolveLineBalance(index, row, inlineInput);
          // Resolve all the other line balances (below this line)
          resolveMultiLineBalance(row.id);
        }
        saveJSON(masterExpenses, 'CET-masterExpenses');
      });

      row.appendChild(cell);
      budgetTableEl.appendChild(row);
    });
  });
};

const addNewBudgetRow = () => {
  // Add this new expense row to the Master Expenses array
  masterExpenses[categoryID].expenseExpenses.push({
    itemDate: '',
    itemDescription: '',
    itemCost: 0,
  });
  saveJSON(masterExpenses, 'CET-masterExpenses');

  // Add a new budget row
  const row = document.createElement('tr');

  // Assign this row a number based on its position in the table
  row.id = budgetTableEl.rows.length - 1;

  // Add one table "cell" for each budget category defined (currently 4)
  budgetCategories.forEach((category, index) => {
    const cell = document.createElement('td');
    cell.className = 'budgetcell';
    // Create an input to fit in this cell
    const input = document.createElement('input');
    input.id = `${row.id}-${index}`;

    if (row.id == '0' && category === 'Description') {
      input.value = 'Budget';
      masterExpenses[categoryID].expenseExpenses[
        parseInt(row.id)
      ].itemDescription = 'Budget';
    }

    if (category === 'Date') {
      input.setAttribute('type', 'date');
    }

    if (category === 'Amount' || category == 'Balance') {
      input.setAttribute('type', 'number');
      input.className = 'budgetinput';
      // If this is the balance cell
      if (category === 'Balance') {
        input.setAttribute('readonly', 'true');
        input.className = 'budgetBalance';
      }
    } else if (category === 'Description') {
      input.setAttribute('type', 'text');
      input.className = 'budgetdesc';
    } else {
      input.setAttribute('type', 'date');
    }
    cell.appendChild(input);

    // Create event listener to listen for expense changes
    input.addEventListener('change', (e) => {
      // Modify the expense data

      if (index === 0) {
        masterExpenses[categoryID].expenseExpenses[row.id].itemDate =
          e.target.value;
      } else if (index === 1) {
        masterExpenses[categoryID].expenseExpenses[row.id].itemDescription =
          e.target.value;
        // Resolve the line balance again if there's a change
        let inlineInput = document.getElementById(`${row.id}-${3}`);
        resolveLineBalance(index, row, inlineInput);
      } else if (index === 2) {
        masterExpenses[categoryID].expenseExpenses[row.id].itemCost =
          parseFloat(e.target.value);
        input.value = parseFloat(input.value).toFixed(2);
        // Resolve the line balance again if there's a change
        let inlineInput = document.getElementById(`${row.id}-${3}`);
        resolveLineBalance(index, row, inlineInput);
      }
      saveJSON(masterExpenses, 'CET-masterExpenses');
    });

    row.appendChild(cell);
    budgetTableEl.appendChild(row);
  });
  saveJSON(masterExpenses, 'CET-masterExpenses');
};

const resolveLineBalance = (index, row, input) => {
  const allItems = document.getElementsByClassName('budgetBalance');

  let cost = masterExpenses[categoryID].expenseExpenses[row.id].itemCost;
  let desc = masterExpenses[categoryID].expenseExpenses[row.id].itemDescription;
  // If this is a budgeted amount, account for that
  if (
    (desc === 'Budget' && row.id === 0) ||
    (desc === 'budget' && row.id === 0)
  ) {
    input.value = parseFloat(cost).toFixed(2);
  } else {
    if (row.id == 0) {
      input.value = parseFloat(cost).toFixed(2);
    } else if (
      (row.id > 0 && desc === 'Budget') ||
      (row.id > 0 && desc === 'Budget ') ||
      (row.id > 0 && desc === 'budget') ||
      (row.id > 0 && desc === 'budget ') ||
      (row.id > 0 && desc.includes('TRF-')) ||
      (row.id > 0 && desc.includes('trf-'))
    ) {
      let carryOver = allItems[row.id - 1].value;
      let difference = parseFloat(carryOver) + parseFloat(cost);
      input.value = difference.toFixed(2);
    } else {
      let carryOver = allItems[row.id - 1].value;
      let difference = carryOver - cost;
      input.value = difference.toFixed(2);
    }
    masterExpenses[categoryID].expenseBalance = parseFloat(input.value).toFixed(
      2
    );
    saveJSON(masterExpenses, 'CET-masterExpenses');
  }
};

const resolveMultiLineBalance = (start) => {
  // Get all the budget cells we'll need
  const allBals = document.getElementsByClassName('budgetBalance');
  const allCosts = document.getElementsByClassName('budgetinput');
  console.log(allBals);
  // Resolve all the line balances displayed on the current page any time
  // there's a change to an amount, but first, change start to an integer
  start = parseInt(start);
  // We'll want to start from the very next budget cell, so it will be start+1
  for (let i = start + 1; i < allBals.length; i++) {
    allBals[i].value = (
      parseFloat(allBals[i - 1].value) - parseFloat(allCosts[i].value)
    ).toFixed(2);
  }
};

// Function to populate the select menu in Category Management with the existing budget categories
const loadSelectCategories = () => {
  // Define the select menu
  const selectMenu = document.getElementById('categorySelect');

  // Clear any existing options
  selectMenu.innerHTML = '';
  categoryName.value = '';
  categoryColor.value = '';

  // Add the Select a category option
  const defaultOption = document.createElement('option');
  defaultOption.innerHTML = 'Select a Category';
  defaultOption.value = '-1';
  selectMenu.appendChild(defaultOption);

  // Run a forEach loop to populate each existing option
  masterExpenses.forEach((expense, index) => {
    // Get the expense name
    const expenseName = expense.expenseName;
    // Create a select option for this expense
    const option = document.createElement('option');
    option.innerHTML = expenseName;
    option.value = index;

    // Add this option to the select menu
    selectMenu.appendChild(option);
  });
};

// Function to populate the name and color fields when a category is selected
const populateSelectedCategory = (cata) => {
  categoryName.value = masterExpenses[cata].expenseName;
  categoryColor.value = masterExpenses[cata].expenseColor;
};

// Function to display messages in an area of the page
const displayMessage = (message, messageEl, length) => {
  messageEl.innerHTML = message;

  if (length > 0) {
    setTimeout(() => {
      messageEl.innerHTML = '';
    }, length * 1000);
  }
};

const displayArrangedCategories = () => {
  // Clear the list div
  listDiv.innerHTML = '';
  // Run a forEach loop using the masterExpenses array
  masterExpenses.forEach((expense, index) => {
    const div = document.createElement('div');
    div.className = 'categoryCell';
    const paragraph = document.createElement('p');
    paragraph.textContent = expense.expenseName;
    paragraph.className = 'nudge bold';
    const upButton = document.createElement('button');
    const downButton = document.createElement('button');
    upButton.className = 'nudge';
    downButton.className = 'nudge';
    upButton.textContent = 'Up';
    downButton.textContent = 'Down';

    upButton.addEventListener('click', () => {
      moveUp(index);
    });

    downButton.addEventListener('click', () => {
      moveDown(index);
    });

    div.appendChild(paragraph);
    div.appendChild(upButton);
    div.appendChild(downButton);
    listDiv.appendChild(div);
  });
};

const moveUp = (item) => {
  const index = masterExpenses.indexOf(masterExpenses[item]);
  if (index > 0) {
    masterExpenses.splice(index - 1, 0, masterExpenses[item]);
    masterExpenses.splice(index + 1, 1);
    saveJSON(masterExpenses, 'CET-masterExpenses');
  }

  displayArrangedCategories();
};

const moveDown = (item) => {
  const index = masterExpenses.indexOf(masterExpenses[item]);
  if (index < masterExpenses.length - 1) {
    masterExpenses.splice(index + 2, 0, masterExpenses[item]);
    masterExpenses.splice(index, 1);
    saveJSON(masterExpenses, 'CET-masterExpenses');
  }

  displayArrangedCategories();
};
