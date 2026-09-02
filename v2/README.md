# DŐL A FA - v2 (varázsmód)

Ez a **v1 másolata**, plusz egy `Z` betűvel kapcsolható varázsmód, amiben
számgombbal más-más **pályavilágot** lehet választani. A **játékmenet mindenhol
pontosan ugyanaz**: valami magasat vágsz, az tőled elfelé dől és azonnal öl,
közben egy záruló veszély szorít. Csak a bőr változik.

A v1 érintetlen marad a repó gyökerében. Ha valami elromlik itt, ott ugyanaz a
játék fut tovább.

## Indítás

```bash
node server.js
```

- v1: http://localhost:5173
- v2: http://localhost:5173/v2/

Ugyanaz a szerver szolgálja ki mindkettőt. Nincs `npm install`, nincs build.

## Varázsmód

A bal alsó sarokban egy **varázspálca ikon** és egy `Z` betű mutatja az
állapotot, ugyanúgy, ahogy jobb oldalt a hangszóró és az `M`. Kikapcsolva a
pálca szürke, bekapcsolva világít.

Bekapcsolva:

- az indítóképernyő átvált varázshangulatra: színt váltó cím, sodródó szikrák,
  hullámzó fényfátyol,
- megjelenik a **pályaválasztó sáv**: két sorban, soronként négy doboz, mindegyikben
  a pálya ikonja és a hozzá tartozó szám, a végén `R` a véletlen pályára,
- a kiválasztott doboz kerete világít, a száma fényes, alatta a pálya neve.

| Billentyű | Hatás |
|---|---|
| `Z` | varázsmód be/ki (kikapcsolva mindig visszaáll a 0. pálya) |
| `0`-`7` | pályaválasztás (a numerikus billentyűzet is jó) |
| `R` | véletlen pálya: egy meccsen belül minden kör MÁS világban, véletlen sorrendben |

A pályaválasztás **csak a menüben** működik, meccs közben nem cserélhető a világ.
Véletlen pályánál nem lehet szereplőt választani (még nem tudni, kik lesznek):
ilyenkor névtelen sziluett áll a helyükön, és a fel-le nyíl el is tűnik. A cím
is ezt mondja: **DŐL A MEGLEPETÉS**, mert a világot csak a kör indulásakor
sorsoljuk ki.

## Billentyűzet-kiosztás

Az input **azt nézi, ami a gombra van írva**, nem azt, hol van a gomb. Magyar
kiosztáson tehát a `Z` betűs gomb jelenti a `Z`-t (nem az `Y`-os), és a `0` is
ott működik, ahol a magyar kiosztáson van. Ha a karakter nem betű vagy szám
(`SPACE`, nyilak, ékezetes betűk), akkor esik vissza a fizikai pozícióra.
Lásd `canonicalCode()` az [input.js](src/input.js)-ben.

## Hang

Betöltéskor a játék **néma**: egy frissítés sosem harsog bele a szobába. Az `M`
kapcsolja be. Minden pályának **saját dallama** van (ugyanaz a chiptune-motor
játssza mindet, csak a hangjegyek, a tempó és a hangszín más), és varázsmódban
minden dallam kb. 1,32-szeres tempóval szól.

| Pálya | Zene |
|---|---|
| ERDŐ | 138 BPM favágó-induló (a v1-ből, változatlanul) |
| TEMETŐ | 92 BPM gyászinduló, végig bővített kvartokkal (A-D#, F-B, E-A#) |
| SIVATAG | 128 BPM fríg-dúr, kézidobos lüktetés |
| JÉGMEZŐ | 112 BPM ritka, magas, csengő hangok |
| IDEGEN BOLYGÓ | 152 BPM fűrészfog-arpeggio |
| DZSUNGEL | 132 BPM moll pentaton, dobos kísérettel |
| CUKORKAVILÁG | 146 BPM gyors dúr, csengettyűs |

## Extra mechanikák

Az alapszabályok mindenhol azonosak. Ezen felül **minden extra pálya kap egy
saját mechanikát**, ami a témájából következik. A 0. pálya (erdő) szándékosan
nem kap semmit: az a tiszta alapjáték, amihez a többit mérni lehet.

| Pálya | Mechanika | Mit csinál |
|---|---|---|
| ERDŐ | - | tiszta alapjáték |
| TEMETŐ | kísértetjárás | a kidőlt sírkő helyén szipolyozó folt marad |
| SIVATAG | széllökés | időnként végigsöpör egy lökés, és elsodor mindenkit |
| JÉGMEZŐ | csúszás + repedés | lassan gyorsulsz és sokáig kicsúszol; ahova oszlop dőlt, ott megreped a jég, és aki sokáig áll rajta, beszakad alatta |
| IDEGEN BOLYGÓ | lökéshullám + süllyedés | a kidöntött kristály ellöki a másikat, majd lassan elmerül a talajban, és utána át lehet sétálni rajta |
| DZSUNGEL | indák | a kidőlt totemből indák nőnek, és lelassítják a másikat |
| CUKORKAVILÁG | cukorroham + ragadósság | a vágás rövid gyorsulást ad, a kidőlt nyaloka viszont szirupot hagy, ami lelassít és elnyeli a lökést |
| DOMINÓ | láncreakció | a kidőlt lap **maga dönti a következőt**, és a hullám kanyarodni is tud |

A dominó láncot végigmértem: átlagosan 1,24 lap dől el egy saját vágásra, a
leghosszabb hullám 11 lap volt, és 12 meccs alatt 5 halált okozott.

## Ambiens hang

A zene mellett szól a **veszélyzóna moraja** is, és ez is pályánként más.
Mindenhol ugyanaz a zajforrás megy, csak más szűrőn át és más lüktetéssel:

| Pálya | Moraj |
|---|---|
| ERDŐ | mély, ropogó tűz |
| TEMETŐ | mélyen huhogó, lassan hullámzó huzat |
| SIVATAG | homokot hordó szél |
| JÉGMEZŐ | magas, gyorsan didergő fagyos szél |
| IDEGEN BOLYGÓ | rezonáló plazma-zúgás |
| DZSUNGEL | magas levélzörgés |
| CUKORKAVILÁG | pezsgő, buborékoló cukor |
| véletlen pálya (menü) | mélyen kongó, lassan hullámzó rejtély |

A **vágás és a kidőlés hangja anyagfüggő**: fát vágni más, mint kőbe vésni.
Erdőben tompa reccsenés, temetőben és sivatagban vésőkoppanás, jégmezőn
magas ropogás, kristálynál harangszerű csendülés, dzsungelben mély dobszerű
kongás, cukorkavilágban rövid roppanás.

A meccs végén a **háttérzaj teljesen elhallgat**, és egy generált diadal-fanfár
szól: pontozott ritmusú felvezetés, majd kitartott dúr akkord, alatta pergődob.

## Végtelen mód

A `SHIFT+R` **bármikor** kapcsolja a végtelen módot: menüben, játék közben és
a győztes-képernyőn is. Amíg be van kapcsolva, a bal alsó sarokban ott a
végtelen jel. A győztes-képernyőn a `SHIFT+R` **végtelen módot** indít: onnantól minden meccs
végén visszaszámlál 4 másodpercet, és magától indítja a következőt, ugyanazokkal
a beállításokkal. A `SHIFT+R` ugyanígy le is állítja, a `SPACE` és az `ENTER`
pedig visszavisz a menübe.
Véletlen pályával kombinálva végtelen, mindig más világban játszódó sorozat.

## Sebzés

A fejszecsapás ereje harang-eloszlású, és a **támadótól függ**. Az ellökés a
sebzés ellentéte: a gyenge csapás messzire penderíti a másikat, a nagy pedig
helyben tartja, tehát követhető.

| Támadó | Sebzés | Ellökés |
|---|---|---|
| Béna bot | 1-6 (átlag 3,5) | 178 (1-nél) → 84 (6-nál) |
| Ügyes bot | 2-8 (átlag 5,0) | 178 (2-nél) → 84 (8-nál) |
| Ember | 2-8 (átlag 5,0) | ugyanaz |

## Pályák

| # | Pálya | Amit vágsz | Veszély | Szereplők | Menedék |
|---|---|---|---|---|---|
| 0 | ERDŐ | fenyő | erdőtűz | 11 favágó (a v1 gárdája) | faház |
| 1 | TEMETŐ | sír | lila szellemláng | csontváz, sírásó, zombi, tökfej, lepedős szellem, madárijesztő | kripta |
| 2 | SIVATAG | obeliszk | homokvihar | fáraó, múmia, Anubisz, beduin | lépcsős piramis |
| 3 | JÉGMEZŐ | jégoszlop | emelkedő víz | két pufi parkás inuit, jegesmedve, agancsos sámán, halász | iglu |
| 4 | IDEGEN BOLYGÓ | kristály | plazma | négy eltérő sisakú űrhajós, egy zöld űrlény | ufó |
| 5 | DZSUNGEL | totemoszlop | kúszó inda | sámán, jaguárharcos, kutató, majom, kígyópapnő | azték templom |
| 6 | CUKORKAVILÁG | nyalóka | olvadt csoki | mézeskalács, tündér, manó, gumimaci, cukrász | mézeskalács ház |
| 7 | DOMINÓ | dominólap | morzsálódó asztalszél | ólomkatona, sakkhuszár, dobókocka, felhúzós robot, kártyakirály | dominóház |

Minden pályának saját címe, saját kiáltása, palettája, döntetlen-felirata és
zenéje van. A cím és a kiáltás mindenhol ugyanaz a rövid mondat, hogy a
játék közben is elolvasható legyen:

| Pálya | Cím és kiáltás |
|---|---|
| ERDŐ | `DŐL A FA` |
| TEMETŐ | `DŐL A SÍR` |
| SIVATAG | `DŐL A KŐ` |
| JÉGMEZŐ | `DŐL A JÉG` |
| IDEGEN BOLYGÓ | `DŐL A FÉNY` |
| DZSUNGEL | `DŐL A TOTEM` |
| CUKORKAVILÁG | `DŐL A CUKOR` |

### Amit a pálya cserél a bőrön kívül

- **A kidőlt alak**: rönk, kidőlt sírkő, fekvő oszlop, jégszilánk, kristályprizma.
- **A tő**, ami a helyén marad.
- **A záruló veszély alakja**: lobogó láng, kísértetláng, homokörvény, hullámzó
  víz, cikázó plazmaív.
- **A patak**: az erdőben és a temetőben víz, a sivatagban kiszáradt meder, a
  jégmezőn repedés a jégen.
- **A mozgó élőlények** (`critters.js`): a nyúl helyén patkány / szkarabeusz /
  pingvin / gömbrobot áll, a farkas helyén csontfarkas / sakál / sarki farkas /
  xenokutya, és így tovább mind a hét szerepkörben.
- **A helyben álló apróságok** (`props.js`): virág helyett gyertyacsonk,
  kaktusz, jégszilánk vagy világító spóra; gomba helyett koponya, jégvirág vagy
  kristályhajtás; és a talaj szemcséinek színe is.
- **A nap**: a temetőben és az idegen bolygón nincs, csak a hold.

## Ami a v1-ből változatlan

A szabályok: sebzés, gyógyulás, hárítás, szívek, napszakok, a faház-kifutó
menete, a két botszint, a szünet-logika. A varázsmód **kizárólag a kinézetet és
a hangot** cseréli.

## Hol van a kód

| Fájl | Mi van benne |
|---|---|
| `src/themes.js` | az öt pálya: szereplők, oszlopok, paletta, feliratok, veszély, épület |
| `src/critters.js` | a mozgó élőlények pályánként |
| `src/props.js` | a helyben álló apró díszletek és a talaj színei pályánként |
| `src/config.js` | `applyTheme()`: helyben írja át a `TEAM` / `TREE_KINDS` / `PAL` tartalmát |
| `src/sprites.js` | oszlopformák, szereplőfajok, szerszámok, veszélyformák |
| `src/decor-sprites.js` | a menedék öt változata, a patak három változata |
| `src/audio.js` | `TRACKS`: pályánkénti dallam, `setMusicTrack`, `setMusicTempo` |
| `src/hud.js` | varázs-indítókép, pályaválasztó sáv, pálca ikon |
| `src/main.js` | `setTheme()`, `Z` és a számgombok kezelése |

A `TEAM`, `TREE_KINDS` és `PAL` **helyben mutálódik**, nem cserélődik le: a többi
modul már tartja rájuk a hivatkozást, egy új objektum ott nem látszódna. A
sprite-készlet (`S`) ugyanezért marad ugyanaz az objektum, csak a tartalma épül
újra témaváltáskor.

A menedék minden pályán ugyanazt a szerződést teljesíti: 34x30 vászon, egy 9x14
ajtónyílás és egy kb. 13x11 nyílás, amiben a győztes feje megjelenik a
záróképen. Csak a faháznak van üvege, a többinek puszta nyílása.
