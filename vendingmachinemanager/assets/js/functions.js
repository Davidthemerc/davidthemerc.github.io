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

const machineStock = (
  typed,
  selected,
  machIndex,
  slotNum,
  fName,
  size,
  id,
  index
) => {
  if (typed !== '' && selected.selectedIndex > 0) {
    throw new Error(`You must not use both of the numeric inputs!`);
  } else if (typed === '' && selected.selectedIndex === 0) {
    throw new Error(`You must use one of the two numeric inputs!`);
  }

  if (typed === '-1') {
    throw new Error(`Please do not use negative numbers.`);
  }

  if (machIndex < 0) {
    throw new Error('Please pick a machine!');
  }

  if (slotNum === '-1') {
    throw new Error('Please pick a slot!');
  }

  if (machines[machIndex].macLocation === 'warehouse') {
    // Flip out, because a machine has to be at a location to be stocked...
    throw new Error(
      `Selected machine isn't placed! You must place it at a location before attempting to stock it.`
    );
  }

  let currentQuantity = 0;
  typed !== ''
    ? (currentQuantity = parseInt(typed))
    : (currentQuantity = parseInt(selected.value));

  if (warehouseArray[id].quantity === 0) {
    throw new Error(`You don't have any ${fName} to load!`);
  } else if (warehouseArray[id].quantity < currentQuantity) {
    throw new Error(
      `You don't have enough items to load ${currentQuantity}. You only have ${warehouseArray[id].quantity}!`
    );
  }

  if (currentQuantity === 0) {
    throw new Error(`You can't load zero items!`);
  }

  let machName = machines[machIndex].macName;

  // This is where use of the entries method can be used to stock items in the appropriate slot
  // in the machine. We'll need to check for errors first, though.
  console.log(slotNum);
  const entries = Object.entries(machines);

  // Determine how many free spaces are left for this item in the designated slot
  let currentSlotQuantity = entries[machIndex][1]['macSlot' + slotNum];
  let currentItemMax = itemPriceTable[id].maxNum;

  if (currentSlotQuantity >= currentItemMax) {
    // Flip out, because the slot is FULL
    throw new Error(`Slot ${slotNum} is full! Please select another slot`);
  }

  if (currentItemMax - currentSlotQuantity < currentQuantity) {
    // Flip out, because the slot can't take the quantity given
    throw new Error(
      `Slot ${slotNum} can't accept ${currentQuantity} ${fName}! It can only currently accept ${
        currentItemMax - currentSlotQuantity
      }!`
    );
  }

  if (size !== entries[machIndex][1]['macSlotSize' + slotNum]) {
    // Flip out, because the item isn't the right size for this slot
    throw new Error(
      `Item will not fit in selected slot! Choose another item/slot!`
    );
  }

  // Make sure the slot is empty, or has the same type of item. If not, deny slot placement.
  if (
    entries[machIndex][1]['macSlotItem' + slotNum] !== -1 &&
    entries[machIndex][1]['macSlotItem' + slotNum] !== id
  ) {
    // Flip out, because the slot is not empty, and doesn't match this item
    throw new Error(
      `Selected slot is not empty and doesn't match the current item!`
    );
  }

  // Set the destination slot to match the newly stocked item and stock the item
  entries[machIndex][1]['macSlotItem' + slotNum] = id;

  // Subtract the item(s) from the warehouse
  warehouseArray[id].quantity -= currentQuantity;
  saveJSON(machines, 'VMM-vendingMachines');
  saveJSON(warehouseArray, 'VMM-warehouseData');

  // Add the item to the machine
  entries[machIndex][1]['macSlot' + slotNum] += currentQuantity;
  saveJSON(machines, 'VMM-vendingMachines');

  // Display the stocking message
  let messages = [];
  displayMessages(messages, statusEl);
  typed !== ''
    ? messages.push(
        `You stocked ${typed} ${fName} into Slot ${slotNum} in machine ${machName}.`
      )
    : messages.push(
        `You stocked ${selected.value} ${fName} into Slot ${slotNum} in machine "${machName}".`
      );
  displayMessages(messages, statusEl);

  // Reset the warehouse fields, it's just cleaner that way
  resetWarehouse(index, id, fName);
};

const warehouseStock = (quantity, index) => {
  quantity = parseInt(quantity);
  warehouseArray[index].quantity += quantity;
  saveJSON(warehouseArray, 'VMM-warehouseData');
};

const warehouseDOM = () => {
  let warehouseImages = document.getElementsByClassName('warehouseItem');
  let quantityFields = document.getElementsByClassName('warehouseQuantity');
  let inputTypeFields = document.getElementsByClassName('warehouseInput');
  let inputMenuFields = document.getElementsByClassName('warehouseInputMenu');
  let vendingFields = document.getElementsByClassName('vendingSelect');
  let slotFields = document.getElementsByClassName('vendingSlot');
  let buttonFields = document.getElementsByClassName('warehouseButton');
  let slots = Array.from(slotFields);

  Array.from(quantityFields).forEach((arrayLoop, index) => {
    let defaultOpt = document.createElement('option');
    defaultOpt.value = -1;
    defaultOpt.innerHTML = `Select Item`;
    defaultOpt.selected = true;
    defaultOpt.disabled = true;
    quantityFields[index].appendChild(defaultOpt);
    itemPriceTable.forEach((item, itemIndex) => {
      let opt = document.createElement('option');
      opt.value = itemIndex;
      opt.innerHTML = `${item.friendlyName} (${warehouseArray[itemIndex].quantity})`;
      quantityFields[index].appendChild(opt);
    });

    arrayLoop.addEventListener('change', () => {
      let currentSelect = arrayLoop.selectedIndex - 1;
      image = warehouseMartItemImages[currentSelect];
      warehouseImages[index].src = image.src;
    });

    //arrayLoop.innerHTML = `Item: ${warehouseArray[index].itemName} (${warehouseArray[index].quantity})`;
  });

  Array.from(inputMenuFields).forEach((arrayLoop, index) => {
    let defaultOpt = document.createElement('option');
    defaultOpt.value = -1;
    defaultOpt.innerHTML = `# to Stock`;
    defaultOpt.selected = true;
    defaultOpt.disabled = true;
    inputMenuFields[index].appendChild(defaultOpt);
    for (let x = 0; x <= 5; x++) {
      let opt = document.createElement('option');
      opt.value = vendingControlNum[x];
      opt.innerHTML = vendingControlNum[x];
      arrayLoop.appendChild(opt);
    }
  });

  Array.from(vendingFields).forEach((arrayLoop, index) => {
    let defaultOpt = document.createElement('option');
    defaultOpt.value = -1;
    defaultOpt.innerHTML = `Select Machine`;
    defaultOpt.selected = true;
    defaultOpt.disabled = true;
    vendingFields[index].appendChild(defaultOpt);
    for (let x = 0; x < machines.length; x++) {
      let opt = document.createElement('option');
      opt.value = x;
      opt.innerHTML = `${machines[x].macName}`;
      arrayLoop.appendChild(opt);
    }

    arrayLoop.addEventListener('change', (e) => {
      console.log(vendingFields[index].selectedIndex);
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
          itemPriceTable[quantityFields[index].selectedIndex - 1].friendlyName,
          itemPriceTable[quantityFields[index].selectedIndex - 1].size,
          quantityFields[index].selectedIndex - 1,
          index
          // Adjusting it down by one because of the menu arrangement
        );
      } catch (error) {
        let messages = [];
        messages.push(error);
        displayMessages(messages, statusEl);
      }
      // Clear the fields
      //resetWarehouse();
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
    macSlotItem0: -1,
    macSlotPrice0: 0,
    macSlotSize0: 6,
    macSlot1: 0,
    macSlotItem1: -1,
    macSlotPrice1: 0,
    macSlotSize1: 6,
    macSlot2: 0,
    macSlotItem2: -1,
    macSlotPrice2: 0,
    macSlotSize2: 6,
    macSlot3: 0,
    macSlotItem3: -1,
    macSlotPrice3: 0,
    macSlotSize3: 6,
    macSlot4: 0,
    macSlotItem4: -1,
    macSlotPrice4: 0,
    macSlotSize4: 6,
    macSlot5: 0,
    macSlotItem5: -1,
    macSlotPrice5: 0,
    macSlotSize5: 6,
    macSlot6: 0,
    macSlotItem6: -1,
    macSlotPrice6: 0,
    macSlotSize6: 6,
    macSlot7: 0,
    macSlotItem7: -1,
    macSlotPrice7: 0,
    macSlotSize7: 6,
    macSlot8: 0,
    macSlotItem8: -1,
    macSlotPrice8: 0,
    macSlotSize8: 6,
    macSlot9: 0,
    macSlotItem9: -1,
    macSlotPrice9: 0,
    macSlotSize9: 6,
    macSlot10: 0,
    macSlotItem10: -1,
    macSlotPrice10: 0,
    macSlotSize10: 6,
    macSlot11: 0,
    macSlotItem11: -1,
    macSlotPrice11: 0,
    macSlotSize11: 6,
    macSlot12: 0,
    macSlotItem12: -1,
    macSlotPrice12: 0,
    macSlotSize12: 3,
    macSlot13: 0,
    macSlotItem13: -1,
    macSlotPrice13: 0,
    macSlotSize13: 3,
    macSlot14: 0,
    macSlotItem14: -1,
    macSlotPrice14: 0,
    macSlotSize14: 3,
    macSlot15: 0,
    macSlotItem15: -1,
    macSlotPrice15: 0,
    macSlotSize15: 3,
    macSlot16: 0,
    macSlotItem16: -1,
    macSlotPrice16: 0,
    macSlotSize16: 3,
    macSlot17: 0,
    macSlotItem17: -1,
    macSlotPrice17: 0,
    macSlotSize17: 3,
    macSlot18: 0,
    macSlotItem18: -1,
    macSlotPrice18: 0,
    macSlotSize18: 3,
    macSlot19: 0,
    macSlotItem19: -1,
    macSlotPrice19: 0,
    macSlotSize19: 3,
    macSlot20: 0,
    macSlotItem20: -1,
    macSlotPrice20: 0,
    macSlotSize20: 3,
    macSlot21: 0,
    macSlotItem21: -1,
    macSlotPrice21: 0,
    macSlotSize21: 3,
    macSlot22: 0,
    macSlotItem22: -1,
    macSlotPrice22: 0,
    macSlotSize22: 3,
    macSlot23: 0,
    macSlotItem23: -1,
    macSlotPrice23: 0,
    macSlotSize23: 3,
    macSlot24: 0,
    macSlotItem24: -1,
    macSlotPrice24: 0,
    macSlotSize24: 3,
    macSlot25: 0,
    macSlotItem25: -1,
    macSlotPrice25: 0,
    macSlotSize25: 3,
    macSlot26: 0,
    macSlotItem26: -1,
    macSlotPrice26: 0,
    macSlotSize26: 3,
    macSlot27: 0,
    macSlotItem27: -1,
    macSlotPrice27: 0,
    macSlotSize27: 3,
    macSlot28: 0,
    macSlotItem28: -1,
    macSlotPrice28: 0,
    macSlotSize28: 4,
    macSlot29: 0,
    macSlotItem29: -1,
    macSlotPrice29: 0,
    macSlotSize29: 4,
    macSlot30: 0,
    macSlotItem30: -1,
    macSlotPrice30: 0,
    macSlotSize30: 4,
    macSlot31: 0,
    macSlotItem31: -1,
    macSlotPrice31: 0,
    macSlotSize31: 4,
    macSlot32: 0,
    macSlotItem32: -1,
    macSlotPrice32: 0,
    macSlotSize32: 4,
    macSlot33: 0,
    macSlotItem33: -1,
    macSlotPrice33: 0,
    macSlotSize33: 4,
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
    // Example: entries[0][1]['macSlotSize' + x]
  }
};

resetWarehouse = (index, id, fName) => {
  let warehouseImages = document.getElementsByClassName('warehouseItem');
  let quantityFields = document.getElementsByClassName('warehouseQuantity');
  let inputTypeFields = document.getElementsByClassName('warehouseInput');
  let inputMenuFields = document.getElementsByClassName('warehouseInputMenu');
  let vendingFields = document.getElementsByClassName('vendingSelect');
  let slotFields = document.getElementsByClassName('vendingSlot');

  // Clears out/resets the various fields in the DOM then calls warehouseDOM to reset the values

  //document.getElementById('quan1').options[0].text
  Array.from(quantityFields).forEach((field) => {
    // Have to add one here to adjust for the index (which was subtracted by 1 in the passed in value)
    field.options[id + 1].text = `${fName} (${warehouseArray[id].quantity})`;
  });

  // quantityFields[index].innerHTML = '';
  // let defaultOpt = document.createElement('option');
  // defaultOpt.value = -1;
  // defaultOpt.innerHTML = `Select Item`;
  // defaultOpt.selected = true;
  // defaultOpt.disabled = true;
  // quantityFields[index].appendChild(defaultOpt);
  // itemPriceTable.forEach((item, itemIndex) => {
  //   let opt = document.createElement('option');
  //   opt.value = itemIndex;
  //   opt.innerHTML = `${item.friendlyName} (${warehouseArray[itemIndex].quantity})`;
  //   quantityFields[index].appendChild(opt);
  // });

  quantityFields[index].selectedIndex = 0;
  warehouseImages[index].src = '/vendingmachinemanager/assets/img/items/75.png';
  inputTypeFields[index].value = '';
  inputMenuFields[index].selectedIndex = 0;
  vendingFields[index].selectedIndex = 0;
  slotFields[index].innerHTML = '';
  let opt = document.createElement('option');
  opt.value = -1;
  opt.innerHTML = 'Select Slot';
  slotFields[index].appendChild(opt);
};

const vendingMachineDOM = (mach) => {

  

};
