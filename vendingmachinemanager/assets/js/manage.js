const managerNameDisplay = document.getElementById('managerNameDisplay');
const busName = document.getElementById('busName');

managerNameDisplay.innerHTML = manager.mName;
busName.innerHTML = manager.cName;

const warehouseMart = document.getElementById('warehouseMart');
warehouseMart.addEventListener('click', () => {
  location.assign('/vendingmachinemanager/warehousemart.html');
});
