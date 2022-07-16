'use strict';

const itemId = location.hash.substring(1);
let results = getSavedResults();
let item = results.find((item) => item.id === itemId);

if (!item) {
  location.assign('index.html');
}

const itemText = document.querySelector('#item-body');
const categoryLister = document.querySelector('#category');

itemText.value = item.listItem;
categoryLister.selectedIndex = item.categoryNumber + 1;

const wm = document.getElementById('wm');
wm.href = `https://www.walmart.com/search?q=${itemText.value}`;

itemText.addEventListener('input', (e) => {
  item.listItem = e.target.value;
  saveResults(results);
});

categoryLister.addEventListener('change', (e) => {
  item.categoryNumber = parseInt(e.target.value);
  item.category = categoryNames[item.categoryNumber];
  saveResults(results);
});

window.addEventListener('storage', (e) => {
  if (e.key === 'results') {
    results = JSON.parse(e.newValue);
    item = results.find((item) => item.id === itemId);

    itemText.value = item.listItem;
    categoryLister.selectedIndex = item.categoryNumber + 1;
  }
});
