// A napszakokhoz tartozo diszlet-sprite-ok, a patak es a favago-kunyho.
// Kulon fajlban, hogy a sprites.js ne noje ki magat.

import { W, H, mulberry32 } from './config.js';
import { makeCanvas } from './sprites.js';

function critter(w, h, rows, pal) {
  const { cv, c } = makeCanvas(w, h);
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (ch === '.') continue;
      c.fillStyle = pal[ch];
      c.fillRect(x, y, 1, 1);
    }
  }
  return cv;
}

function mirror(src) {
  const { cv, c } = makeCanvas(src.width, src.height);
  c.translate(src.width, 0);
  c.scale(-1, 1);
  c.drawImage(src, 0, 0);
  return cv;
}

const PALS = {
  butterfly: { a: '#f4e58c', b: '#fffbe0', c: '#8a7a3a' },
  squirrel: { a: '#a8622c', b: '#c88a4a', c: '#6b3c18', e: '#1a1210' },
  bat: { a: '#3a3040', b: '#544a5c', e: '#e05a3c' },
  owl: { a: '#8a7358', b: '#b09a7c', c: '#5a4835', e: '#f0d24a', k: '#241c14' },
  bear: { a: '#6b4a34', b: '#8a6248', c: '#3e2a1e', e: '#f0d478' },
};

export function buildButterflies() {
  const up = ['.a.a.', 'aabaa', '.a.a.', '.....'];
  const dn = ['.....', '.aba.', 'aabaa', '.a.a.'];
  const r = [critter(5, 4, up, PALS.butterfly), critter(5, 4, dn, PALS.butterfly)];
  return { right: r, left: r };
}

export function buildSquirrels() {
  const a = ['..aa...', '.aaaa..', 'aa.aaaa', 'aaaaaab', '.aa.aa.', '.a...a.'];
  const b = ['..aa...', '.aaaa..', 'aa.aaaa', 'aaaaaab', '.a...a.', 'a.....a'];
  const r = [critter(7, 6, a, PALS.squirrel), critter(7, 6, b, PALS.squirrel)];
  return { right: r, left: r.map(mirror) };
}

export function buildBats() {
  const up = ['aa...aa', '.aa.aa.', '..aaa..', '..a.a..'];
  const dn = ['.......', 'aa...aa', '.aaaaa.', '..a.a..'];
  const r = [critter(7, 4, up, PALS.bat), critter(7, 4, dn, PALS.bat)];
  return { right: r, left: r.map(mirror) };
}

export function buildOwls() {
  const open = ['.aaaaa.', 'aeaaaea', 'aaacaaa', 'abbbba.', 'abbbba.', '.aaaaa.', '..c.c..'];
  const shut = ['.aaaaa.', 'akaaaka', 'aaacaaa', 'abbbba.', 'abbbba.', '.aaaaa.', '..c.c..'];
  // A bagoly ul, tehat nincs iranya: sima ket-kepkockas lista.
  return [critter(7, 7, open, PALS.owl), critter(7, 7, shut, PALS.owl)];
}

export function buildBears() {
  const a = [
    '.aa..........aa',
    'aaaa........aaaa',
    '.aaaaaaaaaaaaa.',
    'aaaaaaaaaaaaaea',
    'baaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaa.',
    '.aaaaaaaaaaaa..',
    '.cc.......cc...',
    '.cc.......cc...',
  ];
  const b = [
    '.aa..........aa',
    'aaaa........aaaa',
    '.aaaaaaaaaaaaa.',
    'aaaaaaaaaaaaaea',
    'baaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaa.',
    '.aaaaaaaaaaaa..',
    'cc..........cc.',
    '.cc........cc..',
  ];
  const rim = (cv) => {
    const c = cv.getContext('2d');
    c.fillStyle = '#9a7458';
    c.fillRect(2, 2, 11, 1);
    c.fillRect(1, 3, 1, 2);
    return cv;
  };
  const r = [rim(critter(15, 10, a, PALS.bear)), rim(critter(15, 10, b, PALS.bear))];
  return { right: r, left: r.map(mirror) };
}

export function buildMushrooms() {
  const caps = [['#c8402f', '#e8705c'], ['#b8863a', '#d8a85c'], ['#8a5c9a', '#a87ab8']];
  return caps.map((p) => {
    const { cv, c } = makeCanvas(5, 5);
    c.fillStyle = '#e8dfc8';
    c.fillRect(2, 3, 1, 2);
    c.fillStyle = p[0];
    c.fillRect(1, 1, 3, 2);
    c.fillRect(0, 2, 5, 1);
    c.fillStyle = p[1];
    c.fillRect(1, 1, 2, 1);
    c.fillStyle = '#fff0e0';
    c.fillRect(3, 2, 1, 1);
    return cv;
  });
}

export function buildRocks() {
  return [0, 1].map((i) => {
    const { cv, c } = makeCanvas(5, 4);
    c.fillStyle = '#4e5250';
    c.fillRect(i ? 0 : 1, 1, i ? 5 : 4, 3);
    c.fillStyle = '#6b706c';
    c.fillRect(i ? 1 : 2, 1, 2, 1);
    c.fillStyle = '#3a3e3c';
    c.fillRect(i ? 0 : 1, 3, i ? 5 : 4, 1);
    return cv;
  });
}

export function buildCobweb() {
  const { cv, c } = makeCanvas(7, 6);
  c.fillStyle = 'rgba(214,222,232,0.55)';
  for (let i = 0; i < 6; i++) c.fillRect(i, i, 1, 1);
  for (let i = 0; i < 6; i++) c.fillRect(6 - i, i, 1, 1);
  c.fillRect(0, 0, 7, 1);
  c.fillStyle = 'rgba(214,222,232,0.35)';
  c.fillRect(1, 2, 5, 1);
  c.fillRect(2, 4, 3, 1);
  return cv;
}

/** Kanyargo keskeny patak. Tisztan grafikai elem, nincs jatekhatasa. */
export function buildStream(seed) {
  const rng = mulberry32((seed ^ 0x7ea51) >>> 0);
  const { cv, c } = makeCanvas(W, H);
  // Mindig a palya EGYIK szeletol a masikig fut, es mindig hosszan: a
  // szoget vizszintes koruli savbol sorsoljuk, tehat a 320 pixeles oldalt
  // szeli at, nem a rovid 180-asat.
  const n = 260;
  const ang = (rng() * 2 - 1) * 0.72;          // kb. +/- 41 fok
  const off = (rng() * 2 - 1) * 46;            // eltolas a kozeptol
  const midX = W / 2 - Math.sin(ang) * off;
  const midY = H / 2 + Math.cos(ang) * off;
  // Bosegesen tullog a kepen: a kanyargas a vegeket befele huzhatja, es
  // akkor a patak a kepen belul erne veget egy csonkkal.
  const half = 340;
  const A = { x: midX - Math.cos(ang) * half, y: midY - Math.sin(ang) * half };
  const B = { x: midX + Math.cos(ang) * half, y: midY + Math.sin(ang) * half };
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  // Harom oktav, hatarozott amplitudoval. A frekvenciakat ugy valasztjuk,
  // hogy a KEPEN LATHATO szakaszra harom-negy kanyar essen: az elozo verzio
  // egyetlen lapos hajlast rajzolt, ami majdnem egyenesnek latszott.
  const waves = [
    { f: 2.2 + rng() * 1.4, a: 17 + rng() * 9, p: rng() * 6.28 },
    { f: 4.5 + rng() * 2.0, a: 8 + rng() * 5, p: rng() * 6.28 },
    { f: 8.0 + rng() * 3.0, a: 3 + rng() * 3, p: rng() * 6.28 },
  ];

  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    let off = 0;
    for (const w of waves) off += Math.sin(t * Math.PI * 2 * w.f + w.p) * w.a;
    pts.push({ x: A.x + dx * t + nx * off, y: A.y + dy * t + ny * off });
  }

  const stamp = (x, y, r, col) => {
    c.fillStyle = col;
    for (let dy = -r; dy <= r; dy++) {
      const w = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
      if (w > 0) c.fillRect(Math.round(x - w), Math.round(y + dy), w * 2, 1);
    }
  };
  for (const p of pts) stamp(p.x, p.y, 5, '#2f5a6b');
  for (const p of pts) stamp(p.x, p.y, 4, '#3d7d96');
  for (const p of pts) stamp(p.x, p.y, 2, '#4f9cb8');
  for (let i = 0; i < pts.length; i += 3) {
    const p = pts[i];
    c.fillStyle = '#8fd0e0';
    c.fillRect(Math.round(p.x + (rng() * 3 - 1.5)), Math.round(p.y), 1, 1);
  }
  return { cv, pts };
}

/** Egyszemelyes favago-menedek: a gyoztes ide fut be a zarokepen. */
export function buildCabin() {
  const w = 34;
  const h = 30;
  const { cv, c } = makeCanvas(w, h);
  const wallY = 11;

  for (let y = wallY; y < h - 1; y++) {
    const dark = (y - wallY) % 3 === 2;
    c.fillStyle = dark ? '#4a2f18' : '#6b4526';
    c.fillRect(3, y, w - 6, 1);
  }
  c.fillStyle = '#8a5c34';
  c.fillRect(3, wallY, 1, h - wallY - 1);
  c.fillStyle = '#3c2614';
  c.fillRect(w - 4, wallY, 1, h - wallY - 1);

  for (let i = 0; i < 10; i++) {
    c.fillStyle = i % 2 ? '#3a2a1e' : '#4a372a';
    c.fillRect(1 + i, wallY - 1 - i, w - 2 - i * 2, 1);
  }
  c.fillStyle = '#5c4536';
  c.fillRect(0, wallY - 1, w, 2);

  c.fillStyle = '#4e4a46';
  c.fillRect(23, 1, 5, 7);
  c.fillStyle = '#6b6660';
  c.fillRect(23, 1, 5, 1);

  // Nagy ablak: a zarokepen ide kerul a kinezo favago feje.
  c.fillStyle = '#2a1a0e';
  c.fillRect(4, wallY + 2, 15, 13);
  c.fillStyle = '#ffcf6a';
  c.fillRect(5, wallY + 3, 13, 11);
  c.fillStyle = '#ffe0a0';
  c.fillRect(5, wallY + 3, 13, 2);

  return {
    cv, doorX: 21, doorY: wallY + 4, w, h,
    winX: 5, winY: wallY + 3, winW: 13, winH: 11,
  };
}

export function buildCabinDoor(open) {
  const { cv, c } = makeCanvas(9, 14);
  c.fillStyle = '#2a1a0e';
  c.fillRect(0, 0, 9, 14);
  if (open) {
    c.fillStyle = '#140c06';
    c.fillRect(1, 1, 7, 13);
    c.fillStyle = '#3a2618';
    c.fillRect(7, 1, 1, 13);
  } else {
    for (let y = 1; y < 14; y++) {
      c.fillStyle = y % 3 === 0 ? '#4a2f18' : '#5e3d20';
      c.fillRect(1, y, 7, 1);
    }
    c.fillStyle = '#c9a24a';
    c.fillRect(6, 7, 1, 2);
  }
  return cv;
}

export function buildDecorSprites() {
  return {
    butterfly: buildButterflies(),
    squirrel: buildSquirrels(),
    bat: buildBats(),
    owl: buildOwls(),
    bear: buildBears(),
    mushrooms: buildMushrooms(),
    rocks: buildRocks(),
    cobweb: buildCobweb(),
    cabin: buildCabin(),
    windowFrame: buildWindowFrame(),
    clouds: buildClouds(),
    doorOpen: buildCabinDoor(true),
    doorShut: buildCabinDoor(false),
  };
}

/**
 * Az ablak kerete. A zarokepen a favago feje ELE kerul, tehat tenyleg az
 * ablak mogul nez ki. Fuggoleges osztas szandekosan NINCS: ezen a mereten
 * ketté vagna az arcot, es nem lehetne felismerni.
 */
export function buildWindowFrame() {
  const { cv, c } = makeCanvas(15, 13);
  c.fillStyle = '#5e3d20';
  c.fillRect(0, 0, 15, 1);
  c.fillRect(0, 12, 15, 1);
  c.fillRect(0, 0, 1, 13);
  c.fillRect(14, 0, 1, 13);
  c.fillStyle = '#8a5c34';
  c.fillRect(1, 3, 13, 1);      // vizszintes osztas a homlok elott
  c.fillStyle = '#3c2614';
  c.fillRect(1, 4, 13, 1);
  c.fillRect(1, 11, 13, 1);
  return cv;
}

/** Elszallo felho-arnyekok. Felulnezetben ez a helyes: arnyek, nem feher folt. */
export function buildClouds() {
  return [0, 1, 2].map((k) => {
    const w = 52 + k * 14;
    const h = 16 + k * 4;
    const { cv, c } = makeCanvas(w, h);
    const rng = mulberry32(9000 + k * 131);
    c.fillStyle = 'rgba(20,26,34,1)';
    for (let i = 0; i < 7 + k * 2; i++) {
      const bx = 6 + rng() * (w - 14);
      const by = 3 + rng() * (h - 8);
      const br = 4 + rng() * 6;
      for (let y = -br; y <= br; y++) {
        const ww = Math.round(Math.sqrt(Math.max(0, br * br - y * y)) * 1.5);
        if (ww > 0) c.fillRect(Math.round(bx - ww), Math.round(by + y * 0.6), ww * 2, 1);
      }
    }
    return cv;
  });
}
