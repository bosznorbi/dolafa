// WebAudio-val generalt effektek. Nincs hangfajl, nincs letoltes.

let ctx = null;
let master = null;
let fireGain = null;
let noiseBuf = null;
let hazardFilter = null;   // a veszelyzona moraja: ez formalja a zajt
let hazardLfo = null;      // lassu hullamzas: didergés, gurgulazas, huhogas
let hazardLfoGain = null;
let hazardLevel = 0;

/**
 * A zaruló veszely AMBIENS hangja. Mindenhol ugyanaz a zajforras szol, csak
 * mas szuron at, es mas lüktetessel. Ettol lesz a jegmezon didergos szel,
 * a temetoben huhogo huzat, a cukorkavilagban pedig sürü bugyogas.
 *
 *   type/freq/q  a szuro: ez adja a hang "szinet"
 *   wobble       a lassu hullamzas melysege (0 = egyenletes moraj)
 *   rate         a hullamzas sebessege Hz-ben
 *   level        alap hangero-szorzo
 */
const AMBIENCE = {
  fire: { type: 'lowpass', freq: 420, q: 0.7, wobble: 0, rate: 1, level: 1 },
  ghost: { type: 'bandpass', freq: 240, q: 1.6, wobble: 0.5, rate: 0.45, level: 0.9 },
  sand: { type: 'bandpass', freq: 950, q: 0.8, wobble: 0.3, rate: 0.7, level: 0.7 },
  // A magas, rezonans sziszeges fárasztó volt: lejjebb vittuk a savot, a
  // rezonanciat es a hangerot is, es lassabb a didergés.
  water: { type: 'bandpass', freq: 1150, q: 1.1, wobble: 0.4, rate: 3.4, level: 0.4 },
  plasma: { type: 'bandpass', freq: 700, q: 7, wobble: 0.45, rate: 2.2, level: 0.7 },
  // A levelzorges tul eles es tul hangos volt.
  vine: { type: 'bandpass', freq: 1900, q: 0.9, wobble: 0.3, rate: 1.4, level: 0.42 },
  // az asztal szelen morzsalodo lapok halk percegese
  crumble: { type: 'bandpass', freq: 1600, q: 1.4, wobble: 0.35, rate: 2.6, level: 0.4 },
  // A tompa gurgulazas helyett pezsgő, jatekos buborekolas.
  choco: { type: 'bandpass', freq: 1250, q: 3.2, wobble: 0.6, rate: 3.6, level: 0.5 },
  // A veletlen palya menuje: melyen kongo, lassan hullamzo zugas. Nem
  // arulja el, melyik vilag jon, mert egyik palyaera sem hasonlit.
  // Tuzijatek: szaraz, magas serceges, mint a parazslo kanoc.
  spark: { type: 'bandpass', freq: 2600, q: 2.2, wobble: 0.5, rate: 5.5, level: 0.4 },
  mystery: { type: 'bandpass', freq: 420, q: 5.5, wobble: 0.7, rate: 0.38, level: 0.55 },
};

let ambience = AMBIENCE.fire;

/** Palyavaltaskor at kell allitani a veszelyzona morajat is. */
export function setHazardAmbience(style) {
  ambience = AMBIENCE[style] || AMBIENCE.fire;
  if (!ctx || !hazardFilter) return;
  hazardFilter.type = ambience.type;
  hazardFilter.frequency.setTargetAtTime(ambience.freq, ctx.currentTime, 0.2);
  hazardFilter.Q.setTargetAtTime(ambience.q, ctx.currentTime, 0.2);
  hazardLfo.frequency.setTargetAtTime(ambience.rate, ctx.currentTime, 0.2);
  applyHazardLevel();
}

function applyHazardLevel() {
  if (!fireGain || !ctx) return;
  const v = hazardLevel * ambience.level * 0.5;
  fireGain.gain.setTargetAtTime(v, ctx.currentTime, 0.25);
  if (hazardLfoGain) hazardLfoGain.gain.setTargetAtTime(v * ambience.wobble, ctx.currentTime, 0.25);
}
// Betolteskor NEMA. Aki hangot akar, az M-mel bekapcsolja: igy egy
// frissites sosem harsog bele a szobaba.
let enabled = false;

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) { enabled = false; return; }
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = enabled ? 0.5 : 0;
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
  lp.type = ambience.type;
  lp.frequency.value = ambience.freq;
  lp.Q.value = ambience.q;
  hazardFilter = lp;
  fireGain = ctx.createGain();
  fireGain.gain.value = 0;
  src.connect(lp).connect(fireGain).connect(master);
  src.start();

  // Lassu hullamzas a moraj tetejen. A hangero-parameterre kotjuk, tehat
  // hozzaadodik ahhoz, amit a tavolsag beallit.
  hazardLfo = ctx.createOscillator();
  hazardLfo.type = 'sine';
  hazardLfo.frequency.value = ambience.rate;
  hazardLfoGain = ctx.createGain();
  hazardLfoGain.gain.value = 0;
  hazardLfo.connect(hazardLfoGain).connect(fireGain.gain);
  hazardLfo.start();

  startMusic();
}

let paused = false;

/** A mester-hangero: nemitva vagy szunetben nulla, kulonben a rendes szint. */
function applyMaster() {
  if (!master || !ctx) return;
  master.gain.setTargetAtTime(enabled && !paused ? 0.5 : 0, ctx.currentTime, 0.03);
}

export function toggleMute() {
  if (!master) return enabled;
  enabled = !enabled;
  applyMaster();
  return enabled;
}

/**
 * Szunetben MINDEN elhallgat, nem csak a zene: a veszelyzona moraja is.
 * Szunet kozben nem szolhat semmi, kulonben a "megall a jatek" erzet hamis.
 */
export function setAllPaused(on) {
  const v = !!on;
  if (v === paused) return;      // minden kepkockan hivjuk, csak valtaskor dolgozunk
  paused = v;
  applyMaster();
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
  hazardLevel = Math.max(0, Math.min(0.5, v));
  applyHazardLevel();
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

/**
 * A vagas es a kidoles hangja ANYAGFUGGO. Fat vagni mas, mint kobe vesni
 * vagy jeget repeszteni, es a palya csak akkor hiheto, ha ezt halljuk is.
 *
 *   chopN  a vagas zajanak sávja, hossza es hangereje
 *   chopT  a vagas ala tett hang (frekvencia, hossz, forma, hangero, csuszas)
 *   crackN a kidoles zaja
 *   crackT a kidoles ala tett hang
 */
const MATERIALS = {
  // fa: tompa reccsenes, melyre csuszo kopogassal
  erdo: {
    chopN: [0.07, 2200, 0.22, 'bandpass'], chopT: [180, 0.06, 'square', 0.07, 90],
    crackN: [0.35, 900, 0.28, 'bandpass'], crackT: [240, 0.4, 'sawtooth', 0.05, 70],
  },
  // ko: eles vesokoppanas, rovid femes csengessel
  temeto: {
    chopN: [0.05, 3400, 0.2, 'bandpass'], chopT: [640, 0.05, 'square', 0.05, 520],
    crackN: [0.45, 420, 0.3, 'lowpass'], crackT: [110, 0.5, 'sawtooth', 0.06, 45],
  },
  // homokko: szarazabb, melyebb veses, utana pergo homok
  sivatag: {
    chopN: [0.06, 1500, 0.24, 'bandpass'], chopT: [300, 0.06, 'square', 0.05, 220],
    crackN: [0.5, 700, 0.26, 'bandpass'], crackT: [90, 0.45, 'sawtooth', 0.06, 40],
  },
  // jeg: magas, ropogo repedes, utana csorgo szilankok
  jeg: {
    chopN: [0.05, 5200, 0.2, 'bandpass'], chopT: [1200, 0.05, 'triangle', 0.05, 900],
    crackN: [0.4, 3200, 0.24, 'bandpass'], crackT: [1600, 0.35, 'triangle', 0.05, 400],
  },
  // kristaly: vagas kozben harangszeru csendules, kidoleskor viszont UVEG
  // CSORoMPoL. A csorompoles nem egy hang, hanem sok apro, kulonbozo magassagu
  // szilank-koccanas egymas hegyen-hatan, elol egy szaraz repedessel.
  ur: {
    chopN: [0.04, 4200, 0.14, 'bandpass'], chopT: [1500, 0.12, 'sine', 0.07, 1500],
    crackN: [0.06, 5200, 0.22, 'bandpass'], crackT: [2600, 0.05, 'triangle', 0.06, 1400],
    crackFx() {
      // Egy BETORO UVEGTABLA, nem csorgo jegkocka. A korabbi valtozat husz
      // esemenyt zsufolt fel masodperc ala: az mar nem csorompoles volt,
      // hanem sercegés. Most keves, de tagolt esemeny szol:
      //
      //   1. a repedes pillanata: egyetlen szaraz, eles roppanas,
      //   2. negy nagyobb szilank, egyre halkabban, egyre melyebben,
      //   3. a vegen ket kesei, halk koccanas, ahogy az utolso darab leul.
      tone(180, 0.5, 'sine', 0.1, 90, 0);         // a tabla tompa becsapodasa
      const shard = [[2350, 0.10, 0.075], [1760, 0.22, 0.06],
        [2960, 0.36, 0.05], [1480, 0.52, 0.04]];
      for (const [f, at, g] of shard) {
        tone(f, 0.24, 'triangle', g, f * 0.7, at);
        noise(0.07, f * 1.6, g * 0.7, 'bandpass', at);
      }
      tone(2100, 0.2, 'triangle', 0.03, 1500, 0.78);
      tone(1240, 0.26, 'triangle', 0.025, 900, 0.98);
    },
  },
  // faragott totem: melyebb, dobszeru kongas
  dzsungel: {
    chopN: [0.08, 1200, 0.22, 'bandpass'], chopT: [120, 0.09, 'triangle', 0.09, 70],
    crackN: [0.4, 600, 0.28, 'lowpass'], crackT: [150, 0.45, 'triangle', 0.07, 55],
  },
  // domino: szaraz, kemeny kattanas, mint amikor egy lap a masikhoz er
  domino: {
    chopN: [0.04, 2800, 0.2, 'bandpass'], chopT: [900, 0.04, 'square', 0.06, 700],
    crackN: [0.18, 1400, 0.22, 'bandpass'], crackT: [400, 0.16, 'square', 0.06, 200],
  },
  // cukor: rovid, magas roppanes, jatekos felfele csusszanassal
  cukorka: {
    chopN: [0.05, 3800, 0.18, 'bandpass'], chopT: [700, 0.05, 'square', 0.05, 1000],
    crackN: [0.28, 2200, 0.2, 'bandpass'], crackT: [500, 0.3, 'triangle', 0.06, 1100],
  },
  // papircso: tompa puffanas, utana papirsercenes
  tuzijatek: {
    chopN: [0.06, 3000, 0.2, 'bandpass'], chopT: [220, 0.05, 'triangle', 0.06, 140],
    crackN: [0.3, 1800, 0.26, 'bandpass'], crackT: [160, 0.35, 'triangle', 0.06, 60],
  },
  // fa es vaszon: nyikorgo, melyebb reccsenes
  szelmalom: {
    chopN: [0.08, 1700, 0.22, 'bandpass'], chopT: [200, 0.07, 'square', 0.07, 110],
    crackN: [0.42, 800, 0.3, 'bandpass'], crackT: [130, 0.5, 'sawtooth', 0.06, 50],
  },
};

let material = MATERIALS.erdo;

/** Palyavaltaskor a vagas hangja is valtozik. */
export function setChopMaterial(id) {
  material = MATERIALS[id] || MATERIALS.erdo;
}

// ---------------------------------------------------------------- diadal
//
// Minden palyanak SAJAT gyozelmi fanfarja van. A vaz mindenhol ugyanaz -
// kurtjel, kitartott akkord, mely alap, csillogas -, de a hangnem es a
// hangszin a vilaghoz igazodik: a temetoben moll es harangszo, a jegen
// uveges magas csengés, a tuzijateknal felsivito raketa es durranasok.
//
//   lead   [frekvencia, hossz, mikor] harmasok: a felvezeto kurtjel
//   chord  a kitartott zaro-akkord hangjai
//   bass   a mely alap (bassTo: idecsuszik le)
//   roll   [darab, hossz, frekvencia, hangero, tipus, lepes] a pergo rautes
//   tail   a legvegen felcsendulo ket magas hang
//   extra  amivel csak ez a vilag zar
const FANFARES = {
  // Erdo: az eredeti C-dur fanfar. Ehhez merjuk a tobbit.
  erdo: {
    leadW: 'square', subW: 'triangle', leadG: 0.15, subG: 0.08, hold: 1.5,
    lead: [[523, 0.13, 0], [523, 0.09, 0.16], [659, 0.13, 0.26],
      [784, 0.13, 0.42], [659, 0.09, 0.58], [784, 0.13, 0.68], [1047, 0.5, 0.86]],
    chord: [261, 329, 392, 523, 784], bass: 65, bassTo: 48, hitF: 1800,
    roll: [7, 0.05, 2600, 0.09, 'bandpass', 0.05], tail: [1568, 2093],
  },

  // Temeto: MOLL diadal. Ugyanaz a lendulet, de a-mollban, es a vegen
  // megkondul a harang: gyoztel, de a temetoben gyoztel.
  temeto: {
    leadW: 'sawtooth', subW: 'triangle', leadG: 0.12, subG: 0.09, hold: 1.9,
    lead: [[440, 0.15, 0], [440, 0.1, 0.18], [523, 0.15, 0.3],
      [659, 0.15, 0.48], [523, 0.1, 0.64], [659, 0.15, 0.74], [880, 0.6, 0.92]],
    chord: [220, 261, 329, 440, 659], bass: 55, bassTo: 41, hitF: 900,
    roll: [5, 0.08, 1200, 0.08, 'bandpass', 0.07], tail: [1319, 1760],
    extra() {
      tone(220, 2.4, 'sine', 0.16, null, 0.95);      // harangkondulas
      tone(659, 2.0, 'sine', 0.07, null, 0.97);
      tone(110, 2.4, 'sine', 0.12, null, 0.95);
    },
  },

  // Sivatag: frig-dur (D - Esz - Fisz), kezidobos pergessel.
  sivatag: {
    leadW: 'square', subW: 'triangle', leadG: 0.14, subG: 0.08, hold: 1.6,
    lead: [[587, 0.12, 0], [622, 0.1, 0.14], [740, 0.12, 0.26],
      [784, 0.12, 0.42], [740, 0.1, 0.56], [880, 0.14, 0.66], [1175, 0.5, 0.86]],
    chord: [293, 370, 440, 587, 880], bass: 73, bassTo: 55, hitF: 1400,
    roll: [11, 0.04, 900, 0.07, 'bandpass', 0.035], tail: [1480, 1760],
  },

  // Jegmezo: uveges, magas csengés. Csupa sine es haromszog, semmi harsany.
  jeg: {
    leadW: 'triangle', subW: 'sine', leadG: 0.13, subG: 0.08, hold: 2.0,
    lead: [[659, 0.14, 0], [831, 0.1, 0.16], [988, 0.14, 0.28],
      [1319, 0.14, 0.44], [988, 0.1, 0.6], [1319, 0.14, 0.7], [1661, 0.55, 0.88]],
    chord: [330, 415, 494, 659, 988], bass: 82, bassTo: 62, hitF: 4200,
    roll: [9, 0.04, 5200, 0.05, 'bandpass', 0.04], tail: [1976, 2637],
    extra() {
      [2093, 2637, 3136].forEach((f, i) => tone(f, 0.8, 'sine', 0.045, null, 1.0 + i * 0.09));
    },
  },

  // Idegen bolygo: szintetikus. Felcsuszo sine-ek es szeles kvint-akkord.
  ur: {
    leadW: 'sine', subW: 'triangle', leadG: 0.14, subG: 0.09, hold: 2.1,
    lead: [[392, 0.16, 0], [523, 0.12, 0.2], [784, 0.16, 0.34],
      [1047, 0.16, 0.52], [784, 0.1, 0.68], [1047, 0.16, 0.76], [1568, 0.6, 0.94]],
    chord: [261, 392, 523, 587, 784], bass: 65, bassTo: 98, hitF: 2600,
    roll: [6, 0.06, 3000, 0.06, 'bandpass', 0.06], tail: [2093, 3136],
    extra() {
      tone(180, 0.7, 'sawtooth', 0.09, 1400, 0.2);   // felcsuszo energiaiv
    },
  },

  // Aztekok: nehez dobok es mely kurt. Pentaton, foldkozeli.
  dzsungel: {
    leadW: 'sawtooth', subW: 'triangle', leadG: 0.13, subG: 0.1, hold: 1.8,
    lead: [[330, 0.16, 0], [392, 0.12, 0.2], [440, 0.16, 0.34],
      [587, 0.16, 0.52], [440, 0.1, 0.68], [587, 0.16, 0.78], [880, 0.55, 0.96]],
    chord: [220, 293, 330, 440, 659], bass: 55, bassTo: 44, hitF: 600,
    roll: [5, 0.12, 220, 0.13, 'lowpass', 0.11], tail: [1175, 1319],
    extra() {
      for (let i = 0; i < 4; i++) tone(70, 0.3, 'sine', 0.24, 45, 0.96 + i * 0.22);
    },
  },

  // Cukorkavilag: gyors, magas, ugralo. Mint egy celesta.
  cukorka: {
    leadW: 'triangle', subW: 'triangle', leadG: 0.13, subG: 0.07, hold: 1.4,
    lead: [[523, 0.09, 0], [659, 0.09, 0.1], [784, 0.09, 0.2],
      [1047, 0.1, 0.3], [1319, 0.1, 0.42], [1047, 0.09, 0.56], [1568, 0.45, 0.7]],
    chord: [261, 329, 392, 523, 1047], bass: 98, bassTo: 130, hitF: 3400,
    roll: [10, 0.03, 4200, 0.05, 'bandpass', 0.035], tail: [2093, 2637],
    extra() {
      [1568, 1976, 2349, 2637].forEach((f, i) => tone(f, 0.16, 'sine', 0.06, null, 0.75 + i * 0.08));
    },
  },

  // Domino: szaraz, kattogo. A kurtjel staccato, alatta fakoppanasok.
  domino: {
    leadW: 'square', subW: 'square', leadG: 0.12, subG: 0.07, hold: 1.5,
    lead: [[392, 0.07, 0], [392, 0.07, 0.12], [494, 0.07, 0.24],
      [587, 0.07, 0.36], [784, 0.07, 0.48], [587, 0.07, 0.6], [784, 0.5, 0.78]],
    chord: [196, 246, 293, 392, 587], bass: 49, bassTo: 39, hitF: 1400,
    roll: [12, 0.03, 2800, 0.06, 'bandpass', 0.04], tail: [1175, 1568],
    extra() {
      for (let i = 0; i < 6; i++) tone(900 - i * 60, 0.04, 'square', 0.07, null, 0.4 + i * 0.055);
    },
  },

  // Tuzijatek: felsivito raketa, majd durranas-sorozat es fenyes dur akkord.
  tuzijatek: {
    leadW: 'square', subW: 'triangle', leadG: 0.13, subG: 0.08, hold: 1.7,
    lead: [[659, 0.1, 0.3], [784, 0.1, 0.42], [1047, 0.12, 0.54],
      [1319, 0.12, 0.66], [1047, 0.09, 0.78], [1568, 0.5, 0.88], [2093, 0.4, 1.0]],
    chord: [261, 329, 392, 523, 1047], bass: 65, bassTo: 49, hitF: 2200,
    roll: null, tail: [2637, 3136],
    extra() {
      tone(300, 0.45, 'sine', 0.09, 1900, 0.02);     // felsivito raketa
      // durranas-sorozat: eloszor egy nagy, aztan szetszort kisebbek
      noise(0.3, 260, 0.3, 'lowpass', 0.5);
      const pops = [0.62, 0.7, 0.86, 0.95, 1.05, 1.16, 1.3];
      for (let i = 0; i < pops.length; i++) {
        noise(0.16, 400 + i * 260, 0.16, 'bandpass', pops[i]);
        tone(120, 0.12, 'sine', 0.16, 60, pops[i]);
      }
    },
  },

  // Szelmalom: nepies, mixolid zarlat (a lehajtott 7. fok: B). Nyugodt,
  // szeles - mint egy falusi unnep vegen a rezbanda.
  szelmalom: {
    leadW: 'triangle', subW: 'square', leadG: 0.13, subG: 0.08, hold: 1.9,
    lead: [[523, 0.14, 0], [659, 0.12, 0.18], [784, 0.14, 0.32],
      [880, 0.14, 0.5], [784, 0.1, 0.66], [698, 0.12, 0.76], [1047, 0.55, 0.9]],
    chord: [261, 329, 392, 466, 784], bass: 65, bassTo: 52, hitF: 1100,
    roll: [7, 0.07, 700, 0.08, 'lowpass', 0.055], tail: [1568, 1760],
    extra() {
      tone(392, 1.6, 'triangle', 0.06, null, 0.94);  // kitartott rezfuvos szinezet
    },
  },
};

// Melyik palya fanfarja szol. A veletlen palyan is a MOST jatszott vilage:
// a meccs vegen mar nem titok, hol jatszottunk.
let fanfareId = 'erdo';

/** Palyavaltaskor a gyozelmi fanfar is valtozik. */
export function setFanfare(id) {
  fanfareId = FANFARES[id] ? id : 'erdo';
}

export const sfx = {
  chop() {
    noise(...material.chopN);
    tone(...material.chopT);
  },
  crack() {
    noise(...material.crackN);
    tone(...material.crackT);
    // Nehany anyag tobbet kivan egyetlen zajnal es egyetlen hangnal: a
    // kristaly peldaul UVEGCSORoMPOLEST. Azt a material sajat fuggvenye adja.
    if (material.crackFx) material.crackFx();
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
  /**
   * Diadal-fanfar a meccs vegen. Nem egy futam, hanem egy rovid tetel:
   * pontozott ritmusu felvezetes, majd egy kitartott dur akkord harom
   * szolamban, alatta pergo dobbal es egy melyen kongo alaphanggal.
   * A hatterzaj ilyenkor teljesen elhallgat, tehat ez marad egyedul.
   */
  win() {
    // A diadal MINDEN vilagban ugyanaz a gesztus - felvezeto kurtjel, kitartott
    // zaro-akkord, mely alap es csillogo lezaras -, de a hangszinet, a
    // hangnemet es a rautest a palya adja. Lasd a FANFARES tablat.
    const f = FANFARES[fanfareId] || FANFARES.erdo;
    // 1. felvezetes: pontozott ritmus
    for (const [fr, d, at] of f.lead) {
      tone(fr, d, f.leadW, f.leadG, null, at);
      tone(fr / 2, d, f.subW, f.subG, null, at);
    }
    // 2. kitartott zaro-akkord
    f.chord.forEach((fr, i) => {
      tone(fr, f.hold, i > 2 ? f.leadW : f.subW, 0.09, null, 0.86 + i * 0.02);
    });
    // 3. mely alap
    tone(f.bass, f.hold * 0.87, 'sine', 0.3, f.bassTo, 0.86);
    // 4. a palya sajat rautese
    if (f.roll) {
      for (let i = 0; i < f.roll[0]; i++) {
        noise(f.roll[1], f.roll[2], f.roll[3], f.roll[4] || 'bandpass', 0.5 + i * f.roll[5]);
      }
    }
    noise(0.6, f.hitF, 0.16, 'bandpass', 0.86);
    // 5. csillogo lezaras
    f.tail.forEach((fr, i) => tone(fr, 0.35, f.tailW || 'sine', 0.06, null, 1.05 + i * 0.12));
    // 6. amivel csak EZ a vilag zar
    if (f.extra) f.extra();
  },
  /**
   * Kor-pont. Szandekosan RÖVID es szereny: a nagy fanfar csak akkor szol,
   * ha valaki tenyleg megnyerte a meccset. Ha minden kor vegen zengene,
   * elveszne a sulya.
   */
  /** Felszallo raketa: felsivito futy, majd egy tompa puffanas. */
  rocket() {
    tone(320, 0.4, 'sine', 0.07, 1500);
    noise(0.14, 900, 0.09, 'bandpass');
    noise(0.22, 300, 0.1, 'lowpass', 0.34);
    tone(140, 0.16, 'sine', 0.1, 70, 0.34);
  },
  point() {
    tone(784, 0.1, 'square', 0.11);
    tone(1047, 0.16, 'square', 0.11, null, 0.09);
    tone(392, 0.14, 'triangle', 0.07, null, 0.09);
  },
  /** Temetoi harang: melyen kongo alaphang, folotte femes felhangokkal. */
  bell() {
    tone(110, 2.6, 'sine', 0.3);
    tone(165, 2.2, 'sine', 0.12, null, 0.01);
    tone(220, 1.8, 'triangle', 0.09, null, 0.02);
    tone(392, 1.1, 'sine', 0.05, null, 0.03);
    noise(0.18, 900, 0.1, 'bandpass');
  },

  /** Villamcsapas: eles roppanas, utana melyen gordulo dorges. */
  bolt() {
    noise(0.06, 5200, 0.26, 'bandpass');
    tone(2400, 0.05, 'square', 0.1, 900);
    noise(0.45, 260, 0.22, 'lowpass', 0.04);
    tone(80, 0.5, 'sawtooth', 0.16, 40, 0.05);
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

// Minden palyanak sajat dallama van. Ugyanaz a motor jatssza mindet:
// 8 utem, utemenkent 8 nyolcad dallam + oom-pah basszus. Csak a hangjegyek,
// a tempo es a hangszin valtozik, tehat egyseges marad a hangzas.
//
// A 'lead' 64 nyolcadja a fodallam ('.' = szunet), a 'bass' utemenkent
// [alaphang, kvint]. A favago szama valtozatlan maradt.

function nf(name) {
  if (!name || name === '.') return 0;
  const S2 = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const semi = S2[name[0]] + (name[1] === '#' ? 1 : 0);
  const oct = parseInt(name[name.length - 1], 10);
  const midi = (oct + 1) * 12 + semi;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const TRACKS = {
  // Erdo: a v1 indulója, valtozatlanul.
  erdo: {
    bpm: 138, lead: 'square', bassW: 'triangle', perc: 1900, percRate: 1.6, thump: 90,
    notes: [
      'C5', '.', 'E5', '.', 'G5', '.', 'E5', '.',
      'F5', '.', 'E5', '.', 'D5', '.', '.', '.',
      'D5', '.', 'F5', '.', 'A5', '.', 'F5', '.',
      'E5', '.', 'D5', '.', 'C5', '.', '.', '.',
      'C5', '.', 'E5', '.', 'G5', '.', 'C6', '.',
      'B5', '.', 'A5', '.', 'G5', '.', 'E5', '.',
      'F5', '.', 'E5', '.', 'D5', '.', 'G4', '.',
      'C5', '.', '.', '.', 'G4', '.', 'B4', '.',
    ],
    bass: [
      ['C3', 'G3'], ['F3', 'C4'], ['D3', 'A3'], ['G3', 'D4'],
      ['C3', 'G3'], ['A3', 'E4'], ['G3', 'D4'], ['C3', 'G3'],
    ],
  },

  // Temeto: lassu, disszonans gyaszinduló. A dallam es a basszus is tele van
  // BOVITETT KVARTTAL (A-D#, F-B, E-A#): ez az "ordog hangkoze", ettol lesz
  // nyugtalanito. A dallamban ott a moll skala emelt 7. foka (G#) is, ami
  // meg feszultebbe teszi a zarlatot.
  temeto: {
    bpm: 92, lead: 'square', bassW: 'sawtooth', perc: 900, percRate: 0.75, thump: 52,
    notes: [
      'A4', '.', 'D#5', '.', 'E5', '.', 'D#5', '.',
      'A4', '.', 'C5', '.', 'B4', '.', 'G#4', '.',
      'F4', '.', 'B4', '.', 'E5', '.', 'F5', '.',
      'E5', '.', 'D#5', '.', 'E5', '.', '.', '.',
      'A5', '.', 'G#5', '.', 'A5', '.', 'D#5', '.',
      'E5', '.', 'F5', '.', 'E5', '.', 'C5', '.',
      'B4', '.', 'A#4', '.', 'B4', '.', 'F5', '.',
      'A4', '.', '.', '.', 'D#5', '.', '.', '.',
    ],
    bass: [
      ['A2', 'D#3'], ['A2', 'E3'], ['F2', 'B2'], ['E2', 'B2'],
      ['A2', 'D#3'], ['F2', 'C3'], ['E2', 'A#2'], ['A2', 'E3'],
    ],
  },

  // Sivatag: fríg-dur szinezet (D-Eb-F#), kezidobos lüktetes.
  sivatag: {
    bpm: 128, lead: 'square', bassW: 'triangle', perc: 2600, percRate: 2.1, thump: 74,
    notes: [
      'D5', '.', 'D#5', '.', 'F#5', '.', 'G5', '.',
      'A5', '.', 'G5', '.', 'F#5', '.', 'D#5', '.',
      'D5', '.', 'F#5', '.', 'A5', '.', 'A#5', '.',
      'A5', '.', 'G5', '.', 'F#5', '.', '.', '.',
      'D5', '.', 'D#5', '.', 'D5', '.', 'C5', '.',
      'A#4', '.', 'C5', '.', 'D5', '.', 'F#5', '.',
      'G5', '.', 'F#5', '.', 'D#5', '.', 'D5', '.',
      'D5', '.', '.', '.', 'A4', '.', '.', '.',
    ],
    bass: [
      ['D3', 'A3'], ['D3', 'A3'], ['G2', 'D3'], ['A2', 'E3'],
      ['D3', 'A3'], ['A#2', 'F3'], ['A2', 'E3'], ['D3', 'A3'],
    ],
  },

  // Jegmezo: ritka, magas, csengo hangok. Szinte üres a tér.
  jeg: {
    bpm: 112, lead: 'triangle', bassW: 'sine', perc: 3400, percRate: 2.6, thump: 68,
    notes: [
      'G5', '.', '.', '.', 'E5', '.', '.', '.',
      'C6', '.', '.', '.', 'G5', '.', '.', '.',
      'A5', '.', '.', '.', 'F5', '.', '.', '.',
      'G5', '.', 'E5', '.', 'C5', '.', '.', '.',
      'F5', '.', 'A5', '.', 'C6', '.', 'A5', '.',
      'G5', '.', 'E5', '.', 'G5', '.', '.', '.',
      'D5', '.', 'F5', '.', 'A5', '.', 'F5', '.',
      'E5', '.', '.', '.', 'C5', '.', '.', '.',
    ],
    bass: [
      ['C3', 'G3'], ['C3', 'G3'], ['F2', 'C3'], ['G2', 'D3'],
      ['F2', 'C3'], ['C3', 'G3'], ['G2', 'D3'], ['C3', 'G3'],
    ],
  },

  // Idegen bolygo: gyors, szaggatott arpeggio, füreszfog hangszinnel.
  ur: {
    bpm: 152, lead: 'sawtooth', bassW: 'square', perc: 4200, percRate: 3.0, thump: 55,
    notes: [
      'A4', 'C5', 'E5', 'A5', 'E5', 'C5', 'A4', '.',
      'G4', 'B4', 'D5', 'G5', 'D5', 'B4', 'G4', '.',
      'F4', 'A4', 'C5', 'F5', 'C5', 'A4', 'F4', '.',
      'E4', 'G#4', 'B4', 'E5', 'B4', 'G#4', 'E4', '.',
      'A4', 'C5', 'E5', 'A5', 'C6', 'A5', 'E5', '.',
      'F4', 'A4', 'C5', 'F5', 'A5', 'F5', 'C5', '.',
      'E4', 'G#4', 'B4', 'E5', 'G#5', 'E5', 'B4', '.',
      'A4', 'E5', 'A5', 'E5', 'A4', '.', '.', '.',
    ],
    bass: [
      ['A2', 'E3'], ['G2', 'D3'], ['F2', 'C3'], ['E2', 'B2'],
      ['A2', 'E3'], ['F2', 'C3'], ['E2', 'B2'], ['A2', 'E3'],
    ],
  },

  // Domino: gepies, pontos ora-mu. Rovid, staccato hangok, mint a
  // kattano lapok, alatta egyenletes ketnegyedes lüktetes.
  domino: {
    bpm: 126, lead: 'square', bassW: 'triangle', perc: 2900, percRate: 2.4, thump: 70,
    notes: [
      'E5', '.', 'E5', '.', 'G5', '.', 'E5', '.',
      'A5', '.', 'G5', '.', 'E5', '.', 'D5', '.',
      'E5', '.', 'E5', '.', 'B5', '.', 'A5', '.',
      'G5', '.', 'E5', '.', '.', '.', '.', '.',
      'A5', '.', 'A5', '.', 'C6', '.', 'A5', '.',
      'G5', '.', 'E5', '.', 'D5', '.', 'E5', '.',
      'G5', '.', 'A5', '.', 'G5', '.', 'E5', '.',
      'D5', '.', 'E5', '.', '.', '.', '.', '.',
    ],
    bass: [
      ['A2', 'E3'], ['A2', 'E3'], ['E2', 'B2'], ['A2', 'E3'],
      ['D3', 'A3'], ['A2', 'E3'], ['E2', 'B2'], ['A2', 'E3'],
    ],
  },

  // Meglepetes: a veletlen palya menuzeneje. Egeszhangu skala (C D E F# G# A#),
  // amiben NINCS fel hang, tehat nincs alaphangja sem: lebego, misztikus
  // hangzas, ami sehova nem "erkezik meg". Pont ezt akarjuk: meg nem tudni,
  // hova megyunk.
  meglepetes: {
    bpm: 84, lead: 'triangle', bassW: 'sine', perc: 2400, percRate: 1.1, thump: 46,
    notes: [
      'C5', '.', 'D5', '.', 'E5', '.', 'F#5', '.',
      'G#5', '.', 'F#5', '.', 'E5', '.', '.', '.',
      'A#5', '.', 'G#5', '.', 'F#5', '.', 'E5', '.',
      'D5', '.', 'C5', '.', '.', '.', '.', '.',
      'E5', '.', 'F#5', '.', 'G#5', '.', 'A#5', '.',
      'C6', '.', 'A#5', '.', 'G#5', '.', '.', '.',
      'F#5', '.', 'E5', '.', 'D5', '.', 'C5', '.',
      'D5', '.', '.', '.', 'G#4', '.', '.', '.',
    ],
    bass: [
      ['C3', 'F#3'], ['D3', 'G#3'], ['E3', 'A#3'], ['C3', 'F#3'],
      ['G#2', 'D3'], ['A#2', 'E3'], ['C3', 'F#3'], ['D3', 'G#3'],
    ],
  },

  // Dzsungel: moll pentaton dallam dobos lüktetessel. A pentaton skalabol
  // hianyzik a fel hang, ezert nyitott, torzsi hangzasa van.
  dzsungel: {
    bpm: 132, lead: 'square', bassW: 'triangle', perc: 1500, percRate: 1.25, thump: 58,
    notes: [
      'A4', '.', 'C5', 'D5', 'E5', '.', 'D5', '.',
      'C5', '.', 'A4', '.', 'G4', '.', 'A4', '.',
      'E5', '.', 'G5', 'E5', 'D5', '.', 'C5', '.',
      'A4', '.', 'G4', '.', 'A4', '.', '.', '.',
      'A5', '.', 'G5', 'E5', 'D5', '.', 'E5', '.',
      'C5', '.', 'D5', '.', 'E5', '.', 'G5', '.',
      'E5', '.', 'D5', 'C5', 'A4', '.', 'G4', '.',
      'A4', '.', '.', '.', 'E4', '.', 'A4', '.',
    ],
    bass: [
      ['A2', 'E3'], ['A2', 'E3'], ['C3', 'G3'], ['G2', 'D3'],
      ['A2', 'E3'], ['C3', 'G3'], ['D3', 'A3'], ['A2', 'E3'],
    ],
  },

  // Cukorkavilag: gyors, dur, ugralo dallam csengettyus kiseréssel.
  cukorka: {
    bpm: 146, lead: 'triangle', bassW: 'triangle', perc: 3800, percRate: 2.8, thump: 78,
    notes: [
      'C5', 'E5', 'G5', 'E5', 'C6', '.', 'G5', '.',
      'F5', 'A5', 'C6', 'A5', 'F5', '.', '.', '.',
      'G5', 'B5', 'D6', 'B5', 'G5', '.', 'D5', '.',
      'E5', 'G5', 'C6', 'G5', 'E5', '.', '.', '.',
      'A5', 'C6', 'E6', 'C6', 'A5', '.', 'E5', '.',
      'F5', 'A5', 'C6', 'A5', 'F5', '.', 'C5', '.',
      'G5', 'B5', 'D6', 'B5', 'G5', '.', 'F5', '.',
      'E5', '.', 'C5', '.', 'G4', '.', 'C5', '.',
    ],
    bass: [
      ['C3', 'G3'], ['F2', 'C3'], ['G2', 'D3'], ['C3', 'G3'],
      ['A2', 'E3'], ['F2', 'C3'], ['G2', 'D3'], ['C3', 'G3'],
    ],
  },
  // Tuzijatek: gyors, unnepi dur induló, nagy ugrasokkal a dallamban -
  // mintha rakétak szallnanak fel egymas utan.
  tuzijatek: {
    bpm: 152, lead: 'square', bassW: 'triangle', perc: 4200, percRate: 3.0, thump: 84,
    notes: [
      'C5', '.', 'G5', '.', 'C6', '.', 'E6', '.',
      'D6', '.', 'C6', '.', 'G5', '.', '.', '.',
      'A5', '.', 'E6', '.', 'A6', '.', 'G6', '.',
      'E6', '.', 'D6', '.', 'C6', '.', '.', '.',
      'F5', '.', 'C6', '.', 'F6', '.', 'E6', '.',
      'D6', '.', 'C6', '.', 'A5', '.', 'F5', '.',
      'G5', '.', 'D6', '.', 'G6', '.', 'F6', '.',
      'E6', '.', 'C6', '.', 'G5', '.', 'C5', '.',
    ],
    bass: [
      ['C3', 'G3'], ['G2', 'D3'], ['A2', 'E3'], ['C3', 'G3'],
      ['F2', 'C3'], ['F2', 'C3'], ['G2', 'D3'], ['C3', 'G3'],
    ],
  },

  // Szelmalom: nyugodt, nepies kortanc. Mixolid szinezet (a lehajtott 7.
  // fok, a Bb) adja a regies, hollandus izt.
  szelmalom: {
    bpm: 118, lead: 'triangle', bassW: 'triangle', perc: 2200, percRate: 1.5, thump: 68,
    notes: [
      'C5', '.', 'D5', 'E5', 'G5', '.', 'E5', '.',
      'D5', '.', 'C5', '.', 'A4', '.', '.', '.',
      'F5', '.', 'E5', 'D5', 'C5', '.', 'A4', '.',
      'A#4', '.', 'C5', '.', 'D5', '.', '.', '.',
      'G5', '.', 'A5', 'G5', 'F5', '.', 'D5', '.',
      'E5', '.', 'F5', '.', 'G5', '.', 'E5', '.',
      'C5', '.', 'A#4', '.', 'A4', '.', 'G4', '.',
      'C5', '.', '.', '.', 'G4', '.', 'C5', '.',
    ],
    bass: [
      ['C3', 'G3'], ['A2', 'E3'], ['F2', 'C3'], ['A#2', 'F3'],
      ['C3', 'G3'], ['F2', 'C3'], ['A#2', 'F3'], ['C3', 'G3'],
    ],
  },
};

let track = TRACKS.erdo;
let LEAD = track.notes;
let BASS_BARS = track.bass;
let BPM = track.bpm;

// Z modban porgosebb a dallam. A hangok hosszat is ezzel skalazzuk, kulonben
// gyorsabb tempoban egymasba folynanak.
let tempo = 1;
let eighth = 60 / BPM / 2;

function retime() {
  eighth = 60 / BPM / 2 / tempo;
}

/** 1 = alap tempo, 1.32 = varazs-mod. A scheduler menet kozben is koveti. */
export function setMusicTempo(mul) {
  tempo = mul > 0 ? mul : 1;
  retime();
}

/** Palyavaltaskor mas dallamra valt. Ismeretlen id eseten marad a mostani. */
export function setMusicTrack(id) {
  const t = TRACKS[id];
  if (!t || t === track) return;
  track = t;
  LEAD = t.notes;
  BASS_BARS = t.bass;
  BPM = t.bpm;
  retime();
  step = 0;                 // az uj dallam az elejerol induljon
}

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
  s2.playbackRate.value = track.percRate;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = track.perc;
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

  const d = (x) => x / tempo;

  voice(nf(LEAD[i]), t, d(0.19), track.lead, 0.085, musicGain);
  // oktav ala egy halk masodik szolam, hogy teltebb legyen
  if (LEAD[i] !== '.') voice(nf(LEAD[i]) / 2, t, d(0.16), track.bassW, 0.045, musicGain);

  const b = BASS_BARS[bar];
  if (beat % 4 === 0) voice(nf(b[0]), t, d(0.17), track.bassW, 0.13, musicGain);
  else if (beat % 4 === 2) voice(nf(b[1]), t, d(0.13), track.bassW, 0.09, musicGain);

  if (beat === 2 || beat === 6) woodblock(t, 0.09);
  if (beat === 0) voice(track.thump, t, d(0.09), 'sine', 0.18, musicGain);
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
      nextT += eighth;
      step++;
    }
  }, 30);
}
