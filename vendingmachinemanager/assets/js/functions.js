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
    snackPresent: 'no',
    sodaPresent: 'no',
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

const machineStock = (typed, selected) => {
  if (typed !== '' && selected.selectedIndex > 0) {
    throw new Error(`Don't use two inputs dipshit!`);
  }
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

  Array.from(quantityFields).forEach((arrayLoop, index) => {
    arrayLoop.innerHTML = `Item: ${warehouseArray[index].itemName} (${warehouseArray[index].quantity})`;
  });

  Array.from(inputMenuFields).forEach((arrayLoop, index) => {
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
      opt.innerHTML = `Vending Machine ID:${machines[x].macID}}`;
      arrayLoop.appendChild(opt);
    }

    let slots = Array.from(slotFields);

    arrayLoop.addEventListener('change', (e) => {
      if (e.target.value == '-1') {
        slots[index].innerHTML = '';
        let opt = document.createElement('option');
        opt.value = '-1';
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
        machineStock(inputTypeFields[index].value, inputMenuFields[index]);
      } catch (error) {
        let messages = [];
        messages.push(error);
        displayMessages(messages, statusEl);
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
  let messages = [];
  messages.push(`You added a new ${kind} machine!`);
  displayMessages(messages, statusEl);

  machines.push({
    // Machine Type, Snack or Soda
    macType: 'snack',
    // Machine UUID
    macID: uuidv4(),
    // Machine Location, Blank at time of purchase
    macLocation: '',
    // Property specifying the number of slots
    numOfSlots: 34,
    // Machine slot # and then the size
    macSlot0: -1,
    macSlot0Size: 6,
    macSlot1: -1,
    macSlot1Size: 6,
    macSlot2: -1,
    macSlot2Size: 6,
    macSlot3: -1,
    macSlot3Size: 6,
    macSlot4: -1,
    macSlot4Size: 6,
    macSlot5: -1,
    macSlot5Size: 6,
    macSlot6: -1,
    macSlot6Size: 6,
    macSlot7: -1,
    macSlot7Size: 6,
    macSlot8: -1,
    macSlot8Size: 6,
    macSlot9: -1,
    macSlot9Size: 6,
    macSlot10: -1,
    macSlot10Size: 6,
    macSlot11: -1,
    macSlot11Size: 6,
    macSlot12: -1,
    macSlot12Size: 3,
    macSlot13: -1,
    macSlot13Size: 3,
    macSlot14: -1,
    macSlot14Size: 3,
    macSlot15: -1,
    macSlot15Size: 3,
    macSlot16: -1,
    macSlot16Size: 3,
    macSlot17: -1,
    macSlot17Size: 3,
    macSlot18: -1,
    macSlot18Size: 3,
    macSlot19: -1,
    macSlot19Size: 3,
    macSlot20: -1,
    macSlot20Size: 3,
    macSlot21: -1,
    macSlot21Size: 3,
    macSlot22: -1,
    macSlot22Size: 3,
    macSlot23: -1,
    macSlot23Size: 3,
    macSlot24: -1,
    macSlot24Size: 3,
    macSlot25: -1,
    macSlot25Size: 3,
    macSlot26: -1,
    macSlot26Size: 3,
    macSlot27: -1,
    macSlot27Size: 3,
    macSlot28: -1,
    macSlot28Size: 4,
    macSlot29: -1,
    macSlot29Size: 4,
    macSlot30: -1,
    macSlot30Size: 4,
    macSlot31: -1,
    macSlot31Size: 4,
    macSlot32: -1,
    macSlot32Size: 4,
    macSlot33: -1,
    macSlot33Size: 4,
  });
  saveJSON(machines, 'VMM-vendingMachines');
};
