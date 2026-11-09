/* Nyxoria – rétegelt hős-rig (2. generációs grafika).
   Cel-shading stílusú, rétegekből összerakott SVG figura sok választási lehetőséggel.
   Minden mozgó rész külön csoport (r-*), így CSS-sel animálható (lásd css/rig.css). */
(function (root) {
  'use strict';

  // ---------- színsegédek ----------
  function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function rgbToHex(r, g, b) { return '#' + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1); }
  function mix(a, b, t) { const x = hexToRgb(a), y = hexToRgb(b); return rgbToHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); }
  const INK = '#1b1238';
  function dark(c, t) { return mix(c, INK, t == null ? 0.35 : t); }
  function light(c, t) { return mix(c, '#ffffff', t == null ? 0.3 : t); }
  function line(c) { return mix(c, INK, 0.62); }
  function lum(c) { const [r, g, b] = hexToRgb(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }

  // ---------- útvonal-tükrözés (x → 320 − x), csak abszolút M L C Q Z parancsokkal ----------
  function mirror(d) {
    let i = 0;
    return d.replace(/[MLCQZ]|-?\d*\.?\d+/g, t => {
      if (/[MLCQZ]/.test(t)) { i = 0; return t; }
      const v = parseFloat(t), out = (i % 2 === 0) ? +(320 - v).toFixed(2) : v;
      i++;
      return String(out);
    });
  }
  const both = d => [d, mirror(d)];
  // abszolút útvonal x-koordinátáinak átszámítása (forgatáshoz: az arc „ablakának” leképezése)
  function xmap(d, fx) {
    let i = 0;
    return d.replace(/[MLCQZ]|-?\d*\.?\d+/g, t => {
      if (/[MLCQZ]/.test(t)) { i = 0; return t; }
      const v = parseFloat(t), out = (i % 2 === 0) ? +fx(v).toFixed(2) : v;
      i++;
      return String(out);
    });
  }
  // abszolút útvonal pontjainak x-e az (x, y) pár függvényében (a henger sugara magasságonként más)
  function pmap(d, f) {
    return d.replace(/(-?\d*\.?\d+)[\s,]+(-?\d*\.?\d+)/g, (m, a, b) => `${+f(+a, +b).toFixed(2)} ${b}`);
  }
  // egy SVG-darab összes d="…" útvonala és kör/ellipszis középpontja átszámítva
  function cylSvg(svg, f) {
    return svg.replace(/ d="([^"]*)"/g, (m, d) => ` d="${pmap(d, f)}"`)
      .replace(/cx="(-?[\d.]+)" cy="(-?[\d.]+)"/g, (m, x, y) => `cx="${+f(+x, +y).toFixed(2)}" cy="${y}"`);
  }
  // körvonal félszélessége magasságonként (a 160-as függőleges tengelytől): mintavételezett bezier-ív
  const HW_CACHE = {};
  function halfWidth(d) {
    if (HW_CACHE[d]) return HW_CACHE[d];
    const tk = d.match(/[MLCQZ]|-?\d*\.?\d+/g) || [];
    const pts = [];
    let i = 0, cmd = '', cur = [160, 0], st = [160, 0];
    const n = () => +tk[i++];
    const add = (a, b, c, e, kind) => { // szakasz mintavétele
      for (let k = 1; k <= 20; k++) {
        const t = k / 20, u = 1 - t;
        if (kind === 'L') pts.push([a[0] + (e[0] - a[0]) * t, a[1] + (e[1] - a[1]) * t]);
        else if (kind === 'Q') pts.push([u * u * a[0] + 2 * u * t * b[0] + t * t * e[0], u * u * a[1] + 2 * u * t * b[1] + t * t * e[1]]);
        else pts.push([u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * e[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * e[1]]);
      }
    };
    while (i < tk.length) {
      if (/[MLCQZ]/.test(tk[i])) cmd = tk[i++];
      if (cmd === 'Z') { add(cur, null, null, st, 'L'); cur = st; cmd = ''; continue; }
      if (cmd === 'M') { cur = [n(), n()]; st = cur; pts.push(cur); cmd = 'L'; }
      else if (cmd === 'L') { const e = [n(), n()]; add(cur, null, null, e, 'L'); cur = e; }
      else if (cmd === 'Q') { const b = [n(), n()], e = [n(), n()]; add(cur, b, null, e, 'Q'); cur = e; }
      else if (cmd === 'C') { const b = [n(), n()], c = [n(), n()], e = [n(), n()]; add(cur, b, c, e, 'C'); cur = e; }
      else i++;
    }
    let y0 = Infinity, y1 = -Infinity;
    pts.forEach(p => { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    y0 = Math.floor(y0); y1 = Math.ceil(y1);
    const tb = new Float32Array(y1 - y0 + 1);
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1], b = pts[k], lo = Math.ceil(Math.min(a[1], b[1])), hi = Math.floor(Math.max(a[1], b[1]));
      for (let y = lo; y <= hi; y++) {
        const t = b[1] === a[1] ? 0 : (y - a[1]) / (b[1] - a[1]);
        tb[y - y0] = Math.max(tb[y - y0], Math.abs(a[0] + (b[0] - a[0]) * t - 160));
      }
    }
    const f = y => { if (y < y0 || y > y1) return 0; const j = y - y0, a = Math.floor(j), r = j - a; return a + 1 < tb.length ? tb[a] * (1 - r) + tb[a + 1] * r : tb[a]; };
    HW_CACHE[d] = f;
    return f;
  }
  // Hengeres leképezés: egy x pont a fej körüli R sugarú hengeren φ = asin((x−160)/R) szögben ül; θ fordulás után
  // x' = 160 + R·sin(φ+θ). A hátra forduló rész a körvonalra simul (nem fordul át → nincs önmetszés),
  // a hengeren kívüli pont (pl. elálló tincs) sugárirányban kilóg. lim: φ korlátozása (az arc „ablakához”).
  function cylX(x, R, th, lim) {
    const dx = x - 160, s = dx < 0 ? -1 : 1, H = Math.PI / 2;
    let ph, ext = 0;
    if (R > 0.5 && Math.abs(dx) <= R) ph = Math.asin(dx / R); else { ph = s * H; ext = Math.abs(dx) - Math.max(0, R); }
    if (lim != null && Math.abs(ph) > lim) { ph = s * lim; ext = 0; }
    const p = ph + th;
    if (Math.abs(p) <= H) return 160 + (R + ext) * Math.sin(p);
    const q = p > 0 ? 1 : -1;
    return 160 + q * (R + ext * Math.max(0, Math.cos(Math.abs(p) - H)));
  }

  // ---------- katalógus: a választható elemek (magyar nevekkel) ----------
  const SKIN = [
    ['Porcelán', '#f6dcc8'], ['Világos', '#f0c8a8'], ['Napbarnított', '#e0aa82'], ['Olajbarna', '#c98d62'], ['Mogyoró', '#a86c45'], ['Kakaó', '#7f4d32'], ['Éjbarna', '#5a3524'], ['Rózsás', '#f3c4bd'],
    ['Holdfehér', '#d9def5'], ['Ködkék', '#a9bde8'], ['Ibolya', '#b8a2e6'], ['Árnyszürke', '#8f8aa6'], ['Kőszürke', '#a7a3ad'], ['Mohazöld', '#a7c9a0'], ['Aranyfényű', '#f2d79a'], ['Éjkék', '#5f6aa8']
  ];
  const HAIR = [
    ['Ezüstös', '#e9ecff'], ['Hófehér', '#fbfbff'], ['Platina', '#efe3c4'], ['Aranyszőke', '#f0c76a'], ['Mézszőke', '#d99b45'], ['Vörösréz', '#c8572e'], ['Lángvörös', '#e23b3b'], ['Gesztenye', '#7a4428'],
    ['Étcsoki', '#4a2a1c'], ['Éjfekete', '#262038'], ['Holdkék', '#7f8cff'], ['Égkék', '#5ab4ff'], ['Ibolya', '#a46bff'], ['Rózsaszín', '#ff8ac6'], ['Menta', '#5fd3a6'], ['Mélyzöld', '#2f8a5c']
  ];
  const EYES = [
    ['Éjsötét', '#2b2350'], ['Mogyoró', '#8a5a2b'], ['Borostyán', '#e09a2a'], ['Arany', '#f2c440'], ['Smaragd', '#2fae6a'], ['Jáde', '#56c9a4'], ['Égkék', '#3d8cf0'], ['Jégkék', '#9fe6ff'],
    ['Ibolya', '#8f5bff'], ['Rózsaszín', '#ff6fae'], ['Vérvörös', '#d8323c'], ['Ezüst', '#c9cfe6']
  ];
  const CLOTH = [
    ['Éjkék', '#2c3a8c'], ['Holdlila', '#5a3e9e'], ['Bíbor', '#8e2448'], ['Rozsdavörös', '#a8482a'], ['Mohazöld', '#2f6b4f'], ['Erdőzöld', '#3f5a2a'], ['Homokszín', '#c8a46a'], ['Hamuszürke', '#4a4a5e'],
    ['Éjfekete', '#24203a'], ['Hófehér', '#e8e6f2'], ['Tengerkék', '#1f6f8a'], ['Rózsaszín', '#c25a8a']
  ];
  const METAL = { arany: ['Arany', '#e8b94a'], ezust: ['Ezüst', '#cfd6ea'], bronz: ['Bronz', '#c07a3e'], ejacel: ['Éjacél', '#5c6488'] };
  const HORN_COLORS = [['Csont', '#efe4cc'], ['Éjfekete', '#2c2540'], ['Arany', '#e8b94a'], ['Holdkristály', '#bfe9ff']];

  const OPTIONS = {
    sex: { label: 'Nem', items: { no: 'Nő', ferfi: 'Férfi' } },
    body: { label: 'Testalkat', items: { karcsu: 'Karcsú', atlagos: 'Átlagos', eros: 'Erős' } },
    height: { label: 'Magasság', items: { alacsony: 'Alacsony', kozepes: 'Közepes', magas: 'Magas' } },
    face: { label: 'Arcforma', items: { ovalis: 'Ovális', kerek: 'Kerek', szogletes: 'Szögletes' } },
    eyeShape: { label: 'Szemforma', items: { kerek: 'Kerek', nagy: 'Nagy, csillogó', mandula: 'Mandulavágású', macska: 'Macskaszem', almos: 'Álmos', eles: 'Éles' } },
    brows: { label: 'Szemöldök', items: { ivelt: 'Ívelt', egyenes: 'Egyenes', vastag: 'Vastag', vekony: 'Vékony', mergues: 'Mérges' } },
    mouth: { label: 'Arckifejezés', items: { mosoly: 'Mosolygós', vigyor: 'Vigyorgó', magabiztos: 'Magabiztos', huncut: 'Huncut', komoly: 'Komoly', meglepett: 'Meglepett' } },
    nose: { label: 'Orr', items: { pici: 'Pici', gomb: 'Gömbölyű', egyenes: 'Egyenes' } },
    ears: { label: 'Fül', items: { ember: 'Emberi', tunde: 'Tündefül', hosszutunde: 'Hosszú tündefül', roka: 'Rókafül', macska: 'Macskafül' } },
    hairStyle: { label: 'Frizura', items: {} },
    beard: { label: 'Szakáll', items: { nincs: 'Nincs', borosta: 'Borosta', bajusz: 'Bajusz', kecske: 'Kecskeszakáll', teli: 'Dús szakáll' } },
    horns: { label: 'Szarv', items: { nincs: 'Nincs', kicsi: 'Kis szarvak', kos: 'Kosszarv', sarlo: 'Sarlószarv', agancs: 'Agancs', demon: 'Démonszarv' } },
    mark: { label: 'Arcjegy', items: { nincs: 'Nincs', holdjel: 'Holdjel', csillagok: 'Csillagok', csikok: 'Törzsi csíkok', szeplok: 'Szeplők', forradas: 'Forradás', harcifestek: 'Harci festék', konnycsepp: 'Könnycsepp' } },
    headwear: { label: 'Fejdísz', items: { nincs: 'Nincs', diadem: 'Diadém', abroncs: 'Fejabroncs', csuklya: 'Csuklya', suveg: 'Varázslósüveg', koszoru: 'Virágkoszorú', szemkoto: 'Szemkötő', sisak: 'Sisak' } },
    earring: { label: 'Fülbevaló', items: { nincs: 'Nincs', karika: 'Karika', kristaly: 'Kristály' } },
    outfit: { label: 'Öltözet', items: { 0: 'Első', 1: 'Második' } },
    cape: { label: 'Köpeny', items: { nincs: 'Nincs', rovid: 'Rövid', hosszu: 'Hosszú', rongyos: 'Rongyos', csillagos: 'Csillagos' } },
    weapon: { label: 'Fegyver', items: { 0: 'Első', 1: 'Második', 2: 'Harmadik' } },
    wings: { label: 'Szárny', items: { nincs: 'Nincs', tunder: 'Tündérszárny', denever: 'Denevérszárny', feny: 'Fényszárny' } },
    tail: { label: 'Farok', items: { nincs: 'Nincs', roka: 'Rókafarok', macska: 'Macskafarok', sarkany: 'Sárkányfarok' } },
    aura: { label: 'Aura', items: { nincs: 'Nincs', holdfeny: 'Holdfény', parazs: 'Parázs', arny: 'Árny', csillagpor: 'Csillagszikra', villam: 'Villám' } }
  };
  // A frizura egyben választható: minden frizura egy elülső rész (frufru, tincsek) és egy hátsó tömeg (hossz, copf, konty)
  // összeillő párosa. A rajzoló továbbra is a két részből dolgozik, így a régi, szabadon párosított kinézetek is működnek.
  const HAIR_PARTS = {
    hairBack: { label: 'Haj hátul', items: { rovid: 'Rövid', vallig: 'Vállig érő', hosszu: 'Hosszú', hullamos: 'Hullámos', copf: 'Lófarok', ketcopf: 'Két copf', konty: 'Konty', nincs: 'Nincs' } },
    hairFront: { label: 'Frizura elöl', items: { egyenes: 'Egyenes frufru', oldal: 'Oldalra fésült', tuskes: 'Tüskés', kozep: 'Középen elválasztott', kocos: 'Kócos', hatra: 'Hátrafésült', aszim: 'Szembe lógó', katonai: 'Katonásan rövid', felnyirt: 'Felnyírt oldal', felfesult: 'Felfésült', oldalvalasztott: 'Rövid, oldalválasztott', irokez: 'Irokéz', kopasz: 'Kopasz' } },
  };
  // [azonosító, név, elöl, hátul, kinek illik inkább: 'n' nő, 'f' férfi, '' bárki]
  const HAIRSTYLES = [
    ['hosszu_oldal', 'Hosszú, oldalra fésült', 'oldal', 'hosszu', 'n'],
    ['hosszu_frufru', 'Hosszú, frufruval', 'egyenes', 'hosszu', 'n'],
    ['hosszu_kozep', 'Hosszú, elválasztott', 'kozep', 'hosszu', 'n'],
    ['hullamos', 'Hullámos fürtök', 'kozep', 'hullamos', 'n'],
    ['szembelogo', 'Szembe lógó', 'aszim', 'hullamos', 'n'],
    ['vallig', 'Vállig érő', 'oldal', 'vallig', ''],
    ['vallig_kocos', 'Kócos, vállig érő', 'kocos', 'vallig', ''],
    ['bubi', 'Rövid bubi', 'egyenes', 'rovid', 'n'],
    ['lofarok', 'Lófarok', 'egyenes', 'copf', 'n'],
    ['lofarok_kocos', 'Kócos lófarok', 'kocos', 'copf', ''],
    ['ket_copf', 'Két copf', 'kozep', 'ketcopf', 'n'],
    ['konty', 'Laza konty', 'oldal', 'konty', 'n'],
    ['harcoskonty', 'Harcoskonty', 'hatra', 'konty', 'f'],
    ['hatrafesult_hosszu', 'Hosszan hátrafésült', 'hatra', 'vallig', ''],
    ['hatrafesult', 'Hátrafésült', 'hatra', 'rovid', 'f'],
    ['kocos', 'Kócos', 'kocos', 'rovid', ''],
    ['tuskes', 'Tüskés', 'tuskes', 'rovid', ''],
    ['kozep_rovid', 'Rövid, elválasztott', 'kozep', 'rovid', ''],
    ['oldalvalasztott', 'Oldalválasztott', 'oldalvalasztott', 'nincs', 'f'],
    ['felfesult', 'Felfésült', 'felfesult', 'nincs', 'f'],
    ['felnyirt', 'Felnyírt oldal', 'felnyirt', 'nincs', 'f'],
    ['katonai', 'Katonásan rövid', 'katonai', 'nincs', 'f'],
    ['irokez', 'Irokéz', 'irokez', 'nincs', 'f'],
    ['kopasz', 'Kopasz', 'kopasz', 'nincs', 'f']
  ];
  HAIRSTYLES.forEach(h => { OPTIONS.hairStyle.items[h[0]] = h[1]; });
  const HAIRSTYLE = {}; HAIRSTYLES.forEach(h => { HAIRSTYLE[h[0]] = h; });
  // melyik frizura van most rajta (ha a két rész egy ismert párt ad ki); különben üres
  function hairStyleOf(L) { const h = HAIRSTYLES.find(x => x[2] === L.hairFront && x[3] === L.hairBack); return h ? h[0] : ''; }
  function applyHairStyle(L, id) { const h = HAIRSTYLE[id]; if (h) { L.hairFront = h[2]; L.hairBack = h[3]; } return L; }
  const COLOR_SLOTS = { skin: ['Bőrszín', SKIN], hair: ['Hajszín', HAIR], tip: ['Hajvég', HAIR], eye: ['Szemszín', EYES], eye2: ['Másik szem', EYES], c1: ['Fő szín', CLOTH], c2: ['Kiegészítő szín', CLOTH], hornColor: ['Szarv színe', HORN_COLORS] };
  const WEAPON_NAMES = {
    harcos: ['Kard és pajzs', 'Pallos és kerek pajzs', 'Csatabárd'], vadasz: ['Hosszúíj', 'Vadászíj', 'Számszeríj'],
    magus: ['Csillagbot', 'Holdsarló-bot', 'Varázskönyv'], gyogyito: ['Napjogar', 'Fénylámpás', 'Szent buzogány'],
    orgyilkos: ['Két tőr', 'Görbe pengék', 'Két méregtüske'], idezo: ['Szellemlámpás', 'Rúnakönyv', 'Csontpálca'],
    dalnok: ['Lant', 'Hárfa', 'Furulya'], alakvalto: ['Karmok', 'Vadonbot', 'Agyarkés']
  };
  const OUTFIT_NAMES = {
    harcos: ['Lemezvért', 'Láncing címeres zekével'], vadasz: ['Bőrmellény', 'Vándorköpönyeg'], magus: ['Csillagköntös', 'Úti talár'], gyogyito: ['Holdpapi palást', 'Harci papi öltözet'],
    orgyilkos: ['Álarcos árnyruha', 'Sötét bőrvért'], idezo: ['Rúnás köntös', 'Szellemtalár'], dalnok: ['Puffos ujjú zeke', 'Vándordalnok-kabát'], alakvalto: ['Prémpalást', 'Csont- és bőrvért']
  };
  const CLASS_DEFAULTS = {
    harcos: { c1: '#8e2448', c2: '#4a4a5e', metal: 'ezust' }, vadasz: { c1: '#2f6b4f', c2: '#5a3e2a', metal: 'bronz' },
    magus: { c1: '#2c3a8c', c2: '#5a3e9e', metal: 'arany' }, gyogyito: { c1: '#e8e6f2', c2: '#c8a46a', metal: 'arany' },
    orgyilkos: { c1: '#24203a', c2: '#5a3e9e', metal: 'ejacel' }, idezo: { c1: '#5a3e9e', c2: '#1f6f8a', metal: 'ezust' },
    dalnok: { c1: '#8e2448', c2: '#c8a46a', metal: 'arany' }, alakvalto: { c1: '#3f5a2a', c2: '#7a5232', metal: 'bronz' }
  };

  function defaultLook(classId) {
    const d = CLASS_DEFAULTS[classId] || CLASS_DEFAULTS.magus;
    return {
      sex: 'no', body: 'atlagos', height: 'kozepes', skin: '#f0c8a8', face: 'ovalis', eyeShape: 'nagy', eye: '#3d8cf0', eye2: null, eyeGlow: false,
      brows: 'ivelt', mouth: 'mosoly', nose: 'pici', ears: 'ember', hairBack: 'vallig', hairFront: 'oldal', hair: '#e9ecff', tip: '#7f8cff',
      beard: 'nincs', horns: 'nincs', hornColor: '#efe4cc', mark: 'nincs', headwear: 'nincs', earring: 'nincs',
      outfit: 0, c1: d.c1, c2: d.c2, metal: d.metal, cape: 'nincs', weapon: 0, wings: 'nincs', tail: 'nincs', aura: 'nincs'
    };
  }
  function randomLook(classId, rnd) {
    rnd = rnd || Math.random;
    const pick = a => a[Math.floor(rnd() * a.length)];
    const keys = o => Object.keys(OPTIONS[o].items);
    const L = defaultLook(classId);
    ['body', 'height', 'face', 'eyeShape', 'brows', 'mouth', 'nose'].forEach(k => { L[k] = pick(keys(k)); });
    L.sex = rnd() < 0.5 ? 'ferfi' : 'no';
    // frizura a nemhez illő (vagy bárkinek jó) frizurák közül; ritkán bármelyik
    const fit = HAIRSTYLES.filter(h => !h[4] || h[4] === (L.sex === 'ferfi' ? 'f' : 'n'));
    applyHairStyle(L, (rnd() < 0.9 ? pick(fit) : pick(HAIRSTYLES))[0]);
    if (L.sex === 'ferfi') { // férfiaknál markánsabb szem és szemöldök, gyakoribb szakáll
      L.eyeShape = pick(['mandula', 'eles', 'almos', 'kerek', 'macska']);
      L.brows = pick(['egyenes', 'vastag', 'mergues', 'ivelt']);
    }
    L.ears = rnd() < 0.55 ? pick(['ember', 'tunde', 'hosszutunde']) : pick(keys('ears'));
    L.skin = pick(SKIN)[1]; L.hair = pick(HAIR)[1]; L.tip = rnd() < 0.6 ? pick(HAIR)[1] : null; L.eye = pick(EYES)[1];
    L.eye2 = rnd() < 0.12 ? pick(EYES)[1] : null; L.eyeGlow = rnd() < 0.25;
    L.beard = L.sex === 'ferfi' && rnd() < 0.45 ? pick(['borosta', 'bajusz', 'kecske', 'teli']) : 'nincs';
    L.horns = rnd() < 0.25 ? pick(keys('horns')) : 'nincs'; L.hornColor = pick(HORN_COLORS)[1];
    L.mark = rnd() < 0.45 ? pick(keys('mark')) : 'nincs';
    L.headwear = rnd() < 0.35 ? pick(keys('headwear')) : 'nincs';
    L.earring = rnd() < 0.3 ? pick(['karika', 'kristaly']) : 'nincs';
    L.outfit = rnd() < 0.5 ? 0 : 1; L.weapon = Math.floor(rnd() * 3);
    L.c1 = rnd() < 0.5 ? L.c1 : pick(CLOTH)[1]; L.c2 = rnd() < 0.6 ? L.c2 : pick(CLOTH)[1]; L.metal = pick(Object.keys(METAL));
    L.cape = rnd() < 0.5 ? pick(keys('cape')) : 'nincs';
    L.wings = rnd() < 0.12 ? pick(['tunder', 'denever', 'feny']) : 'nincs';
    L.tail = (L.ears === 'roka' || L.ears === 'macska') && rnd() < 0.7 ? (L.ears === 'roka' ? 'roka' : 'macska') : (rnd() < 0.08 ? 'sarkany' : 'nincs');
    L.aura = rnd() < 0.3 ? pick(keys('aura')) : 'nincs';
    return L;
  }

  // ---------- rajzoló segédek ----------
  let UID = 0;
  function P(d, fill, o) {
    o = o || {};
    const stroke = o.stroke === false ? '' : ` stroke="${o.stroke || line(fill.startsWith('#') ? fill : '#555577')}" stroke-width="${o.sw || 2}" stroke-linejoin="round" stroke-linecap="round"`;
    return `<path d="${d}" fill="${fill}"${stroke}${o.op ? ` opacity="${o.op}"` : ''}${o.extra || ''}/>`;
  }
  function S(d, color, w, o) { // vonal
    o = o || {};
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${o.op ? ` opacity="${o.op}"` : ''}${o.extra || ''}/>`;
  }
  // Kontúrkövető árnyékolás: a bal felső szélén vékony holdfény-perem, a jobb alsó részén árnyék.
  let FID = 0;
  function shaded(id, d, fill, o) {
    o = o || {};
    const base = o.base || (fill.startsWith('#') ? fill : '#8890b0');
    const k = id + 'f' + (++FID), off = o.off || [-5, -4], rim = o.rim == null ? 2.2 : o.rim;
    const rimC = mix(base, '#e8f0ff', 0.5), shC = mix(base, '#2a1a66', o.dark || 0.36);
    const stroke = o.stroke === false ? '' : `<path d="${d}" fill="none" stroke="${o.stroke || line(base)}" stroke-width="${o.sw || 2}" stroke-linejoin="round" stroke-linecap="round"/>`;
    const fr = o.evenodd ? ' fill-rule="evenodd" clip-rule="evenodd"' : '';
    return `<clipPath id="${k}a"><path d="${d}"${fr}/></clipPath><clipPath id="${k}b"><path d="${d}"${fr} transform="translate(${rim} ${rim})"/></clipPath>` +
      `<g clip-path="url(#${k}a)"><path d="${d}"${fr} fill="${rimC}"/><path d="${d}"${fr} fill="${shC}" transform="translate(${rim} ${rim})"/>` +
      `<g clip-path="url(#${k}b)"><path d="${d}"${fr} fill="${fill}" transform="translate(${off[0]} ${off[1]})"/></g></g>` + stroke;
  }
  function metalFill(id) { return `url(#${id}-metal)`; }

  // ---------- fej ----------
  const HEAD = {
    ovalis: 'M114 116 C114 80 132 64 160 64 C188 64 206 80 206 116 C206 140 196 158 182 168 C174 174 167 177 160 177 C153 177 146 174 138 168 C124 158 114 140 114 116 Z',
    kerek: 'M112 118 C112 80 132 64 160 64 C188 64 208 80 208 118 C208 148 190 174 160 175 C130 174 112 148 112 118 Z',
    szogletes: 'M114 114 C114 80 132 64 160 64 C188 64 206 80 206 114 C206 136 204 152 194 163 C184 172 172 177 160 177 C148 177 136 172 126 163 C116 152 114 136 114 114 Z'
  };
  // Férfi koponyák: szélesebb, szögletesebb állkapocs és lapos, széles áll – a felső fejforma azonos
  const HEAD_M = {
    // egyenes állkapocsél, látható állkapocsszöglet és széles, lapos áll; hosszabb arc, mint a nőknél
    ovalis: 'M115 112 C115 80 132 64 160 64 C188 64 205 80 205 112 C205 128 204 140 200 151 L189 175 C185 183 177 188 167 189 L153 189 C143 188 135 183 131 175 L120 151 C116 140 115 128 115 112 Z',
    kerek: 'M113 114 C113 80 132 64 160 64 C188 64 207 80 207 114 C207 132 205 146 201 156 L192 176 C187 184 178 188 168 188 L152 188 C142 188 133 184 128 176 L119 156 C115 146 113 132 113 114 Z',
    szogletes: 'M114 110 C114 80 132 64 160 64 C188 64 206 80 206 110 C206 130 206 146 204 158 L196 178 C193 185 184 189 172 189 L148 189 C136 189 127 185 124 178 L116 158 C114 146 114 130 114 110 Z'
  };
  const EARS = {
    ember: 'M118 108 C104 102 101 126 108 135 C111 140 117 140 119 134 Z',
    tunde: 'M119 110 C106 104 94 92 86 82 C90 100 98 122 110 137 C114 141 119 139 120 134 Z',
    hosszutunde: 'M119 110 C100 100 82 80 66 62 C74 90 90 120 109 138 C114 142 119 139 120 134 Z'
  };
  const EAR_INNER = {
    ember: 'M115 112 C108 112 107 126 111 131',
    tunde: 'M116 114 C106 108 98 100 93 94 C98 108 104 122 111 132',
    hosszutunde: 'M116 114 C102 104 88 90 76 76 C84 96 96 116 110 132'
  };
  const ANIMAL_EARS = {
    roka: { outer: 'M126 84 C120 64 116 44 118 26 C132 38 146 54 152 70 Z', inner: 'M128 76 C124 62 122 50 123 40 C132 50 140 60 144 70 Z' },
    macska: { outer: 'M124 84 C118 66 120 48 126 36 C138 44 148 58 152 72 Z', inner: 'M128 78 C125 64 126 54 129 46 C136 52 142 60 145 70 Z' }
  };

  // Szemek egységes szerkesztéssel (anime-szemkonstrukció): külső szemzug (O) és belső szemzug (I)
  // között egy felső és egy alsó szemhéjív. A felső szemhéj vastag, a külső végén pillacsapással;
  // az alsó szemhéjnak csak a külső fele látszik. Az írisz mindig ugyanakkora, a szemhéj takarja le
  // a tetejét – így az álmos vagy éles szem is élő marad, nem zsugorodik pöttyé.
  // Helyi koordináták: (0,0) a szem közepe, a néző bal oldali szeme; −x a külső zug, +x az orr felé.
  const EYE_SHAPES = {
    kerek: { W: 11.5, oy: 1, iy: 1.5, hu: 13.5, hl: 11.5, ir: [8.6, 10.4], flick: [-4, -3.2], crease: 0 },
    nagy: { W: 12.8, oy: 0.5, iy: 1.5, hu: 15.5, hl: 12.5, ir: [9.6, 11.8], flick: [-4.4, -3.8], crease: 1, lash2: 1 },
    mandula: { W: 13.4, oy: -1.5, iy: 2.5, hu: 11.5, hl: 8.5, ir: [8.4, 10.2], flick: [-5, -3.6], crease: 1 },
    macska: { W: 14, oy: -4.5, iy: 3, hu: 11, hl: 7.5, ir: [8.4, 10], flick: [-6.5, -4.6], crease: 0, slit: 1, lash2: 1 },
    almos: { W: 12.6, oy: 1.5, iy: 2, hu: 7, hl: 9.5, ir: [8.6, 10.4], flick: [-3.8, -1.4], crease: 2 },
    eles: { W: 13.6, oy: -3.5, iy: 2.5, hu: 9, hl: 6.5, ir: [8, 9.6], flick: [-6.5, -2.6], crease: 0, sharp: 1 }
  };
  function bez(a, b, c, d, t) { const u = 1 - t; return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]; }
  function bezSeg(pts, t0, t1, n) { let s = ''; for (let i = 0; i <= n; i++) { const p = bez(pts[0], pts[1], pts[2], pts[3], t0 + (t1 - t0) * i / n); s += (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2) + ' '; } return s; }
  function eyeGeom(shape, male) {
    const E0 = EYE_SHAPES[shape] || EYE_SHAPES.kerek;
    // férfi szem: alacsonyabb nyílás, kisebb írisz, pilla nélkül – keskenyebb, nyugodtabb tekintet
    const E = male ? Object.assign({}, E0, { hu: E0.hu * 0.52, hl: E0.hl * 0.62, W: E0.W * 1.04, ir: [E0.ir[0] * 0.8, E0.ir[1] * 0.74], lash2: 0, flick: [E0.flick[0] * 0.35, E0.flick[1] * 0.35], crease: E0.crease === 2 ? 2 : 1 }) : E0, W = E.W;
    const O = [-W, E.oy], I = [W * 0.86, E.iy];
    const up = E.sharp ? [O, [-W * 0.35, E.oy - E.hu * 1.45], [W * 0.5, E.iy - E.hu * 1.05], I] : [O, [-W * 0.55, E.oy - E.hu * 1.33], [W * 0.45, E.iy - E.hu * 1.33], I];
    const lo = [I, [W * 0.45, E.iy + E.hl * 1.33], [-W * 0.55, E.oy + E.hl * 1.33], O];
    const f = v => v.toFixed(2);
    const d = `M${f(O[0])} ${f(O[1])} C${f(up[1][0])} ${f(up[1][1])} ${f(up[2][0])} ${f(up[2][1])} ${f(I[0])} ${f(I[1])} C${f(lo[1][0])} ${f(lo[1][1])} ${f(lo[2][0])} ${f(lo[2][1])} ${f(O[0])} ${f(O[1])} Z`;
    let top = 0, bot = 0;
    for (let i = 0; i <= 20; i++) { top = Math.min(top, bez(up[0], up[1], up[2], up[3], i / 20)[1]); bot = Math.max(bot, bez(lo[0], lo[1], lo[2], lo[3], i / 20)[1]); }
    return { E, O, I, up, lo, d, top, bot };
  }
  function eyeSvg(id, side, shape, color, glow, skin, male) {
    const G = eyeGeom(shape, male), E = G.E, cx = side < 0 ? 139 : 181, cy = 125;
    const flip = side > 0 ? ' scale(-1 1)' : '';
    const cid = `${id}-eye${side < 0 ? 'L' : 'R'}`;
    const [rx, ry] = E.ir;
    const icx = 0.6, icy = (G.top + G.bot) / 2 + ry * 0.12;
    const irisTop = dark(color, 0.6), irisMid = color, irisBot = light(color, 0.5);
    const lashC = '#1d1430', skinLine = dark(skin || '#f0c8a8', 0.42);
    const g = glow ? `<ellipse cx="${icx}" cy="${icy}" rx="${rx + 7}" ry="${ry + 7}" fill="${light(color, 0.25)}" opacity="0.5" filter="url(#${id}-blur3)"/>` : '';
    const pupil = E.slit ? `<ellipse cx="${icx + 0.4}" cy="${icy + 0.5}" rx="${(rx * 0.17).toFixed(2)}" ry="${(ry * 0.78).toFixed(2)}" fill="${glow ? light(color, 0.7) : '#120b26'}"/>`
      : `<ellipse cx="${icx + 0.4}" cy="${icy + 0.8}" rx="${(rx * 0.44).toFixed(2)}" ry="${(ry * 0.5).toFixed(2)}" fill="${glow ? light(color, 0.7) : '#120b26'}"/>`;
    const O = G.O, fl = E.flick;
    // felső szemhéj: teljes ív + vastagabb külső kétharmad + pillacsapás a külső zugnál
    // férfi: egyenletes, egyenesebb szemhéjvonal, a szemöldökcsont árnyéka a szem fölött
    let lid = male ? S(bezSeg(G.up, 0, 1, 14), lashC, 2.6) + S(bezSeg(G.up.map(p => [p[0], p[1] - 3.2]), 0.1, 0.9, 10), dark(skin || '#f0c8a8', 0.3), 3.2, { op: 0.35 })
      : S(bezSeg(G.up, 0, 1, 14), lashC, 2.4) + S(bezSeg(G.up, 0, 0.68, 12), lashC, 3.6);
    // a külső szemzugban felívelő pillacsapás nőies jegy: férfiaknál elmarad
    if (!male) lid += P(`M${O[0] + 1.2} ${O[1] - 1.6} L${O[0] + fl[0]} ${O[1] + fl[1]} L${O[0] + 2.6} ${O[1] + 1} Z`, lashC, { stroke: lashC, sw: 1.2 });
    if (E.lash2) { const q = bez(G.up[0], G.up[1], G.up[2], G.up[3], 0.18); lid += P(`M${(q[0] + 0.6).toFixed(2)} ${(q[1] - 1).toFixed(2)} L${(q[0] - 3.4).toFixed(2)} ${(q[1] - 4.6).toFixed(2)} L${(q[0] + 2.4).toFixed(2)} ${(q[1] + 0.4).toFixed(2)} Z`, lashC, { stroke: lashC, sw: 1 }); }
    // alsó szemhéj: csak a külső fele, vékonyan
    const lower = S(bezSeg(G.lo, 0.5, 1, 10), mix(lashC, skin || '#f0c8a8', 0.35), 1.3, { op: 0.85 });
    // szemhéjredő a felső ív fölött (dupla szemhéj / nehéz, álmos szemhéj)
    let crease = '';
    if (E.crease) {
      const up2 = G.up.map(p => [p[0] * 0.92, p[1] - (E.crease === 2 ? 3.2 : 4.2)]);
      crease = S(bezSeg(up2, E.crease === 2 ? 0.05 : 0.15, E.crease === 2 ? 0.95 : 0.7, 10), skinLine, E.crease === 2 ? 1.6 : 1.1, { op: 0.75 });
    }
    return `<g transform="translate(${cx} ${cy + (male ? 2 : 0)})${flip} scale(${male ? 0.97 : 1.1})"><g class="r-eye">
      <clipPath id="${cid}"><path d="${G.d}"/></clipPath>
      <path d="${G.d}" fill="#fbfaff"/>
      <g clip-path="url(#${cid})">
        <path d="${bezSeg(G.up, 0, 1, 14)}" fill="none" stroke="${dark(color, 0.35)}" stroke-width="7" opacity="0.2"/>
        ${g}
        <ellipse cx="${icx}" cy="${icy.toFixed(2)}" rx="${rx}" ry="${ry}" fill="url(#${cid}-ir)"/>
        <ellipse cx="${icx}" cy="${icy.toFixed(2)}" rx="${rx}" ry="${ry}" fill="none" stroke="${dark(color, 0.65)}" stroke-width="1.1"/>
        <ellipse cx="${icx}" cy="${(icy + ry * 0.5).toFixed(2)}" rx="${(rx * 0.72).toFixed(2)}" ry="${(ry * 0.3).toFixed(2)}" fill="${irisBot}" opacity="0.6"/>
        ${pupil}
        <path d="${bezSeg(G.up, 0, 1, 14)}" fill="none" stroke="#1d1430" stroke-width="4.5" opacity="0.28" transform="translate(0 2.2)"/>
        <ellipse cx="${(icx - rx * 0.38).toFixed(2)}" cy="${(icy - ry * 0.36).toFixed(2)}" rx="${(male ? Math.max(1.8, rx * 0.22) : Math.max(2.3, rx * 0.3)).toFixed(2)}" ry="${(male ? Math.max(2, ry * 0.22) : Math.max(2.6, ry * 0.3)).toFixed(2)}" fill="#fff"/>
        <circle cx="${(icx + rx * 0.42).toFixed(2)}" cy="${(icy + ry * 0.38).toFixed(2)}" r="1.5" fill="#fff" opacity="0.9"/>
      </g>
      <defs><linearGradient id="${cid}-ir" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${irisTop}"/><stop offset="0.5" stop-color="${irisMid}"/><stop offset="1" stop-color="${irisBot}"/></linearGradient></defs>
      ${crease}${lower}${lid}
    </g></g>`;
  }
  const BROWS = {
    ivelt: ['M-12 2 C-6 -5 6 -6 13 -1', 2.8], egyenes: ['M-12 0 L13 -2', 2.8], vastag: ['M-12 1 C-6 -4 6 -5 13 -1', 4.6],
    vekony: ['M-11 1 C-5 -4 6 -5 12 -2', 1.8], mergues: ['M-12 -4 C-4 -2 6 2 13 5', 3.4]
  };
  // A szemöldök a szem tetejéhez igazodik (álmos szemnél lejjebb ül), és a haj fölé kerül, mint az animékben.
  function browSvg(shape, color, side, eyeShape, male) {
    const b = BROWS[shape] || BROWS.ivelt, G = eyeGeom(eyeShape, male);
    // férfiaknál a szemöldök vastagabb, egyenesebb és közelebb ül a szemhez
    const y = male ? 127 + G.top * 1.02 - 5 : 125 + G.top * 1.1 - 8.5, w = b[1] + (male ? 2 : 0);
    const flat = male ? ' scale(1.06 0.7)' : '';
    return `<g transform="translate(${side < 0 ? 139 : 181} ${y.toFixed(1)})${side > 0 ? ' scale(-1 1)' : ''}${flat}">${S(b[0], light(color, 0.5), w + 2, { op: 0.35 })}${S(b[0], color, w)}</g>`;
  }
  function mouthSvg(shape, skin, male) {
    const lip = lum(skin) < 0.36 ? (male ? light(mix(skin, '#c07060', 0.45), 0.22) : light(mix(skin, '#e05a7a', 0.5), 0.18)) : male ? dark(mix(skin, '#8a4a3a', 0.35), 0.35) : dark(mix(skin, '#c0405a', 0.45), 0.25); // sötét bőrön világosabb ajak, hogy látsszon
    switch (shape) {
      case 'vigyor': return P('M147 151 C152 166 168 166 173 151 C164 155 156 155 147 151 Z', '#7a2034', { stroke: lip, sw: 1.8 }) + P('M150 152.5 C156 155 164 155 170 152.5 L169 155.5 C163 157 157 157 151 155.5 Z', '#fff', { stroke: false }) + P('M154 161 C158 159 162 159 166 161 C162 164 158 164 154 161 Z', '#e8708a', { stroke: false });
      case 'komoly': return S('M152 156 C157 157 163 157 168 156', lip, 2.4);
      case 'magabiztos': return S('M150 155 C156 159 164 158 171 151', lip, 2.4);
      case 'huncut': return S('M149 153 C152 158 156 158 160 154 C164 158 168 158 171 153', lip, 2.2);
      case 'meglepett': return P('M155 155 C155 149 165 149 165 155 C165 162 155 162 155 155 Z', '#7a2034', { stroke: lip, sw: 1.6 });
      default: return male ? S('M151 155 C156 159 164 159 169 155', lip, 2.4) : S('M150 153 C155 160 165 160 170 153', lip, 2.4);
    }
  }
  function noseSvg(shape, skin, male) {
    const c = lum(skin) < 0.36 ? light(skin, 0.32) : dark(skin, 0.38);
    if (male) return S('M163 118 C164 126 166 134 166 140 C164 143 160 144 156 142', c, 1.8, { op: 0.75 }) + `<path d="M163 120 C165 128 168 136 167 142 L163 141 C164 134 162 126 163 120 Z" fill="${c}" opacity="0.25"/>` + S('M154 143 C156 145 158 145 159 144', c, 1.4, { op: 0.6 });
    if (shape === 'gomb') return `<ellipse cx="160" cy="141" rx="3.2" ry="2.2" fill="${c}" opacity="0.55"/>`;
    if (shape === 'egyenes') return S('M162 128 C163 134 164 139 163 142 C161 143.5 159 143.5 157.5 142.5', c, 1.8, { op: 0.8 });
    return S('M157.5 140.5 C159 142.5 161 142.5 162.5 140.5', c, 1.8, { op: 0.8 });
  }
  function markSvg(mark, skin, place) {
    // place(cx, cy, svg): forgatáskor minden jel a saját helyén követi az arc görbületét
    const pl = place || ((x, y, g) => g);
    switch (mark) {
      // holdsarló az arccsonton, a szem külső sarka alatt – az arc belsejében, nem a szélén
      case 'holdjel': return pl(132, 146, `<circle cx="131" cy="146" r="8" fill="#7ff3ff" opacity="0.18"/>` + P('M133 139 C126 141 125 151 133 154 C129 150 129 143 133 139 Z', '#7ff3ff', { stroke: '#2a8fb8', sw: 1 }));
      case 'csillagok': return pl(187, 144, '<g transform="translate(-7 6)">' + ['M194 138 l1.6 3.6 3.8.4-2.9 2.6.9 3.8-3.4-2-3.4 2 .9-3.8-2.9-2.6 3.8-.4Z', 'M200 128 l1 2.2 2.4.2-1.8 1.6.6 2.4-2.2-1.2-2.2 1.2.6-2.4-1.8-1.6 2.4-.2Z', 'M188 150 l.8 1.8 2 .2-1.5 1.3.5 2-1.8-1-1.8 1 .5-2-1.5-1.3 2-.2Z']
        .map(d => `<path d="${d}" fill="#ffe2a0" stroke="#c4702a" stroke-width="0.6"/>`).join('') + '</g>');
      case 'csikok': return both('M120 138 L134 140 M121 145 L133 146').map((d, i) => pl(i ? 193 : 127, 142, S(d, '#2a1c4a', 2.6, { op: 0.75 }))).join('');
      case 'szeplok': return [[146, 140], [151, 143], [143, 145], [174, 140], [169, 143], [177, 145], [148, 147], [172, 147]].map(([x, y]) => pl(x, y, `<circle cx="${x}" cy="${y}" r="1.3" fill="${dark(skin, 0.4)}" opacity="0.6"/>`)).join('');
      // forradás az arccsonton, ferdén, öltésnyomokkal (a frufru nem takarja el)
      case 'forradas': return pl(136, 147, S('M126 136 L146 158', '#b45a6a', 2.6, { op: 0.85 }) + S('M128 143 L134 140 M133 149 L139 146 M138 155 L144 152', '#b45a6a', 1.5, { op: 0.7 }));
      case 'harcifestek': // két ujjal húzott festékcsík mindkét arcon és egy függőleges az orrnyergen
        return both('M122 138 C128 137 140 136 148 138 C140 140 130 141 123 142 Z M124 147 C130 146 140 145 147 146 C140 148 131 150 125 151 Z').map((d, i) => pl(i ? 185 : 135, 144, `<path d="${d}" fill="#c2304a" opacity="0.85"/>`)).join('') +
          pl(160, 114, `<path d="M158.5 104 C160 103 161.5 103.5 161.5 105 L161 124 C160.4 126 159.6 126 159 124 Z" fill="#c2304a" opacity="0.8"/>`);
      case 'konnycsepp': return pl(186, 145, P('M186 140 C183 145 183 149 186 150 C189 149 189 145 186 140 Z', '#7fd0ff', { stroke: '#2a6fb8', sw: 1 }));
    }
    return '';
  }

  // ---------- haj ----------
  const HAIR_BACK = {
    rovid: 'M104 124 C98 44 222 44 216 124 C214 142 208 152 200 160 L120 160 C112 152 106 142 106 122 Z',
    vallig: 'M104 118 C98 50 222 50 216 118 C220 160 216 190 206 206 C198 196 192 184 188 172 C176 180 144 180 132 172 C128 184 122 196 114 206 C104 190 100 160 104 118 Z',
    hosszu: 'M102 118 C96 48 224 48 218 118 C222 180 226 242 216 286 C204 274 196 246 192 214 L128 214 C124 246 116 274 104 286 C94 242 98 180 102 118 Z',
    hullamos: 'M102 118 C94 48 226 48 218 118 C228 158 212 180 224 210 C234 240 212 262 222 292 C206 288 194 264 194 232 L126 232 C126 264 114 288 98 292 C108 262 86 240 96 210 C108 180 92 158 102 118 Z',
    copf: 'M106 122 C100 52 220 52 214 122 C214 142 208 152 200 160 L120 160 C112 152 106 142 106 122 Z',
    ketcopf: 'M106 122 C100 52 220 52 214 122 C214 142 208 152 200 160 L120 160 C112 152 106 142 106 122 Z',
    konty: 'M106 122 C100 52 220 52 214 122 C214 142 208 152 200 160 L120 160 C112 152 106 142 106 122 Z'
  };
  // hátulnézetben a haj összefüggően fedi a tarkót (nincs „ablak” a nyaknál), az alja lekerekített
  const HAIR_BACK_REAR = {
    vallig: 'M104 118 C98 50 222 50 216 118 C220 160 216 190 206 206 C190 214 176 208 160 214 C144 208 130 214 114 206 C104 190 100 160 104 118 Z',
    hosszu: 'M102 118 C96 48 224 48 218 118 C222 180 226 242 216 286 C198 296 180 288 160 296 C140 288 122 296 104 286 C94 242 98 180 102 118 Z',
    hullamos: 'M102 118 C94 48 226 48 218 118 C228 158 212 180 224 210 C234 240 212 262 222 292 C202 300 182 290 160 298 C138 290 118 300 98 292 C108 262 86 240 96 210 C108 180 92 158 102 118 Z'
  };
  // hátulnézetben a tüskés, felfésült és irokéz frizura sziluettje (elölről a frufru adja)
  const HAIR_BACK_TOP = {
    tuskes: 'M106 96 L94 40 L122 60 L120 22 L144 46 L160 12 L176 46 L200 22 L198 60 L226 40 L214 96 C190 82 130 82 106 96 Z',
    felfesult: 'M110 98 C108 58 134 30 166 28 C196 28 216 52 210 98 Z',
    irokez: 'M148 150 L146 44 L140 30 L152 34 L150 14 L162 26 L168 8 L174 28 L184 22 L178 44 L174 150 Z'
  };
  const HAIR_EXTRA = {
    copf: ['M198 72 C246 80 256 160 238 222 C234 240 222 256 210 262 C224 232 228 176 206 112 Z'],
    ketcopf: both('M114 104 C80 122 74 196 90 250 C94 264 104 272 112 274 C100 240 104 178 126 134 Z'),
    konty: ['M138 54 C138 28 182 28 182 54 C182 74 138 74 138 54 Z']
  };
  // Elöl a haj tincsekből áll: minden tincs egy hegyes, ívelt „csokor” saját árnyékkal és csillanással.
  function lock(x0, y0, x1, y1, w, bend) {
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len, b = bend || 0;
    const sgn = dy >= 0 ? 1 : -1, c1x = mx + nx * b + sgn * nx * w * 0.42, c1y = my + ny * b + sgn * ny * w * 0.42, c2x = mx + nx * b - sgn * nx * w * 0.42, c2y = my + ny * b - sgn * ny * w * 0.42;
    const f = v => v.toFixed(1);
    // a tő lekerekített (a sapka alá bújik), így nem látszik vízszintes „levágott” él
    return `M${f(x0 - w / 2)} ${f(y0)} Q${f(c1x)} ${f(c1y)} ${f(x1)} ${f(y1)} Q${f(c2x)} ${f(c2y)} ${f(x0 + w / 2)} ${f(y0)} Q${f(x0 - nx * w * 0.5 * sgn)} ${f(y0 - ny * w * 0.5 * sgn)} ${f(x0 - w / 2)} ${f(y0)} Z`;
  }
  const CAP = 'M100 126 C94 58 126 40 160 40 C194 40 226 58 220 126 C216 104 206 88 192 80 C180 74 170 72 160 72 C150 72 140 74 128 80 C114 88 104 104 100 126 Z';
  const CAP_HIGH = 'M102 116 C98 56 128 40 160 40 C192 40 222 56 218 116 C212 96 200 82 186 76 C176 72 168 70 160 70 C152 70 144 72 134 76 C120 82 108 96 102 116 Z';
  const SIDE_L = [110, 96, 107, 172, 18, -6], SIDE_R = [210, 96, 213, 172, 18, 6];
  // Rövid, fejhez simuló frizurák (főleg férfiaknak): a hajvonal a homlokon van, nincs dús „sisak”
  const CAP_SHORT = 'M106 120 C100 60 128 44 160 44 C192 44 220 60 214 120 C208 100 198 88 186 82 C176 78 168 77 160 77 C152 77 144 78 134 82 C122 88 112 100 106 120 Z';
  const CAP_BUZZ = 'M110 116 C106 64 132 50 160 50 C188 50 214 64 210 116 C207 104 202 96 194 91 C186 86 174 84 160 86 C146 84 134 86 126 91 C118 96 113 104 110 116 Z';
  const CAP_TOP = 'M120 98 C118 60 136 46 160 46 C184 46 202 60 200 98 C194 88 186 82 176 80 C170 79 165 78 160 78 C155 78 150 79 144 80 C134 82 126 88 120 98 Z';
  const FRONT = {
    egyenes: { cap: CAP, locks: [[122, 80, 116, 112, 20, 2], [136, 74, 132, 106, 20, 1], [150, 72, 148, 104, 20, 0], [164, 72, 164, 104, 20, 0], [178, 74, 180, 106, 20, -1], [192, 78, 198, 110, 20, -2], [204, 86, 210, 118, 16, -3]], sides: [SIDE_L, SIDE_R] },
    oldal: { cap: CAP, locks: [[200, 80, 214, 122, 16, -4], [190, 74, 170, 104, 22, 6], [178, 72, 146, 106, 24, 8], [164, 72, 126, 108, 24, 8], [150, 74, 113, 114, 22, 6], [136, 80, 107, 126, 18, 4]], sides: [SIDE_L, [210, 98, 214, 150, 14, 4]] },
    tuskes: { cap: CAP, locks: [[124, 72, 98, 32, 22, -6], [140, 62, 128, 20, 24, -4], [160, 58, 160, 12, 26, 0], [180, 62, 194, 20, 24, 4], [196, 72, 224, 32, 22, 6], [128, 78, 118, 110, 20, 4], [146, 74, 140, 106, 20, 2], [164, 74, 164, 104, 20, 0], [182, 76, 190, 108, 20, -3], [198, 82, 208, 114, 18, -4]], sides: [] },
    kozep: { cap: CAP, locks: [[156, 72, 120, 120, 24, -10], [146, 78, 110, 130, 20, -8], [164, 72, 200, 120, 24, 10], [174, 78, 210, 130, 20, 8]], sides: [SIDE_L, SIDE_R] },
    kocos: { cap: CAP, locks: [[150, 58, 136, 34, 16, -6], [170, 58, 188, 36, 16, 6], [160, 54, 162, 30, 14, 2], [124, 78, 106, 112, 20, 8], [138, 72, 128, 110, 22, -6], [152, 70, 158, 106, 20, 6], [166, 70, 150, 104, 18, -4], [178, 72, 192, 108, 22, -8], [194, 78, 216, 106, 20, 6], [206, 88, 224, 114, 14, -6]], sides: [SIDE_L, SIDE_R] },
    hatra: { cap: CAP_HIGH, locks: [[150, 72, 136, 102, 10, 6]], sides: [] },
    aszim: { cap: CAP, locks: [[198, 80, 212, 118, 16, -3], [186, 74, 178, 106, 20, 2], [172, 72, 148, 136, 26, 10], [158, 74, 130, 154, 24, 10], [142, 78, 116, 146, 20, 6]], sides: [SIDE_R] },
    katonai: { cap: CAP_BUZZ, locks: [], sides: [] },
    felnyirt: { under: CAP_BUZZ, cap: CAP_TOP, locks: [[146, 62, 196, 70, 26, -10], [162, 58, 210, 82, 24, -10], [176, 60, 214, 96, 18, -6]], sides: [] },
    felfesult: { cap: CAP_SHORT, locks: [[134, 74, 122, 40, 22, 8], [150, 70, 146, 30, 26, 8], [168, 70, 174, 32, 26, -2], [186, 76, 200, 46, 20, -6]], sides: [] },
    oldalvalasztott: { cap: CAP_SHORT, locks: [[142, 74, 120, 96, 18, 4], [158, 72, 132, 94, 20, 6], [174, 72, 150, 90, 20, 6], [190, 76, 204, 98, 16, -4]], sides: [] },
    irokez: { under: CAP_BUZZ, cap: 'M146 92 C144 66 150 54 160 54 C170 54 176 66 174 92 C168 86 152 86 146 92 Z', locks: [[152, 64, 140, 18, 18, 0], [160, 60, 160, 8, 20, 0], [168, 64, 180, 18, 18, 0]], sides: [] }
  };
  function frontHair(style, male) {
    const F = FRONT[style];
    if (!F) return null;
    // férfiaknál a halántéktincsek rövidek (pajesz), nem keretezik hosszan az arcot
    const sides = male ? F.sides.map(l => l[3] > 130 ? [l[0], l[1], l[2] + (l[2] < 160 ? 1 : -1), 136, l[4] * 0.8, l[5] * 0.6] : l) : F.sides;
    // a lelógó tincsek tövét kicsit feljebb, a sapka belsejébe húzzuk
    const raw = F.locks.map(l => l[3] >= l[1] ? [l[0], l[1] - 7].concat(l.slice(2)) : l);
    return { cap: F.cap, under: F.under, locks: raw.map(l => lock.apply(null, l)), sides: sides.map(l => lock.apply(null, l)), raw: raw };
  }
  // ---------- szarvak, fejdíszek, fülbevalók, szakáll ----------
  const HORNS = {
    kicsi: both('M128 78 C122 66 123 56 130 48 C133 58 138 66 141 72 Z'),
    kos: both('M132 76 C110 50 80 62 88 92 C92 106 110 108 113 96 C106 93 101 84 108 77 C115 71 123 76 127 83 Z'),
    sarlo: both('M128 76 C108 62 100 40 108 18 C114 38 124 52 140 66 Z'),
    agancs: both('M132 74 C124 56 120 40 122 22 M124 44 C114 40 108 32 106 22 M123 34 C130 28 134 20 134 12'),
    demon: both('M134 72 C122 50 102 32 72 26 C96 40 112 58 124 82 Z')
  };
  // A csuklya hátsó része (a fej mögött) és elülső kerete (az arc körül, kivágással).
  // a varázslósüveg karimája alatti tartomány (a karima teteje kb. y=70 a fej koordinátáiban): fölötte nem látszhat haj
  const HAT_BELOW = 'M-100 72 L420 72 L420 600 L-100 600 Z';
  const HOOD_OUT = 'M98 146 C90 84 116 40 160 37 C204 40 230 84 222 146 C220 172 214 190 206 200 C192 206 128 206 114 200 C106 190 100 172 98 146 Z';
  const HOOD_HOLE = 'M114 150 C110 112 128 84 160 82 C192 84 210 112 206 150 C204 172 196 196 186 214 L134 214 C124 196 116 172 114 150 Z';
  function headwearBack(hw, L, id) {
    if (hw === 'csuklya') return shaded(id, HOOD_OUT, dark(L.c1, 0.18));
    return '';
  }
  function headwearFront(hw, L, id, o) {
    o = o || {};
    const m = METAL[L.metal] ? METAL[L.metal][1] : '#e8b94a';
    switch (hw) {
      case 'diadem': return S('M112 98 C140 86 180 86 208 98', m, 4.5) + S('M112 98 C140 86 180 86 208 98', dark(m, 0.5), 1, { op: 0.6 }) + P('M160 80 L166 89 L160 98 L154 89 Z', '#7ff3ff', { stroke: dark(m, 0.4), sw: 1.4 }) + `<circle cx="160" cy="89" r="8" fill="#7ff3ff" opacity="0.25"/>`;
      case 'abroncs': return P('M106 84 C122 66 198 66 214 84 L212 92 C196 76 124 76 108 92 Z', metalFill(id), { stroke: dark(m, 0.5), sw: 1.4 }) + [126, 160, 194].map((x, i) => `<circle cx="${x}" cy="${i === 1 ? 72 : 79}" r="${i === 1 ? 4.5 : 3}" fill="${['#ff6fae', '#7ff3ff', '#ff6fae'][i]}" stroke="${dark(m, 0.4)}" stroke-width="1"/>`).join('');
      case 'csuklya': {
        // árnyék a csuklya pereme alatt az arcon, aztán maga a keret a kivágással, és egy redővonal a perem mentén
        const inner = `<g clip-path="url(#${id}-headclip)"><path d="${HOOD_HOLE}" fill="none" stroke="#140c34" stroke-width="16" opacity="0.28" transform="translate(2 4)"/></g>`;
        return inner + shaded(id, HOOD_OUT + ' ' + HOOD_HOLE, L.c1, { evenodd: true, off: [-7, -5] }) +
          S('M114 150 C110 112 128 84 160 82 C192 84 210 112 206 150', light(L.c1, 0.35), 2.2, { op: 0.7, extra: ' transform="translate(-3 -3) scale(1.02)" transform-origin="160 140"' }) +
          S('M130 56 C142 66 152 74 160 82 M104 112 C106 124 110 136 114 150', dark(L.c1, 0.35), 1.6, { op: 0.6 }) + S('M160 37 C162 50 162 66 160 82', dark(L.c1, 0.3), 1.6, { op: 0.5 });
      }
      case 'suveg': {
        // széles, enyhén hullámos karimájú boszorkány-/varázslósüveg, megtört csúccsal
        const brimBack = `<path d="M78 84 C92 66 228 66 242 84 C230 78 190 72 160 72 C130 72 90 78 78 84 Z" fill="${dark(L.c1, 0.35)}"/>`;
        const cone = 'M120 80 C124 56 134 36 150 20 C160 10 176 4 198 8 C206 9 214 14 222 22 C208 18 196 18 188 24 C180 32 182 52 200 80 Z';
        const brim = 'M72 86 C82 74 120 70 160 70 C200 70 238 74 248 86 C240 98 204 102 160 102 C116 102 80 98 72 86 Z';
        return '<g transform="translate(0 -8)">' + brimBack + shaded(id, cone, L.c1, { off: [-8, -6] }) + S('M138 42 C150 34 164 30 176 30', light(L.c1, 0.35), 2, { op: 0.6 }) +
          shaded(id, 'M120 80 C124 70 126 66 128 62 C150 58 178 58 194 62 C196 68 198 74 200 80 C176 84 144 84 120 80 Z', L.c2, { off: [-3, -3] }) +
          `<rect x="152" y="62" width="16" height="16" rx="2" fill="none" stroke="${m}" stroke-width="3"/>` +
          shaded(id, brim, dark(L.c1, 0.06), { off: [-6, -5] }) + S('M86 88 C110 96 210 96 234 88', light(L.c1, 0.25), 1.6, { op: 0.6 }) +
          starAt(214, 26, 6, '#ffe2a0') + '</g>';
      }
      case 'koszoru': return S('M110 92 C130 70 190 70 210 92', '#3f7a3a', 4) + [[114, 88], [128, 76], [146, 70], [160, 68], [174, 70], [192, 76], [206, 88]].map(([x, y], i) => flower(x, y, ['#ff8ac6', '#ffe2a0', '#cfd8ff', '#ff8ac6', '#ffe2a0', '#cfd8ff', '#ff8ac6'][i])).join('');
      case 'szemkoto': return ''; // az arc rétegében rajzoljuk (eyepatchStraps / eyepatchPatch), hogy a szíj a haj alá bújjon
      case 'sisak': {
        // kupolás sisak: szemívekkel kivágott homlokpánt, orrvédő, arcvédők, szegecsek és lószőrforgó
        const dome = 'M102 122 C96 58 126 34 160 34 C194 34 224 58 218 122 C212 116 206 112 200 110 C192 102 178 98 168 102 L164 108 L156 108 L152 102 C142 98 128 102 120 110 C114 112 108 116 102 122 Z';
        const cheekL = 'M102 116 C108 112 114 110 120 110 C122 128 122 146 118 164 C112 164 106 160 102 154 C100 140 100 128 102 116 Z';
        const nasal = 'M155 100 L165 100 L163.5 136 L160 141 L156.5 136 Z';
        const plume = 'M154 40 C146 16 166 -2 196 0 C216 2 232 14 238 32 C226 24 212 22 200 28 C190 34 178 40 168 46 Z';
        const plumeSvg = shaded(id, plume, L.c1, { off: [-5, -4] }) + S('M160 30 C170 14 192 8 214 12 M164 36 C176 24 196 20 220 22', light(L.c1, 0.3), 1.4, { op: 0.7 });
        if (o.plumeOnly) return plumeSvg;
        return (o.noPlume ? '' : plumeSvg) +
          shaded(id, cheekL, metalFill(id), { base: m, stroke: dark(m, 0.55) }) + shaded(id, mirror(cheekL), metalFill(id), { base: m, stroke: dark(m, 0.55) }) +
          shaded(id, dome, metalFill(id), { base: m, stroke: dark(m, 0.55), off: [-8, -6] }) +
          S('M106 104 C126 92 194 92 214 104', dark(m, 0.45), 1.6, { op: 0.8 }) + S('M160 36 L160 96', dark(m, 0.4), 2.4, { op: 0.6 }) + S('M120 60 C132 46 148 40 158 40', light(m, 0.6), 3, { op: 0.7 }) +
          [[112, 104], [128, 98], [192, 98], [208, 104], [110, 136], [210, 136]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${light(m, 0.4)}" stroke="${dark(m, 0.5)}" stroke-width="0.8"/>`).join('') +
          shaded(id, nasal, metalFill(id), { base: m, stroke: dark(m, 0.55), off: [-2, -2], rim: 1.2 });
      }
    }
    return '';
  }
  // Szemkötő: a bőrfolt pontosan a bal szemen ül, a szíjak a halánték felé és a homlokon át futnak (a frufru alatt).
  function eyepatchGeo(male) {
    const ex = 139, ey = male ? 127 : 125, k = male ? 1 : 1.07;
    return { ex, ey, q: (dx, dy) => `${(ex + dx * k).toFixed(1)} ${(ey + dy * k).toFixed(1)}` };
  }
  function eyepatchStraps(male) {
    const { ey, q } = eyepatchGeo(male), C = '#1b1238';
    const L = `M${q(-15, -7)} C${q(-19, -10)} 121 ${ey - 19} 115 ${ey - 24}`;
    const R = `M${q(14, -11)} C160 ${ey - 25} 184 ${ey - 34} 204 ${ey - 37}`;
    return S(L, C, 3.4) + S(R, C, 3.4) + S(R, '#5a4a88', 1, { op: 0.45, extra: ' transform="translate(0 -1)"' });
  }
  function eyepatchPatch(male) {
    const { ex, ey, q } = eyepatchGeo(male);
    const d = `M${q(-16, -9)} C${q(-8, -15.5)} ${q(8, -15.5)} ${q(16, -10)} C${q(19, 0)} ${q(11, 14)} ${q(0, 15)} C${q(-11, 14)} ${q(-19, 2)} ${q(-16, -9)} Z`;
    return `<path d="${d}" fill="#140c2a" opacity="0.35" transform="translate(1.5 2.5)"/>` + P(d, '#2a2240', { stroke: '#120c26', sw: 1.8 }) +
      `<g transform="translate(${ex} ${ey}) scale(0.78) translate(${-ex} ${-ey})"><path d="${d}" fill="none" stroke="#5a4a88" stroke-width="1.1" stroke-dasharray="2.2 2.2" opacity="0.8"/></g>` +
      S(`M${q(-11, -9)} C${q(-5, -12.5)} ${q(4, -12.5)} ${q(9, -10)}`, '#7a6aa8', 1.6, { op: 0.6 });
  }
  function flower(x, y, c) {
    let s = '';
    for (let i = 0; i < 5; i++) { const a = i * 72 * Math.PI / 180; s += `<circle cx="${(x + Math.cos(a) * 3.6).toFixed(1)}" cy="${(y + Math.sin(a) * 3.6).toFixed(1)}" r="2.8" fill="${c}"/>`; }
    return s + `<circle cx="${x}" cy="${y}" r="2" fill="#f2b84b"/>`;
  }
  function earringSvg(e, L, side) {
    const m = METAL[L.metal] ? METAL[L.metal][1] : '#e8b94a';
    const animal = L.ears === 'roka' || L.ears === 'macska';
    if (animal) return '';
    // a fülcimpa alsó pontja – minden fültípusnál ugyanide esik (lásd EARS)
    const pts = [[113.5, 138.5], [320 - 113.5, 138.5]].filter((p, i) => !side || (side < 0 ? i === 0 : i === 1));
    const stud = (x, y) => `<circle cx="${x}" cy="${y}" r="1.9" fill="${m}" stroke="${dark(m, 0.5)}" stroke-width="0.7"/>`;
    if (e === 'karika') return pts.map(([x, y]) => `<circle cx="${x}" cy="${y + 5.2}" r="5.2" fill="none" stroke="${dark(m, 0.45)}" stroke-width="3.4"/><circle cx="${x}" cy="${y + 5.2}" r="5.2" fill="none" stroke="${m}" stroke-width="2"/><path d="M${x - 4} ${y + 3} C${x - 3} ${y + 1} ${x - 1} ${y} ${x} ${y}" fill="none" stroke="${light(m, 0.6)}" stroke-width="1"/>`).join('');
    if (e === 'kristaly') return pts.map(([x, y]) => stud(x, y) + S(`M${x} ${y + 1} L${x} ${y + 5}`, m, 1.2) +
      `<path d="M${x} ${y + 5} L${x + 3.4} ${y + 10} L${x} ${y + 18} L${x - 3.4} ${y + 10} Z" fill="#9fe6ff" stroke="#2a6fb8" stroke-width="1"/><path d="M${x} ${y + 5} L${x - 1.4} ${y + 10} L${x} ${y + 15}" fill="none" stroke="#fff" stroke-width="0.9" opacity="0.85"/>`).join('');
    return '';
  }
  function beardSvg(b, L, mp) {
    const c = L.hair;
    if (mp) return cylSvg(beardSvg(b, L), mp);
    switch (b) {
      case 'borosta': { let dots = ''; for (let i = 0; i < 46; i++) { const a = Math.PI * (0.08 + 0.84 * ((i * 0.618) % 1)), r = 0.8 + ((i * 0.37) % 1) * 0.2, x = 160 + Math.cos(a) * 33 * r, y = 150 + Math.sin(a) * 26 * r; if (y > 147) dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="0.9"/>`; } return `<path d="M124 146 C130 172 150 178 160 178 C170 178 190 172 196 146 C190 166 176 174 160 174 C144 174 130 166 124 146 Z M146 146 C152 143 168 143 174 146 L172 149 C166 147 154 147 148 149 Z" fill="${dark(c, 0.2)}" opacity="0.5"/><g fill="${dark(c, 0.35)}" opacity="0.7">${dots}</g>`; }
      case 'bajusz': return P('M146 147 C151 142 157 143 160 145.5 C163 143 169 142 174 147 C170 150.5 165 150 160 148.5 C155 150 150 150.5 146 147 Z', c);
      case 'kecske': return P('M146 147 C151 142 157 143 160 145.5 C163 143 169 142 174 147 C170 150.5 165 150 160 148.5 C155 150 150 150.5 146 147 Z', c) + P('M153 162 C152 176 158 186 160 188 C162 186 168 176 167 162 C163 165 157 165 153 162 Z', c);
      case 'teli': {
        // a szakáll a pajeszból indul, követi az állkapcsot, az áll alatt tömörebb; a száj körül szabadon hagyja az arcot
        const d = 'M114 112 C114 140 120 162 132 178 C140 190 150 198 160 200 C170 198 180 190 188 178 C200 162 206 140 206 112 L200 114 C200 134 196 148 188 158 C182 164 176 166 172 160 C168 156 152 156 148 160 C144 166 138 164 132 158 C124 148 120 134 120 114 Z';
        return shaded('bd', d, c, { off: [-5, -4], dark: 0.3 }) + S('M128 156 C132 170 140 182 150 190 M192 156 C188 170 180 182 170 190 M146 170 C150 182 156 192 160 196 M174 170 C170 182 164 192 160 196', dark(c, 0.35), 1.2, { op: 0.55 }) +
          P('M146 147 C151 142 157 143 160 145.5 C163 143 169 142 174 147 C170 150.5 165 150 160 148.5 C155 150 150 150.5 146 147 Z', dark(c, 0.08));
      }
    }
    return '';
  }

  // ---------- test és öltözet ----------
  const BODY_SX = { karcsu: 0.87, atlagos: 1, eros: 1.2 };
  const HEIGHT_S = { alacsony: 0.93, kozepes: 1, magas: 1.06 };
  const TORSO = 'M120 192 C138 182 182 182 200 192 L205 212 C200 238 196 254 196 266 L200 304 C178 312 142 312 120 304 L124 266 C124 254 120 238 115 212 Z';
  const ROBE_M = 'M114 190 C134 180 186 180 206 190 L211 210 C207 238 204 256 205 268 C207 318 209 370 211 404 C184 412 136 412 109 404 C111 370 113 318 115 268 C116 256 113 238 109 210 Z';
  const TORSO_M = 'M114 190 C134 180 186 180 206 190 L211 210 C207 238 203 256 201 268 L203 304 C180 312 140 312 117 304 L119 268 C117 256 113 238 109 210 Z';
  const ROBE = 'M120 192 C138 182 182 182 200 192 L205 212 C200 238 197 254 198 268 C206 318 214 370 220 404 C186 414 134 414 100 404 C106 370 114 318 122 268 C123 254 120 238 115 212 Z';
  const ARM_R = 'M188 188 C206 185 217 196 219 212 L223 250 C224 260 219 266 211 266 C204 266 200 261 200 254 L196 218 C195 206 192 196 188 188 Z';
  const CUFF_R = 'M199 250 C205 257 218 257 223 249 L224 262 C218 270 205 270 200 264 Z';
  const HAND_R = 'M201 268 C198 279 202 292 212 293 C221 293 225 283 223 272 C220 265 205 263 201 268 Z';
  const THUMB_R = 'M206 271 C199 273 196 282 200 287 C203 290 208 286 208 281 Z';
  const ARM_L = mirror(ARM_R), CUFF_L = mirror(CUFF_R), HAND_L = mirror(HAND_R), THUMB_L = mirror(THUMB_R);
  const LEG_L = 'M136 296 L157 296 L154 378 L134 378 Z';
  const LEG_R = mirror(LEG_L);
  const BOOT_L = 'M131 368 C130 392 128 404 127 410 C126 418 134 420 142 420 L154 420 C157 419 157 414 155 408 L155 368 Z';
  const BOOT_R = mirror(BOOT_L);

  function outfitSvg(cls, v, L, id) {
    const c1 = L.c1, c2 = L.c2, m = METAL[L.metal] ? METAL[L.metal][1] : '#cfd6ea', mf = metalFill(id);
    const robeClasses = { magus: 1, gyogyito: 1, idezo: 1 };
    const isRobe = robeClasses[cls] && v === 0;
    let s = '';
    // lábak és csizma (a köntös eltakarja a lábat)
    if (!isRobe) {
      s += shaded(id, LEG_L, dark(c2, 0.15)) + shaded(id, LEG_R, dark(c2, 0.15));
      s += shaded(id, BOOT_L, '#4a2e22') + shaded(id, BOOT_R, '#4a2e22') + S('M132 376 L155 376', light('#4a2e22', 0.25), 3) + S(mirror('M132 376 L155 376'), light('#4a2e22', 0.25), 3);
    } else {
      s += P('M140 404 C140 414 146 420 156 420 L160 420 L160 404 Z', '#3a2840') + P(mirror('M140 404 C140 414 146 420 156 420 L160 420 L160 404 Z'), '#3a2840');
    }
    // törzs
    const torsoD = isRobe ? (L.sex === 'ferfi' ? ROBE_M : ROBE) : (L.sex === 'ferfi' ? TORSO_M : TORSO);
    s += shaded(id, torsoD, c1);
    if (L._back) { // hátulról: az elöl lévő díszek helyett hátvarrás, gallér, öv és a kaszt jellegzetes háta
      if (cls === 'harcos' && v === 0) s += shaded(id, 'M128 196 C146 188 174 188 192 196 L190 250 C176 258 144 258 130 250 Z', mf) + S('M160 194 L160 252', dark(m, 0.4), 1.6, { op: 0.6 });
      if (cls === 'alakvalto') s += P('M112 206 C116 186 136 178 160 178 C184 178 204 186 208 206 C200 220 192 236 186 250 C176 246 168 252 160 246 C152 252 144 246 134 250 C128 236 120 220 112 206 Z', v === 0 ? '#8a6a4a' : '#d9cfb8');
      if (cls === 'vadasz' && v === 1) s += P('M120 192 C138 182 182 182 200 192 L205 212 L210 318 C190 322 130 322 110 318 L115 212 Z', c1);
      s += S('M160 196 L160 ' + (isRobe ? 400 : 300), dark(c1, 0.3), 1.6, { op: 0.5 }) + P('M136 186 C150 194 170 194 184 186 L186 194 C170 202 150 202 134 194 Z', dark(c1, 0.12));
      s += S('M122 264 C146 270 174 270 198 264', cls === 'magus' || cls === 'idezo' ? L.c2 : cls === 'gyogyito' ? m : '#3a2418', 6);
      return s;
    }
    switch (cls) {
      case 'harcos':
        if (v === 0) {
          s += shaded(id, 'M128 196 C146 188 174 188 192 196 L190 246 C176 258 144 258 130 246 Z', mf) + S('M160 194 L160 252', dark(m, 0.4), 1.6, { op: 0.6 }) + S('M136 214 C150 220 170 220 184 214', light(m, 0.4), 2, { op: 0.7 });
          s += shaded(id, 'M128 262 L192 262 L196 300 C180 306 140 306 124 300 Z', mf) + S('M136 270 L136 300 M150 270 L150 304 M170 270 L170 304 M184 270 L184 300', dark(m, 0.45), 1.4, { op: 0.6 });
        } else {
          s += `<path d="${L.sex === 'ferfi' ? TORSO_M : TORSO}" fill="url(#${id}-chain)" opacity="0.75"/>` + shaded(id, 'M140 196 L180 196 L178 310 L160 322 L142 310 Z', c2) + P('M160 228 L170 244 L160 262 L150 244 Z', m, { sw: 1.4 });
        }
        s += S('M124 262 C146 268 174 268 196 262', '#3a2418', 7) + `<rect x="153" y="258" width="14" height="10" rx="2" fill="${m}" stroke="${dark(m, 0.5)}" stroke-width="1.4"/>`;
        break;
      case 'vadasz':
        s += shaded(id, v === 0 ? 'M130 196 C146 190 174 190 190 196 L188 262 C172 270 148 270 132 262 Z' : 'M120 192 C138 182 182 182 200 192 L205 212 L210 318 C190 322 130 322 110 318 L115 212 Z', v === 0 ? '#6a4630' : c1);
        s += S('M128 196 L192 270', '#3a2418', 6) + S('M128 196 L192 270', '#7a5232', 2.6, { op: 0.8 });
        s += P('M136 186 C150 196 170 196 184 186 L188 198 C172 212 148 212 132 198 Z', c2);
        s += S('M124 266 C146 272 174 272 196 266', '#3a2418', 6);
        break;
      case 'magus':
        s += P('M132 186 C146 200 174 200 188 186 L196 178 C186 210 134 210 124 178 Z', dark(c1, 0.15)) + S('M160 198 L160 404', light(c2, 0.2), 4) + S('M160 198 L160 404', m, 1.4);
        s += S('M120 262 C146 270 174 270 200 262', c2, 8) + `<circle cx="160" cy="266" r="6" fill="#7ff3ff" stroke="${m}" stroke-width="2"/>`;
        s += starAt(134, 330, 5, '#ffe2a0') + starAt(186, 360, 4, '#ffe2a0') + starAt(142, 380, 3, '#cfd8ff') + starAt(180, 300, 3, '#cfd8ff');
        if (v === 1) s += P('M118 194 C140 210 180 210 202 194 L206 236 C180 248 140 248 114 236 Z', c2);
        break;
      case 'gyogyito':
        s += shaded(id, 'M146 190 L174 190 L176 404 L144 404 Z', c2) + sunAt(160, 230, 10, m);
        s += P('M126 190 C146 204 174 204 194 190 L198 200 C178 218 142 218 122 200 Z', light(c2, 0.2));
        if (v === 1) s += shaded(id, 'M130 200 C146 192 174 192 190 200 L188 244 C174 254 146 254 132 244 Z', metalFill(id));
        s += S('M120 266 C146 274 174 274 200 266', m, 4);
        break;
      case 'orgyilkos':
        s += S('M126 202 L194 262 M194 202 L126 262', dark(c1, 0.4), 3, { op: 0.8 }) + shaded(id, 'M134 262 L186 262 L190 306 C172 312 148 312 130 306 Z', dark(c1, 0.15));
        s += S('M122 262 C146 268 174 268 198 262', c2, 6) + [140, 152, 168, 180].map(x => `<rect x="${x - 2}" y="256" width="4" height="12" rx="1" fill="${m}"/>`).join('');
        break;
      case 'idezo':
        s += P('M126 190 C146 206 174 206 194 190 L198 200 C178 224 142 224 122 200 Z', c2) + S('M160 206 L160 404', '#7ff3ff', 2, { op: 0.8, extra: ' class="r-glow"' });
        s += ['M140 300 l6 0 l-3 -8 Z', 'M176 330 l6 0 l-3 -8 Z', 'M146 360 l6 0 l-3 -8 Z', 'M172 382 l6 0 l-3 -8 Z'].map(d => `<path d="${d}" fill="none" stroke="#7ff3ff" stroke-width="1.4" class="r-glow"/>`).join('');
        if (v === 1) s += P('M116 210 C130 230 140 300 120 404 L104 404 C110 320 108 250 116 210 Z', light(c1, 0.12)) + P(mirror('M116 210 C130 230 140 300 120 404 L104 404 C110 320 108 250 116 210 Z'), light(c1, 0.12));
        s += S('M120 264 C146 272 174 272 200 264', c2, 6);
        break;
      case 'dalnok':
        s += P('M140 192 L160 260 L180 192 C172 188 148 188 140 192 Z', '#f4efe6') + S('M150 210 L170 210 M152 224 L168 224', c2, 2);
        s += S('M124 196 L196 268', c2, 8) + S('M124 196 L196 268', light(c2, 0.3), 2);
        if (v === 1) s += P('M118 192 L124 316 L112 316 C110 270 112 230 118 192 Z', dark(c1, 0.2)) + P(mirror('M118 192 L124 316 L112 316 C110 270 112 230 118 192 Z'), dark(c1, 0.2));
        s += S('M122 266 C146 272 174 272 198 266', '#3a2418', 6) + `<circle cx="160" cy="268" r="5" fill="${m}"/>`;
        break;
      case 'alakvalto':
        s += P('M112 206 C116 186 136 178 160 178 C184 178 204 186 208 206 C200 202 196 214 186 208 C182 218 172 214 166 210 C162 220 158 220 154 210 C148 214 138 218 134 208 C124 214 120 202 112 206 Z', v === 0 ? '#8a6a4a' : '#d9cfb8');
        s += [[132, 230], [146, 236], [160, 238], [174, 236], [188, 230]].map(([x, y]) => `<path d="M${x} ${y} C${x - 3} ${y + 6} ${x} ${y + 10} ${x + 2} ${y + 12}" fill="none" stroke="#efe4cc" stroke-width="3" stroke-linecap="round"/>`).join('');
        s += S('M122 266 C146 272 174 272 198 266', '#3a2418', 6) + leafAt(136, 280, '#5fd39a') + leafAt(184, 284, '#5fd39a');
        break;
    }
    return s;
  }
  function starAt(x, y, r, c) {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; d += (i ? 'L' : 'M') + (x + Math.cos(a) * rr).toFixed(1) + ' ' + (y + Math.sin(a) * rr).toFixed(1) + ' '; }
    return `<path d="${d}Z" fill="${c}"/>`;
  }
  function sunAt(x, y, r, c) {
    let s = `<circle cx="${x}" cy="${y}" r="${r * 0.55}" fill="${c}"/>`;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s += `<line x1="${(x + Math.cos(a) * r * 0.75).toFixed(1)}" y1="${(y + Math.sin(a) * r * 0.75).toFixed(1)}" x2="${(x + Math.cos(a) * r * 1.2).toFixed(1)}" y2="${(y + Math.sin(a) * r * 1.2).toFixed(1)}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`; }
    return s;
  }
  function leafAt(x, y, c) { return `<path d="M${x} ${y} C${x - 6} ${y - 6} ${x - 2} ${y - 14} ${x + 6} ${y - 14} C${x + 8} ${y - 6} ${x + 4} ${y} ${x} ${y} Z" fill="${c}" stroke="${line(c)}" stroke-width="1.2"/>`; }

  // ---------- fegyverek ----------
  // A jobb kéz ökle a (213,279) pont körül zár; minden markolat függőlegesen ezen fut át, így az
  // ököl (amely a fegyver UTÁN rajzolódik) valóban rámarkol. A tárgyakat GRIP körül forgatjuk.
  const GRIP = [213, 279];
  function openBookSvg(cover, accent, m, id, rune) {
    // Nyitott varázskönyv, amely a kéz fölött lebeg: lassan fel-le úszik, egy lap időnként átfordul,
    // a lapokról fény és szikrák szállnak fel, a kézből halvány varázsfonal fut fel hozzá.
    const pageC = '#f3ead2', pageD = '#d9c9a2', ink = dark(cover, 0.35);
    const coverD = 'M0 15 C-14 8 -29 7 -44 11 L-42 -8 C-29 -12 -12 -10 0 -2 C12 -10 29 -12 42 -8 L44 11 C29 7 14 8 0 15 Z';
    const leftP = 'M0 -4 C-11 -13 -26 -15 -38 -11 L-37 5 C-25 1 -11 3 0 9 Z';
    const rightP = 'M0 -4 C11 -13 26 -15 38 -11 L37 5 C25 1 11 3 0 9 Z';
    const thickL = 'M0 9 C-11 3 -25 1 -37 5 L-40 9 C-27 5 -12 7 0 13 Z', thickR = 'M0 9 C11 3 25 1 37 5 L40 9 C27 5 12 7 0 13 Z';
    // A lapok íveltek (a gerincnél lejjebb hajlanak), ezért a szöveg sorai és az embléma a lap
    // felső és alsó éle között, azok ívét követve futnak, és a lap alakjára vannak vágva.
    const topL = [[0, -4], [-11, -13], [-26, -15], [-38, -11]], botL = [[0, 9], [-11, 3], [-25, 1], [-37, 5]];
    const onPage = (side, u, v) => { // u: 0 = gerinc … 1 = külső szél; v: 0 = felső él … 1 = alsó él
      const a = bez(topL[0], topL[1], topL[2], topL[3], u), b = bez(botL[0], botL[1], botL[2], botL[3], u);
      return [-side * (a[0] + (b[0] - a[0]) * v), a[1] + (b[1] - a[1]) * v]; // a minták a bal lapra vannak megadva
    };
    const row = (side, v, u0, u1) => { let d = ''; for (let k = 0; k <= 10; k++) { const q = onPage(side, u0 + (u1 - u0) * k / 10, v); d += (k ? 'L' : 'M') + q[0].toFixed(2) + ' ' + q[1].toFixed(2) + ' '; } return d; };
    let txt = '';
    [0.2, 0.36, 0.52, 0.68, 0.84].forEach((v, k) => { txt += row(-1, v, 0.14, k === 4 ? 0.6 : 0.86); });
    let txtR = row(1, 0.78, 0.18, 0.84) + row(1, 0.9, 0.18, 0.62);
    const cS = onPage(1, 0.52, 0.4), cy = cS[1];
    // az embléma kicsit lapítva (perspektíva), a lap közepén
    const em = rune ? `<path d="M0 -5.5 L4.5 0 L0 5.5 L-4.5 0 Z M0 -3 L0 3" fill="none" stroke="${accent}" stroke-width="1.4"/>`
      : `<circle cx="0" cy="0" r="5.4" fill="none" stroke="${dark(accent, 0.3)}" stroke-width="1"/>` + starAt(0, 0, 3.8, dark(accent, 0.15));
    const sigil = `<g transform="translate(${cS[0].toFixed(2)} ${cy.toFixed(2)}) rotate(-8) scale(1 0.78)">${em}</g>` +
      `<path d="${txtR}" fill="none" stroke="${ink}" stroke-width="0.7" stroke-dasharray="4 1.5 2.5 1.5" opacity="0.55"/>`;
    const clipL = `${id}-pl`, clipR = `${id}-pr`;
    // varázsfonal a kézből a könyvig + felszálló szikrák
    let s = `<path class="r-glow" d="M214 266 C222 250 240 252 244 234 M210 268 C206 250 228 242 234 230" fill="none" stroke="${accent}" stroke-width="2.6" stroke-dasharray="0.1 7" stroke-linecap="round" opacity="0.7"/>`;
    s += `<g class="r-book"><g transform="translate(252 216) rotate(-6) scale(1.3)">`;
    s += `<ellipse class="r-glow" cx="0" cy="-10" rx="44" ry="24" fill="${accent}" opacity="0.32" filter="url(#${id}-blur6)"/>`;
    s += shaded(id, coverD, cover, { off: [-3, -3], rim: 1.4, sw: 1.8 });
    s += P(thickL, pageD, { sw: 1 }) + P(thickR, pageD, { sw: 1 }) + S('M-6 10 L-34 7 M6 10 L34 7', dark(pageD, 0.2), 0.7);
    s += P(leftP, pageC, { stroke: dark(pageD, 0.3), sw: 1.2 }) + P(rightP, pageC, { stroke: dark(pageD, 0.3), sw: 1.2 });
    s += `<clipPath id="${clipL}"><path d="${leftP}"/></clipPath><clipPath id="${clipR}"><path d="${rightP}"/></clipPath>`;
    s += `<path d="M0 -4 L0 9" stroke="${dark(pageD, 0.35)}" stroke-width="1.4"/><g clip-path="url(#${clipL})"><path d="${txt}" fill="none" stroke="${ink}" stroke-width="0.7" stroke-dasharray="5 1.5 3 1.5 6 1.5" opacity="0.6"/></g><g clip-path="url(#${clipR})">${sigil}</g>`;
    // az átforduló lap ugyanazt mutatja, mint az alatta lévő, így nyugalomban nem takar el semmit
    s += `<g class="r-page">${P(rightP, pageC, { stroke: dark(pageD, 0.3), sw: 1.2 })}<g clip-path="url(#${clipR})">${sigil}</g></g>`;
    s += [[-30, -14], [-12, -18], [8, -20], [26, -16]].map(([x, y], k) => `<circle class="r-p" style="animation-delay:-${(k * 0.8).toFixed(1)}s;animation-duration:2.6s" cx="${x}" cy="${y}" r="${1.6 + (k % 2)}" fill="${accent}"/>`).join('');
    s += rune ? ['M-22 -24 l3 -6 l3 6 Z', 'M10 -30 l3 -6 l3 6 Z'].map(d => `<path class="r-float" d="${d}" fill="none" stroke="${accent}" stroke-width="1.4"/>`).join('')
      : `<g class="r-float">${starAt(-18, -28, 3.4, accent)}${starAt(14, -34, 2.6, '#cfd8ff')}</g>`;
    s += `</g></g>`;
    return s;
  }
  function bookSvg(cover, accent, m, id, rune) {
    // Vaskos, csatos varázskönyv, amelyet a hős a FELSŐ ÉLÉNÉL fog: az ököl a borító tetejére zár
    // (az ujjak elöl, a hüvelykujj a borítón), a könyv a kézből lóg lefelé, mint egy aktatáska.
    // Bal oldalt a gerinc, jobbra és alul a lapok éle látszik, alul könyvjelző-szalag lóg ki.
    const front = 'M193 272 L238 270 C241 270 243 272 243 275 L244 334 C244 337 242 339 239 339 L195 341 C192 341 190 339 190 336 L189 276 C189 273 190 272 193 272 Z';
    const pages = 'M240 273 L247 276 L248 336 L246 342 L196 344 L193 341 L239 339 C242 339 244 337 244 334 Z';
    const spine = 'M189 276 L183 280 L184 340 L190 343 L190 336 Z';
    let s = S('M226 340 L227 360 M226 360 l-3 5 M227 360 l3 5', '#c2304a', 2.6);
    s += shaded(id, pages, '#efe4cc', { off: [-1, -1], rim: 1, sw: 1.4 }) + S('M244 280 L245 334 M241 341 L199 342.6', '#c9b48a', 0.8);
    s += shaded(id, spine, dark(cover, 0.35), { rim: 1, sw: 1.4 }) + S('M184 292 L190 291 M184 324 L190 323', dark(cover, 0.6), 1.4);
    s += shaded(id, front, cover, { off: [-6, -5], sw: 2 });
    s += `<path d="M196 278 L236 276 L237 333 L197 335 Z" fill="none" stroke="${m}" stroke-width="1.4" opacity="0.85"/>`;
    s += [[193, 275, 1, 1], [239, 273, -1, 1], [194, 337, 1, -1], [240, 335, -1, -1]].map(([x, y, dx, dy]) => `<path d="M${x} ${y} L${x + dx * 10} ${y} L${x} ${y + dy * 10} Z" fill="${m}" stroke="${dark(m, 0.5)}" stroke-width="0.8"/>`).join('');
    // csat: szíj a jobb élen, fém csattal
    s += `<path d="M234 300 L250 299 L250 309 L234 310 Z" fill="${dark(cover, 0.45)}" stroke="${line(cover)}" stroke-width="1"/><rect x="238" y="298" width="9" height="13" rx="2" fill="${m}" stroke="${dark(m, 0.5)}" stroke-width="1"/>`;
    // embléma a borító közepén (a kéz alatt is jól látszik)
    s += rune ? `<circle cx="215" cy="314" r="12" fill="${dark(cover, 0.3)}" stroke="${m}" stroke-width="1.4"/><path class="r-glow" d="M215 304 L223 314 L215 324 L207 314 Z M215 308 L215 320" fill="none" stroke="${accent}" stroke-width="2"/>`
      : `<circle cx="215" cy="314" r="12" fill="${dark(cover, 0.3)}" stroke="${m}" stroke-width="1.6"/>` + starAt(215, 314, 8, accent) + `<circle class="r-glow" cx="215" cy="314" r="15" fill="${accent}" opacity="0.18"/>`;
    return s;
  }
  // Tőr fordított fogással (ahogy az orgyilkosok tartják): a markolat az ökölben (y 266–294), a gomb az ököl fölött kandikál ki,
  // a keresztvas az ököl alatt, a penge lefelé és kicsit kifelé áll – így nem „nő ki” az alkarból, és jól látszik, hogy fogja.
  function daggerSvg(blade, len, curve, guard, grip, m, id) {
    const bx = 213, y0 = 298, tip = y0 + len, base = blade.startsWith('url') ? m : blade;
    const bladeD = curve
      // karmos, befelé görbülő penge (karambit-szerű)
      ? `M${bx - 5} ${y0} C${bx - 6} ${y0 + len * 0.45} ${bx - 2} ${tip - 16} ${bx + 14} ${tip} C${bx + 4} ${tip - 6} ${bx + 4} ${y0 + len * 0.5} ${bx + 5} ${y0} Z`
      : `M${bx - 5} ${y0} L${bx - 4.5} ${tip - 12} L${bx} ${tip} L${bx + 4.5} ${tip - 12} L${bx + 5} ${y0} Z`;
    return P(`M${bx - 3.5} 262 L${bx + 3.5} 262 L${bx + 3.5} 298 L${bx - 3.5} 298 Z`, grip) +
      `<circle cx="${bx}" cy="262" r="4" fill="${guard}" stroke="${line(guard)}" stroke-width="1.4"/>` +
      shaded(id, bladeD, blade, { base: base, off: [-2, -2], rim: 1.2 }) +
      (curve ? S(`M${bx - 2} ${y0 + 4} C${bx - 2} ${y0 + len * 0.5} ${bx + 2} ${tip - 14} ${bx + 10} ${tip - 4}`, light(base, 0.5), 1, { op: 0.7 }) : S(`M${bx} ${y0 + 3} L${bx} ${tip - 14}`, light(base, 0.5), 1.1, { op: 0.8 })) +
      P(`M${bx - 11} ${y0 - 3} C${bx - 6} ${y0 - 1} ${bx + 6} ${y0 - 1} ${bx + 11} ${y0 - 3} L${bx + 11} ${y0 + 3} C${bx + 6} ${y0 + 5} ${bx - 6} ${y0 + 5} ${bx - 11} ${y0 + 3} Z`, guard, { sw: 1.4 });
  }
  function weaponSvg(cls, v, L, id) {
    const m = METAL[L.metal] ? METAL[L.metal][1] : '#cfd6ea', mf = metalFill(id), wood = '#8a5a32';
    const glow = (x, y, r, c) => `<circle class="r-glow" cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="0.35" filter="url(#${id}-blur6)"/>`;
    const shaft = (y0, y1, c, w) => shaded(id, `M${213 - (w || 3.5)} ${y1} L${213 - (w || 3.5) + 0.6} ${y0} L${213 + (w || 3.5) - 0.6} ${y0} L${213 + (w || 3.5)} ${y1} Z`, c, { off: [-2, -1], rim: 1.2 });
    switch (cls + v) {
      case 'harcos0': return shaded(id, 'M207 264 L207 128 L213 112 L219 128 L219 264 Z', mf, { base: m }) + S('M213 122 L213 262', light(m, 0.55), 1.6) +
        P('M196 260 L230 260 C232 260 233 262 232 264 L230 268 L196 268 L194 264 C193 262 194 260 196 260 Z', '#c4702a') + P('M209 268 L217 268 L217 296 L209 296 Z', '#4a2e22') + `<circle cx="213" cy="300" r="5" fill="#c4702a" stroke="${line('#c4702a')}" stroke-width="1.4"/>`;
      case 'harcos1': return shaded(id, 'M204 264 C204 210 206 160 213 104 C220 160 224 210 224 264 Z', mf, { base: m }) + S('M213 116 L213 262', light(m, 0.55), 1.6) +
        P('M190 262 C198 255 228 255 236 262 L232 270 L194 270 Z', '#5c6488') + P('M208 270 L218 270 L218 298 L208 298 Z', '#4a2e22') + `<circle cx="213" cy="302" r="5.5" fill="#5c6488" stroke="${line('#5c6488')}" stroke-width="1.4"/>`;
      case 'harcos2': return shaft(176, 336, wood, 3.6) + shaded(id, 'M216 180 C248 166 266 194 258 226 C248 212 232 206 216 210 Z', mf, { base: m }) + shaded(id, 'M210 180 C190 172 180 190 184 206 C192 198 200 198 210 204 Z', mf, { base: m }) +
        S('M220 186 C240 182 252 196 254 212', light(m, 0.6), 1.4, { op: 0.8 }) + P('M209 172 L217 172 L217 214 L209 214 Z', dark(m, 0.2));
      case 'vadasz0': case 'vadasz1': { // a lövéshez a célpont felé nyújtott kézbe kerülő íj; a húr külön elem, hogy húzáskor V alakban a kézhez feszülhessen
        const tip = v ? [[86, 192], [86, 366]] : [[82, 148], [82, 412]];
        return `<g class="r-bowR" transform="translate(106 0)">${leftGripSvg(cls, v, L, id).replace(/<path d="M8[26] (148|192) L8[26] (412|366)"/, m => m.replace('<path', '<path class="r-bstr"'))}<circle class="r-tipA" cx="${tip[0][0]}" cy="${tip[0][1]}" r="0.1" fill="none"/><circle class="r-tipB" cx="${tip[1][0]}" cy="${tip[1][1]}" r="0.1" fill="none"/></g>`;
      } // alapból a bal kézben van; lövéskor átkerül a célpont felé nyújtott jobb kézbe
      case 'vadasz2': // számszeríj: a tus végig az ököl alatt, előre (jobbra) mutat
        return S('M246 250 C256 262 256 296 246 308', '#3a2418', 6) + S('M246 250 C256 262 256 296 246 308', '#8a5a32', 3) + S('M246 251 L226 279 L246 307', '#efe4cc', 1.1) +
          shaded(id, 'M186 274 L258 270 C261 270 262 272 262 274 L262 282 C262 284 261 285 258 285 L198 290 C190 296 184 296 182 290 C181 284 182 278 186 274 Z', wood, { off: [-3, -2] }) +
          S('M222 272 L270 269', '#5a3a20', 2.4) + P('M268 265 L280 269 L268 273 Z', mf, { base: m, sw: 1 }) + P('M222 268 L228 271 L222 274 Z', '#e9ecff', { sw: 0.8 }) + P('M240 284 L248 284 L246 292 L238 292 Z', m, { sw: 1 });
      case 'magus0': return shaft(150, 336, wood, 3.6) + glow(213, 132, 26, '#7ff3ff') + S('M204 152 C200 136 206 120 216 114 M222 152 C228 138 224 122 212 114', m, 2.6) + `<circle cx="213" cy="132" r="12" fill="#bff7ff" stroke="#2a8fb8" stroke-width="2"/><circle cx="209" cy="128" r="4" fill="#fff"/>` + P('M207 150 L219 150 L218 158 L208 158 Z', m, { sw: 1.2 });
      case 'magus1': return shaft(148, 336, '#3a2840', 3.6) + glow(213, 122, 24, '#cfd8ff') + P('M192 104 C193 130 204 146 213 146 C222 146 233 130 234 104 C228 122 221 132 213 132 C205 132 198 122 192 104 Z', '#e9ecff', { stroke: '#7f8cff', sw: 1.6 }) + P('M207 146 L219 146 L218 154 L208 154 Z', m, { sw: 1.2 });
      case 'magus2': return openBookSvg('#5a3e9e', '#ffe2a0', m, id);
      case 'gyogyito0': return shaft(160, 336, '#efe4cc', 3.4) + glow(213, 144, 28, '#ffe2a0') + `<circle cx="213" cy="144" r="14" fill="none" stroke="${m}" stroke-width="4.5"/>` + sunAt(213, 144, 7.5, '#ffe2a0');
      case 'gyogyito1': // pásztorbot kampóval, a kampóról lámpás lóg
        return shaft(168, 336, wood, 3.4) + S('M213 172 C211 146 236 140 240 158 L240 164', wood, 6.5) + S('M213 172 C211 146 236 140 240 158 L240 164', light(wood, 0.25), 2) +
          S('M240 164 L240 172', m, 1.6) + lanternSvg(240, 172, '#ffe2a0', '#fff4cf', m, id);
      case 'gyogyito2': return shaft(204, 330, wood, 3.6) + P('M209 300 L217 300 L217 326 L209 326 Z', '#4a2e22', { sw: 1.2 }) +
        [[-16, 0], [16, 0], [0, -16]].map(([dx, dy]) => P(`M${213 + dx * 0.4} ${192 + dy * 0.4 - 6} L${213 + dx} ${192 + dy} L${213 + dx * 0.4} ${192 + dy * 0.4 + 6} Z`, mf, { stroke: dark(m, 0.55), sw: 1.2 })).join('') +
        shaded(id, 'M199 192 C199 174 227 174 227 192 C227 210 199 210 199 192 Z', mf, { base: m, off: [-4, -3] }) + starAt(213, 192, 6, '#ffe2a0') + P('M207 206 L219 206 L218 212 L208 212 Z', m, { sw: 1.2 });
      case 'orgyilkos0': return daggerSvg(mf, 44, false, '#5a3e9e', '#2a1c3a', m, id);
      case 'orgyilkos1': return daggerSvg(mf, 46, true, '#3a2418', '#2a1c3a', m, id);
      case 'orgyilkos2': return glow(214, 330, 16, '#5fd38a') + daggerSvg('#5fd38a', 54, false, '#2a6f4a', '#1b2a20', m, id) + `<circle class="r-p" cx="216" cy="338" r="2.2" fill="#8affb0"/>`;
      case 'idezo0': return lanternSvg(213, 296, '#7ff3ff', '#bff7ff', m, id, true);
      case 'idezo1': return openBookSvg('#1f6f8a', '#7ff3ff', m, id, true);
      case 'idezo2': return shaft(180, 330, '#efe4cc', 3) + S('M206 300 L220 300 M206 306 L220 306', '#8a7a5a', 1.4) + P('M200 168 C200 148 226 148 226 168 C226 182 218 188 213 188 C208 188 200 182 200 168 Z', '#efe4cc', { stroke: '#8a7a5a' }) +
        P('M206 182 L220 182 L218 190 L208 190 Z', '#efe4cc', { stroke: '#8a7a5a', sw: 1.2 }) + `<circle cx="207" cy="168" r="3.4" fill="#1b1238"/><circle cx="219" cy="168" r="3.4" fill="#1b1238"/><circle class="r-glow" cx="207" cy="168" r="2" fill="#7ff3ff"/><circle class="r-glow" cx="219" cy="168" r="2" fill="#7ff3ff"/>`;
      case 'dalnok0': { // LANT: körte alakú test, rövid nyak hátrahajló kulcsszekrénnyel; az ököl a nyakat fogja
        const g = 'translate(188.6 333.8) rotate(24)';
        const body = 'M0 -38 C19 -38 31 -15 31 8 C31 31 17 43 0 43 C-17 43 -31 31 -31 8 C-31 -15 -19 -38 0 -38 Z';
        let t = shaded(id, body, L._back ? '#8a5424' : '#b0702e', { off: [-6, -5], sw: 2 });
        if (L._back) { // hátulról a lant domború, bordázott hátlapja és a sima nyak látszik
          t += S('M-20 -26 C-26 0 -24 26 -12 40 M-8 -36 C-12 -6 -12 24 -4 43 M8 -36 C12 -6 12 24 4 43 M20 -26 C26 0 24 26 12 40', dark('#8a5424', 0.35), 1.6, { op: 0.8 }) + S('M-18 -22 C-12 -32 -4 -36 4 -36', light('#8a5424', 0.4), 2.4, { op: 0.5 });
          t += shaded(id, 'M-5 -35 L-4.2 -112 L4.2 -112 L5 -35 Z', '#4a2e18', { off: [-2, -2], rim: 1.2, sw: 1.6 }) + shaded(id, 'M-4.2 -112 L-11 -134 L-3 -136 L4.2 -112 Z', '#3a2410', { rim: 1, sw: 1.4 });
          return `<g transform="${g}">${t}</g>`;
        }
        t += S('M-22 -16 C-16 -28 -6 -34 4 -34', light('#b0702e', 0.45), 2.4, { op: 0.6 }) + S('M-24 20 C-14 34 14 34 24 20', dark('#b0702e', 0.35), 1.4, { op: 0.6 });
        t += `<circle cx="0" cy="-4" r="9" fill="#2a1408"/><circle cx="0" cy="-4" r="12" fill="none" stroke="#e8c27a" stroke-width="1.2"/><circle cx="0" cy="-4" r="9" fill="none" stroke="#e8c27a" stroke-width="0.6" stroke-dasharray="1.5 1.5"/>`;
        t += P('M-11 25 L11 25 L10 30 L-10 30 Z', '#3a2410', { sw: 1 });
        t += shaded(id, 'M-5 -35 L-4.2 -112 L4.2 -112 L5 -35 Z', '#5a3a20', { off: [-2, -2], rim: 1.2, sw: 1.6 });
        t += S('M-4.4 -50 L4.4 -50 M-4.3 -64 L4.3 -64 M-4.3 -78 L4.3 -78 M-4.2 -92 L4.2 -92', '#e8c27a', 0.9, { op: 0.8 });
        t += shaded(id, 'M-4.2 -112 L-11 -134 L-3 -136 L4.2 -112 Z', '#3a2410', { rim: 1, sw: 1.4 }) + [[-6, -118], [-8, -126], [-2, -122], [-4, -130]].map(([x, y], k) => `<circle cx="${x + (k % 2 ? -3 : 3)}" cy="${y}" r="2" fill="#e8c27a" stroke="#8a5a1a" stroke-width="0.6"/>`).join('');
        t += S('M-3 27 L-2.6 -112 M-1 27 L-0.9 -112 M1 27 L0.9 -112 M3 27 L2.6 -112', '#fff4d0', 0.6, { op: 0.9 });
        return `<g transform="${g}">${t}</g>`;
      }
      case 'dalnok1': { // HÁRFA: az ököl az előoszlopot fogja; fent S-ívű nyak, hátul ferde hangszekrény, köztük húrok
        const neck = [[214, 214], [234, 196], [252, 240], [274, 226]];
        const sbY = x => 226 + (274 - x) / (274 - 216) * (330 - 226);
        let strings = '';
        for (let k = 1; k <= 8; k++) { const q = bez(neck[0], neck[1], neck[2], neck[3], 0.06 + k * 0.105); if (q[0] < 220 || q[0] > 270) continue; strings += S(`M${q[0].toFixed(1)} ${(q[1] + 3).toFixed(1)} L${q[0].toFixed(1)} ${(sbY(q[0]) - 3).toFixed(1)}`, k % 3 === 0 ? '#ff9a7a' : '#efe4cc', 0.9); }
        return shaded(id, 'M268 224 L280 230 L222 334 L210 326 Z', '#b0702e', { off: [-3, -2], rim: 1.2 }) + S('M262 236 L222 314', dark('#b0702e', 0.4), 1.2, { op: 0.6 }) +
          strings + S('M214 214 C234 196 252 240 274 226', line('#5a3a20'), 10) + S('M214 214 C234 196 252 240 274 226', '#5a3a20', 7) + S('M216 212 C234 198 250 236 272 224', light('#8a5a32', 0.2), 2, { op: 0.7 }) +
          [0.2, 0.35, 0.5, 0.65, 0.8].map(tt => { const q = bez(neck[0], neck[1], neck[2], neck[3], tt); return `<circle cx="${q[0].toFixed(1)}" cy="${(q[1] - 2).toFixed(1)}" r="1.4" fill="${m}"/>`; }).join('') +
          shaded(id, 'M207 332 C203 292 206 250 209 214 L219 214 C216 250 214 292 217 332 Z', '#8a5a32', { off: [-2, -2], rim: 1.2 }) + `<circle cx="214" cy="212" r="6" fill="${m}" stroke="${dark(m, 0.5)}" stroke-width="1"/>` + starAt(214, 212, 3.4, light(m, 0.5));
      }
      case 'dalnok2': { // FURULYA: függőlegesen fogja, fent csőrös fúvóka ablakkal, az ököl fölött a hangnyílások, alul tölcsér
        const g = 'translate(214.7 271.2) rotate(12)';
        let t = shaded(id, 'M-4.6 -50 L-5 40 C-5 46 -8 52 -9 56 L9 56 C8 52 5 46 5 40 L4.6 -50 Z', '#c89a5a', { off: [-2, -2], rim: 1.2, sw: 1.6 });
        t += shaded(id, 'M-4.6 -50 C-4 -58 -3 -64 -1.5 -68 L1.5 -68 C3 -64 4 -58 4.6 -50 Z', '#a8763a', { rim: 1, sw: 1.4 });
        t += `<rect x="-2.6" y="-48" width="5.2" height="3.4" rx="0.8" fill="#2a1a10"/>`;
        t += S('M-5 -36 L5 -36 M-5 30 L5 30 M-8 52 L8 52', '#7a4a20', 2);
        t += [-28, -20, -12, -4].map(y => `<circle cx="0" cy="${y}" r="1.9" fill="#2a1a10"/>`).join('') + S('M-2.6 -60 L-3 34', light('#c89a5a', 0.4), 1.2, { op: 0.6 });
        return `<g transform="${g}">${t}</g>`;
      }
      case 'alakvalto0': return [0, 1, 2].map(i => { const y = 270 + i * 7; return shaded(id, `M220 ${y - 2.5} C234 ${y - 8} 248 ${y - 2} 254 ${y + 12} C246 ${y + 6} 234 ${y + 2} 221 ${y + 3} Z`, '#efe4cc', { stroke: '#8a7a5a', off: [-2, -2], rim: 1 }); }).join('');
      case 'alakvalto1': return S('M214 336 C210 270 222 210 214 150', '#5a3a20', 8) + S('M214 336 C210 270 222 210 214 150', wood, 5) + leafAt(214, 156, '#5fd39a') + leafAt(222, 176, '#5fd39a') + leafAt(206, 192, '#2f8a5c') + glow(214, 150, 16, '#a7ffcf');
      case 'alakvalto2': return daggerSvg('#efe4cc', 44, true, '#7a5232', '#5a3a20', m, id) + S('M209 270 L217 274 M209 278 L217 282 M209 286 L217 290', '#3a2418', 1.2);
    }
    return '';
  }
  function lanternSvg(x, y, glowC, coreC, m, id, handle) {
    // y: a lámpás felső akasztójának pontja
    const h = handle ? `<path d="M${x - 6} ${y - 6} C${x - 6} ${y - 16} ${x + 6} ${y - 16} ${x + 6} ${y - 6}" fill="none" stroke="${m}" stroke-width="2.4"/>` + S(`M${x} ${y - 6} L${x} ${y + 4}`, m, 1.6) : '';
    const t = handle ? y + 4 : y;
    return h + `<circle class="r-glow" cx="${x}" cy="${t + 22}" r="20" fill="${glowC}" opacity="0.4" filter="url(#${id}-blur6)"/>` +
      P(`M${x - 9} ${t + 2} L${x + 9} ${t + 2} L${x + 12} ${t + 9} L${x - 12} ${t + 9} Z`, m, { sw: 1.4 }) + `<circle cx="${x}" cy="${t}" r="2.6" fill="none" stroke="${m}" stroke-width="1.6"/>` +
      P(`M${x - 11} ${t + 9} L${x + 11} ${t + 9} L${x + 9} ${t + 34} L${x - 9} ${t + 34} Z`, 'rgba(220,240,255,0.25)', { stroke: dark(m, 0.4), sw: 1.6 }) +
      `<ellipse class="r-glow" cx="${x}" cy="${t + 23}" rx="5.5" ry="8" fill="${coreC}"/><ellipse cx="${x}" cy="${t + 25}" rx="2.5" ry="4" fill="#fff"/>` +
      S(`M${x} ${t + 9} L${x} ${t + 34} M${x - 10} ${t + 21} L${x + 10} ${t + 21}`, dark(m, 0.3), 1.2, { op: 0.8 }) +
      P(`M${x - 11} ${t + 34} L${x + 11} ${t + 34} L${x + 8} ${t + 40} L${x - 8} ${t + 40} Z`, m, { sw: 1.4 });
  }
  const WEAPON_ROT = { harcos0: 14, harcos1: 14, harcos2: 18, magus0: 8, magus1: 8, gyogyito0: 8, gyogyito1: 6, gyogyito2: 12, idezo2: 8, alakvalto1: 8, orgyilkos0: -16, orgyilkos1: -12, orgyilkos2: -14, alakvalto2: -12, magus2: 0, idezo1: 0, dalnok0: 0, dalnok1: 0, dalnok2: 0 };
  const REV_GRIP = { orgyilkos0: 1, orgyilkos1: 1, orgyilkos2: 1, alakvalto2: 1 }; // fordított fogású pengék
  // A bal kéz (a néző bal oldalán) a jobb tükörképe: GRIP tükrözve (107,279).
  function leftGripSvg(cls, v, L, id) {
    switch (cls + v) {
      case 'vadasz0': // hosszúíj: a markolata az ökölben, a húr kifelé (balra)
        return S('M84 150 C122 212 122 348 84 410', '#3a2418', 7) + S('M84 150 C122 212 122 348 84 410', '#8a5a32', 4.4) + S('M89 162 C108 196 113 230 114 262', light('#8a5a32', 0.35), 1.4, { op: 0.7 }) +
          S('M84 150 L80 144 M84 410 L80 416', '#3a2418', 3) + S('M82 148 L82 412', '#efe4cc', 1.1);
      case 'vadasz1': // reflexíj: visszahajló végek
        return S('M90 196 C82 202 80 196 84 190 M90 362 C82 356 80 362 84 368', '#3a2418', 5) + S('M90 196 C118 230 118 328 90 362', '#3a2418', 7) + S('M90 196 C118 230 118 328 90 362', '#5a3a20', 4) +
          P('M100 268 L114 268 L114 290 L100 290 Z', '#2f6b4f', { sw: 1.2 }) + S('M86 192 L86 366', '#efe4cc', 1.1);
      case 'orgyilkos0': case 'orgyilkos1': case 'orgyilkos2': case 'alakvalto0': // páros fegyverek: a bal kézben a tükörképe
        return `<g transform="matrix(-1 0 0 1 320 0)"><g transform="rotate(${WEAPON_ROT[cls + v] || 0} ${GRIP[0]} ${GRIP[1]})">${weaponSvg(cls, v, L, id)}</g></g>`;
    }
    return '';
  }
  function leftItemSvg(cls, v, L, id) { return shieldSvg(cls, v, L, id); }
  function quiverBack(cls, L) {
    if (cls !== 'vadasz') return '';
    return P('M190 176 L212 168 L222 248 L200 254 Z', '#5a3e2a') + [0, 1, 2].map(i => S(`M${196 + i * 6} 176 L${192 + i * 6} 148`, '#8a5a32', 2) + `<path d="M${190 + i * 6} 154 l2 -8 l2 6 l2 -6 l2 8 Z" fill="#e9ecff" stroke="#9aa0c0" stroke-width="0.6"/>`).join('');
  }
  function shieldSvg(cls, v, L, id) {
    if (cls !== 'harcos' || v === 2) return '';
    const m = METAL[L.metal] ? METAL[L.metal][1] : '#cfd6ea';
    if (L._back) { // a pajzs hátulja: fa deszkák, bőr fogószíjak
      const d = v === 0 ? 'M78 226 C96 220 124 220 142 226 L140 270 C136 300 116 318 110 322 C104 318 84 300 80 270 Z' : 'M68 272 C68 224 140 224 140 272 C140 320 68 320 68 272 Z';
      return shaded(id, d, '#7a5232', { stroke: m, sw: v === 0 ? 4 : 5, off: [-6, -5] }) + S(v === 0 ? 'M96 222 L96 316 M110 221 L110 322 M124 222 L124 316' : 'M86 232 L86 312 M104 228 L104 316 M122 232 L122 312', '#5a3a20', 1.4, { op: 0.7 }) +
        P(v === 0 ? 'M86 252 L134 252 L134 262 L86 262 Z' : 'M76 266 L132 266 L132 278 L76 278 Z', '#3a2418', { sw: 1 });
    }
    if (v === 0) return shaded(id, 'M78 226 C96 220 124 220 142 226 L140 270 C136 300 116 318 110 322 C104 318 84 300 80 270 Z', L.c1) + S('M78 226 C96 220 124 220 142 226 L140 270 C136 300 116 318 110 322 C104 318 84 300 80 270 Z', m, 4) + starAt(110, 262, 14, m);
    const circ = 'M68 272 C68 224 140 224 140 272 C140 320 68 320 68 272 Z';
    return shaded(id, circ, L.c1, { stroke: m, sw: 5, off: [-8, -6] }) + S('M80 272 C80 240 128 240 128 272', light(m, 0.3), 1.6, { op: 0.6 }) + `<circle cx="104" cy="272" r="9" fill="${m}" stroke="${dark(m, 0.5)}" stroke-width="1.4"/>`;
  }

  // ---------- köpeny, szárny, farok, aura ----------
  function capeSvg(c, L, id) {
    const out = dark(L.c1, 0.3), inner = L.c2; // a köpeny sötétebb a ruhánál, így elölről sem olvad bele
    switch (c) {
      case 'rovid': return shaded(id, 'M118 190 C104 230 96 270 92 304 C120 316 200 316 228 304 C224 270 216 230 202 190 Z', out) + P('M118 190 C112 212 108 236 106 256 L120 198 Z', dark(inner, 0.1), { stroke: false });
      case 'hosszu': return shaded(id, 'M118 190 C96 250 84 340 80 408 C120 420 200 420 240 408 C236 340 224 250 202 190 Z', out) + P('M116 194 C102 250 94 330 92 400 L108 404 C110 330 116 250 122 198 Z', dark(inner, 0.05), { stroke: false });
      case 'rongyos': return shaded(id, 'M118 190 C98 250 88 330 84 396 L100 384 L112 404 L126 386 L142 408 L156 388 L170 410 L186 388 L200 406 L214 386 L226 400 L236 390 C232 330 222 250 202 190 Z', dark(out, 0.1));
      case 'csillagos': return shaded(id, 'M118 190 C96 250 84 340 80 408 C120 420 200 420 240 408 C236 340 224 250 202 190 Z', '#1b2050') + [[104, 300], [214, 330], [120, 370], [200, 260], [96, 390], [226, 392], [112, 240]].map(([x, y], i) => starAt(x, y, 3 + (i % 3), i % 2 ? '#ffe2a0' : '#cfd8ff')).join('') + P('M116 194 C102 250 94 330 92 400 L106 404 C108 330 114 250 122 198 Z', '#5a3e9e', { stroke: false });
    }
    return '';
  }
  function wingsSvg(w, id) {
    switch (w) {
      case 'tunder': return ['M156 214 C120 150 56 130 40 160 C30 190 90 214 150 230 Z', 'M156 236 C110 250 70 290 86 312 C104 330 140 280 156 250 Z'].map(d => both(d).map(x => `<path d="${x}" fill="#bff7ff" fill-opacity="0.38" stroke="#7ff3ff" stroke-width="1.6"/>`).join('')).join('');
      case 'denever': return both('M156 216 C130 160 80 130 30 140 C44 160 44 176 34 196 C54 192 66 202 66 222 C82 210 100 214 108 232 C122 222 140 224 152 236 Z').map(d => P(d, '#3a2850', { stroke: '#1b1238' })).join('') + both('M150 216 C120 180 80 160 44 156 M150 222 C120 200 90 196 66 214').map(d => S(d, '#5a4478', 1.6)).join('');
      case 'feny': { // tollas, ívelt angyalszárny: lekerekített evezőtollak, a fedőtollak világosabb sávja
        const tips = [[24, 114], [26, 142], [36, 168], [54, 190], [78, 208], [104, 220], [130, 228], [152, 232]];
        let d = 'M156 212 C130 160 82 112 24 114'; for (let i = 1; i < tips.length; i++) { const a = tips[i - 1], b = tips[i]; d += ` Q${(a[0] + b[0]) / 2 - 12} ${(a[1] + b[1]) / 2 + 10} ${b[0]} ${b[1]}`; } d += ' Z';
        const lines = tips.slice(1, -1).map(t => `M${t[0]} ${t[1]} L${(t[0] + 156) / 2 + 10} ${(t[1] + 212) / 2 - 6}`).join(' ');
        return both(d).map(x => `<path d="${x}" fill="#fff6d8" fill-opacity="0.88" stroke="#f2c66d" stroke-width="1.6"/>`).join('') + both(lines).map(x => `<path d="${x}" stroke="#e8c27a" stroke-width="1.2" opacity="0.7" fill="none"/>`).join('') + both('M156 212 C130 168 90 128 36 120 C70 140 100 166 120 196 Z').map(x => `<path d="${x}" fill="#ffffff" opacity="0.55"/>`).join('') + `<ellipse cx="160" cy="200" rx="120" ry="70" fill="#ffe2a0" opacity="0.12" filter="url(#${id}-blur6)"/>`; }
    }
    return '';
  }
  function tailSvg(t, L, id) {
    // a farok a derék mögül indul, és jobbra (a fegyverkar mögött) kanyarodik ki, hogy jól látsszon
    switch (t) {
      case 'roka': {
        const d = 'M166 300 C196 322 246 320 272 292 C292 270 294 236 280 210 C276 202 270 196 262 192 C268 214 264 238 250 256 C234 276 204 286 170 284 Z';
        const tip = 'M262 192 C270 196 276 202 280 210 C294 236 292 270 272 292 C278 272 278 252 270 236 C266 226 264 214 262 192 Z';
        return shaded(id, d, L.hair, { off: [-6, -5], dark: 0.3 }) + shaded(id, 'M154 292 C154 280 166 274 176 280 C186 286 184 300 172 302 C162 304 154 300 154 292 Z', L.hair, { off: [-3, -2], stroke: false }) + P(tip, '#fbfbff', { stroke: line(L.hair) }) + S('M200 296 C226 296 250 284 262 264 M214 286 C236 282 252 268 260 252', dark(L.hair, 0.3), 1.4, { op: 0.5 });
      }
      case 'macska': return S('M168 298 C214 318 256 306 262 274 C268 244 246 230 258 200 C262 192 268 188 274 186', line(L.hair), 11) + S('M168 298 C214 318 256 306 262 274 C268 244 246 230 258 200 C262 192 268 188 274 186', L.hair, 7.5) +
        S('M190 304 C220 312 248 302 254 280', light(L.hair, 0.35), 2, { op: 0.6 });
      case 'sarkany': {
        const d = 'M164 292 C210 316 262 316 290 288 C300 278 306 266 308 254 L320 262 L304 270 C300 300 262 330 200 326 C186 324 174 318 164 310 Z';
        let spikes = '';
        [[190, 312], [214, 316], [238, 314], [262, 306], [282, 294]].forEach(([x, y], i) => { spikes += P(`M${x - 6} ${y} L${x + 2} ${y - 13 + i} L${x + 7} ${y - 2} Z`, '#5a3e9e', { sw: 1.2 }); });
        return spikes + shaded(id, d, dark(L.skin, 0.2), { off: [-5, -4] }) + S('M180 318 C220 326 262 320 290 296', light(L.skin, 0.2), 1.6, { op: 0.5 });
      }
    }
    return '';
  }
  const AURA_C = { holdfeny: '#cfd8ff', parazs: '#ff9a4a', arny: '#9b6bff', csillagpor: '#ffe2a0', villam: '#7ff3ff' };
  function auraBack(a, id) {
    if (!AURA_C[a]) return '';
    // elmosás-szűrő helyett sugárirányú átmenet: ugyanaz a lágy fény, de a lüktetés nem rajzolja újra a szűrőt minden képkockán
    const c = AURA_C[a];
    return `<radialGradient id="${id}-aurag"><stop offset="0.5" stop-color="${c}"/><stop offset="0.78" stop-color="${c}" stop-opacity="0.55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>` +
      `<ellipse class="r-aura" cx="160" cy="250" rx="142" ry="200" fill="url(#${id}-aurag)" opacity="0.22"/>`;
  }
  function auraFront(a) {
    const c = AURA_C[a];
    if (!c) return '';
    let s = '<g class="r-particles">';
    for (let i = 0; i < 14; i++) {
      const x = 70 + ((i * 53) % 180), y = 180 + ((i * 97) % 230), r = 1.4 + (i % 3);
      if (a === 'villam' && i % 3 === 0) s += `<path class="r-spark" style="animation-delay:${(i * 0.37) % 3}s" d="M${x} ${y} l6 -10 l-2 8 l7 -9" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`;
      else s += `<circle class="r-p" style="animation-delay:${((i * 0.53) % 4).toFixed(2)}s;animation-duration:${(3 + (i % 4) * 0.7).toFixed(1)}s" cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
    }
    return s + '</g>';
  }

  // ---------- a teljes hős ----------
  function hero(h, opts) {
    opts = opts || {};
    const L = Object.assign(defaultLook(h.classId), h.rig || h.lookV2 || {});
    const cls = h.classId || 'magus';
    const id = 'r' + (++UID);
    const male = L.sex === 'ferfi';
    // férfi: szélesebb váll és mellkas, kicsit magasabb; nő: keskenyebb váll
    const sx = (BODY_SX[L.body] || 1) * (male ? 1.1 : 0.96), hs = (HEIGHT_S[L.height] || 1) * (male ? 1.03 : 1), armShift = (sx - 1) * 44;
    const HEADS = male ? HEAD_M : HEAD;
    const m = METAL[L.metal] ? METAL[L.metal][1] : '#cfd6ea';
    const hairGradY2 = { hosszu: 290, hullamos: 296, copf: 262, ketcopf: 276 }[L.hairBack] || 210;
    const tip = L.tip || L.hair;
    // csuklya, süveg és sisak alá bújik minden, ami a fejtetőn van: az állatfül és a szarv nem bök ki rajta
    const covered = ['csuklya', 'suveg', 'sisak'].indexOf(L.headwear) >= 0;
    const animalEars = covered ? null : ANIMAL_EARS[L.ears];
    const hood = L.headwear === 'csuklya';
    let FH = (L.hairFront === 'kopasz' || L.headwear === 'sisak') ? null : frontHair(L.hairFront, L.sex === 'ferfi');
    if (FH && L.headwear === 'csuklya' && ['irokez', 'felnyirt', 'felfesult'].indexOf(L.hairFront) >= 0) FH = null;
    if (FH && L.headwear === 'csuklya') { const keep = FH.raw.map(r => r[3] >= r[1]); FH = Object.assign({}, FH, { locks: FH.locks.filter((d, i) => keep[i]), raw: FH.raw.filter((r, i) => keep[i]) }); }
    const bald = L.hairFront === 'kopasz';
    const hideMouth = cls === 'orgyilkos' && +L.outfit === 0;
    const defs = `<defs>
      <linearGradient id="${id}-cel" x1="0" y1="0" x2="1" y2="0"><stop offset="0.6" stop-color="#140c34" stop-opacity="0"/><stop offset="0.6" stop-color="#140c34" stop-opacity="0.22"/><stop offset="1" stop-color="#140c34" stop-opacity="0.3"/></linearGradient>
      <linearGradient id="${id}-hi" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="0.14" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="${id}-metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light(m, 0.55)}"/><stop offset="0.45" stop-color="${m}"/><stop offset="0.5" stop-color="${dark(m, 0.25)}"/><stop offset="1" stop-color="${m}"/></linearGradient>
      <linearGradient id="${id}-hair" gradientUnits="userSpaceOnUse" x1="0" y1="50" x2="0" y2="${hairGradY2}"><stop offset="0" stop-color="${L.hair}"/><stop offset="0.55" stop-color="${L.hair}"/><stop offset="1" stop-color="${tip}"/></linearGradient>
      <linearGradient id="${id}-hairF" gradientUnits="userSpaceOnUse" x1="0" y1="50" x2="0" y2="140"><stop offset="0" stop-color="${L.hair}"/><stop offset="0.6" stop-color="${L.hair}"/><stop offset="1" stop-color="${L.tip ? mix(L.hair, tip, 0.7) : L.hair}"/></linearGradient>
      <pattern id="${id}-chain" width="6" height="5" patternUnits="userSpaceOnUse"><path d="M0 2.5 C1.5 0 4.5 0 6 2.5 C4.5 5 1.5 5 0 2.5 Z" fill="none" stroke="${m}" stroke-width="1"/></pattern>
      <filter id="${id}-blur3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="${id}-blur6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="${id}-blur12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
      <clipPath id="${id}-headclip"><path d="${HEADS[L.face] || HEADS.ovalis}"/></clipPath>
      <clipPath id="${id}-outhead"><path clip-rule="evenodd" d="M-60 -120 L380 -120 L380 520 L-60 520 Z ${HEADS[L.face] || HEADS.ovalis}"/></clipPath>
      <clipPath id="${id}-hairclip"><path d="${FH ? FH.cap : 'M0 0 Z'}"/></clipPath>
    </defs>`;
    const hairStroke = line(L.hair);
    const hairP = (d, grad, off) => shaded(id, d, `url(#${id}-${grad || 'hair'})`, { base: L.hair, off: off || [-6, -5], stroke: hairStroke, dark: 0.3 });

    // ---------- forgatás (2,5D): minden rész a mélysége szerint mozdul ----------
    // yaw fokban: 0 = szemből. A fej körül egy függőleges henger: egy φ szögű pont helye x = R·sin(φ+θ),
    // mélysége z = R·cos(φ+θ). Az arc egy „ablakban” látszik (φ ∈ [−A, A]), ami a fordulással a látható
    // félgömbre szorul; a fej többi részét hátulról a haj borítja. Ugyanez a test, karok, fülek, szarvak,
    // köpeny, szárny és farok esetén is – a rétegsorrend a mélységből adódik.
    const yawD = (((opts.yaw || 0) % 360) + 540) % 360 - 180, turned = Math.abs(yawD) > 0.01;
    const th = yawD * Math.PI / 180, c = Math.cos(th), sn = Math.sin(th), sg = c < 0 ? -1 : 1, ac = Math.abs(c);
    const fx = v => +v.toFixed(3);
    const T = str => turned ? ` transform="${str}"` : '';
    // oldalsó rész (fül, kar, szarv): középponttól d távolságra, φ = ±90°
    const sideT = (d, extra) => `translate(${fx(160 + d * c + (extra || 0))} 0) scale(${sg} 1) translate(${fx(-(160 + d))} 0)`;
    const sideZ = d => -(d < 0 ? -1 : 1) * sn; // >0: a néző felé
    const bodyW = Math.sqrt(c * c + 0.36 * sn * sn);

    // hátsó rétegek
    const auraB = auraBack(L.aura, id);
    const wingsB = turned ? `<g${T(`translate(${fx(160 - (14 + 34 * (1 - ac)) * sn)} 0) scale(${fx(sg * (0.35 + 0.65 * ac))} 1) translate(-160 0)`)}>${wingsSvg(L.wings, id)}</g>` : wingsSvg(L.wings, id);
    const capeB = `<g${T(`translate(${fx(160 - 8 * sn)} 0) scale(${fx(sg * bodyW)} 1) translate(-160 0)`)}><g class="r-cape" style="transform-origin:160px 192px">${capeSvg(L.cape, L, id)}</g></g>`;
    const tailB = `<g${T(`translate(${fx(160 - (10 + 30 * (1 - ac)) * sn)} 0) scale(${fx(sg * (0.45 + 0.55 * ac))} 1) translate(-160 0)`)}>${tailSvg(L.tail, L, id)}</g>`;
    const quiverB = `<g${T(`translate(${fx(160 - 6 * sn)} 0) scale(${fx(sg * bodyW)} 1) translate(-160 0)`)}>${quiverBack(cls, L)}</g>`;
    let hairBack = '', backSel = '', hairExtra = '';
    const hairBackT = `translate(${fx(160 - 12 * sn)} 0) scale(${fx(sg * (0.8 + 0.2 * ac))} 1) translate(-160 0)`;
    if (!hood && L.hairBack !== 'nincs') {
      // férfi rövid haj: a tarkón rövidebb és a fejhez simuló, nem bubifrizura
      const ROUND_NAPE = 'M104 124 C98 44 222 44 216 124 C214 146 204 160 190 166 C176 172 168 168 160 172 C152 168 144 172 130 166 C116 160 106 146 104 124 Z';
      const rearView = turned && c < -0.42;
      let backD = rearView && HAIR_BACK_REAR[L.hairBack] ? HAIR_BACK_REAR[L.hairBack] : turned && (L.hairBack === 'rovid' || L.hairBack === 'copf' || L.hairBack === 'ketcopf' || L.hairBack === 'konty') ? ROUND_NAPE : male && L.hairBack === 'rovid' ? 'M106 120 C100 52 220 52 214 120 C213 134 209 144 202 150 L118 150 C111 144 107 134 106 120 Z' : (HAIR_BACK[L.hairBack] || HAIR_BACK.rovid);
      // oldalról/hátulról a hajkorona teteje a frufru sapkájával egy magasságban legyen (szemből úgyis takarja)
      if (turned) backD = backD.replace(/(-?\d*\.?\d+)[\s,]+(-?\d*\.?\d+)/g, (m, x, y) => `${x} ${+y < 124 ? +(124 - (124 - y) * 1.38).toFixed(1) : y}`);
      if (!bald) hairBack += male ? `<g transform="translate(160 128) scale(0.94 0.96) translate(-160 -128)">${hairP(backD)}</g>` : hairP(backD);
      // hátulról a tüskék / a taraj is látsszon
      // kalap, sisak alatt a fejtetőn semmi nem lóghat ki
      if (rearView && !bald && HAIR_BACK_TOP[L.hairFront] && ['suveg', 'sisak'].indexOf(L.headwear) < 0) { const top = hairP(HAIR_BACK_TOP[L.hairFront]); hairBack = L.hairFront === 'irokez' ? hairBack + top : top + hairBack; } // a taraj a fej közepén végig felül van
      if (!bald) backSel = male ? `<g transform="translate(160 128) scale(0.94 0.96) translate(-160 -128)"><path d="${backD}"/></g>` : `<path d="${backD}"/>`;
      // copf, két copf, konty: a saját helyükön forognak a fej körül (a lófarok hátul lóg, nem az arc előtt)
      // [gyökér x, oldalirányú eltolás, hátra eltolás, hátralógás mértéke, oldal]
      const XPOS = { copf: [[198, 38, 50, 0.6, 1]], ketcopf: [[120, -40, 10, 0.35, -1], [200, 40, 10, 0.35, 1]] }[L.hairBack] || [];
      (HAIR_EXTRA[L.hairBack] || []).forEach((d, i) => {
        let g = bald && L.hairBack === 'konty' ? `<g transform="translate(0 14)">${hairP(d)}</g>` : hairP(d);
        const xp = XPOS[i];
        if (turned && c >= -0.6 && (c < 0.05 || L.headwear === 'sisak') && L.hairBack === 'copf') { // oldalról: a tarkóból indul és hátrafelé ívelve lóg le
          const sd = sn > 0 ? 1 : -1, rx = 160 - 50 * sn;
          g = `<g transform="translate(${fx(rx)} 0) scale(${sd} 1)">${hairP('M10 70 C-24 72 -42 128 -34 196 C-31 214 -20 226 -8 230 C-18 190 -16 128 6 94 Z')}<path d="M4 72 L14 74 L10 94 L0 92 Z" fill="${L.c2 || '#c2304a'}" stroke="${line(L.c2 || '#c2304a')}" stroke-width="1.2"/></g>`;
        } else if (turned && c < -0.6 && L.hairBack === 'copf') { // hátulról a lófarok a tarkó közepén, gumival összefogva lóg le
          g = hairP('M146 112 C136 150 134 200 146 246 C150 258 170 258 174 246 C186 200 184 150 174 112 Z') + `<path d="M146 116 C152 122 168 122 174 116 L172 106 C166 110 154 110 148 106 Z" fill="${L.c2 || '#c2304a'}" stroke="${line(L.c2 || '#c2304a')}" stroke-width="1.2"/>`;
        } else if (turned && xp) {
          let k = c - xp[3] * sn * xp[4];
          k = (k < 0 ? -1 : 1) * Math.max(0.35, Math.abs(k));
          g = `<g transform="translate(${fx(160 + xp[1] * c - xp[2] * sn)} 0) scale(${fx(k)} 1) translate(${-xp[0]} 0)">${g}</g>`;
        } else if (turned) g = `<g transform="translate(${fx(160 - 22 * sn)} 0) scale(${fx(sg * (0.85 + 0.15 * ac))} 1) translate(-160 0)">${g}</g>`;
        if (L.headwear === 'sisak' && L.hairBack === 'copf' && !(turned && c < -0.6)) g = `<g transform="translate(0 64)">${g}</g>`;
        hairExtra += g;
      });
    }
    // hátsó haj nélkül is látsszon hátulról a tüske / a taraj / a felfésült tincs (különben forgatáskor eltűnne)
    if (!hood && L.hairBack === 'nincs' && turned && c < -0.42 && !bald && HAIR_BACK_TOP[L.hairFront] && ['suveg', 'sisak'].indexOf(L.headwear) < 0) {
      // a taraj végigfut a fej közepén; a tüskékből és a felfésült tincsből csak a fej fölé kiálló rész látszik (alsó vonal nélkül)
      const top = hairP(HAIR_BACK_TOP[L.hairFront]);
      hairBack += L.hairFront === 'irokez' ? top : `<clipPath id="${id}-abovehead"><path clip-rule="evenodd" d="M-60 -120 L380 -120 L380 520 L-60 520 Z ${HEADS[L.face] || HEADS.ovalis}"/></clipPath><g clip-path="url(#${id}-abovehead)">${top}</g>`;
    }
    let hoodBack = hood ? headwearBack('csuklya', L, id) : '';
    if (turned) { hairBack = `<g transform="${hairBackT}">${hairBack}</g>`; if (hoodBack) hoodBack = `<g transform="${hairBackT}">${hoodBack}</g>`; }
    hairBack += hairExtra;
    if (hood && turned && c < 0.3) {
      // hátulról a csuklyán varrás, redők és a fény felőli peremen csillanás – ne legyen lapos folt
      const fold = (ph, w, o) => {
        const p = ph + th, v = Math.cos(p);
        if (v < 0.05) return '';
        const X = r => fx(160 + r * Math.sin(p));
        return S(`M${X(50)} 44 C${X(60)} 90 ${X(61)} 140 ${X(55)} 198`, dark(L.c1, 0.45), w, { op: o * Math.min(1, v * 2.5) });
      };
      const hv = Math.min(1, (0.3 - c) / 0.5);
      hoodBack += `<g opacity="${fx(hv)}">` + fold(Math.PI, 2.2, 0.7) + fold(Math.PI - 0.55, 1.5, 0.5) + fold(Math.PI + 0.55, 1.5, 0.5) + fold(Math.PI - 1.05, 1.3, 0.35) + fold(Math.PI + 1.05, 1.3, 0.35) +
        `<g transform="${hairBackT}">${S('M104 134 C96 88 118 46 160 40', light(L.c1, 0.35), 2.6, { op: 0.5 })}<path d="M112 186 C140 200 180 200 208 186" fill="none" stroke="${dark(L.c1, 0.5)}" stroke-width="5" opacity="0.35"/></g></g>`;
    }

    // test
    const bodyT = `translate(160 0) scale(${sx} 1) translate(-160 0)`;
    let body = `<g transform="${bodyT}">${outfitSvg(cls, +L.outfit, c < -0.2 ? Object.assign({}, L, { _back: true }) : L, id)}</g>`;
    if (turned) body = `<g transform="translate(${fx(160 + 10 * sn)} 0) scale(${fx(sg * bodyW)} 1) translate(-160 0)">${body}</g>`;
    const sleeve = L.c1;
    const cuffC = cls === 'harcos' ? metalFill(id) : L.c2;
    const hand = (H, Tm, side) => shaded(id, H, L.skin, { off: [-3, -2], rim: 1.4 }) + P(Tm, L.skin, { sw: 1.6 }) + S(side > 0 ? 'M210 279 L222 278 M210 284.5 L221.5 284' : mirror('M210 279 L222 278 M210 284.5 L221.5 284'), dark(L.skin, 0.4), 1.1, { op: 0.7 });
    // férfiaknál vállvédő / vállkendő a karok tetején: szélesebb, szögletesebb vállvonal
    const PAUL = 'M183 196 C186 180 212 176 224 194 C226 205 219 213 208 213 C195 213 185 207 183 196 Z';
    const paulC = { harcos: null, alakvalto: '#8a6a4a', vadasz: '#6a4630', orgyilkos: dark(L.c1, 0.2) }[cls];
    const paul = (d) => !male ? '' : cls === 'harcos' ? shaded(id, d, metalFill(id), { base: m, off: [-4, -3] }) : shaded(id, d, paulC || dark(L.c2, 0.08), { off: [-4, -3] });
    const paulR = paul(PAUL) + (male && cls === 'harcos' ? `<path d="M190 200 C196 190 212 188 220 198" fill="none" stroke="${dark(m, 0.45)}" stroke-width="1.4"/><circle cx="204" cy="190" r="2" fill="${light(m, 0.4)}"/>` : male && cls === 'alakvalto' ? S('M186 204 l-3 6 M194 210 l-1 6 M204 212 l0 6 M214 210 l2 6', '#5a4030', 2) : '');
    const paulL = paul(mirror(PAUL)) + (male && cls === 'harcos' ? `<path d="${mirror('M190 200 C196 190 212 188 220 198')}" fill="none" stroke="${dark(m, 0.45)}" stroke-width="1.4"/><circle cx="116" cy="190" r="2" fill="${light(m, 0.4)}"/>` : male && cls === 'alakvalto' ? S(mirror('M186 204 L183 210 M194 210 L193 216 M204 212 L204 218 M214 210 L216 216'), '#5a4030', 2) : '');
    const AS = male ? ' translate(204 192) scale(1.08) translate(-204 -192)' : '', ASL = male ? ' translate(116 192) scale(1.08) translate(-116 -192)' : '';
    const armDist = 44 + armShift;
    let armR = `<g class="r-arm-r" style="transform-origin:${198 + armShift}px 196px"><g transform="translate(${armShift} 0)${AS}">${shaded(id, ARM_R, sleeve, { off: [-4, -3] })}${shaded(id, CUFF_R, cuffC, { base: cls === 'harcos' ? m : L.c2, off: [-3, -2], rim: 1.4 })}${paulR}<g class="r-weapon${REV_GRIP[cls + L.weapon] ? ' rev' : ''}" style="transform-origin:${212 + armShift}px 282px"><g transform="rotate(${fx((WEAPON_ROT[cls + L.weapon] || 0) + (turned ? 22 * sn * sg : 0))} ${GRIP[0]} ${GRIP[1]})">${weaponSvg(cls, +L.weapon, c < -0.2 ? Object.assign({}, L, { _back: true }) : L, id)}</g></g>${hand(HAND_R, THUMB_R, 1)}</g></g>`;
    let armL = `<g class="r-arm-l" style="transform-origin:${122 - armShift}px 196px"><g transform="translate(${-armShift} 0)${ASL}">${shaded(id, ARM_L, sleeve, { off: [-4, -3] })}${shaded(id, CUFF_L, cuffC, { base: cls === 'harcos' ? m : L.c2, off: [-3, -2], rim: 1.4 })}${paulL}<g class="r-lgrip" style="transform-origin:107px 279px">${cls === 'vadasz' && +L.weapon < 2 ? '' : leftGripSvg(cls, +L.weapon, L, id)}</g>${cls === 'vadasz' && +L.weapon < 2 ? `<g class="r-nock" opacity="0"><path d="M107 280 L107 374" stroke="#c8a46a" stroke-width="2.4" stroke-linecap="round"/><path d="M103 372 L107 384 L111 372 Z" fill="#cfd6ea" stroke="#5a5f78" stroke-width="0.8"/><path d="M104 280 L107 286 L110 280 M104 285 L107 291 L110 285" fill="none" stroke="#e8e6f2" stroke-width="1.4"/><circle class="r-pull" cx="107" cy="281" r="0.1" fill="none"/></g>` : ''}${hand(HAND_L, THUMB_L, -1)}<g class="r-offhand">${leftItemSvg(cls, +L.weapon, c < -0.2 ? Object.assign({}, L, { _back: true }) : L, id)}</g></g></g>`;
    if (turned) { armR = `<g transform="${sideT(armDist, 10 * sn)}">${armR}</g>`; armL = `<g transform="${sideT(-armDist, 10 * sn)}">${armL}</g>`; }
    const zArmR = turned ? sideZ(armDist) : 0, zArmL = turned ? sideZ(-armDist) : 0;
    let neck = male ? P('M145 160 L175 160 L177 194 L143 194 Z', L.skin) + `<path d="M145 160 L175 160 L175 184 C166 191 154 191 145 184 Z" fill="${dark(L.skin, 0.3)}" opacity="0.55"/>` + S('M157 188 C159 186 161 186 163 188', dark(L.skin, 0.4), 1.3, { op: 0.7 })
      : P('M149 162 L171 162 L172 194 L148 194 Z', L.skin) + `<path d="M149 162 L171 162 L171 178 C164 184 156 184 149 178 Z" fill="${dark(L.skin, 0.3)}" opacity="0.55"/>`;
    if (turned) neck = `<g transform="translate(${fx(160 + 4 * sn)} 0) scale(${fx(0.75 + 0.25 * ac)} 1) translate(-160 0)">${neck}</g>`;

    // fej
    const headD = HEADS[L.face] || HEADS.ovalis;
    const coveredEars = L.headwear === 'csuklya' || L.headwear === 'sisak';
    // fülek oldalanként: elöl (forduláskor a közeli) az arcon is látszik, a távoli a fej mögé kerül
    const EAR_D = 50;
    const earSide = side => {
      if (animalEars || coveredEars) return { s: '', z: 0 };
      const idx = side < 0 ? 0 : 1;
      let g = shaded(id, both(EARS[L.ears] || EARS.ember)[idx], L.skin, { off: [-3, -3], rim: 1.4, dark: 0.25 }) + S(both(EAR_INNER[L.ears] || EAR_INNER.ember)[idx], dark(L.skin, 0.35), 1.6, { op: 0.7 });
      g += earringSvg(L.earring, L, side);
      if (L.headwear === 'suveg') g = `<g clip-path="url(#${id}-hatline2)">${g}</g>`;
      const z = turned ? sideZ(side * EAR_D) : 0;
      if (!turned) return { s: `<g clip-path="url(#${id}-outhead)">${g}</g>`, z: 0 };
      const inner = z > 0.3 ? g : `<g clip-path="url(#${id}-outhead)">${g}</g>`;
      return { s: `<g transform="${sideT(side * EAR_D)}">${inner}</g>`, z: z };
    };
    const earL = earSide(-1), earR = earSide(1);
    const earsFront = (turned ? [earL, earR].filter(e => e.z >= -0.2) : [earL, earR]).map(e => e.s).join('') + (coveredEars || animalEars || turned ? '' : `<clipPath id="${id}-earband"><rect x="0" y="132" width="320" height="52"/></clipPath><g clip-path="url(#${id}-earband)"><g clip-path="url(#${id}-outhead)"><path d="${headD}" fill="none" stroke="${dark(L.skin, 0.3)}" stroke-width="3" opacity="0.35"/></g></g>`); // csak a fülek tövénél, a hajon nem fut át
    const earsBack = turned ? [earL, earR].filter(e => e.z < -0.2).map(e => e.s).join('') : '';
    const headSkin = turned && c < -0.42 ? `<clipPath id="${id}-nape"><ellipse cx="160" cy="104" rx="80" ry="${male ? 64 : 66}"/></clipPath><g clip-path="url(#${id}-nape)">${shaded(id, headD, L.skin, { off: [-9, -4], dark: 0.24 })}</g>` : shaded(id, headD, L.skin, { off: [-9, -4], dark: 0.24 });
    // Hengeres leképezés a fejre (Live2D-szerű parallaxis): minden pont a saját mélysége szerint mozdul.
    // Rs = a koponya félszélessége magasságonként, Rh = a haj „héja” (egy kicsit kívül, felül a hajsapka íve).
    const Rs = halfWidth(headD), Rcap = halfWidth(CAP);
    const Rh = y => Math.max(Rs(y) + 12, y < 100 ? Rcap(y) : 0);
    const skinMap = (x, y) => cylX(x, Rs(Math.min(y, male ? 172 : 166)), th), hairMap = (x, y) => cylX(x, Rh(y), th);
    // az arc „ablaka”: a koponyán ±A fokig bőr, azon túl (a fej oldala és hátulja) haj; szemből teljesen bőr
    const Aw = Math.max(0, 90 - 18 * Math.min(1, Math.abs(yawD) / 30) - 2.4 * Math.max(0, Math.abs(yawD) - 95)) * Math.PI / 180;
    const winMap = (x, y) => cylX(x, Rs(y), th, Aw);
    // egy arcvonás a henger felszínén: a helyére tolva, a rövidülés szerint keskenyítve, a fej mögött eltűnik
    const feat = (cx, cy, inner, minC) => {
      if (!turned || !inner) return inner;
      const R = Math.max(8, Rs(cy)), ph = Math.asin(Math.max(-0.97, Math.min(0.97, (cx - 160) / R))), p = ph + th, cp = Math.cos(p);
      if (cp < (minC == null ? 0.2 : minC)) return '';
      return `<g transform="translate(${fx(160 + R * Math.sin(p))} 0) scale(${fx(cp / Math.cos(ph))} 1) translate(${-cx} 0)">${inner}</g>`;
    };
    const FHm = FH && turned ? { cap: pmap(FH.cap, hairMap), under: FH.under && pmap(FH.under, hairMap), locks: FH.locks.map(d => pmap(d, hairMap)), sides: FH.sides.map(d => pmap(d, (x, y) => cylX(x, Rs(Math.min(y, 160)) + 5, th))), raw: FH.raw } : FH;
    let face = '';
    // a haj árnyéka a homlokon
    if (FHm) face += `<g clip-path="url(#${id}-headclip)"><path d="${FHm.cap} ${FHm.locks.join(' ')}" transform="translate(3 7)" fill="${dark(L.skin, 0.4)}" opacity="0.4"/></g>`;
    const blush = male ? 0 : 0.3;
    if (blush) face += feat(134, 142, `<ellipse cx="134" cy="142" rx="10" ry="5.5" fill="#ff7a9a" opacity="${blush}" filter="url(#${id}-blur3)"/>`) + feat(186, 142, `<ellipse cx="186" cy="142" rx="10" ry="5.5" fill="#ff7a9a" opacity="${blush}" filter="url(#${id}-blur3)"/>`);
    // férfi arc: járomcsont alatti árnyék, határozott állkapocsvonal és áll – szögletesebb, felnőttesebb arc
    if (male) {
      const CHEEK = 'M122 136 C126 148 131 157 138 164 M198 136 C194 148 189 157 182 164', CHIN = 'M153 182 C156 184 164 184 167 182';
      face += `<g clip-path="url(#${id}-headclip)"><path d="${turned ? pmap(CHEEK, skinMap) : CHEEK}" fill="none" stroke="${dark(L.skin, 0.35)}" stroke-width="9" opacity="0.13" filter="url(#${id}-blur3)"/></g>` + feat(160, 182, S(CHIN, dark(L.skin, 0.35), 1.5, { op: 0.45 }), 0.3);
    }
    const JAW = 'M119 150 L131 176 C137 184 148 186 160 186 C172 186 183 184 189 176 L201 150';
    if (male) face += `<g clip-path="url(#${id}-headclip)"><path d="${turned ? pmap(JAW, skinMap) : JAW}" fill="none" stroke="${dark(L.skin, 0.3)}" stroke-width="8" opacity="0.24"/></g>`;
    face += feat(160, 134, (male ? S('M162 120 C163 128 164 134 163 140', dark(L.skin, 0.3), 1.4, { op: 0.45 }) : '') + noseSvg(L.nose, L.skin, male), 0.42);
    // r-shout: nyitott, kiabáló száj (harci kiáltásnál a CSS cseréli le a rendes szájra)
    if (!hideMouth) face += feat(160, 155, `<g class="r-mouth">${mouthSvg(L.mouth, L.skin, male)}</g><g class="r-shout" opacity="0"><path d="M151 150 C151 144 169 144 169 150 C169 163 151 163 151 150 Z" fill="#7a2034" stroke="${dark(mix(L.skin, '#8a4a3a', 0.35), 0.35)}" stroke-width="1.8"/><path d="M153 149.5 C157 147.5 163 147.5 167 149.5 L166 151.5 C162 150.5 158 150.5 154 151.5 Z" fill="#fff"/><path d="M155 158 C158 156 162 156 165 158 C162 160.5 158 160.5 155 158 Z" fill="#e8708a"/></g>`, 0.3);
    face += `<g clip-path="url(#${id}-headclip)">${markSvg(L.mark, L.skin, turned ? (x, y, g) => feat(x, y, g, 0.15) : null)}</g>`;
    const eyeL = L.headwear === 'szemkoto' ? '' : eyeSvg(id, -1, L.eyeShape, L.eye, L.eyeGlow, L.skin, male);
    const eyeR = eyeSvg(id, 1, L.eyeShape, L.eye2 || L.eye, L.eyeGlow, L.skin, male);
    // a távoli szem rövidül (perspektíva), a közeli kicsit szélesedik; ha már a fej mögé fordul, eltűnik
    face += `<g class="r-eyes"${turned ? ` clip-path="url(#${id}-headclip)"` : ''}>${feat(139, 125, eyeL)}${feat(181, 125, eyeR)}</g>`;
    if (L.headwear === 'szemkoto') face += turned ? `<clipPath id="${id}-strapclip2"><path transform="translate(160 120) scale(1.04) translate(-160 -120)" d="${headD}"/></clipPath><g clip-path="url(#${id}-strapclip2)">${cylSvg(eyepatchStraps(male), skinMap)}</g>` + feat(139, 125, eyepatchPatch(male), 0.15) : eyepatchStraps(male) + eyepatchPatch(male);
    const MASK = 'M116 146 C130 156 150 160 160 160 C170 160 190 156 204 146 L206 168 C192 184 174 188 160 188 C146 188 128 184 114 168 Z', MASK_L = 'M124 160 C146 168 174 168 196 160';
    if (hideMouth) face += shaded(id, turned ? pmap(MASK, skinMap) : MASK, dark(L.c1, 0.05)) + S(turned ? pmap(MASK_L, skinMap) : MASK_L, light(L.c1, 0.2), 1.4, { op: 0.6 });
    if (!hideMouth) face += beardSvg(L.beard, L, turned ? skinMap : null);
    let brows = '';
    if (L.headwear !== 'sisak') brows = feat(139, 112, browSvg(L.brows, dark(L.hair, 0.5), -1, L.eyeShape, male)) + feat(181, 112, browSvg(L.brows, dark(L.hair, 0.5), 1, L.eyeShape, male));
    let front = '';
    if (FHm) {
      const ups = [], downs = [];
      FHm.locks.forEach((d, i) => { (FHm.raw[i][3] < FHm.raw[i][1] ? ups : downs).push(i); });
      // forgatáskor a tincsek körvonala csak a sziluetten és az arc előtt látszik: haj a haj előtt nem kap kemény vonalat
      let mk = '';
      if (turned) {
        const inv = male ? ' transform="translate(160 128) scale(1.0753 1.0526) translate(-160 -128)"' : '';
        front += `<mask id="${id}-hmask" maskUnits="userSpaceOnUse" x="-100" y="-150" width="520" height="640"><rect x="-100" y="-150" width="520" height="640" fill="#fff"/><g${inv} fill="#000"><path d="${headD}"/>${backSel ? `<g transform="${hairBackT}">${backSel}</g>` : ''}<path d="${pmap(headD, winMap)}" fill="#fff"/></g></mask>`;
        mk = ` mask="url(#${id}-hmask)"`;
      }
      if (FHm.under) front += `<path d="${FHm.under}" fill="${dark(L.hair, 0.12)}" opacity="0.55"/><path d="${FHm.under}" fill="none" stroke="${hairStroke}" stroke-width="1.6" opacity="0.5"${mk}/>`;
      const order = FHm.sides.concat(ups.map(i => FHm.locks[i]), [FHm.cap], downs.map(i => FHm.locks[i]));
      front += `<g${mk}>${order.map(d => `<path d="${d}" fill="${hairStroke}" stroke="${hairStroke}" stroke-width="4.2" stroke-linejoin="round"/>`).join('')}</g>`;
      const fillP = d => shaded(id, d, `url(#${id}-hairF)`, { base: L.hair, off: [-4, -4], stroke: false, dark: 0.26, rim: 1.8 });
      FHm.sides.forEach(d => { front += fillP(d); });
      ups.forEach(i => { front += fillP(FHm.locks[i]); });
      front += turned ? shaded(id, FHm.cap, `url(#${id}-hairF)`, { base: L.hair, off: [-4, -4], stroke: false, dark: 0.26, rim: fx(1.8 * Math.max(0, 1 - Math.abs(yawD) / 35)) }) : fillP(FHm.cap);
      const HL = 'M116 76 C134 56 186 56 204 76';
      if (turned) front += `<clipPath id="${id}-hairclipT"><path d="${FHm.cap}"/></clipPath>`;
      front += `<g clip-path="url(#${id}-hairclip${turned ? 'T' : ''})"><path d="${turned ? pmap(HL, hairMap) : HL}" fill="none" stroke="${light(L.hair, 0.6)}" stroke-width="5" opacity="0.5"/></g>`;
      const lockFill = d => shaded(id, d, `url(#${id}-hairF)`, { base: L.hair, off: [-3, -3], stroke: false, dark: 0.22, rim: 0 });
      downs.forEach(i => { front += lockFill(FHm.locks[i]); });
      const strand = dark(L.hair, 0.42);
      downs.concat(ups).forEach(i => {
        const r = FHm.raw[i], dx = r[2] - r[0], dy = r[3] - r[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, w = r[4];
        const pt = (t, k) => { const x = r[0] + dx * t + nx * (r[5] || 0) * Math.sin(Math.PI * t) * 0.8 + nx * w * k, y = r[1] + dy * t + ny * (r[5] || 0) * Math.sin(Math.PI * t) * 0.8 + ny * w * k; return [(turned ? hairMap(x, y) : x).toFixed(1), y.toFixed(1)]; };
        const a = pt(0.12, 0.3), b = pt(0.5, 0.2), cc = pt(0.8, 0.08);
        front += S(`M${a[0]} ${a[1]} Q${b[0]} ${b[1]} ${cc[0]} ${cc[1]}`, strand, 1, { op: 0.4 });
      });
    }
    if (male && front) front = `<g transform="translate(160 128) scale(0.93 0.95) translate(-160 -128)">${front}</g>`;
    if (front && L.headwear === 'csuklya') front = `<clipPath id="${id}-hoodhole"><path d="${turned ? pmap(HOOD_HOLE, winMap) : HOOD_HOLE}"/></clipPath><g clip-path="url(#${id}-hoodhole)">${front}</g>`;
    if (front && L.headwear === 'suveg') front = `<clipPath id="${id}-hatline"><path d="${HAT_BELOW}"/></clipPath><g clip-path="url(#${id}-hatline)">${front}</g>`;
    let animal = '';
    if (animalEars) {
      [-1, 1].forEach((side, idx) => {
        const g = `<path d="${both(animalEars.outer)[idx]}" fill="${L.hair}" stroke="${hairStroke}" stroke-width="2" stroke-linejoin="round"/><path d="${both(animalEars.inner)[idx]}" fill="#ffb3c8" opacity="${turned && (c < 0.05 || sideZ(side * 25) < -0.3) ? 0 : 0.85}"/>`;
        animal += turned ? `<g transform="${sideT(side * 25)}">${g}</g>` : g;
      });
    }
    // szarvak: oldalról a kifelé álló rész rövidül, a hegyük hátrafelé ível; a távoli szarv a fej mögé kerül
    let horns = '', hornsBack = '';
    if (HORNS[L.horns] && !covered) {
      const hc = L.hornColor || '#efe4cc';
      const one = d => L.horns === 'agancs' ? S(d, line(hc), 7) + S(d, hc, 4.5) : shaded(id, d, hc);
      HORNS[L.horns].forEach((d, idx) => {
        if (!turned) { horns += one(d); return; }
        const side = idx ? 1 : -1, rx = 160 + side * 30, ry = 76;
        const g = `<g transform="translate(${fx(160 + side * 30 * c)} ${ry}) matrix(${fx(sg * Math.max(0.3, ac))} 0 ${fx(0.55 * sn)} 1 0 0) translate(${-rx} ${-ry})">${one(d)}</g>`;
        if (sideZ(side * 30) < -0.25) hornsBack += g; else horns += g;
      });
    }
    let hw = '';
    if (L.headwear !== 'nincs') {
      const generic = svg => `<g transform="translate(${fx(160 + 6 * sn)} 0) scale(${fx(sg * (0.82 + 0.18 * ac))} 1) translate(-160 0)">${svg}</g>`;
      if (!turned && L.headwear !== 'diadem' && L.headwear !== 'abroncs') hw = headwearFront(L.headwear, L, id);
      else if (L.headwear === 'szemkoto') hw = c >= 0 ? '' : !bald && L.hairBack !== 'nincs' ? '' : `<clipPath id="${id}-strapclip"><path transform="translate(160 120) scale(1.05) translate(-160 -120)" d="${headD}"/></clipPath><g clip-path="url(#${id}-strapclip)">` + cylSvg(S('M108 98 C134 106 184 112 212 122', '#1b1238', 3), (x, y) => cylX(x, bald || L.hairFront === 'katonai' ? Rs(y) + 2 : Rh(y), th - Math.PI * (th > 0 ? 1 : -1))) + '</g>';
      else if (L.headwear === 'csuklya') {
        // forgatáskor a csuklya nyílása az arccal együtt mozog, hátulról zárt; hátul varrás és redők
        hw = shaded(id, HOOD_OUT + ' ' + pmap(HOOD_HOLE, winMap), L.c1, { evenodd: true, off: [-7, -5] }) + S('M104 124 C100 84 122 48 160 40', light(L.c1, 0.3), 2, { op: 0.45 });
      } else if (L.headwear === 'sisak' && c < 0) {
        const mm = METAL[L.metal] ? METAL[L.metal][1] : '#cfd6ea';
        hw = `<g transform="translate(${fx(160 + 6 * sn)} 0) scale(${fx(sg * (0.82 + 0.18 * ac) * 1.06)} 1) translate(-160 0)">` + shaded(id, 'M154 40 C146 16 166 -2 196 0 C216 2 232 14 238 32 C226 24 212 22 200 28 C190 34 178 40 168 46 Z', L.c1, { off: [-5, -4] }) +
          shaded(id, 'M102 122 C96 58 126 34 160 34 C194 34 224 58 218 122 C216 146 206 162 190 168 L130 168 C114 162 104 146 102 122 Z', metalFill(id), { base: mm, stroke: dark(mm, 0.55), off: [-8, -6] }) +
          S('M160 36 L160 166', dark(mm, 0.4), 2.4, { op: 0.6 }) + S('M106 120 C126 132 194 132 214 120', dark(mm, 0.45), 1.6, { op: 0.8 }) + `</g>`;
      } else if (L.headwear === 'sisak') hw = ''; // a héjat lent, a fej rétegei után rajzoljuk (egy körvonallal)
      else if (L.headwear === 'suveg') hw = generic(headwearFront('suveg', L, id));
      else if (L.headwear === 'diadem' || L.headwear === 'abroncs') {
        const mm = METAL[L.metal] ? METAL[L.metal][1] : '#e8b94a', dia = L.headwear === 'diadem';
        // a pánt félszélessége (Rr), a közepe (yc) és a széle felé süllyedése (k): a kövek a pánt saját ívén vándorolnak
        const Rr = dia ? 48 : 54, yc = dia ? 89 : 72, k = dia ? 9 : 12;
        const gem = (x, r, col) => { const ph = Math.asin(Math.max(-0.99, Math.min(0.99, (x - 160) / Rr))), p = ph + th, cp = Math.cos(p); if (cp < 0.35) return ''; const dx = Rr * Math.sin(p) * 0.86; return `<ellipse cx="${fx(160 + dx)}" cy="${fx(yc + k * (dx / Rr) * (dx / Rr))}" rx="${fx(r * cp)}" ry="${r}" fill="${col}" stroke="${dark(mm, 0.4)}" stroke-width="1"/>`; };
        hw = dia
          ? S('M112 98 C140 86 180 86 208 98', mm, 4.5) + S('M112 98 C140 86 180 86 208 98', dark(mm, 0.5), 1, { op: 0.6 }) + gem(160, 6, '#7ff3ff')
          : P('M106 84 C122 66 198 66 214 84 L212 92 C196 76 124 76 108 92 Z', metalFill(id), { stroke: dark(mm, 0.5), sw: 1.4 }) + gem(126, 3, '#ff6fae') + gem(160, 4.5, '#7ff3ff') + gem(194, 3, '#ff6fae');
        if (bald || L.hairFront === 'katonai' || L.hairFront === 'felnyirt') { const yb = dia ? 96 : 86, sc = (Rs(yb) + 2) / Rr; hw = `<g transform="translate(160 ${yb}) scale(${fx(sc)} 1) translate(-160 ${-yb})">${hw}</g>`; }
      } else if (c >= 0) hw = cylSvg(headwearFront(L.headwear, L, id), bald ? (x, y) => cylX(x, Rs(y) + 3, th) : hairMap);
      else {
        // hátulról a pánt hátsó íve látszik (a díszek elöl vannak, a fej takarja őket)
        const mm = METAL[L.metal] ? METAL[L.metal][1] : '#e8b94a';
        const back = { diadem: S('M112 98 C140 92 180 92 208 98', mm, 4.5) + S('M112 98 C140 92 180 92 208 98', dark(mm, 0.5), 1, { op: 0.6 }),
          abroncs: P('M106 86 C122 78 198 78 214 86 L212 94 C196 86 124 86 108 94 Z', metalFill(id), { stroke: dark(mm, 0.5), sw: 1.4 }),
          koszoru: headwearFront('koszoru', L, id) }[L.headwear] || '';
        hw = cylSvg(back, (x, y) => cylX(x, bald ? Rs(y) + 3 : Rh(y), th - Math.PI * (th > 0 ? 1 : -1)));
      }
    }

    // hátulról / oldalról a koponyát a haj borítja: a fej azon része, ami nem esik az arc-ablakba
    let dome = '';
    if (turned && L.headwear === 'sisak' && c >= 0) {
      // oldalról a sisak egyetlen héj (egy körvonal), benne az arcnyílás a vonásokkal együtt fordul
      const mm = METAL[L.metal] ? METAL[L.metal][1] : '#cfd6ea';
      const OPEN = 'M120 110 C128 102 142 98 152 102 L156 108 L164 108 L168 102 C178 98 192 102 200 110 C198 128 198 148 202 172 L118 172 C122 148 122 128 120 110 Z';
      hw = `<g transform="translate(${fx(160 + 6 * sn)} 0) scale(${fx(sg * (0.82 + 0.18 * ac))} 1) translate(-160 0)">${headwearFront('sisak', L, id, { plumeOnly: true })}</g>` +
        `<mask id="${id}-helmopen" maskUnits="userSpaceOnUse" x="-100" y="-150" width="520" height="640"><rect x="-100" y="-150" width="520" height="640" fill="#fff"/><path d="${pmap(OPEN, skinMap)}" fill="#000"/></mask>` +
        `<g mask="url(#${id}-helmopen)">${shaded(id, 'M102 122 C96 58 126 34 160 34 C194 34 224 58 218 122 C216 146 206 162 190 168 L130 168 C114 162 104 146 102 122 Z', metalFill(id), { base: mm, stroke: dark(mm, 0.55), off: [-8, -6] })}</g>` +
        `<clipPath id="${id}-helmshell"><path d="M102 122 C96 58 126 34 160 34 C194 34 224 58 218 122 C216 146 206 162 190 168 L130 168 C114 162 104 146 102 122 Z"/></clipPath><path clip-path="url(#${id}-helmshell)" d="${pmap(OPEN, skinMap)}" fill="none" stroke="${dark(mm, 0.55)}" stroke-width="2.2"/>` +
        S(pmap('M106 104 C126 92 194 92 214 104', hairMap), dark(mm, 0.45), 1.6, { op: 0.8 }) + S(pmap('M120 60 C132 46 148 40 158 40', hairMap), light(mm, 0.6), 3, { op: 0.6 }) +
        [[112, 104], [128, 98], [192, 98], [208, 104], [110, 136], [210, 136]].map(([x, y]) => feat(x, y, `<circle cx="${x}" cy="${y}" r="2.2" fill="${light(mm, 0.4)}" stroke="${dark(mm, 0.5)}" stroke-width="0.8"/>`, 0.15)).join('') +
        feat(160, 120, shaded(id, 'M155 100 L165 100 L163.5 136 L160 141 L156.5 136 Z', metalFill(id), { base: mm, stroke: dark(mm, 0.55), off: [-2, -2], rim: 1.2 }), 0.1);
    }
    // rövid haj hajvonala a fej körül: a fül fölött ívben, hátul a tarkón lejjebb (csak a látható félhengeren)
    const shortLine = () => {
      const HL = [[0, 118], [70, 118], [90, 103], [110, 128], [140, 166], [180, 178]];
      const h = a => { a = Math.abs(a); for (let i = 1; i < HL.length; i++) if (a <= HL[i][0]) { const t = (a - HL[i - 1][0]) / (HL[i][0] - HL[i - 1][0]); return HL[i - 1][1] + (HL[i][1] - HL[i - 1][1]) * t; } return 162; };
      const pts = [];
      for (let p = -90; p <= 90; p += 7.5) { let f = p - yawD; while (f > 180) f -= 360; while (f < -180) f += 360; pts.push([fx(160 + 52 * Math.sin(p * Math.PI / 180)), fx(h(f))]); }
      return `M20 -60 L300 -60 L300 ${pts[pts.length - 1][1]} ` + pts.slice().reverse().map(q => `L${q[0]} ${q[1]}`).join(' ') + ` L20 ${pts[0][1]} Z`;
    };
    const shortHair = L.hairBack === 'nincs' || L.hairBack === 'konty' || (male && L.hairBack === 'rovid'), xb = 160 - 40 * sn;
    if (turned && !bald && !hood && L.headwear !== 'sisak' && (FH || L.hairBack !== 'nincs')) {
      const win = ' ' + pmap(headD, winMap);
      dome = `<clipPath id="${id}-dome"><path clip-rule="evenodd" d="M-60 -120 L380 -120 L380 520 L-60 520 Z${win}"/></clipPath>` +
        `<clipPath id="${id}-nape"><path d="${shortHair ? shortLine() : (k => `M20 -60 L300 -60 L300 ${150 + k} C250 ${156 + k} 200 ${166 + k} 160 ${168 + k} C120 ${166 + k} 70 ${156 + k} 20 ${150 + k} Z`)(fx(60 * Math.max(0, Math.min(1, -c / 0.42))))}"/></clipPath>` +
        // a koponya körvonalát a haj alatt eltakarjuk (különben vékony ív látszana a hajban); elöl az ablak kicsit nagyobb, ott marad a vonal
        `<clipPath id="${id}-dome2"><path clip-rule="evenodd" d="M-60 -120 L380 -120 L380 520 L-60 520 Z ${pmap(headD, (x, y) => cylX(x, Rs(y) + 5, th, Aw))}"/></clipPath>` +
        (FH && FH.under ? '' : `<g clip-path="url(#${id}-dome2)"><g clip-path="url(#${id}-nape)"><path d="${headD}" fill="none" stroke="url(#${id}-hair)" stroke-width="6"/></g></g>`) +
        `<g clip-path="url(#${id}-dome)"><g clip-path="url(#${id}-nape)"><g clip-path="url(#${id}-headclip)">${FH && FH.under ? `<path d="${headD}" fill="${L.skin}"/><path d="${headD}" fill="${dark(L.hair, 0.12)}" opacity="0.55"/>` : `<path d="${headD}" fill="url(#${id}-hair)"/>`}` +
        S(`M${fx(150 - 30 * sn)} 76 C${fx(146 - 24 * sn)} 100 ${fx(150 - 20 * sn)} 124 ${fx(146 - 26 * sn)} 146 M${fx(172 - 30 * sn)} 78 C${fx(176 - 24 * sn)} 104 ${fx(172 - 20 * sn)} 128 ${fx(176 - 26 * sn)} 150`, dark(L.hair, 0.3), 1, { op: 0.3 }) + `</g></g></g>`;
    }
    if (dome && L.headwear === 'suveg') dome = `<g clip-path="url(#${id}-hatline2)">${dome}</g>`;
    // profilban az orr és az ajak kiáll az arc körvonalából
    let profile = '';
    const pv = turned ? Math.max(0, Math.min(1, (Math.abs(sn) - 0.8) / 0.14, (c + 0.3) / 0.3)) : 0;
    if (pv > 0.02 && !hideMouth) {
      const xs = sn > 0 ? 1 : -1, bx = y => 160 + Rs(y) * sn, t = 5.5 * pv;
      const outer = `M${fx(bx(121))} 121 L${fx(bx(137) + xs * t)} 137.5 C${fx(bx(140) + xs * t * 0.9)} 140.5 ${fx(bx(142) + xs * t * 0.3)} 142.5 ${fx(bx(143) - xs * 0.5)} 143`;
      profile = `<path d="${outer} L${fx(bx(143) - xs * 4)} 143 L${fx(bx(121) - xs * 4)} 121 Z" fill="${L.skin}"/>` +
        `<path d="${outer}" fill="none" stroke="${line(L.skin)}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
        S(`M${fx(bx(153) - xs * 6)} 153.2 L${fx(bx(153) - xs * 0.8)} 152.6`, male ? dark(mix(L.skin, '#8a4a3a', 0.35), 0.35) : dark(mix(L.skin, '#c0405a', 0.45), 0.25), 2, { op: pv });
    }
    const faceG = face;
    const frontG = turned ? (c > -0.42 ? front : '') : front;
    const browG = brows;
    const HS = `translate(160 ${male ? 182 : 178}) scale(${male ? 1.0 : 1.1}) translate(-160 -178)`;
    const backView = c < 0;
    // hátulról a fejtetőn ülő dolgok (kalap, sisak, pánt, állatfül, szarv) a hátsó haj FÖLÉ kerülnek, különben a haj eltakarná őket
    const topOver = turned && c < -0.42, headTop = `${animal}${horns}${hw}`;
    const headInner = turned ? `${earsBack}${hornsBack}${headSkin}${profile}${faceG}${dome}${frontG}${browG}${earsFront}${topOver ? '' : headTop}` : `${headSkin}${face}${front}${brows}${animal}${earsFront}${horns}${hw}`;
    const headG = `<g class="r-head" style="transform-origin:160px 176px"><g transform="${HS}">${headInner}</g></g>`;
    const headTopG = topOver ? `<g class="r-head" style="transform-origin:160px 176px"><g transform="${HS}">${headTop}</g></g>` : '';
    const capY = L.headwear === 'suveg' ? 74 : L.headwear === 'sisak' ? 118 : null;
    // sisaknál: a perem alól kilógó haj + a héj belseje (azt úgyis takarja); hátulról a héj ugyanúgy szűkül, mint a rajza
    const shellT = turned && c < 0 ? ` translate(${fx(160 + 6 * sn)} 0) scale(${fx(sg * (0.82 + 0.18 * ac) * 1.06)} 1) translate(-160 0)` : '';
    const shortUnder = ['rovid', 'konty', 'nincs'].indexOf(L.hairBack) >= 0;
    const capRegion = L.headwear === 'sisak' && shortUnder ? `<path transform="${HS}" d="M-100 172 L420 172 L420 600 L-100 600 Z"/>` : L.headwear === 'sisak' ? `<path transform="${HS}${shellT}" d="M104 126 L216 126 L262 214 L420 240 L420 600 L-100 600 L-100 240 L58 214 Z"/>` : `<path transform="${HS}" d="M-100 ${capY} L420 ${capY} L420 600 L-100 600 Z"/>`;
    const capClip = capY == null ? '' : `<clipPath id="${id}-capline">${capRegion}</clipPath><clipPath id="${id}-hatline2"><path d="M-100 74 L420 74 L420 600 L-100 600 Z"/></clipPath>`;
    let hairBackG = `<g class="r-hairback" style="transform-origin:160px 120px"><g transform="${HS}">${hairBack}</g></g>`;
    // a sisak alól kilógó haj a sisaknál ne legyen szélesebb (különben a perem mellett vízszintesen levágott tincs látszana)
    const squeeze = L.headwear === 'sisak' ? ' translate(160 0) scale(0.9 1) translate(-160 0)' : '';
    if (capY != null) hairBackG = `${capClip}<g class="r-head" style="transform-origin:160px 176px"><g clip-path="url(#${id}-capline)"><g transform="${HS}${squeeze}">${hairBack}</g></g></g>`;
    hairBackG += hoodBack ? `<g class="r-head" style="transform-origin:160px 176px"><g transform="${HS}">${hoodBack}</g></g>` : '';
    const scaleT = `translate(160 420) scale(${hs}) translate(-160 -420)`;
    const tall = L.headwear === 'suveg' || L.headwear === 'sisak' || (!covered && (['sarlo', 'demon', 'agancs'].indexOf(L.horns) >= 0 || L.ears === 'hosszutunde' || L.ears === 'roka' || L.hairFront === 'tuskes' || L.hairFront === 'irokez' || L.hairFront === 'felfesult'));
    // mellkép (opts.bust): fej + váll + mellkas, 6:7 arányban; a magasság szerinti nagyítást (hs) is követi
    let vb = opts.portrait ? (tall ? '66 -28 188 218' : '86 20 148 170') : '0 -40 320 480';
    if (opts.bust) {
      // azonos szélesség (a fej mindig ugyanakkora); magas fejfedőnél csak feljebb csúszik a kivágás
      const bx = tall ? [52, -24, 216, 252] : [52, 8, 216, 252];
      vb = [160 + (bx[0] - 160) * hs, 420 + (bx[1] - 420) * hs, bx[2] * hs, bx[3] * hs].map(v => fx(v)).join(' ');
    }
    // rétegsorrend a mélység szerint
    const behindArms = (zArmL < -0.15 ? armL : '') + (zArmR < -0.15 ? armR : '');
    const frontArmL = zArmL < -0.15 ? '' : armL, frontArmR = zArmR < -0.15 ? '' : armR;
    let layers;
    if (opts.headOnly) layers = backView && c < -0.42 ? `${neck}${headG}${hairBackG}${headTopG}` : `${hairBackG}${neck}${headG}`;
    else if (!backView) layers = `${auraB}${wingsB}${capeB}${tailB}${hairBackG}${quiverB}${behindArms}${body}${frontArmL}${neck}${frontArmR}${headG}`;
    // a hátsó haj csak a profilon túl (≈115°-tól) kerül a fej elé, addig az arc oldalt még látszik
    else layers = `${auraB}${behindArms}${body}${frontArmL}${frontArmR}${neck}${capeB}${quiverB}${c < -0.42 ? headG + hairBackG + headTopG : hairBackG + headG}${tailB}${wingsB}`;
    return `<svg class="rig wpn-${cls}${+L.weapon || 0}${opts.cls ? ' ' + opts.cls : ''}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(h.name || 'Hős')}">${defs}${opts.bust ? bustBack(vb, L, id) : ''}
      ${opts.headOnly || opts.bust ? '' : `<ellipse class="r-shadow" cx="160" cy="420" rx="${turned ? fx(70 * (0.75 + 0.25 * ac)) : 70}" ry="10" fill="#05071a" opacity="0.55"/>`}
      <g transform="${scaleT}"><g class="r-root"><g class="r-body" style="transform-origin:160px 420px">
        ${layers}
      </g></g></g>${opts.headOnly ? '' : auraFront(L.aura)}${opts.bust ? bustFront(vb, id) : ''}</svg>`;
  }
  // mellkép háttere: a ruha színéből kevert mély tónus, mögötte holdfény-glória, néhány csillag; elöl alul sötétedő perem
  function bustBack(vb, L, id) {
    const q = v => +(+v).toFixed(2);
    const [x, y, w, h] = vb.split(' ').map(Number), cx = x + w / 2;
    const base = mix(L.c1 || '#3a4c96', '#141a44', 0.62), deep = mix(base, '#05071a', 0.55), glow = mix(L.c1 || '#8fa0ff', '#dfe6ff', 0.55);
    const stars = [[0.12, 0.14, 1.3], [0.86, 0.1, 1.6], [0.8, 0.32, 1], [0.18, 0.4, 0.9], [0.92, 0.55, 1.1], [0.06, 0.62, 1.2]]
      .map(([a, b, r]) => `<circle cx="${q(x + a * w)}" cy="${q(y + b * h)}" r="${q(r * w / 200)}" fill="#e8ecff" opacity="0.7"/>`).join('');
    return `<defs><radialGradient id="${id}-bbg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="${base}"/><stop offset="1" stop-color="${deep}"/></radialGradient>
      <radialGradient id="${id}-bglow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${glow}" stop-opacity="0.55"/><stop offset="0.55" stop-color="${glow}" stop-opacity="0.16"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}-bfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.7" stop-color="#05071a" stop-opacity="0"/><stop offset="1" stop-color="#05071a" stop-opacity="0.7"/></linearGradient></defs>
      <rect x="${q(x - 2)}" y="${q(y - 2)}" width="${q(w + 4)}" height="${q(h + 4)}" fill="url(#${id}-bbg)"/>${stars}
      <circle cx="${q(cx)}" cy="${q(y + h * 0.42)}" r="${q(w * 0.5)}" fill="url(#${id}-bglow)"/>`;
  }
  function bustFront(vb, id) {
    const q = v => +(+v).toFixed(2);
    const [x, y, w, h] = vb.split(' ').map(Number);
    return `<rect x="${q(x - 2)}" y="${q(y - 2)}" width="${q(w + 4)}" height="${q(h + 4)}" fill="url(#${id}-bfade)"/>`;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  // Íjhúzás közben a húr a két íjvégtől a húzó kézig feszül (V alak). A két végpont és a kéz külön karban van,
  // ezért a húrt a pozícióikból képkockánként számoljuk ki, a test (r-root) koordinátáiban.
  function bowString(svg, ms, cls) {
    if (!svg || !svg.querySelector('.r-bowR')) return;
    const rootG = svg.querySelector('.r-root'), body = svg.querySelector('.r-body'), A = svg.querySelector('.r-tipA'), B = svg.querySelector('.r-tipB'), H = svg.querySelector('.r-pull'), nock = svg.querySelector('.r-nock'), str = svg.querySelector('.r-bstr');
    if (!rootG || !A || !B || !H) return;
    const NS = 'http://www.w3.org/2000/svg', mk = (c, attrs) => { const e = document.createElementNS(NS, 'path'); e.setAttribute('class', c); for (const k in attrs) e.setAttribute(k, attrs[k]); rootG.appendChild(e); return e; };
    let path = rootG.querySelector('.r-vstring');
    if (!path) path = mk('r-vstring', { fill: 'none', stroke: '#efe4cc', 'stroke-width': '1.4', 'stroke-linejoin': 'round' });
    // a felajzott nyílvesszőt is itt rajzoljuk: a húzó kéztől az íj markolatán át, a hegye kilóg az íj elé
    let shaft = rootG.querySelector('.r-vshaft'), head = rootG.querySelector('.r-vhead'), flet = rootG.querySelector('.r-vflet');
    if (!shaft) { shaft = mk('r-vshaft', { fill: 'none', stroke: '#c8a46a', 'stroke-width': '2.6', 'stroke-linecap': 'round' }); flet = mk('r-vflet', { fill: 'none', stroke: '#e8e6f2', 'stroke-width': '1.5' }); head = mk('r-vhead', { fill: '#cfd6ea', stroke: '#5a5f78', 'stroke-width': '0.8' }); }
    if (nock) nock.querySelectorAll('path').forEach(e => { e.style.display = 'none'; });
    // a húzó kéz az arc elé kerül (az állhoz húzza a húrt), utána visszakerül a helyére
    const arm = svg.querySelector('.r-arm-l'); let top = arm; while (top && top.parentNode !== body) top = top.parentNode;
    const back = top && top.nextSibling; if (top) body.appendChild(top);
    const restore = () => { if (top && top.parentNode === body && back && back.parentNode === body) body.insertBefore(top, back); };
    const end = performance.now() + (cls ? 20000 : (ms || 1500));
    const P = el => { const m = el.getScreenCTM(), inv = rootG.getScreenCTM().inverse(); return new DOMPoint(+el.getAttribute('cx'), +el.getAttribute('cy')).matrixTransform(m).matrixTransform(inv); };
    const f = v => v.toFixed(1);
    const hide = () => { path.style.opacity = 0; shaft.style.opacity = 0; head.style.opacity = 0; flet.style.opacity = 0; if (str) str.style.opacity = ''; };
    const tick = () => {
      if (!svg.isConnected) return;
      const drawn = nock && parseFloat(getComputedStyle(nock).opacity) > 0.5;
      if (drawn) {
        const a = P(A), b = P(B), h = P(H);
        path.setAttribute('d', `M${f(a.x)} ${f(a.y)} L${f(h.x)} ${f(h.y)} L${f(b.x)} ${f(b.y)}`);
        // a markolat a két íjvég között, a húr vonalától kicsit előrébb
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; let dx = mx - h.x, dy = my - h.y; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
        const L = Math.max(104, dl + 34), tx = h.x + dx * L, ty = h.y + dy * L, nx = -dy, ny = dx;
        shaft.setAttribute('d', `M${f(h.x)} ${f(h.y)} L${f(tx - dx * 8)} ${f(ty - dy * 8)}`);
        head.setAttribute('d', `M${f(tx)} ${f(ty)} L${f(tx - dx * 11 + nx * 4.5)} ${f(ty - dy * 11 + ny * 4.5)} L${f(tx - dx * 11 - nx * 4.5)} ${f(ty - dy * 11 - ny * 4.5)} Z`);
        const fx = (t, s) => `${f(h.x + dx * t + nx * s)} ${f(h.y + dy * t + ny * s)}`;
        flet.setAttribute('d', `M${fx(2, 4)} L${fx(9, 0)} L${fx(2, -4)} M${fx(8, 4)} L${fx(15, 0)} L${fx(8, -4)}`);
        path.style.opacity = 1; shaft.style.opacity = 1; head.style.opacity = 1; flet.style.opacity = 1; if (str) str.style.opacity = 0;
      } else { path.style.opacity = 0; shaft.style.opacity = 0; head.style.opacity = 0; flet.style.opacity = 0; if (str) str.style.opacity = ''; }
      if (performance.now() < end && (!cls || svg.classList.contains(cls))) requestAnimationFrame(tick); else { hide(); restore(); }
    };
    requestAnimationFrame(tick);
  }

  root.NYX = root.NYX || {};
  root.NYX.rig = {
    bowString: bowString,
    hero: hero, defaultLook: defaultLook, randomLook: randomLook, OPTIONS: OPTIONS, HAIR_PARTS: HAIR_PARTS, HAIRSTYLES: HAIRSTYLES, hairStyleOf: hairStyleOf, applyHairStyle: applyHairStyle, COLOR_SLOTS: COLOR_SLOTS, METAL: METAL,
    SKIN: SKIN, HAIR: HAIR, EYES: EYES, CLOTH: CLOTH, HORN_COLORS: HORN_COLORS, WEAPON_NAMES: WEAPON_NAMES, OUTFIT_NAMES: OUTFIT_NAMES,
    mix: mix, dark: dark, light: light, line: line, mirror: mirror, starAt: starAt, esc: esc, shaded: shaded, P: P, S: S, lock: lock, sunAt: sunAt, leafAt: leafAt
  };
})(typeof window !== 'undefined' ? window : globalThis);
