const managerData = () => {
  const saveJSON = localStorage.getItem('managerData');

  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else return { mName: 'Manager', cName: 'Vending United', money: 2000 };
};

const getJSON = (savedName) => {
  const saveJSON = localStorage.getItem(savedName);

  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else return [];
};

const saveJSON = (savedItem, savedName) => {
  localStorage.setItem(savedName, JSON.stringify(savedItem));
};

// Run agency function
// If 7 "days" haven't passed since the function initially ran, it will just reload the same available location options
// If 7 "days" have passed since the function initially ran, it will generate new location options
const runAgency = () => {};
