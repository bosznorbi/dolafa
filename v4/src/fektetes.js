// Fekvo vagy allo: csak a keszulek allasat kerdezzuk le.
//
// Teljes kepernyot es fekvo zarolast NEM kerunk. iPhone-on a bongeszo egyiket
// sem adja meg egy weboldalnak, Androidon pedig egy gombot kellett volna
// kitenni erte, es a jatek igy is jol elfer a bongeszokereten belul. A lap
// annyit tesz, hogy allo telefonon megkeri az embert: forditsa el.
//
// Az allast NEM a bongeszo nevebol talaljuk ki, hanem media query-bol. Ez nem
// romlik el, ha egy bongeszo megvaltozik.

export function fekvo() {
  return window.matchMedia('(orientation: landscape)').matches;
}

/**
 * Ertesites, ha valtozik a fekvo/allo allapot. A teljes kepernyore is
 * figyelunk: azt a bongeszo sajat gombja (vagy asztali gepen az F11) barmikor
 * be- es kikapcsolhatja, es olyankor mas lesz a hasznos hely.
 */
export function figyel(fn) {
  window.matchMedia('(orientation: landscape)').addEventListener('change', fn);
  document.addEventListener('fullscreenchange', fn);
  document.addEventListener('webkitfullscreenchange', fn);
  window.addEventListener('resize', fn);
}
