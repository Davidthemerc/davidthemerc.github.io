const heroName = document.getElementById('heroname');
const heroBack = document.getElementById('heroback');
loadHero();
saveJSON(hero, 'DOF-heroData');
heroName.value = hero.heroName;

heroName.addEventListener('input', (e) => {
  hero.heroName = e.target.value;
  saveJSON(hero, 'DOF-heroData');
});

heroBack.addEventListener('click', () => {
  history.back();
});
