const managerData = () => {
  const saveJSON = localStorage.getItem('managerData');

  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else return { mName: 'Manager', cName: 'Vending United' };
};

let getJSON = (savedName) => {
  const saveJSON = localStorage.getItem(savedName);

  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else return [];
};

let saveJSON = (savedItem, savedName) => {
  localStorage.setItem(savedName, JSON.stringify(savedItem));
};
