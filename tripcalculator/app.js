// Get references to all the input fields
const tripObject = loadTripObject();
const tripNameInput = document.getElementById('trip-name');
const tripDistanceInput = document.getElementById('trip-distance');
const carMpgInput = document.getElementById('car-mpg');
const carGalInput = document.getElementById('car-gal');
const arrivalTimeInput = document.getElementById('arrival-time');
const mealStopInput = document.getElementById('meal-stop');
const calculateButton = document.getElementById('calculate');
const outputDiv = document.getElementById('output');

// Load saved trip data
loadTripData();

// Add event listeners to all the input fields
tripNameInput.addEventListener('input', (e) => {
  tripObject.tripName = e.target.value;
  saveJSON(tripObject, 'TC-data');
});
tripDistanceInput.addEventListener('input', (e) => {
  tripObject.tripDistance = e.target.value;
  saveJSON(tripObject, 'TC-data');
});
carMpgInput.addEventListener('input', (e) => {
  tripObject.carMPG = e.target.value;
  saveJSON(tripObject, 'TC-data');
});
carGalInput.addEventListener('input', (e) => {
  tripObject.carGal = e.target.value;
  saveJSON(tripObject, 'TC-data');
});
arrivalTimeInput.addEventListener('change', (e) => {
  tripObject.arrivalTime = e.target.value;
  saveJSON(tripObject, 'TC-data');
});
mealStopInput.addEventListener('change', (e) => {
  tripObject.mealStop = e.target.checked;
  saveJSON(tripObject, 'TC-data');
});

// Add event listener to calculate button
calculateButton.addEventListener('click', (e) => {
  calculateTrip(tripObject);
});
