// Erintes: lebego hüvelykujj-konzol es koppintas a kirajzolt elemekre.
//
// ELV. A kepernyo ket fele a ket jatekos terfele. Ahova a hüvelykujj leer a
// sajat terfelen, ott jelenik meg a konzol, es az irany az elso erintesi
// ponthoz kepest szamit. Nem negyiranyu kereszt, hanem kor: kis holtterrel a
// kozepen, hogy a nyugalmi ujj ne mozgassa a figurat, es nyolc iranyszelettel,
// tehat az atlos mozgas is megy. Ket ujj egyszerre, egymastol fuggetlenul.
//
// KOPPINTAS. Nincs kulon gombsav: amit a jatek kirajzol, az koppinthato. A HUD
// feljegyzi, hova rajzolta a START-ot, a varazspalcat, a hangszorot, a
// palyavalaszto dobozait, a FOLYTATAS-t es a KILEPES-t (tapint.js), a
// koppintas pedig abban keres, es a talalt elem billentyujet kuldi a jateknak.
// Ha a koppintas nem talal semmit: jatekban szunet, szunetben folytatas, a
// meccs vegen vissza a menube. A menuben az ures koppintas nem csinal semmit,
// ott a START felirat indit.
//
// MENUBEN a konzol is navigal: egy kiteres = egy iranybillentyu az adott
// oldalon (fel-le szin, jobbra-balra ember vagy robot). De ugyanez koppintassal
// is megy a kirajzolt nyilakon.
//
// JATEKBAN csak annak az oldalnak van konzolja, ahol ember jatszik.
//
// Pointer Events-et hasznalunk: ugyanaz a kod kezeli az erintest es az egeret,
// tehat gepen egerrel is kiprobalhato a /v4/?erintes.

import { H, NEZET } from './config.js';
import { MAP, fire, erintesIrany, erintesTorol, erintesBekapcsol } from './input.js';
import { fekvo, figyel } from './fektetes.js';
import { talal } from './tapint.js';

const HOLTTER = 14;         // px: ezen belul nincs irany
const KITERES = 40;         // px: a fej legfeljebb ennyire mozdul ki a talpbol
const KOPPINTAS_MS = 300;
const KOPPINTAS_PX = 12;

let reteg, canvas;
const botok = [null, null];          // oldalankent: { id, ox, oy, el, fej, irany, t0, mozgott }

// Amit a jatek mond magarol minden kepkockaban.
const allapot = {
  state: 'menu',
  emberek: [true, true],             // melyik oldalon ul ember (jatekban szamit)
};

// ------------------------------------------------------------ segedek

const oldalAzX = (x) => (x < window.innerWidth / 2 ? 0 : 1);

/** Nyolc iranyszelet, holtterrel. Visszaad: { up, down, left, right } */
function iranyokBol(dx, dy) {
  const r = Math.hypot(dx, dy);
  if (r < HOLTTER) return { up: false, down: false, left: false, right: false };
  // 0 = jobbra, orajaras szerint, 45 fokos szeletek
  const szelet = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) & 7;
  return {
    right: szelet === 0 || szelet === 1 || szelet === 7,
    down: szelet >= 1 && szelet <= 3,
    left: szelet >= 3 && szelet <= 5,
    up: szelet >= 5 && szelet <= 7,
  };
}

/** A domináns tengely iranya a menuhoz: csak negy irany, egyszerre egy. */
function foIrany(dx, dy) {
  if (Math.hypot(dx, dy) < HOLTTER) return null;
  if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'up' : 'down';
}

function jatekban() {
  return allapot.state === 'playing' || allapot.state === 'countdown' || allapot.state === 'roundend';
}

/** Ezen az oldalon lehet-e most konzolt fogni. */
function oldalSzabad(i) {
  if (allapot.state === 'menu') return true;
  if (jatekban()) return !!allapot.emberek[i];
  return false;
}

/** Kepernyo-pixel -> a canvas sajat 320x180-as koordinatai. */
function canvasPont(x, y) {
  const r = canvas.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  // A vaszon szelesebb lehet a jatekternel: a hasab merete kivonando, hogy a
  // jatekter bal szele legyen a 0.
  return [(x - r.left) * (NEZET.w / r.width) - NEZET.ox, (y - r.top) * (H / r.height)];
}

// ------------------------------------------------------------ konzol

function botLetesz(i, id, x, y) {
  const el = reteg.querySelector('#bot' + i);
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  const fej = el.querySelector('.fej');
  fej.style.transform = 'translate(0px, 0px)';
  // A konzol rajza csak akkor jelenik meg, ha az ujj el is mozdul: egy sima
  // koppintasnal (START, nyilak) nem villan fel feleslegesen.
  botok[i] = { id, ox: x, oy: y, el, fej, irany: null, t0: performance.now(), mozgott: false };
}

function botMozgat(b, i, x, y) {
  let dx = x - b.ox, dy = y - b.oy;
  const r = Math.hypot(dx, dy);
  if (r > KOPPINTAS_PX && !b.mozgott) { b.mozgott = true; b.el.classList.add('el'); }
  if (r > KITERES) { dx *= KITERES / r; dy *= KITERES / r; }
  b.fej.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;

  if (allapot.state === 'menu') {
    // Egy kiteres = egy billentyu. Ujra csak akkor, ha visszatert a holtterbe
    // vagy iranyt valtott: igy nem porog vegig a szinlistan egy tartott ujjtol.
    const uj = foIrany(dx, dy);
    if (uj !== b.irany) {
      b.irany = uj;
      if (uj) fire(MAP[i][uj]);
    }
    return;
  }
  if (jatekban()) erintesIrany(i, iranyokBol(dx, dy));
}

function botFelvesz(i) {
  const b = botok[i];
  if (!b) return;
  // A "nema" jelolonek (robot oldalan letett ujj) nincs rajzolt konzolja.
  if (b.el) b.el.classList.remove('el');
  botok[i] = null;
  erintesTorol(i);
}

// ------------------------------------------------------------ esemenyek

function lenyom(e) {
  if (e.target.closest('button')) return;       // a gombok a sajat utjukon
  if (!e.isPrimary && e.pointerType === 'mouse') return;
  erintesBekapcsol();
  document.body.classList.add('erintes');

  const i = oldalAzX(e.clientX);
  if (botok[i]) return;                          // ezen az oldalon mar van ujj
  // Az ujj kovetese akkor is, ha lecsuszik a retegrol: kulonben elmaradna a
  // felengedes, es a figura menne tovabb magaban.
  try { reteg.setPointerCapture(e.pointerId); } catch { /* regi bongeszo */ }
  if (!oldalSzabad(i)) {
    // Robot oldala, vagy szunet: a koppintas itt is ervenyes, konzol nincs.
    botok[i] = { id: e.pointerId, ox: e.clientX, oy: e.clientY, el: null, fej: null,
      irany: null, t0: performance.now(), mozgott: false, nema: true };
    return;
  }
  botLetesz(i, e.pointerId, e.clientX, e.clientY);
  e.preventDefault();
}

function mozdul(e) {
  const i = botok.findIndex((b) => b && b.id === e.pointerId);
  if (i < 0) return;
  const b = botok[i];
  if (b.nema) {
    if (Math.hypot(e.clientX - b.ox, e.clientY - b.oy) > KOPPINTAS_PX) b.mozgott = true;
    return;
  }
  botMozgat(b, i, e.clientX, e.clientY);
  e.preventDefault();
}

function felenged(e) {
  const i = botok.findIndex((b) => b && b.id === e.pointerId);
  if (i < 0) return;
  const b = botok[i];
  const rovid = performance.now() - b.t0 < KOPPINTAS_MS;
  const x = b.ox, y = b.oy;

  botFelvesz(i);

  if (!rovid || b.mozgott) return;

  /*
   * Koppintas. Eloszor a kirajzolt elemek: ha a koppintas eltalal valamit, ami
   * a HUD szerint koppinthato, annak a billentyuje megy a jateknak. Ha nem
   * talal semmit, jatekban szunet, szunetben folytatas, meccs vegen menu.
   * A menuben az ures koppintas szandekosan nem csinal semmit.
   */
  const p = canvasPont(x, y);
  const r = p && talal(p[0], p[1]);
  if (r) { fire(r.kod, r.shift); return; }
  if (allapot.state !== 'menu') fire('Space');
}

// ------------------------------------------------------------ allapot

function frissit() {
  // A jatek allapota a DOM-on is: CSS-bol es tesztbol egyarant lathato.
  document.body.dataset.jatek = allapot.state;

  // Allo telefonon a jatek apro lenne: kerjuk az elforgatast.
  const allo = !fekvo() && Math.min(window.innerWidth, window.innerHeight) < 700;
  document.body.classList.toggle('allo', allo);
}

/*
 * A korok kozotti atmenetek (visszaszamlalas, jatek, korveg) egy csoport: ott
 * a tartott ujj marad, kulonben minden kor vegen kicsuszna a konzol a jatekos
 * keze alol. Csoportvaltasnal (szunet, menu, meccs vege) viszont elengedjuk,
 * hogy egy szunetbol ne hozzunk at tartott iranyt.
 */
const csoport = (s) => (s === 'countdown' || s === 'playing' || s === 'roundend' ? 'jatek' : s);
let elozoCsoport = 'menu';
function csoportFigyel(state) {
  const cs = csoport(state);
  if (cs !== elozoCsoport) { elozoCsoport = cs; botFelvesz(0); botFelvesz(1); }
}

// ------------------------------------------------------------ publikus

/**
 * A jatek ezzel mondja el minden kepkockaban, hol tart. Olcso: csak akkor
 * nyul a DOM-hoz, ha valami valtozott.
 */
export function beallit({ state, emberek }) {
  let valtozott = false;
  if (state && state !== allapot.state) { allapot.state = state; valtozott = true; csoportFigyel(state); }
  if (emberek && (emberek[0] !== allapot.emberek[0] || emberek[1] !== allapot.emberek[1])) {
    allapot.emberek = [!!emberek[0], !!emberek[1]];
    valtozott = true;
  }
  if (valtozott) frissit();
}

export function initErintes() {
  reteg = document.getElementById('erintes');
  canvas = document.getElementById('game');
  if (!reteg || !canvas) return;

  reteg.addEventListener('pointerdown', lenyom, { passive: false });
  reteg.addEventListener('pointermove', mozdul, { passive: false });
  reteg.addEventListener('pointerup', felenged);
  reteg.addEventListener('pointercancel', felenged);
  // Hosszan nyomva tartott ujjra Android Chrome helyi menut dobna fel.
  reteg.addEventListener('contextmenu', (e) => e.preventDefault());
  // Ha az ujj lecsuszik a kepernyorol, a bongeszo nem mindig kuld pointerup-ot.
  window.addEventListener('blur', () => { botFelvesz(0); botFelvesz(1); });

  // Erintokepernyos eszkozon rogton bekapcsol. Egeres gepen alapbol nem: ott
  // a v4 ugyanaz, mint a v2. A ?erintes a cimben barhol bekapcsolja,
  // teszteleshez es erintokepernyos laptophoz, ahol a bongeszo egeret jelent.
  const kenyszer = new URLSearchParams(location.search).has('erintes');
  if (kenyszer || window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0) {
    erintesBekapcsol();
    document.body.classList.add('erintes');
  }

  // Ha jatek kozben allora fordul a telefon, szunetre allunk: ne fusson
  // tovabb a meccs egy apro, olvashatatlan kepen. Csak a fekvo->allo
  // atmenetnel, egyszer: a bongeszo sok resize-t kuld, nem valthatunk oda-vissza.
  let voltFekvo = fekvo();
  figyel(() => {
    const most = fekvo();
    if (voltFekvo && !most && jatekban()) fire('Space');
    voltFekvo = most;
    frissit();
  });
  frissit();
}
