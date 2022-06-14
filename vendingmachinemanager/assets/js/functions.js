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
  } else return [0, 0, 0];
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

const warehouseStock = (quantity, index) => {
  quantity = parseInt(quantity);
  warehouseArray[index] += quantity;
  saveJSON(warehouseArray, 'VMM-warehouseData');
};

const warehouseDOM = () => {
  let quantityFields = document.getElementsByClassName('warehouseQuantity');
  let inputTypeFields = document.getElementsByClassName('warehouseInput');
  let inputMenuFields = document.getElementsByClassName('warehouseInputMenu');
  let vendingFields = document.getElementsByClassName('vendingSelect');

  Array.from(quantityFields).forEach((arrayLoop, index) => {
    arrayLoop.innerHTML = `Quantity Available: ${warehouseArray[index]}`;
  });

  // If some moron types a value and picks a value from the dropdown menu, be sure to error out!
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
};
