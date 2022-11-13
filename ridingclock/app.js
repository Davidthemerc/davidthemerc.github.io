// Define page elements
const redDot = document.getElementById('reddot');
const clock = document.getElementById('clock');
const greenDot = document.getElementById('greendot');
const resetButton = document.getElementById('reset');
const adjustButton = document.getElementById('adjust');
const control = document.getElementById('control');
const timeDownButton = document.getElementById('timedown');
const timeUpButton = document.getElementById('timeup');
const timeDownFastButton = document.getElementById('timedownfast');
const timeUpFastButton = document.getElementById('timeupfast');
const redTimeButton = document.getElementById('redtime');
const neutralTimeButton = document.getElementById('neutraltime');
const greenTimeButton = document.getElementById('greentime');
// Debugging elements
// const redSecondsEl = document.getElementById('redseconds');
// const redMinutesEl = document.getElementById('redminutes');
// const greenSecondsEl = document.getElementById('greenseconds');
// const greenMinutesEl = document.getElementById('greenminutes');

// New condensed object for local storage
let timeMaster = getJSON('RC-data');

redTimeButton.addEventListener('click', () => {
  if (timeMaster.int !== null) {
    clearInterval(timeMaster.int);
  }
  timeMaster.int = setInterval(displayTimer, 10, 1);
  controlModification('RED');
});

neutralTimeButton.addEventListener('click', () => {
  clearInterval(timeMaster.int);
  controlModification('NEUTRAL');
});

greenTimeButton.addEventListener('click', () => {
  if (timeMaster.int !== null) {
    clearInterval(timeMaster.int);
  }
  timeMaster.int = setInterval(displayTimer, 10, -1);
  controlModification('GREEN');
});

resetButton.addEventListener('click', () => {
  clearInterval(timeMaster.int);
  redDot.style.display = 'none';
  greenDot.style.display = 'none';
  controlModification('NEUTRAL');

  // Reset master time object
  timeMaster = {
    milliseconds: 0,
    seconds: 0,
    minutes: 0,
    redMilliseconds: 0,
    redSeconds: 0,
    redMinutes: 0,
    greenMilliseconds: 0,
    greenSeconds: 0,
    greenMinutes: 0,
    int: null,
    color: 'white',
  };
  saveJSON(timeMaster, 'RC-data');

  clock.innerHTML = '00:00';
  clock.style.color = 'white';
});

// adjustButton.addEventListener('click', () => {
//   let selectColor = prompt('Specify Color (Red/Green)');
//   let manMinutes = prompt('Enter Manual Minutes (05 for 5 Mins)');
//   let manSeconds = prompt('Enter Manual Second (05 for 5 Sec)');
//   manMinutes = parseInt(manMinutes);
//   manSeconds = parseInt(manSeconds);

//   if (selectColor === 'red') {
//     //Red Selected
//   }
// });

timeDownButton.addEventListener('click', () => {
  // Don't allow clock up/down modifications due to 0 time
  if (clock.innerHTML === '00:00') {
    return;
  }

  if (timeMaster.color === 'red' && timeMaster.redSeconds === 0) {
    timeMaster.redMinutes -= 1;
    timeMaster.redSeconds = 59;
  } else if (timeMaster.color === 'green' && timeMaster.greenSeconds === 0) {
    timeMaster.greenMinutes -= 1;
    timeMaster.greenSeconds = 59;
  } else if (timeMaster.color === 'red') {
    timeMaster.redSeconds -= 1;
  } else if (timeMaster.color === 'green') {
    timeMaster.greenSeconds -= 1;
  }
  // Clock control & checking for the dot condition (1+ min)
  clockControl();
  dotCheck();
});

timeUpButton.addEventListener('click', () => {
  // Don't allow clock up/down modifications due to 0 time
  if (clock.innerHTML === '00:00') {
    return;
  }

  if (timeMaster.color === 'red' && timeMaster.redSeconds === 59) {
    timeMaster.redMinutes += 1;
    timeMaster.redSeconds = 0;
  } else if (timeMaster.color === 'green' && timeMaster.greenSeconds === 59) {
    timeMaster.greenMinutes += 1;
    timeMaster.greenSeconds = 0;
  } else if (timeMaster.color === 'red') {
    timeMaster.redSeconds += 1;
  } else if (timeMaster.color === 'green') {
    timeMaster.greenSeconds += 1;
  }
  // Clock control & checking for the dot condition (1+ min)
  clockControl();
  dotCheck();
});

timeDownFastButton.addEventListener('click', () => {
  // Don't allow clock up/down modifications due to 0 time
  if (clock.innerHTML === '00:00' || timeMaster.seconds < 5) {
    return;
  }

  if (timeMaster.color === 'red' && timeMaster.redSeconds <= 4) {
    let diff = 5 - timeMaster.redSeconds;
    timeMaster.redMinutes -= 1;
    timeMaster.redSeconds = 60 - diff;
  } else if (timeMaster.color === 'green' && timeMaster.greenSeconds <= 4) {
    let diff = 5 - timeMaster.greenSeconds;
    timeMaster.greenMinutes -= 1;
    timeMaster.greenSeconds = 60 - diff;
  } else if (timeMaster.color === 'red') {
    timeMaster.redSeconds -= 5;
  } else if (timeMaster.color === 'green') {
    timeMaster.greenSeconds -= 5;
  }
  // Clock control & checking for the dot condition (1+ min)
  clockControl();
  dotCheck();
});

timeUpFastButton.addEventListener('click', () => {
  // Don't allow clock up/down modifications due to 0 time
  if (clock.innerHTML === '00:00') {
    return;
  }

  if (timeMaster.color === 'red' && timeMaster.redSeconds >= 55) {
    let diff = 60 - redSeconds;
    timeMaster.redMinutes += 1;
    timeMaster.redSeconds = 0 + 5 - diff;
  } else if (timeMaster.color === 'green' && timeMaster.greenSeconds >= 55) {
    let diff = 60 - timeMaster.greenSeconds;
    timeMaster.greenMinutes += 1;
    timeMaster.greenSeconds = 0 + 5 - diff;
  } else if (timeMaster.color === 'red') {
    timeMaster.redSeconds += 5;
  } else if (timeMaster.color === 'green') {
    timeMaster.greenSeconds += 5;
  }
  // Clock control & checking for the dot condition (1+ min)
  clockControl();
  dotCheck();
});

// Reload saved time on load
reloadTime();
