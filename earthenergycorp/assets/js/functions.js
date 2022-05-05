'use strict';

// Random number function
// Accepts minimum and maximum number as parameters
const ranBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Function to retrieve the user's coordinates from the IPWhoIs API, based on the approximate location of
// their Internet ServiceProvider
const callAPI = async () => {
  // Updated to HTTPS
  const response = await fetch(`https://ipwhois.app/json/`);

  // If response is good,
  if (response.status === 200) {
    let data = await response.json();
    longitude = data.longitude;
    latitude = data.latitude;
  } else {
    throw new Error('The API data did not come back!');
  }

  // Once the API has pulled the coordinates, call the map
  callMap();

  // Get the distance
  let distance = getDistance(
    stationLatitude,
    stationLongitude,
    latitude,
    longitude,
    'K'
  );

  // Now that we know the distance, calculate the prices
  // There are several price tiers, based on distance to the distribution center
  // Tier 1 - Within 1 Kilometer, Tier 2 - Within 2 Kilometers, Tier 3 - Within 5 Km, Tier 4 - Within 10 Km, Tier 5 - Within 15 Km
  // Tier 6 - Greater than 15 Km away

  const standardRegularPrice = 4.99;
  const standardPlusPrice = 5.19;
  const standardPremiumPrice = 5.39;
  let tier;

  if (distance < 1) {
    console.log('Less than 1 Km away!');
    updateFuelArray(0, standardRegularPrice, 'regular fuel');
    updateFuelArray(1, standardPlusPrice, 'plus fuel');
    updateFuelArray(2, standardPremiumPrice, 'premium fuel');
    tier = 1;
  } else if (distance < 2) {
    console.log('Less than 2 Km away!');
    updateFuelArray(0, standardRegularPrice + 0.25, 'regular fuel');
    updateFuelArray(1, standardPlusPrice + 0.25, 'plus fuel');
    updateFuelArray(2, standardPremiumPrice + 0.25, 'premium fuel');
    tier = 2;
  } else if (distance < 5) {
    console.log('Less than 5 Km away!');
    updateFuelArray(0, standardRegularPrice + 0.35, 'regular fuel');
    updateFuelArray(1, standardPlusPrice + 0.35, 'plus fuel');
    updateFuelArray(2, standardPremiumPrice + 0.35, 'premium fuel');
    tier = 3;
  } else if (distance < 10) {
    console.log('Less than 10 Km away!');
    updateFuelArray(
      0,
      standardRegularPrice + standardRegularPrice * 0.1,
      'regular fuel'
    );
    updateFuelArray(
      1,
      standardPlusPrice + standardPlusPrice * 0.1,
      'plus fuel'
    );
    updateFuelArray(
      2,
      standardPremiumPrice + standardPremiumPrice * 0.1,
      'premium fuel'
    );
    tier = 4;
  } else if (distance < 15) {
    console.log('Less than 15 Km away!');
    updateFuelArray(
      0,
      standardRegularPrice + standardRegularPrice * 0.15,
      'regular fuel'
    );
    updateFuelArray(
      1,
      standardPlusPrice + standardPlusPrice * 0.15,
      'plus fuel'
    );
    updateFuelArray(
      2,
      standardPremiumPrice + standardPremiumPrice * 0.15,
      'premium fuel'
    );
    tier = 5;
  } else if (distance >= 15) {
    console.log('15 Km or greater away!');
    updateFuelArray(
      0,
      standardRegularPrice + standardRegularPrice * 0.2 + distance * 0.03,
      'regular fuel'
    );
    updateFuelArray(
      1,
      standardPlusPrice + standardRegularPrice * 0.2 + distance * 0.03,
      'plus fuel'
    );
    updateFuelArray(
      2,
      standardPremiumPrice + standardRegularPrice * 0.2 + distance * 0.03,
      'premium fuel'
    );
    tier = '6. Ouch..';
  }

  // Display the distance
  let messages = [];
  messages.push(
    `Your fuel station is approximately ${Math.round(
      distance
    )} kilometers from the Earth Energy Distribution Center in Fresno, CA. This places you in Price Tier ${tier}.`
  );
  displayMessages(messages, distanceElement);
};

// Function to generate the maps of the user's location (interpreted as the Fuel Station location) and the
// Distribution Center location, which is in North Fresno
const callMap = () => {
  let map = new ol.Map({
    target: 'map',
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM(),
      }),
    ],
    view: new ol.View({
      center: ol.proj.fromLonLat([longitude, latitude]),
      zoom: 14,
    }),
  });

  let map2 = new ol.Map({
    target: 'map2',
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM(),
      }),
    ],
    view: new ol.View({
      center: ol.proj.fromLonLat([stationLongitude, stationLatitude]),
      zoom: 14,
    }),
  });

  let layer = new ol.layer.Vector({
    source: new ol.source.Vector({
      features: [
        new ol.Feature({
          geometry: new ol.geom.Point(
            ol.proj.fromLonLat([longitude, latitude])
          ),
        }),
      ],
    }),
  });
  map.addLayer(layer);

  let layer2 = new ol.layer.Vector({
    source: new ol.source.Vector({
      features: [
        new ol.Feature({
          geometry: new ol.geom.Point(
            ol.proj.fromLonLat([stationLongitude, stationLatitude])
          ),
        }),
      ],
    }),
  });
  map2.addLayer(layer2);
};

const getDistance = (lat1, lon1, lat2, lon2, unit) => {
  var radlat1 = (Math.PI * lat1) / 180;
  var radlat2 = (Math.PI * lat2) / 180;
  var theta = lon1 - lon2;
  var radtheta = (Math.PI * theta) / 180;
  var dist =
    Math.sin(radlat1) * Math.sin(radlat2) +
    Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  dist = Math.acos(dist);
  dist = (dist * 180) / Math.PI;
  dist = dist * 60 * 1.1515;
  if (unit == 'K') {
    dist = dist * 1.609344;
  }
  if (unit == 'N') {
    dist = dist * 0.8684;
  }
  return dist;
};

// Function to display messages
const displayMessages = (messages, messageEl) => {
  messageEl.innerHTML = messages.join(' ');
};

// Function to execute code contained within a sleep call after the specified duration in milliseconds
// If I put 3000 ms, the code in the block runs after three seconds, if a subsequent sleep call says 7000 ms,
// it will execute 4000 ms after the initial sleep call (7000ms in total.) They run concurrently.
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Function to generate a customer when one is not available in local storage
// Can generate a name and pronoun if the user doesn't specify one
const generateCustomer = (userName, userPronoun, userFuelType) => {
  let localName = '';
  let localPronoun = '';
  let localFuelType = '';

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
    'Ruben',
  ];

  // Array of possible customer pronouns
  const randomCustomerPronouns = ['he has', 'she has', 'they have', 'ze has'];

  // Array of possible fuel grades
  const randomFuelGrades = ['regular', 'plus', 'premium'];

  // Conditional operator and truthy/falsy; if the data is provided, we will use it, but if the
  // data is not provided, we will randomize the customer data, no problem!
  userName
    ? (localName = userName)
    : (localName = randomCustomerNames[ranBetween(0, 12)]);
  userPronoun
    ? (localPronoun = userPronoun)
    : (localPronoun = randomCustomerPronouns[ranBetween(0, 3)]);
  userFuelType
    ? (localFuelType = userFuelType)
    : (localFuelType = randomFuelGrades[ranBetween(0, 2)]);

  // Pick a random name and pronoun
  customers.push({
    customerName: localName,
    customerPronoun: localPronoun,
    customerMoney: ranBetween(3, 150),
    customerEdits: 0,
    customerFuelNeeded: ranBetween(1, 18),
    customerFuelType: localFuelType,
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
const fraudDetection = (change, edits) => {
  edits *= 2;
  // Starts as (0.2 + 0) times the dollar change, to the second power
  // An initial change of $20 will have a 16% chance of being caught.
  // A subsequent change of $20 will be calculated as follows:
  // ((0.2 + 1) * 20 ) ^ 2 = 576% chance of being caught. Yes, 576%.
  // That means you, and four versions of you in a nearby alternate universe
  // would be caught immediatately, and a 5th would have a 76% chance of
  // being caught. Global Energy Corp. does not mess around with money!
  // The probability of being caught escalates with more edits made to
  // the customer's money, and also by how much their money is changed
  let chance = ((0.2 + edits) * change) ** 2;
  console.log(`${parseFloat(chance).toFixed(2)}% of being caught`);
  console.log(`0.2 + ${edits} times ${change} to the power of 2=${chance}`);
  let probability = ranBetween(1, 100);

  // If your chance of being caught is, for example 16%, represented as 16
  // and the random number generated pulled a number 16 or lower, then you
  // are caught. Most of the time, according to the law of probability, it
  // will be 17-100, which is an 84% chance that this check will not pass,
  // which means that you won't be caught.
  if (chance >= probability) {
    // Looks like the fraud detection system detected the employee modifying the transaction system!
    let messages = [];
    messages.push(
      `FINANCIAL FRAUD DETECTED! What are you DOING? YOU ARE FIRED! YOU ARE FIRED! YOU ARE FIRED!`
    );
    displayMessages(messages, messageElement);
    sleep(3000).then(() => {
      // Set all arrays to blank, as the employee is fired (also prevents errors)
      customers = [];
      violations = [];
      fuelPrices = [];
      saveCustomers(customers);
      renderCustomers(customers);
      saveViolations(violations);
      saveFuelArray(fuelPrices);
    });
    sleep(6000).then(() => {
      // Now send the user to the HR page and clear local storage.
      location.assign('fired.html');
      localStorage.clear();
    });
  }
};

// Function to retrieve saved violations from localstorage
const getViolations = () => {
  try {
    const violationsJSON = localStorage.getItem('violations');
    // Conditional operator! Returns the localstorage data or a blank array
    return violationsJSON ? JSON.parse(violationsJSON) : [];
  } catch (error) {
    return [];
  }
};

// Function to save employee violations to localstorage
const saveViolations = (array) => {
  localStorage.setItem('violations', JSON.stringify(array));
};

// Function to display employee violation messages/warnings
const showViolations = () => {
  let violationMessage = [];
  if (violations.length === 1) {
    violationMessage.push(`You have one violation.`);
  } else if (violations.length === 2) {
    violationMessage.push(
      `You have two violations! ONE more and you're FIRED!`
    );
  } else if (violations.length === 3) {
    violationMessage.push(`Three violations! UH OH!`);
  }
  displayMessages(violationMessage, violationsElement);
};

// Function that is called every time an employee commits a violation.
// On the third violation, the check will pass and they will get fired.
const checkViolations = () => {
  if (violations.length > 2) {
    // Set all arrays to blank, as the employee is fired (also prevents errors)
    customers = [];
    violations = [];
    fuelPrices = [];
    saveCustomers(customers);
    renderCustomers(customers);
    saveViolations(violations);
    saveFuelArray(fuelPrices);
    let messages = [];
    messages.push(`THREE STRIKES, YOU'RE FIRED!!!`);
    displayMessages(messages, messageElement);
    sleep(3000).then(() => {
      messages = [];
      messages.push(`GET OUT OF HERE!!! HAVE A NICE TIME WITH HR!!!`);
      displayMessages(messages, messageElement);
    });
    sleep(8000).then(() => {
      // Now send the user to the HR page and clear local storage.
      location.assign('fired.html');
      localStorage.clear();
    });
  }
};

// Function to save fuel prices from the page into the fuelPrices array, and then into localstorage
// The car wash price was added into this array last, for simplicity's sake
const updateFuelArray = (type, price, name) => {
  // Define the last valid price used
  let originalPrice = fuelPrices[type];
  name === 'car wash'
    ? (originalPrice = fuelPrices[type])
    : (originalPrice = originalPrice);
  let timeUpdated = moment().format('MMM Do, YYYY h:mm:ss A');
  // Update the price to the new value and update time last updated
  fuelPrices[4] = timeUpdated;
  fuelPrices[type] = floatFix(price);

  // If the car wash price was updated, display that
  // The other prices are updated automatically so we don't want to display those
  if (name === 'car wash') {
    let messages = [];
    originalPrice
      ? messages.push(
          `The ${name} price was changed from $${originalPrice} to $${price} at ${timeUpdated}.`
        )
      : messages.push(
          `The ${name} price was set to $${price} at ${timeUpdated}.`
        );
    displayMessages(messages, messageElement);
  }
  timeFuelPricesUpdated(timeUpdated);
  saveFuelArray(fuelPrices);
};

// Function to render the prices changed timestamp into the DOM
const timeFuelPricesUpdated = (time) => {
  let messages = [];
  messages.push(`Our prices were last set at: ${time}.`);
  messages.push(`<br>Our Current Prices:<br>`);
  displayMessages(messages, messageElement2);
  renderFuelPrices();
};

// Function to render the fuel prices/car wash price into the DOM
const renderFuelPrices = () => {
  gPrices.innerHTML = '';
  for (let fuelLoop = 0; fuelLoop < 4; fuelLoop++) {
    const span = document.createElement('span');
    span.className = 'rocks2';
    span.textContent = `${fuelName(fuelLoop)} $${fuelPrices[fuelLoop]} `;
    gPrices.appendChild(span);
  }
};

// Function to return name of fuel based on its position in the array
// The positions are constant so I know for sure
const fuelName = (position) => {
  if (position === 0) {
    return `Regular:`;
  } else if (position === 1) {
    return 'Plus:';
  } else if (position === 2) {
    return 'Premium:';
  } else if (position === 3) {
    return 'Car Wash:';
  }
};

// Function to retrieve saved fuel price values from local storage (if available)
const getFuelArray = () => {
  try {
    const fuelJSON = localStorage.getItem('fuelPrices');

    // Another conditional operator. Returns the local storage data or an array with blank values.
    // This is important, because we don't want the form fields on the page to say Undefined or Null
    return fuelJSON ? JSON.parse(fuelJSON) : ['', '', '', '', ''];
  } catch (error) {
    return [];
  }
};

// Function to save fuelPrices array into localstorage
const saveFuelArray = (array) => {
  localStorage.setItem('fuelPrices', JSON.stringify(array));
};

// Function to return the appropriate fuel price based on the customer's need
const fuelPriceCheck = (arrayLoop) => {
  if (arrayLoop.customerFuelType === 'regular') {
    return fuelPrices[0];
  } else if (arrayLoop.customerFuelType === 'plus') {
    return fuelPrices[1];
  } else {
    return fuelPrices[2];
  }
};

// Function to deal with those awful JavaScript floating point math errors
// Takes an affected value, such as 100.9999994, times 100, to 10099.99994, rounds up to 10100
// then divides back by 100 to 101, which will then correctly display as $101.
// Modified to work with other data as well
const floatFix = (dataToFix) => {
  dataToFix = Math.round(dataToFix * 100);
  dataToFix = dataToFix / 100;
  return dataToFix;
};

// Function for fueling up the customer's vehicle, or not, depending on their ability to pay
const fuelUpCheck = (arrayLoop) => {
  let messages = [];

  // If they fueled up already, don't let them fuel up again, and add a violation
  if (arrayLoop.customerFueledUp) {
    messages.push(
      `You fueled up ${arrayLoop.customerName}'s vehicle already! Why are you trying to do it again!`
    );
    violations.push(
      `Attempted to provide ${arrayLoop.customerName} with more fuel when they were already serviced!`
    );
    saveViolations(violations);
    showViolations();
    saveCustomers(customers);
    renderCustomers(customers);
    displayMessages(messages, messageElement);
    sleep(2000).then(() => {
      checkViolations();
    });
    return;
  }

  // Call function fuelPriceCheck to set local variable price equal to the price of the customer's required fuel
  let price = fuelPriceCheck(arrayLoop);

  // Use of Falsy here, if price was not set by the employee, it will be a blank string and that will be false
  // The Not Operator flips the condition, so if the price isn't set, the return value at the end of the if statement
  // will then stop the function and the error message will be given
  if (!price) {
    messages.push(
      `The price for ${arrayLoop.customerFuelType} fuel isn't set! What are you doing!`
    );
    displayMessages(messages, messageElement);
    violations.push(
      `Attempted to sell ${arrayLoop.customerFuelType} fuel to ${arrayLoop.customerName} without setting a price!`
    );
    saveViolations(violations);
    showViolations();
    sleep(2000).then(() => {
      checkViolations();
    });
    return;
  }

  // Define cost of fuel variable to shorten references here, cost = fuel quantity times price
  let cost = arrayLoop.customerFuelNeeded * price;

  // If the customer has less money than a gallon of their required fuel, we shouldn't be serving them
  if (arrayLoop.customerMoney < price) {
    messages.push(
      `${arrayLoop.customerName} doesn't have enough money for even 1 gallon of ${arrayLoop.customerFuelType} fuel! Why did you try to serve them!`
    );
    violations.push(
      `Attempted to serve ${arrayLoop.customerName} when they didn't have enough money!`
    );
    saveViolations(violations);
    showViolations();
    saveCustomers(customers);
    renderCustomers(customers);
    displayMessages(messages, messageElement);
    sleep(2000).then(() => {
      checkViolations();
    });
    // Else if the customer has enough money for exactly one gallon of fuel, they can buy one and only one gallon of fuel
  } else if (arrayLoop.customerMoney === price) {
    arrayLoop.customerMoney -= cost;
    arrayLoop.customerMoney = floatFix(arrayLoop.customerMoney);
    arrayLoop.customerFuelNeeded -= 1;
    messages.push(
      `${arrayLoop.customerName} could not afford all the  ${arrayLoop.customerFuelType} fuel they needed, but ${arrayLoop.customerPronoun} were able to buy 1 gallon of ${arrayLoop.customerFuelType} fuel, ${arrayLoop.customerPronoun} $${arrayLoop.customerMoney} left.`
    );
    arrayLoop.customerFueledUp = true;
    saveCustomers(customers);
    renderCustomers(customers);
    displayMessages(messages, messageElement);
    // Else if the customer has exactly enough money or more than enough money for all of the fuel they need, they can buy it
  } else if (arrayLoop.customerMoney >= cost) {
    arrayLoop.customerMoney -= cost;
    arrayLoop.customerMoney = floatFix(arrayLoop.customerMoney);
    messages.push(
      `${arrayLoop.customerName} successfully purchased ${arrayLoop.customerFuelNeeded} gallon(s) of ${arrayLoop.customerFuelType} fuel for $${cost}, ${arrayLoop.customerPronoun} $${arrayLoop.customerMoney} left.`
    );
    arrayLoop.customerFuelNeeded = 0;
    arrayLoop.customerFueledUp = true;
    saveCustomers(customers);
    renderCustomers(customers);
    displayMessages(messages, messageElement);
    // Else if the customer has less money than the cost of all the fuel they need, but more than one gallon, round down to the amount of fuel they can afford
  } else if (arrayLoop.customerMoney < cost) {
    let lowerAmount = Math.floor(arrayLoop.customerMoney / price);
    cost = lowerAmount * price;
    arrayLoop.customerMoney -= cost;
    arrayLoop.customerMoney = floatFix(arrayLoop.customerMoney);
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
const getCustomers = () => {
  try {
    const customersJSON = localStorage.getItem('customers');

    return customersJSON ? JSON.parse(customersJSON) : [];
  } catch (error) {
    return [];
  }
};

// Function to save customer array to localstorage
const saveCustomers = (customers) => {
  localStorage.setItem('customers', JSON.stringify(customers));
};

// Function to remove customer data from the array
const removeCustomer = (id) => {
  const customerIndex = customers.findIndex(
    (customerArray) => customerArray.id === id
  );

  if (customerIndex > -1) {
    customers.splice(customerIndex, 1);
  }
};

// Function to select the appropriate text, if the customer wants to use the car wash or not
// Conditional operator is used since we're just returning a value that has two possibilities
const carWashLanguage = (choice) => {
  return choice
    ? `and would like to use the car wash.`
    : `and does not want to use the car wash.`;
};

// Function to randomly decide if the customer wants a car wash or not
// Conditional operator is used since we're just returning a boolean that has two possibilities
const carWashDecision = (random) => {
  return random === 0 ? true : false;
};

// If the customer used the car wash already, provide text to show the status
// It will be blank if they don't want a car wash at all
// Not using the conditional operator here since there are three possibilities involved
const carWashStatus = (arrayLoop) => {
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

// Function  for using the car wash, or not, depending on the customer's ability to pay, and
// if they even want to use the car wash.
const useCarWash = (arrayLoop) => {
  let messages = [];

  let price = fuelPrices[3];

  if (!price) {
    messages.push(`The price for the car wash isn't set! What are you doing!`);
    displayMessages(messages, messageElement);
    violations.push(
      `Attempted to send ${arrayLoop.customerName}'s vehicle through the car wash without setting a price!`
    );
    saveViolations(violations);
    showViolations();
    sleep(2000).then(() => {
      checkViolations();
    });
    return;
  }

  // If they don't want to use the car wash, rebuke the employee and add a violation
  if (arrayLoop.customerWantCarWash === false) {
    messages.push(
      `${arrayLoop.customerName} doesn't want to use the car wash! Why are you trying to force them?`
    );
    violations.push(
      `Tried to send ${arrayLoop.customerName} through the car wash when they didn't want to use it!`
    );
    saveViolations(violations);
    showViolations();
    displayMessages(messages, messageElement);
    sleep(2000).then(() => {
      checkViolations();
    });
    return;
  }

  // If they already used the car wash, rebuke the employee and add a violation
  if (arrayLoop.customerUsedCarWash === true) {
    messages.push(
      `${arrayLoop.customerName} already used the car wash! Are you trying to blow up our water bill?`
    );
    violations.push(
      `Tried to send ${arrayLoop.customerName} through the car wash AGAIN!`
    );
    saveViolations(violations);
    showViolations();
    displayMessages(messages, messageElement);
    sleep(2000).then(() => {
      checkViolations();
    });
    return;
  }

  // If the customer has enough moneyto use the water car, and actually wants to use it (the function hasn't)
  // been stopped by the prior If statement, then they use the car wash.
  if (arrayLoop.customerMoney >= price) {
    arrayLoop.customerMoney -= price;
    arrayLoop.customerMoney = floatFix(arrayLoop.customerMoney);
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
    showViolations();
    displayMessages(messages, messageElement);
    sleep(2000).then(() => {
      checkViolations();
    });
  }
};

// Function to render customers on the DOM
const renderCustomers = (customerArray) => {
  // Clear items already present in the output area
  document.querySelector('#outputArea').innerHTML = '';
  // Run a for each Loop to render each customer in the array
  customerArray.forEach((arrayLoop) => {
    // Create the text, and buttons doing into the DOM
    const customerEl = document.createElement('div');
    const span = document.createElement('span');
    const editLink = document.createElement('a');
    const serveButton = document.createElement('button');
    const carWashButton = document.createElement('button');
    const kickButton = document.createElement('button');

    // Customer information text
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
    carWashButton.textContent = `Wash ${arrayLoop.customerName}'s Car`;
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
    kickButton.addEventListener('click', () => {
      let price = fuelPriceCheck(arrayLoop);
      let carWashPrice = fuelPrices[3];
      let endTime = moment();
      let endTimeForCheck = endTime.format('MMM Do, YYYY h:mm A');
      let duration = `${endTime.diff(
        arrayLoop.customerArrivalTimeForCheck,
        'seconds'
      )} seconds`;

      // Can we at least not send the customer away if their fuel price isn't set?
      if (!price) {
        let messages = [];
        messages.push(
          `You haven't even set the customer's fuel price yet! Don't send the customer away!`
        );

        displayMessages(messages, messageElement);
        violations.push(
          `Attempted to send ${arrayLoop.customerName} away without even setting the fuel prices first!`
        );
        saveViolations(violations);
        showViolations();
        sleep(2000).then(() => {
          checkViolations();
        });
        return;
      }

      // Can we not send the customer away if they want a car wash and the car wash price isn't set?
      if (!carWashPrice && arrayLoop.customerWantCarWash === true) {
        let messages = [];
        messages.push(
          `You haven't even set the car wash price yet! Don't send the customer away!`
        );

        displayMessages(messages, messageElement);
        violations.push(
          `Attempted to send ${arrayLoop.customerName} away without even setting the car wash price first!`
        );
        saveViolations(violations);
        showViolations();
        sleep(2000).then(() => {
          checkViolations();
        });
        return;
      }

      // If you're ending the transaction, and the customer hasn't been fueled up, and they don't have enough money for 1 unit of fuel, then
      // They are broke and sending them away is the correct procedure
      if (
        arrayLoop.customerFueledUp === false &&
        arrayLoop.customerMoney < price &&
        arrayLoop.customerWantCarWash === false
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

      // If you're ending the transaction, the customer can't afford fuel or a car wash, and hasn't already fueled up or used the car wash
      // (meaning that they're not just broke because they fueled up and used the car wash already) then we want to give positive feedback
      // to the employee for following procedure
      if (
        arrayLoop.customerMoney < price &&
        arrayLoop.customerMoney < carWashPrice &&
        arrayLoop.customerFueledUp === false &&
        arrayLoop.customerUsedCarWash === false
      ) {
        let messages = [];
        messages.push(
          `Great job! ${arrayLoop.customerName} didn't have enough money for any services at all, you did the right thing sending them away!`
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
        if (arrayLoop.customerFuelNeeded > 0) {
          messages.push(
            `Great job! ${arrayLoop.customerName} leaves partially satisfied at ${endTimeForCheck}. They wish they had a bit more money for more fuel! You served them in ${duration}.`
          );
        } else {
          messages.push(
            `Great job! ${arrayLoop.customerName} leaves as a satisfied customer at ${endTimeForCheck}. You served them in ${duration}.`
          );
        }
        removeCustomer(arrayLoop.id);
        saveCustomers(customers);
        renderCustomers(customers);
        displayMessages(messages, messageElement);
        return;
        // Else if, the customer fueled up, wanted to use the car wash, didn't use the car wash, and couldn't afford the car wash
        // They'll be disappointed but not as much as if they knew they could afford it
      } else if (
        arrayLoop.customerFueledUp &&
        arrayLoop.customerUsedCarWash === false &&
        arrayLoop.customerWantCarWash === true &&
        arrayLoop.customerMoney < carWashPrice
      ) {
        let messages = [];

        messages.push(
          `${arrayLoop.customerName} leaves mostly satisfied at ${endTimeForCheck}; they fueled up, but didn't have enough money to use the car wash. You served them in ${duration}.`
        );

        removeCustomer(arrayLoop.id);
        saveCustomers(customers);
        renderCustomers(customers);
        displayMessages(messages, messageElement);
        return;
        // Else if, the customer fueled up, wanted to use the car wash, didn't use the car wash, and COULD afford the car wash
        // They'll be more disappointed because they weren't sent them through the car wash, especially since they could
        // have afforded to use it. Rebuke the employee and add a violation.
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
        showViolations();
        removeCustomer(arrayLoop.id);
        saveCustomers(customers);
        renderCustomers(customers);
        displayMessages(messages, messageElement);
        sleep(2000).then(() => {
          checkViolations();
        });
        return;
        // Eise if the employee sends the customer away without fueling them up, but they were sent through the car wash
        // Rebuke the employee for failing to fuel up the customer's vehicle, and add a violation
      } else if (
        arrayLoop.customerFueledUp === false &&
        arrayLoop.customerUsedCarWash &&
        arrayLoop.customerMoney > price
      ) {
        let messages = [];
        messages.push(
          `You failed to fuel up ${arrayLoop.customerName}'s vehicle at ${endTimeForCheck}; they could have been a valuable customer! You sent them away after ${duration}.`
        );
        violations.push(
          `Failed to fuel up ${arrayLoop.customerName}'s vehicle.`
        );
        saveViolations(violations);
        showViolations();
        removeCustomer(arrayLoop.id);
        saveCustomers(customers);
        renderCustomers(customers);
        displayMessages(messages, messageElement);
        sleep(2000).then(() => {
          checkViolations();
        });
        return;
        // Eise if the employee sends the customer away without fueling them up OR having them use the car wash, oh boy!
        // Rebuke the employee for not offering any services to the customer!
      } else if (
        arrayLoop.customerWantCarWash === true &&
        arrayLoop.customerMoney >= carWashPrice &&
        arrayLoop.customerUsedCarWash === false
      ) {
        let messages = [];
        messages.push(
          `${arrayLoop.customerName} did not have enough money for any ${arrayLoop.customerFuelType} fuel, but they could have used the car wash! Why didn't you offer it to them!`
        );
        violations.push(
          `Failed to offer a car wash to ${arrayLoop.customerName}.`
        );
        saveViolations(violations);
        showViolations();
        removeCustomer(arrayLoop.id);
        saveCustomers(customers);
        renderCustomers(customers);
        displayMessages(messages, messageElement);
        sleep(2000).then(() => {
          checkViolations();
        });
        return;
        // Else if the customer can't afford gas but was able to afford the car wash and was offered it, they will be
        // partially satisfied. Most other possibilities should have been covered by other conditionals by now.
      } else if (
        arrayLoop.customerMoney < price &&
        arrayLoop.customerUsedCarWash === true
      ) {
        let messages = [];
        messages.push(
          `${arrayLoop.customerName} leaves partially satisfied at ${endTimeForCheck}; they did not have enough money for any ${arrayLoop.customerFuelType} fuel, but they at least were able to use the car wash. You served them in ${duration}.`
        );
        removeCustomer(arrayLoop.id);
        saveCustomers(customers);
        renderCustomers(customers);
        displayMessages(messages, messageElement);
        sleep(2000).then(() => {
          checkViolations();
        });
        return;
        // The final check, if we get to this Else, then the employee most likely sent the customer away without providing
        // any services. That is a violation, so rebuke the employee and add a violation.
      } else {
        let messages = [];
        messages.push(
          `You sent ${arrayLoop.customerName} away at ${endTimeForCheck} without providing any services! That could have been a valuable paying customer! What a waste of ${duration}!`
        );
        violations.push(
          `Failed to provide any services to ${arrayLoop.customerName}.`
        );
        saveViolations(violations);
        showViolations();
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

    // Add event listener to fuel up button, call fuelUpCheck function
    serveButton.addEventListener('click', () => {
      fuelUpCheck(arrayLoop);
    });
  });
};
