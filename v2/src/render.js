// Rajzolas. A jatek logika soha nem rajzol, es ez a fajl soha nem modositja az allapotot.

import { W, H, CFG, PAL, TEAM, CURRENT, clamp } from './config.js';
import { PLAYER_SPRITE, lollyFlavour, drawSails } from './sprites.js';
import { fallProgress, treeLen } from './trees.js';
import { inFire, boundarySamples } from './arena.js';
import {
  sinkK, meltsAway, shatters, darkK, hasMech, bladeAngle, bladeSpin, launchK,
} from './mechanics.js';
import { drawParticles } from './particles.js';
import {
  drawGroundDecor, drawNightGlow, drawDecorFront, decorActors, drawCritter,
  drawClouds, nightK, dayIndex,
} from './decor.js';

export { dayIndex };

const drawList = [];
let flameSamples = [];
const glowCells = new Set();   // ejszakai fenyfoltok racsa, lasd drawWorld

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

/**
 * A JATEKTER vagolapja: a kulso fronton BELUL, minusz a mar leegett feszkek.
 *
 * Ezt korabban egyetlen evenodd-vagolap csinalta (kulso front + feszkek egy
 * utvonalon). Csakhogy a feszkek MESSZE kilognak a zsugorodo fronton kivulre,
 * es ott a paritas 1 lesz, tehat a "kivul van, de feszken belul" sav BENNE
 * maradt a vagolapban. Emiatt a patak es a peremfeny kicsordult a leegett
 * talajra: onnan jott a barna vonal es az elcsuszott patakdarab.
 *
 * Ket egymast koveto vagas viszont METSZI egymast: eloszor levagjuk, ami a
 * fronton kivul van, es csak azutan vesszuk ki a feszkeket.
 */
function clipArena(c, a) {
  c.beginPath();
  poly(c, a.ptsOut);
  c.clip();
  c.beginPath();
  poly(c, a.ptsOut);
  for (const s of a.seeds) {
    if (s.r < 0.06) continue;
    poly(c, expandPoly(s.pts, 1.5));
  }
  c.clip('evenodd');
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
  c.restore();
  for (const s of a.seeds) {
    if (s.r < 0.06) continue;
    c.save();
    c.beginPath();
    poly(c, expandPoly(s.pts, 1.5));
    c.clip();
    c.drawImage(S.burnt, 0, 0);
    c.restore();
  }
  if (g.decor) drawGroundDecor(c, g.decor, S, time);
  drawSpots(c, g, time);

  // 2. A HATTER sotetedik erosen. A szereplok kesobb csak enyhen.
  tintRect(c, tint, tint.ground);

  // 2b. A VIZ a szinezes UTAN kerul fel. Enelkul a meleg esti fenyben a
  //     kekes patak sarosbarna csikka valt, es ugy nezett ki, mint egy
  //     ottfelejtett vonal a palyan. A viz visszaveri az eget: vilagos marad.
  //     A vagolapbol a tuzfeszkeket kivesszuk, hogy a leegett foltokon ne
  //     folyjon at.
  if (g.decor && g.decor.stream) {
    c.save();
    clipArena(c, a);
    // A vizet NEM szinezzuk kulon ratett folttal: az a folt az egesz
    // vagolapot befedte, es a szele pont a kulso front vonalan futott,
    // tehat egy meleg barna korvonalat rajzolt oda. Helyette a patakot
    // magat halvanyitjuk: ejszaka atsejlik rajta a sotet talaj, de kek marad.
    c.globalAlpha = 1 - Math.min(0.5, tint.ground * 0.55);
    c.drawImage(g.decor.stream, 0, 0);
    c.globalAlpha = 1;
    c.restore();
  }
  if (g.decor) drawNightGlow(c, g.decor, S, time);
  drawSky(c, S, dayT);

  // 3. Meleg feny a peremek biztonsagos oldalan.
  //
  // A vagolap NEM csak a kulso front: a belso tuzfeszkek foltjat KI kell
  // venni belole. Enelkul a kulso perem fenycsikja ott is kilatszott, ahol
  // mar leegett a talaj, es egy ertelmetlen barna vonal huzodott a
  // tuzfeszek kozepen. (evenodd = kulso minusz feszkek.)
  c.save();
  clipArena(c, a);
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
  if (g.tower) drawList.push({ y: g.tower.y, k: 6, o: g.tower });
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
    else if (it.k === 6) drawBellTower(c, g, S, time);
    else drawFlame(c, it.o, it.i, S, time);
  }

  drawParticles(c);

  // HARANGSZÓ: a palya sotetbe borul. A sirkovek szinte eltunnek, a ket
  // favago korul viszont marad egy kis derengés, es ujra kirajzoljuk oket,
  // tehat latszanak - de csak ok.
  const dk = darkK(g);
  if (dk > 0) {
    c.fillStyle = 'rgba(3,2,9,' + (0.88 * dk).toFixed(3) + ')';
    c.fillRect(0, 0, W, H);
    const R = CFG.mech.bell.halo;
    for (const p of g.players) {
      if (!p.alive && p.squashT <= 0) continue;
      const gr = c.createRadialGradient(p.x, p.y - 8, 0, p.x, p.y - 8, R);
      gr.addColorStop(0, 'rgba(150,120,200,' + (0.4 * dk).toFixed(3) + ')');
      gr.addColorStop(1, 'rgba(150,120,200,0)');
      c.fillStyle = gr;
      c.fillRect(p.x - R, p.y - 8 - R, R * 2, R * 2);
    }
    for (const p of g.players) {
      if (p.alive || p.squashT > 0) drawPlayer(c, p, S, g, time);
    }
  }

  // 7. A szereplok folott csak enyhe szinezes, hogy ejszaka is lassuk oket.
  tintRect(c, tint, tint.world);
  if (tint.ground > 0.15) {
    // Ejszakai megvilagitas. NEM a lang-sprite-ot rajzoljuk ujra: az atsejlett
    // az elotte allo torzseken, es azok attetszonek latszottak. Helyette egy
    // puha fenyfolt kerul oda, ami csak megvilagitja, amit takar.
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = Math.min(0.5, tint.ground * 0.85);
    const gw = S.glow.width;
    const gh = S.glow.height;
    // Racsra ritkitva rajzolunk: cellankent EGY fenyfolt. A hatarpontok a
    // kis tuzfeszkek koré surun torlodnak, es ott tucatnyi folt egymasra
    // adodott volna: az egesz feszek vakito feher folttá egett ki.
    glowCells.clear();
    for (const f of flameSamples) {
      const key = ((f.x / 12) | 0) * 1000 + ((f.y / 12) | 0);
      if (glowCells.has(key)) continue;
      glowCells.add(key);
      c.drawImage(S.glow, Math.round(f.x - gw / 2), Math.round(f.y - gh / 2 - 3));
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }

  // Villamcsapas az aztek atoknal: cikcakkos iv a kep tetejerol a
  // becsapodasig, korulotte rovid feher villanassal.
  if (g.spots) {
    for (const sp of g.spots) {
      if (sp.kind !== 'bolt') continue;
      const k = 1 - sp.t / sp.life;
      if (sp.small) {
        // Melle csapott villam: vekony, halvany iv, kepernyo-villanas nelkul.
        c.fillStyle = 'rgba(190,225,255,' + (0.4 * k).toFixed(3) + ')';
        let mx = sp.x;
        for (let i = 0; i <= 8; i++) {
          const y = Math.round(sp.y - 26 + i * 3);
          mx += Math.sin(i * 2.3 + sp.x) * 1.6;
          c.fillRect(Math.round(mx), y, 1, 3);
        }
        continue;
      }
      c.fillStyle = 'rgba(255,255,255,' + (0.22 * k).toFixed(3) + ')';
      c.fillRect(0, 0, W, H);
      let bx = sp.x + (Math.sin(sp.x) * 6);
      const steps = 14;
      for (let i = 0; i <= steps; i++) {
        const y = Math.round((i / steps) * (sp.y - 6));
        bx += Math.sin(i * 2.7 + sp.x) * 3;
        const w2 = i > steps - 3 ? 3 : 2;
        c.fillStyle = 'rgba(200,240,255,' + (0.85 * k).toFixed(3) + ')';
        c.fillRect(Math.round(bx) - 1, y, w2, Math.ceil((sp.y - 6) / steps) + 1);
        c.fillStyle = 'rgba(255,255,255,' + (0.9 * k).toFixed(3) + ')';
        c.fillRect(Math.round(bx), y, 1, Math.ceil((sp.y - 6) / steps) + 1);
      }
      c.fillStyle = 'rgba(255,255,255,' + (0.7 * k).toFixed(3) + ')';
      c.fillRect(Math.round(sp.x) - 4, Math.round(sp.y) - 3, 9, 3);
    }
  }

  // Szellokesek. Hosszu, hullamzo szelvonalak, kozottuk sodrodo homokkal.
  // Nem tomor sav es nincs vezeto folt: a szel maga lathatatlan, csak az
  // latszik, amit visz.
  if (g.gusts && g.gusts.length) {
    for (const w of g.gusts) {
      const fade = Math.min(1, w.t * 2.5) * Math.min(1, (w.life - w.t) * 2);
      if (fade <= 0.02) continue;
      const nx = -w.dy;
      const ny = w.dx;
      const lanes = 3 + w.size * 2;              // nagyobb szel = tobb vonal
      for (let l = 0; l < lanes; l++) {
        const q = (l / (lanes - 1)) * 2 - 1;     // -1..1 a sav szelessegeben
        const off = q * w.w * 0.9;
        // Vonalankent mas hossz es mas fazis: ettol nem egyforma mind.
        const len = 10 + ((l * 13 + w.seed) % 17) + w.size * 8;
        const ph = w.seed + l * 2.3;
        // Homokon a vilagos csik nem latszik: a szel arnyekat rajzoljuk,
        // egy fokkal sotetebb meleg savval, es a fenyes szemcsek adjak a
        // masik iranyu kontrasztot.
        const a = (0.14 + 0.3 * (1 - Math.abs(q))) * fade;
        c.fillStyle = 'rgba(120,88,44,' + a.toFixed(3) + ')';
        for (let d2 = 0; d2 < len; d2++) {
          // A vonal hullamzik: a szel nem egyenesen fut.
          const wob = Math.sin(d2 * 0.22 + ph + time * 5) * (1.2 + w.size * 0.5);
          const tail = 1 - d2 / len;             // hatrafele elvekonyodik
          if (tail < 0.12 && (d2 & 1)) continue;
          const px = w.x - w.dx * d2 + nx * (off + wob);
          const py = w.y - w.dy * d2 + ny * (off + wob);
          c.fillRect(Math.round(px), Math.round(py), 1, 1);
        }
      }
      // Sodrodo homokszemcsek: ezek teszik lathatova, milyen gyors a szel.
      const grains = 9 + w.size * 6;
      for (let q = 0; q < grains; q++) {
        const seed2 = w.seed * 3 + q * 17;
        const off = ((seed2 % 100) / 100 * 2 - 1) * w.w;
        const d2 = ((time * (60 + w.size * 20) + seed2 * 7) % (26 + w.size * 14));
        const px = w.x - w.dx * d2 + nx * off;
        const py = w.y - w.dy * d2 + ny * off;
        c.fillStyle = 'rgba(255,250,228,' + (0.85 * fade).toFixed(3) + ')';
        c.fillRect(Math.round(px), Math.round(py), 1 + (q % 2), 1);
      }
    }
  }

  if (g.decor) drawDecorFront(c, g.decor, S, time);
  if (g.decor) drawClouds(c, g.decor, S, dayT);
  c.drawImage(S.vignette, 0, 0);
}

/**
 * A sokszog kifele tolva, a sulypontjabol nezve.
 *
 * A tuzfeszek KIRAJZOLT sokszoge egy arnyalattal kisebb, mint amit a jatek
 * mar leegettnek szamol (a hatarpontok analitikus tesztje surubb, mint a
 * sokszog csucsai). Ha a kulso front melyen benyulik egy feszekbe, a ket
 * hatar koze beszorult egy vekony, ki nem egett fuszal-csik: a kepen ez
 * latszott ertelmetlen vonalkent. Ezzel a par pixeles tulnyujtassal a
 * leegett folt biztosan lefedi.
 */
function expandPoly(pts, px) {
  if (!pts.length) return pts;
  let cx = 0;
  let cy = 0;
  for (const p of pts) { cx += p.x; cy += p.y; }
  cx /= pts.length;
  cy /= pts.length;
  return pts.map((p) => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const d = Math.hypot(dx, dy) || 1;
    return { x: p.x + (dx / d) * px, y: p.y + (dy / d) * px };
  });
}

/**
 * Harangtorony. A harang KILENG kondulaskor, es hanghullamok indulnak belole:
 * igy nemitva is latszik, hogy jon a sotetseg, es marad egy pillanat
 * felkeszulni ra.
 */
function drawBellTower(c, g, S, time) {
  const tw = S.bellTower;
  const bx = Math.round(g.tower.x - tw.w / 2);
  const by = Math.round(g.tower.y - tw.h);
  c.drawImage(S.shadowMd, bx + 1, by + tw.h - 4);
  c.drawImage(tw.cv, bx, by);

  const k = CFG.mech.bell;
  const sw = g.bellSwing || 0;
  const decay = sw / k.swing;
  const ang = decay > 0 ? Math.sin((k.swing - sw) * 17) * 0.55 * decay : 0;

  // a harang a felso kozeppontja korul leng
  const pivotX = bx + tw.bellX;
  const pivotY = by + tw.bellY;
  c.save();
  c.translate(pivotX, pivotY);
  c.rotate(ang);
  c.drawImage(S.bell, -4, -1);
  c.restore();

  // hanghullamok: harom tagulo gyuru, egyre halvanyabban
  if (decay > 0) {
    for (let i = 0; i < 3; i++) {
      const t2 = (k.swing - sw) - i * 0.16;
      if (t2 <= 0) continue;
      const r = t2 * 78;
      const a = Math.max(0, (1 - t2 / 1.15)) * 0.5;
      if (a <= 0.01) continue;
      c.strokeStyle = 'rgba(232,210,140,' + a.toFixed(3) + ')';
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(pivotX, pivotY + 3, r, r * 0.55, 0, 0, Math.PI * 2);
      c.stroke();
    }
  }
}

/**
 * Kristaly-szilankok. A kidolt torzs helyen fel-hat torott darab hever a
 * doles tengelye menten, kisse szetszorva. Ahogy sullyednek, egyre lejjebb
 * csusznak es halvanyulnak, majd eltunnek: onnantol at lehet setalni rajtuk.
 */
function drawShards(c, t, S, k) {
  if (k >= 1) return;
  const spr = S.trees[t.variant];
  const L = treeLen(t);
  const dx = Math.cos(t.fallAngle);
  const dy = Math.sin(t.fallAngle);
  const n = 6;
  const fade = 1 - k;
  for (let i = 0; i < n; i++) {
    const d = L * (0.12 + (i / (n - 1)) * 0.86);
    const jitter = Math.sin(i * 2.7 + t.x) * 3.5;
    const px = t.x + dx * d - dy * jitter;
    const py = t.y + dy * d + dx * jitter * 0.6 + k * 4;
    const sz = Math.max(1, Math.round((3 + (i % 3)) * (1 - k * 0.5)));
    c.globalAlpha = fade;
    // hegyes szilank: felul keskeny, alul szeles
    for (let r = 0; r < sz; r++) {
      const w = Math.max(1, Math.round((r + 1) * 0.9));
      c.fillStyle = r < sz * 0.4 ? spr.hiCol : spr.midCol;
      c.fillRect(Math.round(px - w / 2), Math.round(py - sz + r), w, 1);
    }
    c.fillStyle = spr.darkCol;
    c.fillRect(Math.round(px - 1), Math.round(py - 1), 2, 1);
    c.globalAlpha = 1;
  }
}

/**
 * Szetloccsant cukortocsa. NEM sima oval: a kontur szogenkent hullamzik, es
 * korulotte apro cseppek szoktak szet, mint egy valodi loccsanas. Az alakja a
 * folt helyebol szamolodik, tehat allando marad, nem vibral kepkockankent.
 */
function drawSplat(c, s, k) {
  const fl = lollyFlavour(s.variant || 0);
  const seed = (s.seed || 0) + (s.x | 0) * 3;
  const wob = (a) => 1
    + Math.sin(a * 3 + seed) * 0.22
    + Math.sin(a * 5 - seed * 0.7) * 0.13
    + Math.sin(a * 8 + seed * 1.3) * 0.07;

  const R = 11;
  const rim = (rad, col, squash) => {
    c.fillStyle = col;
    for (let y = -rad; y <= rad; y++) {
      const ang = Math.asin(Math.max(-1, Math.min(1, y / rad)));
      const w = Math.round(Math.sqrt(Math.max(0, rad * rad - y * y)) * wob(ang));
      if (w <= 0) continue;
      c.fillRect(Math.round(s.x - w), Math.round(s.y + y * squash), w * 2, 1);
    }
  };
  // Jol kivehetoen, nem attetszoen: a menta tocsa kulonben eltunt a
  // mentazold talajon.
  const A = (v) => Math.min(1, v * (0.45 + k * 0.55)).toFixed(3);
  rim(R, hexA(fl.dark, A(0.95)), 0.5);          // sotet perem
  rim(R - 2, hexA(fl.mid, A(1)), 0.5);          // a tocsa teste
  rim(R - 5, hexA(fl.hi, A(0.85)), 0.5);        // vilagos belso

  // szetfrocscsent cseppek a folt korul
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + seed * 0.4;
    const d = R + 2 + ((i * 5 + seed) % 4);
    const dx = Math.round(s.x + Math.cos(a) * d);
    const dy = Math.round(s.y + Math.sin(a) * d * 0.5);
    const sz = 1 + ((i + seed) % 2);
    c.fillStyle = hexA(fl.mid, A(0.9));
    c.fillRect(dx, dy, sz, sz);
  }
  // fenyes csillanas: ettol latszik nedvesnek
  c.fillStyle = 'rgba(255,255,255,' + A(0.7) + ')';
  c.fillRect(Math.round(s.x - 4), Math.round(s.y - 3), 3, 1);
  c.fillRect(Math.round(s.x - 4), Math.round(s.y - 2), 1, 1);
}

/** '#rrggbb' + alfa -> 'rgba(...)'. */
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
}

/**
 * A palya-mechanikak talajra rajzolt foltjai. Enelkul a jatekos csak azt
 * erezne, hogy valami lassitja vagy szipolyozza, de nem latna, MI.
 */
function drawSpots(c, g, time) {
  if (!g.spots || !g.spots.length) return;
  for (const s of g.spots) {
    const k = 1 - s.t / s.life;
    if (k <= 0) continue;
    if (s.kind === 'sticky') {
      drawSplat(c, s, k);
    } else if (s.kind === 'haunt') {
      const r = 11 + Math.sin(time * 3 + s.x) * 1.5;
      c.fillStyle = 'rgba(120,230,190,' + (0.2 * k).toFixed(3) + ')';
      for (let y = -r; y <= r; y++) {
        const w = Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
        c.fillRect(Math.round(s.x - w), Math.round(s.y + y * 0.6), w * 2, 1);
      }
    } else if (s.kind === 'blades') {
      // Magat a vitorlat a kidolt malom rajzolja (lasd drawTree), hogy a
      // torony FOLE kerulhessen. Itt csak a felkavart por marad.
      if (bladeSpin(s) > 0.15) {
        const r = CFG.mech.blades.radius[s.size];
        const off = ((time * 9) | 0) % 4;
        c.fillStyle = 'rgba(226,220,196,0.3)';
        for (let i = 0; i < 3; i++) {
          const th = (i / 3) * Math.PI * 2 + off;
          c.fillRect(Math.round(s.x + Math.cos(th) * (r + 2)),
            Math.round(s.y + Math.sin(th) * (r + 2) * 0.6), 1, 1);
        }
      }
    } else if (s.kind === 'crack') {
      // Repedes: cikcakkos sotet vonalak a jegben.
      c.fillStyle = 'rgba(20,44,64,' + (0.85 * k).toFixed(3) + ')';
      for (let a = 0; a < 5; a++) {
        const ang = (a / 5) * Math.PI * 2 + s.x;
        let px = s.x;
        let py = s.y;
        for (let i = 0; i < 9; i++) {
          px += Math.cos(ang + Math.sin(i + s.x) * 0.5) * 1.3;
          py += Math.sin(ang + Math.sin(i + s.x) * 0.5) * 0.8;
          c.fillRect(Math.round(px), Math.round(py), 1, 1);
        }
      }
    }
  }
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
  // A nap nem minden vilagba illik: a temetobe es az idegen bolygora nem.
  // Ott csak a hold (illetve az idegen egitest) marad az egen.
  if (nk < 0.75 && (!CURRENT.theme || CURRENT.theme.sun !== false)) {
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
    if (hasMech('blades') && !burning) {
      // A malom vitorlaja allva is forog. Nem bant senkit, csak jelzi, hogy
      // ez itt egy elo malom - es azt, hogy mi fog a foldon tovabb porogni.
      const r = CFG.mech.blades.radius[t.variant % 3];
      const hub = spr.hubY === undefined ? Math.max(5, Math.round(spr.h * 0.2)) - 1 : spr.hubY;
      drawSails(c, t.x + jit, y + hub, r, time * (3.4 - t.variant * 0.5), spr.sail, 1);
    }
    if (t.lit && !burning) drawFuse(c, t, spr, x, y, time);
    if (burning) drawTreeFlames(c, S, t, time);
    else if (t.chop > 0.02 || t.lit) drawChop(c, t, spr, x, y);
    return;
  }

  if (t.state === 'flying') {
    drawLaunch(c, t, spr, time);
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
  // A sullyedos palyan a kidolt darab lassan elmerul a talajban: lejjebb
  // csuszik es elhalvanyul, es amikor eltunt, mar nem is akadaly.
  const sk = sinkK(t);
  if (t.state === 'down' && shatters(t)) {
    // Az idegen bolygon a kidolt kristaly nem fekszik le egyben: DARABOKRA
    // torik, es a szilankok gyorsan elmerulnek a talajban.
    drawShards(c, t, S, sk);
    if (burning) drawTreeFlames(c, S, t, time);
    return;
  }
  if (grow > 0.02 && sk < 1 && !meltsAway(t)) {
    const L = Math.max(1, Math.round(fal.L * grow));
    const img = burning ? fal.charRight : fal.right;
    c.save();
    if (sk > 0) c.globalAlpha = 1 - sk * 0.85;
    c.translate(Math.round(t.x), Math.round(t.y + sk * 3));
    c.rotate(t.fallAngle);
    c.drawImage(img, 0, 0, L, fal.T, 0, -Math.round(fal.T / 2), L, fal.T);
    c.restore();
  }
  // A kidolt malom vitorlaja a torzs vegen TOVABB POROG. Ezt a FA rajzolja,
  // nem a foltkezelo: igy a kidolt torony fole kerul, es nem ala.
  const bs = t.bladeSpot;
  if (bs && bs.t < bs.life) {
    const sp2 = bladeSpin(bs);
    const sr = S.trees[t.variant];
    if (sr && sr.sail) {
      c.globalAlpha = Math.min(1, 0.4 + sp2 * 0.6);
      drawSails(c, bs.x, bs.y, CFG.mech.blades.radius[bs.size],
        bladeAngle(bs), sr.sail, 0.62);
      c.globalAlpha = 1;
    }
  }
  if (burning) drawTreeFlames(c, S, t, time);
}

/**
 * Egy MAR MEGGYULLADT raketa kanoca: szikrazo pont a cso aljanal, es a
 * hatralevo ido alatt egyre idegesebben pattog. Ez a "most vagy soha" jelzes.
 */
function drawFuse(c, t, spr, x, y, time) {
  const fy = Math.round(t.y - spr.h * 0.2);
  const fx = x - 2;
  const f = (Math.sin(time * 30 + t.x) + 1) * 0.5;
  c.fillStyle = f > 0.5 ? '#fff4c8' : '#ffd257';
  c.fillRect(fx, fy, 1, 1);
  c.fillStyle = 'rgba(240,138,44,0.8)';
  c.fillRect(fx - 1, fy - 1, 1, 1);
  c.fillRect(fx + 1, fy - 1 - ((f * 2) | 0), 1, 1);
}

/**
 * Felszallo raketa: emelkedik, kozben zsugorodik es elhalvanyul, mogotte
 * szikracsova. A tetejen kis fenypont marad, mint egy tavolodo lampas.
 */
function drawLaunch(c, t, spr, time) {
  const k = launchK(t);
  const rise = k * CFG.mech.fuse.rise * CFG.mech.fuse.fly;
  const x = Math.round(t.x - spr.w / 2);
  const y = Math.round(t.y - spr.h - rise);
  // Jatek kozben a raketa egyszeruen elhalvanyul es eltunik. A ZAROKEPEN
  // viszont vegig latszania kell, mert a tetejen szet fog robbanni.
  const fade = t.finale ? 1 - k * 0.35 : 1 - k * k;

  // Az ALLVANY a foldon marad: a raketa szall el, nem a tripod. Ezert a
  // sprite also savjat kulon, helyben rajzoljuk, a tobbit pedig emelkedve.
  const stand = Math.max(4, Math.round(spr.h * 0.15));
  const body = spr.h - stand;
  c.drawImage(spr.cv, 0, body, spr.w, stand,
    Math.round(t.x - spr.w / 2), Math.round(t.y - stand), spr.w, stand);

  c.save();
  c.globalAlpha = Math.max(0, fade);
  const sc = 1 - k * 0.45;
  c.translate(Math.round(t.x), y + spr.h);
  c.scale(sc, sc);
  c.drawImage(spr.cv, 0, 0, spr.w, body, -Math.round(spr.w / 2), -spr.h, spr.w, body);
  c.restore();

  // Szikracsova a raketa alatt. A csova a KIINDULASI ponttol a raketaig er,
  // es a raketahoz kozeledve egyre fenyesebb: onnan lathato, hogy mi hajtja.
  const n = Math.max(8, Math.round(rise));
  for (let i = 0; i < n; i++) {
    const q = i / n;                             // 0 = fold, 1 = a raketa alja
    const py = Math.round(t.y - rise * q);
    const wob = Math.sin(q * 7 - time * 22) * (1 + (1 - q) * 2.5);
    const a = Math.min(1, (0.25 + q * 0.75)) * fade;
    if (a <= 0.03) continue;
    c.fillStyle = q > 0.82 ? 'rgba(255,244,200,' + a.toFixed(2) + ')'
      : q > 0.55 ? 'rgba(255,210,87,' + a.toFixed(2) + ')'
        : 'rgba(224,110,40,' + (a * 0.75).toFixed(2) + ')';
    c.fillRect(Math.round(t.x + wob), py, 1, 1);
    if (q > 0.7) c.fillRect(Math.round(t.x - wob * 0.4), py, 1, 1);
  }
  // fenylo mag kozvetlenul a raketa alatt
  c.fillStyle = 'rgba(255,250,220,' + (0.85 * fade).toFixed(2) + ')';
  c.fillRect(Math.round(t.x) - 1, Math.round(t.y - rise), 3, 2);
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
  // EGY sav van, es mindig no. A szine mondja meg, ki tolti: sargat a
  // fejsze (akkor kidol), pirosat a kanoc (akkor kilo).
  const burning = t.lit && t.fuseHot;
  const fill = Math.round(bw * Math.max(0, Math.min(1, t.chop)));
  c.fillStyle = burning ? '#e0341c' : (t.chop > 0.82 ? '#ffd257' : PAL.woodPale);
  c.fillRect(bx, by, fill, 2);
  c.fillStyle = burning ? '#ff7a4a' : (t.chop > 0.82 ? '#fff0b8' : '#e8c98c');
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
    // A VALODI szereplo nez ki az ablakon, nem egy altalanos favago-arc:
    // a lefele nezo sprite-jabol nagyitjuk ki a fejet es a vallat. Igy a
    // tokfejnek tok, a szfinxnek oroszlanfej, az urhajosnak sisak van rajta.
    const spr = S.players[g.players[wi].color].down.walk[0];
    const SRC_X = 4;          // a sprite testenek bal szele (PAD)
    const SRC_Y = 3;          // a fej teteje folott
    const SRC_W = 20;
    const SRC_H = 17;         // fej + vall
    const zoom = Math.max(1, Math.floor(cab.winW / 12));
    const dw = SRC_W * zoom;
    const dh = SRC_H * zoom;
    c.drawImage(spr, SRC_X, SRC_Y, SRC_W, SRC_H,
      Math.round(wx + (cab.winW - dw) / 2), Math.round(wy + cab.winH - dh + 2), dw, dh);
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
