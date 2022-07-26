// Hero Page Items
const combatHeroName = document.getElementById('combatheroname');
const heroHPdisplay = document.getElementById('herohpdisplay');
const heroWeapon = document.getElementById('heroweapon');
const heroItems = document.getElementById('heroitems');
const attackButton = document.getElementById('attackbutton');
const retreatButton = document.getElementById('retreatbutton');
const heroCombatButtons = document.getElementById('herocombatbuttons');

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

// Message Element
const statusEl = document.getElementById('status');

// Set the Hero's Name to match the stored name
combatHeroName.innerHTML = hero.heroName;
heroHPdisplay.innerHTML = hero.hitpoints;

// Set the Enemy's Name to match the stored name
enemyName.innerHTML = enemy.enemyName;
enemyHPdisplay.innerHTML = enemy.hitpoints;

// Populate the Hero's Weapon List
hero.weapons.forEach((weapon, index) => {
  const opt = document.createElement('option');
  opt.value = index;
  opt.innerHTML = `${weapon.weaponName}`;
  heroWeapon.appendChild(opt);
});

// Hero Attack Button is Clicked
attackButton.addEventListener('click', () => {
  heroAttack(
    hero.weapons[heroWeapon.value].weaponName,
    hero.weapons[heroWeapon.value]
  );
  // Wait two seconds then show enemy attack
  // If they are alive
  if (enemy.hitpoints > 0) {
    setTimeout(() => {
      enemyAttack(enemy, enemy.weapons[0], enemy.weapons[0].weaponName);
    }, 2000);
  }
});

// Hero Retreat Button is Clicked
retreatButton.addEventListener('click', () => {
  heroRetreat();
});
