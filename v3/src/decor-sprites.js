// A napszakokhoz tartozo diszlet-sprite-ok, a patak es a favago-kunyho.
// Kulon fajlban, hogy a sprites.js ne noje ki magat.

import { W, H, CURRENT, mulberry32 } from './config.js';
import { makeCanvas } from './sprites.js';
import { propsOf } from './props.js';

/** Pixelsoros rajzolo: a diszlet-elemek mind igy keszulnek. */
function rows(w, h, def) {
  const { cv, c } = makeCanvas(w, h);
  for (let y = 0; y < def.rows.length; y++) {
    for (let x = 0; x < def.rows[y].length; x++) {
      const ch = def.rows[y][x];
      if (ch === '.') continue;
      c.fillStyle = def.pal[ch];
      c.fillRect(x, y, 1, 1);
    }
  }
  return cv;
}

function themeProps() {
  return propsOf((CURRENT.theme && CURRENT.theme.critters) || 'erdo');
}


function mirror(src) {
  const { cv, c } = makeCanvas(src.width, src.height);
  c.translate(src.width, 0);
  c.scale(-1, 1);
  c.drawImage(src, 0, 0);
  return cv;
}


export function buildMushrooms() {
  return themeProps().mushroom.map((d) => rows(5, 5, d));
}

export function buildRocks() {
  return themeProps().rock.map((d) => rows(5, 4, d));
}

export function buildCobweb() {
  return rows(7, 6, themeProps().web);
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
  const kind = (CURRENT.theme && CURRENT.theme.water) || 'stream';

  if (kind === 'dry') {
    // Kiszaradt meder: repedezett agyag, nincs benne viz.
    for (const p of pts) stamp(p.x, p.y, 5, '#8a7048');
    for (const p of pts) stamp(p.x, p.y, 4, '#a68a5c');
    for (const p of pts) stamp(p.x, p.y, 2, '#c0a46e');
    for (let i = 0; i < pts.length; i += 2) {
      const p = pts[i];
      c.fillStyle = '#6b5432';
      const l = 1 + ((rng() * 3) | 0);        // repedesek keresztben
      c.fillRect(Math.round(p.x), Math.round(p.y - l), 1, l * 2);
    }
    return { cv, pts };
  }

  if (kind === 'chalk') {
    // Kretavonal az asztalon: szaggatott, halvany, nem folyik sehova.
    for (let i = 0; i < pts.length; i++) {
      if ((i >> 2) % 2 === 0) continue;          // szaggatas
      stamp(pts[i].x, pts[i].y, 2, 'rgba(240,240,232,0.5)');
      stamp(pts[i].x, pts[i].y, 1, 'rgba(255,255,255,0.75)');
    }
    return { cv, pts };
  }

  if (kind === 'rainbow') {
    // Szivarvany-folyo HOSSZANTI atmenettel: a szin a meder menten valtozik,
    // nem keresztben. Igy az egyik veg lila, a masik piros, es kozben
    // folyamatosan atcsuszik a teljes szinskalan.
    const HUES = [300, 272, 240, 200, 150, 100, 55, 25, 350];
    const hueAt = (k) => {
      const f = k * (HUES.length - 1);
      const i0 = Math.min(HUES.length - 1, Math.floor(f));
      const i1 = Math.min(HUES.length - 1, i0 + 1);
      let a0 = HUES[i0];
      let a1 = HUES[i1];
      if (a1 - a0 > 180) a1 -= 360;
      if (a0 - a1 > 180) a1 += 360;
      return a0 + (a1 - a0) * (f - i0);
    };
    // A meder BOSEGESEN tullog a kepen, ezert a teljes hosszra teritett
    // atmenetbol csak egy kis szelet latszott (kb. sargatol cianig). A skalat
    // ezert a LATHATO szakaszra feszitjuk ki: igy a kepen belul vegigmegy a
    // szin lilatol pirosig.
    let iA = 0;
    let iB = pts.length - 1;
    const vis = (q) => q.x >= -6 && q.x <= W + 6 && q.y >= -6 && q.y <= H + 6;
    for (let i2 = 0; i2 < pts.length; i2++) { if (vis(pts[i2])) { iA = i2; break; } }
    for (let i2 = pts.length - 1; i2 >= 0; i2--) { if (vis(pts[i2])) { iB = i2; break; } }
    const span = Math.max(1, iB - iA);
    // A kepen belul is csak a PALYA-SZIGETRE esik ra a patak: a ket vegen
    // levago a tuzgyuru. Ezert nem a teljes lathato szakaszra teritjuk a
    // skalat, hanem a kozepso reszere - igy a szigeten belul tenyleg
    // vegigmegy lilatol pirosig, es nem csak ket-harom szin latszik.
    const kAt = (i2) => {
      const k = (i2 - iA) / span;
      return Math.max(0, Math.min(1, (k - 0.18) / 0.64));
    };

    // Kivulrol befele: sotet perem, telt kozep, vilagos csillanas.
    const LAYERS = [
      { r: 5, l: 34, sat: 78 },
      { r: 4, l: 50, sat: 88 },
      { r: 2, l: 66, sat: 92 },
    ];
    for (const L of LAYERS) {
      for (let i2 = 0; i2 < pts.length; i2++) {
        const h = hueAt(kAt(i2));
        stamp(pts[i2].x, pts[i2].y, L.r, 'hsl(' + h.toFixed(0) + ',' + L.sat + '%,' + L.l + '%)');
      }
    }
    for (let i2 = 0; i2 < pts.length; i2 += 4) {
      const p = pts[i2];
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.fillRect(Math.round(p.x + (rng() * 3 - 1.5)), Math.round(p.y), 1, 1);
    }
    return { cv, pts };
  }

  if (kind === 'syrup') {
    // Szirup-folyo: suru, fenyes, rozsaszin szalag.
    for (const p of pts) stamp(p.x, p.y, 5, '#c8306a');
    for (const p of pts) stamp(p.x, p.y, 4, '#f04a8a');
    for (const p of pts) stamp(p.x, p.y, 2, '#ff8ab8');
    for (let i = 0; i < pts.length; i += 3) {
      const p = pts[i];
      c.fillStyle = '#ffd8e8';
      c.fillRect(Math.round(p.x + (rng() * 3 - 1.5)), Math.round(p.y), 1, 1);
    }
    return { cv, pts };
  }

  if (kind === 'crack') {
    // Repedes a jegen: vekony, sotet vonal, kekes toressel a szelen.
    for (const p of pts) stamp(p.x, p.y, 3, '#b8d8e8');
    for (const p of pts) stamp(p.x, p.y, 2, '#5e8ca4');
    for (const p of pts) stamp(p.x, p.y, 1, '#22384a');
    for (let i = 0; i < pts.length; i += 5) {
      const p = pts[i];                        // oldalagak
      const dxr = rng() < 0.5 ? -1 : 1;
      c.fillStyle = '#34546b';
      for (let k = 1; k <= 3 + ((rng() * 3) | 0); k++) {
        c.fillRect(Math.round(p.x + dxr * k), Math.round(p.y + k * (rng() < 0.5 ? 1 : -1)), 1, 1);
      }
    }
    return { cv, pts };
  }

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

/**
 * A menedek, ahova a gyoztes befut a zarokepen. Temankent mas epulet, de
 * MINDEGYIK ugyanazt a szerzodest teljesiti: 34x30 vaszon, egy 9x14-es
 * ajtonyilas es egy kb. 13x11-es ablak, amiben megjelenik a gyoztes feje.
 */
const LANDMARK_PALS = {
  cabin: { a: '#6b4526', b: '#8a5c34', c: '#4a2f18', d: '#3c2614', glow: '#ffcf6a', glow2: '#ffe0a0' },
  crypt: { a: '#5e5e68', b: '#82828e', c: '#43434a', d: '#2e2e34', glow: '#8ae0b8', glow2: '#c0f4d8' },
  pyramid: { a: '#c0a46e', b: '#dcc492', c: '#8a7048', d: '#63512f', glow: '#ffcf6a', glow2: '#ffe8b0' },
  igloo: { a: '#c8dcea', b: '#eaf4ff', c: '#9ab4c8', d: '#6e8a9e', glow: '#8fd8ec', glow2: '#d8f4ff' },
  ufo: { a: '#8a939c', b: '#b8c2cc', c: '#5e666e', d: '#3a4048', glow: '#7cf0ff', glow2: '#d8fbff' },
  aztec: { a: '#7a8a52', b: '#a0b070', c: '#4a5a3a', d: '#2e3a24', glow: '#ffb04a', glow2: '#ffe0a0' },
  gingerbread: { a: '#c88a4a', b: '#e0a868', c: '#8a5628', d: '#5e3a1a', glow: '#ffd8e8', glow2: '#ffffff' },
  booth: { a: '#7a4a2c', b: '#9a6640', c: '#54301a', d: '#3a2010', glow: '#ffcf6a', glow2: '#ffe8b0' },
  stable: { a: '#e4dfd0', b: '#f4f0e4', c: '#8a6a44', d: '#5a4430', glow: '#ffcf6a', glow2: '#ffe8b0' },
  dominohouse: { a: '#f0f0ea', b: '#ffffff', c: '#b4b4ac', d: '#2a2a30', glow: '#ffe0a0', glow2: '#fff6d8' },
};

function landmarkKind() {
  return (CURRENT.theme && CURRENT.theme.landmark) || 'cabin';
}

function drawCabinBody(c, w, h, P) {
  const wallY = 11;
  for (let y = wallY; y < h - 1; y++) {
    const dark = (y - wallY) % 3 === 2;
    c.fillStyle = dark ? P.c : P.a;
    c.fillRect(3, y, w - 6, 1);
  }
  c.fillStyle = P.b;
  c.fillRect(3, wallY, 1, h - wallY - 1);
  c.fillStyle = P.d;
  c.fillRect(w - 4, wallY, 1, h - wallY - 1);
  for (let i = 0; i < 10; i++) {
    c.fillStyle = i % 2 ? '#3a2a1e' : '#4a372a';
    c.fillRect(1 + i, wallY - 1 - i, w - 2 - i * 2, 1);
  }
  c.fillStyle = '#5c4536';
  c.fillRect(0, wallY - 1, w, 2);
  c.fillStyle = '#4e4a46';
  c.fillRect(23, 1, 5, 7);                        // kemeny
  c.fillStyle = '#6b6660';
  c.fillRect(23, 1, 5, 1);
  return { doorX: 21, doorY: wallY + 4, winX: 5, winY: wallY + 3, winW: 13, winH: 11 };
}

function drawCrypt(c, w, h, P) {
  // Mauzoleum: haromszog oromzat, kereszt, ket pilaszter, es egy SOTET
  // kofulke. Uveg nincs rajta: a gyoztes a sotetbol nez ki.
  const wallY = 9;

  for (let y = wallY; y < h; y++) {              // kotomb-fal
    for (let x = 3; x < w - 3; x++) {
      const row = (y - wallY) / 4 | 0;
      const seam = (y - wallY) % 4 === 3 || (x + row * 3) % 7 === 0;
      c.fillStyle = seam ? P.c : P.a;
      c.fillRect(x, y, 1, 1);
    }
  }

  for (const px of [1, w - 4]) {                 // pilaszterek a sarkokon
    for (let y = wallY - 1; y < h; y++) {
      c.fillStyle = (y - wallY) % 5 === 4 ? P.c : P.b;
      c.fillRect(px, y, 3, 1);
    }
    c.fillStyle = P.d;
    c.fillRect(px + 2, wallY - 1, 1, h - wallY + 1);
  }

  c.fillStyle = P.b;                             // parkany
  c.fillRect(0, wallY - 2, w, 2);
  c.fillStyle = P.d;
  c.fillRect(0, wallY, w, 1);

  for (let i = 0; i < 8; i++) {                  // oromzat
    c.fillStyle = i % 2 ? P.c : P.a;
    c.fillRect(2 + i * 2, wallY - 3 - i, w - 4 - i * 4, 1);
  }
  c.fillStyle = P.b;                             // kereszt a csucson
  c.fillRect(16, 0, 2, 5);
  c.fillRect(14, 1, 6, 2);

  return { doorX: 21, doorY: 15, winX: 5, winY: 13, winW: 13, winH: 11, glass: false };
}

function drawPyramid(c, w, h, P) {
  // Lepcsos piramis: a lapos szintek miatt fer el rajta ablak es bejarat is.
  const steps = [
    { y0: 1, y1: 8, x0: 9, x1: 25 },
    { y0: 8, y1: 15, x0: 6, x1: 28 },
    { y0: 15, y1: 22, x0: 3, x1: 31 },
    { y0: 22, y1: h, x0: 0, x1: w },
  ];
  for (const st of steps) {
    for (let y = st.y0; y < st.y1; y++) {
      for (let x = st.x0; x < st.x1; x++) {
        const seam = (y - st.y0) % 3 === 2 || (x + y) % 9 === 0;
        c.fillStyle = seam ? P.c : P.a;
        c.fillRect(x, y, 1, 1);
      }
    }
    c.fillStyle = P.b;                            // napos felso el
    c.fillRect(st.x0, st.y0, st.x1 - st.x0, 1);
    c.fillStyle = P.d;
    c.fillRect(st.x1 - 1, st.y0, 1, st.y1 - st.y0);
  }
  c.fillStyle = P.b;                              // aranyozott csucs
  c.fillRect(14, 0, 6, 1);
  return { doorX: 20, doorY: 15, winX: 11, winY: 3, winW: 13, winH: 11, glass: false };
}

function drawIgloo(c, w, h, P) {
  const cx = w / 2;
  const ry = 26;
  for (let y = 3; y < h; y++) {
    const k = (h - 1 - y) / ry;
    const half = Math.round((w / 2 - 0.5) * Math.sqrt(Math.max(0, 1 - k * k)));
    for (let x = -half; x <= half; x++) {
      const px = Math.round(cx + x);
      if (px < 0 || px >= w) continue;
      const row = ((h - y) / 5) | 0;              // hoblokk-fugak, soronkent eltolva
      const seam = (h - y) % 5 === 0 || (px + row * 4) % 8 === 0;
      c.fillStyle = seam ? P.c : (x < -half + 3 ? P.b : P.a);
      c.fillRect(px, y, 1, 1);
    }
    c.fillStyle = P.d;
    c.fillRect(Math.round(cx + half), y, 1, 1);
  }
  c.fillStyle = P.b;                              // szellozo a tetejen
  c.fillRect(16, 2, 3, 2);
  return { doorX: 22, doorY: 17, winX: 8, winY: 9, winW: 13, winH: 11, glass: false };
}

function drawUfo(c, w, h, P) {
  const cx = w / 2;
  for (let y = 1; y < 13; y++) {                  // kupola
    const k = (13 - y) / 12;
    const half = Math.round(9 * Math.sqrt(Math.max(0, 1 - Math.pow(1 - k, 2))));
    for (let x = -half; x <= half; x++) {
      c.fillStyle = x < -half + 3 ? '#a8e8f4' : '#5ec8dc';
      c.fillRect(Math.round(cx + x), y, 1, 1);
    }
  }
  for (let y = 12; y < 21; y++) {                 // csészealj-test
    const k = Math.abs(y - 15.5) / 5.5;
    const half = Math.round((w / 2) * Math.sqrt(Math.max(0, 1 - k * k)));
    for (let x = -half; x <= half; x++) {
      const px = Math.round(cx + x);
      if (px < 0 || px >= w) continue;
      c.fillStyle = y < 15 ? P.b : (y > 17 ? P.c : P.a);
      c.fillRect(px, y, 1, 1);
    }
  }
  c.fillStyle = P.glow;                           // korbefuto lampak
  for (let i = 0; i < 5; i++) c.fillRect(4 + i * 7, 18, 2, 1);
  c.fillStyle = P.c;                              // leszallolabak
  c.fillRect(6, 20, 2, 8);
  c.fillRect(26, 20, 2, 8);
  c.fillStyle = P.d;
  c.fillRect(4, 27, 6, 2);
  c.fillRect(24, 27, 6, 2);
  c.fillStyle = P.a;                              // rampa
  c.fillRect(13, 20, 9, 9);
  c.fillStyle = P.c;
  c.fillRect(13, 20, 1, 9);
  c.fillRect(21, 20, 1, 9);
  return { doorX: 13, doorY: 15, winX: 10, winY: 2, winW: 13, winH: 10, glass: false };
}

function drawAztec(c, w, h, P) {
  // Aztek lepcsos templom: meredek oldalak, kozepen felvezeto lepcsosor,
  // a tetejen szentely ket fakloval.
  const steps = [
    { y0: 12, y1: 17, x0: 5, x1: 29 },
    { y0: 17, y1: 22, x0: 2, x1: 32 },
    { y0: 22, y1: h, x0: 0, x1: w },
  ];
  for (const st of steps) {
    for (let y = st.y0; y < st.y1; y++) {
      for (let x = st.x0; x < st.x1; x++) {
        const seam = (y - st.y0) % 2 === 1 || (x + y) % 7 === 0;
        c.fillStyle = seam ? P.c : P.a;
        c.fillRect(x, y, 1, 1);
      }
    }
    c.fillStyle = P.b;
    c.fillRect(st.x0, st.y0, st.x1 - st.x0, 1);
    c.fillStyle = P.d;
    c.fillRect(st.x1 - 1, st.y0, 1, st.y1 - st.y0);
  }
  // szentely a tetejen
  c.fillStyle = P.a;
  c.fillRect(8, 2, 18, 10);
  c.fillStyle = P.b;
  c.fillRect(8, 2, 18, 1);
  c.fillStyle = P.d;
  c.fillRect(25, 2, 1, 10);
  c.fillStyle = P.c;                            // oromdisz fesuje
  for (let i = 0; i < 5; i++) c.fillRect(9 + i * 4, 0, 2, 2);
  // felvezeto lepcsosor kozepen
  c.fillStyle = P.b;
  for (let y = 12; y < h; y += 2) c.fillRect(14, y, 6, 1);
  c.fillStyle = P.d;
  c.fillRect(13, 12, 1, h - 12);
  c.fillRect(20, 12, 1, h - 12);
  // ket fakla a szentely elott
  c.fillStyle = P.glow;
  c.fillRect(10, 4, 1, 2);
  c.fillRect(23, 4, 1, 2);
  return { doorX: 12, doorY: 15, winX: 10, winY: 3, winW: 13, winH: 9, glass: false };
}

function drawGingerbread(c, w, h, P) {
  // Mezeskalacs haz. A lenyeg a DISZITES: cukormaz-fodor a tetogerincen,
  // csepego maz a fal tetejen, cukorka-gombok, mezeskalacs-szivek es egy
  // csikos cukorrud a sarkokon.
  const wallY = 13;
  const ICING = '#fffdf6';
  const DOTS = ['#f04a8a', '#ffd257', '#7ad8e0', '#a86ae0', '#8ae06a'];

  // fal: sutott teszta, vizszintes sutesnyomokkal
  for (let y = wallY; y < h; y++) {
    for (let x = 3; x < w - 3; x++) {
      const seam = (y - wallY) % 6 === 5;
      c.fillStyle = seam ? P.c : P.a;
      c.fillRect(x, y, 1, 1);
    }
  }
  c.fillStyle = P.b;
  c.fillRect(3, wallY, 1, h - wallY);
  c.fillStyle = P.d;
  c.fillRect(w - 4, wallY, 1, h - wallY);

  // teto: nyeregteto, ket iranyba lejtve, sotetebb tesztabol
  for (let i = 0; i < 12; i++) {
    c.fillStyle = i % 3 === 2 ? P.d : P.c;
    c.fillRect(1 + i, wallY - 1 - i, w - 2 - i * 2, 1);
  }
  // cukormaz a tetogerincen es a teto szelein
  c.fillStyle = ICING;
  c.fillRect(15, 0, 4, 2);
  for (let i = 0; i < 12; i += 2) {
    c.fillRect(1 + i, wallY - 1 - i, 2, 1);
    c.fillRect(w - 3 - i, wallY - 1 - i, 2, 1);
  }
  // csepego maz a fal tetejen: valtozo hosszu cseppek
  const drip = [3, 1, 4, 2, 5, 2, 3, 1, 4, 2, 3, 1, 4, 2, 3, 1, 2];
  for (let x = 2; x < w - 2; x++) {
    const d = drip[(x - 2) % drip.length];
    c.fillStyle = ICING;
    c.fillRect(x, wallY - 1, 1, d);
  }

  // cukorka-gombok a fal ket oldalan
  for (let i = 0; i < 8; i++) {
    c.fillStyle = DOTS[i % DOTS.length];
    const gx = i < 4 ? 5 + (i % 2) * 4 : w - 9 + (i % 2) * 4;
    const gy = wallY + 6 + ((i % 4) >> 1) * 6;
    c.fillRect(gx, gy, 2, 2);
    c.fillStyle = ICING;
    c.fillRect(gx, gy, 1, 1);
  }

  // csikos cukorrud a ket sarkon
  for (const px of [2, w - 4]) {
    for (let y = wallY; y < h; y++) {
      c.fillStyle = (y + (px === 2 ? 0 : 1)) % 3 === 0 ? '#f04a8a' : ICING;
      c.fillRect(px, y, 2, 1);
    }
  }

  // mezeskalacs-sziv a homlokzat kozepen, maz-kerettel
  const hy = wallY + 3;
  c.fillStyle = '#f04a8a';
  c.fillRect(15, hy, 2, 1);
  c.fillRect(18, hy, 2, 1);
  c.fillRect(14, hy + 1, 7, 2);
  c.fillRect(15, hy + 3, 5, 1);
  c.fillRect(16, hy + 4, 3, 1);
  c.fillRect(17, hy + 5, 1, 1);
  c.fillStyle = ICING;
  c.fillRect(15, hy + 1, 1, 1);
  c.fillRect(19, hy + 1, 1, 1);

  return { doorX: 21, doorY: wallY + 4, winX: 5, winY: wallY + 3, winW: 13, winH: 11 };
}

/**
 * Tuzijatek-inditobodé: alacsony deszkabodé, csikos ponyvaval es egy nyitott
 * kiadoablakkal. Nincs uvege: onnan nez ki a gyoztes.
 */
function drawBooth(c, w, h, P) {
  const wallY = 13;
  for (let y = wallY; y < h - 1; y++) {          // fuggoleges deszkazat
    for (let x = 2; x < w - 2; x++) {
      c.fillStyle = x % 4 === 0 ? P.c : P.a;
      c.fillRect(x, y, 1, 1);
    }
  }
  c.fillStyle = P.b;
  c.fillRect(2, wallY, 1, h - wallY - 1);
  c.fillStyle = P.d;
  c.fillRect(w - 3, wallY, 1, h - wallY - 1);
  c.fillRect(2, h - 2, w - 4, 1);

  // csikos ponyva: piros-feher, elore lejtve
  for (let i = 0; i < 6; i++) {
    for (let x = 0; x < w; x++) {
      const band = ((x + i) / 4 | 0) % 2;
      c.fillStyle = band ? '#c83a30' : '#f0ece2';
      c.fillRect(x, wallY - 6 + i, 1, 1);
    }
  }
  c.fillStyle = '#8f2620';                       // a ponyva also fodra
  for (let x = 0; x < w; x += 2) c.fillRect(x, wallY, 1, 1);
  c.fillStyle = P.d;                             // tarto gerenda
  c.fillRect(0, wallY - 7, w, 1);

  // figyelmezteto tabla az oldalan
  c.fillStyle = '#f0d24a';
  c.fillRect(4, wallY + 3, 5, 5);
  c.fillStyle = '#2a2028';
  c.fillRect(6, wallY + 4, 1, 3);
  c.fillRect(6, wallY + 8 - 1, 1, 1);
  return { doorX: 21, doorY: wallY + 3, winX: 12, winY: wallY + 3, winW: 13, winH: 11, glass: false };
}

/**
 * Istallo: meszelt falu, sotet gerendavazas hollandus pajta, cserepteton
 * szelkakassal. A zold gaton ez ul meg igazan, nem egy voros teglakocka.
 */
function drawStable(c, w, h, P) {
  const roofH = 11;
  const wallY = roofH;

  // meszelt fal
  c.fillStyle = P.a;
  c.fillRect(2, wallY, w - 4, h - wallY - 1);
  c.fillStyle = P.b;
  c.fillRect(2, wallY, 1, h - wallY - 1);
  c.fillStyle = P.d;
  c.fillRect(w - 3, wallY, 1, h - wallY - 1);
  c.fillRect(2, h - 2, w - 4, 1);

  // sotet gerendavaz: ket fuggoleges oszlop es egy andraskereszt
  c.fillStyle = P.c;
  c.fillRect(6, wallY, 1, h - wallY - 2);
  c.fillRect(w - 7, wallY, 1, h - wallY - 2);
  c.fillRect(2, wallY + 8, w - 4, 1);
  for (let i = 0; i < 6; i++) {                  // ferde merevitok a sarkokban
    c.fillRect(3 + i, wallY + 1 + i, 1, 1);
    c.fillRect(w - 4 - i, wallY + 1 + i, 1, 1);
  }

  // cseréptető: voros, sorokba szedett cserepek
  for (let y = 0; y < roofH; y++) {
    const inset = Math.round(((roofH - 1 - y) / roofH) * 9);
    for (let x = inset; x < w - inset; x++) {
      const row = (y / 2) | 0;
      const tile = (x + row * 2) % 4 === 0;
      c.fillStyle = y % 2 === 1 ? '#8f4530' : (tile ? '#8f4530' : '#b85c3e');
      c.fillRect(x, y, 1, 1);
    }
    c.fillStyle = '#6b3222';
    c.fillRect(w - inset - 1, y, 1, 1);
  }
  c.fillStyle = '#d4795a';                       // gerinccserep
  c.fillRect(9, 0, w - 18, 1);
  c.fillStyle = P.d;                             // eresz
  c.fillRect(0, roofH, w, 1);

  c.fillStyle = '#2e2a26';                       // szelkakas a gerincen
  c.fillRect((w >> 1) - 1, -3 + 3, 1, 1);
  c.fillRect((w >> 1) - 1, 0, 1, 1);
  return { doorX: 22, doorY: wallY + 5, winX: 7, winY: wallY + 3, winW: 13, winH: 11 };
}

function drawDominoHouse(c, w, h, P) {
  // Dominohaz: egymasnak dontott lapokbol epult sator-sor, a tetejen egy
  // vizszintesen fektetett lappal. Latszik rajta, hogy barmikor osszedolhet.
  const pip = (x, y) => {
    c.fillStyle = P.d;
    c.fillRect(x, y, 2, 2);
  };
  const tile = (x, y, tw, th, lean) => {
    c.fillStyle = P.a;
    for (let yy = 0; yy < th; yy++) {
      const off = Math.round((yy / th) * lean);
      c.fillRect(x + off, y + yy, tw, 1);
    }
    c.fillStyle = P.b;
    c.fillRect(x, y, tw, 1);
    c.fillStyle = P.c;
    c.fillRect(x + lean, y + th - 1, tw, 1);
    c.fillStyle = P.d;
    c.fillRect(x + Math.round(lean / 2), y + (th >> 1), tw, 1);
  };

  // also sor: harom sator
  for (let i = 0; i < 3; i++) {
    const bx = 1 + i * 11;
    tile(bx, 14, 5, 16, 4);
    tile(bx + 9, 14, 5, 16, -4);
  }
  // vizszintes fedolap
  c.fillStyle = P.a;
  c.fillRect(1, 10, w - 2, 4);
  c.fillStyle = P.b;
  c.fillRect(1, 10, w - 2, 1);
  c.fillStyle = P.c;
  c.fillRect(1, 13, w - 2, 1);
  c.fillStyle = P.d;
  c.fillRect((w >> 1) - 1, 11, 1, 2);
  pip(6, 11);
  pip(25, 11);
  // felso sator
  tile(12, 0, 5, 11, 3);
  tile(18, 0, 5, 11, -3);
  return { doorX: 21, doorY: 15, winX: 5, winY: 15, winW: 13, winH: 11, glass: false };
}

/**
 * Harangtorony a temetobe. A HARANG NINCS rajta: azt kulon rajzoljuk, mert
 * kondulaskor kileng. A torony ugyanolyan allando elem, mint a menedek:
 * vegig ott all a palyan, es nem lehet atmenni rajta.
 */
export function buildBellTower() {
  const w = 19;
  const h = 40;
  const { cv, c } = makeCanvas(w, h);
  const P = { a: '#5e5e68', b: '#82828e', c: '#43434a', d: '#2e2e34' };

  // torony-test kotomb-rajzolattal
  for (let y = 12; y < h; y++) {
    for (let x = 2; x < w - 2; x++) {
      const row = ((y - 12) / 4) | 0;
      const seam = (y - 12) % 4 === 3 || (x + row * 3) % 6 === 0;
      c.fillStyle = seam ? P.c : P.a;
      c.fillRect(x, y, 1, 1);
    }
  }
  c.fillStyle = P.b;
  c.fillRect(2, 12, 1, h - 12);
  c.fillStyle = P.d;
  c.fillRect(w - 3, 12, 1, h - 12);

  // haranghaz: nyitott ivvel, hogy latszodjon a harang
  c.fillStyle = P.a;
  c.fillRect(1, 4, w - 2, 9);
  c.fillStyle = P.b;
  c.fillRect(1, 4, w - 2, 1);
  c.fillStyle = P.d;
  c.fillRect(w - 2, 4, 1, 9);
  c.fillStyle = '#14121a';                  // sotet nyilas
  c.fillRect(4, 6, w - 8, 7);
  for (let i = 0; i < 3; i++) {             // boltiv a nyilas tetejen
    c.fillStyle = P.c;
    c.fillRect(4 + i, 6 - i + 2, 1, 1);
    c.fillRect(w - 5 - i, 6 - i + 2, 1, 1);
  }

  // sisak a tetejen
  for (let i = 0; i < 5; i++) {
    c.fillStyle = i % 2 ? P.c : P.b;
    c.fillRect(1 + i, 4 - i, w - 2 - i * 2, 1);
  }
  c.fillStyle = '#c9a24a';                  // arany csucsdisz
  c.fillRect((w >> 1), 0, 1, 2);

  c.fillStyle = P.d;                        // talapzat
  c.fillRect(0, h - 3, w, 3);
  c.fillStyle = P.c;
  c.fillRect(0, h - 3, w, 1);

  return { cv, w, h, bellX: w >> 1, bellY: 6 };
}

/** Az arany harang. A forgaspontja a FELSO kozeppontja: onnan leng ki. */
export function buildBell() {
  const w = 9;
  const h = 9;
  const { cv, c } = makeCanvas(w, h);
  c.fillStyle = '#8a6c26';                  // felfuggesztes
  c.fillRect(4, 0, 1, 2);
  const rows = [
    '...###...',
    '..#####..',
    '.#######.',
    '.#######.',
    '#########',
    '#########',
    '.#######.',
  ];
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < w; x++) {
      if (rows[y][x] !== '#') continue;
      const edge = x === 0 || x === w - 1 || rows[y][x - 1] !== '#' || rows[y][x + 1] !== '#';
      c.fillStyle = x < 3 ? '#f0d488' : (edge ? '#8a6c26' : '#c9a24a');
      c.fillRect(x, y + 2, 1, 1);
    }
  }
  c.fillStyle = '#6b5220';                  // harangnyelv
  c.fillRect(4, 8, 1, 1);
  return cv;
}

export function buildCabin() {
  const w = 34;
  const h = 30;
  const kind = landmarkKind();
  const P = LANDMARK_PALS[kind] || LANDMARK_PALS.cabin;
  const { cv, c } = makeCanvas(w, h);
  const body = kind === 'booth' ? drawBooth
    : kind === 'stable' ? drawStable
      : kind === 'crypt' ? drawCrypt
        : kind === 'pyramid' ? drawPyramid
          : kind === 'igloo' ? drawIgloo
            : kind === 'ufo' ? drawUfo
              : kind === 'aztec' ? drawAztec
                : kind === 'gingerbread' ? drawGingerbread
                  : kind === 'dominohouse' ? drawDominoHouse
                    : drawCabinBody;
  const m = body(c, w, h, P);

  // A nyilas, ahol a gyoztes feje megjelenik a zarokepen. Van, ahol vilagito
  // ablak (kunyho, iglu, ufo), es van, ahol csak sotet kofulke (kripta).
  if (m.glass === false) {
    // Nincs uveg: puszta nyilas. A kriptanal koboltiv keretezi, az iglunal
    // es az ufonal viszont tenyleg csak egy lyuk a falon.
    c.fillStyle = P.c;
    c.fillRect(m.winX - 1, m.winY - 1, m.winW + 2, m.winH + 2);
    c.fillStyle = '#0c0b10';
    c.fillRect(m.winX, m.winY, m.winW, m.winH);
    if (kind === 'crypt') {
      for (let i = 0; i < 3; i++) {
        c.fillStyle = P.c;
        c.fillRect(m.winX + i, m.winY + 2 - i, 1, 1);
        c.fillRect(m.winX + m.winW - 1 - i, m.winY + 2 - i, 1, 1);
      }
    } else {
      for (let i = 0; i < 2; i++) {               // lekerekitett lyukperem
        c.fillStyle = P.c;
        c.fillRect(m.winX + i, m.winY + 1 - i, 1, 1);
        c.fillRect(m.winX + m.winW - 1 - i, m.winY + 1 - i, 1, 1);
        c.fillRect(m.winX + i, m.winY + m.winH - 2 + i, 1, 1);
        c.fillRect(m.winX + m.winW - 1 - i, m.winY + m.winH - 2 + i, 1, 1);
      }
    }
    c.fillStyle = P.d;
    c.fillRect(m.winX, m.winY + m.winH - 1, m.winW, 1);
  } else {
    c.fillStyle = P.d;
    c.fillRect(m.winX - 1, m.winY - 1, m.winW + 2, m.winH + 2);
    c.fillStyle = P.glow;
    c.fillRect(m.winX, m.winY, m.winW, m.winH);
    c.fillStyle = P.glow2;
    c.fillRect(m.winX, m.winY, m.winW, 2);
  }

  return Object.assign({ cv, w, h }, m);
}

export function buildCabinDoor(open) {
  const kind = landmarkKind();
  const P = LANDMARK_PALS[kind] || LANDMARK_PALS.cabin;
  const { cv, c } = makeCanvas(9, 14);
  c.fillStyle = P.d;
  c.fillRect(0, 0, 9, 14);
  if (open) {
    c.fillStyle = '#0d0a08';
    c.fillRect(1, 1, 7, 13);
    c.fillStyle = P.c;
    c.fillRect(7, 1, 1, 13);
  } else if (kind === 'gingerbread') {
    for (let y = 1; y < 14; y++) {
      c.fillStyle = y % 3 === 0 ? P.c : P.a;
      c.fillRect(1, y, 7, 1);
    }
    c.fillStyle = '#ffffff';                     // cukormaz-keret
    c.fillRect(1, 1, 7, 1);
    c.fillStyle = '#f04a8a';
    c.fillRect(6, 7, 1, 2);
  } else if (kind === 'ufo') {
    for (let y = 1; y < 14; y++) {
      c.fillStyle = y % 4 === 0 ? P.c : P.b;
      c.fillRect(1, y, 7, 1);
    }
    c.fillStyle = P.glow;
    c.fillRect(3, 6, 3, 2);
  } else {
    for (let y = 1; y < 14; y++) {
      c.fillStyle = y % 3 === 0 ? P.c : P.a;
      c.fillRect(1, y, 7, 1);
    }
    c.fillStyle = kind === 'cabin' ? '#c9a24a' : P.b;
    c.fillRect(6, 7, 1, 2);
  }
  return cv;
}

export function buildDecorSprites() {
  return {
    mushrooms: buildMushrooms(),
    rocks: buildRocks(),
    cobweb: buildCobweb(),
    cabin: buildCabin(),
    bellTower: buildBellTower(),
    bell: buildBell(),
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
  const kind = landmarkKind();
  const P = LANDMARK_PALS[kind] || LANDMARK_PALS.cabin;
  const { cv, c } = makeCanvas(15, 13);

  if (kind === 'crypt') {
    // Kobol faragott boltiv: nincs uveg, nincs kereszfa. Csak a nyilas
    // pereme latszik, es a sarkokban a ko.
    c.fillStyle = P.c;
    c.fillRect(0, 0, 15, 2);
    c.fillRect(0, 11, 15, 2);
    c.fillRect(0, 0, 2, 13);
    c.fillRect(13, 0, 2, 13);
    c.fillStyle = P.b;
    c.fillRect(0, 0, 15, 1);
    c.fillStyle = P.d;
    c.fillRect(0, 12, 15, 1);
    for (let i = 0; i < 4; i++) {                 // iv a felso sarkokban
      c.fillRect(2 + i, 2 + (3 - i) - 1, 1, 1);
      c.fillRect(12 - i, 2 + (3 - i) - 1, 1, 1);
      c.fillStyle = P.c;
      c.fillRect(2 + i, 2, 1, 3 - i);
      c.fillRect(12 - i, 2, 1, 3 - i);
    }
    return cv;
  }

  if (kind === 'ufo' || kind === 'igloo') {
    // Csak egy lyuk pereme: nincs uveg, nincs keresztfa.
    c.fillStyle = P.c;
    c.fillRect(0, 0, 15, 1);
    c.fillRect(0, 12, 15, 1);
    c.fillRect(0, 0, 1, 13);
    c.fillRect(14, 0, 1, 13);
    c.fillStyle = P.d;
    c.fillRect(1, 1, 2, 1);
    c.fillRect(12, 1, 2, 1);
    c.fillRect(1, 11, 2, 1);
    c.fillRect(12, 11, 2, 1);
    return cv;
  }

  // Kunyho es piramis: vaskos keret, felul-alul gerendaval.
  c.fillStyle = kind === 'pyramid' ? P.c : '#5e3d20';
  c.fillRect(0, 0, 15, 1);
  c.fillRect(0, 12, 15, 1);
  c.fillRect(0, 0, 1, 13);
  c.fillRect(14, 0, 1, 13);
  c.fillStyle = kind === 'pyramid' ? P.b : '#8a5c34';
  c.fillRect(1, 1, 13, 1);
  c.fillRect(1, 11, 13, 1);
  c.fillRect(1, 1, 1, 11);
  c.fillRect(13, 1, 1, 11);
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
