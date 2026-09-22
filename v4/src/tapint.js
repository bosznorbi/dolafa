// Koppinthato teruletek a canvason.
//
// ELV: aki rajzol, az jegyzi fel. A HUD minden koppinthato elemnel (START,
// varazspalca, hangszoro, palyavalaszto dobozok, FOLYTATAS, KILEPES...)
// beirja ide, hova rajzolta es melyik billentyut jelenti. A koppintas ebben a
// listaban keres. Igy a talalati terulet mindig pontosan ott van, ahol a kep,
// akkor is, ha a rajzolas elrendezese valtozik: nem kell kulon lekovetni.
//
// A lista minden kepkocka elejen kiurul (ujraKezd), es a rajzolas ujratolti.
// A koordinatak a canvas sajat, 320x180-as terében vannak; az erintes-reteg
// forditja at a kepernyo-pixeleket erre.

export const regiok = [];

export function ujraKezd() {
  regiok.length = 0;
}

/**
 * Egy koppinthato terulet. A parna a rajzolt elemnel nagyobb talalati
 * feluletet ad: ujjal nem lehet pixelpontosan celozni.
 */
export function regisztral(x, y, w, h, kod, { shift = false, parna = 0 } = {}) {
  regiok.push({ x: x - parna, y: y - parna, w: w + 2 * parna, h: h + 2 * parna, kod, shift });
}

/** A legutobb regisztralt (legfelul rajzolt) talalat nyer. */
export function talal(cx, cy) {
  for (let i = regiok.length - 1; i >= 0; i--) {
    const r = regiok[i];
    if (cx >= r.x && cx < r.x + r.w && cy >= r.y && cy < r.y + r.h) return r;
  }
  return null;
}
