// Definitions of the default expense categories
// Defined as an array of objects, each object representing one expense category
// 1. Expense Name (String)
// 2. Expense Color (String)
// 3. Individual Expenses (An array of objects, each representing one expense)
// 4. Expense Budget
// 5. Expense Balance (Budget minus all expenses)

// Prototype Expense Object
/*{
  expenseName: '',
  expenseColor: '',
  expenseExpenses: [],
  expenseBudget: 0,
  expenseBalance: 0,
},
*/

const defaultExpenses = [
  // Prototype Expense Object
  {
    expenseName: 'Food',
    expenseColor: '#FFFF00',
    expenseExpenses: [],
    expenseBudget: 0,
    expenseBalance: 0,
  },
  {
    expenseName: 'Personal',
    expenseColor: '#DCC5ED',
    expenseExpenses: [],
    expenseBudget: 0,
    expenseBalance: 0,
  },
  {
    expenseName: 'Gifts',
    expenseColor: '#97E3ED',
    expenseExpenses: [],
    expenseBudget: 0,
    expenseBalance: 0,
  },
  {
    expenseName: 'Holiday',
    expenseColor: '#BC0000',
    expenseExpenses: [],
    expenseBudget: 0,
    expenseBalance: 0,
  },
  {
    expenseName: 'Fun',
    expenseColor: '#AD3AC0',
    expenseExpenses: [],
    expenseBudget: 0,
    expenseBalance: 0,
  },
  {
    expenseName: 'Pets',
    expenseColor: '#FFC5C5',
    expenseExpenses: [],
    expenseBudget: 0,
    expenseBalance: 0,
  },
  {
    expenseName: 'Misc.',
    expenseColor: '#3115D9',
    expenseExpenses: [],
    expenseBudget: 0,
    expenseBalance: 0,
  },
  {
    expenseName: 'Health',
    expenseColor: '#A76553',
    expenseExpenses: [],
    expenseBudget: 0,
    expenseBalance: 0,
  },
  {
    expenseName: 'Buffer',
    expenseColor: '#00DEB4',
    expenseExpenses: [],
    expenseBudget: 0,
    expenseBalance: 0,
  },
  {
    expenseName: 'Car',
    expenseColor: '#595959',
    expenseExpenses: [],
    expenseBudget: 0,
    expenseBalance: 0,
  },
  {
    expenseName: 'Home',
    expenseColor: '#D0CECE',
    expenseExpenses: [],
    expenseBudget: 0,
    expenseBalance: 0,
  },
  {
    expenseName: 'Santa',
    expenseColor: '#96F339',
    expenseExpenses: [],
    expenseBudget: 0,
    expenseBalance: 0,
  },
  {
    expenseName: 'Fab Fit Fun',
    expenseColor: '#8BFFE9',
    expenseExpenses: [],
    expenseBudget: 0,
    expenseBalance: 0,
  },
  {
    expenseName: 'Emergency',
    expenseColor: '#D3F315',
    expenseExpenses: [],
    expenseBudget: 0,
    expenseBalance: 0,
  },
  {
    expenseName: 'Stitch Fix',
    expenseColor: '#8EA9DB',
    expenseExpenses: [],
    expenseBudget: 0,
    expenseBalance: 0,
  },
  {
    expenseName: 'Vacay (Boo)',
    expenseColor: '#A7EBE5',
    expenseExpenses: [],
    expenseBudget: 0,
    expenseBalance: 0,
  },
  {
    expenseName: 'Vacay (Girls)',
    expenseColor: '#D462CF',
    expenseExpenses: [],
    expenseBudget: 0,
    expenseBalance: 0,
  },
  {
    expenseName: 'Extra Debt',
    expenseColor: '#FFDF79',
    expenseExpenses: [],
    expenseBudget: 0,
    expenseBalance: 0,
  },
  {
    expenseName: 'Wedding',
    expenseColor: '#FFC000',
    expenseExpenses: [],
    expenseBudget: 0,
    expenseBalance: 0,
  },
];

let getMasterExpenses = () => {
  const saveJSON = localStorage.getItem('CET-masterExpenses');

  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else return defaultExpenses;
};

const budgetCategories = ['Date', 'Description', 'Amount', 'Balance'];

let masterExpenses = getMasterExpenses();
