const displayTimer = (way) => {
  if (way === 1) {
    redMilliseconds += 10;

    if (redMilliseconds == 1000) {
      redMilliseconds = 0;
      redSeconds++;
    }

    if (redSeconds == 60) {
      redSeconds = 0;
      redMinutes++;
    }
  } else {
    greenMilliseconds += 10; //Normally 10

    if (greenMilliseconds == 1000) {
      greenMilliseconds = 0;
      greenSeconds++;
    }

    if (greenSeconds == 60) {
      greenSeconds = 0;
      greenMinutes++;
    }
  }

  // Debugging elements
  // redMinutesEl.innerHTML = redMinutes;
  // redSecondsEl.innerHTML = redSeconds;
  // greenMinutesEl.innerHTML = greenMinutes;
  // greenSecondsEl.innerHTML = greenSeconds;

  // Minute tick off stabilization
  // Green downward
  if (redSeconds > greenSeconds) {
    if (redMinutes < greenMinutes) {
      greenMinutes -= 1;
      redSeconds = 0;
      greenSeconds = 59;
    }
  }
  // Minute tick off stabilization
  // Red downward
  if (redSeconds < greenSeconds) {
    if (redMinutes > greenMinutes) {
      redMinutes -= 1;
      greenSeconds = 0;
      redSeconds = 59;
    }
  }

  minutes = greenMinutes - redMinutes;
  seconds = greenSeconds - redSeconds;
  milliseconds = redMilliseconds - greenMilliseconds;

  minutes = Math.abs(minutes);
  seconds = Math.abs(seconds);
  milliseconds = Math.abs(milliseconds);

  if (redMinutes * 60 + redSeconds < greenMinutes * 60 + greenSeconds) {
    // Green
    color = 'green';
    console.log('Green time');
  } else {
    // Red
    color = 'red';
    console.log('Red time');
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

  if (color === 'red' && minutes >= 1) {
    redDot.style.display = 'flex';
    greenDot.style.display = 'none';
  } else {
    redDot.style.display = 'none';
  }

  if (color === 'green' && minutes >= 1) {
    greenDot.style.display = 'flex';
    redDot.style.display = 'none';
  } else {
    greenDot.style.display = 'none';
  }

  clockControl();

  if (color === 'red') {
    clock.style.color = 'red';
  } else if (color === 'green') {
    clock.style.color = 'green';
  } else {
    clock.style.color = 'white';
  }
};

const dotCheck = () => {
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
};

const clockControl = () => {
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
};

const controlModification = (color) => {
  control.innerHTML = `CONTROL: ${color}`;
  color === 'NEUTRAL' ? (color = 'white') : color;
  control.style.color = `${color}`;
};
