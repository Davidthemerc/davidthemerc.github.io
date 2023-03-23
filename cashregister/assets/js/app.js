const button1 = document.getElementById('one');
const button2 = document.getElementById('two');
const button3 = document.getElementById('three');
const button4 = document.getElementById('four');
const button5 = document.getElementById('five');
const button6 = document.getElementById('six');
const button7 = document.getElementById('seven');
const button8 = document.getElementById('eight');
const button9 = document.getElementById('nine');
const button0 = document.getElementById('zero');
const buttonBackspace = document.getElementById('backspace');
const buttonCash = document.getElementById('cash');
const buttonCart = document.getElementById('cart');
const buttonDot = document.getElementById('dot');
const buttonClear = document.getElementById('clear');
const buttonCheck = document.getElementById('check');
const buttonCredit = document.getElementById('credit');
const buttonScan = document.getElementById('scan');
const buttonOpen = document.getElementById('open');
const display = document.getElementById('display');
const cashDrawer = document.getElementById('cashdrawer');
const title = document.getElementById('title');

// Update CSS colors based on saved values
updateCSS();

// Set cashier's name based on saved value
title.innerHTML = `${cashierData.cashierName}'s Cash Register`;

// Define running checkout total
let checkoutTotal = 0;

// Event listeners

title.addEventListener('click', (e) => {
  location.assign('customize.html');
});

button1.addEventListener('click', (e) => {
  addNumToDisplay(e.target.value);
});

button2.addEventListener('click', (e) => {
  addNumToDisplay(e.target.value);
});

button3.addEventListener('click', (e) => {
  addNumToDisplay(e.target.value);
});

button4.addEventListener('click', (e) => {
  addNumToDisplay(e.target.value);
});

button5.addEventListener('click', (e) => {
  addNumToDisplay(e.target.value);
});

button6.addEventListener('click', (e) => {
  addNumToDisplay(e.target.value);
});

button7.addEventListener('click', (e) => {
  addNumToDisplay(e.target.value);
});

button8.addEventListener('click', (e) => {
  addNumToDisplay(e.target.value);
});

button9.addEventListener('click', (e) => {
  addNumToDisplay(e.target.value);
});
button0.addEventListener('click', (e) => {
  addNumToDisplay(e.target.value);
});

buttonBackspace.addEventListener('click', (e) => {
  displayBackspace();
});

buttonCart.addEventListener('click', (e) => {
  checkoutCart();
});

buttonCash.addEventListener('click', (e) => {
  playAudio(3);
});

buttonDot.addEventListener('click', (e) => {
  displayAddPeriod();
});

buttonCheck.addEventListener('click', (e) => {
  confirmPrice();
});

buttonClear.addEventListener('click', (e) => {
  clearDisplay();
});

buttonCredit.addEventListener('click', (e) => {
  swipeCard();
});

buttonScan.addEventListener('click', (e) => {
  scanItem();
});

buttonOpen.addEventListener('click', (e) => {
  openRegister();
});
