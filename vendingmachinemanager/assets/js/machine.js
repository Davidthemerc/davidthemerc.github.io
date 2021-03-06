const localMachID = location.hash.substring(1);
let matchMach = machines.find((machines) => machines.macID === localMachID);
const localMacIndex = machines.findIndex(
  (machines) => machines.macID === localMachID
);
let locationSelect = document.getElementById('locationSelect');
let nameField = document.getElementById('machineName');
let machineOption = document.getElementById('machineContext');
let restock = document.getElementById('restockMachine');
let autoRestock = document.getElementById('autoRestockCheck');
let select = '0';

// Temporarily disabled during development
// if (!matchMach) {
//   location.assign('/vendingmachinemanager/manage.html');
// }

// Populate the locations menu with negotiated locations first
yourVendLocations.forEach((spot) => {
  let opt = document.createElement('option');
  opt.value = spot.ID;
  opt.innerHTML = spot.name;
  locationSelect.appendChild(opt);
});

// Now default to the current location and set the machine's name
locationSelect.value = matchMach.macLocation;
if (matchMach.macLocation === 'warehouse') {
  locationSelect.value = '0';
}
nameField.value = matchMach.macName;
// Checkbox state detection (update input from data)
matchMach.autoStock === true
  ? (autoRestock.checked = true)
  : (autoRestock.checked = false);

// Auto Restock checkbox manipulation
autoRestock.addEventListener('change', () => {
  autoRestock.checked === true
    ? (matchMach.autoStock = true)
    : (matchMach.autoStock = false);
  saveJSON(machines, 'VMM-vendingMachines');
});

// If the user changes the location in the dropdown, update the location
locationSelect.addEventListener('change', (e) => {
  let locationIndex = yourVendLocations.findIndex(
    (yourVendLocations) => yourVendLocations.ID === e.target.value
  );

  // Check if the machine is already at a location. If it is, we'll clear that stored machine ID and set machinetype present to false
  // Try looping through all locations to find a match? If not, proceed to place the machine
  if (matchMach.macLocation !== 'warehouse') {
    const oldLocation = yourVendLocations.findIndex(
      (yourVendLocations) => yourVendLocations.snackID === matchMach.macID
    );
    yourVendLocations[oldLocation].snackPresent = false;
    yourVendLocations[oldLocation].snackID = '';
    saveJSON(yourVendLocations, 'VMM-vendLocations');
  }

  // if LocationIndex didn't find a match, it's because we've selected the Warehouse.
  // Set the index to 0
  if (locationIndex === -1) {
    matchMach.macLocation = 'warehouse';
    saveJSON(machines, 'VMM-vendingMachines');
  } else {
    // Save the machine's ID to the new location.
    yourVendLocations[locationIndex].snackPresent = true;
    yourVendLocations[locationIndex].snackID = matchMach.macID;
    saveJSON(yourVendLocations, 'VMM-vendLocations');

    matchMach.macLocation = e.target.value;
    matchMach.priceTier = yourVendLocations[locationIndex].priceTier;
    saveJSON(machines, 'VMM-vendingMachines');

    // Unload the machine and send all items back to the Warehouse.
    let slots = matchMach.numOfSlots;
    for (let x = 0; x < slots; x++) {
      // Grab the item's unique ID from the slot and send it to the Warehouse
      let localItemID = matchMach['macSlotItem' + x];

      let localItemQuantity = matchMach['macSlot' + x];

      if (localItemID === -1) {
        continue;
      } else {
        warehouseStock(localItemQuantity, localItemID);
        matchMach['macSlot' + x] = 0;
        matchMach['macSlotPrice' + x] = 0;
        matchMach['macSlotItem' + x] = -1;
        saveJSON(machines, 'VMM-vendingMachines');
      }
    }
  }

  let messages = [];
  // Override the Warehouse text
  let locationText = locationSelect[locationSelect.selectedIndex].text;

  locationSelect[locationSelect.selectedIndex].text === 'Warehouse (Default)'
    ? (locationText = 'the Warehouse')
    : (locationText = locationText);

  messages.push(`You move the machine to ${locationText}.`);
  displayMessages(messages, statusEl);
  // Reload the vending machine graphics after moving
  vendingMachineDOM(matchMach);
});

// If the user alters the name in the Name field, change the machine name in the array and display a message
nameField.addEventListener('change', (e) => {
  matchMach.macName = e.target.value;
  saveJSON(machines, 'VMM-vendingMachines');

  let messages = [];
  messages.push(`Machine name changed to ${e.target.value}.`);
  displayMessages(messages, statusEl);
});

restock.addEventListener('click', () => {
  restockMachine(matchMach);
});

// Now, load the vending machine graphics
vendingMachineDOM(matchMach);
