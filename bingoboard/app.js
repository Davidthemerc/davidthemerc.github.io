// Variables
const hoverBox = document.getElementById('hoverbox');

// Add event listeners to each image to trigger displayDataOnHover function
document.querySelectorAll('.cube img').forEach(function (img) {
  img.addEventListener('mouseover', function (event) {
    var position = event.target.alt;
    displayDataOnHover(position, event);
  });
});

// Add event listeners to each image to trigger hideHoverBox function when mouse leaves the image
document.querySelectorAll('.cube img').forEach(function (img) {
  img.addEventListener('mouseleave', function () {
    hideHoverBox();
  });
});
