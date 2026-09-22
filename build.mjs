// A kitett csomag osszeallitasa a harom valtozatbol.
//
//   node build.mjs   ->  dist/
//
// MIERT KELL EZ. A repo szerkezete tortenelmi okokbol egyenetlen: a v1 a
// gyokerben lakik, a v2 es a v3 sajat mappaban. A neten viszont mindharom
// egyforma utvonalat kap:
//
//   favago.bosz.dev/      ->  atiranyit a v2-re
//   favago.bosz.dev/v1/   ->  az elso kesz jatek
//   favago.bosz.dev/v2/   ->  + varazsmod, tiz palyavilag
//   favago.bosz.dev/v3/   ->  + ket USB kontroller
//
// Ez a szkript CSAK a dist/ mappat irja. A repo tobbi reszehez nem nyul, tehat
// a helyi fejlesztes valtozatlanul `node server.js`, es a harom valtozat ott
// tovabbra is ott van, ahol eddig.
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

// Ide visz a puszta cim. Ha masik valtozat kell alapertelmezettnek, ezt az
// egy sort kell atirni (es a lenti nyitolapon a szoveget).
const ALAP = 'v2';

const NYITOLAP = `<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DŐL A FA</title>
<meta http-equiv="refresh" content="0; url=/${ALAP}/">
<link rel="icon" type="image/svg+xml" href="/${ALAP}/favicon.svg">
<style>
  html, body { height: 100%; margin: 0; }
  body {
    background: #14110f;
    color: #e9e2d6;
    font-family: ui-monospace, Menlo, Consolas, monospace;
    display: flex; align-items: center; justify-content: center;
    text-align: center; padding: 16px;
  }
  h1 { font-size: clamp(1.5rem, 7vw, 2.25rem); margin: 0 0 1.5rem; letter-spacing: 0.04em; }
  p { color: #8a7f70; margin: 0 0 1.5rem; font-size: 0.9rem; }
  nav a {
    display: inline-block; margin: 0 0.4rem; padding: 0.5rem 1rem;
    color: #e8a33d; border: 1px solid rgba(232, 163, 61, 0.35);
    text-decoration: none; border-radius: 3px;
  }
  nav a:hover { background: rgba(232, 163, 61, 0.12); }
</style>
</head>
<body>
  <main>
    <h1>DŐL A FA</h1>
    <p>Átirányítás a ${ALAP} változatra…</p>
    <nav>
      <a href="/v1/">v1</a>
      <a href="/v2/">v2</a>
      <a href="/v3/">v3</a>
    </nav>
  </main>
  <script>location.replace('/${ALAP}/');</script>
</body>
</html>
`;

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

await rm(DIST, { recursive: true, force: true });

for (const v of VALTOZATOK) {
  await masol(v.honnan, join(DIST, v.nev), v.fajlok);
  console.log(`  ${v.nev} kesz`);
}

await writeFile(join(DIST, 'index.html'), NYITOLAP, 'utf8');

console.log(`\ndist/ osszeallt: v1, v2, v3 + nyitolap (alapertelmezett: ${ALAP})`);
