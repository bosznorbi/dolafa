# DŐL A FA - v4 (mobil)

Ez a **v2 másolata**, plusz érintéses irányítás. A játékmenet és minden
pályavilág változatlan, kontroller-támogatás nincs benne: ez a telefonos
változat. Gépen, egérrel megnyitva pontosan úgy néz ki és viselkedik, mint a
v2, az érintés-réteg csak érintőképernyőn kapcsol be.

Élesben: [favago.bosz.dev](https://favago.bosz.dev) érintőképernyőről ide
irányít, gépről a v2-re. Közvetlen cím: `favago.bosz.dev/v4`.

## Indítás

```bash
node server.js
```

Utána: http://localhost:5173/v4/. Gépen az érintés-réteget a `?erintes` kapcsoló
hozza elő: http://localhost:5173/v4/?erintes. Így egérrel is kipróbálható.

## Irányítás érintéssel

**A képernyő két fele a két játékos térfele.** Ahová a hüvelykujj leér a saját
térfelén, ott jelenik meg a konzol, és az irány az első érintési ponthoz képest
számít. Nem négyirányú kereszt, hanem kör: középen kis holttér, hogy a nyugalmi
ujj ne mozgassa a figurát, és nyolc irányszelet, tehát az átlós mozgás is megy.
Két ujj egyszerre, egymástól függetlenül.

**Amit a játék kirajzol, arra koppintani lehet.** Külön gombsáv nincs: a
rajzoló feljegyzi, hova rajzolta a koppintható elemeket ([tapint.js](src/tapint.js)),
a koppintás pedig abban keres.

| Hol | Mit csinál |
|---|---|
| menü, bal vagy jobb térfél | a konzol kitérése egy iránybillentyű: fel-le szín, jobbra-balra ember vagy robot |
| menü, a szereplő melletti `<` `>` és a fel-le nyilak | ugyanez koppintással |
| menü, START felirat | meccs indítása |
| menü, varázspálca és hangszóró ikon | varázsmód, hang |
| varázsmód, pályaválasztó dobozok, R, I | pálya, véletlen pálya, súgó (érintéssel a dobozok nagyobbak) |
| játékban, ember térfele | mozgás |
| játékban, koppintás bárhol | szünet |
| szünet, FOLYTATÁS és KILÉPÉS felirat | folytatás (üres koppintással is), kilépés a menübe |
| meccs végén, ÚJRA, VÉGTELEN, MENÜ felirat | új meccs ugyanazokkal, végtelen mód, menü (üres koppintással is) |

**Játékban csak ott van konzol, ahol ember játszik.** A robot térfele nem
reagál, tehát egy játékosnál az az oldal él, amit a menüben JÁTÉKOS-ra
állítottál, kettőnél mindkettő. A menüben mindkét oldal szabad, mert ott dől
el, ki játszik.

A menüben az üres koppintás szándékosan nem indít: aki épp megfogná a konzolt
és túl gyorsan engedi el, ne indítson meccset véletlenül. Indítani a START
feliratra koppintva lehet. Érintéssel a menü nem mutatja a billentyű-jeleket
(WASD, nyilak) és a Z, M betűket, mert azok ott nem jelentenek semmit.

Érintéssel a játék kicsit lassabb (0,9-szeres tempó), mert kis képernyőn
ugyanaz a sebesség gyorsabbnak hat, és a hüvelykujj sem olyan pontos, mint a
billentyű. Ez egy szám a [main.js](src/main.js) tetején.

## Fektetés

Álló telefonon a játék apró lenne hatalmas fekete sávokkal, ezért egy felirat
kéri az elforgatást. A rajz egyszer balra, egyszer jobbra fordul: mindkét irány
jó, a játék követi a készüléket. Ha játék közben fordul állóra a telefon, a
meccs szünetre áll.

Teljes képernyőt a lap **nem kér**, és a kezdőképernyőre tételt sem ajánlja.
iPhone-on a böngésző egyiket sem adja meg egy weboldalnak, Androidon pedig egy
gombot kellett volna kitenni érte. A cél az, hogy böngészőből, külön lépés
nélkül játszható legyen: a böngésző címsora ott marad a kép fölött, és a játék
a maradék helyet tölti ki. Aki mégis teljes képernyőt akar, a böngésző saját
gombjával megkapja.

## Szélesebb képernyő

A fekvő telefon képernyője szélesebb 16:9-nél, ezért a játéktér két oldalán
maradt hely. Oda a világ folytatása kerül, nyújtás nélkül: a 320x180-as
játéktér középen marad, a szélső sávokba ugyanaz a talaj, sziluett és láng
kerül. A részletek a [repó README-jében](../README.md#szélesebb-képernyő)
vannak. A koppintás ettől ugyanúgy talál: a tapintási pontot a vászon teljes
szélességéből számoljuk, és levonjuk a hasáb méretét.

## Hogyan van megcsinálva

A játék logikája nem tud az érintésről. A [input.js](src/input.js) ugyanazt a
`getInput()` függvényt adja, amit eddig, csak a billentyűzet mellé VAGY
kapcsolattal beteszi a konzol irányait is. A koppintás pedig a
`fire()` függvénnyel ugyanazokat a billentyűkódokat küldi, amiket az `onKey()`
kezel: a játék számára egy koppintás megkülönböztethetetlen egy SPACE-től.

Az egész érintés-réteg a [erintes.js](src/erintes.js), a készülék állását a
[fektetes.js](src/fektetes.js) mondja meg. Pointer Events-et használ, nem touch
eventeket: ugyanaz a kód kezeli az érintést és az egeret.

A [main.js](src/main.js) minden képkockában elmondja a rétegnek, hol tart a
játék és melyik oldalon ül ember. A réteg ebből dönti el, hol lehet konzolt
fogni, és melyik oldal reagáljon a hüvelykujjra.

## Amit gépről nem lehet kipróbálni

A böngésző-emuláció az elrendezést és a logikát megmutatja, de a hüvelykujj
alatti érzést nem: mennyi legyen a holttér, mekkora a kitérés, mennyire
csússzon. Ezt telefonon kézben kell megítélni. A két állítható érték a
[erintes.js](src/erintes.js) tetején van (`HOLTTER`, `KITERES`).
