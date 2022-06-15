const snackButton = document.getElementById('buySnackMachine');
const sodaButton = document.getElementById('buySodaMachine');

snackButton.addEventListener('click', () => {
  try {
    addVendingMachine('snack');
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
