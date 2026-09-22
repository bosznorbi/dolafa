// Tisztan grafikai elemek. Nem befolyasoljak a jatekot.
//
// Ot napszak, koronkent egy, mindig sorban (lasd CFG.phases). Attol, hogy
// VALTOZIK, ki van kint, a jatekos erzi az ido mulasat: nem eleg sotetiteni.
//
//   1 napfelkelte  viragok, pillangok, madarak
//   2 delelott     viragok, madarak, nyulak, mokusok
//   3 naplemente   viragok + gombak, denevorek, farkasok, mokusok, para
//   4 sotetedes    gombak, sziklak, pokhalo, farkasok, denevorek, ulo bagoly
//   5 mely ejszaka gombak, sziklak, pokhalo, foldi parazs, egy medve, bagoly
//
// A mozgo elolények szama fazisonkent legfeljebb hat, kulonben a 320x180-as
// kepen elveszne az, ami tenyleg megol.

import { W, H, CFG, mulberry32, clamp } from './config.js';
import { inFire, towardSafe } from './arena.js';
import { buildStream } from './decor-sprites.js';

export function phaseOf(round) {
  return clamp((round | 0) - 1, 0, CFG.phases.length - 1);
}

/** A kor napszaka, a koron belul enyhe atvezetessel a kovetkezo fele. */
export function dayIndex(g) {
  const prog = g.state === 'playing' || g.state === 'paused' ? g.arena.closed : 0;
  return clamp(phaseOf(g.round) + prog * 0.55, 0, CFG.phases.length - 1);
}

function scatter(rng, arena, n, make) {
  const out = [];
  let guard = 0;
  while (out.length < (n || 0) && guard++ < (n + 1) * 40) {
    const x = 12 + rng() * (W - 24);
    const y = 30 + rng() * (H - 40);
    if (inFire(arena, x, y)) continue;
    out.push(make(x, y, rng));
  }
  return out;
}

const WALKERS = ['bunnies', 'wolves', 'squirrels', 'bears'];
const FLYERS = ['butterflies', 'bats'];

export function makeDecor(seed, arena, round, trees, stream) {
  const rng = mulberry32((seed ^ 0x1f2e3d) >>> 0);
  const ph = CFG.phases[phaseOf(round)];
  const st = ph.statics || {};
  const ac = ph.actors || {};
  const gl = ph.glow || {};

  const spot = (x, y, r) => ({ x, y, kind: (r() * 3) | 0, phase: r() * 6.28 });
  const mover = (x, y, r) => ({
    x, y, vx: 0, vy: 0, t: r() * 1.2, face: r() < 0.5 ? -1 : 1, frame: 0, hop: 0,
  });

  const d = {
    stream: (stream || buildStream(seed)).cv,
    clouds: [0, 1, 2].map((i) => ({
      kind: i, x: -70 - rng() * 260, y: 26 + rng() * (H - 60), sp: 5 + rng() * 5,
    })),
    flowers: scatter(rng, arena, st.flowers, spot),
    mushrooms: scatter(rng, arena, st.mushrooms, spot),
    rocks: scatter(rng, arena, st.rocks, spot),
    cobwebs: [],
    embers: scatter(rng, arena, gl.embers, (x, y, r) => ({ x, y, phase: r() * 6.28 })),
    fireflies: scatter(rng, arena, gl.fireflies, (x, y, r) => ({
      x, y, phase: r() * 6.28, sp: 0.5 + r() * 0.9, rad: 4 + r() * 7,
    })),
    stars: [],
    birds: [],
    owls: [],
    haze: gl.haze || 0,
    moonrim: gl.moonrim || 0,
  };

  for (const k of WALKERS) d[k] = scatter(rng, arena, ac[k], mover);
  for (const k of FLYERS) d[k] = scatter(rng, arena, ac[k], mover);

  // pokhalo: fak toveben lóg, nem a levegoben
  const webN = st.cobwebs || 0;
  if (webN && trees && trees.length) {
    for (let i = 0; i < webN; i++) {
      const t = trees[(rng() * trees.length) | 0];
      d.cobwebs.push({ tree: t, x: t.x - 8 + rng() * 16, y: t.y - 14 - rng() * 8 });
    }
  }

  // ulo bagoly: fara ul, nem repul. Kevesebb mozgas, tobb hangulat.
  const owlN = ac.owls || 0;
  if (owlN && trees && trees.length) {
    for (let i = 0; i < owlN; i++) {
      const t = trees[(rng() * trees.length) | 0];
      d.owls.push({ tree: t, x: t.x, y: t.y - 16, blink: rng() * 4 });
    }
  }

  const birdN = ac.birds || 0;
  for (let i = 0; i < birdN; i++) {
    d.birds.push({ x: -20 - rng() * 120, y: 26 + rng() * 40, sp: 22 + rng() * 16, phase: rng() * 6.28 });
  }

  const nk = nightK(phaseOf(round));
  if (nk > 0.3) {
    for (let i = 0; i < 34; i++) {
      d.stars.push({ x: (rng() * W) | 0, y: (rng() * (H * 0.55)) | 0, phase: rng() * 6.28 });
    }
  }
  return d;
}

function roam(list, dt, arena, speed, hopping) {
  for (const a of list) {
    a.t -= dt;
    if (a.t <= 0) {
      a.t = 0.5 + Math.random() * 1.4;
      if (Math.random() < 0.28) { a.vx = 0; a.vy = 0; }
      else {
        const ang = Math.random() * Math.PI * 2;
        a.vx = Math.cos(ang) * speed;
        a.vy = Math.sin(ang) * speed * 0.6;
        a.face = a.vx < 0 ? -1 : 1;
      }
      if (hopping) a.hop = 0.34;
    }
    if (hopping && a.hop > 0) a.hop = Math.max(0, a.hop - dt);
    if (inFire(arena, a.x, a.y)) {
      const s = towardSafe(arena, a.x, a.y);
      a.vx = s.x * speed * 2.2;
      a.vy = s.y * speed * 2.2;
      a.face = a.vx < 0 ? -1 : 1;
    }
    const mv = hopping && a.hop <= 0 ? 0.25 : 1;
    a.x = clamp(a.x + a.vx * dt * mv, 6, W - 6);
    a.y = clamp(a.y + a.vy * dt * mv, 28, H - 4);
    a.frame = (a.frame + dt * (hopping ? 7 : 5)) % 2;
  }
}

function flutter(list, dt, arena, speed, wobble) {
  for (const a of list) {
    a.t -= dt;
    if (a.t <= 0) {
      a.t = 0.25 + Math.random() * 0.7;
      const ang = Math.random() * Math.PI * 2;
      a.vx = Math.cos(ang) * speed;
      a.vy = Math.sin(ang) * speed * 0.8;
      a.face = a.vx < 0 ? -1 : 1;
    }
    if (inFire(arena, a.x, a.y)) {
      const s = towardSafe(arena, a.x, a.y);
      a.vx = s.x * speed * 2;
      a.vy = s.y * speed * 2;
    }
    a.x = clamp(a.x + a.vx * dt, 6, W - 6);
    a.y = clamp(a.y + (a.vy + Math.sin(a.t * wobble) * 22) * dt, 26, H - 10);
    a.frame = (a.frame + dt * 12) % 2;
  }
}

export function updateDecor(d, dt, g) {
  const sp = CFG.decorSpeed;
  roam(d.bunnies, dt, g.arena, sp, true);
  roam(d.wolves, dt, g.arena, sp * 1.25, false);
  roam(d.squirrels, dt, g.arena, sp * 1.6, true);
  roam(d.bears, dt, g.arena, sp * 0.6, false);
  flutter(d.butterflies, dt, g.arena, sp * 0.8, 9);
  flutter(d.bats, dt, g.arena, sp * 2.4, 16);
  for (const o of d.owls) o.blink = (o.blink + dt) % 4;
  for (const b of d.birds) {
    b.x += b.sp * dt;
    if (b.x > W + 24) { b.x = -24; b.y = 26 + Math.random() * 40; }
  }
  for (const cl of d.clouds) {
    cl.x += cl.sp * dt;
    if (cl.x > W + 80) { cl.x = -90; cl.y = 26 + Math.random() * (H - 60); }
  }
}

/** Elszallo felho-arnyekok a jatekter felett. Halvanyak, hogy ne zavarjanak. */
export function drawClouds(c, d, S, dayT) {
  const nk = nightK(dayT);
  const a = 0.13 * (1 - nk * 0.65);
  if (a < 0.01) return;
  c.globalAlpha = a;
  for (const cl of d.clouds) c.drawImage(S.clouds[cl.kind], Math.round(cl.x), Math.round(cl.y));
  c.globalAlpha = 1;
}

/** 0 = teljes nappal, 1 = teljes ejszaka. */
export function nightK(dayT) {
  return clamp((dayT - 1.9) / 2.1, 0, 1);
}

/** Talajszint: patak, viragok, gombak, sziklak. A szinezes ALA kerul. */
export function drawGroundDecor(c, d, S, time) {
  for (const f of d.flowers) {
    const sway = Math.sin(time * 1.4 + f.phase) > 0.6 ? 1 : 0;
    c.drawImage(S.flowers[f.kind], Math.round(f.x) + sway, Math.round(f.y));
  }
  for (const m of d.mushrooms) c.drawImage(S.mushrooms[m.kind], Math.round(m.x), Math.round(m.y));
  for (const r of d.rocks) c.drawImage(S.rocks[r.kind % 2], Math.round(r.x), Math.round(r.y));
}

/** Vilagito elemek: csillag, szentjanosbogar, foldi parazs. A szinezes FOLE. */
export function drawNightGlow(c, d, S, time) {
  for (const s of d.stars) {
    const tw = 0.45 + 0.55 * Math.abs(Math.sin(time * 1.6 + s.phase));
    c.fillStyle = 'rgba(226,236,255,' + (tw * 0.75).toFixed(3) + ')';
    c.fillRect(s.x, s.y, 1, 1);
  }
  for (const e of d.embers) {
    const b = 0.3 + 0.7 * Math.abs(Math.sin(time * 1.1 + e.phase));
    c.fillStyle = 'rgba(226,110,40,' + (b * 0.8).toFixed(3) + ')';
    c.fillRect(Math.round(e.x), Math.round(e.y), 1, 1);
  }
  for (const f of d.fireflies) {
    const fx = f.x + Math.cos(time * f.sp + f.phase) * f.rad;
    const fy = f.y + Math.sin(time * f.sp * 1.4 + f.phase) * f.rad * 0.6;
    const blink = 0.35 + 0.65 * Math.max(0, Math.sin(time * 2.4 + f.phase));
    c.fillStyle = 'rgba(198,240,120,' + (blink * 0.9).toFixed(3) + ')';
    c.fillRect(Math.round(fx), Math.round(fy), 1, 1);
    if (blink > 0.8) {
      c.fillStyle = 'rgba(198,240,120,0.3)';
      c.fillRect(Math.round(fx) - 1, Math.round(fy), 3, 1);
      c.fillRect(Math.round(fx), Math.round(fy) - 1, 1, 3);
    }
  }
}

/** Pokhalo a fak toveben, es a felette elhuzo madarak. */
export function drawDecorFront(c, d, S, time) {
  // a pokhalo a fajaval egyutt tunik el
  for (const w of d.cobwebs) {
    if (w.tree && (w.tree.gone || w.tree.burning || w.tree.state !== 'standing')) continue;
    c.drawImage(S.cobweb, Math.round(w.x), Math.round(w.y));
  }
  for (const b of d.birds) {
    const fr = Math.sin(time * 9 + b.phase) > 0 ? 0 : 1;
    c.drawImage(S.birds[fr], Math.round(b.x), Math.round(b.y + Math.sin(time * 1.2 + b.phase) * 2));
  }
  if (d.haze > 0) {
    c.fillStyle = 'rgba(190,150,120,' + (d.haze * 0.06).toFixed(3) + ')';
    c.fillRect(0, 0, W, H);
  }
}

/** A festo-algoritmusba kerulo allatok, y szerint rendezve. */
export function decorActors(d) {
  const out = [];
  const add = (list, set) => { for (const a of list) out.push({ a, set }); };
  add(d.bunnies, 'bunny');
  add(d.wolves, 'wolf');
  add(d.squirrels, 'squirrel');
  add(d.bears, 'bear');
  add(d.butterflies, 'butterfly');
  add(d.bats, 'bat');
  for (const o of d.owls) {
    if (o.tree && (o.tree.gone || o.tree.state !== 'standing')) continue;
    out.push({ a: o, set: 'owl', still: true });
  }
  return out;
}

export function drawCritter(c, it, S) {
  const set = S[it.set];
  if (it.still) {
    const img = set[it.a.blink > 3.7 ? 1 : 0];
    c.drawImage(img, Math.round(it.a.x - img.width / 2), Math.round(it.a.y - img.height));
    return;
  }
  const dir = it.a.face < 0 ? set.left : set.right;
  const img = dir[it.a.frame | 0];
  c.drawImage(img, Math.round(it.a.x - img.width / 2), Math.round(it.a.y - img.height));
}
