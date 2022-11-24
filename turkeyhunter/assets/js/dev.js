// Define page elements
const addMoneyButton = document.getElementById('addmoney');

// Assign event listener to return to lodge button
// So the user can return to the main page
addMoneyButton.addEventListener('click', () => {
  let money = prompt('Enter Money Amount:');
  money = parseInt(money);
  moneyHandling(money, '+');

  // Assign the hunter's money to the money element
  moneyEl.innerHTML = `$${hunter.money.toFixed(2)}`;
});
