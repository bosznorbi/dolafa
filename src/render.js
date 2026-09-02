// Rajzolas. A jatek logika soha nem rajzol, es ez a fajl soha nem modositja az allapotot.

import { W, H, CFG, PAL, TEAM, clamp } from './config.js';
import { PLAYER_SPRITE } from './sprites.js';
import { fallProgress, treeLen } from './trees.js';
import { inFire, boundarySamples } from './arena.js';
import { drawParticles } from './particles.js';
import {
  drawGroundDecor, drawNightGlow, drawDecorFront, decorActors, drawCritter,
  drawClouds, nightK, dayIndex,
} from './decor.js';

export { dayIndex };

const drawList = [];
let flameSamples = [];

function dayTint(dayT) {
  const stops = CFG.phases;
  const i0 = Math.floor(dayT);
  const i1 = Math.min(stops.length - 1, i0 + 1);
  const f = dayT - i0;
  const A = stops[i0];
  const B = stops[i1];
  return {
    r: Math.round(A.c[0] + (B.c[0] - A.c[0]) * f),
    g: Math.round(A.c[1] + (B.c[1] - A.c[1]) * f),
    b: Math.round(A.c[2] + (B.c[2] - A.c[2]) * f),
    ground: A.ground + (B.ground - A.ground) * f,
    world: A.world + (B.world - A.world) * f,
  };
}

function tintRect(c, t, a) {
  if (a <= 0.004) return;
  c.fillStyle = 'rgba(' + t.r + ',' + t.g + ',' + t.b + ',' + a.toFixed(3) + ')';
  c.fillRect(0, 0, W, H);
}

export function drawWorld(c, g, S, time) {
  const a = g.arena;
  const dayT = dayIndex(g);
  const tint = dayTint(dayT);

  // 1. Talaj: minden leegett, kiveve a kulso fronton belulit; a tuzfeszkek
  //    pedig visszaegetnek egy-egy foltot.
  c.drawImage(S.burnt, 0, 0);
  c.save();
  c.beginPath();
  poly(c, a.ptsOut);
  c.clip();
  c.drawImage(S.ground, 0, 0);
  if (g.decor && g.decor.stream) c.drawImage(g.decor.stream, 0, 0);
  c.restore();
  for (const s of a.seeds) {
    if (s.r < 0.06) continue;
    c.save();
    c.beginPath();
    poly(c, s.pts);
    c.clip();
    c.drawImage(S.burnt, 0, 0);
    c.restore();
  }
  if (g.decor) drawGroundDecor(c, g.decor, S, time);

  // 2. A HATTER sotetedik erosen. A szereplok kesobb csak enyhen.
  tintRect(c, tint, tint.ground);
  if (g.decor) drawNightGlow(c, g.decor, S, time);
  drawSky(c, S, dayT);

  // 3. Meleg feny a peremek biztonsagos oldalan.
  c.save();
  c.beginPath();
  poly(c, a.ptsOut);
  c.clip();
  c.beginPath();
  poly(c, a.ptsOut);
  c.strokeStyle = 'rgba(255,132,44,0.32)';
  c.lineWidth = 7;
  c.stroke();
  c.strokeStyle = 'rgba(255,206,120,0.30)';
  c.lineWidth = 3;
  c.stroke();
  c.restore();

  // 4. Veszelyzona: ide fog dolni a fa.
  drawFallPreview(c, g, time);

  // 5. Tuskek elore, azok laposak.
  for (const t of g.trees) {
    if (t.gone || t.state === 'standing') continue;
    c.drawImage(S.stump, Math.round(t.x - 4), Math.round(t.y - 4));
  }

  // 6. Festo-algoritmus. A langok is a sorba kerulnek, hogy az elottuk allo
  //    fa takarja oket, ahogy perspektivaban kell.
  moonRim = g.decor ? g.decor.moonrim || 0 : 0;
  flameSamples = boundarySamples(a, 5);
  drawList.length = 0;
  for (const t of g.trees) {
    if (!t.gone) drawList.push({ y: t.y, k: 0, o: t });
  }
  const outro = g.state === 'matchend';
  // A zarokepen a gyoztest a futo alak jelenti, tehat a jatekosokat nem
  // rajzoljuk ki meg egyszer a helyukon.
  if (!outro) {
    for (const p of g.players) {
      if (p.alive || p.squashT > 0) drawList.push({ y: p.y, k: 1, o: p });
    }
  } else if (g.outroRunner) {
    drawList.push({ y: g.outroRunner.y, k: 5, o: g.outroRunner });
  }
  if (g.decor) {
    for (const it of decorActors(g.decor)) drawList.push({ y: it.a.y, k: 3, o: it });
  }
  if (g.cabin) drawList.push({ y: g.cabin.y, k: 4, o: g.cabin });
  for (let i = 0; i < flameSamples.length; i++) {
    drawList.push({ y: flameSamples[i].y, k: 2, o: flameSamples[i], i });
  }
  drawList.sort((u, v) => u.y - v.y);
  for (const it of drawList) {
    if (it.k === 0) drawTree(c, it.o, S, time);
    else if (it.k === 1) drawPlayer(c, it.o, S, g, time);
    else if (it.k === 3) drawCritter(c, it.o, S);
    else if (it.k === 4) drawCabin(c, g, S, time);
    else if (it.k === 5) drawRunner(c, it.o, S);
    else drawFlame(c, it.o, it.i, S, time);
  }

  drawParticles(c);

  // 7. A szereplok folott csak enyhe szinezes, hogy ejszaka is lassuk oket.
  tintRect(c, tint, tint.world);
  if (tint.ground > 0.15) {
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = Math.min(0.5, tint.ground * 0.85);
    for (let i = 0; i < flameSamples.length; i++) drawFlame(c, flameSamples[i], i, S, time);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }

  if (g.decor) drawDecorFront(c, g.decor, S, time);
  if (g.decor) drawClouds(c, g.decor, S, dayT);
  c.drawImage(S.vignette, 0, 0);
}

function poly(c, pts) {
  if (!pts.length) return;
  c.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
  c.closePath();
}

/** Nap es hold a sarokban: enelkul csak annyi latszana, hogy sotetedik. */
function drawSky(c, S, dayT) {
  const nk = nightK(dayT);
  const arc = (t) => ({
    x: Math.round(W - 62 + t * 40),
    y: Math.round(40 - Math.sin(t * Math.PI) * 10),
  });
  if (nk < 0.75) {
    const p = arc(clamp(dayT / 3.2, 0, 1));
    c.globalAlpha = clamp(1 - nk / 0.75, 0, 1);
    c.drawImage(S.sun, p.x, p.y);
    c.globalAlpha = 1;
  }
  if (nk > 0.25) {
    const p = arc(clamp((dayT - 2.2) / 1.8, 0, 1));
    c.globalAlpha = clamp((nk - 0.25) / 0.45, 0, 1);
    c.drawImage(S.moon, p.x, p.y - 4);
    c.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------- veszelyzona

/**
 * Kivetiti a foldre, hova fog dolni a fa. Vagas kozben az elorejelzett
 * szoget mutatja, doles kozben a valodit.
 */
function drawFallPreview(c, g, time) {
  for (const t of g.trees) {
    if (t.gone || t.burning) continue;
    let ang = null;
    let k = 0;
    if (t.state === 'standing' && t.previewAngle !== null && t.chop > 0.02) {
      ang = t.previewAngle;
      k = t.chop;
    } else if (t.state === 'falling') {
      ang = t.fallAngle;
      k = 1;
    }
    if (ang === null) continue;

    const L = treeLen(t);
    const hw = CFG.hitWidth / 2;
    const cr = CFG.crownSize / 2;
    c.save();
    c.translate(Math.round(t.x), Math.round(t.y));
    c.rotate(ang);
    c.beginPath();
    c.rect(0, -hw, L, hw * 2);
    c.moveTo(L * 0.78 + cr, 0);
    c.arc(L * 0.78, 0, cr, 0, Math.PI * 2);
    c.clip();

    const hot = k > 0.72;
    c.fillStyle = hot ? 'rgba(255,96,32,0.36)' : 'rgba(10,5,2,0.36)';
    for (let y = -cr - 2; y < cr + 2; y += 2) {
      for (let x = -2; x < L + cr; x += 2) {
        if (((x >> 1) + (y >> 1)) % 2) continue;
        c.fillRect(x, y, 2, 2);
      }
    }
    if (hot && Math.floor(time * 8) % 2 === 0) {
      c.fillStyle = 'rgba(255,180,80,0.22)';
      c.fillRect(-2, -cr - 2, L + cr + 4, cr * 2 + 4);
    }
    c.restore();
  }
}

// ---------------------------------------------------------------- fa

let moonRim = 0;

function drawTree(c, t, S, time) {
  const spr = S.trees[t.variant];
  const fal = S.fallen[t.variant];
  const burning = t.burning;

  if (t.state === 'standing') {
    const jit = t.shake > 0.05 ? (Math.sin(time * 60) * t.shake) | 0 : 0;
    const x = Math.round(t.x - spr.w / 2) + jit;
    const y = Math.round(t.y - spr.h);
    c.drawImage(S.shadowMd, Math.round(t.x - 8), Math.round(t.y - 3));
    c.drawImage(burning ? spr.char : spr.cv, x, y);
    if (moonRim > 0 && !burning) {
      // Hideg holdfeny nehany tu-csillanason. Szandekosan NEM vizszintes
      // vonal: az idegen testnek latszott a korona tetejen.
      c.fillStyle = 'rgba(150,190,240,' + (moonRim * 0.45).toFixed(3) + ')';
      c.fillRect(x + Math.round(spr.w * 0.42), y + 2, 1, 1);
      c.fillRect(x + Math.round(spr.w * 0.26), y + Math.round(spr.h * 0.34), 1, 1);
      c.fillRect(x + Math.round(spr.w * 0.62), y + Math.round(spr.h * 0.30), 1, 1);
      c.fillRect(x + Math.round(spr.w * 0.20), y + Math.round(spr.h * 0.58), 1, 1);
      c.fillRect(x + Math.round(spr.w * 0.70), y + Math.round(spr.h * 0.55), 1, 1);
    }
    if (burning) drawTreeFlames(c, S, t, time);
    else if (t.chop > 0.02) drawChop(c, t, spr, x, y);
    return;
  }

  // Szabad szogu doles: az allo maradek osszelapul, a kidolt torzs kinő.
  const p = fallProgress(t);
  const a = (p * Math.PI) / 2;
  const co = Math.cos(a);
  if (t.state === 'falling' && co > 0.05) {
    c.save();
    c.translate(Math.round(t.x), Math.round(t.y));
    c.scale(1, co);
    c.drawImage(spr.cv, -Math.round(spr.w / 2), -spr.h);
    c.restore();
  }
  const grow = t.state === 'down' ? 1 : Math.sin(a);
  if (grow > 0.02) {
    const L = Math.max(1, Math.round(fal.L * grow));
    const img = burning ? fal.charRight : fal.right;
    c.save();
    c.translate(Math.round(t.x), Math.round(t.y));
    c.rotate(t.fallAngle);
    c.drawImage(img, 0, 0, L, fal.T, 0, -Math.round(fal.T / 2), L, fal.T);
    c.restore();
  }
  if (burning) drawTreeFlames(c, S, t, time);
}

function drawChop(c, t, spr, x, y) {
  const trunkY = Math.round(t.y - Math.max(6, spr.h * 0.24) + 1);
  const n = Math.min(3, 1 + Math.floor(t.chop * 3));
  c.fillStyle = PAL.woodPale;
  c.fillRect(Math.round(t.x) - 2, trunkY, n, 2);
  c.fillStyle = '#e8c98c';
  c.fillRect(Math.round(t.x) - 2, trunkY, n, 1);

  const bw = 14;
  const bx = Math.round(t.x - bw / 2);
  const by = y - 5;
  c.fillStyle = 'rgba(10,7,5,0.75)';
  c.fillRect(bx - 1, by - 1, bw + 2, 4);
  c.fillStyle = '#3a2c1c';
  c.fillRect(bx, by, bw, 2);
  const fill = Math.round(bw * t.chop);
  c.fillStyle = t.chop > 0.82 ? '#ffd257' : PAL.woodPale;
  c.fillRect(bx, by, fill, 2);
  c.fillStyle = t.chop > 0.82 ? '#fff0b8' : '#e8c98c';
  c.fillRect(bx, by, fill, 1);
}

function drawTreeFlames(c, S, t, time) {
  const f = S.flames;
  const spr = S.trees[t.variant];
  const n = t.state === 'standing' ? 4 : 3;
  for (let i = 0; i < n; i++) {
    const fx = Math.round(t.x - spr.w / 2 + 2 + i * ((spr.w - 4) / Math.max(1, n - 1)));
    const fy = Math.round(t.y - (t.state === 'standing' ? spr.h * 0.45 : 2));
    const fr = (Math.floor(time * 15 + i * 2.3 + t.x) % f.frames.length + f.frames.length) % f.frames.length;
    c.drawImage(f.frames[fr], fx - 3, fy - f.h + 4);
  }
}

// ---------------------------------------------------------------- favago

function drawPlayer(c, p, S, g, time) {
  const set = S.players[p.color][p.dir];

  // Kilapulva: a fa alatt maradt favago rovid animacioja.
  if (p.squashT > 0) {
    const k = clamp(p.squashT / CFG.squashTime, 0, 1);
    const img = set.walk[0];
    const sy = 0.22 + 0.16 * (1 - k);
    const sx = 1.5 - 0.25 * (1 - k);
    c.drawImage(S.shadowMd, Math.round(p.x - 8), Math.round(p.y - 3));
    c.save();
    c.translate(Math.round(p.x), Math.round(p.y));
    c.scale(sx, sy);
    c.drawImage(img, -PLAYER_SPRITE.footX, -PLAYER_SPRITE.footY);
    c.restore();
    return;
  }

  const img = p.chopping ? set.chop[p.chopFrame] : set.walk[p.animFrame];
  const x = Math.round(p.x - PLAYER_SPRITE.footX);
  const y = Math.round(p.y - PLAYER_SPRITE.footY);

  c.drawImage(S.shadowSm, Math.round(p.x - 6), Math.round(p.y - 3));

  if (p.hurtFlash > 0 && Math.floor(time * 26) % 2 === 0) c.globalAlpha = 0.55;
  c.drawImage(img, x, y);
  c.globalAlpha = 1;
  if (p.healFlash > 0) {
    c.fillStyle = '#9cf07a';
    for (let i = 0; i < 3; i++) {
      const t2 = (p.healFlash * 2.2 + i * 0.33) % 1;
      c.fillRect(Math.round(p.x - 6 + i * 5), Math.round(p.y - 6 - t2 * 20), 1, 2);
    }
  }

  if (inFire(g.arena, p.x, p.y)) {
    const f = S.flames;
    for (let i = 0; i < 2; i++) {
      const fr = (Math.floor(time * 18 + i * 3) % f.frames.length);
      c.drawImage(f.frames[fr], Math.round(p.x - 5 + i * 5), Math.round(p.y - 16));
    }
  }
}

// ---------------------------------------------------------------- tuz

function drawFlame(c, s, i, S, time) {
  const f = S.flames;
  const fr = (Math.floor(time * 16 + i * 1.7 + s.i) % f.frames.length + f.frames.length) % f.frames.length;
  c.drawImage(f.frames[fr], Math.round(s.x - (f.w >> 1)), Math.round(s.y - f.h + 4));
}

// ---------------------------------------------------------------- menedek

/**
 * A favago-menedek. Vegig ott all a palyan, tehat a jatekos mar a meccs
 * alatt latja, hova erdemes futni a vegen. Nem eg le, es a festo-algoritmus
 * resze, tehat az elotte allo fa takarja.
 */
function drawCabin(c, g, S, time) {
  const cab = S.cabin;
  const bx = Math.round(g.cabin.x - cab.w / 2);
  const by = Math.round(g.cabin.y - cab.h);
  c.drawImage(S.shadowLg, bx + 7, by + cab.h - 4);
  c.drawImage(cab.cv, bx, by);

  const shut = g.state === 'matchend' && g.stateT >= CFG.outro.run;
  c.drawImage(shut ? S.doorShut : S.doorOpen, bx + cab.doorX, by + cab.doorY);

  // Bent van: kinez az ablakon. A keresztfa a feje ELE kerul, tehat
  // tenyleg az ablak mogul nez ki.
  if (shut) {
    const tie = g.score[0] === g.score[1];
    const wi = tie ? 0 : (g.score[0] > g.score[1] ? 0 : 1);
    const team = TEAM[g.players[wi].color];
    const wx = bx + cab.winX;
    const wy = by + cab.winY;
    c.save();
    c.beginPath();
    c.rect(wx, wy, cab.winW, cab.winH);
    c.clip();
    const hw = 9;
    const hx0 = wx + Math.round((cab.winW - hw) / 2);
    c.fillStyle = team.cap;
    c.fillRect(hx0, wy + 1, hw, 2);              // sapka
    c.fillStyle = team.capDark;
    c.fillRect(hx0, wy + 3, hw, 1);
    c.fillStyle = team.skin;
    c.fillRect(hx0 + 1, wy + 4, hw - 2, 4);      // arc
    c.fillStyle = '#1e1410';
    c.fillRect(hx0 + 2, wy + 5, 1, 1);           // szem
    c.fillRect(hx0 + 6, wy + 5, 1, 1);
    c.fillRect(hx0 + 3, wy + 7, 3, 1);           // mosoly
    c.fillRect(hx0 + 2, wy + 6, 1, 1);
    c.fillRect(hx0 + 6, wy + 6, 1, 1);
    c.fillStyle = team.beardCol;
    c.fillRect(hx0 + 1, wy + 8, hw - 2, 3);      // szakall
    c.fillStyle = team.shirt;
    c.fillRect(hx0 - 1, wy + 10, hw + 2, 2);     // vall
    c.restore();
    c.drawImage(S.windowFrame, wx - 1, wy - 1);
  }

  // kemenyfust, amikor mar bent van
  if (shut) {
    for (let i = 0; i < 5; i++) {
      const st = (time * 0.55 + i * 0.2) % 1;
      const sx = bx + 25 + Math.sin(st * 5 + i) * 3;
      const sy = by + 2 - st * 22;
      c.fillStyle = 'rgba(200,190,180,' + (0.55 * (1 - st)).toFixed(3) + ')';
      const sz = 1 + ((st * 2) | 0);
      c.fillRect(Math.round(sx), Math.round(sy), sz, sz);
    }
  }
}

/** A gyoztes favago, ahogy onnan fut a menedekbe, ahol tulelte az utolso kort. */
function drawRunner(c, r, S) {
  const set = S.players[r.color][r.dir];
  const img = set.walk[r.frame];
  c.drawImage(S.shadowSm, Math.round(r.x - 6), Math.round(r.y - 3));
  c.drawImage(img, Math.round(r.x - PLAYER_SPRITE.footX), Math.round(r.y - PLAYER_SPRITE.footY));
}
