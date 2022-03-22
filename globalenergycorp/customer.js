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
const custFuelQuantity = document.getElementById('editQuantity');
const custCarWash = document.getElementById('editCarWash');

// Assign the customer's data to those fields
custName.value = editedCustomer.customerName;
custMoney.value = editedCustomer.customerMoney;
custFuelQuantity.value = editedCustomer.customerFuelNeeded;
custCarWash.checked = editedCustomer.customerWantCarWash;

// Event listener to update data on the Index page
window.addEventListener('storage', (storageCheck) => {
  if (storageCheck.key === 'customers') {
    customers = JSON.parse(storageCheck.newValue);
    customer = customers.find((customer) => customer.id === customerId);
  }

  if (!customer) {
    location.assign('index.html');
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
  let customerMoney = editedCustomer.customerMoney;
  let change = Math.abs(
    parseFloat(custMoney.value) - editedCustomer.customerMoney
  );
  editedCustomer.customerMoney = parseFloat(custMoney.value);

  let messages = [];
  if (editedCustomer.customerMoney > customerMoney) {
    messages.push(
      `The customer's funds were increased by $${change} (from $${customerMoney} to $${editedCustomer.customerMoney}).`
    );
  } else {
    messages.push(
      `The customer's funds were decreased by $${change} (from $${customerMoney} to $${editedCustomer.customerMoney}).`
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
custCarWash.addEventListener('change', () => {
  let messages = [];
  messages.push(`The customer changed their mind about using the car wash.`);
  editedCustomer.customerWantCarWash = custCarWash.checked;
  displayMessages(messages, messageElement);
  saveCustomers(customers);
});
