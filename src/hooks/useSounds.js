const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;

function ensureContext() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// --- Son de TICK pour la roue des joueurs (claquement mécanique style Roue de la Fortune) ---
export function playTickPlayers() {
  ensureContext();
  if (!audioCtx) return;

  const t = audioCtx.currentTime;

  // Claquement sec (bruit blanc très court)
  const bufferSize = audioCtx.sampleRate * 0.03;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 8);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  // Filtre pour rendre le claquement plus "boisé"
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1800;
  filter.Q.value = 2;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.5, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start(t);
  noise.stop(t + 0.03);

  // Petit "toc" tonal en parallèle
  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1200 + Math.random() * 300, t);
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.02);
  oscGain.gain.setValueAtTime(0.15, t);
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
  osc.connect(oscGain);
  oscGain.connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + 0.03);
}

// --- Son de TICK pour la roue des gages (plus grave, plus dramatique) ---
export function playTickGages() {
  ensureContext();
  if (!audioCtx) return;

  const t = audioCtx.currentTime;

  // Claquement plus lourd
  const bufferSize = audioCtx.sampleRate * 0.04;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 6);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 900;
  filter.Q.value = 3;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.6, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start(t);
  noise.stop(t + 0.04);

  // Toc grave
  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(600 + Math.random() * 200, t);
  osc.frequency.exponentialRampToValueAtTime(300, t + 0.03);
  oscGain.gain.setValueAtTime(0.2, t);
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
  osc.connect(oscGain);
  oscGain.connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + 0.04);
}

// --- Son de SPIN (démarrage de la roue - swoosh) ---
export function playSpinSound() {
  ensureContext();
  if (!audioCtx) return;

  const t = audioCtx.currentTime;

  // Swoosh avec bruit filtré
  const bufferSize = audioCtx.sampleRate * 0.5;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(300, t);
  filter.frequency.exponentialRampToValueAtTime(2000, t + 0.3);
  filter.frequency.exponentialRampToValueAtTime(500, t + 0.5);
  filter.Q.value = 1;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start(t);
  noise.stop(t + 0.5);
}

// --- Son quand un JOUEUR est sélectionné (fanfare joyeuse) ---
export function playPlayerSelectedSound() {
  ensureContext();
  if (!audioCtx) return;

  const t = audioCtx.currentTime;
  const notes = [523, 659, 784, 1047];

  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t + i * 0.1);
    gain.gain.linearRampToValueAtTime(0.15, t + i * 0.1 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.1 + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t + i * 0.1);
    osc.stop(t + i * 0.1 + 0.15);

    // Harmonique
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, t);
    gain2.gain.setValueAtTime(0, t + i * 0.1);
    gain2.gain.linearRampToValueAtTime(0.06, t + i * 0.1 + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + i * 0.1 + 0.12);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(t + i * 0.1);
    osc2.stop(t + i * 0.1 + 0.15);
  });
}

// --- Sons quand un GAGE est révélé (4 variations, 1 choisie aléatoirement) ---
const gageRevealVariations = [
  // Variation 1: Descente dramatique
  function () {
    const t = audioCtx.currentTime;
    const notes = [784, 698, 523, 392];
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + i * 0.15);
      gain.gain.setValueAtTime(0.12, t + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.15 + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t + i * 0.15);
      osc.stop(t + i * 0.15 + 0.2);
    });
  },
  // Variation 2: "Dun dun DUNNN"
  function () {
    const t = audioCtx.currentTime;
    const notes = [
      { freq: 220, time: 0, dur: 0.2 },
      { freq: 220, time: 0.25, dur: 0.2 },
      { freq: 165, time: 0.5, dur: 0.6 },
    ];
    notes.forEach(({ freq, time, dur }) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + time);
      gain.gain.setValueAtTime(0.18, t + time);
      gain.gain.setValueAtTime(0.18, t + time + dur * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.01, t + time + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t + time);
      osc.stop(t + time + dur);

      // Sub bass pour le punch
      const sub = audioCtx.createOscillator();
      const subGain = audioCtx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(freq / 2, t + time);
      subGain.gain.setValueAtTime(0.15, t + time);
      subGain.gain.exponentialRampToValueAtTime(0.01, t + time + dur);
      sub.connect(subGain);
      subGain.connect(audioCtx.destination);
      sub.start(t + time);
      sub.stop(t + time + dur);
    });
  },
  // Variation 3: Alarme comique
  function () {
    const t = audioCtx.currentTime;
    for (let i = 0; i < 6; i++) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(i % 2 === 0 ? 600 : 800, t + i * 0.08);
      gain.gain.setValueAtTime(0.12, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.08 + 0.07);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.08);
    }
    // Note finale longue
    const final = audioCtx.createOscillator();
    const finalGain = audioCtx.createGain();
    final.type = 'sawtooth';
    final.frequency.setValueAtTime(400, t + 0.5);
    final.frequency.exponentialRampToValueAtTime(200, t + 1);
    finalGain.gain.setValueAtTime(0.15, t + 0.5);
    finalGain.gain.exponentialRampToValueAtTime(0.01, t + 1);
    final.connect(finalGain);
    finalGain.connect(audioCtx.destination);
    final.start(t + 0.5);
    final.stop(t + 1);
  },
  // Variation 4: Sad trombone (wah wah wah wahhh)
  function () {
    const t = audioCtx.currentTime;
    const notes = [392, 370, 349, 261];
    const durations = [0.3, 0.3, 0.3, 0.8];
    let time = 0;
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + time);
      if (i === notes.length - 1) {
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.setValueAtTime(5, t + time);
        lfoGain.gain.setValueAtTime(15, t + time);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(t + time);
        lfo.stop(t + time + durations[i]);
      }
      gain.gain.setValueAtTime(0.2, t + time);
      gain.gain.exponentialRampToValueAtTime(0.01, t + time + durations[i]);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t + time);
      osc.stop(t + time + durations[i]);
      time += durations[i] + 0.05;
    });
  },
];

export function playGageRevealSound() {
  ensureContext();
  if (!audioCtx) return;
  const variation = gageRevealVariations[Math.floor(Math.random() * gageRevealVariations.length)];
  variation();
}
