'use strict';

// This is the code to preload the images
let imageList = Array();
for (let i = 0; i <= 53; i++) {
  imageList[i] = new Image(273, 390);
  imageList[i].src = '../loteriacard/images/loteria 5x7 ' + i + '.jpg';
}

let audioList = Array();
for (let i = 1; i <= 54; i++) {
  audioList[i] = new Audio();
  audioList[i].src = `audio/Sound ${i}.mp3`;
}

let loteriaDeckArray = [
  { ID: 0, Name: 'El Gallo' },
  { ID: 1, Name: 'El Diablito' },
  { ID: 2, Name: 'La Dama' },
  { ID: 3, Name: 'El Catrin' },
  { ID: 4, Name: 'El Paraguas' },
  { ID: 5, Name: 'La Sirena' },
  { ID: 6, Name: 'La Escalera' },
  { ID: 7, Name: 'La Botella' },
  { ID: 8, Name: 'El Barril' },
  { ID: 9, Name: 'El Arbol' },
  { ID: 10, Name: 'El Melon' },
  { ID: 11, Name: 'El Valiente' },
  { ID: 12, Name: 'El Gorrito' },
  { ID: 13, Name: 'La Muerte' },
  { ID: 14, Name: 'La Pera' },
  { ID: 15, Name: 'La Bandera' },
  { ID: 16, Name: 'El Bandolon' },
  { ID: 17, Name: 'El Violoncello' },
  { ID: 18, Name: 'La Garza' },
  { ID: 19, Name: 'El Pajaro' },
  { ID: 20, Name: 'La Mano' },
  { ID: 21, Name: 'La Bota' },
  { ID: 22, Name: 'La Luna' },
  { ID: 23, Name: 'El Cotorro' },
  { ID: 24, Name: 'El Borracho' },
  { ID: 25, Name: 'El Negrito' },
  { ID: 26, Name: 'El Corazon' },
  { ID: 27, Name: 'La Sandia' },
  { ID: 28, Name: 'El Tambor' },
  { ID: 29, Name: 'El Camaron' },
  { ID: 30, Name: 'Las Jaras' },
  { ID: 31, Name: 'El Musico' },
  { ID: 32, Name: 'La Arana' },
  { ID: 33, Name: 'El Soldado' },
  { ID: 34, Name: 'La Estrella' },
  { ID: 35, Name: 'El Cazo' },
  { ID: 36, Name: 'El Mundo' },
  { ID: 37, Name: 'El Apache' },
  { ID: 38, Name: 'El Nopal' },
  { ID: 39, Name: 'El Alacran' },
  { ID: 40, Name: 'La Rosa' },
  { ID: 41, Name: 'La Calavera' },
  { ID: 42, Name: 'La Campana' },
  { ID: 43, Name: 'El Cantarito' },
  { ID: 44, Name: 'El Venado' },
  { ID: 45, Name: 'El Sol' },
  { ID: 46, Name: 'La Corona' },
  { ID: 47, Name: 'La Chalupa' },
  { ID: 48, Name: 'El Pino' },
  { ID: 49, Name: 'El Pescado' },
  { ID: 50, Name: 'La Palma' },
  { ID: 51, Name: 'La Maceta' },
  { ID: 52, Name: 'El Arpa' },
  { ID: 53, Name: 'La Rana' },
];

// Define array of already called cards
let calledCards = [];

// Required Variables
let currentCard = {};

// Define the card slot as a variable
let cardArea = document.getElementById('cardArea');

// Define the call cards area and error messages area as avariables
let calledCardsDiv = document.querySelector('#calledCards');
let errorMessageDiv = document.querySelector('#errorMessages');

// Define buttons
let startButton = document.getElementById('startoff');
let repeatButton = document.getElementById('repeat');
let callButton = document.getElementById('call');

// Call the shuffle function to obtain a shuffled deck
let shuffledDeck = shuffle(loteriaDeckArray);

// Call initial setup function
// Show El Gallo by default
initialSetup();

// Start Button event listener
startButton.addEventListener('click', () => {
  startOff();
});

// Call Button event listener
callButton.addEventListener('click', () => {
  callCard();
});

// Repeat Button event listener
repeatButton.addEventListener('click', () => {
  repeatCall();
});
