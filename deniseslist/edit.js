'use strict';

const itemId = location.hash.substring(1);
let results = getSavedResults();
let item = results.find((item) => item.id === itemId);

if (!item) {
  location.assign('deniseslist.html');
}

const itemText = document.querySelector('#item-body');

itemText.value = item.listItem;

itemText.addEventListener('input', (e) => {
  item.listItem = e.target.value;
  saveResults(results);
});

window.addEventListener('storage', (e) => {
  if (e.key === 'notes') {
    results = JSON.parse(e.newValue);
    item = results.find((item) => item.id === itemId);

    if (!note) {
      location.assign('deniseslist.html');
    }

    itemText.value = item.listItem;
  }
});
