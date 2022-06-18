const snackButton0 = document.getElementById('buySnackMachine0');
const sodaButton = document.getElementById('buySodaMachine');

snackButton0.addEventListener('click', () => {
  // Snack Machine Variant #0
  try {
    addVendingMachine('snack', 0);
    moneyExchange('-', 1000);
    manager.numOfMachines += 1;
    saveJSON(manager, 'VMM-managerData');
    //Snack Machine
  } catch (error) {
    let messages = [];
    messages.push(error);
    displayMessages(messages, statusEl);
  }
});

sodaButton.addEventListener('click', () => {
  //To do eventually!
});

updateMoney(manager.money);
