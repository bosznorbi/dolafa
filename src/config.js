// Kozponti hangolo-fajl. Minden szam itt lakik, hogy egy helyen lehessen balanszolni.

export const W = 320;
export const H = 180;
export const STEP = 1 / 60;

export const CFG = {
  // kor es meccs
  roundTime: 16,        // mp, ennyi alatt zsugorodik a minimumra a palya
  suddenDeath: 4,       // utana nullara zarul, tehat a kor biztosan eldol
  roundsToWin: 3,       // best of 5: a korok rovidek, mert a fa azonnal ol
  countdown: 2.0,       // EGY visszaszamlalas: 2, 1, majd HAJRA
  roundEndTime: 1.6,    // rovid korveg-bejelentes, visszaszamlalas nelkul
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
  meleeMin: 6,          // a csapas ereje harang-eloszlassal sorsolodik
  meleeMax: 11,
  meleeKnock: 132,      // a megutott favago elrepul egy kicsit
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
      heal: 0.15, steal: 0.2,
    },
    ugyes: {
      react: 0.07, dodgeDelay: 0.02, previewAt: 0.9, lead: 1,
      jitter: 0, speedMul: 1.1, melee: true, idle: 0, drift: 0, heal: 1, steal: 1,
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
 * Harom famret. A meret egyszerre hatarozza meg:
 *   - mennyi eletet ad kivagva (veletlen a min-max kozott),
 *   - meddig er el dolesnel (a sprite magassaga),
 *   - mennyi ideig tart kivagni.
 * Enelkul a nagy fa mindenben jobb lenne, es sose ernek meg a kicsik.
 */
export const TREE_KINDS = [
  { name: 'kicsi',   w: 13, h: 22, healMin: 4, healMax: 8,  chopMul: 0.72 },
  { name: 'kozepes', w: 16, h: 30, healMin: 6, healMax: 10, chopMul: 1.00 },
  { name: 'nagy',    w: 20, h: 38, healMin: 8, healMax: 12, chopMul: 1.38 },
];

export const PAL = {
  grass:      ['#3f6b34', '#456f39', '#39602f', '#4a7a3c'],
  grassDark:  '#2f5228',
  bloom:      ['#d8d264', '#c9dce8', '#d9a0c0'],
  burnt:      ['#241d19', '#2c2420', '#1a1512', '#332a24'],
  ash:        '#4c433c',
  ember:      ['#8c3213', '#c25a1c', '#e88a2a'],
  fire:       ['#fff2b0', '#ffc23c', '#f2721c', '#c8300f', '#7d1607'],
  smoke:      ['#584c46', '#6b5f57', '#463c37'],
  wood:       '#6b4526',
  woodLight:  '#8a5c34',
  woodDark:   '#472c17',
  woodPale:   '#b98a52',
  charcoal:   '#241c19',
  charLight:  '#3a2e28',
  ui:         '#f2e2c2',
  uiDim:      '#8a7a62',
  uiShadow:   '#170f0a',
  heart:      '#e0452f',
  heartDark:  '#4a1d16',
};

/**
 * A valaszthato favagok. Mind kulon ember: mas ing, mas fejfedo, mas
 * arcszorzet es mas alaku fejsze. A menuben mindket oldal valaszt egyet,
 * es ugyanazt a kettot nem lehet.
 *
 *   hat     : cap | beanie | none | brim | bandana | usanka | headband | helmet
 *   beard   : full | mous | long | goatee | none | sideburns
 *   pattern : plaid | stripe | plain | dots | vstripe
 *   axe     : classic | wide | double | small | long | none
 *   legs    : pants | underwear
 *   body    : male | female   (a noi alak hosszu haju, keskenyebb torzsu)
 *   dog     : true eseten porazon vezetett kutya sétál mellette
 *   drinks  : true eseten fejsze helyett soroskorso es borospohar
 */
export const TEAM = [
  {
    name: 'PIROS', tint: '#e05a3c',
    hat: 'cap', beard: 'full', pattern: 'plaid', axe: 'classic', legs: 'pants',
    shirt: '#c8402f', shirtDark: '#8f2a1e', shirtDeep: '#6b1d15',
    cap: '#d8532f', capDark: '#8f3218',
    hair: '#7a4a24', beardCol: '#95612c', beardDark: '#6b4420',
    pants: '#39434f', pantsDark: '#262e37', boot: '#3a2a1c',
    skin: '#e8b48c', skinDark: '#c08a64',
  },
  {
    name: 'KÉK', tint: '#4d8fe0',
    hat: 'beanie', beard: 'mous', pattern: 'stripe', axe: 'wide', legs: 'pants',
    shirt: '#3a6fc4', shirtDark: '#27508c', shirtDeep: '#1b3a68',
    cap: '#2f6bd8', capDark: '#1d4490',
    hair: '#3e2c1c', beardCol: '#5d4630', beardDark: '#3f2f20',
    pants: '#3b3a45', pantsDark: '#28272f', boot: '#2f2620',
    skin: '#e0a87c', skinDark: '#b8815a',
  },
  {
    name: 'ZÖLD', tint: '#5cc45a',
    hat: 'none', beard: 'long', pattern: 'plain', axe: 'double', legs: 'pants',
    dog: true,
    shirt: '#3f9a3c', shirtDark: '#2a6b28', shirtDeep: '#1c4a1b',
    cap: '#48b045', capDark: '#2c6f2a',
    hair: '#2e2014', beardCol: '#3e2c18', beardDark: '#2a1d10',
    pants: '#3c4238', pantsDark: '#282d26', boot: '#33291d',
    skin: '#7a5232', skinDark: '#57381f',
  },
  {
    name: 'SÁRGA', tint: '#e8c445',
    hat: 'brim', beard: 'goatee', pattern: 'plaid', axe: 'small', legs: 'pants',
    shirt: '#d8a828', shirtDark: '#9c761a', shirtDeep: '#6e5312',
    cap: '#e8bc3c', capDark: '#9c7a1e',
    hair: '#4a3418', beardCol: '#6b4c22', beardDark: '#4a3417',
    pants: '#454034', pantsDark: '#2e2a22', boot: '#372c1e',
    skin: '#f0c096', skinDark: '#c4936a',
  },
  {
    name: 'LILA', tint: '#a874e0',
    hat: 'bandana', beard: 'none', pattern: 'dots', axe: 'long', legs: 'pants',
    body: 'female',
    shirt: '#8a4ac0', shirtDark: '#5f3288', shirtDeep: '#42225f',
    cap: '#b060e0', capDark: '#6f3a9c',
    hair: '#f0d878', hairDark: '#c8a83c', beardCol: '#4a3a4a', beardDark: '#332635',
    pants: '#3a3448', pantsDark: '#282334', boot: '#2c2430',
    skin: '#d8a884', skinDark: '#b0805e',
  },
  {
    name: 'FEKETE', tint: '#8e8e9a',
    hat: 'usanka', beard: 'full', pattern: 'vstripe', axe: 'double', legs: 'pants',
    shirt: '#33333c', shirtDark: '#1f1f26', shirtDeep: '#141419',
    cap: '#44444e', capDark: '#26262e',
    hair: '#1a1a1f', beardCol: '#2e2e36', beardDark: '#1a1a20',
    pants: '#26262e', pantsDark: '#17171c', boot: '#101014',
    skin: '#8a5f3f', skinDark: '#6b472d',
  },
  {
    name: 'FEHÉR', tint: '#f0ece4',
    hat: 'headband', beard: 'mous', pattern: 'plain', axe: 'wide', legs: 'pants',
    shirt: '#e4e0d6', shirtDark: '#b4b0a6', shirtDeep: '#8e8a80',
    cap: '#f4f0e8', capDark: '#b8b4aa',
    hair: '#d8d2c4', beardCol: '#e8e4d8', beardDark: '#b4b0a4',
    pants: '#8e8a82', pantsDark: '#66635c', boot: '#4a4842',
    skin: '#f0cfae', skinDark: '#c8a382',
  },
  {
    name: 'PINK', tint: '#f08ab8',
    hat: 'cap', beard: 'sideburns', pattern: 'dots', axe: 'small', legs: 'pants',
    shirt: '#e878a8', shirtDark: '#b0507c', shirtDeep: '#7f3557',
    cap: '#f490bc', capDark: '#b25a86',
    hair: '#8a4a3a', beardCol: '#a05c48', beardDark: '#743e30',
    pants: '#5a4450', pantsDark: '#3e2e38', boot: '#33262e',
    skin: '#f4c4a4', skinDark: '#cc9a7a',
  },
  {
    name: 'BARNA', tint: '#b0824c',
    hat: 'none', beard: 'long', pattern: 'plain', axe: 'classic', legs: 'underwear',
    shirt: '#8a5c34', shirtDark: '#5f3e22', shirtDeep: '#432b17',
    cap: '#9a6a3c', capDark: '#68482a',
    hair: '#4a3218', beardCol: '#6b4a24', beardDark: '#4a3318',
    pants: '#e4dcc8', pantsDark: '#b8ae98', boot: '#3a2c1e',
    skin: '#dfab80', skinDark: '#b28460',
  },
  {
    name: 'SZÜRKE', tint: '#a8aeb6',
    hat: 'helmet', beard: 'none', pattern: 'vstripe', axe: 'long', legs: 'pants',
    body: 'female',
    shirt: '#8a9098', shirtDark: '#5e646c', shirtDeep: '#42474e',
    cap: '#c0c6ce', capDark: '#7e848c',
    hair: '#7a4a24', hairDark: '#553318', beardCol: '#6a6a72', beardDark: '#48484f',
    pants: '#4e525a', pantsDark: '#35383e', boot: '#2a2c31',
    skin: '#d8a880', skinDark: '#ae8160',
  },
  {
    name: 'NARANCS', tint: '#f0902c',
    hat: 'brim', beard: 'mous', pattern: 'stripe', axe: 'none', legs: 'pants',
    drinks: true,
    shirt: '#e0762a', shirtDark: '#a8521a', shirtDeep: '#78390f',
    cap: '#f0902c', capDark: '#a85c18',
    hair: '#6b3f1c', beardCol: '#8a5426', beardDark: '#5f3a19',
    pants: '#4a3b30', pantsDark: '#332821', boot: '#2e241c',
    skin: '#f0c49a', skinDark: '#c4996f',
  },
];

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
