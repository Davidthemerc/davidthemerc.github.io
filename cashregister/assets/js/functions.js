const addNumToDisplay = (num) => {
  // Add the pressed number to the display/variable
  display.innerHTML += num;
  // Play key clack sound
  playAudio(5);
};

// Random number function
// Accepts minimum and maximum number as parameters
const ranBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const displayBackspace = () => {
  // Remove the last value in the display/variable
  let displayVal = display.innerHTML;
  displayVal = displayVal.slice(0, -1);
  display.innerHTML = displayVal;
  // Play key clack sound
  playAudio(5);
};

const displayAddPeriod = () => {
  let displayVal = display.innerHTML;
  // Play key clack sound
  playAudio(5);

  if (displayVal.includes('.') || displayVal == '') {
    // Don't let the user add a second decimal place or one if there is no value!
    return;
  } else {
    // If there isn't an existing decimal place, add it to the end of the value
    displayVal = displayVal + '.';
    display.innerHTML = displayVal;
  }
};

const playAudio = (id) => {
  audioList[id].play();
};

const openRegister = () => {
  if (cashDrawer.style.display === '') {
    cashDrawer.style.display = 'block';
    playAudio(0);
  } else {
    playAudio(7);
    setTimeout(() => {
      cashDrawer.style.display = '';
      display.innerHTML = '';
      checkoutTotal = 0;
    }, 2400);
  }
};

const scanItem = () => {
  playAudio(2);

  // Add a random value to the display to simulate a scan

  let priceFirst = ranBetween(0, 1);
  let priceSecond = ranBetween(0, 9);
  let priceThird = ranBetween(0, 9);

  if (priceFirst === 0) {
    priceFirst = '';
  }
  priceThird += `${ranBetween(0, 9)}`;

  let totalPrice = `${priceFirst}${priceSecond}.${priceThird}`;
  display.innerHTML = totalPrice;

  // Get a reference to the body element
  const body = document.body;

  // Add a class to the body element that triggers the animation
  body.classList.add('red-flash');

  // Remove the class after a short delay
  setTimeout(() => {
    body.classList.remove('red-flash');
  }, 100);
};

const confirmPrice = () => {
  // Turn the money value into a number
  let totalPrice = parseFloat(display.innerHTML);

  if (totalPrice) {
    checkoutTotal += totalPrice;
    playAudio(1);
    display.innerHTML = '';
  } else {
    // Play the sound, but do nothing else to prevent NaN
    playAudio(1);
  }
};

const clearDisplay = () => {
  display.innerHTML = '';
  // Play erase sound
  playAudio(6);
  checkoutTotal = 0;
};

const checkoutCart = () => {
  if ((checkoutTotal === 0) | (checkoutTotal === NaN) || checkoutTotal === '') {
    // Do nothing else to prevent NaN
    return;
  }
  checkoutTotal = floatFix(checkoutTotal);

  if (checkoutTotal !== 0) {
    display.innerHTML = checkoutTotal.toFixed(2);
    playAudio(8);
  }
};

const floatFix = (dataToFix) => {
  dataToFix = Math.round(dataToFix * 100);
  dataToFix = dataToFix / 100;
  return dataToFix;
};

const swipeCard = () => {
  // Play the card swipe sound, clear total since they've
  playAudio(4);
  setTimeout(() => {
    checkoutTotal = 0;
    display.innerHTML = '';
  }, 1500);
};
