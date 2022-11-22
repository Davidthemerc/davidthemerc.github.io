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

  let currentMag = hunter.weapons[weapon].currentMag;
  let currentAmmo = hunter.weapons[weapon].weaponAmmo;
  let fullMag = hunter.weapons[weapon].weaponMag;

  // Reloading
  if (action === 'reload') {
    bulletTime = 1;
    statusArea.className += ' busy';

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

  // Buying Ammo
  if (action === 'buying') {
    // Check the armory ammo array for ammo costs
    if (hunter.money >= armoryAmmo[weapon].cost) {
      // Handle money first
      moneyHandling(armoryAmmo[weapon].cost, '-');
      moneyEl.innerHTML = `$${hunter.money}`;
      // Add ammo
      hunter.weapons[weapon].weaponAmmo += armoryAmmo[weapon].amount;
      // Let user know they bought ammo succesfsully
      displayMessage(
        `Bought ${armoryAmmo[weapon].amount} ${armoryAmmo[weapon].ammoName}.`,
        statusEl
      );
    } else {
      displayMessage(
        `Sorry, you don't have enough money to buy ${armoryAmmo[weapon].ammoName}.`,
        statusEl
      );
    }
  }

  // Firing
  if (action === 'firing') {
    bulletTime = 1;
    statusArea.className += ' busy';

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
    damage = ranBetween(1, 15);
  }

  // Tier 1 Weapons
  // Revolver, etc.
  if (weaponTier === 1) {
    damage = ranBetween(8, 20);
  }

  // Tier 2 Weapons
  // Upgraded Revolver, etc.
  if (weaponTier === 2) {
    damage = ranBetween(12, 20);
  }

  if (damage === 20) {
    // Critical hit!
    return turkeyHealth;
  } else if (damage >= 17) {
    // Successful greater hit! Return 2 damage
    return 2;
  } else if (damage >= 15) {
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

const trophyCase = () => {
  hunter.turkeysBagged.forEach((turkey) => {
    const trophyitem = document.createElement('div');
    const turkeyTitle = document.createElement('p');
    const turkeyWeight = document.createElement('p');
    const turkeyHeight = document.createElement('p');
    const sellButton = document.createElement('button');
    trophyitem.id = turkey.uuid;
    turkey.trueTrophy === true
      ? (trophyitem.className = 'flex trophyitem gold')
      : (trophyitem.className = 'flex trophyitem');
    turkeyTitle.className = 'turkeytitle bold larger';
    turkeyWeight.className = 'turkeyweight';
    turkeyHeight.className = 'turkeyheight';
    sellButton.className = 'nopad';
    turkeyTitle.textContent = `${turkey.firstName} ${turkey.lastName}`;
    turkeyWeight.textContent = turkey.weight;
    turkeyHeight.textContent = turkey.height;
    sellButton.textContent = 'Sell This Turkey';

    sellButton.addEventListener('click', () => {
      // Sell the turkey for cold hard cash
      moneyHandling(turkey.weightInt * 0.25, '+');
      displayMessage(
        `Sold ${turkey.firstName} ${turkey.lastName} for $${(
          turkey.weightInt * 0.25
        ).toFixed(2)}.`,
        statusEl
      );
      // Find index of this turkey
      const turkeyIndex = hunter.turkeysBagged.findIndex(
        (thisTurkey) => thisTurkey.uuid === turkey.uuid
      );
      hunter.turkeysBagged.splice(turkeyIndex, 1);
      document.getElementById(turkey.uuid).remove();
      saveJSON(hunter, 'TH-HunterData');
    });

    trophyitem.appendChild(turkeyTitle);
    trophyitem.appendChild(turkeyWeight);
    trophyitem.appendChild(turkeyHeight);
    trophyitem.appendChild(sellButton);
    trophyCaseEl.appendChild(trophyitem);
  });
};

// Function to generate turkey name (first or last)
const turkeyName = (type) => {
  if (type === 'first') {
    return turkeyNames.first[ranBetween(0, 21)];
  } else {
    return turkeyNames.last[ranBetween(0, 25)];
  }
};

// Function to add/remove coins
const moneyHandling = (amount, action) => {
  action === '-' ? (hunter.money -= amount) : (hunter.money += amount);
  if (hunter.money < 0) {
    hunter.money = 0;
  }
  saveJSON(hunter, 'TH-HunterData');
};

const weaponUpgrade = (ID) => {
  // Check if the hunter has the required funds
  if (
    hunter.money >= armoryUpgrades[ID].upgradeCost &&
    hunter.weapons[ID].weaponDamage !== 2
  ) {
    // Upgrade weapon tier
    hunter.weapons[ID].weaponDamage = armoryUpgrades[ID].upgradeTier;
    displayMessage(
      `Upgraded ${hunter.weapons[ID].weaponName} to ${armoryUpgrades[ID].upgradeName}`,
      statusEl
    );
    hunter.weapons[ID].weaponName = armoryUpgrades[ID].upgradeName;
    moneyHandling(1000, '-');
    moneyEl.innerHTML = `$${hunter.money}`;
    saveJSON(hunter, 'TH-HunterData');
  } else {
    if (hunter.weapons[ID].weaponDamage === 2) {
      displayMessage(`You already have that upgrade!`, statusEl);
    } else if (hunter.money < 1000) {
      displayMessage(`You don't have enough money!`, statusEl);
    }
  }
};
