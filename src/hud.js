// HUD, menu, bannerek, lebego szovegek.

import { W, H, CFG, PAL, TEAM, clamp } from './config.js';
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
  c.fillRect(0, 0, W, 23);
  c.fillStyle = 'rgba(255,180,90,0.10)';
  c.fillRect(0, 23, W, 1);

  // Ha jatekos jatszik robot ellen, eleg a "JÁTÉKOS" es a "ROBOT": a szinuk
  // ugyis megkulonbozteti oket. Ha ket robot vagy ket jatekos van, akkor a
  // szin neve is kell, kulonben nem lehet megmondani, ki kicsoda.
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
 * Kinek a neve jelenjen meg? Ha jatekos jatszik robot ellen, eleg a
 * "ROBOT" es a "JÁTÉKOS": a szin ugyis megkulonbozteti oket. Ha ket robot
 * vagy ket jatekos van, a szin neve is kell.
 */
export function sideName(g, i) {
  const p = g.players[i];
  const sameKind = g.players[0].isBot === g.players[1].isBot;
  const kind = p.isBot ? 'ROBOT' : 'JÁTÉKOS';
  return sameKind ? TEAM[p.color].name + ' ' + kind : kind;
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
  c.fillRect(0, 0, W, H);
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
function drawScore(c, g, y) {
  const SC = 4;
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
  const name = tie ? 'AZ ERDŐ' : sideName(g, wi);

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

  drawText(c, name, W / 2, 44, {
    align: 'center', scale: s1, color: col, outline: '#170f0a', shadow: null,
  });
  if (t > 0.5) {
    const s2 = Math.max(1, Math.round(3 * pulse));
    drawText(c, tie ? 'NYERT!' : 'GYŐZÖTT!', W / 2, 44 + s1 * 9 + 6, {
      align: 'center', scale: s2, color: '#ffd257', outline: '#3a1607', shadow: null,
    });
  }
  if (t > 1.0) drawScore(c, g, 112);
  if (t > 1.4) {
    if (Math.floor(time * 2) % 2 === 0) {
      drawText(c, 'R = ÚJRA', W / 2, 152, { align: 'center', color: '#ffd257' });
    }
    drawText(c, 'SPACE = MENÜ', W / 2, 164, { align: 'center', color: 'rgba(138,122,98,0.85)' });
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
  return { sides: [{ color: 0, mode: 0 }, { color: 1, mode: 2 }] };
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
  if (code === keys.up) { cycleColor(m, i, -1); return true; }
  if (code === keys.down) { cycleColor(m, i, 1); return true; }
  const d = code === keys.left ? -1 : code === keys.right ? 1 : 0;
  if (!d) return false;
  m.sides[i].mode = (m.sides[i].mode + d + MENU_MODES.length) % MENU_MODES.length;
  return true;
}

export function drawMenu(c, m, S, time) {
  c.drawImage(S.ground, 0, 0);
  c.fillStyle = 'rgba(10,8,6,0.68)';
  c.fillRect(0, 0, W, H);

  for (let i = 0; i < 40; i++) {
    const k = i / 39;
    c.fillStyle = 'rgba(255,116,32,' + (0.44 * Math.pow(k, 1.8)).toFixed(3) + ')';
    c.fillRect(0, H - 1 - i, W, 1);
  }
  for (let layer = 0; layer < 2; layer++) {
    const n = layer === 0 ? 11 : 13;
    for (let i = 0; i < n; i++) {
      const spr = S.trees[(i * 3 + layer) % S.trees.length];
      const x = Math.round(-8 + i * (W / (n - 1.2)) + ((i * 37 + layer * 19) % 9));
      const y = H - (layer === 0 ? 6 : 0) - Math.round(spr.h * 0.62) + ((i * 13 + layer * 7) % 5);
      c.globalAlpha = layer === 0 ? 0.55 : 1;
      c.drawImage(spr.sil, x, y);
      c.globalAlpha = 1;
    }
  }
  const f = S.flames;
  for (let x = -2; x < W + 4; x += 4) {
    const fr = (Math.floor(time * 15 + x * 0.7) % f.frames.length + f.frames.length) % f.frames.length;
    c.drawImage(f.frames[fr], x, H - f.h + 3);
  }

  const title = 'DŐL A FA';
  const bob = Math.round(Math.sin(time * 1.6) * 1);
  drawText(c, title, W / 2 + 1, 11 + bob, { align: 'center', scale: 4, color: '#5a3b22', shadow: null });
  drawText(c, title, W / 2, 10 + bob, {
    align: 'center', scale: 4, color: '#e0a444', outline: '#2a1408', shadow: null,
  });

  // Kicsit tavolabb egymastol: igy kulon egysegnek latszik a ket oldal.
  panel(c, S, 66, 50, m, 0, S.wasdKeys, time);
  panel(c, S, W - 66, 50, m, 1, S.arrowKeys, time);

  const OL = { outline: '#140c07', shadow: null };
  drawText(c, 'VÁGJ FÁT, NE DŐLJÖN RÁD, KERÜLD A TÜZET', W / 2, 128,
    Object.assign({ align: 'center', color: '#b0a084' }, OL));

  if (Math.floor(time * 2) % 2 === 0) {
    drawText(c, 'SPACE', W / 2, 143, Object.assign({ align: 'center', scale: 2, color: '#ffe08a' }, OL));
  }

  // A menuben mindig a rendes ikon van kint az M betuvel, tehat itt nem kell
  // a halvany jelzes: az csak jatek kozben.
  const muted = S.muted;
  c.drawImage(muted ? S.speakerMuted : S.speaker, W - 26, H - 13);
  drawText(c, 'M', W - 13, H - 14, Object.assign({ color: muted ? '#8a7a62' : '#c8b89a' }, OL));
}

function panel(c, S, cx, y, m, i, keys, time) {
  const OL = { outline: '#140c07', shadow: null };
  const side = m.sides[i];
  const team = TEAM[side.color];
  c.drawImage(keys, Math.round(cx - keys.width / 2), y);

  // A favago, akivel jatszani fogsz. Helyben lepked, hogy elo legyen.
  const set = S.players[side.color].down;
  const frame = Math.floor(time * 5.5) % 4;
  const bob = frame === 1 || frame === 3 ? 1 : 0;
  const spr = set.walk[frame];
  c.drawImage(spr, Math.round(cx - spr.width / 2), y + 31 + bob);

  // fel-le: a szint valtja
  const dy = Math.round(Math.sin(time * 6) * 1);
  c.drawImage(S.chevrons.up, Math.round(cx - 2), y + 26 - dy);
  c.drawImage(S.chevrons.down, Math.round(cx - 2), y + 57 + dy);

  // Egyetlen sor: a SZOVEG mondja meg, ki iranyit, a SZINE pedig, melyik
  // favagoval. Igy nincs mit felreerteni.
  const label = MENU_MODES[side.mode].label;
  const ry = y + 64;
  drawText(c, label, cx, ry, Object.assign({ align: 'center', color: team.tint }, OL));

  const tw = textWidth(label, 1);
  const dx = Math.round(Math.sin(time * 6) * 1);
  drawText(c, '<', cx - tw / 2 - 9 - dx, ry, Object.assign({ color: '#ffd257' }, OL));
  drawText(c, '>', cx + tw / 2 + 4 + dx, ry, Object.assign({ color: '#ffd257' }, OL));
}
