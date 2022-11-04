// Hero Page Items
const combatname = document.getElementById('combatname');
const heroHPdisplay = document.getElementById('herohpdisplay');
const heroWeapon = document.getElementById('heroweapon');
const heroItems = document.getElementById('heroitems');
const attackButton = document.getElementById('attackbutton');
const retreatButton = document.getElementById('retreatbutton');
const heroCombatButtons = document.getElementById('herocombatbuttons');
let attackStatus = 0;

// Load Hero
hero = loadHero();
saveJSON(hero, 'DOF-heroData');

// Load Enemy
let enemy = enemyGeneration();
saveJSON(enemy, 'DOF-enemyData');

// Enemy Page Items
const enemyName = document.getElementById('enemyname');
const enemyHPdisplay = document.getElementById('enemyhpdisplay');
const enemyCombatButtons = document.getElementById('enemycombatbuttons');
const enemyPortrait = document.getElementById('enemyimage');

// Message Element
const statusEl = document.getElementById('status');

// Set the Hero's Name to match the stored name
combatheroname.innerHTML = hero.name;
heroHPdisplay.innerHTML = hero.hitpoints;

// Set the Enemy's Name and image to match the stored values
enemyName.innerHTML = enemy.name;
enemyHPdisplay.innerHTML = enemy.hitpoints;
enemyPortrait.src = enemy.imgSrc;

// Populate the Hero's Weapon List
hero.weapons.forEach((weapon, index) => {
  const opt = document.createElement('option');
  opt.value = index;
  opt.innerHTML = `${weapon.weaponName}`;
  heroWeapon.appendChild(opt);
});

// Hero Attack Button is Clicked
attackButton.addEventListener('click', () => {
  if (attackStatus === 1) {
    return;
  }

  // Change attack status to 1 to indicate an ongoing combat roll
  attackStatus = 1;

  // Change button to red to indicate an active attack
  attackButton.className += ' btnred';

  heroAttack(
    hero.weapons[heroWeapon.value].weaponName,
    hero.weapons[heroWeapon.value]
  );
  // Wait two seconds then show enemy attack, if they are alive
  if (enemy.hitpoints > 0) {
    setTimeout(() => {
      enemyAttack(enemy, enemy.weapons[0], enemy.weapons[0].weaponName);
    }, 2000);
  }

  // Change attackStatus to 0 and button color to normal after 5 seconds,
  // to not allow for spam attacks that can overwhelm the attack system
  setTimeout(() => {
    attackStatus = 0;
    attackButton.className = 'btn btn-secondary';
  }, 4000);
});

// Hero Retreat Button is Clicked
retreatButton.addEventListener('click', () => {
  heroRetreat();
});
