const displayTimer = (way) => {
  // Takes in the "way" parameter, which determines which ways
  if (way === 1) {
    timeMaster.redMilliseconds += 10;

    if (timeMaster.redMilliseconds == 1000) {
      timeMaster.redMilliseconds = 0;
      timeMaster.redSeconds++;
    }

    if (timeMaster.redSeconds == 60) {
      timeMaster.redSeconds = 0;
      timeMaster.redMinutes++;
    }
  } else {
    timeMaster.greenMilliseconds += 10; //Normally 10

    if (timeMaster.greenMilliseconds == 1000) {
      timeMaster.greenMilliseconds = 0;
      timeMaster.greenSeconds++;
    }

    if (timeMaster.greenSeconds == 60) {
      timeMaster.greenSeconds = 0;
      timeMaster.greenMinutes++;
    }
  }

  // Debugging elements
  // redMinutesEl.innerHTML = redMinutes;
  // redSecondsEl.innerHTML = redSeconds;
  // greenMinutesEl.innerHTML = greenMinutes;
  // greenSecondsEl.innerHTML = greenSeconds;

  // Minute tick off stabilization
  // Green downward
  if (timeMaster.redSeconds > timeMaster.greenSeconds) {
    if (timeMaster.redMinutes < timeMaster.greenMinutes) {
      timeMaster.greenMinutes -= 1;
      timeMaster.redSeconds = 0;
      timeMaster.greenSeconds = 59;
    }
  }
  // Minute tick off stabilization
  // Red downward
  if (timeMaster.redSeconds < timeMaster.greenSeconds) {
    if (timeMaster.redMinutes > timeMaster.greenMinutes) {
      timeMaster.redMinutes -= 1;
      timeMaster.greenSeconds = 0;
      timeMaster.redSeconds = 59;
    }
  }

  // Additional minute tick off stabilization
  if (timeMaster.redSeconds === timeMaster.greenSeconds) {
    timeMaster.redSeconds = 0;
    timeMaster.greenSeconds = 0;
  }

  if (timeMaster.redMinutes === timeMaster.greenMinutes) {
    timeMaster.redMinutes = 0;
    timeMaster.greenMinutes = 0;
  }

  timeMaster.minutes = timeMaster.greenMinutes - timeMaster.redMinutes;
  timeMaster.seconds = timeMaster.greenSeconds - timeMaster.redSeconds;
  timeMaster.milliseconds =
    timeMaster.redMilliseconds - timeMaster.greenMilliseconds;

  timeMaster.minutes = Math.abs(timeMaster.minutes);
  timeMaster.seconds = Math.abs(timeMaster.seconds);
  timeMaster.milliseconds = Math.abs(timeMaster.milliseconds);

  if (
    timeMaster.redMinutes * 60 + timeMaster.redSeconds <=
    timeMaster.greenMinutes * 60 + timeMaster.greenSeconds
  ) {
    // Green
    timeMaster.color = 'green';
  } else {
    // Red
    timeMaster.color = 'red';
  }

  if (
    timeMaster.seconds === 0 &&
    timeMaster.minutes === 0 &&
    timeMaster.milliseconds === 0
  ) {
    timeMaster.color = 'white';
  }

  if (timeMaster.greenMinutes >= 1 && timeMaster.minutes >= 1) {
    greenDot.style.display = 'flex';
    redDot.style.display = 'none';
  } else {
    greenDot.style.display = 'none';
  }

  if (timeMaster.redMinutes >= 1 && timeMaster.minutes >= 1) {
    redDot.style.display = 'flex';
    greenDot.style.display = 'none';
  } else {
    redDot.style.display = 'none';
  }

  if (timeMaster.color === 'red' && timeMaster.minutes >= 1) {
    redDot.style.display = 'flex';
    greenDot.style.display = 'none';
  } else {
    redDot.style.display = 'none';
  }

  if (timeMaster.color === 'green' && timeMaster.minutes >= 1) {
    greenDot.style.display = 'flex';
    redDot.style.display = 'none';
  } else {
    greenDot.style.display = 'none';
  }

  clockControl();
  clockColorCheck();
};

const dotCheck = () => {
  if (timeMaster.seconds === 0 && timeMaster.minutes === 0) {
    timeMaster.color = 'white';
    controlModification('NEUTRAL');
  }

  if (timeMaster.greenMinutes >= 1 && timeMaster.minutes >= 1) {
    greenDot.style.display = 'flex';
    redDot.style.display = 'none';
  } else {
    greenDot.style.display = 'none';
  }

  if (timeMaster.redMinutes >= 1 && timeMaster.minutes >= 1) {
    redDot.style.display = 'flex';
    greenDot.style.display = 'none';
  } else {
    redDot.style.display = 'none';
  }
};

const clockControl = () => {
  timeMaster.minutes = timeMaster.redMinutes - timeMaster.greenMinutes;
  timeMaster.seconds = timeMaster.redSeconds - timeMaster.greenSeconds;
  timeMaster.milliseconds =
    timeMaster.redMilliseconds - timeMaster.greenMilliseconds;
  timeMaster.minutes = Math.abs(timeMaster.minutes);
  timeMaster.seconds = Math.abs(timeMaster.seconds);

  let m =
    timeMaster.minutes < 10 ? '0' + timeMaster.minutes : timeMaster.minutes;
  let s =
    timeMaster.seconds < 10 ? '0' + timeMaster.seconds : timeMaster.seconds;

  if (timeMaster.minutes === 0 && timeMaster.seconds === 0) {
    clock.style.color = 'white';
    timeMaster.color = 'white';
  }

  clock.innerHTML = `${m}:${s}`;
  saveJSON(timeMaster, 'RC-data');
};

const controlModification = (color) => {
  color = color.toUpperCase();
  color === 'WHITE' ? (color = 'NEUTRAL') : color;
  control.innerHTML = `CONTROL: ${color}`;
  color === 'NEUTRAL' ? (color = 'white') : color;
  control.style.color = `${color}`;
};

// Function to load saved localstorage data
const getJSON = (savedName) => {
  const saveJSON = localStorage.getItem(savedName);

  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else
    return {
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
};

// Function to save localstorage data
const saveJSON = (savedItem, savedName) => {
  localStorage.setItem(savedName, JSON.stringify(savedItem));
};

const reloadTime = () => {
  clockControl();
  dotCheck();
  controlModification(timeMaster.color);
  clockColorCheck();
};

const clockColorCheck = () => {
  if (timeMaster.color === 'red') {
    clock.style.color = 'red';
  } else if (timeMaster.color === 'green') {
    clock.style.color = 'green';
  } else {
    clock.style.color = 'white';
  }
};

const timeManipulation = (
  mil,
  sec,
  min,
  rml,
  rsec,
  rmin,
  gmil,
  gsec,
  gmin,
  tint,
  tcolor
) => {
  // Set master time object
  timeMaster = {
    milliseconds: mil,
    seconds: sec,
    minutes: min,
    redMilliseconds: rml,
    redSeconds: rsec,
    redMinutes: rmin,
    greenMilliseconds: gmil,
    greenSeconds: gsec,
    greenMinutes: gmin,
    int: tint,
    color: tcolor,
  };
  saveJSON(timeMaster, 'RC-data');
};
