const audio = [
  { id: 0, dir: 'assets/audio/sword_hit.mp3' },
  { id: 1, dir: 'assets/audio/sword_miss.mp3' },
];

const audioList = Array();

audio.forEach((sound, index) => {
  audioList[index] = new Audio();
  audioList[index].src = sound.dir;
});
