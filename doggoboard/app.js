const doggoSounds = [
  { id: 0, dir: 'sounds/0.mp3', desc: 'Camelia' },
  { id: 1, dir: 'sounds/1.mp3', desc: 'Lucero' },
  { id: 2, dir: 'sounds/2.mp3', desc: 'Camelia, no hay, se acabo!' },
  { id: 3, dir: 'sounds/3.mp3', desc: 'Lucero, no hay, se acabo!' },
  { id: 4, dir: 'sounds/4.mp3', desc: 'Andale Andale Andale!' },
  { id: 5, dir: 'sounds/5.mp3', desc: 'Pa fuera?' },
  { id: 6, dir: 'sounds/6.mp3', desc: 'Vamanos' },
  { id: 7, dir: 'sounds/7.mp3', desc: 'No te creas!' },
  { id: 8, dir: 'sounds/8.mp3', desc: 'Vamanos a nadar!' },
  { id: 9, dir: 'sounds/9.mp3', desc: 'Pulgas!' },
  { id: 10, dir: 'sounds/10.mp3', desc: 'No te voy a dar!' },
  { id: 11, dir: 'sounds/11.mp3', desc: 'Quitate de Aqui!' },
  { id: 12, dir: 'sounds/12.mp3', desc: 'Quien se meo?' },
  { id: 13, dir: 'sounds/13.mp3', desc: 'Quien se cago?' },
  { id: 14, dir: 'sounds/14.mp3', desc: 'Ataque Camelia!' },
  { id: 15, dir: 'sounds/15.mp3', desc: 'Ataque Lucero!' },
  { id: 16, dir: 'sounds/16.mp3', desc: 'Subete!' },
  { id: 17, dir: 'sounds/17.mp3', desc: 'Vamanos a caminar!' },
  { id: 18, dir: 'sounds/18.mp3', desc: 'No te creas ella!' },
];

const soundList = Array();
const buttonList = Array();
const statusEl = document.getElementById('status');

doggoSounds.forEach((sound, index) => {
  soundList[index] = new Audio();
  soundList[index].src = sound.dir;
  buttonList[index] = document.getElementById(`${index}`);
  buttonList[index].addEventListener('click', () => {
    soundList[index].play();
    statusEl.innerHTML = `Now Playing: ${sound.desc}`;
    setTimeout(() => {
      statusEl.innerHTML = 'Now Playing: Nothing';
    }, soundList[index].duration * 1000);
  });
});
