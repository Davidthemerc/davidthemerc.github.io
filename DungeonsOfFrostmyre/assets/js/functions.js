// Random number function
// Accepts minimum and maximum number as parameters
const ranBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const playAudio = (audioIndex) => {
  audioList[audioIndex].play();
};

// Function to load/initialize hero data
const loadHero = () => {
  const saveJSON = localStorage.getItem('DOF-heroData');

  // If there's saved data, pull it from localstorage
  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  }
  // If there isn't saved data, or if it is null, initialize new data
  else return defaultHero;
};

const enemyGeneration = () => {
  const saveJSON = localStorage.getItem('DOF-enemyData');

  // If there's saved data, pull it from localstorage
  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  }
  // If there isn't saved data, or if it is null, initialize new data
  else
    return {
      enemyName: 'Highwayman',
      hitpoints: 20,
      attackLevel: 10,
      strengthLevel: 10,
      weapons: [{ weaponName: 'Iron Dagger', weaponStrength: 1 }],
    };
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
const displayMessage = (message, messageEl) => {
  messageEl.innerHTML = message;
};

// Function to calculate hero attack damage and handle response
const heroAttack = (weaponName, weapon) => {
  // If the enemy is dead already, don't let this function run
  if (enemy.hitpoints <= 0) {
    displayMessage(`${hero.heroName}, stop, stop he's already dead!`, statusEl);
    playAudio(3);
    return;
  }

  // Combat damage formula
  let hit = ranBetween(0, 25 + hero.attackLevel);
  console.log(`${hero.heroName}'s hit roll was ${hit}.`);
  let damageAmount;
  hit > 25 * 0.67
    ? (damageAmount = ranBetween(
        1,
        hero.strengthLevel / 2 + weapon.weaponStrength
      ))
    : (damageAmount = 0);

  // If damage is above 0, then play Sword Hit sound, else, play Sword Miss sound
  // I had a thought here. This should play different attack sounds based on the type of weapon used.
  // Dagger = Dagger Miss, Dagger Hit Flesh Sounds
  // Sword = Sword Miss, Sword Hit Flesh Sounds
  // Bow = Arrow Flying in Air (Missed), Arrow Hit Flesh Sounds
  // Et cetera et cetera. We can play different sounds by passing in the "sound ID" of the equipped weapon
  // to the playAudio function, no problem!
  damageAmount > 0 ? playAudio(0) : playAudio(1);
  damage(damageAmount, enemy);

  // The enemy is dead
  if (enemy.hitpoints <= 0) {
    // They are dead
    enemy.hitpoints = 0;
    enemyHPdisplay.innerHTML = enemy.hitpoints;
    // Display victory message
    displayMessage(
      `<b>${hero.heroName}</b> has defeated <b>${enemy.enemyName}</b>!`,
      statusEl
    );

    // Add '[Dead]' to Enemy Name for laughs
    enemyName.innerHTML += ' [Dead]';

    // Add loot button
    const lootbutton = document.createElement('button');
    lootbutton.textContent = 'Loot Fallen Enemy';
    lootbutton.id = 'lootbutton';
    lootbutton.addEventListener('click', () => {
      lootEnemy(enemy);
    });
    enemyCombatButtons.appendChild(lootbutton);

    // Remove enemy from storage
    localStorage.removeItem('DOF-enemyData');
    return;
  }

  saveJSON(enemy, 'DOF-enemyData');
  damageAmount > 0
    ? displayMessage(
        `<b>${hero.heroName}</b> has attacked <b>${enemy.enemyName}</b> with their ${weaponName} for ${damageAmount} damage!`,
        statusEl
      )
    : displayMessage(`<b>${hero.heroName}</b> missed!`, statusEl);
};

// Function for the hero to retreat
const heroRetreat = () => {
  let chance = ranBetween(0, 2);
  if (chance > 0) {
    // Successful Retreat
    displayMessage(`You have successfully retreated...`, statusEl);

    // Remove enemy from storage, you coward
    localStorage.removeItem('DOF-enemyData');

    // Return to Page
    setTimeout(() => {
      location.assign('adventure.html');
    }, 2000);
  } else {
    // Failed Retreat! The enemy attacks you again, you coward!
    displayMessage(
      `You were unable to retreat! ${enemy.enemyName} attacks again!`,
      statusEl
    );
    setTimeout(() => {
      enemyAttack(enemy);
    }, 2000);
  }
};

// Function to handle enemy attacks
const enemyAttack = (enemy, weapon, weaponName) => {
  // Combat damage formula
  let hit = ranBetween(0, 25 + enemy.attackLevel);
  console.log(`${enemy.enemyName}'s hit roll was ${hit}.`);
  let damageAmount;
  hit > 25 * 0.67
    ? (damageAmount = ranBetween(
        1,
        enemy.strengthLevel / 2 + weapon.weaponStrength
      ))
    : (damageAmount = 0);

  // If damage is above 0, then play Sword Hit sound, else, play Sword Miss sound
  damageAmount > 0 ? playAudio(0) : playAudio(1);
  damage(damageAmount, hero);

  // The hero is dead
  if (hero.hitpoints <= 0) {
    // The hero is dead
    hero.hitpoints = 0;
    heroHPdisplay.innerHTML = hero.hitpoints;
    // Display damage message, then defeat message
    displayMessage(
      `<b>${enemy.enemyName}</b> has attacked <b>${hero.heroName}</b> with their ${weaponName} for ${damageAmount} damage!`,
      statusEl
    );

    // Restore Hero HP to normal after death, but remove some coins
    hero.hitpoints = hero.hitpointsMax;
    let coinAmount = ranBetween(
      1,
      (enemy.attackLevel + enemy.strengthLevel) * ranBetween(3, 10)
    );
    coinChange(coinAmount, '-');
    saveJSON(hero, 'DOF-heroData');

    setTimeout(() => {
      displayMessage(
        `<b>${hero.heroName}</b> has been defeated by <b>${enemy.enemyName}</b>, losing ${coinAmount} coins...`,
        statusEl
      );
    }, 2000);

    // Return to Page
    setTimeout(() => {
      location.assign('adventure.html');
    }, 3500);

    // Remove enemy from storage
    localStorage.removeItem('DOF-enemyData');
    return;
  }

  saveJSON(hero, 'DOF-heroData');
  damageAmount > 0
    ? displayMessage(
        `<b>${enemy.enemyName}</b> has attacked <b>${hero.heroName}</b> with their ${weaponName} for ${damageAmount} damage!`,
        statusEl
      )
    : displayMessage(`<b>${enemy.enemyName}</b> missed!`, statusEl);
};

// Function to inflict damage
const damage = (damage, entity) => {
  entity.hitpoints -= damage;
  if (entity === enemy) {
    enemyHPdisplay.innerHTML = entity.hitpoints;
  } else {
    heroHPdisplay.innerHTML = entity.hitpoints;
  }
};

// Function to add/remove coins
const coinChange = (amount, action) => {
  action = '-' ? (hero.gold -= amount) : (hero.gold += amount);
  if (hero.gold < 0) {
    hero.gold = 0;
  }
  saveJSON(hero, 'DOF-heroData');
};

// Function for when loot button is clicked on a defeated enemy
const lootEnemy = (enemy) => {
  // Remove loot button immediately to prevent abuse
  lootbutton.remove();
  // Enemy's combat levels added together * random between 3 and 10
  let coinAmount = ranBetween(
    1,
    (enemy.attackLevel + enemy.strengthLevel) * ranBetween(3, 10)
  );
  coinChange(coinAmount, '+');
  // Play coin sound
  playAudio(2);
  // Display coins collected message
  displayMessage(
    `<b>${hero.heroName}</b> collected ${coinAmount} gold coins.`,
    statusEl
  );
  setTimeout(() => {
    location.assign('adventure.html');
  }, 2000);
};
