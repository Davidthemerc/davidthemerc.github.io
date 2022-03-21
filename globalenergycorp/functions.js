// Random number function
// Accepts minimum and maximum number as parameters
const ranBetween = function randomNumbersBetweenMinAndMax(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const displayMessages = function (messages, messageEl) {
  messageEl.innerHTML = messages.join(' ');
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to generate a customer when one is not available in local storage
const generateCustomer = function createACustomerIfOneIsNotAvailable() {
  // Array of possible customer names
  const randomCustomerNames = [
    'Jimmy',
    'Sandra',
    'Robert',
    'Sally',
    'Tom',
    'Brianna',
    'Jose',
    'Taylor',
    'Bellamy',
    'Charlie',
    'Andy',
    'Sam',
  ];

  // Array of possible customer pronouns
  const randomCustomerPronouns = ['he has', 'she has', 'they have', 'ze has'];

  // Array of possible fuel grades

  const randomFuelGrades = ['regular', 'plus', 'premium'];

  // Pick a random name and pronoun
  customers.push({
    customerName: randomCustomerNames[ranBetween(0, 11)],
    customerPronoun: randomCustomerPronouns[ranBetween(0, 3)],
    customerMoney: ranBetween(5, 100),
    customerEdits: 0,
    customerFuelNeeded: ranBetween(1, 15),
    customerFuelType: randomFuelGrades[ranBetween(0, 2)],
    customerWantCarWash: carWashDecision(ranBetween(0, 1)),
    customerFueledUp: false,
    customerUsedCarWash: false,
    customerArrivalTimeForCheck: moment(),
    customerArrivalTime: moment().format('MMM Do, YYYY h:mm A'),
    id: uuidv4(),
  });

  // Save customer data
  saveCustomers(customers);
};

// Function to catch employees modifying the transaction system
const fraudDetection = function (change, edits) {
  edits *= 2;
  let chance = ((0.2 + edits) * change) ** 2;
  console.log(`${parseInt(chance)}% of being caught`);
  console.log(`0.2 + ${edits} times ${change} to the power of 2=${chance}`);
  let probability = ranBetween(1, 100);

  if (chance >= probability) {
    // Looks like the fraud detection system detected the employee modifying the transaction system!
    let messages = [];
    messages.push(
      `FRAUD DETECTED! What are you DOING? You CANNOT MODIFY the transaction system!`
    );
    displayMessages(messages, messageElement);
    sleep(3000).then(() => {
      // Set all arrays to blank, as the employee is fired (also prevents errors)
      customers = [];
      violations = [];
      fuelPrices = [];
      saveCustomers(customers);
      saveViolations(violations);
      saveFuelArray(fuelPrices);
      let messages = [];
      messages.push(`YOU ARE FIRED! YOU ARE FIRED! YOU ARE FIRED!`);
      displayMessages(messages, messageElement);
    });
    sleep(7000).then(() => {
      // Now send the user to the HR page and clear local storage.
      location.assign('fired.html');
      localStorage.clear();
    });
  }
};

// Function to retrieve saved violations
const getViolations = function () {
  const violationsJSON = localStorage.getItem('violations');

  if (violationsJSON !== null) {
    return JSON.parse(violationsJSON);
  } else {
    return [];
  }
};

const saveViolations = function (array) {
  localStorage.setItem('violations', JSON.stringify(array));
};

const checkViolations = function () {
  if (violations.length > 2) {
    // Set all arrays to blank, as the employee is fired (also prevents errors)
    customers = [];
    violations = [];
    fuelPrices = [];
    saveCustomers(customers);
    saveViolations(violations);
    saveFuelArray(fuelPrices);
    let messages = [];
    messages.push(`THREE STRIKES, YOU'RE FIRED!!!`);
    displayMessages(messages, messageElement);
    sleep(3000).then(() => {
      messages = [];
      messages.push(`GET OUT OF HERE!!!`);
      displayMessages(messages, messageElement);
    });
    sleep(5000).then(() => {
      // Now send the user to the HR page and clear local storage.
      location.assign('fired.html');
      localStorage.clear();
    });
  }
};

const updateFuelArray = function (reg, plus, prem, carWash) {
  fuelPrices = [reg, plus, prem, carWash];
  saveFuelArray(fuelPrices);
};

// Function to retrieve saved fuel price values from local storage (if available)
const getFuelArray = function () {
  const fuelJSON = localStorage.getItem('fuelPrices');

  if (fuelJSON !== null || fuelJSON !== undefined) {
    return JSON.parse(fuelJSON);
  } else {
    return ['', '', '', '', ''];
  }
};

const renderFuelPrices = function () {
  // Default values
  regularPrice.value = '';
  plusPrice.value = '';
  premiumPrice.value = '';
  carWashPrice.value = '';

  const fuelJSON = localStorage.getItem('fuelPrices');

  if (fuelJSON === undefined || fuelJSON === null) {
    return;
  } else {
    // Values from local storage
    regularPrice.value = fuelPrices[0];
    plusPrice.value = fuelPrices[1];
    premiumPrice.value = fuelPrices[2];
    carWashPrice.value = fuelPrices[3];
  }
};

const saveFuelArray = function (array) {
  localStorage.setItem('fuelPrices', JSON.stringify(array));
};

const fuelPriceCheck = function (arrayLoop) {
  if (arrayLoop.customerFuelType === 'regular') {
    return fuelPrices[0];
  } else if (arrayLoop.customerFuelType === 'plus') {
    return fuelPrices[1];
  } else {
    return fuelPrices[2];
  }
};

const fuelUpCheck = function (arrayLoop) {
  let messages = [];

  if (arrayLoop.customerFueledUp) {
    messages.push(
      `You fueled up ${arrayLoop.customerName}'s vehicle already! Why are you trying to do it again!`
    );
    violations.push(
      `Attempted to provide ${arrayLoop.customerName} with more fuel when they were already serviced!`
    );
    saveViolations(violations);
    saveCustomers(customers);
    renderCustomers(customers);
    displayMessages(messages, messageElement);
    sleep(2000).then(() => {
      checkViolations();
    });
    return;
  }

  let price = fuelPriceCheck(arrayLoop);

  // Define cost of fuel variable to shorten references here
  cost = arrayLoop.customerFuelNeeded * price;

  if (arrayLoop.customerMoney < price) {
    messages.push(
      `${arrayLoop.customerName} doesn't have enough money for even 1 gallon of ${arrayLoop.customerFuelType} fuel! Why did you try to serve them!`
    );
    violations.push(
      `Attempted to serve ${arrayLoop.customerName} when they didn't have enough money!`
    );
    saveViolations(violations);
    saveCustomers(customers);
    renderCustomers(customers);
    displayMessages(messages, messageElement);
    sleep(2000).then(() => {
      checkViolations();
    });
  } else if (arrayLoop.customerMoney === cost) {
    arrayLoop.customerMoney -= cost;
    arrayLoop.customerFuelNeeded -= 1;
    messages.push(
      `${arrayLoop.customerName} could not afford all the  ${arrayLoop.customerFuelType} fuel they needed, but ${arrayLoop.customerPronoun} were able to buy 1 gallon of ${arrayLoop.customerFuelType} fuel, ${arrayLoop.customerPronoun} $${arrayLoop.customerMoney} left.`
    );
    arrayLoop.customerFueledUp = true;
    saveCustomers(customers);
    renderCustomers(customers);
    displayMessages(messages, messageElement);
  } else if (arrayLoop.customerMoney > cost) {
    arrayLoop.customerMoney -= cost;
    messages.push(
      `${arrayLoop.customerName} successfully purchased ${arrayLoop.customerFuelNeeded} gallon(s) of ${arrayLoop.customerFuelType} fuel for $${cost}, ${arrayLoop.customerPronoun} $${arrayLoop.customerMoney} left.`
    );
    arrayLoop.customerFuelNeeded = 0;
    arrayLoop.customerFueledUp = true;
    saveCustomers(customers);
    renderCustomers(customers);
    displayMessages(messages, messageElement);
  } else if (arrayLoop.customerMoney < cost) {
    let lowerAmount = Math.floor(arrayLoop.customerMoney / price);
    cost = lowerAmount * price;
    arrayLoop.customerMoney -= cost;
    arrayLoop.customerFuelNeeded -= lowerAmount;
    messages.push(
      `${arrayLoop.customerName} could not afford all the ${arrayLoop.customerFuelType}  fuel they needed, but they were able to afford ${lowerAmount} gallon(s) of ${arrayLoop.customerFuelType} fuel for $${cost}, ${arrayLoop.customerPronoun} $${arrayLoop.customerMoney} left.`
    );
    arrayLoop.customerFueledUp = true;
    saveCustomers(customers);
    renderCustomers(customers);
    displayMessages(messages, messageElement);
  }
};

// Function to retrieve saved customer data from local storage (if available)
const getCustomers = function () {
  const customersJSON = localStorage.getItem('customers');

  if (customersJSON !== null) {
    return JSON.parse(customersJSON);
  } else {
    return [];
  }
};

const saveCustomers = function (customers) {
  localStorage.setItem('customers', JSON.stringify(customers));
};

const removeCustomer = function (id) {
  const customerIndex = customers.findIndex(function (customerArray) {
    return customerArray.id === id;
  });

  if (customerIndex > -1) {
    customers.splice(customerIndex, 1);
  }
};

const carWashLanguage = function (choice) {
  if (choice) {
    return `and would like to use the car wash.`;
  } else {
    return `and does not want to use the car wash.`;
  }
};

const carWashDecision = function (random) {
  if (random === 0) {
    //The customer wants a car wash
    return true;
  } // The customer doesn't want a car wash
  else return false;
};

// If the customer used the car wash already, provide text for an update
const carWashStatus = function (arrayLoop) {
  if (arrayLoop.customerUsedCarWash) {
    return ' Their car has been washed.';
  } else {
    if (arrayLoop.customerWantCarWash) {
      return ' Their car still needs a wash.';
    } else {
      return '';
    }
  }
};

const useCarWash = (arrayLoop) => {
  let messages = [];

  let price = fuelPrices[3];

  if (arrayLoop.customerWantCarWash === false) {
    messages.push(
      `${arrayLoop.customerName} doesn't want to use the car wash! Why are you trying to force them?`
    );
    violations.push(
      `Tried to send ${arrayLoop.customerName} through the car wash when they didn't want to use it!`
    );
    saveViolations(violations);
    displayMessages(messages, messageElement);
    sleep(2000).then(() => {
      checkViolations();
    });
    return;
  }

  if (arrayLoop.customerUsedCarWash === true) {
    messages.push(
      `${arrayLoop.customerName} already used the car wash! Don't waste company resources!`
    );
    violations.push(
      `Tried to send ${arrayLoop.customerName} through the car wash AGAIN!`
    );
    saveViolations(violations);
    displayMessages(messages, messageElement);
    sleep(2000).then(() => {
      checkViolations();
    });
    return;
  }
  if (arrayLoop.customerMoney >= price) {
    arrayLoop.customerMoney -= price;
    saveCustomers(customers);
    messages.push(
      `${arrayLoop.customerName} used the car wash. It cost $${price}, ${arrayLoop.customerName} now has $${arrayLoop.customerMoney}.`
    );
    displayMessages(messages, messageElement);
    arrayLoop.customerUsedCarWash = true;
    renderCustomers(customers);
    saveCustomers(customers);
  } else {
    messages.push(
      `${arrayLoop.customerName} doesn't have enough money to use the car wash! What are you doing!`
    );
    violations.push(
      `Tried to let ${arrayLoop.customerName} use the car wash when they didn't have enough money!`
    );
    saveViolations(violations);
    displayMessages(messages, messageElement);
    sleep(2000).then(() => {
      checkViolations();
    });
  }
};

// Function to render customers on the DOM
const renderCustomers = function (customerArray) {
  // Clear items already present in the output area
  document.querySelector('#outputArea').innerHTML = '';
  // Run a for each Loop to render each customer in the array
  customerArray.forEach(function (arrayLoop) {
    // Create the text, and buttons doing into the DOM
    const customerEl = document.createElement('div');
    const span = document.createElement('span');
    const editLink = document.createElement('a');
    const serveButton = document.createElement('button');
    const carWashButton = document.createElement('button');
    const kickButton = document.createElement('button');

    span.textContent = `At ${arrayLoop.customerArrivalTime}, a customer, ${
      arrayLoop.customerName
    } has arrived, ${arrayLoop.customerPronoun} $${
      arrayLoop.customerMoney
    } and need(s) ${arrayLoop.customerFuelNeeded} gallons of ${
      arrayLoop.customerFuelType
    } fuel, ${carWashLanguage(arrayLoop.customerWantCarWash)}${carWashStatus(
      arrayLoop
    )}`;
    editLink.textContent = `Edit Transaction Data`;
    serveButton.textContent = `Fuel up ${arrayLoop.customerName}'s vehicle?`;
    carWashButton.textContent = `Send ${arrayLoop.customerName}'s vehicle to the car wash?`;
    kickButton.textContent = `End ${arrayLoop.customerName}'s transaction?`;
    editLink.setAttribute('href', `customer.html#${arrayLoop.id}`);
    customerEl.appendChild(span);
    customerEl.appendChild(serveButton);
    customerEl.appendChild(carWashButton);
    customerEl.appendChild(kickButton);
    customerEl.appendChild(editLink);
    customerEl.className = 'rocks';
    document.querySelector('#outputArea').appendChild(customerEl);

    // Add event listener to car wash button
    carWashButton.addEventListener('click', () => {
      useCarWash(arrayLoop);
    });

    // Add event listener to end transaction button
    kickButton.addEventListener('click', function () {
      let price = fuelPriceCheck(arrayLoop);
      let carWashPrice = fuelPrices[3];
      let endTime = moment();
      let endTimeForCheck = endTime.format('MMM Do, YYYY h:mm A');
      let duration = `${endTime.diff(
        arrayLoop.customerArrivalTimeForCheck,
        'seconds'
      )} seconds`;

      // If you're ending the transaction, and the customer hasn't been fueled up, and they don't have enough money for 1 unit of fuel, then
      // They are broke and sending them away is the correct procedure
      if (
        arrayLoop.customerFueledUp === false &&
        arrayLoop.customerMoney < price
      ) {
        let messages = [];
        messages.push(
          `Great job! ${arrayLoop.customerName} didn't have enough money for even 1 gallon of ${arrayLoop.customerFuelType}, you did the right thing sending them away!`
        );
        removeCustomer(arrayLoop.id);
        saveCustomers(customers);
        renderCustomers(customers);
        displayMessages(messages, messageElement);
        return;
      }

      // If you're ending the transaction, and the customer has fueled up, run these checks instead
      // We'll want to make sure that they also were given the opportunity to use the car wash, if they wanted to
      if (
        (arrayLoop.customerFueledUp && arrayLoop.customerUsedCarWash) ||
        (arrayLoop.customerFueledUp && arrayLoop.customerWantCarWash === false)
      ) {
        let messages = [];
        messages.push(
          `Great job! ${arrayLoop.customerName} leaves as a satisfied customer at ${endTimeForCheck}. You served them in ${duration}.`
        );
        if (arrayLoop.customerFuelNeeded > 0) {
          messages.push(
            `Although, they probably wish they had a bit more cash for more fuel!`
          );
        }
        removeCustomer(arrayLoop.id);
        saveCustomers(customers);
        renderCustomers(customers);
        displayMessages(messages, messageElement);
        return;
      } else if (
        arrayLoop.customerFueledUp &&
        arrayLoop.customerUsedCarWash === false &&
        arrayLoop.customerWantCarWash === true &&
        arrayLoop.customerMoney < carWashPrice
      ) {
        let messages = [];

        messages.push(
          `${arrayLoop.customerName} leaves mostly satisfied at ${endTimeForCheck}; they wanted to use the car wash but didn't have enough money. You served them in ${duration}.`
        );

        removeCustomer(arrayLoop.id);
        saveCustomers(customers);
        renderCustomers(customers);
        displayMessages(messages, messageElement);
        return;
      } else if (
        arrayLoop.customerFueledUp &&
        arrayLoop.customerUsedCarWash === false &&
        arrayLoop.customerWantCarWash === true &&
        arrayLoop.customerMoney >= carWashPrice
      ) {
        let messages = [];
        messages.push(
          `${arrayLoop.customerName} leaves partially satisfied at ${endTimeForCheck}; they wanted to use the car wash, but you didn't offer it to them! You served them in ${duration}.`
        );
        violations.push(
          `Sent ${arrayLoop.customerName} away when they still wanted to use the car wash.`
        );
        saveViolations(violations);
        removeCustomer(arrayLoop.id);
        saveCustomers(customers);
        renderCustomers(customers);
        displayMessages(messages, messageElement);
        sleep(2000).then(() => {
          checkViolations();
        });
        return;
      } else if (
        arrayLoop.customerFueledUp === false &&
        arrayLoop.customerUsedCarWash
      ) {
        let messages = [];
        messages.push(
          `You failed to fuel up ${arrayLoop.customerName}'s vehicle at ${endTimeForCheck}; they could have been a valuable customer! You sent them away after ${duration}.`
        );
        violations.push(
          `Failed to fuel up ${arrayLoop.customerName}'s vehicle.`
        );
        saveViolations(violations);
        removeCustomer(arrayLoop.id);
        saveCustomers(customers);
        renderCustomers(customers);
        displayMessages(messages, messageElement);
        sleep(2000).then(() => {
          checkViolations();
        });
        return;
      } else {
        let messages = [];
        messages.push(
          `You sent ${arrayLoop.customerName} away at ${endTimeForCheck} without providing any services! That could have been a valuable paying customer!`
        );
        violations.push(
          `Failed to provide any services to ${arrayLoop.customerName}.`
        );
        saveViolations(violations);
        removeCustomer(arrayLoop.id);
        saveCustomers(customers);
        renderCustomers(customers);
        displayMessages(messages, messageElement);
        sleep(2000).then(() => {
          checkViolations();
        });
        return;
      }
    });

    // Add event listener to fuel up button
    serveButton.addEventListener('click', function () {
      fuelUpCheck(arrayLoop);
    });
  });
};
