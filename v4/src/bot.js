// Bot a teszteleshez es az egyjatekos modhoz.
// Szandekosan heurisztikus es rovid: a jatekmechanikat ugy terveztuk,
// hogy ne kelljen pathfinding.

import { CFG, DIRS, TREE_KINDS } from './config.js';
import { inFire, fireProximity, towardSafe } from './arena.js';
import { treeLen, hitsPlayer, inHitZone } from './trees.js';
import { ghostNow } from './mechanics.js';

const STAND = 10;

function norm(x, y) {
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
}

function angDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Onvedelem: a robot SOSE lep onkent tuzbe. Barmit is akarna csinalni,
 * ha az irany langba vinne, a legkozelebbi biztonsagos iranyt valasztjuk.
 * Igy egyik szint sem tudja megolni magat.
 */
function safeDir(p, dx, dy, g) {
  const a = g && g.arena;
  if (!a) return { x: dx, y: dy };
  const l = Math.hypot(dx, dy) || 1;
  let ux = dx / l;
  let uy = dy / l;
  const look = 11;
  if (!inFire(a, p.x + ux * look, p.y + uy * look)) return { x: ux, y: uy };
  const turns = [0.55, -0.55, 1.1, -1.1, 1.7, -1.7, 2.3, -2.3, Math.PI];
  for (const r of turns) {
    const ca = Math.cos(r);
    const sa = Math.sin(r);
    const rx = ux * ca - uy * sa;
    const ry = ux * sa + uy * ca;
    if (!inFire(a, p.x + rx * look, p.y + ry * look)) return { x: rx, y: ry };
  }
  return towardSafe(a, p.x, p.y);
}

/**
 * Beragadas-oldas. Ha a robot egy helyben all, pedig menni akar (rönknek
 * vagy haznak nyomja magat), akkor egy ideig egy elforgatott iranyba indul.
 * Enelkul kepes volt a kor vegeig ugyanannak az akadalynak feszulni.
 */
function unstick(p, dx, dy, dt) {
  const moved = Math.hypot(p.x - (p.lastX || 0), p.y - (p.lastY || 0));
  p.lastX = p.x;
  p.lastY = p.y;

  // Vagas kozben SZANDEKOSAN all egy helyben, nekifeszulve a fanak.
  // Ha ezt beragadasnak vennenk, elrantanank a favagas kozepen.
  if (p.chopping) { p.stuckT = 0; p.unstickT = 0; return { x: dx, y: dy }; }

  if (p.unstickT > 0) {
    p.unstickT -= dt;
    const ca = Math.cos(p.unstickA);
    const sa = Math.sin(p.unstickA);
    return { x: dx * ca - dy * sa, y: dx * sa + dy * ca };
  }

  const wants = Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3;
  if (wants && moved < 0.22) p.stuckT = (p.stuckT || 0) + dt;
  else p.stuckT = 0;

  if (p.stuckT > 0.3) {
    p.stuckT = 0;
    p.unstickT = 0.45;
    p.unstickA = (Math.random() < 0.5 ? 1 : -1) * (1.1 + Math.random() * 0.9);
  }
  return { x: dx, y: dy };
}

function setInput(p, dx, dy, g, dt, skill) {
  const step = dt || 1 / 60;
  // A bena robot iranya folyamatosan sodrodik: mozog, csak rosszul.
  if (skill && skill.drift) {
    p.driftT = (p.driftT || 0) - step;
    if (p.driftT <= 0) {
      p.driftT = 0.3 + Math.random() * 0.45;
      p.driftA = (Math.random() * 2 - 1) * skill.drift;
    }
    const ca = Math.cos(p.driftA);
    const sa = Math.sin(p.driftA);
    const rx = dx * ca - dy * sa;
    const ry = dx * sa + dy * ca;
    dx = rx; dy = ry;
  }
  const u = unstick(p, dx, dy, step);
  const s2 = safeDir(p, u.x, u.y, g);
  const t = 0.34;
  p.botInput.right = s2.x > t;
  p.botInput.left = s2.x < -t;
  p.botInput.down = s2.y > t;
  p.botInput.up = s2.y < -t;
}

function idle(p) {
  p.botInput.up = p.botInput.down = p.botInput.left = p.botInput.right = false;
}

export function updateBot(p, dt, g) {
  if (!p.alive) { idle(p); return; }
  const skill = CFG.bot[p.difficulty] || CFG.bot.ugyes;
  const foe = g.players[1 - p.index];
  const a = g.arena;

  // SZELLEM-MOD a temetoben. A harangszo sotetjeben a robot is atmegy a
  // sirkoveken, tehat egy csapasra barhonnan elerne a masikat. Visszafogjuk:
  // rovidebb tavolsagrol indit rohamot, es a kondulas utan tetovazik egy
  // pillanatot. Igy nem a harangszo donti el a meccset.
  const szellem = ghostNow(g);
  p.botGhostT = szellem ? (p.botGhostT || 0) + dt : 0;

  // 1. Kiteres a dolo fa alol, illetve a MEG csak vagott fa arnyekabol.
  //    Ez utobbi az, amit egy jo jatekos is csinal: olvassa az elorejelzest.
  const danger = dodgeVector(p, g, skill) || dodgePreview(p, g, skill);
  if (danger) { setInput(p, danger.x, danger.y, g, dt, skill); return; }

  // 2. Tuz-biztonsag.
  const prox = fireProximity(a, p.x, p.y);
  if (inFire(a, p.x, p.y) || prox > 0.72) {
    const s = towardSafe(a, p.x, p.y);
    // kis oldalirányu sodras, hogy ne alljon be tokeletes szimmetriaba
    setInput(p, s.x - s.y * p.botBias * p.botSpin, s.y + s.x * p.botBias * p.botSpin, g, dt, skill);
    return;
  }

  // 3. A konnyu robot idonkent egyszeruen megall es bambul.
  if (skill.idle > 0) {
    p.idleT = (p.idleT || 0) - dt;
    if (p.idleT <= 0) {
      p.idleT = 0.4 + Math.random() * 0.9;
      p.idling = Math.random() < skill.idle;
    }
    if (p.idling) { idle(p); return; }
  }

  // 4. A nehez robot fejszet is hasznal: ha az ellenfel nem nez ra, rohan.
  //    Szembe sose megy neki, mert az csak haritas lenne.
  // Csak akkor tamad fejszevel, ha van eleg elete ra: kulonben fontosabb
  // a favagas, mert az ad vissza eletet.
  //
  // KET FEK van a rohamon, kulonben rataped a masikra: amig az nem fordul
  // szembe vele, vegtelenul kovetne es utne. Egy talalat utan hatralep egy
  // pillanatra, es egyetlen roham sem tarthat tovabb a megadott idonel.
  // Igy a kozelharc megmarad, de van kiszakadasi ablak.
  p.botBackoff = Math.max(0, (p.botBackoff || 0) - dt);

  if (skill.melee && p.hp > CFG.maxHp * 0.3 && p.botBackoff <= 0) {
    const dx = foe.x - p.x;
    const dy = foe.y - p.y;
    const dist = Math.hypot(dx, dy * 1.4);
    const rohamTav = szellem ? 30 : 54;
    let charge = false;
    if (dist < rohamTav && (!szellem || p.botGhostT > 0.8)) {
      const fd = DIRS[foe.dir] || [0, 1];
      const l = Math.hypot(dx, dy) || 1;
      charge = (fd[0] * -dx + fd[1] * -dy) / l < 0.3;
    }
    if (!charge) {
      p.botChaseT = 0;
    } else {
      p.botChaseT = (p.botChaseT || 0) + dt;
      if (p.botChaseT >= skill.meleeCommit) {
        // Tul hosszura nyult: elengedi, es visszamegy fat vagni.
        p.botChaseT = 0;
        p.botBackoff = skill.meleeBackoff;
      } else {
        const d = norm(dx, dy);
        const s2 = towardSafe(a, p.x, p.y);
        const k2 = Math.max(0, prox - 0.45) * 1.8;
        setInput(p, d.x * (1 - k2) + s2.x * k2, d.y * (1 - k2) + s2.y * k2, g, dt, skill);
        return;
      }
    }
  }

  // 5. Celvalasztas, reakcioidonkent ujra.
  p.botThink -= dt;
  if (p.botThink <= 0 || !p.botTarget || p.botTarget.gone || p.botTarget.state !== 'standing' || p.botTarget.burning) {
    p.botThink = skill.react;
    p.botTarget = pickTree(p, foe, g, skill);
  }

  const t = p.botTarget;
  if (!t) {
    // nincs jo fa: kozelits az ellenfelhez, de maradj biztonsagban
    const d = norm(foe.x - p.x, foe.y - p.y);
    const s = towardSafe(a, p.x, p.y);
    const k = prox * 0.9;
    setInput(p, d.x * (1 - k) + s.x * k, d.y * (1 - k) + s.y * k, g, dt, skill);
    return;
  }

  // 6. A fa JO oldalara kerules, majd nekimenni. Az ugyes robot oda celoz,
  //    ahol az ellenfel a doles pillanataban lesz, nem ahol most van.
  const aim = predictFoe(p, foe, t, skill);
  const goalAng = Math.atan2(t.y - aim.y, t.x - aim.x) + p.botBias * 0.35;
  const curAng = Math.atan2(p.y - t.y, p.x - t.x);
  const dTree = Math.hypot(t.x - p.x, t.y - p.y);
  const diff = angDiff(curAng, goalAng);

  let dir;
  if (dTree < 24 && Math.abs(diff) > 0.5) {
    // korbetancolas, hogy ne a rossz oldalrol kezdjuk vagni
    const sign = Math.abs(diff) > 2.6 ? p.botSpin : diff > 0 ? 1 : -1;
    const tang = { x: -Math.sin(curAng) * sign, y: Math.cos(curAng) * sign };
    const out = { x: Math.cos(curAng), y: Math.sin(curAng) };
    const push = dTree < 16 ? 0.7 : 0.2;
    dir = norm(tang.x + out.x * push, tang.y + out.y * push);
  } else {
    const stand = {
      x: t.x + Math.cos(goalAng) * STAND + (Math.random() - 0.5) * skill.jitter * 0.3,
      y: t.y + Math.sin(goalAng) * STAND + (Math.random() - 0.5) * skill.jitter * 0.3,
    };
    const dStand = Math.hypot(stand.x - p.x, stand.y - p.y);
    dir = dStand < 4 ? norm(t.x - p.x, t.y - p.y) : norm(stand.x - p.x, stand.y - p.y);
  }

  // sose sodrodjunk a tuzbe kozben
  const s = towardSafe(a, p.x, p.y);
  const k = Math.max(0, prox - 0.4) * 1.6;
  setInput(p, dir.x * (1 - k) + s.x * k, dir.y * (1 - k) + s.y * k, g, dt, skill);
}

/** A doles tengelyere merolegesen kilepni, amerre mar amugy is allunk. */
function escapeFrom(t, angle, p) {
  const px = -Math.sin(angle);
  const py = Math.cos(angle);
  const perp = (p.x - t.x) * px + (p.y - t.y) * py;
  const s = perp >= 0 ? 1 : -1;
  return { x: px * s, y: py * s };
}

/**
 * Kiteres a MAR DOLO fa alol. A szintet a reakcioido adja, nem kockadobas:
 * a doles 0.38 mp, tehat aki 0.30 mp mulva veszi eszre, az mar nem er ki.
 */
function dodgeVector(p, g, skill) {
  for (const t of g.trees) {
    if (t.state !== 'falling' || t.gone) continue;
    if (t.fallT < skill.dodgeDelay) continue;
    if (!hitsPlayer(t, t.fallAngle, p)) continue;
    return escapeFrom(t, t.fallAngle, p);
  }
  return null;
}

/**
 * A vagas alatt allo fa elorejelzett sebzo zonajabol is kilep, ha eleg jo.
 * A nehez robot mindig, a kozepes csak neha, a konnyu soha.
 */
function dodgePreview(p, g, skill) {
  if (skill.previewAt > 1) return null;
  for (const t of g.trees) {
    if (t.gone || t.burning || t.state !== 'standing') continue;
    if (t.previewAngle === null || t.chop < skill.previewAt) continue;
    if (t.previewBy === p.index) continue;   // a sajat vagasunk nem veszely
    // szigoru teszt: csak akkor lep ki, ha tenyleg a savban all
    if (!inHitZone(t, t.previewAngle, p.x, p.y, 0)) continue;
    return escapeFrom(t, t.previewAngle, p);
  }
  return null;
}

/**
 * Hova fog allni az ellenfel, mire ez a fa kidol?
 *
 * Ez a legfontosabb kulonbseg egy ugyes es egy nyomi robot kozott: a fa
 * csak 1-1.5 masodperc mulva er foldet, tehat a JELENLEGI helyre celozni
 * majdnem mindig melle megy. Az ugyes robot elore szamol a mozgassal.
 */
function predictFoe(p, foe, t, skill) {
  if (!skill.lead) return foe;
  const kind = TREE_KINDS[t.variant];
  const chopLeft = (1 - t.chop) * CFG.chopTime * kind.chopMul;
  const a0 = Math.atan2(t.y - foe.y, t.x - foe.x);
  const travel = Math.hypot(t.x + Math.cos(a0) * STAND - p.x,
    t.y + Math.sin(a0) * STAND - p.y) / CFG.speed;
  const lead = Math.min(1.6, (chopLeft + travel + CFG.fallTime) * skill.lead);
  return {
    x: foe.x + (foe.vx || 0) * lead,
    y: foe.y + (foe.vy || 0) * lead,
  };
}

function treeCost(p, foe0, g, skill, t) {
  const a = g.arena;
  const foe = predictFoe(p, foe0, t, skill);
  const L = treeLen(t);
  const de = Math.hypot(foe.x - t.x, foe.y - t.y);
  const goalAng = Math.atan2(t.y - foe.y, t.x - foe.x);
  const sx = t.x + Math.cos(goalAng) * STAND;
  const sy = t.y + Math.sin(goalAng) * STAND;
  if (inFire(a, sx, sy)) return Infinity;

  let cost = Math.hypot(sx - p.x, sy - p.y);
  if (skill.heal) {
    const need = 1 - Math.max(0, Math.min(1, p.hp / CFG.maxHp));
    const kind = TREE_KINDS[t.variant];
    cost -= (t.heal || kind.healMin) * skill.heal * need * 9;
    cost += kind.chopMul * skill.heal * need * 5;
  }
  if (de > L + 10) cost += 120 + (de - L) * 1.4;
  cost -= t.chop * 55 * (skill.steal === undefined ? 1 : skill.steal);
  cost += fireProximity(a, t.x, t.y) * 70;
  return cost;
}

function usable(t, a) {
  return !(t.gone || t.burning || t.state !== 'standing' || inFire(a, t.x, t.y));
}

/**
 * Celvalasztas HISZTEREZISSEL. Enelkul a gyors ujragondolas (nehez robot:
 * 0.08 mp) ket kozel azonos erteku fa kozott oda-vissza ingadozik, es a bot
 * egyiket sem vagja ki. Meresen ez tette a nehez robotot gyengebbe a
 * kozepesnel: csak 2.5 fat dontott koronkent a 3.6 helyett.
 */
function pickTree(p, foe, g, skill) {
  const a = g.arena;
  let best = null;
  let bestCost = Infinity;
  for (const t of g.trees) {
    if (!usable(t, a)) continue;
    let cost = treeCost(p, foe, g, skill, t);
    cost += (Math.random() - 0.5) * skill.jitter * 2;
    if (cost < bestCost) { bestCost = cost; best = t; }
  }

  // A jelenlegi celt csak akkor hagyjuk ott, ha az uj erdemben jobb.
  const cur = p.botTarget;
  if (cur && cur !== best && usable(cur, a)) {
    if (bestCost > treeCost(p, foe, g, skill, cur) - 30) return cur;
  }
  return best;
}
