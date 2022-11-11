const displayTimer = (way) => {
  if (way === 1) {
    redmilliseconds += 10;

    if (redmilliseconds == 1000) {
      redmilliseconds = 0;
      redSeconds++;
    }

    if (redSeconds == 60) {
      redSeconds = 0;
      redMinutes++;
    }
  } else {
    greenmilliseconds += 10; //Normally 10

    if (greenmilliseconds == 1000) {
      greenmilliseconds = 0;
      greenSeconds++;
    }

    if (greenSeconds == 60) {
      greenSeconds = 0;
      greenMinutes++;
    }
  }

  minutes = redMinutes - greenMinutes;
  seconds = redSeconds - greenSeconds;
  milliseconds = redmilliseconds - greenmilliseconds;

  if (seconds < 0 && minutes <= 0) {
    // Green
    color = 'green';
    //console.log('Green time');
    minutes = Math.abs(minutes);
    seconds = Math.abs(seconds);
    milliseconds = Math.abs(milliseconds);
  } else {
    // Red
    color = 'red';
    //console.log('Red time');
    minutes = Math.abs(minutes);
    seconds = Math.abs(seconds);
    milliseconds = Math.abs(milliseconds);
  }

  if (seconds === 0 && minutes === 0) {
    color = 'white';
  }

  if (greenMinutes >= 1 && minutes >= 1) {
    greenDot.style.display = 'flex';
    redDot.style.display = 'none';
  } else {
    greenDot.style.display = 'none';
  }

  if (redMinutes >= 1 && minutes >= 1) {
    redDot.style.display = 'flex';
    greenDot.style.display = 'none';
  } else {
    redDot.style.display = 'none';
  }

  let m = minutes < 10 ? '0' + minutes : minutes;
  let s = seconds < 10 ? '0' + seconds : seconds;

  clock.innerHTML = `${m}:${s}`;

  if (color === 'red') {
    clock.style.color = 'red';
  } else if (color === 'green') {
    clock.style.color = 'green';
  } else {
    clock.style.color = 'white';
  }
};

let tid = 0;
let speed = 100;
