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
// Important time-related global variables
let [milliseconds, seconds, minutes] = [0, 0, 0];
let [redmilliseconds, redSeconds, redMinutes] = [0, 0, 0];
let [greenmilliseconds, greenSeconds, greenMinutes] = [0, 0, 0];
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

  [milliseconds, seconds, minutes] = [0, 0, 0];
  redmilliseconds = 0;
  redSeconds = 0;
  redMinutes = 0;
  greenmilliseconds = 0;
  greenSeconds = 0;
  greenMinutes = 0;
  clock.innerHTML = '00:00';
  clock.style.color = 'white';
});

adjustButton.addEventListener('click', () => {
  let selectColor = prompt('Specify Color (Red/Green)');
  let manMinutes = prompt('Enter Manual Minutes (05 for 5 Mins)');
  let manSeconds = prompt('Enter Manual Second (05 for 5 Sec)');
  manMinutes = parseInt(manMinutes);
  manSeconds = parseInt(manSeconds);

  if (selectColor === 'red') {
    //Red Selected
  }
});

timeDownButton.addEventListener('click', () => {
  //Check current color
  if (color === 'red' && redSeconds >= 1) {
    redSeconds -= 1;
  } else if (color === 'white') {
    // Do nothing
    return;
  } else if (color === 'green' && greenSeconds >= 1) {
    greenSeconds -= 1;
  }

  minutes = redMinutes - greenMinutes;
  seconds = redSeconds - greenSeconds;
  milliseconds = redmilliseconds - greenmilliseconds;
  minutes = Math.abs(minutes);
  seconds = Math.abs(seconds);

  let m = minutes < 10 ? '0' + minutes : minutes;
  let s = seconds < 10 ? '0' + seconds : seconds;

  if (minutes === 0 && seconds === 0) {
    clock.style.color = 'white';
  }

  clock.innerHTML = `${m}:${s}`;
});

timeUpButton.addEventListener('click', () => {
  //Check current color
  if (color === 'red') {
    redSeconds += 1;
  } else if (color === 'white') {
    // Do nothing
    return;
  } else if (color === 'green') {
    greenSeconds += 1;
  }

  minutes = redMinutes - greenMinutes;
  seconds = redSeconds - greenSeconds;
  milliseconds = redmilliseconds - greenmilliseconds;
  minutes = Math.abs(minutes);
  seconds = Math.abs(seconds);

  let m = minutes < 10 ? '0' + minutes : minutes;
  let s = seconds < 10 ? '0' + seconds : seconds;

  if (minutes === 0 && seconds === 0) {
    clock.style.color = 'white';
  }

  clock.innerHTML = `${m}:${s}`;
});

timeDownFastButton.addEventListener('click', () => {
  //Check current color
  if (color === 'red' && redSeconds >= 5) {
    redSeconds -= 5;
  } else if (color === 'white') {
    // Do nothing
    return;
  } else if (color === 'green' && greenSeconds >= 5) {
    greenSeconds -= 5;
  }

  minutes = redMinutes - greenMinutes;
  seconds = redSeconds - greenSeconds;
  milliseconds = redmilliseconds - greenmilliseconds;
  minutes = Math.abs(minutes);
  seconds = Math.abs(seconds);

  let m = minutes < 10 ? '0' + minutes : minutes;
  let s = seconds < 10 ? '0' + seconds : seconds;

  if (minutes === 0 && seconds === 0) {
    clock.style.color = 'white';
  }

  clock.innerHTML = `${m}:${s}`;
});

timeUpFastButton.addEventListener('click', () => {
  //Check current color
  if (color === 'red') {
    redSeconds += 5;
  } else if (color === 'white') {
    // Do nothing
    return;
  } else if (color === 'green') {
    greenSeconds += 5;
  }

  minutes = redMinutes - greenMinutes;
  seconds = redSeconds - greenSeconds;
  milliseconds = redmilliseconds - greenmilliseconds;
  minutes = Math.abs(minutes);
  seconds = Math.abs(seconds);

  let m = minutes < 10 ? '0' + minutes : minutes;
  let s = seconds < 10 ? '0' + seconds : seconds;

  if (minutes === 0 && seconds === 0) {
    clock.style.color = 'white';
  }

  clock.innerHTML = `${m}:${s}`;
});
