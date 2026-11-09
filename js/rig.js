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
    wings: { label: 'Szárny', items: { nincs: 'Nincs', tunder: 'Tündérszárny', denever: 'Denevérszárny', feny: 'Fényszárny', toll: 'Tollszárny', kristaly: 'Kristályszárny', lang: 'Lángszárny', holdezust: 'Holdezüst szárny', csillag: 'Csillagszárny', arny: 'Árnyszárny' } },
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
      if (L.gset && SET_ACC[L.gset] && !uniqP(L)) s += setGreaves(gearCtx(L, id, L.gset, L.gtier), ARMOR_TYPE[cls] || 'v');
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
      return s + gearTorsoSvg(cls, L, id, isRobe, true);
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
    return s + gearTorsoSvg(cls, L, id, isRobe, false);
  }
  const UNIQ_P = ['Holdpáncél', 'Éjszövet Köpeny', 'Sárkánypikkely Mellvért', 'Csillagfátyol Köntös', 'Csillaghullás-köpeny'];
  function uniqP(L) { const n = L.uniqP && uniqName(L.uniqP); return n && UNIQ_P.indexOf(n) >= 0 ? n : null; }
  function gearTorsoSvg(cls, L, id, isRobe, back) {
    const u = uniqP(L), a = L.uniqA && uniqName(L.uniqA);
    let s = '';
    if (u) s += uniqTorso(u, id, L, isRobe, back);
    else if (L.gset && SET_ACC[L.gset]) s += setTorso(gearCtx(L, id, L.gset, L.gtier), ARMOR_TYPE[cls] || 'v', isRobe, back, cls);
    if (a && !back) s += uniqAmulet(a, id, L);
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
    const key = cls + v;
    let s = weaponBase(cls, v, L, id);
    if (key === 'vadasz0' || key === 'vadasz1') return s; // az íj díszeit a leftGripSvg rajzolja
    const U = L.uniqW && UNIQ_W[uniqName(L.uniqW)];
    if (U && U.blade) s = s.split(`url(#${id}-metal)`).join(`url(#${id}-umetal)`);
    return s + weaponDecor(key, L, id);
  }
  function weaponDecor(key, L, id) {
    const A = WANCH[key];
    if (!A) return '';
    let s = '';
    const U = L.uniqW && UNIQ_W[uniqName(L.uniqW)];
    if (L.wset && SET_ACC[L.wset] && !U) s += setWeaponDecor(A, gearCtx(L, id, L.wset, L.wtier));
    if (U) s += uniqWeaponDecor(A, uniqName(L.uniqW), id);
    return s;
  }
  function weaponBase(cls, v, L, id) {
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
          S('M84 150 L80 144 M84 410 L80 416', '#3a2418', 3) + S('M82 148 L82 412', '#efe4cc', 1.1) + weaponDecor('vadasz0', L, id);
      case 'vadasz1': // reflexíj: visszahajló végek
        return S('M90 196 C82 202 80 196 84 190 M90 362 C82 356 80 362 84 368', '#3a2418', 5) + S('M90 196 C118 230 118 328 90 362', '#3a2418', 7) + S('M90 196 C118 230 118 328 90 362', '#5a3a20', 4) +
          P('M100 268 L114 268 L114 290 L100 290 Z', '#2f6b4f', { sw: 1.2 }) + S('M86 192 L86 366', '#efe4cc', 1.1) + weaponDecor('vadasz1', L, id);
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
      case 'u_ejszovet': { // Éjszövet Köpeny: éjszín, csillagképekkel hímzett, hosszú köpeny
        const d = 'M116 188 C92 250 78 340 72 410 C110 424 210 424 248 410 C242 340 228 250 204 188 Z';
        return shaded(id, d, '#241c48', { off: [-8, -6] }) + P('M116 194 C100 250 90 330 86 402 L102 406 C106 330 112 250 122 198 Z', '#5a3e9e', { stroke: false }) +
          [[100, 300], [220, 330], [116, 372], [204, 260], [92, 392], [228, 394], [110, 240], [160, 360], [184, 300]].map(([x, y], i) => `<path class="r-twinkle" style="animation-delay:-${(i * 0.37).toFixed(2)}s;transform-origin:${x}px ${y}px" d="${starD(x, y, 2 + (i % 3), 4, 0.3)}" fill="${i % 2 ? '#e8ecff' : '#9fb0ff'}"/>`).join('') +
          S('M100 300 L116 372 L92 392 M204 260 L184 300 L220 330', '#9fb0ff', 0.8, { op: 0.5 });
      }
      case 'u_csillaghullas': { // mitikus Csillaghullás-köpeny: mélykék, hulló csillagok csóvával, arany szegély
        const d = 'M114 188 C88 250 74 340 66 414 C108 428 212 428 254 414 C246 340 232 250 206 188 Z';
        let s = shaded(id, d, '#141c4a', { off: [-8, -6] }) + S('M66 414 C108 428 212 428 254 414', '#e0b44a', 3) + P('M114 194 C98 250 86 330 80 406 L96 410 C100 330 108 250 120 198 Z', '#2c3a8c', { stroke: false });
        s += [[96, 260], [214, 300], [128, 340], [190, 380], [236, 360]].map(([x, y], i) => `<g class="r-twinkle" style="animation-delay:-${(i * 0.53).toFixed(2)}s;transform-origin:${x}px ${y}px">${S(`M${x} ${y} L${x - 22} ${y - 26}`, '#ffe2a0', 1.6, { op: 0.6 })}<path d="${starD(x, y, 4 + (i % 2) * 2)}" fill="#fff4cf"/></g>`).join('');
        return s + [[110, 300], [200, 240], [150, 380], [226, 400], [90, 380], [170, 290]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${1 + (i % 2)}" fill="#e8ecff" opacity="0.8"/>`).join('');
      }
      case 'u_fatyol': // Csillagfátyol Köntös hátsó fátyla
        return `<path d="M118 188 C96 250 84 340 78 412 C116 424 204 424 242 412 C236 340 224 250 202 188 Z" fill="#d8ccff" opacity="0.4" stroke="#b8a8f0" stroke-width="1.2"/>` +
          [[104, 300], [214, 330], [130, 380], [196, 260], [160, 340]].map(([x, y], i) => `<path class="r-twinkle" style="animation-delay:-${(i * 0.41).toFixed(2)}s;transform-origin:${x}px ${y}px" d="${starD(x, y, 2.4 + (i % 2), 4, 0.3)}" fill="#fff"/>`).join('');
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
    return wingsExtra(w, id);
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

  // ---------- felszerelés: régiós szettek és egyedi (legendás / mitikus) darabok ----------
  // A páncél TÍPUSA a kasztból jön (n = nehéz, k = könnyű, v = varázsló), a SZETT a régióból (forma + motívum),
  // a FOKOZAT (0 zöld, 1 kék, 2 lila, 3 legendás) a díszességet. A szett a kaszt ruhája FÖLÉ kerül (vállvért,
  // mellvért, öv, csípővért, gallér, karvédő, lábvért), így a ruha szabása alatta megmarad.
  const GOLD = '#e0b44a';
  const SET_ACC = { kodlap: '#c9d38a', holdfeny: '#dfe9ff', arnyromok: '#b48cff', szirtek: '#7fe8ff', ejkatlan: '#ff2e4a' };
  const ARMOR_TYPE = { harcos: 'n', alakvalto: 'n', vadasz: 'k', orgyilkos: 'k', magus: 'v', gyogyito: 'v', idezo: 'v', dalnok: 'v' };
  const DEG = Math.PI / 180;
  const f2 = v => +(+v).toFixed(2);
  // abszolút útvonal pontjainak eltolása és nagyítása (kx < 0: tükrözés) – a fényirány a világkoordinátában marad
  function aff(d, ox, oy, kx, ky) { return d.replace(/(-?\d*\.?\d+)[\s,]+(-?\d*\.?\d+)/g, (q, a, b) => `${f2(ox + a * kx)} ${f2(oy + b * ky)}`); }
  function axis(x, y, ang) { const dx = Math.cos(ang * DEG), dy = Math.sin(ang * DEG); return (a, b) => `${f2(x + dx * a - dy * b)} ${f2(y + dy * a + dx * b)}`; }
  function leafP(x, y, len, ang, w) { const p = axis(x, y, ang); return `M${p(0, 0)} Q${p(len * 0.42, w * 1.3)} ${p(len, 0)} Q${p(len * 0.42, -w * 1.3)} ${p(0, 0)} Z`; }
  function shardP(x, y, len, ang, w) { const p = axis(x, y, ang); return `M${p(0, w)} L${p(len * 0.7, w * 0.9)} L${p(len, 0)} L${p(len * 0.66, -w * 0.95)} L${p(0, -w)} Z`; }
  function shardHi(x, y, len, ang, w) { const p = axis(x, y, ang); return `M${p(len * 0.08, w * 0.15)} L${p(len * 0.68, w * 0.1)} L${p(len * 0.96, 0)}`; }
  function spikeP(x, y, len, ang, w, bend) { const p = axis(x, y, ang), b = bend || 0; return `M${p(0, w)} Q${p(len * 0.55, w * 0.45 + b)} ${p(len, b)} Q${p(len * 0.5, -w * 0.4 + b)} ${p(0, -w)} Z`; }
  function capsP(x1, y1, x2, y2, r) {
    const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, nx = -uy * r, ny = ux * r;
    return `M${f2(x1 + nx)} ${f2(y1 + ny)} L${f2(x2 + nx)} ${f2(y2 + ny)} Q${f2(x2 + ux * r * 1.6 + nx)} ${f2(y2 + uy * r * 1.6 + ny)} ${f2(x2 + ux * r * 1.6)} ${f2(y2 + uy * r * 1.6)} Q${f2(x2 + ux * r * 1.6 - nx)} ${f2(y2 + uy * r * 1.6 - ny)} ${f2(x2 - nx)} ${f2(y2 - ny)} L${f2(x1 - nx)} ${f2(y1 - ny)} Q${f2(x1 - ux * r * 1.6 - nx)} ${f2(y1 - uy * r * 1.6 - ny)} ${f2(x1 - ux * r * 1.6)} ${f2(y1 - uy * r * 1.6)} Q${f2(x1 - ux * r * 1.6 + nx)} ${f2(y1 - uy * r * 1.6 + ny)} ${f2(x1 + nx)} ${f2(y1 + ny)} Z`;
  }
  // holdsarló: a domború oldala rot irányába néz; off: a belső ív középpontjának hátratolása (vastagság)
  function crescentP(x, y, r, rot, off) {
    off = off == null ? 0.42 : off;
    const pt = (cx, cy, rr, a) => `${f2(cx + rr * Math.cos(a * DEG))} ${f2(cy + rr * Math.sin(a * DEG))}`;
    const span = 128, c2x = x - Math.cos(rot * DEG) * off * r, c2y = y - Math.sin(rot * DEG) * off * r;
    const ax = x + r * Math.cos((rot + span) * DEG), ay = y + r * Math.sin((rot + span) * DEG);
    const r2 = Math.hypot(ax - c2x, ay - c2y), aI = Math.atan2(ay - c2y, ax - c2x) / DEG;
    let dI = aI - rot; while (dI > 180) dI -= 360; while (dI < -180) dI += 360;
    let d = '';
    for (let i = 0; i <= 12; i++) d += (i ? 'L' : 'M') + pt(x, y, r, rot + span - 2 * span * i / 12) + ' ';
    for (let i = 1; i < 12; i++) d += 'L' + pt(c2x, c2y, r2, rot - dI + 2 * dI * i / 12) + ' ';
    return d + 'Z';
  }
  function starD(x, y, r, n, ins) { n = n || 5; ins = ins || 0.45; let d = ''; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r * ins : r; d += (i ? 'L' : 'M') + f2(x + Math.cos(a) * rr) + ' ' + f2(y + Math.sin(a) * rr) + ' '; } return d + 'Z'; }
  function gemSvg(x, y, r, c, id, glow) { // csiszolt drágakő: rombusz lapokkal
    const d = `M${f2(x)} ${f2(y - r)} L${f2(x + r * 0.8)} ${f2(y)} L${f2(x)} ${f2(y + r)} L${f2(x - r * 0.8)} ${f2(y)} Z`;
    return (glow ? `<g opacity="0.35"><circle class="r-glow" cx="${f2(x)}" cy="${f2(y)}" r="${f2(r * 1.9)}" fill="${c}" filter="url(#${id}-blur3)"/></g>` : '') +
      P(d, c, { stroke: dark(c, 0.55), sw: 1.1 }) + `<path d="M${f2(x - r * 0.8)} ${f2(y)} L${f2(x)} ${f2(y - r * 0.35)} L${f2(x + r * 0.8)} ${f2(y)} M${f2(x)} ${f2(y - r)} L${f2(x)} ${f2(y - r * 0.35)}" fill="none" stroke="${light(c, 0.6)}" stroke-width="0.8" opacity="0.9"/>` +
      `<path d="M${f2(x)} ${f2(y - r)} L${f2(x - r * 0.8)} ${f2(y)} L${f2(x)} ${f2(y - r * 0.35)} Z" fill="#fff" opacity="0.45"/>`;
  }
  function gearCtx(L, id, set, tier) {
    const m = METAL[L.metal] ? METAL[L.metal][1] : '#cfd6ea', t = Math.max(0, Math.min(3, Math.round(+tier) || 0));
    const g = { set: set, t: t, id: id, m: m, c1: L.c1, c2: L.c2, acc: SET_ACC[set] || '#cfd8ff' };
    const gt = c => t >= 3 ? GOLD : c;
    if (set === 'kodlap') { g.mat = mix(L.c2, '#6e5236', 0.6); g.bone = '#ebe1c6'; g.reed = '#a3ad5c'; g.fur = mix(L.c2, '#857152', 0.6); g.trim = gt(g.bone); }
    else if (set === 'holdfeny') { g.mat = mix(m, '#e6edff', 0.6); g.bark = '#6b5040'; g.vine = '#6fa06a'; g.trim = gt(light(g.mat, 0.55)); }
    else if (set === 'arnyromok') { g.mat = mix('#8f8a9c', L.c2, 0.18); g.cloth = mix(dark(L.c1, 0.25), '#2a2436', 0.35); g.trim = gt(light(g.mat, 0.35)); }
    else if (set === 'szirtek') { g.mat = mix('#3d3850', m, t >= 3 ? 0.12 : 0.3); g.trim = gt(light(g.mat, 0.45)); }
    else { g.set = 'ejkatlan'; g.acc = SET_ACC.ejkatlan; g.mat = mix('#1d1a28', m, t >= 3 ? 0.08 : 0.2); g.trim = gt(mix(g.mat, '#9a98b0', 0.5)); }
    return g;
  }
  function glowLine(g, d, c, w, op) {
    return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${f2(w * 3.2)}" stroke-linecap="round" stroke-linejoin="round" opacity="${op || 0.45}" filter="url(#${g.id}-blur3)"/>` +
      `<path class="r-glow" d="${d}" fill="none" stroke="${light(c, 0.4)}" stroke-width="${f2(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  // romvárosi rúnajelek (változatosan, hogy ne legyen mindenhol ugyanaz)
  const RUNES = ['M-4 -7 L-4 7 M-4 -3 L4 -7 M-4 1 L4 -3', 'M0 -7 L5 0 L0 7 L-5 0 Z M0 -3 L0 3', 'M-4 -7 L-4 7 M4 -7 L4 7 M-4 -7 L4 1 M4 -7 L-4 1', 'M-5 -6 L5 6 M5 -6 L-5 6 M0 -7 L0 7', 'M-3 -7 L3 -7 M0 -7 L0 7 M-4 2 L0 7 L4 2'];
  let RUNE_I = 0;
  const RUNE = RUNES[1];
  function runeAt(x, y, k) { const r = RUNES[(RUNE_I++) % RUNES.length]; return aff(r, x, y, k, k); }

  // ---------- vállvért (a karon ül, minden nézetben) ----------
  function setPauldron(g, type, side) {
    const t = g.t, k = type === 'n' ? 1.1 + t * 0.1 : type === 'k' ? 0.95 + t * 0.07 : 0.88 + t * 0.06;
    const ox = side > 0 ? 205 : 115, oy = 195, kx = side > 0 ? k : -k;
    const D = d => aff(d, ox, oy, kx, k), id = g.id, mat = g.mat;
    const sh = (d, fill, o) => shaded(id, D(d), fill, Object.assign({ off: [-3, -3], rim: 1.6, sw: 1.8 }, o || {}));
    const ln = (d, c, w, o) => S(D(d), c, w, o);
    const dot = (x, y, r, c) => `<circle cx="${f2(ox + x * kx)}" cy="${f2(oy + y * k)}" r="${f2(r * k)}" fill="${c}" stroke="${line(c)}" stroke-width="0.8"/>`;
    let s = '';
    switch (g.set) {
      case 'kodlap': { // bőrrel bebugyolált párna, csontpecek, a lila fokozattól nádcsokor
        if (t >= 2) [[2, -12, 13, -46], [8, -10, 25, -38], [-4, -13, 2, -42]].forEach((r, i) => {
          if (t < 3 && i === 2) return;
          const [a, b, c, e] = r, d = `M${a} ${b} Q${(a + c) / 2 + 3} ${(b + e) / 2} ${c} ${e}`;
          s += ln(d, '#3a3f22', 4) + ln(d, g.reed, 2.2) + sh(capsP(a + (c - a) * 0.6, b + (e - b) * 0.6, a + (c - a) * 0.88, b + (e - b) * 0.88, 2.8), '#7a5230', { rim: 1, off: [-1.5, -1.5], sw: 1.2 }) +
            ln(`M${c} ${e} L${f2(c + (c - a) * 0.12)} ${f2(e + (e - b) * 0.12)}`, '#3a3f22', 1.4);
        });
        if (type === 'n') s += P(D('M-22 4 L-18 15 L-14 9 L-10 18 L-5 11 L0 19 L5 12 L10 18 L14 11 L19 15 L22 6 C10 2 -10 0 -22 4 Z'), g.fur, { sw: 1.4 });
        s += sh('M-21 3 C-19 -13 1 -19 16 -10 C23 -4 25 8 19 14 C8 18 -9 15 -21 3 Z', mat, { off: [-4, -3] });
        s += ln('M-12 -12 C-7 -4 -6 6 -8 15 M-1 -16 C4 -7 5 4 3 16 M10 -13 C14 -5 16 4 13 15', dark(mat, 0.45), 2.4) + ln('M-11 -13 C-6 -5 -5 4 -7 12 M0 -17 C5 -8 6 2 4 13 M11 -14 C15 -6 17 3 14 12', light(mat, 0.3), 0.9, { op: 0.8 });
        if (t >= 1) s += ln('M-4 -6 L-2 6 M9 -4 L10 8', dark(mat, 0.6), 1) + sh(capsP(-8, -2, 3, -5, 2), g.trim, { rim: 1, off: [-1, -1], sw: 1.1 }) + sh(capsP(4, 4, 15, 1, 2), g.trim, { rim: 1, off: [-1, -1], sw: 1.1 });
        if (t >= 3) s += ln('M-10 -7 L-6 -9 M12 -7 L16 -8 M-9 9 L-6 7', GOLD, 2.6);
        break;
      }
      case 'holdfeny': { // ezüst levelek legyezője kéreg alapon, inda
        s += sh('M-18 5 C-16 -9 2 -15 14 -8 C20 -2 20 8 14 12 C4 14 -8 12 -18 5 Z', g.bark, { off: [-3, -2] });
        const leaves = [[-48, 36, 7.5, 2], [-18, 32, 7.5, 0], [12, 31, 7.5, 0], [42, 26, 7, 1], [70, 20, 6, 3]].filter(l => t >= l[3]);
        leaves.forEach(([a, len, w]) => {
          const big = a === -48 ? 1.15 + t * 0.05 : 1;
          s += sh(leafP(-13, -3, len * big, a, w), mat, { off: [-2.5, -2.5], rim: 1.3 }) + ln(`M-13 -3 L${axis(-13, -3, a)(len * big * 0.86, 0)}`, t >= 3 ? GOLD : dark(mat, 0.35), 1.1, { op: 0.85 });
        });
        if (t >= 1) s += ln('M-17 8 C-8 14 6 14 13 9 C17 6 15 1 11 3', g.vine, 2) + sh(leafP(13, 6, 7, -70, 2.6), g.vine, { rim: 0.8, off: [-1, -1], sw: 1 });
        if (t >= 2) s += dot(-13, -3, 2.6, t >= 3 ? GOLD : light(mat, 0.4));
        break;
      }
      case 'arnyromok': { // faragott kőlap lepattant sarokkal, rúnavájat
        if (t >= 2) s += sh('M-16 -12 L-10 -25 L8 -28 L18 -18 L14 -11 L-10 -10 Z', dark(mat, 0.12)) + glowLine(g, D('M-8 -16 L0 -23 L8 -18'), g.acc, 1.4);
        if (type === 'n') s += sh('M-20 8 L20 10 L18 21 L-16 19 Z', dark(mat, 0.15), { rim: 1.2 });
        const slab = 'M-21 -4 L-13 -15 L13 -15 L22 -5 L21 11 L13 16 L-14 15 L-21 8 Z';
        s += sh(slab, mat, { off: [-4, -3] });
        s += P(D('M13 -15 L22 -5 L15 -7 Z'), dark(mat, 0.25), { sw: 1 }) + ln('M-8 -15 L-5 -9 L-8 -3 M15 10 L10 6 L12 2', dark(mat, 0.5), 1.1) + ln('M-19 6 L20 7', dark(mat, 0.35), 1.6) + ln('M-19 -4 L-12 -13 L12 -13', light(mat, 0.4), 1.1, { op: 0.8 });
        { const rr = D(aff(RUNES[side > 0 ? 0 : 2], 1, -3, 0.85, 0.85)); s += t >= 1 ? glowLine(g, rr, g.acc, 1.5) : S(rr, dark(mat, 0.5), 1.6); }
        if (t >= 3) s += S(D(slab), GOLD, 1.5);
        break;
      }
      case 'szirtek': { // meteorvas lemez, kifelé álló kristályszilánkok
        const sh2 = [[3, -10, 20, -82, 5], [11, -6, 17, -50, 4.5], [-6, -10, 15, -112, 4], [16, 0, 13, -22, 3.8]];
        const n = Math.min(4, t + 1), sc = 1 + t * 0.12;
        if (t >= 2) s += `<g opacity="0.3"><circle class="r-glow" cx="${f2(ox + 4 * kx)}" cy="${f2(oy - 18 * k)}" r="${f2(14 * k)}" fill="${g.acc}" filter="url(#${id}-blur3)"/></g>`;
        sh2.slice(0, n).forEach(([x, y, len, a, w]) => { s += sh(shardP(x, y, len * sc, a, w), g.acc, { stroke: dark(g.acc, 0.55), off: [-2, -2], rim: 1.2, sw: 1.3 }) + ln(shardHi(x, y, len * sc, a, w), '#ffffff', 0.9, { op: 0.8 }); });
        s += sh('M-20 4 C-20 -12 0 -18 14 -10 C22 -4 22 8 16 14 C6 18 -10 16 -20 4 Z', mat, { off: [-4, -3] });
        s += ln('M-18 9 C-6 16 8 16 17 9', g.trim, 2.2) + dot(-10, -4, 1.4, dark(mat, 0.4)) + dot(-2, 4, 1.1, dark(mat, 0.4)) + dot(7, -6, 1.2, dark(mat, 0.4)) + ln('M-16 -6 C-12 -12 -4 -15 4 -14', light(mat, 0.45), 1.4, { op: 0.8 });
        if (t >= 1) s += gemSvg(f2(ox + 3 * kx), f2(oy + 3 * k), 3.6 * k, g.acc, id, t >= 2);
        break;
      }
      default: { // éjkatlan: rétegzett fekete acél, tüskék, bíbor izzó illesztés
        const sp = [[6, -9, 21, -66, 4.4, -2], [14, -3, 17, -30, 4, -2], [-4, -11, 16, -100, 3.8, 2]];
        const n = Math.min(3, t + 1), sc = 1 + t * 0.14;
        if (type === 'n') s += sh('M-19 9 C-6 13 8 13 20 16 L17 22 C4 20 -8 19 -18 15 Z', dark(mat, 0.05), { rim: 1.2 });
        s += sh('M-20 4 C-8 7 8 7 20 11 C21 15 18 18 14 19 C2 15 -10 14 -19 10 Z', mat, { rim: 1.3 });
        s += sh('M-21 2 C-19 -12 1 -18 16 -10 C22 -5 23 4 20 9 C8 4 -8 3 -21 2 Z', mat, { off: [-4, -3] });
        s += glowLine(g, D('M-20 3.5 C-8 5.5 8 6 20 10'), g.acc, 1.3) + ln('M-17 -4 C-13 -11 -3 -15 6 -14', light(mat, 0.4), 1.4, { op: 0.8 }) + dot(-12, -1, 1.3, g.trim) + dot(10, 1, 1.3, g.trim);
        sp.slice(0, n).forEach(([x, y, len, a, w, b]) => { s += sh(spikeP(x, y, len * sc, a, w, b), mix(g.mat, '#5a5670', 0.35), { off: [-2, -2], rim: 1.2, sw: 1.4 }) + ln(`M${x} ${y} L${axis(x, y, a)(len * sc * 0.8, b * 0.6)}`, light(mix(g.mat, '#5a5670', 0.35), 0.35), 0.9, { op: 0.8 }); });
        if (t >= 3) s += S(D('M-21 2 C-19 -12 1 -18 16 -10 C22 -5 23 4 20 9'), GOLD, 1.6);
      }
    }
    return s;
  }

  // ---------- karvédő (a mandzsetta fölött) ----------
  const BRACER_R = 'M198 240 C205 245 216 245 223 239 L224.5 262 C218 270 205 270 200 264 Z';
  function setBracer(g, type, side) {
    const t = g.t, id = g.id, mat = g.mat, M = d => side > 0 ? d : mirror(d);
    const sh = (d, fill, o) => shaded(id, M(d), fill, Object.assign({ off: [-3, -2], rim: 1.3, sw: 1.6 }, o || {}));
    const ln = (d, c, w, o) => S(M(d), c, w, o);
    let s = '';
    switch (g.set) {
      case 'kodlap': s += sh(BRACER_R, mat) + ln('M199 247 L222 242 M199 254 L223 249 M200 261 L224 256', dark(mat, 0.45), 1.8) + (t >= 1 ? sh(capsP(205, 252, 215, 251, 1.6), g.trim, { rim: 0.8, off: [-1, -1], sw: 1 }) : ''); break;
      case 'holdfeny': s += sh(BRACER_R, g.bark) + ln('M201 246 C206 252 212 248 218 254 C221 257 220 262 216 262', g.vine, 1.6) + sh(leafP(222, 254, 16 + t * 2, -62, 4), mat, { off: [-2, -2], rim: 1 }); break;
      case 'arnyromok': s += sh('M197 241 L224 238 L225 263 L218 269 L203 269 L199 263 Z', mat) + ln('M199 252 L224 250', dark(mat, 0.4), 1.2) + (t >= 1 ? glowLine(g, M('M207 258 L211 253 L215 258 M211 253 L211 263'), g.acc, 1.2) : ''); break;
      case 'szirtek': s += sh(BRACER_R, mat) + ln('M199 246 C206 251 216 251 223 245', g.trim, 1.6) + sh(shardP(222, 250, 12 + t * 3, -20, 3.4), g.acc, { stroke: dark(g.acc, 0.55), rim: 1, off: [-1.5, -1.5], sw: 1.1 }); break;
      default: s += sh(spikeP(223, 250, 11 + t * 3, -10, 3.2, -1), mix(mat, '#4a4660', 0.3), { rim: 1, off: [-1.5, -1.5], sw: 1.2 }) + sh(BRACER_R, mat) + glowLine(g, M('M199 252 C206 256 216 256 224 251'), g.acc, 1.1);
    }
    if (t >= 3) s += ln('M198 241 C205 246 216 246 223 240', GOLD, 1.8);
    return s;
  }

  // ---------- törzs: mellvért / heveder / stóla, öv, csípővért, gallér, ruhaszegély ----------
  const PLATE = 'M132 197 C148 190 172 190 188 197 L187 238 C179 250 141 250 133 238 Z';
  const BELT = 'M121 259 C146 265 174 265 199 259 L199 268 C174 274 146 274 121 268 Z';
  function setTorso(g, type, isRobe, back, cls) {
    const t = g.t, id = g.id, mat = g.mat, acc = g.acc;
    const sh = (d, fill, o) => shaded(id, d, fill, Object.assign({ off: [-4, -3], rim: 1.6, sw: 1.8 }, o || {}));
    const both2 = (d, fn) => fn(d) + fn(mirror(d));
    let s = '', col = '', chest = '', belt = '', low = '', hem = '';
    const hemY = isRobe ? 398 : 0;
    // gallér (lila fokozattól magas, „elit”), kéken csak egy szegély
    const collar = () => {
      if (t < 1) return '';
      if (t === 1) return S('M136 190 C150 197 170 197 184 190', g.trim, 3) + S('M136 190 C150 197 170 197 184 190', dark(g.trim, 0.4), 0.8, { op: 0.6 });
      switch (g.set) {
        case 'kodlap': return sh('M126 196 C122 186 132 178 140 182 C143 173 154 172 160 179 C166 172 177 173 180 182 C188 178 198 186 194 196 C180 203 140 203 126 196 Z', g.fur) + S('M134 192 C140 186 146 188 150 184 M186 192 C180 186 174 188 170 184', dark(g.fur, 0.35), 1.4) + `<path d="M138 196 C142 190 148 192 150 196 M170 196 C172 192 178 190 182 196" fill="#6f8a4a" stroke="#3f5a2a" stroke-width="1"/>`;
        case 'holdfeny': return [[-128, 26], [-108, 30], [-72, 30], [-52, 26]].map(([a, len], i) => sh(leafP(i < 2 ? 142 + i * 6 : 166 + (i - 2) * 6, 194, len + t * 3, a, 6), g.mat, { off: [-2, -2], rim: 1.2 })).join('') + S('M136 194 C150 200 170 200 184 194', g.bark, 4);
        case 'arnyromok': return [[128, 182, 144, 180, 146, 196, 130, 198], [146, 176, 158, 175, 158, 190, 147, 191], [162, 175, 174, 176, 173, 191, 162, 190], [176, 180, 192, 182, 190, 198, 174, 196]].map(q => sh(`M${q[0]} ${q[1]} L${q[2]} ${q[3]} L${q[4]} ${q[5]} L${q[6]} ${q[7]} Z`, mat, { rim: 1.2, off: [-2, -2] })).join('') + glowLine(g, 'M132 192 L142 190 M178 190 L188 192', acc, 1.2);
        case 'szirtek': return S('M134 194 C150 200 170 200 186 194', mat, 6) + [[140, 192, -112, 16], [149, 190, -100, 20], [171, 190, -80, 20], [180, 192, -68, 16]].map(([x, y, a, len]) => sh(shardP(x, y, len + t * 2, a, 3.6), acc, { stroke: dark(acc, 0.55), rim: 1, off: [-1.5, -1.5], sw: 1.1 })).join('');
        default: return sh('M124 198 C124 182 134 172 146 174 L160 180 L174 174 C186 172 196 182 196 198 C180 192 140 192 124 198 Z', mat) + [[130, 182, -120], [140, 175, -104], [180, 175, -76], [190, 182, -60]].map(([x, y, a]) => sh(spikeP(x, y, 10 + t * 2, a, 3), mix(mat, '#4a4660', 0.3), { rim: 1, off: [-1.5, -1.5], sw: 1.1 })).join('') + glowLine(g, 'M130 192 C146 186 174 186 190 192', acc, 1.1);
      }
    };
    col = collar();
    if (!back) {
      // mellkas
      switch (g.set) {
        case 'kodlap':
          if (type === 'n') chest = sh(PLATE, mat) + S('M134 206 L186 226 M134 220 L186 240', dark(mat, 0.45), 3) + S('M135 205 L186 225 M135 219 L186 239', light(mat, 0.25), 1, { op: 0.7 }) + `<path d="${PLATE}" fill="none" stroke="${dark(mat, 0.5)}" stroke-width="1" stroke-dasharray="2 2.5" transform="translate(160 220) scale(0.9) translate(-160 -220)"/>`;
          else if (type === 'k') chest = both2('M128 198 L192 258', d => S(d, dark(mat, 0.35), 7) + S(d, mat, 4.6)) + (t >= 1 ? sh(capsP(154, 228, 166, 228, 2.6), g.trim, { rim: 1, off: [-1, -1], sw: 1.2 }) : '');
          else chest = both2('M140 192 L146 192 L148 ' + (isRobe ? 392 : 262) + ' L138 ' + (isRobe ? 392 : 262) + ' Z', d => sh(d, mix(g.reed, mat, 0.55), { rim: 1.2 }) + `<path d="${d}" fill="none" stroke="${dark(mat, 0.4)}" stroke-width="1" stroke-dasharray="1.5 3"/>`);
          if (t >= 1 && type !== 'k') chest += [208, 222, 236].map(y => sh(capsP(154, y, 166, y - 2, 2), g.trim, { rim: 1, off: [-1, -1], sw: 1.1 })).join('');
          if (t >= 2) chest += S('M140 200 C146 214 174 214 180 200', '#5a4a30', 1.2) + [146, 153, 160, 167, 174].map((x, i) => `<circle cx="${x}" cy="${206 + (i === 2 ? 3 : i % 2 ? 2 : 0)}" r="2.2" fill="${g.trim}" stroke="${line(g.trim)}" stroke-width="0.8"/>`).join('');
          break;
        case 'holdfeny':
          if (type === 'n') chest = sh(PLATE, mat) + sh(leafP(160, 244, 40, -90, 8), mix(g.vine, mat, 0.35), { off: [-2, -2], rim: 1.2 }) + S('M160 242 L160 210', t >= 3 ? GOLD : dark(mat, 0.35), 1.2);
          else if (type === 'k') chest = S('M128 196 L192 262', dark(g.bark, 0.3), 7) + S('M128 196 L192 262', g.bark, 4.6) + S('M130 197 L190 260', g.vine, 1.2, { op: 0.8 }) + sh(leafP(140, 206, 20, -125, 5), mat, { rim: 1, off: [-2, -2] }) + sh(leafP(140, 206, 18, -55, 5), mat, { rim: 1, off: [-2, -2] });
          else chest = both2('M139 192 L147 192 L148 ' + (isRobe ? 392 : 262) + ' L138 ' + (isRobe ? 392 : 262) + ' Z', d => sh(d, mix(g.c2, g.mat, 0.35), { rim: 1.2 })) + [214, 236, 258].concat(isRobe ? [300, 340, 380] : []).map(y => sh(leafP(143, y - 8, 14, 90, 3.6), g.mat, { rim: 0.8, off: [-1, -1], sw: 1 }) + sh(leafP(177, y - 8, 14, 90, 3.6), g.mat, { rim: 0.8, off: [-1, -1], sw: 1 })).join('');
          if (t >= 1) chest += S('M146 222 C140 214 142 206 150 206 M174 222 C180 214 178 206 170 206', g.vine, 1.6) + (type === 'v' ? sh(leafP(160, 204, 14, -60, 4), g.mat, { rim: 1, off: [-1, -1] }) + sh(leafP(160, 204, 14, -120, 4), g.mat, { rim: 1, off: [-1, -1] }) : '');
          if (t >= 2) chest += `<path d="${crescentP(160, 206, 7, 90, 0.5)}" fill="${t >= 3 ? GOLD : '#eef3ff'}" stroke="${dark(g.mat, 0.5)}" stroke-width="1"/><g opacity="0.3"><circle class="r-glow" cx="160" cy="206" r="10" fill="${acc}" filter="url(#${id}-blur3)"/></g>`;
          break;
        case 'arnyromok': {
          const SP = 'M134 196 L150 190 L170 190 L186 196 L184 238 L170 250 L150 250 L136 238 Z';
          if (type === 'n') chest = sh(SP, mat) + S('M140 204 L146 214 L142 222 M178 230 L172 236', dark(mat, 0.5), 1.1) + S('M136 210 L184 210', dark(mat, 0.3), 1.2);
          else { // tépett tabard a mellkastól lefelé
            const yb = isRobe ? 392 : 316;
            chest = sh(`M146 192 L174 192 L176 ${yb - 8} L171 ${yb} L166 ${yb - 10} L161 ${yb + 2} L156 ${yb - 9} L151 ${yb} L145 ${yb - 6} Z`, g.cloth, { rim: 1.2 }) + S(`M149 196 L149 ${yb - 10} M171 196 L171 ${yb - 10}`, t >= 1 ? acc : light(g.cloth, 0.2), 1, { op: t >= 1 ? 0.7 : 0.5 });
            if (type === 'k') chest += S('M128 198 L146 214 M192 198 L174 214', dark(mat, 0.3), 5) + sh('M152 214 L168 214 L172 226 L160 236 L148 226 Z', mat, { rim: 1.2, off: [-2, -2] });
          }
          const ry = type === 'n' ? 224 : type === 'k' ? 224 : 240;
          chest += t >= 1 ? glowLine(g, runeAt(160, ry, 1.3), acc, 1.6) : S(runeAt(160, ry, 1.3), dark(mat, 0.5), 1.8);
          if (t >= 2) chest += glowLine(g, type === 'n' ? 'M138 200 L150 195 L170 195 L182 200 M140 236 L151 245 L169 245 L180 236' : 'M150 198 L150 230 M170 198 L170 230', acc, 1);
          if (t >= 3) chest += S(type === 'n' ? SP : 'M146 192 L174 192', GOLD, 1.6);
          break;
        }
        case 'szirtek':
          if (type === 'n') chest = sh(PLATE, mat) + S('M136 214 C150 220 170 220 184 214', g.trim, 1.6) + S('M140 200 C146 196 152 195 158 195', light(mat, 0.45), 1.4, { op: 0.8 });
          else if (type === 'k') chest = S('M128 198 L192 258', dark(mat, 0.3), 7) + S('M128 198 L192 258', mat, 4.6) + S('M192 198 L172 216', dark(mat, 0.3), 6) + S('M192 198 L172 216', mat, 3.6);
          else chest = S('M136 194 C146 210 154 216 160 220 C166 216 174 210 184 194', dark(mat, 0.2), 3) + S('M136 194 C146 210 154 216 160 220 C166 216 174 210 184 194', g.trim, 1.2);
          chest += gemSvg(type === 'k' ? 172 : 160, type === 'k' ? 216 : 222 + (type === 'v' ? 4 : 0), 6 + t * 1.2, acc, id, t >= 1);
          if (t >= 2) chest += [[146, 214, -150], [174, 214, -30]].map(([x, y, a]) => sh(shardP(x, y, 10, a, 3), acc, { stroke: dark(acc, 0.55), rim: 1, off: [-1, -1], sw: 1 })).join('');
          if (t >= 3) chest += `<path d="M${type === 'k' ? 172 : 160} ${type === 'k' ? 205 : 210 + (type === 'v' ? 4 : 0)} l-9 ${11} l9 ${11} l9 -${11} Z" fill="none" stroke="${GOLD}" stroke-width="1.6"/>`;
          break;
        default: // éjkatlan
          if (type === 'n') chest = sh(PLATE, mat) + glowLine(g, 'M138 202 L160 230 L182 202 M160 230 L160 246', acc, 1.3) + [[140, 236], [180, 236]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${g.trim}"/>`).join('');
          else if (type === 'k') chest = both2('M128 198 L192 258', d => S(d, dark(mat, 0.2), 6) + S(d, mat, 4)) + glowLine(g, 'M132 202 L188 254', acc, 0.9) + sh('M152 220 L168 220 L172 230 L160 240 L148 230 Z', mat, { rim: 1, off: [-2, -2] });
          else chest = both2('M139 192 L147 192 L149 ' + (isRobe ? 392 : 262) + ' L137 ' + (isRobe ? 392 : 262) + ' Z', d => sh(d, mat, { rim: 1.2 })) + glowLine(g, 'M143 196 L143 ' + (isRobe ? 388 : 258) + ' M177 196 L177 ' + (isRobe ? 388 : 258), acc, 0.9);
          if (t >= 1) chest += gemSvg(160, type === 'k' ? 230 : type === 'n' ? 214 : 204, 4.4 + t, acc, id, true);
          if (t >= 2 && type === 'n') chest += [[136, 198, -130], [184, 198, -50]].map(([x, y, a]) => sh(spikeP(x, y, 12, a, 3.2), mix(mat, '#4a4660', 0.3), { rim: 1, off: [-1.5, -1.5], sw: 1.1 })).join('');
          if (t >= 3) chest += S(type === 'n' ? 'M132 197 C148 190 172 190 188 197' : 'M137 194 L183 194', GOLD, 1.8);
      }
    } else if (type === 'n') { // hátlap a nehéz vértnél
      chest = sh('M130 198 C146 190 174 190 190 198 L188 250 C176 258 144 258 132 250 Z', g.set === 'kodlap' ? mat : g.set === 'holdfeny' ? g.mat : mat, { off: [-5, -4] });
      if (g.set === 'arnyromok' && t >= 1) chest += glowLine(g, runeAt(160, 224, 1.4), acc, 1.5);
      if (g.set === 'ejkatlan') chest += glowLine(g, 'M160 196 L160 252', acc, 1.2);
      if (g.set === 'szirtek' && t >= 1) chest += gemSvg(160, 222, 5 + t, acc, id, true);
      if (g.set === 'holdfeny') chest += sh(leafP(160, 248, 36, -90, 7), mix(g.vine, mat, 0.35), { rim: 1.2, off: [-2, -2] });
      if (g.set === 'kodlap') chest += S('M134 210 L186 230 M134 226 L186 246', dark(mat, 0.45), 3);
    }
    if (back && g.set === 'arnyromok' && type !== 'n') { const yb = isRobe ? 392 : 316; chest += sh(`M146 192 L174 192 L176 ${yb - 8} L171 ${yb} L166 ${yb - 10} L161 ${yb + 2} L156 ${yb - 9} L151 ${yb} L145 ${yb - 6} Z`, g.cloth, { rim: 1.2 }); }
    // öv
    const buckle = () => {
      if (back) return '';
      switch (g.set) {
        case 'kodlap': return sh(capsP(152, 265, 168, 265, 3), g.trim, { rim: 1, off: [-1, -1], sw: 1.2 }) + (t >= 1 ? S('M150 268 L147 284 M170 268 L173 282', '#5a4a30', 1.2) + `<circle cx="147" cy="286" r="2.6" fill="${g.trim}" stroke="${line(g.trim)}" stroke-width="0.8"/><circle cx="173" cy="284" r="2.2" fill="${g.trim}" stroke="${line(g.trim)}" stroke-width="0.8"/>` : '');
        case 'holdfeny': return sh(leafP(160, 266, 15, 200, 4), g.mat, { rim: 1, off: [-1, -1], sw: 1.2 }) + sh(leafP(160, 266, 15, -20, 4), g.mat, { rim: 1, off: [-1, -1], sw: 1.2 }) + `<circle cx="160" cy="266" r="3" fill="${t >= 3 ? GOLD : g.vine}" stroke="${dark(g.vine, 0.5)}" stroke-width="1"/>`;
        case 'arnyromok': return sh('M151 259 L169 259 L170 273 L150 273 Z', mat, { rim: 1, off: [-2, -2], sw: 1.4 }) + (t >= 1 ? glowLine(g, runeAt(160, 266, 0.7), acc, 1) : '');
        case 'szirtek': return sh('M152 260 L168 260 L168 272 L152 272 Z', g.trim, { rim: 1, off: [-1.5, -1.5], sw: 1.3 }) + gemSvg(160, 266, 4.4, acc, id, t >= 1);
        default: return sh('M150 260 L170 260 L172 266 L170 272 L150 272 L148 266 Z', mat, { rim: 1, off: [-2, -2], sw: 1.3 }) + sh(spikeP(160, 270, 9, 90, 2.6), mix(mat, '#4a4660', 0.3), { rim: 0.8, off: [-1, -1], sw: 1 }) + gemSvg(160, 265.5, 3, acc, id, true);
      }
    };
    const bc = { kodlap: '#5c4a34', holdfeny: g.bark || '#6b5040', arnyromok: dark(mat, 0.15), szirtek: mat, ejkatlan: mat }[g.set];
    belt = sh(BELT, bc, { rim: 1.2, off: [-2, -2], sw: 1.6 });
    if (g.set === 'kodlap') belt += `<path d="M123 263 C146 269 174 269 197 263" fill="none" stroke="${light(bc, 0.3)}" stroke-width="1.4" stroke-dasharray="3 3"/>`;
    if (g.set === 'holdfeny') belt += S('M122 262 C134 270 140 260 152 268 M168 268 C180 260 186 270 198 262', g.vine, 1.4);
    if (g.set === 'arnyromok') belt += S('M136 262 L136 271 M184 262 L184 271', dark(mat, 0.5), 1.2);
    if (g.set === 'ejkatlan' && t >= 1) belt += glowLine(g, 'M124 266 C146 271 174 271 196 266', acc, 0.8);
    if (t >= 3) belt += S('M121 259 C146 265 174 265 199 259', GOLD, 1.4);
    belt += buckle();
    // csípővért / rongysáv / levelek – nehéznél kéktől, másnál lilától; köntösnél a hosszú elő- és hátlap
    const tassN = type === 'n' ? (t >= 1) : (t >= 2);
    if (tassN && !isRobe) {
      const xs = type === 'n' ? [128, 145, 175, 192] : [132, 188];
      switch (g.set) {
        case 'kodlap': low = [124, 134, 144, 176, 186, 196].filter((x, i) => type === 'n' || i % 2 === 0).map((x, i) => sh(`M${x - 5} 268 L${x + 5} 268 L${x + 4} ${300 + (i % 3) * 5} L${x + 1} ${294 + (i % 3) * 5} L${x - 2} ${303 + (i % 3) * 5} L${x - 5} ${296 + (i % 3) * 4} Z`, i % 2 ? mat : g.fur, { rim: 1.1, off: [-2, -2], sw: 1.3 })).join(''); break;
        case 'holdfeny': low = xs.map(x => sh(leafP(x, 267, 34 + t * 3, 90 + (x - 160) * 0.25, 6), g.mat, { rim: 1.1, off: [-2, -2] }) + S(`M${x} 268 L${f2(x + (x - 160) * 0.1)} ${296 + t * 2}`, t >= 3 ? GOLD : dark(g.mat, 0.35), 1)).join(''); break;
        case 'arnyromok': low = xs.map(x => sh(`M${x - 8} 268 L${x + 8} 268 L${x + 7} 296 L${x - 1} 300 L${x - 7} 294 Z`, mat, { rim: 1.1, off: [-2, -2] }) + S(`M${x - 6} 281 L${x + 6} 281`, dark(mat, 0.4), 1)).join('') + (t >= 2 ? glowLine(g, xs.map(x => `M${x - 5} 286 L${x + 5} 286`).join(' '), acc, 0.9) : ''); break;
        case 'szirtek': low = xs.map(x => sh(`M${x - 8} 268 L${x + 8} 268 L${x + 6} 292 L${x} 298 L${x - 6} 292 Z`, mat, { rim: 1.1, off: [-2, -2] }) + sh(shardP(x, 296, 8 + t * 2, 90, 2.6), acc, { stroke: dark(acc, 0.55), rim: 0.8, off: [-1, -1], sw: 1 })).join(''); break;
        default: low = xs.map(x => sh(`M${x - 8} 268 L${x + 8} 268 L${x + 5} 294 L${x} ${304 + t * 2} L${x - 5} 294 Z`, mat, { rim: 1.1, off: [-2, -2] }) + glowLine(g, `M${x - 6} 272 L${x - 3} 292 M${x + 6} 272 L${x + 3} 292`, acc, 0.7, 0.3)).join('');
      }
    }
    // köntös szegélye
    if (isRobe && t >= 1) {
      const H = 'M102 398 C134 408 186 408 218 398';
      switch (g.set) {
        case 'kodlap': hem = [108, 122, 136, 150, 164, 178, 192, 206].map((x, i) => P(`M${x - 6} ${398 + (Math.abs(x - 160) < 40 ? 4 : 2)} L${x + 6} ${398 + (Math.abs(x - 160) < 40 ? 4 : 2)} L${x + 3} ${410 + (i % 3) * 3} L${x} ${406} L${x - 4} ${411 + (i % 2) * 3} Z`, i % 2 ? mat : g.fur, { sw: 1.2 })).join(''); break;
        case 'holdfeny': hem = S(H, g.bark, 5) + [110, 128, 146, 164, 182, 200].map(x => sh(leafP(x, 402, 12, -20, 3.4), g.mat, { rim: 0.8, off: [-1, -1], sw: 1 })).join(''); break;
        case 'arnyromok': hem = S(H, dark(mat, 0.1), 6) + glowLine(g, 'M110 400 L118 402 L122 396 L130 404 L138 398 M182 398 L190 404 L198 396 L202 402 L210 400', acc, 1); break;
        case 'szirtek': hem = S(H, mat, 5) + [112, 136, 160, 184, 208].map(x => sh(shardP(x, 404, 9, 90, 2.8), acc, { stroke: dark(acc, 0.55), rim: 0.8, off: [-1, -1], sw: 1 })).join(''); break;
        default: hem = S(H, mat, 6) + glowLine(g, H, acc, 1);
      }
      if (t >= 3) hem += S('M102 394 C134 404 186 404 218 394', GOLD, 1.6);
    }
    s = low + chest + col + belt + hem;
    return g.male ? `<g transform="translate(160 0) scale(1.12 1) translate(-160 0)">${s}</g>` : s;
  }

  // ---------- lábvért (köntösnél nincs) ----------
  function setGreaves(g, type) {
    const t = g.t, id = g.id, mat = g.mat, acc = g.acc;
    if (type === 'v' && t < 2) return '';
    if (type === 'k' && t < 1) return '';
    const side = M => {
      const sh = (d, fill, o) => shaded(id, M(d), fill, Object.assign({ off: [-3, -2], rim: 1.3, sw: 1.6 }, o || {}));
      const ln = (d, c, w, o) => S(M(d), c, w, o), gl = (d, w, op) => glowLine(g, M(d), acc, w, op);
      const KNEE = 'M134 322 C134 311 157 311 157 322 C157 330 134 330 134 322 Z', SHIN = 'M135.5 324 L155.5 324 L155 372 L136 372 Z';
      const WR = 'M135 336 L156 330 M135 346 L156 340 M135 356 L156 350 M135 366 L156 360';
      let one = '';
      switch (g.set) {
        case 'kodlap': one = (type === 'n' ? sh(SHIN, mat) + ln(WR, dark(mat, 0.45), 2) : ln(WR, dark(mat, 0.4), 3.4) + ln(WR, mat, 2)) + (t >= 1 ? sh(capsP(140, 322, 151, 322, 2.2), g.trim, { rim: 1, off: [-1, -1], sw: 1.1 }) : ''); break;
        case 'holdfeny': one = (type === 'n' ? sh(SHIN, g.bark) + ln('M138 330 C144 340 140 352 148 362', g.vine, 1.4) : '') + sh(leafP(145.5, 336, 24 + t * 2, -90, 6), g.mat, { rim: 1.1, off: [-2, -2] }); break;
        case 'arnyromok': one = (type === 'n' ? sh(SHIN, mat) : '') + sh('M134 314 L157 314 L158 326 L146 332 L133 326 Z', mat) + (t >= 1 ? gl('M141 323 L145.5 318 L150 323', 1.1) : ''); break;
        case 'szirtek': one = (type === 'n' ? sh(SHIN, mat) : '') + sh(shardP(145.5, 316, 10 + t * 2, -90, 3), acc, { stroke: dark(acc, 0.55), rim: 0.8, off: [-1, -1], sw: 1 }) + sh(KNEE, mat); break;
        default: one = (type === 'n' ? sh(SHIN, mat) + gl('M145.5 330 L145.5 368', 0.9) : '') + sh(spikeP(145.5, 318, 10 + t * 2, -90, 3), mix(mat, '#4a4660', 0.3), { rim: 1, off: [-1, -1], sw: 1.1 }) + sh(KNEE, mat);
      }
      if (t >= 3) one += ln('M135 372 L156 372', GOLD, 2);
      return one;
    };
    return side(d => d) + side(mirror);
  }

  // ---------- fejfedő-díszek (a fej koordinátáiban; a meglévő fejfedőre kerülnek) ----------
  // dome: [cx, cy, rx, ry] a fejfedő teteje (ide kerül a taréj), band: a pánt íve (köbös Bézier), brow: a homlok közepe
  const HWG = {
    sisak: { dome: [160, 122, 58, 88], band: [[106, 104], [126, 92], [194, 92], [214, 104]], brow: [160, 101] },
    csuklya: { dome: [160, 146, 62, 108], band: [[112, 118], [126, 84], [194, 84], [208, 118]], brow: [160, 86] },
    suveg: { band: [[122, 68], [140, 56], [180, 56], [198, 68]], brow: [160, 63], plume: [196, 60] },
    abroncs: { band: [[106, 84], [122, 66], [198, 66], [214, 84]], brow: [160, 71] },
    diadem: { band: [[112, 98], [140, 86], [180, 86], [208, 98]], brow: [160, 89] },
    koszoru: { band: [[110, 92], [130, 70], [190, 70], [210, 92]], brow: [160, 72] },
    nincs: { band: [[108, 94], [128, 78], [192, 78], [212, 94]], brow: [160, 82], circlet: 1 }
  };
  // a fejfedő ívének u ∈ [−1, 1] pontja és kifelé mutató normálisa (fokban)
  function hwPoint(G, u, onBand) {
    if (G.dome && !onBand) {
      const [cx, cy, rx, ry] = G.dome, ph = u * 0.9, x = cx + rx * Math.sin(ph), y = cy - ry * Math.cos(ph);
      return [x, y, Math.atan2(-Math.cos(ph) / ry, Math.sin(ph) / rx) / DEG];
    }
    const b = G.band, t = (u + 1) / 2, p = bez(b[0], b[1], b[2], b[3], t), q = bez(b[0], b[1], b[2], b[3], Math.min(1, t + 0.01)), r = bez(b[0], b[1], b[2], b[3], Math.max(0, t - 0.01));
    const tx = q[0] - r[0], ty = q[1] - r[1];
    return [p[0], p[1], Math.atan2(-tx, ty) / DEG];
  }
  function setHelmDecor(g, hw, back) {
    const G = HWG[hw] || HWG.nincs, t = g.t, id = g.id, mat = g.mat, acc = g.acc;
    const sh = (d, fill, o) => shaded(id, d, fill, Object.assign({ off: [-2, -2], rim: 1.2, sw: 1.5 }, o || {}));
    const crest = (G.dome ? [-0.0] : [0]).concat();
    const br = G.brow, sides = [hwPoint(G, -1, true), hwPoint(G, 1, true)];
    let s = '';
    if (G.circlet && !back) { // fejfedő nélkül egy vékony szettpánt
      const bd = `M${G.band[0].join(' ')} C${G.band[1].join(' ')} ${G.band[2].join(' ')} ${G.band[3].join(' ')}`;
      s += S(bd, dark(g.set === 'holdfeny' ? g.bark : mat, 0.3), 5) + S(bd, g.set === 'holdfeny' ? g.bark : mat, 3);
    }
    const along = (us, fn) => us.map(u => { const p = hwPoint(G, u, !G.dome); return fn(p[0], p[1], p[2], u); }).join('');
    switch (g.set) {
      case 'kodlap': {
        // nádcsomó a jobb oldalon, csontpeckek, bőrszíj-tekercs
        const base = G.plume || [sides[1][0] - 6, sides[1][1] - 8];
        const reeds = [[0, -40, 4], [12, -32, -2], [-8, -36, 6]].slice(0, t >= 2 ? 3 : 2);
        reeds.forEach(([dx, dy, bnd]) => {
          const k = 1 + t * 0.12, x1 = base[0] + dx * k, y1 = base[1] + dy * k, d = `M${base[0]} ${base[1]} Q${f2((base[0] + x1) / 2 + bnd)} ${f2((base[1] + y1) / 2)} ${f2(x1)} ${f2(y1)}`;
          s += S(d, '#3a3f22', 3.6) + S(d, g.reed, 2) + sh(capsP(base[0] + (x1 - base[0]) * 0.62, base[1] + (y1 - base[1]) * 0.62, base[0] + (x1 - base[0]) * 0.9, base[1] + (y1 - base[1]) * 0.9, 2.6), '#7a5230', { rim: 0.8, off: [-1, -1], sw: 1 });
        });
        if (!back && (hw === 'sisak' || hw === 'csuklya')) {
          const bd = `M${G.band[0].join(' ')} C${G.band[1].join(' ')} ${G.band[2].join(' ')} ${G.band[3].join(' ')}`;
          s += S(bd, dark(g.mat, 0.4), 7) + S(bd, g.mat, 5) + along([-0.7, -0.35, 0, 0.35, 0.7], (x, y) => S(`M${f2(x - 2)} ${f2(y - 3)} L${f2(x + 2)} ${f2(y + 3)}`, dark(g.mat, 0.5), 1.2));
        }
        if (t >= 1) s += sides.map(([x, y], i) => sh(capsP(x - 5, y + 2, x + 5, y - 2, 2), g.trim, { rim: 0.8, off: [-1, -1], sw: 1 })).join('');
        if (t >= 2 && !back) s += sh(capsP(br[0] - 8, br[1] - 4, br[0] + 8, br[1] + 4, 1.8), g.trim, { rim: 0.8, off: [-1, -1], sw: 1 }) + sh(capsP(br[0] - 8, br[1] + 4, br[0] + 8, br[1] - 4, 1.8), g.trim, { rim: 0.8, off: [-1, -1], sw: 1 }) + `<circle cx="${br[0]}" cy="${br[1]}" r="3.2" fill="${g.trim}" stroke="${line(g.trim)}" stroke-width="0.9"/>`;
        break;
      }
      case 'holdfeny': {
        // ezüst levélszárnyak a halántéknál, hátrafelé-felfelé söpörve
        const n = t >= 2 ? 3 : t >= 1 ? 2 : 1;
        sides.forEach(([x, y], i) => {
          const sd = i ? 1 : -1;
          for (let j = n - 1; j >= 0; j--) {
            const a = sd > 0 ? -60 + j * 22 : -120 - j * 22, len = (24 + t * 5) * (1 - j * 0.18);
            s += sh(leafP(x, y, len, a, 5.5 - j * 0.6), mat, { rim: 1 }) + S(`M${f2(x)} ${f2(y)} L${axis(x, y, a)(len * 0.85, 0)}`, t >= 3 ? GOLD : dark(mat, 0.35), 0.9, { op: 0.8 });
          }
          if (t >= 1) s += `<circle cx="${f2(x)}" cy="${f2(y)}" r="2.6" fill="${g.vine}" stroke="${dark(g.vine, 0.5)}" stroke-width="0.8"/>`;
        });
        if (!back && t >= 1) s += sh(leafP(br[0], br[1] + 4, 14 + t * 2, -90, 4), mat, { rim: 0.9 });
        if (!back && t >= 2) s += `<path d="${crescentP(br[0], br[1] - 12 - t, 5.5, 90, 0.5)}" fill="${t >= 3 ? GOLD : '#eef3ff'}" stroke="${dark(mat, 0.5)}" stroke-width="0.9"/><g opacity="0.35"><circle class="r-glow" cx="${br[0]}" cy="${br[1] - 12 - t}" r="8" fill="${acc}" filter="url(#${id}-blur3)"/></g>`;
        break;
      }
      case 'arnyromok': {
        if (!back) {
          s += sh(`M${br[0] - 13} ${br[1] - 6} L${br[0] + 13} ${br[1] - 6} L${br[0] + 10} ${br[1] + 6} L${br[0] - 10} ${br[1] + 6} Z`, mat, { rim: 1 });
          s += t >= 1 ? glowLine(g, runeAt(br[0], br[1], 0.7), acc, 1.1) : S(runeAt(br[0], br[1], 0.7), dark(mat, 0.5), 1.2);
          if (t >= 3) s += S(`M${br[0] - 13} ${br[1] - 6} L${br[0] + 13} ${br[1] - 6}`, GOLD, 1.4);
        }
        s += sides.map(([x, y]) => sh(`M${f2(x - 5)} ${f2(y - 6)} L${f2(x + 5)} ${f2(y - 6)} L${f2(x + 4)} ${f2(y + 5)} L${f2(x - 4)} ${f2(y + 5)} Z`, mat, { rim: 0.8 })).join('');
        if (t >= 2) { // lebegő rúnaív a fej fölött
          const top = G.dome ? hwPoint(G, 0)[1] : G.band[1][1] - 6;
          s += `<g class="r-float">` + [-22, 0, 22].map((dx, i) => glowLine(g, runeAt(160 + dx, top - 14 - (i === 1 ? 6 : 0), 0.65), acc, 1.1)).join('') + `</g>`;
        }
        break;
      }
      case 'szirtek': {
        const us = [[0, 1.25], [-0.32, 0.9], [0.32, 0.9], [-0.6, 0.7], [0.6, 0.7]].slice(0, Math.min(5, 1 + t * 1.4 | 0));
        if (t >= 2) { const p = hwPoint(G, 0, !G.dome); s += `<g opacity="0.3"><circle class="r-glow" cx="${f2(p[0])}" cy="${f2(p[1] - 10)}" r="14" fill="${acc}" filter="url(#${id}-blur3)"/></g>`; }
        us.slice().reverse().forEach(([u, sc]) => { const p = hwPoint(G, u, !G.dome), len = (14 + t * 4) * sc; s += sh(shardP(p[0] - Math.cos(p[2] * DEG) * 4, p[1] - Math.sin(p[2] * DEG) * 4, len, p[2], 3.6 * Math.max(0.8, sc * 0.9)), acc, { stroke: dark(acc, 0.55), rim: 1 }) + S(shardHi(p[0] - Math.cos(p[2] * DEG) * 4, p[1] - Math.sin(p[2] * DEG) * 4, len, p[2], 3.6), '#fff', 0.8, { op: 0.8 }); });
        if (!back && t >= 1) s += gemSvg(br[0], br[1], 4 + t * 0.6, acc, id, true);
        break;
      }
      default: { // éjkatlan: tüskekorona, bíbor homlokkő, lilától szarvak
        if (t >= 2) s += sides.map(([x, y], i) => { const sd = i ? 1 : -1; return sh(`M${f2(x - sd * 4)} ${f2(y + 4)} C${f2(x + sd * 10)} ${f2(y - 4)} ${f2(x + sd * 18)} ${f2(y - 22)} ${f2(x + sd * 12)} ${f2(y - 40 - t * 3)} C${f2(x + sd * 8)} ${f2(y - 24)} ${f2(x + sd * 2)} ${f2(y - 12)} ${f2(x - sd * 4)} ${f2(y - 6)} Z`, mix(mat, '#4a4660', 0.3), { rim: 1 }); }).join('');
        const us = t >= 2 ? [-0.6, -0.3, 0, 0.3, 0.6] : [-0.35, 0, 0.35];
        us.forEach(u => { const p = hwPoint(G, u, !G.dome), len = (u === 0 ? 14 : 10) + t * 2.5; s += sh(spikeP(p[0] - Math.cos(p[2] * DEG) * 3, p[1] - Math.sin(p[2] * DEG) * 3, len, p[2], 3), mix(mat, '#4a4660', 0.3), { rim: 0.9 }); });
        if (t >= 3) s += along([-0.6, 0, 0.6], (x, y) => `<circle cx="${f2(x)}" cy="${f2(y)}" r="1.8" fill="${GOLD}"/>`);
        if (!back && t >= 1) s += gemSvg(br[0], br[1], 3.6 + t * 0.6, acc, id, true);
      }
    }
    return s;
  }

  // ---------- fegyverdíszek ----------
  // h: a fej (hegy, gömb, íjvég), h2: az íj másik vége, g: keresztvas / nyak, p: markolatgomb / alsó vég, seg: díszvonal szakasza
  const WANCH = {
    harcos0: { h: [213, 116], g: [213, 264], p: [213, 300], seg: [[213, 134], [213, 250]] },
    harcos1: { h: [213, 110], g: [213, 266], p: [213, 302], seg: [[213, 126], [213, 252]] },
    harcos2: { h: [240, 196], g: [213, 216], p: [213, 334], seg: [[213, 224], [213, 300]] },
    vadasz0: { h: [84, 150], h2: [84, 410], g: [116, 279], p: [116, 279], seg: [[112, 236], [112, 322]], bow: 1 },
    vadasz1: { h: [90, 196], h2: [90, 362], g: [110, 279], p: [110, 279], seg: [[111, 244], [111, 316]], bow: 1 },
    vadasz2: { h: [276, 269], g: [250, 279], p: [188, 285], seg: [[200, 279], [244, 276]] },
    magus0: { h: [213, 132], g: [213, 158], p: [213, 334], seg: [[213, 170], [213, 252]] },
    magus1: { h: [213, 120], g: [213, 154], p: [213, 334], seg: [[213, 168], [213, 252]] },
    magus2: { h: [252, 186], g: [252, 232], p: [252, 232], book: 1 },
    gyogyito0: { h: [213, 144], g: [213, 164], p: [213, 334], seg: [[213, 178], [213, 252]] },
    gyogyito1: { h: [240, 194], g: [213, 176], p: [213, 334], seg: [[213, 186], [213, 252]] },
    gyogyito2: { h: [213, 192], g: [213, 212], p: [213, 328], seg: [[213, 218], [213, 262]] },
    orgyilkos0: { h: [213, 342], g: [213, 298], p: [213, 262], seg: [[213, 306], [213, 330]] },
    orgyilkos1: { h: [226, 342], g: [213, 298], p: [213, 262], seg: [[211, 306], [214, 328]] },
    orgyilkos2: { h: [213, 352], g: [213, 298], p: [213, 262], seg: [[213, 306], [213, 340]] },
    idezo0: { h: [213, 323], g: [213, 292], p: [213, 340] },
    idezo1: { h: [252, 186], g: [252, 232], p: [252, 232], book: 1 },
    idezo2: { h: [213, 168], g: [213, 192], p: [213, 328], seg: [[213, 198], [213, 262]] },
    dalnok0: { h: [233, 217], g: [203, 302], p: [171, 373], seg: [[207, 294], [231, 238]] },
    dalnok1: { h: [214, 212], g: [244, 282], p: [212, 332], seg: [[213, 230], [213, 300]] },
    dalnok2: { h: [228, 206], g: [222, 236], p: [203, 326], seg: [[225, 222], [206, 306]] },
    alakvalto0: { h: [252, 284], g: [221, 276], p: [221, 276], seg: [[228, 268], [248, 270]] },
    alakvalto1: { h: [214, 152], g: [214, 196], p: [214, 334], seg: [[214, 204], [214, 262]] },
    alakvalto2: { h: [226, 342], g: [213, 298], p: [213, 262], seg: [[211, 306], [214, 328]] }
  };
  function wAxis(A) { const a = A.seg ? [A.seg[1][0] - A.seg[0][0], A.seg[1][1] - A.seg[0][1]] : [A.h[0] - A.g[0], A.h[1] - A.g[1]]; const ang = Math.atan2(a[1], a[0]) / DEG; return ang; }
  function segPts(A, n) { if (!A.seg) return []; const out = []; for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); out.push([A.seg[0][0] + (A.seg[1][0] - A.seg[0][0]) * t, A.seg[0][1] + (A.seg[1][1] - A.seg[0][1]) * t]); } return out; }
  function setWeaponDecor(A, g) {
    const t = g.t, id = g.id, mat = g.mat, acc = g.acc, ang = wAxis(A), id2 = id;
    const sh = (d, fill, o) => shaded(id2, d, fill, Object.assign({ off: [-1.5, -1.5], rim: 1, sw: 1.2 }, o || {}));
    const [gx, gy] = A.g, [px, py] = A.p, [hx, hy] = A.h;
    const segD = A.seg ? `M${A.seg[0].join(' ')} L${A.seg[1].join(' ')}` : '';
    const sideA = [ang + 90, ang - 90];
    let s = '';
    switch (g.set) {
      case 'kodlap': // szíjtekercs a markolat fölött, csontgyöngyös zsinór, nádtoll
        if (A.seg) s += segPts({ seg: [A.seg[0], [A.seg[0][0] + (A.seg[1][0] - A.seg[0][0]) * 0.3, A.seg[0][1] + (A.seg[1][1] - A.seg[0][1]) * 0.3]] }, 4).map(([x, y]) => { const p = axis(x, y, ang); return S(`M${p(0, -5)} L${p(3, 5)}`, dark(mat, 0.4), 3) + S(`M${p(0, -5)} L${p(3, 5)}`, mat, 1.8); }).join('');
        s += S(`M${gx} ${gy} Q${gx - 8} ${gy + 10} ${gx - 6} ${gy + 20}`, '#5a4a30', 1.2) + `<circle cx="${gx - 7}" cy="${gy + 12}" r="2.4" fill="${g.trim}" stroke="${line(g.trim)}" stroke-width="0.7"/><circle cx="${gx - 6}" cy="${gy + 21}" r="2.8" fill="${g.trim}" stroke="${line(g.trim)}" stroke-width="0.7"/>`;
        if (t >= 1) s += sh(capsP(px - 4, py, px + 4, py, 2.2), g.trim);
        if (t >= 2) { const p = axis(hx, hy, ang + 180); s += [[-30, 16], [-55, 14]].map(([da, len]) => { const q = axis(gx, gy, ang + 180 + da), e = q(len, 0); return S(`M${gx} ${gy} L${e}`, '#3a3f22', 3) + S(`M${gx} ${gy} L${e}`, g.reed, 1.6); }).join(''); }
        break;
      case 'holdfeny': // ezüstlevélpár a keresztvasnál, indatekercs, holdsarló a gombon
        s += sideA.map(a => sh(leafP(gx, gy, 12 + t * 2.5, a + (a > ang ? -25 : 25), 3.4), mat)).join('');
        if (t >= 1) s += `<path d="${crescentP(px, py + 2, 4.5, 90, 0.5)}" fill="${t >= 3 ? GOLD : '#eef3ff'}" stroke="${dark(mat, 0.5)}" stroke-width="0.8"/>`;
        if (t >= 2 && A.seg) { let d = ''; segPts(A, 9).forEach(([x, y], i) => { const p = axis(x, y, ang); d += (i ? 'L' : 'M') + p(0, i % 2 ? 4 : -4) + ' '; }); s += S(d, g.vine, 1.4, { op: 0.9 }) + segPts(A, 3).map(([x, y], i) => sh(leafP(x, y, 7, ang + (i % 2 ? 60 : -60), 2.2), g.vine, { rim: 0.6 })).join(''); }
        break;
      case 'arnyromok': // kőgyűrű a nyakon, izzó rúnák a pengén / nyélen
        s += sh(`M${axis(gx, gy, ang)(-4, -7)} L${axis(gx, gy, ang)(4, -7)} L${axis(gx, gy, ang)(4, 7)} L${axis(gx, gy, ang)(-4, 7)} Z`, mat);
        if (t >= 1 && A.seg) s += segPts(A, t >= 2 ? 3 : 2).map(([x, y]) => glowLine(g, runeAt(x, y, 0.55), acc, 0.9, 0.35)).join('');
        else if (t >= 1) s += glowLine(g, runeAt(hx, hy - 18, 0.6), acc, 1);
        if (t >= 2) s += `<g class="r-float">${glowLine(g, runeAt(hx + 14, hy - 10, 0.5), acc, 0.9)}</g>`;
        if (t >= 3) s += S(`M${axis(gx, gy, ang)(-4, -7)} L${axis(gx, gy, ang)(-4, 7)}`, GOLD, 1.4);
        break;
      case 'szirtek': // kristályfürt a nyakon, csiszolt kő a gombon, lilától szilánkok a fejnél
        s += sideA.map(a => sh(shardP(gx, gy, 9 + t * 2, a + (a > ang ? -30 : 30), 2.6), acc, { stroke: dark(acc, 0.55) })).join('');
        if (t >= 1) s += gemSvg(px, py, 3.4, acc, id, t >= 2);
        if (t >= 2) s += [-40, 0, 40].map(da => sh(shardP(hx, hy, 8 + t * 2, ang + 180 + da, 2.2), acc, { stroke: dark(acc, 0.55) })).join('') + `<g opacity="0.3"><circle class="r-glow" cx="${hx}" cy="${hy}" r="10" fill="${acc}" filter="url(#${id}-blur3)"/></g>`;
        if (t >= 3) s += `<circle cx="${px}" cy="${py}" r="5" fill="none" stroke="${GOLD}" stroke-width="1.6"/>`;
        break;
      default: // éjkatlan: tüskés keresztvas, bíbor izzó él, tüskés gomb
        s += sideA.map(a => sh(spikeP(gx, gy, 9 + t * 2.5, a + (a > ang ? -35 : 35), 2.4), mix(mat, '#4a4660', 0.3))).join('');
        if (t >= 1 && segD) s += glowLine(g, segD, acc, 1, 0.4);
        if (t >= 2) s += sh(spikeP(px, py, 8, ang + 180, 2.4), mix(mat, '#4a4660', 0.3)) + gemSvg(gx, gy, 3, acc, id, true);
        if (t >= 3) s += `<circle cx="${gx}" cy="${gy}" r="5.5" fill="none" stroke="${GOLD}" stroke-width="1.6"/>`;
    }
    return s;
  }

  // ---------- egyedi (legendás / mitikus) darabok ----------
  function uniqName(v) { v = String(v || ''); const i = v.indexOf(':'); return i >= 0 ? v.slice(i + 1) : v; }
  const UNIQ_W = {
    'Hajnalhasító': { blade: '#ffd49a', glow: '#ffb347', fx: 'sun' }, 'Éjfél Pallosa': { blade: '#4a5098', glow: '#8f9cff', fx: 'midnight' }, 'Csillagtörő Szablya': { blade: '#d8ecff', glow: '#7fe8ff', fx: 'cracks' },
    'Holdsugár-íj': { glow: '#cfe0ff', fx: 'moonbow' }, 'Szélsuttogó': { glow: '#9affc8', fx: 'wind' }, 'Hullócsillag Hosszúíja': { glow: '#ffe2a0', fx: 'falling' },
    'Az Örök Láng Botja': { glow: '#ff8a3a', fx: 'flame' }, 'Ködfaló Pálca': { glow: '#bfd8e0', fx: 'fog' }, 'Csillagszövő Bot': { glow: '#cfd8ff', fx: 'weave' },
    'Hajnalpír Jogar': { blade: '#ffc4d4', glow: '#ff9ac0', fx: 'dawn' }, 'Az Első Fény': { blade: '#fffbe8', glow: '#fff3c0', fx: 'light' }, 'Holdkút Jogara': { blade: '#cfe8ff', glow: '#7fd0ff', fx: 'well' },
    'Árnyékcsók': { blade: '#7a52b8', glow: '#b07bff', fx: 'shadow' }, 'Éjféli Fullánk': { blade: '#2a3060', glow: '#5a7bff', fx: 'sting' }, 'Suttogó Penge': { blade: '#eef4ff', glow: '#dff4ff', fx: 'whisper' },
    'Lidércfény Lámpás': { glow: '#7fffb0', fx: 'wisp' }, 'A Néma Könyv': { glow: '#c8b0ff', fx: 'silence' }, 'Szellemhívó Mécses': { glow: '#7fd8ff', fx: 'spirit' },
    'Csillagdal Lant': { glow: '#ffe2a0', fx: 'starsong' }, 'Az Ébredés Hárfája': { glow: '#ffc890', fx: 'awaken' }, 'Holdhívó Furulya': { glow: '#cfe0ff', fx: 'moonsong' },
    'Farkasfog Karmok': { blade: '#f2efe6', glow: '#e0e6f0', fx: 'fang' }, 'Ősvadon Agyarai': { blade: '#d8e8c0', glow: '#7fe39a', fx: 'wild' }, 'Vihartépő Karmok': { blade: '#d0e4ff', glow: '#7fd8ff', fx: 'storm' },
    'Csillagpenge': { blade: '#2c3a7a', glow: '#9fe8ff', fx: 'starblade', myth: 1 }
  };
  function flameSvg(x, y, s, c1, c2, c3, cls) { // lobogó láng (alul a talppont)
    const d = k => `M${f2(x)} ${f2(y - 26 * s * k)} C${f2(x + 4 * s * k)} ${f2(y - 16 * s * k)} ${f2(x + 11 * s * k)} ${f2(y - 10 * s * k)} ${f2(x + 9 * s * k)} ${f2(y - 2 * s * k)} C${f2(x + 7 * s * k)} ${f2(y + 5 * s * k)} ${f2(x - 7 * s * k)} ${f2(y + 5 * s * k)} ${f2(x - 9 * s * k)} ${f2(y - 2 * s * k)} C${f2(x - 11 * s * k)} ${f2(y - 10 * s * k)} ${f2(x - 3 * s * k)} ${f2(y - 14 * s * k)} ${f2(x)} ${f2(y - 26 * s * k)} Z`;
    return `<g class="${cls || 'r-flame'}" style="transform-origin:${f2(x)}px ${f2(y)}px"><path d="${d(1)}" fill="${c1}" stroke="${dark(c1, 0.4)}" stroke-width="1"/><path d="${d(0.68)}" fill="${c2}"/><path d="${d(0.38)}" fill="${c3}"/></g>`;
  }
  function noteSvg(x, y, s, c) { return `<g class="r-float"><ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(3 * s)}" ry="${f2(2.2 * s)}" fill="${c}" transform="rotate(-20 ${f2(x)} ${f2(y)})"/>` + S(`M${f2(x + 2.6 * s)} ${f2(y - 0.5 * s)} L${f2(x + 2.6 * s)} ${f2(y - 11 * s)} Q${f2(x + 7 * s)} ${f2(y - 9 * s)} ${f2(x + 7 * s)} ${f2(y - 5 * s)}`, c, 1.3 * s) + '</g>'; }
  function wispSvg(x, y, r, c, id, cls) { return `<g class="${cls || 'r-float'}"><circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r * 2.2)}" fill="${c}" opacity="0.35" filter="url(#${id}-blur3)"/><path d="M${f2(x - r)} ${f2(y)} C${f2(x - r)} ${f2(y - r * 1.6)} ${f2(x + r)} ${f2(y - r * 1.6)} ${f2(x + r)} ${f2(y)} C${f2(x + r)} ${f2(y + r * 1.3)} ${f2(x + r * 0.2)} ${f2(y + r * 2.6)} ${f2(x - r * 0.6)} ${f2(y + r * 3.4)} C${f2(x - r * 0.3)} ${f2(y + r * 2)} ${f2(x - r)} ${f2(y + r * 1.2)} ${f2(x - r)} ${f2(y)} Z" fill="${light(c, 0.4)}" opacity="0.9"/><circle cx="${f2(x - r * 0.3)}" cy="${f2(y - r * 0.3)}" r="${f2(r * 0.4)}" fill="#fff"/></g>`; }
  function uniqWeaponDecor(A, name, id) {
    const U = UNIQ_W[name]; if (!U) return '';
    const ang = wAxis(A), [gx, gy] = A.g, [px, py] = A.p, [hx, hy] = A.h, glow = U.glow;
    const g = { id: id };
    const gl = (d, w, c, op) => glowLine(g, d, c || glow, w, op);
    const halo = (x, y, r, c, op) => `<g opacity="${op || 0.4}"><circle class="r-glow" cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="${c || glow}" filter="url(#${id}-blur6)"/></g>`;
    const segD = A.seg ? `M${A.seg[0].join(' ')} L${A.seg[1].join(' ')}` : '';
    const sp = n => segPts(A, n);
    const tw = (x, y, r, c, k) => `<path class="r-twinkle" style="animation-delay:-${((k || 0) * 0.37 % 2).toFixed(2)}s;transform-origin:${f2(x)}px ${f2(y)}px" d="${starD(x, y, r, 4, 0.3)}" fill="${c || '#fff'}"/>`;
    let s = '';
    switch (U.fx) {
      case 'sun': s += halo(gx, gy, 14, '#ffb347', 0.55) + sunAt(gx, gy, 9, '#ffcf5a') + `<circle cx="${gx}" cy="${gy}" r="4" fill="#fff4cf"/>` + (segD ? gl(segD, 1.4, '#ffe2a0') : '') + tw(hx, hy, 6, '#fff4cf', 1); break;
      case 'midnight': s += sp(6).map(([x, y], i) => `<path d="${starD(x + (i % 2 ? 2 : -2), y, 1.8 + (i % 3) * 0.5, 4, 0.35)}" fill="#e8ecff"/>`).join('') + `<path d="${crescentP(px, py, 6, 60, 0.5)}" fill="#e8ecff" stroke="#3a3f78" stroke-width="1"/>` + halo(px, py, 9, '#8f9cff'); break;
      case 'cracks': { let d = ''; sp(9).forEach(([x, y], i) => { const p = axis(x, y, ang); d += (i ? 'L' : 'M') + p(0, i % 2 ? 2.4 : -2.4) + ' '; }); s += (A.seg ? gl(d, 1.2, '#7fe8ff') : '') + `<path class="r-glow" d="${starD(gx, gy, 11, 4, 0.25)}" fill="#dff8ff" stroke="#7fe8ff" stroke-width="1"/>` + halo(gx, gy, 12, '#7fe8ff'); break; }
      case 'moonbow': s += [A.h, A.h2 || A.h].map(([x, y], i) => `<path d="${crescentP(x + 4, y + (i ? -4 : 4), 7, i ? 45 : -45, 0.5)}" fill="#eef3ff" stroke="#6a78a8" stroke-width="1"/>` + halo(x, y, 8, '#cfe0ff')).join('') + `<circle cx="${gx}" cy="${gy}" r="5" fill="#eef3ff" stroke="#6a78a8" stroke-width="1"/>` + (segD ? gl(segD, 1, '#eef3ff', 0.3) : ''); break;
      case 'wind': s += [0, 1, 2].map(i => `<path class="r-float" style="animation-delay:-${i * 0.6}s" d="M${gx} ${gy - 4 + i * 6} C${gx - 14} ${gy - 10 + i * 8} ${gx - 18} ${gy + 10 + i * 6} ${gx - 34 - i * 6} ${gy + 4 + i * 10}" fill="none" stroke="${['#9affc8', '#c8ffe0', '#5fd39a'][i]}" stroke-width="${2.4 - i * 0.5}" stroke-linecap="round" opacity="0.85"/>`).join('') + leafAt(gx - 8, gy + 4, '#5fd39a') + (A.h2 ? halo(A.h[0], A.h[1], 8, '#9affc8') + halo(A.h2[0], A.h2[1], 8, '#9affc8') : ''); break;
      case 'falling': s += S(`M${gx} ${gy} L${gx - 26} ${gy - 22} M${gx + 2} ${gy + 3} L${gx - 20} ${gy - 8} M${gx - 1} ${gy - 3} L${gx - 16} ${gy - 30}`, '#ffe2a0', 1.6, { op: 0.75 }) + halo(gx, gy, 12, '#ffe2a0', 0.55) + `<path d="${starD(gx, gy, 8)}" fill="#ffe9a8" stroke="#c4902a" stroke-width="1"/>` + [A.h, A.h2 || A.h].map(([x, y], k) => tw(x, y, 4, '#fff4cf', k)).join(''); break;
      case 'flame': s += halo(hx, hy - 8, 20, '#ff8a3a', 0.55) + flameSvg(hx, hy + 6, 1.15, '#ff5a2a', '#ffa040', '#fff0a0') + [0, 1, 2].map(k => `<circle class="r-p" style="animation-delay:-${k * 0.9}s;animation-duration:2.2s" cx="${hx - 6 + k * 6}" cy="${hy - 14}" r="1.6" fill="#ffcf5a"/>`).join(''); break;
      case 'fog': s += [0, 1, 2].map(k => `<ellipse class="r-smoke" style="animation-delay:-${k * 1.1}s" cx="${hx + (k - 1) * 10}" cy="${hy - 4 - k * 4}" rx="${12 - k * 2}" ry="6" fill="#dbe8ee" opacity="0.55" filter="url(#${id}-blur3)"/>`).join('') + S(`M${hx - 10} ${hy} C${hx - 10} ${hy - 12} ${hx + 10} ${hy - 12} ${hx + 8} ${hy - 2} C${hx + 6} ${hy + 6} ${hx - 4} ${hy + 4} ${hx - 2} ${hy - 4}`, '#eef6fa', 1.6, { op: 0.8 }); break;
      case 'weave': { const pts = [[-16, -10], [-6, -22], [10, -18], [18, -4], [4, 6]].map(([dx, dy]) => [hx + dx, hy + dy]); s += S('M' + pts.map(q => q.join(' ')).join(' L') + ' Z', '#cfd8ff', 0.9, { op: 0.75 }) + pts.map((q, k) => tw(q[0], q[1], 3.2, k % 2 ? '#ffe2a0' : '#fff', k)).join('') + halo(hx, hy - 6, 16, '#cfd8ff', 0.35); break; }
      case 'dawn': s += halo(hx, hy, 20, '#ff9ac0', 0.55) + [0, 1, 2, 3, 4, 5, 6].map(k => { const a = -170 + k * 26, p = axis(hx, hy, a); return S(`M${p(12, 0)} L${p(22 + (k % 2) * 6, 0)}`, '#ffc4d4', 2, { op: 0.9 }); }).join('') + `<circle cx="${hx}" cy="${hy}" r="6" fill="#ffe0ea"/>`; break;
      case 'light': s += halo(hx, hy, 26, '#fff3c0', 0.6) + `<g class="r-glow">${[0, 1, 2, 3, 4, 5, 6, 7].map(k => { const p = axis(hx, hy, k * 45 + 22.5); return S(`M${p(6, 0)} L${p(k % 2 ? 22 : 32, 0)}`, '#fffbe8', k % 2 ? 1.2 : 2); }).join('')}</g>` + `<path d="${starD(hx, hy, 9, 4, 0.3)}" fill="#fff"/>`; break;
      case 'well': s += halo(hx, hy, 18, '#7fd0ff') + [0, 1, 2].map(k => `<ellipse class="r-glow" style="animation-delay:-${k * 0.6}s" cx="${hx}" cy="${hy + 2}" rx="${8 + k * 6}" ry="${3 + k * 2}" fill="none" stroke="#bfe8ff" stroke-width="${1.4 - k * 0.3}"/>`).join('') + `<path d="${crescentP(hx, hy - 16, 5, -90, 0.5)}" fill="#eef8ff" stroke="#3a7ab8" stroke-width="0.8"/>`; break;
      case 'shadow': s += sp(4).concat([A.h]).map(([x, y], k) => `<ellipse class="r-smoke" style="animation-delay:-${k * 0.7}s" cx="${x + (k % 2 ? 6 : -6)}" cy="${y}" rx="7" ry="5" fill="#6a3aa8" opacity="0.6" filter="url(#${id}-blur3)"/>`).join('') + (segD ? gl(segD, 1, '#d8b8ff', 0.4) : '') + `<path d="M${px - 4} ${py - 3} C${px - 6} ${py - 8} ${px - 1} ${py - 9} ${px} ${py - 6} C${px + 1} ${py - 9} ${px + 6} ${py - 8} ${px + 4} ${py - 3} L${px} ${py + 2} Z" fill="#c070ff" stroke="#4a1a6a" stroke-width="0.8"/>`; break;
      case 'sting': s += sp(4).map(([x, y], k) => `<path d="${starD(x, y, 1.6 + (k % 2), 4, 0.35)}" fill="#cfd8ff"/>`).join('') + `<path class="r-drip" style="transform-origin:${hx}px ${hy}px" d="M${hx} ${hy + 2} C${hx - 3} ${hy + 7} ${hx - 3} ${hy + 10} ${hx} ${hy + 10} C${hx + 3} ${hy + 10} ${hx + 3} ${hy + 7} ${hx} ${hy + 2} Z" fill="#8affb0" stroke="#2a6f4a" stroke-width="0.8"/>` + halo(hx, hy, 8, '#5a7bff'); break;
      case 'whisper': s += (segD ? `<path d="${segD}" stroke="#ffffff" stroke-width="7" opacity="0.25" stroke-linecap="round" fill="none"/>` : '') + sp(3).map(([x, y], k) => { const p = axis(x, y, ang); return `<path class="r-smoke" style="animation-delay:-${k * 0.8}s" d="M${p(0, 4)} C${p(-4, 12)} ${p(4, 16)} ${p(-2, 24)}" fill="none" stroke="#eef6ff" stroke-width="1.2" opacity="0.8"/>`; }).join('') + halo(gx, gy, 10, '#dff4ff', 0.35); break;
      case 'wisp': s += wispSvg(hx, hy, 6, '#7fffb0', id) + wispSvg(hx + 18, hy - 22, 3, '#7fffb0', id) + wispSvg(hx - 16, hy - 30, 2.4, '#bfffd8', id); break;
      case 'silence': s += `<g class="r-spin" style="transform-origin:${hx}px ${hy}px"><circle cx="${hx}" cy="${hy}" r="20" fill="none" stroke="#c8b0ff" stroke-width="1.4" stroke-dasharray="3 4" opacity="0.85"/>${[0, 90, 180, 270].map(a => { const p = axis(hx, hy, a); return S(`M${p(17, -2)} L${p(23, 0)} L${p(17, 2)}`, '#e8dcff', 1.2); }).join('')}</g>` + halo(hx, hy, 14, '#c8b0ff', 0.35) + S(`M${hx - 5} ${hy - 26} L${hx + 5} ${hy - 26}`, '#e8dcff', 2); break;
      case 'spirit': s += halo(hx, hy, 16, '#7fd8ff', 0.5) + flameSvg(hx, hy + 4, 0.75, '#4aa8ff', '#9fe0ff', '#ffffff') + wispSvg(hx + 16, hy - 26, 2.6, '#9fe0ff', id) + wispSvg(hx - 14, hy - 18, 2, '#9fe0ff', id); break;
      case 'starsong': s += noteSvg(hx + 12, hy - 8, 1, '#ffe2a0') + noteSvg(hx - 10, hy - 20, 0.8, '#fff4cf') + `<path d="${starD(gx, gy, 6)}" fill="#ffe2a0" stroke="#c4902a" stroke-width="0.8"/>` + tw(hx + 22, hy - 24, 3.4, '#fff', 2) + halo(hx, hy, 12, '#ffe2a0', 0.3); break;
      case 'awaken': s += sp(3).concat([A.h]).map(([x, y], k) => flower(x + (k % 2 ? 4 : -4), y, k % 2 ? '#ffc890' : '#ffe2a0')).join('') + halo(hx, hy, 14, '#ffc890', 0.45) + noteSvg(hx + 14, hy - 12, 0.8, '#ffc890'); break;
      case 'moonsong': s += `<path d="${crescentP(hx, hy - 6, 7, -60, 0.5)}" fill="#eef3ff" stroke="#6a78a8" stroke-width="1"/>` + noteSvg(hx + 12, hy - 18, 0.8, '#dfe8ff') + noteSvg(hx - 12, hy - 28, 0.7, '#eef3ff') + halo(hx, hy - 6, 12, '#cfe0ff', 0.4); break;
      case 'fang': s += S(`M${gx - 8} ${gy - 4} Q${gx - 4} ${gy + 10} ${gx + 8} ${gy + 6}`, '#5a4030', 1.2) + [[gx - 6, gy + 3], [gx, gy + 6], [gx + 6, gy + 5]].map(([x, y]) => P(`M${x - 2} ${y} L${x + 2} ${y} L${x} ${y + 8} Z`, '#f6f2e6', { stroke: '#8a7a5a', sw: 0.8 })).join('') + P(`M${gx - 6} ${gy - 8} C${gx - 14} ${gy - 4} ${gx - 14} ${gy + 4} ${gx - 8} ${gy + 2} C${gx - 10} ${gy - 2} ${gx - 6} ${gy - 4} ${gx - 6} ${gy - 8} Z`, '#a8a8b8', { sw: 1 }); break;
      case 'wild': s += sp(3).map(([x, y], k) => leafAt(x + (k % 2 ? 6 : -2), y + 4, k % 2 ? '#5fd39a' : '#2f8a5c')).join('') + S(`M${gx - 4} ${gy - 6} C${gx + 6} ${gy - 2} ${gx - 6} ${gy + 4} ${gx + 4} ${gy + 8}`, '#3f7a3a', 2) + halo(hx, hy, 10, '#7fe39a', 0.35); break;
      case 'storm': s += [[hx, hy - 4], [gx + 10, gy - 14], [hx - 16, hy + 10]].map(([x, y], k) => `<path class="r-spark" style="animation-delay:-${k * 0.7}s" d="M${x} ${y} l6 -9 l-2 7 l7 -9" fill="none" stroke="#bfe8ff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`).join('') + halo(hx, hy, 12, '#7fd8ff', 0.45); break;
      case 'starblade': s += halo(gx, gy, 16, '#9fe8ff', 0.6) + (segD ? gl(segD, 1.6, '#dff8ff', 0.6) : '') + sp(7).map(([x, y], k) => tw(x + (k % 2 ? 1.5 : -1.5), y, 2.2 + (k % 3) * 0.6, k % 3 ? '#fff' : '#ffe2a0', k)).join('') +
        `<g class="r-spin" style="transform-origin:${gx}px ${gy}px">${[0, 120, 240].map(a => { const p = axis(gx, gy, a); const [x, y] = p(16, 0).split(' ').map(Number); return `<path d="${starD(x, y, 3.4, 4, 0.3)}" fill="#dff8ff"/>`; }).join('')}<circle cx="${gx}" cy="${gy}" r="16" fill="none" stroke="#9fe8ff" stroke-width="0.8" opacity="0.6" stroke-dasharray="2 5"/></g>` + `<path d="${starD(gx, gy, 7, 4, 0.3)}" fill="#fff" stroke="#9fe8ff" stroke-width="0.8"/>`; break;
    }
    return s;
  }

  // egyedi páncélok: [vállvért (jobb, helyi koord.), törzs, köpeny-típus]
  const UNIQ_P_CAPE = { 'Éjszövet Köpeny': 'u_ejszovet', 'Csillaghullás-köpeny': 'u_csillaghullas', 'Csillagfátyol Köntös': 'u_fatyol' };
  function uniqPauldron(name, side, id, L) {
    const ox = side > 0 ? 205 : 115, oy = 195, k = 1.12, kx = side > 0 ? k : -k, D = d => aff(d, ox, oy, kx, k);
    const sh = (d, fill, o) => shaded(id, D(d), fill, Object.assign({ off: [-3, -3], rim: 1.6, sw: 1.8 }, o || {}));
    const g = { id: id };
    switch (name) {
      case 'Holdpáncél': return sh(crescentP(2, -4, 24, -100, 0.5), '#e8eeff', { off: [-4, -3] }) + sh('M-20 4 C-18 -10 2 -15 15 -8 C21 -2 21 8 15 13 C5 16 -9 14 -20 4 Z', '#c8d2ee') + glowLine(g, D('M-14 4 C-6 9 6 9 13 5'), '#bfe0ff', 1.2) + `<circle cx="${f2(ox + 1 * kx)}" cy="${f2(oy - 1 * k)}" r="${f2(3 * k)}" fill="#dff4ff" stroke="#6a78a8" stroke-width="0.8"/>`;
      case 'Éjszövet Köpeny': return sh('M-24 8 C-22 -14 4 -22 20 -10 C28 -2 28 14 22 22 L16 16 L10 24 L2 16 L-6 22 L-12 14 L-20 18 Z', '#241c48', { off: [-4, -3] }) + [[-8, -6], [6, -10], [12, 4], [-2, 8]].map(([x, y], i) => `<circle class="r-twinkle" style="animation-delay:-${i * 0.5}s" cx="${f2(ox + x * kx)}" cy="${f2(oy + y * k)}" r="${i % 2 ? 1 : 1.4}" fill="#e8ecff"/>`).join('') + S(D('M-8 -6 L6 -10 L12 4'), '#9fb0ff', 0.7, { op: 0.6 });
      case 'Sárkánypikkely Mellvért': return [16, 6, -4].map((yy, j) => sh(`M-21 ${yy - 14} C-14 ${yy - 26} 12 ${yy - 28} 22 ${yy - 14} C22 ${yy - 6} 14 ${yy} 0 ${yy} C-12 ${yy} -21 ${yy - 6} -21 ${yy - 14} Z`, ['#6e1a2a', '#8a2232', '#a82a3a'][j], { rim: 1.2 }) + S(D(`M-16 ${yy - 13} C-8 ${yy - 21} 8 ${yy - 22} 17 ${yy - 13}`), '#e0b44a', 1.2, { op: 0.9 })).join('') +
        sh(spikeP(2, -16, 22, -64, 4.2, -4), '#f0d080', { rim: 1.2 }) + sh(spikeP(12, -10, 16, -30, 3.6, -3), '#f0d080', { rim: 1.2 }) + sh(spikeP(-8, -16, 14, -100, 3.2, 2), '#f0d080', { rim: 1.2 });
      case 'Csillagfátyol Köntös': return sh('M-20 4 C-18 -10 2 -15 15 -8 C21 -2 21 8 15 13 C5 16 -9 14 -20 4 Z', '#e6dcff') + `<path d="${D('M-22 0 C-10 -14 10 -16 24 -4 C30 12 26 30 18 44 C10 30 -4 20 -22 0 Z')}" fill="#d8ccff" opacity="0.5" stroke="#b8a8f0" stroke-width="1"/>` + [[0, 10], [10, 26], [16, 6]].map(([x, y], i) => `<path class="r-twinkle" style="animation-delay:-${i * 0.6}s;transform-origin:${f2(ox + x * kx)}px ${f2(oy + y * k)}px" d="${starD(ox + x * kx, oy + y * k, 2.4, 4, 0.3)}" fill="#fff"/>`).join('');
      case 'Csillaghullás-köpeny': return sh('M-22 6 C-20 -14 4 -20 20 -8 C26 -2 26 10 20 16 C8 20 -10 18 -22 6 Z', '#1c2458') + sh(starD(ox + 2 * kx, oy - 2 * k, 10, 5, 0.42), '#ffe2a0', { rim: 1 }) + [[18, -14, 2.6], [24, -24, 1.8], [-14, -10, 1.6]].map(([x, y, r], i) => `<path class="r-twinkle" style="animation-delay:-${i * 0.6}s;transform-origin:${f2(ox + x * kx)}px ${f2(oy + y * k)}px" d="${starD(ox + x * kx, oy + y * k, r * 1.4, 4, 0.3)}" fill="#fff4cf"/>`).join('') + `<g opacity="0.35"><circle class="r-glow" cx="${f2(ox + 2 * kx)}" cy="${f2(oy - 2 * k)}" r="12" fill="#ffe2a0" filter="url(#${id}-blur3)"/></g>`;
    }
    return '';
  }
  function uniqTorso(name, id, L, isRobe, back) {
    const g = { id: id }, male = L.sex === 'ferfi', sh = (d, fill, o) => shaded(id, d, fill, Object.assign({ off: [-4, -3], rim: 1.6, sw: 1.8 }, o || {}));
    const tw = (x, y, r, k, c) => `<path class="r-twinkle" style="animation-delay:-${(k * 0.43 % 2).toFixed(2)}s;transform-origin:${x}px ${y}px" d="${starD(x, y, r, 4, 0.3)}" fill="${c || '#fff'}"/>`;
    const yb = isRobe ? 396 : 300;
    let s = '';
    switch (name) {
      case 'Holdpáncél':
        s += sh(PLATE, '#dfe6f8') + sh(BELT, '#8a96c0', { rim: 1, off: [-2, -2] });
        if (!back) s += `<path d="${crescentP(160, 220, 14, 90, 0.45)}" fill="#f4f8ff" stroke="#6a78a8" stroke-width="1.2"/>` + `<g opacity="0.35"><circle class="r-glow" cx="160" cy="218" r="18" fill="#bfe0ff" filter="url(#${id}-blur6)"/></g>` + glowLine(g, crescentP(160, 220, 14, 90, 0.45), '#bfe0ff', 1, 0.35) + [136, 148, 160, 172, 184].map((x, i) => `<circle cx="${x}" cy="266" r="3" fill="${i === 2 ? '#f4f8ff' : '#26304e'}" stroke="#dfe6f8" stroke-width="1.2"/>`).join('') + S('M136 204 C148 198 172 198 184 204', '#ffffff', 1.4, { op: 0.6 });
        if (!isRobe) s += [130, 190].map(x => sh(`M${x - 9} 270 L${x + 9} 270 L${x + 7} 300 C${x + 3} 304 ${x - 3} 304 ${x - 7} 300 Z`, '#cdd6f0', { rim: 1.1, off: [-2, -2] }) + `<path d="${crescentP(x, 286, 4, 90, 0.5)}" fill="#26304e"/>`).join('');
        s += sh('M132 192 C140 180 150 176 160 182 C170 176 180 180 188 192 C176 198 144 198 132 192 Z', '#e8eeff', { rim: 1.2 });
        break;
      case 'Éjszövet Köpeny': // vállra vetett éjszín köpeny, csillagképek, ezüst holdcsat
        s += sh('M118 190 C130 182 190 182 202 190 C206 214 196 238 186 250 L176 232 L168 248 L160 232 L152 248 L144 232 L134 250 C124 238 114 214 118 190 Z', '#241c48', { off: [-5, -4] });
        s += [[130, 210], [140, 226], [150, 214], [176, 206], [186, 222], [170, 230]].map(([x, y], i) => tw(x, y, 1.8 + (i % 2), i)).join('') + S('M130 210 L140 226 L150 214 M176 206 L186 222 L170 230', '#9fb0ff', 0.7, { op: 0.55 });
        if (!back) s += `<path d="${crescentP(160, 196, 7, 0, 0.5)}" fill="#e8ecff" stroke="#3a3f78" stroke-width="1"/>` + `<g opacity="0.4"><circle class="r-glow" cx="160" cy="196" r="9" fill="#9fb0ff" filter="url(#${id}-blur3)"/></g>`;
        s += sh('M122 194 C120 176 140 168 160 172 C180 168 200 176 198 194 C186 186 134 186 122 194 Z', '#30265e', { rim: 1.2 });
        break;
      case 'Sárkánypikkely Mellvért': { // pikkelyminta a mellen, arany szegély, sárkányszem-csat
        const pid = id + '-scale';
        s += `<pattern id="${pid}" width="10" height="8" patternUnits="userSpaceOnUse"><rect width="10" height="8" fill="#6e1a2a"/><path d="M0 0 C0 6 10 6 10 0 M-5 4 C-5 10 5 10 5 4 M5 4 C5 10 15 10 15 4" fill="#a82a3a" stroke="#3a0a14" stroke-width="0.9"/><path d="M2 1.5 C3 3.5 7 3.5 8 1.5" fill="none" stroke="#e86a6a" stroke-width="0.7" opacity="0.7"/></pattern>`;
        const PL = 'M128 194 C146 186 174 186 192 194 L190 250 C178 262 142 262 130 250 Z';
        s += sh(PL, `url(#${pid})`, { base: '#8a2232' }) + S(PL, '#e0b44a', 2.2) + sh(BELT, '#3a1a20', { rim: 1, off: [-2, -2] }) + S('M121 259 C146 265 174 265 199 259', '#e0b44a', 1.4);
        if (!back) s += `<ellipse cx="160" cy="266" rx="8" ry="5.5" fill="#ffb02a" stroke="#e0b44a" stroke-width="1.6"/><ellipse cx="160" cy="266" rx="1.6" ry="5" fill="#2a0a0a"/>` + `<g opacity="0.35"><circle class="r-glow" cx="160" cy="266" r="10" fill="#ff8a2a" filter="url(#${id}-blur3)"/></g>` + [[140, 200, -125], [180, 200, -55]].map(([x, y, a]) => sh(spikeP(x, y, 12, a, 3.4), '#e0b44a', { rim: 1, off: [-1.5, -1.5], sw: 1.1 })).join('');
        if (!isRobe) s += [128, 146, 174, 192].map(x => sh(`M${x - 8} 270 L${x + 8} 270 L${x + 6} 298 L${x} 304 L${x - 6} 298 Z`, `url(#${pid})`, { base: '#8a2232', rim: 1.1, off: [-2, -2] }) + S(`M${x - 8} 270 L${x + 8} 270`, '#e0b44a', 1.6)).join('');
        break;
      }
      case 'Csillagfátyol Köntös': { // áttetsző csillagfátyol a ruhán, holdcsat, csillagok
        s += `<path d="M120 190 C138 182 182 182 200 190 C212 260 222 340 228 ${yb + 8} C196 ${yb + 18} 124 ${yb + 18} 92 ${yb + 8} C98 340 108 260 120 190 Z" fill="#d8ccff" opacity="0.35" stroke="#b8a8f0" stroke-width="1.2"/>`;
        s += S(`M126 200 C120 260 112 320 104 ${yb} M194 200 C200 260 208 320 216 ${yb}`, '#ffffff', 1.2, { op: 0.4 });
        s += [[132, 230], [190, 250], [124, 290], [200, 300], [140, 340], [182, 360], [118, 370], [204, 380], [160, 320]].filter(q => q[1] < yb).map(([x, y], i) => tw(x, y, 2.4 + (i % 3) * 0.8, i, i % 3 ? '#fff' : '#ffe2a0')).join('');
        s += S('M122 262 C146 270 174 270 198 262', '#c8b8ff', 4) + S('M122 262 C146 270 174 270 198 262', '#ffffff', 1, { op: 0.7 });
        if (!back) s += `<path d="${crescentP(160, 200, 8, 90, 0.5)}" fill="#fff" stroke="#8a78c8" stroke-width="1"/><path d="${starD(160, 200, 3.4, 4, 0.35)}" fill="#ffe2a0"/>` + `<g opacity="0.45"><circle class="r-glow" cx="160" cy="200" r="14" fill="#d8ccff" filter="url(#${id}-blur6)"/></g>`;
        break;
      }
      case 'Csillaghullás-köpeny': // mitikus: csillagos mellény, hullócsillag-csat; a köpeny hátul (capeSvg)
        s += sh('M118 190 C130 182 190 182 202 190 C204 210 198 226 190 238 C176 230 144 230 130 238 C122 226 116 210 118 190 Z', '#1c2458', { off: [-5, -4] }) + sh(BELT, '#1c2458', { rim: 1, off: [-2, -2] }) + S('M121 259 C146 265 174 265 199 259', '#ffe2a0', 1.4);
        s += [[130, 206], [146, 220], [176, 212], [188, 226], [160, 230]].map(([x, y], i) => tw(x, y, 2 + (i % 2), i, i % 2 ? '#ffe2a0' : '#fff')).join('');
        if (!back) s += S('M182 200 L196 186 M178 206 L198 194 M180 212 L194 206', '#ffe2a0', 1.2, { op: 0.6 }) + `<g opacity="0.45"><circle class="r-glow" cx="160" cy="200" r="16" fill="#ffe2a0" filter="url(#${id}-blur6)"/></g>` + `<path d="${starD(160, 200, 10)}" fill="#ffe9a8" stroke="#c4902a" stroke-width="1.2"/>` + gemSvg(160, 266, 4.4, '#9fe8ff', id, true);
        break;
    }
    return male ? `<g transform="translate(160 0) scale(1.12 1) translate(-160 0)">${s}</g>` : s;
  }
  function uniqAmulet(name, id, L) {
    const yy = 216, chain = c => S(`M144 190 C146 204 154 ${yy - 9} 160 ${yy - 9} C166 ${yy - 9} 174 204 176 190`, dark(c, 0.4), 2.4) + S(`M144 190 C146 204 154 ${yy - 9} 160 ${yy - 9} C166 ${yy - 9} 174 204 176 190`, c, 1.2, { extra: ' stroke-dasharray="2 1.4"' });
    switch (name) {
      case 'Az Éj Lehelete': return chain('#8a7ab8') + [0, 1, 2].map(k => `<ellipse class="r-smoke" style="animation-delay:-${k * 1.1}s" cx="${160 + (k - 1) * 7}" cy="${yy - 10 - k * 6}" rx="7" ry="4.6" fill="#6a3aa8" opacity="0.6" filter="url(#${id}-blur3)"/>`).join('') +
        `<g opacity="0.5"><circle class="r-glow" cx="160" cy="${yy}" r="16" fill="#9b6bff" filter="url(#${id}-blur6)"/></g><circle cx="160" cy="${yy}" r="9.5" fill="#140a26" stroke="#c0a0ff" stroke-width="2"/><circle class="r-glow" cx="160" cy="${yy}" r="4.6" fill="#b88cff"/><circle cx="157" cy="${yy - 3}" r="1.8" fill="#fff" opacity="0.85"/>`;
      case 'Ezüstszarv-amulett': return chain('#cfd6ea') + `<g opacity="0.45"><circle class="r-glow" cx="160" cy="${yy + 2}" r="15" fill="#dfe9ff" filter="url(#${id}-blur6)"/></g>` +
        shaded(id, `M156 ${yy - 7} C146 ${yy - 2} 148 ${yy + 12} 162 ${yy + 15} C154 ${yy + 9} 152 ${yy} 159 ${yy - 5} Z`, '#eef2ff', { off: [-2, -2], rim: 1, stroke: '#5a6898', sw: 1.2 }) + shaded(id, `M164 ${yy - 7} C174 ${yy - 2} 172 ${yy + 12} 158 ${yy + 15} C166 ${yy + 9} 168 ${yy} 161 ${yy - 5} Z`, '#dfe6f8', { off: [-2, -2], rim: 1, stroke: '#5a6898', sw: 1.2 }) + gemSvg(160, yy + 3, 3.6, '#9fe8ff', id, true) + `<circle cx="160" cy="${yy - 8}" r="2.6" fill="#cfd6ea" stroke="#5a6898" stroke-width="0.9"/>`;
    }
    return '';
  }
  // egyedi fejfedők: az alap fejfedő (a takarási szabályok miatt) és a díszítés
  const UNIQ_H_BASE = { 'Hajnalkorona': 'abroncs', 'Viharsisak': 'sisak', 'Ködlátó Csuklya': 'csuklya', 'Holdfény Diadém': 'diadem', 'Holdkorona-ékkő': 'diadem' };
  function uniqHelmDecor(name, hw, id, back) {
    const G = HWG[hw] || HWG.nincs, br = G.brow, g = { id: id };
    const sh = (d, fill, o) => shaded(id, d, fill, Object.assign({ off: [-2, -2], rim: 1.2, sw: 1.5 }, o || {}));
    const tw = (x, y, r, k, c) => `<path class="r-twinkle" style="animation-delay:-${(k * 0.43 % 2).toFixed(2)}s;transform-origin:${f2(x)}px ${f2(y)}px" d="${starD(x, y, r, 4, 0.3)}" fill="${c || '#fff'}"/>`;
    let s = '';
    switch (name) {
      case 'Hajnalkorona': { // sugaras aranykorona, mögötte napkorong-glória
        const us = [-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9];
        s += `<g opacity="0.5"><circle class="r-glow" cx="160" cy="56" r="50" fill="#ffd27a" filter="url(#${id}-blur12)"/></g>`;
        us.forEach((u, i) => { const p = hwPoint(G, u, true), len = [16, 22, 28, 36, 28, 22, 16][i]; s += sh(spikeP(p[0], p[1] + 2, len, p[2], 3.6), '#f2c650', { stroke: '#8a5a1a' }); });
        const bd = `M${G.band[0].join(' ')} C${G.band[1].join(' ')} ${G.band[2].join(' ')} ${G.band[3].join(' ')}`;
        s += S(bd, '#8a5a1a', 8) + S(bd, '#f2c650', 5.6) + S(bd, '#fff0b0', 1.2, { op: 0.8 });
        if (!back) s += gemSvg(160, hwPoint(G, 0, true)[1] - 1, 5, '#ff7a3a', id, true) + [-0.55, 0.55].map(u => { const p = hwPoint(G, u, true); return `<circle cx="${f2(p[0])}" cy="${f2(p[1])}" r="2.4" fill="#fff4cf" stroke="#8a5a1a" stroke-width="0.7"/>`; }).join('');
        break;
      }
      case 'Viharsisak': { // szárnyas acélsisak villámtaréjjal
        [[104, 106, -1], [216, 106, 1]].forEach(([x, y, sd]) => {
          for (let j = 2; j >= 0; j--) { const a = sd > 0 ? -50 + j * 18 : -130 - j * 18, len = 34 - j * 7; s += sh(leafP(x, y, len, a, 5.6 - j), mix('#cfd6ea', '#5a6488', j * 0.2), { rim: 1 }); }
        });
        const top = hwPoint(G, 0)[1];
        s += `<g opacity="0.4"><circle class="r-glow" cx="160" cy="${top - 10}" r="16" fill="#7fd8ff" filter="url(#${id}-blur6)"/></g>` + P(`M160 ${top + 6} L150 ${top - 12} L158 ${top - 12} L152 ${top - 30} L168 ${top - 8} L161 ${top - 8} L166 ${top + 6} Z`, '#dff6ff', { stroke: '#2a7ab8', sw: 1.2 }) +
          `<path class="r-spark" d="M140 ${top - 4} L134 ${top - 12} L139 ${top - 11} L134 ${top - 20}" fill="none" stroke="#bfe8ff" stroke-width="1.6"/><path class="r-spark" style="animation-delay:-1.1s" d="M182 ${top - 2} L188 ${top - 10} L183 ${top - 9} L188 ${top - 18}" fill="none" stroke="#bfe8ff" stroke-width="1.6"/>`;
        if (!back) s += gemSvg(br[0], br[1] - 4, 4.4, '#5ab4ff', id, true);
        break;
      }
      case 'Ködlátó Csuklya': // ködfoszlányok a csuklya körül, izzó harmadik szem a homlokon, ezüst szegély
        s += [[112, 140], [208, 132], [130, 64], [196, 70]].map(([x, y], k) => `<ellipse class="r-smoke" style="animation-delay:-${k * 0.9}s" cx="${x}" cy="${y}" rx="16" ry="8" fill="#d8eef0" opacity="0.5" filter="url(#${id}-blur6)"/>`).join('');
        if (!back) s += S('M114 150 C110 112 128 84 160 82 C192 84 210 112 206 150', '#cfe6ea', 2, { op: 0.9 }) + `<ellipse cx="${br[0]}" cy="${br[1] + 6}" rx="8" ry="4.6" fill="#0e2a30" stroke="#cfe6ea" stroke-width="1.2"/><circle class="r-glow" cx="${br[0]}" cy="${br[1] + 6}" r="3" fill="#7ff3e0"/><g opacity="0.35"><circle class="r-glow" cx="${br[0]}" cy="${br[1] + 6}" r="10" fill="#7ff3e0" filter="url(#${id}-blur3)"/></g>`;
        break;
      case 'Holdfény Diadém': // ezüst holdsarló-tiara, lógó holdkő, kis sarlók oldalt
        if (!back) {
          s += `<g opacity="0.4"><circle class="r-glow" cx="160" cy="76" r="16" fill="#cfe0ff" filter="url(#${id}-blur6)"/></g>` + sh(crescentP(160, 78, 11, 90, 0.5), '#eef3ff') + [-0.6, 0.6].map(u => { const p = hwPoint(G, u, true); return sh(crescentP(p[0], p[1] - 4, 5, 90, 0.5), '#dfe6f8'); }).join('');
          s += S(`M160 89 L160 96`, '#cfd6ea', 1) + `<ellipse cx="160" cy="100" rx="2.6" ry="3.6" fill="#dff4ff" stroke="#6a78a8" stroke-width="0.8"/>`;
        } else s += sh(crescentP(160, 78, 11, 90, 0.5), '#dfe6f8');
        break;
      case 'Holdkorona-ékkő': { // mitikus: lebegő holdsarló-korona, óriás holdkő, keringő szikrák
        s += `<g opacity="0.35"><circle class="r-glow" cx="160" cy="62" r="40" fill="#bfe0ff" filter="url(#${id}-blur12)"/></g>`;
        s += `<g class="r-float">` + [-0.8, -0.4, 0, 0.4, 0.8].map((u, i) => { const p = hwPoint(G, u, true); return sh(crescentP(p[0], p[1] - 18 - (i === 2 ? 6 : 0), i === 2 ? 9 : 6, p[2] + 180, 0.55), i === 2 ? '#f4f8ff' : '#dfe6f8', { rim: 1 }); }).join('') + `</g>`;
        if (!back) s += gemSvg(160, 82, 7, '#9fe8ff', id, true);
        s += [[124, 56], [196, 50], [160, 34], [110, 82], [212, 80]].map(([x, y], k) => tw(x, y, 3, k, k % 2 ? '#ffe2a0' : '#fff')).join('');
        break;
      }
    }
    return s;
  }

  // ---------- új szárnyak (a régiek mellé) ----------
  function wingsExtra(w, id) {
    const B = (d, f) => both(d).map(f).join('');
    switch (w) {
      case 'toll': { // fehér-szürke tollszárny: telt sziluett, evezőtollak, rétegzett fedőtollak
        const tips = [[20, 118], [18, 148], [26, 176], [44, 200], [68, 218], [96, 230], [124, 236], [150, 236]];
        let d = 'M156 210 C132 150 80 106 20 118';
        for (let i = 1; i < tips.length; i++) { const q = tips[i - 1], r = tips[i]; d += ` Q${f2((q[0] + r[0]) / 2 - 10)} ${f2((q[1] + r[1]) / 2 + 12)} ${r[0]} ${r[1]}`; }
        d += ' Z';
        let s = B(d, x => shaded(id, x, '#e9ebf3', { off: [-5, -4], rim: 1.6, stroke: '#767c96', sw: 1.8, dark: 0.3 }));
        s += B(tips.slice(1, -1).map(t => `M${t[0]} ${t[1]} L${f2((t[0] * 0.45 + 150 * 0.55))} ${f2((t[1] * 0.45 + 196 * 0.55))}`).join(' '), x => S(x, '#9aa0ba', 1.2, { op: 0.8 }));
        // fedőtollak két sorban, a csont íve mentén
        const arc = t => bez([156, 210], [130, 140], [80, 112], [26, 122], t);
        [[0.92, 22, 9, '#f6f7fb'], [0.7, 16, 8, '#ffffff']].forEach(([span, len, w, col], row) => {
          for (let i = 7; i >= 0; i--) { const t = 0.08 + span * i / 7, [x, y] = arc(t), a = 100 + 70 * t; s += B(leafP(x + row * 2, y + 4 + row * 2, len + 8 * (1 - t), a, w), x2 => shaded(id, x2, col, { off: [-2, -2], rim: 1, stroke: '#8a90a8', sw: 1.1 })); }
        });
        return s + B('M156 210 C132 150 80 108 22 120', x => S(x, '#ffffff', 2.4, { op: 0.7 }));
      }
      case 'kristaly': { // cián kristályszilánkok legyezője, belül fény
        const sh = [[196, 108, 14], [211, 124, 16], [227, 118, 15], [243, 96, 13], [181, 84, 12], [166, 62, 10]];
        let s = `<g opacity="0.18"><ellipse class="r-glow" cx="160" cy="190" rx="118" ry="70" fill="#7fe8ff" filter="url(#${id}-blur6)"/></g>`;
        sh.forEach(([a, len, w]) => { s += B(shardP(156, 214, len, a, w), d => `<path d="${d}" fill="#9fe9ff" fill-opacity="0.72" stroke="#2a8fb8" stroke-width="1.6" stroke-linejoin="round"/>`) + B(shardHi(156, 214, len, a, w), d => S(d, '#ffffff', 1.2, { op: 0.85 })) + B(shardP(156, 214, len * 0.55, a, w * 0.45), d => `<path d="${d}" fill="#e6fbff" opacity="0.55"/>`); });
        return s + `<g class="r-float">` + B(shardP(46, 156, 12, 210, 3), d => `<path d="${d}" fill="#bff4ff" stroke="#2a8fb8" stroke-width="1"/>`) + B(shardP(70, 96, 9, 240, 2.4), d => `<path d="${d}" fill="#bff4ff" stroke="#2a8fb8" stroke-width="1"/>`) + `</g>`;
      }
      case 'lang': { // lángszárny: felfelé csapó lángnyelvek, vibrál
        const tips = [[34, 98], [26, 134], [34, 166], [52, 192], [80, 210], [110, 222], [140, 228]];
        const mk = (k, sh) => { let d = `M156 214 C136 160 92 104 ${f2(160 - (160 - tips[0][0]) * k)} ${f2(214 - (214 - tips[0][1]) * k)}`; for (let i = 1; i < tips.length; i++) { const a = tips[i - 1], b = tips[i], ax = 160 - (160 - a[0]) * k, ay = 214 - (214 - a[1]) * k, bx = 160 - (160 - b[0]) * k, by = 214 - (214 - b[1]) * k; d += ` Q${f2((ax + bx) / 2 + 18 * k)} ${f2((ay + by) / 2 + 2 * k + sh)} ${f2(bx)} ${f2(by)}`; } return d + ' Z'; };
        const L1 = mk(1, 0), L2 = mk(0.74, 2), L3 = mk(0.48, 2);
        return `<g opacity="0.2"><ellipse class="r-glow" cx="160" cy="180" rx="130" ry="80" fill="#ff7a2a" filter="url(#${id}-blur6)"/></g>` + ['l', 'r'].map((sd, i) => { const f = i ? mirror : (d => d); return `<g class="r-flame" style="transform-origin:${i ? 164 : 156}px 214px;animation-delay:-${i * 0.3}s"><path d="${f(L1)}" fill="#e8402a" stroke="#8a1a10" stroke-width="1.6" stroke-linejoin="round" opacity="0.92"/><path d="${f(L2)}" fill="#ff8a3a"/><path d="${f(L3)}" fill="#ffd27a"/></g>`; }).join('') +
          [0, 1, 2, 3].map(k => `<circle class="r-p" style="animation-delay:-${k * 0.8}s;animation-duration:2.4s" cx="${[60, 96, 230, 262][k]}" cy="${[150, 120, 128, 160][k]}" r="1.8" fill="#ffcf5a"/>`).join('');
      }
      case 'holdezust': { // ezüst sarlópengék hármasa, bevésett holdsarlókkal
        let s = `<ellipse cx="160" cy="190" rx="120" ry="64" fill="#cfe0ff" opacity="0.14" filter="url(#${id}-blur6)"/>`;
        [[[26, 108], 40, 30], [[34, 160], 32, 26], [[66, 210], 24, 20]].forEach(([tp, bulge, th]) => {
          const p = axis(156, 214, Math.atan2(tp[1] - 214, tp[0] - 156) / DEG), L = Math.hypot(tp[0] - 156, tp[1] - 214);
          const d = `M156 214 Q${p(L * 0.5, -bulge)} ${p(L, 0)} Q${p(L * 0.55, -bulge + th)} 156 214 Z`;
          s += B(d, x => shaded(id, x, '#dde4f4', { off: [-4, -4], rim: 1.6, stroke: '#5a6890', sw: 1.8 })) + B(`M${p(L * 0.12, -bulge * 0.2)} Q${p(L * 0.5, -bulge * 0.86)} ${p(L * 0.95, -1)}`, x => S(x, '#ffffff', 1.6, { op: 0.85 }));
          [0.34, 0.56, 0.76].forEach(u => { const [cx, cy] = p(L * u, -bulge * 0.5 + th * 0.22 * (1 - Math.abs(u - 0.5))).split(' ').map(Number); s += B(crescentP(cx, cy, 3.6 - u * 1.2, -90, 0.5), x => `<path d="${x}" fill="#7a86b0" opacity="0.9"/>`); });
        });
        return s;
      }
      case 'csillag': { // csillagos éjszaka-hártya bordákkal
        const d = 'M156 214 C130 156 84 116 26 112 C40 132 40 150 30 168 C48 166 60 176 58 196 C76 186 94 194 100 214 C114 204 134 208 150 232 Z';
        const gid = id + '-wst';
        let s = `<linearGradient id="${gid}" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2a2468"/><stop offset="1" stop-color="#0e1238"/></linearGradient>`;
        s += B(d, x => `<path d="${x}" fill="url(#${gid})" stroke="#0a0c28" stroke-width="2" stroke-linejoin="round"/>`) + B('M156 214 C120 170 80 140 28 114 M154 218 C120 190 80 170 32 168 M152 222 C120 204 90 198 60 196 M150 226 C130 214 116 212 100 214', x => S(x, '#5a6ab8', 1.4, { op: 0.8 }));
        const st = [[48, 128, 2.4], [80, 140, 1.8], [64, 160, 2], [100, 176, 1.6], [120, 190, 2.2], [86, 196, 1.4], [44, 150, 1.4], [128, 168, 1.4]];
        st.forEach(([x, y, r], k) => { s += [[x, y], [320 - x, y]].map(([X, Y]) => `<path class="r-twinkle" style="animation-delay:-${(k * 0.37 % 2).toFixed(2)}s;transform-origin:${f2(X)}px ${Y}px" d="${starD(X, Y, r * 1.6, 4, 0.3)}" fill="${k % 3 ? '#ffffff' : '#ffe2a0'}"/>`).join(''); });
        return s + B('M48 128 L64 160 L80 140 L100 176', x => S(x, '#9fb0ff', 0.6, { op: 0.6 }));
      }
      case 'arny': { // füstös árnyszárny: elmosott foszlányok, sötét magvonalak
        const wisps = ['M156 214 C126 150 82 110 30 118 C60 128 84 150 100 176 C70 160 44 162 24 176 C56 176 86 192 110 214 C92 210 74 216 64 232 C96 222 130 222 154 236 Z'];
        let s = B(wisps[0], x => `<path d="${x}" fill="#24163c" opacity="0.9" filter="url(#${id}-blur3)"/>`) + B(wisps[0], x => `<path d="${x}" fill="#3a2460" opacity="0.75"/>`);
        s += B('M154 216 C124 160 84 124 34 120 M150 222 C120 188 80 170 30 176 M146 228 C120 214 90 214 68 230', x => S(x, '#1a0e2e', 2.2, { op: 0.8 }));
        s += [0, 1, 2].map(k => B(`M${[40, 30, 70][k]} ${[118, 176, 232][k]} C${[24, 14, 54][k]} ${[110, 172, 236][k]} ${[16, 8, 44][k]} ${[124, 186, 248][k]} ${[8, 0, 34][k]} ${[112, 180, 254][k]}`, x => `<path class="r-smoke" style="animation-delay:-${k * 0.9}s" d="${x}" fill="none" stroke="#4a2a6e" stroke-width="5" stroke-linecap="round" opacity="0.6" filter="url(#${id}-blur3)"/>`)).join('');
        return `<ellipse cx="160" cy="190" rx="120" ry="70" fill="#9b6bff" opacity="0.1" filter="url(#${id}-blur6)"/>` + s;
      }
    }
    return '';
  }

  // ---------- a teljes hős ----------
  function hero(h, opts) {
    opts = opts || {};
    const L = Object.assign(defaultLook(h.classId), h.rig || h.lookV2 || {});
    const cls = h.classId || 'magus';
    RUNE_I = 0; // a rúnák sorrendje minden rajzolásnál ugyanaz
    // egyedi fejfedő: a saját alapformáját hozza (így a haj / fül / szarv takarása is ahhoz igazodik)
    const uH = L.uniqH && UNIQ_H_BASE[uniqName(L.uniqH)] ? uniqName(L.uniqH) : null;
    if (uH) L.headwear = UNIQ_H_BASE[uH];
    const UW = L.uniqW && UNIQ_W[uniqName(L.uniqW)];
    // fegyverfény: wGlowLv 1 halvány, 2 erős, 3 erős (ritkaságszín), 4 + szikrák; nélküle a régi viselkedés
    const gLv = L.wGlowLv ? Math.max(1, Math.min(4, Math.round(+L.wGlowLv) || 1)) : 0; // a fény csak a fejlesztésből jön (az egyedi fegyvernél is)
    const wGlowC = gLv && UW ? UW.glow : L.wGlow || (gLv ? SET_ACC[L.wset] || '#c79bff' : null); // az egyedi fegyver a saját színében izzik
    const wSpark = gLv ? (gLv >= 4 || !!L.wSpark) : !!L.wSpark;
    const gSD = gLv ? [0, 2, 3.2, 4.2, 5][gLv] : (wSpark ? 4.5 : 3.2), gOP = gLv ? [0, 0.45, 0.8, 0.95, 1][gLv] : (wSpark ? 0.95 : 0.8);
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
      ${wGlowC ? `<filter id="${id}-wglow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur in="SourceAlpha" stdDeviation="${gSD}" result="b"/><feFlood flood-color="${wGlowC}" flood-opacity="${gOP}"/><feComposite in2="b" operator="in" result="g"/><feMerge><feMergeNode in="g"/>${gLv === 1 ? '' : '<feMergeNode in="g"/>'}<feMergeNode in="SourceGraphic"/></feMerge></filter>` : ''}
      ${UW && UW.blade ? `<linearGradient id="${id}-umetal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light(UW.blade, 0.55)}"/><stop offset="0.45" stop-color="${UW.blade}"/><stop offset="0.5" stop-color="${dark(UW.blade, 0.25)}"/><stop offset="1" stop-color="${UW.blade}"/></linearGradient>` : ''}
      <filter id="${id}-blur6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="${id}-blur12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
      <clipPath id="${id}-headclip"><path d="${HEADS[L.face] || HEADS.ovalis}"/></clipPath>
      <clipPath id="${id}-outhead"><path clip-rule="evenodd" d="M-60 -120 L380 -120 L380 520 L-60 520 Z ${HEADS[L.face] || HEADS.ovalis}"/></clipPath>
      <clipPath id="${id}-hairclip"><path d="${FH ? FH.cap : 'M0 0 Z'}"/></clipPath>
    </defs>`;
    // a ritka fegyver fénye (lila: halvány izzás; legendás: arany fény és szikrák)
    const star = (x, y, r) => `<path d="M${x} ${y - r} L${x + r * 0.28} ${y - r * 0.28} L${x + r} ${y} L${x + r * 0.28} ${y + r * 0.28} L${x} ${y + r} L${x - r * 0.28} ${y + r * 0.28} L${x - r} ${y} L${x - r * 0.28} ${y - r * 0.28} Z" fill="#fff6c8"/>`;
    const wWrap = svg => !wGlowC ? svg : `<g filter="url(#${id}-wglow)">${svg}</g>` + (wSpark ? `<g class="r-glow">${star(GRIP[0] + 14, GRIP[1] - 58, 5)}${star(GRIP[0] - 12, GRIP[1] - 96, 4)}${star(GRIP[0] + 6, GRIP[1] - 132, 6)}</g>` : '');
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
    const capeB = `<g${T(`translate(${fx(160 - 8 * sn)} 0) scale(${fx(sg * bodyW)} 1) translate(-160 0)`)}><g class="r-cape" style="transform-origin:160px 192px">${capeSvg((uniqP(L) && UNIQ_P_CAPE[uniqP(L)]) || L.cape, L, id)}</g></g>`;
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
    // hátulról a kézfej látszik: nincs hüvelykujj és ujjhajlat, helyette a bütykök íve és két finom ín
    const handBack = c < -0.2;
    const hand = (H, Tm, side) => handBack
      ? shaded(id, H, L.skin, { off: [-3, -2], rim: 1.4 }) + S(side > 0 ? 'M203.5 287 C209 291.5 216 291.5 221.5 286.5' : mirror('M203.5 287 C209 291.5 216 291.5 221.5 286.5'), dark(L.skin, 0.38), 1.2, { op: 0.75 })
        + S(side > 0 ? 'M209 271 L210.5 284 M215.5 270.5 L216 283.5' : mirror('M209 271 L210.5 284 M215.5 270.5 L216 283.5'), dark(L.skin, 0.25), 0.9, { op: 0.45 })
      : shaded(id, H, L.skin, { off: [-3, -2], rim: 1.4 }) + P(Tm, L.skin, { sw: 1.6 }) + S(side > 0 ? 'M210 279 L222 278 M210 284.5 L221.5 284' : mirror('M210 279 L222 278 M210 284.5 L221.5 284'), dark(L.skin, 0.4), 1.1, { op: 0.7 });
    // férfiaknál vállvédő / vállkendő a karok tetején: szélesebb, szögletesebb vállvonal
    const PAUL = 'M183 196 C186 180 212 176 224 194 C226 205 219 213 208 213 C195 213 185 207 183 196 Z';
    const paulC = { harcos: null, alakvalto: '#8a6a4a', vadasz: '#6a4630', orgyilkos: dark(L.c1, 0.2) }[cls];
    const paul = (d) => !male ? '' : cls === 'harcos' ? shaded(id, d, metalFill(id), { base: m, off: [-4, -3] }) : shaded(id, d, paulC || dark(L.c2, 0.08), { off: [-4, -3] });
    const gA = L.gset && SET_ACC[L.gset] && !uniqP(L) ? gearCtx(L, id, L.gset, L.gtier) : null, aType = ARMOR_TYPE[cls] || 'v';
    const gearPaul = side => uniqP(L) ? uniqPauldron(uniqP(L), side, id, L) : gA ? setPauldron(gA, aType, side) : null;
    const paulR = gearPaul(1) != null ? gearPaul(1) : paul(PAUL) + (male && cls === 'harcos' ? `<path d="M190 200 C196 190 212 188 220 198" fill="none" stroke="${dark(m, 0.45)}" stroke-width="1.4"/><circle cx="204" cy="190" r="2" fill="${light(m, 0.4)}"/>` : male && cls === 'alakvalto' ? S('M186 204 l-3 6 M194 210 l-1 6 M204 212 l0 6 M214 210 l2 6', '#5a4030', 2) : '');
    const paulL = gearPaul(-1) != null ? gearPaul(-1) : paul(mirror(PAUL)) + (male && cls === 'harcos' ? `<path d="${mirror('M190 200 C196 190 212 188 220 198')}" fill="none" stroke="${dark(m, 0.45)}" stroke-width="1.4"/><circle cx="116" cy="190" r="2" fill="${light(m, 0.4)}"/>` : male && cls === 'alakvalto' ? S(mirror('M186 204 L183 210 M194 210 L193 216 M204 212 L204 218 M214 210 L216 216'), '#5a4030', 2) : '');
    const AS = male ? ' translate(204 192) scale(1.08) translate(-204 -192)' : '', ASL = male ? ' translate(116 192) scale(1.08) translate(-116 -192)' : '';
    const armDist = 44 + armShift;
    let armR = `<g class="r-arm-r" style="transform-origin:${198 + armShift}px 196px"><g transform="translate(${armShift} 0)${AS}">${shaded(id, ARM_R, sleeve, { off: [-4, -3] })}${shaded(id, CUFF_R, cuffC, { base: cls === 'harcos' ? m : L.c2, off: [-3, -2], rim: 1.4 })}${gA ? setBracer(gA, aType, 1) : ''}${paulR}<g class="r-weapon${REV_GRIP[cls + L.weapon] ? ' rev' : ''}" style="transform-origin:${212 + armShift}px 282px"><g transform="rotate(${fx((WEAPON_ROT[cls + L.weapon] || 0) + (turned ? 22 * sn * sg : 0))} ${GRIP[0]} ${GRIP[1]})">${wWrap(weaponSvg(cls, +L.weapon, c < -0.2 ? Object.assign({}, L, { _back: true }) : L, id))}</g></g>${hand(HAND_R, THUMB_R, 1)}</g></g>`;
    let armL = `<g class="r-arm-l" style="transform-origin:${122 - armShift}px 196px"><g transform="translate(${-armShift} 0)${ASL}">${shaded(id, ARM_L, sleeve, { off: [-4, -3] })}${shaded(id, CUFF_L, cuffC, { base: cls === 'harcos' ? m : L.c2, off: [-3, -2], rim: 1.4 })}${gA ? setBracer(gA, aType, -1) : ''}${paulL}<g class="r-lgrip" style="transform-origin:107px 279px">${cls === 'vadasz' && +L.weapon < 2 ? '' : (wGlowC ? `<g filter="url(#${id}-wglow)">${leftGripSvg(cls, +L.weapon, L, id)}</g>` : leftGripSvg(cls, +L.weapon, L, id))}</g>${cls === 'vadasz' && +L.weapon < 2 ? `<g class="r-nock" opacity="0"><path d="M107 280 L107 374" stroke="#c8a46a" stroke-width="2.4" stroke-linecap="round"/><path d="M103 372 L107 384 L111 372 Z" fill="#cfd6ea" stroke="#5a5f78" stroke-width="0.8"/><path d="M104 280 L107 286 L110 280 M104 285 L107 291 L110 285" fill="none" stroke="#e8e6f2" stroke-width="1.4"/><circle class="r-pull" cx="107" cy="281" r="0.1" fill="none"/></g>` : ''}${hand(HAND_L, THUMB_L, -1)}<g class="r-offhand">${wGlowC ? `<g filter="url(#${id}-wglow)">` : ''}${leftItemSvg(cls, +L.weapon, c < -0.2 ? Object.assign({}, L, { _back: true }) : L, id)}${wGlowC ? '</g>' : ''}</g></g></g>`;
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
    // szett- és egyedi fejfedő-díszek (a fejfedő fölé; forgatáskor a fej hengerén)
    if (uH || (L.hset && SET_ACC[L.hset])) {
      const dec = back => uH ? uniqHelmDecor(uH, L.headwear, id, back) : setHelmDecor(gearCtx(L, id, L.hset, L.htier), L.headwear, back);
      const HWK = HWG[L.headwear] ? L.headwear : 'nincs';
      if (!turned) hw += dec(false);
      else if (HWK === 'suveg') hw += `<g transform="translate(${fx(160 + 6 * sn)} 0) scale(${fx(sg * (0.82 + 0.18 * ac))} 1) translate(-160 0)">${dec(c < 0)}</g>`;
      else if (c >= 0) hw += cylSvg(dec(false), (x, y) => cylX(x, Math.max(Rh(y), 12), th));
      else hw += `<g transform="translate(${fx(160 + 6 * sn)} 0) scale(${fx(sg * (0.82 + 0.18 * ac) * (L.headwear === 'sisak' ? 1.06 : 1))} 1) translate(-160 0)">${dec(true)}</g>`;
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
