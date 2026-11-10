/* Nyxoria RPG – a játékos műveletei. Ugyanez a kód fut a böngészőben (gyakorló mód)
   és a szerveren (Supabase Edge Function), így a szerver dönt mindenről. */
(function (root) {
  'use strict';
  const D = root.NYX.data, E = root.NYX.engine;
  const SAVE_VERSION = 1;
  const PATROL_HOURS = [1, 2, 4, 8];
  const CHRON_MAX = 60;
  const MILESTONES = [10, 20, 30, 40, 50];

  // ---------- segédek ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmt(n) { return Math.round(n).toLocaleString('hu-HU'); }
  function budapestDate(t) { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest' }).format(new Date(t)); }
  function az(word) { return /^[aáeéiíoóöőuúüű]/i.test(String(word)) ? 'az' : 'a'; }
  function regionName(id) { const r = D.REGIONS.filter(x => x.id === id)[0]; return r ? r.name : ''; }
  function fail(code, msg) { const e = new Error(msg); e.code = code; throw e; }

  // Felzárkózó szél: 10+ szinttel a medián alatt ×2, a mediánig fokozatosan ×1
  function wind(level, median) {
    if (!median || level >= median) return 1;
    const gap = median - level;
    return gap >= 10 ? 2 : 1 + gap / 10;
  }

  // ---------- hős létrehozása (ellenőrzéssel, mert a szerveren is ez fut) ----------
  const HEX_RE = /^#[0-9a-fA-F]{6}$/;
  // csak valódi szöveg lehet szín (egy ["#aabbcc"] tömb is átmenne a reguláris kifejezésen)
  const HEX = { test: v => typeof v === 'string' && HEX_RE.test(v) };
  const HAIR_STYLES = ['hosszu', 'rovid', 'copf', 'konty', 'tuskes'];
  const EYES = ['sotet', 'kek', 'zold', 'arany', 'tunde'];
  const MARKS = ['nincs', 'holdjel', 'csillag', 'heg', 'szeplo'];
  function validName(n) { return typeof n === 'string' && n.length >= 2 && n.length <= 16 && /^[\p{L}\p{N}][\p{L}\p{N} '\-]*$/u.test(n); }
  function cleanLook(look) {
    look = look || {};
    return {
      hairStyle: HAIR_STYLES.indexOf(look.hairStyle) >= 0 ? look.hairStyle : 'hosszu',
      hair: HEX.test(look.hair) ? look.hair : '#e8e8ff', tip: HEX.test(look.tip) ? look.tip : '#7f8cff',
      eyes: EYES.indexOf(look.eyes) >= 0 ? look.eyes : 'sotet', mark: MARKS.indexOf(look.mark) >= 0 ? look.mark : 'nincs',
      outfit: HEX.test(look.outfit) ? look.outfit : '#3a3f9c'
    };
  }
  // ---------- új kinézet (hero.rig): ellenőrzés és a régi kinézet átalakítása ----------
  // Csak ismert mezők, ismert értékek és #rrggbb színek maradnak; minden hiányzó mező alapértéket kap.
  function cleanRig(rig, classId) {
    rig = rig && typeof rig === 'object' ? rig : {};
    const out = Object.assign({}, D.LOOK_BASE, D.CLASS_LOOK[classId] || {});
    Object.keys(D.LOOK_ENUMS).forEach(k => { if (D.LOOK_ENUMS[k].indexOf(rig[k]) >= 0) out[k] = rig[k]; });
    D.LOOK_COLORS.forEach(k => { if (HEX.test(rig[k])) out[k] = rig[k].toLowerCase(); });
    D.LOOK_COLORS_OPT.forEach(k => { if (rig[k] === null) out[k] = null; else if (HEX.test(rig[k])) out[k] = rig[k].toLowerCase(); });
    Object.keys(D.LOOK_INTS).forEach(k => { const v = +rig[k]; if (Number.isInteger(v) && v >= 0 && v <= D.LOOK_INTS[k]) out[k] = v; });
    if (typeof rig.eyeGlow === 'boolean') out.eyeGlow = rig.eyeGlow;
    return out;
  }
  // a szerver által kiszámolt (felszerelés szerinti) kinézet szűrése megjelenítéshez: a felszerelés-mezőket is átengedi.
  // A mentésbe (készítés, átszabás) a szigorú cleanRig kerül, így ezeket a mezőket a kliens nem csempészheti be.
  function cleanWorn(rig, classId) {
    const out = cleanRig(rig, classId); rig = rig && typeof rig === 'object' ? rig : {};
    if (GLOW_OK.indexOf(rig.wGlow) >= 0) out.wGlow = rig.wGlow;
    if (rig.wSpark === true) out.wSpark = true;
    if ([1, 2, 3, 4].indexOf(rig.wGlowLv) >= 0) out.wGlowLv = rig.wGlowLv;
    ['gset', 'hset', 'wset'].forEach(k => { if (SET_PAL[rig[k]]) out[k] = rig[k]; });
    ['gtier', 'htier', 'wtier'].forEach(k => { if ([0, 1, 2, 3].indexOf(rig[k]) >= 0) out[k] = rig[k]; });
    ['uniqP', 'uniqH', 'uniqW', 'uniqA'].forEach(k => { if (typeof rig[k] === 'string' && rig[k].length < 60 && /^(pancel|sisak|fegyver|mitikus):/.test(rig[k])) out[k] = rig[k]; });
    return out;
  }
  // régi (1. változatú) kinézet → új. Ugyanazt adja minden híváskor, a mentést nem kell átírni.
  const OLD_HAIR = { hosszu: ['oldal', 'hosszu'], rovid: ['kozep', 'rovid'], copf: ['egyenes', 'copf'], konty: ['oldal', 'konty'], tuskes: ['tuskes', 'rovid'] };
  const OLD_EYE = { sotet: '#2b2350', kek: '#3f6fd8', zold: '#2f9e6a', arany: '#c98a1c', tunde: '#7ff3ff' };
  const OLD_MARK = { nincs: 'nincs', holdjel: 'holdjel', csillag: 'csillagok', heg: 'forradas', szeplo: 'szeplok' };
  function migrateLook(hero) {
    if (!hero) return cleanRig(null, 'magus');
    if (hero.rig) return cleanRig(hero.rig, hero.classId);
    const o = hero.look || {}, p = D.PEOPLE_LOOK[hero.people] || D.PEOPLE_LOOK.ember, hs = OLD_HAIR[o.hairStyle] || OLD_HAIR.hosszu;
    return cleanRig({
      skin: p.skin, ears: p.ears, hairFront: hs[0], hairBack: hs[1], hair: o.hair, tip: o.tip,
      eye: OLD_EYE[o.eyes] || OLD_EYE.sotet, eyeGlow: o.eyes === 'tunde', mark: OLD_MARK[o.mark] || 'nincs', c1: o.outfit
    }, hero.classId);
  }
  // ---------- a felszerelés kinézete (WoW/AION mintára) ----------
  // A hős arca, haja, teste, fegyvertípusa és ruhaszabása a készítőből jön (ő maga). A tárgyak a tájegységük
  // SZETTJÉT adják: ahonnan a tárgy származik, olyan a stílusa; a ritkaság egyre gazdagabb formát ad, a névvel
  // ellátott legendás és a mitikus tárgyak egyedi rajzot kapnak. A fegyver fénye a fejlesztésből jön (+4, +8, +10, +12),
  // a szárny és az aura eredményekért jár (csak dísz). Amit egyszer viseltél, a ruhatáradba kerül (hero.looks).
  const SET_TIER = { zold: 0, kek: 1, lila: 2, legendas: 3 };
  // szett-színek ritkaságonként: [fő szín, kiegészítő szín, fém]
  const SET_PAL = {
    kodlap:    [['#4f6b44', '#6a5236', 'bronz'], ['#3f6a5a', '#5a4630', 'bronz'], ['#2f5a4a', '#8fbf9a', 'ezust'], ['#2f5a46', '#e0b44a', 'arany']],
    holdfeny:  [['#5a6a8e', '#3f5a3a', 'ezust'], ['#46609e', '#cfd6ea', 'ezust'], ['#3a4a9e', '#cfe0ff', 'ezust'], ['#2c3a8c', '#e0b44a', 'arany']],
    arnyromok: [['#5e5a68', '#3e3a46', 'ejacel'], ['#4f4a6a', '#7a6aa8', 'ejacel'], ['#4a2f8a', '#c79bff', 'ejacel'], ['#3a2a6a', '#e0b44a', 'arany']],
    szirtek:   [['#3f6e88', '#5a5f78', 'ezust'], ['#2f6a8a', '#8ff6ff', 'ezust'], ['#1f5a78', '#8ff6ff', 'ejacel'], ['#1f4a6a', '#e0b44a', 'arany']],
    ejkatlan:  [['#3a2a36', '#5a1f30', 'ejacel'], ['#2a2030', '#8a2f56', 'ejacel'], ['#24182a', '#ff6a8a', 'ejacel'], ['#24182a', '#e0b44a', 'arany']]
  };
  const SET_NAME = { kodlap: 'Ködlápi', holdfeny: 'Holdfény-erdei', arnyromok: 'Árnyromoki', szirtek: 'Szirti', ejkatlan: 'Éjkatlani' };
  const GEAR_CAPE = { zold: 'nincs', kek: 'rovid', lila: 'hosszu', legendas: 'hosszu' };
  const GEAR_HELM = {
    nehez: { zold: 'csuklya', kek: 'sisak', lila: 'sisak', legendas: 'sisak' },
    konnyu: { zold: 'csuklya', kek: 'csuklya', lila: 'abroncs', legendas: 'diadem' },
    varazs: { zold: 'suveg', kek: 'koszoru', lila: 'abroncs', legendas: 'diadem' }
  };
  const HELM_FAMILY = { harcos: 'nehez', alakvalto: 'konnyu', vadasz: 'konnyu', orgyilkos: 'konnyu', magus: 'varazs', gyogyito: 'varazs', idezo: 'varazs', dalnok: 'varazs' };
  // a fejlesztés fénye (AION-módra): +4 halvány, +8 erős, +10 a ritkaság színében, +12 szikrázik
  const GLOW_PLAIN = '#cfe0ff';
  const GLOW_RAR = { szurke: '#cfe0ff', zold: '#7be3a0', kek: '#7fb8ff', lila: '#c79bff', legendas: '#ffd76a' };
  const GLOW_OK = [GLOW_PLAIN, '#7be3a0', '#7fb8ff', '#c79bff', '#ffd76a'];
  function glowOf(it) {
    const p = (it && it.plus) || 0, lv = p >= 12 ? 4 : p >= 10 ? 3 : p >= 8 ? 2 : p >= 4 ? 1 : 0;
    if (!lv) return null;
    return { wGlow: lv >= 3 ? GLOW_RAR[it.rarity] || GLOW_PLAIN : GLOW_PLAIN, wGlowLv: lv, wSpark: lv >= 4 };
  }
  const RAR_RANK = { szurke: 0, zold: 1, kek: 2, lila: 3, legendas: 4 };
  function strHash(t) { let h = 0; t = String(t || ''); for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return h; }
  function uniqueName(it) {
    if (!it) return null;
    if (it.mythic && (D.MYTHIC_NAMES || []).indexOf(it.name) >= 0) return 'mitikus:' + it.name;
    if (it.rarity !== 'legendas' || !D.LEGEND_NAMES) return null;
    const L = D.LEGEND_NAMES, list = it.slot === 'fegyver' ? Object.keys(L.fegyver).reduce((a, k) => a.concat(L.fegyver[k]), []) : (L[it.slot] || []);
    return list.indexOf(it.name) >= 0 ? it.slot + ':' + it.name : null;
  }
  // a kinézet kulcsa: „szett:ritkaság” vagy „u|egyedi név”; a régi (ritkaság.változat) kulcsok is működnek
  function lookKey(it) {
    if (!it || !RAR_RANK.hasOwnProperty(it.rarity)) return null;
    const u = uniqueName(it);
    if (u) return 'u|' + u;
    return (it.set || (E.setForLevel ? E.setForLevel(it.level || 1) : 'kodlap')) + ':' + it.rarity;
  }
  function lookPiece(slot, key, classId) {
    const out = {};
    key = String(key || '');
    if (key.indexOf('u|') === 0) { // egyedi legendás / mitikus
      const u = key.slice(2), sl = u.split(':')[0] === 'mitikus' ? slot : u.split(':')[0];
      if (sl === 'pancel') { out.uniqP = u; out.gtier = 3; out.cape = 'hosszu'; }
      else if (sl === 'sisak') { out.uniqH = u; out.htier = 3; out.headwear = GEAR_HELM[HELM_FAMILY[classId] || 'varazs'].legendas; }
      else if (sl === 'fegyver') { out.uniqW = u; out.wtier = 3; }
      else if (sl === 'amulett' && u.indexOf('mitikus:') === 0) out.uniqA = u;
      else if (sl === 'gyuru') out.earring = 'kristaly';
      return out;
    }
    if (key.indexOf(':') < 0) return out; // régi formájú kulcs (az előző rendszerből): nincs szett-adata
    const p = key.split(':'), set = p[0], r = p[1], t = SET_TIER[r];
    if (!SET_PAL[set] || t == null) return out; // szürke: a saját, készítőbeli ruhád
    const pal = SET_PAL[set][t];
    if (slot === 'pancel') { out.gset = set; out.gtier = t; out.c1 = pal[0]; out.c2 = pal[1]; out.metal = pal[2]; out.cape = GEAR_CAPE[r]; }
    if (slot === 'sisak') { out.hset = set; out.htier = t; out.headwear = GEAR_HELM[HELM_FAMILY[classId] || 'varazs'][r]; out._metal = pal[2]; }
    if (slot === 'fegyver') { out.wset = set; out.wtier = t; }
    if (slot === 'gyuru') out.earring = t >= 2 ? 'kristaly' : t === 1 ? 'karika' : 'nincs';
    return out;
  }
  function lookVisible(slot, key) {
    key = String(key || '');
    if (key.indexOf('u|') === 0) return slot === 'amulett' ? key.indexOf('u|mitikus:') === 0 : true;
    if (key.indexOf(':') < 0) return false;
    const t = SET_TIER[key.split(':')[1]];
    if (t == null) return false;
    if (slot === 'amulett') return false;
    if (slot === 'gyuru') return t >= 1;
    return true;
  }
  function lookName(key) {
    key = String(key || '');
    if (key.indexOf('u|') === 0) return key.slice(2).split(':').slice(1).join(':');
    const p = key.split(':');
    return SET_NAME[p[0]] ? `${SET_NAME[p[0]]} szett (${(D.RARITIES[p[1]] || {}).name || p[1]})` : key;
  }

  // ---------- szárnyak és aurák: eredményekért (csak dísz) ----------
  const COSMETICS = [
    { id: 'toll', kind: 'wings', name: 'Tollszárny', how: '100 győzelem', val: s => (s.hero.stats.wins || 0), goal: 100 },
    { id: 'tunder', kind: 'wings', name: 'Tündérszárny', how: '30 teljesített megbízás', val: s => (s.hero.stats.quests || 0), goal: 30 },
    { id: 'denever', kind: 'wings', name: 'Denevérszárny', how: 'Az Árnyromok mind a 6 őrzőjének legyőzése', val: s => regionGuards(s, 'arnyromok'), goal: 6 },
    { id: 'kristaly', kind: 'wings', name: 'Kristályszárny', how: 'A Holdtorony 30. emelete', val: s => (s.hero.stats.towerMax || 0), goal: 30 },
    { id: 'lang', kind: 'wings', name: 'Lángszárny', how: '25 elit őrző legyőzése', val: s => (s.hero.stats.eliteWins || 0), goal: 25 },
    { id: 'arny', kind: 'wings', name: 'Árnyszárny', how: '50 győzelem az Arénában', val: s => (s.arena && s.arena.wins) || 0, goal: 50 },
    { id: 'feny', kind: 'wings', name: 'Fényszárny', how: 'A Holdkrónika befejezése', val: s => (s.story && s.story.done) || 0, goal: 10 },
    { id: 'holdezust', kind: 'wings', name: 'Holdezüst szárny', how: 'Az 50. szint', val: s => s.hero.level, goal: 50 },
    { id: 'csillag', kind: 'wings', name: 'Csillagszárny', how: 'Egy mitikus tárgy megszerzése', val: s => (s.hero.stats.mythics || 0), goal: 1 },
    { id: 'holdfeny', kind: 'aura', name: 'Holdfény-aura', how: '20 győzelem Nehéz kalandon', val: s => (s.hero.stats.hardWins || 0), goal: 20 },
    { id: 'csillagpor', kind: 'aura', name: 'Csillagpor-aura', how: 'Egy legendás tárgy megszerzése', val: s => (s.hero.stats.legendaries || 0), goal: 1 },
    { id: 'arny', kind: 'aura', name: 'Árnyaura', how: '40 lény a bestiáriumban', val: s => Object.keys(((s.album || {}).kills) || {}).length, goal: 40 },
    { id: 'parazs', kind: 'aura', name: 'Parázsaura', how: 'Az Éjkatlan mind a 6 őrzőjének legyőzése', val: s => regionGuards(s, 'ejkatlan'), goal: 6 },
    { id: 'villam', kind: 'aura', name: 'Villámaura', how: 'A Holdtorony 50. emelete', val: s => (s.hero.stats.towerMax || 0), goal: 50 }
  ];
  function regionGuards(save, rid) { const r = D.REGIONS.filter(x => x.id === rid)[0], m = (save.album || {}).mon || {}; return r ? r.guards.filter(g => m[g]).length : 0; }
  function cosmeticList(save) { return COSMETICS.map(c => { const v = Math.min(c.goal, c.val(save) || 0); return Object.assign({}, c, { have: v, done: ((save.hero.cosm || {})[c.kind] || []).indexOf(c.id) >= 0 }); }); }
  function unlockCosmetics(save, now) {
    const h = save.hero; if (!h) return;
    const C = h.cosm = h.cosm || { wings: [], aura: [] };
    // a régi, készítőben választott szárny és aura megmarad (régi hősöknél)
    const old = h.rig || {};
    if (!C.legacy) { C.legacy = 1; if (old.wings && old.wings !== 'nincs' && C.wings.indexOf(old.wings) < 0) C.wings.push(old.wings); if (old.aura && old.aura !== 'nincs' && C.aura.indexOf(old.aura) < 0) C.aura.push(old.aura);
      h.lookPick = h.lookPick || {}; if (old.wings && old.wings !== 'nincs' && !h.lookPick.szarny) h.lookPick.szarny = old.wings; if (old.aura && old.aura !== 'nincs' && !h.lookPick.aura) h.lookPick.aura = old.aura; }
    COSMETICS.forEach(c => {
      if (C[c.kind].indexOf(c.id) >= 0 || (c.val(save) || 0) < c.goal) return;
      C[c.kind].push(c.id);
      h.lookPick = h.lookPick || {}; const pk = c.kind === 'wings' ? 'szarny' : 'aura';
      if (!h.lookPick[pk]) h.lookPick[pk] = c.id; // az első megszerzettet rögtön fel is veszi
      if (now) personal(save, now, `<b>${esc(h.name)}</b> kiérdemelte: ${esc(c.name)} (${esc(c.how)}).`, 'win');
    });
  }
  // festés: a páncél színe a játékos választása szerint (Csillagporért)
  const DYES = ['#8e2448', '#c0503a', '#c8a46a', '#e8b94a', '#3f6b3a', '#2f6b4f', '#1f6f8a', '#2c3a8c', '#5a3e9e', '#7a3a8e', '#e8e6f2', '#9aa0b8', '#4a4a5e', '#24203a', '#5a3e2a', '#3a2418'];
  const DYE_COST = 150;

  function unlockLooks(hero) {
    if (!hero || !hero.equipped) return;
    const L = hero.looks = hero.looks || {};
    const N = hero.lookNames = hero.lookNames || {};
    (D.SLOT_ORDER || []).forEach(sl => { const it = hero.equipped[sl], k = lookKey(it); if (k) { L[sl] = L[sl] || []; if (L[sl].indexOf(k) < 0) { L[sl].push(k); N[sl + ':' + k] = String(it.name).slice(0, 40); } } });
  }
  function wornLook(hero) {
    const base = migrateLook(hero), eq = hero.equipped || {}, pick = hero.lookPick || {}, own = hero.looks || {};
    if (Array.isArray(hero.equipped)) return base;
    // a szárny és az aura eredményekért jár; a készítőbeliek a régi hősöknél gyűjteményként élnek tovább
    const C = hero.cosm;
    if (C && C.legacy) { // a régi hősök készítőbeli szárnya/aurája az első lépésükig a régi helyén marad
      base.wings = pick.szarny && C.wings.indexOf(pick.szarny) >= 0 ? pick.szarny : 'nincs';
      base.aura = pick.aura && C.aura.indexOf(pick.aura) >= 0 ? pick.aura : 'nincs';
    }
    if (pick.gyuru !== 'alap' && eq.gyuru) base.earring = 'nincs';
    let metal = null, mr = -1;
    (D.SLOT_ORDER || []).forEach(sl => {
      const pk = pick[sl];
      if (pk === 'alap') return;
      const okPk = pk && pk !== 'auto' && (own[sl] || []).indexOf(pk) >= 0 && (pk.indexOf(':') > 0 || pk.indexOf('u|') === 0); // a régi (előző rendszerbeli) kulcs „auto”
      const key = okPk ? pk : lookKey(eq[sl]);
      if (!key) return;
      const pc = lookPiece(sl, key, hero.classId);
      const m = pc._metal || pc.metal; delete pc._metal; delete pc.metal;
      const rk = pc.gtier != null ? pc.gtier : pc.htier != null ? pc.htier : -1;
      if (m && rk > mr && (sl === 'pancel' || sl === 'sisak')) { mr = rk; metal = m; }
      Object.assign(base, pc);
    });
    if (metal) base.metal = metal;
    // festés: a páncél színeit felülírja
    if (hero.dye && (base.gset || base.uniqP)) { if (hero.dye.c1) base.c1 = hero.dye.c1; if (hero.dye.c2) base.c2 = hero.dye.c2; }
    // a fegyver fénye a viselt fegyver fejlesztéséből (a ruhatárbeli kinézettől függetlenül, mint az AION-ban)
    const g = glowOf(eq.fegyver);
    if (g) Object.assign(base, g);
    return base;
  }

  function createSave(opts, now) {
    const name = String(opts.name || '').trim().replace(/\s+/g, ' ');
    if (!validName(name)) fail('name', 'A név 2–16 karakter legyen: betűk, számok, szóköz vagy kötőjel.');
    if (!D.CLASSES[opts.classId]) fail('class', 'Ismeretlen kaszt.');
    if (!D.PEOPLES[opts.people]) fail('people', 'Ismeretlen faj.');
    const origin = D.ORIGINS[opts.origin] ? opts.origin : 'arva', trait = D.TRAITS[opts.trait] ? opts.trait : 'kivancsi';
    const motto = String(opts.motto || '').trim().slice(0, 40);
    const hero = E.newHero({ name: name, classId: opts.classId, people: opts.people, look: cleanLook(opts.look), origin: origin, trait: trait, motto: motto, now: now });
    // az új kliens a teljes új kinézetet küldi; a régi kliens csak a régit (akkor a rajzoló átalakítja)
    if (opts.rig) { hero.rig = cleanRig(opts.rig, hero.classId); hero.rig.aura = 'nincs'; hero.rig.wings = 'nincs'; } // a szárny és az aura kiérdemelhető, nem választható
    const save = E.newSave(hero, now);
    save.version = SAVE_VERSION;
    save.patrol = null; save.patrolDay = null; save.buffs = {};
    personal(save, now, `<b>${esc(hero.name)}</b>, ${az(D.PEOPLES[hero.people].name)} ${D.PEOPLES[hero.people].name.toLowerCase()} ${D.CLASSES[hero.classId].name.toLowerCase()} útnak indult. ${esc(D.ORIGINS[hero.origin].line)}`, 'level');
    return save;
  }

  function personal(save, now, html, kind) {
    save.chronicle.unshift({ t: now, text: html, kind: kind || '' });
    if (save.chronicle.length > CHRON_MAX) save.chronicle.length = CHRON_MAX;
  }

  // ---------- ajánlatok ----------
  function offersKey(save) {
    const h = save.hero;
    const eq = D.SLOT_ORDER.map(s => h.equipped[s] ? h.equipped[s].id + ':' + (h.equipped[s].plus || 0) + ':' + (h.equipped[s].rerolls || 0) : '').join(',');
    return ['v4', h.level, h.loadout.slice().sort().join('.'), save.settings.moon, eq, h.path == null ? '' : h.path].join('|'); // a taktika nem hoz új kalandot, csak az esélyt számolja újra
  }
  function refreshOffers(save) {
    if (save.expedition) return;
    const key = offersKey(save);
    if (!save.offers || save.offersKey !== key) {
      save.offers = E.makeOffers(save.hero, save.settings.moon, E.newSeed());
      save.offersKey = key; save.offersTactic = save.hero.tactic + '|' + save.hero.loadout.join('.');
    } else if (save.offersTactic !== save.hero.tactic + '|' + save.hero.loadout.join('.')) {
      save.offers.forEach(o => { o.chance = E.offerChance(save.hero, o); });
      save.offersTactic = save.hero.tactic + '|' + save.hero.loadout.join('.');
    }
  }

  // ---------- XP-szorzó ----------
  function xpBonus(save, ctx) {
    let m = wind(save.hero.level, ctx.median);
    if (save.buffs && save.buffs.xpUntil && save.buffs.xpUntil > ctx.now) m *= 1.25;
    return m;
  }

  function levelEvents(save, ups, ctx) {
    const h = save.hero;
    ups.forEach(u => {
      personal(save, ctx.now, `<b>${esc(h.name)}</b> elérte a ${u.level}. szintet!${u.skill ? ' Új képesség: ' + esc(D.SKILLS[u.skill].name) + '.' : ''}`, 'level');
      if (MILESTONES.indexOf(u.level) >= 0) ctx.events.push({ kind: 'level', level: u.level, html: `<b>${esc(h.name)}</b> elérte a ${u.level}. szintet!` });
    });
  }
  function itemEvent(save, it, ctx, how) {
    const h = save.hero;
    if (it.mythic) {
      personal(save, ctx.now, `✦ <b>${esc(h.name)}</b> mitikus tárgyat talált: <b>${esc(it.name)}</b>!`, 'mythic');
      ctx.events.push({ kind: 'mythic', html: `✦ <b>${esc(h.name)}</b> mitikus tárgyat talált: <b>${esc(it.name)}</b>!`, announce: true });
    }
    if (it.rarity === 'legendas') { h.stats.legendaries = (h.stats.legendaries || 0) + 1; }
    if (it.mythic) { /* fent már kihirdettük */ } else if (it.rarity === 'legendas') {
      personal(save, ctx.now, `★ <b>${esc(h.name)}</b> legendás tárgyat szerzett${how ? ' (' + how + ')' : ''}: <span class="r-legendas">${esc(it.name)}</span>!`, 'legend');
      ctx.events.push({ kind: 'legendas', html: `★ <b>${esc(h.name)}</b> legendás tárgyat szerzett: <span class="r-legendas">${esc(it.name)}</span>!` });
    } else if (it.rarity === 'lila' || it.rarity === 'kek') {
      personal(save, ctx.now, `<b>${esc(h.name)}</b> ${it.rarity === 'lila' ? 'epikus' : 'ritka'} tárgyat szerzett${how ? ' (' + how + ')' : ''}: <span class="r-${it.rarity}">${esc(it.name)}</span>.`, 'loot');
    }
  }

  function findOffer(save, diff) { return (save.offers || []).filter(o => o.diff === diff)[0]; }
  function needExp(save, phases) {
    const exp = save.expedition;
    if (!exp) fail('state', 'Most nem vagy kalandon.');
    if (phases && phases.indexOf(exp.phase) < 0) fail('state', 'Ezt most nem lehet.');
    return exp;
  }
  function summarizeOut(save, out, card) {
    const tr = D.TRAITS[save.hero.trait];
    const o = { type: out.type, title: card.title };
    if (out.type === 'harc') { o.win = out.fight.win; o.monster = card.monster; o.xp = out.xp || 0; o.silver = out.silver || 0; o.traitLine = out.fight.win ? tr.win : tr.lose; }
    if (out.type === 'kutatas') { o.success = out.success; o.item = out.item || null; o.silver = out.silver || 0; }
    if (out.type === 'esemeny') { o.result = out.result; o.effect = out.effect; o.silver = out.silver || 0; o.dust = out.dust || 0; o.xp = out.xp || 0; o.item = out.item || null; o.title = card.event.title; o.kind = out.kind || 'esemeny'; if (out.blessPct) o.blessPct = out.blessPct; if (out.healToXp) o.healToXp = true;
      if (out.checkChance != null) { o.checkOk = out.checkOk; o.checkChance = out.checkChance; } if (out.cost) o.cost = out.cost; if (out.follow) o.follow = true; }
    return o;
  }
  function fightPayload(f, heroF, mon) {
    return { log: f.log, win: f.win, timeout: f.timeout, rounds: f.rounds, heroF: heroF, mon: mon };
  }

  // ---------- műveletek ----------
  const A = {};
  A.lookPick = (save, a) => {
    const h = save.hero, sl = a.slot, k = String(a.key || 'auto');
    h.lookPick = h.lookPick || {};
    if (sl === 'szarny' || sl === 'aura') { // szárny / aura: csak a megszerzettek közül
      const C = h.cosm || { wings: [], aura: [] }, list = sl === 'szarny' ? C.wings : C.aura;
      if (k !== 'nincs' && list.indexOf(k) < 0) fail('arg', 'Ezt még nem érdemelted ki.');
      h.lookPick[sl] = k; return { ok: true };
    }
    if ((D.SLOT_ORDER || []).indexOf(sl) < 0) fail('arg', 'Ismeretlen hely.');
    if (k !== 'auto' && k !== 'alap' && ((h.looks || {})[sl] || []).indexOf(k) < 0) fail('arg', 'Ez a kinézet még nincs meg.');
    if (k === 'auto') delete h.lookPick[sl]; else h.lookPick[sl] = k;
    return { ok: true };
  };
  A.dye = (save, a) => {
    const h = save.hero;
    if (a.clear) { delete h.dye; return { ok: true }; }
    const c1 = DYES.indexOf(a.c1) >= 0 ? a.c1 : null, c2 = DYES.indexOf(a.c2) >= 0 ? a.c2 : null;
    if (!c1 && !c2) fail('arg', 'Válassz színt.');
    const w = wornLook(h); if (!w.gset && !w.uniqP) fail('state', 'Festeni csak szett- vagy egyedi páncélt lehet. Előbb vegyél fel egyet (a zöldtől felfelé).');
    if ((h.dust || 0) < DYE_COST) fail('cost', `A festés ${DYE_COST} Csillagporba kerül.`);
    h.dust -= DYE_COST;
    h.dye = { c1: c1 || (h.dye && h.dye.c1) || null, c2: c2 || (h.dye && h.dye.c2) || null };
    return { ok: true };
  };

  // a kinézet átszabása bármikor (a név, a faj és a kaszt nem változik)
  A.restyle = (save, a) => { const old = migrateLook(save.hero), r = cleanRig(Object.assign({}, old, a.rig && typeof a.rig === 'object' ? a.rig : {}), save.hero.classId); ['wGlow', 'wSpark', 'wGlowLv', 'gset', 'hset', 'wset', 'gtier', 'htier', 'wtier', 'uniqP', 'uniqH', 'uniqW', 'uniqA'].forEach(k => delete r[k]); r.aura = old.aura; r.wings = old.wings; save.hero.rig = r; };
  A.tactic = (save, a) => { if (!D.TACTICS[a.v]) fail('arg', 'Ismeretlen taktika.'); save.hero.tactic = a.v; };
  A.moon = (save, a) => {
    if (!E.MOONS[a.v]) fail('arg', 'Ismeretlen Hold-fokozat.');
    if (save.hero.level < E.MOONS[a.v].minLevel) fail('level', 'A Hold-fokozatok a 20. szinttől nyílnak.');
    save.settings.moon = a.v;
  };
  A.settings = (save, a) => {
    if ([1, 2, 4].indexOf(a.speed) >= 0) save.settings.speed = a.speed;
    if (typeof a.owl === 'boolean') save.settings.owl = a.owl;
    if (typeof a.autoSalvage === 'boolean') save.settings.autoSalvage = a.autoSalvage;
    if (a.resetTips) save.seenTips = {};
  };
  A.tip = (save, a) => { if (D.OWL_TIPS[a.v]) save.seenTips[a.v] = true; };

  A.start = (save, a, ctx) => {
    if (save.expedition) fail('state', 'Már úton vagy.');
    refreshOffers(save);
    const offer = findOffer(save, a.diff);
    if (!offer) fail('arg', 'Nincs ilyen kaland.');
    const ti = E.spendTorch(save, ctx.now);
    const exp = E.startExpedition(save.hero, offer, save);
    exp.phase = 'clearing'; exp.torchInfo = ti; exp.lastOut = null; exp.id = 'x' + ctx.now.toString(36);
    save.expedition = exp; save.offers = null; save.offersKey = null; save.pendingResult = null;
  };

  A.card = (save, a) => {
    const exp = needExp(save, ['clearing']);
    const cl = exp.clearings[exp.step], card = cl && cl.cards[a.i];
    if (!card) fail('arg', 'Nincs ilyen kártya.');
    if (card.type === 'esemeny') { exp.phase = 'event'; exp.pendingCard = a.i; return {}; }
    const out = E.resolveCard(save.hero, exp, card);
    exp.lastOut = summarizeOut(save, out, card);
    exp.phase = 'cardResult';
    return out.fight ? { fight: fightPayload(out.fight, out.heroF, out.mon) } : {};
  };
  A.event = (save, a) => {
    const exp = needExp(save, ['event']);
    const card = exp.clearings[exp.step].cards[exp.pendingCard];
    const h = save.hero, ev = E.normEvent(card.event), idx = a.v === 'a' ? 0 : a.v === 'b' ? 1 : (a.v | 0);
    const ok = E.eventOptions(h, ev).some(x => x.i === idx);
    if (!ok || !ev.options[idx]) fail('arg', 'Ez a lehetőség most nem választható.');
    const cost = E.eventCost(exp.offer.lm, ev.options[idx]);
    if (cost > h.silver) fail('cost', 'Nincs elég Holdezüstöd.');
    h.silver -= cost;
    const out = E.resolveCard(h, exp, card, idx);
    if (cost) out.cost = cost;
    exp.lastOut = summarizeOut(save, out, card); exp.pendingCard = null; exp.phase = 'cardResult';
  };
  A.next = (save) => {
    const exp = needExp(save, ['cardResult']);
    exp.phase = exp.step >= 3 ? 'guard' : 'clearing'; exp.lastOut = null;
    if (exp.phase === 'clearing') E.applyFollow(exp);
  };

  A.fight = (save, a, ctx) => {
    const exp = needExp(save, ['guard']), h = save.hero;
    const g = E.fightGuard(h, exp);
    const ti = Object.assign({}, exp.torchInfo || { xpMult: 1 });
    const bonus = xpBonus(save, ctx);
    ti.xpMult = (ti.xpMult || 1) * bonus;
    const res = E.finishExpedition(save, h, exp, g, ti, ctx.now);
    res.windMult = bonus;
    res.items.forEach(it => { E.addItem(save, h, it, ctx.now); itemEvent(save, it, ctx, 'útközben'); });
    if (res.mythic) { E.addItem(save, h, res.mythic, ctx.now); itemEvent(save, res.mythic, ctx); }
    const r = regionName(exp.offer.region);
    personal(save, ctx.now, res.win ? `<b>${esc(h.name)}</b> diadalt aratott ${esc(exp.offer.guard)} felett (${esc(r)}, ${E.DIFF[exp.offer.diff].name}).` : `<b>${esc(h.name)}</b> elbukott ${esc(exp.offer.guard)} ellen (${esc(r)}).`, res.win ? 'win' : 'lose');
    levelEvents(save, res.levelUps, ctx);
    res.expId = exp.id;
    save.pendingResult = res;
    exp.phase = 'result';
    return { fight: fightPayload(g.fight, g.heroF, g.mon) };
  };

  A.choose = (save, a, ctx) => {
    const res = save.pendingResult, h = save.hero;
    if (!res || !res.win || res.chosen) fail('state', 'Most nincs választható jutalom.');
    const ch = res.choices[a.i];
    if (!ch) fail('arg', 'Nincs ilyen jutalom.');
    if (ch.kind === 'xp') ch.amount = Math.round(ch.amount * xpBonus(save, ctx));
    const out = E.applyChoice(save, h, ch, ctx.now) || {};
    res.chosen = true; res.chosenIdx = a.i;
    const info = { kind: ch.kind };
    if (ch.kind === 'item') {
      itemEvent(save, ch.item, ctx);
      if (out.salvaged) { info.salvaged = true; info.dust = out.dust; }
      else if (E.isUpgrade(h, ch.item)) { E.equip(h, ch.item.id); info.equipped = true; }
      info.name = ch.item.name;
    } else if (ch.kind === 'dust') info.dust = out.dust;
    else if (ch.kind === 'silver') info.silver = ch.amount;
    else if (ch.kind === 'xp') { info.xp = ch.amount; info.levelUps = out.levelUps || []; levelEvents(save, info.levelUps, ctx); }
    return info;
  };
  A.camp = (save) => {
    if (save.expedition && save.expedition.phase !== 'result') fail('state', 'Előbb fejezd be a kalandot.');
    save.expedition = null; save.pendingResult = null;
  };
  A.retreat = (save, a, ctx) => {
    const exp = needExp(save, ['clearing', 'cardResult', 'event', 'guard']), h = save.hero;
    exp.loot.forEach(it => E.addItem(save, h, it, ctx.now));
    h.silver += exp.silver;
    E.addDust(save, h, exp.dust, ctx.now);
    const ups = E.addXp(h, exp.bonusXp * ((exp.torchInfo && exp.torchInfo.xpMult) || 1) * xpBonus(save, ctx));
    personal(save, ctx.now, `<b>${esc(h.name)}</b> visszafordult: ${esc(regionName(exp.offer.region))}.`, '');
    levelEvents(save, ups, ctx);
    save.expedition = null;
    return { levelUps: ups };
  };

  // felszerelés
  A.equip = (save, a) => { if (save.expedition && save.expedition.phase === 'guard') { /* az őrző előtt is szabad */ } if (!E.equip(save.hero, a.id)) fail('arg', 'Nincs ilyen tárgy a táskában.'); };
  // több tárgy felvétele egyszerre (a „Legnagyobb harcerő felvétele” és a visszavonása): csak a táskában lévő,
  // különböző helyre szóló tárgyak; a lecserélt darabok a táskába kerülnek, semmi nem vész el
  A.equipIds = (save, a) => {
    // unequip: visszavonáskor a korábban üres helyek újra üresek lesznek (a tárgy a táskába kerül)
    const ids = Array.isArray(a.ids) ? a.ids.map(String) : [], h = save.hero;
    const off = Array.isArray(a.unequip) ? a.unequip.map(String).filter(s => D.SLOT_ORDER.indexOf(s) >= 0) : [];
    if ((!ids.length && !off.length) || ids.length > D.SLOT_ORDER.length || new Set(ids).size !== ids.length || new Set(off).size !== off.length) fail('arg', 'Érvénytelen tárgylista.');
    const its = ids.map(id => h.inventory.find(i => i.id === id));
    if (its.some(i => !i)) fail('arg', 'Nincs ilyen tárgy a táskában.');
    if (new Set(its.map(i => i.slot)).size !== its.length || its.some(i => off.indexOf(i.slot) >= 0)) fail('arg', 'Egy helyre csak egy tárgy kerülhet.');
    const freed = off.filter(s => h.equipped[s]).length;
    if (h.inventory.length - its.length + its.length + freed > E.INVENTORY_MAX) fail('state', 'Nincs elég hely a táskában.');
    its.forEach(i => E.equip(h, i.id));
    off.forEach(s => { if (h.equipped[s]) { h.inventory.push(h.equipped[s]); delete h.equipped[s]; } });
    return { ids: ids };
  };
  // tárgy zárolása: a zárolt tárgyat sem egyenként, sem tömegesen nem lehet szétszedni vagy eladni (felvenni lehet)
  const lockedItem = (h, id) => h.inventory.find(i => i.id === id && i.locked);
  A.lockItem = (save, a) => {
    const h = save.hero, it = h.inventory.find(i => i.id === a.id) || D.SLOT_ORDER.map(s => h.equipped[s]).find(i => i && i.id === a.id);
    if (!it) fail('arg', 'Nincs ilyen tárgy.');
    if (it.locked) delete it.locked; else it.locked = true;
    return { locked: !!it.locked };
  };
  A.salvage = (save, a, ctx) => { if (lockedItem(save.hero, a.id)) fail('state', 'Ez a tárgy zárolva van: előbb oldd fel a zárolást.'); return { dust: E.salvage(save, save.hero, a.id, ctx.now) }; };
  A.sell = (save, a) => { if (lockedItem(save.hero, a.id)) fail('state', 'Ez a tárgy zárolva van: előbb oldd fel a zárolást.'); return { silver: E.sell(save.hero, a.id) }; };
  A.salvageWeak = (save, a, ctx) => {
    const h = save.hero; let sum = 0;
    h.inventory.filter(it => !it.mythic && !it.locked && (it.rarity === 'szurke' || it.rarity === 'zold') && !E.isUpgrade(h, it)).forEach(it => { sum += E.salvage(save, h, it.id, ctx.now); });
    return { dust: sum };
  };
  A.upgrade = (save, a, ctx) => {
    const r = E.upgrade(save.hero, a.id);
    if (!r.ok) fail('cost', r.reason === 'nincs' ? 'Nincs ilyen tárgy.' : r.reason === 'max' ? 'Ez a tárgy már a legmagasabb szinten van.' : r.reason === 'ezüst' ? 'Nincs elég Holdezüst.' : 'Nincs elég Csillagpor.');
    if (r.plus === 5 || r.max) personal(save, ctx.now, `<b>${esc(save.hero.name)}</b> +${r.plus}-re fejlesztett egy tárgyat${r.max ? ' – tovább már nem lehet' : ''}.`, 'loot');
    if (r.max && r.plus >= 10) ctx.events.push({ kind: 'plus10', html: `<b>${esc(save.hero.name)}</b> +${r.plus}-re, a legmagasabb szintre fejlesztett egy tárgyat!` });
    return r;
  };
  A.transfer = (save, a) => {
    const r = E.transfer(save.hero, String(a.id));
    if (!r.ok) fail(r.reason === 'ezüst' ? 'cost' : 'arg', r.reason === 'ezüst' ? 'Nincs elég Holdezüst az átvitelhez.' : 'Erre a tárgyra most nincs mit átvinni.');
    return r;
  };
  A.reroll = (save, a) => {
    const r = E.reroll(save.hero, a.id);
    if (!r.ok) fail('cost', r.reason === 'nincs' ? 'Ennek a tárgynak nincs jellemzője.' : 'Nincs elég Holdezüst.');
    return r;
  };
  // a teljes sorrend egyszerre (pl. az „Ajánlott sorrend” átvétele): csak a meglévő képességek átrendezése lehet
  A.skillOrder = (save, a) => {
    const l = save.hero.loadout, o = Array.isArray(a.order) ? a.order.map(String) : null;
    if (!o || o.length !== l.length || o.some(id => l.indexOf(id) < 0) || new Set(o).size !== o.length) fail('arg', 'Érvénytelen sorrend.');
    save.hero.loadout = o;
  };
  A.skillMove = (save, a) => {
    const l = save.hero.loadout, i = a.i | 0, j = i + (a.dir < 0 ? -1 : 1);
    if (i < 0 || j < 0 || i >= l.length || j >= l.length) fail('arg', 'Nem mozgatható.');
    const t = l[i]; l[i] = l[j]; l[j] = t;
  };

  // őrjárat: naponta egyszer, 1–8 órára; közben az expedíciók is mennek
  function patrolReward(h, hours) {
    return {
      xp: Math.round(E.xpBase(h.level) * 2 * hours / 8),
      silver: Math.round(E.silverBase(h.level) * hours / 2),
      dust: Math.round((8 + 1.5 * h.level) * hours / 4),
      itemChance: hours >= 8 ? 1 : hours >= 4 ? 0.5 : 0
    };
  }
  A.patrolStart = (save, a, ctx) => {
    const hours = a.hours | 0;
    if (PATROL_HOURS.indexOf(hours) < 0) fail('arg', 'Ennyi órára nem lehet őrjáratra menni.');
    if (save.patrol) fail('state', 'Már őrjáraton vagy.');
    const day = budapestDate(ctx.now);
    if (save.patrolDay === day) fail('state', 'Ma már voltál őrjáraton. Holnap újra mehetsz.');
    save.patrol = { start: ctx.now, end: ctx.now + hours * 3600 * 1000, hours: hours, seed: E.newSeed() };
    save.patrolDay = day;
  };
  A.patrolClaim = (save, a, ctx) => {
    const p = save.patrol, h = save.hero;
    if (!p) fail('state', 'Nem vagy őrjáraton.');
    if (p.end > ctx.now) fail('state', 'Az őrjárat még nem ért véget.');
    const rng = E.mulberry32(p.seed), rw = patrolReward(h, p.hours), bonus = xpBonus(save, ctx);
    const out = { hours: p.hours, xp: Math.round(rw.xp * bonus), silver: rw.silver, dust: 0, item: null };
    h.silver += out.silver;
    out.dust = E.addDust(save, h, rw.dust, ctx.now);
    if (rng() < rw.itemChance) {
      const rar = E.makeItem(rng, { rarity: E.rollLoot(rng, 'kozepes', h), level: h.level, classId: h.classId, hero: h });
      out.item = rar; out.itemResult = E.addItem(save, h, rar, ctx.now);
      itemEvent(save, rar, ctx, 'őrjárat');
    }
    out.levelUps = E.addXp(h, out.xp);
    levelEvents(save, out.levelUps, ctx);
    personal(save, ctx.now, `<b>${esc(h.name)}</b> visszatért egy ${p.hours} órás őrjáratról.`, '');
    save.patrol = null;
    return out;
  };

  // ---------- futtatás ----------
  const FREE_DURING_EXPEDITION = ['tactic', 'restyle', 'lookPick', 'dye', 'settings', 'tip', 'equip', 'salvage', 'sell', 'salvageWeak', 'upgrade', 'reroll', 'skillMove', 'skillOrder', 'equipIds', 'lockItem', 'transfer', 'patrolStart', 'patrolClaim'];

  // tárgyak átállítása az új rendszerre (legendás fokozat, fejlesztés-visszatérítés): egyszer, minden régi mentésen
  function migrateItems(save) {
    if (!save || !save.hero || save.itemsV >= 2) return migrateItems3(save);
    const h = save.hero, all = D.SLOT_ORDER.map(s => h.equipped[s]).filter(Boolean).concat(h.inventory || []);
    all.forEach(it => {
      // a régi fejlesztések ára (20 × t × (1 + szint/10)) visszamenőleg is számít a visszatérítésbe
      if (it.spent == null) { let sp = 0; for (let t = 1; t <= (it.plus || 0); t++) sp += Math.round(20 * t * (1 + it.level / 10)); it.spent = sp; }
      // a mitikus tárgy mostantól legendás erejű
      if (it.mythic && it.rarity === 'lila') {
        it.rarity = 'legendas'; it.converted = true; h.stats.legendaries = (h.stats.legendaries || 0) + 1;
        it.affixes = (it.affixes || []).map(a => ({ id: a.id, v: Math.round(a.v * 1.25) }));
        const have = it.affixes.map(a => a.id), extra = D.AFFIXES.filter(a => have.indexOf(a.id) < 0)[0];
        if (extra) it.affixes.push({ id: extra.id, v: Math.round(extra.max * 1.25) });
      }
    });
    if (h.pityLegend == null) h.pityLegend = 0;
    save.itemsV = 2;
    migrateItems3(save);
  }
  // a Holdkrónika finálé-tárgya: a neve a helyéhez (fegyvernél a kaszt fegyveréhez) illik
  const FINAL_NOUN = { pancel: 'köpeny', sisak: 'korona', gyuru: 'gyűrű', amulett: 'medál' };
  function storyFinalName(slot, classId) {
    const c = D.CLASSES[classId];
    return 'Csillagszív-' + (slot === 'fegyver' ? ((c && c.weapon) || 'kard') : (FINAL_NOUN[slot] || 'medál'));
  }
  // az alakváltó „agyarnyaklánc” fegyvere nyakláncnak látszott: agyarbuzogány lett belőle (név, gyűjtemény, bolt)
  const OLD_NOUN = /agyarnyaklánc$/i;
  function renameNoun(n) { return String(n).replace(/Agyarnyaklánc$/, 'Agyarbuzogány').replace(/agyarnyaklánc$/, 'agyarbuzogány'); }
  function migrateItems3(save) {
    if (!save || !save.hero || save.itemsV >= 3) return migrateItems4(save);
    const h = save.hero, fix = it => { if (it && it.slot === 'fegyver' && OLD_NOUN.test(it.name || '')) it.name = renameNoun(it.name); };
    D.SLOT_ORDER.forEach(s => fix(h.equipped[s])); (h.inventory || []).forEach(fix);
    if (save.shop && save.shop.items) save.shop.items.forEach(x => fix(x && x.item ? x.item : x));
    const al = save.album && save.album.items;
    if (al) Object.keys(al).forEach(n => { if (OLD_NOUN.test(n) && al[n].slot === 'fegyver') { const nn = renameNoun(n); if (!al[nn]) al[nn] = al[n]; delete al[n]; } });
    save.itemsV = 3;
    migrateItems4(save);
  }
  // v4: a régi „Csillagszív-lámpás” bármelyik helyre eshetett (lámpásként gyűrű, sisak…); a nevet a helyéhez igazítjuk.
  // A „Vérhold-agyar” amulett pedig fegyvernek hangzott: Vérhold-medál lett.
  function migrateItems4(save) {
    if (!save || !save.hero || save.itemsV >= 4) return;
    const h = save.hero, ren = {};
    const fix = it => {
      if (!it) return;
      if (it.name === 'Csillagszív-lámpás') { const nn = storyFinalName(it.slot, h.classId); if (nn !== it.name) { ren[it.name + '|' + it.slot] = nn; it.name = nn; } }
      else if (it.name === 'Vérhold-agyar' && it.slot === 'amulett') { ren['Vérhold-agyar|amulett'] = 'Vérhold-medál'; it.name = 'Vérhold-medál'; }
    };
    D.SLOT_ORDER.forEach(s => fix(h.equipped[s])); (h.inventory || []).forEach(fix);
    const al = save.album && save.album.items;
    if (al) Object.keys(al).forEach(n => { const nn = ren[n + '|' + al[n].slot] || (n === 'Vérhold-agyar' ? 'Vérhold-medál' : n === 'Csillagszív-lámpás' ? storyFinalName(al[n].slot, h.classId) : n); if (nn !== n) { if (!al[nn]) al[nn] = al[n]; delete al[n]; } });
    save.itemsV = 4;
  }
  function run(save, action, args, ctx) {
    const fn = A[action];
    if (!fn) fail('action', 'Ismeretlen művelet.');
    migrateItems(save);
    ctx = Object.assign({ events: [], median: 0 }, ctx);
    ctx.events = ctx.events || [];
    E.torchState(save, ctx.now);
    if (!save.buffs) save.buffs = {};
    const result = fn(save, args || {}, ctx) || {};
    refreshOffers(save);
    return { result: result, events: ctx.events };
  }

  // A kliens nem láthatja előre a véletlenmagokat (különben kiszámolhatná a harcok kimenetelét)
  function sanitize(save) {
    return JSON.parse(JSON.stringify(save, (k, v) => (k === 'seed' ? undefined : v)));
  }

  function summary(save) {
    const h = save.hero, s = E.heroStats(h);
    return { name: h.name, classId: h.classId, level: h.level, xp: h.xp, power: E.power(s), mythics: h.stats.mythics || 0, legendaries: h.stats.legendaries || 0, wins: h.stats.wins || 0 };
  }

  root.NYX.game = {
    run: run, migrateItems: migrateItems, storyFinalName: storyFinalName, actions: A, createSave: createSave, refreshOffers: refreshOffers, offersKey: offersKey, sanitize: sanitize, summary: summary,
    wind: wind, xpBonus: xpBonus, patrolReward: patrolReward, PATROL_HOURS: PATROL_HOURS, budapestDate: budapestDate, validName: validName,
    cleanRig: cleanRig, cleanWorn: cleanWorn, migrateLook: migrateLook, wornLook: wornLook, lookVisible: lookVisible, lookName: lookName, cosmeticList: cosmeticList, unlockCosmetics: unlockCosmetics, DYES: DYES, DYE_COST: DYE_COST, SET_NAME: SET_NAME, lookKey: lookKey, lookPiece: lookPiece, unlockLooks: unlockLooks,
    esc: esc, az: az, fmt: fmt, personal: personal, itemEvent: itemEvent, levelEvents: levelEvents, FREE_DURING_EXPEDITION: FREE_DURING_EXPEDITION
  };
})(typeof window !== 'undefined' ? window : globalThis);
