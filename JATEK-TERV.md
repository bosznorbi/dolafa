# DŐL A FA - eredeti játékterv

> **Ez a dokumentum a kiinduló terv, megőrizve.** A játék elkészült és fut, de azóta
> több ponton továbbfejlődött. Az **aktuális állapot leírása a [README.md](README.md)**,
> az az egyetlen mérvadó forrás. Indítás: `node server.js`, majd http://localhost:5173.
>
> **Ami a terv óta megváltozott:**
>
> | Terv | Most |
> |---|---|
> | A játék neve TIMBER! | **DŐL A FA** |
> | Fa találat = 1 élet | **Fa találat = azonnali kiesés** |
> | 3 szív, diszkrét | **5 szív, 20% egyenként, részlegesen töltődnek, 70%-ról indulva** |
> | A tűz csak kívülről szorít | **Két front: kívülről és a pálya közepéről is** |
> | A tűz téglalap alakú | **Szabálytalan, véletlengenerált, aszimmetrikus alak** |
> | Egyforma fák | **Három méret, méret szerinti élet (4-8 / 6-10 / 8-12) és vágási idő** |
> | Nincs játékos-játékos harc | **Fejszepárbaj: oldalról lehet ütni, szemben hárítanak** |
> | Best of 3 | **Best of 5** (a körök rövidebbek, mert a fa azonnal öl) |
> | Nincs zene | **Chiptune favágó-induló, `M` = néma** |
>
> A tükrözés a fákra maradt (fairség), a tűzre már nem vonatkozik.

Kétszemélyes, egy gépes, egy képernyős pixel art aréna játék. Egy meccs kb. 60-75 másodperc.

## Koncepció egy mondatban

Két favágó egy égő erdőben próbálja egymásra dönteni a fákat, miközben az erdőtűz kívülről befelé felfalja a pályát.

## Irányítás

| | Mozgás | Menü |
|---|---|---|
| 1. játékos | W A S D | - |
| 2. játékos | nyilak | - |
| közös | - | Enter (indítás, újraindítás) |

**Kritikus szabály: a játékmenetben nincs akciógomb.** Csak 4 irány. Ez teszi lehetővé, hogy később egy retro USB kontroller D-padja is működjön, és ez küszöböli ki a billentyűzet-ghostinget.

Az input legyen absztrakció az első perctől:

```js
getInput(playerIndex) // -> { up, down, left, right }
```

A játéklogika soha ne olvasson közvetlenül billentyűkódot. Így a Gamepad API bekötése később 10 sor.

Böngészőben `preventDefault` kell a nyilakra, különben görög az oldal.

## Alapmechanika: a fadöntés a támadás

1. A játékos hozzáér egy fához, és automatikusan vágni kezdi. Nincs gombnyomás.
2. A fa fölött töltődik egy progress csík. Teljes kivágás: **0,85 másodperc** folyamatos érintkezés.
3. Amikor megtelik, a fa **eldől a játékostól elfelé** (a játékos → fa vektor irányába).
4. A dőlés iránya a **4 fő irányra kerekítve**. Így csak 4 dőlés-animáció kell, és a hitbox egy tengelyigazított téglalap.
5. A dőlés animációja **0,38 másodperc**, a sebzés csak a becsapódás pillanatában aktiválódik. Ez a kitérési ablak.
6. A sebző zóna nem csak a törzs sávja: a **korona** egy 22x22-es négyzet a fa végén. Ez adja a találatok többségét, és vizuálisan is ez a nagy zöld folt.
6. A ledőlt fa **rönkként ottmarad** a pályán, és blokkolja a mozgást. A pálya menet közben egyre kuszább lesz.

### A csavar: a vágási progress a fához tartozik, nem a játékoshoz

Ha félig kivágsz egy fát és otthagyod, félig vágva marad. Az ellenfél odamehet a **másik** oldalára, és fél másodperc alatt rád döntheti.

Minden félkész fa csapda mindkét játékosnak. Ez egyetlen extra mező a fa objektumon, és óriási taktikai mélységet ad.

## Erdőtűz

- A játékterület egy téglalap, ami kívülről befelé zsugorodik.
- **16 másodperc** alatt zsugorodik a minimumra, majd további **4 másodperc** alatt nullára. A kör garantáltan véget ér, nem kell külön időzítő-logika.
- A tűzben állás **életpontot vesz el**, nem öl azonnal.
- Téglalap, nem kör, mert olcsóbb és illik a pixelrácshoz.

A tűz a döntetlen automatikus feloldása: a végén nincs biztonságos talaj, mindketten égni kezdenek, és akinek több élete maradt, az él tovább. Nem kell "idő lejárt" elágazás.

## Élet, sebzés, körök

- Minden játékos **3 élettel** indul körönként.
- **Fa találat:** 1 élet + lökés a dőlés irányába (190 px/mp kezdősebesség) + 0,4 mp bénulás.
- **Tűz:** 1 élet érintkezéskor, 0,3 mp türelmi idő után, majd kb. 1,45 mp-enként újra.
- **Sebezhetetlenségi ablak találat után: 1,0 másodperc**, villogó sprite-tal. Enélkül a tűzben azonnal elfogy mind a 3 élet.
- A kör véget ér, ha valaki 0 életre esik.
- **Best of 3.** Ha mindketten ugyanabban a képkockában halnak meg, a kör annak jut, aki közelebb volt az aréna közepéhez, holtversenyben pedig annak, aki utoljára fejbe vágta a másikat fával. Csak tökéletes szimmetriában marad döntetlen.

A legfontosabb kombó, amire a balansznak épülnie kell: nem megölni a másikat a fával, hanem **belökni vele a tűzbe**.

## Pálya

- Belső felbontás: **320 x 180**, integer scaling felfelé (4x = 1280x720, 6x = 1920x1080), `image-rendering: pixelated`.
- Nézet: **3/4 felülnézet** (mint a régi Zelda), nem tiszta felülnézet. A fák és a favágó oldalról látszanak, így felismerhetők.
- **26 fa**, véletlenszerűen elhelyezve a pálya bal felén, majd **tükrözve a jobb félre**. A szimmetria kötelező, különben az egyik játékos jobb fákat kap, és ez egy 20 másodperces körben azonnal érződik.
- Spawn: bal és jobb szél, tükrözve.
- Játékos sebesség: 84 px/mp (a pályát kb. 3,5 másodperc átszelni).

Minden szám hangolható, a fentiek kiindulási értékek.

## Egyjátékos mód (bot)

A bot prioritási sorrendben:

1. Ha dőlő fa hitboxában állok, lépj ki belőle merőlegesen.
2. Ha a tűz közel van, menj befelé.
3. Egyébként keresd azt a fát, aminél (a) az ellenfél átellenes oldalára tudok állni, és (b) az ellenfél a fa dőlési sávjában van vagy közel hozzá. Menj oda és vágd.
4. Ha nincs ilyen, menj a legközelebbi fához, ami nagyjából az ellenfél felé néz.

Nehézségi szint két paraméterrel: **reakcióidő** (könnyű 0.5 mp, közepes 0.3 mp, nehéz 0.15 mp) és **célzási tolerancia**.

Ez összesen kb. 40-60 sor. A mechanikát pont azért választottuk így, hogy ne kelljen pathfinding.

## Technikai keretek

- **Egy `index.html`, vanilla JS + canvas. Nincs build, nincs npm install, nincs szerver.** Dupla katt és fut. Ez 6 embernél és demónál aranyat ér, mert mindenki azonnal futtatni tudja a másik kódját.
- **Fix timestep** a logikára (pl. 60 Hz), delta time a rajzoláshoz. Enélkül más gépen más a játék.
- A rajzolás legyen `drawSprite('lumberjack1', x, y)` mögé rejtve, és **működjön színes téglalapokkal is**. A grafika cserélhető réteg, soha ne blokkolja a játékmenetet.
- Hang: WebAudio-val generált effektek, nem kell hangfájl. Fejszecsapás, reccsenés, becsapódás, tűz-morajlás.

### A state-kontraktus

Ezt az első 15 percben rögzíteni kell, mielőtt bárki kódot ír. Enélkül 6 ember 6 különböző játékot ír.

```js
game = {
  state: 'menu' | 'playing' | 'roundEnd' | 'matchEnd',
  time: 0,                 // kör eltelt ideje
  round: 1,
  score: [0, 0],
  arena: { x, y, w, h },   // az aktuális, nem égő terület
  players: [{
    x, y, vx, vy,
    hp: 3,
    invuln: 0,             // sebezhetetlenség hátralévő ideje
    stagger: 0,            // bénulás hátralévő ideje
    isBot: false
  }],
  trees: [{
    x, y,
    chop: 0,               // 0..1, a fához tartozik
    state: 'standing' | 'falling' | 'log',
    fallDir: 'up'|'down'|'left'|'right',
    fallTimer: 0
  }],
  particles: []
}
```

## Grafika

- Fix paletta, fix sprite méret: karakter 16x16, fa kb. 16x32.
- **Az összes sprite egyetlen promptban, egyetlen spritesheetben generálva.** Darabonként generálva az AI-s pixel art stílusa szétesik.
- A két favágó legyen jól megkülönböztethető színnel (pl. piros és kék ing), ne csak formával.

## Munkamegosztás 6 főre

A valódi kockázat nem a kód, hanem hogy 6 ember egymás lábára lép. Fájlonként egy gazda.

| Szerep | Felelősség |
|---|---|
| 1. Gerinc / integrátor | game loop, state, input absztrakció, ütközés-alap |
| 2. Fa rendszer | vágás, progress, dőlés, hitbox, rönk |
| 3. Tűz + pálya | zsugorodás, sebzés, pályagenerálás tükrözéssel |
| 4. Bot | egyjátékos mód, nehézségi szintek |
| 5. HUD + körkezelés | életpontok, kör-pontok, menü, győzelmi képernyő, újraindítás |
| 6. Juice + grafika | spritesheet, particle, screenshake, WebAudio hangok |

## Opcionális bővítések, prioritási sorrendben

Ezek egymástól függetlenek, tehát bármelyik elhagyható, ha elfogy az idő.

1. Screenshake és forgács-particle a becsapódásra, "TIMBER!" felirat.
2. A tűzbe kerülő fa maga is meggyullad, és ha kidöntik, **odaviszi a tüzet, ahova esik**. Ez a késői körökben káoszt csinál.
3. Power-up: energiaital (sebesség), láncfűrész (fele vágási idő, néhány másodpercig).
4. Testi lökés a játékosok között (a szumó elem visszahozása).
5. Mókus, madár, egyéb dísz-animációk.

## Amit a megvalósítás megtanított

1. **A fa mint közvetlen fegyver lassú.** 0,85 mp vágás + 0,38 mp dőlés alatt egy
   figyelő ellenfél kisétál a sávból. A fa akkor öl, amikor a másik *nem tud kilépni*:
   mert éppen ő is vág, mert rönk zárja el, vagy mert a tűz elvette a helyet. Ez a
   késői kör dinamikája, és pontosan ez volt a szándék, csak a mérés tette láthatóvá.
2. **A koronát is be kellett tenni a hitboxba.** Csak a törzs sávjával feleannyi találat volt.
3. **A tűz többet öl, mint a fa** (bot vs bot mérésen kb. 6:1). Emberi játéknál ez
   javulni fog, de ez az első szám, amit playteszt után nézni kell.

## Első 15 perc checklist

1. Ghosting-teszt **azon a gépen**, amin demózni fogtok: WASD + nyilak egyszerre, minden irány.
2. A state-kontraktus és a game loop megírása, commitolása.
3. A fájlfelosztás és a gazdák kiosztása.
4. Egy futó `index.html`, amiben két téglalap mozog. Innentől mindenki tud párhuzamosan dolgozni.
