// Define page elements
const huntarea = document.getElementById('huntarea');
const moveArea = document.getElementById('movearea');
const backToLodge = document.getElementById('backtolodge');
const statusArea = document.getElementById('statusarea');
const weaponEl = document.getElementById('weapon');
const magEl = document.getElementById('mag');
const ammoEl = document.getElementById('ammo');
const reloadButton = document.getElementById('reload');
const woodsImage = document.getElementById('woods');
const randomWoods = ranBetween(1, 15);
const titleEl = document.getElementById('title');

// Load hunter data
const hunter = loadHunter();

// Change the area name
titleEl.innerHTML = `Dall Woods - Area ${randomWoods}`;

// Roll to determine if there are even turkeys in this part of the woods
// Turkeys will only appear on rolls of 4 & 5 (turkeyChance>3)
const turkeyChance = ranBetween(1, 5);

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

// Turkey is alive!
const turkey = document.createElement('img');
let turkeyHealth = ranBetween(2, 4);
let winning = 0;
turkey.src = 'assets/images/turkey.png';
turkey.className = 'turkey';
huntarea.appendChild(turkey);
turkey.style.display = 'none';

// Turkey event listener
turkey.addEventListener('click', () => {
  if (bulletTime === 1) {
    return;
  }

  try {
    // Fire weapon
    fireWeapon();

    playAudio(4);

    // If the code arrives at this point, it's a hit
    turkeyHealth -= weaponDamage(hunter.currentWeapon);

    if (turkeyHealth > 0) {
      turkey.style.display = 'none';
      // It's still alive!
      setTimeout(() => {
        // About 20% of the time, play the wounded audio
        // We don't want it happening too much
        if (ranBetween(1, 10) > 8) {
          playAudio(ranBetween(14, 17));
        }
      }, 3000);
    }

    if (turkeyHealth === 0 || turkeyHealth <= 0) {
      huntarea.removeChild(turkey);
      winning = 1;
      setTimeout(() => {
        let turkeyStats = {
          weight: ranBetween(18, 26),
          height: ranBetween(38, 48),
        };

        let turkeyRandomizer = ranBetween(1, 5);

        // If the weight lands on 36 pounds, assign a larger possible range
        if (turkeyRandomizer === 5) {
          turkeyStats.weight = ranBetween(26, 49);
          turkeyStats.height = ranBetween(49, 60);
        }

        // The man will comment here
        turkeyRandomizer === 5
          ? playAudio(ranBetween(25, 27))
          : playAudio(ranBetween(9, 13));

        turkeyRandomizer === 5
          ? alert(
              `The turkey you shot weighed ${turkeyStats.weight} pounds and was ${turkeyStats.height} inches tall! That's a trophy!`
            )
          : alert(
              `The turkey you shot weighed ${turkeyStats.weight} pounds and was ${turkeyStats.height} inches tall!`
            );

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
        location.assign('index.html');
      }, 3000);
    }
  } catch (error) {
    playAudio(4);
  }
});

// Pick a random woods image
woodsImage.src = `assets/images/woods${randomWoods}.png`;

// Set bullet time global variable (used to not allow firing while reloading, etc.)
let bulletTime = 0;

// But let's pick the previously selected weapon
weaponEl.innerHTML = hunter.weapons[hunter.currentWeapon].weaponName;

// Populate the weapon mag field
magEl.innerHTML = hunter.weapons[hunter.currentWeapon].currentMag;

// If the weapon is fists, show the infinity symbol
if (hunter.currentWeapon === 0) {
  magEl.innerHTML = '∞';
}

// Populate the weapon ammo field
ammoEl.innerHTML = hunter.weapons[hunter.currentWeapon].weaponAmmo;

// Assign event listener to the hunting area div
// Basically, if the hunter taps anywhere inside the area, they'll fire their weapon

huntarea.addEventListener('click', () => {
  // Fire weapon
  fireWeapon();
});

// Assign event listener to the reload button
reloadButton.addEventListener('click', () => {
  if (hunter.currentWeapon !== 0) {
    reloadWeapon();
  }
});

// Assign event listener to keyboard. If R key is pressed, also reload.
document.addEventListener('keydown', (event) => {
  if (event.key === 'r') {
    reloadWeapon();
  }
});

// Assign event listener to move to new area button
// So the hunter can resume the hunt
// It's basically just a refresh button.
moveArea.addEventListener('click', () => {
  location.reload();
});

// Assign event listener to return to lodge button
// So the hunter can return to the main page
backToLodge.addEventListener('click', () => {
  location.assign('index.html');
});

// Turkeys show for 600-900 milliseconds, spawning 6 times that often
let timeDiff = ranBetween(600, 900);
let randomFactor = ranBetween(4, 7);
let randomFactor2 = ranBetween(6, 8);

// // Debugging
// console.log(`timeDiff: ${timeDiff}`);
// console.log(`Turkey Will Appear: ${randomFactor} times.`);
// console.log(`Time per Repeat: ${timeDiff * 7}`);
// console.log(`Turkey Total Time This Run: ${timeDiff * 7 * randomFactor}`);

// Based on the turkey chance roll, there will be turkeys about 40% of the time
if (turkeyChance > 3) {
  // Every 3 seconds, show turkey in a random spot inside the div
  let turkeyInterval = setInterval(function () {
    // Show turkey once initial time has clocked
    turkey.style.display = 'block';

    // Define the dimensions of the hunting area div
    let heightToHunt =
      vh(8) + getAbsoluteHeight(title) + getAbsoluteHeight(huntarea) / 6;
    let widthToHunt = vw(2.5) + getAbsoluteHeight(huntarea) / 7.5;

    // Calculate coordinates of the hunting area div relative to screen
    turkey.style.top = `${ranBetween(
      heightToHunt - 25,
      heightToHunt +
        getAbsoluteHeight(huntarea) -
        getAbsoluteHeight(turkey) -
        75
    )}px`;
    turkey.style.left = `${ranBetween(
      widthToHunt - 5,
      widthToHunt +
        getAbsoluteHeight(huntarea) -
        getAbsoluteHeight(turkey) -
        100
    )}px`;

    // Timeout function to hide the turkey
    // It will only show for approximately 600 to 900 milliseconds per apperance
    setTimeout(() => {
      turkey.style.display = 'none';
    }, timeDiff);
  }, timeDiff * randomFactor2);

  // Function to eventually stop turkeys from spawning
  setTimeout(function () {
    clearInterval(turkeyInterval);
    if (winning === 0) {
      alert('The turkey escaped! You should search elsewhere.');
    }
  }, timeDiff * 7 * randomFactor);
}
