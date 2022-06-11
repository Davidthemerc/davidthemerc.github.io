const managerName = document.getElementById('managerName');
const companyName = document.getElementById('companyName');

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
