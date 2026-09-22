// Palyankenti EXTRA MECHANIKAK.
//
// Az alapszabalyok minden vilagban ugyanazok: valami magasat vagsz, az toled
// elfele dol es azonnal ol, kozben egy zarulo veszely szorit. Ez a fajl AZ,
// ami ezen felul minden palyanak sajat izt ad. A 0. palya (erdo) szandekosan
// nem kap semmit: az a tiszta alapjatek, amihez a tobbit merni lehet.
//
//   chain  domino    a kidolt lap MAGA donti a kovetkezot: lancreakcio
//   bell   temeto    megkondul a harang, es sotetbe borul a palya
//   gust   sivatag   idonkent vegigsopor egy szellokes, es elsodor mindenkit
//   slip   jegmezo   a talaj csuszik: lassan gyorsul, sokaig kicsuszik
//   shock  ur        a kidontott kristaly lokeshullamot kuld szet
//   curse  aztekok   totem kidontesekor VILLAMCSAPAS sujtja a masikat
//   gust   sivatag   folyamatosan vonulo, lathato szellokesek terelnek el
//   sugar  cukorka   a vagas cukorrohamot ad: rovid ideig gyorsabb vagy
//   fuse   tuzijatek a felig vagott raketa BEGYULLAD, es ha otthagyod, elszall
//   blades szelmalom a kidolt malom vitorlaja tovabb forog, es elpockol

import { CFG, CURRENT, clamp, bellRange } from './config.js';
import { startFall, treeLen, inHitZone } from './trees.js';
import { damage, kill } from './player.js';

/** A palya mechanikai. Egy vilagnak tobb is lehet. */
export function mechList() {
  const m = CURRENT.theme && CURRENT.theme.mech;
  if (!m) return [];
  return Array.isArray(m) ? m : [m];
}

export function hasMech(name) {
  return mechList().indexOf(name) >= 0;
}

/** Visszafele kompatibilis: az elso mechanika neve. */
export function mechOf() {
  return mechList()[0] || null;
}

function cfg(name) {
  return CFG.mech[name];
}

/** Uj kor: minden foltot es idozitot nullazunk. */
export function resetMech(g) {
  g.spots = [];
  g.gusts = [];
  g.gustT = 0.6;                 // az elso lokés hamar megerkezik
  g.bellT = cfg('bell').first;
  g.darkT = 0;
  g.bellSwing = 0;
  g.bladeT = 0;                  // a forgo vitorlak kozos szogallasa
}

/**
 * Egy uj szellokes a palya szelerol. Vizszinteshez kozeli iranyt kap, hogy
 * hosszan vonuljon at a 320 pixel szeles kepen, ne a rovid oldalt szelje at.
 */
function spawnGust() {
  const k = cfg('gust');
  const ang = (Math.random() < 0.5 ? 0 : Math.PI) + (Math.random() * 2 - 1) * 0.45;
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const f = CFG.field;
  const size = (Math.random() * k.sizes.length) | 0;
  const sz = k.sizes[size];
  return {
    x: f.cx - dx * (f.rx + 28),
    y: f.cy + (Math.random() * 2 - 1) * f.ry * 0.9 - dy * 20,
    dx,
    dy,
    t: 0,
    life: k.life,
    size,
    w: sz.w,
    speed: sz.speed,
    push: sz.push,
    seed: Math.random() * 100,
  };
}

// ---------------------------------------------------------------- lancreakcio

/**
 * A kidolt dominolap eldonti azokat, amikre rador. A dolesirany az UTKOZO
 * lap tovetol az eltalalt lap tovehez mutat, tehat a hullam kifele terjed,
 * es kanyarodni is tud, ahogy egy igazi dominosornal.
 *
 * A lanc mindig az EREDETI vago nevehez irodik: ove a gyogyulas, es rajta
 * nem is fog a sajat lanca (ugyanaz a szabaly, mint egy sima fanal).
 */
export function chainFrom(t, trees) {
  const k = cfg('chain');
  const out = [];
  const L = treeLen(t);
  const dx = Math.cos(t.fallAngle);
  const dy = Math.sin(t.fallAngle);

  for (const o of trees) {
    if (o === t || o.gone || o.burning || o.state !== 'standing') continue;
    // A torzs teljes hosszaban keresunk: az eltalalt lapot a tovenel nezzuk.
    const ax = o.x - t.x;
    const ay = o.y - t.y;
    const along = ax * dx + ay * dy;
    const perp = -ax * dy + ay * dx;
    if (along < 2 || along > L + k.reach) continue;
    if (Math.abs(perp) > k.width) continue;
    out.push(o);
  }
  return out;
}

/**
 * Egy foldet ert lap utan inditja a lanc KOVETKEZO GYURUJET - es csak azt.
 *
 * Korabban egy hivas vegigfuttatta az egesz lancot ugyanabban a kepkockaban,
 * es igy a tizennegy "+N" is egyszerre villant fel. Most csak a kozvetlen
 * szomszedok indulnak el; azok a sajat foldet eresukkor hivjak megint ezt,
 * tehat a hullam VEGIGFUT a soron, es a pontok szepen sorban jelennek meg.
 *
 * @returns a most eldontott lapok
 */
export function runChain(t, g, hooks) {
  const started = [];
  const depth = (t.chainDepth || 0) + 1;
  for (const o of chainFrom(t, g.trees)) {
    if (o.state !== 'standing') continue;
    const ang = Math.atan2(o.y - t.y, o.x - t.x);
    o.chainedBy = t.feller;
    o.chained = true;                     // a hook ebbol tudja, hogy ez lancszem
    o.chainDepth = depth;                 // hanyadik lap a sorban: ennyivel er kevesebbet
    const feller = t.feller >= 0 ? g.players[t.feller] : null;
    startFall(o, ang, hooks, feller);
    started.push(o);
  }
  return started;
}

// ---------------------------------------------------------------- foltok

/**
 * Foltok a talajon: kisertetjaras, inda, cukorpor. Mindegyik ugyanaz a
 * szerkezet, csak mas a hatasa, tehat egy helyen lehet leptetni oket.
 */
function addSpot(g, kind, x, y, life, owner, extra) {
  const s = { kind, x, y, t: 0, life, owner: owner === undefined ? -1 : owner };
  if (extra) Object.assign(s, extra);
  g.spots.push(s);
}

/** Kidolt oszlop: a temahoz tartozo folt keletkezik a helyen. */
export function onTreeDown(t, g) {
  if (hasMech('crack')) {
    // A jegen a kidolt oszlop helyen megreped a jeg. A repedes a torzs
    // KOZEPEN nyilik, tehat pont ott, ahol atmenne rajta az ember.
    const dx = Math.cos(t.fallAngle);
    const dy = Math.sin(t.fallAngle);
    const L = treeLen(t) * 0.5;
    addSpot(g, 'crack', t.x + dx * L, t.y + dy * L, cfg('crack').life, -1);
  }
  if (hasMech('blades')) {
    // A kidolt malom TORZSEN at lehet lepni: az mar csak egy fekvo oszlop.
    // A vege viszont tovabb porog, es aki belefut, azt elpocköli.
    const k = cfg('blades');
    const dx = Math.cos(t.fallAngle);
    const dy = Math.sin(t.fallAngle);
    const L = treeLen(t) * 0.86;
    addSpot(g, 'blades', t.x + dx * L, t.y + dy * L, k.life, -1, {
      variant: t.variant, size: t.variant % 3, phase: (t.x + t.y) * 0.37,
    });
    // A RAJZOLAS a fahoz tartozik, nem a folthoz: igy a porgo vitorla a
    // kidolt torony FOLE kerul a festo-algoritmusban, nem ala.
    t.bladeSpot = g.spots[g.spots.length - 1];
    t.sunk = true;
  }
  if (hasMech('sink')) t.sinkT = 0;          // innentol sullyed a kristaly
  if (hasMech('sticky')) {
    // A kidolt nyaloka AZONNAL cukortocsava olvad: nem akadaly tobbe, de a
    // teljes hosszaban ragad. Tobb foltot teszunk le a torzs menten, hogy a
    // tocsa tenyleg ott legyen, ahova a nyaloka dolt.
    const k = cfg('sticky');
    const dx = Math.cos(t.fallAngle);
    const dy = Math.sin(t.fallAngle);
    const L = treeLen(t);
    for (let i = 0; i < k.spots; i++) {
      const d = L * (0.3 + (i / Math.max(1, k.spots - 1)) * 0.65);
      // A tocsa annak a nyalokanak a SZINET viszi, amelyik szetloccsant.
      addSpot(g, 'sticky', t.x + dx * d, t.y + dy * d, k.life, -1,
        { variant: t.variant, seed: i * 7 + (t.x | 0) });
    }
    t.sunk = true;                       // azonnal at lehet menni rajta
  }
}

/** Kidontes pillanata: atok, lokeshullam, cukorroham. */
export function onFell(t, feller, g) {
  if (hasMech('curse') && feller) {
    // Aztek atok: aki totemet dont, villamot hiv a masikra. A sebzes a
    // TAMADOTOL fugg, ugyanugy, mint a fejszecsapase: a bena bot gyengebb.
    const k = cfg('curse');
    const bena = feller.isBot && feller.difficulty === 'bena';
    const lo = bena ? k.benaMin : k.min;
    const hi = bena ? k.benaMax : k.max;
    const foe = g.players[1 - feller.index];
    // Az istenek nem mindig celoznak jol: fele esellyel a masikba csap a
    // villam, fele esellyel valahova a palya szelere. A melle csapo villam
    // nem sebez, es csak halvany jelzes marad belole.
    //
    // Az 50% viszont NEM vak ermefeldobas: minel tobbszor jott ki egymas utan
    // ugyanaz, annal kisebb az eselye, hogy megint az jojjon.
    //
    //   meg nincs elozmeny  50 / 50
    //   1 azonos zsinorban  40 / 60   (a masik javara)
    //   2 azonos            30 / 70
    //   3 azonos            20 / 80
    //   4 azonos            10 / 90
    //   5 azonos             0 / 100  (a hatodik biztosan valt)
    //
    // Igy hosszan nem ragadhat be sem a folyamatos talalat, sem a sorozatos
    // melletrafas, de a rovid tavu veletlen megmarad.
    const repeatP = Math.max(0, 0.5 - 0.1 * (g.curseStreak || 0));
    let strike;
    if (g.curseLast === null || g.curseLast === undefined) strike = Math.random() < 0.5;
    else strike = Math.random() < repeatP ? g.curseLast : !g.curseLast;
    if (foe && foe.alive) {
      g.curseStreak = strike === g.curseLast ? (g.curseStreak || 0) + 1 : 1;
      g.curseLast = strike;
    }
    if (foe && foe.alive && strike) {
      const dmg = Math.round(bellRange(lo, hi));
      const died = damage(foe, dmg, 'atok');
      return { text: 'ÁTOK!', curse: { p: foe, dmg, died } };
    }
    const f = CFG.field;
    const ang = Math.random() * Math.PI * 2;
    return {
      text: null,
      miss: {
        x: f.cx + Math.cos(ang) * f.rx * (0.72 + Math.random() * 0.24),
        y: f.cy + Math.sin(ang) * f.ry * (0.72 + Math.random() * 0.24),
      },
    };
  }
  if (hasMech('sugar') && feller) {
    feller.sugarT = cfg('sugar').life;
    return { text: 'CUKOR!' };
  }
  if (hasMech('shock')) {
    const k = cfg('shock');
    for (const p of g.players) {
      if (!p.alive || p === feller) continue;
      const dx = p.x - t.x;
      const dy = (p.y - t.y) * 1.4;
      const d = Math.hypot(dx, dy);
      if (d > k.radius || d < 0.001) continue;
      const f = (1 - d / k.radius) * k.push;
      p.kx += (dx / d) * f;
      p.ky += (dy / d) * f * 0.7;
    }
    return { text: 'LÖKÉS!' };
  }
  return null;
}

/** A foltok leptetese es hatasa. @returns kiirando esemenyek */
export function updateMech(g, dt) {
  const events = [];
  if (!mechList().length) return events;

  for (const s of g.spots) s.t += dt;
  g.spots = g.spots.filter((s) => s.t < s.life);



  curDark = darkK(g);              // a kozelharc is tudjon a sotetsegrol
  if (hasMech('bell')) {
    // Temetoi harang: idonkent megkondul, es sotetbe borul a palya. A
    // sotetseg alatt nem szolal meg ujra, tehat nem tud osszecsuszni.
    const k = cfg('bell');
    if (g.bellSwing > 0) g.bellSwing = Math.max(0, g.bellSwing - dt);
    if (g.darkT > 0) {
      g.darkT = Math.max(0, g.darkT - dt);
    } else {
      g.bellT -= dt;
      if (g.bellT <= 0) {
        // A sotetedes a kondulassal EGYUTT indul, csak lassan kuszik fel.
        g.bellT = k.every;
        g.darkT = k.dark;
        g.bellSwing = k.swing;
        events.push({ type: 'bell' });
      }
    }
  }

  if (hasMech('crack')) {
    // Aki tul sokaig all egy repedesen, az beszakad. A szamlalo NULLAZODIK,
    // ha lelep rola: ez teszi elkerulhetove, es nem igazsagtalanna.
    const k = cfg('crack');
    for (const p of g.players) {
      if (!p.alive) continue;
      let on = false;
      for (const s of g.spots) {
        if (s.kind !== 'crack') continue;
        if (Math.hypot(p.x - s.x, (p.y - s.y) * 1.4) > k.radius) continue;
        on = true;
        break;
      }
      p.crackT = on ? (p.crackT || 0) + dt : 0;
      if (p.crackT > k.stand) {
        p.crackT = 0;
        if (kill(p, 'jeg')) events.push({ type: 'died', p, cause: 'jeg' });
      }
    }
  }

  if (hasMech('sugar')) {
    for (const p of g.players) if (p.sugarT > 0) p.sugarT = Math.max(0, p.sugarT - dt);
  }

  if (hasMech('sticky')) {
    const k = cfg('sticky');
    for (const p of g.players) p.stuck = 1;
    for (const s of g.spots) {
      if (s.kind !== 'sticky') continue;
      for (const p of g.players) {
        if (!p.alive) continue;
        if (Math.hypot(p.x - s.x, (p.y - s.y) * 1.4) > k.radius) continue;
        p.stuck = k.slow;
        p.kx *= 0.55;                        // a szirupban az ellokes is elhal
        p.ky *= 0.55;
      }
    }
  }

  if (hasMech('sink')) {
    // A kidolt kristaly lassan elmerul: eloszor meg akadaly, aztan mar nem.
    const k = cfg('sink');
    for (const t of g.trees) {
      if (t.state !== 'down' || t.sunk) continue;
      t.sinkT = (t.sinkT || 0) + dt;
      if (t.sinkT >= k.delay + k.dive) {
        t.sunk = true;
        events.push({ type: 'sunk' });
      }
    }
  }

  if (hasMech('fuse')) {
    // BEGYUJTAS. AZ ELSO fejszecsapas begyujtja a kanocot, es innentol a
    // raketa SAJAT MAGAT vagja tovabb - ugyanazon az egyetlen savon:
    //
    //   SARGA  a favago tolti: ha igy telik be, a raketa kidol
    //   PIROS  a kanoc tolti: ha igy telik be, a raketa kilo
    //
    // A sav tehat MINDIG NO, mint minden mas palyan; csak a szine arulja el,
    // ki nyeri a versenyt. Aki otthagy egy felig vagott raketat, nem nullaról
    // folytatja, amikor visszamegy - de kozben az is fogy, ami az ideje.
    // A TUZ is begyujt: aminek a tuzgyuru nekimegy, az magatol tolt tovabb.
    const k = cfg('fuse');
    for (const t of g.trees) {
      if (t.gone || t.burning) continue;

      if (t.state === 'flying') {
        t.launchT += dt;
        if (t.launchT >= k.fly) t.gone = true;
        continue;
      }
      if (t.state !== 'standing') continue;

      // Vagja-e valaki EBBEN a kepkockaban? A chop novekedese mar nem jo jel,
      // mert a kanoc is noveli; a previewBy viszont pontosan azt jelenti,
      // hogy a fejsze eppen a fan van.
      const chopping = t.previewBy >= 0;

      if (!t.lit && (t.chop > 0.02 || t.fireLit)) {
        t.lit = true;
        events.push({ type: 'ignite', t, byFire: !!t.fireLit && t.chop <= 0.02 });
      }
      if (!t.lit) continue;
      if (t.owner >= 0) t.litBy = t.owner;
      else if (t.previewBy >= 0) t.litBy = t.previewBy;

      t.fuseHot = !chopping;
      if (!chopping) {
        t.chop = Math.min(1, t.chop + dt / k.burn);
        if (t.chop >= 1) {
          t.state = 'flying';
          t.launchT = 0;
          events.push({ type: 'launch', t, by: t.litBy });
        }
      }
    }
  }

  if (hasMech('blades')) {
    // FORGOSZARNY. A kidolt malom vitorlaja tovabb porog a foldon. Aki
    // belefut, azt nagyot pocköli, es kap egy kis sebzest. Minel nagyobb
    // volt a malom, annal nagyobbat üt es annal messzebb dob.
    const k = cfg('blades');
    g.bladeT = (g.bladeT || 0) + dt;
    for (const p of g.players) {
      if (p.bladeCool > 0) p.bladeCool = Math.max(0, p.bladeCool - dt);
    }
    for (const sp of g.spots) {
      if (sp.kind !== 'blades') continue;
      const left = sp.life - sp.t;
      if (left < k.slow * 0.35) continue;        // a legvegen mar csak kifut
      const r = k.radius[sp.size] + k.hitGrow;
      for (const p of g.players) {
        if (!p.alive || p.bladeCool > 0) continue;
        const dx = p.x - sp.x;
        const dy = (p.y - sp.y) * k.hitSquash;
        const d = Math.hypot(dx, dy);
        if (d > r || d < 0.001) continue;
        const band = k.dmg[sp.size];
        const dmg = Math.round(bellRange(band[0], band[1]));
        const push = k.push[sp.size];
        p.kx += (dx / d) * push;
        p.ky += (dy / d) * push * 0.7;
        p.bladeCool = k.cool;
        const died = damage(p, dmg, 'vitorla');
        events.push({ type: 'blade', p, dmg, died });
      }
    }
  }

  if (hasMech('gust')) {
    // Folyamatosan vonulo szellokesek. Mindig van belolük harom-negy, es
    // mindegyik LATSZIK: a jatekos latja, hova ne alljon, es hova erdemes.
    const k = cfg('gust');
    g.gustT -= dt;
    if (g.gustT <= 0) {
      g.gustT = k.interval * (0.7 + Math.random() * 0.6);
      g.gusts.push(spawnGust());
    }
    for (const w of g.gusts) {
      w.t += dt;
      w.x += w.dx * w.speed * dt;
      w.y += w.dy * w.speed * dt;
      for (const p of g.players) {
        if (!p.alive) continue;
        // Merolegen mert tavolsag a lokés tengelyetol: a savon belul terel.
        const ax = p.x - w.x;
        const ay = (p.y - w.y) * 1.3;
        const perp = Math.abs(-ax * w.dy + ay * w.dx);
        const along = ax * w.dx + ay * w.dy;
        // Hosszabb sav: amig a szel ATVONUL a favago folott, vegig tolja.
        if (perp > w.w || along < -26 || along > 48) continue;
        // A sav kozepen a legerosebb, a szelen elhal: igy nem eles a hatar.
        const fall = 1 - (perp / w.w) * 0.55;
        p.kx += w.dx * w.push * fall * dt;
        p.ky += w.dy * w.push * fall * dt * 0.7;
      }
    }
    g.gusts = g.gusts.filter((w) => w.t < w.life);
  }
  return events;
}

/**
 * A forgo vitorla szoge egy foltnal. A lejaro folt lassul, majd megall:
 * igy nem ugrik el egyik kepkockarol a masikra, hanem kifut.
 */
export function bladeAngle(sp) {
  const k = cfg('blades');
  const left = sp.life - sp.t;
  const slow = Math.max(0, Math.min(1, left / k.slow));
  // A szoget a folt SAJAT eltelt idejebol integraljuk kozelitoleg: amig
  // teljes sebesseggel porog, egyenletes, a vegen negyzetesen lassul.
  const full = Math.max(0, sp.t - Math.max(0, sp.life - k.slow));
  const base = (sp.t - full) * k.spin;
  const tail = full > 0 ? k.spin * k.slow * (1 - Math.pow(1 - full / k.slow, 2)) / 2 : 0;
  return sp.phase + base + tail;
}

/** Porog-e meg a vitorla, vagy mar megallt? */
export function bladeSpin(sp) {
  const k = cfg('blades');
  return Math.max(0, Math.min(1, (sp.life - sp.t) / k.slow));
}

/**
 * ZAROKEP. Amikor a gyoztes beer a bodéba, MINDEN talpon maradt raketa
 * felszall - kiveve amelyik mar a tuzben all. Nem egyszerre: sorban, apro
 * kesessel, hogy tuzijatek legyen belole, ne egyetlen puffanas.
 */
export function launchAll(g, inFire) {
  if (!hasMech('fuse')) return 0;
  let n = 0;
  for (const t of g.trees) {
    if (t.gone || t.burning || t.state !== 'standing') continue;
    if (inFire && inFire(t.x, t.y)) continue;
    t.lit = true;
    t.chop = 1;
    t.fuseHot = true;
    t.finale = true;                // a zarokepen szet is robban a vegen
    t.state = 'flying';
    t.launchT = -0.12 * n;          // negativ: meg all, mig sorra nem kerul
    n++;
  }
  return n;
}

/**
 * A zarokepen mar nem fut a teljes mechanika (nem kondul harang, nem fuj a
 * szel), de a felszallo raketakat leptetni kell. @returns a most elindulok
 */
export function updateFlying(g, dt) {
  const out = [];
  if (!hasMech('fuse')) return out;
  const k = cfg('fuse');
  for (const t of g.trees) {
    if (t.gone || t.state !== 'flying') continue;
    const before = t.launchT;
    t.launchT += dt;
    if (before <= 0 && t.launchT > 0) out.push({ type: 'liftoff', t });
    if (t.launchT >= k.fly) {
      t.gone = true;
      out.push({ type: 'burst', t, y: t.y - k.rise * k.fly });
    }
  }
  return out;
}

/** A raketa felszallasanak allasa 0..1 kozott. */
export function launchK(t) {
  if (t.state !== 'flying') return 0;
  return Math.max(0, Math.min(1, t.launchT / cfg('fuse').fly));
}

/**
 * A kidolt kristaly sullyedese 0-tol 1-ig. A rajzolas ezzel tolja lejjebb
 * es halvanyitja, a jatek pedig ezzel dönti el, akadaly-e meg.
 */
/** Az ur-palyan a kidolt kristaly darabokra torik, nem egyben fekszik le. */
export function shatters(t) {
  return hasMech('sink') && t.state === 'down';
}

/** A cukorka-palyan a kidolt nyaloka ELTUNIK: a tocsa lep a helyebe. */
export function meltsAway(t) {
  return hasMech('sticky') && t.state === 'down';
}

/**
 * A harangszo sotetsege 0..1 kozott. A szelein felfut es lecseng, tehat nem
 * ugrik egyik kepkockarol a masikra.
 */
export function darkK(g) {
  if (!hasMech('bell') || !g.darkT) return 0;
  const k = cfg('bell');
  const t = k.dark - g.darkT;             // mennyi telt el a kondulas ota
  // Lassan sotetedik, gyorsan vilagosodik: a fenyegetes epul, a megkonnyebbules
  // viszont egy pillanat alatt jon.
  const up = Math.min(1, t / k.fadeIn);
  const down = Math.min(1, g.darkT / k.fadeOut);
  return Math.min(up, down);
}

/**
 * Sotetben NEM lehet oszlopot vagni, de a masikat utni igen. A vagashoz
 * latni kell, mit csinalsz; a kozelharchoz eleg, hogy egymasnak menjetek.
 */
export function chopBlockedNow(g) {
  return ghostNow(g);
}

/**
 * SZELLEM-MOD. A harangszo sotetjeben a ket favago atmegy a sirkoveken.
 *
 * Ugyanaz a hatar, mint a vagas tiltasanal, es ez szandekos: amig szellem
 * vagy, nem tudsz vagni, viszont barhova eljutsz es barhol verekedhetsz.
 * Amikor kivilagosodik, a ko ujra ko: aki epp egy sirko belsejeben all,
 * ott ragad, es ki kell kecmeregnie (vagy kivagnia magat).
 *
 * A menedek es a harangtorony NEM ilyen: azokon szellemkent sem lehet
 * atmenni. Az egyik a zarokep hazikoja, a masik maga a harang: ha
 * atsetalhatnal rajtuk, egyik sem lenne hely tobbe, csak rajz.
 */
export function ghostNow(g) {
  return hasMech('bell') && darkK(g) > 0.45;
}

/**
 * Kor- es meccsvegen a sotetseg KIENGED.
 *
 * A zarokepen mar nem fut a teljes mechanika, tehat a harang sem kondul
 * ujra - de enelkul a sotetseg BEFAGYNA azon az erteken, ahol a kor veget
 * ert, es a gyoztes lathatatlanul futott volna be a menedekbe. A maradek
 * idot a kivilagosodas hosszara vagjuk: a feny egy pillanat alatt
 * visszajon, nem kell kivarni egy egesz harangszot.
 */
export function engedjElASotet(g, dt) {
  if (!hasMech('bell') || !g.darkT) return;
  const k = cfg('bell');
  if (g.darkT > k.fadeOut) g.darkT = k.fadeOut;
  g.darkT = Math.max(0, g.darkT - dt);
  if (g.bellSwing > 0) g.bellSwing = Math.max(0, g.bellSwing - dt);
}

// A sotetseg allasa, hogy a kozelharc is tudjon rola. A resolveMelee nem
// kapja meg a jatekallapotot, ezert itt tartjuk el az utolso erteket.
let curDark = 0;

/** Sotetben nagyobbat ut a fejsze: vakon egymasnak menni kockazatosabb. */
export function darkMeleeBonus() {
  return curDark > 0.45 ? CFG.mech.bell.dmgBonus : 0;
}

export function sinkK(t) {
  if (!hasMech('sink') || t.state !== 'down') return 0;
  const k = cfg('sink');
  const v = ((t.sinkT || 0) - k.delay) / k.dive;
  return Math.max(0, Math.min(1, v));
}

/** A jatekos sebesseg-szorzoja: cukorroham gyorsit, inda lassit. */
export function speedMul(p) {
  let k = 1;
  if (hasMech('sugar') && p.sugarT > 0) k *= cfg('sugar').boost;

  if (hasMech('sticky') && p.stuck !== undefined) k *= p.stuck;
  return k;
}

/** A csuszos jegen lassan gyorsul es sokaig csuszik a favago. */
export function moveRates() {
  if (!hasMech('slip')) return { accel: CFG.accel, friction: CFG.friction };
  const k = cfg('slip');
  return { accel: CFG.accel * k.accel, friction: CFG.friction * k.friction };
}

export { clamp, inHitZone };
