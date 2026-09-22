// HUD, menu, bannerek, lebego szovegek.

import {
  W, H, CFG, PAL, TEAM, CURRENT, clamp,
  NEZET, teljesSav, hasabTukor, hasabTobblet, korbe,
} from './config.js';
import { THEMES } from './themes.js';
import { drawText, textWidth } from './font.js';
import { hpFrac } from './player.js';

const floats = [];

export function addFloat(text, x, y, o) {
  o = o || {};
  floats.push({
    text, x, y,
    vy: o.vy === undefined ? -22 : o.vy,
    t: 0,
    life: o.life || 1.1,
    color: o.color || PAL.ui,
    outline: o.outline || '#170f0a',
    scale: o.scale || 1,
  });
}

export function clearFloats() {
  floats.length = 0;
}

export function updateFloats(dt) {
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i];
    f.t += dt;
    f.y += f.vy * dt;
    f.vy += 26 * dt;
    if (f.t >= f.life) floats.splice(i, 1);
  }
}

export function drawFloats(c) {
  for (const f of floats) {
    const k = f.t / f.life;
    if (k > 0.7 && Math.floor(f.t * 20) % 2 === 0) continue;
    drawText(c, f.text, f.x, f.y, {
      align: 'center', scale: f.scale, color: f.color, outline: f.outline, shadow: null,
    });
  }
}

// ---------------------------------------------------------------- HUD

export function drawHud(c, g, S) {
  c.fillStyle = 'rgba(8,5,3,0.42)';
  // A sav a TELJES kepernyot atfogja, a nevek es a szivek viszont a jatekter
  // szelen maradnak: igy a ket jatekos egyforma tavol van a kozeptol.
  teljesSav(c, 0, 23);
  c.fillStyle = 'rgba(255,180,90,0.10)';
  teljesSav(c, 23, 1);

  // A nevet a sideName() allitja ossze: szinnevesnel kell moge a tipus,
  // rendes nevnel (SZFINX, SÁMÁN) nem.
  for (let i = 0; i < 2; i++) {
    const p = g.players[i];
    const t = TEAM[p.color];
    const left = i === 0;
    const label = sideName(g, i);
    drawText(c, label, left ? 5 : W - 5, 3, {
      align: left ? 'left' : 'right', color: t.tint, shadow: '#170f0a',
    });

    drawHearts(c, S, left ? 5 : W - 5, 14, hpFrac(p), !left, g.clock || 0);

    // megnyert korok: kupak
    const tw = textWidth(label, 1);
    for (let r = 0; r < CFG.roundsToWin; r++) {
      const x = left ? 5 + tw + 5 + r * 7 : W - 11 - tw - 5 - r * 7;
      c.drawImage(g.score[i] > r ? S.trophyWon : S.trophyEmpty, x, 4);
    }
  }

  drawText(c, g.round + '. KÖR', W / 2, 3, { align: 'center', color: PAL.uiDim });

  const bw = 74;
  const bx = Math.round(W / 2 - bw / 2);
  c.fillStyle = 'rgba(10,7,5,0.7)';
  c.fillRect(bx - 1, 14, bw + 2, 5);
  c.fillStyle = '#2a1a12';
  c.fillRect(bx, 15, bw, 3);
  const left = Math.max(0, 1 - g.arena.closed);
  const fw = Math.round(bw * left);
  c.fillStyle = left < 0.25 ? '#ff5a22' : left < 0.6 ? '#ff9a2b' : '#e0c88a';
  c.fillRect(bx, 15, fw, 3);
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.fillRect(bx, 15, fw, 1);
}

/** Ot sziv, mindegyik 20%. Reszlegesen is tolthetok. */
function drawHearts(c, S, edgeX, y, frac, rightToLeft, clock) {
  const n = CFG.hearts;
  const total = frac * n;
  const low = frac <= 0.2 && frac > 0;
  const pulse = low && Math.floor(clock * 5) % 2 === 0;
  for (let i = 0; i < n; i++) {
    const f = clamp(total - i, 0, 1);
    const hx = rightToLeft ? edgeX - (i + 1) * 8 + 1 : edgeX + i * 8;
    c.drawImage(S.heartEmpty, hx, y);
    if (f <= 0) continue;
    if (pulse && i === 0) continue;
    const w = Math.max(1, Math.round(7 * f));
    const sx = rightToLeft ? 7 - w : 0;
    c.drawImage(S.heartFull, sx, 0, w, 6, hx + sx, y, w, 6);
  }
}

/**
 * Az oldal neve. Ket eset van:
 *
 *   SZINNEV (erdo: PIROS, KÉK, ...) - onmagaban nem mond semmit, tehat kell
 *     moge, hogy ki iranyitja: "ZÖLD JÁTÉKOS", "ZÖLD BOT".
 *   RENDES NEV (SZFINX, SÁMÁN, ESZKIMÓ, ...) - ez mar azonosit, tehat embernel
 *     eleg maga a nev: "SZFINX". Botnal kiirjuk: "SZFINX BOT".
 *
 * Ha a ket oldal kulonbozo tipusu (ember a bot ellen), akkor a szinnevesnel
 * eleg a tipus, mert az kulonbozteti meg oket.
 */
export function sideName(g, i) {
  const p = g.players[i];
  const name = TEAM[p.color].name;
  const colorNamed = !!CURRENT.theme.colorNames;
  if (!colorNamed) return p.isBot ? name + ' BOT' : name;
  const sameKind = g.players[0].isBot === g.players[1].isBot;
  const kind = p.isBot ? 'BOT' : 'JÁTÉKOS';
  return sameKind ? name + ' ' + kind : kind;
}

/** A legnagyobb meretezes, amivel a szoveg meg kifer a kepernyore. */
function fitScale(text, wanted) {
  let sc = wanted;
  while (sc > 1 && textWidth(text, sc) > W - 14) sc--;
  return sc;
}

// ---------------------------------------------------------------- bannerek

function shade(c, a) {
  c.fillStyle = 'rgba(8,5,3,' + a + ')';
  teljesSav(c);
}

export function drawCountdown(c, g) {
  const left = CFG.countdown - g.stateT;
  let txt;
  let scale = 5;
  if (left > 2) txt = '3';
  else if (left > 1) txt = '2';
  else if (left > 0) txt = '1';
  else { txt = 'HAJRÁ!'; scale = 4; }
  const pulse = 1 - (left - Math.floor(left));
  const s = Math.max(1, Math.round(scale * (0.85 + 0.15 * (1 - pulse))));
  shade(c, 0.28);
  drawText(c, txt, W / 2, H / 2 - 20, {
    align: 'center', scale: s, color: '#ffe9a8', outline: '#3a1607', shadow: null,
  });
}

export function drawPause(c, g) {
  shade(c, 0.62);
  // Csak a ket vonal, ahogy egy lejatszon. Lukteto, hogy latszodjon:
  // a jatek el, csak all.
  const pulse = 0.85 + 0.15 * Math.sin((g.clock || 0) * 3.4);
  const bw = Math.round(12 * pulse);
  const bh = Math.round(38 * pulse);
  const gap = 10;
  const y = Math.round(58 + (38 - bh) / 2);
  c.fillStyle = '#2a1607';
  c.fillRect(W / 2 - gap / 2 - bw - 1, y - 1, bw + 2, bh + 2);
  c.fillRect(W / 2 + gap / 2 - 1, y - 1, bw + 2, bh + 2);
  c.fillStyle = '#ffe9a8';
  c.fillRect(W / 2 - gap / 2 - bw, y, bw, bh);
  c.fillRect(W / 2 + gap / 2, y, bw, bh);
  c.fillStyle = '#fff6d8';
  c.fillRect(W / 2 - gap / 2 - bw, y, bw, 3);
  c.fillRect(W / 2 + gap / 2, y, bw, 3);

  drawText(c, 'SPACE = FOLYTATÁS', W / 2, 112, { align: 'center', color: PAL.ui });
  drawText(c, 'ESC = KILÉPÉS', W / 2, 126, { align: 'center', color: PAL.uiDim });
}

/** Rovid korveg-bejelentes. Visszaszamlalas nincs: az a kor elejen van. */
export function drawRoundEnd(c, g) {
  const t = g.stateT;
  shade(c, Math.min(0.5, t * 2.2));

  const w = g.lastWinner;
  let title = 'DÖNTETLEN';
  let col = PAL.ui;
  if (w >= 0) {
    title = sideName(g, w);
    col = TEAM[g.players[w].color].tint;
  }

  const k = clamp(t / 0.26, 0, 1);
  const over = 1 + Math.sin(clamp((t - 0.26) / 0.28, 0, 1) * Math.PI) * 0.22;
  const scale = fitScale(title, Math.max(1, Math.round((1 + k * 1.0) * over)));

  if (t < 0.45) {
    const r = t * 320;
    c.strokeStyle = 'rgba(255,220,140,' + (0.5 * (1 - t / 0.45)).toFixed(3) + ')';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(W / 2, 62, r, 0, Math.PI * 2);
    c.stroke();
  }

  drawText(c, title, W / 2, 48, {
    align: 'center', scale, color: col, outline: '#170f0a', shadow: null,
  });
  if (t > 0.3) {
    drawText(c, w >= 0 ? 'NYERTE A KÖRT' : 'A KÖR', W / 2, 48 + scale * 9 + 5, {
      align: 'center', color: PAL.ui,
    });
  }
  if (t > 0.5) drawScore(c, g, 106);
}

/**
 * Nagy, jol lathato allas. Harom karaktert rajzolunk ("2-3"), tehat a
 * szelesseget is haromra kell szamolni, kulonben balra csuszik a szam.
 */
function drawScore(c, g, y, scale) {
  const SC = scale || 4;
  const cols = [TEAM[g.players[0].color].tint, PAL.uiDim, TEAM[g.players[1].color].tint];
  const chars = [String(g.score[0]), '-', String(g.score[1])];
  const step = 6 * SC;
  const wpx = textWidth('000', SC);
  const x0 = Math.round(W / 2 - wpx / 2);
  for (let i = 0; i < 3; i++) {
    drawText(c, chars[i], x0 + i * step, y, {
      scale: SC, color: cols[i], outline: '#170f0a', shadow: null,
    });
  }
}

/** Nagy gyozelmi animacio a meccs vegen. */
export function drawMatchEnd(c, g, S, time) {
  // Eloszor a zarokep megy (a render rajzolja), csak utana jon a banner.
  const t = g.stateT - CFG.outro.total;
  if (t < 0) return;
  shade(c, Math.min(0.72, t * 1.2));

  const tie = g.score[0] === g.score[1];
  const wi = g.score[0] > g.score[1] ? 0 : 1;
  const col = tie ? '#e0a444' : TEAM[g.players[wi].color].tint;
  const name = tie ? (CURRENT.theme.tie || 'AZ ERDŐ') : sideName(g, wi);

  // forgo sugarak a gyoztes szineben
  const rays = 16;
  c.save();
  c.translate(W / 2, 62);
  c.rotate(time * 0.35);
  c.fillStyle = col;
  c.globalAlpha = 0.12 + Math.sin(time * 3) * 0.03;
  for (let i = 0; i < rays; i++) {
    c.rotate((Math.PI * 2) / rays);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(240, -13);
    c.lineTo(240, 13);
    c.closePath();
    c.fill();
  }
  c.globalAlpha = 1;
  c.restore();

  // terjedo lokeshullam az elso pillanatokban
  if (t < 0.9) {
    for (let i = 0; i < 2; i++) {
      const tt = clamp((t - i * 0.16) / 0.7, 0, 1);
      if (tt <= 0) continue;
      c.strokeStyle = 'rgba(255,214,140,' + (0.55 * (1 - tt)).toFixed(3) + ')';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(W / 2, 62, tt * 210, 0, Math.PI * 2);
      c.stroke();
    }
  }

  const k = clamp(t / CFG.matchEndFx, 0, 1);
  const bounce = 1 + Math.sin(clamp(t / 0.55, 0, 1) * Math.PI) * 0.3;
  const s1 = fitScale(name, Math.max(1, Math.round((1 + k * 2) * bounce)));
  const pulse = 1 + Math.sin(time * 4) * 0.04;

  // A banner egesz sava feljebb kerult, hogy a kepernyo aljan elferjen a
  // harom gomb-sugo egyenletes kozokkel, es semmi ne csusszon egymas ala.
  drawText(c, name, W / 2, 36, {
    align: 'center', scale: s1, color: col, outline: '#170f0a', shadow: null,
  });
  if (t > 0.5) {
    const s2 = Math.max(1, Math.round(3 * pulse));
    drawText(c, tie ? 'NYERT!' : 'GYŐZÖTT!', W / 2, 36 + s1 * 9 + 6, {
      align: 'center', scale: s2, color: '#ffd257', outline: '#3a1607', shadow: null,
    });
  }
  if (t > 1.0) drawScore(c, g, 96, 3);
  // A also sav harom sora fix helyen all, egyenletes kozokkel: 134 / 148 / 162.
  // Az utolso sor alja igy 169, tehat marad meg 11 pixel a kep aljaig.
  if (g.endless) {
    // Vegtelen mod: nem gombra varunk, hanem visszaszamlalunk a kovetkezo
    // meccsig. A szam nagy, hogy messzirol is lassek, mikor indul.
    const left = Math.max(0, Math.ceil(g.endlessT));
    drawText(c, 'VÉGTELEN', W / 2, 128, { align: 'center', color: '#ffd257' });
    drawText(c, String(left), W / 2, 140, {
      align: 'center', scale: 2, color: '#fff2c0', outline: '#3a1607', shadow: null,
    });
    drawText(c, 'SHIFT+R = STOP', W / 2, 158, { align: 'center', color: 'rgba(150,134,110,0.9)' });
    drawText(c, 'SPACE = MENÜ', W / 2, 168, { align: 'center', color: 'rgba(120,104,80,0.8)' });
    return;
  }
  if (t > 1.4) {
    // Szoros sorrend: elobb az ujra, aztan a vegtelen, vegul a kilepes.
    if (Math.floor(time * 2) % 2 === 0) {
      drawText(c, 'R = ÚJRA', W / 2, 136, { align: 'center', color: '#ffd257' });
    }
    drawText(c, 'SHIFT+R = VÉGTELEN', W / 2, 146, { align: 'center', color: 'rgba(150,134,110,0.9)' });
    drawText(c, 'SPACE = MENÜ', W / 2, 156, { align: 'center', color: 'rgba(120,104,80,0.8)' });
  }
}

// ---------------------------------------------------------------- menu

/** Also sor: ki iranyitja az adott oldalt. */
export const MENU_MODES = [
  { bot: false, diff: 'ugyes', label: 'JÁTÉKOS' },
  { bot: true, diff: 'bena', label: 'BÉNA BOT' },
  { bot: true, diff: 'ugyes', label: 'ÜGYES BOT' },
];

export function makeMenu() {
  // z: varazs-mod, random: veletlen palya minden meccs elott
  // Alapbeallitas: BAL oldalon a KEK ugyes bot, JOBB oldalon a PIROS bena
  // bot. Igy a kezdokepernyon rogton egy ket-bot parbaj all keszen: aki
  // odaul, latja a jatekot mukodni, es egy gombbal atveheti barmelyik oldalt.
  // info: a sugo-buborek az I gombbal kapcsolhato. Alapbol KI van kapcsolva,
  // hogy a menu tiszta maradjon; akinek kell, egy gombnyomas.
  return { sides: [{ color: 1, mode: 2 }, { color: 0, mode: 1 }], z: false, random: false, info: false };
}

/** A temavaltas utan a valasztott szinek tullloghatnak a szereplolistan. */
export function clampMenuColors(m) {
  for (let i = 0; i < 2; i++) {
    if (m.sides[i].color >= TEAM.length) m.sides[i].color = i % TEAM.length;
  }
  if (m.sides[0].color === m.sides[1].color) {
    m.sides[1].color = (m.sides[0].color + 1) % TEAM.length;
  }
}

/** A masik oldal szinet nem lehet valasztani, tehat atlepjuk. */
export function cycleColor(m, i, delta) {
  const other = m.sides[1 - i].color;
  let c = m.sides[i].color;
  for (let k = 0; k < TEAM.length; k++) {
    c = (c + delta + TEAM.length) % TEAM.length;
    if (c !== other) break;
  }
  m.sides[i].color = c;
}

/**
 * Egy sor, ket tengely. Balra-jobbra: ki iranyitja az oldalt. Fel-le: a szin,
 * ami egybol a kiiras szinet is valtoztatja, tehat latszik, mit valasztottal.
 */
export function menuInput(m, i, code, keys) {
  // Veletlen palyanal meg nem tudjuk, milyen szereplok lesznek, tehat
  // szint sem lehet valasztani: a fel-le ilyenkor egyszeruen nem csinal semmit.
  const pickable = !(m.z && m.random);
  if (code === keys.up) { if (pickable) cycleColor(m, i, -1); return pickable; }
  if (code === keys.down) { if (pickable) cycleColor(m, i, 1); return pickable; }
  const d = code === keys.left ? -1 : code === keys.right ? 1 : 0;
  if (!d) return false;
  m.sides[i].mode = (m.sides[i].mode + d + MENU_MODES.length) % MENU_MODES.length;
  return true;
}

/**
 * Veletlen palya eseten a menu HATTERE sem arulhatja el, hova megyunk.
 * Ilyenkor a konkret vilag helyett egy rejtelyes, lila kod fogad: sodrodo
 * parafoszlanyok, tavoli, felismerhetetlen sziluettek es egy nagy kerdojel.
 */
function drawMysteryBackdrop(c, time) {
  for (let y = 0; y < H; y++) {              // melylila atmenet
    const k = y / (H - 1);
    const r = Math.round(14 + k * 26);
    const g2 = Math.round(8 + k * 10);
    const b = Math.round(26 + k * 44);
    c.fillStyle = 'rgb(' + r + ',' + g2 + ',' + b + ')';
    teljesSav(c, y, 1);
  }

  // Kavargo kodsavok. Lassan usznak, tehat sosem all meg a kep.
  for (let i = 0; i < 5; i++) {
    const yy = 30 + i * 28;
    c.fillStyle = 'rgba(150,110,220,' + (0.05 + (i % 2) * 0.03).toFixed(3) + ')';
    for (let x = -NEZET.ox; x < W + NEZET.ox; x += 2) {
      const off = Math.sin(x * 0.02 + time * (0.4 + i * 0.12) + i) * 9
        + Math.sin(x * 0.006 - time * 0.3) * 6;
      c.fillRect(x, Math.round(yy + off), 2, 14);
    }
  }

  // Nagy, halvany kerdojel a cim mogott.
  const Q = [
    '.####.', '#....#', '#....#', '.....#', '....#.', '...#..',
    '...#..', '......', '...#..', '...#..',
  ];
  const qs = 7;
  const qx = Math.round(W / 2 - (6 * qs) / 2);
  const qy = 44;
  const pulse = 0.05 + 0.03 * Math.sin(time * 1.1);
  c.fillStyle = 'rgba(190,150,255,' + pulse.toFixed(3) + ')';
  for (let y = 0; y < Q.length; y++) {
    for (let x = 0; x < 6; x++) {
      if (Q[y][x] === '#') c.fillRect(qx + x * qs, qy + y * qs, qs, qs);
    }
  }

  // Felismerhetetlen sziluettek a lathataron: mindegyik MAS vilagbol valo,
  // de olyan sotet, hogy egyik sem arulja el, melyik.
  const shapes = [
    [1, 3, 5, 7, 9, 11, 13, 11, 9],          // hegyes (fenyo/kristaly)
    [7, 8, 8, 9, 9, 9, 9, 9, 9],             // tomb (sirko/obeliszk)
    [3, 5, 7, 9, 11, 13, 15, 17, 19],        // lepcsos (piramis/totem)
    [9, 10, 11, 11, 10, 9, 7, 5, 3],         // gombos (nyaloka)
    [2, 4, 6, 8, 10, 12, 12, 12, 12],        // toronyszeru
  ];
  const koz = W / 8.2;
  const tobb = hasabTobblet(koz);
  for (let i = -tobb; i < 9 + tobb; i++) {
    const sh = shapes[korbe(i, shapes.length)];
    const bx = Math.round(-6 + i * koz + korbe(i * 29, 11));
    const baseY = H - 2 + korbe(i * 13, 4);
    const scale = 1.6 + korbe(i * 7, 5) * 0.22;
    c.fillStyle = korbe(i, 2) ? 'rgba(8,5,16,0.92)' : 'rgba(14,9,26,0.86)';
    for (let r = 0; r < sh.length; r++) {
      const hw = Math.round(sh[r] * 0.5 * scale * 0.5);
      const yy = Math.round(baseY - (sh.length - r) * 3.4);
      c.fillRect(bx - hw, yy, hw * 2 + 1, 4);
    }
  }

  // Also lila derengés a sziluettek mogul.
  for (let i = 0; i < 26; i++) {
    const k = i / 25;
    c.fillStyle = 'rgba(140,90,220,' + (0.30 * Math.pow(k, 1.9)).toFixed(3) + ')';
    teljesSav(c, H - 1 - i, 1);
  }
}

export function drawMenu(c, m, S, time) {
  const mystery = !!(m.z && m.random);
  if (mystery) {
    drawMysteryBackdrop(c, time);
  } else {
    c.drawImage(S.ground, 0, 0);
    hasabTukor(c, S.ground);
    c.fillStyle = 'rgba(10,8,6,0.68)';
    teljesSav(c);

    for (let i = 0; i < 40; i++) {
      const k = i / 39;
      c.fillStyle = 'rgba(' + (PAL.glow || '255,116,32') + ',' + (0.44 * Math.pow(k, 1.8)).toFixed(3) + ')';
      teljesSav(c, H - 1 - i, 1);
    }
    // A sziluett-sor ugyanazzal a kozzel fut tovabb a hasabokba: se surubb,
    // se ritkabb nem lesz a szelen, csak hosszabb a sor.
    for (let layer = 0; layer < 2; layer++) {
      const n = layer === 0 ? 11 : 13;
      const koz = W / (n - 1.2);
      const tobb = hasabTobblet(koz);
      for (let i = -tobb; i < n + tobb; i++) {
        const spr = S.trees[korbe(i * 3 + layer, S.trees.length)];
        const x = Math.round(-8 + i * koz + korbe(i * 37 + layer * 19, 9));
        const y = H - (layer === 0 ? 6 : 0) - Math.round(spr.h * 0.62) + korbe(i * 13 + layer * 7, 5);
        c.globalAlpha = layer === 0 ? 0.55 : 1;
        c.drawImage(spr.sil, x, y);
        c.globalAlpha = 1;
      }
    }
    const f = S.flames;
    for (let x = -2 - NEZET.ox; x < W + NEZET.ox + 4; x += 4) {
      const fr = (Math.floor(time * 15 + x * 0.7) % f.frames.length + f.frames.length) % f.frames.length;
      c.drawImage(f.frames[fr], x, H - f.h + 3);
    }
  }

  if (m.z) drawSparkles(c, time);

  // Veletlen palyanal meg nekunk sincs cimunk: a meccs elso koreig nem tudni,
  // melyik vilagban jatszunk. Ezt a cim maga mondja meg.
  const title = m.z
    ? (m.random ? 'DŐL A MEGLEPETÉS' : (CURRENT.theme.title || 'DŐL A FA'))
    : 'DŐL A FA';
  const bob = Math.round(Math.sin(time * 1.6) * 1);
  // A cim a TEMA sajat szinet viseli, allandoan. A korabbi szivarvany-atmenet
  // minden vilagban ugyanaz volt, tehat epp azt mosta el, ami megkulonbozteti
  // oket. Veletlen palyanal marad a valtozo szin: ott tenyleg nem tudjuk, mi jon.
  const hue = (time * 46) % 360;
  const rnd = m.z && m.random;
  const main = rnd ? 'hsl(' + hue.toFixed(0) + ',85%,68%)'
    : (m.z ? (CURRENT.theme.titleCol || '#e0a444') : '#e0a444');
  const back = rnd ? 'hsl(' + ((hue + 200) % 360).toFixed(0) + ',70%,26%)'
    : (m.z ? (CURRENT.theme.titleShadow || '#5a3b22') : '#5a3b22');
  // Minden cim rovid (DŐL A FA / SÍR / KŐ / JÉG / FÉNY), tehat mind elfer a
  // nagy meretben. A kisebb fokozat csak biztositek, ha valaki hosszabbat ad.
  const tscale = title.length > 11 ? 3 : 4;
  const ty = title.length > 11 ? 12 : 10;
  drawText(c, title, W / 2 + 1, ty + 1 + bob, { align: 'center', scale: tscale, color: back, shadow: null });
  drawText(c, title, W / 2, ty + bob, {
    align: 'center', scale: tscale, color: main, outline: '#2a1408', shadow: null,
  });

  // Kicsit tavolabb egymastol: igy kulon egysegnek latszik a ket oldal.
  panel(c, S, 66, 50, m, 0, S.wasdKeys, time);
  panel(c, S, W - 66, 50, m, 1, S.arrowKeys, time);

  const OL = { outline: '#140c07', shadow: null };
  if (m.z) {
    drawThemeStrip(c, m, time);
  } else {
    drawText(c, 'VÁGJ FÁT, NE DŐLJÖN RÁD, KERÜLD A TÜZET', W / 2, 128,
      Object.assign({ align: 'center', color: '#b0a084' }, OL));
  }

  if (Math.floor(time * 2) % 2 === 0) {
    drawText(c, 'SPACE', W / 2, m.z ? 157 : 143,
      Object.assign({ align: 'center', scale: 2, color: '#ffe08a' }, OL));
  }

  // Varazspalca: a hangszoro parja a masik also sarokban, ugyanazzal a
  // logikaval (ikon + a hozza tartozo betu).
  c.drawImage(m.z ? S.wandOn : S.wandOff, 8, H - 13);
  drawText(c, 'Z', 21, H - 14, Object.assign({ color: m.z ? '#ffe08a' : '#8a7a62' }, OL));

  // A menuben mindig a rendes ikon van kint az M betuvel, tehat itt nem kell
  // a halvany jelzes: az csak jatek kozben.
  const muted = S.muted;
  c.drawImage(muted ? S.speakerMuted : S.speaker, W - 26, H - 13);
  drawText(c, 'M', W - 13, H - 14, Object.assign({ color: muted ? '#8a7a62' : '#c8b89a' }, OL));
}

/** Lassan sodrodo szikrak es egy hullamzo fenyfatyol a Z modos indokephez. */
function drawSparkles(c, time) {
  // aurora: harom lassan uszo, szinet valto sav a cim mogott
  for (let b = 0; b < 3; b++) {
    const hue = (time * 26 + b * 110) % 360;
    c.fillStyle = 'hsla(' + hue.toFixed(0) + ',80%,60%,0.10)';
    for (let x = -NEZET.ox; x < W + NEZET.ox; x += 2) {
      const y = 26 + b * 9
        + Math.sin(x * 0.035 + time * (0.9 + b * 0.25) + b) * 7
        + Math.sin(x * 0.011 - time * 0.6) * 4;
      c.fillRect(x, Math.round(y), 2, 3);
    }
  }

  for (let i = 0; i < 46; i++) {
    const sx = (i * 71 % 317) / 317;
    const sy = (i * 53 % 211) / 211;
    const sp = 0.25 + (i % 5) * 0.09;
    const x = Math.round(((sx + time * sp * 0.05) % 1) * NEZET.w) - NEZET.ox;
    const y = Math.round(((sy - time * sp * 0.03) % 1 + 1) % 1 * (H - 30)) + 4;
    const tw = Math.sin(time * (2 + (i % 7) * 0.4) + i);
    if (tw < 0.1) continue;
    const a = (tw * 0.75).toFixed(2);
    const hue = (i * 37 + time * 40) % 360;
    c.fillStyle = 'hsla(' + hue.toFixed(0) + ',90%,78%,' + a + ')';
    c.fillRect(x, y, 1, 1);
    if (tw > 0.85) {                       // a legfenyesebbek kis kereszttel
      c.fillStyle = 'hsla(' + hue.toFixed(0) + ',90%,80%,' + (tw * 0.4).toFixed(2) + ')';
      c.fillRect(x - 1, y, 1, 1);
      c.fillRect(x + 1, y, 1, 1);
      c.fillRect(x, y - 1, 1, 1);
      c.fillRect(x, y + 1, 1, 1);
    }
  }
}

// Ot pixeles temaikonok. X = fo szin, t = torzs, d = sotet reszlet.
// Szandekosan ennyire kicsik: a szam FOLE kerulnek, nem helyette.
const THEME_ICONS = [
  ['..X..', '.XXX.', 'XXXXX', '..t..', '..t..'],   // fenyo
  ['.XXX.', 'X.d.X', 'XdddX', 'X.d.X', 'XXXXX'],   // sirko keresztel
  ['.....', '..X..', '.XXX.', 'XXXXX', 'ddddd'],   // piramis
  ['X.X.X', '.XXX.', 'XXXXX', '.XXX.', 'X.X.X'],   // hokristaly
  ['..X..', '.XXX.', '.XXX.', '.XXX.', '..X..'],   // kristalytomb
  ['XXXXX', 'XdXdX', 'XXXXX', 'XdXdX', 'XXXXX'],   // totem, faragott arcokkal
  ['.XXX.', 'XXXXX', 'XXXXX', '..t..', '..t..'],   // nyaloka
  ['XXXXX', 'XdXdX', 'XXXXX', 'XdXdX', 'XXXXX'],   // dominolap
  ['..X..', '.XXX.', '.XdX.', '.XXX.', '.t.t.'],   // raketa allvanyon
  ['X...X', '.XXX.', '..t..', '.ttt.', 'ttttt'],   // szelmalom vitorlaval
];

const RANDOM_ICON = ['XXXXX', 'XdXdX', 'XXXXX', 'XdXdX', 'XXXXX'];  // dobokocka
// A veletlen palya sugoja: neki nincs sajat csavara, de van sajat szabalya.
/**
 * A palyavalaszto racs NUMPAD-elrendezesben. A szamok ugyanott vannak, ahol
 * a numerikus billentyuzeten, tehat a kez magatol tudja, hova nyuljon:
 *
 *     7 8 9
 *     4 5 6
 *     1 2 3
 *     R 0 I
 *
 * Az also sorban a nulla a helyen marad, mellette balra a veletlen palya,
 * jobbra a sugo.
 */
const GRID_RANDOM = -1;
const GRID_INFO = -2;
const THEME_GRID = [
  7, 8, 9,
  4, 5, 6,
  1, 2, 3,
  GRID_RANDOM, 0, GRID_INFO,
];

const RANDOM_HELP = ['VÉLETLEN PÁLYA VÉLETLEN KARAKTEREKKEL'];

/**
 * Van-e mit elmondani? Az erdonek nincs csavara, tehat ott az infogomb
 * szurke es nem is reagal: a hianya maga az uzenet.
 */
function infoAvailable(m) {
  if (m.random) return true;
  return !!(CURRENT.theme && CURRENT.theme.help && CURRENT.theme.help.length);
}

/** Teli pixel-korong. */
function pixDisc(c, cx, cy, r, col) {
  c.fillStyle = col;
  for (let y = -r; y <= r; y++) {
    const w = Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
    if (w > 0) c.fillRect(cx - w, cy + y, w * 2 + 1, 1);
  }
}

/** Pixel-korvonal. */
function pixRing(c, cx, cy, r, col) {
  c.fillStyle = col;
  for (let a = 0; a < 48; a++) {
    const th = (a / 48) * Math.PI * 2;
    c.fillRect(Math.round(cx + Math.cos(th) * r), Math.round(cy + Math.sin(th) * r), 1, 1);
  }
}

function iconColors(i) {
  if (i < 0) return { X: '#ffd257', t: '#b8901e', d: '#2a1c08' };
  const cols = THEMES[i].trees[1].cols;
  return { X: cols.light, t: cols.trunk, d: cols.trunkDark };
}

function drawIcon(c, rows, pal, x, y, alpha) {
  c.globalAlpha = alpha;
  for (let ry = 0; ry < rows.length; ry++) {
    for (let rx = 0; rx < rows[ry].length; rx++) {
      const ch = rows[ry][rx];
      if (ch === '.') continue;
      c.fillStyle = pal[ch];
      c.fillRect(x + rx, y + ry, 1, 1);
    }
  }
  c.globalAlpha = 1;
}

/**
 * Palyavalaszto sav: minden temanak egy doboz, benne az ikonja es a szamgombja,
 * a vegen az R a veletlen palyara. A doboz hattere mindig sotet, a kijelolest
 * a vilagito keret es a fenyes felirat mutatja: igy a szam mindig olvashato.
 */
function drawThemeStrip(c, m, time) {
  const OL = { outline: '#140c07', shadow: null };
  const BW = 11;
  const BH = 15;
  const GAP = 3;
  const PER_ROW = 3;
  const rows = Math.ceil(THEME_GRID.length / PER_ROW);
  const y0 = 54;
  const x0 = Math.round((W - (PER_ROW * BW + (PER_ROW - 1) * GAP)) / 2);
  const pulse = 0.6 + 0.4 * Math.abs(Math.sin(time * 3));

  for (let slot = 0; slot < THEME_GRID.length; slot++) {
    const i = THEME_GRID[slot];
    const bx = x0 + (slot % PER_ROW) * (BW + GAP);
    const by = y0 + ((slot / PER_ROW) | 0) * (BH + 1);
    const rnd = i === GRID_RANDOM;
    const inf = i === GRID_INFO;
    const on = inf ? !!m.info : (rnd ? m.random : (!m.random && CURRENT.index === i));

    if (inf) {
      // A sugo NEM palya, tehat nem is doboz: kis KOR, benne kerdojellel.
      // A negyzetes rekesz azt sugallta, hogy ez is egy valaszthato vilag.
      const cx = bx + (BW >> 1);
      const cy = by + (BH >> 1);
      const able = infoAvailable(m);
      const col = !able ? '#5a5548' : (on ? '#d8f0ff' : '#8e9aa4');
      pixDisc(c, cx, cy, 5, 'rgba(14,10,7,0.78)');
      pixRing(c, cx, cy, 5, !able ? '#3a382f'
        : (on ? 'rgba(138,208,240,' + pulse.toFixed(2) + ')' : '#4a5660'));
      drawText(c, 'I', cx - 2, cy - 3, Object.assign({ color: col }, OL));
      continue;
    }

    c.fillStyle = 'rgba(14,10,7,0.78)';
    c.fillRect(bx, by, BW, BH);
    c.fillStyle = on ? 'rgba(255,210,87,' + pulse.toFixed(2) + ')' : '#4e463a';
    c.fillRect(bx, by, BW, 1);
    c.fillRect(bx, by + BH - 1, BW, 1);
    c.fillRect(bx, by, 1, BH);
    c.fillRect(bx + BW - 1, by, 1, BH);

    drawIcon(c, rnd ? RANDOM_ICON : THEME_ICONS[i], iconColors(rnd ? -1 : i),
      bx + 3, by + 1, on ? 1 : 0.5);
    drawText(c, rnd ? 'R' : String(i), bx + 3, by + 7,
      Object.assign({ color: on ? '#fff2c0' : '#9a8e7c' }, OL));
  }

  const ny = y0 + rows * (BH + 1) + 4;
  const name = m.random ? 'VÉLETLEN PÁLYA' : CURRENT.theme.name;
  drawText(c, name, W / 2, ny, Object.assign({ align: 'center', color: '#ffd257' }, OL));

  if (m.info && infoAvailable(m)) {
    // Bekapcsolt sugo: a csavar-sor helyett egy rovid buborek, ami egy
    // felmondatban elmondja, mi tortenik ebben a vilagban. Az I gomb
    // kapcsolja: aki mar tudja a szabalyokat, ki is kapcsolhatja.
    const lines = m.random ? RANDOM_HELP : (CURRENT.theme.help || []);
    drawHelpBubble(c, lines, ny + 11);
    return;
  }

  // A palya neve ALATT ott a csavar: az egy szo, ami elarulja, mi az extra
  // szabaly ebben a vilagban. Az erdon nincs csavar, es oda nem is irunk
  // semmit: a hianya maga az uzenet. Veletlen palyanal sincs csavar-sor:
  // ott a "VÉLETLEN PÁLYA" mar mindent elmond.
  const twist = m.random ? null : CURRENT.theme.twist;
  if (twist) {
    drawText(c, 'CSAVAR: ' + twist, W / 2, ny + 10,
      Object.assign({ align: 'center', color: 'rgba(146,138,124,0.95)' }, OL));
  }
}

/** A sugo-buborek: sotet doboz, benne egy-ket sor, es alul egy kis csucs. */
function drawHelpBubble(c, lines, y) {
  if (!lines.length) return;
  const OL = { outline: '#0a1016', shadow: null };
  let wide = 0;
  for (const l of lines) wide = Math.max(wide, textWidth(l, 1));
  const bw = wide + 10;
  const bh = lines.length * 9 + 6;
  const bx = Math.round((W - bw) / 2);

  c.fillStyle = 'rgba(10,18,26,0.9)';
  c.fillRect(bx, y, bw, bh);
  c.fillStyle = 'rgba(138,208,240,0.5)';
  c.fillRect(bx, y, bw, 1);
  c.fillRect(bx, y + bh - 1, bw, 1);
  c.fillRect(bx, y, 1, bh);
  c.fillRect(bx + bw - 1, y, 1, bh);
  c.fillStyle = 'rgba(10,18,26,0.9)';         // felfele mutato csucs a nev fele
  c.fillRect((W >> 1) - 2, y - 2, 5, 2);
  c.fillStyle = 'rgba(138,208,240,0.5)';
  c.fillRect((W >> 1) - 2, y - 2, 1, 2);
  c.fillRect((W >> 1) + 2, y - 2, 1, 2);
  c.fillStyle = 'rgba(10,18,26,0.9)';
  c.fillRect((W >> 1) - 1, y, 3, 1);

  for (let i = 0; i < lines.length; i++) {
    drawText(c, lines[i], W / 2, y + 3 + i * 9,
      Object.assign({ align: 'center', color: '#cfe6f4' }, OL));
  }
}

function panel(c, S, cx, y, m, i, keys, time) {
  const OL = { outline: '#140c07', shadow: null };
  const side = m.sides[i];
  const random = !!(m.z && m.random);
  const team = TEAM[side.color];
  c.drawImage(keys, Math.round(cx - keys.width / 2), y);

  const frame = Math.floor(time * 5.5) % 4;
  const bob = frame === 1 || frame === 3 ? 1 : 0;
  if (random) {
    // Ismeretlen palya, ismeretlen szereplo: nevtelen sziluett all itt.
    const spr = S.silhouette[i];
    c.drawImage(spr, Math.round(cx - spr.width / 2), y + 31 + bob);
  } else {
    // A favago, akivel jatszani fogsz. Helyben lepked, hogy elo legyen.
    const spr = S.players[side.color].down.walk[frame];
    c.drawImage(spr, Math.round(cx - spr.width / 2), y + 31 + bob);
  }

  // Fel-le csak akkor, ha van mit valasztani: veletlen palyanal nincs, es
  // akkor a nyil sem latszik, hogy ne lehessen hiaba nyomkodni.
  if (!random) {
    const dy = Math.round(Math.sin(time * 6) * 1);
    c.drawImage(S.chevrons.up, Math.round(cx - 2), y + 26 - dy);
    c.drawImage(S.chevrons.down, Math.round(cx - 2), y + 57 + dy);
  }

  // Egyetlen sor: a SZOVEG mondja meg, ki iranyit, a SZINE pedig, melyik
  // favagoval. Igy nincs mit felreerteni.
  const label = MENU_MODES[side.mode].label;
  const ry = y + 64;
  const col = random ? (i === 0 ? '#e0a444' : '#7ca8e0') : team.tint;
  drawText(c, label, cx, ry, Object.assign({ align: 'center', color: col }, OL));

  const tw = textWidth(label, 1);
  const dx = Math.round(Math.sin(time * 6) * 1);
  drawText(c, '<', cx - tw / 2 - 9 - dx, ry, Object.assign({ color: '#ffd257' }, OL));
  drawText(c, '>', cx + tw / 2 + 4 + dx, ry, Object.assign({ color: '#ffd257' }, OL));
}
