const showOnPage = function (text, div, eltype) {
  let newParagraph = document.createElement(`${eltype}`);
  newParagraph.innerHTML = text;
  console.log(text);
  let outputDiv = document.getElementById(`${div}`);
  outputDiv.append(newParagraph);
};

// Submit form values to array
const pushValues = function (listItem, listImage, listLink) {
  results.push({
    listItem: listItem,
    listImage: listImage,
    listLink: listLink,
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
  const resultsJSON = localStorage.getItem('dwlitems');

  if (resultsJSON !== null) {
    return JSON.parse(resultsJSON);
  } else {
    return [];
  }
};

const getRemovedItems = function () {
  const removedItemsJSON = localStorage.getItem('dwlremovedItems');

  if (removedItemsJSON !== null) {
    return JSON.parse(removedItemsJSON);
  } else {
    return [];
  }
};

// Save results to local storage
const saveResults = function (results) {
  localStorage.setItem('dwlitems', JSON.stringify(results));
};

// Save results to local storage
const saveRemoved = function (removedItems) {
  localStorage.setItem('dwlremovedItems', JSON.stringify(removedItems));
};

// Remove a day entry from the array if the UUID matches
const removeResult = function (id) {
  const resultIndex = results.findIndex(function (result) {
    let confirmAction = confirm(
      `Are you sure you want to delete "${result.listItem}"?`
    );
    if (confirmAction) {
      document.querySelector('#outputarea2').innerHTML = '';
      showOnPage(
        `List Item: ${result.listItem} was deleted!`,
        'outputarea2',
        'span'
      );
      return result.id === id;
    } else {
      alert(`${result.listItem} not deleted!`);
    }
  });

  if (resultIndex > -1) {
    pushRemoved(results[resultIndex].listItem);
    results.splice(resultIndex, 1);
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

// Function to generate the DOM for each object in the array
const generateResultsDOM = function (result) {
  const resultsTextEl = document.createElement('span');

  document.querySelector('#outputarea').innerHTML = '';

  // Run a for each loop to render each object in the array
  result.forEach(function (resultLoop) {
    // Call the displayText function to actually tell the DOM what to create
    resultsTextEl.textContent = displayText(
      resultLoop.listItem,
      resultLoop.listImage,
      resultLoop.listLink,
      'a',
      resultLoop.id
    );
  });
};

// Function to generate what I'm adding to the DOM, as well as the text of the results
const displayText = function (listItem, listImage, listLink, elType, resultID) {
  const resultsEl = document.createElement('div');
  const paragraph = document.createElement(`${elType}`);
  paragraph.href = listLink;
  const span = document.createElement('span');

  // Add image
  const image = document.createElement('img');
  image.src = listImage;
  image.className = 'fitted';
  image.addEventListener('click', () => {
    location.assign(listLink);
  });

  // Add buttons and modify text and text box class
  const button = document.createElement('button');
  paragraph.textContent = `${listItem} `;
  paragraph.className = 'item';
  span.className = 'rocks2';

  //  Setup the removal button & paragraph and append them both to a Div I can modify with CSS
  button.textContent = 'Delete';
  button.className = 'delete';
  const paragraph2 = document.createElement('span');
  paragraph2.textContent = `Click the image to go to the item's link`;
  paragraph2.className = 'item2';
  resultsEl.appendChild(paragraph);
  resultsEl.appendChild(span);
  resultsEl.appendChild(image);
  resultsEl.appendChild(paragraph2);
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
    'Are you sure you want to delete all saved data?'
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
