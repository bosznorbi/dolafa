// A fa a jatek fegyvere. Nincs tamadogomb: aki hozzaer, vagja,
// es a fa PONTOSAN a vagoval ellentetes iranyba dol. Nem negy iranyba:
// szabad szogben, tehat celozni lehet vele.

import { CFG, TREE_KINDS, mulberry32, bellRange } from './config.js';
import { inFire, fireProximity } from './arena.js';

export const BASE_W = 9;
export const BASE_H = 6;

export function makeTree(x, y, variant, healValue) {
  return {
    x, y, variant,
    heal: healValue,
    chop: 0,
    chopper: -1,
    owner: -1,         // aki eppen vagja: masik nem veheti el tole
    ownerT: 0,
    state: 'standing', // standing | falling | down
    fallAngle: Math.PI / 2,
    previewAngle: null, // vagas kozben ebbe az iranyba dolne
    previewBy: -1,
    fallT: 0,
    burning: false,
    burnT: 0,
    gone: false,
    shake: 0,
  };
}

export function treeLen(t) {
  return TREE_KINDS[t.variant].h;
}

export function treeKind(t) {
  return TREE_KINDS[t.variant];
}

export function baseRect(t) {
  return { x: t.x - BASE_W / 2, y: t.y - BASE_H + 1, w: BASE_W, h: BASE_H };
}

/** A vagotol ELFELE mutato szog. Ez teszi celozhatova a fat. */
export function fallAngleFrom(px, py, t) {
  return Math.atan2(t.y - py, t.x - px);
}

/**
 * A kidolt torzs utkozo-dobozai. Egy elforgatott teglalapot nehez lenne
 * kezelni az AABB-alapu mozgassal, ezert kis dobozok lancaval kozelitjuk.
 */
export function logRects(t) {
  const L = treeLen(t);
  const dx = Math.cos(t.fallAngle);
  const dy = Math.sin(t.fallAngle);
  const n = Math.max(3, Math.round(L / 7));
  const w = 7;
  const out = [];
  for (let i = 0; i < n; i++) {
    const s = ((i + 0.5) / n) * L;
    out.push({ x: t.x + dx * s - w / 2, y: t.y + dy * s - w / 2 - 1, w, h: w });
  }
  return out;
}

/**
 * Sebez-e a fa ezt a pontot? A torzs egy sav a doles tengelye menten,
 * a korona pedig egy kor a vegen. Elforgatott teglalap-teszt.
 */
export function inHitZone(t, angle, px, py, pad) {
  const L = treeLen(t);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const ax = px - t.x;
  const ay = py - t.y;
  const along = ax * dx + ay * dy;
  const perp = -ax * dy + ay * dx;
  const p = pad || 0;
  if (along >= -p && along <= L + p && Math.abs(perp) <= CFG.hitWidth / 2 + p) return true;
  const cx = t.x + dx * L * 0.78;
  const cy = t.y + dy * L * 0.78;
  return Math.hypot(px - cx, py - cy) <= CFG.crownSize / 2 + p;
}

/** Eltalalja-e a fa a jatekost? Tobb pontot nezunk, hogy nagyvonalu legyen. */
export function hitsPlayer(t, angle, p) {
  return inHitZone(t, angle, p.x, p.y, 3)
    || inHitZone(t, angle, p.x, p.y - 6, 3)
    || inHitZone(t, angle, p.x - 4, p.y - 2, 1)
    || inHitZone(t, angle, p.x + 4, p.y - 2, 1);
}

export function generateTrees(seed, arena, spawns, cabin) {
  const rng = mulberry32(seed);
  const f = CFG.field;
  const cx = f.cx;
  const cy = f.cy;
  const half = [];
  const target = Math.floor(CFG.treeCount / 2);
  const minDist = 21;
  let guard = 0;

  while (half.length < target && guard++ < 8000) {
    const x = cx - 12 - rng() * (f.rx - 12);
    const y = cy + (rng() * 2 - 1) * (f.ry - 6);
    if (fireProximity(arena, x, y) > 0.62) continue;
    // a kozeppontos par is legyen ervenyes helyen
    if (fireProximity(arena, 2 * cx - x, 2 * cy - y) > 0.62) continue;
    let ok = true;
    for (const p of half) {
      if (Math.hypot(p.x - x, p.y - y) < minDist) { ok = false; break; }
      if (Math.hypot(2 * cx - p.x - x, 2 * cy - p.y - y) < minDist) { ok = false; break; }
    }
    if (!ok) continue;
    for (const sp of spawns) {
      if (Math.hypot(sp.x - x, sp.y - y) < 32) { ok = false; break; }
      if (Math.hypot(sp.x - (2 * cx - x), sp.y - (2 * cy - y)) < 32) { ok = false; break; }
    }
    if (!ok) continue;
    if (cabin) {
      if (Math.hypot(cabin.x - x, cabin.y - y) < 30) continue;
      if (Math.hypot(cabin.x - (2 * cx - x), cabin.y - (2 * cy - y)) < 30) continue;
    }
    const variant = (rng() * TREE_KINDS.length) | 0;
    const k = TREE_KINDS[variant];
    // A gyogyitas erteket MOST sorsoljuk, es a par ugyanazt kapja.
    // Harang-eloszlas: a kozepes ertekek gyakoriak, a szelsok ritkak.
    const healValue = Math.round(bellRange(k.healMin, k.healMax, rng));
    half.push({ x, y, variant, healValue });
  }

  // KOZEPPONTOS tukrozes: ami az egyiknek jobbra fent van, az a masiknak
  // balra lent. A palya igy 180 fokos elforgatasra nez ki ugyanugy.
  const trees = [];
  for (const p of half) {
    trees.push(makeTree(Math.round(p.x), Math.round(p.y), p.variant, p.healValue));
    trees.push(makeTree(Math.round(2 * cx - p.x), Math.round(2 * cy - p.y), p.variant, p.healValue));
  }
  trees.sort((a, b) => a.y - b.y);
  return trees;
}

/**
 * @returns {Array} az ebben a lepesben foldet ert fak (a sebzest a main kezeli)
 */
export function updateTrees(trees, dt, arena, hooks) {
  const landed = [];
  for (const t of trees) {
    if (t.gone) continue;

    if (t.shake > 0) t.shake = Math.max(0, t.shake - dt * 4);

    // A tuz felfalja a fakat. Amig eg, meg akadaly; ha elegett, at lehet menni.
    if (!t.burning && inFire(arena, t.x, t.y)) {
      t.burning = true;
      t.burnT = 0;
      if (hooks && hooks.onIgnite) hooks.onIgnite(t);
    }
    if (t.burning) {
      t.burnT += dt;
      if (t.burnT >= CFG.burnTime) t.gone = true;
      continue;
    }

    if (t.state === 'standing') {
      // A vago rovid ideig meg akkor is a fa gazdaja, ha egy pillanatra
      // elengedi. Igy nem lehet elorozni alola a fat vagas kozben.
      if (t.ownerT > 0) {
        t.ownerT -= dt;
        if (t.ownerT <= 0) t.owner = -1;
      }
      if (t.chopper < 0) {
        if (t.chop > 0) t.chop = Math.max(0, t.chop - CFG.chopDecay * dt);
        t.previewAngle = null;
        t.previewBy = -1;
      }
      t.chopper = -1;
    } else if (t.state === 'falling') {
      t.fallT += dt;
      if (t.fallT >= CFG.fallTime) {
        t.fallT = CFG.fallTime;
        t.state = 'down';
        landed.push(t);
      }
    }
  }
  return landed;
}

export function fallProgress(t) {
  if (t.state === 'standing') return 0;
  if (t.state === 'down') return 1;
  const p = t.fallT / CFG.fallTime;
  return Math.min(1, p * p * (3 - 2 * p) * 0.35 + p * p * 0.65);
}

export function startFall(t, angle, hooks, feller) {
  t.state = 'falling';
  t.fallAngle = angle;
  t.fallT = 0;
  t.chop = 1;
  t.feller = feller ? feller.index : -1;
  if (hooks && hooks.onFall) hooks.onFall(t, feller);
}

/**
 * Egy jatekos vagasa. A vagas allapota a FAHOZ tartozik, nem a jatekoshoz:
 * a felig kivagott fa mindket jatekosnak csapda.
 */
/** Foglalt-e a fa valaki masnak? */
export function chopBlocked(t, player) {
  return t.owner >= 0 && t.owner !== player.index;
}

export function chopBy(t, player, dt, hooks) {
  if (t.state !== 'standing' || t.burning || t.gone) return;
  // Amit valaki elkezdett vagni, azt nem lehet elvenni tole, amig vagja.
  if (chopBlocked(t, player)) return;
  t.owner = player.index;
  t.ownerT = CFG.chopHold;
  t.chopper = player.index;
  t.previewAngle = fallAngleFrom(player.x, player.y, t);
  t.previewBy = player.index;
  const before = t.chop;
  t.chop = Math.min(1, t.chop + dt / (CFG.chopTime * TREE_KINDS[t.variant].chopMul));
  t.shake = Math.min(1, t.shake + dt * 3);
  const step = 0.16;
  if (Math.floor(t.chop / step) !== Math.floor(before / step)) {
    if (hooks && hooks.onChopTick) hooks.onChopTick(t, player);
  }
  if (t.chop >= 1) startFall(t, fallAngleFrom(player.x, player.y, t), hooks, player);
}

export function solidRects(trees) {
  const out = [];
  for (const t of trees) {
    if (t.gone) continue;   // ami elegett, azon at lehet menni
    if (t.state === 'standing' || t.state === 'falling') out.push(baseRect(t));
    else if (t.state === 'down') {
      const rs = logRects(t);
      for (const r of rs) out.push(r);
    }
  }
  return out;
}
