const managerName = document.getElementById('managerName');
const companyName = document.getElementById('companyName');
const resetGameData = document.getElementById('resetGameData');

managerName.value = manager.mName;
companyName.value = manager.cName;

managerName.addEventListener('input', (e) => {
  manager.mName = e.target.value;
  saveJSON(manager, 'VMM-managerData');
});
companyName.addEventListener('input', (e) => {
  manager.cName = e.target.value;
  saveJSON(manager, 'VMM-managerData');
});
resetGameData.addEventListener('click', () => {
  let execute = confirm('Are you sure you want to delete all game data?');

  if (execute === true) {
    window.localStorage.removeItem('VMM-locationsArray');
    window.localStorage.removeItem('VMM-warehouseData');
    window.localStorage.removeItem('VMM-vendLocations');
    window.localStorage.removeItem('VMM-vendingMachines');
    window.localStorage.removeItem('VMM-managerData');
    window.localStorage.removeItem('VMM-availableLocationsArray');
    alert('All game data deleted!');
  } else {
    //Do nothing
    alert('Game data not deleted.');
  }
});
