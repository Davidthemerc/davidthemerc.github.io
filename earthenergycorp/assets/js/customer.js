'use strict';

const customerId = location.hash.substring(1);
const messageElement = document.getElementById('customerInfo');
let customers = getCustomers();
let editedCustomer = customers.find(
  (editCustomer) => editCustomer.id === customerId
);

if (!editedCustomer) {
  location.assign('index.html');
}

// Assign input fields to variables
const custName = document.getElementById('editName');
const custMoney = document.getElementById('editMoney');
let custFuelQuantity = document.getElementById('editQuantity');
const custCarWash = document.getElementById('editCarWash');

// Assign the customer's data to those fields
custName.value = editedCustomer.customerName;
custMoney.value = editedCustomer.customerMoney;
custFuelQuantity.value = editedCustomer.customerFuelNeeded;
custCarWash.checked = editedCustomer.customerWantCarWash;

// Event listener to update data on the Index page
window.addEventListener('storage', (storageCheck) => {
  if (storageCheck.key === 'customers') {
    try {
      customers = JSON.parse(storageCheck.newValue);
    } catch (error) {
      customers = [];
    }
    let customer = customers.find((customer) => customer.id === customerId);

    if (!customer) {
      location.assign('index.html');
    }
  }
});

// Event listener to detect changes to the customer's name
custName.addEventListener('change', () => {
  editedCustomer.customerName = custName.value;
  let messages = [];
  messages.push(
    `The customer's name was changed to ${editedCustomer.customerName}. It's strange that we offer that service here.`
  );
  displayMessages(messages, messageElement);
  saveCustomers(customers);
});

// Event listener to detect changes to the customer's money (transaction system)
custMoney.addEventListener('change', () => {
  let messages = [];
  let originalMoneyValue = editedCustomer.customerMoney;
  if (Number.isInteger(parseFloat(custMoney.value)) === false) {
    messages.push(
      `You cannot change the customer's money to an invalid value! The value has been reset!`
    );
    displayMessages(messages, messageElement);
    custMoney.value = originalMoneyValue;

    return;
  }
  let change = Math.abs(
    parseFloat(custMoney.value) - editedCustomer.customerMoney
  );
  editedCustomer.customerMoney = parseFloat(custMoney.value);

  if (editedCustomer.customerMoney > originalMoneyValue) {
    messages.push(
      `The customer's funds were increased by $${change} (from $${originalMoneyValue} to $${editedCustomer.customerMoney}).`
    );
  } else {
    messages.push(
      `The customer's funds were decreased by $${change} (from $${originalMoneyValue} to $${editedCustomer.customerMoney}).`
    );
  }
  displayMessages(messages, messageElement);
  saveCustomers(customers);
  fraudDetection(change, editedCustomer.customerEdits);
  // Keep track of the number of times customer money is being edited
  editedCustomer.customerEdits += 1;
});

// Event listener to detect changes to the customer's fuel quantity needed
custFuelQuantity.addEventListener('change', () => {
  let messages = [];
  let originalQuantity = editedCustomer.customerFuelNeeded;
  if (Number.isInteger(parseFloat(custFuelQuantity.value)) === false) {
    messages.push(
      `The customer cannot request partial or invalid units of fuel! Fuel quantity has been reset to previous value!`
    );
    displayMessages(messages, messageElement);
    custFuelQuantity.value = originalQuantity;

    return;
  }
  editedCustomer.customerFuelNeeded = custFuelQuantity.value;
  messages.push(
    `The customer's needed fuel quantity was changed to ${editedCustomer.customerFuelNeeded}.`
  );
  displayMessages(messages, messageElement);
  saveCustomers(customers);
});

// Event listener to detect changes to the customer's car wash choice
custCarWash.addEventListener('change', () => {
  let messages = [];
  messages.push(`The customer changed their mind about using the car wash.`);
  editedCustomer.customerWantCarWash = custCarWash.checked;
  displayMessages(messages, messageElement);
  saveCustomers(customers);
});
