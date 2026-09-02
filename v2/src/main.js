// DOL A FA - fo ciklus es allapotgep.

import { W, H, STEP, CFG, TEAM, CURRENT, applyTheme, bellRange } from './config.js';
import { THEMES } from './themes.js';
import { initInput, onKey } from './input.js';
import {
  initAudio, sfx, setFireLevel, toggleMute, isMuted, setMusicPaused, setMusicTempo,
  setMusicTrack, setHazardAmbience, setAllPaused, setChopMaterial, setFanfare,
} from './audio.js';
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
import {
  hasMech, resetMech, runChain, onTreeDown, onFell, updateMech, launchAll, updateFlying,
} from './mechanics.js';
import { drawWorld } from './render.js';
import {
  drawHud, drawCountdown, drawRoundEnd, drawMatchEnd, drawMenu, drawPause,
  addFloat, clearFloats, updateFloats, drawFloats, makeMenu, menuInput, MENU_MODES,
  clampMenuColors,
} from './hud.js';
import { makeDecor, updateDecor } from './decor.js';
import { buildStream } from './decor-sprites.js';
import * as FX from './particles.js';
import { drawText } from './font.js';

const canvas = document.getElementById('game');
const c = canvas.getContext('2d', { alpha: false });
c.imageSmoothingEnabled = false;

// A sprite-keszlet temavaltaskor UJRAEPUL, de ugyanaz az objektum marad:
// a tobbi modul mar tartja a hivatkozast, tehat nem cserelhetjuk le.
// Varazsmodban ennyiszeres a zene tempoja: 138 BPM helyett kb. 182.
const Z_TEMPO = 1.32;

const SPRITE_SEED = 20260827;
const S = {};
function rebuildSprites() {
  const fresh = buildAll(SPRITE_SEED);
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, fresh);
}
rebuildSprites();

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
  randomThemes: false,
  endless: false,         // SHIFT+R: a meccs vegen magatol indul az ujabb
  endlessT: 0,            // ennyi masodperc van meg a visszaszamlalasbol
  themeOrder: null,       // veletlen modban a korok palyasorrendje
  decor: null,
  cabin: null,        // egy favago-menedek a palyan, ide fut be a gyoztes
  winnerPos: null,
  outroRunner: null,
  finaleDone: false,      // felszalltak-e mar a zarokepi raketak
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
  spots: [],              // palya-mechanikak foltjai (kisertet, repedes, szirup)
  gusts: [],              // a sivatagon vonulo szellokesek
  gustWarn: 0,
  bellT: 0,               // mennyi ido a kovetkezo harangszoig
  bellSwing: 0,           // meddig leng meg a harang a toronyban
  tower: null,            // a harangtorony helye (csak a temetoben)
  darkT: 0,               // meddig tart meg a sotetseg
  curseLast: null,        // az aztek villam elozo eredmenye (talalt-e)
  curseStreak: 0,         // hanyszor jott ki zsinorban ugyanaz
  lastTreeHitBy: -1,
  treeHits: 0,
  treeFalls: 0,
  meleeHits: 0,
  clashCd: 0,
  clock: 0,
  parity: 0,
  hooks: null,
};

/**
 * A lebego +/- szamok ANNAK a jatekosnak a szineben jelennek meg, akit
 * erintenek. Zold-piros parral kozelharcban nem lehetett megmondani, melyik
 * favago sebzodott; a sajat szinevel viszont egybol latszik.
 */
function floatColors(p) {
  const team = TEAM[p.color] || TEAM[0];
  return { color: team.tint, outline: '#170f0a' };
}

g.hooks = {
  onChopTick(t, p) {
    sfx.chop();
    FX.chips(t.x + (p.x < t.x ? -3 : 3), t.y - 6, p.x < t.x ? -1 : 1, -0.4, 3);
  },
  onFall(t, feller) {
    sfx.crack();
    FX.leaves(t.x, t.y - treeLen(t) * 0.6, 10);
    // Lancszemnel NEM kialtunk: egy dominosornal tizennegy felirat egymas
    // hegyen-hatan olvashatatlan lenne. Csak az inditó lapnal szol.
    if (!t.chained) {
      // A kialtas annak a szineben, aki kivagta: igy latszik, kie a lap.
      addFloat(CURRENT.theme.shout, t.x, t.y - treeLen(t) - 8, {
        color: feller ? feller.team.tint : '#ffd257',
        outline: '#2a1408', life: 1.1,
      });
    }
    // A fa a sajat, generalaskor kisorsolt erteket adja vissza. A tukorpar
    // ugyanannyit er, tehat a veletlen egyik jatekost sem hozza helyzetbe.
    if (feller) {
      // A lancszem is gyogyit, de csak felannyit: a lancreakcio igy jutalom
      // marad, de nem teszi elpusztithatatlanna azt, aki elinditotta.
      // Lancszem: minel tavolabb van az inditotol, annal kevesebbet er.
      // A hosszu dominosor igy nagyon sokat hoz osszesen, de minden ujabb
      // lap egy pontnyival kevesebbet - a lanc kifullad, nem szall el.
      const worth = t.chained ? Math.max(1, t.heal - (t.chainDepth || 1)) : t.heal;
      const got = heal(feller, worth);
      if (got > 0) {
        sfx.pickup();
        if (t.chained) {
          // Lancszem: a szam ANNAL A LAPNAL jelenik meg, amelyik eldolt, a
          // vago szineben. Igy latszik, hogy a lanc minden tagja hoz eletet,
          // es az is, hogy kihez folyik be. A vagon egymas hegyen-hatan
          // tizennegy szam olvashatatlan lenne.
          addFloat('+' + Math.round(got), t.x, t.y - 10,
            Object.assign({ life: 0.85 }, floatColors(feller)));
        } else {
          addFloat('+' + Math.round(got), feller.x, feller.y - 24, floatColors(feller));
        }
      }
    }
    // A palya sajat mechanikaja: lokeshullam, cukorroham.
    const fx = onFell(t, feller && g.players[feller.index], g);
    if (fx && fx.text && feller) {
      addFloat(fx.text, feller.x, feller.y - 32, { color: '#ffd257', outline: '#2a1408', life: 0.9 });
    }
    if (fx && fx.miss) {
      // Melle csapott villam: halvany, rovid jelzes, semmi sebzes.
      g.spots.push({ kind: 'bolt', x: fx.miss.x, y: fx.miss.y, t: 0, life: 0.22, small: true, owner: -1 });
      sfx.select();
    }
    if (fx && fx.curse) {
      // Villamcsapas: a becsapodas helyet a mechanika jelzi, a rajzolast a
      // render vegzi egy rovid eletu folt alapjan.
      g.spots.push({ kind: 'bolt', x: fx.curse.p.x, y: fx.curse.p.y, t: 0, life: 0.32, owner: -1 });
      sfx.bolt();
      // Az atok a MASIKAT sujtja: a sebzes az o szineben jelenik meg folotte,
      // hogy egybol latszodjon, kit ert.
      const v = fx.curse.p;
      sfx.hurt();
      FX.blood(v.x, v.y - 10, v.team.tint);
      addFloat('-' + fx.curse.dmg, v.x, v.y - 24, floatColors(v));
      if (fx.curse.died) {
        g.shake = 9;
        addFloat('ELÁTKOZVA!', v.x, v.y - 32, Object.assign({ life: 1.4 }, floatColors(v)));
      }
    }
  },
  onIgnite(t) {
    FX.smoke(t.x, t.y - 6, 3);
  },
};

const menu = makeMenu();

// ---------------------------------------------------------------- meccs

/**
 * Temavaltas. A config helyben irja at a TEAM/TREE_KINDS/PAL tartalmat,
 * itt csak az abbol kepzett dolgokat kell ujra eloallitani.
 */
function setTheme(index, force) {
  const i = ((index % THEMES.length) + THEMES.length) % THEMES.length;
  const same = CURRENT.theme && CURRENT.index === i;
  if (!same || force) {
    applyTheme(THEMES[i], i);
    rebuildSprites();
    clampMenuColors(menu);
    for (let k = 0; k < 2; k++) {
      const p = g.players[k];
      if (p.color >= TEAM.length) p.color = k % TEAM.length;
      p.team = TEAM[p.color];
    }
  }
  // Ez a ketto akkor is fut, ha a tema nem valtozott: a menubol jovo
  // rejtelyes zene es moraj kulonben bennragadna a meccsben.
  setMusicTrack(THEMES[i].id);
  setHazardAmbience(THEMES[i].hazard);
  setChopMaterial(THEMES[i].id);        // fat vagni mas hang, mint kobe vesni
  setFanfare(THEMES[i].id);             // a gyozelmi fanfar is temankent mas
}

/**
 * Veletlen palya: a meccs elejen megkeverjuk mind az ot vilagot, es utana
 * KORONKENT lepunk egyet a sorban. Igy egy ot koros meccsen ot kulonbozo
 * palya jon, mindig mas sorrendben, es sosem ismetlodik egyik sem.
 */
function shuffledThemes() {
  const order = THEMES.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }
  return order;
}

/** Veletlen palyan a szereplot is sorsoljuk, koronkent ujra. */
function rollRandomChars() {
  const a = (Math.random() * TEAM.length) | 0;
  let b = (Math.random() * TEAM.length) | 0;
  if (b === a) b = (a + 1 + ((Math.random() * (TEAM.length - 1)) | 0)) % TEAM.length;
  g.sides[0].color = a;
  g.sides[1].color = b;
  for (let i = 0; i < 2; i++) {
    g.players[i].color = g.sides[i].color;
    g.players[i].team = TEAM[g.sides[i].color];
  }
}

function startMatch(sides) {
  g.endlessT = 0;
  // A villam-sorozat a MECCS elejen indul ujra, nem koronkent: igy van
  // eleg dobas ahhoz, hogy a kiegyensulyozas erezheto legyen.
  g.curseLast = null;
  g.curseStreak = 0;
  g.randomThemes = !!(menu.z && menu.random);
  g.themeOrder = g.randomThemes ? shuffledThemes() : null;
  if (g.randomThemes) setTheme(g.themeOrder[0]);
  // A temak szereplolistaja kulonbozo hosszu, a korabban valasztott szin
  // tehat tullloghat rajta. Itt fogjuk be, mielott barki TEAM[i]-t olvasna.
  g.sides = sides.map((s, i) => ({ color: s.color < TEAM.length ? s.color : i % TEAM.length, mode: s.mode }));
  if (g.sides[0].color === g.sides[1].color) {
    g.sides[1].color = (g.sides[0].color + 1) % TEAM.length;
  }
  g.score = [0, 0];
  g.round = 1;
  g.finaleDone = false;         // a zarokepi raketa-kiloves meccsenkent egyszer
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
  // Veletlen modban minden kor mas vilagban jatszodik. A temavaltasnak a kor
  // felepitese ELOTT kell megtortennie: a palya, a fak, a diszlet es a
  // sprite-ok mind a temabol jonnek.
  if (g.randomThemes && g.themeOrder) {
    setTheme(g.themeOrder[(g.round - 1) % g.themeOrder.length]);
    rollRandomChars();
  }
  g.seed = (g.seed * 1103515245 + 12345) & 0x7fffffff;
  g.arena = makeArena(g.seed);
  SPAWNS = spawnPoints(g.arena);
  // A menedek csak akkor jelenik meg, amikor a kovetkezo kor mar donto
  // lehet: valakinek 2 pontja van, tehat egy gyozelemre van a meccstol.
  const matchPoint = Math.max(g.score[0], g.score[1]) >= CFG.roundsToWin - 1;
  const stream = buildStream(g.seed);
  g.cabin = matchPoint ? pickCabin(g.seed, SPAWNS, stream.pts) : null;
  // A harangtorony a temeto allando eleme: minden korben ott all, veletlen
  // helyen, es nem lehet atmenni rajta.
  g.tower = hasMech('bell') ? pickCabin(g.seed ^ 0x51ed, SPAWNS, stream.pts) : null;
  if (g.tower && g.cabin && Math.hypot(g.cabin.x - g.tower.x, g.cabin.y - g.tower.y) < 40) {
    g.tower = pickCabin(g.seed ^ 0x9a17, SPAWNS, stream.pts);
  }
  g.trees = generateTrees(g.seed, g.arena, SPAWNS, g.cabin);
  g.decor = makeDecor(g.seed, g.arena, g.round, g.trees, stream);
  resetPlayer(g.players[0], SPAWNS[0].x, SPAWNS[0].y);
  resetPlayer(g.players[1], SPAWNS[1].x, SPAWNS[1].y);
  g.solids = solidRects(g.trees);
  if (g.cabin) g.solids.push(cabinRect(g.cabin));
  if (g.tower) g.solids.push(towerRect(g.tower));
  FX.clearParticles();
  clearFloats();
  resetMech(g);
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

/** A harangtorony utkozo-doboza: a talapzata. */
function towerRect(tw) {
  return { x: tw.x - 8, y: tw.y - 6, w: 16, h: 6 };
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
    // Korpont: rovid jelzes. A diadal-fanfar csak a meccs vegen szol.
    sfx.point();
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
  if (k >= 1) {
    g.outroRunner = null;             // bent van, becsukodik az ajto
    // A tuzijatek-palyan ez a pillanat a finale: amint a gyoztes fedél ala
    // ert, MINDEN talpon maradt raketa felszall. Amelyik mar a tuzben all,
    // az nem: az mar ugyis elveszett.
    if (!g.finaleDone) {
      g.finaleDone = true;
      const n = launchAll(g, (x, y) => inFire(g.arena, x, y));
      if (n) g.shake = Math.max(g.shake, 4);
    }
  }
}

function toMenu() {
  g.state = 'menu';
  g.stateT = 0;
  g.endlessT = 0;
  // A menuben veletlen palyanal a rejtelyes zene es moraj szol, nem az utolso kore.
  if (menu.z && menu.random) { setMusicTrack('meglepetes'); setHazardAmbience('mystery'); }
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

  if (g.state === 'menu') { setAllPaused(false); setFireLevel(0.1); setMusicPaused(false); return; }
  if (g.state === 'paused') { setAllPaused(true); setMusicPaused(true); return; }
  setAllPaused(false);

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
    // A zarokepen csak a felszallo raketak mozognak a mechanikabol. Itt
    // MINDEGYIK szet is robban a palya folott: ez a finale.
    for (const ev of updateFlying(g, dt)) {
      if (ev.type === 'liftoff') {
        sfx.rocket();
        FX.sparks(ev.t.x, ev.t.y - 2, 8);
        FX.smoke(ev.t.x, ev.t.y, 3);
      } else {
        const spr = S.trees[ev.t.variant];
        // A palya teteje folott robban, de meg a kepen belul: a magassagot
        // ezert levagjuk. Igy latszik a robbanas, nem az egen kivul tortenik.
        FX.burst(ev.t.x, Math.max(16, ev.y),
          [spr.hiCol, spr.midCol, spr.darkCol, '#ffd257'], 26);
        sfx.impact();
        g.shake = Math.max(g.shake, 2.5);
      }
    }
    if (g.decor) updateDecor(g.decor, dt, g);
    // A meccs vegen a hatterzaj TELJESEN elhallgat, es a fanfar marad egyedul.
    if (g.state === 'matchend') { setFireLevel(0); setMusicPaused(true); }
    else { setFireLevel(0.3); setMusicPaused(false); }
    // Vegtelen mod: a zarokep utan magatol indul a kovetkezo meccs.
    if (g.endless && g.state === 'matchend' && g.stateT >= CFG.outro.total) {
      g.endlessT -= dt;
      if (g.endlessT <= 0) {
        startMatch(g.sides);
        g.endless = true;             // a startMatch nullazza, de itt marad be
        return;
      }
    }
    if (g.state === 'roundend' && g.stateT >= CFG.roundEndTime) {
      if (g.matchOver) {
        g.state = 'matchend';
        g.stateT = 0;
        // Vegtelen modban minden meccs vegen ELOLROL indul a visszaszamlalas.
        if (g.endless) g.endlessT = CFG.endlessWait;
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
  if (g.tower) g.solids.push(towerRect(g.tower));

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
    // A robot a TALALAT utan hatralep egy pillanatra: enelkul egy helyben
    // vegigverte a masikat, amig az el nem fordult tole.
    if (m.att.isBot) {
      const sk = CFG.bot[m.att.difficulty] || CFG.bot.ugyes;
      m.att.botBackoff = sk.meleeBackoff;
      m.att.botChaseT = 0;
    }
    addFloat('-' + m.dmg, m.vic.x, m.vic.y - 24, floatColors(m.vic));
    if (m.died) {
      g.shake = 9;
      addFloat('KIVÁGVA!', m.vic.x, m.vic.y - 30,
        Object.assign({ life: 1.4 }, floatColors(m.vic)));
    }
  }

  const landed = updateTrees(g.trees, dt, g.arena, g.hooks);
  for (const t of landed) {
    // Dominonal a foldet ert lap MAGA donti a kovetkezot: ez a lancreakcio.
    if (hasMech('chain')) {
      const links = runChain(t, g, g.hooks);
      if (links.length) {
        sfx.crack();
        g.shake = Math.max(g.shake, 6);
      }
    }
    onTreeDown(t, g);
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
        addFloat('KIVÁGVA!', p.x, p.y - 26, Object.assign({ life: 1.4 }, floatColors(p)));
      }
    }
  }

  // A palya sajat mechanikaja: foltok, szellokes, cukorroham leptetese.
  for (const ev of updateMech(g, dt)) {
    if (ev.type === 'warn') {
      addFloat(ev.text, W / 2, 34, { color: '#f0d24a', outline: '#2a1408', life: 0.9, vy: -6 });
    } else if (ev.type === 'gust') {
      sfx.burn();
      g.shake = Math.max(g.shake, 5);
      FX.dust(g.players[0].x, g.players[0].y, 8);
      FX.dust(g.players[1].x, g.players[1].y, 8);
    } else if (ev.type === 'bell') {
      sfx.bell();
      addFloat('HARANGSZÓ!', W / 2, 34, { color: '#b48ae0', outline: '#2a1440', life: 1.2, vy: -5 });
    } else if (ev.type === 'ignite') {
      // Begyulladt a kanoc: innentol ketfele vegzodhet.
      sfx.select();
      FX.sparks(ev.t.x, ev.t.y - 8, 5);
    } else if (ev.type === 'launch') {
      // Felszallt a raketa. Jar erte pont, de csak a FELE, felfele kerekitve:
      // a gyorsabb, biztonsagosabb ut kevesebbet er, mint a kivagas.
      sfx.crack();
      FX.sparks(ev.t.x, ev.t.y - 4, 14);
      FX.smoke(ev.t.x, ev.t.y - 2, 6);
      g.shake = Math.max(g.shake, 3);
      const who = ev.by >= 0 ? g.players[ev.by] : null;
      if (who && who.alive) {
        // A kilott raketa csak par pontot er, es a merete donti el, mennyit.
        // Megeri gyujtogatni, de kivagni sokkal jobban megeri.
        const band = CFG.mech.fuse.heal[ev.t.variant % 3];
        const got = heal(who, Math.round(bellRange(band[0], band[1])));
        if (got > 0) {
          sfx.pickup();
          addFloat('+' + Math.round(got), ev.t.x, ev.t.y - 14,
            Object.assign({ life: 0.9 }, floatColors(who)));
        }
      }
    } else if (ev.type === 'blade') {
      // Forgo vitorla: nagyot pockol, keveset sebez.
      sfx.clash();
      sfx.hurt();
      g.shake = Math.max(g.shake, 5);
      FX.blood(ev.p.x, ev.p.y - 10, ev.p.team.tint);
      FX.dust(ev.p.x, ev.p.y, 6);
      ev.p.hurtFlash = 0.2;
      addFloat('-' + ev.dmg, ev.p.x, ev.p.y - 24, floatColors(ev.p));
      if (ev.died) {
        g.shake = 9;
        addFloat('SZÉTVERVE!', ev.p.x, ev.p.y - 32,
          Object.assign({ life: 1.4 }, floatColors(ev.p)));
      }
    } else if (ev.type === 'sunk') {
      g.solids = solidRects(g.trees);
      if (g.cabin) g.solids.push(cabinRect(g.cabin));
      if (g.tower) g.solids.push(towerRect(g.tower));
    } else if (ev.type === 'died') {
      sfx.hurt();
      FX.blood(ev.p.x, ev.p.y - 10, ev.p.team.tint);
      addFloat('ELTŰNT!', ev.p.x, ev.p.y - 26, Object.assign({ life: 1.4 }, floatColors(ev.p)));
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
        addFloat('ELÉGETT!', p.x, p.y - 26, Object.assign({ life: 1.4 }, floatColors(p)));
      }
    } else {
      p.burnT = 0;
      if (damage(p, CFG.idleDrain * dt, 'kimerules')) {
        sfx.lose();
        addFloat('KIDŐLT!', p.x, p.y - 26, Object.assign({ life: 1.4 }, floatColors(p)));
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
  // Vegtelen mod: a bal also sarokban vegig ott a jele, tehat barmikor
  // latszik, hogy a kovetkezo meccs magatol fog indulni.
  if (g.endless) {
    c2.globalAlpha = 0.8;
    c2.drawImage(S.infinity, 4, H - 11);
    c2.globalAlpha = 1;
  }
  if (!isMuted()) return;
  c2.globalAlpha = 0.55;
  c2.drawImage(S.speakerMuted, W - 14, H - 12);
  c2.globalAlpha = 1;
}

// ---------------------------------------------------------------- input

/** Felso szamsor es numerikus billentyuzet egyarant jo. */
function digitOf(code) {
  const m = /^(?:Digit|Numpad)(\d)$/.exec(code);
  return m ? Number(m[1]) : null;
}

const SIDE_KEYS = [
  { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' },
  { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' },
];

initInput(window);
onKey((code, shift) => {
  initAudio();
  if (code === 'KeyM') { toggleMute(); return; }

  // SHIFT+R BARMIKOR kapcsolja a vegtelen modot: menuben, jatek kozben es a
  // zarokepen is. Amig be van kapcsolva, a bal also sarokban ott a jele.
  if (code === 'KeyR' && shift) {
    g.endless = !g.endless;
    g.endlessT = g.endless ? CFG.endlessWait : 0;
    sfx.select();
    return;
  }
  const confirm = code === 'Space' || code === 'Enter';

  if (g.state === 'menu') {
    // A ket oldal sajat billentyui MINDIG elsobbseget elveznek. Van olyan
    // kiosztas (pl. francia AZERTY), ahol a mozgasgomb ugyanazt a betut irja,
    // mint a varazsmod gombja; ott is a mozgas a fontosabb.
    let handled = false;
    for (let i = 0; i < 2; i++) if (menuInput(menu, i, code, SIDE_KEYS[i])) handled = true;
    if (handled) { sfx.select(); return; }

    // Z: varazs-mod. Kikapcsolva mindig visszaall az eredeti erdo.
    if (code === 'KeyZ') {
      menu.z = !menu.z;
      CURRENT.z = menu.z;             // a fak formaja is ettol fugg
      if (!menu.z) { menu.random = false; setTheme(0, true); }
      else {
        setTheme(CURRENT.index, true);
        if (menu.random) { setMusicTrack('meglepetes'); setHazardAmbience('mystery'); }
      }
      setMusicTempo(menu.z ? Z_TEMPO : 1);   // varazsmodban porgosebb a zene
      sfx.select();
      return;
    }
    if (menu.z) {
      // I: a sugo-buborek. Egy felmondatban elmondja, mit csinal a csavar.
      if (code === 'KeyI') {
        // Az erdonek nincs csavara: ott a gomb szurke, es nem is reagal.
        if (!menu.random && !(CURRENT.theme.help && CURRENT.theme.help.length)) return;
        menu.info = !menu.info;
        sfx.select();
        return;
      }
      if (code === 'KeyR') {
        menu.random = !menu.random;
        // Veletlen palyanal a menuzene sem arulhatja el, hova megyunk.
        setMusicTrack(menu.random ? 'meglepetes' : THEMES[CURRENT.index].id);
        setHazardAmbience(menu.random ? 'mystery' : THEMES[CURRENT.index].hazard);
        sfx.select();
        return;
      }
      const d = digitOf(code);
      if (d !== null && d < THEMES.length) {
        menu.random = false;
        setTheme(d);
        sfx.select();
        return;
      }
    }
    if (confirm) startMatch(menu.sides);
    return;
  }

  // A gyoztes-kepernyon mar nincs mit szuneteltetni: SPACE/ENTER vissza a
  // fomenube, R pedig ujra ugyanazokkal a beallitasokkal.
  if (g.state === 'matchend') {
    // A vegtelen modot innen mar csak a kilepes allitja le: a SHIFT+R
    // kezelese feljebb, allapottol fuggetlenul tortenik.
    if (confirm || code === 'Escape') g.endless = false;
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
  g, S, menu, setTheme, THEMES,
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
