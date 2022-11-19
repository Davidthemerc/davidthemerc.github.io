const heroName = document.getElementById('heroname');
const heroMaxHP = document.getElementById('heromaxhp');
const heroCurrHP = document.getElementById('herocurrhp');
const heroGold = document.getElementById('herogold');
const heroAttackLevel = document.getElementById('heroattack');
const heroStrengthLevel = document.getElementById('herostrength');
const heroDefenseLevel = document.getElementById('herodefense');
const heroBack = document.getElementById('heroback');
const statusEl = document.getElementById('status');

// Load Hero
hero = loadHero();
saveJSON(hero, 'SS-heroData');

// Display Hero data in relevant fields
heroName.value = hero.name;
heroMaxHP.value = hero.maxHitpoints;
heroCurrHP.value = hero.hitpoints;
heroGold.value = hero.gold;
heroAttackLevel.value = hero.attackLevel;
heroStrengthLevel.value = hero.strengthLevel;
heroDefenseLevel.value = hero.defenseLevel;

// Add event listener to Hero name field (to allow for changing the hero's name)
heroName.addEventListener('input', (e) => {
  hero.name = e.target.value;
  displayMessage(`Hero Name changed to: ${e.target.value}`, statusEl, 0);
  saveJSON(hero, 'SS-heroData');
});

// Add event listener to Hero name field (to allow for changing the hero's name)
heroMaxHP.addEventListener('input', (e) => {
  hero.maxHitpoints = parseInt(e.target.value);
  displayMessage(
    `Hero Max Hitpoints changed to: ${e.target.value}`,
    statusEl,
    0
  );
  saveJSON(hero, 'SS-heroData');
});

// Add event listener to Hero name field (to allow for changing the hero's name)
heroCurrHP.addEventListener('input', (e) => {
  hero.hitpoints = parseInt(e.target.value);
  displayMessage(`Hero Hipoints changed to: ${e.target.value}`, statusEl, 0);
  saveJSON(hero, 'SS-heroData');
});

// Add event listener to Hero attack level field (to allow for changing the hero's attack level)
heroAttackLevel.addEventListener('input', (e) => {
  hero.attackLevel = parseInt(e.target.value);
  displayMessage(
    `Hero Attack Level changed to: ${e.target.value}`,
    statusEl,
    0
  );
  saveJSON(hero, 'SS-heroData');
});

// Add event listener to Hero strength level field (to allow for changing the hero's strength level)
heroStrengthLevel.addEventListener('input', (e) => {
  hero.strengthLevel = parseInt(e.target.value);
  displayMessage(
    `Hero Strength Level changed to: ${e.target.value}`,
    statusEl,
    0
  );
  saveJSON(hero, 'SS-heroData');
});

// Add event listener to Hero attack level field (to allow for changing the hero's attack level)
heroDefenseLevel.addEventListener('input', (e) => {
  hero.defenseLevel = parseInt(e.target.value);
  displayMessage(
    `Hero Defense Level changed to: ${e.target.value}`,
    statusEl,
    0
  );
  saveJSON(hero, 'SS-heroData');
});

// Add event listener to Hero gold field (to allow for changing the hero's gold)
heroGold.addEventListener('input', (e) => {
  hero.gold = parseInt(e.target.value);
  displayMessage(`Hero gold changed to: ${e.target.value}`, statusEl, 0);
  saveJSON(hero, 'SS-heroData');
});

// Add event listener to back button
heroBack.addEventListener('click', () => {
  history.back();
});
