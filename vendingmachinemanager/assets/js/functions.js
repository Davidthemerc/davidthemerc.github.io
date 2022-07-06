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
      paidDay: 0,
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
    messages.push('New locations are now available!');
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
        agencyGenerateLocations();
      }
    } else {
      for (let i = 0; i <= 2; i++) {
        agencyGenerateLocations();
      }
    }
  } else {
    loadExistingLocations();

    // Show currently contracted (accepted) locations
    showMyLocations();
  }

  // Set the agency day to keep track
  manager.lastUsedAgencyDay = manager.agencyDay;
  saveJSON(manager, 'VMM-managerData');
};

const showMyLocations = () => {
  const place = document.getElementById('yourLocations');
  place.innerHTML = '';

  yourVendLocations.forEach((myLocation, index) => {
    const div = document.createElement('div');
    const spanTitle = document.createElement('span');
    const spanTerms = document.createElement('span');
    const releaseButton = document.createElement('button');
    let myLocationText = '';
    spanTitle.textContent = myLocation.name;
    spanTitle.className = 'spanTitle block';
    spanTerms.className = 'block';
    releaseButton.textContent = 'Release';
    releaseButton.className = 'mb-1';
    div.className = 'col-4 listing mb-1';

    if (myLocation.termType === 1) {
      myLocationText = `Payment Terms: You must pay flat fee of $${myLocation.termAmt} per week in exchange for placement.`;
    } else {
      myLocationText = `Payment Terms: You must pay ${myLocation.termAmt}% of your gross sales in exchange for placement.`;
    }

    spanTerms.textContent = myLocationText;

    releaseButton.addEventListener('click', () => {
      try {
        if (myLocation.snackID.length > 0) {
          throw new Error(
            `You can't release a location you currently have a machine at! Please move the machine first`
          );
        }
        let messages = [];
        messages.push(
          `You are released from your placement agreement with ${myLocation.name}.`
        );
        displayMessages(messages, statusEl);

        // Code to actually return this location to the locationsArray
        // Remove the object from this array and put it back into the locations array
        locationsArray.push({
          name: myLocation.name,
          terms: `${myLocation.name}`,
          termVar: myLocation.termType,
          termCost: ranBetween(myLocation.termAmtLow, myLocation.termAmtHigh),
          termCostLow: myLocation.termAmtLow,
          termCostHigh: myLocation.termAmtHigh,
          termText: '',
          priceTier: myLocation.priceTier,
          locationID: myLocation.ID,
        });
        saveJSON(locationsArray, 'VMM-locationsArray');

        const spliceIndex = yourVendLocations.findIndex(
          (location) => location.ID === myLocation.ID
        );

        if (spliceIndex > -1) {
          yourVendLocations.splice(spliceIndex, 1);
        }
        saveJSON(yourVendLocations, 'VMM-vendLocations');

        // Delete the your location listing
        div.remove();
      } catch (error) {
        let messages = [];
        messages.push(error);
        displayMessages(messages, statusEl);
      }
    });

    div.appendChild(spanTitle);
    div.appendChild(spanTerms);
    div.appendChild(releaseButton);
    place.appendChild(div);
  });
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
  let locationTermCostLow = pickedLocation.termCostLow;
  let locationTermCostHigh = pickedLocation.termCostHigh;
  let locationTermText = '';
  let locationID = pickedLocation.locationID;
  let locationTier = pickedLocation.priceTier;

  if (locationTermVar === 1) {
    locationTermText = `${locationTerms} a flat fee of $${locationTermCost} per week in exchange for placement.`;
  } else {
    locationTermText = `${locationTerms} ${locationTermCost}% of your gross sales in exchange for placement.`;
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
    locationTermCostLow,
    locationTermCostHigh,
    locationTermVar,
    locationID,
    locationTier
  );
};

const loadExistingLocations = () => {
  if (availableLocationsArray.length !== 0) {
    availableLocationsArray.forEach((tag) => {
      locationName = tag.name;
      locationTermText = tag.termText;
      locationTermCost = tag.termCost;
      locationTermCostLow = tag.termCostLow;
      locationTermCostHigh = tag.termCostHigh;
      locationTermVar = tag.termVar;
      locationID = tag.locationID;
      locationTier = tag.priceTier;
      agencyDom(
        locationName,
        locationTermText,
        locationTermCost,
        locationTermCostLow,
        locationTermCostHigh,
        locationTermVar,
        locationID,
        locationTier
      );
    });
  } else {
    const place = document.getElementById('status');
    const paragraph = document.createElement('p');
    paragraph.textContent =
      'Sorry, there are no locations currently available at this time! Check back next Monday.';
    paragraph.className = 'mb-2';
    place.appendChild(paragraph);
  }
};

const agencyDom = (
  locationName,
  locationTermText,
  locationTermCost,
  locationTermCostLow,
  locationTermCostHigh,
  locationTermVar,
  locationID,
  locationTier
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
    try {
      locationDeal(
        locationName,
        locationTermCost,
        locationTermCostLow,
        locationTermCostHigh,
        locationTermVar,
        div.id,
        locationID,
        locationTier
      );

      // Show the new location
      showMyLocations();
    } catch (error) {
      let messages = [];
      messages.push(error);
      displayMessages(messages, statusEl);
    }
  });

  div.appendChild(spanTitle);
  div.appendChild(spanTerms);
  div.appendChild(acceptButton);
  place.appendChild(div);
};

// Deal when a location offer is accepted
const locationDeal = (
  name,
  termCost,
  termCostLow,
  termCostHigh,
  termVar,
  id,
  locationID,
  locationTier
) => {
  if (manager.numOfMachines === 0) {
    throw new Error(
      `You don't have any vending machines! You don't need a location yet!`
    );
  }

  if (yourVendLocations.length > manager.numOfMachines + 3) {
    throw new Error(`You have enough locations already! You don't need more!`);
  }

  let terms;

  termVar === 1
    ? (terms = `a flat fee of $${termCost} per week.`)
    : (terms = `${termCost}% of your gross sales.`);

  let messages = [];
  messages.push(
    `You've chosen to accept ${name}'s offer to place a vending machine at their location.`,
    `You will need to pay them ${terms}`
  );
  displayMessages(messages, statusEl);

  // Push this location to the your Vending Locations array
  yourVendLocations.push({
    name: name,
    termType: termVar,
    termAmt: termCost,
    termAmtLow: termCostLow,
    termAmtHigh: termCostHigh,
    snackPresent: false,
    snackID: '',
    sodaPresent: false,
    sodaID: '',
    priceTier: locationTier,
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
  let messages = [];
  displayMessages(messages, statusEl);

  manager.day += 1;
  manager.agencyDayCounter += 1;

  if (manager.agencyDayCounter === 7) {
    manager.agencyDayCounter = 0;
    manager.agencyDay += 1;
    manager.paidDay = 1;
  }

  // If a week has passed, subtract the machine weekly fee (if applicable)
  if (manager.paidDay === 1) {
    let localMachines = machines;

    localMachines.forEach((mach) => {
      if (mach.macLocation === 'warehouse') {
        return;
      }

      let matchLocation = yourVendLocations.find(
        (loc) => loc.ID === mach.macLocation
      );
      let payment = 0;
      if (matchLocation.termType === 1) {
        payment = matchLocation.termAmt;

        if (manager.money >= payment) {
          moneyExchange('-', payment);
          let messages = [];
          messages.push(
            `Paid weekly fee of $${payment} for placement of machine ${mach.macName} at ${matchLocation.name}.`
          );
          displayMessages(messages, statusEl);
        } else {
          // Not enough money to pay location! Ruh roh.
          let messages = [];
          messages.push(
            `You can't afford to pay ${matchLocation.name}! You're forced to relocate your machine to your warehouse, for now.`
          );
          displayMessages(messages, statusEl);

          // Take the actions to terminate the agreement.
          mach.macLocation = 'warehouse';
          saveJSON(localMachines, 'VMM-vendingMachines');
        }
      }
    });
    manager.paidDay = 0;
  }

  dailySales();

  saveJSON(manager, 'VMM-managerData');
};

const wmartBuy = (found, index, fields) => {
  let quantity = selectFields[index].value;
  let itemName = found.friendlyName;

  if (fields[index].selectedIndex === 0) {
    throw new Error(`You can't buy ${itemName} if a quantity isn't selected!`);
  }

  let cost = found.itemPrice * parseInt(fields[index].value).toFixed(2);

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
      opt.innerHTML = `${item.friendlyName} (${warehouseArray[itemIndex].quantity}) (M${itemPriceTable[itemIndex].maxNum})`;
      quantityFields[index].appendChild(opt);
    });

    arrayLoop.addEventListener('change', () => {
      let currentSelect = arrayLoop.selectedIndex - 1;
      image = warehouseMartItemImages[currentSelect];
      warehouseImages[index].src = image.src;

      // Auto select the first available machine when choosing an item
      if (vendingFields[index].selectedIndex === 0) {
        vendingFields[index].selectedIndex = 1;
      }

      slots[index].innerHTML = '';
      for (
        let x = 0;
        x < machines[vendingFields[index].selectedIndex - 1].numOfSlots;
        x++
      ) {
        let localMachine = machines[vendingFields[index].selectedIndex - 1];
        if (
          localMachine['macSlotSize' + x] ===
          itemPriceTable[quantityFields[index].value].size
        ) {
          let opt = document.createElement('option');
          opt.value = x;
          opt.innerHTML = `Slot ${x}`;
          slots[index].appendChild(opt);
        } else {
          continue;
        }
      }
    });

    //arrayLoop.innerHTML = `Item: ${warehouseArray[index].itemName} (${warehouseArray[index].quantity})`;
  });

  Array.from(inputMenuFields).forEach((arrayLoop, index) => {
    let defaultOpt = document.createElement('option');
    defaultOpt.value = -1;
    defaultOpt.innerHTML = `#`;
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
    //defaultOpt.disabled = true;
    vendingFields[index].appendChild(defaultOpt);
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

      slots[index].innerHTML = '';
      for (let x = 0; x < machines[e.target.value].numOfSlots; x++) {
        let localMachine = machines[e.target.value];
        if (
          localMachine['macSlotSize' + x] ===
          itemPriceTable[quantityFields[index].value].size
        ) {
          let opt = document.createElement('option');
          opt.value = x;
          opt.innerHTML = `Slot ${x}`;
          slots[index].appendChild(opt);
        } else {
          continue;
        }
      }
    });
  });

  Array.from(buttonFields).forEach((arrayLoop, index) => {
    arrayLoop.addEventListener('click', () => {
      try {
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
    });
  });
};

const moneyExchange = (action, amount) => {
  action === '-' ? (manager.money -= amount) : (manager.money += amount);
  //Crazy Floating Numbers Prevention
  manager.money *= 100;
  manager.money = Math.round(manager.money);
  manager.money /= 100;
  saveJSON(manager, 'VMM-managerData');
  currentMoney.innerHTML = `$${manager.money.toFixed(2)}`;
};

const floatFix = (number) => {
  number *= 100;
  number = Math.round(number);
  number /= 100;
  return number;
};

// Function to give a machine location their % of sales cut.
// Only used when the location requires a % of sales.
const locationCut = (amount, termAmt) => {
  // Turn the termAmt (which is an integer) into a percentage
  termAmt /= 100;
  // Let's take their cut percentage from the sales
  amount = amount * termAmt;

  //Float fix
  amount = floatFix(amount);

  return amount;
};

const updateMoney = (money) => {
  let moneyEl = document.getElementById('currentMoney');
  moneyEl.innerHTML = '';
  moneyEl.innerHTML = `$${money.toFixed(2)}`;
};

const addVendingMachine = (kind, variant) => {
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
    macType: `${kind}`,
    macName: newName,
    macVariant: variant,
    // Machine UUID
    macID: uuidv4(),
    // Machine Location, Blank at time of purchase
    macLocation: 'warehouse',
    // Property specifying the number of slots
    numOfSlots: 34,
    // Machine slot # and then the size
    priceTier: -1,
    // Property controlling autostock
    autoStock: true,
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

const resetWarehouse = (index, id, fName) => {
  let warehouseImages = document.getElementsByClassName('warehouseItem');
  let quantityFields = document.getElementsByClassName('warehouseQuantity');
  let inputTypeFields = document.getElementsByClassName('warehouseInput');
  let inputMenuFields = document.getElementsByClassName('warehouseInputMenu');
  let vendingFields = document.getElementsByClassName('vendingSelect');
  let slotFields = document.getElementsByClassName('vendingSlot');

  // Clears out/resets the various fields in the DOM then calls warehouseDOM to reset the values

  Array.from(quantityFields).forEach((field) => {
    // Have to add one here to adjust for the index (which was subtracted by 1 in the passed in value)
    field.options[
      id + 1
    ].text = `${fName} (${warehouseArray[id].quantity}) (M${itemPriceTable[id].maxNum})`;
  });

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
  // Write code to create HTML in the DOM identical/nearly identical to how the standard snack machine page
  // is arranged. This way, looking to the future, I can support multiple different types of vending machines.
  // They'll be different in terms of slot size arrangments, slot row arrangements, etc.
  // First, identify what type and variant the machine is (e.g. Snack Variant 0)
  let localType = mach.macType;
  let localVariant = mach.macVariant;
  let localTypeArray;
  let leftSide = document.getElementById('vendingLeft');
  let rightSide = document.getElementById('vendingRight');
  leftSide.innerHTML = '';
  rightSide.innerHTML = '';

  // If the user changes the machine tap/click context option in the menu, execute the action
  machineOption.addEventListener('change', (e) => {
    select = e.target.value;
  });

  // Now, we need to match the machine with its variant data in the appropriate variants array
  localType = 'snack'
    ? (localTypeArray = snackVariants)
    : (localTypeArray = sodaVariants);

  // Now, begin the first (left side) loop and start construction!
  localTypeArray[localVariant].leftSlots.forEach((arrayLoop) => {
    let div = document.createElement('div');
    let img = document.createElement('img');
    div.className = `col-${arrayLoop.size} snack d-flex justify-content-center snackcolumn`;
    div.id = `slot${arrayLoop.position}`;
    img.className = 'snackimage';
    // Check if there's actually an item in the slot first, if not, blank image please
    if (mach['macSlotItem' + arrayLoop.position] === -1) {
      img.src = `/vendingmachinemanager/assets/img/items/blank${arrayLoop.size}.png`;
      // Now check if there's actually items in stock in that slot. If not, blank!
    } else if (mach['macSlot' + arrayLoop.position] < 1) {
      img.src = `/vendingmachinemanager/assets/img/items/blank${arrayLoop.size}.png`;
    } else {
      img.src = `/vendingmachinemanager/assets/img/items/item${
        mach['macSlotItem' + arrayLoop.position]
      }.png`;
    }
    img.addEventListener('click', () => {
      if (mach['macSlotItem' + arrayLoop.position] === -1) {
        // Do nothing
      } else {
        if (select === '0') {
          changePrice(arrayLoop.position, mach);
        } else if (select === '1') {
          removeItem(arrayLoop.position, mach);
        } else if (select === '2') {
          showQuantity(arrayLoop.position, mach);
        }
      }
    });
    leftSide.appendChild(div);
    div.appendChild(img);
  });

  // Now, begin the second (right side) loop and start construction!
  localTypeArray[localVariant].rightSlots.forEach((arrayLoop) => {
    let div = document.createElement('div');
    let img = document.createElement('img');
    div.className = `col-${arrayLoop.size} snack d-flex justify-content-center snackcolumn`;
    div.id = `slot${arrayLoop.position}`;
    img.className = 'snackimage';
    // Check if there's actually an item in the slot first, if not, blank image please
    if (mach['macSlotItem' + arrayLoop.position] === -1) {
      img.src = `/vendingmachinemanager/assets/img/items/blank${arrayLoop.size}.png`;
      // Now check if there's actually items in stock in that slot. If not, blank!
    } else if (mach['macSlot' + arrayLoop.position] < 1) {
      img.src = `/vendingmachinemanager/assets/img/items/blank${arrayLoop.size}.png`;
    } else {
      img.src = `/vendingmachinemanager/assets/img/items/item${
        mach['macSlotItem' + arrayLoop.position]
      }.png`;
    }
    img.addEventListener('click', () => {
      if (mach['macSlotItem' + arrayLoop.position] === -1) {
        // Do nothing
      } else {
        if (select === '0') {
          changePrice(arrayLoop.position, mach);
        } else if (select === '1') {
          removeItem(arrayLoop.position, mach);
        } else if (select === '2') {
          showQuantity(arrayLoop.position, mach);
        }
      }
    });
    rightSide.appendChild(div);
    div.appendChild(img);
  });
};

const restockMachine = (mach) => {
  let slots = mach.numOfSlots;
  // Run a loop for all available slots on this machine
  for (let x = 0; x < slots; x++) {
    // Get ID of item
    let localItemID = mach['macSlotItem' + x];
    if (localItemID === -1) {
      continue;
    } else {
      // Get quantity of item
      let localItemQuantity = mach['macSlot' + x];
      let localMaxQuantity = itemPriceTable[localItemID].maxNum;
      let localDifference = 0;
      // Attempt to stock the machine based on the ID and contents of warehouse

      if (localItemQuantity < localMaxQuantity) {
        // This slot is not filled, so fill it.
        // Check if the warehouse has stock to match the difference first!
        localDifference = localMaxQuantity - localItemQuantity;
        if (warehouseArray[localItemID].quantity >= localDifference) {
          // There is enough stock, remove the appropriate quantity from warehouse
          warehouseStock(-1 * localDifference, localItemID);
          mach['macSlot' + x] += localDifference;
          saveJSON(machines, 'VMM-vendingMachines');
        } else if (
          warehouseArray[localItemID].quantity < localDifference &&
          warehouseArray[localItemID].quantity > 0
        ) {
          // If there's more than 1 item in the warehouse, but less than the difference,
          // stock it all, regardless
          mach['macSlot' + x] += warehouseArray[localItemID].quantity;
          warehouseStock(
            -1 * warehouseArray[localItemID].quantity,
            localItemID
          );
          saveJSON(machines, 'VMM-vendingMachines');
        }
      }
    }
  }
};

const changePrice = (slot, mach) => {
  let item = itemPriceTable[mach['macSlotItem' + slot]].friendlyName;
  let price = prompt(`Please set the price for ${item} in Slot ${slot}.`);

  if (!isNaN(parseInt(price))) {
    // Set price
    price = parseFloat(parseFloat(price).toFixed(2));
    let displayPrice = parseFloat(price).toFixed(2);
    mach['macSlotPrice' + slot] = price;
    saveJSON(machines, 'VMM-vendingMachines');

    // Price message
    let messages = [];
    messages.push(
      `You set the price for ${item} in Slot ${slot} to $${displayPrice}.`
    );
    displayMessages(messages, statusEl);
  } else {
    price = 0;
    let displayPrice = parseFloat(price).toFixed(2);
    // Price message
    let messages = [];
    messages.push(
      `Invalid entry. Slot ${slot} Price was reset to $${displayPrice}`
    );
    displayMessages(messages, statusEl);
    mach['macSlotPrice' + slot] = price;
    saveJSON(machines, 'VMM-vendingMachines');
  }
};

const removeItem = (slot, mach) => {
  // Removes clicked/tapped item from the machine and returns the items
  // stored back to the Warehouse
  let item = itemPriceTable[mach['macSlotItem' + slot]].friendlyName;
  let localItemID = mach['macSlotItem' + slot];
  let localItemQuantity = mach['macSlot' + slot];

  warehouseStock(localItemQuantity, localItemID);
  mach['macSlot' + slot] = 0;
  mach['macSlotPrice' + slot] = 0;
  mach['macSlotItem' + slot] = -1;
  saveJSON(machines, 'VMM-vendingMachines');

  // Remove message
  let messages = [];
  messages.push(`You removed ${item} from Slot ${slot}.`);
  displayMessages(messages, statusEl);

  //Reload DOM after removing
  vendingMachineDOM(mach);
};

const showQuantity = (slot, mach) => {
  let item = itemPriceTable[mach['macSlotItem' + slot]].friendlyName;
  let localItemQuantity = mach['macSlot' + slot];
  let localItemPrice = mach['macSlotPrice' + slot].toFixed(2);

  // Display quantity message
  let messages = [];
  messages.push(
    `There are ${localItemQuantity} ${item} in stock in Slot ${slot}.<br> The price of ${item} in Slot ${slot} is $${localItemPrice}.`
  );
  displayMessages(messages, statusEl);
};

const dailySales = () => {
  // First, we need to analyze how many machines, if any, are available
  // Establish a local variable using the array
  let localMachines = machines;
  let localItemPenalty = [0, 0, 0];

  // First, run a forEach Loop to determine how many slots have duplicate snacks
  localMachines.forEach((mach) => {
    if (mach.macLocation === 'warehouse') {
      // We'll skip this machine, since it's not placed
      return;
    }
    // Set variable to number of slots
    // We'll need this to know how many slots there are to check
    let slots = mach.numOfSlots;

    for (let x = 0; x < slots; x++) {
      if (mach['macSlotItem' + x] === -1) {
        continue;
      } else {
        // Basically, each item that the same item is placed in the machine, the item's
        // corresponding entry in this array will increase by 0.6, applying a rapid penalty.
        // The number of sales that COULD have been,will be divided by this array number.
        // E.G. if you could have sold 8 chips per slot, but stocked 4 slots of the same chips
        // you will now sell an average of 2 chips per slot, but probably less, because if the
        // RNG rolls a number lower than what can be divided by the penalty #, you might sell
        // EVEN less than that (possibly 0!) Don't duplicate too many items!
        localItemPenalty[mach['macSlotItem' + x]] += 0.6;
      }
    }
  });

  // Next, run a forEach loop as we'll be running this code on each machine
  localMachines.forEach((mach) => {
    if (mach.macLocation === 'warehouse') {
      return;
    }

    let matchLocation = yourVendLocations.find(
      (loc) => loc.ID === mach.macLocation
    );
    let percent = 0;
    if (matchLocation.termType === 2) {
      percent = matchLocation.termAmt;
    }
    if (mach.macLocation === 'warehouse') {
      // We'll skip this machine, since it's not placed
      return;
    }

    // Set variable to number of slots
    // We'll need this to know how many slots there are to check
    let slots = mach.numOfSlots;

    //Next, find out how many slots actually have items
    for (let x = 0; x < slots; x++) {
      // Slots that don't have stock (-1) will be skipped
      if (mach['macSlotItem' + x] === -1) {
        //console.log(`There is no item in slot ${x}!`);
        // We don't want to spam the console with a lot of empty slots!
        continue;
      } else if (mach['macSlot' + x] === 0) {
        //Nothing in stock!
        console.log(`There's nothing in stock in slot ${x}! Skipping!`);
        // If the slot is empty, reset it
        if (mach['macSlot' + x] === 0) {
          mach['macSlotItem' + x] = -1;
          saveJSON(localMachines, 'VMM-vendingMachines');
        }
        continue;
      } else if (mach['macSlotPrice' + x] === 0) {
        // I can't believe it, but they failed to set the price!
        // console.log(`You forgot to set a price for the item in slot ${x}!!!`);
        // Else, we'll actually run the code here
      } else {
        let localItemID = mach['macSlotItem' + x];
        let localItemPrice = mach['macSlotPrice' + x];
        let localItemQuantity = mach['macSlot' + x];
        let localFairPrice =
          fairPriceTable[localItemID]['tierPrice' + localItemID];
        let salesForce = 0;
        let salesNumber = Math.round(
          ranBetween(0, 8) / localItemPenalty[localItemID]
        );
        // console.log(
        //   `The price for this item is $${localItemPrice.toFixed(2)}.`
        // );
        // console.log(
        //   `The fair price for this item is $${localFairPrice.toFixed(2)}`
        // );
        // console.log(`There are ${localItemQuantity} items currently in stock.`);
        if (localItemPrice === localFairPrice) {
          console.log(
            `The price is fair, so there are no sales modifiers active.`
          );
          // Fair price, so there won't be a "salesForce" impact
          if (localItemQuantity >= salesNumber) {
            mach['macSlot' + x] -= salesNumber;

            // This represents the gross sales
            let salesAmount = salesNumber * localItemPrice;

            // If percent is greater than 0, then this machine's location
            // uses percent of sales pricing
            // This is essentially net sales, after paying the location fee
            if (percent > 0) {
              salesAmount -= locationCut(salesAmount, percent);
            }

            moneyExchange('+', salesAmount);
            saveJSON(localMachines, 'VMM-vendingMachines');
          } else {
            moneyExchange('+', localItemQuantity * localItemPrice);
            mach['macSlot' + x] = 0;
            mach['macSlotItem' + x] = -1;
            saveJSON(localMachines, 'VMM-vendingMachines');
          }

          // If the slot is empty after all this, reset it
          if (localItemQuantity === 0) {
            mach['macSlotItem' + x] = -1;
            saveJSON(localMachines, 'VMM-vendingMachines');
          }
        } else if (localItemPrice > localFairPrice) {
          // Price is too high! The salesForce equation will draw a penalty!
          // Multiplying number and rounding to cut off floating point numbers
          salesForce = Math.round(
            Math.abs((localItemPrice / localFairPrice) * 1000)
          );
          // Dividing by 10 to give expressed percentage (e.g. 100)
          salesForce /= 10;
          // Only 45% of the "above fair price" percentage actually affects sales
          // So if you jacked up the price 100%, you'll only lose 45% of sales.
          salesForce *= 0.45;
          if (salesForce > 100) {
            salesForce = 100;
          }

          console.log(
            `The price is higher than the fair price, so there will be a ${salesForce}% hit to sales.`
          );
          salesForce /= 100;
          let oldSalesNumber = salesNumber;
          salesNumber = Math.round(salesNumber - salesNumber * salesForce);
          console.log(
            `Could have sold ${oldSalesNumber}, but sold ${salesNumber} instead.`
          );
          if (localItemQuantity >= salesNumber) {
            mach['macSlot' + x] -= salesNumber;

            // This represents the gross sales
            let salesAmount = salesNumber * localItemPrice;

            // If percent is greater than 0, then this machine's location
            // uses percent of sales pricing
            // This is essentially net sales, after paying the location fee
            if (percent > 0) {
              salesAmount -= locationCut(salesAmount, percent);
            }

            moneyExchange('+', salesAmount);
            saveJSON(localMachines, 'VMM-vendingMachines');
          } else {
            // This represents the gross sales
            let salesAmount = localItemQuantity * localItemPrice;

            // If percent is greater than 0, then this machine's location
            // uses percent of sales pricing
            // This is essentially net sales, after paying the location fee
            if (percent > 0) {
              salesAmount -= locationCut(salesAmount, percent);
            }

            moneyExchange('+', salesAmount);
            mach['macSlot' + x] = 0;
            mach['macSlotItem' + x] = -1;
            saveJSON(localMachines, 'VMM-vendingMachines');
          }
        } else if (localItemPrice < localFairPrice) {
          // Price is low! The salesForce equation will increase sales slightly!
          salesForce = Math.round(
            Math.abs(1 - localItemPrice / localFairPrice) * 1000
          );
          salesForce /= 10;
          console.log(
            `The price is lower than the fair price, so there will be a ${salesForce}% increase to sales.`
          );
          salesForce /= 100;
          let oldSalesNumber = salesNumber;
          salesNumber = Math.round(salesNumber + salesNumber * salesForce);

          // Don't let more items sell than you have!
          if (salesNumber > localItemQuantity) {
            salesNumber = localItemQuantity;
          }

          console.log(
            `Would have sold ${oldSalesNumber}, but sold ${salesNumber} instead!`
          );
          if (localItemQuantity >= salesNumber) {
            mach['macSlot' + x] -= salesNumber;

            // This represents the gross sales
            let salesAmount = salesNumber * localItemPrice;

            // If percent is greater than 0, then this machine's location
            // uses percent of sales pricing
            // This is essentially net sales, after paying the location fee
            if (percent > 0) {
              salesAmount -= locationCut(salesAmount, percent);
            }

            moneyExchange('+', salesAmount);
            saveJSON(localMachines, 'VMM-vendingMachines');
          } else {
            // This represents the gross sales
            let salesAmount = localItemQuantity * localItemPrice;

            // If percent is greater than 0, then this machine's location
            // uses percent of sales pricing
            // This is essentially net sales, after paying the location fee
            if (percent > 0) {
              salesAmount -= locationCut(salesAmount, percent);
            }

            moneyExchange('+', salesAmount);
            mach['macSlot' + x] = 0;
            mach['macSlotItem' + x] = -1;
            saveJSON(localMachines, 'VMM-vendingMachines');
          }

          // If the slot is empty after all this, reset it
          if (localItemQuantity === 0) {
            mach['macSlotItem' + x] = -1;
            saveJSON(localMachines, 'VMM-vendingMachines');
          }
        }
      }
    }

    if (mach.autoStock === true) {
      //console.log(`Auto-restocking is on!`);
      restockMachine(mach);
    }
  });
};
