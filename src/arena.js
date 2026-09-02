// Az erdotuz.
//
// Ket forrasbol eg:
//   1. Kulso front: kivulrol befele zsugorodo, szabalytalan alaku hatar.
//   2. Tuzfeszkek: a kor elejen NINCSENEK. Par masodperc utan gyulladnak ki
//      a palyan belul, es kifele terjednek.
//
// Igy a biztonsagos terulet nem egy kiszamithato gyuru, hanem szabalytalan
// szigetekre eso folt, ami korrol korre mashogy fogy.
//
// FAIRSEG: a feszkek PARBAN szuletnek, es a par ket tagja pontos tukorkepe
// egymasnak (hely ES alak). Ez muszaj: amikor a ket tag kulon-kulon kapott
// veletlen alakot, meresen kimutathato elonye lett az egyik oldalnak.
// A palya igy is szabalytalan marad, mert a KULSO front nem szimmetrikus.

import { CFG, clamp, lerp, mulberry32 } from './config.js';

const N = 72;      // a kulso front felbontasa
const NS = 40;     // egy feszek felbontasa

function buildProfile(seed, minScale, bins) {
  const rng = mulberry32(seed >>> 0);
  const waves = [];
  for (let k = 0; k < 7; k++) {
    waves.push({
      f: 2 + k * 2 + ((rng() * 4) | 0),
      a: 1 / Math.pow(k + 1.15, 0.85),
      p: rng() * Math.PI * 2,
    });
  }

  const n = bins || N;
  const raw = new Float32Array(n);
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2 - Math.PI;
    let v = 0;
    for (const w of waves) v += Math.sin(th * w.f + w.p) * w.a;
    raw[i] = v;
    if (v < min) min = v;
    if (v > max) max = v;
  }

  const span = max - min || 1;
  for (let i = 0; i < n; i++) {
    const t = (raw[i] - min) / span;
    const s = t * t * (3 - 2 * t) * 0.55 + t * 0.45;
    raw[i] = minScale + (1 - minScale) * s;
  }
  return raw;
}

function profAt(prof, ang) {
  const n = prof.length;
  const f = ((ang + Math.PI) / (Math.PI * 2)) * n;
  const i = Math.floor(f);
  const t = f - i;
  const i0 = ((i % n) + n) % n;
  const i1 = (i0 + 1) % n;
  return prof[i0] * (1 - t) + prof[i1] * t;
}

export function makeArena(seed) {
  const f = CFG.field;
  const s = (seed || 1) >>> 0;
  const a = {
    baseSeed: s,
    profOut: buildProfile(s, CFG.fireShape.min),
    kOut: CFG.fireShape.outStart,
    seeds: [],          // tuzfeszkek
    nextSeedAt: CFG.fireSeeds.firstAt,
    pairs: 0,
    seedCounter: 0,
    t: 0,
    closed: 0,
    cx: f.cx, cy: f.cy, rx: f.rx, ry: f.ry,
    // A zarokepen a kulso front athelyezodik a menedek koré es kerekebb lesz.
    ox: 0, oy: 0, ryMul: 1, kStart: 1,
    ptsOut: [],
  };
  buildOuter(a);
  return a;
}

/** A kulso front kozeppontja es sugarai (a zarokepen eltolodik). */
function outer(a) {
  return { x: a.cx + a.ox, y: a.cy + a.oy, rx: a.rx, ry: a.ry * a.ryMul };
}

function buildOuter(a) {
  const o = outer(a);
  const pts = a.ptsOut;
  pts.length = 0;
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2 - Math.PI;
    const r = a.profOut[i] * a.kOut;
    pts.push({ x: o.x + Math.cos(th) * o.rx * r, y: o.y + Math.sin(th) * o.ry * r });
  }
}

function buildSeedPts(a, s) {
  const pts = s.pts;
  pts.length = 0;
  for (let i = 0; i < NS; i++) {
    const th = (i / NS) * Math.PI * 2 - Math.PI;
    const r = s.prof[i] * s.r;
    pts.push({
      x: a.cx + (s.u + Math.cos(th) * r) * a.rx,
      y: a.cy + (s.v + Math.sin(th) * r) * a.ry,
    });
  }
}

/**
 * Uj feszek-par KOZEPPONTOSAN tukrozve, mint a fak: (u,v) es (-u,-v).
 * Az ALAKJUK viszont kulon-kulon veletlen, tehat a tuz nem nez ki
 * szimmetrikusnak. Ez azert fair, mert a ket alak a KOR magjabol szarmazik,
 * tehat korrol korre valtozik: nincs olyan forma, ami mindig ugyanarra az
 * oldalra kerulne. (Pontosan ez volt a korabbi hiba forrasa.)
 */
function addSeedPair(a, u, v) {
  a.seedCounter++;
  const mk = (uu, vv, salt) => {
    const prof = buildProfile(
      (a.baseSeed ^ ((a.seedCounter * 4 + salt) * 2654435761)) >>> 0, CFG.fireSeeds.profMin, NS,
    );
    const s = { u: uu, v: vv, r: CFG.fireSeeds.startR, prof, born: a.t, pts: [] };
    buildSeedPts(a, s);
    return s;
  };
  a.seeds.push(mk(u, v, 1), mk(-u, -v, 2));
  a.pairs++;
}

/**
 * @param {Array} players a ket jatekos, hogy ne gyulladjon ki a talpuk alatt
 */
export function updateArena(a, dt, players) {
  a.t += dt;
  const F = CFG.fireShape;
  const S = CFG.fireSeeds;

  const p = clamp(a.t / CFG.roundTime, 0, 1);
  a.closed = Math.pow(p, CFG.shrinkEase);
  a.kOut = lerp(F.outStart, F.outEnd, a.closed);
  // Hirtelen halal: a kulso front nullaig soper, tehat garantaltan nem marad
  // biztonsagos talaj, barmilyen szabalytalanok is a feszkek.
  if (a.t > CFG.roundTime) {
    const sd = clamp((a.t - CFG.roundTime) / CFG.suddenDeath, 0, 1);
    a.kOut = lerp(F.outEnd, 0, sd);
  }
  buildOuter(a);

  // uj feszek-par
  if (a.pairs < S.maxPairs && a.t >= a.nextSeedAt) {
    a.nextSeedAt = a.t + S.interval;
    const spot = pickSeedSpot(a, players);
    if (spot) addSeedPair(a, spot.u, spot.v);
  }

  for (const s of a.seeds) {
    s.r += S.growth * dt;
    buildSeedPts(a, s);
  }
}

function pickSeedSpot(a, players) {
  const S = CFG.fireSeeds;
  for (let tryN = 0; tryN < 40; tryN++) {
    // a bal felen sorsolunk, a par a tukorkepe lesz
    const u = -(0.08 + Math.random() * 0.5);
    const v = (Math.random() * 2 - 1) * 0.55;
    if (Math.hypot(u, v) > a.kOut * 0.8) continue;
    let ok = true;
    for (const sign of [1, -1]) {
      const wx = a.cx + sign * u * a.rx;
      const wy = a.cy + v * a.ry;
      if (players) {
        for (const pl of players) {
          if (pl && pl.alive && Math.hypot(pl.x - wx, pl.y - wy) < S.minPlayerDist) ok = false;
        }
      }
      // ne szulessen mar ego helyre
      if (inFire(a, wx, wy)) ok = false;
    }
    if (ok) return { u, v };
  }
  return null;
}

export function inFire(a, x, y) {
  const o = outer(a);
  const ou = (x - o.x) / o.rx;
  const ov = (y - o.y) / o.ry;
  if (Math.hypot(ou, ov) > profAt(a.profOut, Math.atan2(ov, ou)) * a.kOut) return true;
  const u = (x - a.cx) / a.rx;
  const v = (y - a.cy) / a.ry;
  for (const s of a.seeds) {
    const du = u - s.u;
    const dv = v - s.v;
    const d = Math.hypot(du, dv);
    if (d < profAt(s.prof, Math.atan2(dv, du)) * s.r) return true;
  }
  return false;
}

/** 0 = biztonsagos, 1 = mar eg. Minden tuzforrast figyelembe vesz. */
export function fireProximity(a, x, y) {
  const o = outer(a);
  const ou = (x - o.x) / o.rx;
  const ov = (y - o.y) / o.ry;
  const rOut = profAt(a.profOut, Math.atan2(ov, ou)) * a.kOut;
  const u = (x - a.cx) / a.rx;
  const v = (y - a.cy) / a.ry;
  let worst = rOut > 0 ? Math.hypot(ou, ov) / rOut : 2;
  for (const s of a.seeds) {
    const du = u - s.u;
    const dv = v - s.v;
    const d = Math.hypot(du, dv);
    const rs = profAt(s.prof, Math.atan2(dv, du)) * s.r;
    const ratio = d > 0.0001 ? rs / d : 2;
    if (ratio > worst) worst = ratio;
  }
  return clamp((worst - 0.72) / 0.28, 0, 1);
}

/**
 * Menekulesi irany: a kulso front befele tol, minden feszek kifele.
 * Ezek eredoje adja a legjobb iranyt. Ha minden ege, legalabb a kozep fele.
 */
export function towardSafe(a, x, y) {
  const o = outer(a);
  const ou = (x - o.x) / o.rx;
  const ov = (y - o.y) / o.ry;
  const u = (x - a.cx) / a.rx;
  const v = (y - a.cy) / a.ry;
  let ax = 0;
  let ay = 0;

  const d = Math.hypot(ou, ov);
  const rOut = profAt(a.profOut, Math.atan2(ov, ou)) * a.kOut;
  if (rOut > 0.0001) {
    const near = clamp(d / rOut, 0, 2);
    const w = Math.pow(clamp((near - 0.5) / 0.5, 0, 1), 1.5);
    if (d > 0.0001) { ax -= (ou / d) * w; ay -= (ov / d) * w; }
  }

  for (const s of a.seeds) {
    const du = u - s.u;
    const dv = v - s.v;
    const dd = Math.hypot(du, dv) || 0.0001;
    const rs = profAt(s.prof, Math.atan2(dv, du)) * s.r;
    const w = Math.pow(clamp(rs / dd, 0, 1.6), 2);
    ax += (du / dd) * w;
    ay += (dv / dd) * w;
  }

  if (Math.abs(ax) < 0.001 && Math.abs(ay) < 0.001) {
    ax = -ou; ay = -ov;
  }
  // vissza kepernyo-aranyba
  let nx = ax * a.rx;
  let ny = ay * a.ry;
  const l = Math.hypot(nx, ny) || 1;
  return { x: nx / l, y: ny / l };
}

export function spawnPoints(a) {
  const k = CFG.fireShape.outStart * 0.74;
  const rL = profAt(a.profOut, Math.PI) * k;
  const rR = profAt(a.profOut, 0) * k;
  return [
    { x: a.cx - a.rx * rL, y: a.cy },
    { x: a.cx + a.rx * rR, y: a.cy },
  ];
}

const SLACK = 0.014;   // kb. 2 pixel normalizalt egysegben

/** A pont egy adott feszek BELSEJEBEN van-e (kis raggyal). */
function inSeed(s, u, v) {
  const du = u - s.u;
  const dv = v - s.v;
  const d = Math.hypot(du, dv);
  return d < profAt(s.prof, Math.atan2(dv, du)) * s.r - SLACK;
}

/** A pont a kulso fronton KIVUL van-e, tehat mar leegett? */
function pastOuter(a, x, y) {
  const o = outer(a);
  const ou = (x - o.x) / o.rx;
  const ov = (y - o.y) / o.ry;
  return Math.hypot(ou, ov) > profAt(a.profOut, Math.atan2(ov, ou)) * a.kOut + SLACK;
}

export function liveSeeds(a) {
  return a.seeds.filter((s) => s.r >= 0.06);
}

/**
 * A tuz LATHATO peremenek mintavetele.
 *
 * Fontos: az egymast atfedo tuzfoltok egyetlen foltta olvadnak, tehat a
 * belsejukbe eso hatarszakaszokat eldobjuk. Enelkul a lángvonalak
 * keresztezik egymast, es a mar leegett reszen is futna lang.
 */
export function boundarySamples(a, step) {
  const seeds = liveSeeds(a);
  const out = [];

  const ring = [];
  collect(a.ptsOut, step, ring, 0);
  for (const p of ring) {
    const u = (p.x - a.cx) / a.rx;
    const v = (p.y - a.cy) / a.ry;
    let hidden = false;
    for (const s of seeds) if (inSeed(s, u, v)) { hidden = true; break; }
    if (!hidden) out.push(p);
  }

  for (let i = 0; i < seeds.length; i++) {
    const pts = [];
    collect(seeds[i].pts, step, pts, i + 1);
    for (const p of pts) {
      if (pastOuter(a, p.x, p.y)) continue;      // mar leegett teruleten van
      const u = (p.x - a.cx) / a.rx;
      const v = (p.y - a.cy) / a.ry;
      let hidden = false;
      for (let j = 0; j < seeds.length; j++) {
        if (j !== i && inSeed(seeds[j], u, v)) { hidden = true; break; }
      }
      if (!hidden) out.push(p);
    }
  }
  return out;
}

function collect(pts, step, out, tag) {
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[i];
    const p1 = pts[(i + 1) % pts.length];
    const len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    const n = Math.max(1, Math.round(len / step));
    for (let s = 0; s < n; s++) {
      const t = s / n;
      out.push({ x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t, i: i + tag * 7 });
    }
  }
}

/**
 * Zarokep: NEM uj tuz jon, hanem a MAR MEGLEVO front zarul be a menedek
 * koré. A kozeppont odacsuszik, a gyuru kerekebb lesz, a belso feszkek pedig
 * elfogynak, hogy a hazat ne nyeljek el.
 */
export function beginOutro(a) {
  a.kStart = a.kOut;
}

export function updateArenaOutro(a, dt, cabin, k) {
  const F = CFG.outro;
  const e = k * k * (3 - 2 * k);
  a.ox = (cabin.x - a.cx) * e;
  a.oy = (cabin.y - a.cy) * e;
  a.ryMul = 1 + (F.ryMul - 1) * e;
  a.kOut = lerp(a.kStart, F.endScale, e);
  for (const s of a.seeds) {
    s.r = Math.max(0, s.r - dt * F.seedShrink);
    buildSeedPts(a, s);
  }
  buildOuter(a);
}
