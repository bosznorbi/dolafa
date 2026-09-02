// A palya APRO, HELYBEN ALLO diszletei: ami a fuben hever, ami a foldbol
// kinő, ami a fak tovehez tapad. Temankent sajat keszlet, kulonben az erdei
// virag ott viritana a jegmezon is.
//
// A szerepkorok neve fix (a decor.js ezekre hivatkozik), csak a tartalmuk mas:
//
//   flower     legapróbb foldi elem, a vilagos napszakokban   3x4
//   mushroom   kesobb elojovo, kicsit nagyobb elem            5x5
//   rock       sotetedeskor megjeleno tomb                    5x4
//   web        a fak tovehez tapado dolog                     7x6
//
// A 'ground' a palya alapszovete: fuszal-, kavics- es bokorszinek.

const P = {
  // ------------------------------------------------------------- erdo
  erdo: {
    ground: { blade: ['#548a42', '#325a2a'], pebble: ['#6e7264', '#8b8f80'], bush: true },
    flower: [
      { pal: { a: '#e8d24a', b: '#fff0a8', s: '#3c6b32' }, rows: ['.a.', 'aaa', '.s.', '.s.'] },
      { pal: { a: '#e07aa8', b: '#f6b8d0', s: '#3c6b32' }, rows: ['.a.', 'aba', '.s.', '.s.'] },
      { pal: { a: '#8ab8e8', b: '#c8e0f6', s: '#3c6b32' }, rows: ['.a.', 'aba', '.s.', '.s.'] },
      { pal: { a: '#f0f0e8', b: '#ffffff', s: '#3c6b32' }, rows: ['.a.', 'aba', '.s.', '.s.'] },
    ],
    mushroom: [
      { pal: { a: '#c8402f', b: '#e8705c', s: '#e8dfc8' }, rows: ['.....', '.aaa.', 'aabaa', '..s..', '..s..'] },
      { pal: { a: '#b8863a', b: '#d8a85c', s: '#e8dfc8' }, rows: ['.....', '.aaa.', 'aabaa', '..s..', '..s..'] },
      { pal: { a: '#8a5c9a', b: '#a87ab8', s: '#e8dfc8' }, rows: ['.....', '.aaa.', 'aabaa', '..s..', '..s..'] },
    ],
    rock: [
      { pal: { a: '#4e5250', b: '#6b706c', c: '#3a3e3c' }, rows: ['.....', '.bba.', 'aaaaa', 'ccccc'] },
      { pal: { a: '#4e5250', b: '#6b706c', c: '#3a3e3c' }, rows: ['..b..', '.baa.', '.aaa.', '.ccc.'] },
    ],
    web: { pal: { a: 'rgba(214,222,232,0.55)', b: 'rgba(214,222,232,0.3)' }, rows: ['aaaaaaa', 'a.b.b.a', 'ab.b.ba', 'a..b..a', '.a.b.a.', '..a.a..'] },
  },

  // ------------------------------------------------------------- temeto
  temeto: {
    ground: { blade: ['#3f5c3a', '#2a3f28'], pebble: ['#5a5560', '#7a7480'], bush: true },
    flower: [   // gyertyacsonk
      { pal: { a: '#e8e0c8', b: '#ffd257', s: '#8a8478' }, rows: ['.b.', '.a.', '.a.', 'sss'] },
      { pal: { a: '#d8d0b8', b: '#ffd257', s: '#8a8478' }, rows: ['.b.', '.a.', '.a.', 'sss'] },
      { pal: { a: '#c8c0a8', b: '#a86ae0', s: '#8a8478' }, rows: ['.b.', '.a.', '.a.', 'sss'] },
      { pal: { a: '#e0d8c0', b: '#8ae0b8', s: '#8a8478' }, rows: ['.b.', '.a.', '.a.', 'sss'] },
    ],
    mushroom: [   // koponya a fuben
      { pal: { a: '#e0dccc', b: '#14121a', c: '#9a9484' }, rows: ['.aaa.', 'aaaaa', 'ababa', '.aaa.', '.c.c.'] },
      { pal: { a: '#d0ccbc', b: '#14121a', c: '#9a9484' }, rows: ['.....', '.aaa.', 'ababa', '.aaa.', '.c.c.'] },
      { pal: { a: '#c8c4b4', b: '#14121a', c: '#9a9484' }, rows: ['.....', '.....', '.aaa.', 'ababa', '.aaa.'] },
    ],
    rock: [   // torott sirko-darab
      { pal: { a: '#5e5e68', b: '#82828e', c: '#3a3a42' }, rows: ['.bb..', '.aaa.', 'aaaac', 'cccc.'] },
      { pal: { a: '#4e4e58', b: '#72727e', c: '#2e2e34' }, rows: ['..b..', '.baa.', 'aaaaa', '.ccc.'] },
    ],
    web: { pal: { a: 'rgba(220,226,236,0.6)', b: 'rgba(220,226,236,0.32)' }, rows: ['aaaaaaa', 'a.b.b.a', 'ab.b.ba', 'a..b..a', '.a.b.a.', '..a.a..'] },
  },

  // ------------------------------------------------------------- sivatag
  sivatag: {
    ground: { blade: ['#c8ab74', '#a68a5c'], pebble: ['#8a7048', '#b09472'], bush: false },
    flower: [   // apro kaktusz
      { pal: { a: '#4f8a3c', b: '#6faa54', s: '#e8dfc8' }, rows: ['.a.', 'aaa', '.a.', '.a.'] },
      { pal: { a: '#3f7a34', b: '#5f9a4c', s: '#e8dfc8' }, rows: ['...', '.a.', 'aba', '.a.'] },
      { pal: { a: '#5f9a4c', b: '#8aba6a', s: '#e8dfc8' }, rows: ['.b.', '.a.', 'aaa', '.a.'] },
      { pal: { a: '#8a7048', b: '#b09472', s: '#e8dfc8' }, rows: ['...', 'a.a', '.a.', '.a.'] },
    ],
    mushroom: [   // kifehéredett koponya es csont
      { pal: { a: '#e8dfc8', b: '#3a2c14', c: '#b8ac90' }, rows: ['.....', '.aaa.', 'ababa', '.aaa.', '.c.c.'] },
      { pal: { a: '#e0d6bc', b: '#3a2c14', c: '#b8ac90' }, rows: ['.....', '.....', 'a...a', '.aaa.', 'a...a'] },
      { pal: { a: '#d8ceb4', b: '#3a2c14', c: '#b8ac90' }, rows: ['.....', '..a..', '.aaa.', 'ca.ac', '.....'] },
    ],
    rock: [   // homokkotomb
      { pal: { a: '#c0a46e', b: '#dcc492', c: '#8a7048' }, rows: ['.bb..', '.aaa.', 'aaaac', 'cccc.'] },
      { pal: { a: '#b09472', b: '#cfb48c', c: '#7a6040' }, rows: ['..b..', '.baa.', 'aaaaa', '.ccc.'] },
    ],
    web: { pal: { a: '#8a7048', b: '#b09472' }, rows: ['..a.a..', '.aabaa.', 'aababaa', '.aabaa.', '..a.a..', '...a...'] },
  },

  // ------------------------------------------------------------- jegmezo
  jeg: {
    // smooth: sima jegtabla, nem havas talaj. Lasd buildGround.
    ground: { blade: ['#dfe8f2', '#b8c8d8'], pebble: ['#9ab4c8', '#c8dcea'], bush: false, smooth: true },
    flower: [   // jegszilank es hocsomo
      { pal: { a: '#d8f4ff', b: '#ffffff', s: '#9ac8dc' }, rows: ['.b.', '.a.', '.a.', 'sss'] },
      { pal: { a: '#c8e8fa', b: '#ffffff', s: '#9ac8dc' }, rows: ['...', '.b.', 'aaa', 'sss'] },
      { pal: { a: '#eaf4ff', b: '#ffffff', s: '#a8c8dc' }, rows: ['b.b', '.a.', 'b.b', '.s.'] },
      { pal: { a: '#bcdcf0', b: '#ffffff', s: '#9ac8dc' }, rows: ['...', '.a.', 'aba', '.s.'] },
    ],
    mushroom: [   // jegvirag a foldon
      { pal: { a: '#d8f4ff', b: '#ffffff', c: '#9ac8dc' }, rows: ['a...a', '.a.a.', '.aba.', '.a.a.', 'c...c'] },
      { pal: { a: '#c8e8fa', b: '#ffffff', c: '#9ac8dc' }, rows: ['.....', '..b..', '.aaa.', 'caaac', '.ccc.'] },
      { pal: { a: '#eaf4ff', b: '#ffffff', c: '#a8c8dc' }, rows: ['.....', '.a.a.', '..b..', '.a.a.', '.....'] },
    ],
    rock: [   // jegtomb
      { pal: { a: '#aad0e4', b: '#e0f4ff', c: '#6e94ac' }, rows: ['.bb..', '.aaa.', 'aaaac', 'cccc.'] },
      { pal: { a: '#9ac4dc', b: '#d8f0ff', c: '#5e849c' }, rows: ['..b..', '.baa.', 'aaaaa', '.ccc.'] },
    ],
    web: { pal: { a: 'rgba(216,244,255,0.65)', b: 'rgba(216,244,255,0.35)' }, rows: ['a.a.a.a', '.ababa.', 'aabbbaa', '.ababa.', 'a.a.a.a', '...b...'] },
  },

  // ------------------------------------------------------------- idegen bolygo
  ur: {
    ground: { blade: ['#3a5a52', '#28403a'], pebble: ['#4a4058', '#6a5a7a'], bush: false },
    flower: [   // vilagito spora
      { pal: { a: '#f050c0', b: '#ffd8f4', s: '#5a3a6a' }, rows: ['.b.', 'aaa', '.s.', '.s.'] },
      { pal: { a: '#7cf0ff', b: '#d8fbff', s: '#3a5a6a' }, rows: ['.b.', 'aba', '.s.', '.s.'] },
      { pal: { a: '#5ce07a', b: '#c8ffb0', s: '#2f6a4a' }, rows: ['...', '.b.', 'aaa', '.s.'] },
      { pal: { a: '#a86ae0', b: '#e8d8ff', s: '#4a3a6a' }, rows: ['.a.', 'aba', '.s.', '.s.'] },
    ],
    mushroom: [   // kristalyhajtas
      { pal: { a: '#4fc4d8', b: '#d8fbff', c: '#2a7a8a' }, rows: ['..b..', '.aaa.', '.aaa.', '.c.c.', '.....'] },
      { pal: { a: '#f050c0', b: '#ffd8f4', c: '#a8327e' }, rows: ['..b..', '..a..', '.aaa.', '.aaa.', '.ccc.'] },
      { pal: { a: '#8ae8f0', b: '#ffffff', c: '#3f8a9a' }, rows: ['.b.b.', '.aaa.', '..a..', '..c..', '.....'] },
    ],
    rock: [   // meteoritdarab, izzo repedessel
      { pal: { a: '#3a3448', b: '#5a5068', c: '#f050c0' }, rows: ['.bb..', '.aaa.', 'aacaa', 'aaaa.'] },
      { pal: { a: '#2e2a3a', b: '#4a4458', c: '#7cf0ff' }, rows: ['..b..', '.baa.', 'aacaa', '.aaa.'] },
    ],
    web: { pal: { a: 'rgba(124,240,255,0.5)', b: 'rgba(240,80,192,0.45)' }, rows: ['a..b..a', '.a.b.a.', '..aba..', '..bab..', '.a.b.a.', 'a..b..a'] },
  },

  // ------------------------------------------------------------- dzsungel
  dzsungel: {
    ground: { blade: ['#2f6a30', '#1c4420'], pebble: ['#4a5e40', '#6a7e58'], bush: true },
    flower: [
      { pal: { a: '#f04a6a', b: '#ff8aa0', s: '#2f6a30' }, rows: ['.a.', 'aba', '.s.', '.s.'] },
      { pal: { a: '#f0c03c', b: '#ffe08a', s: '#2f6a30' }, rows: ['.a.', 'aba', '.s.', '.s.'] },
      { pal: { a: '#a86ae0', b: '#d8b0f8', s: '#2f6a30' }, rows: ['.a.', 'aaa', '.s.', '.s.'] },
      { pal: { a: '#3fc46a', b: '#8ae0a0', s: '#245224' }, rows: ['a.a', '.a.', '.s.', '.s.'] },
    ],
    mushroom: [
      { pal: { a: '#4a8a3c', b: '#6fb45c', c: '#2f6a28' }, rows: ['..a..', '.aaa.', 'aabaa', '..c..', '..c..'] },
      { pal: { a: '#8a5628', b: '#b07840', c: '#5e3a1a' }, rows: ['.....', '.aaa.', 'aabaa', '..c..', '..c..'] },
      { pal: { a: '#c8a24a', b: '#e8c47a', c: '#8a6c26' }, rows: ['.....', '..a..', '.aba.', '.aaa.', '..c..'] },
    ],
    rock: [
      { pal: { a: '#5a6a4a', b: '#7a8a66', c: '#3a4632' }, rows: ['.bb..', '.aaa.', 'aaaac', 'cccc.'] },
      { pal: { a: '#6b5230', b: '#8a6c42', c: '#463420' }, rows: ['..b..', '.baa.', 'aaaaa', '.ccc.'] },
    ],
    web: { pal: { a: '#2f6a30', b: '#4a9a4a' }, rows: ['a..b..a', '.a.b.a.', '..aba..', '.a.b.a.', 'a..b..a', '...b...'] },
  },

  // ------------------------------------------------------------- cukorka
  cukorka: {
    ground: { blade: ['#a0f0e0', '#6ac4b4'], pebble: ['#f078c0', '#ffb0dc'], bush: true },
    flower: [
      { pal: { a: '#f04a8a', b: '#ffffff', s: '#4fa898' }, rows: ['.a.', 'aba', '.s.', '.s.'] },
      { pal: { a: '#ffd257', b: '#ffffff', s: '#4fa898' }, rows: ['.a.', 'aba', '.s.', '.s.'] },
      { pal: { a: '#7ad8e0', b: '#ffffff', s: '#4fa898' }, rows: ['.b.', 'aaa', '.s.', '.s.'] },
      { pal: { a: '#a86ae0', b: '#ffffff', s: '#4fa898' }, rows: ['.a.', 'aba', '.s.', '.s.'] },
    ],
    mushroom: [
      { pal: { a: '#f04a8a', b: '#ffffff', c: '#c8306a' }, rows: ['.....', '.aba.', 'abbba', '..c..', '..c..'] },
      { pal: { a: '#ffd257', b: '#ffffff', c: '#c89a20' }, rows: ['..b..', '.aaa.', 'ababa', '..c..', '..c..'] },
      { pal: { a: '#7ad8e0', b: '#ffffff', c: '#3f9aa8' }, rows: ['.....', '..b..', '.aaa.', '.aba.', '..c..'] },
    ],
    rock: [
      { pal: { a: '#8a5a3a', b: '#b07850', c: '#5e3a22' }, rows: ['.bb..', '.aaa.', 'aaaac', 'cccc.'] },
      { pal: { a: '#f0a02c', b: '#ffd88a', c: '#b06c10' }, rows: ['..b..', '.baa.', 'aaaaa', '.ccc.'] },
    ],
    web: { pal: { a: 'rgba(255,255,255,0.7)', b: 'rgba(240,120,192,0.6)' }, rows: ['aaaaaaa', 'a.b.b.a', 'ab.b.ba', 'a..b..a', '.a.b.a.', '..a.a..'] },
  },

  // ------------------------------------------------------------- domino
  domino: {
    ground: { blade: ['#2f6a58', '#20493e'], pebble: ['#c8c8c0', '#f0f0e8'], bush: false },
    flower: [   // elszort jatekzsetonok
      { pal: { a: '#e04a4a', b: '#ffffff', s: '#8a2020' }, rows: ['...', 'aba', 'sss', '...'] },
      { pal: { a: '#4a8ae0', b: '#ffffff', s: '#28508a' }, rows: ['...', 'aba', 'sss', '...'] },
      { pal: { a: '#f0d24a', b: '#ffffff', s: '#8a7420' }, rows: ['...', 'aba', 'sss', '...'] },
      { pal: { a: '#2a2a30', b: '#ffffff', s: '#16161c' }, rows: ['...', 'aba', 'sss', '...'] },
    ],
    mushroom: [   // eldolt dominolapok a foldon
      { pal: { a: '#f0f0ea', b: '#2a2a30', c: '#8e8e88' }, rows: ['.....', 'aaaaa', 'ababa', 'aaaaa', 'ccccc'] },
      { pal: { a: '#e8e8e0', b: '#2a2a30', c: '#8e8e88' }, rows: ['.....', '.....', 'aaaaa', 'abbba', 'ccccc'] },
      { pal: { a: '#f4f4ee', b: '#2a2a30', c: '#8e8e88' }, rows: ['.....', 'aaaaa', 'ababa', 'aaaaa', 'ccccc'] },
    ],
    rock: [   // ceruzavegek es radir
      { pal: { a: '#e8a02c', b: '#ffd88a', c: '#8a5a10' }, rows: ['.bb..', '.aaa.', 'aaaac', 'cccc.'] },
      { pal: { a: '#e0a0c0', b: '#f8d0e0', c: '#a06a84' }, rows: ['..b..', '.baa.', 'aaaaa', '.ccc.'] },
    ],
    web: { pal: { a: 'rgba(240,240,232,0.6)', b: 'rgba(240,240,232,0.3)' }, rows: ['aaaaaaa', 'a.b.b.a', 'ab.b.ba', 'a..b..a', '.a.b.a.', '..a.a..'] },
  },
  // ------------------------------------------------------- tuzijatek
  tuzijatek: {
    ground: { blade: ['#38445a', '#242e3e'], pebble: ['#4a4458', '#66607a'], bush: true },
    flower: [   // kis petarda a fuben, kanoccal
      { pal: { a: '#e04a3c', b: '#ffd257', s: '#8a6c26' }, rows: ['.b.', '.a.', '.a.', 'sss'] },
      { pal: { a: '#3a8ad8', b: '#ffd257', s: '#8a6c26' }, rows: ['.b.', '.a.', '.a.', 'sss'] },
      { pal: { a: '#3aa85a', b: '#ffd257', s: '#8a6c26' }, rows: ['.b.', '.a.', '.a.', 'sss'] },
      { pal: { a: '#e04aa0', b: '#ffd257', s: '#8a6c26' }, rows: ['.b.', '.a.', '.a.', 'sss'] },
    ],
    mushroom: [   // elhasznalt, kormos hulvely a foldon
      { pal: { a: '#8a5a3a', b: '#2a2028', c: '#5e3a24' }, rows: ['.....', '.bbb.', 'aabaa', 'aaaaa', 'ccccc'] },
      { pal: { a: '#7a4a4a', b: '#2a2028', c: '#523030' }, rows: ['.....', '.....', '.bbb.', 'aaaaa', 'ccccc'] },
      { pal: { a: '#6a5a7a', b: '#2a2028', c: '#463c52' }, rows: ['.....', '.bbb.', 'aaaaa', 'aaaaa', 'ccccc'] },
    ],
    rock: [   // homokzsak es kotomb az inditoallasnal
      { pal: { a: '#6e6450', b: '#8f8470', c: '#4a4436' }, rows: ['.....', '.bba.', 'aaaaa', 'ccccc'] },
      { pal: { a: '#4e4a58', b: '#6b6678', c: '#36333e' }, rows: ['..b..', '.baa.', '.aaa.', '.ccc.'] },
    ],
    web: { pal: { a: 'rgba(200,196,214,0.4)', b: 'rgba(200,196,214,0.2)' }, rows: ['..aaa..', '.aabaa.', 'aab.baa', '.ab.ba.', '..a.a..', '..a.a..'] },
  },

  // ------------------------------------------------------- szelmalom
  szelmalom: {
    ground: { blade: ['#5f9a4a', '#3d6a30'], pebble: ['#8a7a5c', '#a89a78'], bush: true },
    flower: [   // tulipan, negy szinben
      { pal: { a: '#e04a3c', b: '#ff8a6a', s: '#3c6b32' }, rows: ['aba', 'aaa', '.s.', 'ss.'] },
      { pal: { a: '#f0d24a', b: '#fff0a8', s: '#3c6b32' }, rows: ['aba', 'aaa', '.s.', '.ss'] },
      { pal: { a: '#f0f0e8', b: '#ffffff', s: '#3c6b32' }, rows: ['aba', 'aaa', '.s.', 'ss.'] },
      { pal: { a: '#e05a8a', b: '#f6b8d0', s: '#3c6b32' }, rows: ['aba', 'aaa', '.s.', '.ss'] },
    ],
    mushroom: [   // facipo es sajtkarika a fuben
      { pal: { a: '#c8a24a', b: '#e8c88a', s: '#8a6a30' }, rows: ['.....', '..aa.', '.aaaa', 'aaaas', 'ssss.'] },
      { pal: { a: '#f0c03c', b: '#ffe08a', s: '#c83a30' }, rows: ['.....', '.sss.', 'sabas', '.sss.', '.....'] },
      { pal: { a: '#c8a24a', b: '#e8c88a', s: '#8a6a30' }, rows: ['.....', '.aa..', 'aaaa.', 'saaaa', '.ssss'] },
    ],
    rock: [   // teglakupac a gatrol
      { pal: { a: '#a8543a', b: '#c47458', c: '#743424' }, rows: ['.....', '.bba.', 'aaaaa', 'ccccc'] },
      { pal: { a: '#a8543a', b: '#c47458', c: '#743424' }, rows: ['..b..', '.baa.', '.aaa.', '.ccc.'] },
    ],
    web: { pal: { a: 'rgba(226,220,196,0.55)', b: 'rgba(226,220,196,0.3)' }, rows: ['aaaaaaa', 'a.b.b.a', 'ab.b.ba', 'a..b..a', '.a.b.a.', '..a.a..'] },
  },
};

export const PROPS = P;

export function propsOf(id) {
  return P[id] || P.erdo;
}
