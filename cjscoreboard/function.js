// Function to load saved localstorage data
const getJSON = (savedName) => {
  const saveJSON = localStorage.getItem(savedName);

  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else return 0;
};

// Function to save localstorage data
const saveJSON = (savedArray, savedName) => {
  localStorage.setItem(savedName, JSON.stringify(savedArray));
};

const isNumeric = (value) => {
  return typeof value === 'number' && !isNaN(value);
};

const processValue = (value) => {
  if (!isNumeric(value)) {
    return 0;
  }
  // Proceed with processing the numeric value
  return value;
};
