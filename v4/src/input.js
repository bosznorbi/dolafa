// Input absztrakcio.
// A jatek logika SOHA nem olvas billentyukodot, csak ezt a fuggvenyt hivja.
//
// A v4-ben ide kotottuk be az ERINTEST is (erintes.js). Az elv ugyanaz, mint a
// billentyuzetnel: a jatek nem tudja, honnan jott a bemenet. A hüvelykujj-
// konzol iranyai ugyanugy a getInput()-ban jelennek meg, a koppintasok es a
// gombok pedig ugyanazon az onKey() uton, mint egy billentyu lenyomasa.

const down = new Set();

/** A ket jatekos billentyui. Az erintes is ezekre a kodokra fordit a menuben. */
export const MAP = [
  { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' },
  { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' },
];

const BLOCK = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter',
]);

/**
 * Kiosztasfuggetlen billentyuazonositas.
 *
 * A bongeszo ket dolgot ad egy lenyomasrol:
 *   e.key  = amit a gomb IR (magyar kiosztason a Z betus gomb tenyleg 'z'),
 *   e.code = a gomb FIZIKAI helye, angol kiosztas szerint elnevezve
 *            (ugyanaz a magyar Z gomb 'KeyY', mert ott van az angol Y).
 *
 * Nekunk az kell, ami a gombra van irva, tehat elsodleges a karakter. Ha az
 * nem sima betu vagy szam (Space, nyilak, ekezetes betuk, halott billentyuk),
 * akkor esunk vissza a fizikai pozciora.
 */
export function canonicalCode(e) {
  const k = e.key;
  if (k && k.length === 1) {
    const c = k.toLowerCase();
    if (c >= 'a' && c <= 'z') return 'Key' + c.toUpperCase();
    if (c >= '0' && c <= '9') return 'Digit' + c;
  }
  return e.code;
}

const listeners = [];

export function onKey(fn) {
  listeners.push(fn);
}

/**
 * Egy "lenyomas" kozvetlen kivaltasa. Az erintes-reteg ezzel szol a jateknak:
 * a koppintas Space-t, a sarokgombok a sajat billentyujuket kuldik, a menuben
 * a hüvelykujj-konzol pedig az adott oldal iranybillentyujet. A jatek szamara
 * ez megkulonboztethetetlen egy igazi billentyutol.
 */
export function fire(code, shift = false) {
  for (const fn of listeners) fn(code, !!shift);
}

export function initInput(target) {
  target.addEventListener('keydown', (e) => {
    if (BLOCK.has(e.code)) e.preventDefault();
    if (e.repeat) return;
    const code = canonicalCode(e);
    // A tartott billentyuk kozt MINDKETTO benne van: a mozgas igy akkor is
    // mukodik, ha valakinek a kiosztasan a WASD mas betuket ir.
    down.add(code);
    down.add(e.code);
    // Az egyszeri lenyomast viszont csak EGYSZER adjuk tovabb, kulonben egy
    // gombnyomas ketszer valtana szint a menuben.
    fire(code, e.shiftKey);
  });
  target.addEventListener('keyup', (e) => {
    if (BLOCK.has(e.code)) e.preventDefault();
    down.delete(canonicalCode(e));
    down.delete(e.code);
  });
  window.addEventListener('blur', () => down.clear());
}

export function isDown(code) {
  return down.has(code);
}

// ---------------------------------------------------------------- erintes

const SEMMI = { up: false, down: false, left: false, right: false };

/** Oldalankent a hüvelykujj-konzol pillanatnyi iranyai. */
const erintes = [{ ...SEMMI }, { ...SEMMI }];
let erintesAktiv = false;

/** Az erintes-reteg irja, minden ujjmozdulaskor. */
export function erintesIrany(playerIndex, d) {
  const e = erintes[playerIndex];
  if (!e) return;
  e.up = !!d.up; e.down = !!d.down; e.left = !!d.left; e.right = !!d.right;
}

export function erintesTorol(playerIndex) {
  erintesIrany(playerIndex, SEMMI);
}

/** Igaz, ha a latogato erintessel iranyit. A hud ebbol tudja, mit irjon ki. */
export function erintesVan() { return erintesAktiv; }
export function erintesBekapcsol() { erintesAktiv = true; }

/**
 * A ket jatekos iranyai. Billentyuzet, erintes es (ha van) kontroller VAGY
 * kapcsolatban: barmelyikrol jon a mozgas, az szamit.
 */
export function getInput(playerIndex) {
  const m = MAP[playerIndex];
  if (!m) return SEMMI;
  const e = erintes[playerIndex];
  const pad = readPad(playerIndex);
  return {
    up: down.has(m.up) || e.up || !!(pad && pad.up),
    down: down.has(m.down) || e.down || !!(pad && pad.down),
    left: down.has(m.left) || e.left || !!(pad && pad.left),
    right: down.has(m.right) || e.right || !!(pad && pad.right),
  };
}

// A v2-bol orokolt, passziv kontroller-olvasas. Ha nincs pad, null.
function readPad(i) {
  if (!navigator.getGamepads) return null;
  const pads = navigator.getGamepads();
  const p = pads && pads[i];
  if (!p) return null;
  const ax = p.axes[0] || 0;
  const ay = p.axes[1] || 0;
  const dz = 0.4;
  const b = p.buttons;
  return {
    up: ay < -dz || !!(b[12] && b[12].pressed),
    down: ay > dz || !!(b[13] && b[13].pressed),
    left: ax < -dz || !!(b[14] && b[14].pressed),
    right: ax > dz || !!(b[15] && b[15].pressed),
  };
}

export function anyConfirm() {
  return down.has('Enter') || down.has('Space');
}
