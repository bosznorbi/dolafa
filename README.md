# DŐL A FA

Kétszemélyes, egy gépes, egy képernyős pixel art aréna játék. Két favágó próbálja
egymásra dönteni a fákat, miközben az erdőtűz kívülről szorít, és a pályán belül is
kigyulladnak tűzfészkek.

Egy meccs kb. **50-65 másodperc** (best of 5).

**Játszani lehet vele itt: [favago.bosz.dev](https://favago.bosz.dev)**

Nincs telepítés és nincs regisztráció, böngészőben fut. Egy billentyűzeten két
ember játszik, de gép elleni bot is van, tehát egyedül is kipróbálható.

## Három változat

Mindhárom él, és mindegyik külön címen érhető el.

| | Cím | Mi ez |
|---|---|---|
| **v2** | [favago.bosz.dev](https://favago.bosz.dev) | ez szól a puszta címen: a v1 plusz `Z` varázsmód, tíz választható pályavilággal |
| **v1** | [favago.bosz.dev/v1](https://favago.bosz.dev/v1) | az első kész játék, egy pályavilággal |
| **v3** | [favago.bosz.dev/v3](https://favago.bosz.dev/v3) | a v2 plusz két USB SNES kontroller támogatása |

Az alapértelmezett változatnak szándékosan egyetlen címe van. Aki `/v2`-t üt be,
azt egy átirányítás viszi a tiszta címre.

Mindegyik külön mappa a repóban, saját README-vel ([v2](v2/README.md),
[v3](v3/README.md)). Egyik sem érinti a korábbi változat kódját: ha az újban
elromlik valami, a régi ugyanúgy fut tovább.

## Irányítás röviden

Az első játékos `W` `A` `S` `D`, a második a nyilak, a `SPACE` indít és
szüneteltet. Akciógomb nincs, csak négy irány. A v3-ban két USB SNES kontroller
is használható.

## Futtatás saját gépen

```bash
node server.js
```

Utána: http://localhost:5173, a v2 pedig http://localhost:5173/v2/ címen.

Nincs `npm install`, nincs build, nincs függőség. A kép széltől szélig kitölti az
ablakot, F11 alatt a teljes monitort.

## Élesítés

A `main` ágra tolt minden változtatás magától kikerül a
[favago.bosz.dev](https://favago.bosz.dev) címre. A [build.mjs](build.mjs) állítja
össze a kitett csomagot a három változatból: az alapértelmezett a gyökérbe kerül,
a másik kettő a saját `/v1/` és `/v3/` útvonalára.

## Közreműködés

Ez egy személyes projekt, bemutató céllal. Pull requestet nem fogadok, de ha
hibát találsz, nyugodtan nyiss egy issue-t.

## Licenc

[MIT](LICENSE), Norbert Bosz, 2026.

---

> Innentől a dokumentum a **v1** működését írja le részletesen, és több ponton
> eltér a későbbi változatoktól. A mérvadó leírás mindig az adott változat saját
> README-je.

## Irányítás

| | Mozgás | Egyéb |
|---|---|---|
| 1. játékos | `W` `A` `S` `D` | - |
| 2. játékos | nyilak | - |
| közös | - | `SPACE` = start / szünet / folytatás, `ESC` = szünet, majd kilépés, `M` = néma |

`Enter` mindenhol működik a `SPACE` helyett is. **A játékmenetben nincs akciógomb**,
csak 4 irány, hogy a retro kontroller D-padja is elég legyen.

Játék közben a `SPACE` **mindig csak szüneteltet**, körök között is: sosem ugrik
előre. A **győztes-képernyőn** viszont a `SPACE` és az `ENTER` visszavisz a
főmenübe, az `R` pedig **ugyanazokkal a beállításokkal** indít új meccset.
A szünet két lüktető függőleges vonal, mint egy lejátszón, és **a zene is megáll**.

Ha **elnavigálsz a lapról** vagy másik ablakra váltasz, a játék automatikusan
szünetre áll, tehát visszatérve pontosan onnan folytathatod.

Némítás: a menüben hangszóró ikon + `M` betű mutatja a lehetőséget, és az ikon
maga jelzi az állapotot. Játék közben nincs ikon, **csak ha némítva van**: akkor egy
halvány áthúzott hangszóró a jobb alsó sarokban.

### Indítóképernyő

Osztott: bal oldalon a WASD, jobb oldalon a nyilak, mindkettő kirajzolt billentyűkkel.
**Mindkét oldalt a saját gombjai állítják**, egyetlen soron, két tengelyen:

- **balra-jobbra:** JÁTÉKOS / BÉNA BOT / ÜGYES BOT.
- **fel-le:** a szín. A billentyűk alatt **ott áll az a favágó, akivel játszani
  fogsz**, helyben lépkedve, és a kiírás színe is vele változik. A másik oldal
  színét kihagyja.

**Tíz favágó, tíz különböző ember:** piros, kék, zöld, sárga, lila, fekete, fehér,
rózsaszín, barna, szürke. Mindegyiknek más az inge (kockás, csíkos, sima
nadrágtartóval, pöttyös, függőleges csíkos), más a fejfedője (sapka, bojtos kötött
sapka, széles karimájú kalap, kendő, füles usanka, fejpánt, munkasisak, vagy kopasz
fej oldalhajjal), más az arcszőrzete (teli szakáll, bajusz, hosszú szakáll,
kecskeszakáll, pofaszakáll, borotvált) és **más alakú a fejszéje** (klasszikus,
széles élű, kétélű, kisbalta, hosszú nyelű). A barna favágó alsógatyában dolgozik.

## HUD

Fent a két favágó neve a saját színében, mellette **kupák** a megnyert körökért,
alatta a szívek, középen a kör sorszáma és a tűz visszaszámlálója.

A név attól függ, ki játszik ki ellen: **játékos-robot** párosnál elég a `JÁTÉKOS`
és a `ROBOT`, mert a szín úgyis megkülönbözteti őket. Ha viszont **két robot vagy
két játékos** van, a szín neve is kiírásra kerül (`PINK ROBOT`, `ZÖLD ROBOT`,
`LILA JÁTÉKOS`), különben nem lehetne megmondani, ki kicsoda.

Ugyanez a szabály a **körvégi és a meccsvégi** feliratra is: `A PINK ROBOT NYERTE A
KÖRT`. A felirat mérete automatikusan csökken, ha a hosszabb név nem férne ki.

## Szabályok

### Élet

**5 szív, egyenként 20%**, részlegesen is töltődnek. Mindenki **70%-ról indul**.
Az élet **magától is fogy** (3 pont/mp), tehát a favágás kötelező.

### A fa

1. Odaállsz egy fához, és a favágód automatikusan vágni kezdi. **Amit elkezdtél
   vágni, azt nem tudja elvenni tőled a másik**, amíg vágod. Ha elengeded, rövid
   idő múlva bárkié lehet, a félkész vágással együtt.
2. A fa **pontosan a veled ellentétes irányba dől**, szabad szögben. Nem négy
   irányba: körbe járva a fát tetszőleges szögre lehet célozni.
3. Vágás közben **kivetül a földre a veszélyzóna** (sakktábla-minta), és 72% fölött
   narancsra vált.
4. **Akire rádől a fa, az azonnal kiesik**, és rövid kilapulás-animációval elterül.
   **A saját kivágott fád soha nem eshet rád**, tehát nem tudod magad megölni:
   nem lehet aláfutni.
5. Minden kidöntött fa visszaad az életedből, méret szerint:

| Méret | Élet | Vágási idő | Hatótáv |
|---|---|---|---|
| kicsi | 4-8 | gyors (0,72x) | rövid |
| közepes | 6-10 | alap | közepes |
| nagy | 8-12 | lassú (1,38x) | hosszú |

Az elégett fa eltűnik és át lehet menni rajta, de amíg ég, még akadály.

### A fejsze

- **Szembe** menve mindketten hárítanak: nulla sebzés, csak szikra és csattanás,
  felirat nélkül.
- **Oldalról vagy hátulról** 6-11 pont csapásonként, **harang alakú eloszlással**
  (a közepes csapás a gyakori, a 6 és a 11 ritka), kiírva a sebzés. A megütött
  favágó elrepül egy kicsit, **±22,5 fokos véletlen szögben**, hogy ne lehessen egy
  helyben újra és újra eltalálni.
- Aki közelről elfelé fut, átmenetileg 26%-kal gyorsabb, tehát el tud menekülni.

Vigyázz: amikor fát vágsz, a favágód a fa felé fordul, tehát oldalt hagyod magad.

### A tűz

Két forrásból ég: **külső front** szabálytalan alakban kívülről befelé, és
**tűzfészkek**, amik az 5. másodperctől gyulladnak a pályán belül. A biztonságos
terület így szabálytalan szigetekre esik szét, nem egy kiszámítható gyűrűre.
A tűz 26 pont/másodperc.

Az egymást elérő tűzfoltok **egyetlen folttá olvadnak**: a másik folt belsejébe eső
peremszakaszokat és a már leégett területre esőket eldobjuk, tehát a lángvonalak
nem keresztezik egymást. Enélkül a tűz vonalai áthaladtak egymáson, és a leégett
részen is futott láng.

### Fairség

- A **fák középpontosan tükrözöttek**: ami az egyiknek jobbra fent van, az a
  másiknak balra lent. A pálya 180 fokos elforgatásra néz ki ugyanúgy.
- A **tűzfészkek párban** gyulladnak, **középpontosan tükrözött helyen**, de
  **külön-külön véletlen alakkal**, tehát a tűz nem néz ki szimmetrikusnak. Ez azért
  fair, mert a két alak a kör magjából származik: nincs olyan forma, ami mindig
  ugyanarra az oldalra kerülne. (Pontosan ez volt a korábbi elfogultság oka.)
- A **külső tűzfront szándékosan aszimmetrikus**, hogy a pálya ne nézzen ki
  szimmetrikusnak.

Mérve: azonos szintű botok között **50%** (30 meccs, 61-61 megnyert kör).

### Napszak és díszlet

Öt napszak, körönként egy, **mindig sorban, az állástól függetlenül**: ha 2-0-nál
véget ér a meccs, akkor a naplementénél állunk meg.

| Kör | Napszak | Statikus | Mozgó |
|---|---|---|---|
| 1 | napfelkelte | virágok | pillangók, madarak |
| 2 | délelőtt | virágok | madarak, nyulak, mókusok |
| 3 | naplemente | virágok + gombák | denevérek, farkasok, mókusok, füstpára |
| 4 | sötétedés | gombák, sziklák, pókháló | farkasok, denevérek, ülő bagoly, szentjánosbogarak |
| 5 | mély éjszaka | gombák, sziklák, pókháló, földi parázs | medve (egy), bagoly, szentjánosbogarak |

Plusz körönként egy **véletlen útvonalon kanyargó patak**, ami mindig a pálya egyik
szélétől a másikig átível, nem tükrözve. A szöget vízszintes körüli sávból sorsoljuk,
tehát a hosszú, 320 pixeles oldalt szeli át: mérve 300-368 pixel a képen belül. Az égen nap és hold vonul át, éjjel
csillagok.

Két külön rétegben színezünk: a **háttér erősen sötétedik, a szereplők alig**, hogy
a favágók éjszaka is jól látszódjanak.

Három tudatos döntés a kért ötletekből:

- **Az izzó fa kimaradt meleg fényként.** Egy játékban, ahol a narancs fény halált
  jelent, a világító fa félrevezető. Helyette hideg, kékes holdfény-perem került a
  koronákra: ugyanaz a hatás, de sosem téveszthető össze tűzzel.
- **A bagoly nem repül, hanem ül** egy fán és pislog. Repülő baglyot a denevérek
  mellé tenni túl sok mozgás ezen a kis képen.
- **Medve pontosan egy van, kicsi és lassú.** Egy játékos méretű mozgó sötét folt
  elvonná a figyelmet arról, ami tényleg megöl. Fázisonként legfeljebb hat mozgó
  élőlény van a képen.

### A menedék és a záróanimáció

Amikor valaki eléri a **2 pontot**, tehát a következő kör már döntő lehet, a pályán
**megjelenik egy favágó-menedék** véletlen helyen. Addig nincs ott. Így a döntő kör
elején mindenki látja, hova érdemes futni a végén.

A meccs végén a győztes **onnan fut a menedékbe, ahol éppen túlélte az utolsó kört**,
becsapódik mögötte az ajtó, és **a játéktér saját tűzfrontja** húzódik össze a kunyhó
köré: nem új tűz jön, hanem ugyanaz az ismerős szabálytalan perem. Körülötte minden
leég, a ház nem. A favágó **kinéz a nagy ablakon**, a keresztfa az arca előtt, füst
száll a kéményből. Csak ezután jön a győztes-felirat.

Ez adja meg a játék történetét: nem az nyer, aki megöl valakit, hanem aki eléri a
fedelet.

**A menedék szilárd akadály**, nem lehet átmenni rajta, és nem kerül a patak partjára.
Fair-figyelmeztetés: egyetlen, véletlen helyű akadály elvileg megtöri a középpontos
tükrözést, tehát az egyik játékos kaphat egy kicsivel jobb fedezéket. Mivel csak a
döntő körben van jelen, és a mérés nem mutatott elfogultságot, így hagytuk. Ha
zavarna, két igazságos megoldás van: a pálya közepére tenni, vagy tükörpárban kettőt.

## Hang

Minden hang WebAudio-val generálódik. Van egy chiptune favágó-induló a háttérben,
halkan az égéshang mögött. `M` némít. A menüben hangszóró ikon + `M` betű mutatja
a lehetőséget; játék közben csak akkor látszik valami, ha némítva van: egy halvány
áthúzott hangszóró a jobb alsó sarokban.

## Fájlszerkezet és gazdák

| Fájl | Felelősség |
|---|---|
| `src/main.js` | game loop, állapotgép, körkezelés, sebzés-összekötés |
| `src/config.js` | **minden hangolható szám, a paletta, `TEAM`, `TREE_KINDS`** |
| `src/input.js` | input absztrakció (itt jön be majd a kontroller) |
| `src/trees.js` | vágás, szabad szögű dőlés, hitbox, rönk |
| `src/arena.js` | külső tűzfront, tűzfészkek, kezdőpozíciók |
| `src/player.js` | mozgás, ütközés, sebzés, gyógyulás, fejszepárbaj |
| `src/bot.js` | egyjátékos mód |
| `src/decor.js` | nyuszik, farkasok, madarak, virágok, csillagok |
| `src/render.js` | rajzolás (soha nem módosít állapotot) |
| `src/sprites.js` | **minden grafika kódból generálva** |
| `src/hud.js` | szívek, menü, bannerek, animációk |
| `src/particles.js` | forgács, szikra, füst, hamu |
| `src/font.js` | 5x7 bitmap font, magyar ékezetekkel |
| `src/audio.js` | WebAudio effektek és a háttérzene |

## A robot két szintje

Az **alapok mindkettőnél ugyanazok**: sosem lépnek tűzbe, fát vágnak, és próbálnak
életben maradni. A különbség a pontosságban van.

| | BÉNA BOT | ÜGYES BOT |
|---|---|---|
| reakcióidő | 1,35 mp | 0,07 mp |
| dőlő fa észlelése | 0,42 mp (a dőlés 0,38, tehát elkésik) | 0,02 mp |
| árnyék olvasása | soha | 90%-os vágásnál |
| **célzás** | oda, ahol az ellenfél **most** van | oda, ahol a dőlés pillanatában **lesz** |
| mozgás | 0,62x | 1,10x |
| fejsze használata | nem | igen |
| irány sodródása | ±49° | nincs |
| félkész fa elorzása | alig | igen |
| életgazdálkodás | alig | igen |

A béna bot **nem áll meg egy helyben**: folyamatosan mozog, csak rosszul, mert az
iránya véletlenszerűen sodródik. A célzás a legfontosabb különbség. A fa csak 1-1,5 másodperc múlva ér földet, tehát
a jelenlegi helyre célozni majdnem mindig mellémegy. Az ügyes bot megbecsüli, hol
lesz addigra az ellenfél, és oda dönti a fát.

Mérve:

| páros | erősebb nyer |
|---|---|
| ügyes vs béna | **14/18 (78%)** |
| ügyes vs ügyes | 55% (38 meccs) |
| béna vs béna | 5/12 (42%) |

Az ügyes bot ezen felül a fejszét is használja: ügyes-ügyes meccseken a halálok
negyede fejszecsapás.

## Fejlesztői eszközök

```js
__timber.startMatch([{color:0,mode:0},{color:1,mode:2}])
__timber.step(1/60)     // egy logikai lepes
__timber.render(t)      // egy kep
__timber.shot('nev')    // PNG a shots/ mappaba
__timber.g              // a teljes jatekallapot
```

A `main.js` **minden** botot frissít, tehát a mérő kódban nem szabad külön
`updateBot`-ot hívni.

## Hibák, amiket a mérés hozott elő

1. **Oldal-elfogultság a tűzfészkekben.** A pár két tagja külön-külön kapott
   véletlen alakot, de a számláló körönként nulláról indult, tehát minden körben
   ugyanaz a két alak került a két oldalra. A jobb oldal 12/14-et nyert. Javítva:
   a pár pontos tükörkép, és a kör magjából származik.
2. **A nehéz robot a saját vágásának árnyékától menekült**, mert a `chopper` mező
   képkockánként nullázódik. Külön `previewBy` mező oldotta meg.
3. **Képkockánkénti kockadobás a kitérésnél.** 60 FPS-en emiatt mindhárom bot
   gyakorlatilag mindig kitért, a nehézségi szintek alig különböztek.
   Determinisztikus reakcióidő váltotta ki.
4. **Célingadozás.** A nehéz robot 0,08 mp-enként újraválasztott célt nulla zajjal,
   ezért két közel egyforma fa között oda-vissza kapkodott és egyiket sem vágta ki:
   körönként 2,5 fát döntött a haladó 3,6-ja helyett. Hiszterézis oldotta meg.
5. **Az árnyék elől menekülés rontotta a botot.** Ablációval mérve: nélküle 7/12,
   vele 4/12. Aki menekül, nem vág fát, és éhen hal. Most csak az utolsó pillanatban
   lép ki, és csak a nehéz szint.

Ezen kívül ellenőrizve: a tűz sebzése **bizonyítottan azonos** a két oldalon
(azonos helyen 26 vs 26 pont/mp). A korábbi „a robot kevésbé sebződik" érzet abból
jött, hogy a bot hamarabb menekül a tűz elől.

## A robotok önvédelme

A robotok nem ölik meg magukat:

- a saját kivágott fájuk eleve nem eshet rájuk (ez játékszabály, mindenkire igaz),
- minden mozgás-parancsuk átmegy egy **tűz-vétón**: ha az irány lángba vinne, a
  legközelebbi biztonságos irányt választják helyette,
- a kezdő robot is figyel valamennyire az életére, hogy ne éhezzen ki,
- **beragadás-oldás**: ha a robot egy helyben áll, pedig menni akarna (rönknek vagy
  a háznak feszül), rövid időre elforgatott irányba indul. Vágás közben ez ki van
  kapcsolva, mert olyankor szándékosan áll egy helyben.

Mérve 30 meccsen (131 kör): **0 saját fa okozta halál**, 4 korai tűzhalál
(beszorulás rönkök közé), 9 kimerülés. A 33 késői tűzhalál a kör tervezett
lezárása, nem hiba.

## További hibák, amiket a mérés hozott elő

- **Fehér foltok az éjszakai záróképen.** A nullára zsugorodott tűzfészkek poligonja
  egy pontba esett össze, és ott negyven lángsprite rajzolódott egymásra; az additív
  éjszakai fényben ez kifehéredett. A túl kicsi fészkeket most kihagyjuk.
- **A beragadás-oldás elrontotta a favágást.** Az első verzió a vágás közbeni
  álldogálást is beragadásnak vette, és a bot közepén elrántotta a favágót.
  A mérés szerint a bot idejének 69%-át tölti vágással, tehát ez majdnem mindig
  tévesen sült el. Most a vágás kivétel: hosszú beragadás 0,35 epizód körönként,
  a leghosszabb 1,6 másodperc.
- **A robot ugyanannyit sebződik tűzön kívül, mint az ember.** Két független
  méréssel ellenőrizve: mindkettő pontosan 3 pont/másodperc. Amit látni lehet, az a
  robot gyógyulása a favágásból.

## Következő lépések

- Stratégiai réteg a nehéz robotnak (lásd fent).
- Kontroller (Gamepad API): az `src/input.js` `readPad()` már ott van.
- Power-upok, és hogy a kidöntött égő fa vigye magával a tüzet.
