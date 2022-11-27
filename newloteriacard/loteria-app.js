'use strict';

// Call the function to assign the shuffled array to the shuffled variable
// We'll reference this to draw the card
let shuffled = getJSON('newLoteriaCard');
saveJSON(shuffled, 'newLoteriaCard');

// Assign part of the shuffled variable to a variable to track just the 16 displayed cards
currentCard = shuffled.slice(0, -38);

// Call the function to assign individual cards randomly to the entire loteria card
// Unless there's a card already, then we'll just load that
initialSetup();

// Game Type/Conditions Selector
conditions.addEventListener('change', (e) => {
  conditionsValue = document.getElementById('conditions').value;
});

// Voice Selector
voice.addEventListener('change', (e) => {
  voiceValue = document.getElementById('voice').value;
});

// Clear card event listener
clearButton.addEventListener('click', (e) => {
  // This array keeps track of which cards have beans
  clearBeanTracking();
  checkCallButton();
});

// New card event listener
newButton.addEventListener('click', (e) => {
  if (locked === 1) {
    // Card is locked. Do nothing!
    return;
  }

  // This array keeps track of which cards have beans
  shuffled = shuffle(loteriaArray);
  saveJSON(shuffled, 'newLoteriaCard');

  // Arrange the card images
  for (let i = 0; i < 16; i++) {
    lesserArranger(i);
  }
  clearBeanTracking();

  // Play the paper shuffle audio
  playAudio(gameAudio, 2);

  // Assign part of the shuffled variable to a variable to track just the 16 displayed cards
  currentCard = shuffled.slice(0, -38);
});

// Lock card event listener
lockButton.addEventListener('click', () => {
  lockCard();
});

// Bean selector event listener
beanSelect.addEventListener('change', (e) => {
  currentBean = e.target.value;
  reloadCard();
});

// Check if the card is locked
checkIfLocked();
