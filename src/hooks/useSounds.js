const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;

function playTone(freq, duration, type = 'sine', volume = 0.3) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// Son de tick pendant la rotation (court bip cartoon)
export function playTick() {
  playTone(800 + Math.random() * 400, 0.05, 'square', 0.15);
}

// Son de victoire goofy - série de notes montantes cartoon
export function playWinSound() {
  if (!audioCtx) return;
  const notes = [523, 659, 784, 1047, 784, 1047, 1319];
  notes.forEach((freq, i) => {
    setTimeout(() => {
      playTone(freq, 0.15, 'square', 0.2);
      // Ajouter un petit "boing" en parallèle
      setTimeout(() => playTone(freq * 1.5, 0.08, 'triangle', 0.1), 30);
    }, i * 100);
  });
}

// Son de spin start - swoosh montant
export function playSpinSound() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.4);

  // Petit "boing" cartoon
  setTimeout(() => playTone(600, 0.1, 'triangle', 0.2), 150);
}

// Son de "sad trombone" pour les perdants - wah wah wah wahhh
export function playLoserSound() {
  if (!audioCtx) return;
  const notes = [392, 370, 349, 261];
  const durations = [0.3, 0.3, 0.3, 0.8];
  let time = 0;
  notes.forEach((freq, i) => {
    setTimeout(() => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      // Vibrato sur la dernière note
      if (i === notes.length - 1) {
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.setValueAtTime(5, audioCtx.currentTime);
        lfoGain.gain.setValueAtTime(15, audioCtx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();
        lfo.stop(audioCtx.currentTime + durations[i]);
      }
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + durations[i]);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + durations[i]);
    }, time * 1000);
    time += durations[i] + 0.05;
  });
}
