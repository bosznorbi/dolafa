// Kozponti hangolo-fajl. Minden szam itt lakik, hogy egy helyen lehessen balanszolni.

import { THEMES } from './themes.js';

export const W = 320;
export const H = 180;
export const STEP = 1 / 60;

export const CFG = {
  // kor es meccs
  roundTime: 16,        // mp, ennyi alatt zsugorodik a minimumra a palya
  suddenDeath: 4,       // utana nullara zarul, tehat a kor biztosan eldol
  roundsToWin: 3,       // best of 5: a korok rovidek, mert a fa azonnal ol
  countdown: 2.0,       // EGY visszaszamlalas: 2, 1, majd HAJRA
  roundEndTime: 1.6,
  endlessWait: 4.0,     // SHIFT+R utan ennyit var a kovetkezo meccs elott

  /**
   * Palyankenti EXTRA MECHANIKAK. Az alapszabalyok mindenhol azonosak, ez
   * mind csak ra epul, es a temahoz illik. A 0. palya (erdo) szandekosan
   * nem kap semmit: az a tiszta alapjatek.
   */
  mech: {
    // domino: a kidolt lap donti a kovetkezot.
    //   reach  meddig er el a lap CSUCSA elott
    //   width  milyen szelesen sopor: ez a lenyeg, mert szeles savval minden
    //          iranyba szetterjed a lanc, es egy csapasra osszedol az egesz palya
    chain: { reach: 11, width: 10, maxLinks: 16 },
    // temeto: megkondul a harang, es sotetbe borul a palya. A jatekosok
    // korul marad egy kis feny, a sirkovek viszont szinte eltunnek.
    //   first  az elso kondulas a kor kezdetetol
    //   every  utana ennyinkent szolal meg
    //   dark   meddig tart a sotetseg
    //   fade   be- es kifakulas hossza
    //   fadeIn   a sotetedes LASSU: a harangszora azonnal indul, de csak
    //            ennyi ido alatt er el a teljes sotetig
    //   fadeOut  a kivilagosodas viszont gyors
    //   swing    meddig leng a harang a toronyban
    bell: {
      first: 1.8, every: 4.6, dark: 3.6, fadeIn: 0.95, fadeOut: 0.3,
      halo: 26, swing: 1.4,
      // Sotetben nagyobbat ut a fejsze: vakon egymasnak menni kockazatosabb.
      dmgBonus: 3,
    },
    // sivatag: FOLYAMATOSAN vonulnak at a szellokesek a palyan. Mindig van
    // belolük harom-negy, mindegyik lathato, es elteriti, aki utjaba kerul.
    // sivatag: EGYESEVEL indulnak a szellokesek, adott idokozonkent, tehat
    // folyamatosan jon szel valahonnan. Harom meretosztaly van: a nagyobb
    // szelesebb, gyorsabb es sokkal erosebben sodor.
    // A lokés az ellokes-gyorsulasra rakodik, amit a jatek exp(-9*dt)-vel
    // csillapit. Emiatt a tenyleges sodras nagyjabol push/9 pixel/masodperc:
    // 1100 -> ~122, 1900 -> ~211, 2800 -> ~311. A favago sajat sebessege 84,
    // tehat a kicsi szel ellen meg lehet kuzdeni, a nagy viszont elviszi.
    gust: { interval: 1.5, life: 4.6, sizes: [
      { w: 9, speed: 96, push: 1100 },
      { w: 15, speed: 78, push: 1900 },
      { w: 23, speed: 62, push: 2800 },
    ] },
    // jeg: NAGYON csuszos. Lassan gyorsul, es elengedve sokaig viszi a lendulet.
    slip: { accel: 0.2, friction: 0.075 },
    shock: { radius: 46, push: 150 },        // ur: lokeshullam kidonteskor
    // aztekok: aki totemet dont, isteni atkot bocsat a masikra. A sebzes
    // harang-eloszlasu, tehat nem mindig ugyanannyi.
    // Az atok ereje a TAMADOTOL fugg, ugyanugy, mint a fejszecsapase.
    curse: { min: 1, max: 5, benaMin: 1, benaMax: 3 },
    sugar: { life: 2.2, boost: 1.42 },       // cukorka: cukorroham
    // ur: a kidolt kristaly lassan elmerul a talajban, es utana at lehet
    // setalni rajta. Rovid ideig akadaly, aztan mar nem.
    // ur: a kidolt kristaly darabokra torik, es a szilankok GYORSAN elmerulnek.
    // Osszesen kb. harom tized masodperc, utana mar at lehet setalni rajta.
    sink: { delay: 0.1, dive: 0.2 },
    // jeg: ahova oszlop dolt, ott megreped a jeg. Aki tul sokaig all rajta,
    // beszakad alatta. A repedes idovel befagy.
    crack: { life: 7, radius: 12, stand: 1.3 },
    // cukorka: a kidolt nyaloka helyen szirup-tocsa marad. Aki belelep,
    // lelassul, ES nem lehet ellokni: beleragad.
    // cukorka: a kidolt nyaloka AZONNAL cukortocsava olvad. Nem akadaly,
    // at lehet menni rajta, de ragad: jóval lassabban.
    // BEGYUJTAS (tuzijatek). EGYETLEN sav van, es az MINDIG NO - ugyanugy,
    // mint minden mas palyan. Csak a szine mas aszerint, ki tolti eppen:
    //
    //   SARGA  a favago vagja: ha igy telik be, a raketa KIDOL (teljes ertek)
    //   PIROS  magara hagytak, eg a kanoc: ha igy telik be, KILO (par pont)
    //
    // Aki elkezdi es otthagyja, tehat nem nullaról folytatja, amikor
    // visszamegy: a raketa kozben "magat vagta" tovabb. Ez a csavar lelke.
    fuse: {
      burn: 2.2,        // ennyi ido alatt tolti fel MAGAT a kanoc nullarol
      fly: 0.9,         // meddig tart a felszallas
      rise: 210,        // milyen gyorsan emelkedik (px/s)
      // A kilott raketaert csak par pont jar, meret szerint. Kivagni tehat
      // sokkal jobban megeri (4-12), de gyujtogatni is van ertelme.
      heal: [[1, 2], [1, 2], [2, 3]],
    },
    // FORGOSZARNY (szelmalom): a kidolt malom vitorlaja tovabb forog a
    // foldon. Az oszlopon at lehet lepni, a forgo vegen viszont nem.
    blades: {
      life: 11,         // meddig porog, mielott leall
      slow: 2.2,        // az utolso masodpercekben mar csak lassul
      cool: 0.45,       // ennyit var, mielott ugyanazt megint megpocköli
      spin: 3.4,        // alap forgassebesseg (rad/s)
      // A SEBZO sugar nagyobb, mint a rajzolt lapat: a forgo szarny szele
      // korbe-korbe jar, tehat a kornyeke is veszelyes. Enelkul alig lehetett
      // beleszaladni, es epp az veszett el, amitol csavar.
      hitGrow: 4,
      hitSquash: 1.15,  // fuggolegesen alig lapitott: majdnem kor a zona
      // meret szerint: kicsi, kozepes, nagy
      radius: [11, 14, 17],
      push: [380, 500, 650],
      dmg: [[1, 2], [1, 3], [2, 3]],
    },
    sticky: { life: 9, radius: 12, slow: 0.28, spots: 3 },
  },    // rovid korveg-bejelentes, visszaszamlalas nelkul
  matchEndFx: 1.6,      // a nagy gyozelmi animacio felfutasa
  // Zarokep: a gyoztes befut a menedekbe, es becsapodik mogotte az ajto.
  // A zarokep a MEGLEVO tuzfrontot huzza ossze a menedek koré.
  outro: { run: 1.25, door: 0.3, total: 3.2, endScale: 0.30, ryMul: 1.75, seedShrink: 0.09 },
  squashTime: 0.6,      // a fa alatt kilapult favago animacioja

  // jatekos
  maxHp: 100,           // 5 sziv, egy sziv 20%
  startHp: 70,          // 3.5 szivvel indulunk: van hova feltoltodni
  hearts: 5,
  speed: 84,            // px/mp
  accel: 900,
  friction: 1400,
  fireDrain: 26,        // eletpont / masodperc a tuzben
  idleDrain: 3.0,       // tuzon kivul is fogy: a favagas nem opcio, hanem kotelezo
  // A fak gyogyitasa merettol fugg, lasd TREE_KINDS.
  // A dolo fa AZONNAL ol, ezert nincs se sebezhetetlenseg, se lokes.

  // Fejszeparbaj: oldalrol vagy hatulrol lehet utni. Szembe allva mindketten
  // haritanak, tehat senki nem sebzodik.
  meleeRange: 14,
  meleeRate: 0.4,       // egy csapas ennyi idonkent
  // Ha a csapas TALALT, jon ra meg egy kis pihenő. Enelkul, aki egyszer
  // odaert a masikhoz, egyfolytaban kalapalhatta - a botok kulonosen. Igy
  // a kozelharc marad, csak nem lehet vegtelen sorozatot verni belole.
  meleeHitCd: 0.25,
  // A csapas ereje harang-eloszlassal sorsolodik. Ez az EMBER jatekos savja;
  // a botoknak sajat savjuk van (lasd CFG.bot), a bena gyengebben üt.
  meleeMin: 2,
  meleeMax: 8,
  // Az ellokes a sebzes ELLENTETE: a suru, gyenge csapasok messzire penderitik
  // a masikat (van ideje menekulni), a ritka, nagy csapas viszont helyben
  // tartja, tehat kovetheto a tamadassal. Igy a kis sebzes sem hatastalan.
  meleeKnockLight: 178, // a legkisebb sebzesnel ennyi
  meleeKnockHeavy: 84,  // a legnagyobbnal ennyi
  meleeSpread: 0.39,    // +/- 22.5 fok szoras, hogy ne legyen kiszamithato
  meleeCone: 0.42,      // ennel nagyobb skalarszorzat szamit "szembenezesnek"
  fleeRange: 20,        // ezen belul indul a menekulo-gyorsitas
  fleeBoost: 1.26,      // aki elfele fut, atmenetileg ennyivel gyorsabb
  fleeEase: 7,          // milyen gyorsan fut fel es le a gyorsitas

  // fa
  treeCount: 46,       // ebbol a ket tuzfront szurese utan kb. 26 marad
  chopTime: 0.85,       // teljes kivagas folyamatos erinkezessel
  chopDecay: 0.05,      // magatol visszaall, nagyon lassan
  chopReach: 4,         // ennyivel tagitjuk a jatekos dobozat vagashoz
  chopHold: 0.18,       // ennyi ideig marad a fa a vagoje, ha elengedi
  fallTime: 0.38,       // ennyi ido alatt er foldet, ez a kiteresi ablak
  hitWidth: 16,         // a dolo torzs sebzo savjanak szelessege
  crownSize: 22,        // a korona sebzo negyzete a fa vegen
  burnTime: 1.1,        // tuzbe kerult fa ennyi ido alatt eg el
  persp: 0.85,          // 3/4 nezet rovidules fel/le dolesnel

  // arena es tuz
  // A jatekter egy ellipszis, a tuz hatara ezen belul szabalytalan folt.
  field: { cx: 160, cy: 99, rx: 150, ry: 72 },
  // A kulso tuzfront kivulrol befele zsugorodik.
  fireShape: {
    min: 0.66,          // kulso profil also hatara (1.0 = szabalyos ellipszis)
    outStart: 1.0, outEnd: 0.60,
  },
  /**
   * Tuzfeszkek. A kor elejen NINCS tuz a palyan belul. Par masodperc utan
   * megjelennek a feszkek es kifele terjednek, igy a biztonsagos terulet
   * szabalytalan szigetekre esik szet, nem egy kiszamithato gyuruve.
   * Parban szuletnek, egymas tukorkepekent: a HELYUK igy fair, az ALAKJUK
   * viszont kulon-kulon veletlen, tehat nem nez ki szimmetrikusnak.
   */
  fireSeeds: {
    firstAt: 5.0,       // az elso par ennyi masodperc utan gyullad
    interval: 4.2,      // utana ennyinkent jon a kovetkezo par
    maxPairs: 3,
    growth: 0.052,      // normalizalt sugar / masodperc
    startR: 0.015,
    minPlayerDist: 34,  // ne gyulladjon ki senki talpa alatt
    profMin: 0.45,      // mennyire csipkezett egy feszek
  },

  shrinkEase: 1.35,     // 1 = linearis, >1 = eleinte lassabb

  // bot
  /**
   * Ket robot-szint. Az alapok MINDKETTONEL ugyanazok: sose lepnek tuzbe,
   * vagnak fat, es probalnak eletben maradni. A kulonbseg a pontossagban van.
   *
   * react      celvalasztas gyakorisaga
   * dodgeDelay ennyi ido utan veszi eszre a MAR DOLO fat (a doles 0.38 mp)
   * previewAt  ekkora vagas-allasnal lep ki az elorejelzett arnyekbol (2 = soha)
   * lead       mennyire szamol az ellenfel MOZGASAVAL, amikor celoz (0 = sehogy)
   * jitter     celzasi pontatlansag
   * speedMul   mozgasi sebesseg
   * melee      hasznalja-e a fejszet a masik favagora
   * drift      mekkora veletlen szogeltérés a mozgas iranyaban (radian)
   * heal       mennyire figyel arra, hogy alacsony eletnel nagy fat valasszon
   * steal      mennyire ertekeli a MAR FELIG kivagott fat (elorzas)
   */
  bot: {
    bena: {
      // Bena, de NEM all meg: folyamatosan mozog, csak rosszul. A hibat a
      // lassu reakcio, a pontatlan celzas es a sodrodo irany adja.
      react: 1.35, dodgeDelay: 0.42, previewAt: 2, lead: 0,
      jitter: 42, speedMul: 0.62, melee: false, idle: 0, drift: 0.85,
      meleeCommit: 1.2, meleeBackoff: 1.2,
      heal: 0.15, steal: 0.2,
      // Gyengebben is üt: a fejszecsapasa 1-6, nem 2-8.
      meleeMin: 1, meleeMax: 6,
    },
    ugyes: {
      react: 0.07, dodgeDelay: 0.02, previewAt: 0.9, lead: 1,
      jitter: 0, speedMul: 1.1, melee: true, idle: 0, drift: 0, heal: 1, steal: 1,
      // Mennyi ideig tarthat EGY roham, es utana mennyit pihen. Enelkul a
      // robot rarragadt a masikra, amig az nem fordult szembe vele - es
      // kozben folyamatosan utott. Igy is tamad, csak ki lehet szakadni.
      meleeCommit: 1.1, meleeBackoff: 1.4,
      meleeMin: 2, meleeMax: 8,
    },
  },

  /**
   * Ot napszak, koronkent egy. Mindig sorban jon, fuggetlenul az allastol:
   * ha 2-0-nal ver veget a meccs, akkor a naplementenel all meg.
   *
   * Ket kulon retegben szinezunk:
   *   ground = a hatter, ez sotetedik erosen,
   *   world  = a szereplok folott, ez enyhe, hogy a favagok lathatoak legyenek.
   *
   * A dekoracio nem csak disz: attol, hogy VALTOZIK, ki van kint, a jatekos
   * erzi, hogy telik az ido. Fazisonkent legfeljebb hat mozgo elolény,
   * kulonben elveszne a lenyeg a kepen.
   */
  phases: [
    {
      name: 'NAPFELKELTE', c: [255, 196, 150], ground: 0.17, world: 0.05,
      statics: { flowers: 28 },
      actors: { butterflies: 5, birds: 3 },
      glow: { fireflies: 0, embers: 0 },
    },
    {
      name: 'DÉLELŐTT', c: [255, 248, 224], ground: 0.02, world: 0.00,
      statics: { flowers: 30 },
      actors: { birds: 2, bunnies: 4, squirrels: 3 },
      glow: { fireflies: 0, embers: 0 },
    },
    {
      name: 'NAPLEMENTE', c: [255, 148, 74], ground: 0.19, world: 0.06,
      statics: { flowers: 14, mushrooms: 12 },
      actors: { bats: 3, wolves: 2, squirrels: 2 },
      glow: { fireflies: 8, embers: 0, haze: 0.5 },
    },
    {
      name: 'SÖTÉTEDÉS', c: [84, 70, 142], ground: 0.37, world: 0.11,
      statics: { mushrooms: 18, rocks: 10, cobwebs: 7 },
      actors: { wolves: 3, bats: 3, owls: 1 },
      glow: { fireflies: 20, embers: 0, haze: 0.3 },
    },
    {
      name: 'MÉLY ÉJSZAKA', c: [22, 30, 80], ground: 0.56, world: 0.16,
      statics: { mushrooms: 14, rocks: 12, cobwebs: 9 },
      actors: { bears: 1, owls: 1 },
      glow: { fireflies: 24, embers: 30, moonrim: 1 },
    },
  ],

  decorSpeed: 15,       // nyuszi/farkas alap sebesseg px/mp
};

/**
 * TEMA-FUGGO ADATOK.
 *
 * Ezek a tombok/objektumok HELYBEN toltodnek fel a valasztott temabol.
 * Azert helyben, mert a tobbi modul mar importalta oket: ha ujra
 * ertekadnank, azok a regi peldanyt latnak tovabb.
 *
 *   TREE_KINDS  harom meret abbol, amit vagni lehet (fa, sirko, obeliszk...)
 *   TEAM        a valaszthato szereplok
 *   PAL         a paletta
 */
export const TREE_KINDS = [];
export const TEAM = [];
export const PAL = {};

/** Temafuggetlen szinek: ezek minden temaban ugyanazok. */
const PAL_BASE = {
  wood: '#6b4526',
  woodLight: '#8a5c34',
  woodDark: '#472c17',
  woodPale: '#b98a52',
  charcoal: '#241c19',
  charLight: '#3a2e28',
  ui: '#f2e2c2',
  uiDim: '#8a7a62',
  uiShadow: '#170f0a',
  heart: '#e0452f',
  heartDark: '#4a1d16',
};

// z: varazsmodban vagyunk-e. Az erdo fai csak ilyenkor kapnak valtozatosabb
// format, hogy a v1-bol ismert alapjatek pontosan ugyanugy nezzen ki.
export const CURRENT = { theme: null, index: 0, z: false };

export function applyTheme(theme, index) {
  CURRENT.theme = theme;
  CURRENT.index = index || 0;
  TREE_KINDS.length = 0;
  TREE_KINDS.push(...theme.trees);
  TEAM.length = 0;
  TEAM.push(...theme.chars);
  for (const k of Object.keys(PAL)) delete PAL[k];
  Object.assign(PAL, PAL_BASE, theme.pal);
}

export const DIRS = {
  up:    [0, -1],
  down:  [0, 1],
  left:  [-1, 0],
  right: [1, 0],
};

// Kis determinisztikus RNG, hogy a palya tukrozheto es reprodukalhato legyen.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Harang alaku eloszlas 0 es 1 kozott: harom egyenletes szam atlaga.
 * Igy a kozepso ertekek gyakoriak, a szelsosegek ritkak, es nem kell
 * Gauss-mintavetelt irni hozza.
 */
export function bell(rnd) {
  const r = rnd || Math.random;
  return (r() + r() + r()) / 3;
}

export function bellRange(lo, hi, rnd) {
  return lo + bell(rnd) * (hi - lo);
}

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;

// Alapertelmezes: a 0. tema (erdo). Azert ITT hivjuk, mert a tobbi modul
// mar a betolteskor olvassa a TEAM-et es a TREE_KINDS-ot.
applyTheme(THEMES[0], 0);

// ---------------------------------------------------------------- nezet

/*
 * OLDALSO HASABOK.
 *
 * A jatekter mindig pontosan 320x180 marad: a palya merete, a szereplok
 * sebessege es minden arany ehhez van hangolva, ezt nyujtani nem szabad.
 * A mai kepernyok viszont szelesebbek 16:9-nel (egy fekvo telefon kozel
 * 2.6:1), es ott eddig ket fekete hasab maradt a szelen.
 *
 * Ezt ugy toltjuk ki, hogy a VASZON lesz szelesebb, nem a jatek: a rajzolo
 * eltolt koordinatarendszerben dolgozik, tehat a jatekter tovabbra is a
 * 0..W savban van, a ket hasab pedig a -ox..0 es a W..W+ox savban. Oda a
 * vilag folytatasa kerul (talaj, sziluettek, langok, szinezesek), jatekbeli
 * esemeny viszont soha: a meccs a kozepso savban dol el.
 *
 * NEZET.ox a hasab szelessege vilag-pixelben, NEZET.w a teljes szelesseg.
 * A resize() allitja, minden mas csak olvassa.
 */
export const MAX_OX = 90;                  // eddig toltunk ki, kb. 2.78:1
export const NEZET = { ox: 0, w: W };

/** A teljes lathato sav (a hasabokkal egyutt) egy vizszintes csikja. */
export function teljesSav(c, y = 0, h = H) {
  c.fillRect(-NEZET.ox, y, NEZET.w, h);
}

/**
 * Egy W szeles hatterkep folytatasa a hasabokba. A masolat TUKROZOTT, ezert
 * a jatekter szelen nincs varrat: a hasab elso pixeloszlopa ugyanaz, mint a
 * jatekter utolso oszlopa. Ismetles helyett ez az egyetlen mod, amivel egy
 * nem csempezheto textura eszrevetlenul folytathato.
 */
export function hasabTukor(c, kep) {
  const ox = NEZET.ox;
  if (ox <= 0 || !kep) return;
  c.save();
  c.scale(-1, 1);                          // vilag x = -helyi x
  c.drawImage(kep, 0, 0, ox, H, 0, 0, ox, H);
  c.restore();
  c.save();
  c.translate(W * 2, 0);
  c.scale(-1, 1);                          // vilag x = 2W - helyi x
  c.drawImage(kep, W - ox, 0, ox, H, W - ox, 0, ox, H);
  c.restore();
}

/**
 * Hanyszor kell megismetelni egy W szelessegben elosztott diszlet-sort, hogy
 * a hasabokat is kitoltse. A hivo -tobb .. n+tobb kozott lepked.
 */
export function hasabTobblet(koz) {
  return NEZET.ox > 0 ? Math.ceil(NEZET.ox / koz) + 1 : 0;
}

/** Negativra is helyes maradek: a hasabokban az index negativ lehet. */
export function korbe(i, n) {
  return ((i % n) + n) % n;
}
