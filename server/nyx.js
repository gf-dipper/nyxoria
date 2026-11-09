// ===== Nyxoria RPG – szerverfüggvény (Supabase Edge Function: "nyx") =====
// A játéklogika (data.js, engine.js, game.js) a build során e fölé kerül, így a szerver
// pontosan ugyanazt a szabálykönyvet futtatja, mint a böngésző gyakorló módja.
//
// Beállítások (Edge Functions → Secrets):
//   NYXORIA_GUILD_ID    – a Nyxoria Discord-szerver azonosítója (tagság-ellenőrzéshez)
//   DISCORD_WEBHOOK_URL – a krónika-csatorna webhookja (nem kötelező)
//   ADMIN_DISCORD_IDS   – vesszővel elválasztott Discord-azonosítók, akik adminok
//   ALLOWED_ORIGIN      – a játék webcíme, pl. https://nyxoria.pages.dev (nem kötelező)
// A SUPABASE_URL, SUPABASE_ANON_KEY és SUPABASE_DB_URL értékeket a Supabase magától adja.

const env = (k) => Deno.env.get(k) || '';
const D = NYX.data, E = NYX.engine, G = NYX.game;
const sql = postgres(env('SUPABASE_DB_URL'), { prepare: false, max: 3, idle_timeout: 20, connect_timeout: 10 });
const TZ = 'Europe/Budapest';
const DAY = 24 * 3600 * 1000;
const BOSSES = [
  { name: 'A Fenevad', region: 'holdfeny' }, { name: 'Ködkirálynő', region: 'kodlap' }, { name: 'A Holdfaló', region: 'ejkatlan' },
  { name: 'Árnyékcsőr', region: 'arnyromok' }, { name: 'A Hamuszarvú', region: 'szirtek' }, { name: 'Csillagrém', region: 'szirtek' },
  { name: 'A Mocsárkirály', region: 'kodlap' }, { name: 'Éjanya', region: 'ejkatlan' }
];
const TACTIC_IDS = ['roham', 'kiegy', 'kitartas'];
const CHESTS = { 3: { k: 2, min: null }, 9: { k: 3, min: 'zold' }, 15: { k: 4, min: 'kek' }, 0: { k: 3, min: 'zold' } }; // 0 = a boss legyőzéséért járó láda
const BOSS_HITS_PER_DAY = 3;

function cors(origin) {
  const allowed = env('ALLOWED_ORIGIN');
  return {
    'Access-Control-Allow-Origin': allowed ? (allowed.split(',').map(s => s.trim()).indexOf(origin) >= 0 ? origin : allowed.split(',')[0].trim()) : '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
}
function json(body, status, origin) {
  return new Response(JSON.stringify(body), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json' }, cors(origin)) });
}
class GameError extends Error { constructor(code, msg, status) { super(msg); this.code = code; this.status = status || 400; } }

// ---------- idő Budapesten ----------
function tzOffsetMin(t) {
  const p = {};
  new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    .formatToParts(new Date(t)).forEach(x => { p[x.type] = x.value; });
  return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - t) / 60000);
}
function zoned(y, m, d, hh, mm) { // budapesti idő → UTC ms
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let t = guess - tzOffsetMin(guess) * 60000;
  const o2 = tzOffsetMin(t);
  t = guess - o2 * 60000;
  return t;
}
function bpParts(t) {
  const local = new Date(t + tzOffsetMin(t) * 60000);
  return { y: local.getUTCFullYear(), m: local.getUTCMonth() + 1, d: local.getUTCDate(), wd: (local.getUTCDay() + 6) % 7, hh: local.getUTCHours() };
}
// A boss-hét: hétfő 6:00-tól vasárnap 22:00-ig. Visszaadja az aktuális (vagy épp lezárult) hetet.
function bossWeek(now) {
  const p = bpParts(now);
  let monday = new Date(Date.UTC(p.y, p.m - 1, p.d) - p.wd * DAY);
  let starts = zoned(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate(), 6, 0);
  if (now < starts) { monday = new Date(monday.getTime() - 7 * DAY); starts = zoned(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate(), 6, 0); }
  const md = (off) => { const x = new Date(monday.getTime() + off * DAY); return [x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate()]; };
  const fri = md(4), sun = md(6);
  return {
    weekStart: monday.toISOString().slice(0, 10), startsAt: starts,
    rageAt: zoned(fri[0], fri[1], fri[2], 0, 0), endsAt: zoned(sun[0], sun[1], sun[2], 22, 0),
    index: Math.floor(monday.getTime() / (7 * DAY))
  };
}

// ---------- hitelesítés ----------
async function authUser(req) {
  const h = req.headers.get('Authorization') || '';
  const token = h.replace(/^Bearer\s+/i, '');
  if (!token) throw new GameError('auth', 'Jelentkezz be újra.', 401);
  if (env('TEST_AUTH') === '1' && token.startsWith('test:')) { // csak helyi teszthez
    const [, id, name, did] = token.split(':');
    return { id: id, name: decodeURIComponent(name || 'Teszt'), discordId: did || id.slice(0, 8), avatar: '' };
  }
  const apikey = env('SUPABASE_ANON_KEY') || req.headers.get('apikey') || '';
  const r = await fetch(env('SUPABASE_URL') + '/auth/v1/user', { headers: { Authorization: 'Bearer ' + token, apikey: apikey } });
  if (!r.ok) throw new GameError('auth', 'Lejárt a belépés, jelentkezz be újra.', 401);
  const u = await r.json();
  const md = u.user_metadata || {}, ident = (u.identities || []).filter(i => i.provider === 'discord')[0];
  return {
    id: u.id, name: (md.custom_claims && md.custom_claims.global_name) || md.full_name || md.name || md.user_name || 'Ismeretlen',
    discordId: md.provider_id || md.sub || (ident && ident.id) || '', avatar: md.avatar_url || md.picture || ''
  };
}
function isAdminId(discordId) { return env('ADMIN_DISCORD_IDS').split(',').map(s => s.trim()).filter(Boolean).indexOf(String(discordId)) >= 0; }

// ---------- világállapot ----------
async function worldState(tx) {
  const [w] = await tx`select median_level, active_players, updated_at from world_state where id = 1`;
  if (w && Date.now() - new Date(w.updated_at).getTime() < 3600 * 1000) return { median: w.median_level, active: w.active_players };
  const [r] = await tx`select coalesce(percentile_disc(0.5) within group (order by level), 0)::int as median, count(*)::int as active
                       from heroes where active_at > now() - interval '14 days'`;
  await tx`update world_state set median_level = ${r.median}, active_players = ${r.active}, updated_at = now() where id = 1`;
  return { median: r.median, active: r.active };
}

async function ensureBoss(world) {
  const now = Date.now(), wk = bossWeek(now);
  let [boss] = await sql`select * from world_bosses where week_start = ${wk.weekStart}`;
  if (boss) return boss;
  if (now >= wk.endsAt) return null;
  await finalizeOld();
  const def = BOSSES[wk.index % BOSSES.length];
  const median = Math.max(3, world.median || 1), level = median + 2;
  const avg = E.averageBossHit(median, 40);
  const hp = Math.round(Math.max(5, world.active) * 12 * avg);
  const weakness = TACTIC_IDS[(wk.index * 7) % 3];
  await sql`insert into world_bosses (week_start, name, region, level, max_hp, hp, weakness, starts_at, rage_at, ends_at)
            values (${wk.weekStart}, ${def.name}, ${def.region}, ${level}, ${hp}, ${hp}, ${weakness},
                    ${new Date(wk.startsAt)}, ${new Date(wk.rageAt)}, ${new Date(wk.endsAt)})
            on conflict (week_start) do nothing`;
  [boss] = await sql`select * from world_bosses where week_start = ${wk.weekStart}`;
  await chronicle(null, 'boss', `<b>${G.esc(boss.name)}</b> megérkezett! Ezen a héten az egész szerver együtt küzd ellene.`, true);
  return boss;
}

// A lejárt bossok lezárása: a 3 legnagyobb sebző címet kap
async function finalizeOld() {
  const old = await sql`select * from world_bosses where finalized = false and ends_at < now() order by id`;
  for (const b of old) {
    const top = await sql`select p.user_id, p.damage, h.name from boss_participants p join heroes h on h.user_id = p.user_id
                          where p.boss_id = ${b.id} and p.damage > 0 order by p.damage desc limit 3`;
    const titles = [`${b.name} réme`, `${b.name} ostora`, `${b.name} vadásza`];
    for (let i = 0; i < top.length; i++) await sql`update boss_participants set title = ${titles[i]} where boss_id = ${b.id} and user_id = ${top[i].user_id}`;
    await sql`update world_bosses set finalized = true where id = ${b.id}`;
    if (top.length) {
      await chronicle(null, 'boss', `${G.esc(b.name)} hete lezárult. A legnagyobb sebzők: ${top.map((t, i) => `${i + 1}. <b>${G.esc(t.name)}</b> (${G.fmt(Number(t.damage))})`).join(', ')}.`, true);
    }
  }
}

function bossPublic(b, now) {
  if (!b) return null;
  return {
    id: Number(b.id), name: b.name, region: b.region, level: b.level, maxHp: Number(b.max_hp), hp: Number(b.hp), weakness: b.weakness,
    startsAt: new Date(b.starts_at).getTime(), rageAt: new Date(b.rage_at).getTime(), endsAt: new Date(b.ends_at).getTime(),
    killedAt: b.killed_at ? new Date(b.killed_at).getTime() : null,
    active: now >= new Date(b.starts_at).getTime() && now < new Date(b.ends_at).getTime() && !b.killed_at,
    rage: now >= new Date(b.rage_at).getTime()
  };
}

// ---------- krónika és Discord ----------
function plain(html) { return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"); }
async function chronicle(userId, kind, html, announce) {
  await sql`insert into chronicle (user_id, kind, html) values (${userId}, ${kind}, ${html})`;
  const hook = env('DISCORD_WEBHOOK_URL');
  if (announce && hook) {
    const p = fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Nyxoria Krónika', content: plain(html).slice(0, 1900), allowed_mentions: { parse: [] } }) }).catch(() => {});
    try { if (globalThis.EdgeRuntime && EdgeRuntime.waitUntil) EdgeRuntime.waitUntil(p); else await p; } catch (e) { /* a krónika így is mentve */ }
  }
}
// a legendás tárgy a közös krónikába kerül (mindenki látja), Discordra csak a mitikus megy
const ANNOUNCE = { mythic: true, plus10: true, level: (e) => e.level >= 30, lila: false, legendas: false };
async function publishEvents(userId, events) {
  for (const e of events) {
    const a = ANNOUNCE[e.kind];
    await chronicle(userId, e.kind, e.html, typeof a === 'function' ? a(e) : !!a);
  }
}

// ---------- hős betöltése és mentése ----------
async function loadHero(tx, userId, lock) {
  const rows = lock ? await tx`select save from heroes where user_id = ${userId} for update` : await tx`select save from heroes where user_id = ${userId}`;
  return rows[0] ? rows[0].save : null;
}
async function storeHero(tx, userId, save) {
  const s = G.summary(save);
  await tx`update heroes set save = ${tx.json(save)}, level = ${s.level}, xp = ${s.xp}, power = ${s.power}, mythics = ${s.mythics}, legendaries = ${s.legendaries}, wins = ${s.wins},
           version = version + 1, updated_at = now(), active_at = now() where user_id = ${userId}`;
}

async function myBossRows(userId, boss) {
  if (!boss) return [];
  const rows = await sql`select p.boss_id, p.damage, p.hits, p.day, p.hits_day, p.claimed, p.title, b.name, b.killed_at, b.ends_at
                         from boss_participants p join world_bosses b on b.id = p.boss_id
                         where p.user_id = ${userId} and p.boss_id >= ${Number(boss.id) - 1} order by p.boss_id desc`;
  const today = G.budapestDate(Date.now());
  return rows.map(r => ({ bossId: Number(r.boss_id), name: r.name, damage: Number(r.damage), hits: r.hits, hitsToday: r.day === today ? r.hits_day : 0,
    claimed: r.claimed || [], title: r.title, killed: !!r.killed_at, ended: new Date(r.ends_at).getTime() < Date.now() }));
}

// a pihenő hősök rövid adatai (a hősválasztóhoz)
async function heroSlots(userId) {
  const rows = await sql`select slot, save from hero_slots where user_id = ${userId} order by slot`;
  return rows.map(r => { const h = r.save.hero; return { slot: r.slot, name: h.name, classId: h.classId, people: h.people, level: h.level, rig: h.rig || null, look: h.look || null, path: h.path }; });
}
const MAX_HEROES = 3;
async function nameTaken(tx, name) {
  const [a] = await tx`select 1 as x from heroes where lower(name) = lower(${name}) union all select 1 from hero_slots where lower(name) = lower(${name}) limit 1`;
  return !!a;
}
// hőscsere: a mostani hős a pihenőhelyre kerül, a választott (vagy az új) lesz a játszott. A napi ajándék a fiókhoz tartozik, ezért átkerül.
async function heroAction(user, action, args) {
  return sql.begin(async tx => {
    await tx`select pg_advisory_xact_lock(hashtext(${'hero:' + user.id}))`;
    const cur = await loadHero(tx, user.id, true);
    if (!cur) throw new GameError('nohero', 'Előbb hozz létre hőst.');
    const slots = await tx`select slot from hero_slots where user_id = ${user.id}`;
    const used = slots.map(r => r.slot);
    const park = async (slot, save) => {
      const s = G.summary(save);
      const [c] = await tx`select created_at from heroes where user_id = ${user.id}`;
      await tx`insert into hero_slots (user_id, slot, name, class_id, level, xp, power, mythics, legendaries, save, created_at)
               values (${user.id}, ${slot}, ${save.hero.name}, ${save.hero.classId}, ${s.level}, ${s.xp}, ${s.power}, ${s.mythics}, ${s.legendaries}, ${tx.json(save)}, ${c.created_at})`;
    };
    const activate = async (save, createdAt) => {
      save.gift = cur.gift; // a napi ajándék fiókonként jár
      const s = G.summary(save);
      await tx`update heroes set name = ${save.hero.name}, class_id = ${save.hero.classId}, save = ${tx.json(save)}, level = ${s.level}, xp = ${s.xp}, power = ${s.power},
               mythics = ${s.mythics}, legendaries = ${s.legendaries}, wins = ${s.wins}, version = version + 1, updated_at = now(), active_at = now(),
               created_at = ${createdAt || new Date()} where user_id = ${user.id}`;
      return save;
    };
    if (action === 'heroNew') {
      if (used.length + 1 >= MAX_HEROES) throw new GameError('state', `Egy fiókhoz legfeljebb ${MAX_HEROES} hős tartozhat. Előbb törölj egyet a pihenő hőseid közül.`);
      const save = G.createSave(args, Date.now());
      save.settings = Object.assign({}, save.settings, cur.settings || {}); save.seenTips = Object.assign({}, cur.seenTips || {}); // a beállítások és a már látott tippek maradnak
      if (await nameTaken(tx, save.hero.name)) throw new GameError('name', 'Ez a név már foglalt, válassz másikat.');
      G.refreshOffers(save);
      await park([1, 2].filter(n => used.indexOf(n) < 0)[0], cur);
      await activate(save, null);
      await chronicle(user.id, 'new', `Új hős érkezett: <b>${G.esc(save.hero.name)}</b>, ${G.az(D.PEOPLES[save.hero.people].name)} ${D.PEOPLES[save.hero.people].name.toLowerCase()} ${D.CLASSES[save.hero.classId].name.toLowerCase()}. Üdv a Nyxorián!`, true);
      return save;
    }
    const slot = Number(args.slot) | 0;
    const [row] = await tx`select save, created_at from hero_slots where user_id = ${user.id} and slot = ${slot} for update`;
    if (!row) throw new GameError('arg', 'Ezen a helyen nincs hős.');
    if (action === 'heroDelete') {
      if (String(args.confirm || '').trim().toLowerCase() !== row.save.hero.name.toLowerCase()) throw new GameError('arg', 'A törléshez írd be pontosan a hős nevét.');
      await tx`delete from hero_slots where user_id = ${user.id} and slot = ${slot}`;
      return cur;
    }
    // heroSwitch
    await tx`delete from hero_slots where user_id = ${user.id} and slot = ${slot}`;
    await park(slot, cur);
    return activate(row.save, row.created_at);
  });
}
async function statePayload(user, player) {
  await applyPending(user.id).catch(() => 0);
  const world = await worldState(sql);
  const boss = await ensureBoss(world);
  const save = await loadHero(sql, user.id, false);
  const chron = await sql`select created_at, kind, html from chronicle order by id desc limit 30`;
  const mine = await myBossRows(user.id, boss);
  const titles = await sql`select title from boss_participants where user_id = ${user.id} and title is not null order by boss_id desc limit 5`;
  let rank = null;
  if (save) {
    const [r] = await sql`select count(*)::int + 1 as rank from ${ALLH(sql)} h where (level, xp) > (${save.hero.level}, ${save.hero.xp})`;
    rank = r.rank;
  }
  if (save) G.refreshOffers(save);
  return {
    me: { name: user.name, avatar: user.avatar, admin: player.is_admin || isAdminId(user.discordId), verified: !!player.verified_at },
    save: save ? G.sanitize(save) : null,
    world: { median: world.median, active: world.active, wind: save ? G.wind(save.hero.level, world.median) : 1, rank: rank },
    heroes: await heroSlots(user.id),
    boss: bossPublic(boss, Date.now()), bossMine: mine, titles: titles.map(t => t.title), guild: guildPublic(await guildOf(user.id)),
    chronicle: chron.map(c => ({ t: new Date(c.created_at).getTime(), kind: c.kind, text: c.html }))
  };
}

// ---------- boss-ütés és ládák ----------
// a ládák is a közös sorsolást használják (Nehéz tábla, szintkapukkal), legalább a láda alsó ritkaságával
function rollMinRarity(rng, min, h) { return E.rollLoot(rng, 'nehez', h, { floor: min || null }); }
async function bossHit(user, args) {
  return await sql.begin(async tx => {
    const save = await loadHero(tx, user.id, true);
    if (!save) throw new GameError('nohero', 'Előbb hozz létre hőst.');
    const [b] = await tx`select * from world_bosses where id = ${args.bossId | 0} for update`;
    const now = Date.now();
    const bp = bossPublic(b, now);
    if (!bp || !bp.active) throw new GameError('boss', 'A heti szörny most nem támadható.');
    const today = G.budapestDate(now);
    const [p0] = await tx`select * from boss_participants where boss_id = ${b.id} and user_id = ${user.id}`;
    const hitsToday = p0 && p0.day === today ? p0.hits_day : 0;
    if (hitsToday >= BOSS_HITS_PER_DAY) throw new GameError('limit', 'Ma már mindhárom ütésedet felhasználtad. Holnap újra jöhetsz!');
    E.torchState(save, now);
    const h = save.hero, heroF = E.fighterFromHero(h), bossF = E.bossFighter(b.level, { rage: bp.rage, name: b.name });
    const fight = E.bossHit(heroF, bossF, h.tactic, E.newSeed(), { weakness: b.weakness, log: true });
    const dmg = Math.min(fight.damage, Number(b.hp));
    const newHp = Number(b.hp) - dmg;
    const ctx = { now: now, events: [], median: (await worldState(tx)).median };
    const xp = Math.round(E.xpBase(h.level) * 0.25 * G.xpBonus(save, ctx));
    const dust = E.addDust(save, h, (8 + 1.5 * h.level) * 0.5 * (bp.rage ? 1.25 : 1), now);
    const silver = Math.round(E.silverBase(h.level) * 0.3);
    h.silver += silver;
    const ups = E.addXp(h, xp);
    G.levelEvents(save, ups, ctx);
    G.personal(save, now, `<b>${G.esc(h.name)}</b> ${G.fmt(dmg)} sebzést vitt be a heti szörnynek (${G.esc(b.name)}).`, 'win');
    await tx`insert into boss_participants (boss_id, user_id, damage, hits, day, hits_day) values (${b.id}, ${user.id}, ${dmg}, 1, ${today}, 1)
             on conflict (boss_id, user_id) do update set damage = boss_participants.damage + ${dmg}, hits = boss_participants.hits + 1,
             hits_day = case when boss_participants.day = ${today} then boss_participants.hits_day + 1 else 1 end, day = ${today}`;
    let killed = false;
    if (newHp <= 0) {
      killed = true;
      await tx`update world_bosses set hp = 0, killed_at = now() where id = ${b.id}`;
    } else await tx`update world_bosses set hp = ${newHp} where id = ${b.id}`;
    await storeHero(tx, user.id, save);
    await tx`insert into action_log (user_id, action, info) values (${user.id}, 'bossHit', ${tx.json({ boss: Number(b.id), dmg: dmg })})`;
    return { save, ctx, killed, b, out: { damage: dmg, weak: fight.weak, xp: xp, dust: dust, silver: silver, levelUps: ups, killed: killed,
      fight: { log: fight.log, win: true, timeout: false, rounds: fight.rounds, heroF: heroF, mon: Object.assign({}, bossF, { maxHp: Number(b.max_hp), hpStart: Number(b.hp) }), boss: true } } };
  }).then(async r => {
    await publishEvents(user.id, r.ctx.events);
    if (r.killed) await chronicle(user.id, 'boss', `A közösség legyőzte: <b>${G.esc(r.b.name)}</b>! Az utolsó csapást <b>${G.esc(r.save.hero.name)}</b> mérte. Mindenki, aki ütött, kap egy győzelmi ládát.`, true);
    return r;
  });
}

async function bossClaim(user, args) {
  const tier = args.tier | 0;
  if (!CHESTS[tier]) throw new GameError('arg', 'Nincs ilyen láda.');
  return await sql.begin(async tx => {
    const save = await loadHero(tx, user.id, true);
    if (!save) throw new GameError('nohero', 'Előbb hozz létre hőst.');
    const [p] = await tx`select p.*, b.killed_at, b.name from boss_participants p join world_bosses b on b.id = p.boss_id
                         where p.boss_id = ${args.bossId | 0} and p.user_id = ${user.id} for update of p`;
    if (!p) throw new GameError('state', 'Ezen a héten még nem támadtad meg a heti szörnyet.');
    if ((p.claimed || []).indexOf(tier) >= 0) throw new GameError('state', 'Ezt a ládát már kinyitottad.');
    if (tier === 0 ? !p.killed_at : p.hits < tier) throw new GameError('state', 'Ez a láda még nem jár.');
    const now = Date.now(), h = save.hero, c = CHESTS[tier], rng = E.mulberry32(E.newSeed());
    const ctx = { now: now, events: [] };
    const out = { tier: tier, silver: Math.round(E.silverBase(h.level) * c.k), dust: 0, item: null };
    h.silver += out.silver;
    out.dust = E.addDust(save, h, (8 + 1.5 * h.level) * c.k, now);
    // az Arany láda a hét fő célja: a 25. szinttől 3% legendás, a 12.-től 12% biztos lila
    const roll = rng();
    const rar = tier === 15 && h.level >= E.RARITY_GATE.legendas && roll < 0.03 ? 'legendas' : tier === 15 && h.level >= E.RARITY_GATE.lila && roll < (h.level >= E.RARITY_GATE.legendas ? 0.15 : 0.12) ? 'lila' : rollMinRarity(rng, c.min, h);
    const it = E.makeItem(rng, { rarity: rar, level: h.level, classId: h.classId, hero: h });
    out.item = it; out.itemResult = E.addItem(save, h, it, now);
    G.itemEvent(save, it, ctx, 'szörnyláda');
    if (tier === 0) { save.buffs = save.buffs || {}; save.buffs.xpUntil = now + DAY; out.buff = true; }
    G.personal(save, now, `<b>${G.esc(h.name)}</b> kinyitott egy ${tier === 0 ? 'győzelmi' : tier === 3 ? 'részvételi' : tier === 9 ? 'ezüst' : 'arany'} ládát.`, 'loot');
    await tx`update boss_participants set claimed = array_append(claimed, ${tier}) where boss_id = ${p.boss_id} and user_id = ${user.id}`;
    G.refreshOffers(save);
    await storeHero(tx, user.id, save);
    return { save, ctx, out };
  }).then(async r => { await publishEvents(user.id, r.ctx.events); return r; });
}

// ---------- ranglisták ----------
// minden hős (az épp játszott és a pihenők is) a ranglistákhoz és a profilhoz
const ALLH = sql => sql`(select user_id, name, class_id, level, xp, power, mythics, legendaries, save, created_at from heroes
                         union all select user_id, name, class_id, level, xp, power, mythics, legendaries, save, created_at from hero_slots)`;
async function ranks(user, args) {
  const tab = args.tab;
  const [mine] = await sql`select lower(name) as n from heroes where user_id = ${user.id}`, myName = mine ? mine.n : null; // csak a most játszott hős a „te”
  if (tab === 'boss') {
    const [b] = await sql`select id from world_bosses order by id desc limit 1`;
    if (!b) return { rows: [] };
    const rows = await sql`select h.name, h.class_id, h.level, p.damage as value, p.user_id from boss_participants p join heroes h on h.user_id = p.user_id
                           where p.boss_id = ${b.id} order by p.damage desc limit 50`;
    return { rows: rows.map(r => ({ name: r.name, classId: r.class_id, level: r.level, value: Number(r.value), me: r.user_id === user.id })) };
  }
  if (tab === 'arena' || tab === 'torony') {
    const wk = weekNow();
    const rows = tab === 'arena'
      ? await sql`select name, class_id, level, (save->'arena'->>'rating')::int as value, user_id from ${ALLH(sql)} h where save ? 'arena' order by value desc limit 50`
      : await sql`select name, class_id, level, (save->'tower'->>'floor')::int as value, user_id from ${ALLH(sql)} h where save->'tower'->>'week' = ${wk} order by value desc, level asc limit 50`;
    return { rows: rows.map(r => ({ name: r.name, classId: r.class_id, level: r.level, value: Number(r.value), me: r.user_id === user.id && (!myName || r.name.toLowerCase() === myName) })) };
  }
  if (tab === 'ceh') {
    const rows = await sql`select g.name, g.tag, count(m.user_id)::int as members, coalesce(sum(case when m.week = ${weekNow()} then m.week_wins else 0 end), 0)::int as value,
                           bool_or(m.user_id = ${user.id}) as mine from guilds g join guild_members m on m.guild_id = g.id group by g.id order by value desc limit 50`;
    return { rows: rows.map(r => ({ name: `${r.name} [${r.tag}]`, classId: null, level: r.members, value: r.value, me: !!r.mine, guild: true })) };
  }
  let rows;
  if (tab === 'ujonc') rows = await sql`select name, class_id, level, xp as value, user_id from ${ALLH(sql)} h where created_at > now() - interval '14 days' order by level desc, xp desc limit 50`;
  else if (tab === 'gyujto') rows = await sql`select name, class_id, level, legendaries as value, user_id from ${ALLH(sql)} h order by legendaries desc, mythics desc, power desc limit 50`;
  else if (tab === 'ero') rows = await sql`select name, class_id, level, power as value, user_id from ${ALLH(sql)} h order by power desc limit 50`;
  else rows = await sql`select name, class_id, level, xp as value, user_id from ${ALLH(sql)} h order by level desc, xp desc limit 50`;
  return { rows: rows.map(r => ({ name: r.name, classId: r.class_id, level: r.level, value: Number(r.value), me: r.user_id === user.id && (!myName || r.name.toLowerCase() === myName) })) };
}

// ---------- admin ----------
async function admin(user, player, args) {
  if (!(player.is_admin || isAdminId(user.discordId))) throw new GameError('admin', 'Ehhez nincs jogod.', 403);
  if (args.op === 'stats') {
    const [s] = await sql`select count(*)::int as heroes, count(*) filter (where active_at > now() - interval '1 day')::int as active1,
                          count(*) filter (where active_at > now() - interval '14 days')::int as active14, coalesce(sum((save->'hero'->>'silver')::bigint), 0)::bigint as silver,
                          coalesce(max(level), 0)::int as maxlevel from ${ALLH(sql)} h`;
    const [p] = await sql`select count(*)::int as players, count(*) filter (where banned)::int as banned from players`;
    const recent = await sql`select at, action, info, (select name from heroes h where h.user_id = l.user_id) as name from action_log l order by id desc limit 20`;
    return { stats: Object.assign({}, s, p, { silver: Number(s.silver) }), recent: recent.map(r => ({ at: new Date(r.at).getTime(), action: r.action, name: r.name, info: r.info })) };
  }
  if (args.op === 'ban' || args.op === 'unban') {
    const rows = await sql`update players set banned = ${args.op === 'ban'} where user_id = (select user_id from ${ALLH(sql)} h where lower(name) = lower(${String(args.name || '')}) limit 1) returning user_id`;
    if (!rows.length) throw new GameError('arg', 'Nincs ilyen nevű hős.');
    return { ok: true };
  }
  throw new GameError('arg', 'Ismeretlen admin-művelet.');
}

// ---------- belépési kör ----------
const LOGGED = ['start', 'fight', 'choose', 'retreat', 'upgrade', 'reroll', 'patrolStart', 'patrolClaim', 'equip', 'salvageWeak'];

// ---------- Aréna, csapat, céh ----------
const X = G.extra;
const GUILD_MAX = 20, GUILD_COST = 1000;
const GUILD_GOALS = [{ w: 50, silver: 3, dust: 40 }, { w: 150, silver: 6, dust: 80 }, { w: 350, silver: 10, dust: 150 }]; // heti közös győzelmek; jutalom: × alap-Holdezüst, Csillagpor
const GUILD_EMBLEMS = ['hold', 'csillag', 'kard', 'pajzs', 'farkas', 'fa', 'korona', 'lang'];
const WIN_ACTIONS = ['fight', 'arenaFight', 'teamFight', 'eventFight']; // a torony emeletei nem számítanak (túl sok, túl könnyű „győzelem”)
const weekNow = () => X.weekKey(Date.now());
function heroSnap(save, uid) { return X.snap(save.hero, uid, save.arena ? save.arena.rating : 1000); }

async function arenaPool(userId, save) {
  // a hasonló pontszámú ellenfelek jönnek (a pontszám idővel a valódi erőt mutatja, a kasztok közti különbséggel együtt)
  const p = G.summary(save).power, rt = (save.arena && save.arena.rating) || 1000;
  const rows = await sql`select user_id, save from heroes where user_id <> ${userId} and active_at > now() - interval '30 days'
                         and power between ${Math.floor(p * 0.6)} and ${Math.ceil(p * 1.6)}
                         order by abs(coalesce((save->'arena'->>'rating')::int, 1000) - ${rt}) + random() * 60 limit 3`;
  return rows.map(r => Object.assign(heroSnap(r.save, r.user_id), { hero: r.save.hero })); // a hős csak az esély kiszámításához kell
}
async function teamPool(userId, save) {
  const L = save.hero.level;
  const rows = await sql`select h.user_id, h.save from heroes h
                         left join guild_members gm on gm.user_id = h.user_id
                         left join guild_members me on me.user_id = ${userId}
                         where h.user_id <> ${userId} and h.active_at > now() - interval '14 days' and h.level between ${L - 5} and ${L + 5}
                         order by (gm.guild_id is not null and gm.guild_id = me.guild_id) desc, random() limit 4`;
  return rows.map(r => heroSnap(r.save, r.user_id));
}
// a jelöltként mutatott hős (név szerint): ha a játékos azóta hőst váltott, a pihenő hőse áll ki, nem a mostani
async function heroOf(uid, name) { if (!uid) return null; const [r] = await sql`select save from ${ALLH(sql)} h where user_id = ${uid} and lower(name) = lower(${String(name || '')})`; return r ? r.save.hero : null; }

async function guildOf(userId) {
  const [m] = await sql`select g.*, m.role, m.week, m.week_wins, m.claimed, m.joined_at from guild_members m join guilds g on g.id = m.guild_id where m.user_id = ${userId}`;
  return m || null;
}
// a céhcél a létszámhoz igazodik: 5 tagnál a megadott érték, kisebb céhnél kevesebb (legalább 40%), nagyobbnál több (legfeljebb 2×)
function goalFor(g, members) { return Math.round(g.w * Math.max(0.4, Math.min(2, members / 5))); }
async function guildProgress(guildId) {
  const [r] = await sql`select coalesce(sum(week_wins), 0)::int as wins, count(*)::int as members from guild_members where guild_id = ${guildId} and week = ${weekNow()}`;
  const [c] = await sql`select count(*)::int as n from guild_members where guild_id = ${guildId}`;
  return { wins: r.wins, members: c.n };
}
async function guildLog(guildId, html) { await sql`insert into guild_log (guild_id, html) values (${guildId}, ${html})`; }
function guildPublic(g) { return g ? { id: Number(g.id), name: g.name, tag: g.tag, color: g.color, emblem: g.emblem, motto: g.motto, stars: g.stars || 0 } : null; }
const GUILD_DAILY_WINS = 25; // egy fiók naponta legfeljebb ennyi győzelemmel járulhat hozzá a céhhez (több hőssel sem lehet halmozni)
async function noteWin(userId) {
  const wk = weekNow(), dk = X.day(Date.now());
  const [d] = await sql`update guild_members set day_wins = case when day = ${dk} then day_wins + 1 else 1 end, day = ${dk} where user_id = ${userId} returning day_wins`;
  if (!d || d.day_wins > GUILD_DAILY_WINS) return;
  const rows = await sql`update guild_members set week_wins = case when week = ${wk} then week_wins + 1 else 1 end,
            claimed = case when week = ${wk} then claimed else '{}' end, week = ${wk} where user_id = ${userId} returning guild_id`;
  if (!rows.length) return;
  const gid = rows[0].guild_id;
  await sql`insert into guild_weeks (guild_id, week, wins) values (${gid}, ${wk}, 1) on conflict (guild_id, week) do update set wins = guild_weeks.wins + 1`;
  await sql`insert into member_weeks (user_id, guild_id, week, wins) values (${userId}, ${gid}, ${wk}, 1) on conflict (user_id, week) do update set wins = case when member_weeks.guild_id = excluded.guild_id then member_weeks.wins + 1 else 1 end, guild_id = excluded.guild_id`;
  // a heti párosítás (és a múlt heti csillagok kiosztása) akkor is megtörténik, ha senki sem nyitja meg a céh oldalát
  await ensureWars(wk).catch(() => {});
}
// ---------- céhháború: heti párosítás, állás, jutalom ----------
const WAR_REWARD = { silver: 8, dust: 100 };
const prevWeek = () => new Date(Date.parse(weekNow() + 'T12:00:00Z') - 7 * DAY).toISOString().slice(0, 10);
async function ensureWars(wk) {
  const [has] = await sql`select 1 as x from guild_wars where week = ${wk} limit 1`;
  if (has) return;
  await sql.begin(async tx => {
    await tx`select pg_advisory_xact_lock(hashtext(${'wars' + wk}))`;
    const [again] = await tx`select 1 as x from guild_wars where week = ${wk} limit 1`;
    if (again) return;
    // a céhek az előző heti erejük szerint sorba állnak, és a szomszédok kerülnek össze (hasonló erejű ellenfél)
    const gs = await tx`select g.id, coalesce(w.wins, 0) as w from guilds g left join guild_weeks w on w.guild_id = g.id and w.week = ${prevWeek()}
                        where exists (select 1 from guild_members m where m.guild_id = g.id) order by w desc, g.id`;
    // páratlan számnál hétről hétre más céh pihen (nem mindig a leggyengébb)
    if (gs.length % 2) gs.splice(Math.abs([...wk].reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7)) % gs.length, 1);
    for (let i = 0; i + 1 < gs.length; i += 2) await tx`insert into guild_wars (week, a, b) values (${wk}, ${gs[i].id}, ${gs[i + 1].id}) on conflict do nothing`;
    // a múlt heti háborúk győztesei csillagot kapnak a zászlójukra (akkor is, ha senki sem veszi át a jutalmat)
    const pw = prevWeek();
    const done = await tx`select w.a, w.b, coalesce(x.wins, 0) as wa, coalesce(y.wins, 0) as wb from guild_wars w
                          left join guild_weeks x on x.guild_id = w.a and x.week = w.week left join guild_weeks y on y.guild_id = w.b and y.week = w.week where w.week = ${pw}`;
    for (const d of done) {
      if (d.wa === d.wb) continue;
      const win = d.wa > d.wb ? d.a : d.b, lose = d.wa > d.wb ? d.b : d.a;
      const st = await tx`update guilds set stars = stars + 1, star_week = ${pw} where id = ${win} and (star_week is distinct from ${pw}) returning id`;
      const [lg] = await tx`select name from guilds where id = ${lose}`;
      if (st.length) await tx`insert into guild_log (guild_id, html) values (${win}, ${`Megnyertük a céhháborút${lg ? ` ${G.az(lg.name)} <b>${G.esc(lg.name)}</b> ellen` : ''}! Új csillag került a zászlóra.`})`;
    }
  });
}
async function warOf(gid, wk) {
  const [w] = await sql`select a, b from guild_wars where week = ${wk} and (a = ${gid} or b = ${gid})`;
  if (!w) return null;
  const opp = Number(w.a) === Number(gid) ? w.b : w.a;
  const [g] = await sql`select * from guilds where id = ${opp}`;
  const wins = await sql`select guild_id, wins from guild_weeks where week = ${wk} and guild_id in (${gid}, ${opp})`;
  const of = id => { const r = wins.find(x => Number(x.guild_id) === Number(id)); return r ? r.wins : 0; };
  return { week: wk, opponent: g ? Object.assign(guildPublic(g), { stars: g.stars || 0 }) : null, mine: of(gid), theirs: of(opp) };
}
// a többi játékostól kapott jutalmak jóváírása (a mentésbe), egyszer
async function applyPending(userId) {
  return sql.begin(async tx => {
    const rows = await tx`delete from pending_rewards where user_id = ${userId} returning silver, dust, html`;
    if (!rows.length) return 0;
    const save = await loadHero(tx, userId, true);
    if (!save) return 0;
    rows.forEach(r => { save.hero.silver += r.silver; E.addDust(save, save.hero, r.dust, Date.now()); if (r.html) G.personal(save, Date.now(), r.html, 'loot'); });
    await storeHero(tx, userId, save);
    return rows.length;
  });
}

async function guildAction(user, action, args) {
  const me = await guildOf(user.id);
  if (action === 'guildList') {
    const rows = await sql`select g.id, g.name, g.tag, g.color, g.emblem, g.motto, g.stars, count(m.user_id)::int as members,
                           coalesce(sum(case when m.week = ${weekNow()} then m.week_wins else 0 end), 0)::int as wins
                           from guilds g left join guild_members m on m.guild_id = g.id group by g.id order by wins desc, members desc limit 50`;
    return { guilds: rows.map(r => Object.assign(guildPublic(r), { members: r.members, wins: r.wins })), mine: guildPublic(me), max: GUILD_MAX, cost: GUILD_COST, emblems: GUILD_EMBLEMS };
  }
  if (action === 'guildInfo') {
    if (!me) return { guild: null };
    const members = await sql`select h.name, h.class_id, h.level, h.save->'hero'->'rig' as rig, h.save->'hero'->'look' as look, m.role, m.user_id,
                              case when m.week = ${weekNow()} then m.week_wins else 0 end as wins
                              from guild_members m join heroes h on h.user_id = m.user_id where m.guild_id = ${me.id} order by wins desc, h.level desc`;
    const log = await sql`select created_at, html from guild_log where guild_id = ${me.id} order by id desc limit 20`;
    const pr = await guildProgress(me.id);
    await ensureWars(weekNow());
    const [stars] = await sql`select stars from guilds where id = ${me.id}`; me.stars = stars ? stars.stars : me.stars;
    const war = await warOf(me.id, weekNow()), last = await warOf(me.id, prevWeek());
    if (last) { last.won = last.mine > last.theirs; const [mw] = await sql`select wins from member_weeks where user_id = ${user.id} and week = ${prevWeek()} and guild_id = ${me.id}`;
      last.eligible = !!(mw && mw.wins > 0) && Date.parse(me.joined_at) <= Date.parse(prevWeek() + 'T00:00:00Z') + 3 * DAY; last.claimed = !!(await sql`select 1 from guild_claims where user_id = ${user.id} and week = ${prevWeek()} and goal = 100`).length; }
    return { guild: Object.assign(guildPublic(me), { stars: me.stars || 0 }), war: war, lastWar: last, warReward: WAR_REWARD, role: me.role, owner: me.owner === user.id, progress: pr, goals: GUILD_GOALS.map((g, i) => ({ w: goalFor(g, pr.members), i: i, silverM: g.silver, dust: g.dust })),
      claimed: (await sql`select goal from guild_claims where user_id = ${user.id} and week = ${weekNow()}`).map(r => r.goal), max: GUILD_MAX,
      members: members.map(m => ({ name: m.name, classId: m.class_id, level: m.level, rig: m.rig, look: m.look, role: m.role, wins: m.wins, me: m.user_id === user.id, uid: m.user_id })),
      log: log.map(l => ({ t: new Date(l.created_at).getTime(), html: l.html })) };
  }
  if (action === 'guildCreate') {
    if (me) throw new GameError('state', 'Már tagja vagy egy céhnek.');
    const name = String(args.name || '').trim().replace(/\s+/g, ' '), tag = String(args.tag || '').trim().toUpperCase();
    if (!/^[\p{L}\p{N}][\p{L}\p{N} '\-]{2,23}$/u.test(name)) throw new GameError('arg', 'A céh neve 3–24 karakter legyen: betűk, számok, szóköz vagy kötőjel.');
    if (!/^[\p{L}\p{N}]{2,4}$/u.test(tag)) throw new GameError('arg', 'A céhjel 2–4 betű vagy szám legyen.');
    const color = /^#[0-9a-fA-F]{6}$/.test(args.color) ? args.color : '#7f8cff', emblem = GUILD_EMBLEMS.indexOf(args.emblem) >= 0 ? args.emblem : 'hold';
    const motto = String(args.motto || '').trim().slice(0, 80);
    return sql.begin(async tx => {
      const save = await loadHero(tx, user.id, true);
      if (!save) throw new GameError('nohero', 'Előbb hozz létre hőst.');
      if (save.hero.level < 5) throw new GameError('state', 'Céhet az 5. szinttől alapíthatsz.');
      if (save.hero.silver < GUILD_COST) throw new GameError('state', `A céh alapítása ${GUILD_COST} Holdezüstbe kerül.`);
      let g;
      try { [g] = await tx`insert into guilds (name, tag, color, emblem, motto, owner) values (${name}, ${tag}, ${color}, ${emblem}, ${motto}, ${user.id}) returning *`; }
      catch (e) { if (/guilds_(name|tag)_key/.test(String(e.message))) throw new GameError('name', 'Ez a céhnév vagy céhjel már foglalt.'); throw e; }
      await tx`insert into guild_members (user_id, guild_id, role, week) values (${user.id}, ${g.id}, 'vezeto', ${weekNow()})`;
      save.hero.silver -= GUILD_COST;
      G.personal(save, Date.now(), `<b>${G.esc(save.hero.name)}</b> megalapította ${G.az(name)} <b>${G.esc(name)}</b> céhet.`, 'win');
      await storeHero(tx, user.id, save);
      await tx`insert into guild_log (guild_id, html) values (${g.id}, ${`<b>${G.esc(save.hero.name)}</b> megalapította a céhet.`})`;
      await tx`insert into chronicle (user_id, kind, html) values (${user.id}, 'guild', ${`Új céh alakult: <b>${G.esc(name)}</b> [${G.esc(tag)}].`})`;
      return { save: save, guild: guildPublic(g) };
    });
  }
  if (action === 'guildJoin') {
    if (me) throw new GameError('state', 'Már tagja vagy egy céhnek. Előbb lépj ki.');
    const [h] = await sql`select name from heroes where user_id = ${user.id}`;
    if (!h) throw new GameError('nohero', 'Előbb hozz létre hőst.');
    return sql.begin(async tx => { // a céh sorát zároljuk, így egyszerre érkező csatlakozások sem lépik túl a létszámot
      const [g] = await tx`select * from guilds where id = ${Number(args.id) || 0} for update`;
      if (!g) throw new GameError('arg', 'Nincs ilyen céh.');
      const [c] = await tx`select count(*)::int as n from guild_members where guild_id = ${g.id}`;
      if (c.n >= GUILD_MAX) throw new GameError('state', 'Ez a céh betelt.');
      try { await tx`insert into guild_members (user_id, guild_id, week) values (${user.id}, ${g.id}, ${weekNow()})`; }
      catch (e) { if (/guild_members_pkey/.test(String(e.message))) throw new GameError('state', 'Már tagja vagy egy céhnek.'); throw e; }
      await tx`insert into guild_log (guild_id, html) values (${g.id}, ${`<b>${G.esc(h.name)}</b> csatlakozott a céhhez.`})`;
      return { guild: guildPublic(g) };
    });
  }
  if (action === 'guildLeave' || action === 'guildKick') {
    if (!me) throw new GameError('state', 'Nem vagy tagja céhnek.');
    const target = action === 'guildKick' ? String(args.uid || '') : user.id;
    if (!/^[0-9a-f-]{36}$/i.test(target)) throw new GameError('arg', 'Nincs ilyen tag.');
    if (action === 'guildKick' && me.owner !== user.id) throw new GameError('state', 'Csak a céh vezetője küldhet el tagot.');
    if (target === me.owner && action === 'guildKick') throw new GameError('state', 'Saját magadat nem küldheted el.');
    const [h] = await sql`select name from heroes where user_id = ${target}`;
    const del = await sql`delete from guild_members where user_id = ${target} and guild_id = ${me.id} returning user_id`;
    if (!del.length) throw new GameError('arg', 'Nincs ilyen tag.');
    if (target === me.owner) { // a vezető kilépett: a legrégebbi tag lesz az új vezető; ha senki nem maradt, a céh megszűnik
      const [next] = await sql`select user_id from guild_members where guild_id = ${me.id} order by joined_at limit 1`;
      if (next) { await sql`update guilds set owner = ${next.user_id} where id = ${me.id}`; await sql`update guild_members set role = 'vezeto' where user_id = ${next.user_id}`; }
      else { await sql`delete from guilds where id = ${me.id}`; return { left: true, disbanded: true }; }
    }
    await guildLog(me.id, action === 'guildKick' ? `<b>${G.esc(h ? h.name : '?')}</b> már nem tagja a céhnek.` : `<b>${G.esc(h ? h.name : '?')}</b> kilépett a céhből.`);
    return { left: true };
  }
  if (action === 'guildClaim') {
    if (!me) throw new GameError('state', 'Nem vagy tagja céhnek.');
    const i = Number(args.i) | 0, goal = GUILD_GOALS[i];
    if (!goal) throw new GameError('arg', 'Nincs ilyen cél.');
    const pr = await guildProgress(me.id);
    if (pr.wins < goalFor(goal, pr.members)) throw new GameError('state', `Ehhez a céhnek ${goalFor(goal, pr.members)} győzelem kell ezen a héten.`);
    if (!(me.week === weekNow() && me.week_wins > 0)) throw new GameError('state', 'A céhcél jutalmához ezen a héten legalább egy győzelemmel hozzá kell járulnod.');
    return sql.begin(async tx => {
      const [m] = await tx`select week, claimed from guild_members where user_id = ${user.id} for update`;
      if (!m) throw new GameError('state', 'Nem vagy tagja céhnek.');
      const claimed = m.week === weekNow() ? (m.claimed || []) : [];
      // a jutalom felhasználónként, hetente, célonként egyszer jár (külön táblában, így ki- és visszalépéssel sem kérhető újra)
      const ins = await tx`insert into guild_claims (user_id, week, goal) values (${user.id}, ${weekNow()}, ${i}) on conflict do nothing returning goal`;
      if (!ins.length) throw new GameError('state', 'Ezt a jutalmat ezen a héten már átvetted.');
      const save = await loadHero(tx, user.id, true);
      const out = { silver: Math.round(E.silverBase(save.hero.level) * goal.silver), dust: goal.dust };
      save.hero.silver += out.silver; out.dust = E.addDust(save, save.hero, out.dust, Date.now());
      await storeHero(tx, user.id, save);
      await tx`update guild_members set week = ${weekNow()}, claimed = ${claimed.concat([i])} where user_id = ${user.id}`;
      return { save: save, out: out };
    });
  }
  if (action === 'guildWarClaim') {
    if (!me) throw new GameError('state', 'Nem vagy tagja céhnek.');
    const pw = prevWeek(), last = await warOf(me.id, pw);
    if (!last) throw new GameError('state', 'A céhed múlt héten nem harcolt.');
    if (!(last.mine > last.theirs)) throw new GameError('state', 'A múlt heti céhháborút nem ti nyertétek.');
    const [mw] = await sql`select wins from member_weeks where user_id = ${user.id} and week = ${pw} and guild_id = ${me.id}`;
    if (!(mw && mw.wins > 0)) throw new GameError('state', 'A jutalom azoknak jár, akik a múlt héten legalább egy győzelemmel hozzájárultak.');
    // céhugrálás ellen: a háború hetének csütörtökéig csatlakozni kellett
    if (Date.parse(me.joined_at) > Date.parse(pw + 'T00:00:00Z') + 3 * DAY) throw new GameError('state', 'A jutalom azoknak jár, akik a háború hetének csütörtökéig csatlakoztak a céhhez.');
    return sql.begin(async tx => {
      const ins = await tx`insert into guild_claims (user_id, week, goal) values (${user.id}, ${pw}, 100) on conflict do nothing returning goal`;
      if (!ins.length) throw new GameError('state', 'Ezt a jutalmat már átvetted.');
      const save = await loadHero(tx, user.id, true);
      const out = { silver: Math.round(E.silverBase(save.hero.level) * WAR_REWARD.silver) };
      save.hero.silver += out.silver; out.dust = E.addDust(save, save.hero, WAR_REWARD.dust, Date.now());
      await storeHero(tx, user.id, save);
      return { save: save, out: out };
    });
  }
  throw new GameError('action', 'Ismeretlen művelet.');
}

// ---------- profil: egy másik hős nyilvános adatai ----------
async function profile(user, args) {
  const name = String(args.name || '').trim();
  const [r] = await sql`select h.user_id, h.save, g.name as gname, g.tag, g.color, g.emblem, g.stars, g.id as gid from ${ALLH(sql)} h
                        left join guild_members m on m.user_id = h.user_id left join guilds g on g.id = m.guild_id where lower(h.name) = lower(${name})`;
  if (!r) throw new GameError('arg', 'Nincs ilyen hős.');
  const titles = await sql`select title from boss_participants where user_id = ${r.user_id} and title is not null order by boss_id desc limit 5`;
  return Object.assign(X.profileOf(r.save), { guild: r.gid ? { id: Number(r.gid), name: r.gname, tag: r.tag, color: r.color, emblem: r.emblem, stars: r.stars || 0 } : null, titles: titles.map(t => t.title), me: r.user_id === user.id });
}

async function handle(req) {
  const origin = req.headers.get('Origin') || '';
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) });
  if (req.method !== 'POST') return json({ error: 'Csak POST.' }, 405, origin);
  try {
    const user = await authUser(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || ''), args = body.args || {};
    await sql`insert into players (user_id, discord_id, discord_name, avatar_url) values (${user.id}, ${user.discordId}, ${user.name}, ${user.avatar})
              on conflict (user_id) do update set discord_name = excluded.discord_name, avatar_url = excluded.avatar_url, discord_id = excluded.discord_id`;
    const [player] = await sql`select * from players where user_id = ${user.id}`;
    if (player.banned) throw new GameError('banned', 'A fiókodat egy admin felfüggesztette.', 403);

    if (action === 'verify') {
      const guild = env('NYXORIA_GUILD_ID');
      if (!guild) { await sql`update players set verified_at = coalesce(verified_at, now()) where user_id = ${user.id}`; return json({ ok: true, verified: true }, 200, origin); }
      if (!args.providerToken) return json({ ok: false, code: 'token', error: 'Jelentkezz be újra Discorddal.' }, 200, origin);
      const r = await fetch('https://discord.com/api/v10/users/@me/guilds', { headers: { Authorization: 'Bearer ' + args.providerToken } });
      if (!r.ok) return json({ ok: false, code: 'token', error: 'A Discord most nem válaszolt. Jelentkezz be újra.' }, 200, origin);
      const guilds = await r.json();
      const member = Array.isArray(guilds) && guilds.some(g => g.id === guild);
      if (!member) return json({ ok: false, code: 'not_member', error: 'Ezzel a Discord-fiókkal nem vagy tagja a Nyxoria szervernek.' }, 200, origin);
      await sql`update players set verified_at = now() where user_id = ${user.id}`;
      return json({ ok: true, verified: true }, 200, origin);
    }
    if (env('NYXORIA_GUILD_ID') && !player.verified_at) throw new GameError('verify', 'Előbb ellenőrizzük a Nyxoria-tagságodat.', 403);

    if (action === 'state') return json(await statePayload(user, player), 200, origin);
    if (action === 'ranks') return json(await ranks(user, args), 200, origin);
    if (action === 'profile') return json({ result: await profile(user, args) }, 200, origin);
    if (action === 'admin') return json(await admin(user, player, args), 200, origin);

    if (action === 'create') {
      const now = Date.now();
      const save = G.createSave(args, now);
      G.refreshOffers(save);
      if (await nameTaken(sql, save.hero.name)) throw new GameError('name', 'Ez a név már foglalt, válassz másikat.');
      try {
        await sql`insert into heroes (user_id, name, class_id, save) values (${user.id}, ${save.hero.name}, ${save.hero.classId}, ${sql.json(save)})`;
      } catch (e) {
        if (String(e.message).indexOf('heroes_name_key') >= 0) throw new GameError('name', 'Ez a név már foglalt, válassz másikat.');
        if (String(e.message).indexOf('heroes_pkey') >= 0) throw new GameError('state', 'Neked már van hősöd.');
        throw e;
      }
      await storeHero(sql, user.id, save);
      await chronicle(user.id, 'new', `Új hős érkezett: <b>${G.esc(save.hero.name)}</b>, ${G.az(D.PEOPLES[save.hero.people].name)} ${D.PEOPLES[save.hero.people].name.toLowerCase()} ${D.CLASSES[save.hero.classId].name.toLowerCase()}. Üdv a Nyxorián!`, true);
      return json({ save: G.sanitize(save), result: {} }, 200, origin);
    }
    if (action === 'heroNew' || action === 'heroSwitch' || action === 'heroDelete') {
      try { await heroAction(user, action, args); }
      catch (e) { if (String(e.message).indexOf('name_key') >= 0) throw new GameError('name', 'Ez a név már foglalt, válassz másikat.'); throw e; }
      return json(await statePayload(user, player), 200, origin);
    }
    if (action === 'bossHit') { const r = await bossHit(user, args); return json({ save: G.sanitize(r.save), result: r.out }, 200, origin); }
    if (action.indexOf('guild') === 0) {
      const r = await guildAction(user, action, args);
      if (r && r.save) { const sv = r.save; delete r.save; return json(Object.assign({ save: G.sanitize(sv), result: r.out || r }, {}), 200, origin); }
      return json({ result: r }, 200, origin);
    }
    if (action === 'bossClaim') { const r = await bossClaim(user, args); return json({ save: G.sanitize(r.save), result: r.out }, 200, origin); }

    if (!G.actions[action]) throw new GameError('action', 'Ismeretlen művelet.');
    const r = await sql.begin(async tx => {
      const save = await loadHero(tx, user.id, true);
      if (!save) throw new GameError('nohero', 'Előbb hozz létre hőst.');
      const world = await worldState(tx);
      const ctx = { now: Date.now(), median: world.median };
      if (action === 'arenaFind') ctx.arenaPool = await arenaPool(user.id, save);
      if (action === 'arenaFight') { const c = save.arena && save.arena.cands && save.arena.cands[Number(args.i) | 0]; if (c && c.uid) ctx.arenaOpp = await heroOf(c.uid, c.name); }
      if (action === 'teamFind') ctx.teamPool = await teamPool(user.id, save);
      if (action === 'teamFight' && Array.isArray(args.ids)) args.ids = args.ids.map(x => Number(x) | 0).filter((x, k, a) => a.indexOf(x) === k).slice(0, 2);
      if (action === 'teamFight' && save.team && Array.isArray(args.ids)) ctx.teamHeroes = await Promise.all(args.ids.map(i => { const c = save.team.cands[Number(i) | 0]; return c && c.uid ? heroOf(c.uid, c.name) : null; }));
      const out = G.run(save, action, args, ctx);
      await storeHero(tx, user.id, save);
      if (LOGGED.indexOf(action) >= 0) {
        const info = action === 'fight' ? { win: save.pendingResult && save.pendingResult.win, diff: save.expedition && save.expedition.offer.diff, lvl: save.hero.level } : args;
        await tx`insert into action_log (user_id, action, info) values (${user.id}, ${action}, ${tx.json(info)})`;
      }
      return { save, out };
    });
    await publishEvents(user.id, r.out.events);
    const res = r.out.result || {};
    // céh: minden győzelem beleszámít a heti közös célba
    const won = action === 'fight' ? !!(r.save.pendingResult && r.save.pendingResult.win && !r.save.pendingResult.tired) : !!(res.out && res.out.win);
    if (WIN_ACTIONS.indexOf(action) >= 0 && won) await noteWin(user.id);
    // csapatküldetés: a valódi társak gazdái is kapnak részt (a következő belépéskor íródik jóvá)
    if (action === 'teamFight' && res.out && res.out.share) for (const sh of res.out.share) {
      await sql`insert into pending_rewards (user_id, silver, dust, html) values (${sh.uid}, ${sh.silver}, ${sh.dust}, ${`<b>${G.esc(r.save.hero.name)}</b> magával vitt egy csapatküldetésre, és győztetek: +${sh.silver} Holdezüst, +${sh.dust} Csillagpor.`})`;
    }
    if (res.out) delete res.out.share;
    return json({ save: G.sanitize(r.save), result: res }, 200, origin);
  } catch (e) {
    if (e instanceof GameError) return json({ error: e.message, code: e.code }, e.status, origin);
    if (e && e.code && typeof e.message === 'string' && !e.severity) return json({ error: e.message, code: e.code }, 400, origin); // a játéklogika hibái
    console.error(e);
    return json({ error: 'Valami elromlott a szerveren. Próbáld újra egy kicsit később.' }, 500, origin);
  }
}

Deno.serve(handle);
