// A hős kinézetének tesztje: node tools/teszt-kinezet.js
// 1) a szerver engedett értékei (data.js LOOK_ENUMS) pontosan a rajzoló (rig.js) választékai
// 2) minden régi kinézet-kombináció átalakul és hiba nélkül kirajzolódik
// 3) rossz / ártó értékek kiesnek; a régi és az új kliens is tud hőst készíteni
global.window = global;
['data', 'engine', 'game', 'rig'].forEach(f => require('../js/' + f + '.js'));
const D = NYX.data, G = NYX.game, R = NYX.rig;
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('HIBA:', m); } };
const opt = k => Object.keys((R.OPTIONS[k] || R.HAIR_PARTS[k]).items);
Object.keys(D.LOOK_ENUMS).forEach(k => {
  const want = k === 'metal' ? Object.keys(R.METAL) : opt(k);
  ok(JSON.stringify(want.slice().sort()) === JSON.stringify(D.LOOK_ENUMS[k].slice().sort()), `${k}: rig=${want} data=${D.LOOK_ENUMS[k]}`);
});
['outfit', 'weapon'].forEach(k => ok(D.LOOK_INTS[k] === opt(k).length - 1, k + ' tartomány'));
const rigKeys = Object.keys(R.defaultLook('magus')).sort(), baseKeys = Object.keys(D.LOOK_BASE).sort();
ok(JSON.stringify(rigKeys) === JSON.stringify(baseKeys), 'mezők: rig ' + rigKeys + ' / data ' + baseKeys);
D.CLASS_ORDER.forEach(c => { const a = R.defaultLook(c), b = G.cleanRig(null, c); ok(JSON.stringify(a) === JSON.stringify(b), 'alapkinézet ' + c); });
// 2) régi kombinációk
let n = 0;
for (const hs of ['hosszu', 'rovid', 'copf', 'konty', 'tuskes']) for (const ey of ['sotet', 'kek', 'zold', 'arany', 'tunde'])
  for (const mk of ['nincs', 'holdjel', 'csillag', 'heg', 'szeplo']) for (const pp of D.PEOPLE_ORDER) for (const c of D.CLASS_ORDER) {
    const hero = { name: 'Teszt', classId: c, people: pp, look: { hairStyle: hs, hair: '#e8e8ff', tip: '#7f8cff', eyes: ey, mark: mk, outfit: '#3a3f9c' } };
    const L = G.migrateLook(hero);
    ok(JSON.stringify(G.cleanRig(L, c)) === JSON.stringify(L), 'átalakítás stabil ' + [hs, ey, mk, pp, c]);
    try { const s = R.hero({ name: 'T', classId: c, rig: L }); ok(s.indexOf('<svg') === 0 && s.indexOf('NaN') < 0 && s.indexOf('undefined') < 0, 'rajz ' + [hs, ey, mk, pp, c]); } catch (e) { ok(false, 'rajz hiba ' + e.message); }
    n++;
  }
// 3) rossz értékek
const bad = G.cleanRig({ sex: 'x', hair: 'red"/><script>', tip: null, eye2: '#ABCDEF', outfit: 7, weapon: '2', eyeGlow: 'igen', evil: 1, headwear: 'sisak' }, 'harcos');
ok(bad.sex === 'no' && bad.hair === D.LOOK_BASE.hair && bad.tip === null && bad.eye2 === '#abcdef' && bad.outfit === 0 && bad.weapon === 2 && bad.eyeGlow === false && !('evil' in bad) && bad.headwear === 'sisak', 'szűrés ' + JSON.stringify(bad));
ok(JSON.stringify(G.cleanRig('szöveg', 'x')).indexOf('script') < 0, 'nem objektum');
const arr = G.cleanRig({ hair: ['#aabbcc'], c1: ['#112233'], tip: ['#aabbcc'] }, 'magus');
ok(arr.hair === D.LOOK_BASE.hair && arr.c1 === D.CLASS_LOOK.magus.c1 && arr.tip === D.LOOK_BASE.tip, 'tömb mint szín');
let threw = false; try { G.migrateLook({ classId: 'magus', people: 'ember', look: { hair: ['#aabbcc'], outfit: ['#000000'] } }); } catch (e) { threw = true; }
ok(!threw, 'régi kinézet tömbbel');
const oldSave = G.createSave({ name: 'Régi', classId: 'magus', people: 'holdtunde', look: { hairStyle: 'copf', eyes: 'tunde' } }, Date.now());
ok(!oldSave.hero.rig && oldSave.hero.look.hairStyle === 'copf', 'régi kliens');
const newSave = G.createSave({ name: 'Új', classId: 'vadasz', people: 'ember', rig: Object.assign(R.randomLook('vadasz'), { headwear: 'csuklya' }) }, Date.now());
ok(newSave.hero.rig && newSave.hero.rig.headwear === 'csuklya', 'új kliens');
const saveWings = newSave.hero.rig.wings; const r = G.run(newSave, 'restyle', { rig: { headwear: 'suveg', hair: '#112233' } }, { now: Date.now() });
ok(newSave.hero.rig.headwear === 'suveg' && newSave.hero.rig.hair === '#112233' && newSave.hero.rig.mouth === newSave.hero.rig.mouth && newSave.hero.rig.wings === saveWings, 'átszabás (a többi mező marad)');
console.log(`${n} régi kombináció, ${fail ? fail + ' HIBA' : 'minden rendben'}`);
process.exit(fail ? 1 : 0);
