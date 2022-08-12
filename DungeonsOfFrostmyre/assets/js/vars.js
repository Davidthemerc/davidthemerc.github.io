const audio = [
  { id: 0, dir: 'assets/audio/sword_hit.mp3', name: 'hit' },
  { id: 1, dir: 'assets/audio/sword_miss.mp3', name: 'miss' },
  { id: 2, dir: 'assets/audio/coins.mp3', name: 'coins' },
  { id: 3, dir: 'assets/audio/stopstop.mp3', name: 'stopstop' },
  { id: 4, dir: 'assets/audio/victory.mp3', name: 'victory' },
  { id: 5, dir: 'assets/audio/defeat.mp3', name: 'defeat' },
];

const audioList = Array();

audio.forEach((sound, index) => {
  audioList[index] = new Audio();
  audioList[index].src = sound.dir;
});

const defaultHero = {
  name: 'Lardor',
  hitpoints: 25,
  maxHitpoints: 25,
  attackLevel: 10,
  strengthLevel: 10,
  defenseLevel: 10,
  gold: 100,
  weapons: [{ weaponName: 'Iron Dagger', weaponStrength: 1 }],
};
