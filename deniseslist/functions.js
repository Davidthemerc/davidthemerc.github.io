const showOnPage = function (text, div, eltype) {
  let newParagraph = document.createElement(`${eltype}`);
  newParagraph.innerHTML = text;
  newParagraph.className = 'deletedItem';
  console.log(text);
  let outputDiv = document.getElementById(`${div}`);
  outputDiv.append(newParagraph);
};

// Submit form values to array
const pushValues = function (listItem) {
  results.push({
    listItem: listItem,
    category: categoryNames[category.value],
    categoryNumber: parseInt(category.value),
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
  const resultIndex = results.findIndex((result) => result.id === id);

  if (resultIndex > -1) {
    let confirmAction = confirm(
      `Are you sure you want to delete "${results[resultIndex].listItem}"?`
    );
    if (confirmAction) {
      document.querySelector('#outputarea2').innerHTML = '';
      showOnPage(
        `List Item: ${results[resultIndex].listItem} was deleted!`,
        'outputarea2',
        'span'
      );
      pushRemoved(results[resultIndex].listItem);
      results.splice(resultIndex, 1);
    } else {
      alert(`${results[resultIndex].listItem} not deleted!`);
    }
  }
  displayRemoved(removedItems);
};

const resetRemoved = function () {
  document.querySelector('#outputarea2').innerHTML =
    'Deleted items will appear here.';
};

const displayRemoved = function (removed) {
  document.querySelector('#deleted').innerHTML = 'Deleted Items listed below:';
  removed.forEach(function (removedLoop) {
    showOnPage(`${removedLoop.listItem}`, 'deleted', 'li');
  });
};

const sortItemsByAlpha = (array) => {
  return array.sort((a, b) => {
    if (a.listItem < b.listItem) {
      return -1;
    } else if (a.listItem > b.listItem) {
      return 1;
    } else {
      return 0;
    }
  });
};

const sortItemsByCategory = (array) => {
  return array.sort((a, b) => {
    if (a.categoryNumber < b.categoryNumber) {
      return -1;
    } else if (a.categoryNumber > b.categoryNumber) {
      return 1;
    } else {
      return 0;
    }
  });
};

// Function to generate the DOM for each object in the array
const generateResultsDOM = function (result) {
  result = sortItemsByAlpha(result);
  result = sortItemsByCategory(result);
  const resultsTextEl = document.createElement('span');

  document.querySelector('#outputarea').innerHTML = '';

  // Run a for each loop to render each object in the array
  result.forEach(function (resultLoop) {
    // Call the displayText function to actually tell the DOM what to create
    displayText(resultLoop.listItem, resultLoop.category, 'a', resultLoop.id);
  });
};

// Function to generate what I'm adding to the DOM, as well as the text of the results
const displayText = function (listItem, category, elType, resultID) {
  const resultsEl = document.createElement('div');
  const paragraph = document.createElement(`${elType}`);
  const span = document.createElement('span');
  const button = document.createElement('button');
  paragraph.textContent = `${listItem}`;
  paragraph.className = 'item';
  paragraph.setAttribute('href', `edit.html#${resultID}`);
  span.textContent = ` - Dept: ${category} `;
  span.className = 'rocks2';

  //  Setup the removal button & paragraph and append them both to a Div I can modify with CSS
  button.textContent = 'Delete';
  resultsEl.appendChild(paragraph);
  resultsEl.appendChild(span);
  resultsEl.appendChild(button);
  resultsEl.className = 'rocks col-sm-4';
  document.querySelector('#outputarea').appendChild(resultsEl);
  button.addEventListener('click', function () {
    removeResult(resultID);
    saveResults(results);
    generateResultsDOM(results);
  });
};

function confirmDeletedSaved() {
  let confirmAction = confirm(
    'Are you sure you want to delete all list item data?'
  );
  if (confirmAction) {
    results = [];
    saveResults(results);
    generateResultsDOM(results);
    alert('Saved data deleted!');
  } else {
    alert('Saved data not deleted!');
  }
}

function confirmDeleteRemoved() {
  let confirmAction = confirm(
    'Are you sure you want to delete all removed item data?'
  );
  if (confirmAction) {
    removedItems = [];
    saveRemoved(removedItems);
    displayRemoved(removedItems);
    alert('Removed items data deleted!');
  } else {
    alert('Removed items data deleted!');
  }
}
