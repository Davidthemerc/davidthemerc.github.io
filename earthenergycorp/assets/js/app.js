'use strict';

let fuelPrices = getFuelArray();
let customers = getCustomers();
let violations = getViolations();
const stationLongitude = -119.774259;
const stationLatitude = 36.85441;
const messageElement = document.getElementById('mainMessages');
const messageElement2 = document.getElementById('mainMessages2');
const messageElement3 = document.getElementById('mainMessages3');
const distanceElement = document.getElementById('gpricemsg');
const gPrices = document.getElementById('gprices');
const violationsElement = document.getElementById('violations');
let regularPrice = document.getElementById('regular');
let plusPrice = document.getElementById('plus');
let premiumPrice = document.getElementById('premium');
let carWashPrice = document.getElementById('carWash');
let userCustomerName = document.getElementById('customerName');
let userCustomerPronoun = document.getElementById('customerPronoun');
let userCustomerFuelType = document.getElementById('customerFuelType');
let form = document.getElementById('form');
let longitude;
let latitude;

console.log(`${stationLongitude} ${stationLatitude}`);

// Render customer data from local storage
renderCustomers(customers);

// Use of truthy/falsy to show when the gas prices were last updated, if there is such a time available in the array
fuelPrices[4] ? timeFuelPricesUpdated(fuelPrices[4]) : '';

// // Event listener for regular price input
// document.querySelector('#regular').addEventListener('change', () => {
//   let originalPrice = fuelPrices[0];

//   // New try catch implementation
//   // All error handling now done inside the updateFuelArray function
//   try {
//     // If there is no issue with the new fuel price, update the price
//     updateFuelArray(0, regularPrice.value, 'regular fuel');
//     regularPrice.value = '';
//   } catch (error) {
//     // If there is an issue with the new fuel price, alert the employee
//     let messages = [];
//     messages.push(error);
//     displayMessages(messages, messageElement);
//     regularPrice.value = '';
//   }
// });
// // Event listener for plus price input
// document.querySelector('#plus').addEventListener('change', () => {
//   let originalPrice = fuelPrices[1];

//   try {
//     updateFuelArray(1, plusPrice.value, 'plus fuel');
//     plusPrice.value = '';
//   } catch (error) {
//     let messages = [];
//     messages.push(error);
//     displayMessages(messages, messageElement);
//     plusPrice.value = '';
//   }
// });
// // Event listener for premium price input
// document.querySelector('#premium').addEventListener('change', () => {
//   let originalPrice = fuelPrices[2];

//   try {
//     updateFuelArray(2, premiumPrice.value, 'premium fuel');
//     premiumPrice.value = '';
//   } catch (error) {
//     let messages = [];
//     messages.push(error);
//     displayMessages(messages, messageElement);
//     premiumPrice.value = '';
//   }
// });
// Event listener for car wash price input
document.querySelector('#carWash').addEventListener('change', () => {
  let originalPrice = fuelPrices[3];

  try {
    updateFuelArray(3, carWashPrice.value, 'car wash');
    carWashPrice.value = '';
  } catch (error) {
    let messages = [];
    messages.push(error);
    displayMessages(messages, messageElement);
    carWashPrice.value = '';
  }
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
  form.reset();

  // Render all stored customers
  renderCustomers(customers);
});

// Show a warning if there are any violations
showViolations();

callAPI();

// Event listener to update data
window.addEventListener('storage', (data) => {
  if (data.key === 'customers') {
    try {
      customers = JSON.parse(storageCheck.newValue);
    } catch (error) {
      customers = [];
    }
    renderCustomers(customers);
  }
});
