// Minden grafika kodbol generalodik, fix palettaval.
// Igy nincs kulso asset, a stilus garantaltan konzisztens, es a csapat
// barmelyik elemet atirhatja anelkul, hogy a tobbihez nyulna.

import {
  W, H, PAL, TEAM, TREE_KINDS, CURRENT, mulberry32, NEZET,
} from './config.js';
import { drawGlyph } from './font.js';
import { buildDecorSprites } from './decor-sprites.js';
import { CRITTERS, CRITTER_SLOTS } from './critters.js';
import { propsOf } from './props.js';

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

function themeProps() {
  return propsOf((CURRENT.theme && CURRENT.theme.critters) || 'erdo');
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

  // A talaj apro szemcsei: fuszal az erdoben, homokszemcse a sivatagban,
  // jegkristaly a jegmezon. A szinek a temabol jonnek.
  const gp = themeProps().ground;
  if (gp.smooth) {
    // Sima jegtabla: nincs fuszal es kavics, csak szeles fenysavok es
    // hajszalrepedesek. Ettol latszik, hogy csuszni fog rajta a favago.
    for (let i = 0; i < 26; i++) {
      const y = (rng() * H) | 0;
      const len = 40 + rng() * 160;
      const x0 = rng() * (W - len);
      c.fillStyle = 'rgba(255,255,255,' + (0.05 + rng() * 0.07).toFixed(3) + ')';
      c.fillRect(x0, y, len, 1 + ((rng() * 2) | 0));
    }
    for (let i = 0; i < 30; i++) {            // hajszalrepedesek
      let x = rng() * W;
      let y = rng() * H;
      const ang = rng() * Math.PI * 2;
      c.fillStyle = 'rgba(120,160,190,' + (0.18 + rng() * 0.16).toFixed(3) + ')';
      for (let k = 0; k < 8 + rng() * 14; k++) {
        x += Math.cos(ang + Math.sin(k * 0.7) * 0.5) * 2;
        y += Math.sin(ang + Math.sin(k * 0.7) * 0.5) * 1.2;
        c.fillRect(x | 0, y | 0, 1, 1);
      }
    }
    return cv;
  }
  for (let i = 0; i < 900; i++) {
    const x = (rng() * W) | 0;
    const y = (rng() * H) | 0;
    c.fillStyle = rng() < 0.55 ? gp.blade[0] : gp.blade[1];
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
      c.fillStyle = gp.pebble[0];
      c.fillRect(x, y, 3, 2);
      c.fillStyle = gp.pebble[1];
      c.fillRect(x, y, 2, 1);
    }
  }

  // Bokrok, hogy legyen melyseg. Csak ott, ahol nonek: a sivatagban,
  // a jegmezon es az idegen bolygon helyettuk foltos buckak vannak.
  for (let i = 0; i < 20; i++) {
    const x = (rng() * (W - 8)) | 0;
    const y = (rng() * (H - 6)) | 0;
    if (gp.bush) {
      c.fillStyle = PAL.grassDark;
      c.fillRect(x + 1, y + 1, 5, 3);
      c.fillRect(x, y + 2, 7, 2);
      c.fillStyle = PAL.grass[1];
      c.fillRect(x + 1, y + 1, 4, 2);
      c.fillStyle = PAL.grass[3];
      c.fillRect(x + 2, y + 1, 2, 1);
    } else {
      c.fillStyle = gp.pebble[0];
      c.fillRect(x, y + 2, 8, 2);
      c.fillRect(x + 2, y + 1, 5, 1);
      c.fillStyle = gp.pebble[1];
      c.fillRect(x + 2, y + 1, 4, 1);
    }
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

// Az erdo harom fafajtaja VARAZSMODBAN. Az alapjatekban mindharom ugyanaz
// a klasszikus fenyo marad, hogy a v1-bol ismert kep ne valtozzon.
const PINE_KINDS = [
  { layers: 4, spread: 0.86, droop: 0.62, trunk: 0.20 },  // magas, keskeny
  { layers: 3, spread: 1.0, droop: 0.75, trunk: 0.24 },   // a klasszikus
  { layers: 3, spread: 1.14, droop: 0.92, trunk: 0.3 },   // zomok, terebelyes
];

function drawPine(c, w, h, cols, rng, idx) {
  const k = CURRENT.z ? PINE_KINDS[(idx | 0) % PINE_KINDS.length] : PINE_KINDS[1];
  const cx = w >> 1;
  const trunkH = Math.max(6, Math.round(h * k.trunk));
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

  const layers = k.layers;
  const canopyBot = ty + 3;
  const layerH = canopyBot / layers;
  for (let i = 0; i < layers; i++) {
    const top = Math.round(i * layerH * k.droop);
    const bot = Math.round(top + layerH * 1.25);
    const maxHalf = ((i + 1) / layers) * (w / 2) * k.spread - 0.15;
    for (let y = top; y <= bot && y < canopyBot; y++) {
      const t = (y - top) / Math.max(1, bot - top);
      const half = Math.max(1, Math.min((w >> 1) - 1, Math.round(maxHalf * Math.pow(t, 0.75))));
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
  if (CURRENT.z && k.layers === 4) {          // a magas fajtan tobocska is van
    c.fillStyle = cols.trunkDark;
    c.fillRect(cx - 2, Math.round(canopyBot * 0.55), 1, 2);
    c.fillRect(cx + 2, Math.round(canopyBot * 0.7), 1, 2);
  }
}

/**
 * Sirko. Meretenkent MAS emlek, kulonben harom egyforma tabla allna a
 * palyan:
 *   0  torott tabla    letort felso sarok, repedes
 *   1  kereszt         valodi kereszt alaku ko, talapzaton
 *   2  obeliszk-sirko  magas, csucsos, urnaval a tetejen
 */
function drawGrave(c, w, h, cols, rng, idx) {
  const cx = w >> 1;
  const kind = (idx | 0) % 3;

  const stone = (x0, x1, y0, y1) => {
    c.fillStyle = cols.mid;
    c.fillRect(x0, y0, x1 - x0, y1 - y0);
    c.fillStyle = cols.light;
    c.fillRect(x0, y0, 1, y1 - y0);
    c.fillStyle = cols.dark;
    c.fillRect(x1 - 1, y0, 1, y1 - y0);
  };
  const speck = (x0, x1, y0, y1, n) => {
    c.fillStyle = cols.hi;
    for (let i = 0; i < n; i++) {
      c.fillRect(x0 + ((rng() * (x1 - x0)) | 0), y0 + ((rng() * (y1 - y0)) | 0), 1, 1);
    }
  };

  if (kind === 0) {
    // Torott tabla: a jobb felso sarka hianyzik, vegigfut rajta egy repedes.
    const bw = Math.max(7, Math.round(w * 0.74));
    const bx = cx - (bw >> 1);
    const top = Math.round(h * 0.16);
    stone(bx, bx + bw, top, h);
    for (let i = 0; i < 4; i++) {           // letort sarok
      c.clearRect(bx + bw - 1 - i, top, i + 1, 3 - Math.min(2, i));
    }
    c.fillStyle = cols.dark;
    c.fillRect(bx + bw - 4, top + 2, 4, 1);
    c.fillStyle = cols.trunkDark;           // repedes cikcakkban
    let rx = bx + 2 + ((rng() * (bw - 4)) | 0);
    for (let y = top + 3; y < h - 2; y++) {
      c.fillRect(Math.max(bx, Math.min(bx + bw - 1, rx)), y, 1, 1);
      if (y % 3 === 0) rx += rng() < 0.5 ? -1 : 1;
    }
    c.fillStyle = cols.trunkDark;
    c.fillRect(bx, h - 2, bw, 2);
    speck(bx + 1, bx + bw - 1, top + 1, h - 2, Math.round(w * 0.5));
    return;
  }

  if (kind === 1) {
    // Kereszt alaku ko, szeles talapzaton.
    const armY = Math.round(h * 0.3);
    const cw = Math.max(3, Math.round(w * 0.28));
    const baseH = Math.max(3, Math.round(h * 0.14));
    stone(cx - (cw >> 1), cx - (cw >> 1) + cw, 1, h - baseH);
    stone(Math.round(cx - w * 0.4), Math.round(cx + w * 0.4), armY, armY + cw);
    c.fillStyle = cols.light;                // talapzat
    c.fillRect(Math.round(cx - w * 0.44), h - baseH, Math.round(w * 0.88), baseH);
    c.fillStyle = cols.dark;
    c.fillRect(Math.round(cx - w * 0.44), h - 2, Math.round(w * 0.88), 2);
    c.fillStyle = cols.trunkDark;            // par mohafolt
    c.fillRect(Math.round(cx - w * 0.4), armY + cw - 1, 2, 1);
    c.fillRect(cx - 1, h - baseH - 3, 2, 1);
    speck(cx - (cw >> 1), cx + (cw >> 1), 2, h - baseH, Math.round(h * 0.3));
    return;
  }

  // Magas, csucsos siremlek urnaval.
  const bw = Math.max(6, Math.round(w * 0.5));
  const bx = cx - (bw >> 1);
  const top = Math.round(h * 0.22);
  stone(bx, bx + bw, top, h);
  for (let i = 0; i < 4; i++) {              // csucs
    c.fillStyle = i < 2 ? cols.hi : cols.light;
    c.fillRect(bx + i, top - 4 + i, bw - i * 2, 1);
  }
  c.fillStyle = cols.light;                  // urna a tetejen
  c.fillRect(cx - 2, top - 8, 4, 4);
  c.fillStyle = cols.dark;
  c.fillRect(cx - 2, top - 5, 4, 1);
  c.fillStyle = cols.trunkDark;              // vesett sorok
  for (let y = top + 4; y < h - 4; y += 3) c.fillRect(bx + 2, y, bw - 4, 1);
  c.fillStyle = cols.light;                  // szeles talp
  c.fillRect(bx - 2, h - 3, bw + 4, 3);
  c.fillStyle = cols.dark;
  c.fillRect(bx - 2, h - 1, bw + 4, 1);
  speck(bx + 1, bx + bw - 1, top + 1, h - 4, Math.round(h * 0.25));
}

/**
 * Egyiptomi oszlopok. Meretenkent MAS epiteszeti tipus, kulonben harom
 * egyforma hasab allna a palyan:
 *   0  obeliszk        hegyes csucs, hieroglifa-sav
 *   1  papirusz-oszlop kotegelt szar, harang alaku fejezet, abakusz
 *   2  lotusz-oszlop   bimbos fejezet, gyurus nyak, szeles abakusz
 */
function drawObelisk(c, w, h, cols, rng, idx) {
  const cx = w >> 1;
  const kind = (idx | 0) % 3;

  const band = (y, x0, x1, col) => {
    c.fillStyle = col;
    c.fillRect(x0, y, x1 - x0, 1);
  };
  const shaft = (y0, y1, half, ribs) => {
    for (let y = y0; y < y1; y++) {
      for (let x = -half; x <= half; x++) {
        const px = cx + x;
        if (px < 0 || px >= w) continue;
        let col = cols.mid;
        if (x < -half + 1) col = cols.light;
        else if (x >= half) col = cols.trunkDark;
        else if (ribs && (x + half) % 3 === 0) col = cols.dark;
        c.fillStyle = col;
        c.fillRect(px, y, 1, 1);
      }
    }
  };

  if (kind === 0) {
    const half = Math.max(2, Math.round(w * 0.26));
    const peak = Math.round(h * 0.16);
    shaft(peak, h, half, false);
    for (let i = 0; i < peak; i++) {          // piramidion
      const k = Math.round((i / peak) * half);
      c.fillStyle = i < 2 ? cols.hi : cols.light;
      c.fillRect(cx - half + k, i, (half - k) * 2 + 1, 1);
    }
    c.fillStyle = cols.trunkDark;             // hieroglifa-sav
    for (let y = peak + 3; y < h - 3; y += 4) {
      c.fillRect(cx - 1, y, 2, 1);
      if (rng() < 0.5) c.fillRect(cx - 1, y + 1, 1, 1);
    }
    band(h - 1, cx - half - 1, cx + half + 2, cols.trunkDark);
    return;
  }

  if (kind === 1) {
    // Papirusz-oszlop: kotegelt szarak, felfele enyhen szukulve.
    const abH = Math.max(2, Math.round(h * 0.07));
    const capH = Math.max(4, Math.round(h * 0.17));
    const top = abH + capH;
    const half = Math.max(3, Math.round(w * 0.3));
    shaft(top, h, half, true);
    // harang alaku fejezet: alul keskeny, felul szeles
    for (let i = 0; i < capH; i++) {
      const k = i / (capH - 1 || 1);
      const hw = Math.round(half + (w / 2 - 1 - half) * k);
      c.fillStyle = i < 2 ? cols.trunkDark : cols.light;
      c.fillRect(cx - hw, abH + capH - 1 - i, hw * 2 + 1, 1);
      c.fillStyle = cols.dark;                // fuggoleges bordak a fejezeten
      for (let x = -hw + 1; x <= hw; x += 3) c.fillRect(cx + x, abH + capH - 1 - i, 1, 1);
    }
    // abakusz: sima kotomb legfelul
    c.fillStyle = cols.hi;
    c.fillRect(cx - half - 1, 0, (half + 1) * 2 + 1, abH);
    c.fillStyle = cols.trunkDark;
    c.fillRect(cx - half - 1, abH - 1, (half + 1) * 2 + 1, 1);
    band(h - 1, cx - half - 2, cx + half + 3, cols.trunkDark);
    return;
  }

  // Lotusz-oszlop: bimbos fejezet, alatta gyurus nyak.
  const abH = Math.max(2, Math.round(h * 0.06));
  const budH = Math.max(5, Math.round(h * 0.2));
  const neck = 2;
  const top = abH + budH + neck;
  const half = Math.max(3, Math.round(w * 0.28));
  shaft(top, h, half, true);
  c.fillStyle = cols.trunkDark;               // gyurus nyak
  for (let y = abH + budH; y < top; y++) c.fillRect(cx - half, y, half * 2 + 1, 1);
  for (let i = 0; i < budH; i++) {            // zart bimbo
    const k = i / (budH - 1 || 1);
    const hw = Math.round((w / 2 - 1) * Math.sin(Math.PI * (0.25 + k * 0.6)));
    c.fillStyle = cols.mid;
    c.fillRect(cx - hw, abH + i, hw * 2 + 1, 1);
    c.fillStyle = cols.light;
    c.fillRect(cx - hw, abH + i, Math.max(1, hw >> 1), 1);
    c.fillStyle = cols.trunkDark;
    c.fillRect(cx + hw, abH + i, 1, 1);
  }
  c.fillStyle = cols.dark;                    // szirom-elvalasztok
  for (let x = -2; x <= 2; x += 2) c.fillRect(cx + x * 2, abH + 1, 1, budH - 2);
  c.fillStyle = cols.hi;
  c.fillRect(cx - half - 1, 0, (half + 1) * 2 + 1, abH);
  band(h - 1, cx - half - 2, cx + half + 3, cols.trunkDark);
}

/**
 * Jegoszlop. Meretenkent MAS formacio, kulonben harom egyforma tomb allna a
 * palyan: kicsi = tuskeboko, kozepes = repedt hasab, nagy = jegcsapos torony.
 */
function drawIce(c, w, h, cols, rng, idx) {
  const cx = w >> 1;
  const kind = (idx | 0) % 3;

  const col = (x, y0, y1, base, hi) => {
    if (y1 <= y0) return;
    c.fillStyle = base;
    c.fillRect(x, y0, 1, y1 - y0);
    if (hi) { c.fillStyle = hi; c.fillRect(x, y0, 1, Math.max(1, ((y1 - y0) * 0.3) | 0)); }
  };

  if (kind === 0) {
    // tuskeboko: harom kulonbozo magassagu szilank egy tovon
    const peaks = [
      { off: -Math.round(w * 0.26), top: Math.round(h * 0.30), half: Math.max(1, (w * 0.16) | 0) },
      { off: Math.round(w * 0.02), top: 0, half: Math.max(2, (w * 0.22) | 0) },
      { off: Math.round(w * 0.28), top: Math.round(h * 0.46), half: Math.max(1, (w * 0.14) | 0) },
    ];
    for (const p of peaks) {
      for (let y = p.top; y < h; y++) {
        const k = (y - p.top) / Math.max(1, h - p.top);
        const half = Math.max(0, Math.round(p.half * (0.2 + k * 0.8)));
        for (let x = -half; x <= half; x++) {
          const px = cx + p.off + x;
          if (px < 0 || px >= w) continue;
          c.fillStyle = x < 0 ? cols.light : (x === half ? cols.dark : cols.mid);
          c.fillRect(px, y, 1, 1);
        }
      }
    }
  } else if (kind === 1) {
    // repedt hasab: fuggoleges tomb, benne sotet repedes es lepcsos perem
    for (let y = 0; y < h; y++) {
      const k = y / (h - 1);
      const half = Math.max(1, Math.round((w / 2 - 0.5) * (0.5 + k * 0.5)));
      const step = y % 7 === 0 && y > 2 ? 1 : 0;
      col(cx - half + step, y, y + 1, cols.mid, null);
      for (let x = -half + step; x <= half; x++) {
        const px = cx + x;
        if (px < 0 || px >= w) continue;
        c.fillStyle = x < -half + step + 2 ? cols.light : (x >= half - 1 ? cols.dark : cols.mid);
        c.fillRect(px, y, 1, 1);
      }
    }
    c.fillStyle = cols.dark;              // vegigfuto repedes
    let cxr = cx + 1;
    for (let y = 2; y < h - 2; y += 1) {
      if (y % 5 === 0) cxr += rng() < 0.5 ? -1 : 1;
      c.fillRect(Math.max(1, Math.min(w - 2, cxr)), y, 1, 1);
    }
  } else {
    // jegcsapos torony: felfele keskenyedo test, aljan lelogo csapok
    for (let y = 0; y < h; y++) {
      const k = y / (h - 1);
      const half = Math.max(1, Math.round((w / 2 - 0.5) * (0.34 + k * 0.66)));
      for (let x = -half; x <= half; x++) {
        c.fillStyle = x < -half + 2 ? cols.light : (x >= half - 1 ? cols.dark : cols.mid);
        c.fillRect(cx + x, y, 1, 1);
      }
      if (y === Math.round(h * 0.42)) {  // koszoru fel magassagban
        c.fillStyle = cols.hi;
        c.fillRect(cx - half, y, half * 2 + 1, 1);
      }
    }
    c.fillStyle = cols.light;            // jegcsapok a peremrol
    const ledge = Math.round(h * 0.44);
    for (let i = 0; i < 4; i++) {
      const x = cx - Math.round(w * 0.34) + i * Math.max(2, Math.round(w * 0.22));
      if (x < 0 || x >= w) continue;
      const len = 2 + ((rng() * 3) | 0);
      c.fillRect(x, ledge, 1, len);
    }
  }

  c.fillStyle = cols.hi;
  for (let i = 0; i < Math.round(h * 0.35); i++) {
    c.fillRect(1 + ((rng() * (w - 2)) | 0), 1 + ((rng() * (h - 2)) | 0), 1, 1);
  }
  c.fillStyle = cols.trunkDark;
  c.fillRect(cx - (w >> 2), h - 1, (w >> 1) + 1, 1);
}

/** Kristalytorony. Meretenkent mas dolesszog es lapszam. */
function drawCrystal(c, w, h, cols, rng, idx) {
  const cx = w >> 1;
  const kind = (idx | 0) % 3;
  const peak = Math.round(h * (kind === 0 ? 0.42 : kind === 1 ? 0.28 : 0.34));
  const tilt = kind === 1 ? 0.16 : kind === 2 ? -0.1 : 0;

  for (let y = 0; y < h; y++) {
    let half;
    if (y < peak) half = Math.max(0, Math.round((y / peak) * (w / 2 - 1)));
    else half = Math.round((w / 2 - 1) * (1 - ((y - peak) / (h - peak)) * (kind === 2 ? 0.5 : 0.32)));
    const off = Math.round((y / h) * tilt * w);
    for (let x = -half; x <= half; x++) {
      const px = cx + x + off;
      if (px < 0 || px >= w) continue;
      c.fillStyle = x < -half + Math.max(1, half * 0.5) ? cols.light
        : (x >= half - 1 ? cols.dark : cols.mid);
      c.fillRect(px, y, 1, 1);
    }
  }

  if (kind === 2) {
    // ikertorony: egy kisebb szilank az oldalan
    const sx = cx + Math.round(w * 0.3);
    const stop = Math.round(h * 0.55);
    for (let y = stop; y < h; y++) {
      const k = (y - stop) / (h - stop);
      const half = Math.max(0, Math.round((w * 0.16) * (0.2 + k * 0.8)));
      for (let x = -half; x <= half; x++) {
        const px = sx + x;
        if (px < 0 || px >= w) continue;
        c.fillStyle = x < 0 ? cols.light : cols.mid;
        c.fillRect(px, y, 1, 1);
      }
    }
  }

  c.fillStyle = cols.hi;
  for (let i = 0; i < Math.round(h * 0.35); i++) {
    c.fillRect(1 + ((rng() * (w - 2)) | 0), 2 + ((rng() * (h - 4)) | 0), 1, 1);
  }
  c.fillStyle = cols.trunk;
  c.fillRect(cx - (w >> 2), h - 3, (w >> 1) + 1, 3);
}

// A harom totemmeret harom kulonbozo emlek: mohos zold koveto, okker
// homokko-oszlop es egy meszelt, VOROSRE FESTETT madaros balvany. Mind a
// harom mas anyagu es mas felepitesu, tehat a palyan sem olvadnak ossze.
// A harom totemmeret harom kulonbozo balvany: mohos zold koveto, okker
// homokko-oszlop es egy SOTETZOLD, ket nagy arccal faragott balvany.
const TOTEM_STONES = [
  { mid: '#6f8a4a', dark: '#41562c', light: '#93ad6c', hi: '#c4d69a', trunk: '#6b5230', trunkDark: '#3a2c18' },
  { mid: '#b09250', dark: '#7a6432', light: '#cfae6e', hi: '#ecd39a', trunk: '#7a5c30', trunkDark: '#43301a' },
  { mid: '#4a7040', dark: '#2c4a28', light: '#6b9459', hi: '#9cc487', trunk: '#8a6c30', trunkDark: '#4a3a18' },
];

/**
 * Sotetzold balvany KET NAGY arccal. A masik ket totemen apro a reszlet,
 * ezen viszont az arc kitolti az egesz hasabot, tehat messzirol is azonnal
 * latszik, hogy egy szempar nez vissza rad.
 */
function drawBigFaceTotem(c, w, h, cols) {
  const cx = w >> 1;
  const tw = Math.max(9, Math.round(w * 0.84));
  const bx = cx - (tw >> 1);
  const crest = Math.max(3, Math.round(h * 0.08));
  const bh = Math.floor((h - crest) / 2);

  // Ugyanaz a nyelv, mint a masik ket totemnel: lapos fedoko es tollkorona.
  c.fillStyle = cols.light;
  c.fillRect(bx - 2, 0, tw + 4, 2);
  c.fillStyle = cols.mid;
  c.fillRect(bx, 2, tw, crest - 2);
  c.fillStyle = cols.trunkDark;
  c.fillRect(bx, crest - 1, tw, 1);
  c.fillStyle = cols.hi;
  c.fillRect(cx - 3, 0, 1, 2);
  c.fillRect(cx + 2, 0, 1, 2);

  for (let f = 0; f < 2; f++) {
    const y0 = crest + f * bh;
    const y1 = f === 1 ? h : crest + bh;
    const hgt = y1 - y0;

    c.fillStyle = f ? cols.dark : cols.mid;   // valtakozo hasabok
    c.fillRect(bx, y0, tw, hgt);
    c.fillStyle = cols.light;
    c.fillRect(bx, y0, 1, hgt);
    c.fillRect(bx, y0, tw, 1);
    c.fillStyle = '#14261a';
    c.fillRect(bx + tw - 1, y0, 1, hgt);
    c.fillRect(bx, y1 - 1, tw, 1);

    // szemek: nagy, sotet uregek arany pupillaval
    const ew = Math.max(3, Math.round(tw * 0.3));
    const eh = Math.max(2, Math.round(hgt * 0.24));
    const ey = y0 + Math.max(2, Math.round(hgt * 0.16));
    for (const ex of [bx + 1, bx + tw - 1 - ew]) {
      c.fillStyle = '#0b160f';
      c.fillRect(ex, ey, ew, eh);
      c.fillStyle = cols.trunk;
      c.fillRect(ex + 1, ey + 1, ew - 2, Math.max(1, eh - 2));
      c.fillStyle = cols.hi;
      c.fillRect(ex, ey - 1, ew, 1);          // kiugro szemoldok
    }

    // orr: fuggoleges taraj a szemek kozott
    const nh = Math.max(2, Math.round(hgt * 0.22));
    c.fillStyle = cols.hi;
    c.fillRect(cx - 1, ey + eh, 2, nh);
    c.fillStyle = '#14261a';
    c.fillRect(cx + 1, ey + eh, 1, nh);

    // szaj: szeles nyilas fogsorral
    const mw = tw - 4;
    const mh = Math.max(2, Math.round(hgt * 0.2));
    const my = y0 + Math.round(hgt * 0.66);
    c.fillStyle = '#12240f';
    c.fillRect(bx + 2, my, mw, mh);
    c.fillStyle = cols.hi;
    for (let x = 0; x < mw; x += 2) c.fillRect(bx + 2 + x, my, 1, 1);
    c.fillStyle = cols.trunk;
    c.fillRect(bx + 2, my + mh, mw, 1);

    // kiallo szarnyak, ugyanugy, mint a masik ket totemen
    if (f === 0) {
      c.fillStyle = cols.trunk;
      c.fillRect(bx - 2, y0 + Math.round(hgt * 0.45), 2, 2);
      c.fillRect(bx + tw, y0 + Math.round(hgt * 0.45), 2, 2);
    }
  }
}

/**
 * Aztek totemoszlop. Meretenkent mas a felepitese, tehat harom kulonbozo
 * balvany all a palyan, nem harom egyforma.
 */
function drawTotem(c, w, h, cols0, rng, idx) {
  const kind = (idx | 0) % 3;
  const cols = Object.assign({}, cols0, TOTEM_STONES[kind]);
  if (kind === 2) { drawBigFaceTotem(c, w, h, cols); return; }

  const cx = w >> 1;
  const tw = Math.max(7, Math.round(w * 0.74));
  const blocks = kind === 0 ? 3 : 4;
  const bh = Math.floor(h / blocks);

  for (let b = 0; b < blocks; b++) {
    const y0 = b * bh;
    const y1 = b === blocks - 1 ? h : (b + 1) * bh;
    const bw = b % 2 === 0 ? tw : tw - 2;
    const bx = cx - (bw >> 1);
    c.fillStyle = b % 2 ? cols.mid : cols.dark;
    c.fillRect(bx, y0, bw, y1 - y0);
    c.fillStyle = cols.light;
    c.fillRect(bx, y0, bw, 1);
    c.fillRect(bx, y0, 1, y1 - y0);
    c.fillStyle = cols.trunkDark;
    c.fillRect(bx + bw - 1, y0, 1, y1 - y0);

    const ey = y0 + Math.max(2, ((y1 - y0) * 0.3) | 0);
    c.fillStyle = cols.trunkDark;
    if (kind === 0) {
      c.fillRect(bx + 1, ey, 2, 2);
      c.fillRect(bx + bw - 3, ey, 2, 2);
      c.fillRect(bx + 2, ey + 3, bw - 4, 2);
      c.fillStyle = cols.hi;
      c.fillRect(bx + 1, ey, 1, 1);
      c.fillRect(bx + bw - 3, ey, 1, 1);
    } else {
      c.fillRect(bx + 1, ey, bw - 2, 1);
      c.fillRect(bx + 2, ey + 3, bw - 4, 1);
      c.fillStyle = cols.hi;
      c.fillRect(bx + 2, ey + 4, 1, 1);
      c.fillRect(bx + bw - 3, ey + 4, 1, 1);
    }

    if (b % 2 === 0) {
      c.fillStyle = cols.trunk;
      c.fillRect(bx - 2, ey + 1, 2, 2);
      c.fillRect(bx + bw, ey + 1, 2, 2);
    }
  }

  if (kind === 0) {
    c.fillStyle = cols.hi;
    c.fillRect(cx - 3, 0, 1, 2);
    c.fillRect(cx + 2, 0, 1, 2);
  } else {
    c.fillStyle = cols.light;
    c.fillRect(cx - (tw >> 1) - 2, 0, tw + 4, 2);
  }
  c.fillStyle = cols.trunkDark;
  c.fillRect(cx - (tw >> 1), h - 1, tw, 1);
}

// A harom nyalokameret HAROM IZ: eper, menta, citrom. Itt nem eleg a
// vilagosabb-sotetebb, mert a cukorkanal a szin maga az azonosito.
// Harom iz: eper, menta es citrom. Ennel tobb szin mar kilogna a
// cukorkavilag palettajabol.
const LOLLY_FLAVOURS = [
  { mid: '#f04a8a', hi: '#ffd8e8', dark: '#c8306a', light: '#ffffff' },  // eper
  { mid: '#3fd0a8', hi: '#d8fff0', dark: '#219a76', light: '#ffffff' },  // menta
  { mid: '#f0b02c', hi: '#fff2c8', dark: '#b87c10', light: '#ffffff' },  // citrom
];

// Az IZ es a FORMA fuggetlenul parosodik, mind a kilenc kombinacio elojon:
// van rozsaszin celtabla, sarga orveny es menta szeletelt korong is.
const LOLLY_MIX = [
  [0, 0], [1, 1], [2, 2], [0, 1], [1, 2],
  [2, 0], [0, 2], [1, 0], [2, 1],
];

/** Egy nyalokafajta izenek szinei. A kidolt tocsa ebbol veszi a szinet. */
export function lollyFlavour(variant) {
  return LOLLY_FLAVOURS[LOLLY_MIX[(variant | 0) % LOLLY_MIX.length][0]];
}

/**
 * Nyaloka. Haromfele IZ es haromfele FORMA: orveny, celtabla es szeletelt
 * kerek. A palcika is mas mindharomnal (sima, csikos, csavart), kulonben
 * harom egyforma korong allna a palyan.
 */
function drawLolly(c, w, h, cols0, rng, idx) {
  const mix = LOLLY_MIX[(idx | 0) % LOLLY_MIX.length];
  const kind = mix[1];                                   // forma
  const fl = LOLLY_FLAVOURS[mix[0]];                     // iz (szin)
  const cols = Object.assign({}, cols0, fl);
  const cx = w >> 1;
  const r = Math.max(4, Math.round(w * 0.46));
  const cy = r + 1;

  // palcika: meretenkent mas mintaval
  for (let y = cy; y < h; y++) {
    const k = y - cy;
    let col = cols.trunk;
    if (kind === 1 && k % 3 === 0) col = cols.mid;          // csikos
    else if (kind === 2 && (k + ((k / 2) | 0)) % 4 === 0) col = cols.hi;  // csavart
    c.fillStyle = col;
    c.fillRect(cx - 1, y, 3, 1);
    c.fillStyle = cols.trunkLight;
    c.fillRect(cx - 1, y, 1, 1);
    c.fillStyle = cols.trunkDark;
    c.fillRect(cx + 1, y, 1, 1);
  }
  if (kind === 0) {                                        // papircsavar a toven
    c.fillStyle = cols.hi;
    c.fillRect(cx - 2, cy + 2, 5, 2);
    c.fillStyle = cols.dark;
    c.fillRect(cx - 2, cy + 3, 5, 1);
  }

  for (let y = -r; y <= r; y++) {
    const span = Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
    for (let x = -span; x <= span; x++) {
      const d = Math.hypot(x, y);
      const ang = Math.atan2(y, x);
      let on;
      if (kind === 0) {                                    // csigavonalas orveny
        const band = ((ang / Math.PI) * 2.5 + d * 0.55) % 2;
        on = band > 0 ? band < 1 : band < -1;
      } else if (kind === 1) {                             // celtabla-gyuruk
        on = ((d / 2.2) | 0) % 2 === 0;
      } else {                                             // szeletelt kerek
        const seg = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 8);
        on = seg % 2 === 0;
      }
      c.fillStyle = on ? cols.mid : cols.hi;
      c.fillRect(cx + x, cy + y, 1, 1);
    }
  }
  c.fillStyle = cols.dark;                                 // perem
  for (let a = 0; a < 44; a++) {
    const t2 = (a / 44) * Math.PI * 2;
    c.fillRect(cx + Math.round(Math.cos(t2) * r), cy + Math.round(Math.sin(t2) * r), 1, 1);
  }
  c.fillStyle = cols.light;                                // csillanas
  c.fillRect(cx - Math.round(r * 0.5), cy - Math.round(r * 0.55), 2, 1);
  c.fillRect(cx - Math.round(r * 0.5), cy - Math.round(r * 0.55) + 1, 1, 1);
}

// A pontok elrendezese egy dominolap felen (3x3-as racsban).
const PIPS = [
  [], [[1, 1]], [[0, 0], [2, 2]], [[0, 0], [1, 1], [2, 2]],
  [[0, 0], [2, 0], [0, 2], [2, 2]], [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
];

// Kilencfele lap, osszevissza pontszamokkal: igy nem harom egyforma
// dominoszett all a palyan, hanem valodi keszlet.
const DOMINO_PAIRS = [
  [0, 1], [2, 3], [1, 4], [5, 2], [3, 6],
  [4, 0], [6, 5], [2, 2], [1, 3],
];

/** Alló dominolap: ket mezo, kozottuk osztovonal, rajtuk pontok. */
function drawDomino(c, w, h, cols, rng, idx) {
  const [pa, pb] = DOMINO_PAIRS[(idx | 0) % DOMINO_PAIRS.length];
  const bw = Math.max(9, Math.round(w * 0.8));
  const bx = (w - bw) >> 1;

  c.fillStyle = cols.mid;
  c.fillRect(bx, 0, bw, h);
  c.fillStyle = cols.light;                    // vilagos el balra es felul
  c.fillRect(bx, 0, 1, h);
  c.fillRect(bx, 0, bw, 1);
  c.fillStyle = cols.trunkDark;                // sotet el jobbra es alul
  c.fillRect(bx + bw - 1, 0, 1, h);
  c.fillRect(bx, h - 1, bw, 1);
  c.fillStyle = cols.dark;                     // osztovonal kozepen
  c.fillRect(bx + 1, (h >> 1) - 1, bw - 2, 1);

  const pip = (n, y0, y1) => {
    const gw = bw - 5;
    const gh = y1 - y0 - 4;
    for (const [gx, gy] of PIPS[n]) {
      const px = bx + 2 + Math.round((gx / 2) * gw);
      const py = y0 + 2 + Math.round((gy / 2) * gh);
      c.fillStyle = cols.dark;
      c.fillRect(px, py, 2, 2);
      c.fillStyle = cols.hi;
      c.fillRect(px, py, 1, 1);
    }
  };
  pip(pa, 0, (h >> 1) - 1);
  pip(pb, (h >> 1), h);
}

/**
 * Tuzijatek-raketa: haromlabu allvanyra tuzott papircso. Hegyes orrkup,
 * csavart csikozas, hengeres arnyekolas, es egy kilogo kanoc. A kanoc nem
 * disz: a KILOVES csavar epp azt gyujtja meg.
 */
function drawRocket(c, w, h, cols) {
  const bw = Math.max(5, Math.round(w * 0.46) | 1);
  const bx = (w - bw) >> 1;
  const standH = Math.max(4, Math.round(h * 0.15));
  const noseH = Math.max(5, Math.round(h * 0.26));
  const tubeTop = noseH;
  const tubeBot = h - standH;

  // Haromlabu allvany: ket szetallo lab elol, egy rovid hatul.
  c.fillStyle = cols.trunkDark;
  for (let i = 0; i < standH; i++) {
    const sp = 1 + Math.round((i / Math.max(1, standH - 1)) * (bw * 0.75));
    c.fillRect(bx + (bw >> 1) - sp, tubeBot + i, 1, 1);
    c.fillRect(bx + (bw >> 1) + sp, tubeBot + i, 1, 1);
  }
  c.fillStyle = cols.trunk;
  c.fillRect(bx + 1, tubeBot + 1, bw - 2, 1);
  c.fillRect(bx + (bw >> 1), tubeBot, 1, standH);

  // A cso. Hengeres arnyekolas: balrol vilagos, jobbra sotetedik.
  for (let x = 0; x < bw; x++) {
    const k = x / Math.max(1, bw - 1);
    const col = k < 0.18 ? cols.light : (k > 0.78 ? cols.dark : cols.mid);
    c.fillStyle = col;
    c.fillRect(bx + x, tubeTop, 1, tubeBot - tubeTop);
  }
  // Csavart csikozas: a sav soronkent egy pixelt elcsuszik, ettol tekeredik.
  for (let y = tubeTop; y < tubeBot; y++) {
    for (let x = 0; x < bw; x++) {
      if ((x + y * 2) % 6 >= 2) continue;
      const k = x / Math.max(1, bw - 1);
      c.fillStyle = k > 0.78 ? cols.mid : cols.hi;
      c.fillRect(bx + x, y, 1, 1);
    }
  }
  // Abroncs a cso ket vegen: enelkul csak egy csikos hasab lenne.
  c.fillStyle = cols.trunkDark;
  c.fillRect(bx, tubeTop, bw, 1);
  c.fillRect(bx, tubeBot - 1, bw, 1);
  c.fillStyle = cols.trunkLight;
  c.fillRect(bx, tubeTop + 1, bw, 1);

  // Hegyes orrkup: felfele fogyo, a csucsan egyetlen pixel.
  for (let i = 0; i < noseH; i++) {
    const k = i / Math.max(1, noseH - 1);          // 0 = csucs, 1 = to
    const ww = Math.max(1, Math.round(1 + k * (bw - 1)));
    const x0 = bx + Math.round((bw - ww) / 2);
    for (let x = 0; x < ww; x++) {
      const kk = ww > 1 ? x / (ww - 1) : 0;
      c.fillStyle = kk < 0.3 ? cols.hi : (kk > 0.8 ? cols.dark : cols.light);
      c.fillRect(x0 + x, i, 1, 1);
    }
  }
  c.fillStyle = cols.trunkDark;                    // gallér az orrkup toven
  c.fillRect(bx, noseH - 1, bw, 1);

  // Kanoc: kunkorodo zsinor a cso aljabol, a vegen egy vilagos ponttal.
  c.fillStyle = cols.trunkLight;
  c.fillRect(bx - 1, tubeBot - 5, 1, 1);
  c.fillRect(bx - 2, tubeBot - 6, 1, 1);
  c.fillRect(bx - 3, tubeBot - 5, 1, 1);
  c.fillStyle = cols.hi;
  c.fillRect(bx - 3, tubeBot - 6, 1, 1);
}

/**
 * Szelmalom: kupos ko-torony sisakkal. A VITORLA SZANDEKOSAN NINCS RAJTA:
 * azt a render rajzolja folé kepkockankent, mert forog.
 */
function drawMill(c, w, h, cols) {
  const capH = Math.max(5, Math.round(h * 0.2));
  const topW = Math.max(7, Math.round(w * 0.72));

  for (let y = capH; y < h; y++) {
    const k = (y - capH) / Math.max(1, h - 1 - capH);
    const ww = Math.round(topW + (w - topW) * k);
    const x0 = Math.round((w - ww) / 2);
    for (let x = x0; x < x0 + ww; x++) {
      const row = ((y - capH) / 3) | 0;
      const seam = (y - capH) % 3 === 2 || (x + row * 2) % 5 === 0;
      c.fillStyle = seam ? cols.dark : (x < x0 + 2 ? cols.light : cols.mid);
      c.fillRect(x, y, 1, 1);
    }
    c.fillStyle = cols.trunkDark;
    c.fillRect(x0 + ww - 1, y, 1, 1);
  }

  // sisak: lekerekitett fatetozet
  for (let y = 0; y < capH; y++) {
    const ww = Math.round(topW * (0.4 + 0.6 * Math.sqrt(y / capH))) + 2;
    const x0 = Math.round((w - ww) / 2);
    c.fillStyle = y < 2 ? cols.trunkLight : cols.trunk;
    c.fillRect(x0, y, ww, 1);
  }
  c.fillStyle = cols.trunkDark;                  // agycsapagy, ide all a vitorla
  c.fillRect((w >> 1) - 1, capH - 2, 2, 3);

  c.fillStyle = cols.hi;                         // apro ablak
  c.fillRect((w >> 1) - 1, capH + 4, 2, 2);
  c.fillStyle = cols.trunkDark;                  // ajto a tovenél
  c.fillRect((w >> 1) - 2, h - 6, 4, 6);
  c.fillStyle = cols.trunk;
  c.fillRect((w >> 1) - 2, h - 6, 4, 1);
}

/**
 * Szelerőmű: karcsu feher torony, a tetejen gondolaval. A LAPATOK itt sincsenek
 * rajta: azokat a render rajzolja, mert forognak. A nagy malmok helyett all a
 * mezon, es sokkal kevesebb helyet foglal, mint egy tomor kotorony.
 */
function drawTurbine(c, w, h, cols) {
  const nac = 4;
  const topW = 3;
  const botW = Math.max(5, Math.round(w * 0.42));
  for (let y = nac; y < h; y++) {
    const k = (y - nac) / Math.max(1, h - 1 - nac);
    const ww = Math.round(topW + (botW - topW) * k);
    const x0 = Math.round((w - ww) / 2);
    for (let x = x0; x < x0 + ww; x++) {
      const kk = ww > 1 ? (x - x0) / (ww - 1) : 0;
      c.fillStyle = kk < 0.34 ? cols.light : (kk > 0.72 ? cols.dark : cols.mid);
      c.fillRect(x, y, 1, 1);
    }
  }
  const cx = w >> 1;
  c.fillStyle = cols.trunk;                      // gondola
  c.fillRect(cx - 2, 1, 5, nac);
  c.fillStyle = cols.trunkLight;
  c.fillRect(cx - 2, 1, 5, 1);
  c.fillStyle = cols.trunkDark;
  c.fillRect(cx + 2, 1, 1, nac);
  c.fillRect(cx - 2, nac, 5, 1);
  c.fillStyle = cols.dark;                       // betonalap
  c.fillRect(cx - ((botW >> 1) + 1), h - 2, botW + 2, 2);
  c.fillStyle = cols.mid;
  c.fillRect(cx - ((botW >> 1) + 1), h - 2, botW + 2, 1);
}

const SHAPES = { turbine: drawTurbine, rocket: drawRocket, mill: drawMill, pine: drawPine, totem: drawTotem, lolly: drawLolly, domino: drawDomino, grave: drawGrave, obelisk: drawObelisk, ice: drawIce, crystal: drawCrystal };

/** Egy szin vilagositasa/sotetitese, 0 = valtozatlan. */
function shade(hex, k) {
  if (typeof hex !== 'string' || hex[0] !== '#') return hex;
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + (k > 0 ? (255 - v) * k : v * k))));
  const r = f((n >> 16) & 255);
  const g2 = f((n >> 8) & 255);
  const b = f(n & 255);
  return '#' + ((1 << 24) + (r << 16) + (g2 << 8) + b).toString(16).slice(1);
}

/**
 * A harom meret KICSIT mas arnyalatot kap. Enelkul harom egyforma sirko all
 * egymas mellett a palyan, es osszemosodnak; ennyi elteres viszont mar
 * elkuloniti oket anelkul, hogy mas szinunek latszananak.
 */
const SHADE_STEPS = [0.09, 0, -0.08];
const SHADE_STEPS_Z = [0.15, 0, -0.13];   // varazsmodban hatarozottabb elteres

/**
 * @param mul Az attetszo alakoknal (jeg, kristaly) nagyobb lepes kell: az
 *   atlatszosag amugy is elmossa a kulonbseget.
 */
function shadeCols(cols, i, mul) {
  const steps = CURRENT.z ? SHADE_STEPS_Z : SHADE_STEPS;
  const k = steps[i % steps.length] * (mul || 1);
  if (!k) return cols;
  const out = {};
  for (const key of Object.keys(cols)) out[key] = shade(cols[key], k);
  return out;
}

// A jeg es a kristaly ATTETSZO: atsejlik rajta, ami mogotte van. A fa, a
// sirko es az obeliszk tomor, azokon semmi nem latszik at.
const CLEAR_SHAPES = { ice: 0.78, crystal: 0.72 };

/** Kirajzol egy alakot, es ha a tema attetszo, atlatszova is teszi. */
function shapeCanvas(w, h, shape, cols, rngSeed, idx, alpha) {
  const src = makeCanvas(w, h);
  shape(src.c, w, h, cols, mulberry32(rngSeed), idx);
  if (!alpha) return src.cv;
  const out = makeCanvas(w, h);
  out.c.globalAlpha = alpha;
  out.c.drawImage(src.cv, 0, 0);
  out.c.globalAlpha = 1;
  return out.cv;
}

/** A temaban szereplo szinek sotet, elszenesedett valtozata. */
function charCols(cols) {
  const dim = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * 0.22 + 12);
    const g2 = Math.round(((n >> 8) & 255) * 0.2 + 10);
    const b = Math.round((n & 255) * 0.2 + 10);
    return '#' + ((1 << 24) + (r << 16) + (g2 << 8) + b).toString(16).slice(1);
  };
  const out = {};
  for (const k of Object.keys(cols)) out[k] = dim(cols[k]);
  return out;
}

export function buildTrees() {
  return TREE_KINDS.map((v, i) => {
    const shape = SHAPES[v.shape] || drawPine;
    const alpha = CLEAR_SHAPES[v.shape] || 0;
    const cols = shadeCols(v.cols || TREE_COLS.live, i, alpha ? 1.9 : 1);
    const seed = 1000 + i * 77;
    // A sziluett MINDIG a tomor valtozatbol keszul, kulonben az attetszo
    // jegoszlop arnyeka is halvany lenne.
    const solid = shapeCanvas(v.w, v.h, shape, cols, seed, i, 0);
    const live = alpha ? shapeCanvas(v.w, v.h, shape, cols, seed, i, alpha) : solid;
    const char = shapeCanvas(v.w, v.h, shape, charCols(cols), seed, i, alpha);
    // A szilank-rajzolashoz a nyers szinek is kellenek, nem csak a kesz kep.
    return {
      cv: live, char, sil: silhouette(solid, '#0b0806'), w: v.w, h: v.h,
      midCol: cols.mid, hiCol: cols.hi, darkCol: cols.dark,
      // A szelmalom vitorlaja kepkockankent rajzolodik, nem sprite: ehhez
      // kellenek a NYERS szinek is, nem csak a kesz kep.
      sail: {
        light: cols.hi, dark: cols.trunkDark, hub: cols.trunkDark, hubHi: cols.trunkLight,
        turbine: v.shape === 'turbine',
      },
      // A forgo resz tengelye: a malomnal a sisak alatt, a szelerőmunel
      // egeszen a torony tetejen ul a gondola.
      hubY: v.shape === 'turbine' ? 3 : Math.max(5, Math.round(v.h * 0.2)) - 1,
    };
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

/**
 * A szelmalom NEGY VITORLAJA, adott szogben. Allo malmon a torony tetejere,
 * kidolt malmon a foldre kerul, es ott is forog tovabb: ez a FORGOSZARNY.
 */
export function drawSails(c, cx, cy, r, ang, pal, squash) {
  const sq = squash === undefined ? 1 : squash;
  if (pal.turbine) {
    // Szelerőmű: HAROM karcsu, feher lapat. Nincs racs es nincs vaszon -
    // a kulonbseg mar messzirol latszik, es a mezo is levegosebb tole.
    for (let a = 0; a < 3; a++) {
      const th = ang + (a * Math.PI * 2) / 3;
      const ux = Math.cos(th);
      const uy = Math.sin(th) * sq;
      const px = -Math.sin(th);
      const py = Math.cos(th) * sq;
      for (let i = 2; i <= r; i++) {
        const k = i / r;
        // A lapat VEGIG feher: a sotet el korabban elnyomta, es a harom
        // szarny szurke kaparasnak latszott az egen.
        c.fillStyle = pal.light;
        c.fillRect(Math.round(cx + ux * i), Math.round(cy + uy * i), 1, 1);
        if (k > 0.5) {                           // kifele szelesedo hatso el
          c.fillStyle = pal.hubHi;
          c.fillRect(Math.round(cx + ux * i + px), Math.round(cy + uy * i + py), 1, 1);
        }
      }
    }
    c.fillStyle = pal.hub;                       // gondola-orr
    c.fillRect(Math.round(cx) - 1, Math.round(cy) - 1, 3, 3);
    c.fillStyle = pal.light;
    c.fillRect(Math.round(cx), Math.round(cy) - 1, 1, 1);
    return;
  }
  for (let a = 0; a < 4; a++) {
    const th = ang + (a * Math.PI) / 2;
    const ux = Math.cos(th);
    const uy = Math.sin(th) * sq;
    const px = -Math.sin(th);
    const py = Math.cos(th) * sq;
    for (let i = 2; i <= r; i++) {
      // A szarny tovenél csak a gerenda, kifele harom pixel szeles: sotet
      // fagerenda kozepen, ket oldalan vilagos vaszon, harmadonkent egy
      // sotet kereszttartoval. Ettol latszik SZELMALOM-VITORLANAK, es nem
      // egy szurke pamacsnak.
      const half = i < r * 0.3 ? 0 : 1;
      const slat = i % 3 === 0;
      for (let sp = -half; sp <= half; sp++) {
        const x = Math.round(cx + ux * i + px * sp);
        const y = Math.round(cy + uy * i + py * sp);
        c.fillStyle = sp === 0 || slat ? pal.dark : pal.light;
        c.fillRect(x, y, 1, 1);
      }
    }
  }
  c.fillStyle = pal.hub;                         // agy a kozeppontban
  c.fillRect(Math.round(cx) - 1, Math.round(cy) - 1, 3, 3);
  c.fillStyle = pal.hubHi;
  c.fillRect(Math.round(cx), Math.round(cy) - 1, 1, 1);
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

/** Kidolt sirko: eltort tabla, rajta a kereszt, a tovegen torott perem. */
function drawFallenSlab(c, L, T, cols, rng) {
  const cy = T / 2;
  const th = Math.max(5, Math.round(T * 0.82));
  const ty = Math.round(cy - th / 2);
  const tip = Math.round(L * 0.14);

  c.fillStyle = cols.mid;
  c.fillRect(0, ty, L - tip, th);
  for (let i = 0; i < tip; i++) {          // lekerekitett veg, most oldalt
    const shrink = Math.round((i / tip) * (th / 2 - 1));
    c.fillRect(L - tip + i, ty + shrink, 1, th - shrink * 2);
  }
  c.fillStyle = cols.light;
  c.fillRect(0, ty, L - tip, 1);
  c.fillStyle = cols.dark;
  c.fillRect(0, ty + th - 1, L - tip, 1);
  // vesett kereszt, elfordulva a fekvo tablan
  c.fillStyle = cols.trunkDark;
  const mx = Math.round(L * 0.5);
  c.fillRect(mx - 4, Math.round(cy), 9, 1);
  c.fillRect(mx, Math.round(cy) - 2, 1, 5);
  // tores a toven
  c.fillStyle = cols.trunkLight;
  c.fillRect(0, ty, 2, th);
  c.fillStyle = cols.trunkDark;
  for (let y = ty; y < ty + th; y += 2) c.fillRect(1, y, 1, 1);
  c.fillStyle = cols.hi;
  for (let i = 0; i < Math.round(L * 0.35); i++) {
    c.fillRect((rng() * L) | 0, ty + 1 + ((rng() * (th - 2)) | 0), 1, 1);
  }
}

/** Kidolt obeliszk: fekvo oszlop, a vegen a piramiscsucs. */
function drawFallenColumn(c, L, T, cols, rng) {
  const cy = T / 2;
  const th = Math.max(5, Math.round(T * 0.72));
  const ty = Math.round(cy - th / 2);
  const tip = Math.round(L * 0.17);

  c.fillStyle = cols.mid;
  c.fillRect(0, ty, L - tip, th);
  for (let i = 0; i < tip; i++) {
    const shrink = Math.round((i / tip) * (th / 2));
    c.fillStyle = i < 2 ? cols.light : cols.mid;
    c.fillRect(L - tip + i, ty + shrink, 1, th - shrink * 2);
  }
  c.fillStyle = cols.light;
  c.fillRect(0, ty, L - tip, 1);
  c.fillStyle = cols.dark;
  c.fillRect(0, ty + th - 1, L - tip, 1);
  // hieroglifa-sor vegig a torzson
  c.fillStyle = cols.trunkDark;
  for (let x = 4; x < L - tip - 2; x += 4) {
    c.fillRect(x, Math.round(cy) - 1, 1, 2);
    if (rng() < 0.5) c.fillRect(x + 1, Math.round(cy) + 1, 1, 1);
  }
  c.fillStyle = cols.hi;                   // friss torasfelulet a toven
  c.fillRect(0, ty, 2, th);
  c.fillStyle = cols.trunkDark;
  c.fillRect(0, ty + 1, 2, 1);
  c.fillRect(0, ty + th - 2, 2, 1);
}

/** Kidolt jegoszlop: tovel vastag, hegyben vegzodo szilank. */
function drawFallenShard(c, L, T, cols, rng) {
  const cy = T / 2;
  for (let x = 0; x < L; x++) {
    const k = 1 - x / (L - 1);
    const half = Math.max(0, Math.round((T / 2 - 0.5) * (0.25 + k * 0.75)));
    const y0 = Math.round(cy - half);
    const hh = half * 2 + 1;
    c.fillStyle = cols.mid;
    c.fillRect(x, y0, 1, hh);
    c.fillStyle = cols.light;
    c.fillRect(x, y0 + 1, 1, Math.max(1, Math.round(hh * 0.4)));
    c.fillStyle = cols.dark;
    c.fillRect(x, y0 + hh - 1, 1, 1);
  }
  c.fillStyle = cols.hi;
  for (let i = 0; i < Math.round(L * 0.45); i++) {
    c.fillRect((rng() * L * 0.8) | 0, 1 + ((rng() * (T - 2)) | 0), 1, 1);
  }
}

/** Kidolt kristaly: lapokra torott, hegyes prizma. */
function drawFallenCrystalLog(c, L, T, cols, rng) {
  const cy = T / 2;
  const tip = Math.round(L * 0.3);
  for (let x = 0; x < L; x++) {
    let half;
    if (x < L - tip) half = Math.round((T / 2 - 0.5) * (0.72 + (x / Math.max(1, L - tip)) * 0.28));
    else half = Math.max(0, Math.round((T / 2 - 0.5) * (1 - (x - (L - tip)) / tip)));
    const y0 = Math.round(cy - half);
    const hh = half * 2 + 1;
    c.fillStyle = cols.mid;
    c.fillRect(x, y0, 1, hh);
    c.fillStyle = cols.light;
    c.fillRect(x, y0, 1, Math.max(1, Math.round(hh * 0.42)));
    c.fillStyle = cols.dark;
    c.fillRect(x, y0 + hh - 1, 1, 1);
  }
  c.fillStyle = cols.hi;
  for (let i = 0; i < Math.round(L * 0.4); i++) {
    c.fillRect((rng() * L) | 0, 1 + ((rng() * (T - 2)) | 0), 1, 1);
  }
  c.fillStyle = cols.trunk;                // torott to
  c.fillRect(0, Math.round(cy - T * 0.3), 2, Math.round(T * 0.6));
}

/** Kidolt totem: fekvo, faragott hasabok sora. */
function drawFallenTotem(c, L, T, cols, rng) {
  const cy = T / 2;
  const th = Math.max(5, Math.round(T * 0.84));
  const ty = Math.round(cy - th / 2);
  const blocks = 4;
  const bw = Math.floor(L / blocks);
  for (let b = 0; b < blocks; b++) {
    const x0 = b * bw;
    const x1 = b === blocks - 1 ? L : (b + 1) * bw;
    c.fillStyle = b % 2 ? cols.mid : cols.dark;
    c.fillRect(x0, ty, x1 - x0, th);
    c.fillStyle = cols.light;
    c.fillRect(x0, ty, x1 - x0, 1);
    c.fillStyle = cols.trunkDark;
    c.fillRect(x1 - 1, ty, 1, th);
    c.fillStyle = cols.trunkDark;          // oldalra fordult arc
    c.fillRect(x0 + 2, ty + 2, 2, 2);
    c.fillRect(x0 + 2, ty + th - 4, 2, 2);
  }
  c.fillStyle = cols.hi;
  c.fillRect(0, ty, 2, th);
}

/** Kidolt nyaloka: fekvo palcika, a vegen a korong. */
function drawFallenLolly(c, L, T, cols0, rng, idx) {
  const fl = LOLLY_FLAVOURS[LOLLY_MIX[(idx | 0) % LOLLY_MIX.length][0]];
  const cols = Object.assign({}, cols0, fl);
  const cy = T / 2;
  const r = Math.max(3, Math.round(T * 0.46));
  const stick = L - r * 2 - 1;
  c.fillStyle = cols.trunk;
  c.fillRect(0, Math.round(cy - 1), stick, 3);
  c.fillStyle = cols.trunkLight;
  c.fillRect(0, Math.round(cy - 1), stick, 1);
  c.fillStyle = cols.trunkDark;
  c.fillRect(0, Math.round(cy + 1), stick, 1);
  const dx = stick + r;
  for (let y = -r; y <= r; y++) {
    const span = Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
    for (let x = -span; x <= span; x++) {
      const ang = Math.atan2(y, x) + Math.hypot(x, y) * 0.85;
      const band = ((ang / Math.PI) * 2.5) % 2;
      const on = band > 0 ? band < 1 : band < -1;
      c.fillStyle = on ? cols.mid : cols.hi;
      c.fillRect(dx + x, Math.round(cy) + y, 1, 1);
    }
  }
  c.fillStyle = cols.dark;
  for (let a = 0; a < 32; a++) {
    const t2 = (a / 32) * Math.PI * 2;
    c.fillRect(dx + Math.round(Math.cos(t2) * r), Math.round(cy + Math.sin(t2) * r), 1, 1);
  }
}

/**
 * Kidolt dominolap. UGYANANNYI pontot visel, mint allva: a kidolt es az allo
 * valtozat ugyanabbol a kind-indexbol keszul, tehat ugyanaz a pontparos jar
 * hozza. Igy vegig kovetheto, melyik lap dolt el.
 */
function drawFallenDomino(c, L, T, cols, rng, idx) {
  const [pa, pb] = DOMINO_PAIRS[(idx | 0) % DOMINO_PAIRS.length];
  const th = Math.max(7, Math.round(T * 0.86));
  const ty = Math.round(T / 2 - th / 2);

  c.fillStyle = cols.mid;
  c.fillRect(0, ty, L, th);
  c.fillStyle = cols.light;
  c.fillRect(0, ty, L, 1);
  c.fillStyle = cols.trunkDark;
  c.fillRect(0, ty + th - 1, L, 1);
  c.fillRect(L - 1, ty, 1, th);
  c.fillStyle = cols.dark;
  c.fillRect((L >> 1) - 1, ty + 1, 1, th - 2);

  const pip = (n, x0, x1) => {
    const gw = x1 - x0 - 4;
    const gh = th - 5;
    for (const [gx, gy] of PIPS[n]) {
      const px = x0 + 2 + Math.round((gx / 2) * gw);
      const py = ty + 2 + Math.round((gy / 2) * gh);
      c.fillStyle = cols.dark;
      c.fillRect(px, py, 2, 2);
      c.fillStyle = cols.hi;
      c.fillRect(px, py, 1, 1);
    }
  };
  pip(pa, 0, (L >> 1) - 1);
  pip(pb, (L >> 1), L);
}

/** Kidolt raketa: fekvo cso csavart csikkal, a vegen a hegyes orrkup. */
function drawFallenRocket(c, L, T, cols, rng) {
  const cy = T / 2;
  const th = Math.max(5, Math.round(T * 0.54));
  const ty = Math.round(cy - th / 2);
  const nose = Math.round(L * 0.22);
  const stand = Math.round(L * 0.12);

  // szethullott allvany a toven
  c.fillStyle = cols.trunkDark;
  c.fillRect(0, ty - 2, stand, th + 4);
  c.fillStyle = cols.trunk;
  c.fillRect(0, ty - 1, stand, 1);
  c.fillStyle = cols.trunkLight;
  c.fillRect(0, ty - 2, 1, th + 4);

  // a cso, hengeres arnyekolassal (most fentrol lefele)
  for (let y = 0; y < th; y++) {
    const k = y / Math.max(1, th - 1);
    c.fillStyle = k < 0.2 ? cols.light : (k > 0.78 ? cols.dark : cols.mid);
    c.fillRect(stand, ty + y, L - stand - nose, 1);
  }
  for (let x = stand; x < L - nose; x++) {
    for (let y = 0; y < th; y++) {
      if ((y + x * 2) % 6 >= 2) continue;
      c.fillStyle = y / Math.max(1, th - 1) > 0.78 ? cols.mid : cols.hi;
      c.fillRect(x, ty + y, 1, 1);
    }
  }
  c.fillStyle = cols.trunkDark;                   // abroncsok
  c.fillRect(stand, ty, 1, th);
  c.fillRect(L - nose - 1, ty, 1, th);

  // hegyes orrkup oldalra fordulva
  for (let i = 0; i < nose; i++) {
    const k = 1 - i / Math.max(1, nose - 1);
    const hh = Math.max(1, Math.round(1 + k * (th - 1)));
    const y0 = Math.round(cy - hh / 2);
    for (let y = 0; y < hh; y++) {
      const kk = hh > 1 ? y / (hh - 1) : 0;
      c.fillStyle = kk < 0.3 ? cols.hi : (kk > 0.8 ? cols.dark : cols.light);
      c.fillRect(L - nose + i, y0 + y, 1, 1);
    }
  }
  c.fillStyle = cols.dark;                        // kormos folt a kanocnal
  for (let i = 0; i < 3; i++) {
    c.fillRect(stand + 1 + ((rng() * 3) | 0), ty + 1 + ((rng() * (th - 2)) | 0), 1, 1);
  }
}

/** Kidolt szelmalom: fekvo torony, a vegen a sisak. Vitorla nelkul. */
function drawFallenMill(c, L, T, cols) {
  const cy = T / 2;
  const cap = Math.round(L * 0.2);
  const botTh = Math.max(7, Math.round(T * 0.94));
  const topTh = Math.max(6, Math.round(T * 0.72));

  for (let x = 0; x < L - cap; x++) {
    const k = 1 - x / Math.max(1, L - cap - 1);
    const th = Math.round(topTh + (botTh - topTh) * k);
    const y0 = Math.round(cy - th / 2);
    for (let y = y0; y < y0 + th; y++) {
      const seam = x % 3 === 2 || (y + ((x / 3) | 0) * 2) % 5 === 0;
      c.fillStyle = seam ? cols.dark : (y < y0 + 2 ? cols.light : cols.mid);
      c.fillRect(x, y, 1, 1);
    }
    c.fillStyle = cols.trunkDark;
    c.fillRect(x, y0 + th - 1, 1, 1);
  }
  for (let i = 0; i < cap; i++) {
    const th = Math.round(topTh * (1 - 0.35 * (i / Math.max(1, cap - 1)))) + 2;
    const y0 = Math.round(cy - th / 2);
    c.fillStyle = i < 2 ? cols.trunkLight : cols.trunk;
    c.fillRect(L - cap + i, y0, 1, th);
  }
  c.fillStyle = cols.hi;                         // friss torasfelulet a toven
  c.fillRect(0, Math.round(cy - botTh / 2), 2, botTh);
  c.fillStyle = cols.trunkDark;
  c.fillRect(0, Math.round(cy - 1), 2, 2);
}

/** Kidolt szelerőmű: karcsu feher cso, a vegen a gondolaval. */
function drawFallenTurbine(c, L, T, cols) {
  const cy = T / 2;
  const nac = Math.round(L * 0.16);
  const botTh = Math.max(5, Math.round(T * 0.5));
  const topTh = 3;
  for (let x = 0; x < L - nac; x++) {
    const k = 1 - x / Math.max(1, L - nac - 1);
    const th = Math.round(topTh + (botTh - topTh) * k);
    const y0 = Math.round(cy - th / 2);
    for (let y = y0; y < y0 + th; y++) {
      const kk = th > 1 ? (y - y0) / (th - 1) : 0;
      c.fillStyle = kk < 0.34 ? cols.light : (kk > 0.72 ? cols.dark : cols.mid);
      c.fillRect(x, y, 1, 1);
    }
  }
  const ny = Math.round(cy - 2);
  c.fillStyle = cols.trunk;                      // gondola a torzs vegen
  c.fillRect(L - nac, ny, nac, 5);
  c.fillStyle = cols.trunkLight;
  c.fillRect(L - nac, ny, nac, 1);
  c.fillStyle = cols.trunkDark;
  c.fillRect(L - nac, ny + 4, nac, 1);
  c.fillStyle = cols.dark;                       // letort betonalap a toven
  c.fillRect(0, Math.round(cy - botTh / 2), 2, botTh);
}

const FALLEN_SHAPES = {
  turbine: drawFallenTurbine,
  rocket: drawFallenRocket,
  mill: drawFallenMill,
  domino: drawFallenDomino,
  totem: drawFallenTotem,
  lolly: drawFallenLolly,
  pine: drawFallenPine,
  grave: drawFallenSlab,
  obelisk: drawFallenColumn,
  ice: drawFallenShard,
  crystal: drawFallenCrystalLog,
};

export function buildFallen() {
  return TREE_KINDS.map((v, i) => {
    const L = v.h;
    const T = Math.max(11, Math.round(v.w * 0.82));
    const shape = FALLEN_SHAPES[v.shape] || drawFallenPine;
    const alpha = CLEAR_SHAPES[v.shape] || 0;
    const cols = shadeCols(v.cols || TREE_COLS.live, i, alpha ? 1.9 : 1);
    const live = { cv: shapeCanvas(L, T, shape, cols, 2000 + i * 13, i, alpha) };
    const chr = { cv: shapeCanvas(L, T, shape, charCols(cols), 2000 + i * 13, i, alpha) };
    // (a shapeCanvas atadja az i indexet, tehat a nyaloka ize is stimmel)
    return {
      L, T,
      right: live.cv, down: rot(live.cv, 1), left: rot(live.cv, 2), up: rot(live.cv, 3),
      charRight: chr.cv, charDown: rot(chr.cv, 1), charLeft: rot(chr.cv, 2), charUp: rot(chr.cv, 3),
    };
  });
}

/** A helyben maradt to. A temaval egyutt valtozik a szine es a formaja. */
export function buildStump() {
  const { cv, c } = makeCanvas(9, 6);
  const k = TREE_KINDS[1] || TREE_KINDS[0];
  const cols = (k && k.cols) || TREE_COLS.live;
  const shape = k ? k.shape : 'pine';

  c.fillStyle = cols.trunkDark;
  c.fillRect(1, 2, 7, 4);
  c.fillStyle = cols.trunk;
  c.fillRect(1, 1, 7, 3);
  c.fillStyle = cols.trunkLight;
  c.fillRect(2, 1, 5, 2);

  if (shape === 'grave' || shape === 'obelisk') {
    // torott ko: szabalytalan perem, nem evgyuru
    c.fillStyle = cols.dark;
    c.fillRect(2, 1, 1, 1);
    c.fillRect(5, 1, 2, 1);
    c.fillStyle = cols.hi;
    c.fillRect(3, 2, 2, 1);
  } else if (shape === 'rocket') {
    // Kiloves utani indítoallvany: elszenesedett, kormos deszkacsonk.
    c.fillStyle = '#2e2620';
    c.fillRect(1, 1, 7, 3);
    c.fillStyle = '#4a3a2c';
    c.fillRect(2, 1, 5, 1);
    c.fillStyle = '#8a4a20';
    c.fillRect(3, 2, 1, 1);
    c.fillRect(5, 2, 1, 1);
  } else if (shape === 'ice' || shape === 'crystal') {
    // torott jeg/kristaly: eles csillanas
    c.fillStyle = cols.hi;
    c.fillRect(3, 1, 3, 1);
    c.fillRect(2, 2, 1, 1);
    c.fillStyle = cols.dark;
    c.fillRect(5, 2, 2, 1);
  } else {
    c.fillStyle = PAL.woodPale;
    c.fillRect(2, 1, 5, 2);
    c.fillStyle = '#8a5c34';
    c.fillRect(3, 1, 3, 1);
    c.fillStyle = '#6b4526';
    c.fillRect(4, 2, 1, 1);
  }
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
  scythe: { len: 1.2, hook: 5, span: 2.0, grow: 0.72, handle: '#3a2a1e', blade: '#cfd6dd' },
  khopesh: { len: 0.8, hook: 4, span: 1.7, grow: 0.6, handle: '#c9a24a', blade: '#e8d08a' },
  icepick: { len: 0.95, half: 1, depth: 2, edge: 2.4, both: false, handle: '#6a5240', blade: '#cfe8f4' },
  laser: { len: 0.75, half: 1, depth: 0, edge: 1.2, both: false, handle: '#8a9098', blade: '#7cf0ff', beam: true },
  rusty: { len: 1.0, half: 2, depth: 1, edge: 1.7, both: false, handle: '#4a3a28', blade: '#8a5a3a' },
  shovel: { len: 1.15, scoop: true, handle: '#7a5c38', blade: '#9aa5b0' },
  harpoon: { len: 1.5, half: 1, depth: 2, edge: 2.8, both: false, handle: '#6a5240', blade: '#cfd6dd' },
  // Vonalzo: a dominopalya "fejszeje". Lapos, egyenes, femes elu.
  ruler: { len: 1.25, half: 0, depth: 0, edge: 0.6, both: false, handle: '#d8d8d0', blade: '#8ab8e8' },
  machete: { len: 1.1, hook: 4, span: 0.9, grow: 0.85, handle: '#4a3a28', blade: '#c8d0d8' },
  macua: { len: 0.95, half: 3, depth: 1, edge: 1.5, both: true, handle: '#6b5230', blade: '#2a2438' },
  candy: { len: 1.05, hook: 5, span: 2.6, grow: 0.62, handle: '#ffffff', blade: '#f04a8a' },
  whisk: { len: 1.0, whisk: true, handle: '#c8c4b8', blade: '#e8ecf0' },
  pitchfork: { len: 1.35, prongs: 3, handle: '#6f5230', blade: '#b0b8c0' },
  // Faklya: a nyel vegen lobogo lang, nem penge. A tuzijatek-palya "fejszeje".
  torch: { len: 1.0, torch: true, handle: '#5a4028' },
  // Gyufa: rovid, vilagos palcika, a vegen voros fejjel es apro langgal.
  match: { len: 0.55, torch: true, small: true, head: '#c83a30', handle: '#e0d0a8' },
  // Feszitovas: hajlitott, festett femrud. A betoro szerszama.
  crowbar: { len: 1.2, hook: 3, span: 0.7, grow: 0.9, handle: '#c04a3c', blade: '#e0665a' },
  // Sulyok: vaskos fatomb a nyel vegen. A molnar es a sajtos szerszama.
  mallet: { len: 0.95, mallet: true, handle: '#8a6a3a', blade: '#b08a4a' },
  // Sutolapat: hosszu nyel, lapos fatanyer. A peke.
  peel: { len: 1.45, scoop: true, tip: '#e0c8a0', handle: '#8a6a3a', blade: '#c8b08a' },
  // Tejesvodor: a fejolany "fejszeje". Rovid fogo, a vegen tele vederrel.
  pail: { len: 0.7, pail: true, handle: '#6a5a38', blade: '#a8905c' },
  // Sepru: fanyel, a vegen szetterulo szalmavesszokkel. A boszorkanye.
  // Pingvin-uszony: nem szerszam, hanem a sajat szarnya. Ezert rovid, es a
  // "nyele" is fekete: a karbol folyik ki, nem a kezeben van.
  flipper: { len: 0.42, flipper: true, handle: '#22262e', blade: '#22262e' },
  // Hal a jegesmedve mancsaban.
  fish: { len: 0.5, fish: true, handle: '#5e7a94', blade: '#8aa8c0', belly: '#d8e4ee', tail: '#5e7a94' },
  // Samanbot: csontdisszel es tollal.
  staff: { len: 1.4, staff: true, handle: '#6a5238', blade: '#e8e0cc', feather: '#c8506a' },
  gift: { len: 0.8, gift: true, handle: '#6a4a28', blade: '#2f8a3c', ribbon: '#f0d24a' },
  broom: { len: 1.3, broom: true, handle: '#7a5a2e', blade: '#d8b45c', straw: '#a87c30', tie: '#5e4420' },
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

  // Faklya (es a kisebb testvere, a gyufa): lang a nyel vegen, nem penge.
  if (k.torch) {
    c.fillStyle = k.head || '#2e2018';
    c.fillRect(Math.round(hx), Math.round(hy), 1, 1);
    const fl = k.small
      ? [['#ffb03c', 0], ['#fff4c8', 0]]
      : [['#f08a2c', 1], ['#ffd257', 1], ['#fff4c8', 0]];
    for (let b = 0; b < fl.length; b++) {
      c.fillStyle = fl[b][0];
      const wdt = fl[b][1];
      for (let sp = -wdt; sp <= wdt; sp++) {
        c.fillRect(
          Math.round(hx + px * sp + dx * (b + 1)),
          Math.round(hy + py * sp + dy * (b + 1)), 1, 1,
        );
      }
    }
    return;
  }

  // Uszony: a pingvinnek nincs szerszama, a SAJAT szarnyat lenditi. Rovid,
  // lekerekitett fekete lapat, ami a karbol folytatodik.
  if (k.flipper) {
    c.fillStyle = k.blade;
    for (let b = 0; b <= 3; b++) {
      const wide = b < 2 ? 1 : 0;
      for (let sp = -wide; sp <= wide; sp++) {
        c.fillRect(
          Math.round(hx + px * sp + dx * b),
          Math.round(hy + py * sp + dy * b), 1, 1,
        );
      }
    }
    return;
  }

  // Hal a mancsban: a farkanal fogva, a teste kifele all. A jegesmedvee.
  if (k.fish) {
    c.fillStyle = k.tail;                        // farokusz a to felol
    for (let sp = -2; sp <= 2; sp += 2) {
      c.fillRect(Math.round(hx + px * sp - dx), Math.round(hy + py * sp - dy), 1, 1);
    }
    c.fillStyle = k.blade;                       // orsó alaku test
    for (let b = 0; b <= 4; b++) {
      const wide = b === 0 || b === 4 ? 0 : 1;
      for (let sp = -wide; sp <= wide; sp++) {
        c.fillRect(
          Math.round(hx + px * sp + dx * b),
          Math.round(hy + py * sp + dy * b), 1, 1,
        );
      }
    }
    c.fillStyle = k.belly;                       // vilagos has
    for (let b = 1; b <= 3; b++) {
      c.fillRect(Math.round(hx + px + dx * b), Math.round(hy + py + dy * b), 1, 1);
    }
    c.fillStyle = '#16161c';                     // szem
    c.fillRect(Math.round(hx + dx * 3), Math.round(hy + dy * 3), 1, 1);
    return;
  }

  // Samanbot: hosszu fanyel, a vegen agasodo csontdisszel es lelogo tollal.
  if (k.staff) {
    c.fillStyle = k.blade;
    for (let sp = -1; sp <= 1; sp++) {
      c.fillRect(Math.round(hx + px * sp), Math.round(hy + py * sp), 1, 1);
    }
    c.fillRect(Math.round(hx + dx), Math.round(hy + dy), 1, 1);
    c.fillRect(Math.round(hx + px * 2 + dx), Math.round(hy + py * 2 + dy), 1, 1);
    c.fillRect(Math.round(hx - px * 2 + dx), Math.round(hy - py * 2 + dy), 1, 1);
    c.fillRect(Math.round(hx + px * 2 + dx * 2), Math.round(hy + py * 2 + dy * 2), 1, 1);
    c.fillRect(Math.round(hx - px * 2 + dx * 2), Math.round(hy - py * 2 + dy * 2), 1, 1);
    c.fillStyle = k.feather;                     // lelogo toll a bot alatt
    c.fillRect(Math.round(hx + px * 2 - dx * 2), Math.round(hy + py * 2 - dy * 2), 1, 1);
    c.fillRect(Math.round(hx + px * 3 - dx * 3), Math.round(hy + py * 3 - dy * 3), 1, 1);
    return;
  }

  // Ajandekdoboz a nyel vegen, szalaggal atkotve. A Telapoe.
  if (k.gift) {
    c.fillStyle = k.blade;
    for (let b = 0; b <= 3; b++) {
      for (let sp = -2; sp <= 2; sp++) {
        c.fillRect(
          Math.round(hx + px * sp + dx * b),
          Math.round(hy + py * sp + dy * b), 1, 1,
        );
      }
    }
    c.fillStyle = k.ribbon;                      // kereszt alaku szalag
    for (let b = 0; b <= 3; b++) {
      c.fillRect(Math.round(hx + dx * b), Math.round(hy + dy * b), 1, 1);
    }
    for (let sp = -2; sp <= 2; sp++) {
      c.fillRect(Math.round(hx + px * sp + dx * 2), Math.round(hy + py * sp + dy * 2), 1, 1);
    }
    c.fillStyle = '#fff4c8';                     // masni a doboz tetejen
    c.fillRect(Math.round(hx + px + dx * 4), Math.round(hy + py + dy * 4), 1, 1);
    c.fillRect(Math.round(hx - px + dx * 4), Math.round(hy - py + dy * 4), 1, 1);
    return;
  }

  // Sepru: a nyel vegen HAROMSZOGBEN szetterulo szalmaszalak, a tovuknel
  // kotessel. A habvero kerek pamacsa seprunek nem volt jo.
  if (k.broom) {
    for (let b = 1; b <= 4; b++) {
      const wide = Math.min(2, b);
      for (let sp = -wide; sp <= wide; sp++) {
        if (b === 4 && (sp + 4) % 2) continue;   // a vegen szellos szalak
        c.fillStyle = (sp + b) % 2 ? k.blade : k.straw;
        c.fillRect(
          Math.round(hx + px * sp + dx * b),
          Math.round(hy + py * sp + dy * b), 1, 1,
        );
      }
    }
    c.fillStyle = k.tie;                         // kotes a szalak toven
    for (let sp = -1; sp <= 1; sp++) {
      c.fillRect(Math.round(hx + px * sp), Math.round(hy + py * sp), 1, 1);
    }
    return;
  }

  // Tejesvodor: a nyel vegen dongas veder, a tetejen kilottyano tejjel.
  // Lenditeskor a tej is vele mozdul, tehat latszik, hogy tele van.
  if (k.pail) {
    c.fillStyle = k.blade;
    for (let b = 0; b <= 3; b++) {
      const wide = b === 0 ? 1 : 2;
      for (let sp = -wide; sp <= wide; sp++) {
        c.fillRect(
          Math.round(hx + px * sp + dx * b),
          Math.round(hy + py * sp + dy * b), 1, 1,
        );
      }
    }
    c.fillStyle = '#7a663e';                 // abroncs
    for (let sp = -2; sp <= 2; sp++) {
      c.fillRect(Math.round(hx + px * sp + dx * 2), Math.round(hy + py * sp + dy * 2), 1, 1);
    }
    c.fillStyle = '#f8f6ee';                 // tej a peremen
    for (let sp = -2; sp <= 2; sp++) {
      c.fillRect(Math.round(hx + px * sp + dx * 3), Math.round(hy + py * sp + dy * 3), 1, 1);
    }
    c.fillRect(Math.round(hx + px * 3 + dx * 4), Math.round(hy + py * 3 + dy * 4), 1, 1);
    c.fillRect(Math.round(hx - px * 2 + dx * 5), Math.round(hy - py * 2 + dy * 5), 1, 1);
    c.fillStyle = '#5e4e2e';
    c.fillRect(Math.round(hx - dx), Math.round(hy - dy), 1, 1);
    return;
  }

  // Sulyok: vaskos, tomor fatomb keresztben a nyel vegen.
  if (k.mallet) {
    c.fillStyle = k.blade;
    for (let b = 0; b <= 2; b++) {
      for (let sp = -3; sp <= 3; sp++) {
        c.fillRect(
          Math.round(hx + px * sp + dx * b),
          Math.round(hy + py * sp + dy * b), 1, 1,
        );
      }
    }
    c.fillStyle = '#dcc196';
    for (let sp = -3; sp <= 3; sp++) c.fillRect(Math.round(hx + px * sp), Math.round(hy + py * sp), 1, 1);
    c.fillStyle = '#6b5230';
    c.fillRect(Math.round(hx - dx), Math.round(hy - dy), 1, 1);
    return;
  }

  // Habvero: nehany szetterulo drotszal a nyel vegen.
  if (k.whisk) {
    c.fillStyle = k.blade;
    for (let sp = -2; sp <= 2; sp++) {
      for (let b = 0; b <= 3; b++) {
        const spread = sp * (0.4 + b * 0.25);
        c.fillRect(
          Math.round(hx + px * spread + dx * b),
          Math.round(hy + py * spread + dy * b), 1, 1,
        );
      }
    }
    c.fillStyle = k.ferrule || '#8a9098';
    c.fillRect(Math.round(hx - dx), Math.round(hy - dy), 1, 1);
    return;
  }

  // Lapat: lekerekitett, tomor tanyer a nyel vegen.
  if (k.scoop) {
    c.fillStyle = k.blade;
    for (let b = 0; b <= 3; b++) {
      const wide = b === 0 || b === 3 ? 1 : 2;
      for (let sp = -wide; sp <= wide; sp++) {
        c.fillRect(
          Math.round(hx + px * sp + dx * b),
          Math.round(hy + py * sp + dy * b), 1, 1,
        );
      }
    }
    c.fillStyle = k.tip || '#dfe6ec';
    for (let sp = -2; sp <= 2; sp++) {
      c.fillRect(Math.round(hx + px * sp + dx * 3.2), Math.round(hy + py * sp + dy * 3.2), 1, 1);
    }
    c.fillStyle = '#5b646d';
    c.fillRect(Math.round(hx - dx), Math.round(hy - dy), 1, 1);
    return;
  }

  // Vasvilla: harom parhuzamos ag a nyel vegen.
  if (k.prongs) {
    c.fillStyle = k.blade;
    for (let sp = -2; sp <= 2; sp += 2) {
      for (let b = 0; b <= 3; b++) {
        c.fillRect(
          Math.round(hx + px * sp + dx * b),
          Math.round(hy + py * sp + dy * b), 1, 1,
        );
      }
    }
    c.fillStyle = k.blade;                   // kereszttarto
    for (let sp = -2; sp <= 2; sp++) {
      c.fillRect(Math.round(hx + px * sp), Math.round(hy + py * sp), 1, 1);
    }
    c.fillStyle = '#5b646d';
    c.fillRect(Math.round(hx - dx), Math.round(hy - dy), 1, 1);
    return;
  }

  // Kaszapenge: a nyel vegerol indul, es elore kanyarodik. Kulon ag, mert a
  // szimmetrikus fejszefej ezen a mereten kereszt-alaknak latszana.
  if (k.hook) {
    const n = k.hook;
    for (let j = 0; j <= n; j++) {
      const th = (j / n) * k.span;
      const rr = 1.1 + j * k.grow;
      // A hatso oldalrol indul es elore kanyarodik: igy fer ki a penge a
      // sprite-on belul, es kaszanak latszik, nem keresztnek.
      const ux = -px * Math.cos(th) + dx * Math.sin(th);
      const uy = -py * Math.cos(th) + dy * Math.sin(th);
      c.fillStyle = j > n * 0.45 ? '#f4fbff' : k.blade;
      c.fillRect(Math.round(hx + ux * rr), Math.round(hy + uy * rr), 1, 1);
      if (j < n) {                       // a penge tove vastagabb
        c.fillStyle = k.blade;
        c.fillRect(Math.round(hx + ux * (rr - 1)), Math.round(hy + uy * (rr - 1)), 1, 1);
      }
    }
    c.fillStyle = '#5b646d';
    c.fillRect(Math.round(hx - dx), Math.round(hy - dy), 1, 1);
    return;
  }

  const head = (sign) => {
    c.fillStyle = k.blade || '#9aa5b0';
    for (let b = -k.depth; b <= k.depth; b++) {
      for (let sp = -k.half; sp <= k.half; sp++) {
        c.fillRect(
          Math.round(hx + px * sp + dx * b * sign),
          Math.round(hy + py * sp + dy * b * sign), 1, 1,
        );
      }
    }
    c.fillStyle = k.blade ? '#f0f8ff' : '#dfe6ec';
    for (let sp = -k.half; sp <= k.half; sp++) {
      const bend = 0;
      c.fillRect(
        Math.round(hx + px * sp + dx * (k.edge + bend) * sign),
        Math.round(hy + py * sp + dy * (k.edge + bend) * sign), 1, 1,
      );
    }
  };
  head(1);
  if (k.both) head(-1);
  if (k.beam) {
    // lezervago: vilagito penge a fej elott
    c.fillStyle = 'rgba(124,240,255,0.85)';
    for (let i = 1; i <= 7; i++) {
      c.fillRect(Math.round(hx + dx * i), Math.round(hy + dy * i), 1, 1);
    }
    c.fillStyle = 'rgba(240,255,255,0.9)';
    for (let i = 1; i <= 4; i++) {
      c.fillRect(Math.round(hx + dx * i), Math.round(hy + dy * i), 1, 1);
    }
  }
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
const CAT = { a: '#1e1c24', b: '#33313e', e: '#6ad86a', c: '#0e0d12' };

/** A boszorkany fekete macskaja. Nincs porazon: magatol jon utana. */
function drawCat(c, x, y, frame) {
  // Balra a FELALLO farok, jobbra a fej ket hegyes fullel: enelkul csak egy
  // fekete folt volt lábakkal.
  const rows = frame
    ? ['aa...a.a', '.a...aaa', '.aaaaaaa', '.abbbba.', '.a.aa.a.', '.a.aa.a.']
    : ['aa...a.a', '.a...aaa', '.aaaaaaa', '.abbbba.', 'a.a..a.a', 'a.a..a.a'];
  for (let ry = 0; ry < rows.length; ry++) {
    for (let rx = 0; rx < 8; rx++) {
      const ch = rows[ry][rx];
      if (ch === '.') continue;
      c.fillStyle = CAT[ch] || CAT.a;
      c.fillRect(x + rx, y + ry, 1, 1);
    }
  }
  c.fillStyle = CAT.e;
  c.fillRect(x + 6, y + 2, 1, 1);          // zolden vilagito szem
  c.fillStyle = CAT.c;
  c.fillRect(x + 5, y + 1, 1, 1);          // arnyek a fulek kozott
}

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
/** Egy szal tulipan a masik kezben: szar, ket levél, es a szirom-kehely. */
function drawTulip(c, x, y) {
  c.fillStyle = '#3c6b32';                   // szar
  c.fillRect(x + 1, y - 5, 1, 6);
  c.fillStyle = '#4f8a42';                   // ket levél
  c.fillRect(x, y - 2, 1, 1);
  c.fillRect(x + 2, y - 3, 1, 1);
  c.fillStyle = '#c8362a';                   // sziromkehely
  c.fillRect(x, y - 8, 3, 3);
  c.fillStyle = '#ff8a6a';
  c.fillRect(x, y - 8, 1, 2);
  c.fillStyle = '#8f2620';
  c.fillRect(x + 1, y - 8, 1, 1);            // a szirmok kozti hasadek
}

/** Tejesvodor a masik kezben: dongas veder, a peremen kicsordulo tejjel. */
function drawPail(c, x, y) {
  c.fillStyle = '#6a5a38';                   // ful
  c.fillRect(x - 1, y - 6, 1, 2);
  c.fillStyle = '#a8905c';                   // dongas veder
  c.fillRect(x, y - 5, 4, 5);
  c.fillStyle = '#c8ac72';
  c.fillRect(x, y - 5, 1, 5);
  c.fillStyle = '#7a663e';                   // abroncsok
  c.fillRect(x, y - 4, 4, 1);
  c.fillRect(x, y - 1, 4, 1);
  c.fillStyle = '#f8f6ee';                   // tej a peremen
  c.fillRect(x, y - 6, 4, 1);
  c.fillStyle = '#e4e0d0';
  c.fillRect(x + 3, y - 5, 1, 2);            // kilottyano csik az oldalan
}

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

/**
 * A fejet a faj hatarozza meg. A test es a ruha kozos: igy minden temaban
 * ugyanaz a sziluett, csak a "ki ez" valtozik.
 */
function drawSpeciesHead(c, dir, t, hx, y0, back, side) {
  const sp = t.species;
  if (sp === 'skeleton') {
    c.fillStyle = t.skin;
    c.fillRect(hx, 7 + y0, 6, 6);
    c.fillStyle = t.skinDark;
    c.fillRect(hx, 7 + y0, 1, 6);
    c.fillRect(hx, 12 + y0, 6, 1);
    if (back) {
      c.fillStyle = t.skinDark;
      c.fillRect(hx + 2, 7 + y0, 1, 5);      // koponyavarrat
      c.fillRect(hx, 9 + y0, 6, 1);
      return;
    }
    c.fillStyle = '#14121a';
    if (side) {
      c.fillRect(hx + 3, 9 + y0, 2, 2);      // szemureg profilbol
      c.fillStyle = t.skinDark;
      c.fillRect(hx + 5, 11 + y0, 1, 1);     // pofacsont
      c.fillStyle = '#14121a';
      c.fillRect(hx + 3, 12 + y0, 1, 1);     // fogak
      c.fillRect(hx + 5, 12 + y0, 1, 1);
    } else {
      c.fillRect(hx, 9 + y0, 2, 2);
      c.fillRect(hx + 4, 9 + y0, 2, 2);
      c.fillRect(hx + 2, 11 + y0, 2, 1);     // orrureg
      c.fillRect(hx + 1, 12 + y0, 1, 1);     // fogak
      c.fillRect(hx + 3, 12 + y0, 1, 1);
      c.fillRect(hx + 5, 12 + y0, 1, 1);
    }
    return;
  }

  if (sp === 'mummy') {
    // Szandekosan NAGYOBB fej: ezen a mereten csak igy latszik a fasli.
    c.fillStyle = t.skin;
    c.fillRect(hx - 1, 6 + y0, 8, 7);
    c.fillStyle = t.skinDark;
    c.fillRect(hx - 1, 6 + y0, 1, 7);
    c.fillRect(hx - 1, 6 + y0, 8, 1);
    c.fillRect(hx - 1, 8 + y0, 8, 1);        // korbefuto kotesek
    c.fillRect(hx, 11 + y0, 7, 1);
    c.fillRect(hx - 1, 12 + y0, 6, 1);
    c.fillStyle = t.skinDark;
    for (let i = 0; i < 3; i++) {            // ferde savok a homlokon
      c.fillRect(hx + 1 + i * 2, 7 + y0, 1, 1);
    }
    if (back) return;
    c.fillStyle = '#140f06';
    if (side) {
      c.fillRect(hx + 3, 9 + y0, 4, 2);      // resnyi nyilas
      c.fillStyle = t.tint;
      c.fillRect(hx + 5, 9 + y0, 1, 1);      // vilagito szem
    } else {
      c.fillRect(hx, 9 + y0, 6, 2);
      c.fillStyle = t.tint;
      c.fillRect(hx, 9 + y0, 1, 1);
      c.fillRect(hx + 5, 9 + y0, 1, 1);
    }
    c.fillStyle = t.skin;                    // lelogo kotesveg a vallnal
    c.fillRect(hx + 6, 13 + y0, 1, 4);
    c.fillStyle = t.skinDark;
    c.fillRect(hx + 6, 16 + y0, 1, 1);
    return;
  }

  if (sp === 'astronaut' && t.alien) {
    c.fillStyle = t.skin;
    c.fillRect(hx - 1, 5 + y0, 8, 7);        // nagy, kortealaku koponya
    c.fillRect(hx, 12 + y0, 6, 1);
    c.fillStyle = t.skinDark;
    c.fillRect(hx - 1, 5 + y0, 1, 7);
    c.fillRect(hx - 1, 11 + y0, 8, 1);
    if (back) return;
    c.fillStyle = '#0a0a12';
    if (side) {
      c.fillRect(hx + 3, 7 + y0, 3, 3);
      c.fillStyle = '#c8f0ff';
      c.fillRect(hx + 5, 7 + y0, 1, 1);
    } else {
      c.fillRect(hx, 7 + y0, 2, 3);
      c.fillRect(hx + 4, 7 + y0, 2, 3);
      c.fillStyle = '#c8f0ff';
      c.fillRect(hx, 7 + y0, 1, 1);
      c.fillRect(hx + 4, 7 + y0, 1, 1);
      c.fillStyle = t.skinDark;
      c.fillRect(hx + 2, 10 + y0, 2, 1);     // keskeny szaj
    }
    return;
  }

  if (sp === 'nutcracker') {
    // Diotoro: fabol faragott, szogletes fej, nagy fogsorral es festett
    // pirospozsgas arccal. A nagy allkapocs a lenyeg: arrol lehet felismerni.
    c.fillStyle = t.skin;
    c.fillRect(hx - 1, 6 + y0, 8, 7);
    c.fillStyle = t.skinDark;
    c.fillRect(hx - 1, 6 + y0, 1, 7);
    c.fillRect(hx - 1, 6 + y0, 8, 1);
    if (back) {
      c.fillStyle = t.hair;                    // feher tarkohaj
      c.fillRect(hx - 1, 10 + y0, 8, 3);
      return;
    }
    c.fillStyle = '#1a1a20';                   // szemek
    if (side) c.fillRect(hx + 4, 8 + y0, 1, 2);
    else {
      c.fillRect(hx + 1, 8 + y0, 1, 2);
      c.fillRect(hx + 4, 8 + y0, 1, 2);
    }
    c.fillStyle = '#d05a4a';                   // festett pirospozsgas arc
    if (!side) {
      c.fillRect(hx - 1, 10 + y0, 1, 1);
      c.fillRect(hx + 5, 10 + y0, 1, 1);
    }
    c.fillStyle = t.hair;                      // bajusz
    if (side) c.fillRect(hx + 3, 10 + y0, 4, 1);
    else c.fillRect(hx, 10 + y0, 6, 1);
    // NAGY allkapocs feher fogsorral
    c.fillStyle = t.skinDark;
    c.fillRect(hx - 1, 11 + y0, 8, 3);
    c.fillStyle = '#f4f4ec';
    if (side) {
      c.fillRect(hx + 3, 12 + y0, 4, 1);
      c.fillStyle = t.skinDark;
      c.fillRect(hx + 4, 12 + y0, 1, 1);
      c.fillRect(hx + 6, 12 + y0, 1, 1);
    } else {
      c.fillRect(hx, 12 + y0, 6, 1);
      c.fillStyle = t.skinDark;
      c.fillRect(hx + 1, 12 + y0, 1, 1);
      c.fillRect(hx + 3, 12 + y0, 1, 1);
      c.fillRect(hx + 5, 12 + y0, 1, 1);
    }
    c.fillStyle = t.hair;                      // feher szakall az allkapocs alatt
    c.fillRect(hx, 14 + y0, 6, 2);
    c.fillStyle = '#c8c8c0';
    c.fillRect(hx + 1, 15 + y0, 4, 1);
    return;
  }

  if (sp === 'vampire') {
    // Vampir: sapadt arc, HEGYES CSUCSBA futo hajszallal a homlokan, voros
    // szemmel es ket agyarral. A hajcsucs az, amitol egy pillanat alatt
    // felismerheto - anelkul csak egy sapadt ember lenne.
    c.fillStyle = t.skin;
    c.fillRect(hx, 7 + y0, 6, 6);
    c.fillStyle = t.skinDark;
    c.fillRect(hx, 7 + y0, 1, 6);
    c.fillRect(hx, 12 + y0, 6, 1);
    c.fillStyle = t.hair;                        // hatrafesult, fenyes haj
    c.fillRect(hx - 1, 4 + y0, 8, 4);
    c.fillStyle = t.beardDark;
    c.fillRect(hx - 1, 4 + y0, 8, 1);
    if (back) {
      c.fillStyle = t.hair;
      c.fillRect(hx - 1, 4 + y0, 8, 7);
      return;
    }
    c.fillStyle = t.hair;                        // ozvegycsucs a homlokon
    c.fillRect(hx + 2, 8 + y0, 2, 1);
    c.fillRect(hx + 2, 9 + y0, 1, 1);
    c.fillStyle = '#e0203c';                     // voros szemek
    if (side) c.fillRect(hx + 4, 9 + y0, 1, 1);
    else {
      c.fillRect(hx + 1, 9 + y0, 1, 1);
      c.fillRect(hx + 4, 9 + y0, 1, 1);
    }
    c.fillStyle = t.skinDark;                    // vekony szaj
    if (side) c.fillRect(hx + 4, 11 + y0, 2, 1);
    else c.fillRect(hx + 2, 11 + y0, 3, 1);
    c.fillStyle = '#ffffff';                     // ket agyar
    if (side) c.fillRect(hx + 5, 12 + y0, 1, 1);
    else {
      c.fillRect(hx + 2, 12 + y0, 1, 1);
      c.fillRect(hx + 4, 12 + y0, 1, 1);
    }
    return;
  }

  if (sp === 'eagle') {
    // Sas: a fej egy NYITOTT CSORU sassisak, amibol kinez a harcos arca.
    // A jaguarharcos parja, ezert ugyanaz a felepites: allati fej, ember szem.
    c.fillStyle = t.cap;                         // sisak-koponya
    c.fillRect(hx - 1, 3 + y0, 8, 6);
    c.fillStyle = t.capDark;
    c.fillRect(hx - 1, 3 + y0, 8, 1);
    c.fillRect(hx - 1, 8 + y0, 8, 1);
    c.fillStyle = t.hair;                        // tollbokreta a tetejen
    c.fillRect(hx + 1, 1 + y0, 1, 2);
    c.fillRect(hx + 3, y0, 1, 3);
    c.fillRect(hx + 5, 1 + y0, 1, 2);
    c.fillStyle = t.skin;                        // a kinezo arc
    c.fillRect(hx, 9 + y0, 6, 4);
    c.fillStyle = t.skinDark;
    c.fillRect(hx, 9 + y0, 1, 4);
    c.fillRect(hx, 12 + y0, 6, 1);
    if (back) {
      c.fillStyle = t.capDark;
      c.fillRect(hx - 1, 9 + y0, 8, 4);
      return;
    }
    c.fillStyle = '#1a1210';                     // ember szem a sisak alatt
    if (side) c.fillRect(hx + 4, 10 + y0, 1, 1);
    else {
      c.fillRect(hx + 1, 10 + y0, 1, 1);
      c.fillRect(hx + 4, 10 + y0, 1, 1);
    }
    // A CSOR: sarga, hajlott, a sisak elorenyulo resze.
    c.fillStyle = '#f0b028';
    if (side) {
      c.fillRect(hx + 6, 5 + y0, 3, 2);
      c.fillRect(hx + 8, 7 + y0, 1, 2);
      c.fillStyle = '#b87c10';
      c.fillRect(hx + 6, 7 + y0, 2, 1);
    } else {
      c.fillRect(hx + 2, 5 + y0, 2, 4);
      c.fillStyle = '#b87c10';
      c.fillRect(hx + 3, 6 + y0, 1, 3);
    }
    c.fillStyle = '#1a1210';                     // sasszem a sisakon
    if (!side) {
      c.fillRect(hx, 5 + y0, 1, 1);
      c.fillRect(hx + 5, 5 + y0, 1, 1);
    } else {
      c.fillRect(hx + 4, 5 + y0, 1, 1);
    }
    return;
  }

  if (sp === 'grey') {
    // Kis szurke: SZURKE bor, CIAN mandulaszemekkel. A fej csepp alaku es
    // hatalmas, de LEJJEBB kezdodik, mint masnal - igy a torzsbol alig
    // latszik valami, es tomzsi, foldkozeli kis leny lesz belole.
    const dome = [
      [5, -2, 10], [6, -3, 12], [7, -3, 12], [8, -3, 12], [9, -2, 10],
      [10, -1, 8], [11, 0, 6], [12, 1, 4], [13, 2, 2],
    ];
    for (const [ry, dx, ww] of dome) {
      c.fillStyle = t.skin;
      c.fillRect(hx + dx, ry + y0, ww, 1);
      c.fillStyle = t.skinDark;                  // arnyekos jobb perem
      c.fillRect(hx + dx + ww - 1, ry + y0, 1, 1);
    }
    c.fillStyle = t.skinDark;
    c.fillRect(hx - 2, 5 + y0, 10, 1);           // a koponya teteje
    c.fillStyle = t.hair;                        // vilagos csillanas balra
    c.fillRect(hx - 1, 6 + y0, 2, 1);
    if (back) return;

    // A KET NAGY MANDULASZEM. Ez a karakter lenyege: befele-lefele dolo,
    // cianul vilagito szempar, korulotte sotet peremmel.
    const eye = (x0, mir) => {
      const rows = [[8, mir ? x0 : x0, 3], [9, mir ? x0 - 1 : x0, 4], [10, mir ? x0 - 1 : x0 + 1, 3]];
      for (const [ry, ex, ew] of rows) {
        c.fillStyle = t.capDark;
        c.fillRect(hx + ex, ry + y0, ew, 1);
      }
      c.fillStyle = t.cap;
      c.fillRect(hx + (mir ? x0 : x0), 9 + y0, 3, 1);
      c.fillStyle = '#ffffff';
      c.fillRect(hx + (mir ? x0 + 1 : x0), 8 + y0, 1, 1);
    };
    if (side) {
      eye(3, false);
    } else {
      eye(-2, false);
      eye(4, true);
    }
    c.fillStyle = t.skinDark;                    // apro szaj
    c.fillRect(hx + (side ? 3 : 2), 12 + y0, 2, 1);
    return;
  }

  if (sp === 'snowman') {
    // Hoember: harom egymasra rakott gomb. A fej a felso: szendarab szemek,
    // repaorr, es szenbol rakott mosoly.
    c.fillStyle = t.skin;
    c.fillRect(hx, 5 + y0, 6, 8);
    c.fillRect(hx - 1, 7 + y0, 8, 4);
    c.fillStyle = t.skinDark;
    c.fillRect(hx - 1, 10 + y0, 8, 1);
    c.fillRect(hx + 5, 6 + y0, 1, 6);
    c.fillStyle = '#ffffff';                     // csillano ho balra fent
    c.fillRect(hx + 1, 5 + y0, 2, 1);
    c.fillRect(hx, 6 + y0, 1, 2);
    if (back) return;
    c.fillStyle = '#16161c';                     // szendarab szemek
    if (side) c.fillRect(hx + 4, 7 + y0, 1, 2);
    else {
      c.fillRect(hx + 1, 7 + y0, 1, 2);
      c.fillRect(hx + 4, 7 + y0, 1, 2);
    }
    c.fillStyle = '#f08a2c';                     // repaorr
    if (side) {
      c.fillRect(hx + 6, 9 + y0, 3, 1);
      c.fillStyle = '#b85c10';
      c.fillRect(hx + 6, 10 + y0, 2, 1);
    } else {
      c.fillRect(hx + 2, 9 + y0, 2, 1);
      c.fillStyle = '#b85c10';
      c.fillRect(hx + 2, 10 + y0, 2, 1);
    }
    c.fillStyle = '#16161c';                     // szenbol rakott mosoly
    if (!side) {
      c.fillRect(hx + 1, 11 + y0, 1, 1);
      c.fillRect(hx + 2, 12 + y0, 2, 1);
      c.fillRect(hx + 4, 11 + y0, 1, 1);
    } else {
      c.fillRect(hx + 4, 12 + y0, 2, 1);
    }
    return;
  }

  if (sp === 'witch') {
    // Vasorru: zold arc, HOSSZU GORBE ORRAL. Profilbol az orr a lenyeg -
    // elore all, majd lefele kunkorodik, es a hegyen ul a szemolcs. Ezert
    // oldalrol a hatso tincs marad csak, elol semmi nem takarja az arcelt.
    c.fillStyle = t.skin;
    c.fillRect(hx, 7 + y0, 6, 6);
    c.fillStyle = t.skinDark;
    c.fillRect(hx, 7 + y0, 1, 6);
    c.fillRect(hx, 12 + y0, 6, 1);
    if (back) {
      c.fillStyle = t.hair;
      c.fillRect(hx - 1, 7 + y0, 8, 7);
      return;
    }
    if (side) {
      c.fillStyle = t.hair;                      // csak HATUL logo tincs
      c.fillRect(hx - 1, 8 + y0, 1, 6);
      c.fillRect(hx - 2, 10 + y0, 1, 3);
      c.fillStyle = t.skinDark;                  // arnyekos szemoldok
      c.fillRect(hx + 3, 9 + y0, 3, 1);
      c.fillStyle = '#1a1210';                   // apro, osszehuzott szem
      c.fillRect(hx + 4, 10 + y0, 1, 1);
      // Kampos orr: atlosan elore nyulik, majd LEFELE kunkorodik. Ez az
      // egyetlen vonal, amitol profilbol boszorkanynak latszik.
      c.fillStyle = t.skin;
      c.fillRect(hx + 6, 10 + y0, 1, 1);
      c.fillRect(hx + 6, 11 + y0, 2, 1);
      c.fillRect(hx + 7, 12 + y0, 1, 1);
      c.fillStyle = t.skinDark;
      c.fillRect(hx + 6, 12 + y0, 1, 1);         // az orr alja arnyekban
      c.fillStyle = '#3a6a26';
      c.fillRect(hx + 7, 11 + y0, 1, 1);         // szemolcs az orr hegyen
      c.fillStyle = t.skin;                      // hatrahuzodo, hegyes all
      c.fillRect(hx + 4, 12 + y0, 2, 1);
      c.fillStyle = t.skinDark;
      c.fillRect(hx + 3, 13 + y0, 3, 1);
      return;
    }
    c.fillStyle = t.hair;                        // szemben: ket oldalt tincs
    c.fillRect(hx - 1, 8 + y0, 1, 6);
    c.fillRect(hx + 6, 8 + y0, 1, 6);
    c.fillStyle = '#1a1210';                     // apro, gonosz szemek
    c.fillRect(hx + 1, 9 + y0, 1, 1);
    c.fillRect(hx + 4, 9 + y0, 1, 1);
    c.fillStyle = t.skinDark;                    // keskeny, lefele nyulo orr
    c.fillRect(hx + 2, 10 + y0, 2, 1);
    c.fillRect(hx + 2, 11 + y0, 1, 3);
    c.fillStyle = '#3a6a26';                     // szemolcs
    c.fillRect(hx + 3, 11 + y0, 1, 1);
    c.fillStyle = '#2e5220';                     // vekony, gunyos szaj
    c.fillRect(hx + 1, 12 + y0, 2, 1);
    return;
  }

  if (sp === 'droid') {
    // Szervizrobot: szogletes femfej, egyetlen izzo szemmel es antennaval.
    // A szogletes sziluett messzirol elkulonul a sisakos asztronautaktol.
    c.fillStyle = t.skin;
    c.fillRect(hx - 1, 5 + y0, 8, 8);
    c.fillStyle = t.skinDark;
    c.fillRect(hx - 1, 5 + y0, 1, 8);
    c.fillRect(hx - 1, 12 + y0, 8, 1);
    c.fillStyle = t.hair;                        // antenna
    c.fillRect(hx + 2, 2 + y0, 1, 3);
    c.fillStyle = t.cap;
    c.fillRect(hx + 2, 1 + y0, 2, 1);
    if (back) {
      c.fillStyle = t.skinDark;                  // hutobordak a tarkon
      c.fillRect(hx, 7 + y0, 6, 1);
      c.fillRect(hx, 9 + y0, 6, 1);
      c.fillRect(hx, 11 + y0, 6, 1);
      return;
    }
    c.fillStyle = '#14161c';                     // sotet kepernyo-sav
    c.fillRect(hx - 1, 7 + y0, 8, 3);
    c.fillStyle = t.cap;                         // EGYETLEN izzo szem
    c.fillRect(hx + (side ? 3 : 2), 8 + y0, 2, 1);
    c.fillStyle = '#ffffff';
    c.fillRect(hx + (side ? 4 : 3), 8 + y0, 1, 1);
    c.fillStyle = t.skinDark;                    // hangszoro-racs
    c.fillRect(hx + 1, 11 + y0, 4, 1);
    return;
  }

  if (sp === 'stone') {
    // Kooriás: faragott kotomb-fej, izzo jade szemgodrokkel. SZANDEKOSAN
    // nagyobb minden mas szereplonel - o az egyetlen, aki nem ember meretu.
    c.fillStyle = t.skin;
    c.fillRect(hx - 2, 4 + y0, 10, 9);
    c.fillStyle = t.skinDark;
    c.fillRect(hx - 2, 4 + y0, 1, 9);
    c.fillRect(hx - 2, 12 + y0, 10, 1);
    c.fillStyle = t.hair;                        // vesett homlokparkany
    c.fillRect(hx - 2, 6 + y0, 10, 1);
    c.fillStyle = t.skinDark;                    // kovek kozti fugak
    c.fillRect(hx + 2, 4 + y0, 1, 2);
    c.fillRect(hx + 5, 9 + y0, 1, 4);
    if (back) {
      c.fillStyle = t.hair;
      c.fillRect(hx - 2, 8 + y0, 10, 1);
      c.fillRect(hx - 2, 10 + y0, 10, 1);
      return;
    }
    c.fillStyle = '#14120e';                     // mely szemgodrok
    if (side) c.fillRect(hx + 4, 8 + y0, 3, 2);
    else {
      c.fillRect(hx - 1, 8 + y0, 3, 2);
      c.fillRect(hx + 4, 8 + y0, 3, 2);
    }
    c.fillStyle = t.cap;                         // izzo jade a gödrökben
    if (side) c.fillRect(hx + 5, 8 + y0, 1, 1);
    else {
      c.fillRect(hx, 8 + y0, 1, 1);
      c.fillRect(hx + 5, 8 + y0, 1, 1);
    }
    c.fillStyle = '#14120e';                     // vesett, szogletes szaj
    c.fillRect(hx, 11 + y0, 6, 1);
    c.fillStyle = t.skinDark;
    c.fillRect(hx + 1, 11 + y0, 1, 1);
    c.fillRect(hx + 4, 11 + y0, 1, 1);
    return;
  }

  if (sp === 'bulb') {
    // A kozos emberfej minden szereplonel kirajzolodik, es a faj csak
    // folerajzol. A korte viszont FELJEBB ul es keskenyebb, ezert alatta
    // kilatszott a bor es a haj. Ezt a savot eloszor letoroljuk.
    c.clearRect(hx - 2, 6 + y0, 10, 7);

    // A feje EGY VILLANYKORTE, arc nelkul.
    //
    // A sziluettet MASZKBOL rajzoljuk, es a korvonalat abbol szamoljuk:
    // korabban soronkent huztam a kereteket, es a bura aljan igy ket sotet
    // sarok maradt, ami fuleknek latszott. Igy viszont pontosan egy pixel
    // vastag a keret mindenhol, a belseje pedig vegig kitolt.
    const M = [
      '..####..',
      '.######.',
      '########',
      '########',
      '########',
      '.######.',
      '..####..',
      '...##...',
    ];
    const on = (r, x) => r >= 0 && r < M.length && x >= 0 && x < 8 && M[r][x] === '#';
    for (let r = 0; r < M.length; r++) {
      for (let x = 0; x < 8; x++) {
        if (!on(r, x)) continue;
        const edge = !on(r - 1, x) || !on(r + 1, x) || !on(r, x - 1) || !on(r, x + 1);
        if (edge) {
          c.fillStyle = '#6e4708';               // egy pixel vastag uvegkeret
        } else {
          // Belul balrol jobbra vilagosodik, majd melegre valt: ettol gomboly.
          const k = x / 7;
          c.fillStyle = k < 0.38 ? '#fff2c0' : (k > 0.7 ? '#e0a828' : t.skin);
        }
        c.fillRect(hx - 1 + x, 3 + r + y0, 1, 1);
      }
    }
    c.fillStyle = '#ffffff';                     // eles csillanas: ettol uveg
    c.fillRect(hx + 1, 4 + y0, 1, 1);
    c.fillRect(hx, 5 + y0, 1, 1);

    if (!back) {
      // Izzoszal: ket tartorud, kozottuk a feherre izzott spiral.
      c.fillStyle = '#a8761c';
      c.fillRect(hx + 1, 7 + y0, 1, 2);
      c.fillRect(hx + 4, 7 + y0, 1, 2);
      c.fillStyle = '#ff9a10';
      c.fillRect(hx + 1, 6 + y0, 4, 1);
      c.fillStyle = '#fffbe0';
      c.fillRect(hx + 2, 6 + y0, 2, 1);
    }

    // A keskeny uvegnyak alatt a SZELESEBB menetes foglalat. Rovid: harom sor
    // eleg belole, es a vallnal er veget - igy a korte nem ul magasabban a
    // tobbi szereplo fejenel, es nincs alatta hosszu nyak.
    c.fillStyle = '#3a4048';
    c.fillRect(hx + 1, 11 + y0, 4, 3);
    c.fillStyle = '#b4bcc4';                     // menetek
    c.fillRect(hx + 1, 11 + y0, 4, 1);
    c.fillRect(hx + 1, 13 + y0, 4, 1);
    c.fillStyle = '#e0e6ec';                     // csillanas a femen
    c.fillRect(hx + 1, 11 + y0, 1, 1);
    c.fillRect(hx + 1, 13 + y0, 1, 1);
    return;
  }

  if (sp === 'flame') {
    // Tuzember: nincs koponyaja, a feje MAGA a lang. Harom reteg, felfele
    // keskenyedve: sotet voros burok, narancs kozep, vilagos mag.
    c.fillStyle = t.skinDark;
    c.fillRect(hx, 5 + y0, 6, 9);
    c.fillRect(hx - 1, 8 + y0, 8, 4);
    c.fillRect(hx + 1, 2 + y0, 4, 3);
    c.fillRect(hx + 2, y0, 2, 2);
    c.fillStyle = t.skin;
    c.fillRect(hx + 1, 6 + y0, 4, 7);
    c.fillRect(hx + 2, 3 + y0, 2, 3);
    c.fillStyle = t.hair;
    c.fillRect(hx + 2, 7 + y0, 2, 5);
    c.fillRect(hx + 2, 1 + y0, 1, 3);
    if (back) return;
    c.fillStyle = '#4a1206';                     // ket sotet szem a langban
    if (side) c.fillRect(hx + 3, 8 + y0, 2, 2);
    else {
      c.fillRect(hx + 1, 8 + y0, 1, 2);
      c.fillRect(hx + 4, 8 + y0, 1, 2);
    }
    return;
  }

  if (sp === 'carnival') {
    // Karnevali tancos: az arc folott hatalmas, legyezoszeru tollkorona.
    const plume = [t.hair, t.cap, '#4fc4e8', t.cap, t.hair];
    for (let i = 0; i < 5; i++) {
      const px = hx - 2 + i * 2;
      const hgt = i === 2 ? 6 : (i === 1 || i === 3 ? 5 : 3);
      c.fillStyle = plume[i];
      c.fillRect(px, 6 + y0 - hgt, 1, hgt);
      c.fillStyle = '#ffffff';
      c.fillRect(px, 6 + y0 - hgt, 1, 1);
    }
    c.fillStyle = t.skin;
    c.fillRect(hx, 7 + y0, 6, 6);
    c.fillStyle = t.skinDark;
    c.fillRect(hx, 7 + y0, 1, 6);
    c.fillRect(hx, 12 + y0, 6, 1);
    c.fillStyle = t.capDark;                     // gyongyos pant a homlokon
    c.fillRect(hx - 1, 6 + y0, 8, 2);
    c.fillStyle = '#ffd257';
    c.fillRect(hx + 1, 6 + y0, 1, 1);
    c.fillRect(hx + 4, 6 + y0, 1, 1);
    if (back) return;
    c.fillStyle = '#1a1010';
    if (side) c.fillRect(hx + 4, 9 + y0, 1, 1);
    else {
      c.fillRect(hx + 1, 9 + y0, 1, 1);
      c.fillRect(hx + 4, 9 + y0, 1, 1);
    }
    c.fillStyle = '#c8405a';                     // festett mosoly
    c.fillRect(hx + (side ? 3 : 2), 11 + y0, 3, 1);
    return;
  }

  if (sp === 'phoenix') {
    // Fonixmadar: kerek madarkoponya, nagy hajlott csorrel es legyezoszeru
    // langtarejjal. A fej vorosebb, mint a csor: igy az arany csor kivalik.
    // Langtaréj: ot toll, kozepen a leghosszabbal.
    const crest = ['#ffe07a', '#ffb03c', '#ff6a2c', '#ffb03c', '#ffe07a'];
    const tall = [2, 4, 6, 4, 2];
    for (let i = 0; i < 5; i++) {
      c.fillStyle = crest[i];
      c.fillRect(hx + i, 6 + y0 - tall[i], 1, tall[i]);
      c.fillStyle = '#fff4c8';
      c.fillRect(hx + i, 6 + y0 - tall[i], 1, 1);
    }
    // Koponya: felul keskenyebb, lefele kerekedik.
    c.fillStyle = t.skin;
    c.fillRect(hx + 1, 5 + y0, 4, 1);
    c.fillRect(hx, 6 + y0, 6, 7);
    c.fillStyle = t.skinDark;
    c.fillRect(hx, 6 + y0, 1, 7);
    c.fillRect(hx, 12 + y0, 6, 1);
    if (back) {
      c.fillStyle = t.shirtDark;                  // tarkotollak
      c.fillRect(hx, 9 + y0, 6, 4);
      c.fillStyle = t.cap;
      c.fillRect(hx + 1, 11 + y0, 4, 1);
      return;
    }
    // Nagy, kerek madarszem sotet gyuruvel.
    c.fillStyle = '#2a1008';
    if (side) c.fillRect(hx + 3, 8 + y0, 3, 3);
    else {
      c.fillRect(hx, 8 + y0, 3, 3);
      c.fillRect(hx + 3, 8 + y0, 3, 3);
    }
    c.fillStyle = '#ffe07a';
    if (side) c.fillRect(hx + 4, 9 + y0, 2, 1);
    else {
      c.fillRect(hx + 1, 9 + y0, 1, 1);
      c.fillRect(hx + 4, 9 + y0, 1, 1);
    }
    // Nagy, HAJLOTT csor. Ez az, amitol madar.
    c.fillStyle = t.cap;
    if (side) {
      c.fillRect(hx + 6, 10 + y0, 4, 2);
      c.fillRect(hx + 8, 12 + y0, 2, 1);
      c.fillRect(hx + 9, 13 + y0, 1, 1);
      c.fillStyle = t.capDark;
      c.fillRect(hx + 6, 12 + y0, 2, 1);
      c.fillRect(hx + 9, 11 + y0, 1, 1);
    } else {
      c.fillRect(hx + 2, 10 + y0, 2, 3);
      c.fillRect(hx + 2, 13 + y0, 2, 2);
      c.fillStyle = t.capDark;
      c.fillRect(hx + 3, 13 + y0, 1, 2);
      c.fillRect(hx + 2, 14 + y0, 2, 1);
    }
    return;
  }

  if (sp === 'bandit') {
    // Klasszikus betoro. A kulcs az, hogy a SAPKA es a MASZK ne folyjon
    // ossze: kozottuk egy sor homlok latszik, es a sapka vilagosabb, kotott
    // anyagu. Enelkul a ket fekete folt egyben denevermaszknak nezett ki.
    c.fillStyle = t.skin;
    c.fillRect(hx, 6 + y0, 6, 7);
    c.fillStyle = t.skinDark;
    c.fillRect(hx, 6 + y0, 1, 7);
    c.fillRect(hx, 12 + y0, 6, 1);

    c.fillStyle = t.cap;                         // kotott sapka
    c.fillRect(hx, 2 + y0, 6, 4);
    c.fillRect(hx + 1, 1 + y0, 4, 1);
    c.fillStyle = t.capDark;                     // fuggoleges kotesbordak
    for (let xx = 1; xx < 6; xx += 2) c.fillRect(hx + xx, 2 + y0, 1, 3);
    c.fillStyle = t.capDark;                     // felhajtott perem
    c.fillRect(hx - 1, 5 + y0, 8, 2);
    c.fillStyle = t.cap;
    c.fillRect(hx - 1, 5 + y0, 8, 1);

    if (back) {
      c.fillStyle = t.cap;
      c.fillRect(hx, 2 + y0, 6, 4);
      c.fillStyle = t.capDark;
      c.fillRect(hx - 1, 5 + y0, 8, 2);
      c.fillStyle = t.hair;                      // kilogo tincs a tarkon
      c.fillRect(hx, 7 + y0, 6, 2);
      return;
    }

    // Keskeny szemmaszk: CSAK a fej szelesseget fedi, es egy sor homlok
    // marad folotte. Igy szalagnak latszik, nem csuklyanak.
    c.fillStyle = '#15151a';
    c.fillRect(hx, 8 + y0, 6, 2);
    c.fillStyle = '#e8e8e0';
    if (side) c.fillRect(hx + 4, 8 + y0, 1, 1);
    else {
      c.fillRect(hx + 1, 8 + y0, 1, 1);
      c.fillRect(hx + 4, 8 + y0, 1, 1);
    }
    c.fillStyle = t.skinDark;                    // orr es szaj
    if (side) {
      c.fillRect(hx + 6, 10 + y0, 1, 1);
      c.fillRect(hx + 4, 11 + y0, 2, 1);
    } else {
      c.fillRect(hx + 2, 10 + y0, 1, 1);
      c.fillRect(hx + 2, 11 + y0, 2, 1);
    }
    return;
  }

  if (sp === 'chess') {
    // Sakkhuszar-fej: iveltnyaku lofej, faragott sorennyel.
    c.fillStyle = t.skin;
    c.fillRect(hx + 1, 5 + y0, 5, 8);          // nyak es fej
    c.fillRect(hx - 1, 6 + y0, 4, 4);          // elorenyulo pofa
    c.fillStyle = t.cap;                       // soreny hatul
    c.fillRect(hx + 5, 4 + y0, 2, 7);
    c.fillRect(hx + 4, 3 + y0, 2, 2);
    c.fillStyle = t.skinDark;
    c.fillRect(hx - 1, 9 + y0, 4, 1);
    c.fillRect(hx + 1, 12 + y0, 5, 1);
    if (back) return;
    c.fillStyle = '#e8e8e0';                   // szem
    c.fillRect(hx + 2, 7 + y0, 1, 1);
    c.fillStyle = '#0e0e14';
    c.fillRect(hx, 8 + y0, 1, 1);              // orrlyuk
    return;
  }

  if (sp === 'dice') {
    // Dobokocka-fej: feher kocka, fekete pontokkal.
    c.fillStyle = t.skin;
    c.fillRect(hx - 1, 5 + y0, 8, 8);
    c.fillStyle = t.skinDark;
    c.fillRect(hx - 1, 12 + y0, 8, 1);
    c.fillRect(hx + 6, 5 + y0, 1, 8);
    c.fillStyle = '#ffffff';
    c.fillRect(hx - 1, 5 + y0, 8, 1);
    if (back) {
      c.fillStyle = '#2a2a30';                 // hatul egy pont
      c.fillRect(hx + 2, 8 + y0, 2, 2);
      return;
    }
    c.fillStyle = '#2a2a30';
    if (side) {                                // profilbol ket pont
      c.fillRect(hx + 1, 7 + y0, 2, 2);
      c.fillRect(hx + 4, 10 + y0, 2, 2);
    } else {                                   // szemben ot pont
      c.fillRect(hx, 6 + y0, 2, 2);
      c.fillRect(hx + 4, 6 + y0, 2, 2);
      c.fillRect(hx + 2, 8 + y0, 2, 2);
      c.fillRect(hx, 10 + y0, 2, 2);
      c.fillRect(hx + 4, 10 + y0, 2, 2);
    }
    return;
  }

  if (sp === 'windup') {
    // Felhuzos jatekrobot: szogletes fej, antenna, felhuzokulcs a haton.
    c.fillStyle = t.skin;
    c.fillRect(hx, 6 + y0, 6, 7);
    c.fillStyle = t.skinDark;
    c.fillRect(hx, 6 + y0, 1, 7);
    c.fillRect(hx, 12 + y0, 6, 1);
    c.fillStyle = t.cap;                       // antenna
    c.fillRect(hx + 2, 3 + y0, 1, 3);
    c.fillStyle = '#e04a4a';
    c.fillRect(hx + 2, 2 + y0, 1, 1);
    c.fillStyle = t.capDark;                   // csavarok a fej sarkain
    c.fillRect(hx, 6 + y0, 1, 1);
    c.fillRect(hx + 5, 6 + y0, 1, 1);
    c.fillRect(hx, 12 + y0, 1, 1);
    c.fillRect(hx + 5, 12 + y0, 1, 1);
    if (back) return;
    c.fillStyle = '#1a1a20';                   // keskeny kepernyo-szem
    c.fillRect(hx + 1, 8 + y0, 4, 2);
    c.fillStyle = '#7cf0ff';
    if (side) c.fillRect(hx + 4, 8 + y0, 1, 1);
    else {
      c.fillRect(hx + 1, 8 + y0, 1, 1);
      c.fillRect(hx + 4, 8 + y0, 1, 1);
    }
    c.fillStyle = t.skinDark;
    c.fillRect(hx + 1, 11 + y0, 4, 1);         // racsos szaj
    return;
  }

  if (sp === 'monkey') {
    // Majompofa: nagy fulek, vilagos arcresz, apro szemek.
    c.fillStyle = t.skin;
    c.fillRect(hx, 6 + y0, 6, 7);
    c.fillRect(hx - 2, 8 + y0, 2, 3);        // fulek
    c.fillRect(hx + 6, 8 + y0, 2, 3);
    c.fillStyle = t.skinDark;
    c.fillRect(hx, 6 + y0, 1, 7);
    c.fillRect(hx - 2, 8 + y0, 1, 3);
    if (back) return;
    c.fillStyle = '#f0d0a0';                 // vilagos pofa
    if (side) c.fillRect(hx + 3, 10 + y0, 4, 3);
    else c.fillRect(hx + 1, 10 + y0, 4, 3);
    c.fillStyle = '#1a1208';
    if (side) {
      c.fillRect(hx + 4, 8 + y0, 1, 1);
      c.fillRect(hx + 5, 11 + y0, 1, 1);
    } else {
      c.fillRect(hx + 1, 8 + y0, 1, 1);
      c.fillRect(hx + 4, 8 + y0, 1, 1);
      c.fillRect(hx + 2, 11 + y0, 2, 1);
    }
    return;
  }

  if (sp === 'gingerbread') {
    // Mezeskalacs fej: kerek, cukormazas szemoldokkel es mosollyal.
    c.fillStyle = t.skin;
    c.fillRect(hx, 6 + y0, 6, 7);
    c.fillRect(hx - 1, 7 + y0, 8, 5);
    c.fillStyle = t.skinDark;
    c.fillRect(hx, 6 + y0, 1, 7);
    c.fillRect(hx - 1, 7 + y0, 1, 5);
    if (back) return;
    c.fillStyle = '#2a1a0c';                 // cukorka-szem
    if (side) c.fillRect(hx + 4, 8 + y0, 1, 2);
    else {
      c.fillRect(hx + 1, 8 + y0, 1, 2);
      c.fillRect(hx + 4, 8 + y0, 1, 2);
    }
    c.fillStyle = '#ffffff';                 // cukormaz-mosoly
    if (side) c.fillRect(hx + 4, 11 + y0, 2, 1);
    else {
      c.fillRect(hx + 1, 11 + y0, 4, 1);
      c.fillRect(hx, 10 + y0, 1, 1);
      c.fillRect(hx + 5, 10 + y0, 1, 1);
    }
    return;
  }

  if (sp === 'gummy') {
    // Gumimaci: fenyes, attetszo fej ket kerek fullel.
    c.fillStyle = t.skin;
    c.fillRect(hx, 6 + y0, 6, 7);
    c.fillRect(hx - 1, 5 + y0, 2, 2);        // fulek
    c.fillRect(hx + 5, 5 + y0, 2, 2);
    c.fillStyle = t.skinDark;
    c.fillRect(hx, 12 + y0, 6, 1);
    c.fillRect(hx + 5, 6 + y0, 1, 6);
    c.fillStyle = 'rgba(255,255,255,0.55)';  // csillano fenyfolt
    c.fillRect(hx + 1, 7 + y0, 2, 1);
    c.fillRect(hx + 1, 8 + y0, 1, 1);
    if (back) return;
    c.fillStyle = '#3a0e16';
    if (side) c.fillRect(hx + 4, 9 + y0, 1, 1);
    else {
      c.fillRect(hx + 1, 9 + y0, 1, 1);
      c.fillRect(hx + 4, 9 + y0, 1, 1);
      c.fillRect(hx + 2, 11 + y0, 2, 1);
    }
    return;
  }

  if (sp === 'penguin') {
    // Pingvin. A korabbi valtozat azert latszott pingvinjelmezes EMBERNEK,
    // mert a fej kulon gomb volt egy nyakon, alatta emberi torzzsel. Most a
    // fej es a vall EGY tomb, es a feher arcfolt megszakitas nelkul fut le
    // a hasig - a madarnak nincs nyaka, ez az egesz kulcsa.
    c.fillStyle = t.skin;
    c.fillRect(hx + 1, 3 + y0, 4, 1);            // lekerekitett fejteto
    c.fillRect(hx, 4 + y0, 6, 2);
    c.fillRect(hx - 1, 6 + y0, 8, 9);            // fej + vall egyben
    c.fillStyle = t.skinDark;
    c.fillRect(hx - 1, 6 + y0, 1, 9);            // arnyekos bal el
    c.fillRect(hx + 1, 3 + y0, 4, 1);
    if (back) {
      c.fillStyle = t.shirtDeep;                 // vilagosabb sav a haton
      c.fillRect(hx + 1, 8 + y0, 4, 7);
      return;
    }

    // Feher elolap: felul csucsban indul, lefele kiszelesedik, es NEM all
    // meg az allnal - egyben folytatodik a hasban.
    c.fillStyle = '#f4f8fc';
    if (side) {
      c.fillRect(hx + 3, 6 + y0, 3, 1);
      c.fillRect(hx + 2, 7 + y0, 4, 8);
    } else {
      c.fillRect(hx + 2, 5 + y0, 2, 1);
      c.fillRect(hx + 1, 6 + y0, 4, 1);
      c.fillRect(hx, 7 + y0, 6, 8);
    }

    // Apro, sotet szemek kozel a csorhoz: a madarszem kicsi, nem ovalis.
    c.fillStyle = '#16161c';
    if (side) c.fillRect(hx + 4, 8 + y0, 1, 2);
    else {
      c.fillRect(hx + 1, 8 + y0, 1, 2);
      c.fillRect(hx + 4, 8 + y0, 1, 2);
    }
    c.fillStyle = '#ffffff';
    if (side) c.fillRect(hx + 4, 8 + y0, 1, 1);
    else {
      c.fillRect(hx + 1, 8 + y0, 1, 1);
      c.fillRect(hx + 4, 8 + y0, 1, 1);
    }

    // Csor: tomor, elore mutato ek.
    c.fillStyle = t.cap;
    if (side) {
      c.fillRect(hx + 6, 9 + y0, 3, 2);
      c.fillRect(hx + 9, 10 + y0, 1, 1);
      c.fillStyle = t.capDark;
      c.fillRect(hx + 6, 11 + y0, 3, 1);
    } else {
      c.fillRect(hx + 2, 9 + y0, 2, 3);
      c.fillStyle = t.capDark;
      c.fillRect(hx + 2, 12 + y0, 2, 1);
    }
    return;
  }

  if (sp === 'polarbear') {
    // Medvefej: szeles pofa, kerek fulek, apro fekete szem es orr.
    c.fillStyle = t.skin;
    c.fillRect(hx - 1, 6 + y0, 8, 7);
    c.fillRect(hx - 2, 5 + y0, 2, 2);        // fulek
    c.fillRect(hx + 6, 5 + y0, 2, 2);
    c.fillStyle = t.skinDark;
    c.fillRect(hx - 1, 6 + y0, 1, 7);
    c.fillRect(hx - 2, 5 + y0, 1, 2);
    if (back) return;
    if (side) {
      c.fillStyle = t.skin;
      c.fillRect(hx + 6, 9 + y0, 2, 3);      // elorenyulo pofa
      c.fillStyle = '#1a1a20';
      c.fillRect(hx + 7, 9 + y0, 1, 1);      // orr
      c.fillRect(hx + 4, 8 + y0, 1, 1);      // szem
    } else {
      c.fillStyle = '#1a1a20';
      c.fillRect(hx + 1, 8 + y0, 1, 1);
      c.fillRect(hx + 4, 8 + y0, 1, 1);
      c.fillStyle = t.skinDark;
      c.fillRect(hx + 1, 10 + y0, 4, 3);     // pofa
      c.fillStyle = '#1a1a20';
      c.fillRect(hx + 2, 10 + y0, 2, 1);     // orr
      c.fillRect(hx + 2, 12 + y0, 2, 1);     // szaj
    }
    return;
  }

  if (sp === 'hunter') {
    // Ember arc, de allatbor-kapucni alatt: az arc kis nyilasban latszik.
    if (back) return;
    c.fillStyle = '#1e1410';
    if (side) c.fillRect(hx + 4, 9 + y0, 1, 1);
    else {
      c.fillRect(hx + 1, 9 + y0, 1, 1);
      c.fillRect(hx + 4, 9 + y0, 1, 1);
    }
    c.fillStyle = t.skinDark;
    if (!side) c.fillRect(hx + 2, 11 + y0, 2, 1);
    return;
  }

  if (sp === 'pumpkin') {
    // A tok MAGA a fej, es a vallon ul: nem sapkakent lebeg a fej folott.
    c.fillStyle = t.skin;
    c.fillRect(hx - 1, 5 + y0, 8, 8);
    c.fillStyle = t.skinDark;
    c.fillRect(hx - 1, 5 + y0, 8, 1);
    c.fillRect(hx - 1, 12 + y0, 8, 1);
    c.fillRect(hx + 1, 5 + y0, 1, 8);        // bordak
    c.fillRect(hx + 4, 5 + y0, 1, 8);
    c.fillStyle = t.hair;                    // zold szar
    c.fillRect(hx + 2, 4 + y0, 2, 1);
    if (back) return;
    c.fillStyle = '#2a1406';
    if (side) {
      c.fillRect(hx + 3, 7 + y0, 2, 2);      // egy haromszog szem
      c.fillRect(hx + 2, 10 + y0, 4, 1);     // vigyor
      c.fillStyle = t.skin;
      c.fillRect(hx + 3, 10 + y0, 1, 1);
    } else {
      c.fillRect(hx, 7 + y0, 2, 2);
      c.fillRect(hx + 4, 7 + y0, 2, 2);
      c.fillRect(hx, 10 + y0, 6, 2);
      c.fillStyle = t.skin;                  // fogak
      c.fillRect(hx + 1, 10 + y0, 1, 1);
      c.fillRect(hx + 3, 11 + y0, 1, 1);
      c.fillRect(hx + 4, 10 + y0, 1, 1);
    }
    return;
  }

  if (sp === 'zombie') {
    c.fillStyle = t.skin;
    c.fillRect(hx, 6 + y0, 6, 7);
    c.fillStyle = t.skinDark;
    c.fillRect(hx, 6 + y0, 1, 7);
    c.fillRect(hx + 1, 6 + y0, 5, 1);
    c.fillRect(hx + 3, 8 + y0, 2, 1);        // varrat
    if (back) return;
    c.fillStyle = '#f0f0d8';                 // kidulledt szem
    if (side) {
      c.fillRect(hx + 4, 8 + y0, 2, 2);
      c.fillStyle = '#1a1a10';
      c.fillRect(hx + 5, 9 + y0, 1, 1);
      c.fillStyle = '#3a1a1a';
      c.fillRect(hx + 3, 11 + y0, 3, 1);
    } else {
      c.fillRect(hx, 8 + y0, 2, 2);
      c.fillRect(hx + 4, 8 + y0, 1, 1);      // a masik szem felig csukva
      c.fillStyle = '#1a1a10';
      c.fillRect(hx + 1, 9 + y0, 1, 1);
      c.fillRect(hx + 4, 8 + y0, 1, 1);
      c.fillStyle = '#3a1a1a';
      c.fillRect(hx + 1, 11 + y0, 4, 1);     // nyitott szaj
      c.fillStyle = '#f0f0d8';
      c.fillRect(hx + 2, 11 + y0, 1, 1);
    }
    return;
  }

  if (sp === 'ghost') {
    // Lepedo a fejen: ugyanakkora fej, mint a tobbieke, csak kelme fedi.
    c.fillStyle = t.skin;
    c.fillRect(hx, 6 + y0, 6, 7);
    c.fillRect(hx - 1, 8 + y0, 8, 5);        // a lepedo szele kicsit tullog
    c.fillStyle = t.shirt;
    c.fillRect(hx, 6 + y0, 1, 7);
    c.fillRect(hx - 1, 8 + y0, 1, 5);
    c.fillStyle = t.shirtDeep;
    c.fillRect(hx + 6, 8 + y0, 1, 5);
    c.fillRect(hx - 1, 12 + y0, 8, 1);
    if (back) return;
    c.fillStyle = '#16222e';
    if (side) {
      c.fillRect(hx + 3, 8 + y0, 2, 3);
      c.fillRect(hx + 3, 12 + y0, 2, 1);
    } else {
      c.fillRect(hx, 8 + y0, 2, 3);
      c.fillRect(hx + 4, 8 + y0, 2, 3);
      c.fillRect(hx + 2, 11 + y0, 2, 2);     // kerek, nyitott szaj
    }
    return;
  }

  if (sp === 'scarecrow') {
    // zsakvaszon fej, kivarrt szemekkel, korulotte szalma
    c.fillStyle = t.skin;
    c.fillRect(hx, 6 + y0, 6, 7);
    c.fillStyle = t.skinDark;
    c.fillRect(hx, 6 + y0, 1, 7);
    c.fillRect(hx, 12 + y0, 6, 1);
    c.fillStyle = t.hair;                    // kilogo szalma
    c.fillRect(hx - 1, 11 + y0, 1, 2);
    c.fillRect(hx + 6, 11 + y0, 1, 2);
    c.fillRect(hx - 1, 8 + y0, 1, 1);
    if (back) return;
    c.fillStyle = '#3a2a14';
    if (side) {
      c.fillRect(hx + 3, 8 + y0, 1, 1);      // X szem
      c.fillRect(hx + 5, 8 + y0, 1, 1);
      c.fillRect(hx + 4, 9 + y0, 1, 1);
      c.fillRect(hx + 3, 11 + y0, 3, 1);     // olteses szaj
    } else {
      c.fillRect(hx, 8 + y0, 1, 1);
      c.fillRect(hx + 2, 8 + y0, 1, 1);
      c.fillRect(hx + 1, 9 + y0, 1, 1);
      c.fillRect(hx + 3, 8 + y0, 1, 1);
      c.fillRect(hx + 5, 8 + y0, 1, 1);
      c.fillRect(hx + 4, 9 + y0, 1, 1);
      c.fillRect(hx + 1, 11 + y0, 4, 1);
      c.fillStyle = t.skinDark;
      c.fillRect(hx + 2, 12 + y0, 1, 1);
    }
    return;
  }

  if (sp === 'sphinx') {
    // Oroszlanfej: szeles pofa, apro kerek fulek, bajusz. A nemes fejdisz
    // kulon kerul ra, ugyanaz, mint a faraoe.
    c.fillStyle = t.skin;
    c.fillRect(hx, 6 + y0, 6, 7);
    c.fillRect(hx - 1, 8 + y0, 8, 4);          // szeles pofa
    c.fillStyle = t.skinDark;
    c.fillRect(hx - 1, 8 + y0, 1, 4);
    c.fillRect(hx - 1, 11 + y0, 8, 1);
    c.fillStyle = t.cap;                       // apro fulek
    c.fillRect(hx - 1, 5 + y0, 2, 2);
    c.fillRect(hx + 5, 5 + y0, 2, 2);
    if (back) return;
    c.fillStyle = '#1a1208';
    if (side) {
      c.fillRect(hx + 4, 8 + y0, 1, 1);        // szem
      c.fillStyle = t.skinDark;
      c.fillRect(hx + 6, 9 + y0, 2, 2);        // elorenyulo orr
      c.fillStyle = '#1a1208';
      c.fillRect(hx + 7, 9 + y0, 1, 1);
      c.fillRect(hx + 5, 11 + y0, 2, 1);       // bajusz
    } else {
      c.fillRect(hx + 1, 8 + y0, 1, 1);
      c.fillRect(hx + 4, 8 + y0, 1, 1);
      c.fillRect(hx + 2, 10 + y0, 2, 1);       // orr
      c.fillStyle = t.skinDark;
      c.fillRect(hx - 1, 10 + y0, 2, 1);       // bajusz ket oldalt
      c.fillRect(hx + 5, 10 + y0, 2, 1);
      c.fillStyle = '#1a1208';
      c.fillRect(hx + 2, 12 + y0, 2, 1);       // szaj
    }
    return;
  }

  if (sp === 'pharaoh') {
    if (back) return;
    c.fillStyle = t.capDark;                 // szertartasi alszakall
    if (side) c.fillRect(hx + 3, 12 + y0, 2, 3);
    else c.fillRect(hx + 2, 12 + y0, 2, 3);
    c.fillStyle = '#1a1208';                 // kihuzott szem
    if (side) c.fillRect(hx + 4, 9 + y0, 2, 1);
    else {
      c.fillRect(hx, 9 + y0, 2, 1);
      c.fillRect(hx + 4, 9 + y0, 2, 1);
    }
    return;
  }

  if (sp === 'anubis') {
    // hosszu, hegyes sakalful es fekete fej
    c.fillStyle = t.skin;
    c.fillRect(hx, 6 + y0, 6, 7);
    c.fillRect(hx, 2 + y0, 2, 5);            // bal ful
    c.fillRect(hx + 4, 2 + y0, 2, 5);        // jobb ful
    c.fillStyle = t.cap;                     // arany belso ful
    c.fillRect(hx, 4 + y0, 1, 2);
    c.fillRect(hx + 5, 4 + y0, 1, 2);
    c.fillStyle = t.skinDark;
    c.fillRect(hx, 6 + y0, 1, 7);
    if (back) return;
    if (side) {
      c.fillStyle = t.skin;
      c.fillRect(hx + 6, 9 + y0, 2, 3);      // elorenyulo orr
      c.fillStyle = t.skinDark;
      c.fillRect(hx + 6, 11 + y0, 2, 1);
      c.fillStyle = t.cap;
      c.fillRect(hx + 4, 9 + y0, 1, 1);      // arany szem
      c.fillStyle = '#0a0810';
      c.fillRect(hx + 7, 9 + y0, 1, 1);
    } else {
      c.fillStyle = t.cap;
      c.fillRect(hx + 1, 9 + y0, 1, 1);
      c.fillRect(hx + 4, 9 + y0, 1, 1);
      c.fillStyle = t.skinDark;
      c.fillRect(hx + 2, 11 + y0, 2, 2);     // orr
      c.fillStyle = '#0a0810';
      c.fillRect(hx + 2, 12 + y0, 2, 1);
    }
    return;
  }

  if (sp === 'tentacle') {
    c.fillStyle = t.skin;
    c.fillRect(hx, 6 + y0, 6, 7);
    c.fillRect(hx - 1, 7 + y0, 8, 4);        // kicsit szelesebb halanteknal
    c.fillStyle = t.skinDark;
    c.fillRect(hx, 6 + y0, 1, 7);
    c.fillRect(hx - 1, 7 + y0, 1, 4);
    c.fillRect(hx + 6, 7 + y0, 1, 4);
    if (!back) {
      c.fillStyle = t.skin;                  // ket rovid csap az all alatt
      if (side) {
        c.fillRect(hx + 3, 13 + y0, 1, 3);
        c.fillRect(hx + 5, 13 + y0, 1, 2);
      } else {
        c.fillRect(hx + 1, 13 + y0, 1, 3);
        c.fillRect(hx + 4, 13 + y0, 1, 2);
      }
      c.fillStyle = t.skinDark;
      if (side) c.fillRect(hx + 3, 15 + y0, 1, 1);
      else c.fillRect(hx + 1, 15 + y0, 1, 1);
      c.fillStyle = '#0d1a0c';               // nagy fekete szemek
      if (side) {
        c.fillRect(hx + 3, 8 + y0, 3, 3);
        c.fillStyle = '#c8ffb0';
        c.fillRect(hx + 5, 8 + y0, 1, 1);
      } else {
        c.fillRect(hx - 1, 8 + y0, 3, 3);
        c.fillRect(hx + 4, 8 + y0, 3, 3);
        c.fillStyle = '#c8ffb0';
        c.fillRect(hx - 1, 8 + y0, 1, 1);
        c.fillRect(hx + 4, 8 + y0, 1, 1);
      }
    }
    return;
  }

  if (sp === 'eskimo' && !back) {
    c.fillStyle = t.skinDark;                // kipirult arc a hidegben
    if (side) c.fillRect(hx + 4, 10 + y0, 1, 1);
    else {
      c.fillRect(hx, 10 + y0, 1, 1);
      c.fillRect(hx + 5, 10 + y0, 1, 1);
    }
  }
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
  if (t.species === 'ghost') {
    // A szellemnek nincs laba: elfogyo, hullamzo fatyol a helyen.
    const w = [6, 6, 5, 5, 4];
    for (let i = 0; i < w.length; i++) {
      const a2 = 0.7 - i * 0.13;
      c.fillStyle = 'rgba(180,210,236,' + a2.toFixed(2) + ')';
      const wob = i >= 2 ? ((pose + i) % 2 ? 1 : -1) : 0;
      c.fillRect(lx - 1 + wob + ((6 - w[i]) >> 1), 19 + i, w[i], 1);
    }
  } else if (t.legs === 'ball') {
    // A hoembernek NINCS laba: egy hogomb ul a helyen, es a jarasra huppan
    // egyet. A jatekban ez amugy is igy nezett ki, de a valasztoban a
    // szokasos mozgo labak elrontottak a figurat.
    // A gomb alaphelyzetben a foldon ul, es HAROM utemben huppan - ugyanannyi
    // fokozatban, ahogy a tobbieknel a lab lep (legOff: 0 / 1 / 0 / -1).
    // Felfele emelkedik, nem lefele: kulonben elvalna a torzstol.
    const hop = chop >= 0 ? 0 : [0, 1, 2, 1][pose];
    const ball = [[3, 4], [1, 8], [0, 10], [0, 10], [1, 8], [3, 4]];
    for (let i = 0; i < ball.length; i++) {
      c.fillStyle = i >= 4 ? t.pantsDark : t.pants;
      c.fillRect(lx - 2 + ball[i][0], 18 - hop + i, ball[i][1], 1);
    }
    c.fillStyle = '#ffffff';                  // csillano ho a gomb tetejen
    c.fillRect(lx, 19 - hop, 3, 1);
    c.fillStyle = t.pantsDark;                // arnyek a gomb jobb oldalan
    c.fillRect(lx + 6, 20 - hop, 1, 2);
  } else if (t.legs === 'webbed') {
    // Pingvinlab: nincs nadrag es nincs bakancs. A fekete test egeszen
    // lecsuszik, es alatta csak ket rovid, narancs uszohartyas lab all ki.
    c.fillStyle = t.shirt;
    c.fillRect(lx - 2, 19, 9, 2);
    c.fillStyle = t.shirtDark;
    c.fillRect(lx - 2, 20, 9, 1);
    c.fillStyle = t.cap;
    c.fillRect(lx - legOff - 1, 21, 4, 2);
    c.fillRect(lx + 3 + legOff, 21, 4, 2);
    c.fillStyle = t.capDark;
    c.fillRect(lx - legOff - 1, 22, 4, 1);
    c.fillRect(lx + 3 + legOff, 22, 4, 1);
  } else if (t.legs === 'short') {
    // Csenevesz, rovid lab: a torzs lejjebb er, es alatta mar csak ket
    // kis csonk marad. Ettol lesz tomzsi, foldkozeli az alak.
    c.fillStyle = t.shirt;
    c.fillRect(lx - 2, 19, 9, 2);
    c.fillStyle = t.shirtDeep;
    c.fillRect(lx - 2, 20, 9, 1);
    c.fillStyle = t.pants;
    c.fillRect(lx - legOff, 21, 3, 2);
    c.fillRect(lx + 3 + legOff, 21, 3, 2);
    c.fillStyle = t.pantsDark;
    c.fillRect(lx - legOff, 22, 3, 1);
    c.fillRect(lx + 3 + legOff, 22, 3, 1);
  } else if (undies) {
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
  if (t.species !== 'ghost' && t.legs !== 'ball' && t.legs !== 'webbed') {
    c.fillStyle = t.boot;
    c.fillRect(lx - legOff - 1, 22, 4, 2);
    c.fillRect(lx + 3 + legOff, 22, 4, 2);
  }

  // torzso. A noi alak keskenyebb, es hosszu haja van (lasd lentebb).
  const fem = t.body === 'female';
  // A vastagon oltozottek (parka, bunda, szarvasbor) szelesebbek: ettol
  // latszik, hogy pufi kabat van rajtuk, nem ing.
  const bulky = t.pattern === 'parka' || t.pattern === 'fur' || t.pattern === 'hide'
    || t.pattern === 'anorak' || t.pattern === 'stone' || t.pattern === 'dirndl';
  const pad = bulky ? 1 : 0;
  const bx = (side ? (fem ? 8 : 7) : (fem ? 7 : 6)) - pad;
  const bw = (side ? (fem ? 6 : 7) : (fem ? 7 : 8)) + pad * 2;
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
  } else if (t.pattern === 'ribs') {
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 13 + y0, bw, 1);
    c.fillRect(bx, 15 + y0, bw, 1);
    c.fillRect(bx, 17 + y0, bw, 1);
    c.fillStyle = t.shirtDeep;
    c.fillRect(bx + (bw >> 1), 13 + y0, 1, 5);   // gerinc
  } else if (t.pattern === 'wraps') {
    c.fillStyle = t.shirtDark;
    for (let dy2 = 1; dy2 < 5; dy2 += 2) c.fillRect(bx, 13 + y0 + dy2, bw, 1);
    c.fillStyle = t.shirtDeep;
    c.fillRect(bx + bw - 2, 16 + y0, 2, 2);      // lelogo kotesveg
  } else if (t.pattern === 'cloak') {
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 13 + y0, 2, 5);
    c.fillRect(bx + bw - 2, 13 + y0, 2, 5);
    c.fillStyle = t.shirtDeep;
    c.fillRect(bx, 17 + y0, bw, 1);
  } else if (t.pattern === 'motley') {
    // Tarka zeke: a ket fel MAS szinu, kozepen eles hatarral.
    c.fillStyle = t.capDark;
    c.fillRect(bx, 13 + y0, bw >> 1, 5);
    c.fillStyle = t.shirt;
    c.fillRect(bx + (bw >> 1), 13 + y0, bw - (bw >> 1), 5);
    c.fillStyle = '#ffd257';                   // csipkegallér
    c.fillRect(bx, 13 + y0, bw, 1);
    c.fillStyle = t.shirtDeep;
    c.fillRect(bx, 17 + y0, bw, 1);
    c.fillStyle = '#ffd257';                   // csengettyu a zeke aljan
    c.fillRect(bx + (bw >> 1) - 1, 18 + y0, 2, 1);
  } else if (t.pattern === 'ember') {
    // Parazslo test: sotet kereg, benne izzo repedesekkel.
    c.fillStyle = t.shirtDeep;
    c.fillRect(bx, 13 + y0, bw, 5);
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 13 + y0, bw, 1);
    c.fillStyle = t.shirt;
    c.fillRect(bx + 1, 14 + y0, bw - 2, 1);
    c.fillRect(bx + 2, 16 + y0, bw - 4, 1);
    c.fillStyle = t.cap;
    c.fillRect(bx + (bw >> 1) - 1, 15 + y0, 2, 1);
    c.fillRect(bx + 1, 17 + y0, 1, 1);
    c.fillRect(bx + bw - 2, 17 + y0, 1, 1);
  } else if (t.pattern === 'cape') {
    // Felallo galleru kopeny: kivul fekete, BELUL voros. A gallér az, ami
    // a vampir sziluettjet adja, ezert kilog a vallon.
    c.fillStyle = t.shirtDeep;
    c.fillRect(bx, 13 + y0, bw, 5);
    c.fillStyle = t.cap;                         // felallo gallér ket oldalt
    c.fillRect(bx - 1, 12 + y0, 2, 3);
    c.fillRect(bx + bw - 1, 12 + y0, 2, 3);
    c.fillStyle = t.capDark;
    c.fillRect(bx - 1, 12 + y0, 1, 3);
    c.fillRect(bx + bw, 12 + y0, 1, 3);
    c.fillStyle = t.shirt;                       // feher ingmell
    c.fillRect(bx + 2, 13 + y0, bw - 4, 5);
    c.fillStyle = t.cap;                         // voros nyakkendo
    c.fillRect(bx + (bw >> 1) - 1, 13 + y0, 2, 2);
    c.fillRect(bx + (bw >> 1) - 1, 15 + y0, 1, 2);
  } else if (t.pattern === 'snow') {
    // Hogomb-test: kerek, feher, harom szendarab gombbal.
    c.fillStyle = t.shirt;
    c.fillRect(bx, 13 + y0, bw, 5);
    c.fillStyle = '#ffffff';
    c.fillRect(bx + 1, 13 + y0, 2, 1);
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 17 + y0, bw, 1);
    c.fillRect(bx + bw - 1, 13 + y0, 1, 5);
    c.fillStyle = '#16161c';                     // szengombok
    c.fillRect(bx + (bw >> 1) - 1, 14 + y0, 1, 1);
    c.fillRect(bx + (bw >> 1) - 1, 16 + y0, 1, 1);
    c.fillStyle = t.boot;                        // sal a nyakban
    c.fillRect(bx, 13 + y0, bw, 1);
    c.fillRect(bx + bw - 2, 14 + y0, 2, 2);
    c.fillStyle = t.pantsDark;
    c.fillRect(bx + bw - 2, 15 + y0, 2, 1);
  } else if (t.pattern === 'dirndl') {
    // Dirndl: feher blúz felul, alatta fuzos pruszlik keresztzsinorral,
    // legalul a koteny szegelye.
    c.fillStyle = '#f4f0e4';
    c.fillRect(bx, 13 + y0, bw, 2);
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 15 + y0, bw, 3);
    c.fillStyle = t.shirt;
    c.fillRect(bx + 1, 15 + y0, bw - 2, 1);
    c.fillStyle = '#f0e4c0';                     // fuzozsinor cikcakkban
    c.fillRect(bx + (bw >> 1) - 1, 15 + y0, 1, 1);
    c.fillRect(bx + (bw >> 1), 16 + y0, 1, 1);
    c.fillRect(bx + (bw >> 1) - 1, 17 + y0, 1, 1);
    c.fillStyle = t.shirtDeep;
    c.fillRect(bx, 17 + y0, 1, 1);
    c.fillRect(bx + bw - 1, 17 + y0, 1, 1);
  } else if (t.pattern === 'santa') {
    // Voros kabat feher premmel: gallér felul, es vegig futo premes elozek.
    // Az ovet a kozos test rajzolja ala, es epp jol jon ide.
    c.fillStyle = '#f4f4ec';
    c.fillRect(bx, 13 + y0, bw, 1);
    c.fillRect(bx + (bw >> 1) - 1, 13 + y0, 2, 5);
    c.fillStyle = '#d0d0c8';
    c.fillRect(bx + (bw >> 1), 14 + y0, 1, 4);
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 14 + y0, 1, 4);
    c.fillRect(bx + bw - 1, 14 + y0, 1, 4);
  } else if (t.pattern === 'anorak') {
    // Vastag sarkkutato-dzseki: fenyvisszavero csik es kozepen a cipzar.
    c.fillStyle = t.cap;
    c.fillRect(bx, 13 + y0, bw, 1);
    c.fillStyle = '#e8e4d8';
    c.fillRect(bx, 15 + y0, bw, 1);
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 16 + y0, bw, 1);
    c.fillStyle = t.shirtDeep;
    c.fillRect(bx + (bw >> 1), 13 + y0, 1, 5);
  } else if (t.pattern === 'stone') {
    // Faragott kotomb-test: vizszintes kosorok, kozottuk melyebb fugakkal.
    for (let dy2 = 0; dy2 < 5; dy2++) {
      c.fillStyle = dy2 % 2 ? t.shirtDark : t.shirt;
      c.fillRect(bx, 13 + y0 + dy2, bw, 1);
    }
    c.fillStyle = t.shirtDeep;                   // fuggoleges fugak, eltolva
    c.fillRect(bx + 2, 13 + y0, 1, 2);
    c.fillRect(bx + bw - 3, 15 + y0, 1, 2);
    c.fillStyle = t.cap;                         // beragyazott jade lap
    c.fillRect(bx + (bw >> 1) - 1, 15 + y0, 2, 2);
  } else if (t.pattern === 'hoodie') {
    // Kapucnis pulover: kenguruzseb elol, ket zsinorveg a nyaknal.
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 13 + y0, bw, 1);
    c.fillRect(bx + 1, 16 + y0, bw - 2, 1);
    c.fillStyle = t.shirtDeep;
    c.fillRect(bx + 1, 17 + y0, bw - 2, 1);
    c.fillStyle = '#f0ece0';                     // zsinorvegek
    c.fillRect(bx + (bw >> 1) - 2, 14 + y0, 1, 2);
    c.fillRect(bx + (bw >> 1) + 1, 14 + y0, 1, 2);
  } else if (t.pattern === 'hivis') {
    // Lathatosagi mellény: ket fenyvisszavero csik, kozepen cipzarral.
    c.fillStyle = '#f4f4ec';
    c.fillRect(bx, 14 + y0, bw, 1);
    c.fillRect(bx, 16 + y0, bw, 1);
    c.fillStyle = t.cap;
    c.fillRect(bx, 13 + y0, bw, 1);
    c.fillStyle = t.shirtDeep;
    c.fillRect(bx + (bw >> 1), 13 + y0, 1, 5);
  } else if (t.pattern === 'plume') {
    // Tollruha: egymast fedo tollsorok, arany szegett vegekkel.
    for (let dy2 = 0; dy2 < 5; dy2++) {
      c.fillStyle = dy2 % 2 ? t.shirtDark : t.shirt;
      c.fillRect(bx, 13 + y0 + dy2, bw, 1);
    }
    c.fillStyle = t.hair;
    c.fillRect(bx + 1, 13 + y0, bw - 2, 1);
    c.fillStyle = t.cap;
    for (let dx2 = 0; dx2 < bw; dx2 += 2) c.fillRect(bx + dx2, 17 + y0, 1, 1);
  } else if (t.pattern === 'dutch') {
    // Kek ruha feher kotennyel, a kotenyen apro tulipannal.
    c.fillStyle = t.pants;
    c.fillRect(bx + 2, 14 + y0, bw - 4, 4);
    c.fillStyle = t.pantsDark;
    c.fillRect(bx + 2, 17 + y0, bw - 4, 1);
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 13 + y0, bw, 1);
    c.fillStyle = '#e05a8a';
    c.fillRect(bx + (bw >> 1) - 1, 15 + y0, 2, 1);
    c.fillRect(bx + (bw >> 1) - 1, 16 + y0, 2, 1);
    c.fillStyle = '#3c6b32';
    c.fillRect(bx + (bw >> 1) - 1, 17 + y0, 1, 1);
  } else if (t.pattern === 'cheese') {
    // Sajtos mellény: sarga alap, benne sotet lyukak, alul voros sajtheja.
    // Ezen a mereten egy hona ala fogott sajtkarika csak egy folt lenne;
    // maga a ruha viszont EL TUDJA mondani, hogy ez a sajtos.
    c.fillStyle = '#ffe08a';
    c.fillRect(bx, 14 + y0, bw, 1);
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 13 + y0, bw, 1);
    c.fillStyle = '#a8760c';                   // lyukak a sajtban
    c.fillRect(bx + 1, 15 + y0, 2, 2);
    c.fillRect(bx + bw - 3, 14 + y0, 1, 1);
    c.fillRect(bx + bw - 4, 16 + y0, 2, 1);
    c.fillStyle = t.cap;                       // voros heja a mellény aljan
    c.fillRect(bx, 17 + y0, bw, 1);
    c.fillStyle = t.capDark;
    c.fillRect(bx, 18 + y0, bw, 1);
  } else if (t.pattern === 'braid') {
    c.fillStyle = '#ffd257';                   // aranyzsinorok a zubbonyon
    c.fillRect(bx + 1, 14 + y0, bw - 2, 1);
    c.fillRect(bx + 1, 16 + y0, bw - 2, 1);
    c.fillStyle = t.shirtDark;
    c.fillRect(bx + (bw >> 1), 13 + y0, 1, 5);
    c.fillStyle = '#ffd257';
    c.fillRect(bx + (bw >> 1) - 1, 13 + y0, 3, 1);
  } else if (t.pattern === 'rivet') {
    c.fillStyle = t.shirtDeep;                 // fem-lemezek szegecsekkel
    c.fillRect(bx, 13 + y0, bw, 1);
    c.fillRect(bx, 17 + y0, bw, 1);
    c.fillStyle = t.cap;
    c.fillRect(bx + 1, 14 + y0, 1, 1);
    c.fillRect(bx + bw - 2, 14 + y0, 1, 1);
    c.fillRect(bx + 1, 16 + y0, 1, 1);
    c.fillRect(bx + bw - 2, 16 + y0, 1, 1);
    // FELHUZOKULCS a hat oldalan: szar, a vegen ket szarny, mint egy
    // oraskulcson. A fej melol atkerult ide, mert ott fulnek latszott.
    const kx = back ? bx + (bw >> 1) - 1 : bx + bw;
    if (back) {
      c.fillStyle = '#c8ccd4';
      c.fillRect(kx, 13 + y0, 2, 2);           // hatulrol a kulcs tove latszik
      c.fillStyle = '#8a9098';
      c.fillRect(kx, 15 + y0, 2, 1);
    } else {
      c.fillStyle = '#8a9098';
      c.fillRect(kx, 14 + y0, 3, 1);           // szar
      c.fillStyle = '#c8ccd4';
      c.fillRect(kx + 3, 12 + y0, 1, 5);       // a kulcs ket szarnya
      c.fillRect(kx + 2, 13 + y0, 1, 1);
      c.fillRect(kx + 2, 15 + y0, 1, 1);
      c.fillStyle = '#6a7078';
      c.fillRect(kx + 3, 16 + y0, 1, 1);
    }
    c.fillStyle = t.shirtDeep;                 // kulcslyuk a mellen
    c.fillRect(bx + (bw >> 1) - 1, 15 + y0, 2, 2);
    c.fillStyle = '#2a2a30';
    c.fillRect(bx + (bw >> 1), 15 + y0, 1, 2);
  } else if (t.pattern === 'suitcard') {
    c.fillStyle = '#e04a4a';                   // kor es pikk a mellen
    c.fillRect(bx + 1, 14 + y0, 2, 1);
    c.fillRect(bx + 1, 15 + y0, 2, 1);
    c.fillStyle = '#2a2a30';
    c.fillRect(bx + bw - 3, 14 + y0, 2, 2);
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 13 + y0, bw, 1);
    c.fillRect(bx, 17 + y0, bw, 1);
  } else if (t.pattern === 'glyph') {
    c.fillStyle = t.cap;                     // vesett jelek a mellen
    c.fillRect(bx + 1, 14 + y0, 1, 1);
    c.fillRect(bx + 3, 14 + y0, 1, 1);
    c.fillRect(bx + 2, 15 + y0, 2, 1);
    c.fillRect(bx + bw - 2, 15 + y0, 1, 2);
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 13 + y0, bw, 1);
    c.fillRect(bx, 17 + y0, bw, 1);
  } else if (t.pattern === 'spots') {
    c.fillStyle = t.shirtDeep;               // jaguarfoltok
    c.fillRect(bx + 1, 13 + y0, 2, 1);
    c.fillRect(bx + bw - 3, 14 + y0, 2, 1);
    c.fillRect(bx + 2, 16 + y0, 2, 1);
    c.fillRect(bx + bw - 2, 17 + y0, 1, 1);
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 13 + y0, bw, 1);
  } else if (t.pattern === 'scale') {
    c.fillStyle = t.shirtDark;               // pikkelyes kopeny
    for (let dy2 = 0; dy2 < 5; dy2 += 2) {
      for (let dx2 = (dy2 / 2) % 2; dx2 < bw; dx2 += 2) {
        c.fillRect(bx + dx2, 13 + y0 + dy2, 1, 1);
      }
    }
    c.fillStyle = t.cap;
    c.fillRect(bx, 13 + y0, bw, 1);
  } else if (t.pattern === 'icing') {
    c.fillStyle = '#ffffff';                 // cukormaz-fodrok
    c.fillRect(bx, 13 + y0, bw, 1);
    for (let dx2 = 0; dx2 < bw; dx2 += 2) c.fillRect(bx + dx2, 14 + y0, 1, 1);
    c.fillStyle = '#f04a8a';                 // cukorka-gombok
    c.fillRect(bx + 2, 15 + y0, 1, 1);
    c.fillRect(bx + bw - 3, 16 + y0, 1, 1);
    c.fillStyle = t.shirtDeep;
    c.fillRect(bx, 17 + y0, bw, 1);
  } else if (t.pattern === 'sparkle') {
    c.fillStyle = '#ffffff';                 // csillamok a ruhan
    c.fillRect(bx + 1, 14 + y0, 1, 1);
    c.fillRect(bx + bw - 2, 15 + y0, 1, 1);
    c.fillRect(bx + 3, 16 + y0, 1, 1);
    c.fillStyle = t.cap;
    c.fillRect(bx, 13 + y0, bw, 1);
    c.fillStyle = t.shirtDeep;
    c.fillRect(bx, 17 + y0, bw, 1);
  } else if (t.pattern === 'apron') {
    c.fillStyle = t.shirtDark;               // kotenypant
    c.fillRect(bx + 1, 13 + y0, 1, 5);
    c.fillRect(bx + bw - 2, 13 + y0, 1, 5);
    c.fillStyle = '#ffffff';
    c.fillRect(bx + 2, 14 + y0, bw - 4, 4);
    c.fillStyle = t.shirtDeep;
    c.fillRect(bx + 2, 17 + y0, bw - 4, 1);
  } else if (t.pattern === 'belly') {
    // Kerekitett feher has: felul keskenyebb, lefele szelesedik.
    c.fillStyle = '#f4f8fc';
    c.fillRect(bx + 2, 13 + y0, bw - 4, 1);
    c.fillRect(bx + 1, 14 + y0, bw - 2, 4);
    c.fillStyle = '#dae4ee';
    c.fillRect(bx + 1, 17 + y0, bw - 2, 1);
    c.fillStyle = t.shirtDark;                   // fekete uszonyok ket oldalt
    c.fillRect(bx, 13 + y0, 1, 5);
    c.fillRect(bx + bw - 1, 13 + y0, 1, 5);
    c.fillStyle = t.shirtDeep;
    c.fillRect(bx, 16 + y0, 1, 2);
    c.fillRect(bx + bw - 1, 16 + y0, 1, 2);
  } else if (t.pattern === 'parka') {
    // Pufi kabat: vizszintes tolt szakaszok, kozepen huzozar, alul szorme.
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 14 + y0, bw, 1);
    c.fillRect(bx, 16 + y0, bw, 1);
    c.fillStyle = t.shirtDeep;
    c.fillRect(bx, 13 + y0, 1, 5);               // arnyekos oldalak
    c.fillRect(bx + bw - 1, 13 + y0, 1, 5);
    c.fillStyle = t.capDark;
    c.fillRect(bx + (bw >> 1), 13 + y0, 1, 4);   // huzozar
    c.fillStyle = t.cap;                         // szormeszegely a kabat aljan
    c.fillRect(bx, 17 + y0, bw, 1);
    c.fillStyle = t.capDark;
    c.fillRect(bx + 1, 17 + y0, 1, 1);
    c.fillRect(bx + bw - 2, 17 + y0, 1, 1);
  } else if (t.pattern === 'hide') {
    // Szarvasbor: szabalytalan foltok es rojtok az aljan.
    c.fillStyle = t.shirtDark;
    c.fillRect(bx + 1, 13 + y0, 2, 2);
    c.fillRect(bx + bw - 3, 15 + y0, 2, 2);
    c.fillRect(bx + (bw >> 1), 14 + y0, 1, 1);
    c.fillStyle = t.cap;                         // vilagos szegely
    c.fillRect(bx, 13 + y0, bw, 1);
    c.fillStyle = t.shirtDeep;
    for (let dx2 = 0; dx2 < bw; dx2 += 2) c.fillRect(bx + dx2, 18 + y0, 1, 1);
  } else if (t.pattern === 'fur') {
    c.fillStyle = t.shirtDark;                   // bozontos, szabalytalan szor
    for (let dy2 = 0; dy2 < 5; dy2 += 2) {
      for (let dx2 = (dy2 / 2) % 2; dx2 < bw; dx2 += 2) {
        c.fillRect(bx + dx2, 13 + y0 + dy2, 1, 1);
      }
    }
    c.fillStyle = t.shirtDeep;
    c.fillRect(bx, 17 + y0, bw, 1);
  } else if (t.pattern === 'torn') {
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 13 + y0, bw, 1);
    c.fillRect(bx + 1, 16 + y0, 2, 1);       // szakadasok
    c.fillRect(bx + bw - 3, 14 + y0, 2, 1);
    c.fillStyle = t.shirtDeep;
    c.fillRect(bx + 2, 17 + y0, 1, 1);
    c.fillRect(bx + bw - 2, 17 + y0, 1, 1);
    c.fillRect(bx + (bw >> 1), 15 + y0, 1, 2);
  } else if (t.pattern === 'collar') {
    c.fillStyle = t.cap;                     // szeles arany melldisz
    c.fillRect(bx, 13 + y0, bw, 2);
    c.fillStyle = t.capDark;
    c.fillRect(bx, 14 + y0, bw, 1);
    c.fillStyle = t.cap;
    c.fillRect(bx + 1, 15 + y0, 1, 1);
    c.fillRect(bx + bw - 2, 15 + y0, 1, 1);
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 16 + y0, bw, 1);
  } else if (t.pattern === 'suit2') {
    // Vastagabb urruha mellkasi vezerlopanellel.
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 13 + y0, bw, 1);
    c.fillRect(bx, 17 + y0, bw, 1);
    c.fillStyle = '#2a2e34';
    c.fillRect(bx + 1, 14 + y0, 4, 3);       // panel
    c.fillStyle = t.cap;
    c.fillRect(bx + 2, 15 + y0, 1, 1);
    c.fillStyle = '#5ce07a';
    c.fillRect(bx + 3, 15 + y0, 1, 1);
    c.fillStyle = t.shirtDeep;
    c.fillRect(bx + bw - 2, 13 + y0, 1, 5);
  } else if (t.pattern === 'tank') {
    // Hattamlas tartaly: ket henger all ki a vallnal.
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 13 + y0, bw, 1);
    c.fillRect(bx, 16 + y0, bw, 1);
    c.fillStyle = t.capDark;
    c.fillRect(bx - 1, 12 + y0, 2, 4);       // tartalyok a hat mogul
    c.fillRect(bx + bw - 1, 12 + y0, 2, 4);
    c.fillStyle = t.cap;
    c.fillRect(bx - 1, 12 + y0, 2, 1);
    c.fillRect(bx + bw - 1, 12 + y0, 2, 1);
    c.fillStyle = t.shirtDeep;
    c.fillRect(bx, 17 + y0, bw, 1);
  } else if (t.pattern === 'suit') {
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 13 + y0, bw, 1);
    c.fillStyle = t.cap;
    c.fillRect(bx + 1, 15 + y0, bw - 2, 1);      // szines sav
    c.fillStyle = t.shirtDeep;
    c.fillRect(bx + bw - 2, 13 + y0, 1, 5);      // eletfenntarto
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

  // ov. A hoemberre nem kerul: neki nincs dereka, es a borov elvalasztotta
  // volna a torzset a hogolyotol - ott a ket resz EGY tomb.
  if (t.legs !== 'ball' && t.legs !== 'webbed') {
    c.fillStyle = '#3f2a18';
    c.fillRect(bx, 18 + y0, bw, 1);
    c.fillStyle = '#c9a24a';
    c.fillRect(bx + (bw >> 1) - 1, 18 + y0, 2, 1);
  } else {
    c.fillStyle = t.shirtDark;
    c.fillRect(bx, 18 + y0, bw, 1);
  }

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

  if (t.species && t.species !== 'human') drawSpeciesHead(c, dir, t, hx, y0, back, side);

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
  } else if (t.hat === 'hood') {
    c.fillStyle = t.cap;
    c.fillRect(hx - 1, 3 + y0, 8, 6);
    c.fillStyle = t.capDark;
    c.fillRect(hx - 1, 7 + y0, 8, 2);
    c.fillRect(hx - 1, 3 + y0, 8, 1);
    if (!back) {
      c.fillStyle = '#0d0a10';
      c.fillRect(hx, 6 + y0, 6, 4);             // arnyekban az arc
    }
  } else if (t.hat === 'pumpkin') {
    c.fillStyle = t.cap;
    c.fillRect(hx - 1, 3 + y0, 8, 7);
    c.fillStyle = t.capDark;
    c.fillRect(hx - 1, 3 + y0, 8, 1);
    c.fillRect(hx + 2, 3 + y0, 1, 7);
    if (!back) {
      c.fillStyle = '#2a1406';
      c.fillRect(hx, 5 + y0, 2, 2);             // szemek
      c.fillRect(hx + 4, 5 + y0, 2, 2);
      c.fillRect(hx + 1, 8 + y0, 4, 1);         // szaj
    }
    c.fillStyle = '#3a6a24';
    c.fillRect(hx + 2, 2 + y0, 2, 1);           // szar
  } else if (t.hat === 'nutcap') {
    // Diotoro-csako: magas, fekete henger, arany paszta es feher tollbokreta.
    c.fillStyle = t.cap;
    c.fillRect(hx - 1, 0 + y0, 8, 7);
    c.fillStyle = t.capDark;
    c.fillRect(hx - 1, 6 + y0, 8, 1);
    c.fillRect(hx - 1, 0 + y0, 1, 7);
    c.fillStyle = '#e8c445';                   // arany paszta es sisakdisz
    c.fillRect(hx - 1, 3 + y0, 8, 1);
    c.fillRect(hx + 2, 4 + y0, 2, 2);
    c.fillStyle = '#f4f4ec';                   // tollbokreta
    c.fillRect(hx + 2, y0 - 2, 2, 3);
    c.fillRect(hx + 1, y0 - 1, 1, 1);
    c.fillRect(hx + 4, y0 - 1, 1, 1);
  } else if (t.hat === 'jester') {
    // Csorgosipka: harom csucs, mindegyik vegen csengettyuvel.
    c.fillStyle = t.cap;
    c.fillRect(hx - 1, 4 + y0, 8, 4);
    c.fillStyle = t.capDark;
    c.fillRect(hx - 1, 7 + y0, 8, 1);
    // kozepso csucs
    c.fillStyle = t.cap;
    c.fillRect(hx + 2, 1 + y0, 2, 3);
    // ket oldalso csucs, lefele konyulva
    c.fillStyle = t.capDark;
    c.fillRect(hx - 3, 3 + y0, 2, 2);
    c.fillRect(hx - 2, 5 + y0, 1, 1);
    c.fillRect(hx + 6, 3 + y0, 2, 2);
    c.fillRect(hx + 7, 5 + y0, 1, 1);
    c.fillStyle = '#ffd257';                   // csengettyuk
    c.fillRect(hx + 2, y0 - 1, 2, 2);
    c.fillRect(hx - 4, 5 + y0, 2, 2);
    c.fillRect(hx + 8, 5 + y0, 2, 2);
    c.fillStyle = '#8a6c26';
    c.fillRect(hx + 2, y0 + 1, 2, 1);
  } else if (t.hat === 'witchhat') {
    // Boszorkanykalap: SZELES, gorbulo karima es magas, oldalra dolo kup.
    // A karima szelessege az, amitol messzirol felismerheto.
    // Profilbol a karima ELORE nyulik jobban, hatra kevesbe: igy latszik,
    // hogy egy korong ul a fejen, nem egy lapos deszka.
    const bl = side ? (dir === 'left' ? 5 : 3) : 4;
    const br = side ? (dir === 'left' ? 8 : 10) : 9;
    c.fillStyle = t.cap;
    c.fillRect(hx - bl, 6 + y0, bl + br + 1, 1);
    c.fillRect(hx - bl + 1, 7 + y0, bl + br - 1, 1);
    c.fillStyle = t.capDark;
    c.fillRect(hx - bl, 7 + y0, 1, 1);           // felkunkorodo karimaveg
    c.fillRect(hx + br, 7 + y0, 1, 1);
    c.fillRect(hx - bl + 1, 8 + y0, bl + br - 1, 1);
    const cone = [[5, 0, 6], [4, 1, 5], [3, 1, 4], [2, 2, 3], [1, 2, 2], [0, 3, 1]];
    for (const [ry, dx2, ww] of cone) {
      c.fillStyle = t.cap;
      c.fillRect(hx + dx2, ry + y0, ww, 1);
      c.fillStyle = t.capDark;
      c.fillRect(hx + dx2 + ww - 1, ry + y0, 1, 1);
    }
    c.fillStyle = '#8a52d8';                     // pant a kup toven
    c.fillRect(hx, 5 + y0, 6, 1);
    c.fillStyle = '#f0d24a';                     // arany csat
    c.fillRect(hx + 2, 5 + y0, 2, 1);
  } else if (t.hat === 'braids') {
    // Kozepen elvalasztott haj, ket oldalt lelogo vastag copffal. A copf a
    // fejen KIVUL fut le, tehat nem takarja az arcot.
    c.fillStyle = t.cap;
    c.fillRect(hx, 4 + y0, 6, 4);
    c.fillRect(hx - 1, 5 + y0, 8, 2);
    c.fillStyle = t.capDark;
    c.fillRect(hx + 2, 4 + y0, 2, 1);            // valaszték kozepen
    c.fillStyle = t.cap;                         // ket copf a fej mellett
    c.fillRect(hx - 2, 7 + y0, 2, 5);
    c.fillRect(hx + 6, 7 + y0, 2, 5);
    c.fillStyle = t.capDark;                     // fonat-tagolas
    c.fillRect(hx - 2, 8 + y0, 2, 1);
    c.fillRect(hx - 2, 10 + y0, 2, 1);
    c.fillRect(hx + 6, 8 + y0, 2, 1);
    c.fillRect(hx + 6, 10 + y0, 2, 1);
    c.fillStyle = '#d04a6a';                     // szalag a copf vegen
    c.fillRect(hx - 2, 12 + y0, 2, 1);
    c.fillRect(hx + 6, 12 + y0, 2, 1);
  } else if (t.hat === 'tophat') {
    // Fekete cilinder: keskeny, egyenes henger, alatta lapos karimaval.
    // A hoemberre keszult, ezert kap egy szines szalagot is a talpanal.
    c.fillStyle = t.capDark;
    c.fillRect(hx - 2, 5 + y0, 10, 2);           // karima
    c.fillStyle = t.cap;
    c.fillRect(hx - 2, 5 + y0, 10, 1);
    c.fillRect(hx, y0, 6, 5);                    // henger
    c.fillStyle = t.capDark;
    c.fillRect(hx + 5, y0, 1, 5);                // arnyekos jobb el
    c.fillRect(hx, y0, 6, 1);
    c.fillStyle = '#3f4650';                     // fenyes csillanas a selymen
    c.fillRect(hx + 1, 1 + y0, 1, 3);
    c.fillStyle = t.boot;                        // szines szalag a talpanal
    c.fillRect(hx, 4 + y0, 6, 1);
  } else if (t.hat === 'santahat') {
    // Mikulassapka: feher premes karima, felette oldalra dolo voros kup,
    // a vegen feher bojttal.
    c.fillStyle = t.cap;
    c.fillRect(hx, 4 + y0, 6, 3);
    c.fillRect(hx + 2, 2 + y0, 5, 2);
    c.fillRect(hx + 5, 1 + y0, 3, 2);
    c.fillStyle = t.capDark;
    c.fillRect(hx + 2, 3 + y0, 5, 1);
    c.fillRect(hx + 5, 2 + y0, 3, 1);
    c.fillStyle = '#f4f4ec';                     // premes karima
    c.fillRect(hx - 1, 6 + y0, 8, 2);
    c.fillStyle = '#d0d0c8';
    c.fillRect(hx - 1, 7 + y0, 8, 1);
    c.fillStyle = '#f4f4ec';                     // bojt a csucson
    c.fillRect(hx + 8, y0, 2, 2);
    c.fillStyle = '#d0d0c8';
    c.fillRect(hx + 8, 1 + y0, 2, 1);
  } else if (t.hat === 'polar') {
    // Prem szegelyu kapucni, alatta a szemre huzott vedoszemuveg.
    c.fillStyle = t.cap;
    c.fillRect(hx - 1, 3 + y0, 8, 5);
    c.fillStyle = t.capDark;
    c.fillRect(hx - 1, 3 + y0, 8, 1);
    c.fillRect(hx - 1, 8 + y0, 1, 4);            // a kapucni lelogo oldala
    c.fillRect(hx + 6, 8 + y0, 1, 4);
    c.fillStyle = '#e8e4d8';                     // premszegely
    c.fillRect(hx - 2, 6 + y0, 10, 2);
    c.fillStyle = '#c4bfae';
    c.fillRect(hx - 2, 7 + y0, 10, 1);
    if (back) {
      c.fillStyle = t.cap;
      c.fillRect(hx - 1, 8 + y0, 8, 4);
    } else {
      c.fillStyle = '#2a2e36';                   // szemuvegpant
      c.fillRect(hx - 1, 8 + y0, 8, 2);
      c.fillStyle = '#7ad8f0';                   // ket lencse
      if (side) c.fillRect(hx + 4, 8 + y0, 2, 1);
      else {
        c.fillRect(hx, 8 + y0, 2, 1);
        c.fillRect(hx + 4, 8 + y0, 2, 1);
      }
      c.fillStyle = '#d8f8ff';
      c.fillRect(hx + (side ? 4 : 0), 8 + y0, 1, 1);
    }
  } else if (t.hat === 'backcap') {
    // Hatrafordított baseballsapka. Elol csak a pantszij rese latszik es
    // kilog alola a frufru; a simledert hatul viseli, tehat profilbol
    // HATRAFELE all ki - ez az egesz viselet lenyege.
    c.fillStyle = t.cap;
    c.fillRect(hx, 3 + y0, 6, 4);
    c.fillRect(hx + 1, 2 + y0, 4, 1);
    c.fillStyle = t.capDark;
    c.fillRect(hx, 6 + y0, 6, 1);
    c.fillRect(hx + 2, 2 + y0, 1, 4);            // varras a kupolan
    c.fillStyle = '#f4f4ec';
    c.fillRect(hx + 2, 1 + y0, 1, 1);            // gomb a tetejen
    if (back) {
      c.fillStyle = t.capDark;                   // hatulrol felenk all a simleder
      c.fillRect(hx - 1, 7 + y0, 8, 2);
      c.fillStyle = t.cap;
      c.fillRect(hx - 1, 7 + y0, 8, 1);
    } else {
      c.fillStyle = t.hair;                      // kilogo frufru a pantszij alatt
      c.fillRect(hx, 7 + y0, 6, 1);
      c.fillStyle = t.skin;
      c.fillRect(hx + 2, 6 + y0, 2, 1);          // a szij rese
      if (side) {
        const bxp = dir === 'left' ? hx + 6 : hx - 3;
        c.fillStyle = t.capDark;
        c.fillRect(bxp, 4 + y0, 3, 2);
        c.fillStyle = t.cap;
        c.fillRect(bxp, 4 + y0, 3, 1);
      }
    }
  } else if (t.hat === 'tricorn') {
    // Haromszogletu tuzerkalap: szeles karima, harom felhajtott sarokkal.
    c.fillStyle = t.cap;
    c.fillRect(hx, 3 + y0, 6, 4);
    c.fillStyle = t.capDark;
    c.fillRect(hx - 2, 5 + y0, 10, 2);
    c.fillStyle = t.cap;
    c.fillRect(hx - 2, 4 + y0, 2, 2);
    c.fillRect(hx + 6, 4 + y0, 2, 2);
    c.fillStyle = '#e8e0cc';                     // feher szegely
    c.fillRect(hx - 2, 4 + y0, 10, 1);
    c.fillStyle = '#e8c445';                     // kokarda
    c.fillRect(hx + 5, 4 + y0, 1, 2);
  } else if (t.hat === 'bonnet') {
    // Csipkefokoto: feher fejfedo, ket oldalt felhajlo szarnnyal.
    c.fillStyle = t.cap;
    c.fillRect(hx - 1, 3 + y0, 8, 5);
    c.fillRect(hx - 3, 5 + y0, 2, 2);
    c.fillRect(hx + 7, 5 + y0, 2, 2);
    c.fillStyle = t.capDark;
    c.fillRect(hx - 1, 7 + y0, 8, 1);
    c.fillRect(hx - 3, 4 + y0, 2, 1);
    c.fillRect(hx + 7, 4 + y0, 2, 1);
    c.fillStyle = '#dcdcd2';                     // csipkeminta
    c.fillRect(hx, 4 + y0, 1, 1);
    c.fillRect(hx + 2, 3 + y0, 1, 1);
    c.fillRect(hx + 4, 4 + y0, 1, 1);
  } else if (t.hat === 'shako') {
    // Olomkatona-csako: magas, hengeres, arany csuccsal es allszijjal.
    c.fillStyle = t.cap;
    c.fillRect(hx - 1, 1 + y0, 8, 7);
    c.fillStyle = t.capDark;
    c.fillRect(hx - 1, 7 + y0, 8, 1);
    c.fillRect(hx - 1, 1 + y0, 1, 7);
    c.fillStyle = '#ffd257';                   // arany paszta es bojt
    c.fillRect(hx - 1, 4 + y0, 8, 1);
    c.fillRect(hx + 2, 0 + y0, 2, 1);
    c.fillStyle = t.capDark;                   // allszij
    c.fillRect(hx - 1, 8 + y0, 1, 3);
    c.fillRect(hx + 6, 8 + y0, 1, 3);
  } else if (t.hat === 'feather') {
    // Tollas fejdisz: fejpant, folotte szinez tollak legyezoje.
    c.fillStyle = t.capDark;
    c.fillRect(hx - 1, 5 + y0, 8, 2);
    c.fillStyle = t.cap;
    for (let i = 0; i < 5; i++) {
      const fx = hx - 1 + i * 2;
      const len = i === 2 ? 5 : i === 1 || i === 3 ? 4 : 3;
      c.fillRect(fx, 5 + y0 - len, 1, len);
      c.fillStyle = i % 2 ? '#e8503c' : t.cap;
      c.fillRect(fx, 5 + y0 - len, 1, 1);
      c.fillStyle = t.cap;
    }
    c.fillStyle = '#ffd257';
    c.fillRect(hx + 2, 5 + y0, 2, 1);        // arany homlokdisz
  } else if (t.hat === 'jaguar') {
    // Jaguarfej sisak: az allat pofaja a harcos feje folott.
    c.fillStyle = t.cap;
    c.fillRect(hx - 1, 2 + y0, 8, 6);
    c.fillRect(hx - 2, 7 + y0, 2, 4);        // lelogo oldalak
    c.fillRect(hx + 6, 7 + y0, 2, 4);
    c.fillStyle = t.capDark;
    c.fillRect(hx - 1, 7 + y0, 8, 1);
    c.fillRect(hx - 1, 2 + y0, 8, 1);
    c.fillStyle = t.cap;                     // fulek
    c.fillRect(hx - 1, 0 + y0, 2, 2);
    c.fillRect(hx + 5, 0 + y0, 2, 2);
    c.fillStyle = '#2a1a0c';                 // foltok (a szem csak elolrol)
    c.fillRect(hx + 2, 3 + y0, 1, 1);
    c.fillRect(hx + 3, 5 + y0, 1, 1);
    if (!back) {
      c.fillRect(hx, 4 + y0, 1, 1);
      c.fillRect(hx + 5, 4 + y0, 1, 1);
    }
  } else if (t.hat === 'pith') {
    // Parafa sisak: lapos kupola, korbefuto szeles karimaval.
    c.fillStyle = t.cap;
    c.fillRect(hx, 3 + y0, 6, 4);
    c.fillRect(hx - 3, 6 + y0, 12, 2);
    c.fillStyle = t.capDark;
    c.fillRect(hx - 3, 7 + y0, 12, 1);
    c.fillRect(hx, 5 + y0, 6, 1);
    c.fillStyle = '#8a7a56';
    c.fillRect(hx + 2, 2 + y0, 2, 1);        // szellozogomb
  } else if (t.hat === 'crown') {
    // Tunder-diadem: apro, csillogo agakkal.
    c.fillStyle = t.cap;
    c.fillRect(hx - 1, 5 + y0, 8, 1);
    c.fillRect(hx, 4 + y0, 1, 1);
    c.fillRect(hx + 2, 3 + y0, 1, 2);
    c.fillRect(hx + 5, 4 + y0, 1, 1);
    c.fillStyle = '#ffffff';
    c.fillRect(hx + 2, 3 + y0, 1, 1);
  } else if (t.hat === 'pointy') {
    // Hegyes mano-sapka, elore konyulo csuccsal.
    c.fillStyle = t.cap;
    c.fillRect(hx - 1, 5 + y0, 8, 3);
    c.fillRect(hx, 3 + y0, 5, 2);
    c.fillRect(hx + 1, 1 + y0, 3, 2);
    c.fillRect(hx + 2, 0 + y0, 2, 1);
    c.fillStyle = t.capDark;
    c.fillRect(hx - 1, 7 + y0, 8, 1);
    c.fillRect(hx, 3 + y0, 1, 2);
    c.fillStyle = '#ffd257';
    c.fillRect(hx + 3, 0 + y0, 1, 1);        // bojt
  } else if (t.hat === 'chef') {
    // Cukraszsapka: magas, gyurott, feher.
    c.fillStyle = t.cap;
    c.fillRect(hx - 1, 4 + y0, 8, 3);
    c.fillRect(hx, 1 + y0, 6, 3);
    c.fillRect(hx + 1, 0 + y0, 4, 1);
    c.fillStyle = t.capDark;
    c.fillRect(hx - 1, 6 + y0, 8, 1);
    c.fillRect(hx + 2, 1 + y0, 1, 3);
    c.fillRect(hx + 4, 2 + y0, 1, 2);
  } else if (t.hat === 'antler') {
    // Agancs: ket agasbogas szar a fej felett, alatta bor-fejpant.
    c.fillStyle = t.cap;
    c.fillRect(hx - 1, 5 + y0, 8, 3);            // fejpant
    c.fillStyle = t.capDark;
    c.fillRect(hx - 1, 7 + y0, 8, 1);
    c.fillStyle = t.cap;
    for (const [sx, dir2] of [[hx, -1], [hx + 5, 1]]) {
      c.fillRect(sx, 1 + y0, 1, 4);              // fo szar
      c.fillRect(sx + dir2, 0 + y0, 1, 2);       // felso ag
      c.fillRect(sx + dir2 * 2, 1 + y0, 1, 1);
      c.fillRect(sx - dir2, 2 + y0, 1, 1);       // also ag
    }
    c.fillStyle = t.capDark;
    c.fillRect(hx, 4 + y0, 1, 1);
    c.fillRect(hx + 5, 4 + y0, 1, 1);
  } else if (t.hat === 'pelt') {
    // Allatbor-kapucni: a lenyuzott fej a vadasz fejen, fullel egyutt.
    c.fillStyle = t.cap;
    c.fillRect(hx - 2, 3 + y0, 10, 6);
    c.fillRect(hx - 2, 8 + y0, 2, 6);            // lelogo oldalak
    c.fillRect(hx + 6, 8 + y0, 2, 6);
    c.fillStyle = t.capDark;
    c.fillRect(hx - 2, 8 + y0, 10, 1);
    c.fillRect(hx - 2, 3 + y0, 10, 1);
    c.fillStyle = t.cap;                         // fulek
    c.fillRect(hx - 2, 1 + y0, 2, 2);
    c.fillRect(hx + 6, 1 + y0, 2, 2);
    c.fillStyle = t.capDark;
    c.fillRect(hx - 1, 1 + y0, 1, 1);
    c.fillRect(hx + 6, 1 + y0, 1, 1);
    if (!back) {
      c.fillStyle = '#1a1410';                   // az allat szemgodre
      c.fillRect(hx, 5 + y0, 1, 1);
      c.fillRect(hx + 5, 5 + y0, 1, 1);
    }
  } else if (t.hat === 'sou') {
    // Halaszkalap: szeles karima hatul, viaszos anyag.
    c.fillStyle = t.cap;
    c.fillRect(hx - 1, 3 + y0, 8, 4);
    c.fillRect(hx - 3, 6 + y0, 12, 2);           // karima
    c.fillStyle = t.capDark;
    c.fillRect(hx - 3, 7 + y0, 12, 1);
    c.fillRect(hx - 1, 3 + y0, 8, 1);
    c.fillStyle = t.cap;
    c.fillRect(hx + 5, 8 + y0, 2, 4);            // hatso nyakvedo
  } else if (t.hat === 'keffiyeh') {
    // Arab fejkendo: a kelme a fejet es a nyakat is fedi, rajta a fekete agal.
    c.fillStyle = t.cap;
    c.fillRect(hx - 1, 4 + y0, 8, 4);            // tetejen atvetve
    c.fillRect(hx - 2, 7 + y0, 2, 8);            // lelogo oldalak a vallig
    c.fillRect(hx + 6, 7 + y0, 2, 8);
    c.fillRect(hx - 1, 12 + y0, 8, 2);           // hatul osszefogva
    c.fillStyle = t.capDark;
    c.fillRect(hx - 1, 4 + y0, 8, 1);
    c.fillRect(hx - 2, 13 + y0, 2, 2);
    c.fillRect(hx + 6, 13 + y0, 2, 2);
    c.fillStyle = '#2a2620';                     // agal: fekete zsinorgyuru
    c.fillRect(hx - 2, 6 + y0, 10, 1);
    c.fillRect(hx - 2, 8 + y0, 1, 1);
    c.fillRect(hx + 7, 8 + y0, 1, 1);
  } else if (t.hat === 'nemes') {
    // Szorosabb fejdisz: nem lohol tul a fejen, igy nem lesz oriasi a feje.
    c.fillStyle = t.cap;
    c.fillRect(hx - 1, 5 + y0, 8, 3);
    c.fillRect(hx - 1, 8 + y0, 1, 5);           // lelogo oldalak, 1 pixel
    c.fillRect(hx + 6, 8 + y0, 1, 5);
    c.fillStyle = t.capDark;
    c.fillRect(hx - 1, 7 + y0, 8, 1);
    c.fillRect(hx - 1, 12 + y0, 1, 1);
    c.fillRect(hx + 6, 12 + y0, 1, 1);
    c.fillStyle = '#e8d08a';
    c.fillRect(hx + 2, 4 + y0, 2, 1);           // homlokdisz (ureusz)
    c.fillStyle = t.hair;                       // csikok a kendon: viselojenek
    c.fillRect(hx + 1, 6 + y0, 1, 1);           // sajat szine, nem fix turkiz
    c.fillRect(hx + 4, 6 + y0, 1, 1);
  } else if (t.hat === 'fur') {
    // Szormes kapucni. A kulcs az, hogy a gyuru RARUHAZ az arc szelere: igy
    // latszik, hogy a fej egy nyilasban ul, nem egy lapos sapka alatt.
    const fur = (x, y, w2, h2) => {
      c.fillStyle = t.cap;
      c.fillRect(x, y, w2, h2);
      c.fillStyle = t.capDark;                 // bozontos textura
      for (let yy = 0; yy < h2; yy++) {
        for (let xx = (yy % 2); xx < w2; xx += 2) c.fillRect(x + xx, y + yy, 1, 1);
      }
    };

    if (back) {
      fur(hx - 2, 3 + y0, 10, 11);             // hatulrol teljesen fedi
      c.fillStyle = t.capDark;
      c.fillRect(hx - 2, 3 + y0, 10, 1);
      c.fillRect(hx - 2, 13 + y0, 10, 1);
    } else if (side) {
      fur(hx - 2, 3 + y0, 9, 4);               // teteje
      fur(hx - 2, 6 + y0, 3, 8);               // hatso oldal
      fur(hx + 1, 12 + y0, 6, 2);              // all alatt
      c.fillStyle = t.capDark;
      c.fillRect(hx + 1, 6 + y0, 1, 6);        // belso arnyek a nyilas szelen
    } else {
      fur(hx - 2, 3 + y0, 10, 4);              // teteje
      fur(hx - 2, 6 + y0, 3, 8);               // bal oldal, raer az arcra
      fur(hx + 5, 6 + y0, 3, 8);               // jobb oldal
      fur(hx - 1, 12 + y0, 8, 2);              // all alatt
      c.fillStyle = t.capDark;
      c.fillRect(hx + 1, 6 + y0, 4, 1);        // arnyek a nyilas felso elen
    }

    c.fillStyle = t.cap;                       // kiallo szorpihek
    c.fillRect(hx - 3, 5 + y0, 1, 2);
    c.fillRect(hx - 3, 9 + y0, 1, 1);
    c.fillRect(hx + 8, 7 + y0, 1, 2);
    c.fillRect(hx + 8, 11 + y0, 1, 1);
  } else if (t.hat === 'openhelm') {
    // Nyitott sisak fejhallgatoval: az arc szabadon van.
    c.fillStyle = t.cap;
    c.fillRect(hx - 1, 3 + y0, 8, 4);
    c.fillRect(hx - 2, 6 + y0, 2, 4);            // fulvedok
    c.fillRect(hx + 6, 6 + y0, 2, 4);
    c.fillStyle = t.capDark;
    c.fillRect(hx - 1, 6 + y0, 8, 1);
    c.fillRect(hx - 2, 9 + y0, 2, 1);
    c.fillRect(hx + 6, 9 + y0, 2, 1);
    if (!back) {
      c.fillStyle = '#7cf0ff';
      c.fillRect(hx + 6, 10 + y0, 1, 1);         // mikrofon-kar
      c.fillRect(hx + 5, 11 + y0, 1, 1);
    }
  } else if (t.hat === 'visorglass') {
    // Sisak keskeny UVEG rostellyal: az arc egy resze atlatszik rajta, tehat
    // egybol latszik, hogy asztronauta, es az is, ki van alatta.
    c.fillStyle = t.cap;
    c.fillRect(hx - 2, 3 + y0, 10, 4);           // sisakhej
    c.fillRect(hx - 2, 6 + y0, 2, 7);            // oldalak
    c.fillRect(hx + 6, 6 + y0, 2, 7);
    c.fillStyle = t.capDark;
    c.fillRect(hx - 2, 3 + y0, 10, 1);
    c.fillRect(hx - 2, 6 + y0, 10, 1);
    c.fillRect(hx - 1, 12 + y0, 8, 1);           // allvedo
    if (!back) {
      c.fillStyle = 'rgba(150,220,255,0.30)';    // uvegsav a szem elott
      c.fillRect(hx, 7 + y0, 6, 4);
      c.fillStyle = 'rgba(255,255,255,0.5)';
      c.fillRect(hx, 7 + y0, 2, 1);
      c.fillRect(hx, 8 + y0, 1, 1);
    } else {
      c.fillStyle = t.cap;
      c.fillRect(hx, 7 + y0, 6, 5);
    }
  } else if (t.hat === 'bubble') {
    c.fillStyle = 'rgba(200,240,255,0.35)';
    c.fillRect(hx - 2, 2 + y0, 10, 10);
    c.fillStyle = t.cap;
    c.fillRect(hx - 2, 2 + y0, 10, 1);
    c.fillRect(hx - 2, 11 + y0, 10, 1);
    c.fillRect(hx - 2, 2 + y0, 1, 10);
    c.fillRect(hx + 7, 2 + y0, 1, 10);
    c.fillStyle = 'rgba(255,255,255,0.75)';
    c.fillRect(hx - 1, 3 + y0, 2, 1);           // csillanas
    c.fillRect(hx - 1, 4 + y0, 1, 2);
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
  } else if (!t.species || t.species === 'human') {
    // kopasz, oldalt maradt hajjal. Csak embernel: a faj-fejeknek (koponya,
    // sakalfej, csapos koponya) sajat teteje van, ezt raradiroznank.
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
  // A masik kezben tartott apro targy. A fejsze kezevel szemben all, tehat
  // ugyanoda kerul, ahova a korsos favago boros pohara.
  if (t.offHand === 'tulip') drawTulip(c, ax - (flip ? -11 : 11), ay);
  if (t.offHand === 'pail') drawPail(c, ax - (flip ? -11 : 11), ay);
}

function renderJack(t, src, pose, chop) {
  const b = makeCanvas(SW, SH);
  b.c.save();
  b.c.translate(PAD, 0);
  drawJack(b.c, src, pose, chop, t);
  b.c.restore();
  if (t.cat) {
    // A macska NINCS porazon: sajat josagabol jon a boszorkany utan.
    const f = chop >= 0 ? 0 : pose % 2;
    drawCat(b.c, 0, 17 + (f ? 0 : 1), f);
  }
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

/**
 * A zaruló veszely alakja temankent mas.
 *   fire    lobogo lang (erdo)
 *   ghost   nyulankabb, lebego kisertetlang (temeto)
 *   sand    alacsony, szeles homokorveny (sivatag)
 *   water   hullamzo viz: a jegmezot NEM tuz eszi, hanem az emelkedo ar
 *   plasma  eles, szaggatott energiaiv (idegen bolygo)
 */
function hazardFrame(style, f, fw, fh, rng) {
  const { cv, c } = makeCanvas(fw, fh);

  if (style === 'water') {
    // Hullamok: alacsony, sima, egymasra futo tarajok. Nem nyulnak felfele.
    const base = Math.round(fh * 0.42);
    for (let x = 0; x < fw; x++) {
      const wave = Math.sin((x + f * 1.7) * 0.9) * 1.4 + Math.sin((x - f) * 0.42) * 1.0;
      const top = Math.max(1, Math.round(base + wave));
      for (let y = top; y < fh; y++) {
        const d = (y - top) / Math.max(1, fh - top);
        c.fillStyle = d < 0.12 ? PAL.fire[0] : d < 0.42 ? PAL.fire[1] : d < 0.72 ? PAL.fire[2] : PAL.fire[3];
        c.fillRect(x, y, 1, 1);
      }
      if (rng() < 0.22) {                    // tajtek
        c.fillStyle = PAL.fire[0];
        c.fillRect(x, Math.max(0, top - 1), 1, 1);
      }
    }
    return cv;
  }

  if (style === 'crumble') {
    // Az asztal szele morzsalodik: torott lapdarabok hullanak le a peremrol.
    for (let x = 0; x < fw; x++) {
      const top = Math.max(1, Math.round(fh * 0.45 + Math.sin((x + f * 1.5) * 0.8) * 1.6));
      for (let y = top; y < fh; y++) {
        c.fillStyle = y === top ? PAL.fire[1] : (y < top + 3 ? PAL.fire[2] : PAL.fire[3]);
        c.fillRect(x, y, 1, 1);
      }
    }
    for (let i = 0; i < 4; i++) {              // lehullo szilankok
      const x = (rng() * fw) | 0;
      const y = ((rng() * fh * 0.4) | 0);
      c.fillStyle = rng() < 0.5 ? PAL.fire[0] : PAL.fire[1];
      c.fillRect(x, y, 2, 1);
    }
    return cv;
  }

  if (style === 'vine') {
    // Kuszo inda: alacsony, csomos szar, rajta levelekkel. Nem lobog.
    const base = Math.round(fh * 0.3);
    let cx = fw / 2;
    for (let y = fh - 1; y >= base; y--) {
      cx += (rng() * 2 - 1) * 0.9;
      cx = Math.max(1, Math.min(fw - 2, cx));
      c.fillStyle = PAL.fire[2];
      c.fillRect(Math.round(cx), y, 1, 1);
      c.fillStyle = PAL.fire[3];
      c.fillRect(Math.round(cx) + 1, y, 1, 1);
      if (y % 3 === 0) {                   // levelek ketoldalt
        c.fillStyle = rng() < 0.5 ? PAL.fire[1] : PAL.fire[0];
        const d = rng() < 0.5 ? -1 : 1;
        c.fillRect(Math.round(cx) + d * 2, y, 2, 1);
        c.fillRect(Math.round(cx) + d * 2, y - 1, 1, 1);
      }
    }
    c.fillStyle = PAL.fire[3];             // suru aljzat
    for (let x = 0; x < fw; x++) {
      if (rng() < 0.3) continue;
      c.fillRect(x, fh - 1 - ((rng() * 2) | 0), 1, 2);
    }
    return cv;
  }

  if (style === 'choco') {
    // Olvadt csoki: vastag, lassu hullam, tetejen fenyes csillanassal.
    const base = Math.round(fh * 0.5);
    for (let x = 0; x < fw; x++) {
      const wave = Math.sin((x + f * 1.2) * 0.6) * 1.2 + Math.sin((x - f * 0.6) * 0.3) * 0.9;
      const top = Math.max(1, Math.round(base + wave));
      for (let y = top; y < fh; y++) {
        const d = (y - top) / Math.max(1, fh - top);
        c.fillStyle = d < 0.2 ? PAL.fire[1] : d < 0.6 ? PAL.fire[2] : PAL.fire[3];
        c.fillRect(x, y, 1, 1);
      }
      if (rng() < 0.16) {                  // fenyes buborek
        c.fillStyle = PAL.fire[0];
        c.fillRect(x, top + 1, 1, 1);
      }
    }
    return cv;
  }

  if (style === 'sand') {
    // Szel hordta homok: szeles alj, gyorsan elfogyo tetovel.
    for (let y = 0; y < fh; y++) {
      const t = y / (fh - 1);
      if (t < 0.34 && rng() < 0.72) continue;
      let hw = 0.6 + (fw / 2 - 0.2) * Math.pow(t, 0.35);
      hw *= 0.8 + rng() * 0.45;
      const cx = fw / 2 + (1 - t) * (rng() * 2 - 1) * 2.4;
      for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) {
        if (x < 0 || x >= fw) continue;
        if (rng() < 0.18) continue;          // szemcses, nem tomor
        c.fillStyle = t > 0.7 ? PAL.fire[3] : t > 0.45 ? PAL.fire[2] : PAL.fire[1];
        c.fillRect(x, y, 1, 1);
      }
    }
    return cv;
  }

  if (style === 'plasma') {
    // Energiaiv: vekony, cikazo oszlop, eles fenymaggal.
    let cx = fw / 2;
    for (let y = fh - 1; y >= 0; y--) {
      const t = y / (fh - 1);
      cx += (rng() * 2 - 1) * 1.2;
      cx = Math.max(1.2, Math.min(fw - 2.2, cx));
      const hw = 0.4 + (fw / 2 - 1) * Math.pow(t, 0.9);
      for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) {
        if (x < 0 || x >= fw) continue;
        const mid = Math.abs(x - cx) < 0.9;
        c.fillStyle = mid ? PAL.fire[0] : t > 0.55 ? PAL.fire[2] : PAL.fire[3];
        c.fillRect(x, y, 1, 1);
      }
    }
    return cv;
  }

  // fire es ghost: ugyanaz a lang, a ghost keskenyebb es nyulankabb
  const slim = style === 'ghost' ? 0.72 : 1;
  const reach = style === 'ghost' ? 0.42 : 0.6;
  for (let y = 0; y < fh; y++) {
    const t = y / (fh - 1);
    let hw = 0.4 + (fw / 2 - 0.4) * Math.pow(t, reach) * slim;
    hw *= 0.72 + rng() * 0.55;
    const sway = (1 - t) * (rng() * 2 - 1) * (style === 'ghost' ? 2.4 : 1.7);
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
  return cv;
}

export function buildFlames() {
  const style = (CURRENT.theme && CURRENT.theme.hazard) || 'fire';
  const frames = [];
  const fw = style === 'water' || style === 'sand' || style === 'choco' ? 9
    : style === 'crumble' ? 8 : 7;
  const fh = style === 'water' || style === 'choco' ? 8 : style === 'sand' ? 10
    : style === 'vine' ? 10 : style === 'crumble' ? 8 : 12;
  for (let f = 0; f < 6; f++) {
    frames.push(hazardFrame(style, f, fw, fh, mulberry32(4200 + f * 31)));
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

/**
 * A tema mozgo lenyei. A szerepkorok neve fix (a decor.js ezekre hivatkozik),
 * a lakojuk temankent mas: az erdei nyul nem setalhat at az idegen bolygora.
 */
export function buildCritterSets() {
  const id = (CURRENT.theme && CURRENT.theme.critters) || 'erdo';
  const set = CRITTERS[id] || CRITTERS.erdo;
  const out = {};
  for (const slot of CRITTER_SLOTS) {
    const d = set[slot] || CRITTERS.erdo[slot];
    const frames = [critter(d.w, d.h, d.a, d.pal), critter(d.w, d.h, d.b, d.pal)];
    // Az ulo figyelonek nincs iranya: sima ket-kepkockas lista.
    out[slot] = d.still ? frames : { right: frames, left: frames.map(mirror) };
  }
  return out;
}

export function buildFlowers() {
  return themeProps().flower.map((d) => {
    const { cv, c } = makeCanvas(3, 4);
    for (let y = 0; y < d.rows.length; y++) {
      for (let x = 0; x < d.rows[y].length; x++) {
        const ch = d.rows[y][x];
        if (ch === '.') continue;
        c.fillStyle = d.pal[ch];
        c.fillRect(x, y, 1, 1);
      }
    }
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

/**
 * Varazspalca a Z mod jelzesehez. Ugyanaz a szerep, mint a hangszoronak:
 * kikapcsolva halvany es szurke, bekapcsolva vilagit.
 */
export function buildWand(on) {
  const { cv, c } = makeCanvas(11, 11);
  const stick = on ? '#c9a24a' : '#6a6258';
  const tip = on ? '#ffe89a' : '#8e8678';
  // atlos nyel, bal lentrol jobbra fel
  c.fillStyle = stick;
  for (let i = 0; i < 7; i++) c.fillRect(1 + i, 9 - i, 2, 1);
  c.fillStyle = on ? '#8a6c2e' : '#4e4840';
  for (let i = 0; i < 7; i++) c.fillRect(1 + i, 10 - i, 1, 1);
  // csillag a hegyen
  c.fillStyle = tip;
  c.fillRect(8, 1, 1, 3);
  c.fillRect(7, 2, 3, 1);
  if (on) {
    c.fillStyle = '#ffffff';
    c.fillRect(8, 2, 1, 1);
    c.fillStyle = 'rgba(255,232,154,0.55)';
    c.fillRect(6, 0, 1, 1);
    c.fillRect(10, 3, 1, 1);
    c.fillRect(5, 4, 1, 1);
  }
  return cv;
}

/**
 * Nevtelen sziluett a menube. Veletlen palyanal meg nem tudjuk, ki lesz a
 * szereplo, tehat nem hazudunk oda egy konkret alakot: ez az "ismeretlen".
 */
export function buildSilhouette(tint) {
  const { cv, c } = makeCanvas(SW, SH);
  const cx = 10 + PAD;
  const dark = '#1a1620';
  // Tomor, vilagos alak: a sotet menuben csak igy latszik egyaltalan.
  c.fillStyle = tint;
  c.fillRect(cx - 3, 7, 6, 5);                 // fej
  c.fillRect(cx - 4, 13, 8, 5);                // torzs
  c.fillRect(cx - 6, 13, 2, 4);                // karok
  c.fillRect(cx + 4, 13, 2, 4);
  c.fillRect(cx - 3, 19, 3, 5);                // labak
  c.fillRect(cx, 19, 3, 5);
  c.fillStyle = dark;                          // korvonal a formahoz
  c.fillRect(cx - 3, 12, 6, 1);
  c.fillRect(cx - 1, 19, 1, 5);
  c.fillRect(cx - 4, 17, 8, 1);
  c.fillStyle = '#0e0a12';                     // ket szem, semmi tobb
  c.fillRect(cx - 2, 9, 1, 2);
  c.fillRect(cx + 1, 9, 1, 2);

  // Kerdojel a feje folott: ez a "meg nem tudni, ki lesz".
  const q = ['.##.', '#..#', '..#.', '.#..', '....', '.#..'];
  c.fillStyle = '#ffd257';
  for (let y = 0; y < q.length; y++) {
    for (let x = 0; x < 4; x++) if (q[y][x] === '#') c.fillRect(cx - 2 + x, y, 1, 1);
  }
  return cv;
}

/** Vegtelen jel: a bal also sarokban mutatja, hogy be van kapcsolva. */
export function buildInfinity() {
  const rows = [
    '.##...##.',
    '#..#.#..#',
    '#...#...#',
    '#..#.#..#',
    '.##...##.',
  ];
  const { cv, c } = makeCanvas(9, 7);
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < 9; x++) {
      if (rows[y][x] !== '#') continue;
      c.fillStyle = '#170f0a';
      c.fillRect(x, y + 2, 1, 1);
      c.fillStyle = '#ffd257';
      c.fillRect(x, y + 1, 1, 1);
    }
  }
  return cv;
}

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

/**
 * Puha fenyfolt. Ejszaka EZ vilagit a tuz helyen, nem maga a lang-sprite:
 * a lang alakja ugyanis atsejlett a torzseken, es attetszonek latszottak.
 */
export function buildGlowBlob() {
  const R = 15;
  const d = R * 2 + 1;
  const { cv, c } = makeCanvas(d, d);
  const col = PAL.glow || '255,150,60';
  const gr = c.createRadialGradient(R, R, 0, R, R, R);
  gr.addColorStop(0, 'rgba(' + col + ',0.55)');
  gr.addColorStop(0.45, 'rgba(' + col + ',0.22)');
  gr.addColorStop(1, 'rgba(' + col + ',0)');
  c.fillStyle = gr;
  c.fillRect(0, 0, d, d);
  return cv;
}

/*
 * A sotetedo perem a KEPERNYO szelet koveti, nem a jatekterét: kulonben a
 * hasabokkal egyutt ket sotet fuggoleges sav kerulne a kep kozepebe. Ezert
 * a kep olyan szeles, amilyen a vaszon, a sugar-normalast viszont tovabbra is
 * a 320x180-as atlo adja, tehat a jatekter pontosan ugy nez ki, mint eddig.
 */
export function buildVignette(vw = NEZET.w) {
  const { cv, c } = makeCanvas(vw, H);
  const img = c.createImageData(vw, H);
  const d = img.data;
  const cx = vw / 2;
  const cy = H / 2;
  const maxD = Math.hypot(W / 2, H / 2);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < vw; x++) {
      const r = Math.hypot(x - cx, (y - cy) * 1.25) / maxD;
      let a = Math.max(0, r - 0.52) * 1.9;
      a = Math.min(0.55, a);
      // FINOM lepcsozes + rendezett szoras. A korabbi nyolc lepcso a sotet,
      // egyenletes leegett talajon TISZTA ELLIPSZISEKKENT latszott: ugy nezett
      // ki, mintha ott maradt volna a tuz regi vonala. A suru lepcso es a
      // sakktabla-szeru szoras megtartja a pixeles jelleget, de a savhatarok
      // eltunnek.
      const dither = (((x & 1) ^ (y & 1)) - 0.5) / 64;
      a = Math.max(0, Math.round((a + dither) * 32) / 32);
      const i = (y * vw + x) * 4;
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
    glow: buildGlowBlob(),
    stump: buildStump(),
    players: buildPlayers(),
    flames: buildFlames(),
    arrowKeys: buildArrowKeys(),
    wasdKeys: buildWasdKeys(),
    chevrons: buildChevrons(),
    speaker: buildSpeaker(false),
    speakerMuted: buildSpeaker(true),
    wandOn: buildWand(true),
    wandOff: buildWand(false),
    infinity: buildInfinity(),
    silhouette: [buildSilhouette('#e0a444'), buildSilhouette('#7ca8e0')],
    sun: buildSun(),
    moon: buildMoon(),
    ...buildCritterSets(),
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
