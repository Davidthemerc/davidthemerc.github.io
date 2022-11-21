// Random number function
// Accepts minimum and maximum number as parameters
const ranBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const playAudio = (audioIndex) => {
  audioList[audioIndex].play();
};

// Function to load/initialize hunter data
const loadHunter = () => {
  const saveJSON = localStorage.getItem('TH-HunterData');

  // If there's saved data, pull it from localstorage
  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  }
  // If there isn't saved data, or if it is null, initialize new data
  else return defaultHunter;
};

// Function to load saved localstorage data
const getJSON = (savedName) => {
  const saveJSON = localStorage.getItem(savedName);

  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  } else return [];
};

// Function to save localstorage data
const saveJSON = (savedItem, savedName) => {
  localStorage.setItem(savedName, JSON.stringify(savedItem));
};

// Function to display messages in an area of the page
const displayMessage = (message, messageEl, length) => {
  messageEl.innerHTML = message;

  if (length > 0) {
    setTimeout(() => {
      messageEl.innerHTML = '';
    }, length * 1000);
  } else {
    setTimeout(() => {
      messageEl.innerHTML = '';
    }, 3000);
  }
};

// Function for the hunter to fire their weapon
const fireWeapon = () => {
  if (bulletTime === 1) {
    return;
  }
  // Check the current ammo in the magazine first.
  let currentWeapon = hunter.currentWeapon;
  let currentMag = hunter.weapons[hunter.currentWeapon].currentMag;

  // All code goes in here
  try {
    if (currentMag === 0) {
      throw new Error('Cannot fire!');
    }

    // Fire weapon
    ammoHandling(currentWeapon, 'firing');

    // Error handling
  } catch (error) {
    if (currentWeapon === 0) {
      // Do nothing for fists
    } else {
      playAudio(hunter.weapons[hunter.currentWeapon].weaponEmptySound);
      throw new Error('Cannot fire!');
    }
  }
};

// Function to reload a gun
const reloadWeapon = () => {
  if (bulletTime === 1) {
    return;
  }
  // Check the current ammo in the magazine first
  let currentWeapon = hunter.currentWeapon;

  try {
    ammoHandling(currentWeapon, 'reload');
  } catch (error) {}
};

// Function to handle ammo in weapons
const ammoHandling = (weapon, action) => {
  // Don't allow this function to run in the middle of a gun shot or reload

  bulletTime = 1;
  statusArea.className += ' busy';

  let currentMag = hunter.weapons[weapon].currentMag;
  let currentAmmo = hunter.weapons[weapon].weaponAmmo;
  let fullMag = hunter.weapons[weapon].weaponMag;

  // Reloading
  if (action === 'reload') {
    // Start pause timer (no other actions while it's running)
    setTimeout(() => {
      bulletTime = 0;
      statusArea.className = 'statusarea flextop row';
    }, 1000 * hunter.weapons[weapon].weaponReloadTime);

    // Don't allow reload if mag is full!
    if (currentMag === fullMag && weapon !== 0) {
      throw new Error('Magazine is FULL!');
    }
    if (currentAmmo === 0 && weapon !== 0) {
      throw new Error('No ammo, cannot reload.');
    }
    // Check how much is in the mag vs max mag capacity
    let reloadAmt = fullMag - currentMag;

    // Check how much ammo there is vs how much needs to be reloaded for a full mag
    // If there's not enough ammo for a full reload, do a partial reload
    if (currentAmmo < reloadAmt) {
      reloadAmt = currentAmmo;
      hunter.weapons[hunter.currentWeapon].weaponAmmo = 0;
    }

    // Apply the reloaded ammo to the gun
    hunter.weapons[hunter.currentWeapon].currentMag += reloadAmt;

    // Remove ammo from ammo count
    hunter.weapons[hunter.currentWeapon].weaponAmmo -= reloadAmt;

    // Refresh the mag display
    magEl.innerHTML = hunter.weapons[hunter.currentWeapon].currentMag;
    // If the weapon is fists, show the infinity symbol
    if (hunter.currentWeapon === 0) {
      magEl.innerHTML = '∞';
    }

    // Populate the weapon ammo display
    ammoEl.innerHTML = hunter.weapons[hunter.currentWeapon].weaponAmmo;

    playAudio(hunter.weapons[hunter.currentWeapon].weaponReloadSound);
  }

  // Firing
  if (action === 'firing') {
    // Start pause timer (no other actions while it's running)
    setTimeout(() => {
      bulletTime = 0;
      statusArea.className = 'statusarea flextop row';
    }, 1000 * hunter.weapons[weapon].weaponFiringTime);

    // If the hunter's magazine is empty, stop and tell them to reload
    if (currentMag === 0 && weapon !== 0) {
      throw new Error('Magazine is empty! Reload!');
    }

    // Else, mag must be OK
    // Now "fire" the weapon
    playAudio(hunter.weapons[hunter.currentWeapon].weaponFireSound);
    if (weapon !== 0) {
      hunter.weapons[hunter.currentWeapon].currentMag -= 1;
    }
    // Refresh the mag display
    magEl.innerHTML = hunter.weapons[hunter.currentWeapon].currentMag;
    // If the weapon is fists, show the infinity symbol
    if (hunter.currentWeapon === 0) {
      magEl.innerHTML = '∞';
    }
  }
  saveJSON(hunter, 'TH-HunterData');
};

const weaponDamage = (weapon) => {
  let currentWeapon = hunter.weapons[weapon];

  // Find tier of weapon (e.g Weapon - WeaponDamage)
  let weaponTier = currentWeapon.weaponDamage;

  // Define damage variable (damage to be calculated shortly)
  let damage = 0;

  // Tier 0 Weapons
  // Fist
  if (weaponTier === 0) {
    damage = ranBetween(1, 10);
  }

  // Tier 1 Weapons
  // Revolver, etc.
  if (weaponTier === 1) {
    damage = ranBetween(12, 20);
  }

  if (damage === 20) {
    // Critical hit!
    return turkeyHealth;
  }

  if (damage >= 14) {
    // Successful hit! Return 1 damage
    return 1;
  } else {
    // Unlucky! No damage!
    return 0;
  }
};

const vh = (percent) => {
  var h = Math.max(
    document.documentElement.clientHeight,
    window.innerHeight || 0
  );
  return (percent * h) / 100;
};

const vw = (percent) => {
  var w = Math.max(
    document.documentElement.clientWidth,
    window.innerWidth || 0
  );
  return (percent * w) / 100;
};

const getAbsoluteHeight = (el) => {
  // Get the DOM Node if you pass in a string
  el = typeof el === 'string' ? document.querySelector(el) : el;

  var styles = window.getComputedStyle(el);
  var margin =
    parseFloat(styles['marginTop']) + parseFloat(styles['marginBottom']);

  return Math.ceil(el.offsetHeight + margin);
};
