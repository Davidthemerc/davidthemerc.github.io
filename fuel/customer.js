const customerId = location.hash.substring(1);
const messageElement = document.getElementById('customerInfo');
let customers = getCustomers();
let editedCustomer = customers.find(function (editCustomer) {
  return editCustomer.id === customerId;
});

if (editedCustomer === undefined) {
  location.assign('index.html');
}

// Assign input fields to variables
const custName = document.getElementById('editName');
const custMoney = document.getElementById('editMoney');
const custFuelQuantity = document.getElementById('editQuantity');
const custCarWash = document.getElementById('editCarWash');

// Assign the customer's data to those fields
custName.value = editedCustomer.customerName;
custMoney.value = editedCustomer.customerMoney;
custFuelQuantity.value = editedCustomer.customerFuelNeeded;
custCarWash.checked = editedCustomer.customerWantCarWash;

// Event listener to update data on the Index page
window.addEventListener('storage', function (storageCheck) {
  if (storageCheck.key === 'customers') {
    customers = JSON.parse(storageCheck.newValue);
    customer = customers.find(function (customer) {
      return customer.id === customerId;
    });
  }

  if (customer === null || customer === undefined) {
    location.assign('index.html');
  }
});

// Event listener to detect changes to the customer's name
custName.addEventListener('change', function () {
  editedCustomer.customerName = custName.value;
  let messages = [];
  messages.push(
    `The customer's name was changed to ${editedCustomer.customerName}. It's strange that we offer that service here.`
  );
  displayMessages(messages, messageElement);
  saveCustomers(customers);
});

// Event listener to detect changes to the customer's money
custMoney.addEventListener('change', function () {
  editedCustomer.customerMoney = parseFloat(custMoney.value);

  let messages = [];
  messages.push(
    `The customer's funds were changed to $${editedCustomer.customerMoney}.`
  );
  displayMessages(messages, messageElement);
  saveCustomers(customers);
});

// Event listener to detect changes to the customer's fuel quantity needed
custFuelQuantity.addEventListener('change', function () {
  let messages = [];
  if (Number.isInteger(parseFloat(custFuelQuantity.value)) === false) {
    messages.push(
      `The customer cannot request partial units of fuel! Please correct this immediately!`
    );
    displayMessages(messages, messageElement);
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
custCarWash.addEventListener('change', function () {
  let messages = [];
  messages.push(`The customer changed their mind about using the car wash.`);
  editedCustomer.customerWantCarWash = custCarWash.checked;
  displayMessages(messages, messageElement);
  saveCustomers(customers);
});
