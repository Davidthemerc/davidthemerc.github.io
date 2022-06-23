const showOnPage = function (text, div, eltype) {
  let newParagraph = document.createElement(`${eltype}`);
  newParagraph.innerHTML = text;
  console.log(text);
  let outputDiv = document.getElementById(`${div}`);
  outputDiv.append(newParagraph);
};

// Random number function
// Accepts minimum and maximum number as parameters
const ranBetween = function randomNumbersBetweenMinAndMax(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Submit form values to array
const pushValues = function (listItem) {
  restaurants.push({
    listItem: listItem,
    id: uuidv4(),
  });
  saveResults(restaurants);
};

const pushRemoved = function (listItem) {
  selectedRestaurants.push({
    listItem: listItem,
  });
  saveRemoved(selectedRestaurants);
};

// Check for locally saved data
const getSavedRestaurants = function () {
  const resultsJSON = localStorage.getItem('restaurants');

  if (resultsJSON !== null) {
    return JSON.parse(resultsJSON);
  } else {
    return [];
  }
};

const getSelectedRestaurants = function () {
  const removedItemsJSON = localStorage.getItem('selectedRestaurants');

  if (removedItemsJSON !== null) {
    return JSON.parse(removedItemsJSON);
  } else {
    return [];
  }
};

// Save restaurants to local storage
const saveResults = function (restaurants) {
  localStorage.setItem('restaurants', JSON.stringify(restaurants));
};

// Save restaurants to local storage
const saveRemoved = function (selectedRestaurants) {
  localStorage.setItem(
    'selectedRestaurants',
    JSON.stringify(selectedRestaurants)
  );
};

// Remove a day entry from the array if the UUID matches
const removeResult = function (id) {
  const resultIndex = restaurants.findIndex((result) => result.id === id);

  if (resultIndex > -1) {
    let confirmAction = confirm(
      `Are you sure you want to delete "${restaurants[resultIndex].listItem}"?`
    );
    if (confirmAction) {
      document.querySelector('#outputarea2').innerHTML = '';
      showOnPage(
        `List Item: ${restaurants[resultIndex].listItem} was deleted!`,
        'outputarea2',
        'span'
      );
      pushRemoved(restaurants[resultIndex].listItem);
      restaurants.splice(resultIndex, 1);
    } else {
      alert(`${restaurants[resultIndex].listItem} not deleted!`);
    }
  }
  displayRemoved(selectedRestaurants);
};

const resetRemoved = function () {
  document.querySelector('#outputarea2').innerHTML =
    'If a restaurant is picked, its name will appear here.';
};

const displayRemoved = function (removed) {
  document.querySelector('#deleted').innerHTML =
    'If a restaurant was previously picked, its name will appear below:';
  removed.forEach(function (removedLoop) {
    showOnPage(`${removedLoop.listItem}`, 'deleted', 'li');
  });
};

// Function to generate the DOM for each object in the array
const generateResultsDOM = function (result) {
  const resultsTextEl = document.createElement('span');

  document.querySelector('#outputarea').innerHTML = '';

  // Run a for each loop to render each object in the array
  result.forEach(function (resultLoop) {
    // Call the displayText function to actually tell the DOM what to create
    resultsTextEl.textContent = displayText(
      resultLoop.listItem,
      'a',
      resultLoop.id
    );
  });
};

// Function to generate what I'm adding to the DOM, as well as the text of the restaurants
const displayText = function (listItem, elType, resultID) {
  const resultsEl = document.createElement('div');
  const paragraph = document.createElement(`${elType}`);
  const button = document.createElement('button');
  paragraph.textContent = `${listItem} `;
  paragraph.className = 'item rocks';
  paragraph.setAttribute('href', `edit.html#${resultID}`);

  //  Setup the removal button & paragraph and append them both to a Div I can modify with CSS
  button.textContent = 'Delete';
  resultsEl.appendChild(paragraph);
  resultsEl.appendChild(button);
  document.querySelector('#outputarea').appendChild(resultsEl);
  button.addEventListener('click', function () {
    removeResult(resultID);
    saveResults(restaurants);
    generateResultsDOM(restaurants);
  });
};

const confirmDeletedSaved = function () {
  let confirmAction = confirm(
    'Are you sure you want to delete all currently saved restaurants?'
  );
  if (confirmAction) {
    restaurants = [];
    saveResults(restaurants);
    generateResultsDOM(restaurants);
    alert('Current restaurant data deleted!');
  } else {
    alert('Current restaurant data not deleted!');
  }
};

const confirmDeleteRemoved = function () {
  let confirmAction = confirm(
    'Are you sure you want to delete all previously selected restaurants?'
  );
  if (confirmAction) {
    selectedRestaurants = [];
    saveRemoved(selectedRestaurants);
    displayRemoved(selectedRestaurants);
    alert('Previously selected restaurants data deleted!');
  } else {
    alert('Previously selected restaurants deleted!');
  }
};

const selectRandomRestaurant = function (selectedNumber) {
  let removedName = restaurants[selectedNumber].listItem;
  document.querySelector('#outputarea2').innerHTML = '';
  showOnPage(
    `${restaurants[selectedNumber].listItem} was selected!`,
    'outputarea2',
    'span'
  );
  restaurants.splice(selectedNumber, 1);
  saveResults(restaurants);
  pushRemoved(removedName);
  generateResultsDOM(restaurants);
  displayRemoved(selectedRestaurants);
};
