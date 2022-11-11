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

// Important time-related global variables
let [milliseconds, seconds, minutes] = [0, 0, 0];
let [redMilliseconds, redSeconds, redMinutes] = [0, 0, 0];
let [greenMilliseconds, greenSeconds, greenMinutes] = [0, 0, 0];
let int = null;
let color = 'white';

control.addEventListener('click', () => {
  if (control.innerHTML === 'CONTROL: NEUTRAL') {
    control.innerHTML = 'CONTROL: GREEN';
    control.style.color = 'green';
  } else if (control.innerHTML === 'CONTROL: GREEN') {
    control.innerHTML = 'CONTROL: RED';
    control.style.color = 'red';
  } else {
    control.innerHTML = 'CONTROL: NEUTRAL';
    control.style.color = 'white';
  }
});

redTimeButton.addEventListener('click', () => {
  if (int !== null) {
    clearInterval(int);
  }
  int = setInterval(displayTimer, 10, 1);
  console.log('Red time start');
});

neutralTimeButton.addEventListener('click', () => {
  clearInterval(int);
});

greenTimeButton.addEventListener('click', () => {
  if (int !== null) {
    clearInterval(int);
  }
  int = setInterval(displayTimer, 10, -1);
  console.log('Green time start');
});

resetButton.addEventListener('click', () => {
  clearInterval(int);
  redDot.style.display = 'none';
  greenDot.style.display = 'none';

  [milliseconds, seconds, minutes] = [0, 0, 0];
  redMilliseconds = 0;
  redSeconds = 0;
  redMinutes = 0;
  greenMilliseconds = 0;
  greenSeconds = 0;
  greenMinutes = 0;
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
  //Check current color

  if (clock.innerHTML === '00:00') {
    return;
  }

  if (color === 'red' && redSeconds === 0) {
    redMinutes -= 1;
    redSeconds = 59;
  } else if (color === 'green' && greenSeconds === 0) {
    greenMinutes -= 1;
    greenSeconds = 59;
  } else if (color === 'red') {
    redSeconds -= 1;
  } else if (color === 'green') {
    greenSeconds -= 1;
  }

  minutes = redMinutes - greenMinutes;
  seconds = redSeconds - greenSeconds;
  milliseconds = redMilliseconds - greenMilliseconds;
  minutes = Math.abs(minutes);
  seconds = Math.abs(seconds);

  dotCheck();

  let m = minutes < 10 ? '0' + minutes : minutes;
  let s = seconds < 10 ? '0' + seconds : seconds;

  if (minutes === 0 && seconds === 0) {
    clock.style.color = 'white';
    color = 'white';
  }

  clock.innerHTML = `${m}:${s}`;
});

timeUpButton.addEventListener('click', () => {
  //Check current color

  if (clock.innerHTML === '00:00') {
    return;
  }

  if (color === 'red' && redSeconds === 59) {
    redMinutes += 1;
    redSeconds = 0;
  } else if (color === 'green' && greenSeconds === 59) {
    greenMinutes += 1;
    greenSeconds = 0;
  } else if (color === 'red') {
    redSeconds += 1;
  } else if (color === 'green') {
    greenSeconds += 1;
  }

  minutes = redMinutes - greenMinutes;
  seconds = redSeconds - greenSeconds;
  milliseconds = redMilliseconds - greenMilliseconds;
  minutes = Math.abs(minutes);
  seconds = Math.abs(seconds);

  dotCheck();

  let m = minutes < 10 ? '0' + minutes : minutes;
  let s = seconds < 10 ? '0' + seconds : seconds;

  if (minutes === 0 && seconds === 0) {
    clock.style.color = 'white';
    color = 'white';
  }

  clock.innerHTML = `${m}:${s}`;
});

timeDownFastButton.addEventListener('click', () => {
  //Check current color

  if (clock.innerHTML === '00:00') {
    return;
  }

  if (color === 'red' && redSeconds <= 4) {
    let diff = 5 - redSeconds;
    redMinutes -= 1;
    redSeconds = 60 - diff;
  } else if (color === 'green' && greenSeconds <= 4) {
    let diff = 5 - greenSeconds;
    greenMinutes -= 1;
    greenSeconds = 60 - diff;
  } else if (color === 'red') {
    redSeconds -= 5;
  } else if (color === 'green') {
    greenSeconds -= 5;
  }

  dotCheck();

  minutes = redMinutes - greenMinutes;
  seconds = redSeconds - greenSeconds;
  milliseconds = redMilliseconds - greenMilliseconds;
  minutes = Math.abs(minutes);
  seconds = Math.abs(seconds);

  let m = minutes < 10 ? '0' + minutes : minutes;
  let s = seconds < 10 ? '0' + seconds : seconds;

  if (minutes === 0 && seconds === 0) {
    clock.style.color = 'white';
    color = 'white';
  }

  clock.innerHTML = `${m}:${s}`;
});

timeUpFastButton.addEventListener('click', () => {
  //Check current color

  if (clock.innerHTML === '00:00') {
    return;
  }

  if (color === 'red' && redSeconds >= 55) {
    let diff = 60 - redSeconds;
    redMinutes += 1;
    redSeconds = 0 + 5 - diff;
  } else if (color === 'green' && greenSeconds >= 55) {
    let diff = 60 - greenSeconds;
    greenMinutes += 1;
    greenSeconds = 0 + 5 - diff;
  } else if (color === 'red') {
    redSeconds += 5;
  } else if (color === 'green') {
    greenSeconds += 5;
  }

  minutes = redMinutes - greenMinutes;
  seconds = redSeconds - greenSeconds;
  milliseconds = redMilliseconds - greenMilliseconds;
  minutes = Math.abs(minutes);
  seconds = Math.abs(seconds);

  dotCheck();

  let m = minutes < 10 ? '0' + minutes : minutes;
  let s = seconds < 10 ? '0' + seconds : seconds;

  if (minutes === 0 && seconds === 0) {
    clock.style.color = 'white';
    color = 'white';
  }

  clock.innerHTML = `${m}:${s}`;
});
