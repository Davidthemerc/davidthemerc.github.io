const audio = [
  { id: 0, dir: 'assets/audio/sword_hit.mp3' },
  { id: 1, dir: 'assets/audio/sword_miss.mp3' },
  { id: 2, dir: 'assets/audio/coins.mp3' },
  { id: 3, dir: 'assets/audio/StopStop.mp3' },
];

const audioList = Array();

audio.forEach((sound, index) => {
  audioList[index] = new Audio();
  audioList[index].src = sound.dir;
});

const defaultHero = {
  heroName: 'Lardor',
  hitpoints: 25,
  hitpointsMax: 25,
  attackLevel: 10,
  strengthLevel: 10,
  gold: 100,
  weapons: [{ weaponName: 'Iron Dagger', weaponStrength: 1 }],
};
