const mainBuzzer = document.getElementById('mainbuzzer');
const mainBuzzer2 = document.getElementById('mainbuzzer2');
const warnBuzzer = document.getElementById('warnbuzzer');
let audioContext = new (window.AudioContext || window.webkitAudioContext)();

const warnBuzzerSound = new Audio('audio/warnbuzzer.mp3');

mainBuzzer.addEventListener('mousedown', () => {
  let oscillator = audioContext.createOscillator();
  let gainNode = audioContext.createGain();

  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(361, audioContext.currentTime);

  // Create LFO for amplitude modulation
  let lfo = audioContext.createOscillator();
  lfo.type = 'sine'; // A sine wave for smooth pulsing
  lfo.frequency.setValueAtTime(568, audioContext.currentTime); // 5 Hz pulsing rate (adjust to your liking)

  let lfoGain = audioContext.createGain();
  lfoGain.gain.setValueAtTime(0.3, audioContext.currentTime); // Depth of the modulation. Adjust for stronger/weaker pulsing.

  // Routing: Connect the LFO through its gain to the main gainNode
  lfo.connect(lfoGain);
  lfoGain.connect(gainNode.gain);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // This is the center value around which the LFO will pulse

  oscillator.start();
  lfo.start();

  mainBuzzer.addEventListener('mouseup', () => {
    oscillator.stop();
    lfo.stop();
  });
});

mainBuzzer.addEventListener('touchstart', () => {
  let oscillator = audioContext.createOscillator();
  let gainNode = audioContext.createGain();

  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(361, audioContext.currentTime);

  // Create LFO for amplitude modulation
  let lfo = audioContext.createOscillator();
  lfo.type = 'sine'; // A sine wave for smooth pulsing
  lfo.frequency.setValueAtTime(568, audioContext.currentTime); // 5 Hz pulsing rate (adjust to your liking)

  let lfoGain = audioContext.createGain();
  lfoGain.gain.setValueAtTime(0.3, audioContext.currentTime); // Depth of the modulation. Adjust for stronger/weaker pulsing.

  // Routing: Connect the LFO through its gain to the main gainNode
  lfo.connect(lfoGain);
  lfoGain.connect(gainNode.gain);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  gainNode.gain.setValueAtTime(0.25, audioContext.currentTime); // This is the center value around which the LFO will pulse

  oscillator.start();
  lfo.start();

  mainBuzzer.addEventListener('touchend', () => {
    oscillator.stop();
    lfo.stop();
  });
});

warnBuzzer.addEventListener('click', () => {
  warnBuzzerSound.play();
});
