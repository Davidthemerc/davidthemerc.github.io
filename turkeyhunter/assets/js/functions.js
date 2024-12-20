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
  // Check the current ammo in the magazine first
  let currentWeapon = hunter.currentWeapon;

  // If the hunter's magazine is the same size as the max capaacity,
  // also known as "full", then stop the reload process.
  if (
    hunter.weapons[currentWeapon].currentMag ===
    hunter.weapons[currentWeapon].weaponMag
  ) {
    return;
  }

  // If we're in the middle of a firing or reloading action, stop
  if (bulletTime === 1) {
    return;
  }

  // Proceed
  try {
    ammoHandling(currentWeapon, 'reload');
  } catch (error) {}
};

// Function to handle ammo in weapons
const ammoHandling = (weapon, action) => {
  checkWeapon = hunter.weapons.findIndex(({ weaponID }) => weaponID === weapon);

  // Reloading
  if (action === 'reload') {
    bulletTime = 1;
    statusArea.className += ' busy';

    let currentMag = hunter.weapons[weapon].currentMag;
    let currentAmmo = hunter.weapons[weapon].weaponAmmo;
    let fullMag = hunter.weapons[weapon].weaponMag;

    // Shotgun determine variable
    let shotgunDetermine = hunter.weapons[weapon].basicName;

    // Define reload sound variable
    // Can be manipulated later (for shotguns, etc.)
    let reloadSound = hunter.weapons[hunter.currentWeapon].weaponReloadSound;

    // Initial calculation of reload time
    let reloadTime = 1000 * hunter.weapons[weapon].weaponReloadTime;

    // If this is a shotgun, determine the following:
    // Appropriate reload time
    // Appropriate reload sound frame
    // If the mag is empty, don't use special shotgun reloading
    if (shotgunDetermine.includes('shotgun') && currentMag > 0) {
      // Determine how many shells need to actually be reloaded
      let needToReload = fullMag - currentMag;

      // Choose the reload sound based on how many shells need to be loaded
      reloadSound = 34 - needToReload;

      // Choose the reload time based on how many shells need to be loaded
      reloadTime = 1000 * shotgunReloadTimes[needToReload - 1];
    } else {
      // Non-Shotgun reloading. Clear the mag counter
      if (hunter.currentWeapon !== 0) {
        magEl.innerHTML = 0;
      }
    }

    // Start pause timer (bullet time - no other actions while it's running)
    setTimeout(() => {
      bulletTime = 0;
      statusArea.className = 'statusarea flextop row';
      // Populate the mag ammo display once reloading is done
      magEl.innerHTML = hunter.weapons[hunter.currentWeapon].weaponMag;
    }, reloadTime);

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

    // If the weapon is fists, show the infinity symbol
    if (hunter.currentWeapon === 0) {
      magEl.innerHTML = '∞';
    }

    // Populate the weapon ammo display
    ammoEl.innerHTML = hunter.weapons[hunter.currentWeapon].weaponAmmo;

    // Play the appropriate reloading sound
    playAudio(reloadSound);
  }

  // Buying Ammo
  if (action === 'buying') {
    if (checkWeapon === -1) {
      displayMessage(
        `You don't have the ${armoryWeapons[weapon].weaponName}!`,
        statusEl
      );
      return;
    }

    // Check the armory ammo array for ammo costs
    if (hunter.money >= armoryAmmo[checkWeapon].cost) {
      // Handle money first
      moneyHandling(armoryAmmo[checkWeapon].cost, '-');
      moneyEl.innerHTML = `$${hunter.money.toFixed(2)}`;
      // Add ammo
      hunter.weapons[checkWeapon].weaponAmmo += armoryAmmo[checkWeapon].amount;
      // Let user know they bought ammo succesfsully
      displayMessage(
        `Bought ${armoryAmmo[weapon].amount} ${armoryAmmo[weapon].ammoName}.`,
        statusEl
      );
    } else {
      displayMessage(
        `Sorry, you don't have enough money to buy ${armoryAmmo[checkWeapon].ammoName}.`,
        statusEl
      );
    }

    // Do a final money check for the price colors
    armoryPriceColors();
  }

  // Firing
  if (action === 'firing') {
    bulletTime = 1;
    statusArea.className += ' busy';

    let currentMag = hunter.weapons[weapon].currentMag;

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

  // Tier 3 Weapons
  // Shotgun, etc.
  if (weaponTier === 3) {
    damage = ranBetween(14, 20);
  }

  // Tier 4 Weapons
  // Upgraded Shotgun, Rifle, etc.
  if (weaponTier === 4) {
    damage = ranBetween(15, 20);
  }

  // Tier 5 Weapons
  // Upgraded Rifle, etc.
  if (weaponTier === 5) {
    damage = ranBetween(17, 20);
  }

  // Tier 6 Weapons
  // Upgraded Rifle, etc.
  if (weaponTier === 6) {
    damage = ranBetween(20, 25);
  }

  // Tier 7 Weapons
  // Black Powder Shotgun, etc.
  if (weaponTier === 7) {
    damage = ranBetween(21, 28);
  }

  if (damage >= 13) {
    playAudio(0);
  }

  console.log(`Damage=${damage}`);

  if (
    (weaponTier < 6 && damage === 20) ||
    (weaponTier === 6 && damage === 25) ||
    (weaponTier === 7 && damage === 28)
  ) {
    // Critical hit!
    setTimeout(() => {
      playAudio(ranBetween(22, 24));
    }, 1000);
    return turkeyHealth;
  } else if (damage >= 25) {
    // Successful greater hit! Return 3 damage
    return 3;
  } else if (damage >= 17) {
    // Successful greater hit! Return 2 damage
    return 2;
  } else if (damage >= 13) {
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
  // Assign the hunter's money to the money element
  moneyEl.innerHTML = `$${hunter.money.toFixed(2)}`;

  hunter.turkeysBagged.forEach((turkey) => {
    const trophyitem = document.createElement('div');
    const turkeyTitle = document.createElement('p');
    const turkeyWeight = document.createElement('p');
    const turkeyHeight = document.createElement('p');
    const sellButton = document.createElement('button');
    trophyitem.id = turkey.uuid;
    // If this is a trophy turkey, give it gold text
    turkey.trueTrophy === true
      ? (trophyitem.className = 'flex trophyitem gold')
      : (trophyitem.className = 'flex trophyitem');
    // Trophy Turkeys are worth 2x normal value
    let turkeySellValue = 0;
    turkey.trueTrophy
      ? (turkeySellValue = turkey.weightInt * 4)
      : (turkeySellValue = turkey.weightInt * 1.5);
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
      moneyHandling(turkeySellValue, '+');
      // Sale sound
      playAudio(ranBetween(37, 39));
      // Turkey sale message
      displayMessage(
        `Sold ${turkey.firstName} ${
          turkey.lastName
        } for $${turkeySellValue.toFixed(2)}.`,
        statusEl
      );
      // Find index of this turkey
      const turkeyIndex = hunter.turkeysBagged.findIndex(
        (thisTurkey) => thisTurkey.uuid === turkey.uuid
      );
      hunter.turkeysBagged.splice(turkeyIndex, 1);
      document.getElementById(turkey.uuid).remove();
      saveJSON(hunter, 'TH-HunterData');
      moneyEl.innerHTML = `$${hunter.money.toFixed(2)}`;
    });

    trophyitem.appendChild(turkeyTitle);
    trophyitem.appendChild(turkeyWeight);
    trophyitem.appendChild(turkeyHeight);
    trophyitem.appendChild(sellButton);
    trophyCaseEl.appendChild(trophyitem);
  });

  if (hunter.turkeysBagged.length === 0) {
    const noTurkey = document.createElement('p');
    noTurkey.textContent = 'Go get some turkeys!';
    noTurkey.className = 'centered nomargin marginbottom';
    trophyCaseEl.appendChild(noTurkey);
  }
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

const armoryHandling = (ID, action) => {
  // Scroll down
  window.scrollTo(0, document.body.scrollHeight);
  // Upgrading
  if (action === 'upgrade') {
    // Check if the hunter has the weapon they're trying to upgrade
    // If they don't have it, stop the upgrade process
    if (hunter.weapons.find(({ weaponID }) => weaponID === ID) === undefined) {
      displayMessage(
        `You don't have the ${armoryWeapons[ID].weaponName}!`,
        statusEl
      );
      return;
    }

    let weaponToUpgradeID = hunter.weapons.findIndex(
      ({ weaponID }) => weaponID === ID
    );

    // Check if the hunter has the required funds
    if (
      hunter.money >= armoryUpgrades[ID].upgradeCost &&
      hunter.weapons[weaponToUpgradeID].weaponDamage !==
        armoryUpgrades[ID].upgradeTier
    ) {
      // Upgrade weapon tier
      hunter.weapons[weaponToUpgradeID].weaponDamage =
        armoryUpgrades[ID].upgradeTier;
      displayMessage(
        `Upgraded ${hunter.weapons[weaponToUpgradeID].weaponName} to ${armoryUpgrades[ID].upgradeName}!`,
        statusEl
      );
      hunter.weapons[weaponToUpgradeID].weaponName =
        armoryUpgrades[ID].upgradeName;
      moneyHandling(armoryUpgrades[ID].upgradeCost, '-');
      moneyEl.innerHTML = `$${hunter.money.toFixed(2)}`;
      saveJSON(hunter, 'TH-HunterData');
    } else {
      if (
        hunter.weapons[weaponToUpgradeID].weaponDamage ===
        armoryUpgrades[ID].upgradeTier
      ) {
        displayMessage(
          `You already have the ${armoryUpgrades[ID].upgradeName} upgrade!`,
          statusEl
        );
      } else if (hunter.money < armoryUpgrades[ID].upgradeCost) {
        displayMessage(`You don't have enough money!`, statusEl);
      }
    }
  }
  // Buying a Weapon
  if (action === 'buying') {
    if (
      hunter.money >= armoryWeaponCosts[ID].weaponCost &&
      hunter.weapons.find(({ weaponID }) => weaponID === ID) === undefined
    ) {
      // Add the weapon to the hunter's weapons array
      hunter.weapons.push(armoryWeapons[ID]);
      // Take the hunter's money
      moneyHandling(armoryWeaponCosts[ID].weaponCost, '-');
      // Tell the user they bought the weapon
      displayMessage(
        `You bought the ${armoryWeaponCosts[ID].weaponName}.`,
        statusEl
      );

      // Update the money display element
      moneyEl.innerHTML = `$${hunter.money.toFixed(2)}`;
    } else if (
      hunter.weapons.find(({ weaponID }) => weaponID === ID) !== undefined
    ) {
      displayMessage(
        `You already have the ${armoryWeaponCosts[ID].weaponName}.`,
        statusEl
      );
    } else {
      displayMessage(
        `You can't afford the ${armoryWeaponCosts[ID].weaponName}.`,
        statusEl
      );
    }
  }

  // Do a final money check for the price colors
  armoryPriceColors();
};

const armoryPriceColors = () => {
  armoryPrices.forEach((item) => {
    if (hunter.money < item.price) {
      item.elDef.classList.add('oos');
    } else {
      item.elDef.classList.remove('oos');
    }
  });
};

const goHuntingReload = () => {
  // Reload the hunter's magazine if it's not full
  if (
    hunter.weapons[hunter.currentWeapon].currentMag <
    hunter.weapons[hunter.currentWeapon].weaponMag
  ) {
    // Check how much is in the mag vs max mag capacity
    let reloadAmt =
      hunter.weapons[hunter.currentWeapon].weaponMag -
      hunter.weapons[hunter.currentWeapon].currentMag;

    // Add ammo to the magazine
    hunter.weapons[hunter.currentWeapon].currentMag += reloadAmt;

    // Remove ammo from ammo count
    hunter.weapons[hunter.currentWeapon].weaponAmmo -= reloadAmt;

    saveJSON(hunter, 'TH-HunterData');

    // Update mag and ammo displays

    // If the weapon is fists, show the infinity symbol
    if (hunter.currentWeapon === 0) {
      magEl.innerHTML = '∞';
    }

    // Populate the weapon ammo display
    ammoEl.innerHTML = hunter.weapons[hunter.currentWeapon].weaponAmmo;
  }
};

const devMenu = () => {
  if (hunter.name === 'Developer' && location.href.includes('hunter.html')) {
    const button = document.createElement('button');
    button.textContent = 'Go to Dev Page';
    button.id = 'devbutton';
    button.addEventListener('click', () => {
      location.assign('dev.html');
    });
    hunterMain.appendChild(button);
  } else {
    if (document.getElementById('devbutton')) {
      document.getElementById('devbutton').remove();
    }
  }
};

const talkToHunterFunc = () => {
  let convo = hunterLines[ranBetween(0, 182)];
  alert(convo);
  robHunter.classList = '';
};

const robThisHunter = (hunterFullName) => {
  // First, figure out what weapon the player hunter currently has equipped
  const playerHunterWeapon = hunter.weapons[hunter.currentWeapon].weaponID;
  const playerHunterAmmo = hunter.weapons[hunter.currentWeapon].currentMag;

  // Next, check if the other hunter has a weapon and where their weapon ranks on the list
  const otherHunterWeaponName = otherHunterWeapon;
  let otherHunterWeaponRank;

  // Determine other hunter weapon rank, rank 1 is armed, rank 2 is unarmed
  if (
    otherHunterWeaponName === 'Shotgun' ||
    otherHunterWeaponName === 'Rifle' ||
    otherHunterWeaponName === 'Laser Rifle'
  ) {
    otherHunterWeaponRank = 1;
  } else {
    otherHunterWeaponRank = 2;
  }

  let chance = ranBetween(0, 1);
  let change = ranBetween(3, 27);

  // If the player has no ammo (what an idiot!), there's separate odds/outcomes for that!
  if (playerHunterAmmo === 0) {
    if (otherHunterWeaponRank === 2) {
      if (chance == 0) {
        alert(
          `You aim your weapon at ${hunterFullName} and demand that they hand over all of their ammo and everything else they have on hand. They refuse. You aim at their chest and pull the trigger, BUT YOUR WEAPON IS EMPTY! They laugh, tackle you to the ground and quickly draw a gun on you. Busted.`
        );

        alert(
          `You dropped $${change} on the ground during the kerfuffle. Embarassing.`
        );
        moneyHandling(change, '-');
        location.assign('index.html');
      } else {
        alert(
          `You aim your weapon at ${hunterFullName} and demand that they hand over all of their ammo and everything else they have on hand. They grudgingly comply. You steal $${change} from them.`
        );

        if (otherHunterWeaponName === 'Turkey') {
          alert(
            `To add insult to injury, you also steal the turkey they were carrying...`
          );
          getTurkey();
        }
        moneyHandling(change, '+');
        saveJSON(hunter, 'TH-HunterData');
        location.assign('index.html');
      }
    } else {
      playAudio(hunter.weapons[hunter.currentWeapon].weaponFireSound);
      alert(
        `You aim your weapon at ${hunterFullName} and demand that they hand over all of their ammo and everything else they have on hand. They refuse, firing their weapon at you! Fortunately, they miss! You return fire, wounding them. You disarm them and take the $${change} they have on hand.`
      );
      hunter.money += change;
      saveJSON(hunter, 'TH-HunterData');
      location.assign('index.html');
    }

    return;
  } else {
    if (otherHunterWeaponRank === 1) {
      if (chance == 1) {
        playAudio(hunter.weapons[hunter.currentWeapon].weaponFireSound);
        alert(
          `You aim your weapon at ${hunterFullName} and demand that they hand over all of their ammo and everything else they have on hand. They refuse, firing their weapon at you! Fortunately, they miss! You return fire, wounding them. You disarm them and take the $${change} they have on hand.`
        );
        moneyHandling(change, '+');
        saveJSON(hunter, 'TH-HunterData');
        location.assign('index.html');
      } else {
        alert(
          `You aim your weapon at ${hunterFullName} and demand that they hand over all of their ammo and everything else they have on hand. They refuse, firing their weapon at you! Unfortunately, you have been shot! You run like hell, dropping $${change} on the ground during your cowardly retreat!`
        );
        moneyHandling(change, '-');
        location.assign('index.html');
      }
    } else {
      if (chance == 0) {
        alert(
          `You aim your weapon at ${hunterFullName} and demand that they hand over all of their ammo and everything else they have on hand. They grudgingly comply. You steal $${change} from them.`
        );

        if (otherHunterWeaponName === 'Turkey') {
          alert(
            `To add insult to injury, you also steal the turkey they were carrying...`
          );
          getTurkey();
        }
        moneyHandling(change, '+');
        location.assign('index.html');
      } else {
        playAudio(hunter.weapons[hunter.currentWeapon].weaponFireSound);
        alert(
          `You aim your weapon at ${hunterFullName} and demand that they hand over all of their ammo and everything else they have on hand. They resist, swinging wildly at you! In a panic, you fire at them, wounding them! You manage to steal $${change} from them.`
        );

        if (otherHunterWeaponName === 'Turkey') {
          alert(
            `To add insult to injury, you also steal the turkey they were carrying...`
          );
          getTurkey();
        }
        moneyHandling(change, '+');
        location.assign('index.html');
      }
    }
  }
};

const getTurkey = () => {
  let turkeyStats = {
    weight: ranBetween(18, 26),
    height: ranBetween(38, 48),
  };

  let turkeyRandomizer = ranBetween(1, 5);

  // 1 in 5 chance that the turkey is a prize turkey with a larger size range
  if (turkeyRandomizer === 5) {
    turkeyStats.weight = ranBetween(26, 49);
    turkeyStats.height = ranBetween(49, 60);
  }

  // Add strings to object for storage
  turkeyStats = {
    firstName: turkeyName('first'),
    lastName: turkeyName('last'),
    weightInt: turkeyStats.weight,
    weight: `${turkeyStats.weight} Lbs.`,
    height: `${turkeyStats.height} Inches Tall`,
    uuid: uuidv4(),
    trueTrophy: turkeyRandomizer === 5 ? true : false,
  };

  // Allows for a small chance of monster turkey sizes
  hunter.turkeysBagged.push(turkeyStats);
  hunter.turkeysBaggedCount += 1;
  saveJSON(hunter, 'TH-HunterData');
};

const isThanksgivingWeekend = () => {
  const today = new Date();
  const year = today.getFullYear();

  // Calculate Thanksgiving (4th Thursday of November)
  const novemberFirst = new Date(year, 10, 1); // November is month 10 in JS (0-indexed)
  const dayOfWeek = novemberFirst.getDay(); // Day of the week for Nov 1
  const offset = (11 - dayOfWeek) % 7; // Days to reach the first Thursday
  const thanksgiving = new Date(year, 10, 1 + offset + 21); // Add 3 more weeks (21 days)

  const blackFriday = new Date(thanksgiving);
  blackFriday.setDate(thanksgiving.getDate() + 1);

  const saturday = new Date(thanksgiving);
  saturday.setDate(thanksgiving.getDate() + 2);

  const sunday = new Date(thanksgiving);
  sunday.setDate(thanksgiving.getDate() + 3);

  // Check if today is Thanksgiving, Black Friday, Saturday, or Sunday
  return (
    today.toDateString() === thanksgiving.toDateString() ||
    today.toDateString() === blackFriday.toDateString() ||
    today.toDateString() === saturday.toDateString() ||
    today.toDateString() === sunday.toDateString()
  );
};
