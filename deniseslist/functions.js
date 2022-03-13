const showOnPage = function (text, div, eltype) {
  let newParagraph = document.createElement(`${eltype}`);
  newParagraph.innerHTML = text;
  console.log(text);
  let outputDiv = document.getElementById(`${div}`);
  outputDiv.append(newParagraph);
};

// Submit form values to array
const pushValues = function (listItem) {
  results.push({
    listItem: listItem,
    id: uuidv4(),
  });
  saveResults(results);
};

const pushRemoved = function (listItem) {
  removedItems.push({
    listItem: listItem,
  });
  saveRemoved(removedItems);
};

// Check for locally saved data
const getSavedResults = function () {
  const resultsJSON = localStorage.getItem('results');

  if (resultsJSON !== null) {
    return JSON.parse(resultsJSON);
  } else {
    return [];
  }
};

const getRemovedItems = function () {
  const removedItemsJSON = localStorage.getItem('removedItems');

  if (removedItemsJSON !== null) {
    return JSON.parse(removedItemsJSON);
  } else {
    return [];
  }
};

// Save results to local storage
const saveResults = function (results) {
  localStorage.setItem('results', JSON.stringify(results));
};

// Save results to local storage
const saveRemoved = function (removedItems) {
  localStorage.setItem('removedItems', JSON.stringify(removedItems));
};

// Remove a day entry from the array if the UUID matches
const removeResult = function (id) {
  const resultIndex = results.findIndex(function (result) {
    document.querySelector('#outputarea2').innerHTML = '';
    showOnPage(
      `List Item: ${result.listItem} was removed!`,
      'outputarea2',
      'span'
    );
    return result.id === id;
  });

  if (resultIndex > -1) {
    pushRemoved(results[resultIndex].listItem);
    results.splice(resultIndex, 1);
  }
  displayRemoved(removedItems);
};

const resetRemoved = function () {
  document.querySelector('#outputarea2').innerHTML =
    'Removed items will appear here.';
};

const displayRemoved = function (removed) {
  document.querySelector('#deleted').innerHTML = 'Deleted Items listed below:';
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
      'span',
      resultLoop.id
    );
  });
};

// Function to generate what I'm adding to the DOM, as well as the text of the results
const displayText = function (listItem, elType, resultID) {
  const resultsEl = document.createElement('div');
  const paragraph = document.createElement(`${elType}`);
  const button = document.createElement('button');
  paragraph.textContent = `${listItem} `;

  //  Setup the removal button & paragraph and append them both to a Div I can modify with CSS
  button.textContent = 'Delete';
  resultsEl.appendChild(paragraph);
  resultsEl.appendChild(button);
  resultsEl.className = 'rocks col-sm-4';
  document.querySelector('#outputarea').appendChild(resultsEl);
  button.addEventListener('click', function () {
    removeResult(resultID);
    saveResults(results);
    generateResultsDOM(results);
  });
};
