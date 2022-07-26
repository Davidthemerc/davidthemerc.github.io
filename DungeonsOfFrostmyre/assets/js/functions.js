// Random number function
// Accepts minimum and maximum number as parameters
const ranBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Function to load/initialize hero data
const loadHero = () => {
  const saveJSON = localStorage.getItem('DOF-heroData');

  // If there's saved data, pull it from localstorage
  if (saveJSON !== null) {
    return JSON.parse(saveJSON);
  }
  // If there isn't saved data, or if it is null, initialize new data
  else
    return {
      heroName: 'Lardor',
      hitpoints: 25,
      weapons: [{ weaponName: 'Iron Dagger', attackBonus: 1 }],
    };
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
      weapons: [{ weaponName: 'Iron Dagger', attackBonus: 1 }],
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

const heroAttack = (weaponName, weapon) => {
  let damageAmount = ranBetween(0, weapon.attackBonus);
  // If damage is above 0, then play Sword Hit sound
  damageAmount > 0 ? audioList[0].play() : audioList[1].play();
  damage(damageAmount, enemy);

  // The enemy is dead
  if (enemy.hitpoints <= 0) {
    displayMessage(
      `<b>${hero.heroName}</b> has defeated <b>${enemy.enemyName}</b>!`,
      statusEl
    );
localStorage.key(`DOF-enemyData`)=null
    enemy = enemyGeneration();
    saveJSON(enemy, 'DOF-enemyData');
    return;
  }

  saveJSON(enemy, 'DOF-enemyData');
  damageAmount > 0
    ? displayMessage(
        `<b>${hero.heroName}</b> has attacked <b>${enemy.enemyName}</b> with their ${weaponName} for ${damageAmount}.`,
        statusEl
      )
    : displayMessage(`<b>${hero.heroName}</b> missed!`, statusEl);
};

const damage = (damage, entity) => {
  entity.hitpoints -= damage;
  if (entity === enemy) {
    enemyHPdisplay.innerHTML = entity.hitpoints;
  }
};
