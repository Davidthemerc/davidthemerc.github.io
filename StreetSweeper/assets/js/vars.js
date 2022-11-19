const audio = [
  { id: 0, dir: 'assets/audio/sword_hit.mp3', name: 'hit' },
  { id: 1, dir: 'assets/audio/sword_miss.mp3', name: 'miss' },
  { id: 2, dir: 'assets/audio/coins.mp3', name: 'coins' },
  { id: 3, dir: 'assets/audio/stopstop.mp3', name: 'stopstop' },
  { id: 4, dir: 'assets/audio/victory.mp3', name: 'victory' },
  { id: 5, dir: 'assets/audio/defeat.mp3', name: 'defeat' },
  { id: 6, dir: 'assets/audio/9mm.mp3', name: '9mm-shot' },
  { id: 7, dir: 'assets/audio/bullet_miss.mp3', name: 'bullet-miss' },
  { id: 8, dir: 'assets/audio/punch_hit.mp3', name: 'punch-hit' },
  { id: 9, dir: 'assets/audio/punch_miss.mp3', name: 'punch-miss' },
];

const audioList = Array();

audio.forEach((sound, index) => {
  audioList[index] = new Audio();
  audioList[index].src = sound.dir;
});

const defaultHero = {
  name: 'Tomas',
  hitpoints: 25,
  maxHitpoints: 25,
  attackLevel: 25,
  strengthLevel: 25,
  defenseLevel: 25,
  gold: 100,
  weapons: [
    {
      weaponName: '9mm Pistol',
      weaponStrength: 35,
      weaponHitSound: 6,
      weaponMissSound: 7,
    },
  ],
};
