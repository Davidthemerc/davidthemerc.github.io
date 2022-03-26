'use strict';

let fuelPrices = getFuelArray();
let customers = getCustomers();
let violations = getViolations();
const messageElement = document.getElementById('mainMessages');
const messageElement2 = document.getElementById('mainMessages2');
const violationsElement = document.getElementById('violations');
let regularPrice = document.getElementById('regular');
let plusPrice = document.getElementById('plus');
let premiumPrice = document.getElementById('premium');
let carWashPrice = document.getElementById('carWash');
let userCustomerName = document.getElementById('customerName');
let userCustomerPronoun = document.getElementById('customerPronoun');
let userCustomerFuelType = document.getElementById('customerFuelType');

// Render customer data from local storage
renderCustomers(customers);

// Load fuel prices into DOM
renderFuelPrices();
// Use of truthy/falsy to show when the gas prices were last updated, if there is such a time available in the array
fuelPrices[4] ? timeFuelPricesUpdated(fuelPrices[4]) : '';

// Event listener for regular price input
document.querySelector('#regular').addEventListener('change', () => {
  let originalPrice = fuelPrices[0];
  if (regularPrice.value >= 100) {
    let messages = [];
    messages.push(
      `Stop! You can't increase the price of regular fuel to $100 or more! The price has been reset!`
    );
    displayMessages(messages, messageElement);
    regularPrice.value = originalPrice;
    return;
  }
  if (!regularPrice.value) {
    let messages = [];
    messages.push(
      `Please do not remove the regular fuel price without setting a new price!`
    );
    displayMessages(messages, messageElement);
    regularPrice.value = originalPrice;

    return;
  }
  updateFuelArray(0, regularPrice.value, 'regular fuel');
});
// Event listener for plus price input
document.querySelector('#plus').addEventListener('change', () => {
  let originalPrice = fuelPrices[1];
  if (plusPrice.value >= 100) {
    let messages = [];
    messages.push(
      `Stop! You can't increase the price of plus fuel to $100 or more! The price has been reset!`
    );
    displayMessages(messages, messageElement);
    plusPrice.value = originalPrice;
    return;
  }
  if (!plusPrice.value) {
    let messages = [];
    messages.push(
      `Please do not remove the plus fuel price without setting a new price!`
    );
    displayMessages(messages, messageElement);
    plusPrice.value = originalPrice;

    return;
  }
  updateFuelArray(1, plusPrice.value, 'plus fuel');
});
// Event listener for premium price input
document.querySelector('#premium').addEventListener('change', () => {
  let originalPrice = fuelPrices[2];
  if (premiumPrice.value >= 100) {
    let messages = [];
    messages.push(
      `Stop! You can't increase the price of regular fuel to $100 or more! The price has been reset!`
    );
    displayMessages(messages, messageElement);
    premiumPrice.value = originalPrice;
    return;
  }
  if (!premiumPrice.value) {
    let messages = [];
    messages.push(
      `Please do not remove the premium fuel price without setting a new price!`
    );
    displayMessages(messages, messageElement);
    premiumPrice.value = originalPrice;

    return;
  }
  updateFuelArray(2, premiumPrice.value, 'premium fuel');
});
// Event listener for car wash price input
document.querySelector('#carWash').addEventListener('change', () => {
  updateFuelArray(3, carWashPrice.value, 'car wash');
});

// Event listener for add customer button
document.querySelector('form').addEventListener('submit', (add) => {
  add.preventDefault();
  let messages = [];

  if (
    regularPrice.value > 99.99 ||
    plusPrice.value > 99.99 ||
    premiumPrice.value > 99.99
  ) {
    messages.push(
      `You can't charge the customer $100 or more per gallon! Even we're not that evil!`
    );
    displayMessages(messages, messageElement);
    return;
  } else if (
    regularPrice.value < 0 ||
    plusPrice.value < 0 ||
    premiumPrice.value < 0 ||
    carWashPrice.value < 0
  ) {
    messages.push(
      `You can't charge a negative price! Did you fail Math in school?!?`
    );
    displayMessages(messages, messageElement);
    return;
  }
  // Clear error messages when there is no error; the array will be empty
  displayMessages(messages, messageElement);

  // Generate a customer
  generateCustomer(
    userCustomerName.value,
    userCustomerPronoun.value,
    userCustomerFuelType.value
  );

  // Clear customer customization fields
  userCustomerName.value = '';
  userCustomerPronoun.value = '';
  userCustomerFuelType.value = '';

  // Render all stored customers
  renderCustomers(customers);
});

// Show any saved violations
showViolations();

// Event listener to update data
window.addEventListener('storage', (e) => {
  if (e.key === 'customers') {
    try {
      customers = JSON.parse(storageCheck.newValue);
    } catch (e) {
      customers = [];
    }
    renderCustomers(customers);
  }
});
