/* Nyxoria – új, egyszemélyes funkciók: napi ajándék, vándorkereskedő, Holdtorony, heti esemény, eredmények + gyűjtőalbum.
   A szerveren is fut (tools/build-server.js a game.js után fűzi be), ezért minden szabály és véletlen itt dől el.
   Minden új adat a mentés saját mezőjében él (gift, shop, tower, event, ach, album); régi mentésnél üresen indul. */
(function (root) {
  'use strict';
  const D = root.NYX.data, E = root.NYX.engine, G = root.NYX.game, A = G.actions;
  const DAY = 24 * 3600 * 1000;
  function fail(code, msg) { const e = new Error(msg); e.code = code; throw e; }
  const day = t => G.budapestDate(t);
  // a hét kulcsa: annak a hétfőnek a dátuma (budapesti idő szerint), amelyikkel a hét kezdődik
  function weekKey(t) {
    const d = new Date(day(t) + 'T12:00:00Z'), wd = (d.getUTCDay() + 6) % 7;
    return new Date(d.getTime() - wd * DAY).toISOString().slice(0, 10);
  }
  function weekEnds(t) { return Date.parse(weekKey(t) + 'T00:00:00Z') + 7 * DAY; } // közelítő (UTC éjfél); csak kijelzésre
  const stats = h => { h.stats = h.stats || {}; return h.stats; };
  const bump = (h, k, n) => { const s = stats(h); s[k] = (s[k] || 0) + (n == null ? 1 : n); };
  function giveItem(save, ctx, rng, rarity, how, extra) {
    const h = save.hero, it = E.makeItem(rng, Object.assign({ rarity: rarity, level: h.level, classId: h.classId, hero: h }, extra || {}));
    const r = E.addItem(save, h, it, ctx.now);
    G.itemEvent(save, it, ctx, how);
    return { item: it, salvaged: !!(r && r.salvaged), dust: r && r.dust };
  }

  // ===================== Napi ajándék =====================
  // 7 napos sor: ha kimarad egy nap, elölről kezdődik; a 7. nap után újra az 1. jön.
  const GIFT = [
    { k: 'silver', m: 3 }, { k: 'dust', m: 1 }, { k: 'xp', m: 1.5 }, { k: 'item', r: 'zold' },
    { k: 'silver+dust', m: 5 }, { k: 'item', r: 'kek' }, { k: 'item+silver', r: 'lila', m: 8 }
  ];
  function giftState(save, now) {
    // tegnap = a mai budapesti dátum előtti nap (óraátállításkor is helyes)
    const g = save.gift || { day: null, streak: 0 }, today = day(now), yest = new Date(Date.parse(today + 'T12:00:00Z') - DAY).toISOString().slice(0, 10);
    const can = g.day !== today;
    const next = !can ? g.streak : (g.day === yest ? g.streak % 7 + 1 : 1);
    return { can: can, streak: g.streak || 0, next: next, today: today };
  }
  function giftPreview(h, n) {
    const L = h.level, g = GIFT[n - 1], out = {};
    if (g.k.indexOf('silver') >= 0) out.silver = Math.round(E.silverBase(L) * g.m);
    if (g.k.indexOf('dust') >= 0) out.dust = Math.round(20 + 3 * L) * (g.k === 'dust' ? 1 : 1.5) | 0;
    if (g.k === 'xp') out.xp = Math.round(E.xpBase(L) * g.m);
    if (g.k.indexOf('item') >= 0) { out.item = E.gateRarity(g.r === 'lila' ? 'kek' : g.r, L); if (g.r === 'lila') out.orBetter = true; } // a 7. nap: legalább kék, szerencsével lila
    return out;
  }
  A.gift = (save, a, ctx) => {
    const st = giftState(save, ctx.now), h = save.hero;
    if (!st.can) fail('state', 'A mai ajándékot már elvitted. Holnap jön a következő.');
    const pv = giftPreview(h, st.next), out = { day: st.next };
    const rng = E.mulberry32(E.newSeed());
    if (pv.silver) { h.silver += pv.silver; out.silver = pv.silver; }
    if (pv.dust) { h.dust += pv.dust; out.dust = pv.dust; } // az ajándék nem számít bele a heti Csillagpor-plafonba
    if (pv.xp) { out.xp = pv.xp; out.levelUps = E.addXp(h, pv.xp); G.levelEvents(save, out.levelUps, ctx); }
    if (pv.item) { const r = giveItem(save, ctx, rng, pv.orBetter ? E.rollLoot(rng, 'nehez', h, { floor: 'kek' }) : pv.item, 'napi ajándék'); out.item = r.item; out.salvaged = r.salvaged; }
    save.gift = { day: st.today, streak: st.next };
    bump(h, 'gifts');
    return out;
  };

  // ===================== Vándorkereskedő =====================
  // Naponta 4 új áru, a hős szintjéhez és kasztjához; mindegyikből egy darab.
  const SHOP_PRICE = { zold: 6, kek: 14, lila: 34 }; // × a szinthez tartozó alap-Holdezüst (egy kalandnyi)
  function refreshShop(save, now) {
    const today = day(now);
    if (save.shop && save.shop.day === today) return;
    const h = save.hero, rng = E.mulberry32(E.newSeed()), slots = E.shuffle(rng, D.SLOT_ORDER.slice());
    const items = [0, 1, 2, 3].map(i => {
      const x = rng(), rar = E.gateRarity(i === 3 && h.level >= E.RARITY_GATE.lila && x < 0.03 ? 'lila' : x < 0.55 ? 'zold' : 'kek', h.level);
      const it = E.makeItem(rng, { slot: slots[i], rarity: rar, level: h.level, classId: h.classId });
      return { item: it, price: Math.round(E.silverBase(h.level) * SHOP_PRICE[rar]), sold: false };
    });
    save.shop = { day: today, items: items };
  }
  A.shopOpen = (save, a, ctx) => { refreshShop(save, ctx.now); };
  // újrapakolás Holdezüstért (naponta legfeljebb 3×): értelmes költési lehetőség a felgyűlt ezüstnek
  const SHOP_REROLLS = 3, shopRerollCost = h => Math.round(E.silverBase(h.level) * 3);
  A.shopReroll = (save, a, ctx) => {
    refreshShop(save, ctx.now);
    const h = save.hero, n = save.shop.rerolls || 0, cost = shopRerollCost(h);
    if (n >= SHOP_REROLLS) fail('state', 'Ma már nem pakol újra a kereskedő.');
    if (h.silver < cost) fail('state', 'Ehhez nincs elég Holdezüstöd.');
    h.silver -= cost;
    save.shop.day = null; refreshShop(save, ctx.now); save.shop.rerolls = n + 1;
  };
  A.shopBuy = (save, a, ctx) => {
    refreshShop(save, ctx.now);
    const s = save.shop.items[a.i | 0], h = save.hero;
    if (!s) fail('arg', 'Nincs ilyen áru.');
    if (s.sold) fail('state', 'Ezt már megvetted.');
    if (h.silver < s.price) fail('state', 'Ehhez nincs elég Holdezüstöd.');
    if (h.inventory.length >= E.INVENTORY_MAX) fail('state', 'Tele a táskád. Szedj szét vagy adj el valamit.');
    h.silver -= s.price; s.sold = true;
    const it = JSON.parse(JSON.stringify(s.item));
    E.addItem(save, h, it, ctx.now);
    G.itemEvent(save, it, ctx, 'vándorkereskedő');
    bump(h, 'bought');
    return { item: it };
  };

  // ===================== Holdtorony =====================
  // Emeletről emeletre: az n. emelet szörnye (2 + 0,9·n) szintű, egyre erősebb. Hetente (hétfőn) újraindul.
  // Amíg nyersz, mászhatsz tovább; naponta 5 vereség fér bele. Egy emelet első legyőzéséért (az adott héten) jutalom jár; minden 5. emeleten tárgy.
  const TOWER_TRIES = 5;
  function towerState(save, now) {
    const wk = weekKey(now), today = day(now);
    let t = save.tower;
    if (!t || t.week !== wk) t = { week: wk, floor: 0, best: (t && t.best) || 0, day: today, tries: 0 };
    if (t.day !== today) { t.day = today; t.tries = 0; }
    return t;
  }
  function towerMonster(n) {
    const lm = 2 + 0.9 * n, names = D.REGIONS.reduce((a, r) => a.concat(r.monsters), []);
    return E.monsterFighter(lm, { power: 1 + 0.012 * n, name: names[(n * 7) % names.length] });
  }
  function towerRegion(n) { return D.REGIONS[Math.min(D.REGIONS.length - 1, Math.floor((n - 1) / 6) % D.REGIONS.length)].id; }
  // teljes jutalom csak a legjobb eredményed feletti (új) emeletekért; a heti újramászásért negyed annyi, tárgy nélkül
  function towerReward(h, n, best) {
    const fresh = n > (best || 0), k = fresh ? 1 : 0.25;
    return { silver: Math.round(E.silverBase(Math.min(h.level, n + 3)) * (0.4 + n / 30) * k), dust: Math.round((5 + n) * k), item: fresh && n % 5 === 0 ? E.gateRarity(n % 10 === 0 ? (n >= 30 && n <= 50 ? 'legendas' : 'lila') : 'kek', h.level) : null, fresh: fresh };
  }
  const TOWER_MIN_LEVEL = 5;
  A.towerFight = (save, a, ctx) => {
    if (save.hero.level < TOWER_MIN_LEVEL) fail('state', `A Holdtorony ${TOWER_MIN_LEVEL}. szinttől nyílik.`);
    const t = towerState(save, ctx.now), h = save.hero;
    if (t.tries >= TOWER_TRIES) fail('state', 'Mára elfogytak a próbálkozásaid a toronyban. Holnap újra mehetsz.');
    if (t.floor >= 200) fail('state', 'Elérted a torony tetejét.');
    const n = t.floor + 1, mon = towerMonster(n), heroF = E.fighterFromHero(h);
    const f = E.simulateFight(heroF, mon, h.tactic, E.newSeed(), true);
    if (!f.win) t.tries++; // csak a vereség visz el egy próbálkozást
    const out = { floor: n, win: f.win, region: towerRegion(n) };
    if (f.win) {
      t.floor = n; t.best = Math.max(t.best || 0, n);
      const rw = towerReward(h, n, stats(h).towerMax || 0), rng = E.mulberry32(E.newSeed());
      h.silver += rw.silver; out.silver = rw.silver;
      out.dust = E.addDust(save, h, rw.dust, ctx.now);
      if (rw.item) { const r = giveItem(save, ctx, rng, rw.item, `Holdtorony, ${n}. emelet`); out.item = r.item; out.salvaged = r.salvaged; }
      if (n > (stats(h).towerMax || 0)) stats(h).towerMax = n;
      if (n % 5 === 0) G.personal(save, ctx.now, `<b>${G.esc(h.name)}</b> feljutott a Holdtorony ${n}. emeletére.`, 'win');
    }
    save.tower = t;
    return { fight: { log: f.log, win: f.win, timeout: f.timeout, rounds: f.rounds, heroF: heroF, mon: mon }, out: out };
  };

  // gyors mászás: a hősnél jóval gyengébb emeleteket animáció nélkül, egymás után vívja meg (vereségnél vagy a határnál megáll)
  function rushLimit(h) { return Math.floor((h.level - 6) / 0.9); } // eddig az emeletig (2 + 0,9·n ≤ szint − 4)
  A.towerRush = (save, a, ctx) => {
    if (save.hero.level < TOWER_MIN_LEVEL) fail('state', `A Holdtorony ${TOWER_MIN_LEVEL}. szinttől nyílik.`);
    const t = towerState(save, ctx.now), h = save.hero, lim = rushLimit(h), heroF = E.fighterFromHero(h);
    if (t.floor >= lim) fail('state', 'Innen már csak rendes harccal mehetsz tovább.');
    if (t.tries >= TOWER_TRIES) fail('state', 'Mára elfogytak a próbálkozásaid a toronyban.');
    const out = { from: t.floor, silver: 0, dust: 0, items: [], lost: false };
    while (t.floor < lim) {
      const n = t.floor + 1, f = E.simulateFight(heroF, towerMonster(n), h.tactic, E.newSeed(), false);
      if (!f.win) { t.tries++; out.lost = n; break; }
      t.floor = n;
      const rw = towerReward(h, n, stats(h).towerMax || 0);
      h.silver += rw.silver; out.silver += rw.silver; out.dust += E.addDust(save, h, rw.dust, ctx.now);
      if (rw.item) out.items.push(giveItem(save, ctx, E.mulberry32(E.newSeed()), rw.item, `Holdtorony, ${n}. emelet`).item);
    }
    t.best = Math.max(t.best || 0, t.floor); if (t.floor > (stats(h).towerMax || 0)) stats(h).towerMax = t.floor;
    out.to = t.floor; save.tower = t;
    return out;
  };

  // ===================== Heti esemény =====================
  // Minden héten más esemény, saját szörnnyel. Naponta 3 harc; győzelem 10 pont, vereség 3.
  // A pontokért járó jutalmak közül a legfelső tárgy csak az adott esemény hetében szerezhető meg.
  const EVENTS = [
    { id: 'verhold', name: 'Vérhold-vadászat', monster: 'Vérholdas fenevad', region: 'ejkatlan', prize: { name: 'Vérhold-agyar', slot: 'amulett' },
      line: 'Vörösen kel a hold, és vele ébred a fenevad. Aki sokszor szembeszáll vele, megkapja az agyarát.' },
    { id: 'kodkiraly', name: 'A Ködkirály udvara', monster: 'A Ködkirály lovagja', region: 'kodlap', prize: { name: 'Ködkirály-sisak', slot: 'sisak' },
      line: 'A lápból lovagok lépnek elő. A legkitartóbbak a Ködkirály sisakját nyerhetik el.' },
    { id: 'csillageso', name: 'Csillageső', monster: 'Hulló csillagszellem', region: 'szirtek', prize: { name: 'Csillageső-gyűrű', slot: 'gyuru' },
      line: 'Csillagok hullanak a szirtekre, és mindegyikben szellem lakik. Gyűjtsd a fényüket!' },
    { id: 'arnyvasar', name: 'Árnyvásár', monster: 'Árnyvásári csempész', region: 'arnyromok', prize: { name: 'Árnyvásári köpeny', slot: 'pancel' },
      line: 'A romok között éjjel vásár nyílik. A csempészek nem adják ingyen az áruikat.' }
  ];
  // várhatóan napi ~21 pont (3 harc, 60% esély): a díj kb. 5 nap alatt jön össze, így egy kihagyott nap belefér
  // a díj szerdai kezdéssel is elérhető (napi ~19 pont × 5 nap)
  const EVENT_TIERS = [{ p: 20, k: 'silver', m: 6 }, { p: 45, k: 'dust', n: 120 }, { p: 70, k: 'item', r: 'kek' }, { p: 90, k: 'prize' }];
  const EVENT_TRIES = 3;
  function currentEvent(now) {
    const wk = weekKey(now), idx = Math.floor(Date.parse(wk + 'T00:00:00Z') / (7 * DAY)) % EVENTS.length;
    const wd = (new Date(day(now) + 'T12:00:00Z').getUTCDay() + 6) % 7; // hétfő = 0
    return Object.assign({ week: wk, ends: weekEnds(now), daysLeft: 7 - wd }, EVENTS[(idx + EVENTS.length) % EVENTS.length]);
  }
  function eventState(save, now) {
    const ev = currentEvent(now), today = day(now);
    let s = save.event;
    if (!s || s.week !== ev.week) s = { week: ev.week, id: ev.id, points: 0, claimed: [], day: today, tries: 0, lm: null };
    if (s.day !== today) { s.day = today; s.tries = 0; s.lm = null; }
    return { ev: ev, s: s };
  }
  A.eventFight = (save, a, ctx) => {
    const x = eventState(save, ctx.now), s = x.s, h = save.hero;
    if (s.tries >= EVENT_TRIES) fail('state', 'Mára elfogytak az eseményharcaid. Holnap újra jöhetsz.');
    const heroF = E.fighterFromHero(h);
    s.lm = +E.findMonsterLevel(heroF, h.tactic, 0.6, { n: 120, power: 1.1 }).toFixed(2); // minden harc előtt a mostani felszereléshez: kb. 60% győzelmi esély
    const mon = E.monsterFighter(s.lm, { power: 1.1, name: x.ev.monster });
    const f = E.simulateFight(heroF, mon, h.tactic, E.newSeed(), true);
    s.tries++;
    const pts = f.win ? 10 : 3;
    s.points += pts;
    if (f.win) bump(h, 'eventWins');
    save.event = s;
    return { fight: { log: f.log, win: f.win, timeout: f.timeout, rounds: f.rounds, heroF: heroF, mon: mon }, out: { win: f.win, points: pts, total: s.points, region: x.ev.region } };
  };
  A.eventClaim = (save, a, ctx) => {
    const x = eventState(save, ctx.now), s = x.s, h = save.hero, i = a.i | 0, tier = EVENT_TIERS[i];
    if (!tier) fail('arg', 'Nincs ilyen jutalom.');
    if (s.points < tier.p) fail('state', `Ehhez ${tier.p} pont kell.`);
    if (s.claimed.indexOf(i) >= 0) fail('state', 'Ezt már átvetted.');
    const out = {}, rng = E.mulberry32(E.newSeed());
    if (tier.k === 'silver') { out.silver = Math.round(E.silverBase(h.level) * tier.m); h.silver += out.silver; }
    if (tier.k === 'dust') out.dust = E.addDust(save, h, tier.n, ctx.now);
    if (tier.k === 'item') { const r = giveItem(save, ctx, rng, E.gateRarity(tier.r, h.level), x.ev.name); out.item = r.item; }
    if (tier.k === 'prize') {
      const pr = E.gateRarity('lila', h.level); // a 12. szint alatt ugyanez a tárgy kék változatban
      const r = giveItem(save, ctx, rng, pr, x.ev.name, { slot: x.ev.prize.slot, name: x.ev.prize.name });
      r.item.event = x.ev.id; out.item = r.item;
      G.personal(save, ctx.now, `<b>${G.esc(h.name)}</b> megszerezte az esemény díját: <span class="r-${pr}">${G.esc(x.ev.prize.name)}</span>.`, 'loot');
    }
    s.claimed.push(i); save.event = s;
    return out;
  };

  // ===================== Eredmények és gyűjtőalbum =====================
  // Minden eredménynek fokozatai vannak; minden fokozatért egyszer jár jutalom (Csillagpor + Holdezüst).
  const ACH = [
    { id: 'szint', name: 'Tapasztalt kalandor', unit: 'szint', tiers: [5, 10, 20, 30, 40, 50], v: s => s.hero.level },
    { id: 'gyozelem', name: 'Őrzők réme', unit: 'győzelem', tiers: [5, 25, 100, 250, 500], v: s => s.hero.stats.wins || 0 },
    { id: 'kaland', name: 'Fáradhatatlan', unit: 'kaland', tiers: [10, 50, 150, 400, 1000], v: s => s.hero.stats.expeditions || 0 },
    { id: 'nehez', name: 'A nehezét keresi', unit: 'nehéz győzelem', tiers: [1, 10, 50, 150], v: s => s.hero.stats.hardWins || 0 },
    { id: 'torony', name: 'Toronymászó', unit: 'emelet', tiers: [5, 10, 20, 30, 45], v: s => s.hero.stats.towerMax || 0 },
    { id: 'orjarat', name: 'Éber őrszem', unit: 'őrjárat', tiers: [5, 25, 75, 200], v: s => s.hero.stats.patrols || 0 },
    { id: 'ajandek', name: 'Hűséges vendég', unit: 'ajándék', tiers: [7, 30, 90, 180], v: s => s.hero.stats.gifts || 0 },
    { id: 'kovacs', name: 'Csillagkovács', unit: 'fejlesztés', tiers: [5, 25, 100, 300], v: s => s.hero.stats.upgrades || 0 },
    { id: 'gyujto', name: 'Gyűjtő', unit: 'lap az albumban', tiers: [5, 15, 30, 60, 100], v: s => albumCount(s) },
    { id: 'mitikus', name: 'Legendák nyomában', unit: 'mitikus tárgy', tiers: [1, 3, 5], v: s => s.hero.stats.mythics || 0 },
    // mérföldkövek a legendás tárgyakhoz: a fokozatok címet is adnak, ami a profilon látszik
    { id: 'legendas', name: 'Aranyláz', unit: 'legendás tárgy', tiers: [1, 5, 10, 20], titles: ['Az arany nyomában', 'Aranykezű', 'Legendák gyűjtője', 'Élő legenda'], v: s => s.hero.stats.legendaries || 0 },
    { id: 'aranyszett', name: 'Aranyba öltözve', unit: 'legendás tárgy egyszerre rajtad', tiers: [3, 5], titles: ['Aranyló vándor', 'Aranypáncélos'], v: s => D.SLOT_ORDER.filter(k => s.hero.equipped[k] && s.hero.equipped[k].rarity === 'legendas').length }
  ];
  // a jutalom a fokozattól függ, nem attól, hányas szinten veszed át (nem éri meg gyűjtögetni)
  function achReward(h, t) { return { dust: 25 + 25 * t, silver: Math.round(E.silverBase(5 + 8 * t) * (2 + 2 * t)) }; }
  function albumCount(save) { const a = save.album || {}; return Object.keys(a.mon || {}).length + Object.keys(a.items || {}).length; }
  function achList(save) {
    const cl = save.ach || {};
    return ACH.map(x => {
      const v = x.v(save), got = cl[x.id] || 0, reached = x.tiers.filter(t => v >= t).length;
      return { id: x.id, name: x.name, unit: x.unit, tiers: x.tiers, titles: x.titles || null, value: v, claimed: got, reached: reached, next: x.tiers[got], reward: got < x.tiers.length ? achReward(save.hero, got) : null };
    });
  }
  A.achClaim = (save, a) => {
    const x = achList(save).filter(r => r.id === a.id)[0], h = save.hero;
    if (!x) fail('arg', 'Nincs ilyen eredmény.');
    if (x.claimed >= x.reached) fail('state', 'Ehhez a fokozathoz még nem értél el.');
    const rw = achReward(h, x.claimed);
    h.dust += rw.dust; h.silver += rw.silver;
    save.ach = save.ach || {}; save.ach[x.id] = x.claimed + 1;
    if (x.titles && x.titles[x.claimed]) {
      const t = x.titles[x.claimed]; save.achTitles = (save.achTitles || []).filter(y => y !== t).concat([t]); rw.title = t;
      G.personal(save, Date.now(), `<b>${G.esc(h.name)}</b> új címet kapott: <b>${G.esc(t)}</b>.`, 'legend');
    }
    return rw;
  };
  // a gyűjtőalbum: minden legyőzött őrző és minden kék/lila/mitikus tárgy neve egyszer kerül be
  function albumNote(save) {
    const a = save.album = save.album || { mon: {}, items: {} }, h = save.hero;
    const all = h.inventory.concat(Object.keys(h.equipped).map(k => h.equipped[k]).filter(Boolean));
    all.forEach(it => { if (it.mythic || it.rarity === 'legendas' || it.rarity === 'lila' || it.rarity === 'kek') { if (!a.items[it.name]) a.items[it.name] = { r: it.mythic ? 'mitikus' : it.rarity, slot: it.slot }; } });
  }

  // ===================== Más hősök „szellemei” (Aréna, csapat) =====================
  // A motor a szörnyet egyszerű (képesség nélküli) harcosként kezeli. Egy másik hős ezért úgy áll ki ellened,
  // hogy a TÁM-ját és az ÉLET-ét egy szorzóval igazítjuk: akkora, hogy a hős a saját szellemével szemben 50%-ot érjen el.
  // Így a képességek, a háziállat és a taktika értéke is benne van, és az ellenfél pont olyan erős, mint valójában.
  function ghostFighter(hero) {
    const f = E.fighterFromHero(hero), base = Object.assign({}, f, { side: 'm', lm: f.level });
    const mk = m => Object.assign({}, base, { tam: base.tam * m, maxHp: base.maxHp * m, hpStart: base.hpStart * m });
    let lo = 0.6, hi = 2.6;
    for (let i = 0; i < 10; i++) { const mid = (lo + hi) / 2; if (E.winChance(f, mk(mid), hero.tactic, 240, 3131) > 0.5) lo = mid; else hi = mid; }
    const g = mk((lo + hi) / 2); g.name = hero.name; g.ghostOf = { classId: hero.classId };
    return g;
  }
  const scaleGhost = (g, m) => Object.assign({}, g, { tam: g.tam * m, maxHp: g.maxHp * m, hpStart: g.hpStart * m });
  // gépi ellenfél hangolása: akkorára állítjuk, hogy ellened épp a kívánt esélyed legyen (a kasztok közti különbség így nem számít)
  function tuneFor(myF, tactic, g, target) {
    let lo = 0.3, hi = 3;
    for (let i = 0; i < 9; i++) { const mid = (lo + hi) / 2; if (E.winChance(myF, scaleGhost(g, mid), tactic, 160, 777) > target) lo = mid; else hi = mid; }
    return +((lo + hi) / 2).toFixed(3);
  }
  // gépi ellenfél (gyakorló módban, vagy ha a szerveren nincs elég hasonló hős): a te szintedhez közeli, véletlen kasztú hős
  const BOT_NAMES = ['Árnyék', 'Vándor', 'Holdlovag', 'Ködjáró', 'Csillagvadász', 'Éjfarkas', 'Szürke Bárd', 'Lápi Boszorka', 'Ezüstszem', 'Hamvas', 'Rozsdás Kard', 'Éji Dalnok'];
  const SKINS = ['#f6d7c3', '#e8b896', '#c98e66', '#8a5a3a', '#5a3a28', '#d9def5', '#b8e0c8'], CLOTH = ['#2f6b4f', '#8e2448', '#3a3f9c', '#5a3e2a', '#4a2a7a', '#2a5a7a', '#7a5a2a', '#3a3a4a'];
  // gépi hős véletlen (de érvényes) kinézettel, hogy ne egyformák legyenek
  function botRig(rng, cls) {
    const pk = a => a[Math.floor(rng() * a.length)], rig = {};
    ['sex', 'body', 'face', 'eyeShape', 'brows', 'mouth', 'nose', 'hairBack', 'hairFront'].forEach(k => { rig[k] = pk(D.LOOK_ENUMS[k]); });
    rig.ears = rng() < 0.5 ? 'ember' : pk(D.LOOK_ENUMS.ears); rig.headwear = rng() < 0.6 ? 'nincs' : pk(D.LOOK_ENUMS.headwear);
    rig.hair = pk(D.HAIR_COLORS)[1]; rig.skin = pk(SKINS); rig.c1 = pk(CLOTH); rig.c2 = pk(CLOTH); rig.weapon = Math.floor(rng() * 3);
    return G.cleanRig(rig, cls);
  }
  // a gépi ellenfél felszerelése a tiédhez igazodik (azonos tárgyszint és ritkaság), így az ereje is hasonló
  function gearProfile(h) {
    const items = D.SLOT_ORDER.map(k => h.equipped[k]).filter(Boolean), cnt = {};
    items.forEach(it => { cnt[it.rarity] = (cnt[it.rarity] || 0) + 1; });
    const rar = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0] || 'szurke';
    const lvl = items.length ? Math.round(items.reduce((t, it) => t + it.level, 0) / items.length) : h.level;
    return { rarity: rar, level: Math.max(1, lvl) };
  }
  function botHero(rng, level, rarity, i, used, itemLevel) {
    const cls = D.CLASS_ORDER[Math.floor(rng() * D.CLASS_ORDER.length)];
    let name; do { name = BOT_NAMES[Math.floor(rng() * BOT_NAMES.length)]; } while (used && used.indexOf(name) >= 0 && used.length < BOT_NAMES.length);
    if (used) used.push(name);
    const h = E.newHero({ name: name, classId: cls, people: 'ember' });
    h.rig = botRig(rng, cls);
    h.level = Math.max(1, level); h.loadout = E.unlockedSkills(h).slice(1, 4); // az alaptámadás nem kerül a sorba
    D.SLOT_ORDER.forEach(sl => { h.equipped[sl] = E.makeItem(rng, { slot: sl, rarity: rarity, level: itemLevel || h.level, classId: cls }); });
    h.bot = true;
    return h;
  }
  function snap(hero, uid, rating) {
    return { uid: uid || null, name: hero.name, classId: hero.classId, level: hero.level, power: E.power(E.heroStats(hero)), rating: rating || 1000, rig: hero.equipped && !Array.isArray(hero.equipped) ? G.wornLook(hero) : (hero.rig || null), look: hero.look || null, people: hero.people, bot: !!hero.bot };
  }

  // ===================== Aréna =====================
  // Naponta 5 párbaj. Három ellenfél közül választasz (hasonló erejűek). Pontszám: Élő-rendszer (K = 32), 1000-ről indul.
  const ARENA_FIGHTS = 5;
  function arenaState(save, now) {
    const today = day(now), wk = weekKey(now);
    let s = save.arena || { rating: 1000, wins: 0, losses: 0, day: today, fights: 0, cands: [], week: wk, weekWins: 0 };
    if (s.day !== today) { s.day = today; s.fights = 0; s.cands = []; s.rerolls = 0; }
    if (s.week !== wk) { s.week = wk; s.weekWins = 0; }
    return s;
  }
  A.arenaFind = (save, a, ctx) => {
    const s = arenaState(save, ctx.now), h = save.hero;
    if (s.fights >= ARENA_FIGHTS) fail('state', 'Mára elfogytak a párbajaid. Holnap újra jöhetsz.');
    // új ellenfeleket akkor kérhetsz, ha nincs jelölted, vagy naponta egyszer ingyen cserélhetsz
    if (s.cands && s.cands.length) { if ((s.rerolls || 0) >= 1) fail('state', 'Ma már cseréltél ellenfeleket. Válassz a mostaniak közül.'); s.rerolls = (s.rerolls || 0) + 1; }
    let pool = (ctx.arenaPool || []).slice(0, 3);
    const rng = E.mulberry32(E.newSeed());
    const used = pool.map(c => c.name), myF = E.fighterFromHero(h), TARGET = [0.65, 0.5, 0.35];
    while (pool.length < 3) { // gépi ellenfelek pótolják a hiányt: egy könnyebb, egy kiegyenlített, egy nehezebb
      const i = pool.length, gp = gearProfile(h), b = botHero(rng, h.level + [-1, 0, 1][i], gp.rarity, i, used, gp.level);
      const sn = snap(b, null, 1000); sn.hero = b; sn.target = TARGET[i]; sn.tune = tuneFor(myF, h.tactic, ghostFighter(b), TARGET[i]);
      pool.push(sn);
    }
    // minden jelöltnél kiszámoljuk a győzelmi esélyt és azt, hány pont jár a győzelemért / vész el vereségnél
    pool = pool.map(c => {
      const out = Object.assign({}, c);
      if (c.hero) { const g = ghostFighter(c.hero); out.chance = +E.winChance(myF, c.tune ? scaleGhost(g, c.tune) : g, h.tactic, 200, 2024).toFixed(2); }
      // a gépi ellenfél pontszáma az esélyből adódik (Élő-képlet visszafelé), így a nyerhető pont is igazságos
      // gépi ellenfél: a pontszáma a kitűzött esélyből adódik (Élő-képlet visszafelé), így a tét mindig ehhez az esélyhez illik
      if (c.target) { out.rating = Math.round(s.rating + 400 * Math.log10((1 - c.target) / c.target)); out.power = Math.round(out.power * c.tune); }
      // a tét a két pontszámból jön (Élő-rendszer): idővel mindenki a valódi erejének megfelelő helyre kerül
      const ex = 1 / (1 + Math.pow(10, (out.rating - s.rating) / 400));
      out.gain = Math.round(32 * (1 - ex)); out.loss = Math.round(32 * ex);
      if (c.uid) delete out.hero; // a valódi hős adatait nem tároljuk el, a harc előtt frissen töltjük be
      return out;
    });
    s.cands = pool; save.arena = s;
    return { cands: pool.map(c => Object.assign({}, c, { hero: undefined })) };
  };
  A.arenaFight = (save, a, ctx) => {
    const s = arenaState(save, ctx.now), h = save.hero, c = s.cands[a.i | 0];
    if (s.fights >= ARENA_FIGHTS) fail('state', 'Mára elfogytak a párbajaid.');
    if (!c) fail('state', 'Előbb keress ellenfelet.');
    const opp = c.hero || ctx.arenaOpp;
    if (!opp) fail('state', 'Ez az ellenfél már nem elérhető. Keress újat.');
    const heroF = E.fighterFromHero(h), g0 = ghostFighter(opp);
    // gépi ellenfél: a harc előtt a mostani felszereléshez hangoljuk újra (keresés előtti átöltözéssel nem lehet csalni)
    const tune = c.target ? tuneFor(heroF, h.tactic, g0, c.target) : c.tune;
    const mon = tune ? Object.assign(scaleGhost(g0, tune), { name: g0.name }) : g0;
    const f = E.simulateFight(heroF, mon, h.tactic, E.newSeed(), true);
    const oppRating = c.target ? Math.round(s.rating + 400 * Math.log10((1 - c.target) / c.target)) : c.rating;
    const exp = 1 / (1 + Math.pow(10, (oppRating - s.rating) / 400)), delta = Math.round(32 * ((f.win ? 1 : 0) - exp));
    s.rating = Math.max(100, s.rating + delta); s.fights++;
    if (f.win) { s.wins++; s.weekWins++; } else s.losses++;
    const silver = Math.round(E.silverBase(h.level) * (f.win ? 1 : 0.3)), dust = f.win ? Math.round(6 + h.level / 2) : 0;
    h.silver += silver; const dGot = dust ? E.addDust(save, h, dust, ctx.now) : 0;
    s.cands = []; save.arena = s;
    if (f.win && !c.bot) G.personal(save, ctx.now, `<b>${G.esc(h.name)}</b> legyőzte az arénában: <b>${G.esc(c.name)}</b>.`, 'win');
    return { fight: { log: f.log, win: f.win, timeout: f.timeout, rounds: f.rounds, heroF: heroF, mon: mon }, out: { win: f.win, delta: delta, rating: s.rating, opp: Object.assign({}, c, { hero: undefined }), silver: silver, dust: dGot } };
  };

  // ===================== Csapatküldetések =====================
  // Naponta 3 küldetés. 1–2 társat viszel (más játékosok hősei, vagy gépi társak); a társak minden körben veled ütnek.
  // A szörny a csapat erejéhez igazodik (kb. 60% győzelmi esély), a jutalom bőkezűbb; a valódi társak gazdái is kapnak részt.
  const TEAM_RUNS = 3;
  function teamState(save, now) {
    const today = day(now);
    let s = save.team || { day: today, runs: 0, cands: [] };
    if (s.day !== today) { s.day = today; s.runs = 0; s.cands = []; }
    return s;
  }
  function allyShare(myF, allyHero) { // egy társ ereje a te ütéseidhez mérve (0,25–0,8)
    const a = E.fighterFromHero(allyHero);
    return Math.max(0.25, Math.min(0.8, 0.5 * (a.tam * a.maxHp) / Math.max(1, myF.tam * myF.maxHp) * 1));
  }
  A.teamFind = (save, a, ctx) => {
    const s = teamState(save, ctx.now), h = save.hero;
    if (s.runs >= TEAM_RUNS) fail('state', 'Mára elfogytak a csapatküldetéseid.');
    let pool = (ctx.teamPool || []).slice(0, 4);
    const rng = E.mulberry32(E.newSeed());
    const used = pool.map(c => c.name);
    while (pool.length < 4) { const i = pool.length, gp = gearProfile(h), b = botHero(rng, h.level, gp.rarity, i + 3, used, gp.level); const sn = snap(b, null); sn.hero = b; pool.push(sn); }
    s.cands = pool; save.team = s;
    return { cands: pool.map(c => Object.assign({}, c, { hero: undefined })) };
  };
  A.teamFight = (save, a, ctx) => {
    const s = teamState(save, ctx.now), h = save.hero;
    if (s.runs >= TEAM_RUNS) fail('state', 'Mára elfogytak a csapatküldetéseid.');
    const ids = Array.isArray(a.ids) ? a.ids.map(x => x | 0).filter((x, i, arr) => arr.indexOf(x) === i).slice(0, 2) : [];
    if (!ids.length) fail('arg', 'Válassz legalább egy társat.');
    const allies = ids.map(i => s.cands[i]);
    if (allies.some(x => !x)) fail('state', 'Előbb keress társakat.');
    const heroes = allies.map((c, k) => c.hero || (ctx.teamHeroes && ctx.teamHeroes[k]));
    if (heroes.some(x => !x)) fail('state', 'Az egyik társ már nem elérhető. Keress újakat.');
    const heroF = E.fighterFromHero(h);
    heroF.pet = (heroF.pet || 0) + heroes.reduce((t, x) => t + allyShare(heroF, x), 0);
    const names = allies.map(x => x.name);
    const lm = E.findMonsterLevel(heroF, h.tactic, 0.53, { n: 160, power: 1.25 });
    const reg = E.regionFor(lm, 'nehez') || D.REGIONS[0], region = reg.id;
    const mon = E.monsterFighter(lm, { power: 1.25, name: reg.guards[Math.floor(Math.random() * reg.guards.length)] });
    const f = E.simulateFight(heroF, mon, h.tactic, E.newSeed(), true);
    s.runs++; s.cands = []; save.team = s;
    const out = { win: f.win, allies: allies.map(x => Object.assign({}, x, { hero: undefined })), region: region, xp: 0, silver: 0, dust: 0 };
    if (f.win) {
      const bonus = G.xpBonus(save, ctx);
      out.xp = Math.round(E.xpBase(h.level) * 1.5 * bonus); out.silver = Math.round(E.silverBase(h.level) * 2);
      h.silver += out.silver; out.dust = E.addDust(save, h, Math.round(15 + h.level), ctx.now);
      out.levelUps = E.addXp(h, out.xp); G.levelEvents(save, out.levelUps, ctx);
      const rng = E.mulberry32(E.newSeed());
      if (rng() < 0.6) { const r = giveItem(save, ctx, rng, E.rollLoot(rng, 'kozepes', h, { pity: true, floor: 'kek' }), 'csapatküldetés'); out.item = r.item; out.salvaged = r.salvaged; }
      bump(h, 'teamWins');
      G.personal(save, ctx.now, `<b>${G.esc(h.name)}</b> és ${names.map(n => '<b>' + G.esc(n) + '</b>').join(', ')} legyőzték: ${G.esc(mon.name)}.`, 'win');
    }
    // a valódi társak gazdái is kapnak egy kis részt (a szerver külön írja jóvá nekik)
    out.share = f.win ? allies.filter(x => x.uid).map(x => ({ uid: x.uid, silver: Math.round(E.silverBase(x.level) * 0.5), dust: 8 })) : [];
    return { fight: { log: f.log, win: f.win, timeout: f.timeout, rounds: f.rounds, heroF: heroF, mon: mon, allies: names }, out: out };
  };

  // ===================== Ösvények =====================
  // A 15. szinttől kasztonként három ösvény közül választhatsz; az első választás ingyenes, a későbbi váltás Holdezüstbe kerül.
  const pathCost = h => Math.round(E.silverBase(h.level) * 15);
  A.pathPick = (save, a) => {
    const h = save.hero, list = D.PATHS[h.classId], i = a.i | 0;
    if (h.level < D.PATH_LEVEL) fail('state', `Ösvényt a ${D.PATH_LEVEL}. szinttől választhatsz.`);
    if (!list || !list[i]) fail('arg', 'Nincs ilyen ösvény.');
    if (h.path === i) fail('state', 'Már ezen az ösvényen jársz.');
    const cost = h.path == null ? 0 : pathCost(h);
    if (h.silver < cost) fail('state', 'Az ösvényváltáshoz nincs elég Holdezüstöd.');
    h.silver -= cost; h.path = i;
    G.personal(save, Date.now(), `<b>${G.esc(h.name)}</b> ${G.az(list[i].name)} ${G.esc(list[i].name)} ösvényére lépett.`, 'level');
    return { path: i, cost: cost };
  };

  // ===================== Profil =====================
  // A hős nyilvános adatai: ezt látják mások (a szerveren), és ezt látod te is a saját profilodon.
  function profileOf(save) {
    const h = save.hero, st = h.stats || {}, ach = achList(save);
    return {
      name: h.name, classId: h.classId, people: h.people, level: h.level, rig: h.rig || null, look: h.look || null, worn: G.wornLook(h),
      path: h.path != null && D.PATHS[h.classId] ? D.PATHS[h.classId][h.path].name : null, origin: h.origin, trait: h.trait, motto: h.motto || '',
      power: E.power(E.heroStats(h)), wins: st.wins || 0, expeditions: st.expeditions || 0, mythics: st.mythics || 0, legendaries: st.legendaries || 0, achTitles: (save.achTitles || []).slice(-3),
      towerMax: st.towerMax || 0, arena: save.arena ? save.arena.rating : 1000, arenaWins: save.arena ? save.arena.wins : 0,
      album: albumCount(save), trophies: ach.reduce((t, x) => t + x.claimed, 0), trophyMax: ach.reduce((t, x) => t + x.tiers.length, 0),
      topAch: ach.filter(x => x.claimed > 0).sort((x, y) => y.claimed / y.tiers.length - x.claimed / x.tiers.length).slice(0, 4).map(x => ({ name: x.name, tier: x.claimed, of: x.tiers.length })),
      mythicItems: Object.keys((save.album || {}).items || {}).filter(n => save.album.items[n].r === 'mitikus'),
      equipped: D.SLOT_ORDER.map(k => h.equipped[k]).filter(Boolean).map(it => ({ name: it.name, slot: it.slot, rarity: it.rarity, mythic: !!it.mythic, plus: it.plus || 0 }))
    };
  }

  // ---------- meglévő műveletek kiegészítése (számlálók, album) ----------
  const wrap = (name, after) => { const orig = A[name]; A[name] = (save, a, ctx) => { const r = orig(save, a, ctx); after(save, a, ctx, r); return r; }; };
  wrap('fight', save => {
    const exp = save.expedition, res = save.pendingResult;
    if (exp && res && res.win) {
      save.album = save.album || { mon: {}, items: {} };
      save.album.mon[exp.offer.guard] = exp.offer.region;
      if (exp.offer.diff === 'nehez') bump(save.hero, 'hardWins');
    }
  });
  wrap('patrolClaim', save => bump(save.hero, 'patrols'));

  // ===================== Megbízások (mellékküldetések) és bestiárium =====================
  // Egyszerre 3 megbízás; amit átvettél, annak a helyére másnap jön új. Naponta egyet lemondhatsz (azonnal jön helyette másik).
  // A haladást a meglévő műveletek számolják (a harc, kártya, esemény, torony, aréna után). Minden a mentés quests mezőjében él.
  const QUEST_SLOTS = 3;
  // effort: kb. hány átlagos kalandnyi „plusz figyelmet” kér egy egység; a jutalom ehhez arányos (lásd questReward)
  const QUEST_TYPES = {
    guardWin:   { n: [2, 3], effort: 0.5, min: 1 },
    eliteWin:   { n: [1, 1], effort: 2.0, min: 5 },
    hardWin:    { n: [1, 2], effort: 1.6, min: 5 },
    clearFight: { n: [3, 5], effort: 0.25, min: 1 },
    searchOk:   { n: [2, 3], effort: 0.45, min: 1 },
    shrine:     { n: [1, 1], effort: 2.0, min: 1 },
    vendor:     { n: [1, 1], effort: 2.0, min: 1 },
    riddle:     { n: [1, 1], effort: 2.0, min: 1 },
    towerWin:   { n: [1, 2], effort: 0.5, min: 7 },
    arenaWin:   { n: [2, 2], effort: 0.6, min: 1 }
  };
  const REGION_IN = { kodlap: 'a Ködlápon', holdfeny: 'a Holdfény-erdőben', arnyromok: 'az Árnyromokban', szirtek: 'a Csillaghullás-szirteken', ejkatlan: 'az Éjkatlanban' };
  function questTpls() { return (D.QUESTS && D.QUESTS.templates) || []; }
  // a megbízás tájegysége az, amelyiket a Közepes ajánlat épp kínál (a valódi szörnyszint kb. 1,15–1,3 × a hős szintje);
  // ennél későbbi tájegység is beszámít, hogy a megbízás ne ragadhasson be, ha a hős közben továbblép
  const regIdx = id => D.REGIONS.findIndex(r => r.id === id);
  function questLm(save) { const o = (save.offers || []).filter(x => x.diff === 'kozepes')[0]; return o ? o.lm : Math.max(1, save.hero.level * 1.15); }
  function questRegion(save) { const o = (save.offers || []).filter(x => x.diff === 'kozepes')[0]; return o ? o.region : E.regionFor(questLm(save), 'kozepes').id; }
  // független ellenőrzéssel hangolva: a napi 3 megbízás kb. 10–20% plusz egy átlagos játéknaphoz képest
  function questReward(h, q, lm) {
    const T = QUEST_TYPES[q.type], e = T.effort * q.n, L = h.level; lm = lm || Math.max(1, L * 1.15);
    return { silver: Math.round(E.silverBase(lm) * 0.9 * e), dust: Math.round((8 + 1.5 * lm) * 0.35 * e), xp: Math.round(E.xpBase(L) * 0.45 * e) };
  }
  function newQuest(save, rng, avoid) {
    const h = save.hero;
    const types = Object.keys(QUEST_TYPES).filter(t => h.level >= QUEST_TYPES[t].min && avoid.indexOf(t) < 0);
    const type = types[Math.floor(rng() * types.length)] || 'clearFight', T = QUEST_TYPES[type];
    const tpls = questTpls().filter(t => t.type === type), tpl = tpls[Math.floor(rng() * tpls.length)];
    const n = T.n[0] + Math.floor(rng() * (T.n[1] - T.n[0] + 1));
    const q = { id: E.newSeed(rng).toString(36), type: type, tpl: tpl ? tpl.id : null, n: n, prog: 0 };
    if (type === 'guardWin') q.region = questRegion(save);
    return q;
  }
  function questState(save, now) {
    const today = day(now), h = save.hero;
    let s = save.quests;
    if (!s) s = { list: [], day: null, dropped: 0 };
    if (s.day !== today) {
      s = JSON.parse(JSON.stringify(s)); // tiszta függvény: a mentést csak a hívó írja vissza
      s.day = today; s.dropped = 0;
      const rng = E.mulberry32(E.newSeed());
      while (s.list.length < QUEST_SLOTS) s.list.push(newQuest(save, rng, s.list.map(q => q.type)));
    }
    return s;
  }
  function questText(q, k) {
    const t = questTpls().filter(x => x.id === q.tpl)[0];
    if (!t) return '';
    const reg = q.region ? (D.REGIONS.filter(r => r.id === q.region)[0] || {}).name || '' : '';
    const num = ['nulla', 'egy', 'két', 'három', 'négy', 'öt'][q.n] || q.n;
    return String(t[k] || '').replace(/\{n\}/g, num).replace(/\{regioban\}/g, REGION_IN[q.region] || reg).replace(/\{regio\}/g, reg);
  }
  function questBump(save, type, cnt, region) {
    const s = save.quests; if (!s || !s.list) return;
    s.list.forEach(q => { if (q.type === type && q.prog < q.n && (!q.region || regIdx(region) >= regIdx(q.region))) q.prog = Math.min(q.n, q.prog + (cnt || 1)); });
  }
  function killNote(save, name) {
    if (!name) return;
    save.album = save.album || { mon: {}, items: {} };
    const k = save.album.kills = save.album.kills || {};
    k[name] = (k[name] || 0) + 1;
  }
  A.questClaim = (save, a, ctx) => {
    const s = questState(save, ctx.now); save.quests = s;
    const i = s.list.findIndex(q => q.id === a.id);
    if (i < 0) fail('state', 'Ez a megbízás már nincs meg.');
    const q = s.list[i], h = save.hero;
    if (q.prog < q.n) fail('state', 'Ez még nincs kész.');
    const rw = questReward(h, q, questLm(save));
    h.silver += rw.silver;
    const dust = E.addDust(save, h, rw.dust, ctx.now);
    const lv = E.addXp(h, rw.xp); G.levelEvents(save, lv, ctx);
    s.list.splice(i, 1); bump(h, 'quests');
    G.personal(save, ctx.now, `<b>${G.esc(h.name)}</b> teljesített egy megbízást: ${G.esc(questText(q, 'title'))}.`, 'win');
    return { silver: rw.silver, dust: dust, xp: rw.xp, done: questText(q, 'done'), levelUps: lv || [] };
  };
  A.questDrop = (save, a, ctx) => {
    const s = questState(save, ctx.now); save.quests = s;
    if (s.dropped >= 1) fail('state', 'Ma már lemondtál egy megbízást. Holnap újra lehet.');
    const i = s.list.findIndex(q => q.id === a.id);
    if (i < 0) fail('state', 'Ez a megbízás már nincs meg.');
    s.dropped++;
    s.list[i] = newQuest(save, E.mulberry32(E.newSeed()), s.list.map(q => q.type).concat([s.list[i].type]));
    return { ok: true };
  };
  A.questView = (save, a, ctx) => { save.quests = questState(save, ctx.now); return { ok: true }; };
  // haladás a meglévő műveletekből
  wrap('fight', save => {
    const exp = save.expedition, res = save.pendingResult;
    if (!exp || !res || !res.win) return;
    questBump(save, 'guardWin', 1, exp.offer.region);
    if (exp.offer.elite) { questBump(save, 'eliteWin', 1); bump(save.hero, 'eliteWins'); }
    if (exp.offer.diff === 'nehez') questBump(save, 'hardWin', 1);
    killNote(save, exp.offer.guard);
  });
  wrap('card', save => {
    const exp = save.expedition, o = exp && exp.lastOut;
    if (!o || exp.phase !== 'cardResult') return;
    if (o.type === 'harc' && o.win) { questBump(save, 'clearFight', 1); killNote(save, o.monster); }
    if (o.type === 'kutatas' && o.success) questBump(save, 'searchOk', 1);
  });
  wrap('event', save => {
    const o = save.expedition && save.expedition.lastOut; if (!o) return;
    if (o.kind === 'szentely') questBump(save, 'shrine', 1);
    if (o.kind === 'arus' && o.cost > 0) questBump(save, 'vendor', 1); // csak ha tényleg vettél valamit
    if (o.kind === 'rejtveny') questBump(save, 'riddle', 1);
  });
  wrap('towerFight', (save, a, ctx, r) => { if (r && r.out && r.out.win) questBump(save, 'towerWin', 1); }); // a gyors mászás nem számít
  wrap('arenaFight', (save, a, ctx, r) => { if (r && r.out && r.out.win) questBump(save, 'arenaWin', 1); });
  // kaland közben a felszerelés/taktika cseréje csak felfelé igazíthatja a szörnyeket (gyenge szettel indulni, aztán átöltözni nem éri meg)
  function recalibrate(save) {
    const exp = save.expedition, h = save.hero;
    if (!exp || exp.phase === 'result' || !exp.offer) return;
    const moon = E.MOONS[exp.offer.moon] || E.MOONS.ujhold;
    if (!E.DIFF[exp.offer.diff]) return;
    // ugyanazzal a céllal (a hold kockázatával együtt) és ugyanazokkal a próbaharcokkal, mint az ajánlat
    const lm = E.findMonsterLevel(E.fighterFromHero(h), h.tactic, E.eliteTarget(exp.offer.diff, moon, exp.offer.elite), { seed: 1000 + E.DIFF_ORDER.indexOf(exp.offer.diff), n: 240, power: moon.power });
    if (lm > exp.offer.lm) { exp.offer.lm = lm; exp.offer.level = Math.max(1, Math.round(lm)); }
  }
  ['equip', 'tactic', 'skillMove', 'upgrade', 'reroll', 'pathPick'].forEach(n => wrap(n, save => recalibrate(save)));
  wrap('upgrade', save => bump(save.hero, 'upgrades'));
  // ===================== Holdkrónika (fő történet) =====================
  // 10 fejezet; a következő a fejezet szintjétől nyílik. Minden fejezet végén egyedi főellenfél, egyszeri jutalommal.
  // A vereség nem visz el semmit, de naponta legfeljebb STORY_TRIES vereség fér bele (különben a próbálkozás ingyen lenne).
  const STORY_TRIES = 3;
  const STORY_RARITY = ['zold', 'kek', 'kek', 'kek', 'lila', 'kek', 'lila', 'kek', 'lila', 'legendas'];
  // a finálé jutalma egyedi, névvel ellátott legendás tárgy
  const STORY_FINAL = { name: 'Csillagszív-lámpás', line: 'Ozsvát lámpása. A fénye már nem lopott: a holdé, és most a tiéd is.' };
  // a főellenfelek ereje (független ellenőrzéssel kalibrálva, minden kaszt átlaga): a fejezet szintjén, reálisan fejlesztett
  // felszereléssel kb. 60–72% győzelmi esély, lemaradt felszereléssel 31–56%; az 1. fejezet barátságos (~78%).
  // a hosszabb, képességdúsabb harcokhoz újramérve: ugyanaz a győzelmi esély (78–94%), mint korábban
  const STORY_BOSS = [{ lm: 0.56, pw: 0.96 }, { lm: 3.89, pw: 1.1 }, { lm: 9.19, pw: 1.1 }, { lm: 14.8, pw: 1.1 }, { lm: 21.25, pw: 1.1 },
    { lm: 26.72, pw: 1.1 }, { lm: 33.75, pw: 1.1 }, { lm: 40.98, pw: 1.1 }, { lm: 48.14, pw: 1.1 }, { lm: 53.15, pw: 1.1 }];
  function storyChapters() { return (D.STORY && D.STORY.chapters) || []; }
  function storyState(save, now) {
    const today = day(now);
    let s = save.story;
    if (!s) s = { done: 0, choices: {}, day: today, losses: 0 };
    if (s.day !== today) { s.day = today; s.losses = 0; }
    s.choices = s.choices || {};
    return s;
  }
  function storyBoss(i) {
    const ch = storyChapters()[i];
    const b = STORY_BOSS[i] || { lm: ch && ch.level, pw: 1.1 };
    return ch ? E.monsterFighter(b.lm, { power: b.pw, name: ch.boss.name }) : null;
  }
  function storyReward(h, i) {
    const ch = storyChapters()[i], L = Math.min(h.level, ch.level + 3);
    return { silver: Math.round(E.silverBase(L) * 3), dust: Math.round((6 + L) * 3), item: E.gateRarity(STORY_RARITY[i] || 'kek', h.level) };
  }
  function storyNext(save) {
    const s = save.story || { done: 0 }, ch = storyChapters()[s.done];
    if (!ch) fail('state', 'A Holdkrónika minden fejezetét befejezted.');
    if (save.hero.level < ch.level) fail('state', `A következő fejezet a ${ch.level}. szinttől nyílik.`);
    return ch;
  }
  A.storyChoice = (save, a, ctx) => {
    const s = storyState(save, ctx.now); save.story = s;
    const ch = storyNext(save);
    if (!ch.choice) fail('state', 'Ebben a fejezetben nincs döntés.');
    if (s.choices[ch.id]) fail('state', 'Itt már döntöttél.');
    if (a.v !== 'a' && a.v !== 'b') fail('arg', 'Érvénytelen választás.');
    s.choices[ch.id] = a.v;
    return { reply: ch.choice[a.v].reply };
  };
  A.storyFight = (save, a, ctx) => {
    const s = storyState(save, ctx.now); save.story = s;
    const ch = storyNext(save), i = s.done, h = save.hero;
    if (ch.choice && !s.choices[ch.id]) fail('state', 'Előbb dönts a fejezetben.');
    if (s.losses >= STORY_TRIES) fail('state', 'Mára elég volt a harcból ezzel az ellenféllel. Holnap újra próbálhatod.');
    if (h.inventory.length >= E.INVENTORY_MAX) fail('state', 'Tele a táskád: előbb csinálj helyet, hogy a fejezet jutalma beférjen.');
    const mon = storyBoss(i), heroF = E.fighterFromHero(h);
    const f = E.simulateFight(heroF, mon, h.tactic, E.newSeed(), true);
    const out = { chapter: i + 1, win: f.win, region: ch.region, boss: ch.boss.name };
    if (!f.win) s.losses++;
    else {
      const rw = storyReward(h, i), rng = E.mulberry32(E.newSeed());
      s.done = i + 1;
      h.silver += rw.silver; out.silver = rw.silver;
      out.dust = E.addDust(save, h, rw.dust, ctx.now);
      // a fejezet tárgya sosem bomlik szét automatikusan (a táska helyét a harc előtt ellenőriztük)
      const it = E.makeItem(rng, Object.assign({ rarity: rw.item, level: h.level, classId: h.classId, hero: h }, i === storyChapters().length - 1 && rw.item === 'legendas' ? STORY_FINAL : {}));
      h.inventory.push(it); G.itemEvent(save, it, ctx, `Holdkrónika, ${i + 1}. fejezet`); out.item = it;
      killNote(save, ch.boss.name);
      G.personal(save, ctx.now, `<b>${G.esc(h.name)}</b> befejezte a Holdkrónika ${i + 1}. fejezetét: ${G.esc(ch.title)}.`, 'win');
    }
    return { fight: { log: f.log, win: f.win, timeout: f.timeout, rounds: f.rounds, heroF: heroF, mon: mon }, out: out };
  };

  ['gift', 'pathPick', 'shopOpen', 'shopReroll', 'shopBuy', 'towerFight', 'towerRush', 'storyChoice', 'storyFight', 'lookPick', 'dye', 'questClaim', 'questDrop', 'questView', 'arenaFind', 'arenaFight', 'teamFind', 'teamFight', 'eventFight', 'eventClaim', 'achClaim'].forEach(n => G.FREE_DURING_EXPEDITION.push(n));
  const run0 = G.run;
  G.run = function (save, action, args, ctx) {
    try { if (save.hero && ctx && ctx.now) save.quests = questState(save, ctx.now); } catch (e) { /* a megbízások sosem akaszthatják meg a játékot */ }
    const r = run0(save, action, args, ctx);
    try { albumNote(save); } catch (e) { /* az album sosem akaszthatja meg a játékot */ }
    try { G.unlockLooks(save.hero); G.unlockCosmetics(save, ctx && ctx.now); } catch (e) { /* a kinézet-gyűjtemény sem */ }
    return r;
  };

  G.extra = {
    weekKey: weekKey, day: day, giftState: giftState, giftPreview: giftPreview, GIFT: GIFT, SHOP_PRICE: SHOP_PRICE, SHOP_REROLLS: SHOP_REROLLS, shopRerollCost: shopRerollCost,
    questState: questState, questReward: questReward, questLm: questLm, questText: questText, QUEST_TYPES: QUEST_TYPES, QUEST_SLOTS: QUEST_SLOTS,
    storyState: storyState, storyBoss: storyBoss, storyReward: storyReward, storyChapters: storyChapters, STORY_TRIES: STORY_TRIES,
    towerState: towerState, rushLimit: rushLimit, towerMonster: towerMonster, towerReward: towerReward, towerRegion: towerRegion, TOWER_TRIES: TOWER_TRIES,
    EVENTS: EVENTS, EVENT_TIERS: EVENT_TIERS, EVENT_TRIES: EVENT_TRIES, currentEvent: currentEvent, eventState: eventState,
    ghostFighter: ghostFighter, botHero: botHero, snap: snap, ARENA_FIGHTS: ARENA_FIGHTS, arenaState: arenaState, TEAM_RUNS: TEAM_RUNS, teamState: teamState, allyShare: allyShare,
    pathCost: pathCost, profileOf: profileOf,
    ACH: ACH, achList: achList, achReward: achReward, albumCount: albumCount
  };
})(typeof window !== 'undefined' ? window : globalThis);
