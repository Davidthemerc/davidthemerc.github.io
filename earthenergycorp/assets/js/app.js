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

  // New try catch implementation
  // All error handling now done inside the updateFuelArray function
  try {
    // If there is no issue with the new fuel price, update the price
    updateFuelArray(0, regularPrice.value, 'regular fuel');
  } catch (e) {
    // If there is an issue with the new fuel price, alert the employee
    let messages = [];
    messages.push(e.message);
    displayMessages(messages, messageElement);
    // Reset the price to the valid, previously stored value
    regularPrice.value = originalPrice;
  }
});
// Event listener for plus price input
document.querySelector('#plus').addEventListener('change', () => {
  let originalPrice = fuelPrices[1];

  try {
    updateFuelArray(1, plusPrice.value, 'plus fuel');
  } catch (e) {
    let messages = [];
    messages.push(e);
    displayMessages(messages, messageElement);
    plusPrice.value = originalPrice;
  }
});
// Event listener for premium price input
document.querySelector('#premium').addEventListener('change', () => {
  let originalPrice = fuelPrices[2];

  try {
    updateFuelArray(2, premiumPrice.value, 'premium fuel');
  } catch (e) {
    let messages = [];
    messages.push(e);
    displayMessages(messages, messageElement);
    premiumPrice.value = originalPrice;
  }
});
// Event listener for car wash price input
document.querySelector('#carWash').addEventListener('change', () => {
  updateFuelArray(3, carWashPrice.value, 'car wash');
});

// Event listener for add customer button
document.querySelector('form').addEventListener('submit', (add) => {
  add.preventDefault();
  let messages = [];

  // Display the empty messages array, to indicate no errors
  displayMessages(messages, messageElement);

  // Generate a customer (unless some of the customization fields are used)
  // But that is handled in the function
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

// Show a warning if there are any violations
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
