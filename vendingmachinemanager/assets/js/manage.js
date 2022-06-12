const managerNameDisplay = document.getElementById('managerNameDisplay');
const busName = document.getElementById('busName');
const advanceDayButton = document.getElementById('advanceDay');
const warehouseMart = document.getElementById('warehouseMart');
const warehouse = document.getElementById('warehouse');
const agencyButton = document.getElementById('newLocation');
const gregorButton = document.getElementById('buyNewMachine');

managerNameDisplay.innerHTML = manager.mName;
busName.innerHTML = manager.cName;
currentMoney.innerHTML = `$${manager.money.toFixed(2)}`;

warehouseMart.addEventListener('click', () => {
  location.assign('/vendingmachinemanager/warehousemart.html');
});

agencyButton.addEventListener('click', () => {
  location.assign('/vendingmachinemanager/agency.html');
});

gregorButton.addEventListener('click', () => {
  location.assign('/vendingmachinemanager/gregors.html');
});

warehouse.addEventListener('click', () => {
  location.assign('/vendingmachinemanager/warehouse.html');
});

advanceDayButton.addEventListener('click', () => {
  advanceDay();
});
