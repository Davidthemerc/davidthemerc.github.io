const displayData = (data) => {
  const para = document.createElement('p');
  para.textContent = data;
  outputDiv.appendChild(para);
};

const loadTripData = () => {
  tripNameInput.value = tripObject.tripName;
  tripDistanceInput.value = tripObject.tripDistance;
  carMpgInput.value = tripObject.carMPG;
  carGalInput.value = tripObject.carGal;
  arrivalTimeInput.value = tripObject.arrivalTime;
  mealStopInput.checked = tripObject.mealStop;
};

// Function to save localstorage data
const saveJSON = (savedArray, savedName) => {
  localStorage.setItem(savedName, JSON.stringify(savedArray));
};

const calculateTrip = (trip) => {
  // Clear output
  outputDiv.innerHTML = '';

  // Average speed (assumed)
  const avgSpeed = 62;

  // How long will we expect the trip to take at this speed?
  let tripTime = trip.tripDistance / avgSpeed;
  let mealMessage;
  tripTime = tripTime.toFixed(2);
  tripTime = parseFloat(tripTime);
  if (mealStopInput.checked === true) {
    tripTime += 0.7;
    mealMessage = `You've indicated that you want to stop for a meal, which is factored in at about 45 minutes.`;
  }
  displayData('---');

  // Add an extra 20 minutes for average traffic delay
  tripTime += 0.33;

  const tripHours = Math.floor(tripTime);
  const tripMinutes = Math.round((tripTime - tripHours) * 60);

  displayData(
    `The trip should take about ${tripHours} hours and ${tripMinutes} minutes, depending on traffic. Some delays are factored in already. ${mealMessage}`
  );

  // Will a stop for gas be necessary?
  let tripMileage = trip.carGal * trip.carMPG;
  tripMileage = parseFloat(tripMileage);
  trip.tripDistance = parseFloat(trip.tripDistance);

  // How many times might they need to stop for gas?
  let times = Math.round(trip.tripDistance / tripMileage);
  if (trip.tripDistance / tripMileage >= 2) {
    displayData(`You will need to stop ${times} times.`);
  }

  let fuelMile1 = tripMileage * 0.8;
  let fuelMile2 = tripMileage * 0.9;

  if (trip.tripDistance < tripMileage * 2) {
    if (trip.tripDistance >= tripMileage) {
      displayData(
        `This is a long trip, you should refuel between mile ${fuelMile1} and ${fuelMile2}.`
      );
    } else {
      displayData(
        `The trip is less than your car's expected range. You can refuel on arrival, depending on how much you drive around.`
      );
    }
  } else if (times > 1) {
    for (let i = 1; i <= times; i++) {
      displayData(
        `This is a long trip, refuel #${i} should be between mile: ${
          fuelMile1 * i
        } and ${fuelMile2 * i}`
      );
    }
  }

  // Give the recommended departure time
  displayData(
    `It's recommended that should leave around ${calculateDepartureTime(
      trip.arrivalTime,
      tripTime
    )} if you want to arrive at your indicated time.`
  );
};

const calculateDepartureTime = (arrivalTime, time) => {
  // Parse the arrival time string into a Date object
  const arrivalDate = new Date(`January 1, 2000 ${arrivalTime}`);

  // Subtract 7 hours and 19 minutes from the arrival time
  const departureDate = new Date(arrivalDate.getTime() - time * 60 * 60 * 1000);

  // Format the departure time as a string in the format "h:mm AM/PM"
  const hours = departureDate.getHours() % 12 || 12;
  const minutes = departureDate.getMinutes().toString().padStart(2, '0');
  const ampm = departureDate.getHours() >= 12 ? 'PM' : 'AM';
  const departureTime = `${hours}:${minutes} ${ampm}`;

  return departureTime;
};
