// WebAudio-val generalt effektek. Nincs hangfajl, nincs letoltes.

let ctx = null;
let master = null;
let fireGain = null;
let noiseBuf = null;
let enabled = true;

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) { enabled = false; return; }
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);

  const len = ctx.sampleRate * 2;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

  // folyamatos tuz-moraj, a hangereje a tuz kozelsegevel valtozik
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 420;
  fireGain = ctx.createGain();
  fireGain.gain.value = 0;
  src.connect(lp).connect(fireGain).connect(master);
  src.start();

  startMusic();
}

export function toggleMute() {
  if (!master) return enabled;
  enabled = !enabled;
  master.gain.value = enabled ? 0.5 : 0;
  return enabled;
}

export function isMuted() {
  return !enabled;
}

/** Szunetben a zene is alljon meg, ne csak a jatek. */
export function setMusicPaused(on) {
  if (!musicGain || !ctx) return;
  musicGain.gain.setTargetAtTime(on ? 0 : 0.30, ctx.currentTime, 0.05);
}

export function setFireLevel(v) {
  if (!fireGain || !ctx) return;
  fireGain.gain.setTargetAtTime(Math.max(0, Math.min(0.5, v)) * 0.5, ctx.currentTime, 0.25);
}

function tone(freq, dur, type, gain, slideTo, delay) {
  if (!ctx || !enabled) return;
  const t = ctx.currentTime + (delay || 0);
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type || 'square';
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur, freq, gain, type, delay) {
  if (!ctx || !enabled || !noiseBuf) return;
  const t = ctx.currentTime + (delay || 0);
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  s.playbackRate.value = 0.8 + Math.random() * 0.4;
  const f = ctx.createBiquadFilter();
  f.type = type || 'bandpass';
  f.frequency.setValueAtTime(freq, t);
  f.Q.value = 1.2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(master);
  s.start(t);
  s.stop(t + dur + 0.02);
}

export const sfx = {
  chop() {
    noise(0.07, 2200, 0.22, 'bandpass');
    tone(180, 0.06, 'square', 0.07, 90);
  },
  crack() {
    noise(0.35, 900, 0.28, 'bandpass');
    tone(240, 0.4, 'sawtooth', 0.05, 70);
  },
  impact() {
    noise(0.4, 300, 0.4, 'lowpass');
    tone(70, 0.35, 'sine', 0.4, 32);
    noise(0.18, 1600, 0.14, 'bandpass', 0.02);
  },
  hurt() {
    tone(420, 0.16, 'square', 0.18, 140);
    noise(0.12, 800, 0.12, 'bandpass');
  },
  burn() {
    noise(0.3, 700, 0.2, 'bandpass');
    tone(300, 0.22, 'sawtooth', 0.1, 120);
  },
  beep() {
    tone(660, 0.1, 'square', 0.14);
  },
  go() {
    tone(880, 0.16, 'square', 0.18);
    tone(1320, 0.22, 'square', 0.14, null, 0.1);
  },
  win() {
    const n = [523, 659, 784, 1047];
    n.forEach((f, i) => tone(f, 0.22, 'square', 0.16, null, i * 0.1));
  },
  lose() {
    tone(300, 0.5, 'sawtooth', 0.14, 90);
  },
  select() {
    tone(520, 0.05, 'square', 0.1);
  },
  clash() {
    // ket fejsze osszecsattan: femes csengés + rovid zaj
    noise(0.09, 4200, 0.20, 'bandpass');
    tone(1750, 0.13, 'square', 0.10, 1200);
    tone(2600, 0.09, 'square', 0.06, 2100);
  },
  pickup() {
    tone(700, 0.08, 'square', 0.12);
    tone(1050, 0.1, 'square', 0.1, null, 0.06);
  },
};

// ---------------------------------------------------------------- hatterzene
// Chiptune favago-indulo: oom-pah basszus, pattós dallam, fablokk ritmus.
// Halkan szol az egeshang mogott. Az M gomb (master mute) ezt is elnemitja.

const BPM = 138;
const EIGHTH = 60 / BPM / 2;

function nf(name) {
  if (!name || name === '.') return 0;
  const S2 = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const semi = S2[name[0]] + (name[1] === '#' ? 1 : 0);
  const oct = parseInt(name[name.length - 1], 10);
  const midi = (oct + 1) * 12 + semi;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// 8 utem, utemenkent 8 nyolcad
const LEAD = [
  'C5', '.', 'E5', '.', 'G5', '.', 'E5', '.',
  'F5', '.', 'E5', '.', 'D5', '.', '.', '.',
  'D5', '.', 'F5', '.', 'A5', '.', 'F5', '.',
  'E5', '.', 'D5', '.', 'C5', '.', '.', '.',
  'C5', '.', 'E5', '.', 'G5', '.', 'C6', '.',
  'B5', '.', 'A5', '.', 'G5', '.', 'E5', '.',
  'F5', '.', 'E5', '.', 'D5', '.', 'G4', '.',
  'C5', '.', '.', '.', 'G4', '.', 'B4', '.',
];

// utemenkent [alaphang, kvint] - klasszikus oom-pah
const BASS_BARS = [
  ['C3', 'G3'], ['F3', 'C4'], ['D3', 'A3'], ['G3', 'D4'],
  ['C3', 'G3'], ['A3', 'E4'], ['G3', 'D4'], ['C3', 'G3'],
];

const STEPS = LEAD.length;

let musicTimer = null;
let musicGain = null;
let step = 0;
let nextT = 0;

function voice(freq, t, dur, type, gain, dest) {
  if (!freq) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function woodblock(t, gain) {
  const s2 = ctx.createBufferSource();
  s2.buffer = noiseBuf;
  s2.playbackRate.value = 1.6;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 1900;
  f.Q.value = 6;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  s2.connect(f).connect(g).connect(musicGain);
  s2.start(t);
  s2.stop(t + 0.07);
}

function playStep(i, t) {
  const bar = (i / 8) | 0;
  const beat = i % 8;

  voice(nf(LEAD[i]), t, 0.19, 'square', 0.085, musicGain);
  // oktav ala egy halk masodik szolam, hogy teltebb legyen
  if (LEAD[i] !== '.') voice(nf(LEAD[i]) / 2, t, 0.16, 'triangle', 0.045, musicGain);

  const b = BASS_BARS[bar];
  if (beat % 4 === 0) voice(nf(b[0]), t, 0.17, 'triangle', 0.13, musicGain);
  else if (beat % 4 === 2) voice(nf(b[1]), t, 0.13, 'triangle', 0.09, musicGain);

  if (beat === 2 || beat === 6) woodblock(t, 0.09);
  if (beat === 0) voice(90, t, 0.09, 'sine', 0.18, musicGain);
}

function startMusic() {
  if (musicTimer || !ctx) return;
  musicGain = ctx.createGain();
  musicGain.gain.value = 0.30;
  musicGain.connect(master);
  step = 0;
  nextT = ctx.currentTime + 0.12;
  musicTimer = setInterval(() => {
    if (!ctx) return;
    // Ha a lap hatterbe kerult vagy a context fel volt fuggesztve, az ora
    // elszaladt. Ilyenkor ujraszinkronizalunk, kulonben egyszerre zudulna ki
    // a lemaradt hangok tomege.
    if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.05;
    while (nextT < ctx.currentTime + 0.18) {
      playStep(step % STEPS, nextT);
      nextT += EIGHTH;
      step++;
    }
  }, 30);
}
