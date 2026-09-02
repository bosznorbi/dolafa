// DOL A FA - fo ciklus es allapotgep.

import { W, H, STEP, CFG, TEAM } from './config.js';
import { initInput, onKey } from './input.js';
import { initAudio, sfx, setFireLevel, toggleMute, isMuted, setMusicPaused } from './audio.js';
import { buildAll } from './sprites.js';
import {
  makeArena, updateArena, updateArenaOutro, beginOutro, inFire, fireProximity, spawnPoints,
} from './arena.js';
import { generateTrees, updateTrees, solidRects, hitsPlayer, treeLen } from './trees.js';
import {
  makePlayer, resetPlayer, updatePlayer, separate, resolveMelee,
  damage, kill, heal, rectOf,
} from './player.js';
import { updateBot } from './bot.js';
import { drawWorld } from './render.js';
import {
  drawHud, drawCountdown, drawRoundEnd, drawMatchEnd, drawMenu, drawPause,
  addFloat, clearFloats, updateFloats, drawFloats, makeMenu, menuInput, MENU_MODES,
} from './hud.js';
import { makeDecor, updateDecor } from './decor.js';
import { buildStream } from './decor-sprites.js';
import * as FX from './particles.js';
import { drawText } from './font.js';

const canvas = document.getElementById('game');
const c = canvas.getContext('2d', { alpha: false });
c.imageSmoothingEnabled = false;

const S = buildAll(20260827);

const F = CFG.field;
let SPAWNS = [{ x: F.cx - F.rx * 0.66, y: F.cy }, { x: F.cx + F.rx * 0.66, y: F.cy }];

const g = {
  state: 'menu',
  stateT: 0,
  round: 1,
  score: [0, 0],
  lastWinner: -1,
  matchOver: false,
  sides: null,
  decor: null,
  cabin: null,        // egy favago-menedek a palyan, ide fut be a gyoztes
  winnerPos: null,
  outroRunner: null,
  arena: makeArena(1),
  trees: [],
  players: [
    makePlayer(0, SPAWNS[0].x, SPAWNS[0].y, false),
    makePlayer(1, SPAWNS[1].x, SPAWNS[1].y, false),
  ],
  solids: [],
  shake: 0,
  emberT: 0,
  seedCount: 0,
  seed: 1,
  lastTreeHitBy: -1,
  treeHits: 0,
  treeFalls: 0,
  meleeHits: 0,
  clashCd: 0,
  clock: 0,
  parity: 0,
  hooks: null,
};

g.hooks = {
  onChopTick(t, p) {
    sfx.chop();
    FX.chips(t.x + (p.x < t.x ? -3 : 3), t.y - 6, p.x < t.x ? -1 : 1, -0.4, 3);
  },
  onFall(t, feller) {
    sfx.crack();
    FX.leaves(t.x, t.y - treeLen(t) * 0.6, 10);
    // A kialtas annak a szineben, aki kivagta: igy azonnal latszik, kie a fa.
    addFloat('DŐL A FA!', t.x, t.y - treeLen(t) - 8, {
      color: feller ? feller.team.tint : '#ffd257',
      outline: '#2a1408', life: 1.1,
    });
    // A fa a sajat, generalaskor kisorsolt erteket adja vissza. A tukorpar
    // ugyanannyit er, tehat a veletlen egyik jatekost sem hozza helyzetbe.
    if (feller) {
      const got = heal(feller, t.heal);
      if (got > 0) {
        sfx.pickup();
        addFloat('+' + Math.round(got), feller.x, feller.y - 24, { color: '#7ce05a', outline: '#123a0c' });
      }
    }
  },
  onIgnite(t) {
    FX.smoke(t.x, t.y - 6, 3);
  },
};

const menu = makeMenu();

// ---------------------------------------------------------------- meccs

function startMatch(sides) {
  g.sides = sides.map((s) => ({ color: s.color, mode: s.mode }));
  g.score = [0, 0];
  g.round = 1;
  g.matchOver = false;
  for (let i = 0; i < 2; i++) {
    const m = MENU_MODES[g.sides[i].mode];
    g.players[i].isBot = m.bot;
    g.players[i].difficulty = m.diff;
    g.players[i].color = g.sides[i].color;
    g.players[i].team = TEAM[g.sides[i].color];
  }
  newRound();
}

function newRound() {
  g.seed = (g.seed * 1103515245 + 12345) & 0x7fffffff;
  g.arena = makeArena(g.seed);
  SPAWNS = spawnPoints(g.arena);
  // A menedek csak akkor jelenik meg, amikor a kovetkezo kor mar donto
  // lehet: valakinek 2 pontja van, tehat egy gyozelemre van a meccstol.
  const matchPoint = Math.max(g.score[0], g.score[1]) >= CFG.roundsToWin - 1;
  const stream = buildStream(g.seed);
  g.cabin = matchPoint ? pickCabin(g.seed, SPAWNS, stream.pts) : null;
  g.trees = generateTrees(g.seed, g.arena, SPAWNS, g.cabin);
  g.decor = makeDecor(g.seed, g.arena, g.round, g.trees, stream);
  resetPlayer(g.players[0], SPAWNS[0].x, SPAWNS[0].y);
  resetPlayer(g.players[1], SPAWNS[1].x, SPAWNS[1].y);
  g.solids = solidRects(g.trees);
  if (g.cabin) g.solids.push(cabinRect(g.cabin));
  FX.clearParticles();
  clearFloats();
  g.shake = 0;
  g.seedCount = 0;
  g.state = 'countdown';
  g.stateT = 0;
  g.lastWinner = -1;
  g.lastTreeHitBy = -1;
  g.treeHits = 0;
  g.treeFalls = 0;
  g.meleeHits = 0;
  g.clashCd = 0;
}

/**
 * Egy favago-menedek valahol a palyan. Szandekosan NEM utkozik: egyetlen,
 * veletlen helyu szilard akadaly megtorne a kozeppontos tukrozest, tehat az
 * egyik jatekos fedezeket kapna, a masik nem. Igy csak diszlet, mint a patak.
 */
function pickCabin(seed, spawns, streamPts) {
  let s = seed >>> 0;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return (s % 10000) / 10000; };
  for (let i = 0; i < 80; i++) {
    const u = (rnd() * 2 - 1) * 0.66;
    const v = (rnd() * 2 - 1) * 0.56;
    const x = F.cx + u * F.rx;
    const y = F.cy + v * F.ry;
    let ok = true;
    for (const sp of spawns) if (Math.hypot(sp.x - x, sp.y - y) < 52) ok = false;
    // ne a patak partjan alljon, mert furan nez ki
    if (ok && streamPts) {
      for (const p of streamPts) {
        if (Math.abs(p.x - x) < 26 && Math.abs(p.y - y) < 22) { ok = false; break; }
      }
    }
    if (ok) return { x: Math.round(x), y: Math.round(y) };
  }
  return { x: F.cx, y: F.cy - 26 };
}

/** A menedek utkozo-doboza: a falak talpa. */
function cabinRect(cab) {
  return { x: cab.x - 14, y: cab.y - 10, w: 28, h: 10 };
}

function endRound(winner) {
  g.lastWinner = winner;
  const w = winner >= 0 ? g.players[winner] : g.players[0];
  g.winnerPos = { x: w.x, y: w.y };
  if (winner >= 0) {
    g.score[winner]++;
    sfx.win();
  } else {
    sfx.lose();
  }
  g.matchOver = g.score[0] >= CFG.roundsToWin || g.score[1] >= CFG.roundsToWin
    || g.round >= CFG.roundsToWin * 2 + 1;
  g.state = 'roundend';
  g.stateT = 0;
}

/**
 * Zarokep: a gyoztes onnan fut a menedekbe, ahol tulelte az utolso kort.
 * A futast itt szamoljuk, a render csak kirajzolja.
 */
function startOutro() {
  // Elvileg mindig van haz (a gyozelemhez 2 pontrol kell indulni), de ha a
  // meccs a kor-limiten dolt el, akkor is kell egy.
  if (!g.cabin) g.cabin = pickCabin(g.seed ^ 0x51ab, SPAWNS, null);
  beginOutro(g.arena);
  const tie = g.score[0] === g.score[1];
  const wi = tie ? 0 : (g.score[0] > g.score[1] ? 0 : 1);
  const from = g.winnerPos || { x: g.players[wi].x, y: g.players[wi].y };
  g.outroRunner = {
    color: g.players[wi].color,
    from,
    to: { x: g.cabin.x + 4, y: g.cabin.y + 1 },
    x: from.x, y: from.y, dir: 'right', frame: 0,
  };
}

function updateOutro(dt) {
  const r = g.outroRunner;
  if (!r) return;
  const k = Math.min(1, g.stateT / CFG.outro.run);
  const e = k < 1 ? k : 1;
  r.x = r.from.x + (r.to.x - r.from.x) * e;
  r.y = r.from.y + (r.to.y - r.from.y) * e - Math.sin(e * Math.PI) * 4;
  const dx = r.to.x - r.from.x;
  const dy = r.to.y - r.from.y;
  r.dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  r.frame = k < 1 ? Math.floor(g.stateT * 11) % 4 : 0;
  if (k >= 1) g.outroRunner = null;   // bent van, becsukodik az ajto
}

function toMenu() {
  g.state = 'menu';
  g.stateT = 0;
}

function pause() {
  if (g.state === 'paused' || g.state === 'menu') return;
  g.pausedFrom = g.state;
  g.pausedT = g.stateT;
  g.state = 'paused';
  g.stateT = 0;
}

// ---------------------------------------------------------------- update

function update(dt) {
  g.stateT += dt;
  g.shake = Math.max(0, g.shake - dt * 26);

  if (g.state === 'menu') { setFireLevel(0.1); setMusicPaused(false); return; }
  if (g.state === 'paused') { setFireLevel(0.08); setMusicPaused(true); return; }

  if (g.state === 'countdown') {
    setFireLevel(0.12);
    setMusicPaused(false);
    if (g.stateT >= CFG.countdown) {
      g.state = 'playing';
      g.stateT = 0;
      sfx.go();
    } else {
      const prev = Math.ceil(CFG.countdown - g.stateT + dt);
      const now = Math.ceil(CFG.countdown - g.stateT);
      if (now !== prev && now > 0) sfx.beep();
    }
    FX.updateParticles(dt);
    updateFloats(dt);
    return;
  }

  if (g.state === 'roundend' || g.state === 'matchend') {
    FX.updateParticles(dt);
    updateFloats(dt);
    // Zarokep: a MEGLEVO tuzfront zarul ossze a menedek koré, nem uj tuz jon.
    if (g.state === 'matchend' && g.stateT < CFG.outro.total) {
      updateArenaOutro(g.arena, dt, g.cabin, g.stateT / CFG.outro.total);
      updateOutro(dt);
    }
    updateTrees(g.trees, dt, g.arena, g.hooks);
    if (g.decor) updateDecor(g.decor, dt, g);
    setFireLevel(g.state === 'matchend' ? 0.9 : 0.3);
    if (g.state === 'roundend' && g.stateT >= CFG.roundEndTime) {
      if (g.matchOver) {
        g.state = 'matchend';
        g.stateT = 0;
        startOutro();
        sfx.win();
      } else {
        g.round++;
        newRound();
      }
    }
    return;
  }

  // --- playing ---
  updateArena(g.arena, dt, g.players);
  if (g.arena.seeds.length > g.seedCount) {
    // uj tuzfeszek gyulladt ki
    for (let i = g.seedCount; i < g.arena.seeds.length; i++) {
      const s = g.arena.seeds[i];
      const wx = g.arena.cx + s.u * g.arena.rx;
      const wy = g.arena.cy + s.v * g.arena.ry;
      FX.sparks(wx, wy, 14);
      FX.smoke(wx, wy - 3, 5);
    }
    g.seedCount = g.arena.seeds.length;
    sfx.burn();
    g.shake = Math.max(g.shake, 3);
  }

  g.solids = solidRects(g.trees);
  if (g.cabin) g.solids.push(cabinRect(g.cabin));

  for (const p of g.players) if (p.isBot) updateBot(p, dt, g);
  // Valtakozo sorrend: igy a fa-foglalasnal sincs allando elonye annak,
  // akit eloszor frissitunk.
  g.parity = g.parity ? 0 : 1;
  if (g.parity) {
    updatePlayer(g.players[0], dt, g);
    updatePlayer(g.players[1], dt, g);
  } else {
    updatePlayer(g.players[1], dt, g);
    updatePlayer(g.players[0], dt, g);
  }
  separate(g.players[0], g.players[1]);

  // Fejszeparbaj: oldalrol lehet utni, szembe allva mindketten haritanak.
  const m = resolveMelee(g.players[0], g.players[1]);
  if (m && m.clash) {
    g.clashCd -= dt;
    if (g.clashCd <= 0) {
      g.clashCd = 0.22;
      // Haritasnal nincs felirat: a szikra es a csattanas elmondja.
      sfx.clash();
      FX.sparks(m.x, m.y, 7);
      g.shake = Math.max(g.shake, 2.2);
    }
  } else if (m && m.hit) {
    sfx.chop();
    sfx.hurt();
    g.shake = Math.max(g.shake, 4);
    FX.blood(m.vic.x, m.vic.y - 10, m.vic.team.tint);
    FX.sparks(m.x, m.y, 4);
    m.vic.hurtFlash = 0.2;
    g.meleeHits++;
    addFloat('-' + m.dmg, m.vic.x, m.vic.y - 24, { color: '#ff8a5a', outline: '#2a0d06' });
    if (m.died) {
      g.shake = 9;
      addFloat('KIVÁGVA!', m.vic.x, m.vic.y - 30, { color: '#ff6a4a', outline: '#2a0d06', life: 1.4 });
    }
  }

  const landed = updateTrees(g.trees, dt, g.arena, g.hooks);
  for (const t of landed) {
    g.treeFalls++;
    sfx.impact();
    g.shake = Math.max(g.shake, 4);
    const dx = Math.cos(t.fallAngle);
    const dy = Math.sin(t.fallAngle);
    const L = treeLen(t);
    FX.dust(t.x + dx * L * 0.6, t.y + dy * L * 0.6, 10);
    FX.leaves(t.x + dx * L * 0.85, t.y + dy * L * 0.85, 7);

    for (const p of g.players) {
      if (!p.alive) continue;
      // A sajat kivagott fad soha nem eshet rad: nem lehet ala futni.
      if (p.index === t.feller) continue;
      if (!hitsPlayer(t, t.fallAngle, p)) continue;
      // A radölö fa nem sebez: azonnal kiut.
      if (kill(p, 'fa')) {
        g.lastTreeHitBy = 1 - p.index;
        g.treeHits++;
        sfx.hurt();
        g.shake = 11;
        FX.blood(p.x, p.y - 10, p.team.tint);
        FX.dust(p.x, p.y, 14);
        FX.leaves(p.x, p.y - 8, 8);
        addFloat('KIVÁGVA!', p.x, p.y - 26, { color: '#ff6a4a', outline: '#2a0d06', life: 1.4 });
      }
    }
  }

  // Eletfogyas. A tuzben gyorsan, azon kivul lassan: a favagas nem opcio.
  for (const p of g.players) {
    if (!p.alive) continue;
    if (inFire(g.arena, p.x, p.y)) {
      p.burnT += dt;
      p.hurtFlash = 0.12;
      if (Math.random() < dt * 30) FX.sparks(p.x, p.y - 4, 1);
      if (p.burnT < dt * 1.5) sfx.burn();
      if (damage(p, CFG.fireDrain * dt, 'tuz')) {
        sfx.hurt();
        g.shake = 6;
        FX.sparks(p.x, p.y - 6, 16);
        addFloat('ELÉGETT!', p.x, p.y - 26, { color: '#ffa03c', outline: '#2a0d06', life: 1.4 });
      }
    } else {
      p.burnT = 0;
      if (damage(p, CFG.idleDrain * dt, 'kimerules')) {
        sfx.lose();
        addFloat('KIDŐLT!', p.x, p.y - 26, { color: '#c8b89a', outline: '#2a0d06', life: 1.4 });
      }
    }
  }

  // parazs a tuzperemekrol
  g.emberT += dt;
  if (g.emberT > 0.05) {
    g.emberT = 0;
    const a = g.arena;
    const ring = a.seeds.length && Math.random() < 0.45
      ? a.seeds[(Math.random() * a.seeds.length) | 0].pts
      : a.ptsOut;
    const e = ring[(Math.random() * ring.length) | 0];
    if (e) {
      FX.sparks(e.x, e.y, 1);
      if (Math.random() < 0.35) FX.smoke(e.x, e.y - 4, 1);
    }
  }

  FX.updateParticles(dt);
  updateFloats(dt);
  if (g.decor) updateDecor(g.decor, dt, g);

  setFireLevel(0.15 + Math.max(
    fireProximity(g.arena, g.players[0].x, g.players[0].y),
    fireProximity(g.arena, g.players[1].x, g.players[1].y),
  ) * 0.85);

  // A kilapulas-animacio meg lefut, mielott jonne a korveg-kepernyo.
  for (const p of g.players) if (p.squashT > 0) p.squashT = Math.max(0, p.squashT - dt);
  if (g.players[0].squashT > 0 || g.players[1].squashT > 0) return;

  const a0 = g.players[0].alive;
  const a1 = g.players[1].alive;
  if (!a0 || !a1) {
    if (a0 || a1) endRound(a0 ? 0 : 1);
    else {
      const d0 = Math.hypot(g.players[0].x - g.arena.cx, g.players[0].y - g.arena.cy);
      const d1 = Math.hypot(g.players[1].x - g.arena.cx, g.players[1].y - g.arena.cy);
      let w = d0 < d1 ? 0 : d1 < d0 ? 1 : -1;
      if (w < 0 && g.lastTreeHitBy >= 0) w = g.lastTreeHitBy;
      endRound(w);
    }
  }
}

// ---------------------------------------------------------------- render

function draw(time) {
  g.clock = time;
  S.muted = isMuted();
  c.fillStyle = '#0a0806';
  c.fillRect(0, 0, W, H);

  if (g.state === 'menu') {
    // A menuben a rendes hangszoro-ikon mutatja az allapotot, tehat ide
    // nem kell a halvany jelzes.
    drawMenu(c, menu, S, time);
    return;
  }

  c.save();
  if (g.shake > 0.2) {
    c.translate(
      Math.round((Math.random() - 0.5) * g.shake),
      Math.round((Math.random() - 0.5) * g.shake),
    );
  }
  drawWorld(c, g, S, time);
  drawFloats(c);
  c.restore();

  drawHud(c, g, S);

  if (g.state === 'countdown') drawCountdown(c, g);
  else if (g.state === 'paused') drawPause(c, g);
  else if (g.state === 'roundend') drawRoundEnd(c, g);
  else if (g.state === 'matchend') drawMatchEnd(c, g, S, time);
  drawMuteHint(c);
}

/** Jatek kozben csak az athuzott hangszoro latszik, halvanyan. */
function drawMuteHint(c2) {
  if (!isMuted()) return;
  c2.globalAlpha = 0.55;
  c2.drawImage(S.speakerMuted, W - 14, H - 12);
  c2.globalAlpha = 1;
}

// ---------------------------------------------------------------- input

const SIDE_KEYS = [
  { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' },
  { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' },
];

initInput(window);
onKey((code) => {
  initAudio();
  if (code === 'KeyM') { toggleMute(); return; }
  const confirm = code === 'Space' || code === 'Enter';

  if (g.state === 'menu') {
    let handled = false;
    for (let i = 0; i < 2; i++) if (menuInput(menu, i, code, SIDE_KEYS[i])) handled = true;
    if (handled) sfx.select();
    else if (confirm) startMatch(menu.sides);
    return;
  }

  // A gyoztes-kepernyon mar nincs mit szuneteltetni: SPACE/ENTER vissza a
  // fomenube, R pedig ujra ugyanazokkal a beallitasokkal.
  if (g.state === 'matchend') {
    if (confirm || code === 'Escape') toMenu();
    else if (code === 'KeyR') startMatch(g.sides);
    return;
  }

  // Jatek kozben a SPACE MINDIG csak szuneteltet, korok kozott is.
  if (g.state === 'playing' || g.state === 'countdown' || g.state === 'roundend') {
    if (confirm || code === 'Escape') pause();
    return;
  }

  if (g.state === 'paused') {
    if (confirm) { g.state = g.pausedFrom || 'playing'; g.stateT = g.pausedT || 0; }
    else if (code === 'Escape') toMenu();
    return;
  }

  if (code === 'Escape') toMenu();
});

// ---------------------------------------------------------------- ciklus

function resize() {
  // Szeltol szelig: toredek nagyitas, hogy F11 alatt tenyleg kitoltse a
  // kepernyot. 16:9 monitoron ez amugy is egesz szamu szorzo.
  //
  // A also korlat NEM elhagyhato: betolteskor vagy rejtett lapon az
  // innerWidth/innerHeight lehet 0, es akkor 0 pixeles lenne a canvas.
  const vw = window.innerWidth || document.documentElement.clientWidth || W;
  const vh = window.innerHeight || document.documentElement.clientHeight || H;
  const s = Math.max(1, Math.min(vw / W, vh / H));
  canvas.style.width = Math.round(W * s) + 'px';
  canvas.style.height = Math.round(H * s) + 'px';
}
window.addEventListener('resize', resize);
resize();
// Az elrendezes néha kesobb all be (fullscreen valtas, betoltes): ujramerjuk.
window.addEventListener('load', resize);
document.addEventListener('visibilitychange', resize);
setTimeout(resize, 60);
setTimeout(resize, 400);

// Ha elnavigalunk a laprol vagy mas ablakra valtunk, alljon szunetre, hogy
// visszaterve pontosan onnan folytathassuk.
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('blur', pause);

// Fejlesztoi hozzaferes: a konzolbol leptetheto es kirajzoltathato a jatek.
window.__timber = {
  g, S, menu,
  step: (dt) => update(dt),
  render: (t) => draw(t),
  startMatch,
  newRound,
  shot: (name) => fetch('/__shot?name=' + name, { method: 'POST', body: canvas.toDataURL('image/png') }),
};

let last = performance.now();
let acc = 0;
let clock = 0;

/**
 * Vedohalo. Ha egyetlen kepkocka hibaval elszall, a rAF-lanc megszakadna, es
 * a kep egy FELIG kirajzolt allapotban fagyna be. Elkapjuk, kiirjuk a
 * kepernyore, es a ciklus megy tovabb.
 */
let lastError = null;

function drawError(msg) {
  c.fillStyle = 'rgba(20,8,6,0.92)';
  c.fillRect(0, 0, W, H);
  drawText(c, 'HIBA A RAJZOLÁSBAN', W / 2, 60, {
    align: 'center', scale: 2, color: '#ff6a4a', outline: '#2a0d06', shadow: null,
  });
  const line = String(msg).slice(0, 44).toUpperCase().replace(/[^A-Z0-9 .:_-]/g, ' ');
  drawText(c, line, W / 2, 92, { align: 'center', color: '#f2e2c2' });
  drawText(c, 'RÉSZLETEK A KONZOLBAN (F12)', W / 2, 112, { align: 'center', color: '#8a7a62' });
}

function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.25) dt = 0.25;
  clock += dt;
  acc += dt;
  try {
    let guard = 0;
    while (acc >= STEP && guard++ < 8) {
      update(STEP);
      acc -= STEP;
    }
    draw(clock);
  } catch (e) {
    if (String(e) !== lastError) {
      lastError = String(e);
      // eslint-disable-next-line no-console
      console.error('DOL A FA - kepkocka hiba:', e);
    }
    try { drawError(e && e.message ? e.message : e); } catch (_) { /* nincs mit tenni */ }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
