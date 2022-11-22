// Define page elements
const huntarea = document.getElementById('huntarea');
const backToLodge = document.getElementById('backtolodge');
const statusArea = document.getElementById('statusarea');
const weaponEl = document.getElementById('weapon');
const magEl = document.getElementById('mag');
const ammoEl = document.getElementById('ammo');
const reloadButton = document.getElementById('reload');
const woodsImage = document.getElementById('woods');

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
        turkeyRandomizer === 5 ? playAudio(13) : playAudio(ranBetween(9, 12));

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
        saveJSON(hunter, 'TH-HunterData');
        location.assign('index.html');
      }, 3000);
    }
  } catch (error) {
    playAudio(4);
  }
});

// Pick a random woods image
woodsImage.src = `assets/images/woods${ranBetween(1, 15)}.png`;

// Load hunter data
const hunter = loadHunter();

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
  reloadWeapon();
});

// Assign event listener to keyboard. If R key is pressed, also reload.
document.addEventListener('keydown', (event) => {
  if (event.key === 'r') {
    reloadWeapon();
  }
});

// Assign event listener to return to lodge button
// So the user can return to the main page
backToLodge.addEventListener('click', () => {
  location.assign('index.html');
});

// Turkeys show for 600-900 milliseconds, spawning 6 times that often
let timeDiff = ranBetween(600, 900);

let turkeyInterval = setInterval(function () {
  turkey.style.display = 'block';
  //  Do whatever in here that happens every 3 seconds
  // Every 3 seconds, show turkey in a random spot inside the div

  // Div heights (temporary, move to turkey function)
  let heightToHunt =
    vh(8) + getAbsoluteHeight(title) + getAbsoluteHeight(huntarea) / 6;
  let widthToHunt = vw(2.5) + getAbsoluteHeight(huntarea) / 7.5;

  // Calculate coordinates of the hunting area div relative to screen
  turkey.style.top = `${ranBetween(
    heightToHunt - 25,
    heightToHunt + getAbsoluteHeight(huntarea) - getAbsoluteHeight(turkey) - 75
  )}px`;
  turkey.style.left = `${ranBetween(
    widthToHunt - 5,
    widthToHunt + getAbsoluteHeight(huntarea) - getAbsoluteHeight(turkey) - 100
  )}px`;

  setTimeout(() => {
    turkey.style.display = 'none';
  }, timeDiff);
}, timeDiff * 6);

// Function to eventually stop turkeys from spawning
setTimeout(function () {
  clearInterval(turkeyInterval);
  if (winning === 0) {
    alert('The turkey escaped!');
    location.assign('index.html');
  }
}, 16000);
