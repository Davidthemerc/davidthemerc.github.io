const title = document.getElementById('title');
const nameInput = document.getElementById('nameinput');
const colorOneInput = document.getElementById('color1');
const colorTwoInput = document.getElementById('color2');
const colorThreeInput = document.getElementById('color3');
const colorFourInput = document.getElementById('color4');
const resetColorsButton = document.getElementById('resetcolors');

// Set cashier's name based on saved value
title.innerHTML = `${cashierData.cashierName}'s Cash Register`;

// Update CSS
updateCSS();

// Default values
nameInput.value = cashierData.cashierName;
colorOneInput.value = cashierData.colorOne;
colorTwoInput.value = cashierData.colorTwo;
colorThreeInput.value = cashierData.colorThree;
colorFourInput.value = cashierData.colorFour;

// Event listeners for page inputs
nameInput.addEventListener('change', (e) => {
  cashierData.cashierName = e.target.value;
  // Set cashier's name based on saved value
  title.innerHTML = `${cashierData.cashierName}'s Cash Register`;
  saveJSON(cashierData, 'ACR-data');
});

colorOneInput.addEventListener('change', (e) => {
  cashierData.colorOne = e.target.value;
  saveJSON(cashierData, 'ACR-data');
  updateCSS();
});

colorTwoInput.addEventListener('change', (e) => {
  cashierData.colorTwo = e.target.value;
  saveJSON(cashierData, 'ACR-data');
});

colorThreeInput.addEventListener('change', (e) => {
  cashierData.colorThree = e.target.value;
  saveJSON(cashierData, 'ACR-data');
});

colorFourInput.addEventListener('change', (e) => {
  cashierData.colorFour = e.target.value;
  saveJSON(cashierData, 'ACR-data');
  updateCSS();
});

resetColorsButton.addEventListener('click', (e) => {
  // Set default colors to variable
  cashierData.colorOne = '#f357a5';
  cashierData.colorTwo = '#ff69b4';
  cashierData.colorThree = '#ffd7ff';
  cashierData.colorFour = '#ebd6ff';

  // Set colors of the inputs to default colors
  colorOneInput.value = cashierData.colorOne;
  colorTwoInput.value = cashierData.colorTwo;
  colorThreeInput.value = cashierData.colorThree;
  colorFourInput.value = cashierData.colorFour;

  // Save to local storage
  saveJSON(cashierData, 'ACR-data');

  // Update CSS
  updateCSS();
});
