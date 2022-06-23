'use strict';

const itemId = location.hash.substring(1);
let restaurants = getSavedRestaurants();
let item = restaurants.find((item) => item.id === itemId);

if (!item) {
  location.assign('index.html');
}

const itemText = document.querySelector('#item-body');

itemText.value = item.listItem;

itemText.addEventListener('input', (e) => {
  item.listItem = e.target.value;
  saveResults(restaurants);
});

window.addEventListener('storage', (e) => {
  if (e.key === 'results') {
    results = JSON.parse(e.newValue);
    item = results.find((item) => item.id === itemId);

    itemText.value = item.listItem;
  }
});
