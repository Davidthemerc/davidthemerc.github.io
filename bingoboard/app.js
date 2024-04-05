// Variables
const textBox = document.getElementById('textbox');

// Example array of objects
var imageData = [
  { position: 'A1', data: 'Data for A1' },
  { position: 'A2', data: 'Data for A2' },
  // Add more objects for other positions
];

// Add event listeners to each image to trigger displayDataOnHover function
document.querySelectorAll('.cube img').forEach(function (img) {
  img.addEventListener('mouseover', function (event) {
    var position = event.target.alt;
    displayDataOnHover(position);
  });
});

// Add event listeners to each image to trigger clearDataDisplay function when mouse leaves the image area
document.querySelectorAll('.cube img').forEach(function (img) {
  img.addEventListener('mouseleave', function (event) {
    clearDataDisplay();
  });
});
