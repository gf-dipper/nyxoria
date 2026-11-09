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
  function createSave(opts, now) {
    const name = String(opts.name || '').trim().replace(/\s+/g, ' ');
    if (!validName(name)) fail('name', 'A név 2–16 karakter legyen: betűk, számok, szóköz vagy kötőjel.');
    if (!D.CLASSES[opts.classId]) fail('class', 'Ismeretlen kaszt.');
    if (!D.PEOPLES[opts.people]) fail('people', 'Ismeretlen faj.');
    const origin = D.ORIGINS[opts.origin] ? opts.origin : 'arva', trait = D.TRAITS[opts.trait] ? opts.trait : 'kivancsi';
    const motto = String(opts.motto || '').trim().slice(0, 40);
    const hero = E.newHero({ name: name, classId: opts.classId, people: opts.people, look: cleanLook(opts.look), origin: origin, trait: trait, motto: motto, now: now });
    // az új kliens a teljes új kinézetet küldi; a régi kliens csak a régit (akkor a rajzoló átalakítja)
    if (opts.rig) hero.rig = cleanRig(opts.rig, hero.classId);
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
    return [h.level, h.loadout.join('.'), save.settings.moon, eq, h.path == null ? '' : h.path].join('|'); // a taktika nem hoz új kalandot, csak az esélyt számolja újra
  }
  function refreshOffers(save) {
    if (save.expedition) return;
    const key = offersKey(save);
    if (!save.offers || save.offersKey !== key) {
      save.offers = E.makeOffers(save.hero, save.settings.moon, E.newSeed());
      save.offersKey = key; save.offersTactic = save.hero.tactic;
    } else if (save.offersTactic !== save.hero.tactic) {
      save.offers.forEach(o => { o.chance = E.offerChance(save.hero, o); });
      save.offersTactic = save.hero.tactic;
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

  // a kinézet átszabása bármikor (a név, a faj és a kaszt nem változik)
  A.restyle = (save, a) => { save.hero.rig = cleanRig(Object.assign({}, migrateLook(save.hero), a.rig && typeof a.rig === 'object' ? a.rig : {}), save.hero.classId); };
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
  A.salvage = (save, a, ctx) => ({ dust: E.salvage(save, save.hero, a.id, ctx.now) });
  A.sell = (save, a) => ({ silver: E.sell(save.hero, a.id) });
  A.salvageWeak = (save, a, ctx) => {
    const h = save.hero; let sum = 0;
    h.inventory.filter(it => !it.mythic && (it.rarity === 'szurke' || it.rarity === 'zold') && !E.isUpgrade(h, it)).forEach(it => { sum += E.salvage(save, h, it.id, ctx.now); });
    return { dust: sum };
  };
  A.upgrade = (save, a, ctx) => {
    const r = E.upgrade(save.hero, a.id);
    if (!r.ok) fail('cost', r.reason === 'nincs' ? 'Nincs ilyen tárgy.' : r.reason === 'max' ? 'Ez a tárgy már a legmagasabb szinten van.' : r.reason === 'ezüst' ? 'Nincs elég Holdezüst.' : 'Nincs elég Csillagpor.');
    if (r.plus === 5 || r.max) personal(save, ctx.now, `<b>${esc(save.hero.name)}</b> +${r.plus}-re fejlesztett egy tárgyat${r.max ? ' – tovább már nem lehet' : ''}.`, 'loot');
    if (r.max && r.plus >= 10) ctx.events.push({ kind: 'plus10', html: `<b>${esc(save.hero.name)}</b> +${r.plus}-re, a legmagasabb szintre fejlesztett egy tárgyat!` });
    return r;
  };
  A.reroll = (save, a) => {
    const r = E.reroll(save.hero, a.id);
    if (!r.ok) fail('cost', r.reason === 'nincs' ? 'Ennek a tárgynak nincs jellemzője.' : 'Nincs elég Holdezüst.');
    return r;
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
  const FREE_DURING_EXPEDITION = ['tactic', 'restyle', 'settings', 'tip', 'equip', 'salvage', 'sell', 'salvageWeak', 'upgrade', 'reroll', 'skillMove', 'patrolStart', 'patrolClaim'];

  // tárgyak átállítása az új rendszerre (legendás fokozat, fejlesztés-visszatérítés): egyszer, minden régi mentésen
  function migrateItems(save) {
    if (!save || !save.hero || save.itemsV >= 2) return;
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
    run: run, actions: A, createSave: createSave, refreshOffers: refreshOffers, offersKey: offersKey, sanitize: sanitize, summary: summary,
    wind: wind, xpBonus: xpBonus, patrolReward: patrolReward, PATROL_HOURS: PATROL_HOURS, budapestDate: budapestDate, validName: validName,
    cleanRig: cleanRig, migrateLook: migrateLook,
    esc: esc, az: az, fmt: fmt, personal: personal, itemEvent: itemEvent, levelEvents: levelEvents, FREE_DURING_EXPEDITION: FREE_DURING_EXPEDITION
  };
})(typeof window !== 'undefined' ? window : globalThis);
