const heroName = document.getElementById('heroname');
const heroGold = document.getElementById('herogold');
const heroAttackLevel = document.getElementById('heroattack');
const heroStrengthLevel = document.getElementById('herostrength');
const heroBack = document.getElementById('heroback');

// Load Hero
hero = loadHero();
saveJSON(hero, 'DOF-heroData');

// Display Hero data in relevant fields
heroName.value = hero.heroName;
heroGold.value = hero.gold;
heroAttackLevel.value = hero.attackLevel;
heroStrengthLevel.value = hero.strengthLevel;

// Add event listener to Hero name field (to allow for changing the hero's name)
heroName.addEventListener('input', (e) => {
  hero.heroName = e.target.value;
  saveJSON(hero, 'DOF-heroData');
});

// Add event listener to back button
heroBack.addEventListener('click', () => {
  history.back();
});
