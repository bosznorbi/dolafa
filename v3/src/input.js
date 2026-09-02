// Input absztrakcio.
// A jatek logika SOHA nem olvas billentyukodot, csak ezt a fuggvenyt hivja.
// A v3-ban ide kotottuk be a ket USB kontrollert is.

import { pads } from './gamepad.js';

const down = new Set();

const MAP = [
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
 *
 * Magyar kiosztason ez egyszerre oldja meg a ket bosszantot:
 *   - a Z betus gomb Z-t jelent (nem az Y-os gombot kell nyomni),
 *   - a 0 a szamsor elejen (ott, ahol a magyar kiosztason van) mukodik,
 *     es a helyen levo 'ö' gomb is, mert az a fizikai Digit0.
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
 * Amig a kontroller-kapu nyitva van, a jatek NEM kap bemenetet. Kulonben az
 * a gombnyomas, amivel valaki kivalasztja magat 1. jatekosnak, egybol el is
 * inditana a meccset a kapu mogott.
 */
let suspended = false;

export function suspendInput(on) {
  suspended = !!on;
  if (suspended) down.clear();
}

function fire(code, shift) {
  if (suspended) return;
  for (const fn of listeners) fn(code, !!shift);
}

// ---------------------------------------------------------------- kontroller

/**
 * Az IRANYOK a jatekos sajat billentyukodjara fordulnak. Igy a menuben a ket
 * oldal ugyanazon az egy uton lepked, mint billentyuzettel, es a main.js nem
 * tud rola, hogy kontrollerrol jott a nyomas.
 *
 * A TOBBI gombot nem forditjuk billentyure: allapotonkent mast jelentenek
 * (az A a menuben jobbra lep a palyaracson, a meccs vegen viszont kilep a
 * menube), es egy billentyukod ezt nem tudna hordozni. Azokat az onPad()
 * kapja meg nyers gombneven.
 */
const padListeners = [];

export function onPad(fn) {
  padListeners.push(fn);
}

// A jatek MINDIG olvassa a padet, akkor is, ha a kapu billentyuzetre valtott:
// aki kozben megis bedug egy kontrollert, annak azonnal mukodjon.
pads.init({ keyboard: false, slots: 2 });

pads.onButton((slot, name, isDown) => {
  if (!isDown || suspended) return;
  const dir = MAP[slot] && MAP[slot][name];
  if (dir) { fire(dir, false); return; }
  for (const fn of padListeners) fn(name, slot);
});

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
    // gombnyomas ketszer valtana szint a menuben. A SHIFT allapotat kulon
    // adjuk at: van gomb, aminek shifttel mas a jelentese (SHIFT+R).
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

// Egyszeri lenyomast NE lekerdezessel figyelj, hanem az onKey() callbackkel:
// az pontosan egyszer fut le billentyu-lenyomasonkent.

/**
 * A ket jatekos iranyai. A kontroller es a billentyuzet EGYUTT el: aki
 * gepnel ul, az is beleszolhat, ha kell. A ketto vagy kapcsolatban van.
 */
export function getInput(playerIndex) {
  const m = MAP[playerIndex];
  if (!m || suspended) return { up: false, down: false, left: false, right: false };
  return {
    up: down.has(m.up) || pads.down(playerIndex, 'up'),
    down: down.has(m.down) || pads.down(playerIndex, 'down'),
    left: down.has(m.left) || pads.down(playerIndex, 'left'),
    right: down.has(m.right) || pads.down(playerIndex, 'right'),
  };
}

export function anyConfirm() {
  return down.has('Enter') || down.has('Space')
    || pads.anyDown('start') || pads.anyDown('a');
}

export { pads };
