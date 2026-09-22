// Fektetes es teljes kepernyo telefonon.
//
// Amit a bongeszo enged, azt megkerjuk: teljes kepernyot, es fekvo zarolast.
// Androidon mindketto megy. iPhone-on a Safari egyiket sem adja meg egy
// weboldalnak: ott a gomb csak annyit tehet, hogy megkeri az embert, forgassa
// el a telefont, es a lap a lehetseges legnagyobb helyet foglalja el.
//
// A kepesseget NEM a bongeszo nevebol talaljuk ki, hanem abbol, hogy letezik-e
// a fuggveny. Ez nem romlik el, ha egy bongeszo megvaltozik.

const el = document.documentElement;

/** Tud-e a bongeszo teljes kepernyot egy sima elemre. iPhone Safari: nem. */
export function tudTeljesKepernyot() {
  return !!(el.requestFullscreen || el.webkitRequestFullscreen);
}

/** Tud-e fekvo zarolast. Csak Android bongeszok, es csak teljes kepernyon. */
export function tudZarolast() {
  return !!(screen.orientation && typeof screen.orientation.lock === 'function');
}

export function teljesKepernyon() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

export function fekvo() {
  return window.matchMedia('(orientation: landscape)').matches;
}

/**
 * Megkeri, amit lehet. Nem dob hibat: ha valamit a bongeszo elutasit, azt
 * csondben tudomasul vesszuk, a hivo a visszateresi ertekbol latja, mi sikerult.
 */
export async function fektet() {
  const eredmeny = { teljes: false, zarolva: false };

  if (!teljesKepernyon()) {
    const kerd = el.requestFullscreen || el.webkitRequestFullscreen;
    if (kerd) {
      try { await kerd.call(el, { navigationUI: 'hide' }); eredmeny.teljes = true; }
      catch { /* elutasitva, pl. nem felhasznaloi gesztusbol hivtak */ }
    }
  } else {
    eredmeny.teljes = true;
  }

  if (tudZarolast()) {
    try { await screen.orientation.lock('landscape'); eredmeny.zarolva = true; }
    catch { /* iOS, vagy nem teljes kepernyon: nem enged zarolni */ }
  }

  return eredmeny;
}

export async function kilep() {
  if (tudZarolast()) { try { screen.orientation.unlock(); } catch { /* nincs mit */ } }
  const ki = document.exitFullscreen || document.webkitExitFullscreen;
  if (ki && teljesKepernyon()) { try { await ki.call(document); } catch { /* nincs mit */ } }
}

/** Ertesites, ha valtozik a fekvo/allo allapot vagy a teljes kepernyo. */
export function figyel(fn) {
  window.matchMedia('(orientation: landscape)').addEventListener('change', fn);
  document.addEventListener('fullscreenchange', fn);
  document.addEventListener('webkitfullscreenchange', fn);
  window.addEventListener('resize', fn);
}
