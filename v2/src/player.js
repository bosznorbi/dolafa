// Favago: mozgas, utkozes, vagas, sebzes.

import { W, H, CFG, TEAM, clamp, bellRange, DIRS } from './config.js';
import { getInput } from './input.js';
import { chopBy, chopBlocked, baseRect } from './trees.js';
import { speedMul, moveRates, chopBlockedNow, darkMeleeBonus } from './mechanics.js';

export const PW = 10;
export const PH = 6;

export function makePlayer(index, x, y, isBot, difficulty) {
  return {
    index,
    color: index,          // melyik TEAM szint hasznalja (a menuben valaszthato)
    team: TEAM[index],
    squashT: 0,            // a fa alatt kilapult favago animacioja
    kx: 0, ky: 0,          // fejszecsapas utani ellokes
    x, y,
    spawnX: x, spawnY: y,
    vx: 0, vy: 0,
    dir: index === 0 ? 'right' : 'left',
    hp: CFG.startHp,
    meleeCd: 0,
    boost: 1,
    hurtFlash: 0,
    healFlash: 0,
    alive: true,
    chopping: false,
    chopT: 0,
    chopFrame: 0,
    animT: 0,
    animFrame: 0,
    burnT: 0,
    isBot: !!isBot,
    difficulty: difficulty || 'ugyes',
    botInput: { up: false, down: false, left: false, right: false },
    botTarget: null,
    botThink: 0,
    botBackoff: 0,     // talalat/hosszu roham utan ennyit nem tamad
    botChaseT: 0,      // mennyi ideje tart a mostani roham
    botBias: 0,
    botSpin: 1,
    sugarT: 0,             // cukorroham hatralevo ideje (cukorka palya)
    stuck: 1,              // szirup-lassitas szorzoja (cukorka palya)
    crackT: 0,             // mennyi ideje all repedesen (jegmezo palya)
  };
}

export function resetPlayer(p, x, y) {
  p.x = x; p.y = y;
  p.vx = 0; p.vy = 0;
  p.hp = CFG.startHp;
  p.meleeCd = 0;
  p.boost = 1;
  p.squashT = 0;
  p.kx = 0; p.ky = 0;
  p.hurtFlash = 0;
  p.healFlash = 0;
  p.alive = true;
  p.chopping = false;
  p.chopT = 0;
  p.burnT = 0;
  p.botTarget = null;
  p.botThink = 0;
  p.botBackoff = 0;
  p.botChaseT = 0;
  p.sugarT = 0;
  p.stuck = 1;
  p.crackT = 0;
  // koronkent mas 'szemelyiseg', hogy ne mozogjon gepiesen szimmetrikusan
  p.botBias = (Math.random() - 0.5) * 0.7;
  p.botSpin = Math.random() < 0.5 ? -1 : 1;
  p.dir = p.index === 0 ? 'right' : 'left';
}

export function rectOf(p) {
  return { x: p.x - PW / 2, y: p.y - PH, w: PW, h: PH };
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function moveX(p, dx, rects) {
  if (!dx) return;
  p.x += dx;
  const r = rectOf(p);
  for (const s of rects) {
    if (!overlap(r, s)) continue;
    p.x = dx > 0 ? s.x - PW / 2 : s.x + s.w + PW / 2;
    r.x = p.x - PW / 2;
  }
}

function moveY(p, dy, rects) {
  if (!dy) return;
  p.y += dy;
  const r = rectOf(p);
  for (const s of rects) {
    if (!overlap(r, s)) continue;
    p.y = dy > 0 ? s.y : s.y + s.h + PH;
    r.y = p.y - PH;
  }
}

/** Folyamatos sebzes (a tuz). Igaz, ha ettol halt meg. */
export function damage(p, amount, cause) {
  if (!p.alive) return false;
  p.hp -= amount;
  p.lastCause = cause || 'tuz';
  if (p.hp <= 0) {
    p.hp = 0;
    p.alive = false;
    return true;
  }
  return false;
}

/** A radölö fa nem sebez, hanem AZONNAL kiüt. */
export function kill(p, cause) {
  if (!p.alive) return false;
  p.hp = 0;
  p.alive = false;
  p.lastCause = cause || 'fa';
  if (cause === 'fa') p.squashT = CFG.squashTime;
  return true;
}

/** Minden kidontott fa visszaad egy keveset. */
export function heal(p, amount) {
  if (!p.alive) return 0;
  const before = p.hp;
  p.hp = Math.min(CFG.maxHp, p.hp + amount);
  p.healFlash = 0.45;
  return p.hp - before;
}

export function hpFrac(p) {
  return Math.max(0, Math.min(1, p.hp / CFG.maxHp));
}

export function updatePlayer(p, dt, g) {
  if (!p.alive) return;

  if (p.meleeCd > 0) p.meleeCd = Math.max(0, p.meleeCd - dt);
  if (p.hurtFlash > 0) p.hurtFlash = Math.max(0, p.hurtFlash - dt);
  if (p.healFlash > 0) p.healFlash = Math.max(0, p.healFlash - dt);

  const inp = p.isBot ? p.botInput : getInput(p.index);
  let ax = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  let ay = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
  const l = Math.hypot(ax, ay);
  if (l > 0) { ax /= l; ay /= l; }

  // Menekulo-gyorsitas: aki kozelrol ELFELE fut a masiktol, atmenetileg
  // gyorsabb. Enelkul a hatulrol tamado favago vegtelen ideig fejszezhetne
  // a menekulot, mert azonos a sebessegük.
  const foe = g.players[1 - p.index];
  let wantBoost = 1;
  if (foe && foe.alive && (ax || ay)) {
    const dx = p.x - foe.x;
    const dy = p.y - foe.y;
    const dist = Math.hypot(dx, dy * 1.5);
    if (dist < CFG.fleeRange && dist > 0.001) {
      const away = (ax * dx + ay * dy) / dist;
      if (away > 0.5) wantBoost = CFG.fleeBoost;
    }
  }
  p.boost += clamp(wantBoost - p.boost, -CFG.fleeEase * dt, CFG.fleeEase * dt);

  // A palya extra mechanikaja is beleszol: a cukorroham gyorsit, az inda
  // lassit, a jeg pedig lassan gyorsul es sokaig kicsuszik.
  const speed = CFG.speed * p.boost * speedMul(p)
    * (p.isBot ? (CFG.bot[p.difficulty] || CFG.bot.ugyes).speedMul : 1);
  const tvx = ax * speed;
  const tvy = ay * speed;
  const mr = moveRates();
  const rate = (ax || ay ? mr.accel : mr.friction) * dt;
  p.vx += clamp(tvx - p.vx, -rate, rate);
  p.vy += clamp(tvy - p.vy, -rate, rate);

  // ellokes csillapitasa
  const damp = Math.exp(-9 * dt);
  p.kx *= damp;
  p.ky *= damp;
  if (Math.abs(p.kx) < 1) p.kx = 0;
  if (Math.abs(p.ky) < 1) p.ky = 0;

  const rects = g.solids;
  moveX(p, (p.vx + p.kx) * dt, rects);
  moveY(p, (p.vy + p.ky) * dt, rects);

  p.x = clamp(p.x, 5, W - 5);
  p.y = clamp(p.y, 12, H - 2);

  if (ax || ay) {
    p.dir = Math.abs(ax) >= Math.abs(ay) ? (ax > 0 ? 'right' : 'left') : (ay > 0 ? 'down' : 'up');
  }

  // vagas: nincs gomb, az erintkezes vag
  p.chopping = false;
  const tree = chopBlockedNow(g) ? null : nearestChoppable(p, g.trees);
  if (tree) {
    p.chopping = true;
    p.dir = dirToward(p, tree);
    chopBy(tree, p, dt, g.hooks);
  }

  // animacio
  if (p.chopping) {
    p.chopT += dt;
    p.chopFrame = Math.floor((p.chopT / 0.13) % 3);
  } else {
    p.chopT = 0;
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > 6) {
      p.animT += dt * (sp / CFG.speed) * 8.5;
      p.animFrame = Math.floor(p.animT) % 4;
    } else {
      p.animT = 0;
      p.animFrame = 0;
    }
  }
}

function dirToward(p, t) {
  const dx = t.x - p.x;
  const dy = t.y - p.y;
  return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
}

function nearestChoppable(p, trees) {
  const r = rectOf(p);
  const e = CFG.chopReach;
  const probe = { x: r.x - e, y: r.y - e, w: r.w + e * 2, h: r.h + e * 2 };
  let best = null;
  let bd = Infinity;
  for (const t of trees) {
    if (t.gone || t.burning || t.state !== 'standing') continue;
    if (chopBlocked(t, p)) continue;      // a masik favago mar vagja
    if (!overlap(probe, baseRect(t))) continue;
    const d = (t.x - p.x) * (t.x - p.x) + (t.y - p.y) * (t.y - p.y);
    if (d < bd) { bd = d; best = t; }
  }
  return best;
}

function faces(p, dx, dy) {
  const d = DIRS[p.dir];
  const l = Math.hypot(dx, dy) || 1;
  return (d[0] * dx + d[1] * dy) / l > CFG.meleeCone;
}

/**
 * Fejszeparbaj. Ugyanaz az elv, mint a fanal: nincs gomb, az erintkezes ut.
 * Ha mindketten egymas fele neznek, az haritas: senki nem sebzodik.
 * Csak az sebez, aki ugy talalja el a masikat, hogy az nem nez vissza ra.
 */
export function resolveMelee(p0, p1) {
  if (!p0.alive || !p1.alive) return null;
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  if (Math.hypot(dx, dy * 1.5) > CFG.meleeRange) return null;

  const f0 = faces(p0, dx, dy);
  const f1 = faces(p1, -dx, -dy);
  if (!f0 && !f1) return null;

  const mx = (p0.x + p1.x) / 2;
  const my = (p0.y + p1.y) / 2 - 9;
  if (f0 && f1) return { clash: true, x: mx, y: my };

  const att = f0 ? p0 : p1;
  const vic = f0 ? p1 : p0;
  att.chopping = true;
  if (att.meleeCd > 0) return null;
  // A TALALT csapas utan hosszabb a pihenő, mint egy sima suhintas utan.
  att.meleeCd = CFG.meleeRate + CFG.meleeHitCd;
  // Nem fix ertek: harang-eloszlas, tehat a kozepes csapas a gyakori.
  // A sav a TAMADOTOL fugg: a bena bot gyengebben üt, mint az ugyes.
  const band = att.isBot ? (CFG.bot[att.difficulty] || CFG.bot.ugyes) : CFG;
  const lo = band.meleeMin === undefined ? CFG.meleeMin : band.meleeMin;
  const hi = band.meleeMax === undefined ? CFG.meleeMax : band.meleeMax;
  // Sotetben (temetoi harangszo) nagyobbat ut mindenki.
  const dmg = Math.round(bellRange(lo, hi)) + darkMeleeBonus();
  const died = damage(vic, dmg, 'fejsze');
  // A megutott favago elrepul egy kicsit, veletlen szogeltereessel, hogy
  // ne lehessen egy helyben vegtelenszer ujra eltalalni.
  const base = att === p0 ? Math.atan2(dy, dx) : Math.atan2(-dy, -dx);
  const ang = base + (Math.random() * 2 - 1) * CFG.meleeSpread;
  // Minel nagyobbat utott, annal kozelebb marad a masik.
  const heavy = (dmg - lo) / Math.max(1, hi - lo);
  const knock = CFG.meleeKnockLight + (CFG.meleeKnockHeavy - CFG.meleeKnockLight) * heavy;
  vic.kx = Math.cos(ang) * knock;
  vic.ky = Math.sin(ang) * knock * 0.7;
  return { hit: true, att, vic, died, dmg, x: mx, y: my };
}

// A ket favago nem megy at egymason.
export function separate(a, b) {
  if (!a.alive || !b.alive) return;
  const dx = b.x - a.x;
  const dy = (b.y - a.y) * 1.6;
  const d = Math.hypot(dx, dy);
  const min = 9;
  if (d >= min || d === 0) return;
  const push = (min - d) / 2;
  const nx = dx / d;
  const ny = dy / d;
  a.x -= nx * push;
  a.y -= (ny * push) / 1.6;
  b.x += nx * push;
  b.y += (ny * push) / 1.6;
}
