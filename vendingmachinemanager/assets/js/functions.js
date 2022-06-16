// Function to display messages in the DOM
const displayMessages = (messages, messageEl) => {
  messageEl.innerHTML = messages.join(' ');
};

const managerData = () => {
  const saveJSON = localStorage.getItem('VMM-managerData');

  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else
    return {
      mName: 'Manager',
      cName: 'Vending United',
      money: 2000,
      day: 0,
      agencyDayCounter: 0,
      agencyDay: 0,
      lastUsedAgencyDay: -1,
      numOfMachines: 0,
    };
};

const locationsData = () => {
  const saveJSON = localStorage.getItem('VMM-locationsArray');
  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else return defaultLocations;
};

const vendLocations = () => {
  const saveJSON = localStorage.getItem('VMM-vendLocations');

  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else return [];
};

const warehouseSetup = () => {
  const saveJSON = localStorage.getItem('VMM-warehouseData');
  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else
    return [
      { itemName: 'Wham Chipz', quantity: 0, size: 6 },
      { itemName: 'Pythagoroos', quantity: 0, size: 4 },
      { itemName: 'Chompers', quantity: 0, size: 3 },
    ];
};

const vendingMachinesSetup = () => {
  const saveJSON = localStorage.getItem('VMM-vendingMachines');
  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else return [];
};

const getJSON = (savedName) => {
  const saveJSON = localStorage.getItem(savedName);

  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else return [];
};

const saveJSON = (savedItem, savedName) => {
  localStorage.setItem(savedName, JSON.stringify(savedItem));
};

// Run agency function
// If 7 "days" haven't passed since the function initially ran, it will just reload the same available location options
// If 7 "days" have passed since the function initially ran, it will generate new location options
const runAgency = () => {
  if (manager.lastUsedAgencyDay !== manager.agencyDay) {
    // If the last used agency day doesn't match the current agency day, then we'll proceed to generate a new list
    let messages = [];
    messages.push('A week has passed! New locations are available!');
    displayMessages(messages, statusEl);

    if (availableLocationsArray.length === 0) {
    } else {
      availableLocationsArray.forEach((tag) => {
        locationsArray.push(tag);
        saveJSON(locationsArray, 'VMM-locationsArray');
      });

      availableLocationsArray = [];
    }

    saveJSON(locationsArray, 'VMM-locationsArray');
    saveJSON(availableLocationsArray, 'VMM-availableLocationsArray');

    // Check if there are even any locations left to offer!
    if (locationsArray.length == 0) {
      let messages = [];
      messages.push(
        'Sorry, there are no locations currently available at this time!'
      );
      displayMessages(messages, statusEl);

      return;
    }

    if (locationsArray.length < 3) {
      for (let i = 0; i <= locationsArray.length; i++) {
        console.log(`Only ${locationsArray.length} locations available!`);
        agencyGenerateLocations();
      }
    } else {
      for (let i = 0; i <= 2; i++) {
        agencyGenerateLocations();
      }
    }
  } else {
    console.log(
      'A week has not passed yet. Sorry, no new locations are available!'
    );
    loadExistingLocations();
  }

  // Set the agency day to keep track
  manager.lastUsedAgencyDay = manager.agencyDay;
  saveJSON(manager, 'VMM-managerData');
};

const agencyGenerateLocations = () => {
  // Generate a random number to decide which location to display
  let locationDecide = ranBetween(0, locationsArray.length - 1);

  // Reference the locations array here
  let pickedLocation = locationsArray[locationDecide];
  let locationName = pickedLocation.name;
  let locationTerms = pickedLocation.terms;
  let locationTermVar = pickedLocation.termVar;
  let locationTermCost = pickedLocation.termCost;
  let locationTermText = '';
  let locationID = pickedLocation.locationID;

  if (locationTermVar === 1) {
    locationTermText = `${locationTerms} a flat fee of $${locationTermCost} per week in exchange for placement.`;
  } else {
    locationTermText = `${locationTerms}They would like you to pay ${locationTermCost}% of your gross sales in exchange for placement.`;
  }

  pickedLocation.termCost = locationTermCost;
  pickedLocation.termText = locationTermText;
  pickedLocation.termVar = locationTermVar;

  availableLocationsArray.push(pickedLocation);
  locationsArray.splice(locationDecide, 1);

  saveJSON(locationsArray, 'VMM-locationsArray');
  saveJSON(availableLocationsArray, 'VMM-availableLocationsArray');

  agencyDom(
    locationName,
    locationTermText,
    locationTermCost,
    locationTermVar,
    locationID
  );
};

const loadExistingLocations = () => {
  if (availableLocationsArray.length !== 0) {
    availableLocationsArray.forEach((tag) => {
      locationName = tag.name;
      locationTermText = tag.termText;
      locationTermCost = tag.termCost;
      locationTermVar = tag.termVar;
      locationID = tag.locationID;
      agencyDom(
        locationName,
        locationTermText,
        locationTermCost,
        locationTermVar,
        locationID
      );
    });
  } else {
    const place = document.getElementById('status');
    const paragraph = document.createElement('p');
    paragraph.textContent =
      'Sorry, there are no locations currently available at this time!';
    paragraph.className = 'mb-2';
    place.appendChild(paragraph);
  }
};

const agencyDom = (
  locationName,
  locationTermText,
  locationTermCost,
  locationTermVar,
  locationID
) => {
  // Code to add the listing to the DOM
  const place = document.getElementById('listings');
  const div = document.createElement('div');
  const spanTitle = document.createElement('span');
  const spanTerms = document.createElement('span');
  const acceptButton = document.createElement('button');
  spanTitle.textContent = locationName;
  spanTitle.className = 'spanTitle block';
  spanTerms.textContent = `${locationTermText}`;
  spanTerms.className = 'block';
  acceptButton.textContent = 'Make a Deal';
  acceptButton.className = 'mb-1';
  div.className = 'col-4 listing mb-1';
  div.id = uuidv4();

  acceptButton.addEventListener('click', () => {
    locationDeal(
      locationName,
      locationTermCost,
      locationTermVar,
      div.id,
      locationID
    );
  });

  div.appendChild(spanTitle);
  div.appendChild(spanTerms);
  div.appendChild(acceptButton);
  place.appendChild(div);
};

// Deal when a location offer is accepted
const locationDeal = (name, termCost, termVar, id, locationID) => {
  // Temporarily DISABLED
  // if (manager.numOfMachines === 0) {
  //   console.log(
  //     `You don't have any vending machines! You don't need a location yet!`
  //   );
  //   return;
  // }

  let terms;

  termVar === 1
    ? (terms = `a flat fee of ${termCost} per week.`)
    : (terms = `${termCost}% of your gross sales.`);

  console.log(
    `You've chosen to accept ${name}'s offer to place a vending machine at their location.`
  );
  console.log(`You will need to pay them ${terms}`);

  // Push this location to the your Vending Locations array
  yourVendLocations.push({
    name: name,
    termType: termVar,
    termAmt: termCost,
    snackPresent: false,
    snackID: '',
    sodaPresent: false,
    sodaID: '',
    ID: uuidv4(),
  });

  const spliceIndex = availableLocationsArray.findIndex(
    (location) => location.locationID === locationID
  );

  if (spliceIndex > -1) {
    availableLocationsArray.splice(spliceIndex, 1);
  }
  saveJSON(availableLocationsArray, 'VMM-availableLocationsArray');

  // Temporarily DISABLED
  // availableLocationsArray.forEach((tag) => {
  //   locationsArray.push(tag);
  //   saveJSON(locationsArray, 'VMM-locationsArray');
  // });
  // availableLocationsArray = [];

  saveJSON(yourVendLocations, 'VMM-vendLocations');
  document.getElementById(id).remove();
};

// Advance day function
const advanceDay = () => {
  manager.day += 1;
  manager.agencyDayCounter += 1;

  if (manager.agencyDayCounter === 7) {
    manager.agencyDayCounter = 0;
    manager.agencyDay += 1;
  }

  saveJSON(manager, 'VMM-managerData');
};

const wmartBuy = (found, index, fields) => {
  let quantity = selectFields[index].value;
  let itemName = found.friendlyName;

  if (fields[index].selectedIndex === 0) {
    throw new Error(`You can't buy ${itemName} if a quantity isn't selected!`);
  }

  let cost = found.itemPrice * parseInt(fields[index].value).toFixed(2);
  console.log(cost);

  // Subtract the cost from the Manager's money
  moneyExchange('-', cost);

  let messages = [];
  messages.push(
    `You bought a pack of ${quantity} ${itemName} for $${cost.toFixed(
      2
    )}! They will be shipped to your warehouse.`
  );
  displayMessages(messages, statusEl);
  warehouseStock(quantity, index);
};

const machineStock = (typed, selected, machIndex, slotNum, fName) => {
  if (machines[machIndex].macLocation === 'warehouse') {
    // Flip out, because a machine has to be at a location to be stocked...
    throw new Error(
      `Selected machine isn't placed! You must place it at a location before attempting to stock it.`
    );
  }

  if (typed !== '' && selected.selectedIndex > 0) {
    throw new Error(`Don't use two inputs dipshit!`);
  } else if (typed === '' && selected.selectedIndex === 0) {
    throw new Error(`WHAT ARE YOU DOING, ENTER AN INPUT!`);
  }

  if (machIndex < 0) {
    throw new Error('Please pick a machine!');
  }

  if (slotNum === '-1') {
    throw new Error('Please pick a slot!');
  }

  let messages = [];
  displayMessages(messages, statusEl);
  typed !== ''
    ? messages.push(
        `You stocked ${typed} ${fName} into slot ${slotNum} in machine ${machIndex}.`
      )
    : messages.push(
        `You stocked ${selected.value} ${fName} into slot ${slotNum} in machine ${machIndex}.`
      );
  displayMessages(messages, statusEl);

  const entries = Object.entries(machines);
};

const warehouseStock = (quantity, index) => {
  quantity = parseInt(quantity);
  warehouseArray[index].quantity = quantity;
  saveJSON(warehouseArray, 'VMM-warehouseData');
};

const warehouseDOM = () => {
  let quantityFields = document.getElementsByClassName('warehouseQuantity');
  let inputTypeFields = document.getElementsByClassName('warehouseInput');
  let inputMenuFields = document.getElementsByClassName('warehouseInputMenu');
  let vendingFields = document.getElementsByClassName('vendingSelect');
  let slotFields = document.getElementsByClassName('vendingSlot');
  let buttonFields = document.getElementsByClassName('warehouseButton');
  let slots = Array.from(slotFields);

  Array.from(quantityFields).forEach((arrayLoop, index) => {
    arrayLoop.innerHTML = `Item: ${warehouseArray[index].itemName} (${warehouseArray[index].quantity})`;
  });

  Array.from(inputMenuFields).forEach((arrayLoop) => {
    for (let x = 0; x <= 5; x++) {
      let opt = document.createElement('option');
      opt.value = vendingControlNum[x];
      opt.innerHTML = vendingControlNum[x];
      arrayLoop.appendChild(opt);
    }
  });

  Array.from(vendingFields).forEach((arrayLoop, index) => {
    for (let x = 0; x < machines.length; x++) {
      let opt = document.createElement('option');
      opt.value = x;
      opt.innerHTML = `${machines[x].macName}`;
      arrayLoop.appendChild(opt);
    }

    arrayLoop.addEventListener('change', (e) => {
      if (e.target.value == '-1') {
        slots[index].innerHTML = '';
        let opt = document.createElement('option');
        opt.value = -1;
        opt.innerHTML = 'Select Slot';
        slots[index].appendChild(opt);
        return;
      }

      for (let x = 0; x < machines[e.target.value].numOfSlots; x++) {
        let opt = document.createElement('option');
        opt.value = x;
        opt.innerHTML = `Slot ${x}`;
        slots[index].appendChild(opt);
      }
    });
  });

  Array.from(slotFields).forEach((arrayLoop, index) => {});

  Array.from(buttonFields).forEach((arrayLoop, index) => {
    arrayLoop.addEventListener('click', () => {
      try {
        // Basically left off here. It doesn't really do anything yet except stop you from trying to
        // use both stock # inputs. I need the vending machine system built out first.
        machineStock(
          inputTypeFields[index].value,
          inputMenuFields[index],
          vendingFields[index].value,
          slotFields[index].value,
          itemPriceTable[index].friendlyName
        );
        // Clear the fields
        inputTypeFields[index].value = '';
        inputMenuFields[index].value = 0;
        vendingFields[index].value = -1;
        slots[index].innerHTML = '';
        let opt = document.createElement('option');
        opt.value = -1;
        opt.innerHTML = 'Select Slot';
        slots[index].appendChild(opt);
      } catch (error) {
        let messages = [];
        messages.push(error);
        displayMessages(messages, statusEl);

        // Clear the fields
        inputTypeFields[index].value = '';
        inputMenuFields[index].value = 0;
        vendingFields[index].value = -1;
        slots[index].innerHTML = '';
        let opt = document.createElement('option');
        opt.value = -1;
        opt.innerHTML = 'Select Slot';
        slots[index].appendChild(opt);
      }
    });
  });

  // If some moron types a value and picks a value from the dropdown menu and attempts to stock
  //, be sure to error out, since we don't want TWO inputs!
};

const moneyExchange = (action, amount) => {
  action === '-' ? (manager.money -= amount) : (manager.money += amount);
  saveJSON(manager, 'VMM-managerData');
  currentMoney.innerHTML = `$${manager.money.toFixed(2)}`;
};

const updateMoney = (money) => {
  let moneyEl = document.getElementById('currentMoney');
  moneyEl.innerHTML = '';
  moneyEl.innerHTML = `$${money.toFixed(2)}`;
};

const addVendingMachine = (kind) => {
  if (manager.numOfMachines > 0) {
    // Only one machine for now please!
    throw new Error('Only one machine for now please!');
  }

  let newName = prompt('Please name your new vending machine:');

  let messages = [];
  messages.push(`You added a new ${kind} machine called ${newName}!`);
  displayMessages(messages, statusEl);

  machines.push({
    // Machine Type, Snack or Soda
    macType: 'snack',
    macName: newName,
    // Machine UUID
    macID: uuidv4(),
    // Machine Location, Blank at time of purchase
    macLocation: 'warehouse',
    // Property specifying the number of slots
    numOfSlots: 34,
    // Machine slot # and then the size
    macSlot0: 0,
    macSlotitem0: -1,
    macSlotprice0: 0,
    macSlotsize0: 6,
    macSlot1: 0,
    macSlotitem1: -1,
    macSlotprice1: 0,
    macSlotsize1: 6,
    macSlot2: 0,
    macSlotitem2: -1,
    macSlotprice2: 0,
    macSlotsize2: 6,
    macSlot3: 0,
    macSlotitem3: -1,
    macSlotprice3: 0,
    macSlotsize3: 6,
    macSlot4: 0,
    macSlotitem4: -1,
    macSlotprice4: 0,
    macSlotsize4: 6,
    macSlot5: 0,
    macSlotitem5: -1,
    macSlotprice5: 0,
    macSlotsize5: 6,
    macSlot6: 0,
    macSlotitem6: -1,
    macSlotprice6: 0,
    macSlotsize6: 6,
    macSlot7: 0,
    macSlotitem7: -1,
    macSlotprice7: 0,
    macSlotsize7: 6,
    macSlot8: 0,
    macSlotitem8: -1,
    macSlotprice8: 0,
    macSlotsize8: 6,
    macSlot9: 0,
    macSlotitem9: -1,
    macSlotprice9: 0,
    macSlotsize9: 6,
    macSlot10: 0,
    macSlotitem10: -1,
    macSlotprice10: 0,
    macSlotsize10: 6,
    macSlot11: 0,
    macSlotitem11: -1,
    macSlotprice11: 0,
    macSlotsize11: 6,
    macSlot12: 0,
    macSlotitem12: -1,
    macSlotprice12: 0,
    macSlotsize12: 3,
    macSlot13: 0,
    macSlotitem13: -1,
    macSlotprice13: 0,
    macSlotsize13: 3,
    macSlot14: 0,
    macSlotitem14: -1,
    macSlotprice14: 0,
    macSlotsize14: 3,
    macSlot15: 0,
    macSlotitem15: -1,
    macSlotprice15: 0,
    macSlotsize15: 3,
    macSlot16: 0,
    macSlotitem16: -1,
    macSlotprice16: 0,
    macSlotsize16: 3,
    macSlot17: 0,
    macSlotitem17: -1,
    macSlotprice17: 0,
    macSlotsize17: 3,
    macSlot18: 0,
    macSlotitem18: -1,
    macSlotprice18: 0,
    macSlotsize18: 3,
    macSlot19: 0,
    macSlotitem19: -1,
    macSlotprice19: 0,
    macSlotsize19: 3,
    macSlot20: 0,
    macSlotitem20: -1,
    macSlotprice20: 0,
    macSlotsize20: 3,
    macSlot21: 0,
    macSlotitem21: -1,
    macSlotprice21: 0,
    macSlotsize21: 3,
    macSlot22: 0,
    macSlotitem22: -1,
    macSlotprice22: 0,
    macSlotsize22: 3,
    macSlot23: 0,
    macSlotitem23: -1,
    macSlotprice23: 0,
    macSlotsize23: 3,
    macSlot24: 0,
    macSlotitem24: -1,
    macSlotprice24: 0,
    macSlotsize24: 3,
    macSlot25: 0,
    macSlotitem25: -1,
    macSlotprice25: 0,
    macSlotsize25: 3,
    macSlot26: 0,
    macSlotitem26: -1,
    macSlotprice26: 0,
    macSlotsize26: 3,
    macSlot27: 0,
    macSlotitem27: -1,
    macSlotprice27: 0,
    macSlotsize27: 3,
    macSlot28: 0,
    macSlotitem28: -1,
    macSlotprice28: 0,
    macSlotsize28: 4,
    macSlot29: 0,
    macSlotitem29: -1,
    macSlotprice29: 0,
    macSlotsize29: 4,
    macSlot30: 0,
    macSlotitem30: -1,
    macSlotprice30: 0,
    macSlotsize30: 4,
    macSlot31: 0,
    macSlotitem31: -1,
    macSlotprice31: 0,
    macSlotsize31: 4,
    macSlot32: 0,
    macSlotitem32: -1,
    macSlotprice32: 0,
    macSlotsize32: 4,
    macSlot33: 0,
    macSlotitem33: -1,
    macSlotprice33: 0,
    macSlotsize33: 4,
  });
  saveJSON(machines, 'VMM-vendingMachines');
};

const loadCurrentMachines = () => {
  const machineEl = document.getElementById('yourMachines');

  machines.forEach((mach) => {
    let linkEl = document.createElement('a');
    linkEl.textContent = mach.macName;
    linkEl.href = `/vendingmachinemanager/machine.html#${mach.macID}`;
    machineEl.appendChild(linkEl);
  });
};

const machineLoader = (index) => {
  const entries = Object.entries(machines);
  for (let x = 0; x <= machines[index].numOfSlots; x++) {
    // Example: entries[0][1]['macSlotsize' + x]
  }
};
