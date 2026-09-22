// A kitett csomag osszeallitasa a harom valtozatbol.
//
//   node build.mjs   ->  dist/
//
// MIERT KELL EZ. A repo szerkezete tortenelmi okokbol egyenetlen: a v1 a
// gyokerben lakik, a v2 es a v3 sajat mappaban. A neten viszont ez lesz belole:
//
//   favago.bosz.dev       ->  az alapertelmezett valtozat (v2)
//   favago.bosz.dev/v1/   ->  az elso kesz jatek
//   favago.bosz.dev/v3/   ->  a ket USB kontrolleres valtozat
//   favago.bosz.dev/v2     ->  atiranyit a puszta cimre
//
// Az alapertelmezett valtozat CSAK a gyokerbe kerul, nem a sajat mappajaba is.
// Aki megis /v2-t ut be, azt egy atiranyitas viszi a tiszta cimre, tehat az
// alapertelmezett valtozatnak egyetlen cime van, es nem marad felesleges
// vegzodes a cimsorban. Ezt a _redirects fajl intezi, amit a Cloudflare
// olvas ki a kitett mappabol.
//
// Ez a szkript CSAK a dist/ mappat irja. A repo tobbi reszehez nem nyul, tehat
// a helyi fejlesztes valtozatlanul `node server.js`.
//
// Az sem mellekes, hogy igy pontosan az kerul ki a netre, amit a jatek hasznal:
// a README, a fejlesztoi eszkozok es a kepernyokepek itt maradnak.

import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const DIST = join(ROOT, 'dist');

// Melyik valtozat mit visz magaval. A v1-nek nincs favicon-ja, ezert rovidebb
// a listaja; a masolo a hianyzo tetelt amugy is atlepi.
const VALTOZATOK = [
  { nev: 'v1', honnan: ROOT, fajlok: ['index.html', 'css', 'src'] },
  { nev: 'v2', honnan: join(ROOT, 'v2'), fajlok: ['index.html', 'css', 'src', 'favicon.svg'] },
  { nev: 'v3', honnan: join(ROOT, 'v3'), fajlok: ['index.html', 'css', 'src', 'favicon.svg'] },
];

// Ez a valtozat szol a puszta cimen is. Masik alapertelmezetthez elég ezt
// az egy sort atirni.
const ALAP = 'v2';

async function masol(honnan, hova, fajlok) {
  await mkdir(hova, { recursive: true });
  for (const f of fajlok) {
    try {
      await cp(join(honnan, f), join(hova, f), { recursive: true });
    } catch (e) {
      // Ha egy valtozatbol hianyzik valami (peldaul a v1 favicon), az nem hiba.
      if (e.code === 'ENOENT') continue;
      throw e;
    }
  }
}

const alap = VALTOZATOK.find((v) => v.nev === ALAP);
if (!alap) throw new Error('nincs ilyen valtozat: ' + ALAP);

await rm(DIST, { recursive: true, force: true });

// Az alapertelmezett valtozat a gyokerbe kerul. A jatek relativ utvonalakat
// hasznal, ezert barmelyik melysegbol ugyanugy mukodik.
await masol(alap.honnan, DIST, alap.fajlok);
console.log(`  ${ALAP} a gyokerbe (ez szol a puszta cimen)`);

// A tobbi valtozat a sajat mappajaba.
for (const v of VALTOZATOK) {
  if (v.nev === ALAP) continue;
  await masol(v.honnan, join(DIST, v.nev), v.fajlok);
  console.log(`  ${v.nev} kesz`);
}

/*
 * Aki az alapertelmezett valtozatot a sajat utvonalan uti be, azt a tiszta
 * cimre kuldjuk. Igy annak a valtozatnak egyetlen cime van.
 *
 * 302, nem 301: a 301-et a bongeszo tartosan megjegyzi, es ha kesobb masik
 * valtozat lesz az alapertelmezett, a regi latogatok beragadnanak.
 */
await writeFile(join(DIST, '_redirects'),
  `/${ALAP}    /  302\n/${ALAP}/*  /  302\n`, 'utf8');
console.log(`  _redirects: /${ALAP} -> /`);

console.log(`\ndist/ osszeallt: a gyokerben a ${ALAP}, mellette `
  + VALTOZATOK.filter((v) => v.nev !== ALAP).map((v) => '/' + v.nev + '/').join(' es '));
