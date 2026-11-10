/* Nyxoria RPG – játéklogika. Tiszta függvények, nincs benne DOM.
   Később változtatás nélkül a szerverre költöztethető (Supabase Edge Function). */
(function (root) {
  'use strict';
  var D = root.NYX.data;

  // ---------- Véletlen ----------
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function newSeed(rng) { return Math.floor((rng ? rng() : Math.random()) * 4294967296) >>> 0; }
  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
  function shuffle(rng, arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // ---------- Alapértékek ----------
  var MAX_ROUNDS = 25, GEAR_AVG = 1.25, MAX_LEVEL = 50;
  // a harc tempója: minden ütés ekkora részét viszi be (hosszabb harc → több képesség jut szóhoz);
  // a képességek a harc elején sorban készen állnak (1., 2., 3. … kör), utána a saját újratöltésük szerint jönnek
  // dmg: a hős (és társai) ütése; a szörny ütése ehhez képest képességenként perSkill-lel erősebb, hogy a
  // harc elején sorban kész képességek többlete ne billentse el az erőviszonyokat (független szimulációval hangolva)
  // boss: a heti szörnynél az ütést visszaskálázzuk, hogy átlagosan ugyanannyit vigyen be, mint a régi rendszerben (mérve: ×1,146)
  var COMBAT = { dmg: 0.55, perSkill: 0.06, readyAtStart: true, boss: 1 / (0.55 * 1.146) };
  var DIFF = {
    konnyu:  { name: 'Könnyű',  band: [0.85, 0.95], target: 0.90, xp: 0.8, itemChance: 0.40, silver: 0.8, dust: 0.8 },
    kozepes: { name: 'Közepes', band: [0.65, 0.80], target: 0.72, xp: 1.0, itemChance: 0.55, silver: 1.0, dust: 1.0 },
    nehez:   { name: 'Nehéz',   band: [0.30, 0.45], target: 0.38, xp: 1.2, itemChance: 0.70, silver: 1.25, dust: 1.3 }
  };
  var DIFF_ORDER = ['konnyu', 'kozepes', 'nehez'];
  var MOONS = {
    // az erősebb holdnál a szörny erősebb, de az ajánlatok ehhez igazodnak; cserébe több Holdezüst, tapasztalat, Csillagpor és mitikus esély jár
    // risk: ennyivel kisebb a győzelmi esély az ajánlatoknál (kockázat a nagyobb jutalomért cserébe)
    ujhold:   { name: 'Újhold',   power: 1.00, dust: 1.00, mythic: 1.00, silver: 1.00, xp: 1.00, risk: 0.00, minLevel: 1 },
    felhold:  { name: 'Félhold',  power: 1.04, dust: 1.25, mythic: 1.25, silver: 1.10, xp: 1.05, risk: 0.05, minLevel: 20 },
    telihold: { name: 'Telihold', power: 1.08, dust: 1.50, mythic: 1.50, silver: 1.20, xp: 1.10, risk: 0.10, minLevel: 20 },
    verhold:  { name: 'Vérhold',  power: 1.12, dust: 2.00, mythic: 2.00, silver: 1.35, xp: 1.15, risk: 0.15, minLevel: 20 }
  };
  var MOON_ORDER = ['ujhold', 'felhold', 'telihold', 'verhold'];
  // elit őrző: a Közepes és Nehéz ajánlatok egy része (az 5. szinttől) feldühödött, megerősödött őrzővel jön.
  // Az esély ennyivel kisebb (risk), cserébe több Holdezüst, Csillagpor, tapasztalat, és nagyobb eséllyel jár tárgy.
  var ELITE = { chance: 0.2, minLevel: 5, risk: 0.08, silver: 1.2, dust: 1.2, xp: 1.15, item: 0.15, mythic: 1.3 };
  function offerMoon(o) {
    var m = MOONS[o && o.moon] || MOONS.ujhold;
    if (!o || !o.elite) return m;
    return { name: m.name, power: m.power, dust: m.dust * ELITE.dust, mythic: m.mythic * ELITE.mythic, silver: m.silver * ELITE.silver, xp: m.xp * ELITE.xp, risk: m.risk, minLevel: m.minLevel };
  }
  // a kockázat a célesélyhez arányos, mint a holdaknál (Nehéznél kisebb levonás, különben az elit Nehéz csapda lenne)
  function eliteTarget(d, moon, elite) { return offerTarget(d, moon) - (elite ? ELITE.risk * DIFF[d].target / DIFF.kozepes.target : 0); }
  var TORCH = { max: 8, regenMs: 90 * 60 * 1000, restedMax: 16 };
  var DUST_WEEKLY = 1500, WEEK_MS = 7 * 24 * 3600 * 1000; // DUST_WEEKLY: a régi, fix keret (már csak tájékoztatásul); az új: dustCap(szint)
  // Ritkaság-kapuk és lila esély (független szimulációval hangolva: első lila kb. a 16. szinten, utána heti ~2–3, teljes lila szett kb. a 32. szint körül)
  var PITY_PURPLE = 80;   // ennyi (Közepes/Nehéz kalandos vagy csapatos) tárgysorsolásból legalább egy lila, de csak a lila kapu után
  var RARITY_GATE = { kek: 5, lila: 12, legendas: 25 };
  var LILA_CHANCE = { konnyu: [0, 0], kozepes: [0.004, 0.012], nehez: [0.015, 0.045] }; // a 12. szinttől a 40.-ig nő
  // Legendás: a 25. szinttől, főleg Nehéz kalandokból (első kb. a 28. szinten, teljes szett a 46–50. szint körül)
  var LEGEND_CHANCE = { konnyu: [0, 0], kozepes: [0.001, 0.002], nehez: [0.008, 0.016] }; // a 25. szinttől az 50.-ig nő
  var PITY_LEGEND = 300;
  // a fejlesztés felső határa ritkaság szerint
  var MAX_PLUS = { szurke: 4, zold: 6, kek: 8, lila: 10, legendas: 12 };
  var REFUND = 0.7; // szétszedéskor és eladáskor a fejlesztésre költött Csillagpor ennyi része jár vissza (a heti kereten felül)
  var MYTHIC = { base: 0.002, rampFrom: 850, guaranteed: 1000 };
  var INVENTORY_MAX = 40;

  // Referenciahős: az eredeti 4 kaszt átlaga, felszerelés nélkül
  function refBase(L) {
    return { elet: 98.75 + 19.75 * L, tam: 12.5 + 2.5 * L, ved: 8.75 + 1.75 * L, fur: 10.5 + 1.05 * L };
  }

  // a szintlépés tempója: napi egy alkalommal kb. két hónap az 50. szintig
  function xpNeeded(L) { return Math.round(24 * Math.pow(L, 1.7)); }
  function xpBase(L) { return 20 + 8 * L; }
  function silverBase(L) { return 10 + 4 * L; }

  // ---------- Tárgyak ----------
  function itemStats(item) {
    var b = refBase(item.level), budget = D.SLOT_BUDGET[item.slot];
    var m = D.RARITIES[item.rarity].mult * (1 + 0.03 * (item.plus || 0));
    var s = { elet: 0, tam: 0, ved: 0, fur: 0 };
    if (budget.tam) s.tam = b.tam * budget.tam * m;
    if (budget.elet) s.elet = b.elet * budget.elet * m;
    if (budget.ved) s.ved = b.ved * budget.ved * m;
    if (budget.fur) s.fur = b.fur * 0.10 * m;
    return s;
  }

  function itemName(rng, slot, rarity, classId) {
    var adj = pick(rng, D.ITEM_ADJ[rarity]);
    var noun;
    if (slot === 'fegyver') noun = pick(rng, D.ITEM_NAMES.fegyver[D.CLASSES[classId].weapon]);
    else noun = pick(rng, D.ITEM_NAMES[slot]);
    return adj + ' ' + noun;
  }

  var _itemCounter = 0;
  // a legendás tárgy olyan helyre kerül, ahol még nincs legendás (amíg a szett nem teljes)
  function legendSlot(rng, hero) {
    var has = {};
    D.SLOT_ORDER.forEach(function (s) { var e = hero.equipped && hero.equipped[s]; if (e && e.rarity === 'legendas') has[s] = 1; });
    (hero.inventory || []).forEach(function (it) { if (it.rarity === 'legendas') has[it.slot] = 1; });
    var free = D.SLOT_ORDER.filter(function (s) { return !has[s]; });
    return pick(rng, free.length ? free : D.SLOT_ORDER);
  }
  function rollAffix(rng, a, rarity) {
    var m = D.RARITIES[rarity].affixMult || 1;
    return { id: a.id, v: Math.round((a.min + Math.floor(rng() * (a.max - a.min + 1))) * m) };
  }
  function setForLevel(L) { var f = D.REGIONS.filter(function (r) { return L >= r.min && L <= r.max; }); return (f[0] || (L < D.REGIONS[0].min ? D.REGIONS[0] : D.REGIONS[D.REGIONS.length - 1])).id; }
  function makeItem(rng, opts) {
    var rarity = opts.rarity || 'szurke';
    var slot = opts.slot || (rarity === 'legendas' && opts.hero ? legendSlot(rng, opts.hero) : pick(rng, D.SLOT_ORDER));
    var affixes = [];
    var pool = shuffle(rng, D.AFFIXES);
    for (var i = 0; i < D.RARITIES[rarity].affixes; i++) affixes.push(rollAffix(rng, pool[i], rarity));
    var name = opts.name, line = opts.line;
    if (!name && rarity === 'legendas') {
      var ln = slot === 'fegyver' ? D.LEGEND_NAMES.fegyver[D.CLASSES[opts.classId] ? D.CLASSES[opts.classId].weapon : 'kard'] : D.LEGEND_NAMES[slot];
      name = pick(rng, ln || D.LEGEND_NAMES.pancel);
    }
    if (!line && rarity === 'legendas') line = pick(rng, D.LEGEND_LINES);
    _itemCounter++;
    var it = {
      id: 'i' + Date.now().toString(36) + _itemCounter.toString(36) + Math.floor(rng() * 1e6).toString(36),
      slot: slot, rarity: rarity, level: Math.max(1, Math.round(opts.level || 1)), plus: 0,
      name: name || itemName(rng, slot, rarity, opts.classId), affixes: affixes,
      mythic: !!opts.mythic
    };
    // a tárgy szettje (kinézete): ahonnan származik; ha nem tudjuk, a szintjéhez illő tájegység
    it.set = opts.set && D.REGIONS.some(function (r) { return r.id === opts.set; }) ? opts.set : setForLevel(it.level);
    if (line) it.line = line;
    return it;
  }

  function affixText(a) {
    var def = D.AFFIXES.filter(function (x) { return x.id === a.id; })[0];
    return def ? def.text.replace('{v}', a.v) : '';
  }

  // a szinthez még nem nyílt ritkaság a legjobb elérhetőre csökken
  function gateRarity(r, level) {
    if (r === 'legendas' && level < RARITY_GATE.legendas) r = 'lila';
    if (r === 'lila' && level < RARITY_GATE.lila) r = 'kek';
    if (r === 'kek' && level < RARITY_GATE.kek) r = 'zold';
    return r;
  }
  function lilaChance(diff, level) {
    var g = LILA_CHANCE[diff] || LILA_CHANCE.kozepes;
    if (level < RARITY_GATE.lila) return 0;
    var f = Math.min(1, (level - RARITY_GATE.lila) / (40 - RARITY_GATE.lila));
    return g[0] + (g[1] - g[0]) * f;
  }
  // közös tárgysorsolás minden forráshoz. opts.pity: számít-e a lila védelembe (csak Közepes/Nehéz kaland és csapat); opts.floor: legalább ilyen ritka
  function legendChance(diff, level) {
    var g = LEGEND_CHANCE[diff] || LEGEND_CHANCE.kozepes;
    if (level < RARITY_GATE.legendas) return 0;
    var f = Math.min(1, (level - RARITY_GATE.legendas) / (50 - RARITY_GATE.legendas));
    return g[0] + (g[1] - g[0]) * f;
  }
  function rollLoot(rng, diff, hero, opts) {
    opts = opts || {};
    var L = hero.level, t = D.RARITY_TABLE[diff] || D.RARITY_TABLE.kozepes;
    if (L < RARITY_GATE.lila) hero.pityPurple = 0;
    if (L < RARITY_GATE.legendas) hero.pityLegend = 0;
    // a legendás külön réteg, ezt nézzük meg először (saját védelemmel)
    var legOn = opts.pity && L >= RARITY_GATE.legendas && diff !== 'konnyu';
    if (L >= RARITY_GATE.legendas && ((legOn && (hero.pityLegend || 0) >= PITY_LEGEND - 1) || rng() < legendChance(diff, L))) {
      if (legOn) hero.pityLegend = 0;
      return 'legendas';
    }
    if (legOn) hero.pityLegend = (hero.pityLegend || 0) + 1;
    var pityOn = opts.pity && L >= RARITY_GATE.lila && diff !== 'konnyu', r;
    if (pityOn && (hero.pityPurple || 0) >= PITY_PURPLE - 1) r = 'lila';
    else {
      var x = rng(), pl = lilaChance(diff, L);
      r = x < pl ? 'lila' : x < 1 - t.szurke - t.zold ? 'kek' : x < 1 - t.szurke ? 'zold' : 'szurke';
    }
    if (opts.floor && D.RARITY_ORDER.indexOf(r) < D.RARITY_ORDER.indexOf(opts.floor)) r = opts.floor;
    r = gateRarity(r, L);
    if (pityOn) hero.pityPurple = r === 'lila' ? 0 : (hero.pityPurple || 0) + 1;
    return r;
  }

  function mythicChance(tries) {
    if (tries + 1 >= MYTHIC.guaranteed) return 1;
    if (tries < MYTHIC.rampFrom) return MYTHIC.base;
    var f = (tries - MYTHIC.rampFrom) / (MYTHIC.guaranteed - MYTHIC.rampFrom);
    return MYTHIC.base + f * f * 0.25;
  }

  // Szétszedés: Csillagpor (beleszámít a heti keretbe). Eladás: Holdezüst. Mindkettőnél visszajár a fejlesztésre költött por 70%-a (a kereten felül).
  function salvageValue(item) {
    var r = Math.max(0, D.RARITY_ORDER.indexOf(item.rarity));
    return Math.round((6 + item.level) * [1, 2, 4, 8, 16][r]);
  }
  function sellValue(item) {
    var r = Math.max(0, D.RARITY_ORDER.indexOf(item.rarity));
    return Math.max(1, Math.round(silverBase(item.level) * [0.3, 0.6, 1.2, 3, 8][r]));
  }
  function refundValue(item) { return Math.round(REFUND * (item.spent || 0)); }
  function maxPlus(item) { return MAX_PLUS[item.rarity] || 10; }
  // a következő fejlesztés ára: Csillagpor és egy kevés Holdezüst (egyre meredekebb)
  function upgradeCost(item) {
    var t = (item.plus || 0) + 1;
    if (t > maxPlus(item)) return null;
    return Math.round(20 * Math.pow(t, 1.7) * (1 + item.level / 10));
  }
  function upgradeSilver(item) {
    var t = (item.plus || 0) + 1;
    if (t > maxPlus(item)) return null;
    return Math.round(1.5 * Math.pow(t, 1.7) * silverBase(item.level));
  }

  // ---------- Hős ----------
  function newHero(opts) {
    var rng = mulberry32(opts.seed || newSeed());
    var hero = {
      name: opts.name, classId: opts.classId, people: opts.people, look: opts.look || {},
      origin: opts.origin, trait: opts.trait, motto: opts.motto || '',
      level: 1, xp: 0, silver: 50, dust: 0, tactic: D.CLASSES[opts.classId].tactic,
      loadout: [], equipped: {}, inventory: [],
      pityPurple: 0, pityLegend: 0, mythicTries: 0, stats: { expeditions: 0, wins: 0, losses: 0, bestWinNehez: 0, mythics: 0 },
      createdAt: opts.now || Date.now()
    };
    D.SLOT_ORDER.forEach(function (slot) {
      var it = makeItem(rng, { slot: slot, rarity: 'szurke', level: 1, classId: opts.classId });
      hero.equipped[slot] = it;
    });
    hero.loadout = unlockedSkills(hero).slice(1);
    return hero;
  }

  function unlockedSkills(hero) {
    var c = D.CLASSES[hero.classId], list = [c.basic];
    for (var i = 0; i < D.SKILL_LEVELS.length; i++) if (hero.level >= D.SKILL_LEVELS[i]) list.push(c.skills[i]);
    return list;
  }
  function nextSkillUnlock(hero) {
    var c = D.CLASSES[hero.classId];
    for (var i = 0; i < D.SKILL_LEVELS.length; i++) if (hero.level < D.SKILL_LEVELS[i]) return { level: D.SKILL_LEVELS[i], skill: c.skills[i] };
    return null;
  }

  function heroStats(hero, equippedOverride) {
    var c = D.CLASSES[hero.classId], L = hero.level, eq = equippedOverride || hero.equipped;
    var s = { elet: c.base.elet[0] + c.base.elet[1] * L, tam: c.base.tam[0] + c.base.tam[1] * L,
              ved: c.base.ved[0] + c.base.ved[1] * L, fur: c.base.fur[0] + c.base.fur[1] * L,
              dmg: 0, crit: 0, dodge: 0, hp: 0, heal: 0, first: 0 };
    D.SLOT_ORDER.forEach(function (slot) {
      var it = eq[slot];
      if (!it) return;
      var is = itemStats(it);
      s.elet += is.elet; s.tam += is.tam; s.ved += is.ved; s.fur += is.fur;
      (it.affixes || []).forEach(function (a) { s[a.id] += a.v; });
    });
    // ösvény (a 15. szinttől): százalékos jellemző-növelés és különleges tulajdonságok
    var path = hero.path != null && D.PATHS && D.PATHS[hero.classId] ? D.PATHS[hero.classId][hero.path] : null;
    if (path && L >= D.PATH_LEVEL) {
      var b = path.b;
      ['elet', 'tam', 'ved', 'fur'].forEach(function (k) { if (b[k]) s[k] *= 1 + b[k] / 100; });
      ['dmg', 'crit', 'dodge', 'heal', 'first'].forEach(function (k) { if (b[k]) s[k] += b[k]; });
    }
    s.elet *= 1 + s.hp / 100;
    s.level = L;
    return s;
  }

  function powerRaw(s) { // ÉLET/4 + TÁM×3 + VÉD×2 + FÜR, plusz a tárgyjellemzők becsült értéke
    return s.elet / 4 + s.tam * 3 + s.ved * 2 + s.fur + s.tam * 3 * (s.dmg + s.crit * 0.75 + s.first * 0.2) / 100 + s.elet / 4 * (s.dodge + s.heal * 0.4) / 100; }
  function power(s) { return Math.round(powerRaw(s)); }
  function lootLevel(hero, lm) { return Math.max(1, Math.min(hero.level, Math.max(hero.level - 2, Math.round(lm)))); }

  function fighterFromHero(hero, extra) {
    var s = heroStats(hero);
    extra = extra || {};
    return {
      side: 'h', name: hero.name, classId: hero.classId, level: hero.level,
      maxHp: s.elet, hpStart: s.elet * (extra.hpFactor || 1),
      tam: s.tam, ved: s.ved, fur: s.fur,
      dmgPct: s.dmg + (extra.blessing === true ? 10 : (+extra.blessing || 0)), critPct: s.crit, dodgePct: s.dodge, healPct: s.heal, firstPct: s.first,
      loadout: (hero.loadout || []).slice(), basic: D.CLASSES[hero.classId].basic,
      pet: D.CLASSES[hero.classId].pet || 0, firstStrike: D.CLASSES[hero.classId].firstStrike || 1
    };
  }

  function monsterFighter(Lm, opts) {
    opts = opts || {};
    var r = refBase(Lm), pw = opts.power || 1;
    return {
      side: 'm', name: opts.name || 'Szörny', level: Math.max(1, Math.round(Lm)), lm: Lm,
      maxHp: r.elet * GEAR_AVG * pw, hpStart: r.elet * GEAR_AVG * pw,
      tam: r.tam * GEAR_AVG * pw, ved: r.ved * GEAR_AVG, fur: r.fur,
      dmgPct: 0, critPct: 0, dodgePct: 0, healPct: 0, firstPct: 0
    };
  }

  // ---------- Harc ----------
  function scaleFor(L) { return 40 + 8 * L; }

  function simulateFight(hero, mon, tacticId, seed, withLog, opts) {
    var maxR = (opts && opts.maxRounds) || MAX_ROUNDS;
    var rng = mulberry32(seed);
    var T = D.TACTICS[tacticId] || D.TACTICS.kiegy;
    var L = Math.max(1, Math.round((hero.level + mon.level) / 2));
    var K = 50 + 10 * L, sc = scaleFor(L);
    var hp = hero.hpStart, mhp = mon.hpStart;
    var log = withLog ? [] : null;
    var st = { buffDmg: 0, buffUntil: 0, guard: 1, guardUntil: 0, shield: 0, dodge: 0, dodgeUntil: 0,
               haste: 0, hasteUntil: 0, regen: 0, regenUntil: 0, packUntil: 0, petGoneUntil: 0 };
    var ms = { stunned: false, slow: 0, slowUntil: 0, weak: 1, weakUntil: 0, armor: 0, armorUntil: 0, dot: 0, dotUntil: 0 };
    // egy másik hős szelleme a saját képességszámával üt (azzal is lett hangolva)
    var ready = {}, monMul = COMBAT.dmg + COMBAT.perSkill * ((mon.ghostOf && mon.loadout) || hero.loadout || []).length;
    (hero.loadout || []).forEach(function (id, i) { ready[id] = COMBAT.readyAtStart ? i + 1 : D.SKILLS[id].cd; });
    var firstHitDone = false, rnd, dmgDealt = 0, dmgTaken = 0, dodged = 0, crits = 0;

    function emit(e) { if (log) { e.r = rnd; e.hp = Math.max(0, hp); e.mhp = Math.max(0, mhp); log.push(e); } }

    function attackRoll(att, def, mult, opts) {
      opts = opts || {};
      var defFur = def.side === 'm' ? def.fur * (rnd <= ms.slowUntil ? 1 - ms.slow : 1) : def.fur * (rnd <= st.hasteUntil ? 1 + st.haste : 1);
      var attFur = att.side === 'm' ? att.fur * (rnd <= ms.slowUntil ? 1 - ms.slow : 1) : att.fur * (rnd <= st.hasteUntil ? 1 + st.haste : 1);
      var dodgeP = 0.03 + 0.12 * defFur / (defFur + sc) + def.dodgePct / 100;
      if (def.side === 'h' && rnd <= st.dodgeUntil) dodgeP += st.dodge;
      if (rng() < dodgeP) return { dmg: 0, dodge: true };
      var ved = def.ved * (def.side === 'm' && rnd <= ms.armorUntil ? 1 - ms.armor : 1);
      var d = att.tam * 2 * mult * K / (K + ved) * (0.7 + rng() * 0.6);
      d *= 1 + att.dmgPct / 100;
      if (att.side === 'h') {
        d *= T.out;
        if (rnd <= st.buffUntil) d *= 1 + st.buffDmg;
        if (rnd === 1) d *= 1 + att.firstPct / 100;
      } else {
        d *= T.inc;
        if (rnd <= ms.weakUntil) d *= ms.weak;
        if (rnd <= st.guardUntil) d *= st.guard;
      }
      var critP = 0.05 + 0.25 * attFur / (attFur + sc) + att.critPct / 100 + (opts.crit || 0);
      var crit = rng() < critP;
      if (crit) d *= 1.75;
      return { dmg: d * (att.side === 'm' ? monMul : COMBAT.dmg), crit: crit };
    }

    function heroHit(mult, skillId, extra) {
      var res = attackRoll(hero, mon, mult, extra);
      if (!res.dodge && !firstHitDone && hero.firstStrike > 1) { res.dmg *= hero.firstStrike; res.first = true; }
      if (!res.dodge) firstHitDone = true;
      mhp -= res.dmg; dmgDealt += res.dmg;
      if (res.dodge) dodged++; if (res.crit) crits++;
      emit({ who: 'h', kind: 'hit', skill: skillId, dmg: Math.round(res.dmg), crit: !!res.crit, dodge: !!res.dodge, first: !!res.first });
      return res;
    }

    function heal(amount, skillId) {
      var a = amount * (1 + hero.healPct / 100);
      var before = hp; hp = Math.min(hero.maxHp, hp + a);
      emit({ who: 'h', kind: 'heal', skill: skillId, amount: Math.round(hp - before) });
    }

    function heroTurn() {
      // folyamatos hatások
      if (rnd <= st.regenUntil && st.regen > 0) heal(hero.maxHp * st.regen, 'regen');
      var skillId = null;
      for (var i = 0; i < hero.loadout.length; i++) {
        var id = hero.loadout[i];
        if (rnd >= ready[id]) { skillId = id; break; }
      }
      if (!skillId) { heroHit(1.0, hero.basic); }
      else {
        var sk = D.SKILLS[skillId];
        ready[skillId] = rnd + sk.cd;
        var mult = sk.mult == null ? 1.0 : sk.mult;
        emit({ who: 'h', kind: 'skill', skill: skillId });
        switch (sk.type) {
          case 'hit': heroHit(mult, skillId, { crit: sk.crit || 0 }); break;
          case 'multi': for (var h = 0; h < sk.hits && mhp > 0; h++) heroHit(mult, skillId); break;
          case 'stun': var r1 = heroHit(mult, skillId); if (!r1.dodge && rng() < sk.chance) { ms.stunned = true; emit({ who: 'h', kind: 'stun', skill: skillId }); } break;
          case 'skip': var r2 = heroHit(mult, skillId); ms.stunned = true; emit({ who: 'h', kind: 'stun', skill: skillId }); break;
          case 'buff': st.buffDmg = sk.dmg; st.buffUntil = rnd + sk.rounds; heroHit(mult, skillId); break;
          case 'guard': st.guard = sk.taken; st.guardUntil = rnd + sk.rounds; heroHit(mult, skillId); break;
          case 'shield': st.shield += hero.maxHp * sk.pct * (1 + hero.healPct / 100); emit({ who: 'h', kind: 'shield', skill: skillId, amount: Math.round(st.shield) }); heroHit(mult, skillId); break;
          case 'dodge': st.dodge = sk.bonus; st.dodgeUntil = rnd + sk.rounds; heroHit(mult, skillId); break;
          case 'slow': ms.slow = sk.fur; ms.slowUntil = rnd + sk.rounds; heroHit(mult, skillId); break;
          case 'dot': heroHit(mult, skillId); ms.dot = sk.dot; ms.dotUntil = rnd + sk.rounds; break;
          case 'execute': var weak = ms.stunned || rnd <= ms.slowUntil; heroHit(weak ? sk.bonusMult : mult, skillId); break;
          case 'pack': st.packUntil = rnd + sk.rounds; heroHit(1.0, skillId); break;
          case 'sacrifice': st.petGoneUntil = rnd + sk.rounds; heroHit(mult, skillId); break;
          case 'weaken': ms.weak = sk.enemyDmg; ms.weakUntil = rnd + sk.rounds; heroHit(mult, skillId); break;
          case 'armorbreak': ms.armor = sk.ved; ms.armorUntil = rnd + sk.rounds; heroHit(mult, skillId); break;
          case 'heal': if (mult > 0) heroHit(mult, skillId); heal(hero.maxHp * sk.pct, skillId); break;
          case 'haste': st.haste = sk.fur; st.hasteUntil = rnd + sk.rounds; heroHit(mult, skillId); break;
          case 'regen': st.regen = sk.pct; st.regenUntil = rnd + sk.rounds; heroHit(mult, skillId); break;
          default: heroHit(mult, skillId);
        }
      }
      // idézett társ(ak)
      if (hero.pet && mhp > 0 && rnd > st.petGoneUntil) {
        var pets = rnd <= st.packUntil ? 2 : 1;
        for (var p = 0; p < pets && mhp > 0; p++) {
          var pr = attackRoll(hero, mon, hero.pet);
          mhp -= pr.dmg; dmgDealt += pr.dmg;
          emit({ who: 'pet', kind: 'hit', dmg: Math.round(pr.dmg), crit: !!pr.crit, dodge: !!pr.dodge });
        }
      }
      // csapattársak (csapatküldetés): a kasztjuk szerint segítenek. A gyógyító gyógyít, a harcos pajzsot ad, a dalnok
      // a hős képességeit hamarabb tölti újra (legfeljebb eggyel, és sosem ad plusz lépést ugyanabban a körben); közben
      // ők is ütnek (a támogatók gyengébben), a többiek teljes erővel. Az ellenfelet a teljes csapathoz méri a motor.
      if (hero.allies && mhp > 0) {
        var tempoDone = false;
        for (var k = 0; k < hero.allies.length && mhp > 0; k++) {
          var al = hero.allies[k], role = ALLY_ROLE[al.classId] || 'dmg', sh = al.share || 0.4, w = sh / 0.5;
          if (role === 'heal' && rnd % 2 === 0 && hp < hero.maxHp) { var hb = hp; hp = Math.min(hero.maxHp, hp + hero.maxHp * 0.08 * w); emit({ who: 'ally', ally: k, kind: 'heal', amount: Math.round(hp - hb) }); }
          else if (role === 'shield' && rnd % 3 === 1) { var sa = hero.maxHp * 0.1 * w; st.shield += sa; emit({ who: 'ally', ally: k, kind: 'shield', amount: Math.round(st.shield) }); }
          else if (role === 'tempo' && rnd % 2 === 0 && !tempoDone) {
            tempoDone = true; (hero.loadout || []).forEach(function (id) { ready[id] = Math.max(rnd + 1, ready[id] - 1); });
            emit({ who: 'ally', ally: k, kind: 'tempo' });
          }
          var ar = attackRoll(hero, mon, role === 'dmg' || role === 'tempo' ? sh : sh * 0.5); // a dalnok gyorsítása kicsi, ezért ő teljes erővel üt
          mhp -= ar.dmg; dmgDealt += ar.dmg;
          emit({ who: 'ally', ally: k, kind: 'hit', dmg: Math.round(ar.dmg), crit: !!ar.crit, dodge: !!ar.dodge });
        }
      }
      // méreg
      if (mhp > 0 && rnd <= ms.dotUntil && ms.dot > 0) {
        var dd = hero.tam * 2 * ms.dot * K / (K + mon.ved) * T.out * COMBAT.dmg;
        mhp -= dd; dmgDealt += dd;
        emit({ who: 'h', kind: 'dot', dmg: Math.round(dd) });
      }
    }

    function monTurn() {
      if (ms.stunned) { ms.stunned = false; emit({ who: 'm', kind: 'skip' }); return; }
      var special = rnd % 4 === 0;
      var res = attackRoll(mon, hero, special ? 1.6 : 1.0);
      var d = res.dmg;
      if (st.shield > 0 && d > 0) { var ab = Math.min(st.shield, d); st.shield -= ab; d -= ab; res.absorbed = Math.round(ab); }
      hp -= d; dmgTaken += d;
      emit({ who: 'm', kind: 'hit', special: special, dmg: Math.round(d), crit: !!res.crit, dodge: !!res.dodge, absorbed: res.absorbed || 0 });
    }

    for (rnd = 1; rnd <= maxR; rnd++) {
      var hf = hero.fur * (rnd <= st.hasteUntil ? 1 + st.haste : 1);
      var mf = mon.fur * (rnd <= ms.slowUntil ? 1 - ms.slow : 1);
      // a fürgébb gyakrabban kezd, de nem mindig (súlyozott véletlen): így egy hajszálnyi különbség nem dönti el a harcot
      var heroFirst = rng() < clamp(0.5 + 1.5 * (hf - mf) / Math.max(1, hf + mf), 0.2, 0.8);
      emit({ kind: 'round', rd: log ? (hero.loadout || []).map(function (id) { return ready[id]; }) : null }); // a képességsáv ebből mutatja, mikor lesz kész
      var order = heroFirst ? ['h', 'm'] : ['m', 'h'];
      for (var o = 0; o < 2; o++) {
        if (hp <= 0 || mhp <= 0) break;
        if (order[o] === 'h') heroTurn(); else monTurn();
      }
      if (hp <= 0 || mhp <= 0) break;
    }
    var rounds = Math.min(rnd, maxR), win, timeout = false;
    if (hp > 0 && mhp > 0) { timeout = true; win = hp / hero.maxHp > mhp / mon.maxHp; }
    else win = hp > 0;
    return { win: win, rounds: rounds, timeout: timeout, hpLeft: Math.max(0, hp), hpPct: Math.max(0, hp) / hero.maxHp,
             monHpPct: Math.max(0, mhp) / mon.maxHp, dmgDealt: dmgDealt, dmgTaken: dmgTaken, dodged: dodged, crits: crits,
             log: log, seed: seed };
  }

  var ALLY_ROLE = { gyogyito: 'heal', harcos: 'shield', dalnok: 'tempo' };
  // ---------- párbaj: két hős, mindkét oldal a saját képességeivel (csak az Arénában) ----------
  // Ugyanazok a képesség-hatások, mint a szörny elleni harcban, de szimmetrikusan: a másik hős is gyógyít, pajzsot húz,
  // kábít, mérgez, és az idézett társa is támad. A napló „h” (te) és „m” (az ellenfél) oldalra bontva készül,
  // ugyanúgy, mint a szörnyharcban, így a lejátszás és a HP-sávok változatlanul működnek.
  // Párbajban a gyógyítás és a pajzs gyengébb (ahogy a legtöbb szerepjáték PvP-jében), különben a gyógyító fél
  // egyszerűen kivárná a körlimitet; ezt mérésekkel hangoltuk, hogy egyik kasztpárosítás se legyen eleve eldöntött.
  var PVP = { heal: 1, shield: 1, fatigueFrom: 12, fatigue: 0.15 };
  function simulateDuel(a, b, tacA, tacB, seed, withLog, opts) {
    var maxR = (opts && opts.maxRounds) || MAX_ROUNDS;
    var rng = mulberry32(seed);
    var L = Math.max(1, Math.round((a.level + b.level) / 2)), K = 50 + 10 * L, sc = scaleFor(L);
    var log = withLog ? [] : null, rnd = 0, dmgDealt = 0, dmgTaken = 0, dodged = 0, crits = 0;
    function side(f, tac, who) {
      var sd = { f: f, hp: f.hpStart, T: D.TACTICS[tac] || D.TACTICS.kiegy, who: who, petWho: who === 'h' ? 'pet' : 'mpet', ready: {}, firstDone: false,
        st: { buffDmg: 0, buffUntil: 0, guard: 1, guardUntil: 0, shield: 0, dodge: 0, dodgeUntil: 0, haste: 0, hasteUntil: 0, regen: 0, regenUntil: 0, packUntil: 0, petGoneUntil: 0 },
        deb: { stunned: false, slow: 0, slowUntil: 0, weak: 1, weakUntil: 0, armor: 0, armorUntil: 0, dot: 0, dotUntil: 0 } };
      (f.loadout || []).forEach(function (id, i) { if (D.SKILLS[id]) sd.ready[id] = COMBAT.readyAtStart ? i + 1 : D.SKILLS[id].cd; });
      return sd;
    }
    var A = side(a, tacA, 'h'), B = side(b, tacB, 'm');
    function emit(e) { if (log) { e.r = rnd; e.hp = Math.max(0, A.hp); e.mhp = Math.max(0, B.hp); log.push(e); } }
    // kifáradás: a 12. kör után minden körben erősebbek az ütések és gyengébb a gyógyulás, így két gyógyító sem
    // húzhatja a párbajt a körlimitig eredmény nélkül
    function fatigue() { return rnd > PVP.fatigueFrom ? 1 + PVP.fatigue * (rnd - PVP.fatigueFrom) : 1; }
    function fur(sd) { return sd.f.fur * (rnd <= sd.deb.slowUntil ? 1 - sd.deb.slow : 1) * (rnd <= sd.st.hasteUntil ? 1 + sd.st.haste : 1); }
    function roll(att, def, mult, o) {
      o = o || {};
      var dF = fur(def), aF = fur(att);
      var dodgeP = 0.03 + 0.12 * dF / (dF + sc) + (def.f.dodgePct || 0) / 100 + (rnd <= def.st.dodgeUntil ? def.st.dodge : 0);
      if (rng() < dodgeP) return { dmg: 0, dodge: true };
      var ved = def.f.ved * (rnd <= def.deb.armorUntil ? 1 - def.deb.armor : 1);
      var d = att.f.tam * 2 * mult * K / (K + ved) * (0.7 + rng() * 0.6);
      d *= 1 + (att.f.dmgPct || 0) / 100;
      d *= att.T.out * def.T.inc * fatigue();
      if (rnd <= att.st.buffUntil) d *= 1 + att.st.buffDmg;
      if (rnd === 1) d *= 1 + (att.f.firstPct || 0) / 100;
      if (rnd <= att.deb.weakUntil) d *= att.deb.weak;
      if (rnd <= def.st.guardUntil) d *= def.st.guard;
      var crit = rng() < 0.05 + 0.25 * aF / (aF + sc) + (att.f.critPct || 0) / 100 + (o.crit || 0);
      if (crit) d *= 1.75;
      return { dmg: d * COMBAT.dmg, crit: crit };
    }
    function land(att, def, res) {
      var d = res.dmg;
      if (def.st.shield > 0 && d > 0) { var ab = Math.min(def.st.shield, d); def.st.shield -= ab; d -= ab; res.absorbed = Math.round(ab); }
      def.hp -= d;
      if (att === A) { dmgDealt += d; if (res.dodge) dodged++; if (res.crit) crits++; } else dmgTaken += d;
      return d;
    }
    function hit(att, def, mult, skillId, extra) {
      var res = roll(att, def, mult, extra);
      if (!res.dodge && !att.firstDone && att.f.firstStrike > 1) { res.dmg *= att.f.firstStrike; res.first = true; }
      if (!res.dodge) att.firstDone = true;
      var d = land(att, def, res);
      emit({ who: att.who, kind: 'hit', skill: skillId, dmg: Math.round(d), crit: !!res.crit, dodge: !!res.dodge, first: !!res.first, absorbed: res.absorbed || 0 });
      return res;
    }
    function heal(sd, amount, skillId) {
      var x = amount * (1 + (sd.f.healPct || 0) / 100) * PVP.heal / fatigue(), before = sd.hp; sd.hp = Math.min(sd.f.maxHp, sd.hp + x);
      emit({ who: sd.who, kind: 'heal', skill: skillId, amount: Math.round(sd.hp - before) });
    }
    function turn(me, foe) {
      if (me.deb.stunned) { me.deb.stunned = false; emit({ who: me.who, kind: 'skip' }); return; }
      if (rnd <= me.st.regenUntil && me.st.regen > 0) heal(me, me.f.maxHp * me.st.regen, 'regen');
      var lo = me.f.loadout || [], skillId = null;
      for (var i = 0; i < lo.length; i++) if (D.SKILLS[lo[i]] && rnd >= me.ready[lo[i]]) { skillId = lo[i]; break; }
      if (!skillId) hit(me, foe, 1.0, me.f.basic);
      else {
        var sk = D.SKILLS[skillId], mult = sk.mult == null ? 1.0 : sk.mult, st = me.st, fd = foe.deb;
        me.ready[skillId] = rnd + sk.cd;
        emit({ who: me.who, kind: 'skill', skill: skillId });
        switch (sk.type) {
          case 'hit': hit(me, foe, mult, skillId, { crit: sk.crit || 0 }); break;
          case 'multi': for (var h = 0; h < sk.hits && foe.hp > 0; h++) hit(me, foe, mult, skillId); break;
          case 'stun': var r1 = hit(me, foe, mult, skillId); if (!r1.dodge && rng() < sk.chance) { fd.stunned = true; emit({ who: me.who, kind: 'stun', skill: skillId }); } break;
          case 'skip': hit(me, foe, mult, skillId); fd.stunned = true; emit({ who: me.who, kind: 'stun', skill: skillId }); break;
          case 'buff': st.buffDmg = sk.dmg; st.buffUntil = rnd + sk.rounds; hit(me, foe, mult, skillId); break;
          case 'guard': st.guard = sk.taken; st.guardUntil = rnd + sk.rounds; hit(me, foe, mult, skillId); break;
          case 'shield': st.shield += me.f.maxHp * sk.pct * (1 + (me.f.healPct || 0) / 100) * PVP.shield; emit({ who: me.who, kind: 'shield', skill: skillId, amount: Math.round(st.shield) }); hit(me, foe, mult, skillId); break;
          case 'dodge': st.dodge = sk.bonus; st.dodgeUntil = rnd + sk.rounds; hit(me, foe, mult, skillId); break;
          case 'slow': fd.slow = sk.fur; fd.slowUntil = rnd + sk.rounds; hit(me, foe, mult, skillId); break;
          case 'dot': hit(me, foe, mult, skillId); fd.dot = sk.dot; fd.dotUntil = rnd + sk.rounds; fd.dotTam = me.f.tam; fd.dotOut = me.T.out; break;
          case 'execute': hit(me, foe, (fd.stunned || rnd <= fd.slowUntil) ? sk.bonusMult : mult, skillId); break;
          case 'pack': st.packUntil = rnd + sk.rounds; hit(me, foe, 1.0, skillId); break;
          case 'sacrifice': st.petGoneUntil = rnd + sk.rounds; hit(me, foe, mult, skillId); break;
          case 'weaken': fd.weak = sk.enemyDmg; fd.weakUntil = rnd + sk.rounds; hit(me, foe, mult, skillId); break;
          case 'armorbreak': fd.armor = sk.ved; fd.armorUntil = rnd + sk.rounds; hit(me, foe, mult, skillId); break;
          case 'heal': if (mult > 0) hit(me, foe, mult, skillId); heal(me, me.f.maxHp * sk.pct, skillId); break;
          case 'haste': st.haste = sk.fur; st.hasteUntil = rnd + sk.rounds; hit(me, foe, mult, skillId); break;
          case 'regen': st.regen = sk.pct; st.regenUntil = rnd + sk.rounds; hit(me, foe, mult, skillId); break;
          default: hit(me, foe, mult, skillId);
        }
      }
      if (me.f.pet && foe.hp > 0 && rnd > me.st.petGoneUntil) {
        var pets = rnd <= me.st.packUntil ? 2 : 1;
        for (var p = 0; p < pets && foe.hp > 0; p++) {
          var pr = roll(me, foe, me.f.pet), pd = land(me, foe, pr);
          emit({ who: me.petWho, kind: 'hit', dmg: Math.round(pd), crit: !!pr.crit, dodge: !!pr.dodge, absorbed: pr.absorbed || 0 });
        }
      }
      // a rajtam lévő méreg az én körömben mar (ahogy a szörnyharcban is a szörny körével együtt)
      if (foe.hp > 0 && rnd <= foe.deb.dotUntil && foe.deb.dot > 0) {
        var dd = me.f.tam * 2 * foe.deb.dot * K / (K + foe.f.ved) * me.T.out * COMBAT.dmg;
        foe.hp -= dd; if (me === A) dmgDealt += dd; else dmgTaken += dd;
        emit({ who: me.who, kind: 'dot', dmg: Math.round(dd) });
      }
    }
    for (rnd = 1; rnd <= maxR; rnd++) {
      var af = fur(A), bf = fur(B);
      var aFirst = rng() < clamp(0.5 + 1.5 * (af - bf) / Math.max(1, af + bf), 0.2, 0.8);
      emit({ kind: 'round', rd: log ? (a.loadout || []).map(function (id) { return A.ready[id]; }) : null });
      var order = aFirst ? [A, B] : [B, A];
      for (var o = 0; o < 2; o++) {
        if (A.hp <= 0 || B.hp <= 0) break;
        turn(order[o], order[o] === A ? B : A);
      }
      if (A.hp <= 0 || B.hp <= 0) break;
    }
    var rounds = Math.min(rnd, maxR), win, timeout = false;
    var tie = false;
    if (A.hp > 0 && B.hp > 0) {
      timeout = true; var pa = A.hp / a.maxHp, pb = B.hp / b.maxHp;
      // egyenlő életerőnél a több bevitt sebzés dönt (nem a véletlen és nem automatikusan a védekező fél)
      if (Math.abs(pa - pb) < 1e-9) { tie = true; win = dmgDealt >= dmgTaken; } else win = pa > pb;
    }
    else win = A.hp > 0;
    return { win: win, rounds: rounds, timeout: timeout, tie: tie, hpLeft: Math.max(0, A.hp), hpPct: Math.max(0, A.hp) / a.maxHp,
             monHpPct: Math.max(0, B.hp) / b.maxHp, dmgDealt: dmgDealt, dmgTaken: dmgTaken, dodged: dodged, crits: crits,
             log: log, seed: seed, duel: true };
  }
  function duelChance(a, b, tacA, tacB, n, seed) {
    var rng = mulberry32(seed || 777), w = 0; n = n || 200;
    for (var i = 0; i < n; i++) if (simulateDuel(a, b, tacA, tacB, newSeed(rng), false).win) w++;
    return w / n;
  }

  function winChance(hero, mon, tacticId, n, seed) {
    var rng = mulberry32(seed || 12345), w = 0;
    for (var i = 0; i < n; i++) if (simulateFight(hero, mon, tacticId, newSeed(rng), false).win) w++;
    return w / n;
  }

  // Az a szörnyszint, amelynél a győzelmi esély a célértékhez esik (bináris keresés, közös véletlenmagokkal)
  function findMonsterLevel(heroF, tacticId, target, opts) {
    opts = opts || {};
    var lo = opts.min != null ? opts.min : 0.3, hi = opts.max != null ? opts.max : heroF.level + 35;
    var n = opts.n || 200, seed = opts.seed || 777;
    function chanceAt(lm) { return winChance(heroF, monsterFighter(lm, { power: opts.power }), tacticId, n, seed); }
    if (chanceAt(lo) < target) return lo;
    // nagyon erős hősnél a felső határ tovább tolódik, amíg az esély a cél alá nem esik
    for (var ext = 0; ext < 4 && chanceAt(hi) > target; ext++) { lo = hi; hi += 15; }
    if (chanceAt(hi) > target) return hi;
    for (var i = 0; i < 12; i++) {
      var mid = (lo + hi) / 2;
      if (chanceAt(mid) > target) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function regionFor(Lm, diff) {
    var lv = Math.max(1, Math.round(Lm)), fits = D.REGIONS.filter(function (r) { return lv >= r.min && lv <= r.max; });
    if (!fits.length) return lv < D.REGIONS[0].min ? D.REGIONS[0] : D.REGIONS[D.REGIONS.length - 1];
    if (fits.length > 1 && diff === 'nehez') return fits[fits.length - 1];
    return fits[0];
  }

  // ---------- Expedíció-ajánlatok ----------
  // a hold kockázata a célesélyhez arányos: a Közepesnél teljes, a Nehéznél kisebb (különben a Nehéz Vérhold csapda lenne)
  function offerTarget(d, moon) { return DIFF[d].target - (moon.risk || 0) * DIFF[d].target / DIFF.kozepes.target; }
  function makeOffers(hero, moonId, seed) {
    var rng = mulberry32(seed || newSeed());
    var heroF = fighterFromHero(hero);
    var moon = MOONS[moonId] || MOONS.ujhold;
    var used = {};
    return DIFF_ORDER.map(function (d, idx) {
      // az elit sorsolás független a felszereléstől: a szint és a megtett kalandok száma dönti el (felszerelés-cserével nem lehet „horgászni”)
      var elite = d !== 'konnyu' && hero.level >= ELITE.minLevel && mulberry32(((hero.level * 7919) ^ ((hero.stats && hero.stats.expeditions || 0) * 104729) ^ (idx * 31 + 0x51ed)) >>> 0)() < ELITE.chance;
      var Lm = findMonsterLevel(heroF, hero.tactic, eliteTarget(d, moon, elite), { seed: 1000 + idx, n: 240, power: moon.power });
      var region = regionFor(Lm, d);
      var guards = region.guards.filter(function (g) { return !used[g]; });
      var guard = pick(rng, guards.length ? guards : region.guards); used[guard] = 1;
      var mon = monsterFighter(Lm, { power: moon.power, name: guard });
      var chance = winChance(heroF, mon, hero.tactic, 500, 4242); // rögzített próbaharcok: ugyanarra a helyzetre mindig ugyanazt az esélyt mutatja
      var o = { diff: d, lm: Lm, level: mon.level, region: region.id, guard: guard, moon: moonId || 'ujhold',
               chance: chance, seed: newSeed(rng) };
      if (elite) o.elite = true;
      o.rewards = expeditionRewardsPreview(hero, d, Lm, moonId, elite);
      return o;
    });
  }

  // taktikaváltáskor nem jön új kaland, csak az esélyek számolódnak újra ugyanazokra az őrzőkre
  function offerChance(hero, o) {
    var moon = MOONS[o.moon] || MOONS.ujhold;
    return winChance(fighterFromHero(hero), monsterFighter(o.lm, { power: moon.power, name: o.guard }), hero.tactic, 500, 4242);
  }
  function expeditionRewardsPreview(hero, d, Lm, moonId, elite) {
    var D2 = DIFF[d];
    var mo = offerMoon({ moon: moonId || 'ujhold', elite: elite });
    return { xp: Math.round(xpBase(hero.level) * D2.xp * mo.xp), silver: Math.round(silverBase(Math.max(1, Lm)) * D2.silver * mo.silver), itemChance: D2.itemChance + (elite ? ELITE.item : 0) };
  }

  // ---------- Expedíció menete ----------
  function startExpedition(hero, offer, state) {
    var rng = mulberry32(offer.seed);
    var region = D.REGIONS.filter(function (r) { return r.id === offer.region; })[0];
    var exp = {
      offer: offer, step: 0, clearings: [], blessing: false, hpFactor: 1, bonusXp: 0, loot: [], silver: 0, dust: 0,
      log: [], seed: newSeed(rng), done: false
    };
    var used = {};
    for (var i = 0; i < 3; i++) exp.clearings.push(makeClearing(rng, hero, offer, region, i, used));
    return exp;
  }

  function searchChance(hero) {
    var s = heroStats(hero), sc = scaleFor(hero.level);
    return clamp(0.62 + 0.3 * s.fur / (s.fur + sc * 0.5), 0.62, 0.92);
  }

  // ---------- kalandtartalom (js/content.js bővíti; ha nincs, a régi lista marad) ----------
  // a régi események (a/b) is ugyanabban a formában: options tömb
  function normEvent(ev) {
    if (!ev || ev.options) return ev;
    return { id: ev.id || ev.title, region: 'any', kind: 'esemeny', title: ev.title, text: ev.text, options: [ev.a, ev.b] };
  }
  function advPool(key, regionId, legacy) {
    var A = D.ADVENTURE, out = (legacy || []).slice();
    if (A && A[key]) out = out.concat(A[key].any || [], A[key][regionId] || []);
    return out;
  }
  function eventPool(regionId) {
    var list = D.EVENTS.map(normEvent);
    if (D.ADVENTURE && D.ADVENTURE.events) list = list.concat(D.ADVENTURE.events.filter(function (e) { return !e.follow && (e.region === 'any' || e.region === regionId); }));
    return list;
  }
  // súlyozott választás: az „arany tisztás” ritka; egy kalandon belül nem ismétlődik esemény
  function pickEvent(rng, regionId, used) {
    var last = used.__n >= 2; used.__n = (used.__n || 0) + 1;
    // az utolsó tisztáson nem indulhat lánc (nem lenne hol folytatódnia)
    var pool = eventPool(regionId).filter(function (e) { return !used[e.id || e.title] && !(last && e.options.some(function (o) { return o.setFlag; })); });
    if (!pool.length) pool = eventPool(regionId);
    var tot = 0, w = pool.map(function (e) { var x = e.kind === 'arany' ? 0.12 : 1; tot += x; return x; }), r = rng() * tot;
    for (var i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i]; }
    return pool[pool.length - 1];
  }
  function makeClearing(rng, hero, offer, region, idx, used) {
    used = used || {};
    var ev = pickEvent(rng, region.id, used); used[ev.id || ev.title] = 1;
    var se = pick(rng, advPool('searches', region.id, D.SEARCHES)), mname = pick(rng, region.monsters);
    var cards = [
      { type: 'harc', title: mname, text: 'Könnyebb ellenfél, de tapasztalatot ad.', monster: mname, seed: newSeed(rng) },
      { type: 'kutatas', title: se.title, text: se.text, chance: searchChance(hero), seed: newSeed(rng) },
      { type: 'esemeny', title: ev.title, text: ev.text, event: ev, seed: newSeed(rng) }
    ];
    return { intro: pick(rng, advPool('intros', region.id, D.CLEARING_INTROS)), cards: shuffle(rng, cards) };
  }
  // a láncesemény: ha az előző tisztáson valami elindult, a következő tisztás eseménye annak a folytatása
  function applyFollow(exp) {
    var f = exp.pendingFollow, cl = exp.clearings[exp.step];
    exp.pendingFollow = null;
    if (!f || !cl || !D.ADVENTURE) return;
    var ev = (D.ADVENTURE.events || []).filter(function (e) { return e.follow === f; })[0];
    if (!ev) return;
    cl.cards.forEach(function (c) { if (c.type === 'esemeny') { c.event = ev; c.title = ev.title; c.text = ev.text; } });
  }
  // a választható lehetőségek (a származáshoz vagy jellemhez kötöttek csak annak, akire illik)
  function eventOptions(hero, ev) {
    ev = normEvent(ev);
    return ev.options.map(function (o, i) { return { o: o, i: i }; }).filter(function (x) {
      var n = x.o.needs; if (!n) return true;
      return (n.origin && n.origin === hero.origin) || (n.trait && n.trait === hero.trait);
    });
  }
  function eventCost(lm, o) { return o && o.cost ? Math.round(silverBase(lm) * 0.35 * o.cost) : 0; }
  // próba (pl. fürgeség): az alapesély a jellemzővel nő, de 30% és 92% között marad
  function eventCheckChance(hero, check) {
    var s = heroStats(hero), k = ['tam', 'ved', 'elet'].indexOf(check.stat) >= 0 ? check.stat : 'fur';
    var ref = refBase(hero.level)[k];
    return clamp(check.base - 0.12 + 0.3 * s[k] / (s[k] + ref), 0.3, 0.92);
  }
  function applyEventEffect(hero, exp, rng, eff, amount, out) {
    var lm = exp.offer.lm, m = clamp(amount == null ? 1 : +amount, 0.5, 2);
    if (eff === 'heal' && exp.hpFactor >= 1) { eff = 'xp'; out.healToXp = true; } // teljes életerőnél a pihenő tapasztalatot ad, hogy ne vesszen el
    out.effect = eff;
    if (eff === 'blessing') { exp.blessing = Math.min(20, (exp.blessing === true ? 10 : (+exp.blessing || 0)) + Math.round(10 * m)); out.blessPct = Math.round(10 * m); }
    else if (eff === 'silver') { out.silver = Math.round(silverBase(lm) * 0.5 * m); exp.silver += out.silver; }
    else if (eff === 'dust') { out.dust = Math.round((6 + lm) * 0.8 * m); exp.dust += out.dust; }
    else if (eff === 'heal') { exp.hpFactor = Math.min(1, exp.hpFactor + 0.1 * m); out.healed = true; }
    else if (eff === 'hurt') { exp.hpFactor = Math.max(0.7, exp.hpFactor - 0.06 * m); out.hpLoss = true; }
    else if (eff === 'xp') { out.xp = Math.round(xpBase(hero.level) * 0.08 * m); exp.bonusXp += out.xp; }
    else if (eff === 'item' && exp.torchInfo && exp.torchInfo.tired) { out.effect = 'silver'; out.silver = Math.round(silverBase(lm) * 0.5); exp.silver += out.silver; }
    else if (eff === 'item') {
      var it2 = makeItem(rng, { slot: 'fegyver', rarity: rng() < 0.5 ? 'zold' : 'szurke', level: lootLevel(hero, lm), classId: hero.classId, set: exp.offer.region });
      exp.loot.push(it2); out.item = it2;
    }
  }

  function expeditionMonster(exp, power) {
    var moon = MOONS[exp.offer.moon] || MOONS.ujhold;
    return monsterFighter(exp.offer.lm, { power: (power || 1) * moon.power, name: exp.offer.guard });
  }

  // Egy tisztás-kártya feloldása. Visszaadja az eredményt; az exp állapotát módosítja.
  function resolveCard(hero, exp, card, choice) {
    var rng = mulberry32(card.seed);
    var out = { type: card.type, card: card };
    var lm = exp.offer.lm;
    if (card.type === 'harc') {
      var heroF = fighterFromHero(hero, { hpFactor: 1 });
      var mon = monsterFighter(lm, { power: 0.8 * (MOONS[exp.offer.moon] || MOONS.ujhold).power, name: card.monster });
      var fight = simulateFight(heroF, mon, hero.tactic, card.seed, true);
      out.fight = fight; out.heroF = heroF; out.mon = mon;
      if (fight.win) { out.xp = Math.round(xpBase(hero.level) * 0.08); exp.bonusXp += out.xp; out.silver = Math.round(silverBase(lm) * 0.2); exp.silver += out.silver; }
      else { exp.hpFactor = Math.max(0.7, exp.hpFactor - 0.1); out.hpLoss = true; }
    } else if (card.type === 'kutatas') {
      out.success = rng() < card.chance;
      if (out.success) {
        if (rng() < 0.45 && !(exp.torchInfo && exp.torchInfo.tired)) { // fáradtan nincs tárgy, helyette Holdezüst
          var rarity = rollLoot(rng, exp.offer.diff, hero, { pity: true });
          var it = makeItem(rng, { rarity: rarity, level: lootLevel(hero, lm), classId: hero.classId, hero: hero, set: exp.offer.region });
          exp.loot.push(it); out.item = it;
        } else { out.silver = Math.round(silverBase(lm) * (0.6 + rng() * 0.6)); exp.silver += out.silver; }
      } else { exp.hpFactor = Math.max(0.7, exp.hpFactor - 0.04); out.hpLoss = true; } // a sikertelen kutatás csak kis sérülés (különben csapda lenne)
    } else if (card.type === 'esemeny') {
      var ev = normEvent(card.event), idx = choice === 'a' ? 0 : choice === 'b' ? 1 : +choice;
      var opt = ev.options[idx];
      out.result = opt.result; out.kind = ev.kind || 'esemeny';
      if (opt.check) {
        out.checkChance = eventCheckChance(hero, opt.check);
        out.checkOk = rng() < out.checkChance;
        // a kockázatért több jár: sikernél legalább másfélszeres jutalom, kudarcnál csak kisebb baj
        if (!out.checkOk && opt.fail) { out.result = opt.fail.result; applyEventEffect(hero, exp, rng, opt.fail.effect, (opt.fail.effect === 'hurt' ? 0.5 : 1) * (opt.fail.amount == null ? 1 : opt.fail.amount), out); }
        else applyEventEffect(hero, exp, rng, opt.effect, Math.max(1.5, opt.amount == null ? 1 : opt.amount), out);
      } else applyEventEffect(hero, exp, rng, opt.effect, opt.amount, out);
      if (opt.setFlag) { exp.flags = exp.flags || {}; exp.flags[opt.setFlag] = 1; exp.pendingFollow = opt.setFlag; out.follow = true; }
    }
    exp.step++;
    return out;
  }

  function guardPreview(hero, exp) {
    var heroF = fighterFromHero(hero, { hpFactor: exp.hpFactor, blessing: exp.blessing });
    var mon = expeditionMonster(exp);
    return { heroF: heroF, mon: mon, chance: winChance(heroF, mon, hero.tactic, 500, exp.seed ^ 0x5bd1e995) };
  }

  function fightGuard(hero, exp) {
    var p = guardPreview(hero, exp);
    var fight = simulateFight(p.heroF, p.mon, hero.tactic, exp.seed, true);
    return { fight: fight, heroF: p.heroF, mon: p.mon, chance: p.chance };
  }

  // A tanács vereség után: egy mondat
  function lossAdvice(hero, fight) {
    var c = D.CLASSES[hero.classId];
    if (fight.timeout) return 'Kifutottál az időből. Több sebzés kellene: próbáld a Rohamot, vagy fejleszd a fegyvered.';
    if (hero.tactic === 'roham' && fight.dmgTaken > fight.dmgDealt * 0.9) return 'Túl sok sebzést kaptál. Próbáld a Kitartást, vagy válassz Könnyebb utat.';
    if (hero.tactic === 'kitartas' && fight.monHpPct < 0.25) return 'Nagyon kevés hiányzott! A Roham taktikával talán meglett volna.';
    if (c.tactic !== hero.tactic) return 'A ' + c.name + ' kaszthoz a ' + D.TACTICS[c.tactic].name + ' taktika illik a legjobban. Érdemes kipróbálni.';
    if (fight.monHpPct < 0.2) return 'Hajszálon múlt! Egy kis szerencsével legközelebb meglesz.';
    return 'Ez most erős ellenfél volt. Fejleszd a felszerelésed Csillagporral, vagy válassz Könnyebb utat.';
  }

  // ---------- Jutalmak ----------
  function torchState(save, now) {
    var t = save.torches;
    if (t.count >= TORCH.max) {
      // tele: a túlcsorduló idő Pihent-töltéssé válik
      var extra = Math.floor((now - t.last) / TORCH.regenMs);
      if (extra > 0) { t.rested = Math.min(TORCH.restedMax, t.rested + extra); t.last += extra * TORCH.regenMs; }
    } else {
      var gained = Math.floor((now - t.last) / TORCH.regenMs);
      if (gained > 0) {
        var toFull = TORCH.max - t.count;
        if (gained >= toFull) {
          t.count = TORCH.max; t.last += toFull * TORCH.regenMs;
          var over = Math.floor((now - t.last) / TORCH.regenMs);
          if (over > 0) { t.rested = Math.min(TORCH.restedMax, t.rested + over); t.last += over * TORCH.regenMs; }
        } else { t.count += gained; t.last += gained * TORCH.regenMs; }
      }
    }
    if (t.count >= TORCH.max) t.nextIn = TORCH.regenMs - ((now - t.last) % TORCH.regenMs);
    else t.nextIn = TORCH.regenMs - (now - t.last);
    return t;
  }

  function spendTorch(save, now) {
    var t = torchState(save, now), info = { tired: false, rested: false, xpMult: 1 };
    if (t.count > 0) {
      if (t.count === TORCH.max) t.last = now; // tele volt: innentől indul az óra
      t.count--;
      if (t.rested > 0) { t.rested--; info.rested = true; info.xpMult = 2; }
      save.tiredToday = 0;
    } else {
      info.tired = true;
      var n = save.tiredRun || 0;
      info.xpMult = n < 8 ? 0.5 : n < 16 ? 0.25 : 0.1;
      save.tiredRun = n + 1;
    }
    if (!info.tired) save.tiredRun = 0;
    return info;
  }

  // heti Csillagpor-keret: 1000 + 100 × szint, minden hétfőn (budapesti idő) újraindul
  function dustCap(level) { return 1000 + 100 * Math.max(1, level || 1); }
  function weekOf(t) {
    var d = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest' }).format(new Date(t)), x = new Date(d + 'T12:00:00Z');
    return new Date(x.getTime() - ((x.getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10);
  }
  function dustWeek(save, now) { var wk = weekOf(now); if (save.dustWeek !== wk) { save.dustWeek = wk; save.dustWeekEarned = 0; } return wk; }
  function dustRoom(save, now) { dustWeek(save, now); return Math.max(0, dustCap(save.hero ? save.hero.level : 1) - (save.dustWeekEarned || 0)); }
  function addDust(save, hero, amount, now) {
    var room = dustRoom(save, now), got = Math.min(room, Math.max(0, Math.round(amount)));
    hero.dust += got; save.dustEarned = (save.dustEarned || 0) + got; save.dustWeekEarned = (save.dustWeekEarned || 0) + got;
    return got;
  }

  function addXp(hero, amount) {
    var ups = [];
    hero.xp += Math.round(amount);
    while (hero.level < MAX_LEVEL && hero.xp >= xpNeeded(hero.level)) {
      hero.xp -= xpNeeded(hero.level); hero.level++;
      var c = D.CLASSES[hero.classId], idx = D.SKILL_LEVELS.indexOf(hero.level), sk = idx >= 0 ? c.skills[idx] : null;
      if (sk && hero.loadout.indexOf(sk) < 0) hero.loadout.push(sk);
      ups.push({ level: hero.level, skill: sk });
    }
    if (hero.level >= MAX_LEVEL) hero.xp = Math.min(hero.xp, xpNeeded(MAX_LEVEL));
    return ups;
  }

  // Az őrző-harc utáni jutalmak kiszámítása (a választás még a játékosé)
  function finishExpedition(save, hero, exp, guardFight, torchInfo, now) {
    var rng = mulberry32(exp.seed ^ 0x9e3779b9);
    var d = exp.offer.diff, D2 = DIFF[d], lm = exp.offer.lm, moon = offerMoon(exp.offer), itemChance = D2.itemChance + (exp.offer.elite ? ELITE.item : 0);
    var win = guardFight.fight.win;
    var res = { win: win, diff: d, xp: 0, silver: exp.silver, dust: 0, items: torchInfo.tired ? [] : exp.loot.slice(), choices: [], levelUps: [], mythic: null,
                xpMult: torchInfo.xpMult, rested: torchInfo.rested, tired: torchInfo.tired };
    var baseXp = xpBase(hero.level) * D2.xp * (moon.xp || 1);
    var xp = (win ? baseXp : baseXp * 0.5) + exp.bonusXp;
    res.xp = Math.round(xp * torchInfo.xpMult);
    hero.stats.expeditions++;
    if (win) {
      hero.stats.wins++;
      res.silver += Math.round(silverBase(lm) * D2.silver * (moon.silver || 1));
      res.dust = Math.round((8 + 1.5 * lm) * D2.dust * moon.dust);
      // zsákmány: 3 választás
      var itemLv = lootLevel(hero, lm);
      var choices = [];
      if (!torchInfo.tired && rng() < itemChance) { // fáradtan (fáklya nélkül) nincs tárgy
        var rarity = rollLoot(rng, d, hero, { pity: true });
        choices.push({ kind: 'item', item: makeItem(rng, { rarity: rarity, level: itemLv, classId: hero.classId, hero: hero, set: exp.offer.region }) });
        if (rng() < 0.35) {
          var r2 = rollLoot(rng, d, hero, { pity: true });
          choices.push({ kind: 'item', item: makeItem(rng, { rarity: r2, level: itemLv, classId: hero.classId, hero: hero, set: exp.offer.region }) });
        }
      }
      choices.push({ kind: 'silver', amount: Math.round(silverBase(lm) * D2.silver * 1.5 * (moon.silver || 1)) });
      if (choices.length < 3) choices.push({ kind: 'dust', amount: Math.round((8 + 1.5 * lm) * D2.dust * moon.dust * 2) });
      if (choices.length < 3) choices.push({ kind: 'xp', amount: Math.round(baseXp * 0.35 * torchInfo.xpMult) });
      res.choices = choices.slice(0, 3);
      // mitikus kinézet: csak Nehéz győzelemnél
      if (d === 'nehez' && hero.level >= RARITY_GATE.legendas) { // a mitikus tárgy legendás erejű, ezért ugyanaz a kapu
        var ch = mythicChance(hero.mythicTries) * moon.mythic * (torchInfo.tired ? 0.25 : 1);
        if (rng() < ch) {
          hero.mythicTries = 0; hero.stats.mythics++;
          var mi = Math.floor(rng() * D.MYTHIC_NAMES.length);
          res.mythic = makeItem(rng, { rarity: 'legendas', line: 'Egyedi ragyogású tárgy: kevés hős látott még ilyet.', level: itemLv, classId: hero.classId, mythic: true, name: D.MYTHIC_NAMES[mi], slot: D.MYTHIC_SLOTS[mi], set: exp.offer.region });
        } else hero.mythicTries++;
      }
      if (d === 'nehez') hero.stats.bestWinNehez = Math.max(hero.stats.bestWinNehez, Math.round(lm));
    } else {
      hero.stats.losses++;
      res.advice = lossAdvice(hero, guardFight.fight);
    }
    // fáradtan a Holdezüst is ugyanúgy csökken, mint a tapasztalat
    if (torchInfo.tired) {
      res.silver = Math.round(res.silver * torchInfo.xpMult);
      res.choices = res.choices.filter(function (c) { return c.kind !== 'item'; }).map(function (c) { if (c.kind === 'silver' || c.kind === 'dust') c.amount = Math.round(c.amount * torchInfo.xpMult); return c; });
    }
    hero.silver += res.silver;
    res.dust = addDust(save, hero, Math.round((res.dust + exp.dust) * (torchInfo.tired ? torchInfo.xpMult : 1)), now);
    res.levelUps = addXp(hero, res.xp);
    return res;
  }

  function applyChoice(save, hero, choice, now) {
    if (!choice) return null;
    if (choice.kind === 'item') return addItem(save, hero, choice.item, now);
    if (choice.kind === 'silver') { hero.silver += choice.amount; return { silver: choice.amount }; }
    if (choice.kind === 'dust') return { dust: addDust(save, hero, choice.amount, now) };
    if (choice.kind === 'xp') return { levelUps: addXp(hero, choice.amount), xp: choice.amount };
  }

  // Tárgy a táskába; ha be van kapcsolva, a gyengébb szürke/zöld tárgyat azonnal szétszedi
  function addItem(save, hero, item, now) {
    if (save.settings && save.settings.autoSalvage && !item.mythic && (item.rarity === 'szurke' || item.rarity === 'zold') && !isUpgrade(hero, item)) {
      return { salvaged: item, dust: addDust(save, hero, salvageValue(item), now) };
    }
    if (hero.inventory.length >= INVENTORY_MAX) {
      var rf = refundValue(item); hero.dust += rf;
      return { salvaged: item, dust: addDust(save, hero, salvageValue(item), now) + rf, full: true };
    }
    hero.inventory.push(item);
    return { added: item };
  }

  function powerDelta(hero, item) {
    var before = powerRaw(heroStats(hero));
    var eq = {}; D.SLOT_ORDER.forEach(function (s) { eq[s] = hero.equipped[s]; });
    eq[item.slot] = item;
    return powerRaw(heroStats(hero, eq)) - before;
  }
  // a legnagyobb harcerejű összeállítás a felvett és a táskában lévő tárgyakból: az egész összeállítást értékeli
  // (helyenként próbál cserét, amíg javul), így a tárgyak közti kölcsönhatás is számít
  function bestGear(hero) {
    var eq = {}; D.SLOT_ORDER.forEach(function (s) { eq[s] = hero.equipped[s] || null; });
    var score = function () { return powerRaw(heroStats(hero, eq)); }, cur = score(), start = cur;
    for (var pass = 0; pass < 4; pass++) {
      var improved = false;
      D.SLOT_ORDER.forEach(function (s) {
        var cands = hero.inventory.filter(function (i) { return i.slot === s; }).concat(hero.equipped[s] ? [hero.equipped[s]] : []);
        cands.forEach(function (it) { var keep = eq[s]; eq[s] = it; var v = score(); if (v > cur + 0.05) { cur = v; improved = true; } else eq[s] = keep; });
      });
      if (!improved) break;
    }
    var changes = D.SLOT_ORDER.filter(function (s) { return eq[s] && eq[s] !== hero.equipped[s]; }).map(function (s) { return { slot: s, to: eq[s], from: hero.equipped[s] || null }; });
    return { changes: changes, before: start, after: cur };
  }
  function isUpgrade(hero, item) { return powerDelta(hero, item) > 0.05; }

  function equip(hero, itemId) {
    var idx = -1;
    for (var i = 0; i < hero.inventory.length; i++) if (hero.inventory[i].id === itemId) idx = i;
    if (idx < 0) return false;
    var it = hero.inventory[idx], old = hero.equipped[it.slot];
    hero.inventory.splice(idx, 1);
    hero.equipped[it.slot] = it;
    if (old) hero.inventory.push(old);
    return true;
  }

  function salvage(save, hero, itemId, now) {
    for (var i = 0; i < hero.inventory.length; i++) if (hero.inventory[i].id === itemId) {
      var it = hero.inventory.splice(i, 1)[0], rf = refundValue(it);
      hero.dust += rf; // a fejlesztés visszatérítése nem számít bele a heti keretbe
      return addDust(save, hero, salvageValue(it), now) + rf;
    }
    return 0;
  }
  function sell(hero, itemId) {
    for (var i = 0; i < hero.inventory.length; i++) if (hero.inventory[i].id === itemId) {
      var it = hero.inventory.splice(i, 1)[0], v = sellValue(it);
      hero.silver += v; hero.dust += refundValue(it); return v;
    }
    return 0;
  }

  function findItem(hero, itemId) {
    for (var s in hero.equipped) if (hero.equipped[s] && hero.equipped[s].id === itemId) return hero.equipped[s];
    for (var i = 0; i < hero.inventory.length; i++) if (hero.inventory[i].id === itemId) return hero.inventory[i];
    return null;
  }

  function upgrade(hero, itemId) {
    var it = findItem(hero, itemId);
    if (!it) return { ok: false, reason: 'nincs' };
    var cost = upgradeCost(it), sc = upgradeSilver(it);
    if (cost == null) return { ok: false, reason: 'max' };
    if (hero.dust < cost) return { ok: false, reason: 'kevés', cost: cost };
    if (hero.silver < sc) return { ok: false, reason: 'ezüst', cost: sc };
    hero.dust -= cost; hero.silver -= sc; it.spent = (it.spent || 0) + cost; it.plus = (it.plus || 0) + 1;
    return { ok: true, cost: cost, silver: sc, plus: it.plus, max: it.plus >= maxPlus(it) };
  }


  // Tárgyjellemző újrasorsolása Holdezüstért: 100 × tárgyszint, minden újabb alkalom +50%
  function rerollCost(item) { return Math.round(100 * item.level * Math.pow(1.5, item.rerolls || 0)); }
  function reroll(hero, itemId, rng) {
    var it = findItem(hero, itemId);
    if (!it || !it.affixes.length) return { ok: false, reason: 'nincs' };
    var cost = rerollCost(it);
    if (hero.silver < cost) return { ok: false, reason: 'kevés', cost: cost };
    rng = rng || mulberry32(newSeed());
    hero.silver -= cost; it.rerolls = (it.rerolls || 0) + 1;
    var pool = shuffle(rng, D.AFFIXES);
    it.affixes = it.affixes.map(function (_, i) { return rollAffix(rng, pool[i], it.rarity); });
    return { ok: true, cost: cost };
  }


  // ---------- Heti világboss ----------
  // Egy ütés: 3 körös harc a boss ellen; a kiosztott sebzés számít.
  function bossFighter(level, opts) {
    opts = opts || {};
    var m = monsterFighter(level, { power: 1.15 * (opts.rage ? 1.2 : 1), name: opts.name || 'Heti szörny' });
    m.maxHp = m.hpStart = 1e12;
    return m;
  }
  function bossHit(heroF, bossF, tacticId, seed, opts) {
    opts = opts || {};
    var f = simulateFight(heroF, bossF, tacticId, seed, !!opts.log, { maxRounds: 3 });
    var mult = (opts.weakness && opts.weakness === tacticId ? 1.3 : 1) * (1 + (opts.bonusPct || 0) / 100);
    var k = COMBAT.boss * mult;
    f.damage = Math.round(f.dmgDealt * k);
    // a lejátszás számlálója is ugyanazt mutassa, mint a végeredmény
    if (f.log) f.log.forEach(function (e) {
      if (e.mhp != null) e.mhp = 1e12 - (1e12 - e.mhp) * k;
      if (e.dmg != null && e.who !== 'm') e.dmg = Math.round(e.dmg * k);
    });
    f.weak = mult > 1.0001 && opts.weakness === tacticId;
    return f;
  }
  // Átlagos ütés a medián szinten, átlagos (szürke, azonos szintű) felszereléssel, mind a 8 kaszttal
  function averageBossHit(level, n) {
    n = n || 60;
    var total = 0, count = 0, rng = mulberry32(4242 + level);
    D.CLASS_ORDER.forEach(function (cid) {
      var h = newHero({ name: 'Ref', classId: cid, people: 'ember', seed: 99 });
      h.level = level; h.loadout = unlockedSkills(h).slice(1);
      D.SLOT_ORDER.forEach(function (s) { h.equipped[s].level = level; });
      var hf = fighterFromHero(h), bf = bossFighter(level + 2);
      for (var i = 0; i < n; i++) { total += bossHit(hf, bf, D.CLASSES[cid].tactic, newSeed(rng)).damage; count++; }
    });
    return total / count;
  }

  function newSave(hero, now) {
    return {
      version: 1, hero: hero, createdAt: now, seasonStart: now, dustEarned: 0,
      torches: { count: TORCH.max, rested: 8, last: now }, tiredRun: 0,
      settings: { autoSalvage: false, speed: 1, owl: true, moon: 'ujhold' },
      seenTips: {}, chronicle: [], offers: null, offersKey: null, expedition: null
    };
  }

  root.NYX.engine = {
    bossFighter: bossFighter, bossHit: bossHit, averageBossHit: averageBossHit,
    mulberry32: mulberry32, newSeed: newSeed, setForLevel: setForLevel, pick: pick, shuffle: shuffle, clamp: clamp,
    MAX_ROUNDS: MAX_ROUNDS, MAX_LEVEL: MAX_LEVEL, DIFF: DIFF, DIFF_ORDER: DIFF_ORDER, MOONS: MOONS, MOON_ORDER: MOON_ORDER,
    TORCH: TORCH, DUST_WEEKLY: DUST_WEEKLY, PITY_PURPLE: PITY_PURPLE, PITY_LEGEND: PITY_LEGEND, MAX_PLUS: MAX_PLUS, REFUND: REFUND, maxPlus: maxPlus, refundValue: refundValue, upgradeSilver: upgradeSilver, legendChance: legendChance, RARITY_GATE: RARITY_GATE, gateRarity: gateRarity, rollLoot: rollLoot, lilaChance: lilaChance, INVENTORY_MAX: INVENTORY_MAX,
    refBase: refBase, xpNeeded: xpNeeded, xpBase: xpBase, silverBase: silverBase,
    itemStats: itemStats, makeItem: makeItem, affixText: affixText, salvageValue: salvageValue, sellValue: sellValue, upgradeCost: upgradeCost,
    newHero: newHero, unlockedSkills: unlockedSkills, nextSkillUnlock: nextSkillUnlock, heroStats: heroStats, power: power, powerRaw: powerRaw, lootLevel: lootLevel,
    fighterFromHero: fighterFromHero, monsterFighter: monsterFighter, simulateFight: simulateFight, simulateDuel: simulateDuel, duelChance: duelChance, PVP: PVP, winChance: winChance,
    findMonsterLevel: findMonsterLevel, COMBAT: COMBAT, regionFor: regionFor, makeOffers: makeOffers, offerTarget: offerTarget, ELITE: ELITE, offerMoon: offerMoon, eliteTarget: eliteTarget, normEvent: normEvent, eventOptions: eventOptions, eventCost: eventCost, eventCheckChance: eventCheckChance, applyFollow: applyFollow, offerChance: offerChance,
    startExpedition: startExpedition, resolveCard: resolveCard, guardPreview: guardPreview, fightGuard: fightGuard,
    finishExpedition: finishExpedition, applyChoice: applyChoice, lossAdvice: lossAdvice,
    torchState: torchState, spendTorch: spendTorch, dustRoom: dustRoom, dustCap: dustCap, weekOf: weekOf, addDust: addDust, addXp: addXp,
    addItem: addItem, powerDelta: powerDelta, bestGear: bestGear, isUpgrade: isUpgrade, equip: equip, salvage: salvage, sell: sell, upgrade: upgrade,
    findItem: findItem, rerollCost: rerollCost, reroll: reroll, searchChance: searchChance, mythicChance: mythicChance, newSave: newSave
  };
})(typeof window !== 'undefined' ? window : globalThis);
