// Temak. A JATEKMECHANIKA MINDEGYIKBEN UGYANAZ: valami magasat vagsz, az
// toled elfele dol es azonnal ol, kozben egy zarulo veszely szorit.
// Csak a bor valtozik: paletta, a "fa" alakja, a veszely szine, a szereplok
// es a kialtas.
//
// A 0-as tema az eredeti erdo. A tobbi a Z modban szamgombbal valaszthato.

function chars(species, list) {
  // A nem-emberi fajoknal nincs szakall es nincs alsogatya-tema: az
  // alapertekek itt dolnek el, hogy a temaknal csak az eltereseket kelljen irni.
  return list.map((c) => Object.assign({
    species, beard: 'none', legs: 'pants', axe: 'classic', hat: 'none', pattern: 'plain',
  }, c));
}

// ---------------------------------------------------------------- 0. erdo

const ERDO_CHARS = chars('human', [
  {
    name: 'PIROS', tint: '#e05a3c',
    hat: 'cap', beard: 'full', pattern: 'plaid', axe: 'classic', legs: 'pants',
    shirt: '#c8402f', shirtDark: '#8f2a1e', shirtDeep: '#6b1d15',
    cap: '#d8532f', capDark: '#8f3218',
    hair: '#7a4a24', beardCol: '#95612c', beardDark: '#6b4420',
    pants: '#39434f', pantsDark: '#262e37', boot: '#3a2a1c',
    skin: '#e8b48c', skinDark: '#c08a64',
  },
  {
    name: 'KÉK', tint: '#4d8fe0',
    hat: 'beanie', beard: 'mous', pattern: 'stripe', axe: 'wide', legs: 'pants',
    shirt: '#3a6fc4', shirtDark: '#27508c', shirtDeep: '#1b3a68',
    cap: '#2f6bd8', capDark: '#1d4490',
    hair: '#3e2c1c', beardCol: '#5d4630', beardDark: '#3f2f20',
    pants: '#3b3a45', pantsDark: '#28272f', boot: '#2f2620',
    skin: '#e0a87c', skinDark: '#b8815a',
  },
  {
    name: 'ZÖLD', tint: '#5cc45a',
    hat: 'none', beard: 'long', pattern: 'plain', axe: 'double', legs: 'pants',
    dog: true,
    shirt: '#3f9a3c', shirtDark: '#2a6b28', shirtDeep: '#1c4a1b',
    cap: '#48b045', capDark: '#2c6f2a',
    hair: '#2e2014', beardCol: '#3e2c18', beardDark: '#2a1d10',
    pants: '#3c4238', pantsDark: '#282d26', boot: '#33291d',
    skin: '#7a5232', skinDark: '#57381f',
  },
  {
    name: 'SÁRGA', tint: '#e8c445',
    hat: 'brim', beard: 'goatee', pattern: 'plaid', axe: 'small', legs: 'pants',
    shirt: '#d8a828', shirtDark: '#9c761a', shirtDeep: '#6e5312',
    cap: '#e8bc3c', capDark: '#9c7a1e',
    hair: '#4a3418', beardCol: '#6b4c22', beardDark: '#4a3417',
    pants: '#454034', pantsDark: '#2e2a22', boot: '#372c1e',
    skin: '#f0c096', skinDark: '#c4936a',
  },
  {
    name: 'LILA', tint: '#a874e0',
    hat: 'bandana', beard: 'none', pattern: 'dots', axe: 'long', legs: 'pants',
    body: 'female',
    shirt: '#8a4ac0', shirtDark: '#5f3288', shirtDeep: '#42225f',
    cap: '#b060e0', capDark: '#6f3a9c',
    hair: '#f0d878', hairDark: '#c8a83c', beardCol: '#4a3a4a', beardDark: '#332635',
    pants: '#3a3448', pantsDark: '#282334', boot: '#2c2430',
    skin: '#d8a884', skinDark: '#b0805e',
  },
  {
    name: 'FEKETE', tint: '#6e7286',
    hat: 'usanka', beard: 'full', pattern: 'vstripe', axe: 'double', legs: 'pants',
    shirt: '#33333c', shirtDark: '#1f1f26', shirtDeep: '#141419',
    cap: '#44444e', capDark: '#26262e',
    hair: '#1a1a1f', beardCol: '#2e2e36', beardDark: '#1a1a20',
    pants: '#26262e', pantsDark: '#17171c', boot: '#101014',
    skin: '#8a5f3f', skinDark: '#6b472d',
  },
  {
    name: 'FEHÉR', tint: '#f0ece4',
    hat: 'headband', beard: 'mous', pattern: 'plain', axe: 'wide', legs: 'pants',
    shirt: '#e4e0d6', shirtDark: '#b4b0a6', shirtDeep: '#8e8a80',
    cap: '#f4f0e8', capDark: '#b8b4aa',
    hair: '#d8d2c4', beardCol: '#e8e4d8', beardDark: '#b4b0a4',
    pants: '#8e8a82', pantsDark: '#66635c', boot: '#4a4842',
    skin: '#f0cfae', skinDark: '#c8a382',
  },
  {
    name: 'PINK', tint: '#f08ab8',
    hat: 'cap', beard: 'sideburns', pattern: 'dots', axe: 'small', legs: 'pants',
    shirt: '#e878a8', shirtDark: '#b0507c', shirtDeep: '#7f3557',
    cap: '#f490bc', capDark: '#b25a86',
    hair: '#8a4a3a', beardCol: '#a05c48', beardDark: '#743e30',
    pants: '#5a4450', pantsDark: '#3e2e38', boot: '#33262e',
    skin: '#f4c4a4', skinDark: '#cc9a7a',
  },
  {
    name: 'BARNA', tint: '#b0824c',
    hat: 'none', beard: 'long', pattern: 'plain', axe: 'classic', legs: 'underwear',
    shirt: '#8a5c34', shirtDark: '#5f3e22', shirtDeep: '#432b17',
    cap: '#9a6a3c', capDark: '#68482a',
    hair: '#4a3218', beardCol: '#6b4a24', beardDark: '#4a3318',
    pants: '#e4dcc8', pantsDark: '#b8ae98', boot: '#3a2c1e',
    skin: '#dfab80', skinDark: '#b28460',
  },
  {
    name: 'SZÜRKE', tint: '#a8aeb6',
    hat: 'helmet', beard: 'none', pattern: 'vstripe', axe: 'long', legs: 'pants',
    body: 'female',
    shirt: '#8a9098', shirtDark: '#5e646c', shirtDeep: '#42474e',
    cap: '#c0c6ce', capDark: '#7e848c',
    hair: '#7a4a24', hairDark: '#553318', beardCol: '#6a6a72', beardDark: '#48484f',
    pants: '#4e525a', pantsDark: '#35383e', boot: '#2a2c31',
    skin: '#d8a880', skinDark: '#ae8160',
  },
  {
    name: 'NARANCS', tint: '#f0902c',
    hat: 'brim', beard: 'mous', pattern: 'stripe', axe: 'none', legs: 'pants',
    drinks: true,
    shirt: '#e0762a', shirtDark: '#a8521a', shirtDeep: '#78390f',
    cap: '#f0902c', capDark: '#a85c18',
    hair: '#6b3f1c', beardCol: '#8a5426', beardDark: '#5f3a19',
    pants: '#4a3b30', pantsDark: '#332821', boot: '#2e241c',
    skin: '#f0c49a', skinDark: '#c4996f',
  },
]);

// ---------------------------------------------------------------- 1. temeto

const TEMETO_CHARS = chars('skeleton', [
  {
    // Csontvaz kaszaval: a klasszikus arato.
    name: 'CSONT', tint: '#e8e4d4', species: 'skeleton', pattern: 'ribs', axe: 'scythe',
    shirt: '#d8d4c4', shirtDark: '#a8a498', shirtDeep: '#7a776c',
    cap: '#e8e4d4', capDark: '#a8a498',
    skin: '#e8e4d4', skinDark: '#b4b0a2', hair: '#8a8678',
    pants: '#d0ccbc', pantsDark: '#a09c8e', boot: '#5a564c',
  },
  {
    // Sirasó: elo ember, lapattal. Sáros csizma, gyurott kalap.
    name: 'SÍRÁSÓ', tint: '#c08a4a', species: 'human', hat: 'brim', beard: 'full',
    pattern: 'plain', axe: 'shovel',
    shirt: '#7a5e3a', shirtDark: '#544026', shirtDeep: '#3a2c1a',
    cap: '#5e4a30', capDark: '#3e301e',
    skin: '#d8a878', skinDark: '#ab8058', hair: '#4a3418',
    beardCol: '#5a4020', beardDark: '#3e2c16',
    pants: '#4a4238', pantsDark: '#332e26', boot: '#2a2018',
  },
  {
    // Zombi: zold bor, szakadt ing, rozsdas fejsze.
    name: 'ZOMBI', tint: '#7ce05a', species: 'zombie', hat: 'none', pattern: 'torn', axe: 'rusty',
    shirt: '#4f6a3c', shirtDark: '#354828', shirtDeep: '#22301a',
    cap: '#4f9a44', capDark: '#2f6329',
    skin: '#8fbf72', skinDark: '#628a4a', hair: '#3a4a28',
    pants: '#3e4636', pantsDark: '#2a3024', boot: '#1e2418',
  },
  {
    // Tokfej: a fej maga a tok, a vallon ul. Kaszaval jar.
    name: 'TÖK', tint: '#f0942c', species: 'pumpkin', pattern: 'cloak', axe: 'scythe',
    shirt: '#6a4a2a', shirtDark: '#48321c', shirtDeep: '#302212',
    cap: '#e8801e', capDark: '#a85410',
    skin: '#f0942c', skinDark: '#b06618', hair: '#3a6a24',
    pants: '#4a3a26', pantsDark: '#33281a', boot: '#241c12',
  },
  {
    // Szellem: attetszo, lebego alak. Nala is kasza van.
    name: 'SZELLEM', tint: '#a8d8f0', species: 'ghost', hat: 'none', pattern: 'cloak', axe: 'scythe',
    shirt: '#7f9fc0', shirtDark: '#5a7a9c', shirtDeep: '#3e5570',
    cap: '#9ac0e0', capDark: '#6a8aa8',
    skin: '#d8ecfa', skinDark: '#a6c2d8', hair: '#7f9fc0',
    pants: '#6f8fb0', pantsDark: '#4e6a86', boot: '#3a5068',
  },
  {
    // Vampir: sapadt arc, ozvegycsucsba futo fekete haj, voros szem es
    // agyarak. Felallo galleru kopeny, belul voros bélessel.
    name: 'VÁMPÍR', tint: '#c8203c', species: 'vampire', hat: 'none',
    beard: 'none', pattern: 'cape', axe: 'rusty',
    shirt: '#e8e4dc', shirtDark: '#b0aca4', shirtDeep: '#1a1820',
    cap: '#c8203c', capDark: '#8a1428',
    hair: '#1e1c26', beardCol: '#1e1c26', beardDark: '#121017',
    skin: '#dcd4d8', skinDark: '#aca4ac', boot: '#1a1820',
    pants: '#22202a', pantsDark: '#16141c',
  },
  {
    // Madarijeszto: szalmabol, vasvillaval.
    name: 'SZALMA', tint: '#e8c445', species: 'scarecrow', hat: 'brim', pattern: 'torn', axe: 'pitchfork',
    shirt: '#a8683a', shirtDark: '#754826', shirtDeep: '#503118',
    cap: '#8a6a3a', capDark: '#5c4626',
    skin: '#e0c070', skinDark: '#b09648', hair: '#e8c445',
    pants: '#8a7040', pantsDark: '#5e4c2a', boot: '#3a2e1c',
  },
]);

// ---------------------------------------------------------------- 2. sivatag

const SIVATAG_CHARS = chars('mummy', [
  {
    // Farao: nem be van tekerve, hanem elo. Nemes fejdisz, arany melldisz.
    name: 'FÁRAÓ', tint: '#f0c03c', species: 'pharaoh', hat: 'nemes', pattern: 'collar', axe: 'khopesh',
    shirt: '#e8dcc0', shirtDark: '#b4aa92', shirtDeep: '#807868',
    cap: '#e8b428', capDark: '#a87c18',
    skin: '#c8905a', skinDark: '#9c6c40', hair: '#241a0e',
    pants: '#e0d4b4', pantsDark: '#a89e84', boot: '#7a6438',
  },
  {
    name: 'MÚMIA', tint: '#e0603c', hat: 'none', pattern: 'wraps', axe: 'khopesh',
    shirt: '#d8b898', shirtDark: '#a68b72', shirtDeep: '#786353',
    cap: '#c04e2e', capDark: '#82331c',
    skin: '#d8b898', skinDark: '#a68b72', hair: '#5a2a18',
    pants: '#c8a888', pantsDark: '#987f64', boot: '#5a4432',
  },
  {
    // Anubisz: sakalfejü, fekete-arany. A jatekban ugyanolyan favago, mint a tobbi.
    name: 'ANUBISZ', tint: '#2e2a38', species: 'anubis', hat: 'none', pattern: 'collar', axe: 'khopesh',
    shirt: '#4a4454', shirtDark: '#332e3c', shirtDeep: '#221f28',
    cap: '#e8bc55', capDark: '#a8842a',
    skin: '#3a3444', skinDark: '#241f2c', hair: '#1a1620',
    pants: '#5a5468', pantsDark: '#3e3a48', boot: '#242030',
  },
  {
    // Szfinx: oroszlantestu orzo, nemes fejdiszben. Ugyanugy jatszik, mint
    // barki mas, csak a feje es a valla oroszlanszeru.
    name: 'SZFINX', tint: '#3fb8b0', species: 'sphinx', hat: 'nemes', pattern: 'collar',
    axe: 'khopesh',
    shirt: '#c89a50', shirtDark: '#8f6c34', shirtDeep: '#634a22',
    cap: '#3fb8b0', capDark: '#22796f',
    skin: '#d8a850', skinDark: '#a87c34', hair: '#8a6420',
    pants: '#b08c44', pantsDark: '#7a612c', boot: '#5a4620',
  },
  {
    // Kleopatra: arany fejdisz kigyoval, kihuzott szem, feher lenvaszon.
    name: 'KLEOPÁTRA', tint: '#e8d08a', species: 'pharaoh', hat: 'nemes', pattern: 'collar',
    axe: 'khopesh', body: 'female',
    shirt: '#f0ece0', shirtDark: '#b8b4a8', shirtDeep: '#8a8880',
    cap: '#e8bc3c', capDark: '#a87c18',
    hair: '#1a1410', hairDark: '#0e0a08', beardCol: '#c8905a', beardDark: '#9c6c40',
    skin: '#d8a066', skinDark: '#a87844', boot: '#8a6c26',
    pants: '#e4e0d4', pantsDark: '#adaa9e',
  },
  {
    // Beduin: elo ember, arab fejkendoben. A sivatag egyetlen "helybelije".
    name: 'BEDUIN', tint: '#5a7ce0', species: 'human', hat: 'keffiyeh', beard: 'full',
    pattern: 'plain', axe: 'khopesh',
    shirt: '#3e5cb8', shirtDark: '#2b3f80', shirtDeep: '#1d2c5a',
    cap: '#e8ecf4', capDark: '#a8b0bc',
    skin: '#c8935e', skinDark: '#9a6c42', hair: '#241a10',
    beardCol: '#2e2218', beardDark: '#1c1510',
    pants: '#33477e', pantsDark: '#233158', boot: '#4a4030',
  },
]);

// ---------------------------------------------------------------- 3. jeg

const JEG_CHARS = chars('eskimo', [
  {
    // Klasszikus inuit parka: fokabor-szurke, vastag szormegallerral.
    name: 'ESZKIMÓ', tint: '#9aa8b0', species: 'eskimo', hat: 'fur', pattern: 'parka', axe: 'icepick',
    shirt: '#6e7a84', shirtDark: '#4e5860', shirtDeep: '#363e44',
    cap: '#b8c2c8', capDark: '#7e888e',
    skin: '#c8935e', skinDark: '#9a6c42', hair: '#241a10',
    pants: '#5a646c', pantsDark: '#3e454a', boot: '#4a4038',
  },
  {
    // Jegesmedve: sajat faj, nem ember. Ugyanugy csakanyt fog.
    name: 'JEGESMEDVE', tint: '#eaf2fa', species: 'polarbear', hat: 'none', pattern: 'fur', axe: 'fish',
    shirt: '#e4ecf4', shirtDark: '#b6bec6', shirtDeep: '#8c949c',
    cap: '#f4faff', capDark: '#c0c8d0',
    skin: '#f0f6fc', skinDark: '#c2cad2', hair: '#dfe7ef',
    pants: '#d8e0e8', pantsDark: '#a8b0b8', boot: '#5a626a',
  },
  {
    // Samán: szarvasborbe bujt alak, agancsos fejdisszel.
    name: 'SÁMÁN', tint: '#b0824a', species: 'hunter', hat: 'antler', pattern: 'hide', axe: 'staff',
    shirt: '#8a6a42', shirtDark: '#5f492c', shirtDeep: '#41321e',
    cap: '#d8c8a8', capDark: '#a89878',
    skin: '#c8935e', skinDark: '#9a6c42', hair: '#241a10',
    pants: '#6a5436', pantsDark: '#493a26', boot: '#33281a',
  },
  {
    // Pingvin: sajat faj. Fekete hat, feher has, narancs csor es labak.
    name: 'PINGVIN', tint: '#3a4150', species: 'penguin', hat: 'none', pattern: 'belly',
    axe: 'flipper', legs: 'webbed',
    shirt: '#22262e', shirtDark: '#14171d', shirtDeep: '#4a5364',
    cap: '#e8622c', capDark: '#a83c14',
    skin: '#22262e', skinDark: '#121519', hair: '#0e1014',
    pants: '#1c2027', pantsDark: '#101318', boot: '#e8622c',
  },
  {
    // Hoember: harom egymasra rakott gomb, szendarab szemekkel, repaorral
    // es szenbol rakott mosollyal. A szine a nyakaban lobogo sal.
    name: 'HÓEMBER', tint: '#f08a2c', species: 'snowman', hat: 'tophat',
    beard: 'none', pattern: 'snow', axe: 'broom', legs: 'ball',
    shirt: '#eef6fb', shirtDark: '#c2d2de', shirtDeep: '#9aabb8',
    cap: '#20242c', capDark: '#0f1216',
    skin: '#f4fbff', skinDark: '#cbdae6', hair: '#eef6fb',
    pants: '#dfeaf3', pantsDark: '#aebecb', boot: '#3a7ad8',
  },
  {
    // Telapo: voros, premes kabat, feher szakall, bojtos sapka, a kezeben
    // ajandekdoboz. A jegmezo egyetlen alakja, aki nem dolgozni jott.
    name: 'TÉLAPÓ', tint: '#d8343c', hat: 'santahat', beard: 'long',
    pattern: 'santa', axe: 'gift',
    shirt: '#c8323a', shirtDark: '#95212a', shirtDeep: '#66151b',
    cap: '#d8343c', capDark: '#98202a',
    hair: '#f4f4ec', beardCol: '#f4f4ec', beardDark: '#cfcfc6',
    skin: '#f0c8a0', skinDark: '#c49c78', boot: '#2a2620',
    pants: '#a82830', pantsDark: '#761a20',
  },
  {
    // Halasz: viaszos sarga kabat, csuklyaval. Nala szigony van.
    name: 'HALÁSZ', tint: '#f0c03c', species: 'eskimo', hat: 'sou', pattern: 'plain', axe: 'harpoon',
    shirt: '#d8a828', shirtDark: '#9c761a', shirtDeep: '#6e5312',
    cap: '#e8bc3c', capDark: '#9c7a1e',
    skin: '#e0b08c', skinDark: '#b48a6a', hair: '#3a2c1c',
    pants: '#8a6a20', pantsDark: '#5e4816', boot: '#3a3020',
  },
]);

// ---------------------------------------------------------------- 4. ur

const UR_CHARS = chars('astronaut', [
  {
    // Uveg buboreksisak: az arc VEGIG latszik mogotte. Feher ruha, panel.
    name: 'HOLD', tint: '#f0f0f0', hat: 'bubble', pattern: 'suit2', axe: 'laser',
    shirt: '#e8ecf0', shirtDark: '#b0b4b8', shirtDeep: '#82868a',
    cap: '#d8e8f0', capDark: '#96a6ae',
    skin: '#8a5f3f', skinDark: '#6b472d', hair: '#1a1a20',
    pants: '#ccd0d4', pantsDark: '#989ca0', boot: '#5a5e62',
  },
  {
    // Rostelyos sisak: keskeny uvegsav a szem elott, tartalyokkal a haton.
    name: 'RÉZ', tint: '#e0783c', hat: 'visorglass', pattern: 'tank', axe: 'laser',
    shirt: '#c86428', shirtDark: '#8f461a', shirtDeep: '#653112',
    cap: '#e0783c', capDark: '#9a4e20',
    skin: '#f0c096', skinDark: '#c4936a', hair: '#4a3418',
    pants: '#a85824', pantsDark: '#743c18', boot: '#4a3220',
  },
  {
    // Nyitott sisak, fejhallgatoval: fekete boru asztronauta.
    name: 'KOBALT', tint: '#5a8ce0', hat: 'openhelm', beard: 'mous', pattern: 'suit2', axe: 'laser',
    shirt: '#ccd6e4', shirtDark: '#9aa2ad', shirtDeep: '#70767e',
    cap: '#3a6ac0', capDark: '#244478',
    skin: '#8a5f3f', skinDark: '#6b472d', hair: '#1a1a20',
    pants: '#b4becc', pantsDark: '#868e98', boot: '#525a64',
  },
  {
    // Ugyanaz a sisak, vilagos boru tarssal.
    name: 'EZÜST', tint: '#8a97a4', hat: 'openhelm', beard: 'goatee', pattern: 'tank', axe: 'laser',
    shirt: '#8a949e', shirtDark: '#646c74', shirtDeep: '#464c52',
    cap: '#a4aeb6', capDark: '#767e86',
    skin: '#e8c0a0', skinDark: '#bc9578', hair: '#8a7a54',
    pants: '#78818a', pantsDark: '#565d64', boot: '#3e444a',
  },
  {
    // Droid: szogletes szervizrobot, egyetlen izzo szemmel es antennaval.
    name: 'DROID', tint: '#a86ae0', species: 'droid', hat: 'none',
    pattern: 'rivet', axe: 'laser',
    shirt: '#6e7482', shirtDark: '#4a4f5c', shirtDeep: '#32363f',
    cap: '#c08af0', capDark: '#7a4ab0',
    skin: '#8a90a0', skinDark: '#5e6472', hair: '#4a4e5a',
    pants: '#565c68', pantsDark: '#3a3f48', boot: '#2a2e36',
  },
  {
    // Kis szurke: a klasszikus ufonauta. Hatalmas csepp alaku fej, ora nagy
    // fekete mandulaszemekkel. A feje merete maga a karakter.
    name: 'KIS SZÜRKE', tint: '#4fd8c8', species: 'grey', hat: 'none',
    beard: 'none', pattern: 'plain', axe: 'laser', legs: 'short',
    shirt: '#4a555e', shirtDark: '#333d45', shirtDeep: '#232b31',
    cap: '#4fd8c8', capDark: '#1a5e58',
    skin: '#9aa2aa', skinDark: '#6c747c', hair: '#c4ccd4',
    pants: '#3e4a52', pantsDark: '#2a333a', boot: '#1c2429',
  },
  {
    // Az egyetlen nem ember: zold urleny, sisak nelkul.
    name: 'CSÁP', tint: '#5ce07a', species: 'tentacle', hat: 'none', pattern: 'suit', axe: 'laser',
    shirt: '#3f7a52', shirtDark: '#2a5337', shirtDeep: '#1c3826',
    cap: '#5ce07a', capDark: '#2f9a4a',
    skin: '#7ad86a', skinDark: '#4f9c46', hair: '#2a5a24',
    pants: '#356a44', pantsDark: '#23482e', boot: '#1a3320',
  },
]);


// ---------------------------------------------------------------- 5. dzsungel

const DZSUNGEL_CHARS = chars('human', [
  {
    // Tollas fejdiszes sámán, obszidian buzoganyal.
    name: 'SÁMÁN', tint: '#3fc46a', hat: 'feather', beard: 'none', pattern: 'glyph', axe: 'macua',
    shirt: '#2f7a4a', shirtDark: '#1f5432', shirtDeep: '#153a22',
    cap: '#3fc46a', capDark: '#25804a',
    hair: '#1a1208', beardCol: '#1a1208', beardDark: '#100c06',
    skin: '#b07840', skinDark: '#875a2c', boot: '#4a3218',
    pants: '#5a4224', pantsDark: '#3e2d18',
  },
  {
    // Jaguarharcos: az allat feje a sisakja, foltos kopennyel.
    name: 'JAGUÁR', tint: '#f07a1c', hat: 'jaguar', beard: 'none', pattern: 'spots', axe: 'macua',
    shirt: '#e0701a', shirtDark: '#a04c0e', shirtDeep: '#6e340a',
    cap: '#f08a2c', capDark: '#a85a12',
    hair: '#1a1208', beardCol: '#1a1208', beardDark: '#100c06',
    skin: '#a86c38', skinDark: '#7e4e24', boot: '#43301a',
    pants: '#8a6428', pantsDark: '#5e441a',
  },
  {
    // Felfedezo: parafa sisak, macseta, khaki ing.
    name: 'KUTATÓ', tint: '#c8c090', hat: 'pith', beard: 'mous', pattern: 'plain', axe: 'machete',
    shirt: '#b4ac7c', shirtDark: '#807a56', shirtDeep: '#5a553c',
    cap: '#dcd4a4', capDark: '#a09a74',
    hair: '#4a3418', beardCol: '#5a4020', beardDark: '#3e2c16',
    skin: '#e0b087', skinDark: '#b38a66', boot: '#4a3a24',
    pants: '#6e6848', pantsDark: '#4c4832',
  },
  {
    // Majom: sajat faj. A dzsungel legfurgebb lakoja.
    name: 'MAJOM', tint: '#7a4e2a', species: 'monkey', hat: 'none', pattern: 'fur', axe: 'machete',
    shirt: '#5e3c1e', shirtDark: '#402814', shirtDeep: '#2a1a0d',
    cap: '#7a4e2a', capDark: '#4f3018',
    skin: '#7a4e2a', skinDark: '#4f3018', hair: '#2e1c0c',
    pants: '#4c2f18', pantsDark: '#33200f', boot: '#241608',
  },
  {
    // Kooriás: eletre kelt kofaragvany-orzo. Nagyobb minden mas szereplonel,
    // es a szemgodreiben jade izzik.
    name: 'KŐÓRIÁS', tint: '#8e94a0', species: 'stone', hat: 'none',
    pattern: 'stone', axe: 'macua',
    shirt: '#7a808c', shirtDark: '#5a606b', shirtDeep: '#3e434c',
    cap: '#4fd8a8', capDark: '#2a8a68',
    skin: '#8e94a0', skinDark: '#5e6470', hair: '#6a707c',
    pants: '#666c78', pantsDark: '#464c56', boot: '#32363e',
  },
  {
    // Sas: a jaguarharcos parja. Nyitott csoru sassisak, amibol kinez az
    // arc, es tollpalast. Kek tollakkal, hogy ne mosodjon ossze a jaguarral.
    name: 'SAS', tint: '#4a7ad8', species: 'eagle', hat: 'none',
    beard: 'none', pattern: 'plume', axe: 'macua',
    shirt: '#3a62b0', shirtDark: '#28457e', shirtDeep: '#1a2e56',
    cap: '#5a86e0', capDark: '#33528f',
    skin: '#c8905a', skinDark: '#9a6c3c', hair: '#e8e4d8',
    pants: '#2f4f92', pantsDark: '#203666', boot: '#8a6430',
  },
  {
    // Aztek hercegno: pikkelyes kopeny, tollas gallér, jade dísz.
    name: 'HERCEGNŐ', tint: '#5ad8c8', hat: 'feather', beard: 'none', pattern: 'scale', axe: 'macua',
    body: 'female',
    shirt: '#2f9a8a', shirtDark: '#1f6a5e', shirtDeep: '#154840',
    cap: '#5ad8c8', capDark: '#309086',
    hair: '#1a1208', hairDark: '#100c06', beardCol: '#1a1208', beardDark: '#100c06',
    skin: '#b07840', skinDark: '#875a2c', boot: '#3a3020',
    pants: '#256e62', pantsDark: '#194a42',
  },
]);

// ---------------------------------------------------------------- 6. cukorka

const CUKORKA_CHARS = chars('human', [
  {
    // Mezeskalacs figura: sajat faj, cukormazas disszel.
    name: 'MÉZESKALÁCS', tint: '#c88a4a', species: 'gingerbread', hat: 'none', pattern: 'icing', axe: 'candy',
    shirt: '#b87838', shirtDark: '#8a5628', shirtDeep: '#5e3a1a',
    cap: '#ffffff', capDark: '#e0d8c8',
    skin: '#c88a4a', skinDark: '#95642f', hair: '#8a5628',
    pants: '#a86c30', pantsDark: '#7a4c20', boot: '#5e3a1a',
  },
  {
    // Cukorka-tunder: szarnyas, rozsaszin, csillogo.
    name: 'TÜNDÉR', tint: '#f078c0', hat: 'crown', beard: 'none', pattern: 'sparkle', axe: 'candy',
    body: 'female', wings: true,
    shirt: '#e85aa8', shirtDark: '#a83c78', shirtDeep: '#742a52',
    cap: '#ffd257', capDark: '#c89a20',
    hair: '#f8e0a0', hairDark: '#d0b460', beardCol: '#e0a0c0', beardDark: '#b87898',
    skin: '#f8d0c0', skinDark: '#d0a494', boot: '#c04a8a',
    pants: '#d84a98', pantsDark: '#a03470',
  },
  {
    // Mogyoros mano: hegyes sapka, dio-baltaval.
    name: 'MANÓ', tint: '#7ad86a', hat: 'pointy', beard: 'goatee', pattern: 'plain', axe: 'candy',
    shirt: '#4aa83c', shirtDark: '#327828', shirtDeep: '#22521a',
    cap: '#7ad86a', capDark: '#4a9840',
    hair: '#8a5628', beardCol: '#a06a34', beardDark: '#754c22',
    skin: '#f0c8a0', skinDark: '#c49c78', boot: '#5e3a1a',
    pants: '#3a8a30', pantsDark: '#276020',
  },
  {
    // Gumimaci: attetszo, ragacsos, mindig vigyorog.
    name: 'GUMIMACI', tint: '#e04a5a', species: 'gummy', hat: 'none', pattern: 'plain', axe: 'candy',
    shirt: '#e04a5a', shirtDark: '#a8323f', shirtDeep: '#74222c',
    cap: '#f08a94', capDark: '#c05a66',
    skin: '#f06a78', skinDark: '#b8404e', hair: '#a8323f',
    pants: '#c8404e', pantsDark: '#8e2c36', boot: '#6e1e26',
  },
  {
    // Vasorru: a mezeskalacs haz gazdaja. Zold arc, hosszu gorbe orr, fekete
    // csucsos kalap, sotetlila kopeny, a kezeben sepru - es egy fekete
    // macska, ami magatol jon utana.
    name: 'VASORRÚ', tint: '#8a52d8', species: 'witch', hat: 'witchhat',
    beard: 'none', pattern: 'cloak', axe: 'broom', cat: true,
    shirt: '#5e2e9a', shirtDark: '#40206e', shirtDeep: '#2a1449',
    cap: '#22202c', capDark: '#141220',
    hair: '#3a3040', beardCol: '#3a3040', beardDark: '#241e28',
    skin: '#6aa84a', skinDark: '#487a30', boot: '#22202c',
    pants: '#4a2480', pantsDark: '#32185a',
  },
  {
    // Cukrasz: fehér kotény, magas sapka, habveroval.
    name: 'CUKRÁSZ', tint: '#f0f0f0', hat: 'chef', beard: 'full', pattern: 'apron', axe: 'whisk',
    shirt: '#f0f0ec', shirtDark: '#c0c0bc', shirtDeep: '#94948e',
    cap: '#ffffff', capDark: '#d0d0cc',
    hair: '#5a4020', beardCol: '#6b4c22', beardDark: '#4a3417',
    skin: '#e8bc94', skinDark: '#bc9270', boot: '#3a3430',
    pants: '#d8d8d4', pantsDark: '#a8a8a4',
  },
]);


// ---------------------------------------------------------------- 7. domino

const DOMINO_CHARS = chars('human', [
  {
    // Olomkatona: merev tartas, csakos sisak, aranyzsinoros zubbony.
    name: 'KATONA', tint: '#e04a4a', hat: 'shako', beard: 'mous', pattern: 'braid', axe: 'ruler',
    shirt: '#c83a3a', shirtDark: '#8f2626', shirtDeep: '#631919',
    cap: '#2a2a34', capDark: '#16161c',
    hair: '#3a2a18', beardCol: '#4a3420', beardDark: '#2e2114',
    skin: '#f0c8a0', skinDark: '#c49c78', boot: '#1e1e26',
    pants: '#e8e4d8', pantsDark: '#b4b0a4',
  },
  {
    // Sakkfigura: a feje maga a huszar-babu.
    name: 'HUSZÁR', tint: '#2e2e38', species: 'chess', hat: 'none', pattern: 'plain', axe: 'ruler',
    shirt: '#3a3a46', shirtDark: '#26262e', shirtDeep: '#181820',
    cap: '#4a4a58', capDark: '#2e2e38',
    skin: '#3a3a46', skinDark: '#22222a', hair: '#16161c',
    pants: '#2e2e38', pantsDark: '#1e1e26', boot: '#121218',
  },
  {
    // Dobokocka-fej: hat oldal, mindig mas szam nez rad.
    name: 'KOCKA', tint: '#f0f0e8', species: 'dice', hat: 'none', pattern: 'plain', axe: 'ruler',
    shirt: '#e8e8e0', shirtDark: '#b4b4ac', shirtDeep: '#86867e',
    cap: '#ffffff', capDark: '#c8c8c0',
    skin: '#f4f4ec', skinDark: '#c0c0b8', hair: '#2a2a30',
    pants: '#d8d8d0', pantsDark: '#a4a49c', boot: '#4a4a52',
  },
  {
    // Diotoro: fabol faragott katona, magas csakoval es nagy allkapoccsal.
    name: 'DIÓTÖRŐ', tint: '#3a6ad8', species: 'nutcracker', hat: 'nutcap',
    pattern: 'braid', axe: 'ruler',
    shirt: '#2f4a9a', shirtDark: '#203368', shirtDeep: '#16234a',
    cap: '#1e1e26', capDark: '#101016',
    skin: '#e0b482', skinDark: '#b08a5c', hair: '#f0f0e8',
    pants: '#e8e4d8', pantsDark: '#b4b0a4', boot: '#1e1e26',
  },
  {
    // Udvari bolond: harom csucsu csorgosipka, ketszinu tarka zeke.
    name: 'BOLOND', tint: '#5ad8a8', species: 'human', hat: 'jester', beard: 'none',
    pattern: 'motley', axe: 'ruler',
    shirt: '#3aa87a', shirtDark: '#277a58', shirtDeep: '#1a533c',
    cap: '#5ad8a8', capDark: '#a84ac0',
    hair: '#e8a02c', beardCol: '#e8a02c', beardDark: '#b07414',
    skin: '#f0c8a0', skinDark: '#c49c78', boot: '#a84ac0',
    pants: '#3aa87a', pantsDark: '#277a58',
  },
  {
    // Kartyakiraly: papirvekony alak, kor-jelekkel.
    name: 'KIRÁLY', tint: '#e04a8a', hat: 'crown', beard: 'long', pattern: 'suitcard', axe: 'ruler',
    shirt: '#f0f0ec', shirtDark: '#bcbcb8', shirtDeep: '#8e8e8a',
    cap: '#ffd257', capDark: '#c89a20',
    hair: '#e8e8e0', beardCol: '#e8e8e0', beardDark: '#b4b4ac',
    skin: '#f0c8a0', skinDark: '#c49c78', boot: '#8a2a52',
    pants: '#e04a8a', pantsDark: '#a03464',
  },
]);


// ------------------------------------------------------------- 8. tuzijatek

const TUZIJATEK_CHARS = chars('human', [
  {
    // Pirotechnikus: bukosisak, lathatosagi mellény. O a szakember.
    name: 'PIROTECH', tint: '#f08a2c', hat: 'helmet', beard: 'none',
    pattern: 'hivis', axe: 'torch',
    shirt: '#e07a1c', shirtDark: '#a05412', shirtDeep: '#6e3a0c',
    cap: '#f0d24a', capDark: '#a89020',
    hair: '#3a2c1c', beardCol: '#4a3420', beardDark: '#2e2114',
    skin: '#e0b087', skinDark: '#b38a66', boot: '#2a2620',
    pants: '#3a4048', pantsDark: '#282d33',
  },
  {
    // Szikra: nincs arca, a feje EGY VILLANYKORTE. Az izzo bura maga a
    // szereplo - egy ra rajzolt szempar csak elrontana.
    name: 'VILLANY', tint: '#ffe07a', species: 'bulb', hat: 'none',
    pattern: 'rivet', axe: 'torch',
    shirt: '#8a9098', shirtDark: '#5e646c', shirtDeep: '#3e444a',
    cap: '#fff4c8', capDark: '#c8a838',
    skin: '#ffe89a', skinDark: '#d8b040', hair: '#ff9a20',
    pants: '#6e747c', pantsDark: '#4a5057', boot: '#3a3e44',
  },
  {
    // Agyus: regimodi tuzer, haromszogletu kalappal es kanoccal.
    name: 'ÁGYÚS', tint: '#5a8ce0', hat: 'tricorn', beard: 'full',
    pattern: 'braid', axe: 'torch',
    shirt: '#2f4a8a', shirtDark: '#1f325e', shirtDeep: '#152240',
    cap: '#1e2436', capDark: '#12161f',
    hair: '#c8c0b0', beardCol: '#d8d0c0', beardDark: '#a8a094',
    skin: '#e8c098', skinDark: '#bc9674', boot: '#2a2620',
    pants: '#e8e0cc', pantsDark: '#b0a898',
  },
  {
    // Tuzember: a feje maga a lang, a teste izzo parazs.
    name: 'FŐNIX', tint: '#d82a2a', species: 'flame', hat: 'none',
    pattern: 'ember', axe: 'torch',
    shirt: '#d0402c', shirtDark: '#932a1c', shirtDeep: '#5e1409',
    cap: '#ffd257', capDark: '#c07a10',
    skin: '#ff8a2c', skinDark: '#c04a12', hair: '#fff4c8',
    pants: '#a82c14', pantsDark: '#6e1a0a', boot: '#4a1206',
  },
  {
    // Suhanc: tini, hatrafordított baseballsapkaban, gyufaval a kezeben.
    // Nem szakember es nem szerzetes - egyszeruen szeret dolgokat felgyujtani.
    name: 'SUHANC', tint: '#8ad84a', hat: 'backcap', beard: 'none',
    pattern: 'hoodie', axe: 'match',
    shirt: '#5aa82c', shirtDark: '#3e7a1c', shirtDeep: '#2a5412',
    cap: '#d0402c', capDark: '#8f2a1c',
    hair: '#2a1c10', beardCol: '#3a2818', beardDark: '#241a0e',
    skin: '#f0c8a0', skinDark: '#c49c78', boot: '#e8e8e0',
    pants: '#3a4250', pantsDark: '#262c36',
  },
  {
    // Betoro: klasszikus alak. Kotott sapka, szemmaszk, csikos trikó.
    name: 'BETÖRŐ', tint: '#9aa0ae', species: 'bandit', hat: 'none',
    pattern: 'stripe', axe: 'crowbar',
    shirt: '#2a2d36', shirtDark: '#e4e4dc', shirtDeep: '#191b21',
    cap: '#48505f', capDark: '#2c3340',
    skin: '#e0b68e', skinDark: '#b08a64', hair: '#2a2630',
    pants: '#2e3138', pantsDark: '#1e2026', boot: '#23262e',
  },
]);

// ------------------------------------------------------------- 9. szelmalom

const SZELMALOM_CHARS = chars('human', [
  {
    // Molnar: liszttol poros kotény es sapka. O a palya gazdaja.
    name: 'MOLNÁR', tint: '#c8a878', hat: 'beanie', beard: 'full',
    pattern: 'apron', axe: 'mallet',
    shirt: '#a8845a', shirtDark: '#775c3c', shirtDeep: '#523f29',
    cap: '#e8e0cc', capDark: '#a8a294',
    hair: '#8a7a54', beardCol: '#a89474', beardDark: '#7a6a4c',
    skin: '#e8c098', skinDark: '#bc9674', boot: '#5a4a30',
    pants: '#6e6450', pantsDark: '#4c4436',
  },
  {
    // Tulipan: csipkefokoto, kek-feher ruha.
    name: 'TULIPÁN', tint: '#e05a8a', hat: 'bonnet', beard: 'none',
    pattern: 'dutch', axe: 'mallet', body: 'female', offHand: 'tulip',
    shirt: '#3a6ac0', shirtDark: '#284a86', shirtDeep: '#1b325c',
    cap: '#f4f4ec', capDark: '#c0c0b8',
    hair: '#f0d878', beardCol: '#d8a8b8', beardDark: '#b08894',
    skin: '#f0c8a0', skinDark: '#c49c78', boot: '#8a6c30',
    pants: '#e8e4d8', pantsDark: '#b4b0a4',
  },
  {
    // Sajtos: kerek piros sajt a hona alatt, sarga mellény.
    name: 'SAJTOS', tint: '#f0c03c', hat: 'cap', beard: 'goatee',
    pattern: 'cheese', axe: 'mallet',
    shirt: '#e0b028', shirtDark: '#a87c18', shirtDeep: '#745410',
    cap: '#c83a30', capDark: '#8f2620',
    hair: '#a8763c', beardCol: '#c08a4a', beardDark: '#8a6230',
    skin: '#f0c8a0', skinDark: '#c49c78', boot: '#5a4a30',
    pants: '#8a7040', pantsDark: '#5e4c2a',
  },
  {
    // Gator: viaszos esokabat es sarga csizma, o figyeli a tengert.
    name: 'GÁTŐR', tint: '#4fb0d8', hat: 'sou', beard: 'mous',
    pattern: 'plain', axe: 'harpoon',
    shirt: '#2f8ab0', shirtDark: '#1f5f7a', shirtDeep: '#154254',
    cap: '#4fb0d8', capDark: '#2f7a9a',
    hair: '#4a3418', beardCol: '#5a4020', beardDark: '#3e2c16',
    skin: '#e0b087', skinDark: '#b38a66', boot: '#f0c03c',
    pants: '#26708e', pantsDark: '#1a4c60',
  },
  {
    // Fejolany: debellas, copfos alak, mindket kezeben tejesvodorrel. A
    // vederbol lotyog a tej, ha lendit vele - ez a sziluettje.
    name: 'FEJŐLÁNY', tint: '#4fa83c', hat: 'braids', beard: 'none',
    pattern: 'dirndl', axe: 'pail', body: 'female', offHand: 'pail',
    shirt: '#4a9c34', shirtDark: '#337024', shirtDeep: '#224c18',
    cap: '#f0d878', capDark: '#c8a83c',
    hair: '#f0d878', beardCol: '#d8c060', beardDark: '#b09838',
    skin: '#f4cca4', skinDark: '#c89e78', boot: '#6a4a28',
    pants: '#7a4a2c', pantsDark: '#553220',
  },
  {
    // Pek: feher koteny, magas sapka, hosszu suto-lapat.
    name: 'PÉK', tint: '#f4f4ec', hat: 'chef', beard: 'none',
    pattern: 'apron', axe: 'peel',
    shirt: '#e4e4dc', shirtDark: '#b0b0a8', shirtDeep: '#7e7e78',
    cap: '#f8f8f2', capDark: '#c8c8c0',
    hair: '#5a4020', beardCol: '#6a4e28', beardDark: '#48331a',
    skin: '#f0c8a0', skinDark: '#c49c78', boot: '#4a4038',
    pants: '#cfcfc6', pantsDark: '#9a9a92',
  },
]);

// ---------------------------------------------------------------- fak

const NEV3 = ['kicsi', 'kozepes', 'nagy'];

const SIZES = [
  { name: NEV3[0], w: 13, h: 22, healMin: 4, healMax: 8, chopMul: 0.72 },
  { name: NEV3[1], w: 16, h: 30, healMin: 6, healMax: 10, chopMul: 1.0 },
  { name: NEV3[2], w: 20, h: 38, healMin: 8, healMax: 12, chopMul: 1.38 },
];

function kinds(shape, cols) {
  return SIZES.map((z) => Object.assign({ shape, cols }, z));
}

/**
 * Tobbfele valtozat ugyanabbol az alakbol: a meret korbejar, a paletta is.
 * Igy lehet egy palyan ketszinu kristalymezo vagy kilencfele dominolap.
 */
/**
 * Meretenkent MAS alak. A szelmalom-mezon a ket kisebb meret hagyomanyos
 * malom, a legnagyobb viszont feher szelerőmű: attol lesz valtozatos a mezo,
 * es a karcsu torony sokkal kevesebb helyet is foglal.
 */
function kindsMixed(list) {
  return list.map((v, i) => Object.assign({ shape: v.shape, cols: v.cols }, SIZES[i % SIZES.length]));
}

function kindsMulti(shape, colsList, count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(Object.assign({ shape, cols: colsList[i % colsList.length] }, SIZES[i % SIZES.length]));
  }
  return out;
}

// A szelmalom-mezo ket epitmenye: a meszelt ko malom es a feher szelerőmű.
const MILL_COLS = {
  trunk: '#8a6a44', trunkLight: '#a8865c', trunkDark: '#5a442a',
  dark: '#7a6a56', mid: '#b0a084', light: '#d4c8ac', hi: '#f0e8d0',
};
const TURBINE_COLS = {
  trunk: '#8a949e', trunkLight: '#c0c8d0', trunkDark: '#4e565e',
  dark: '#a8b4bc', mid: '#dde4ea', light: '#ffffff', hi: '#ffffff',
};

export const THEMES = [
  {
    id: 'erdo',
    hazard: 'fire',   landmark: 'cabin',   water: 'stream', sun: true,  critters: 'erdo',
    twist: null,
    titleCol: '#e0a444', titleShadow: '#5a3b22',
    colorNames: true,   // az erdo szereploi szinrol kaptak a nevuket
    tie: 'AZ ERDŐ', title: 'DŐL A FA', name: 'ERDŐ', shout: 'DŐL A FA!',
    chars: ERDO_CHARS,
    trees: kinds('pine', {
      trunk: '#5a3b22', trunkLight: '#754d2c', trunkDark: '#3c2614',
      dark: '#1c3d22', mid: '#2f6435', light: '#43844a', hi: '#5da357',
    }),
    pal: {
      grass: ['#3f6b34', '#456f39', '#39602f', '#4a7a3c'],
      grassDark: '#2f5228',
      bloom: ['#d8d264', '#c9dce8', '#d9a0c0'],
      burnt: ['#241d19', '#2c2420', '#1a1512', '#332a24'],
      ash: '#4c433c',
      ember: ['#8c3213', '#c25a1c', '#e88a2a'],
      fire: ['#fff2b0', '#ffc23c', '#f2721c', '#c8300f', '#7d1607'],
      smoke: ['#584c46', '#6b5f57', '#463c37'],
      glow: '255,132,44',
    },
  },
  {
    id: 'temeto',
    help: ['HARANGSZÓRA SÖTÉTBE BORUL A PÁLYA'],
    hazard: 'ghost',  landmark: 'crypt',   water: 'stream', sun: false, critters: 'temeto',
    mech: ['bell'],
    twist: 'HARANGSZÓ',
    titleCol: '#b48ae0', titleShadow: '#3a2450',
    tie: 'A TEMETŐ', title: 'DŐL A SÍR', name: 'TEMETŐ', shout: 'DŐL A SÍR!',
    chars: TEMETO_CHARS,
    trees: kinds('grave', {
      trunk: '#6a6a70', trunkLight: '#8a8a90', trunkDark: '#43434a',
      dark: '#3a3a42', mid: '#5e5e68', light: '#7e7e88', hi: '#9a9aa4',
    }),
    pal: {
      grass: ['#2c3a2c', '#324232', '#263426', '#3a4a36'],
      grassDark: '#1e2a1e',
      bloom: ['#8ad8a0', '#c0b0d8', '#d8d0a0'],
      burnt: ['#1a1424', '#221a2e', '#120e1a', '#2a2038'],
      ash: '#4a4058',
      ember: ['#5a2a7a', '#8a3ec0', '#b46ae8'],
      fire: ['#f0e0ff', '#c48aff', '#8a3ec0', '#5a1e88', '#331050'],
      smoke: ['#4a4058', '#5c5068', '#3a3246'],
      glow: '170,90,240',
    },
  },
  {
    id: 'sivatag',
    help: ['SODRÓ SZÉLLÖKÉSEK VONULNAK A PÁLYÁN'],
    hazard: 'sand',   landmark: 'pyramid', water: 'dry',    sun: true,  critters: 'sivatag',
    mech: ['gust'],
    twist: 'SZÉLLÖKÉS',
    titleCol: '#f0c86a', titleShadow: '#6b4a18',
    tie: 'A SIVATAG', title: 'DŐL A KŐ', name: 'SIVATAG', shout: 'DŐL A KŐ!',
    chars: SIVATAG_CHARS,
    trees: kinds('obelisk', {
      trunk: '#c8ab74', trunkLight: '#e0c894', trunkDark: '#9a8054',
      dark: '#8a7048', mid: '#c0a46e', light: '#dcc492', hi: '#f0dcae',
    }),
    pal: {
      grass: ['#d8bc84', '#e0c894', '#cbae78', '#e8d4a4'],
      grassDark: '#b89c68',
      bloom: ['#e8a058', '#d8d0b0', '#c07850'],
      burnt: ['#6a5436', '#7a6242', '#57432a', '#8a7050'],
      ash: '#a89070',
      ember: ['#c88a30', '#e0aa48', '#f0ca70'],
      fire: ['#fff4d0', '#f0d488', '#d8a848', '#a87828', '#6f4c16'],
      smoke: ['#b8a486', '#c8b898', '#a08c70'],
      glow: '240,200,110',
    },
  },
  {
    id: 'jeg',
    help: ['CSÚSZIK A JÁTÉKTÉR'],
    hazard: 'water',  landmark: 'igloo',   water: 'crack',  sun: true,  critters: 'jeg',
    mech: ['slip', 'crack'],
    twist: 'CSÚSZÁS',
    titleCol: '#a8e4ff', titleShadow: '#2a5a76',
    tie: 'A JÉGMEZŐ', title: 'DŐL A JÉG', name: 'JÉGMEZŐ', shout: 'DŐL A JÉG!',
    chars: JEG_CHARS,
    trees: kinds('ice', {
      trunk: '#8fb8cc', trunkLight: '#b8dcec', trunkDark: '#5e8598',
      dark: '#4f8298', mid: '#7fb4cc', light: '#aadcec', hi: '#e0f4ff',
    }),
    pal: {
      grass: ['#dae8f0', '#e8f2f8', '#c8dae6', '#f0f8ff'],
      grassDark: '#b4c8d6',
      bloom: ['#a8d8f0', '#ffffff', '#c8e8f8'],
      burnt: ['#10364f', '#164363', '#0c2c46', '#1c5075'],
      ash: '#3a5a76',
      ember: ['#2a6a9a', '#3f8fc4', '#6ab4e0'],
      fire: ['#f0fbff', '#a8dcf4', '#4f9cd8', '#2a5f9a', '#153a62'],
      smoke: ['#8aa4b8', '#a0b8c8', '#6e8698'],
      glow: '120,200,255',
    },
  },
  {
    id: 'ur',
    help: ['A KIDŐLT KRISTÁLY PORLADVA ELTŰNIK'],
    hazard: 'plasma', landmark: 'ufo',     water: 'stream', sun: false, critters: 'ur',
    mech: ['shock', 'sink'],
    twist: 'PORLADÁS',
    titleCol: '#7ce8f0', titleShadow: '#3a2058',
    tie: 'A BOLYGÓ', title: 'DŐL A FÉNY', name: 'IDEGEN BOLYGÓ', shout: 'DŐL A FÉNY!',
    chars: UR_CHARS,
    trees: kindsMulti('crystal', [
      {   // kek-cian kristaly
        trunk: '#5a4a7a', trunkLight: '#7a68a0', trunkDark: '#3c3054',
        dark: '#3f6a8a', mid: '#4fc4d8', light: '#8ae8f0', hi: '#d8fbff',
      },
      {   // lilas-magenta kristaly
        trunk: '#6a3a7a', trunkLight: '#8a54a0', trunkDark: '#452450',
        dark: '#7a2a8a', mid: '#c04ad8', light: '#e88af0', hi: '#ffd8fb',
      },
    ], 6),
    pal: {
      grass: ['#4a3a5e', '#54426a', '#3f3252', '#5e4a76'],
      grassDark: '#33283f',
      bloom: ['#8ae8f0', '#f050c0', '#c8a0f8'],
      burnt: ['#20142c', '#291a38', '#170e20', '#332248'],
      ash: '#5a4470',
      ember: ['#c02a9a', '#e04ac0', '#f078e0'],
      fire: ['#f0f8ff', '#8af0f0', '#4fc4d8', '#c02a9a', '#5a1060'],
      smoke: ['#5a4a70', '#6e5c86', '#463a58'],
      glow: '140,240,240',
    },
  },
  {
    id: 'dzsungel',
    // Az aztek ligetben SOK a kicsi es a kozepes totem, es kevés az oriási.
    // A nagyok igy latvanyossagok maradnak, nem tomeg: egy-egy kolosszus
    // all ki a mezobol, es azt tenyleg megeri kidonteni.
    sizeBias: [0.44, 0.38, 0.18],
    help: ['TOTEMDÖNTÉSKOR ÁTOK SEBEZHETI AZ ELLENFELED'],
    hazard: 'vine',   landmark: 'aztec',   water: 'stream', sun: true,  critters: 'dzsungel',
    mech: ['curse'],
    twist: 'ÁTOK',
    titleCol: '#8ad86a', titleShadow: '#25502a',
    tie: 'AZ ŐSERDŐ', title: 'DŐL A TOTEM', name: 'AZTÉKOK', shout: 'DŐL A TOTEM!',
    chars: DZSUNGEL_CHARS,
    trees: kinds('totem', {
      trunk: '#6b5230', trunkLight: '#8a6c42', trunkDark: '#463420',
      dark: '#4a5a3a', mid: '#7a8a52', light: '#a0b070', hi: '#c8d498',
    }),
    pal: {
      grass: ['#1e3a1e', '#254626', '#193218', '#2c522c'],
      grassDark: '#132612',
      bloom: ['#f04a6a', '#f0c03c', '#a86ae0'],
      burnt: ['#1a2a14', '#22341a', '#12200e', '#2a3f20'],
      ash: '#3f5236',
      ember: ['#2a7a3a', '#3fa850', '#6ad86a'],
      fire: ['#d8ffa0', '#8ae05a', '#4aa83c', '#2a6a28', '#163f16'],
      smoke: ['#4a5e40', '#5e7250', '#3a4a32'],
      glow: '120,220,110',
    },
  },
  {
    id: 'cukorka',
    help: ['A NYALÓKA RAGADÓS TÓCSAKÉNT DŐL KI'],
    hazard: 'choco',  landmark: 'gingerbread', water: 'rainbow', sun: true, critters: 'cukorka',
    mech: ['sticky'],
    twist: 'RAGADÁS',
    titleCol: '#ff8ac0', titleShadow: '#8a2a5a',
    tie: 'A CUKORKA', title: 'DŐL A CUKOR', name: 'CUKORKAVILÁG', shout: 'DŐL A CUKOR!',
    chars: CUKORKA_CHARS,
    // Tizenketto: ot iz es harom forma osszevissza parositva.
    trees: kindsMulti('lolly', [{
      trunk: '#f4f0e4', trunkLight: '#ffffff', trunkDark: '#c8c4b8',
      dark: '#c8306a', mid: '#f04a8a', light: '#ff8ab8', hi: '#ffd8e8',
    }], 9),
    pal: {
      grass: ['#7ad8c8', '#8ae4d4', '#6ac4b4', '#9af0e0'],
      grassDark: '#4fa898',
      bloom: ['#ffd257', '#f078c0', '#a0e8ff'],
      burnt: ['#6a4030', '#7a4c38', '#563226', '#8a5a42'],
      ash: '#b08a70',
      ember: ['#8a4a28', '#c07040', '#e8a068'],
      fire: ['#f8e0c8', '#e8a068', '#a8603a', '#6e3c22', '#43230f'],
      smoke: ['#c8a890', '#dcc0a8', '#a88c74'],
      glow: '240,170,110',
    },
  },
  {
    id: 'domino',
    help: ['EGY DŐLŐ DOMINÓ ELDÖNTI A KÖVETKEZŐT'],
    treeMul: 1.35, treeGap: 16,     // surun kell allniuk, kulonben nincs lanc
    hazard: 'crumble', landmark: 'dominohouse', water: 'chalk', sun: false, critters: 'domino',
    mech: ['chain'],
    twist: 'LÁNCREAKCIÓ',
    titleCol: '#f0f0e8', titleShadow: '#4a4a54',
    tie: 'AZ ASZTAL', title: 'DŐL A DOMINÓ', name: 'DOMINÓ', shout: 'DŐL A DOMINÓ!',
    chars: DOMINO_CHARS,
    trees: kindsMulti('domino', [{
      trunk: '#d8d8d0', trunkLight: '#ffffff', trunkDark: '#8e8e88',
      dark: '#1e1e24', mid: '#f0f0ea', light: '#ffffff', hi: '#c0c0b8',
    }], 9),
    pal: {
      grass: ['#2a5a4a', '#316552', '#255043', '#38705c'],
      grassDark: '#1c4238',
      bloom: ['#e04a4a', '#f0d24a', '#4a8ae0'],
      burnt: ['#241c14', '#2c231a', '#1a140e', '#352a1e'],
      ash: '#4a4038',
      ember: ['#8a5a2a', '#b07a3c', '#d8a05c'],
      fire: ['#f4e8d0', '#d8b078', '#a87c44', '#6e5028', '#3f2d16'],
      smoke: ['#6a5a48', '#7e6e5a', '#544636'],
      glow: '210,170,110',
    },
  },
  {
    id: 'tuzijatek',
    help: ['A MEGÉRINTETT RAKÉTÁK ELSZÁLLNAK'],
    hazard: 'spark', landmark: 'booth', water: 'stream', sun: false, critters: 'tuzijatek',
    mech: ['fuse'],
    twist: 'KILÖVÉS',
    titleCol: '#ffd257', titleShadow: '#6b3a10',
    tie: 'AZ ÉGBOLT', title: 'DŐL A RAKÉTA', name: 'TŰZIJÁTÉK', shout: 'DŐL A RAKÉTA!',
    chars: TUZIJATEK_CHARS,
    trees: kindsMulti('rocket', [
      { trunk: '#8a6c3a', trunkLight: '#a8884a', trunkDark: '#5a4424',
        dark: '#8a2020', mid: '#e04a3c', light: '#ff8a6a', hi: '#ffe0c0' },
      { trunk: '#8a6c3a', trunkLight: '#a8884a', trunkDark: '#5a4424',
        dark: '#1f5a8a', mid: '#3a8ad8', light: '#7ac0f0', hi: '#d8f0ff' },
      { trunk: '#8a6c3a', trunkLight: '#a8884a', trunkDark: '#5a4424',
        dark: '#1e6a3a', mid: '#3aa85a', light: '#7ad88a', hi: '#d8ffe0' },
      { trunk: '#8a6c3a', trunkLight: '#a8884a', trunkDark: '#5a4424',
        dark: '#8a2a6a', mid: '#e04aa0', light: '#ff8ac8', hi: '#ffd8f0' },
    ], 6),
    pal: {
      grass: ['#26303f', '#2c3847', '#202a38', '#334051'],
      grassDark: '#1a2230',
      bloom: ['#ffd257', '#e04a8a', '#4fc4e8'],
      burnt: ['#1a1620', '#221c2a', '#141019', '#2a2234'],
      ash: '#4a4258',
      ember: ['#c04a20', '#e87a30', '#ffc060'],
      fire: ['#fff4c8', '#ffd257', '#f08a2c', '#c04a20', '#6e2810'],
      smoke: ['#5a5468', '#6e687e', '#464254'],
      glow: '255,200,110',
    },
  },
  {
    id: 'szelmalom',
    help: ['A KIDŐLT MALOM LAPÁTJAI ODÉBBPÖCKÖLNEK'],
    hazard: 'water', landmark: 'stable', water: 'stream', sun: true, critters: 'szelmalom',
    // Kevés, de NAGY malom. A ritkasag maga is szabaly: minden egyes malom
    // szamit, es a kidolt vitorlak nem borítjak be az egesz mezot.
    treeMul: 0.5, treeGap: 30,
    // Tobb malom, kevesebb szelerőmű: a mezo hangulatat a malmok adjak, a
    // turbina a ritka, feltuno kivétel.
    sizeBias: [0.40, 0.38, 0.22],
    mech: ['blades'],
    twist: 'FORGÁS',
    titleCol: '#f0e0a8', titleShadow: '#4a3a18',
    tie: 'A TENGER', title: 'DŐL A MALOM', name: 'SZÉLMALOM', shout: 'DŐL A MALOM!',
    chars: SZELMALOM_CHARS,
    trees: kindsMixed([
      { shape: 'mill', cols: MILL_COLS },
      { shape: 'mill', cols: MILL_COLS },
      { shape: 'turbine', cols: TURBINE_COLS },
    ]),
    pal: {
      grass: ['#4a7a3a', '#548a42', '#3f6a32', '#5f9a4a'],
      grassDark: '#33562a',
      bloom: ['#e04a5a', '#f0d24a', '#f0f0e8'],
      burnt: ['#1c3c52', '#224860', '#16324a', '#2a5470'],
      ash: '#5a7a94',
      ember: ['#3a7a9a', '#4f9cb8', '#7fc4dc'],
      fire: ['#e8f8ff', '#a8dcf0', '#5aa8cc', '#2f6e94', '#1a4460'],
      smoke: ['#8aa4b8', '#a0b8c8', '#6e8698'],
      glow: '120,200,255',
    },
  },
];

export function themeByIndex(i) {
  return THEMES[((i % THEMES.length) + THEMES.length) % THEMES.length];
}
