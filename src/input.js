// Input absztrakcio.
// A jatek logika SOHA nem olvas billentyukodot, csak ezt a fuggvenyt hivja.
// Igy a retro USB kontroller bekotese kesobb csak ennek a fajlnak a dolga.

const down = new Set();

const MAP = [
  { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' },
  { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' },
];

const BLOCK = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter',
]);

const listeners = [];

export function onKey(fn) {
  listeners.push(fn);
}

export function initInput(target) {
  target.addEventListener('keydown', (e) => {
    if (BLOCK.has(e.code)) e.preventDefault();
    if (e.repeat) return;
    down.add(e.code);
    for (const fn of listeners) fn(e.code);
  });
  target.addEventListener('keyup', (e) => {
    if (BLOCK.has(e.code)) e.preventDefault();
    down.delete(e.code);
  });
  window.addEventListener('blur', () => down.clear());
}

export function isDown(code) {
  return down.has(code);
}

// Egyszeri lenyomast NE lekerdezessel figyelj, hanem az onKey() callbackkel:
// az pontosan egyszer fut le billentyu-lenyomasonkent.

const EMPTY = { up: false, down: false, left: false, right: false };

/**
 * A ket jatekos iranyai. Kesobb ide jon a Gamepad API is:
 * ha van csatlakoztatott kontroller a playerIndex-hez, azt olvassuk billentyu helyett.
 */
export function getInput(playerIndex) {
  const m = MAP[playerIndex];
  if (!m) return EMPTY;
  const pad = readPad(playerIndex);
  if (pad) return pad;
  return {
    up: down.has(m.up),
    down: down.has(m.down),
    left: down.has(m.left),
    right: down.has(m.right),
  };
}

// Elokeszites a nosztalgia kontrollerhez. Ha nincs pad, null-t ad vissza.
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
