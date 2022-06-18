const localMachID = location.hash.substring(1);
let matchMach = machines.find((machines) => machines.macID === localMachID);
const localMacIndex = machines.findIndex(
  (machines) => machines.macID === localMachID
);
let locationSelect = document.getElementById('locationSelect');

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
machineLoader(localMacIndex);

// Now default to the current location
locationSelect.value = matchMach.macLocation;

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
  }

  // Save the machine's ID to the new location.
  yourVendLocations[locationIndex].snackPresent = true;
  yourVendLocations[locationIndex].snackID = matchMach.macID;
  saveJSON(yourVendLocations, 'VMM-vendLocations');

  matchMach.macLocation = e.target.value;
  saveJSON(machines, 'VMM-vendingMachines');

  // Unload the machine and send all items back to the Warehouse.
  let slots = matchMach.numOfSlots;
  for (let x = 0; x < slots; x++) {
    const entries = Object.entries(machines);
    // Grab the item's unique ID from the slot and send it to the Warehouse
    let localItemID = entries[localMacIndex][1]['macSlotItem' + x];

    let localItemQuantity = entries[localMacIndex][1]['macSlot' + x];

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

  let messages = [];
  messages.push(
    `You move the machine to ${
      locationSelect[locationSelect.selectedIndex].text
    }.`
  );
  displayMessages(messages, statusEl);
});

// Now, load the vending machine graphics
vendingMachineDOM(matchMach);
