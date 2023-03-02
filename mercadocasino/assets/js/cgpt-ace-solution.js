// Define an array to hold the card values
var cardValues = [];

// Define a function to calculate the total value of the drawn cards
function calculateCardTotal() {
  var total = 0;
  var hasAce = false;

  // Iterate over the card values and add them to the total
  for (var i = 0; i < cardValues.length; i++) {
    if (cardValues[i] === 'A') {
      hasAce = true;
      total += 11; // Aces initially count as 11
    } else if (
      cardValues[i] === 'J' ||
      cardValues[i] === 'Q' ||
      cardValues[i] === 'K'
    ) {
      total += 10; // Face cards count as 10
    } else {
      total += parseInt(cardValues[i]); // Numeric cards count as their face value
    }
  }

  // If the total is over 21 and an ace has been drawn, count the ace as 1 instead of 11
  if (total > 21 && hasAce) {
    total -= 10;
  }

  return total;
}

// Add a card value to the array and recalculate the total
function addCardValue(value) {
  cardValues.push(value);
  var total = calculateCardTotal();
  console.log('Card values: ' + cardValues.join(', '));
  console.log('Total: ' + total);
}

// Example usage
addCardValue('2'); // Card values: 2, Total: 2
addCardValue('A'); // Card values: 2, A, Total: 13
addCardValue('K'); // Card values: 2, A, K, Total: 13
addCardValue('10'); // Card values: 2, A, K, 10, Total: 23 (ace is now counted as 1 instead of 11)
