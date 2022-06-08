const managerNameDisplay = document.getElementById('managerNameDisplay');
const busName = document.getElementById('busName');
const manager = managerData();

managerNameDisplay.innerHTML = manager.mName;
busName.innerHTML = manager.cName;
