const audio = [
  { id: 0, dir: 'assets/audio/bullet_hit.mp3', name: 'hit' },
  { id: 1, dir: 'assets/audio/revolver_shot.mp3', name: 'revshot' },
  { id: 2, dir: 'assets/audio/revolver_reload.mp3', name: 'revreload' },
  { id: 3, dir: 'assets/audio/revolver_empty.mp3', name: 'revempty' },
  { id: 4, dir: 'assets/audio/turkey_taunt.mp3', name: 'turktaunt' },
  { id: 5, dir: 'assets/audio/punch_hit.mp3', name: 'punch hit' },
  { id: 6, dir: 'assets/audio/punch_reload.mp3', name: 'reload a...punch?' },
  { id: 7, dir: 'assets/audio/man_welcome.mp3', name: 'welcome' },
  { id: 8, dir: 'assets/audio/man_hunterintro.mp3', name: 'hunter intro' },
  { id: 9, dir: 'assets/audio/man_great.mp3', name: 'great shot' },
  { id: 10, dir: 'assets/audio/man_wonderful.mp3', name: 'wonderful' },
  { id: 11, dir: 'assets/audio/man_marvelous.mp3', name: 'marvelous' },
  { id: 12, dir: 'assets/audio/man_excellent.mp3', name: 'excellent' },
  { id: 13, dir: 'assets/audio/man_feast.mp3', name: 'feast' },
  { id: 14, dir: 'assets/audio/man_wounded1.mp3', name: 'wounded1' },
  { id: 15, dir: 'assets/audio/man_wounded2.mp3', name: 'wounded2' },
  { id: 16, dir: 'assets/audio/man_wounded3.mp3', name: 'wounded3' },
  { id: 17, dir: 'assets/audio/man_wounded4.mp3', name: 'wounded4' },
];

const audioList = Array();

audio.forEach((sound, index) => {
  audioList[index] = new Audio();
  audioList[index].src = sound.dir;
});

const defaultHunter = {
  name: 'Hunter',
  turkeysBagged: [],
  currentWeapon: 0,
  weapons: [
    {
      weaponName: 'Fists',
      weaponID: 0,
      currentMag: 1,
      weaponDamage: 0,
      weaponMag: 1,
      weaponAmmo: 0,
      weaponFireSound: 5,
      weaponFiringTime: 1,
      weaponReloadSound: 6,
      weaponReloadTime: 5.5,
      weaponEmptySound: 8,
    },
    {
      weaponName: 'Revolver',
      weaponID: 1,
      currentMag: 0,
      weaponDamage: 1,
      weaponMag: 6,
      weaponAmmo: 120,
      weaponFireSound: 1,
      weaponFiringTime: 1,
      weaponReloadSound: 2,
      weaponReloadTime: 3.5,
      weaponEmptySound: 3,
    },
  ],
};
