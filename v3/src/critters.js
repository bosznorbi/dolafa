// A palyan elo, mozgo apro lenyek. Minden temanak SAJAT keszlete van:
// az erdei nyul es farkas nem setalhat at a Marsra.
//
// A hét szerepkör mindenhol ugyanaz (a decor.js ezekre a nevekre hivatkozik),
// csak a lakoja mas:
//
//   bunny      apro szokdecselo        wolf    nagyobb, koborlo ragadozo
//   squirrel   fürge, alacsony allat   bear    egyetlen nagy lény ejszaka
//   butterfly  lebego apro             bat     repulo, cikazo
//   owl        egy helyben ulo figyelo
//
// A kepkockak fix meretuek, mert a decor.js ezekkel szamol:
//   bunny 7x7, wolf 11x7, squirrel 7x6, bear 15x10, butterfly 5x4,
//   bat 7x4, owl 7x7.

// ---------------------------------------------------------------- erdo

const ERDO = {
  bunny: {
    w: 7, h: 7, pal: { a: '#d8d2c6', b: '#f0ece2', c: '#8a8478', e: '#e88ea0', f: '#f0ece2' },
    a: ['..aa...', '..aa...', '.aaa...', 'aaaaaa.', 'aaaaaaa', 'caaaaac', '.c...c.'],
    b: ['.aa.aa.', '.aa.aa.', '.aaaa..', 'aaaaaa.', 'faaaaaa', 'caaaaac', 'c.....c'],
  },
  wolf: {
    w: 11, h: 7, pal: { a: '#5a5f68', b: '#767c86', c: '#3a3e45', e: '#e8c445' },
    a: ['..........a', 'aa......aaa', 'aaaaaaaaeaa', 'baaaaaaaaaa', 'aaaaaaaaaa.', 'c.c....c.c.', 'c.c....c.c.'],
    b: ['..........a', 'aa......aaa', 'aaaaaaaaeaa', 'baaaaaaaaaa', 'aaaaaaaaaa.', '.c.c..c.c..', 'c.c....c.c.'],
  },
  squirrel: {
    w: 7, h: 6, pal: { a: '#a8622c', b: '#c88a4a', c: '#6b3c18', e: '#1a1210' },
    a: ['..aa...', '.aaaa..', 'aa.aaaa', 'aaaaaab', '.aa.aa.', '.a...a.'],
    b: ['..aa...', '.aaaa..', 'aa.aaaa', 'aaaaaab', '.a...a.', 'a.....a'],
  },
  bear: {
    w: 15, h: 10, pal: { a: '#6b4a34', b: '#8a6248', c: '#3e2a1e', e: '#f0d478' },
    a: ['.aa..........aa', 'aaaa........aaa', '.aaaaaaaaaaaaa.', 'aaaaaaaaaaaaaea', 'baaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaa.', '.aaaaaaaaaaaa..', '.cc.......cc...', '.cc.......cc...'],
    b: ['.aa..........aa', 'aaaa........aaa', '.aaaaaaaaaaaaa.', 'aaaaaaaaaaaaaea', 'baaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaa.', '.aaaaaaaaaaaa..', 'cc..........cc.', '.cc........cc..'],
  },
  butterfly: {
    w: 5, h: 4, pal: { a: '#f4e58c', b: '#fffbe0', c: '#8a7a3a' },
    a: ['.a.a.', 'aabaa', '.a.a.', '.....'],
    b: ['.....', '.aba.', 'aabaa', '.a.a.'],
  },
  bat: {
    w: 7, h: 4, pal: { a: '#3a3040', b: '#544a5c', e: '#e05a3c' },
    a: ['aa...aa', '.aa.aa.', '..aaa..', '..a.a..'],
    b: ['.......', 'aa...aa', '.aaaaa.', '..a.a..'],
  },
  owl: {
    w: 7, h: 7, still: true, pal: { a: '#8a7358', b: '#b09a7c', c: '#5a4835', e: '#f0d24a', k: '#241c14' },
    a: ['.aaaaa.', 'aeaaaea', 'aaacaaa', 'abbbba.', 'abbbba.', '.aaaaa.', '..c.c..'],
    b: ['.aaaaa.', 'akaaaka', 'aaacaaa', 'abbbba.', 'abbbba.', '.aaaaa.', '..c.c..'],
  },
};

// ---------------------------------------------------------------- temeto

const TEMETO = {
  bunny: {   // patkany
    w: 7, h: 7, pal: { a: '#6a6a72', b: '#8a8a94', c: '#43434a', e: '#e05a5a' },
    a: ['.......', '.......', '.....aa', 'c..aaaa', 'cccaaae', '.aaaaaa', '..c..c.'],
    b: ['.......', '.......', '.....aa', 'c..aaaa', 'cccaaae', '.aaaaaa', '.c....c'],
  },
  wolf: {    // csontfarkas
    w: 11, h: 7, pal: { a: '#e0dccc', b: '#f4f0e2', c: '#9a9484', e: '#c04ae0' },
    a: ['..........a', 'aa......aaa', 'aa.a.a.aaea', 'baaaaaaaaaa', 'a.a.a.a.aa.', 'c.c....c.c.', 'c.c....c.c.'],
    b: ['..........a', 'aa......aaa', 'aa.a.a.aaea', 'baaaaaaaaaa', 'a.a.a.a.aa.', '.c.c..c.c..', 'c.c....c.c.'],
  },
  squirrel: {  // fekete macska
    w: 7, h: 6, pal: { a: '#2a2430', b: '#413a4a', c: '#171420', e: '#e8c445' },
    a: ['.....a.', 'c...aaa', 'caaaaae', 'caaaaaa', '.aa.aa.', '.a...a.'],
    b: ['.....a.', 'c...aaa', 'caaaaae', 'caaaaaa', '.a...a.', 'a.....a'],
  },
  bear: {    // sirko-golem
    w: 15, h: 10, pal: { a: '#5e5e68', b: '#82828e', c: '#3a3a42', e: '#8ae0b8' },
    a: ['...aaaaaaa.....', '..aaaaaaaaa....', '..aeaaaaaea....', '..aaaaaaaaa....', '.aaaaaaaaaaaa..',
      'aaaaaaaaaaaaaa.', 'aaaaaaaaaaaaaa.', '.aaaaaaaaaaaa..', '..ccc....ccc...', '..ccc....ccc...'],
    b: ['...aaaaaaa.....', '..aaaaaaaaa....', '..aeaaaaaea....', '..aaaaaaaaa....', '.aaaaaaaaaaaa..',
      'aaaaaaaaaaaaaa.', 'aaaaaaaaaaaaaa.', '.aaaaaaaaaaaa..', '.ccc......ccc..', '..ccc....ccc...'],
  },
  butterfly: {  // lidercfeny
    w: 5, h: 4, pal: { a: '#a86ae0', b: '#e8d8ff', c: '#6a3a9a' },
    a: ['.a.a.', 'aabaa', '.aba.', '..a..'],
    b: ['..a..', '.aba.', 'aabaa', '.a.a.'],
  },
  bat: {
    w: 7, h: 4, pal: { a: '#4a3060', b: '#6a4a80', e: '#e05a3c' },
    a: ['aa...aa', '.aa.aa.', '..aaa..', '..a.a..'],
    b: ['.......', 'aa...aa', '.aaaaa.', '..a.a..'],
  },
  owl: {     // hollo
    w: 7, h: 7, still: true, pal: { a: '#22222a', b: '#33333c', c: '#c8963a', e: '#e05a3c', k: '#111116' },
    a: ['..aaa..', '.aeaea.', '..aca..', '.abbba.', '.abbba.', '..aaa..', '..c.c..'],
    b: ['..aaa..', '.akaka.', '..aca..', '.abbba.', '.abbba.', '..aaa..', '..c.c..'],
  },
};

// ---------------------------------------------------------------- sivatag

const SIVATAG = {
  bunny: {   // szkarabeusz
    w: 7, h: 7, pal: { a: '#2e4a3a', b: '#c9a24a', c: '#1a2a20', e: '#e8d08a' },
    a: ['..aaa..', '.aaaaa.', 'aabbbaa', 'aabbbaa', '.aaaaa.', 'c.a.a.c', '.c...c.'],
    b: ['..aaa..', '.aaaaa.', 'aabbbaa', 'aabbbaa', '.aaaaa.', '.ca.ac.', 'c.....c'],
  },
  wolf: {    // sakal
    w: 11, h: 7, pal: { a: '#b08a54', b: '#cfa870', c: '#7a5c34', e: '#2a1a08' },
    a: ['a.........a', 'aa......aaa', 'aaaaaaaaaea', 'baaaaaaaaaa', 'aaaaaaaaaa.', 'c.c....c.c.', 'c.c....c.c.'],
    b: ['a.........a', 'aa......aaa', 'aaaaaaaaaea', 'baaaaaaaaaa', 'aaaaaaaaaa.', '.c.c..c.c..', 'c.c....c.c.'],
  },
  squirrel: {  // gyik
    w: 7, h: 6, pal: { a: '#7a9a4a', b: '#9aba6a', c: '#5a7a34', e: '#e8d08a' },
    a: ['.....aa', 'c...aaa', 'cccaaae', '.aaaaaa', '.a.a.a.', '.......'],
    b: ['.....aa', 'c...aaa', 'cccaaae', '.aaaaaa', 'a.a.a..', '.......'],
  },
  bear: {    // teve
    w: 15, h: 10, pal: { a: '#c8a06a', b: '#e0bc88', c: '#8a6c40', e: '#2a1a08' },
    a: ['............aa.', '...aa......aaaa', '..aaaa....aaaea', '.aaaaaaaaaaaaa.', 'aaaaaaaaaaaaa..',
      'aaaaaaaaaaaa...', '.aaaaaaaaaa....', '..a..a..a..a...', '..a..a..a..a...', '..c..c..c..c...'],
    b: ['............aa.', '...aa......aaaa', '..aaaa....aaaea', '.aaaaaaaaaaaaa.', 'aaaaaaaaaaaaa..',
      'aaaaaaaaaaaa...', '.aaaaaaaaaa....', '.a..a..a..a....', '.a..a..a..a....', '.c..c..c..c....'],
  },
  butterfly: {  // szitakoto
    w: 5, h: 4, pal: { a: '#4fc4c0', b: '#c8f0ee', c: '#2a7a78' },
    a: ['bb.bb', '.aaa.', 'bb.bb', '..a..'],
    b: ['.b.b.', 'baaab', '.b.b.', '..a..'],
  },
  bat: {     // keselyu
    w: 7, h: 4, pal: { a: '#4a3e30', b: '#c8a06a', e: '#e05a3c' },
    a: ['aaa.aaa', '.aabaa.', '..aaa..', '...a...'],
    b: ['.......', 'aaa.aaa', '.aabaa.', '..aaa..'],
  },
  owl: {     // macskaszobor
    w: 7, h: 7, still: true, pal: { a: '#c0a46e', b: '#dcc492', c: '#8a7048', e: '#4fc4c0', k: '#63512f' },
    a: ['.a...a.', '.aaaaa.', '.aeaea.', '.aaaaa.', 'aaaaaaa', 'aaaaaaa', '.c...c.'],
    b: ['.a...a.', '.aaaaa.', '.akaka.', '.aaaaa.', 'aaaaaaa', 'aaaaaaa', '.c...c.'],
  },
};

// ---------------------------------------------------------------- jegmezo

const JEG = {
  bunny: {   // pingvin
    w: 7, h: 7, pal: { a: '#2a2a34', b: '#f0f4fa', c: '#e8a02c', e: '#f0f4fa' },
    a: ['..aaa..', '.aeaea.', '.acca..', '.abbba.', 'aabbbaa', '.abbba.', '..c.c..'],
    b: ['..aaa..', '.aeaea.', '.acca..', '.abbba.', 'aabbbaa', '.abbba.', '.c...c.'],
  },
  wolf: {    // sarki farkas
    w: 11, h: 7, pal: { a: '#dfe6ee', b: '#ffffff', c: '#adb4bc', e: '#7cc8f0' },
    a: ['..........a', 'aa......aaa', 'aaaaaaaaeaa', 'baaaaaaaaaa', 'aaaaaaaaaa.', 'c.c....c.c.', 'c.c....c.c.'],
    b: ['..........a', 'aa......aaa', 'aaaaaaaaeaa', 'baaaaaaaaaa', 'aaaaaaaaaa.', '.c.c..c.c..', 'c.c....c.c.'],
  },
  squirrel: {  // hermelin
    w: 7, h: 6, pal: { a: '#e8eef4', b: '#ffffff', c: '#b8c2cc', e: '#2a2a34' },
    a: ['..aa...', '.aaaa..', 'aa.aaaa', 'aaaaaab', '.aa.aa.', '.a...a.'],
    b: ['..aa...', '.aaaa..', 'aa.aaaa', 'aaaaaab', '.a...a.', 'a.....a'],
  },
  bear: {    // jegesmedve
    w: 15, h: 10, pal: { a: '#e0e8f0', b: '#ffffff', c: '#b0bcc8', e: '#2a2a34' },
    a: ['.aa..........aa', 'aaaa........aaa', '.aaaaaaaaaaaaa.', 'aaaaaaaaaaaaaea', 'baaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaa.', '.aaaaaaaaaaaa..', '.cc.......cc...', '.cc.......cc...'],
    b: ['.aa..........aa', 'aaaa........aaa', '.aaaaaaaaaaaaa.', 'aaaaaaaaaaaaaea', 'baaaaaaaaaaaaaa',
      'aaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaa.', '.aaaaaaaaaaaa..', 'cc..........cc.', '.cc........cc..'],
  },
  butterfly: {  // szallo hopehely
    w: 5, h: 4, pal: { a: '#d8f4ff', b: '#ffffff', c: '#9ac8dc' },
    a: ['a.a.a', '.aba.', 'a.a.a', '.....'],
    b: ['.....', 'a.a.a', '.aba.', 'a.a.a'],
  },
  bat: {     // sarki cser
    w: 7, h: 4, pal: { a: '#e8eef4', b: '#2a2a34', e: '#e05a3c' },
    a: ['aa...aa', '.aabaa.', '..aaa..', '...e...'],
    b: ['.......', 'aa...aa', '.aabaa.', '..aea..'],
  },
  owl: {     // hobagoly
    w: 7, h: 7, still: true, pal: { a: '#e8eef4', b: '#ffffff', c: '#b8c2cc', e: '#f0d24a', k: '#4a5058' },
    a: ['.aaaaa.', 'aeaaaea', 'aaacaaa', 'abbbba.', 'abbbba.', '.aaaaa.', '..c.c..'],
    b: ['.aaaaa.', 'akaaaka', 'aaacaaa', 'abbbba.', 'abbbba.', '.aaaaa.', '..c.c..'],
  },
};

// ---------------------------------------------------------------- idegen bolygo

const UR = {
  bunny: {   // gombrobot
    w: 7, h: 7, pal: { a: '#8a939c', b: '#7cf0ff', c: '#5e666e', e: '#7cf0ff' },
    a: ['...b...', '..aaa..', '.aaaaa.', 'aaeaeaa', '.aaaaa.', '..aaa..', '..c.c..'],
    b: ['...b...', '..aaa..', '.aaaaa.', 'aaeaeaa', '.aaaaa.', '..aaa..', '.c...c.'],
  },
  wolf: {    // xenokutya
    w: 11, h: 7, pal: { a: '#7a3a8a', b: '#a85ac0', c: '#4a1a5a', e: '#7cf0ff' },
    a: ['..........a', 'aa.....aaaa', 'aaaaaaaaaea', 'baaaaaaaaaa', 'aaaaaaaaaa.', 'c.c.c..c.c.', 'c.c.c..c.c.'],
    b: ['..........a', 'aa.....aaaa', 'aaaaaaaaaea', 'baaaaaaaaaa', 'aaaaaaaaaa.', '.c.c.c.c.c.', 'c.c.c..c.c.'],
  },
  squirrel: {  // nyalkaleny
    w: 7, h: 6, pal: { a: '#5ce07a', b: '#a8f0b8', c: '#2f9a4a', e: '#0d1a0c' },
    a: ['.......', '..aaa..', '.aaaaa.', 'aaeaeaa', 'aaaaaaa', '.a.a.a.'],
    b: ['.......', '..aaa..', '.aaaaa.', 'aaeaeaa', 'aaaaaaa', 'a.a.a..'],
  },
  bear: {    // nagy idegen
    w: 15, h: 10, pal: { a: '#5ce07a', b: '#a8f0b8', c: '#2f9a4a', e: '#0d1a0c' },
    a: ['.....aaaaa.....', '....aaaaaaa....', '....aeaaaea....', '.....aaaaa.....', '...aaaaaaaaa...',
      '..aaaaaaaaaaa..', '..aaaaaaaaaaa..', '...aaaaaaaaa...', '...cc.....cc...', '...cc.....cc...'],
    b: ['.....aaaaa.....', '....aaaaaaa....', '....aeaaaea....', '.....aaaaa.....', '...aaaaaaaaa...',
      '..aaaaaaaaaaa..', '..aaaaaaaaaaa..', '...aaaaaaaaa...', '..cc.......cc..', '...cc.....cc...'],
  },
  butterfly: {  // lebego spora
    w: 5, h: 4, pal: { a: '#f050c0', b: '#ffd8f4', c: '#a8327e' },
    a: ['..a..', '.aba.', 'a.b.a', '..a..'],
    b: ['..a..', 'a.b.a', '.aba.', '..a..'],
  },
  bat: {     // dron
    w: 7, h: 4, pal: { a: '#8a939c', b: '#7cf0ff', e: '#f050c0' },
    a: ['aa...aa', '.aabaa.', '..aaa..', '..b.b..'],
    b: ['.......', 'aa...aa', '.aabaa.', '..aaa..'],
  },
  owl: {     // megfigyelo szonda
    w: 7, h: 7, still: true, pal: { a: '#5e666e', b: '#7cf0ff', c: '#3a4048', e: '#f050c0', k: '#2a2e34' },
    a: ['..aaa..', '.aaaaa.', '.aeeea.', '.aaaaa.', '..bbb..', '..a.a..', '.c...c.'],
    b: ['..aaa..', '.aaaaa.', '.akkka.', '.aaaaa.', '..bbb..', '..a.a..', '.c...c.'],
  },
};

// ---------------------------------------------------------------- dzsungel

const DZSUNGEL = {
  bunny: {   // bekа
    w: 7, h: 7, pal: { a: '#4aa83c', b: '#7ad86a', c: '#2f6a28', e: '#f0d24a' },
    a: ['.......', '.......', '.a...a.', 'aeaaaea', 'aaaaaaa', 'caaaaac', 'c.....c'],
    b: ['.......', '.a...a.', 'aeaaaea', 'aaaaaaa', 'caaaaac', 'c.....c', '.......'],
  },
  wolf: {    // jaguar
    w: 11, h: 7, pal: { a: '#d8a03c', b: '#f0c46a', c: '#8a5c18', e: '#2a1a08' },
    a: ['..........a', 'aa......aaa', 'acaaacaaaea', 'baacaaacaaa', 'aaaaaaaaaa.', 'c.c....c.c.', 'c.c....c.c.'],
    b: ['..........a', 'aa......aaa', 'acaaacaaaea', 'baacaaacaaa', 'aaaaaaaaaa.', '.c.c..c.c..', 'c.c....c.c.'],
  },
  squirrel: {  // majom
    w: 7, h: 6, pal: { a: '#a8763c', b: '#c89a5c', c: '#734f26', e: '#1a1208' },
    a: ['c.a...a', 'c.aaaaa', 'ccaeaea', '.aaaaaa', '.aa.aa.', '.a...a.'],
    b: ['c.a...a', 'c.aaaaa', 'ccaeaea', '.aaaaaa', '.a...a.', 'a.....a'],
  },
  bear: {    // gorilla
    w: 15, h: 10, pal: { a: '#3a3436', b: '#565052', c: '#221e20', e: '#f0d0a0' },
    a: ['...aaaaaaa.....', '..aaaaaaaaa....', '..aaeaaaeaa....', '..aaaaaaaaa....', '.aaaaaaaaaaaa..',
      'aaaaaaaaaaaaaa.', 'aaaaaaaaaaaaaa.', '.aaaaaaaaaaaa..', '..cc.....ccc...', '..cc.....ccc...'],
    b: ['...aaaaaaa.....', '..aaaaaaaaa....', '..aaeaaaeaa....', '..aaaaaaaaa....', '.aaaaaaaaaaaa..',
      'aaaaaaaaaaaaaa.', 'aaaaaaaaaaaaaa.', '.aaaaaaaaaaaa..', '.ccc......ccc..', '..cc.....ccc...'],
  },
  butterfly: {  // kolibri
    w: 5, h: 4, pal: { a: '#3fc46a', b: '#f04a8a', c: '#1f7a3c' },
    a: ['.a.a.', 'aabaa', '.a.ac', '.....'],
    b: ['.....', '.aba.', 'aabac', '.a.a.'],
  },
  bat: {     // papagaj
    w: 7, h: 4, pal: { a: '#e8503c', b: '#3fc46a', e: '#f0d24a' },
    a: ['aa...aa', '.aabaa.', '..aae..', '..a.a..'],
    b: ['.......', 'aa...aa', '.aabae.', '..a.a..'],
  },
  owl: {     // tukan
    w: 7, h: 7, still: true, pal: { a: '#22222a', b: '#f0f0e0', c: '#f0a02c', e: '#f0d24a', k: '#111116' },
    a: ['..aaa..', '.aeaaa.', '.aaccc.', '.abbba.', '.abbba.', '..aaa..', '..c.c..'],
    b: ['..aaa..', '.akaaa.', '.aaccc.', '.abbba.', '.abbba.', '..aaa..', '..c.c..'],
  },
};

// ---------------------------------------------------------------- cukorka

const CUKORKA = {
  bunny: {   // gumimaci
    w: 7, h: 7, pal: { a: '#e04a5a', b: '#f8909c', c: '#a8323f', e: '#3a0e16' },
    a: ['.b...b.', '.aaaaa.', 'aaeaeaa', 'aaaaaaa', 'aaaaaaa', '.aa.aa.', '.c...c.'],
    b: ['.b...b.', '.aaaaa.', 'aaeaeaa', 'aaaaaaa', 'aaaaaaa', '.a...a.', 'c.....c'],
  },
  wolf: {    // medvecukor-kigyo
    w: 11, h: 7, pal: { a: '#3a2a3a', b: '#f04a8a', c: '#241a24', e: '#f0d24a' },
    a: ['.......aaaa', '......aaaea', 'aaa..aaaa..', 'abaaaa.....', 'a..bbb.....', '...........', '...........'],
    b: ['.......aaaa', '......aaaea', 'aaa..aaaa..', 'ab.aaa.....', 'a.bb.b.....', '...........', '...........'],
  },
  squirrel: {  // mokus, cukorbevonattal
    w: 7, h: 6, pal: { a: '#f0a02c', b: '#ffd88a', c: '#b06c10', e: '#3a2408' },
    a: ['..aa...', '.abba..', 'aa.aaaa', 'aaaaaab', '.aa.aa.', '.a...a.'],
    b: ['..aa...', '.abba..', 'aa.aaaa', 'aaaaaab', '.a...a.', 'a.....a'],
  },
  bear: {    // mályvacukor-golem
    w: 15, h: 10, pal: { a: '#fdf4f0', b: '#ffffff', c: '#e0c8d4', e: '#e04a5a' },
    a: ['...aaaaaaaa....', '..aaaaaaaaaa...', '..aaeaaaeaaa...', '..aaaaaaaaaa...', '.aaaaaaaaaaaa..',
      'aaaaaaaaaaaaaa.', 'aaaaaaaaaaaaaa.', '.aaaaaaaaaaaa..', '..cc.....cc....', '..cc.....cc....'],
    b: ['...aaaaaaaa....', '..aaaaaaaaaa...', '..aaeaaaeaaa...', '..aaaaaaaaaa...', '.aaaaaaaaaaaa..',
      'aaaaaaaaaaaaaa.', 'aaaaaaaaaaaaaa.', '.aaaaaaaaaaaa..', '.cc.......cc...', '..cc.....cc....'],
  },
  butterfly: {  // cukorka-lepke
    w: 5, h: 4, pal: { a: '#f078c0', b: '#ffffff', c: '#c04a8a' },
    a: ['.a.a.', 'aabaa', '.a.a.', '.....'],
    b: ['.....', '.aba.', 'aabaa', '.a.a.'],
  },
  bat: {     // szallo cukorszalag
    w: 7, h: 4, pal: { a: '#7ad8e0', b: '#ffffff', e: '#f078c0' },
    a: ['aa...aa', '.aabaa.', '..aea..', '..a.a..'],
    b: ['.......', 'aa...aa', '.aabaa.', '..aea..'],
  },
  owl: {     // mezeskalacs-bagoly
    w: 7, h: 7, still: true, pal: { a: '#c88a4a', b: '#ffffff', c: '#8a5628', e: '#2a1a0c', k: '#5e3a1a' },
    a: ['.bbbbb.', 'aeaaaea', 'aaacaaa', 'abbbba.', 'abbbba.', '.aaaaa.', '..c.c..'],
    b: ['.bbbbb.', 'akaaaka', 'aaacaaa', 'abbbba.', 'abbbba.', '.aaaaa.', '..c.c..'],
  },
};

// ---------------------------------------------------------------- domino

const DOMINO = {
  bunny: {   // gurulo dobokocka
    w: 7, h: 7, pal: { a: '#f0f0e8', b: '#ffffff', c: '#2a2a30', e: '#e04a4a' },
    a: ['.......', '.bbbbb.', 'bacacab', 'bcacacb', 'bacacab', '.bbbbb.', '.c...c.'],
    b: ['.......', '.bbbbb.', 'bcacacb', 'bacacab', 'bcacacb', '.bbbbb.', 'c.....c'],
  },
  wolf: {    // felhuzos jatekkutya
    w: 11, h: 7, pal: { a: '#c8a020', b: '#e8c860', c: '#8a6c10', e: '#e04a4a' },
    a: ['..........a', 'ab......aaa', 'aaaaaaaaaea', 'baaaaaaaaaa', 'aaaaaaaaaa.', 'c.c....c.c.', 'c.c....c.c.'],
    b: ['..........a', 'ab......aaa', 'aaaaaaaaaea', 'baaaaaaaaaa', 'aaaaaaaaaa.', '.c.c..c.c..', 'c.c....c.c.'],
  },
  squirrel: {  // porgo csiga
    w: 7, h: 6, pal: { a: '#e04a4a', b: '#f8a0a0', c: '#8a2020', e: '#ffffff' },
    a: ['..bbb..', '.baaab.', 'baeaeab', '.baaab.', '..bcb..', '...c...'],
    b: ['..bbb..', '.abbba.', 'aebebea', '.abbba.', '..bcb..', '...c...'],
  },
  bear: {    // nagy plusstalpu jatekmackó
    w: 15, h: 10, pal: { a: '#a8763c', b: '#c89a5c', c: '#6b4a20', e: '#2a1a0c' },
    a: ['..aa.......aa..', '.aaaa.....aaaa.', '..aaaaaaaaaaa..', '..aaeaaaaeaa...', '.aaaaaaaaaaaa..',
      'aaaaaaaaaaaaaa.', 'aaaaaaaaaaaaaa.', '.aaaaaaaaaaaa..', '..cc.....cc....', '..cc.....cc....'],
    b: ['..aa.......aa..', '.aaaa.....aaaa.', '..aaaaaaaaaaa..', '..aaeaaaaeaa...', '.aaaaaaaaaaaa..',
      'aaaaaaaaaaaaaa.', 'aaaaaaaaaaaaaa.', '.aaaaaaaaaaaa..', '.cc.......cc...', '..cc.....cc....'],
  },
  butterfly: {  // szallo jatekkartya
    w: 5, h: 4, pal: { a: '#f0f0ec', b: '#e04a4a', c: '#2a2a30' },
    a: ['aaaaa', 'abbba', 'aaaaa', '.....'],
    b: ['.....', 'aaaaa', 'abbba', 'aaaaa'],
  },
  bat: {     // papirrepulo
    w: 7, h: 4, pal: { a: '#f0f0ec', b: '#c8c8c0', e: '#e04a4a' },
    a: ['aa...aa', '.aabaa.', '..aaa..', '...b...'],
    b: ['.......', 'aa...aa', '.aabaa.', '..aaa..'],
  },
  owl: {     // allo sakkgyalog
    w: 7, h: 7, still: true, pal: { a: '#3a3a46', b: '#5a5a68', c: '#1e1e26', e: '#e8e8e0', k: '#2a2a34' },
    a: ['..aaa..', '.aeaea.', '..bbb..', '..aaa..', '.aaaaa.', 'aaaaaaa', 'ccccccc'],
    b: ['..aaa..', '.akaka.', '..bbb..', '..aaa..', '.aaaaa.', 'aaaaaaa', 'ccccccc'],
  },
};

// ---------------------------------------------------------------- tuzijatek

const TUZIJATEK = {
  bunny: {   // sun, osszegombolyodve a fuben
    w: 7, h: 7, pal: { a: '#6b5240', b: '#8f7255', c: '#3e2e22', e: '#1a1210' },
    a: ['.......', '..ccc..', '.ccccc.', 'ccccccc', 'aaaaaab', '.aaaaa.', '..a.a..'],
    b: ['.......', '..ccc..', '.ccccc.', 'ccccccc', 'baaaaaa', '.aaaaa.', '.a...a.'],
  },
  wolf: {    // kobor kutya, riadtan lapulva
    w: 11, h: 7, pal: { a: '#8a6a40', b: '#a88a5c', c: '#4a3620', e: '#e8e0c8' },
    a: ['a.........a', 'aa......aaa', 'aaaaaaaaaea', 'baaaaaaaaaa', '.aaaaaaaaa.', 'c.c....c.c.', 'c.c....c.c.'],
    b: ['a.........a', 'aa......aaa', 'aaaaaaaaaea', 'baaaaaaaaaa', '.aaaaaaaaa.', '.c.c..c.c..', 'c.c....c.c.'],
  },
  squirrel: {  // macska, felmereszkedve
    w: 7, h: 6, pal: { a: '#3a3440', b: '#5a5266', c: '#1e1a24', e: '#ffd257' },
    a: ['a.a....', 'aaa..aa', 'aeaaaa.', 'baaaaa.', '.a.a.a.', '.a...a.'],
    b: ['a.a....', 'aaa..aa', 'aeaaaa.', 'baaaaa.', 'a.a.a..', 'a.....a'],
  },
  bear: {    // papirsarkany-bab, ket bot kozott vitve
    w: 15, h: 10, pal: { a: '#c83a30', b: '#f0d24a', c: '#8f2620', e: '#f4f4ec' },
    a: ['..bb.........bb', '.bbbb.......bb.', '..aaaaaaaaaaa..', '.aaaaaaaaaaaaea', 'baaaaaaaaaaaaaa',
      '.aaaaaaaaaaaaa.', '..aaabbbaaaaa..', '...aaaaaaaaa...', '...c.......c...', '...c.......c...'],
    b: ['..bb.........bb', '.bbbb.......bb.', '..aaaaaaaaaaa..', '.aaaaaaaaaaaaea', 'baaaaaaaaaaaaaa',
      '.aaaaaaaaaaaaa.', '..aaabbbaaaaa..', '...aaaaaaaaa...', '..c.........c..', '...c.......c...'],
  },
  butterfly: {  // szentjanosbogar
    w: 5, h: 4, pal: { a: '#9ad84a', b: '#f4ffb0', c: '#4a6a20' },
    a: ['.....', '.aba.', '.ccc.', '.....'],
    b: ['.....', '.....', '.aba.', '.ccc.'],
  },
  bat: {     // denever az ejszakai egen
    w: 7, h: 4, pal: { a: '#2e2836', b: '#4a4256', e: '#e0a020' },
    a: ['aa...aa', '.aa.aa.', '..aea..', '..a.a..'],
    b: ['.......', 'aa...aa', '.aaeaa.', '..a.a..'],
  },
  owl: {     // ulo bagoly, a torony peremen
    w: 7, h: 7, still: true, pal: { a: '#5a4a5c', b: '#7c6a7e', c: '#372c38', e: '#ffd257', k: '#241c26' },
    a: ['.aaaaa.', 'aeaaaea', 'aaacaaa', 'abbbba.', 'abbbba.', '.aaaaa.', '..c.c..'],
    b: ['.aaaaa.', 'akaaaka', 'aaacaaa', 'abbbba.', 'abbbba.', '.aaaaa.', '..c.c..'],
  },
};

// ---------------------------------------------------------------- szelmalom

const SZELMALOM = {
  bunny: {   // mezei nyul
    w: 7, h: 7, pal: { a: '#a8946e', b: '#c4b490', c: '#6e5f44', e: '#e88ea0', f: '#e8dfc8' },
    a: ['..aa...', '..aa...', '.aaa...', 'aaaaaa.', 'aaaaaaa', 'caaaaac', '.c...c.'],
    b: ['.aa.aa.', '.aa.aa.', '.aaaa..', 'aaaaaa.', 'faaaaaa', 'caaaaac', 'c.....c'],
  },
  wolf: {    // terelo juhaszkutya
    w: 11, h: 7, pal: { a: '#2e2a26', b: '#f0ece2', c: '#1a1714', e: '#e8c445' },
    a: ['..........a', 'ab......aaa', 'abaaaaaaaea', 'bbaaaaaaaab', 'aaaaabbaaa.', 'c.c....c.c.', 'c.c....c.c.'],
    b: ['..........a', 'ab......aaa', 'abaaaaaaaea', 'bbaaaaaaaab', 'aaaaabbaaa.', '.c.c..c.c..', 'c.c....c.c.'],
  },
  squirrel: {  // hörcsog
    w: 7, h: 6, pal: { a: '#c8a05a', b: '#e8c88a', c: '#8a6a34', e: '#1a1210' },
    a: ['.a...a.', 'aaaaaa.', 'aeaaaab', 'aaaaaa.', '.aaaa..', '.c..c..'],
    b: ['.a...a.', 'aaaaaa.', 'aeaaaab', 'aaaaaa.', '.aaaa..', 'c....c.'],
  },
  bear: {    // legelo tehén
    w: 15, h: 10, pal: { a: '#f0ece2', b: '#2e2a26', c: '#c4a08a', e: '#e88ea0' },
    a: ['...............', '.....bbb.......', '..aaaaaaaaaabb.', 'aaabbaaaaaaaaea', 'aaabbaaaaaaaaaa',
      'aaaaaaaabbaaaa.', '.aaaaaaabbaaa..', '.aaaaaaaaaaaa..', '.bb.......bb...', '.bb.......bb...'],
    b: ['...............', '.....bbb.......', '..aaaaaaaaaabb.', 'aaabbaaaaaaaaea', 'aaabbaaaaaaaaaa',
      'aaaaaaaabbaaaa.', '.aaaaaaabbaaa..', '.aaaaaaaaaaaa..', 'bb..........bb.', '.bb........bb..'],
  },
  butterfly: {  // reti pillango
    w: 5, h: 4, pal: { a: '#f0e0a0', b: '#ffffff', c: '#8a7a3a' },
    a: ['.a.a.', 'aabaa', '.a.a.', '.....'],
    b: ['.....', '.aba.', 'aabaa', '.a.a.'],
  },
  bat: {     // sirály a tenger felol
    w: 7, h: 4, pal: { a: '#f4f4ec', b: '#b0b8c0', e: '#e8a02c' },
    a: ['aa...aa', '.aabaa.', '..aea..', '.......'],
    b: ['.......', 'aa...aa', '.aabaa.', '..aea..'],
  },
  owl: {     // allo golya
    w: 7, h: 7, still: true, pal: { a: '#f4f4ec', b: '#2e2a26', c: '#c83a30', e: '#1a1a20', k: '#f4f4ec' },
    a: ['..aae..', '..aacc.', '..aa...', '.aaaa..', 'baaaab.', '.aaaa..', '..c.c..'],
    b: ['..aak..', '..aacc.', '..aa...', '.aaaa..', 'baaaab.', '.aaaa..', '..c.c..'],
  },
};

export const CRITTERS = {
  erdo: ERDO, temeto: TEMETO, sivatag: SIVATAG, jeg: JEG, ur: UR,
  dzsungel: DZSUNGEL, cukorka: CUKORKA, domino: DOMINO,
  tuzijatek: TUZIJATEK, szelmalom: SZELMALOM,
};

export const CRITTER_SLOTS = ['bunny', 'wolf', 'squirrel', 'bear', 'butterfly', 'bat', 'owl'];
