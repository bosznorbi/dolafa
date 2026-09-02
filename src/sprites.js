// Minden grafika kodbol generalodik, fix palettaval.
// Igy nincs kulso asset, a stilus garantaltan konzisztens, es a csapat
// barmelyik elemet atirhatja anelkul, hogy a tobbihez nyulna.

import { W, H, PAL, TEAM, TREE_KINDS, mulberry32 } from './config.js';
import { drawGlyph } from './font.js';
import { buildDecorSprites } from './decor-sprites.js';

export function makeCanvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  return { cv, c };
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function pick(rng, arr) {
  return arr[(rng() * arr.length) | 0];
}

// ---------------------------------------------------------------- talaj

function noiseFill(c, w, h, colors, rng, weights) {
  const img = c.createImageData(w, h);
  const d = img.data;
  const rgb = colors.map(hexToRgb);
  const acc = [];
  let sum = 0;
  for (let i = 0; i < colors.length; i++) {
    sum += weights ? weights[i] : 1;
    acc.push(sum);
  }
  for (let i = 0; i < w * h; i++) {
    const r = rng() * sum;
    let k = 0;
    while (k < acc.length - 1 && r > acc[k]) k++;
    d[i * 4] = rgb[k][0];
    d[i * 4 + 1] = rgb[k][1];
    d[i * 4 + 2] = rgb[k][2];
    d[i * 4 + 3] = 255;
  }
  c.putImageData(img, 0, 0);
}

export function buildGround(seed) {
  const rng = mulberry32(seed);
  const { cv, c } = makeCanvas(W, H);
  noiseFill(c, W, H, PAL.grass, rng, [10, 4, 4, 2]);

  // nagyobb sotetebb foltok, hogy ne legyen egyenletes a zaj
  for (let i = 0; i < 26; i++) {
    const bx = rng() * W;
    const by = rng() * H;
    const br = 8 + rng() * 20;
    c.fillStyle = PAL.grassDark;
    c.globalAlpha = 0.16 + rng() * 0.14;
    for (let y = -br; y <= br; y++) {
      const span = Math.sqrt(Math.max(0, br * br - y * y)) * (0.7 + rng() * 0.5);
      c.fillRect(Math.round(bx - span), Math.round(by + y), Math.round(span * 2), 1);
    }
    c.globalAlpha = 1;
  }

  // fuszalak
  for (let i = 0; i < 900; i++) {
    const x = (rng() * W) | 0;
    const y = (rng() * H) | 0;
    c.fillStyle = rng() < 0.55 ? '#548a42' : '#325a2a';
    c.fillRect(x, y, 1, 1 + ((rng() * 2) | 0));
  }

  // apro viragok es kavicsok
  for (let i = 0; i < 46; i++) {
    const x = (rng() * (W - 4)) | 0;
    const y = (rng() * (H - 4)) | 0;
    if (rng() < 0.6) {
      c.fillStyle = pick(rng, PAL.bloom);
      c.fillRect(x, y, 2, 1);
      c.fillRect(x, y + 1, 1, 1);
    } else {
      c.fillStyle = '#6e7264';
      c.fillRect(x, y, 3, 2);
      c.fillStyle = '#8b8f80';
      c.fillRect(x, y, 2, 1);
    }
  }

  // bokrok, hogy legyen melyseg
  for (let i = 0; i < 20; i++) {
    const x = (rng() * (W - 8)) | 0;
    const y = (rng() * (H - 6)) | 0;
    c.fillStyle = '#25502a';
    c.fillRect(x + 1, y + 1, 5, 3);
    c.fillRect(x, y + 2, 7, 2);
    c.fillStyle = '#356e37';
    c.fillRect(x + 1, y + 1, 4, 2);
    c.fillStyle = '#48884a';
    c.fillRect(x + 2, y + 1, 2, 1);
  }
  return cv;
}

export function buildBurnt(seed) {
  const rng = mulberry32(seed ^ 0x9e37);
  const { cv, c } = makeCanvas(W, H);
  noiseFill(c, W, H, PAL.burnt, rng, [10, 5, 6, 2]);

  // hamu es meg izzo parazs
  for (let i = 0; i < 700; i++) {
    const x = (rng() * W) | 0;
    const y = (rng() * H) | 0;
    c.fillStyle = PAL.ash;
    c.globalAlpha = 0.25 + rng() * 0.5;
    c.fillRect(x, y, 1, 1);
  }
  c.globalAlpha = 1;
  for (let i = 0; i < 150; i++) {
    const x = (rng() * W) | 0;
    const y = (rng() * H) | 0;
    c.fillStyle = pick(rng, PAL.ember);
    c.globalAlpha = 0.5 + rng() * 0.5;
    c.fillRect(x, y, 1, 1);
    if (rng() < 0.3) c.fillRect(x + 1, y, 1, 1);
  }
  c.globalAlpha = 1;

  // elszenesedett tuskek
  for (let i = 0; i < 34; i++) {
    const x = (rng() * (W - 6)) | 0;
    const y = (rng() * (H - 6)) | 0;
    c.fillStyle = '#120d0b';
    c.fillRect(x, y + 2, 5, 3);
    c.fillStyle = PAL.charLight;
    c.fillRect(x + 1, y + 2, 3, 1);
  }
  return cv;
}

// ---------------------------------------------------------------- fa

const TREE_COLS = {
  live: {
    trunk: '#5a3b22', trunkLight: '#754d2c', trunkDark: '#3c2614',
    dark: '#1c3d22', mid: '#2f6435', light: '#43844a', hi: '#5da357',
  },
  char: {
    trunk: '#2b2320', trunkLight: '#3a2f2a', trunkDark: '#171211',
    dark: '#141010', mid: '#241d1a', light: '#332a25', hi: '#453931',
  },
};

function drawPine(c, w, h, cols, rng) {
  const cx = w >> 1;
  const trunkH = Math.max(6, Math.round(h * 0.24));
  const trunkW = w >= 18 ? 5 : 4;
  const tx = cx - (trunkW >> 1);
  const ty = h - trunkH;

  c.fillStyle = cols.trunk;
  c.fillRect(tx, ty, trunkW, trunkH);
  c.fillStyle = cols.trunkLight;
  c.fillRect(tx, ty, 1, trunkH);
  c.fillStyle = cols.trunkDark;
  c.fillRect(tx + trunkW - 1, ty, 1, trunkH);
  c.fillRect(tx - 1, h - 2, trunkW + 2, 2);

  const layers = 3;
  const canopyBot = ty + 3;
  const layerH = canopyBot / layers;
  for (let i = 0; i < layers; i++) {
    const top = Math.round(i * layerH * 0.72);
    const bot = Math.round(top + layerH * 1.25);
    const maxHalf = ((i + 1) / layers) * (w / 2) - 0.15;
    for (let y = top; y <= bot && y < canopyBot; y++) {
      const t = (y - top) / Math.max(1, bot - top);
      const half = Math.max(1, Math.round(maxHalf * Math.pow(t, 0.75)));
      const x0 = cx - half;
      const ww = half * 2 + 1;
      c.fillStyle = cols.mid;
      c.fillRect(x0, y, ww, 1);
      c.fillStyle = cols.light;
      c.fillRect(x0 + 1, y, Math.max(1, Math.round(ww * 0.34)), 1);
      c.fillStyle = cols.dark;
      c.fillRect(x0, y, 1, 1);
      c.fillRect(x0 + ww - 1, y, 1, 1);
      if (y === Math.min(bot, canopyBot - 1)) {
        c.fillStyle = cols.dark;
        c.fillRect(x0, y, ww, 1);
      }
    }
  }
  // csillano tuk
  for (let i = 0; i < Math.round(w * 0.9); i++) {
    const x = 1 + ((rng() * (w - 2)) | 0);
    const y = 1 + ((rng() * (canopyBot - 2)) | 0);
    c.fillStyle = cols.hi;
    c.fillRect(x, y, 1, 1);
  }
}

export function buildTrees() {
  return TREE_KINDS.map((v, i) => {
    const rng = mulberry32(1000 + i * 77);
    const live = makeCanvas(v.w, v.h);
    drawPine(live.c, v.w, v.h, TREE_COLS.live, rng);
    const rng2 = mulberry32(1000 + i * 77);
    const char = makeCanvas(v.w, v.h);
    drawPine(char.c, v.w, v.h, TREE_COLS.char, rng2);
    return { cv: live.cv, char: char.cv, sil: silhouette(live.cv, '#0b0806'), w: v.w, h: v.h };
  });
}

// Kidolt fa: hosszanti torzs vagott veggel + lelapult korona.
// A tovegponttol jobbra mutat, a tobbi iranyt 90 fokos forgatassal kapjuk,
// igy pixelpontos marad.
function drawFallenPine(c, L, T, cols, rng) {
  const cy = T / 2;
  const trunkLen = Math.round(L * 0.34);
  const th = Math.max(4, Math.round(T * 0.34));
  const ty = Math.round(cy - th / 2);

  c.fillStyle = cols.trunk;
  c.fillRect(0, ty, trunkLen + 2, th);
  c.fillStyle = cols.trunkLight;
  c.fillRect(0, ty, trunkLen + 2, 1);
  c.fillStyle = cols.trunkDark;
  c.fillRect(0, ty + th - 1, trunkLen + 2, 1);
  for (let i = 0; i < trunkLen; i += 3) {
    c.fillStyle = cols.trunkDark;
    c.fillRect(2 + i, ty + 1 + ((i / 3) % 2 | 0), 1, 1);
  }
  // vagott veg evgyuruvel
  c.fillStyle = '#b98a52';
  c.fillRect(0, ty, 2, th);
  c.fillStyle = '#8a5c34';
  c.fillRect(0, ty + 1, 2, 1);
  c.fillRect(0, ty + th - 2, 2, 1);

  const start = trunkLen - 1;
  const peak = 0.2;
  for (let x = start; x < L; x++) {
    const t = (x - start) / Math.max(1, L - 1 - start);
    const k = Math.pow(t < peak ? t / peak : 1 - (t - peak) / (1 - peak), 0.55);
    const half = Math.max(1, Math.round((T / 2 - 0.4) * k));
    const y0 = Math.round(cy - half);
    const hh = half * 2 + 1;
    c.fillStyle = cols.mid;
    c.fillRect(x, y0, 1, hh);
    c.fillStyle = cols.light;
    c.fillRect(x, y0 + 1, 1, Math.max(1, Math.round(hh * 0.34)));
    c.fillStyle = cols.dark;
    c.fillRect(x, y0, 1, 1);
    c.fillRect(x, y0 + hh - 1, 1, 1);
  }
  for (let i = 0; i < Math.round(L * 0.5); i++) {
    const x = start + ((rng() * (L - start)) | 0);
    const y = 1 + ((rng() * (T - 2)) | 0);
    c.fillStyle = cols.hi;
    c.fillRect(x, y, 1, 1);
  }
}

// Egyszinu sziluett: minden nem-atlatszo pixel egy szinre. A menu fasorahoz.
export function silhouette(src, col) {
  const { cv, c } = makeCanvas(src.width, src.height);
  c.drawImage(src, 0, 0);
  c.globalCompositeOperation = 'source-in';
  c.fillStyle = col;
  c.fillRect(0, 0, src.width, src.height);
  return cv;
}

function rot(src, quarter) {
  const w = src.width;
  const h = src.height;
  const swap = quarter % 2 === 1;
  const { cv, c } = makeCanvas(swap ? h : w, swap ? w : h);
  if (quarter === 1) { c.translate(h, 0); c.rotate(Math.PI / 2); }
  else if (quarter === 2) { c.translate(w, h); c.rotate(Math.PI); }
  else if (quarter === 3) { c.translate(0, w); c.rotate(-Math.PI / 2); }
  c.drawImage(src, 0, 0);
  return cv;
}

export function buildFallen() {
  return TREE_KINDS.map((v, i) => {
    const L = v.h;
    const T = Math.max(11, Math.round(v.w * 0.82));
    const live = makeCanvas(L, T);
    drawFallenPine(live.c, L, T, TREE_COLS.live, mulberry32(2000 + i * 13));
    const chr = makeCanvas(L, T);
    drawFallenPine(chr.c, L, T, TREE_COLS.char, mulberry32(2000 + i * 13));
    return {
      L, T,
      right: live.cv, down: rot(live.cv, 1), left: rot(live.cv, 2), up: rot(live.cv, 3),
      charRight: chr.cv, charDown: rot(chr.cv, 1), charLeft: rot(chr.cv, 2), charUp: rot(chr.cv, 3),
    };
  });
}

export function buildStump() {
  const { cv, c } = makeCanvas(9, 6);
  c.fillStyle = '#3c2614';
  c.fillRect(1, 2, 7, 4);
  c.fillStyle = '#5a3b22';
  c.fillRect(1, 1, 7, 3);
  c.fillStyle = PAL.woodPale;
  c.fillRect(2, 1, 5, 2);
  c.fillStyle = '#8a5c34';
  c.fillRect(3, 1, 3, 1);
  c.fillStyle = '#6b4526';
  c.fillRect(4, 2, 1, 1);
  return cv;
}

// ---------------------------------------------------------------- favago

/** Otfele fejszeforma: nyelhossz, fej-magassag, melyseg es ketelu-e. */
const AXES = {
  classic: { len: 1.0, half: 2, depth: 1, edge: 1.7, both: false, handle: '#8a6234' },
  wide: { len: 0.92, half: 3, depth: 1, edge: 1.9, both: false, handle: '#7a5a3a' },
  double: { len: 1.0, half: 2, depth: 1, edge: 1.7, both: true, handle: '#6b4a2a' },
  small: { len: 0.7, half: 1, depth: 1, edge: 1.5, both: false, handle: '#9a7040' },
  long: { len: 1.35, half: 2, depth: 0, edge: 1.4, both: false, handle: '#6f5230' },
};

function drawAxe(c, ox, oy, ang, len, flip, kind) {
  const k = AXES[kind] || AXES.classic;
  const a = flip ? Math.PI - ang : ang;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const L = len * k.len;

  c.fillStyle = k.handle;
  for (let i = 0; i <= L; i++) {
    c.fillRect(Math.round(ox + dx * i), Math.round(oy + dy * i), 1, 1);
  }
  c.fillStyle = '#5e401f';
  c.fillRect(Math.round(ox + dx * (L * 0.5)), Math.round(oy + dy * (L * 0.5)), 1, 1);

  const hx = ox + dx * L;
  const hy = oy + dy * L;
  const px = -dy;
  const py = dx;

  const head = (sign) => {
    c.fillStyle = '#9aa5b0';
    for (let b = -k.depth; b <= k.depth; b++) {
      for (let sp = -k.half; sp <= k.half; sp++) {
        c.fillRect(
          Math.round(hx + px * sp + dx * b * sign),
          Math.round(hy + py * sp + dy * b * sign), 1, 1,
        );
      }
    }
    c.fillStyle = '#dfe6ec';
    for (let sp = -k.half; sp <= k.half; sp++) {
      c.fillRect(
        Math.round(hx + px * sp + dx * k.edge * sign),
        Math.round(hy + py * sp + dy * k.edge * sign), 1, 1,
      );
    }
  };
  head(1);
  if (k.both) head(-1);
  c.fillStyle = '#5b646d';
  c.fillRect(Math.round(hx - dx), Math.round(hy - dy), 1, 1);
}

// A vaszon szelesebb a testnel: a zold favago mellett kutya sétál porazon.
const BODY_W = 20;
const PAD = 4;
const SW = BODY_W + PAD * 2;
const SH = 24;

const DOG = {
  a: '#8a6238', b: '#b08a58', c: '#5a3f22', k: '#241810', e: '#f0e0c0',
};

/** Kis kutya ket kepkockaval. A porazt a hivo huzza a kezhez. */
function drawDog(c, x, y, frame) {
  const rows = frame
    ? ['..k..k..', '.bbbbbb.', 'aaaaaaa.', 'aaaaaaaa', '.a.aa.a.', '.a.aa.a.']
    : ['..k..k..', '.bbbbbb.', 'aaaaaaa.', 'aaaaaaaa', 'a.a..a.a', 'a.a..a.a'];
  for (let ry = 0; ry < rows.length; ry++) {
    for (let rx = 0; rx < 8; rx++) {
      const ch = rows[ry][rx];
      if (ch === '.') continue;
      c.fillStyle = DOG[ch] || DOG.a;
      c.fillRect(x + rx, y + ry, 1, 1);
    }
  }
  c.fillStyle = DOG.k;
  c.fillRect(x + 5, y + 1, 1, 1);          // szem
  c.fillStyle = DOG.c;
  c.fillRect(x + 7, y + 2, 1, 1);          // farok
  c.fillRect(x + 7, y + 1, 1, 1);
}

/** Soroskorso es borospohar a fejsze helyett. */
function drawDrinks(c, hx, hy, flip) {
  const s2 = flip ? -1 : 1;
  // korso a fejsze kezeben
  c.fillStyle = '#c98a24';
  c.fillRect(hx, hy - 4, 3, 4);
  c.fillStyle = '#e8b44a';
  c.fillRect(hx, hy - 4, 1, 4);
  c.fillStyle = '#fff4d8';
  c.fillRect(hx, hy - 5, 3, 1);            // hab
  c.fillStyle = '#8a5c1c';
  c.fillRect(hx + 3 * (flip ? -1 : 1), hy - 3, 1, 2);  // ful
  // borospohar a masik kezben
  const gx = hx - s2 * 11;
  c.fillStyle = '#8e2440';
  c.fillRect(gx, hy - 5, 3, 2);
  c.fillStyle = '#c8425e';
  c.fillRect(gx, hy - 5, 3, 1);
  c.fillStyle = '#cfd6dd';
  c.fillRect(gx + 1, hy - 3, 1, 3);
  c.fillRect(gx, hy, 3, 1);
}

function drawJack(c, dir, pose, chop, t) {
  const back = dir === 'up';
  const side = dir === 'left' || dir === 'right';
  const bob = chop >= 0 ? 0 : [0, -1, 0, -1][pose];
  const legOff = chop >= 0 ? 0 : [0, 1, 0, -1][pose];
  const lean = chop === 2 ? 1 : 0;
  const y0 = bob + lean;

  // labak: nadrag, vagy alsogatya + csupasz lab
  const lx = side ? 8 : 7;
  const undies = t.legs === 'underwear';
  if (undies) {
    c.fillStyle = t.skin;
    c.fillRect(lx - legOff, 19, 3, 4);
    c.fillRect(lx + 3 + legOff, 19, 3, 4);
    c.fillStyle = t.skinDark;
    c.fillRect(lx - legOff, 21, 3, 1);
    c.fillRect(lx + 3 + legOff, 21, 3, 1);
    c.fillStyle = t.pants;              // maga az alsogatya
    c.fillRect(lx - legOff - 1, 18, 8, 2);
    c.fillStyle = t.pantsDark;
    c.fillRect(lx - legOff - 1, 19, 8, 1);
  } else {
    c.fillStyle = t.pants;
    c.fillRect(lx - legOff, 19, 3, 4);
    c.fillRect(lx + 3 + legOff, 19, 3, 4);
    c.fillStyle = t.pantsDark;
    c.fillRect(lx - legOff, 21, 3, 1);
    c.fillRect(lx + 3 + legOff, 21, 3, 1);
  }
  c.fillStyle = t.boot;
  c.fillRect(lx - legOff - 1, 22, 4, 2);
  c.fillRect(lx + 3 + legOff, 22, 4, 2);

  // torzso. A noi alak keskenyebb, es hosszu haja van (lasd lentebb).
  const fem = t.body === 'female';
  const bx = side ? (fem ? 8 : 7) : (fem ? 7 : 6);
  const bw = side ? (fem ? 6 : 7) : (fem ? 7 : 8);
  c.fillStyle = t.shirt;
  c.fillRect(bx, 13 + y0, bw, 5);
  if (t.pattern === 'plaid') {
    c.fillStyle = t.shirtDark;
    c.fillRect(bx + 1, 13 + y0, 1, 5);
    c.fillRect(bx + bw - 3, 13 + y0, 1, 5);
    c.fillRect(bx, 15 + y0, bw, 1);
    c.fillStyle = t.shirtDeep;
    c.fillRect(bx + 1, 15 + y0, 1, 1);
    c.fillRect(bx + bw - 3, 15 + y0, 1, 1);
  } else if (t.pattern === 'stripe') {
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 14 + y0, bw, 1);
    c.fillRect(bx, 16 + y0, bw, 1);
  } else if (t.pattern === 'dots') {
    c.fillStyle = t.shirtDark;
    for (let dy2 = 0; dy2 < 5; dy2 += 2) {
      for (let dx2 = (dy2 / 2) % 2; dx2 < bw; dx2 += 3) {
        c.fillRect(bx + dx2, 13 + y0 + dy2, 1, 1);
      }
    }
  } else if (t.pattern === 'vstripe') {
    c.fillStyle = t.shirtDark;
    for (let dx2 = 1; dx2 < bw; dx2 += 2) c.fillRect(bx + dx2, 13 + y0, 1, 5);
  } else {
    // sima ing, hozzaadott nadragtartoval
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 13 + y0, bw, 1);
    c.fillStyle = '#3f2a18';
    c.fillRect(bx + 1, 13 + y0, 1, 5);
    c.fillRect(bx + bw - 2, 13 + y0, 1, 5);
  }
  c.fillStyle = t.shirtDeep;
  c.fillRect(bx, 17 + y0, bw, 1);

  // ov
  c.fillStyle = '#3f2a18';
  c.fillRect(bx, 18 + y0, bw, 1);
  c.fillStyle = '#c9a24a';
  c.fillRect(bx + (bw >> 1) - 1, 18 + y0, 2, 1);

  // karok
  c.fillStyle = t.shirtDark;
  if (side) {
    c.fillRect(dir === 'right' ? 13 : 6, 13 + y0, 2, 4);
  } else {
    c.fillRect(4, 13 + y0, 2, 4);
    c.fillRect(14, 13 + y0, 2, 4);
  }
  c.fillStyle = t.skin;
  if (side) c.fillRect(dir === 'right' ? 13 : 6, 17 + y0, 2, 1);
  else {
    c.fillRect(4, 17 + y0, 2, 1);
    c.fillRect(14, 17 + y0, 2, 1);
  }

  // fej
  const hx = side ? (dir === 'right' ? 8 : 7) : 7;
  c.fillStyle = t.skin;
  c.fillRect(hx, 7 + y0, 6, 5);
  c.fillStyle = t.skinDark;
  c.fillRect(hx, 7 + y0, 1, 5);

  if (back) {
    c.fillStyle = t.hair;
    c.fillRect(hx, 7 + y0, 6, 5);
    if (t.hat === 'none') {
      c.fillStyle = t.skinDark;      // kopasz folt hatulrol is latszik
      c.fillRect(hx + 1, 7 + y0, 4, 2);
    }
    c.fillStyle = t.beardDark;
    if (t.beard !== 'none') c.fillRect(hx, 10 + y0, 6, t.beard === 'long' ? 3 : 2);
  } else if (side) {
    // profil: orr es egy szem
    const f = dir === 'right' ? 1 : -1;
    c.fillStyle = '#1e1410';
    c.fillRect(hx + (dir === 'right' ? 4 : 1), 9 + y0, 1, 1);
    c.fillStyle = t.skinDark;
    c.fillRect(hx + (dir === 'right' ? 6 : -1), 9 + y0, 1, 1);
    c.fillStyle = t.beardCol;
    if (t.beard === 'mous') c.fillRect(hx + 1, 10 + y0, 5, 1);
    else if (t.beard === 'goatee') c.fillRect(hx + 2, 10 + y0, 3, 3);
    else if (t.beard === 'sideburns') c.fillRect(hx + 1, 8 + y0, 1, 4);
    else if (t.beard === 'none') { /* borotvalt */ }
    else c.fillRect(hx + 1, 10 + y0, 5, t.beard === 'long' ? 5 : 3);
    c.fillStyle = t.beardDark;
    if (t.beard === 'full' || t.beard === 'long') {
      c.fillRect(hx + 1, (t.beard === 'long' ? 14 : 12) + y0, 5, 1);
    }
  } else {
    c.fillStyle = '#1e1410';
    c.fillRect(hx + 1, 9 + y0, 1, 1);
    c.fillRect(hx + 4, 9 + y0, 1, 1);
    c.fillStyle = t.beardCol;
    if (t.beard === 'mous') {
      c.fillRect(hx, 10 + y0, 6, 1);
    } else if (t.beard === 'goatee') {
      c.fillRect(hx + 1, 10 + y0, 4, 1);
      c.fillRect(hx + 2, 11 + y0, 2, 3);
    } else if (t.beard === 'sideburns') {
      c.fillRect(hx - 1, 7 + y0, 1, 5);
      c.fillRect(hx + 6, 7 + y0, 1, 5);
    } else if (t.beard === 'none') {
      c.fillStyle = t.skin;
      c.fillRect(hx, 10 + y0, 6, 2);
    } else if (t.beard === 'long') {
      c.fillRect(hx - 1, 10 + y0, 8, 5);
      c.fillStyle = t.beardDark;
      c.fillRect(hx, 14 + y0, 6, 1);
      c.fillStyle = t.beardCol;
    } else {
      c.fillRect(hx - 1, 10 + y0, 8, 3);
      c.fillStyle = t.beardDark;
      c.fillRect(hx - 1, 12 + y0, 8, 1);
    }
    c.fillStyle = t.skin;
    if (t.beard === 'full' || t.beard === 'long' || t.beard === 'goatee') {
      c.fillRect(hx + 2, 10 + y0, 2, 1);
    }
  }

  // Hosszu haj a noi alakoknak: a fej ket oldalan a vallig er.
  if (fem) {
    c.fillStyle = t.hair;
    if (back) {
      c.fillRect(hx - 1, 6 + y0, 8, 9);
      c.fillStyle = t.hairDark || t.hair;
      c.fillRect(hx - 1, 13 + y0, 8, 2);
    } else {
      c.fillRect(hx - 1, 5 + y0, 2, 9);
      c.fillRect(hx + 5, 5 + y0, 2, 9);
      c.fillRect(hx, 4 + y0, 6, 2);
      c.fillStyle = t.hairDark || t.hair;
      c.fillRect(hx - 1, 12 + y0, 2, 2);
      c.fillRect(hx + 5, 12 + y0, 2, 2);
    }
  }

  // fejfedo
  if (t.hat === 'cap') {
    c.fillStyle = t.cap;
    c.fillRect(hx, 4 + y0, 6, 3);
    c.fillStyle = t.capDark;
    c.fillRect(hx, 4 + y0, 6, 1);
    c.fillRect(hx - 1, 7 + y0, 8, 1);      // ellenzo
    c.fillStyle = t.cap;
    c.fillRect(hx + 1, 5 + y0, 4, 1);
  } else if (t.hat === 'beanie') {
    c.fillStyle = t.cap;
    c.fillRect(hx, 4 + y0, 6, 3);
    c.fillRect(hx + 1, 3 + y0, 4, 1);
    c.fillStyle = t.capDark;
    c.fillRect(hx, 6 + y0, 6, 1);          // felhajtott perem
    c.fillStyle = '#e8dfc8';
    c.fillRect(hx + 2, 2 + y0, 2, 1);      // bojt
  } else if (t.hat === 'brim') {
    c.fillStyle = t.capDark;
    c.fillRect(hx - 2, 6 + y0, 10, 1);     // szeles karima
    c.fillRect(hx - 1, 7 + y0, 8, 1);
    c.fillStyle = t.cap;
    c.fillRect(hx, 3 + y0, 6, 3);
    c.fillStyle = t.capDark;
    c.fillRect(hx, 5 + y0, 6, 1);
  } else if (t.hat === 'bandana') {
    c.fillStyle = t.cap;
    c.fillRect(hx, 5 + y0, 6, 2);
    c.fillStyle = t.capDark;
    c.fillRect(hx, 6 + y0, 6, 1);
    c.fillRect(hx + 5, 7 + y0, 2, 3);      // hatul lelogo csucs
  } else if (t.hat === 'usanka') {
    c.fillStyle = t.cap;
    c.fillRect(hx, 3 + y0, 6, 4);
    c.fillStyle = t.capDark;
    c.fillRect(hx - 1, 6 + y0, 8, 2);      // szorme-perem
    c.fillRect(hx - 1, 8 + y0, 1, 2);      // fulvedok
    c.fillRect(hx + 6, 8 + y0, 1, 2);
    c.fillStyle = t.cap;
    c.fillRect(hx + 1, 4 + y0, 4, 1);
  } else if (t.hat === 'headband') {
    c.fillStyle = t.hair;
    c.fillRect(hx, 4 + y0, 6, 3);
    c.fillStyle = t.cap;
    c.fillRect(hx - 1, 6 + y0, 8, 1);      // pant
    c.fillStyle = t.capDark;
    c.fillRect(hx - 1, 7 + y0, 1, 2);
  } else if (t.hat === 'helmet') {
    c.fillStyle = t.cap;
    c.fillRect(hx, 3 + y0, 6, 4);
    c.fillRect(hx + 1, 2 + y0, 4, 1);
    c.fillStyle = t.capDark;
    c.fillRect(hx - 1, 6 + y0, 8, 1);
    c.fillRect(hx, 5 + y0, 6, 1);
    c.fillStyle = '#e8dfc8';
    c.fillRect(hx + 2, 3 + y0, 2, 1);      // csillano tetopont
  } else {
    // kopasz, oldalt maradt hajjal
    c.fillStyle = t.skin;
    c.fillRect(hx + 1, 5 + y0, 4, 2);
    c.fillStyle = t.skinDark;
    c.fillRect(hx + 1, 5 + y0, 4, 1);
    c.fillStyle = t.hair;
    c.fillRect(hx - 1, 6 + y0, 2, 3);
    c.fillRect(hx + 5, 6 + y0, 2, 3);
  }

  // fejsze
  let ang;
  if (chop === 0) ang = -2.35;
  else if (chop === 1) ang = -1.15;
  else if (chop === 2) ang = 0.3;
  else ang = -1.0;
  const len = chop === 2 ? 9 : 8;
  const flip = back || dir === 'left';
  const ax = flip ? 5 : 15;
  const ay = 17 + y0;
  if (t.axe === 'none' || t.drinks) drawDrinks(c, ax, ay, flip);
  else drawAxe(c, ax, ay, ang, len, flip, t.axe);
}

function renderJack(t, src, pose, chop) {
  const b = makeCanvas(SW, SH);
  b.c.save();
  b.c.translate(PAD, 0);
  drawJack(b.c, src, pose, chop, t);
  b.c.restore();
  if (t.dog) {
    const f = chop >= 0 ? 0 : pose % 2;
    const dy = f ? 0 : 1;
    drawDog(b.c, 0, 17 + dy, f);
    // poraz a kez fele
    b.c.fillStyle = '#5a3f22';
    for (let i = 0; i < 5; i++) {
      b.c.fillRect(7 + i, 17 + dy - Math.round(i * 0.9), 1, 1);
    }
  }
  return b.cv;
}

export function buildPlayers() {
  const out = [];
  for (let ti = 0; ti < TEAM.length; ti++) {
    const t = TEAM[ti];
    const byDir = {};
    for (const dir of ['down', 'up', 'right', 'left']) {
      const src = dir === 'left' ? 'right' : dir;
      const walk = [];
      for (let p = 0; p < 4; p++) {
        const cv = renderJack(t, src, p, -1);
        walk.push(dir === 'left' ? mirror(cv) : cv);
      }
      const chop = [];
      for (let k = 0; k < 3; k++) {
        const cv = renderJack(t, src, 0, k);
        chop.push(dir === 'left' ? mirror(cv) : cv);
      }
      byDir[dir] = { walk, chop };
    }
    out.push(byDir);
  }
  return out;
}

function mirror(src) {
  const { cv, c } = makeCanvas(src.width, src.height);
  c.translate(src.width, 0);
  c.scale(-1, 1);
  c.drawImage(src, 0, 0);
  return cv;
}

export const PLAYER_SPRITE = { w: SW, h: SH, footX: 10 + PAD, footY: 23 };

// ---------------------------------------------------------------- tuz

export function buildFlames() {
  const frames = [];
  const fw = 7;
  const fh = 12;
  for (let f = 0; f < 6; f++) {
    const rng = mulberry32(4200 + f * 31);
    const { cv, c } = makeCanvas(fw, fh);
    for (let y = 0; y < fh; y++) {
      const t = y / (fh - 1); // 0 = csucs, 1 = to
      let hw = 0.4 + (fw / 2 - 0.4) * Math.pow(t, 0.6);
      hw *= 0.72 + rng() * 0.55;
      const sway = (1 - t) * (rng() * 2 - 1) * 1.7;
      const cx = fw / 2 + sway;
      const x0 = Math.round(cx - hw);
      const x1 = Math.round(cx + hw);
      if (t < 0.2 && rng() < 0.45) continue;
      for (let x = x0; x <= x1; x++) {
        if (x < 0 || x >= fw) continue;
        const edge = x === x0 || x === x1;
        let col;
        if (t > 0.74) col = edge ? PAL.fire[2] : Math.abs(x - cx) < hw * 0.45 ? PAL.fire[0] : PAL.fire[1];
        else if (t > 0.42) col = edge ? PAL.fire[3] : PAL.fire[2];
        else col = edge ? PAL.fire[4] : PAL.fire[3];
        c.fillStyle = col;
        c.fillRect(x, y, 1, 1);
      }
    }
    frames.push(cv);
  }
  return { frames, w: fw, h: fh };
}


// ---------------------------------------------------------------- egitest

export function buildSun() {
  const { cv, c } = makeCanvas(17, 17);
  const cx = 8;
  // sugarak
  c.fillStyle = '#ffd24a';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    c.fillRect(Math.round(cx + Math.cos(a) * 7), Math.round(cx + Math.sin(a) * 7), 2, 2);
  }
  // korong
  for (let y = -5; y <= 5; y++) {
    const w = Math.round(Math.sqrt(Math.max(0, 25 - y * y)));
    c.fillStyle = y < -1 ? '#fff0a8' : '#ffcc38';
    c.fillRect(cx - w, cx + y, w * 2 + 1, 1);
  }
  c.fillStyle = '#fff6d0';
  c.fillRect(cx - 3, cx - 4, 3, 2);
  return cv;
}

export function buildMoon() {
  const { cv, c } = makeCanvas(15, 15);
  const cx = 7;
  for (let y = -5; y <= 5; y++) {
    const w = Math.round(Math.sqrt(Math.max(0, 25 - y * y)));
    c.fillStyle = '#e6ecf5';
    c.fillRect(cx - w, cx + y, w * 2 + 1, 1);
  }
  // kivagas, hogy sarlo legyen
  c.globalCompositeOperation = 'destination-out';
  for (let y = -6; y <= 6; y++) {
    const w = Math.round(Math.sqrt(Math.max(0, 30 - y * y)));
    c.fillRect(cx - w + 6, cx + y, w * 2 + 1, 1);
  }
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#b9c4d4';
  c.fillRect(cx - 3, cx - 1, 2, 2);
  c.fillRect(cx - 4, cx + 2, 1, 1);
  return cv;
}

// ---------------------------------------------------------------- dekoracio

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

const BUNNY_PAL = { a: '#d8d2c6', b: '#f0ece2', c: '#8a8478', e: '#e88ea0', k: '#2a2420' };

export function buildBunnies() {
  // ulo es ugro allas, mindket iranyban
  const sit = [
    '..aa...',
    '..aa...',
    '.aaa...',
    'aaaaaa.',
    'aaaaaaa',
    'caaaaac',
    '.c...c.',
  ];
  const hop = [
    '.aa.aa.',
    '.aa.aa.',
    '.aaaa..',
    'aaaaaa.',
    'faaaaaa',
    'caaaaac',
    'c.....c',
  ];
  const pal = Object.assign({ f: '#f0ece2' }, BUNNY_PAL);
  const r = [critter(7, 7, sit, pal), critter(7, 7, hop, pal)];
  return { right: r, left: r.map(mirror) };
}

const WOLF_PAL = { a: '#5a5f68', b: '#767c86', c: '#3a3e45', e: '#e8c445', k: '#20232a' };

export function buildWolves() {
  const w1 = [
    '..........a',
    'aa......aaa',
    'aaaaaaaaeaa',
    'baaaaaaaaaa',
    'aaaaaaaaaa.',
    'c.c....c.c.',
    'c.c....c.c.',
  ];
  const w2 = [
    '..........a',
    'aa......aaa',
    'aaaaaaaaeaa',
    'baaaaaaaaaa',
    'aaaaaaaaaa.',
    '.cc....cc..',
    'c..c..c..c.',
  ];
  const r = [critter(11, 7, w1, WOLF_PAL), critter(11, 7, w2, WOLF_PAL)];
  return { right: r, left: r.map(mirror) };
}

export function buildFlowers() {
  const cols = [['#e8d24a', '#fff0a8'], ['#e07aa8', '#f6b8d0'], ['#8ab8e8', '#c8e0f6'], ['#f0f0e8', '#ffffff']];
  return cols.map((p) => {
    const { cv, c } = makeCanvas(3, 4);
    c.fillStyle = '#3c6b32';
    c.fillRect(1, 2, 1, 2);
    c.fillStyle = p[0];
    c.fillRect(0, 1, 3, 1);
    c.fillRect(1, 0, 1, 2);
    c.fillStyle = p[1];
    c.fillRect(1, 1, 1, 1);
    return cv;
  });
}

export function buildBirds() {
  const up = ['.a...a.', 'a.a.a.a', '..aaa..'];
  const dn = ['.......', 'aa...aa', '..aaa..'];
  const pal = { a: '#2a2a30' };
  return [critter(7, 3, up, pal), critter(7, 3, dn, pal)];
}


/** Hangszoro ikon, athuzott valtozattal. */
export function buildSpeaker(muted) {
  const { cv, c } = makeCanvas(11, 9);
  const col = '#e8dfc8';
  c.fillStyle = col;
  c.fillRect(1, 3, 2, 3);          // doboz
  c.fillRect(3, 2, 1, 5);
  c.fillRect(4, 1, 1, 7);
  c.fillRect(5, 0, 1, 9);
  if (!muted) {
    c.fillStyle = '#c8bca4';
    c.fillRect(7, 3, 1, 3);        // hanghullamok
    c.fillRect(8, 2, 1, 1);
    c.fillRect(8, 6, 1, 1);
    c.fillRect(9, 1, 1, 1);
    c.fillRect(9, 7, 1, 1);
    c.fillRect(10, 3, 1, 3);
  } else {
    c.fillStyle = '#ff6a4a';       // athuzas
    for (let i = 0; i < 8; i++) c.fillRect(2 + i, 8 - i, 1, 1);
    c.fillStyle = '#2a0d06';
    for (let i = 0; i < 8; i++) c.fillRect(2 + i, 9 - i, 1, 1);
  }
  return cv;
}

// ---------------------------------------------------------------- UI ikonok

export function buildHeart(filled) {
  const rows = [
    '.##.##.',
    '#######',
    '#######',
    '.#####.',
    '..###..',
    '...#...',
  ];
  const { cv, c } = makeCanvas(7, 6);
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < 7; x++) {
      if (rows[y][x] !== '#') continue;
      const edge =
        y === 0 || y === rows.length - 1 ||
        rows[y][x - 1] !== '#' || rows[y][x + 1] !== '#' ||
        !rows[y - 1] || rows[y - 1][x] !== '#' ||
        !rows[y + 1] || rows[y + 1][x] !== '#';
      if (filled) c.fillStyle = edge ? '#8c2418' : y <= 1 ? '#f0674a' : PAL.heart;
      else if (!edge) continue;
      else c.fillStyle = PAL.heartDark;
      c.fillRect(x, y, 1, 1);
    }
  }
  if (filled) {
    c.fillStyle = '#ff9b84';
    c.fillRect(1, 1, 2, 1);
  }
  return cv;
}

// Nyilbillentyuk ikonja a menuhoz: harom also + egy felso gomb, mint a valosagban.
const ARROWS = {
  up:    ['..#..', '.###.', '#####', '..#..', '..#..'],
  down:  ['..#..', '..#..', '#####', '.###.', '..#..'],
  left:  ['..#..', '.##..', '#####', '.##..', '..#..'],
  right: ['..#..', '..##.', '#####', '..##.', '..#..'],
};

const KEY = 11;
const KGAP = 1;

function keyCap(c, x, y, tint) {
  c.fillStyle = '#150f0a';
  c.fillRect(x, y, KEY, KEY);
  c.fillStyle = tint ? '#d8ccae' : '#c8bca4';
  c.fillRect(x + 1, y + 1, KEY - 2, KEY - 3);
  c.fillStyle = '#877c67';
  c.fillRect(x + 1, y + KEY - 2, KEY - 2, 1);
  c.fillStyle = '#efe6cf';
  c.fillRect(x + 1, y + 1, KEY - 2, 1);
}

/** Harom also + egy felso gomb, mint a valosagban. */
function buildKeyCluster(faces) {
  const w = KEY * 3 + KGAP * 2;
  const h = KEY * 2 + KGAP;
  const { cv, c } = makeCanvas(w, h);
  const slots = [
    [KEY + KGAP, 0, faces[0]],
    [0, KEY + KGAP, faces[1]],
    [KEY + KGAP, KEY + KGAP, faces[2]],
    [(KEY + KGAP) * 2, KEY + KGAP, faces[3]],
  ];
  for (const s of slots) {
    const x = s[0];
    const y = s[1];
    const face = s[2];
    keyCap(c, x, y);
    if (ARROWS[face]) {
      c.fillStyle = '#2a2118';
      const rows = ARROWS[face];
      for (let ry = 0; ry < 5; ry++) {
        for (let rx = 0; rx < 5; rx++) {
          if (rows[ry][rx] === '#') c.fillRect(x + 3 + rx, y + 3 + ry, 1, 1);
        }
      }
    } else {
      drawGlyph(c, face, x + 3, y + 2, '#2a2118');
    }
  }
  return cv;
}

export function buildArrowKeys() {
  return buildKeyCluster(['up', 'left', 'down', 'right']);
}

export function buildWasdKeys() {
  return buildKeyCluster(['W', 'A', 'S', 'D']);
}

/**
 * Fel-le jelek a menube. Tomor haromszog, nem a billentyu-nyil rajza:
 * ezen a mereten az kereszt-alaknak latszott.
 */
export function buildChevrons() {
  const rows = ['..#..', '.###.', '#####'];
  const mk = (flip) => {
    const { cv, c } = makeCanvas(5, 3);
    c.fillStyle = '#ffd257';
    for (let y = 0; y < 3; y++) {
      const r = rows[flip ? 2 - y : y];
      for (let x = 0; x < 5; x++) if (r[x] === '#') c.fillRect(x, y, 1, 1);
    }
    return cv;
  };
  return { up: mk(false), down: mk(true) };
}

/** Kupa a megnyert korokhoz. Tolt es ures valtozatban. */
export function buildTrophy(won) {
  const rows = [
    '.####.',
    '#.##.#',
    '#.##.#',
    '..##..',
    '.####.',
  ];
  const { cv, c } = makeCanvas(6, 5);
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < 6; x++) {
      if (rows[y][x] !== '#') continue;
      c.fillStyle = won ? (y === 0 ? '#ffe89a' : '#ffd257') : 'rgba(255,210,87,0.20)';
      c.fillRect(x, y, 1, 1);
    }
  }
  if (won) {
    c.fillStyle = '#b8901e';
    c.fillRect(1, 4, 4, 1);
  }
  return cv;
}

export function buildShadow(w, h) {
  const { cv, c } = makeCanvas(w, h);
  const rx = w / 2;
  const ry = h / 2;
  c.fillStyle = 'rgba(0,0,0,0.30)';
  for (let y = 0; y < h; y++) {
    const dy = (y + 0.5 - ry) / ry;
    const span = Math.sqrt(Math.max(0, 1 - dy * dy)) * rx;
    const x0 = Math.round(rx - span);
    const ww = Math.round(span * 2);
    if (ww > 0) c.fillRect(x0, y, ww, 1);
  }
  return cv;
}

// ---------------------------------------------------------------- csomag

export function buildVignette() {
  const { cv, c } = makeCanvas(W, H);
  const img = c.createImageData(W, H);
  const d = img.data;
  const cx = W / 2;
  const cy = H / 2;
  const maxD = Math.hypot(cx, cy);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const r = Math.hypot(x - cx, (y - cy) * 1.25) / maxD;
      let a = Math.max(0, r - 0.52) * 1.9;
      a = Math.min(0.55, a);
      a = Math.round(a * 8) / 8; // lepcsozes, hogy pixeles maradjon
      const i = (y * W + x) * 4;
      d[i] = 12; d[i + 1] = 7; d[i + 2] = 4;
      d[i + 3] = Math.round(a * 255);
    }
  }
  c.putImageData(img, 0, 0);
  return cv;
}

export function buildAll(seed) {
  return {
    ground: buildGround(seed),
    burnt: buildBurnt(seed),
    trees: buildTrees(),
    fallen: buildFallen(),
    vignette: buildVignette(),
    stump: buildStump(),
    players: buildPlayers(),
    flames: buildFlames(),
    arrowKeys: buildArrowKeys(),
    wasdKeys: buildWasdKeys(),
    chevrons: buildChevrons(),
    speaker: buildSpeaker(false),
    speakerMuted: buildSpeaker(true),
    sun: buildSun(),
    moon: buildMoon(),
    bunny: buildBunnies(),
    wolf: buildWolves(),
    ...buildDecorSprites(),
    flowers: buildFlowers(),
    birds: buildBirds(),
    trophyWon: buildTrophy(true),
    trophyEmpty: buildTrophy(false),
    heartFull: buildHeart(true),
    heartEmpty: buildHeart(false),
    shadowSm: buildShadow(12, 5),
    shadowMd: buildShadow(16, 6),
    shadowLg: buildShadow(20, 7),
  };
}
