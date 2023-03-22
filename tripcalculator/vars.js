const loadTripObject = () => {
  const saveJSON = localStorage.getItem('TC-data');

  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else {
    return {
      tripName: '',
      tripDistance: 0,
      carMPG: 0,
      carGal: 0,
      arrivalTime: '',
      mealStop: false,
    };
  }
};
