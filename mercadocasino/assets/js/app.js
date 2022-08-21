const outputDiv = document.getElementById('output');

// Spades, Clubs, Hearts, Diamonds
// We'll use three decks in one to deter card counters
const deckArray = [
  // Deck One
  { name: 'Two of Spades', value: 2, cardID: 0 },
  { name: 'Two of Clubs', value: 2, cardID: 1 },
  { name: 'Two of Hearts', value: 2, cardID: 2 },
  { name: 'Two of Diamonds', value: 2, cardID: 3 },
  { name: 'Three of Spades', value: 3, cardID: 4 },
  { name: 'Three of Clubs', value: 3, cardID: 5 },
  { name: 'Three of Hearts', value: 3, cardID: 6 },
  { name: 'Three of Diamonds', value: 3, cardID: 7 },
  { name: 'Four of Spades', value: 4, cardID: 8 },
  { name: 'Four of Clubs', value: 4, cardID: 9 },
  { name: 'Four of Hearts', value: 4, cardID: 10 },
  { name: 'Four of Diamonds', value: 4, cardID: 11 },
  { name: 'Five of Spades', value: 5, cardID: 12 },
  { name: 'Five of Clubs', value: 5, cardID: 13 },
  { name: 'Five of Hearts', value: 5, cardID: 14 },
  { name: 'Five of Diamonds', value: 5, cardID: 15 },
  { name: 'Six of Spades', value: 6, cardID: 16 },
  { name: 'Six of Clubs', value: 6, cardID: 17 },
  { name: 'Six of Hearts', value: 6, cardID: 18 },
  { name: 'Six of Diamonds', value: 6, cardID: 19 },
  { name: 'Seven of Spades', value: 7, cardID: 20 },
  { name: 'Seven of Clubs', value: 7, cardID: 21 },
  { name: 'Seven of Hearts', value: 7, cardID: 22 },
  { name: 'Seven of Diamonds', value: 7, cardID: 23 },
  { name: 'Eight of Spades', value: 8, cardID: 24 },
  { name: 'Eight of Clubs', value: 8, cardID: 25 },
  { name: 'Eight of Hearts', value: 8, cardID: 26 },
  { name: 'Eight of Diamonds', value: 8, cardID: 27 },
  { name: 'Nine of Spades', value: 9, cardID: 28 },
  { name: 'Nine of Clubs', value: 9, cardID: 29 },
  { name: 'Nine of Hearts', value: 9, cardID: 30 },
  { name: 'Nine of Diamonds', value: 9, cardID: 31 },
  { name: 'Ten of Spades', value: 10, cardID: 32 },
  { name: 'Ten of Clubs', value: 10, cardID: 33 },
  { name: 'Ten of Hearts', value: 10, cardID: 34 },
  { name: 'Ten of Diamonds', value: 10, cardID: 35 },
  { name: 'Jack of Spades', value: 10, cardID: 36 },
  { name: 'Jack of Clubs', value: 10, cardID: 37 },
  { name: 'Jack of Hearts', value: 10, cardID: 38 },
  { name: 'Jack of Diamonds', value: 10, cardID: 39 },
  { name: 'Queen of Spades', value: 10, cardID: 40 },
  { name: 'Queen of Clubs', value: 10, cardID: 41 },
  { name: 'Queen of Hearts', value: 10, cardID: 42 },
  { name: 'Queen of Diamonds', value: 10, cardID: 43 },
  { name: 'King of Spades', value: 10, cardID: 44 },
  { name: 'King of Clubs', value: 10, cardID: 45 },
  { name: 'King of Hearts', value: 10, cardID: 46 },
  { name: 'King of Diamonds', value: 10, cardID: 47 },
  { name: 'Ace of Spades', value: 11, cardID: 48 },
  { name: 'Ace of Clubs', value: 11, cardID: 49 },
  { name: 'Ace of Hearts', value: 11, cardID: 50 },
  { name: 'Ace of Diamonds', value: 11, cardID: 51 },
];

const cardImages = Array();
for (let i = 0; i <= 51; i++) {
  cardImages[i] = new Image(500, 726);
  cardImages[i].src = `assets/img/${i}.png`;
}

shuffle(deckArray);
