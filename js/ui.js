/* Nyxoria RPG – felület. Két módban fut:
   - közös (online): Discord-belépés, a szerver dönt mindenről (js/config.js-ben a Supabase adatai);
   - gyakorló (offline): ha nincs beállítva szerver, minden a böngészőben fut és ott mentődik. */
(function () {
  'use strict';
  const D = NYX.data, E = NYX.engine, G = NYX.game, A = NYX.art, I = A.icons, esc = A.esc, X = NYX.game.extra;
  const CFG = window.NYX_CONFIG || {};
  const QS = new URLSearchParams(location.search);
  const TEST_API = QS.get('api'), TEST_TOKEN = QS.get('token');
  const ONLINE = !!((CFG.supabaseUrl && CFG.supabaseKey) || TEST_API);
  const SAVE_KEY = 'nyxoria.save.v1', SLOTS_KEY = 'nyxoria.slots.v1', MAX_HEROES = 3;
  const DEV = !ONLINE && QS.get('dev') === '1';
  const app = document.getElementById('app');

  const NAMES = ['Lumi', 'Nox', 'Bodza', 'Szirom', 'Holdfi', 'Ködvirág', 'Ében', 'Csillo', 'Vadóc', 'Hollós', 'Zsálya', 'Borostyán', 'Tüske', 'Mirtusz', 'Fenyő', 'Szellő', 'Kökény', 'Éjke', 'Rézi', 'Vándor'];
  const STAT_NAMES = { elet: 'ÉLET', tam: 'TÁM', ved: 'VÉD', fur: 'FÜR' };
  const SCREENS = ONLINE
    ? [['kaland', 'Kaland', 'map'], ['hos', 'Hős', 'user'], ['taska', 'Táska', 'bag'], ['boss', 'Heti szörny', 'boss'], ['kozosseg', 'Közösség', 'scroll']]
    : [['kaland', 'Kaland', 'map'], ['hos', 'Hős', 'user'], ['taska', 'Táska', 'bag'], ['kozosseg', 'Krónika', 'scroll']];
  const RANK_TABS = [['szint', 'Szint'], ['boss', 'Heti szörny'], ['arena', 'Aréna'], ['torony', 'Holdtorony'], ['ceh', 'Céhek'], ['ujonc', 'Újoncok'], ['gyujto', 'Gyűjtők'], ['ero', 'Harcerő']];
  const RANK_UNIT = { szint: 'TP', boss: 'sebzés', arena: 'pont', torony: 'emelet', ceh: 'győzelem', ujonc: 'TP', gyujto: 'legendás', ero: 'harcerő' };

  // ---------- állapot ----------
  const S = {
    phase: 'boot', // boot | login | notmember | error | creator | game
    save: null, screen: 'kaland', creator: null, combat: null, slot: 'fegyver', modal: null, owl: null,
    confirmReset: false, showExport: false, busy: false,
    me: null, world: null, boss: null, bossMine: [], titles: [], chronicle: [], chronTab: 'kozos', ranks: {}, rankTab: 'szint',
    adminStats: null, loginError: '', seenResult: null, sb: null, session: null
  };

  function now() { return Date.now() + (S.save ? (S.save.devOffset || 0) : 0); }
  function hero() { return S.save && S.save.hero; }
  function fmt(n) { return Math.round(n).toLocaleString('hu-HU'); }
  function pct(x) { return Math.round(x * 100) + '%'; }
  function dec(x, d) { return x.toFixed(d == null ? 1 : d).replace('.', ','); }
  function art(name) { return /^(A|Az) /.test(name) ? name : (/^[AÁEÉIÍOÓÖŐUÚÜŰ]/i.test(name) ? 'Az ' : 'A ') + name; }
  function region(id) { return D.REGIONS.filter(r => r.id === id)[0] || D.REGIONS[0]; }
  function cls(h) { return D.CLASSES[(h || hero()).classId]; }
  function el(id) { return document.getElementById(id); }

  // ---------- helyi mentés (gyakorló mód) ----------
  function loadLocal() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || s.version !== 1 || !s.hero) return null;
      if (!s.buffs) s.buffs = {};
      return s;
    } catch (e) { return null; }
  }
  function persist() {
    if (ONLINE || !S.save) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S.save)); } catch (e) { /* tele vagy tiltott tároló: a játék megy tovább */ }
  }
  // gyakorló módban a pihenő hősök is a böngészőben vannak (legfeljebb 2 a játszott mellett)
  function localSlots() { try { const a = JSON.parse(localStorage.getItem(SLOTS_KEY) || '[]'); return Array.isArray(a) ? a.filter(x => x && x.save && x.save.hero) : []; } catch (e) { return []; } }
  function saveSlots(a) { try { localStorage.setItem(SLOTS_KEY, JSON.stringify(a)); } catch (e) { /* tele vagy tiltott tároló */ } }
  function slotInfo(x) { const h = x.save.hero; return { slot: x.slot, name: h.name, classId: h.classId, people: h.people, level: h.level, rig: h.rig || null, look: h.look || null, path: h.path }; }
  function heroList() { return ONLINE ? (S.heroes || []) : localSlots().map(slotInfo); }
  // hőscsere gyakorló módban: ugyanaz a szabály, mint a szerveren (a napi ajándék a fiókhoz tartozik)
  function localHeroAction(action, args) {
    const slots = localSlots(), cur = S.save;
    if (action === 'heroNew') {
      if (slots.length + 1 >= MAX_HEROES) { const e = new Error(`Legfeljebb ${MAX_HEROES} hősöd lehet. Előbb törölj egyet a pihenő hőseid közül.`); e.code = 'state'; throw e; }
      const sv = G.createSave(args, Date.now());
      if (slots.some(x => x.save.hero.name.toLowerCase() === sv.hero.name.toLowerCase()) || (cur && cur.hero.name.toLowerCase() === sv.hero.name.toLowerCase())) { const e = new Error('Ez a név már foglalt, válassz másikat.'); e.code = 'name'; throw e; }
      sv.gift = cur && cur.gift; if (cur) { sv.settings = Object.assign({}, sv.settings, cur.settings || {}); sv.seenTips = Object.assign({}, cur.seenTips || {}); } G.refreshOffers(sv);
      slots.push({ slot: [1, 2].filter(n => !slots.some(x => x.slot === n))[0], save: cur });
      S.save = sv;
    } else {
      const i = slots.findIndex(x => x.slot === Number(args.slot));
      if (i < 0) throw new Error('Ezen a helyen nincs hős.');
      if (action === 'heroDelete') slots.splice(i, 1);
      else { const nx = slots[i].save; nx.gift = cur.gift; slots[i] = { slot: slots[i].slot, save: cur }; S.save = nx; if (!S.save.buffs) S.save.buffs = {}; G.refreshOffers(S.save); }
    }
    saveSlots(slots); persist();
    return {};
  }
  function toast(text) {
    document.querySelectorAll('.toast').forEach(n => n.remove());
    const t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2700);
  }
  function tip(key) {
    // egyszerre egy tipp; ha a korábbi egy másik képernyőhöz tartozik, az új veszi át a helyét (a régi később újra jön)
    if (!S.save || !S.save.settings.owl || S.save.seenTips[key] || (S.owl && S.owlScreen === S.screen)) return;
    S.owl = key; S.owlScreen = S.screen;
  }

  // ---------- szerver ----------
  class ApiError extends Error { constructor(msg, code, status) { super(msg); this.code = code; this.status = status; } }
  async function token() {
    if (TEST_TOKEN) return TEST_TOKEN;
    const { data } = await S.sb.auth.getSession();
    S.session = data.session;
    if (!data.session) throw new ApiError('Jelentkezz be újra.', 'auth', 401);
    return data.session.access_token;
  }
  async function remote(action, args) {
    const url = TEST_API || (CFG.supabaseUrl.replace(/\/$/, '') + '/functions/v1/' + (CFG.functionName || 'nyx'));
    let r;
    try {
      r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await token(), apikey: CFG.supabaseKey || '' }, body: JSON.stringify({ action: action, args: args || {} }) });
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError('Nem érem el a szervert. Ellenőrizd az internetet, és próbáld újra.', 'net', 0);
    }
    const j = await r.json().catch(() => ({ error: 'Furcsa választ kaptam a szervertől.' }));
    if (!r.ok || j.error) throw new ApiError(j.error || 'Hiba történt.', j.code, r.status);
    return j;
  }
  // Egy játékművelet: a szerveren vagy (gyakorló módban) helyben
  async function api(action, args) {
    if (ONLINE) {
      const j = await remote(action, args);
      if (j.save) S.save = j.save;
      return j.result || {};
    }
    if (action === 'create') { S.save = G.createSave(args, Date.now()); G.refreshOffers(S.save); persist(); return {}; }
    if (action === 'heroNew' || action === 'heroSwitch' || action === 'heroDelete') return localHeroAction(action, args);
    const out = G.run(S.save, action, args, { now: now(), median: 0 });
    persist();
    return out.result || {};
  }
  // Gombnyomásból indított művelet: zárolás, hibaüzenet, újrarajzolás
  // a hős összes legendás tárgyának azonosítója (a látványos felfedéshez: mi érkezett újonnan)
  function legendIds() { const h = S.save && S.save.hero; if (!h) return {}; const o = {}; D.SLOT_ORDER.map(k => h.equipped[k]).filter(Boolean).concat(h.inventory || []).forEach(it => { if (it.rarity === 'legendas') o[it.id] = it; }); return o; }
  // könnyű műveletek (taktika, képességsorrend, beállítások): azonnal itt hajtjuk végre, a szerver a háttérben követi
  // (nem kell megvárni a hálózatot, így nem „akad” a kattintás; ha a szerver mást mond, az ő mentése az érvényes)
  const OPTIMISTIC = { tactic: 1, skillMove: 1, settings: 1, tip: 1, lookPick: 1 };
  let optSeq = 0;
  async function act(action, args, after) {
    if (ONLINE && OPTIMISTIC[action] && !S.busy && S.save) {
      try { G.run(S.save, action, args || {}, { now: now(), median: 0 }); } catch (e) { handleError(e); render(); return; }
      render();
      const my = ++optSeq;
      try { const j = await remote(action, args); if (my === optSeq && j.save && !S.busy) { S.save = j.save; render(); } if (after) await after(j.result || {}); }
      catch (e) { handleError(e); if (ONLINE) refreshState().then(render).catch(() => {}); }
      return;
    }
    if (S.busy) return;
    S.busy = true; document.body.classList.add('busy');
    const before = legendIds();
    try {
      const res = await api(action, args);
      const nowL = legendIds(), fresh = Object.keys(nowL).filter(k => !before[k] && !nowL[k].converted).map(k => nowL[k]);
      if (fresh.length && action !== 'equip' && action.indexOf('hero') !== 0) S.legendQueue = (S.legendQueue || []).concat(fresh);
      if (after) await after(res);
    } catch (e) {
      handleError(e);
    } finally {
      S.busy = false; document.body.classList.remove('busy');
      render();
    }
  }
  function handleError(e) {
    if (e && e.status === 401) { S.phase = 'login'; S.loginError = e.message; return; }
    if (e && e.code === 'verify') { S.phase = 'login'; S.loginError = 'Jelentkezz be újra, hogy ellenőrizni tudjuk a Nyxoria-tagságodat.'; return; }
    if (e && e.code === 'banned') { S.phase = 'error'; S.loginError = e.message; return; }
    toast((e && e.message) || 'Hiba történt.');
    if (!(e instanceof ApiError)) console.error(e);
  }
  async function refreshState() {
    const j = await remote('state');
    S.me = j.me; S.world = j.world; S.boss = j.boss; S.guild = j.guild || null; S.heroes = j.heroes || []; S.notice = j.notice || null; S.bossMine = j.bossMine || []; S.titles = j.titles || []; S.chronicle = j.chronicle || [];
    if (!S.combat && !S.busy) S.save = j.save;
    return j;
  }

  // ---------- ikonos apróságok ----------
  // festett ikonok (js/icons*.js); ha valamelyik hiányzik, a régi vonalas ikon marad
  const NXI = window.NYX.icons;
  const icx = (kind, key, fb) => (NXI && NXI.has(kind, key) ? NXI.svg(kind, key) : (fb || ''));
  // a pénzek és a fáklya régi, vonalas jele helyett mindenhol (gombokban, listákban) a festett ikon
  // (getterrel: minden felhasználás saját azonosítókat kap)
  if (NXI) [['dust', 'csillagpor-bare'], ['silver', 'holdezust-bare'], ['torch', 'fakla-bare'], ['rested', 'frissesseg-bare'], ['xp', 'tp-bare']].forEach(([o, n]) => { if (NXI.has('misc', n)) Object.defineProperty(I, o, { get: () => NXI.svg('misc', n), configurable: true }); });
  function itemIcon(item) {
    const pic = NXI ? NXI.item(item) : '';
    return `<span class="item-ic r-${item.rarity}${item.mythic ? ' mythic' : ''}${pic ? ' painted' : ''}">${pic || I[item.slot]}${item.plus ? `<span class="plus">+${item.plus}</span>` : ''}</span>`;
  }
  function skillIc(id, locked) { const pic = icx('skill', id); return pic ? `<span class="sk-ic${locked ? ' locked' : ''}" aria-hidden="true">${pic}</span>` : ''; }
  function itemStatLines(item) {
    const s = E.itemStats(item), parts = [];
    ['tam', 'elet', 'ved', 'fur'].forEach(k => { if (s[k] > 0.05) parts.push(`+${fmt(s[k])} ${STAT_NAMES[k]}`); });
    let html = parts.join(' · ');
    (item.affixes || []).forEach(a => { html += `<br><span class="aff">${esc(E.affixText(a))}</span>`; });
    return html;
  }
  function deltaHtml(item) {
    const d = E.powerDelta(hero(), item);
    if (d > 0.05) return `<span class="delta up">${I.up}+${fmt(Math.max(1, d))} harcerő</span>`;
    if (d < -0.05) return `<span class="delta down">${I.down}−${fmt(Math.max(1, -d))} harcerő</span>`;
    return `<span class="delta same">ugyanolyan erős</span>`;
  }
  function itemHtml(item, opts) {
    opts = opts || {};
    const rar = D.RARITIES[item.rarity];
    return `<div class="item">${itemIcon(item)}<div style="min-width:0">
      <div class="item-name r-${item.rarity}">${item.mythic ? '✦ ' : ''}${esc(item.name)}${item.plus ? ` +${item.plus}` : ''}</div>
      <div class="item-meta">${D.SLOTS[item.slot].name} · ${item.level}. szint · ${item.mythic ? 'mitikus' : rar.name}${item.plus ? (item.plus > E.maxPlus(item) ? ` · +${item.plus} (tovább nem fejleszthető)` : ` · +${item.plus} / +${E.maxPlus(item)}`) : ''}</div>
      <div class="item-stats">${itemStatLines(item)}</div>${item.line ? `<div class="item-line">„${esc(item.line)}”</div>` : ''}
      ${opts.delta ? `<div style="margin-top:4px">${deltaHtml(item)}</div>` : ''}
    </div></div>`;
  }
  function torchesHtml(t) {
    let h = '<div class="torches" aria-hidden="true">';
    for (let i = 0; i < E.TORCH.max; i++) h += `<span class="torch ${i < t.count ? 'on' : 'off'}">${I.torch}</span>`;
    return h + '</div>';
  }
  function timeLeft(ms) {
    const m = Math.max(0, Math.ceil(ms / 60000)), h = Math.floor(m / 60), d = Math.floor(h / 24);
    if (d) return h % 24 ? `${d} nap ${h % 24} óra` : `${d} nap`;
    return h ? (m % 60 ? `${h} óra ${m % 60} perc` : `${h} óra`) : `${m} perc`;
  }
  function torchText(t) {
    if (t.count >= E.TORCH.max) return t.rested >= E.TORCH.restedMax ? 'Minden fáklyád ég, és a Frissességed is tele van.' : `Minden fáklyád ég. ${timeLeft(t.nextIn)} múlva Frissességet kezdesz gyűjteni.`;
    return `Következő fáklya: <b data-torch-timer>${timeLeft(t.nextIn)}</b>`;
  }
  function statGrid(s) {
    return `<div class="stats">
      <div class="stat">${icx('misc', 'elet-bare', I.heart)}<div><span>ÉLET</span><b>${fmt(s.elet)}</b></div></div>
      <div class="stat">${icx('misc', 'tam-bare', I.sword)}<div><span>TÁM</span><b>${fmt(s.tam)}</b></div></div>
      <div class="stat">${icx('misc', 'ved-bare', I.shield)}<div><span>VÉD</span><b>${fmt(s.ved)}</b></div></div>
      <div class="stat">${icx('misc', 'fur-bare', I.wing)}<div><span>FÜR</span><b>${fmt(s.fur)}</b></div></div>
    </div><p class="small muted stat-legend" style="font-size:12px;line-height:1.4">ÉLET: életerő · TÁM: támadás · VÉD: védekezés · FÜR: fürgeség (kitérés, telitalálat) · TP: tapasztalat</p>`;
  }
  function xpBar(h) {
    const need = E.xpNeeded(h.level), max = h.level >= E.MAX_LEVEL;
    return `<div class="bar xp" role="progressbar" aria-label="Tapasztalat" aria-valuemin="0" aria-valuemax="${need}" aria-valuenow="${h.xp}"><i style="width:${max ? 100 : Math.min(100, h.xp / need * 100)}%"></i></div>
      <div class="bar-label"><span>${max ? 'Legmagasabb szint' : `${fmt(h.xp)} / ${fmt(need)} TP`}</span><span>${h.level}. szint</span></div>`;
  }
  function xpMultNow() {
    if (!S.save) return 1;
    const w = ONLINE && S.world ? G.wind(hero().level, S.world.median) : 1;
    const b = S.save.buffs && S.save.buffs.xpUntil > now() ? 1.25 : 1;
    return w * b;
  }

  // ---------- keret ----------
  function topbar() {
    const h = hero(), t = E.torchState(S.save, now());
    const tabs = SCREENS.map(([id, label, ic]) => `<button data-act="screen" data-v="${id}" ${S.screen === id ? 'aria-current="page"' : ''}>${I[ic]}${label}</button>`).join('');
    return `<header class="topbar">
      <div class="logo">${A.LOGO}<span class="logo-text">Nyxoria</span>${ONLINE ? '' : '<span class="badge" style="margin-left:4px">GYAKORLÓ</span>'}</div>
      <nav class="tabs" aria-label="Fő menü">${tabs}</nav>
      <div class="wallet">
        <span class="coin" title="Fáklyák">${I.torch.replace('<svg', '<svg width="14" height="20"')}${t.count}<small>/${E.TORCH.max}</small></span>
        ${t.rested ? `<span class="coin opt" title="Frissesség: dupla tapasztalat">${I.rested}${t.rested}</span>` : ''}
        <span class="coin" title="Holdezüst">${I.silver}${fmt(h.silver)}</span>
        <span class="coin" title="Csillagpor">${I.dust}${fmt(h.dust)}</span>
        <button class="icon-btn" data-act="screen" data-v="beallitas" aria-label="Beállítások">${S.me && S.me.avatar ? `<img src="${esc(S.me.avatar)}" alt="" width="28" height="28" style="border-radius:50%">` : I.gear}</button>
      </div>
    </header>`;
  }
  function bottomnav() {
    return `<nav class="bottomnav" style="grid-template-columns:repeat(${SCREENS.length},1fr)" aria-label="Fő menü">${SCREENS.map(([id, label, ic]) =>
      `<button data-act="screen" data-v="${id}" ${S.screen === id ? 'aria-current="page"' : ''}>${I[ic]}${label}</button>`).join('')}</nav>`;
  }
  function heroCard(noName) {
    const h = hero(), s = E.heroStats(h), c = cls(h);
    return `<div class="panel hero-card">
        <div class="portrait">${A.heroSvg(h)}</div>
        ${noName ? '' : `<div class="hero-name">${esc(h.name)}</div>`}
        <div class="hero-sub">${D.PEOPLES[h.people].name} ${c.name.toLowerCase()}${noName ? '' : ` · ${h.level}. szint`}</div>
        ${S.titles && S.titles[0] ? `<div class="badge" style="margin-top:6px;color:var(--fakla-300)">${esc(S.titles[0])}</div>` : ''}
        <div style="margin-top:10px;text-align:left">${xpBar(h)}</div>
        ${noName ? '' : statsHtml(s)}
      </div>`;
  }
  function statsHtml(s) { return `${statGrid(s)}<div class="power"><span class="tiny" style="color:var(--fakla-300)">${icx('misc', 'harcero-bare', '')}Harcerő</span><b>${fmt(E.power(s))}</b></div>`; }
  function statsPanel() { return `<div class="panel nx-stats"><div class="panel-title"><h2>Tulajdonságok</h2></div>${statsHtml(E.heroStats(hero()))}</div>`; }
  function torchPanel() {
    const t = E.torchState(S.save, now());
    return `<div class="panel">
        <div class="panel-title"><h3>Fáklyák</h3>${t.rested ? `<span class="rested">${I.rested}${t.rested} Frissesség</span>` : ''}</div>
        ${torchesHtml(t)}
        <p class="small muted" style="text-align:center;margin-top:8px">${torchText(t)}</p>
      </div>`;
  }
  function heroPanel() {
    return `<aside class="col-left" aria-label="A hősöd">
      ${heroCard()}
      ${torchPanel()}
    </aside>`;
  }
  function rightPanel() {
    const all = ONLINE ? S.chronicle : S.save.chronicle, cut = S.combat && !S.combat.done ? S.combat.chronCut : null;
    const list = cut ? all.filter(x => !(x.t > cut)) : all;
    const items = list.slice(0, 7).map(chronItem).join('') || '<p class="small muted">Még nem történt semmi. Indulj el az első kalandodra!</p>';
    const community = ONLINE ? bossMini() : `<div class="panel"><div class="panel-title"><h3>Közösség</h3><span class="badge">GYAKORLÓ MÓD</span></div>
        <div class="soon">Ez a gyakorló mód: a hősöd csak ebben a böngészőben él. A közös szerveren jön a <b>Discord-belépés</b>, a <b>heti szörny</b>, a <b>ranglisták</b> és a közös krónika.</div></div>`;
    return `<aside class="col-right" aria-label="Közösség">
      ${community}
      <div class="panel"><div class="panel-title"><h3>${ONLINE ? 'Szerver-krónika' : 'Krónika'}</h3><button class="btn ghost sm" data-act="screen" data-v="kozosseg">Mind</button></div><div class="chron">${items}</div></div>
    </aside>`;
  }
  function chronItem(c) {
    const d = new Date(c.t), today = new Date(Date.now());
    const same = d.toDateString() === today.toDateString();
    const time = (same ? 'ma ' : d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }) + ' ') + d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
    return `<div class="chron-item ${esc(c.kind)}"><span class="dot"></span><div><time>${time}</time>${c.text}</div></div>`;
  }

  // ---------- új keret: címképernyő, felső sáv, oldalsó menü, tábor-színpad, telefonos fülsáv, súgó ----------
  // Csak az jelenik meg számmal vagy jelvénnyel, ami a mentésben (és online a szerveren) tényleg létezik.
  // Ami még nincs a játékban, az a „Készülő funkciók” ablakba kerül, nem kattintható hamis tartalomként.
  const NEW_SHELL = !!A.isNew;
  const NI = { // vonalas ikonok (24×24)
    arena: '<path d="m4 20 9-9M4 16l4 4M13 11l7-7v3l-5 5M20 20l-9-9M20 16l-4 4M11 11 4 4v3l5 5"/>',
    csapat: '<circle cx="8" cy="8" r="3.2"/><circle cx="16.5" cy="9" r="2.7"/><path d="M2.5 20c.6-3.8 2.8-6 5.5-6s4.9 2.2 5.5 6M13.5 14.6c.9-.4 1.9-.6 3-.6 2.4 0 4.3 2 4.8 5.6"/>',
    ceh: '<path d="M6 21V3.5"/><path d="M6 4h12v10H6"/><path d="m12 6.5 1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z"/>',
    ajandek: '<rect x="3.5" y="9" width="17" height="11.5" rx="1.6"/><path d="M2.5 9h19v-3.2h-19zM12 5.8v14.7"/><path d="M12 5.8C10.5 3 7 3 7.2 5.2 7.4 6.6 10 5.8 12 5.8zM12 5.8c1.5-2.8 5-2.8 4.8-.6-.2 1.4-2.8.6-4.8.6z"/>',
    bolt: '<path d="M3.5 9.5 5.2 4h13.6l1.7 5.5"/><path d="M3.5 9.5c0 1.6 1.3 2.6 2.8 2.6s2.9-1 2.9-2.6c0 1.6 1.3 2.6 2.8 2.6s2.8-1 2.8-2.6c0 1.6 1.4 2.6 2.9 2.6s2.8-1 2.8-2.6"/><path d="M5 12v8.5h14V12M10 20.5v-5h4v5"/>',
    torony: '<path d="M7 21V9.5L5 8V3.5h3v2h2.5v-2h3v2H16v-2h3V8l-2 1.5V21z"/><path d="M10 21v-4.5a2 2 0 0 1 4 0V21M10.5 10.5h3"/>',
    esemeny: '<path d="M5 21V3.5"/><path d="M5 4h12.5l-2.6 4 2.6 4H5"/><path d="m11 6.4.7 1.4 1.5.2-1.1 1 .3 1.5-1.4-.7-1.4.7.3-1.5-1.1-1 1.5-.2z"/>',
    eredmeny: '<path d="M7.5 3.5h9v5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 5.5H4.5c0 3 1.3 4.6 3.4 4.8M16.5 5.5h3c0 3-1.3 4.6-3.4 4.8M12 13v3.5M8.5 20.5h7l-1-4h-5z"/>',
    kaland: '<path d="M4 6.5 9 4l6 2.5L20 4v13.5L15 20l-6-2.5L4 20z"/><path d="M9 4v13.5M15 6.5V20"/>',
    boss: '<path d="M12 3c-4.4 0-7.5 3.2-7.5 7.4 0 2.6 1.2 4.4 2.7 5.4V19h2v-2h1.6v2h2.4v-2h1.6v2h2v-3.2c1.5-1 2.7-2.8 2.7-5.4C19.5 6.2 16.4 3 12 3z"/><circle cx="9" cy="11" r="1.6"/><circle cx="15" cy="11" r="1.6"/>',
    orjarat: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2.2 5-4.8 2 2.2-5z"/>',
    karakter: '<circle cx="12" cy="7.5" r="3.8"/><path d="M4.5 21c.8-4.6 3.8-7.2 7.5-7.2s6.7 2.6 7.5 7.2"/>',
    taska: '<path d="M6 8h12l1 12.5H5z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/><path d="M9.5 12.5h5"/>',
    kinezet: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    kronika: '<path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7"/><path d="M7 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    ranglista: '<path d="M8 21h8M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 3.5M17 6h2.5a2.5 2.5 0 0 1-2.6 3.5"/>',
    discord: '<path d="M8.5 7.5c2.3-.7 4.7-.7 7 0M7.2 16.5c3.1 1.2 6.5 1.2 9.6 0"/><path d="M8 5 6.3 4.8C4.5 7.3 3.6 10.4 3.8 14c1.5 1.3 3 2.2 4.7 2.7l1-1.7M16 5l1.7-.2c1.8 2.5 2.7 5.6 2.5 9.2-1.5 1.3-3 2.2-4.7 2.7l-1-1.7"/><circle cx="9.3" cy="11.5" r="1.3"/><circle cx="14.7" cy="11.5" r="1.3"/>',
    keszulo: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="m12 12.5.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z"/>',
    beallitas: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    sugo: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.2-2.5 3.8"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
    hiba: '<path d="M8 8a4 4 0 0 1 8 0v1H8z"/><rect x="7" y="9" width="10" height="10" rx="5"/><path d="M12 12v6M4 13h3M17 13h3M5 8l2.5 2M19 8l-2.5 2M5 19l2.5-2M19 19l-2.5-2"/>',
    tabor: '<path d="M12 3c2.6 3 3.8 5 3.8 7.4a3.8 3.8 0 0 1-7.6 0C8.2 8 9.4 6 12 3z"/><path d="M12 9.5c1 1.2 1.4 2 1.4 2.8a1.4 1.4 0 0 1-2.8 0c0-.8.4-1.6 1.4-2.8z"/><path d="m4 20.5 16-4.5M4 16l16 4.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    right: '<path d="m9 5 7 7-7 7"/>',
    coins: '<ellipse cx="9" cy="7" rx="5.5" ry="2.5"/><path d="M3.5 7v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V7"/><path d="M9.5 13.5v3c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-6c0-1.4-2.5-2.5-5.5-2.5"/>'
  };
  const ni = n => `<svg class="ni" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${NI[n] || ''}</svg>`;
  // a menü egyetlen táblázata: [azonosító, név, ikon, rövid leírás, mit csinál, csak online?]
  function menuGroups() {
    const left = ONLINE && S.boss && S.boss.active ? 3 - bossHitsToday() : 0;
    const p = S.save && S.save.patrol, patrolReady = !!(p && p.end <= now());
    const g = [
      { name: 'Kaland', items: [
        { id: 'kaland', name: 'Tábor', ic: 'kaland', sub: 'Kalandok és őrjárat; egy kaland egy fáklya', go: ['screen', 'kaland'] },
        { id: 'holdkronika', name: 'Holdkrónika', ic: 'kronika', sub: 'A fő történet, fejezetről fejezetre', go: ['screen', 'holdkronika'], badge: storyBadge() },
        { id: 'orjarat', name: 'Őrjárat', ic: 'orjarat', sub: 'Amíg nem vagy itt, a hősöd felderít', go: ['goto', 'patrol'], badge: patrolReady ? ['Kész', 'az őrjárat véget ért, átveheted a jutalmat', 'ok'] : null }
      ] },
      { name: 'Naponta', items: [
        { id: 'ajandek', name: 'Napi ajándék', ic: 'ajandek', sub: 'Minden nap egy ajándék', go: ['info', 'gift'], badge: giftBadge() },
        { id: 'megbizasok', name: 'Megbízások', ic: 'kronika', sub: 'Kérések a tábor lakóitól', go: ['screen', 'megbizasok'], badge: questBadge() },
        { id: 'bolt', name: 'Vándorkereskedő', ic: 'bolt', sub: 'Naponta új áru Holdezüstért', go: ['screen', 'bolt'] }
      ] },
      { name: 'Kihívások', items: [
        { id: 'torony', name: 'Holdtorony', ic: 'torony', sub: 'Emeletről emeletre, hetente újra', go: ['screen', 'torony'], badge: towerBadge() },
        { id: 'esemeny', name: 'Heti esemény', ic: 'esemeny', sub: X ? X.currentEvent(now()).name + ', saját jutalommal' : 'Saját jutalommal', go: ['screen', 'esemeny'], badge: eventBadge() },
        { id: 'arena', name: 'Aréna', ic: 'arena', sub: 'Párbaj más játékosok hőseivel', go: ['screen', 'arena'], badge: arenaBadge() }
      ] },
      { name: 'Együtt', items: [
        ONLINE ? { id: 'boss', name: 'Heti szörny', ic: 'boss', sub: 'Az egész szerver együtt üti', go: ['screen', 'boss'], badge: left ? [String(left), `ma még ${left} ütésed van`, 'warn'] : null } : null,
        { id: 'csapat', name: 'Csapatküldetések', ic: 'csapat', sub: 'Társakkal nagyobb zsákmányért', go: ['screen', 'csapat'], badge: teamBadge() },
        { id: 'ceh', name: 'Céh', ic: 'ceh', sub: ONLINE ? (S.guild ? S.guild.name : 'Csatlakozz, vagy alapíts egyet') : 'A közös szerveren', go: ['screen', 'ceh'] }
      ] },
      { name: 'Hős', items: [
        { id: 'hos', name: 'Karakter', ic: 'karakter', sub: 'Tulajdonságok, felszerelés, képességek', go: ['screen', 'hos'] },
        { id: 'taska', name: 'Táska', ic: 'taska', sub: 'Tárgyak, szétszedés, eladás', go: ['screen', 'taska'] },
        NEW_CREATOR ? { id: 'kinezet', name: 'Kinézet', ic: 'kinezet', sub: 'Bármikor átszabhatod', go: ['screen', 'kinezet'] } : null,
        { id: 'eredmenyek', name: 'Eredmények', ic: 'eredmeny', sub: 'Trófeák és gyűjtőalbum', go: ['screen', 'eredmenyek'], badge: achBadge() },
        { id: 'profil', name: 'Profil', ic: 'karakter', sub: 'Ezt látják rólad a többiek', go: ['screen', 'profil'] },
        { id: 'hosok', name: 'Hőseim', ic: 'karakter', sub: 'Legfeljebb 3 hős, bármikor válthatsz', go: ['screen', 'hosok'] }
      ] },
      { name: 'Közösség', items: [
        { id: 'kozosseg', name: ONLINE ? 'Ranglista és krónika' : 'Krónika', ic: ONLINE ? 'ranglista' : 'kronika', sub: ONLINE ? 'Ki hol tart a szerveren' : 'A hősöd története', go: ['screen', 'kozosseg'] },
        SOON.length ? { id: 'keszulo', name: 'Készülő funkciók', ic: 'keszulo', sub: 'Ami hamarosan érkezik', go: ['info', 'keszulo'], badge: null } : null
      ] }
    ];
    g.forEach(x => { x.items = x.items.filter(Boolean); });
    return g;
  }
  const SOON = [
  ];
  function currentNav() { return S.screen === 'beallitas' ? '' : S.screen; }
  function navBtn(it, withSub) {
    const cur = it.go[0] === 'screen' && currentNav() === it.go[1];
    const badge = it.badge ? `<span class="nx-pill ${it.badge[2]}" aria-hidden="true">${esc(it.badge[0])}</span><span class="sr">, ${esc(it.badge[1])}</span>` : '';
    return `<li><button data-act="${it.go[0]}" data-v="${it.go[1]}"${cur ? ' aria-current="page"' : ''}${withSub ? '' : ` title="${esc(it.sub)}"`}>${ni(it.ic)}<span class="nm">${esc(it.name)}${withSub ? `<small>${esc(it.sub)}</small>` : ''}</span>${badge}</button></li>`;
  }
  function railHtml() {
    return `<nav class="nx-rail col-left" aria-label="Főmenü"><div class="nx-rail-scroll">${menuGroups().map((g, i) => `<section class="nx-grp" aria-labelledby="nxg-${i}"><h2 id="nxg-${i}">${g.name}</h2><ul>${g.items.map(it => navBtn(it)).join('')}</ul></section>`).join('')}</div>
      <div class="nx-rail-foot"><button class="icon-btn" data-act="help-open" aria-label="Súgó" title="Súgó"${S.screen === 'sugo' ? ' aria-current="page"' : ''}>${ni('sugo')}<small>Súgó</small></button><button class="icon-btn" data-act="info" data-v="hiba" aria-label="Hiba bejelentése" title="Hiba bejelentése">${ni('hiba')}<small>Hiba</small></button><button class="icon-btn" data-act="info" data-v="discord" aria-label="Discord-szerver" title="Discord-szerver">${ni('discord')}<small>Discord</small></button><button class="icon-btn" data-act="screen" data-v="beallitas" aria-label="Beállítások" title="Beállítások"${S.screen === 'beallitas' ? ' aria-current="page"' : ''}>${ni('beallitas')}<small>Beállítás</small></button></div></nav>`;
  }
  function newTopbar() {
    const h = hero(), t = E.torchState(S.save, now()), need = E.xpNeeded ? E.xpNeeded(h.level) : 0, xpP = need ? Math.min(100, Math.round(h.xp / need * 100)) : 0;
    const coin = (cls2, icon, val, label, aria) => `<button class="nx-coin${cls2}" data-act="info" data-v="keszletek" aria-label="${esc(aria)}">${icon}<span class="v" aria-hidden="true"><b>${val}</b><small>${label}</small></span></button>`;
    return `<header class="topbar nx-top">
      <button class="logo nx-logo" data-act="screen" data-v="kaland" aria-label="Nyxoria, vissza a táborba">${A.LOGO}<span class="logo-text">Nyxoria</span></button>${ONLINE ? '' : '<span class="badge nx-practice">GYAKORLÓ</span>'}
      <button class="nx-me" data-act="screen" data-v="hos" aria-label="${esc(h.name)}, ${h.level}. szint${need ? `, a következő szintig ${xpP} százalék` : ''}. Karakter megnyitása"><span class="pt" aria-hidden="true">${A.heroSvg(h)}</span><span class="who" aria-hidden="true"><b>${esc(h.name)}</b><span class="xpr"><span>${h.level}. szint</span>${need ? `<span class="xp"><i style="width:${xpP}%"></i></span>` : ''}</span></span></button>
      <div class="wallet nx-wallet" role="group" aria-label="Készletek">
        ${coin('', icx('misc', 'fakla-bare', I.torch.replace('<svg', '<svg width="14" height="20"')), `${t.count}/${E.TORCH.max}`, 'Fáklya', `Fáklya: ${t.count} a ${E.TORCH.max}-ből${t.count < E.TORCH.max ? `, a következő ${timeLeft(t.nextIn)} múlva` : ''}`)}
        ${t.rested ? coin(' opt', icx('misc', 'frissesseg-bare', I.rested), t.rested, 'Frissesség', `Frissesség: ${t.rested}`) : ''}
        ${coin(' opt2', icx('misc', 'holdezust-bare', I.silver), fmt(h.silver), 'Holdezüst', `Holdezüst: ${fmt(h.silver)}`)}
        ${coin(' opt3', icx('misc', 'csillagpor-bare', I.dust), fmt(h.dust), 'Csillagpor', `Csillagpor: ${fmt(h.dust)}`)}
      </div>
      ${ONLINE && S.me && S.me.admin ? `<button class="btn sm nx-admbtn" data-act="screen" data-v="admin"${S.screen === 'admin' ? ' aria-current="page"' : ''}>${ni('karakter')}Admin</button>` : ''}
      <button class="icon-btn nx-gear" data-act="screen" data-v="beallitas" aria-label="Beállítások"${S.screen === 'beallitas' ? ' aria-current="page"' : ''}>${S.me && S.me.avatar ? `<img src="${esc(S.me.avatar)}" alt="" width="28" height="28" style="border-radius:50%">` : ni('beallitas')}</button>
    </header>`;
  }
  // a Menü fülön jelzés, ha valamelyik menüpontnál vár valami (ajándék, átvehető jutalom, napi lehetőség)
  function menuPending() { let n = 0; menuGroups().forEach(g => g.items.forEach(it => { if (it.badge && ['kaland', 'hos', 'taska', 'kozosseg'].indexOf(it.id) < 0) n++; })); return n; }
  function newBottomnav() {
    const mp = menuPending();
    const tabs = [['kaland', 'Tábor', 'tabor'], ['hos', 'Hős', 'karakter'], ['taska', 'Táska', 'taska'], ['kozosseg', ONLINE ? 'Közösség' : 'Krónika', ONLINE ? 'ranglista' : 'kronika']];
    return `<nav class="bottomnav nx-tabbar" aria-label="Fő fülek">${tabs.map(([id, l, ic]) => `<button data-act="screen" data-v="${id}"${currentNav() === id ? ' aria-current="page"' : ''}>${ni(ic)}${l}</button>`).join('')}<button data-act="info" data-v="menu" class="nx-menu-btn">${ni('menu')}Menü${mp ? `<span class="nx-dot" aria-label="${mp} teendő vár">${mp}</span>` : ''}</button></nav>`;
  }
  function greetLine(n) { const h = new Date(now()).getHours(); return h < 5 ? `Még ébren vagy, ${n}?` : h < 10 ? `Jó reggelt, ${n}!` : h < 18 ? `Szia, ${n}!` : `Szép estét, ${n}!`; }
  // a tábor színpada a kalandválasztó fölött: a hős a tűz mellett, ami most vár rá, és egyetlen fő gomb
  function campStage() {
    const h = hero(), t = E.torchState(S.save, now()), offers = S.save.offers || [], rec = offers.filter(o => o.diff === 'kozepes')[0];
    const chips = [];
    if (ONLINE && S.boss && S.boss.active) { const left = 3 - bossHitsToday(); if (left) chips.push(`<button data-act="screen" data-v="boss">${ni('boss')}Heti szörny: ${left} ütésed van</button>`); }
    if (h.inventory.length >= E.INVENTORY_MAX - 3) chips.push(`<button data-act="screen" data-v="taska">${ni('taska')}${h.inventory.length >= E.INVENTORY_MAX ? 'Tele a táskád!' : 'Majdnem tele a táskád'}</button>`);
    if (h.level >= D.PATH_LEVEL && h.path == null) chips.push(`<button data-act="go-paths">${ni('karakter')}Válassz ösvényt!</button>`);
    if (X && X.giftState(S.save, now()).can) chips.push(`<button data-act="info" data-v="gift">${ni('ajandek')}Vár a napi ajándékod</button>`);
    const p = S.save.patrol;
    if (p && p.end <= now()) chips.push(`<button data-act="goto" data-v="patrol">${ni('orjarat')}Az őrjárat kész</button>`);
    else if (!p && S.save.patrolDay !== G.budapestDate(now())) chips.push(`<button data-act="goto" data-v="patrol">${ni('orjarat')}Őrjáratra küldheted a hősödet</button>`);
    const narrow = window.matchMedia ? matchMedia('(max-width: 760px)').matches : false;
    const hint = rec ? `Ajánlott: ${esc(region(rec.region).name)}, ${pct(rec.chance)} győzelmi esély.` : '';
    const torch = t.count < E.TORCH.max ? ` A következő fáklya ${timeLeft(t.nextIn)} múlva gyullad.` : t.rested ? ' Minden fáklyád ég, Frissességet gyűjtesz.' : '';
    return `<section class="nx-camp" aria-labelledby="nx-greet"><div class="nx-stage">
      ${A.sceneSvg('tabor', 4, { live: true, narrow: narrow })}
      <div class="nx-shade"></div>
      <div class="nx-greet"><h2 id="nx-greet" tabindex="-1">${esc(greetLine(h.name))}</h2><p>${t.count ? 'A tábortűz ég. Merre indulsz?' : 'Elfogytak a fáklyák, de fáradtan is mehetsz.'}</p>
        ${chips.length ? `<div class="nx-chips" role="group" aria-label="Ami most rád vár">${chips.join('')}</div>` : ''}</div>
      <div class="nx-herobox">${A.heroSvg(h, { full: true, live: true })}</div></div>
      <div class="nx-cta"><p class="nx-hint">${hint}${torch}</p><button class="btn fakla lg" data-act="goto" data-v="offers">${ni('kaland')}Kalandra fel</button></div>
    </section>`;
  }
  // tájékoztató ablakok (súgó, készletek, készülő funkciók, Discord, hiba bejelentése, menü telefonon)
  function infoModal(kind) {
    const h = hero(), t = S.save ? E.torchState(S.save, now()) : null, close = '<button class="btn primary block" data-act="modal-close">Rendben</button>';
    const wrap = (title, sub, body, foot) => `<div class="modal-back" role="dialog" aria-modal="true" aria-labelledby="nx-mt"><div class="modal nx-modal"><div class="nx-mh"><div><h2 id="nx-mt">${title}</h2>${sub ? `<p class="small muted">${sub}</p>` : ''}</div><button class="icon-btn" data-act="modal-close" aria-label="Bezárás"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><div class="nx-mb">${body}</div><div class="nx-mf">${foot || close}</div></div></div>`;
    const li = (a, b, c) => `<li><span>${a}<small>${b}</small></span>${c != null ? `<b>${c}</b>` : ''}</li>`;
    if (kind === 'keszletek' && h) return wrap('Készletek', 'Mire jók a fáklyák és a pénzek', `<ul class="nx-list">
        ${li(icx('misc', 'fakla', '') + 'Fáklya', `Egy kaland egy fáklyába kerül. ${Math.round(E.TORCH.regenMs / 60000)} percenként gyullad egy, legfeljebb ${E.TORCH.max}.${t.count < E.TORCH.max ? ` A következő ${timeLeft(t.nextIn)} múlva.` : ''}`, `${t.count} / ${E.TORCH.max}`)}
        ${li(icx('misc', 'frissesseg', '') + 'Frissesség', 'Ha minden fáklyád ég, Frissességet gyűjtesz: ennyi kalandért dupla tapasztalat jár.', fmt(t.rested))}
        ${li(icx('misc', 'holdezust', '') + 'Holdezüst', 'Ezzel vásárolsz a Vándorkereskedőnél, ebből alapítasz céhet, és ezzel sorsolod újra a tárgyak tulajdonságait.', fmt(h.silver))}
        ${li(icx('misc', 'csillagpor', '') + 'Csillagpor', 'Ezzel erősíted a tárgyaidat. Győzelmekből, őrjáratból és a tárgyak szétszedéséből kapod.', fmt(h.dust))}</ul>`);
    if (kind === 'profile') { const p = S.profileView; return wrap('Profil', '', p ? profileHtml(p) : '<p class="muted">Betöltés…</p>'); }
    if (kind === 'gift' && h && X) {
      const st = X.giftState(S.save, now()), cur = st.can ? st.next : st.streak;
      const cells = [1, 2, 3, 4, 5, 6, 7].map(n => {
        const pv = X.giftPreview(h, n), done = st.can ? n < st.next : n <= st.streak, here = st.can && n === st.next;
        const what = pv.item ? `${icx('item', 'slot-' + (n === 7 ? 'fegyver' : n === 6 ? 'amulett' : 'gyuru'), '')}<b class="r-${pv.item}">${D.RARITIES[pv.item].name} tárgy${pv.orBetter ? ` <span class="small muted">(${hero().level >= E.RARITY_GATE.legendas ? 'szerencsével lila vagy legendás' : hero().level >= E.RARITY_GATE.lila ? 'szerencsével lila' : 'később lila is lehet'})</span>` : ''}</b>` : '';
        const parts = [pv.silver ? `${I.silver}${fmt(pv.silver)}` : '', pv.dust ? `${I.dust}${fmt(pv.dust)}` : '', pv.xp ? `${I.xp}${fmt(pv.xp)} TP` : ''].filter(Boolean).join(' ');
        return `<li class="gd${done ? ' done' : ''}${here ? ' here' : ''}"><span class="n">${n}. nap</span><span class="w">${what}${parts}</span>${done ? '<span class="ok" aria-label="átvéve">✓</span>' : ''}</li>`;
      }).join('');
      const foot = st.can ? `<button class="btn fakla block" data-act="gift-claim">${ni('ajandek')}Átveszem ${azN(st.next)} ${st.next}. napi ajándékot</button>` : `<p class="small muted" style="text-align:center">A mai ajándékot már átvetted (${cur}. nap). Holnap jön a következő.</p>${close}`;
      return wrap('Napi ajándék', 'Minden nap egy ajándék. Ha egy nap kimarad, a sor elölről kezdődik.', `<ol class="nx-gift">${cells}</ol>`, foot);
    }
    if (kind === 'keszulo') return wrap('Készülő funkciók', 'Ezek még készülnek. A Discordon szólunk, amint valamelyik elindul.', `<ul class="nx-list">${SOON.map(([a, b]) => li(a, b, null)).join('')}</ul>`);
    if (kind === 'discord') return wrap('Discord-szerver', 'Csevegés, bejelentések, segítség', `<p>A Nyxoria a Discord-közösség játéka. Ott jelentjük be a heti szörnyet és az újdonságokat, és ott kérhetsz segítséget.${ONLINE ? ' A játékba is a Discord-fiókoddal lépsz be.' : ''}</p><div class="nx-note">A szerver meghívóját a Nyxoria tulajdonosától kérheted el.</div>`);
    if (kind === 'hiba') { const code = `NYX-${h ? h.level : 0}-${(h ? h.name : 'vendeg').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 12)}`; return wrap('Hiba bejelentése', 'Zárt teszt: minden észrevétel számít', `<p>Ha valami furcsát látsz, írd meg nekünk a Discordon. Segít, ha leírod, mit csináltál előtte, és ha küldesz egy képernyőképet.</p><div class="nx-note">Ezt az azonosítót másold be az üzenetedbe: <b>${esc(code)}</b></div>`, `<button class="btn primary block" data-act="copy" data-v="${esc(code)}">Azonosító kimásolása</button>`); }
    if (kind === 'sugo') return wrap('Súgó', 'Bubó, a kalauz bagoly mindent elmagyaráz', `<ul class="nx-list">
        ${li('Hogyan kezdjek?', 'Indíts egy kalandot a táborból: ez a fő játék. Három tisztáson választasz egy-egy kártyát, a végén megküzdesz az őrzővel.')}
        ${li('Mi a fáklya?', 'Egy kaland egy fáklyába kerül, a fáklyák maguktól újragyulladnak. Fáradtan is mehetsz, de kevesebb tapasztalatot és Holdezüstöt kapsz, tárgyat pedig nem.')}
        ${li('Mi a Frissesség?', 'Ha minden fáklyád ég, Frissességet gyűjtesz, és a következő kalandokért dupla tapasztalat jár.')}
        ${li('Mi a taktika?', 'A harc magától zajlik. A taktika dönti el, hogy a hősöd inkább támad vagy inkább védekezik.')}
        ${li('Mire jó a Csillagpor?', 'A tárgyaidat erősítheted vele a Hős képernyőn. Hetente legfeljebb 1000 + 100 × szint gyűjthető, a keret hétfőn indul újra.')}
        ${ONLINE ? li('Mi a heti szörny?', 'Az egész szerver együtt üti. Naponta 3 ütésed van, és a ládákért érdemes.') : ''}
        ${li('Mit csináljak naponta?', 'Égesd el a fáklyáidat kalandokon, küldd őrjáratra a hősödet, vedd át a napi ajándékot, és nézz be a Kihívásokhoz: Holdtorony, heti esemény, Aréna. A menüben (telefonon a Menü fülön) a jelzések mutatják, mi vár még ma.')}
        ${li('Mi a Holdtorony?', 'Az 5. szinttől: emeletről emeletre egyre erősebb ellenfelek. Amíg nyersz, mászhatsz, naponta 5 vereség fér bele. Hétfőn elölről indul; az új (a legjobbad feletti) emeletekért jár a teljes jutalom.')}
        ${li('Mi a heti esemény?', 'Minden héten más, saját szörnnyel. Naponta 3 harc: győzelem 10, vereség 3 pont. A pontokért jutalmak járnak, a legfelső egy csak azon a héten megszerezhető tárgy.')}
        ${li('Mi az Aréna?', 'Párbaj más hősök ellen (gyakorló módban gépi ellenfelekkel). Naponta 5 párbaj; a győzelem pontot hoz, a vereség elvisz belőle. Naponta egyszer kérhetsz új ellenfeleket.')}
        ${li('Mik a csapatküldetések?', 'Egy-két társat viszel egy erős őrző ellen; a társak minden körben veled ütnek. Naponta 3 küldetés, bőkezűbb jutalommal.')}
        ${li('Mi a céh?', 'A közös szerveren: a tagok győzelmei összeadódnak, a heti célokért mindenki jutalmat kap. Az 5. szinttől alapíthatsz egyet.')}
        ${li('Mi a céhháború?', 'Minden héten két hasonló erejű céh kerül össze. Amelyik a héten több győzelmet gyűjt, az nyer: a zászlójára csillag kerül, és aki legalább egyszer győzött, jövő héten átveheti a jutalmat.')}
        ${li('Lehet több hősöm?', `Igen, legfeljebb 3. A Hőseim oldalon (a Hős menüben) újat készíthetsz, és bármikor válthatsz köztük. Mindegyik külön fejlődik; a hőseid osztoznak ${ONLINE ? 'a heti szörny napi 3 ütésén, ládáin és címein, a céheden és ' : ''}a napi ajándékon.`)}
        ${li('Mik az ösvények?', `A ${D.PATH_LEVEL}. szinttől a kasztod három útja közül választhatsz egyet a Hős képernyőn. Mindegyik másban erősít; az első választás ingyenes, később Holdezüstért válthatsz.`)}
        ${li('Mi a profil?', ONLINE ? 'Ezt látják rólad a többiek: a ranglistán bármelyik névre kattintva megnézheted az illető hősét, felszerelését és trófeáit.' : 'A hősöd névjegye: felszerelés, trófeák, a torony legjobbja. A közös szerveren a többiek is megnézhetik.')}
        ${li('Mire jó a Holdezüst?', 'Ezzel vásárolsz a Vándorkereskedőnél, ebből alapítasz céhet, és ezzel sorsolod újra a tárgyak tulajdonságait.')}</ul>
      <h3 class="nx-h3">A legutóbbi frissítésben</h3><ul class="nx-list">${li('Ösvények, profil, céhháború', 'A 15. szinttől ösvényt választhatsz, a hősöd profilját mások is megnézhetik, a céhek pedig hetente megmérkőznek egymással.')}${li('Új grafika', 'Új hősök, szörnyek és tájak, minden mozdul.')}${li('Új harc', 'A hős és a szörny odamegy egymáshoz, minden képességnek saját látványa van.')}${li('Új karakterkészítő', 'Forgatható hős, rengeteg választás, és a kinézetet bármikor átszabhatod.')}</ul>`,
      `<button class="btn block" data-act="owl-reset">Bubó tippjei elölről</button>${close}`);
    if (kind === 'menu') return wrap('Menü', 'Minden, ami a táborban elérhető', menuGroups().map(g => `<section class="nx-grp sheet"><h3>${g.name}</h3><ul>${g.items.map(it => navBtn(it, true)).join('')}</ul></section>`).join('') +
      `<section class="nx-grp sheet"><h3>Egyéb</h3><ul>${[{ name: 'Súgó', ic: 'sugo', sub: 'Minden a játékról, képekkel', go: ['screen', 'sugo'] }, { name: 'Hiba bejelentése', ic: 'hiba', sub: 'Zárt teszt: minden észrevétel számít', go: ['info', 'hiba'] }, { name: 'Discord-szerver', ic: 'discord', sub: 'Csevegés, bejelentések, segítség', go: ['info', 'discord'] }, { name: 'Beállítások', ic: 'beallitas', sub: 'Harc sebessége, Bubó, fiók', go: ['screen', 'beallitas'] }].concat(ONLINE && S.me && S.me.admin ? [{ name: 'Admin', ic: 'karakter', sub: 'Játékosok, bejelentések, világ', go: ['screen', 'admin'] }] : []).map(it => navBtn(it, true)).join('')}</ul></section>`, ' ');
    return '';
  }
  // címképernyő: munkamenetenként egyszer, a játék indulásakor
  function titleSeen() { try { return sessionStorage.getItem('nyx-title') === '1'; } catch (e) { return true; } }
  function markTitle() { try { sessionStorage.setItem('nyx-title', '1'); } catch (e) { /* privát mód */ } }
  // holdfényes sziklaperem a címképernyő hőse alá (így nem lóg a levegőben)
  const TITLE_LEDGE = `<svg class="nx-ledge" viewBox="0 0 260 90" xmlns="http://www.w3.org/2000/svg"><defs>
    <linearGradient id="ldg-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4380"/><stop offset=".35" stop-color="#1c2252"/><stop offset="1" stop-color="#0b0e26" stop-opacity="0"/></linearGradient>
    <linearGradient id="ldg-t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a98e8" stop-opacity=".25"/><stop offset=".45" stop-color="#c8d2ff" stop-opacity=".9"/><stop offset="1" stop-color="#8a98e8" stop-opacity=".2"/></linearGradient>
    <radialGradient id="ldg-g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#9fb0ff" stop-opacity=".35"/><stop offset="1" stop-color="#9fb0ff" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="130" cy="16" rx="128" ry="16" fill="url(#ldg-g)"/>
    <path d="M14 18 C40 8 92 5 130 5 C170 5 222 8 246 18 L236 30 L250 52 L214 70 L226 90 L40 90 L52 70 L12 52 L26 30 Z" fill="url(#ldg-r)"/>
    <path d="M14 18 C40 8 92 5 130 5 C170 5 222 8 246 18 C220 25 170 28 130 28 C90 28 40 25 14 18 Z" fill="#262c64"/>
    <path d="M18 18 C44 10 92 7 130 7 C170 7 218 10 242 18" fill="none" stroke="url(#ldg-t)" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M40 24 L58 40 L48 58 M94 28 L104 46 L92 70 M168 28 L156 48 L172 66 M214 24 L198 42 L210 56" fill="none" stroke="#0e1236" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>
    <path d="M58 40 L70 36 M104 46 L118 44 M156 48 L142 46" fill="none" stroke="#4a56a8" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>
    <g fill="#2e3878"><path d="M56 21 Q57 12 60 8 Q60 15 61 21 Z M61 21 Q63 13 67 10 Q65 16 65 21 Z M52 21 Q51 15 48 12 Q53 15 56 21 Z"/><path d="M188 22 Q189 14 192 10 Q192 16 193 22 Z M193 22 Q195 15 199 12 Q197 17 197 22 Z M184 22 Q183 17 180 14 Q185 17 188 22 Z"/><path d="M118 25 Q119 19 121 16 Q121 21 122 25 Z M122 25 Q124 20 127 18 Q125 22 125 25 Z"/></g></svg>`;
  function renderTitle(loginMode) {
    const h = !loginMode && hero();
    const narrow = window.matchMedia ? matchMedia('(max-width: 860px)').matches : false;
    const heroFig = h ? A.heroSvg(h, { full: true, live: true }) : A.heroSvg({ name: 'Nyxoria', classId: 'magus', rig: Object.assign(window.NYX.rig.defaultLook('magus'), { hairBack: 'hosszu', hairFront: 'oldal', ears: 'hosszutunde', eyeGlow: true, cape: 'csillagos', headwear: 'diadem', mark: 'holdjel', skin: '#d9def5' }) }, { full: true, live: true });
    const main = h
      ? `<button class="nx-continue" data-act="title-go"><span class="pt" aria-hidden="true">${A.heroSvg(h)}</span><span><b>Folytatás</b><span class="s">${esc(h.name)} · ${h.level}. szintű ${esc(D.PEOPLES[h.people].name.toLowerCase())} ${esc(cls(h).name.toLowerCase())}</span></span>${ni('right')}</button>`
      : `<button class="btn discord lg block" data-act="login">${I.discord}Belépés Discorddal</button>`;
    return `<main class="nx-title" aria-labelledby="nx-brand"><div class="nx-title-bg">${A.sceneSvg('erdo', 11, { live: true, narrow: narrow })}</div>
      <div class="nx-title-inner">
        <div class="nx-title-hero" aria-hidden="true">${TITLE_LEDGE}${heroFig}</div>
        <div class="nx-brand"><h1 id="nx-brand">NYXORIA</h1><p>Holdfényes kalandok a Nyxoria <span class="nw">Discord-közösségnek</span></p></div>
        ${S.loginError ? `<div class="advice" style="margin-bottom:12px;text-align:left">${A.OWL.replace('width="64" height="64"', 'width="34" height="34"')}<div>${esc(S.loginError)}</div></div>` : ''}
        ${main}
        <nav class="nx-tmenu" aria-label="Címképernyő">
          ${h ? `<button class="btn" data-act="screen" data-v="beallitas">${ni('beallitas')}Beállítások</button>` : ''}
          <button class="btn" data-act="help-open">${ni('sugo')}Súgó</button>
          <button class="btn" data-act="info" data-v="discord">${ni('discord')}Discord</button>
          ${h || !SOON.length ? '' : `<button class="btn" data-act="info" data-v="keszulo">${ni('keszulo')}Hamarosan</button>`}
        </nav>
        ${loginMode ? '<p class="small muted" style="margin-top:14px">A Discord-fiókoddal léphetsz be. A játék csak a Discord-nevedet és a profilképedet használja.</p>' : ONLINE && S.me ? `<div class="nx-account"><span>Belépve Discorddal: <b>${esc(S.me.name || '')}</b></span><button class="nx-lnk" data-act="logout">Kijelentkezés</button></div>` : (!ONLINE ? '<p class="small muted" style="margin-top:14px">Gyakorló mód: a hősöd ebben a böngészőben van elmentve.</p>' : '')}
        <div class="nx-tfoot"><span>Zárt teszt</span><button class="nx-lnk" data-act="info" data-v="hiba">Hiba bejelentése</button></div>
      </div>
      <aside class="nx-news" aria-labelledby="nx-news-t"><h2 id="nx-news-t">A legutóbbi frissítésben</h2><ul><li>Új kihívások: Holdtorony, heti esemény és Aréna.</li><li>Csapatküldetések és céhek: játsszatok együtt!</li><li>Napi ajándék, vándorkereskedő, eredmények és gyűjtőalbum.</li></ul></aside></main>`;
  }
  function gotoTarget(v) {
    if (S.combat) { toast('Előbb fejezd be a harcot.'); return; }
    if (S.screen !== 'kaland') { S.screen = 'kaland'; render(); }
    const id = v === 'patrol' ? 'patrol-anchor' : 'offers-anchor', t = el(id);
    if (t) { t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); const f = t.querySelector('button:not([disabled])'); if (f) setTimeout(() => f.focus({ preventScroll: true }), 300); }
    else if (v === 'patrol') toast('Most kalandon vagy. Az őrjáratot a táborban indíthatod.');
  }

  // ---------- ösvények ----------
  const BONUS_NAMES = { elet: 'ÉLET', tam: 'TÁM', ved: 'VÉD', fur: 'FÜR', dmg: 'sebzés', crit: 'telitalálat-esély', dodge: 'kitérés', heal: 'gyógyítás', first: 'sebzés az első körben' };
  function bonusText(b) { return Object.keys(b).map(k => `+${b[k]}% ${BONUS_NAMES[k]}`).join(' · '); }
  function pathsHtml(h) {
    const list = D.PATHS[h.classId] || [], open = h.level >= D.PATH_LEVEL, cost = X ? X.pathCost(h) : 0;
    const cards = list.map((p, i) => {
      const cur = h.path === i;
      const btn = !open ? '' : cur ? '<span class="nx-tag" style="color:var(--jo-400)">Ezen jársz</span>'
        : `<button class="btn sm${h.path == null ? ' fakla' : ''}" data-act="path-pick" data-v="${i}">${h.path == null ? 'Ezt választom' : `Váltás · ${I.silver} ${fmt(cost)}`}</button>`;
      return `<div class="nx-path${cur ? ' cur' : ''}"><b>${esc(p.name)}</b><span class="small muted">${esc(p.line)}</span><span class="small" style="color:var(--fakla-300)">${bonusText(p.b)}</span>${btn}</div>`;
    }).join('');
    return `<div class="nx-paths-h"><h3>Ösvények</h3><span class="small muted">${open ? (h.path == null ? 'Válassz egyet! Az első választás ingyenes, később Holdezüstért válthatsz.' : 'Holdezüstért bármikor válthatsz másik ösvényre.') : `A ${D.PATH_LEVEL}. szinttől választhatsz egyet a három közül.`}</span></div><div class="nx-paths">${cards}</div>`;
  }

  // ---------- profil ----------
  function profileHtml(p) {
    const cls = D.CLASSES[p.classId];
    const stat = (l, v) => `<span><small>${l}</small><b>${v}</b></span>`;
    const ach = (p.topAch || []).map(a => `<li><span>${esc(a.name)}</span><span class="small muted">${a.of}-ből ${a.tier} fokozat</span></li>`).join('');
    const eq = (p.equipped || []).map(it => `<span class="item-ic painted r-${it.rarity}${it.mythic ? ' mythic' : ''}" title="${esc(it.name)}">${NXI ? NXI.item(it) : ''}${it.plus ? `<span class="plus">+${it.plus}</span>` : ''}</span>`).join('');
    return `<div class="nx-prof"><div class="portrait">${A.heroSvg({ name: p.name, classId: p.classId, rig: p.rig, worn: p.worn, look: p.look, people: p.people }, { full: true })}</div>
      <div class="nx-prof-main"><h2>${esc(p.name)}</h2><p class="small muted">${p.level}. szintű ${esc(D.PEOPLES[p.people] ? D.PEOPLES[p.people].name.toLowerCase() : '')} ${esc(cls ? cls.name.toLowerCase() : '')}${p.path ? ' · ' + esc(p.path) : ''}</p>
        ${p.guild ? `<p class="small" style="margin-top:4px">${esc(p.guild.name)} <span class="nx-tag">${esc(p.guild.tag)}</span>${p.guild.stars ? ` <span style="color:var(--fakla-300)">${'★'.repeat(Math.min(10, p.guild.stars))}</span>` : ''}</p>` : ''}
        ${p.motto ? `<p class="small muted">„${esc(p.motto)}”</p>` : ''}${(p.achTitles || []).concat(p.titles || []).length ? `<p class="small" style="color:var(--fakla-300)">${(p.achTitles || []).concat(p.titles || []).map(esc).join(' · ')}</p>` : ''}
        <div class="nx-ch-stats" style="margin-top:10px">${stat('Harcerő', fmt(p.power))}${stat('Győzelem', fmt(p.wins))}${stat('Aréna', fmt(p.arena))}${stat('Holdtorony', p.towerMax ? p.towerMax + '. emelet' : '–')}${stat('Legendás tárgy', p.legendaries || 0)}${stat('Mitikus tárgy', p.mythics)}${stat('Trófea', p.trophies + ' / ' + p.trophyMax)}${stat('Album', p.album + ' lap')}</div>
        ${eq ? `<div class="nx-prof-eq">${eq}</div>` : ''}${ach ? `<ul class="nx-pach">${ach}</ul>` : ''}</div></div>`;
  }
  // ---------- admin ----------
  function adminCall(op, args, done) {
    remote('admin', Object.assign({ op: op }, args || {})).then(r => { if (done) done(r); render(); }).catch(e => { toast(e.message || 'Hiba történt.'); render(); });
  }
  const ago = t => { if (!t) return '–'; const m = Math.round((Date.now() - t) / 60000); return m < 60 ? `${Math.max(1, m)} perce` : m < 1440 ? `${Math.round(m / 60)} órája` : `${Math.round(m / 1440)} napja`; };
  const ADMIN_ACT = { ban: 'kitiltás', unban: 'visszaengedés', grant: 'ajándék / levonás', rename: 'átnevezés', notice: 'bejelentés', giftAll: 'ajándék mindenkinek', bossReset: 'heti szörny újraindítása', guildRename: 'céh átnevezése', guildDisband: 'céh feloszlatása', setAdmin: 'admin jog', resources: 'erőforrások', itemCreate: 'tárgy készítése', itemEdit: 'tárgy módosítása', itemRemove: 'tárgy törlése', heroSet: 'hős adatai', resetDaily: 'napi keretek' };
  function renderAdmin() {
    const A2 = S.admin = S.admin || { tab: 'attekintes' }, tab = A2.tab;
    const tabs = [['attekintes', 'Áttekintés'], ['jatekosok', 'Játékosok'], ['kozles', 'Bejelentés és ajándék'], ['vilag', 'Világ']];
    if (tab === 'attekintes' && !A2.stats && !A2.loading1) { A2.loading1 = true; adminCall('stats', {}, r => { A2.stats = r; A2.loading1 = false; }); adminCall('world', {}, r => { A2.world = r; }); }
    if (tab === 'vilag' && !A2.world && !A2.loading2) { A2.loading2 = true; adminCall('world', {}, r => { A2.world = r; A2.loading2 = false; }); }
    if (tab === 'jatekosok' && !A2.players && !A2.loading3) { A2.loading3 = true; adminCall('players', { q: A2.q || '' }, r => { A2.players = r.players; A2.loading3 = false; }); }
    const head = `<div class="row between wrap" style="gap:8px"><h1>Admin</h1><button class="btn sm" data-act="admin-refresh">Frissítés</button></div>
      <div class="seg nx-admtabs" role="tablist" style="margin-top:10px">${tabs.map(([k, n]) => `<button role="tab" aria-selected="${tab === k}" data-act="admin-tab" data-v="${k}">${n}</button>`).join('')}</div>`;
    let body = '<p class="muted" style="margin-top:12px">Betöltés…</p>';
    const logList = (rows, mapper) => rows && rows.length ? `<div class="chron" style="margin-top:8px;max-height:320px">${rows.map(mapper).join('')}</div>` : '<p class="small muted" style="margin-top:6px">Még nincs bejegyzés.</p>';
    if (tab === 'attekintes' && A2.stats) {
      const s = A2.stats.stats, w = A2.world;
      body = `<div class="nx-ch-stats" style="margin-top:12px">${[['Játékos', s.players], ['Hős', s.heroes], ['Ma aktív', s.active1], ['14 napon belül', s.active14], ['Kitiltva', s.banned], ['Legmagasabb szint', s.maxlevel]].map(([l, v]) => `<span><small>${l}</small><b>${fmt(v)}</b></span>`).join('')}</div>
        ${w && w.flagged.length ? `<h3 class="nx-h3" style="margin-top:16px">Gyanús aktivitás</h3><ul class="nx-glog">${w.flagged.map(f => `<li><button class="nx-lnk" data-act="admin-open" data-v="${f.uid}">${esc(f.hero || f.discord || '?')}</button> <span class="small muted">(${esc(f.discord || '')})</span> – ${f.why.map(esc).join(', ')}</li>`).join('')}</ul>` : ''}
        <h3 class="nx-h3" style="margin-top:16px">Legutóbbi játékos-műveletek</h3>${logList(A2.stats.recent, r => `<div class="chron-item"><span class="dot"></span><div><time>${new Date(r.at).toLocaleString('hu-HU')}</time>${esc(r.name || '?')}: ${esc(r.action)}</div></div>`)}
        ${w ? `<h3 class="nx-h3" style="margin-top:16px">Admin-napló</h3>${logList(w.adminLog, a => `<div class="chron-item"><span class="dot"></span><div><time>${new Date(a.at).toLocaleString('hu-HU')}</time><b>${esc(a.admin || '?')}</b>: ${esc(ADMIN_ACT[a.action] || a.action)}${a.target ? ` – ${esc(a.target)}` : ''} <span class="small muted">${esc(JSON.stringify(a.info || {}))}</span></div></div>`)}` : ''}`;
    }
    if (tab === 'jatekosok') {
      const list = A2.players ? (A2.players.length ? `<div class="nx-admlist">${A2.players.map(p => `<button class="nx-admrow${A2.sel === p.uid ? ' on' : ''}" data-act="admin-open" data-v="${p.uid}">
          <b>${esc(p.hero || '(nincs hőse)')}</b><span class="small muted">${esc(p.discord || '')}${p.slots ? ` · +${p.slots} hős` : ''}</span>
          <span class="small">${p.level ? `${p.level}. szint · ${D.CLASSES[p.classId] ? D.CLASSES[p.classId].name : ''}` : ''}${p.guild ? ` · ${esc(p.guild)}` : ''}</span>
          <span class="small muted">${p.banned ? '<b style="color:var(--veszely-400)">KITILTVA</b> · ' : ''}${p.admin ? 'admin · ' : ''}aktív: ${ago(p.active)}</span></button>`).join('')}</div>` : '<p class="muted" style="margin-top:10px">Nincs találat.</p>') : '<p class="muted" style="margin-top:10px">Betöltés…</p>';
      body = `<div class="row" style="gap:8px;margin-top:12px"><input class="input" id="adm-q" placeholder="Keresés: Discord-név vagy hősnév" value="${esc(A2.q || '')}" style="height:40px"><button class="btn sm" data-act="admin-search">Keresés</button></div>
        <div class="nx-adm2">${list}<div>${A2.detail ? adminDetail(A2.detail) : '<p class="small muted" style="margin-top:12px">Válassz egy játékost a listából.</p>'}</div></div>`;
    }
    if (tab === 'kozles') {
      body = `<div class="nx-admbox"><h3>Bejelentés</h3><p class="small muted">Belépéskor minden játékos látja egy sávban, amíg el nem tünteti. Üresen elküldve törli a mostanit.</p>
          <textarea class="input" id="adm-notice" maxlength="400" style="height:90px;padding:10px;margin-top:8px" placeholder="Pl.: Ma este 20 órakor dupla tapasztalat!"></textarea>
          <label class="row small" style="gap:8px;margin-top:8px"><input type="checkbox" id="adm-notice-chr" checked> A közös krónikába is kerüljön</label>
          <label class="row small" style="gap:8px;margin-top:4px"><input type="checkbox" id="adm-notice-dc"> Discordra is menjen ki (ha be van állítva a webhook)</label>
          <button class="btn primary sm" style="margin-top:10px" data-act="admin-notice">Bejelentés elküldése</button></div>
        <div class="nx-admbox"><h3>Ajándék mindenkinek</h3><p class="small muted">Minden (nem kitiltott) játékos a következő belépésekor kapja meg, a krónikájában az indokkal együtt.</p>
          <div class="row wrap" style="gap:8px;margin-top:8px"><label class="small">Holdezüst <input class="input" id="adm-g-s" type="number" min="0" value="0" style="height:38px;width:120px"></label><label class="small">Csillagpor <input class="input" id="adm-g-d" type="number" min="0" value="0" style="height:38px;width:120px"></label></div>
          <input class="input" id="adm-g-n" maxlength="200" placeholder="Indok, pl.: Bocsánat a tegnapi leállásért!" style="height:38px;margin-top:8px">
          <button class="btn fakla sm" style="margin-top:10px" data-act="admin-giftall">Ajándék küldése mindenkinek</button></div>`;
    }
    if (tab === 'vilag' && A2.world) {
      const w = A2.world, b = w.boss;
      body = `<div class="nx-admbox"><h3>Heti szörny</h3>${b ? `<p><b>${esc(b.name)}</b> (${b.level}. szint) · ${fmt(b.hp)} / ${fmt(b.maxHp)} életerő · ${b.participants} résztvevő${b.killed ? ' · <b>legyőzve</b>' : ''}</p><p class="small muted">Véget ér: ${new Date(b.ends).toLocaleString('hu-HU')}</p>
          <button class="btn danger sm" style="margin-top:8px" data-act="admin-bossreset">Újraindítás (teljes életerő, a sebzések és ládák törlődnek)</button>` : '<p class="muted">Most nincs heti szörny.</p>'}</div>
        <div class="nx-admbox"><h3>Céhek (${w.guilds.length})</h3>${w.guilds.length ? `<ul class="nx-glog">${w.guilds.map(g => `<li><span><b>${esc(g.name)}</b> <span class="nx-tag">${esc(g.tag)}</span> · ${g.members} tag${g.stars ? ` · ${g.stars}★` : ''}</span><span class="row" style="gap:6px"><button class="btn sm ghost" data-act="admin-grename" data-v="${g.id}">Átnevezés</button><button class="btn sm danger" data-act="admin-gdisband" data-v="${g.id}">Feloszlatás</button></span></li>`).join('')}</ul>` : '<p class="muted">Még nincs céh.</p>'}</div>
        <div class="nx-admbox"><h3>Gyanús aktivitás</h3>${w.flagged.length ? `<ul class="nx-glog">${w.flagged.map(f => `<li><button class="nx-lnk" data-act="admin-open" data-v="${f.uid}">${esc(f.hero || '?')}</button> – ${f.why.map(esc).join(', ')}</li>`).join('')}</ul>` : '<p class="small muted">Most nincs semmi gyanús (24 óra alatt 600-nál több művelet, vagy naponta 7-nél több szint).</p>'}</div>`;
    }
    return `<section class="panel nx-admin">${head}${body}</section>`;
  }
  function adminDetail(d) {
    const p = d.player, A2 = S.admin, hs = A2.hslot || 0, hd = A2.hd && A2.hd.uid === p.uid && A2.hd.hslot === hs ? A2.hd.data : null;
    if (!hd && !A2.hdLoading && (d.hero || hs)) { A2.hdLoading = true; adminCall('heroData', { uid: p.uid, hslot: hs }, r => { A2.hd = { uid: p.uid, hslot: hs, data: r.hero }; A2.hdLoading = false; }); }
    const heroes = (d.hero ? [{ slot: 0, name: d.hero.name, level: d.hero.level, classId: d.hero.classId, active: true }] : []).concat(d.slots.map(s => ({ slot: s.slot, name: s.name, level: s.level, classId: s.classId })));
    const sec = A2.sec || 'eroforras';
    const secs = [['eroforras', 'Erőforrások'], ['targy', 'Tárgy készítése'], ['taska', 'Táska és felszerelés'], ['hos', 'Hős'], ['napi', 'Napi keretek'], ['fiok', 'Fiók']];
    const field = (id, label, val, w) => `<label class="small">${label}<input class="input" id="${id}" type="number" value="${val == null ? 0 : val}" style="height:36px;width:${w || 110}px"></label>`;
    let body = '<p class="small muted" style="margin-top:10px">Betöltés…</p>';
    if (sec === 'fiok') body = `<div class="nx-admbox"><h3>Fiók</h3>
        <div class="row wrap" style="gap:8px"><input class="input" id="adm-rn" placeholder="Új név a most játszott hősnek" style="height:36px;max-width:240px"><button class="btn sm" data-act="admin-rename" data-v="${p.uid}">Átnevezés</button></div>
        <div class="row wrap" style="gap:8px;margin-top:8px">${p.banned ? `<button class="btn sm" data-act="admin-unban" data-v="${p.uid}">Visszaengedés</button>` : `<input class="input" id="adm-br" placeholder="Kitiltás indoka (a játékos látja)" style="height:36px;max-width:260px"><button class="btn sm danger" data-act="admin-ban" data-v="${p.uid}">Kitiltás</button>`}
          <button class="btn sm ghost" data-act="admin-setadmin" data-v="${p.uid}" data-on="${p.admin ? '0' : '1'}">${p.admin ? 'Admin jog elvétele' : 'Admin jog adása'}</button></div></div>`;
    else if (hd) {
      if (sec === 'eroforras') body = `<div class="nx-admbox"><h3>Erőforrások</h3><p class="small muted">Most: ${fmt(hd.silver)} Holdezüst · ${fmt(hd.dust)} Csillagpor · ${hd.torches}/${E.TORCH.max} fáklya · ${hd.rested} Frissesség · ${fmt(hd.xp)}/${fmt(hd.xpNeed)} TP. Írd be, mennyit adsz hozzá; negatív szám levon.</p>
          <div class="row wrap" style="gap:8px;margin-top:8px">${field('adm-s', 'Holdezüst')}${field('adm-d', 'Csillagpor')}${field('adm-t', 'Fáklya', 0, 80)}${field('adm-r', 'Frissesség', 0, 90)}${field('adm-x', 'Tapasztalat (TP)')}</div>
          <div class="row wrap" style="gap:6px;margin-top:8px"><button class="btn sm ghost" data-act="admin-quick" data-v="torch">Fáklyák tele</button><button class="btn sm ghost" data-act="admin-quick" data-v="rested">Frissesség tele</button><button class="btn sm ghost" data-act="admin-quick" data-v="level">+1 szintnyi TP</button></div>
          <input class="input" id="adm-n" maxlength="200" placeholder="Megjegyzés (a játékos is látja a krónikájában)" style="height:36px;margin-top:8px">
          <button class="btn fakla sm" style="margin-top:8px" data-act="admin-res" data-v="${p.uid}">Küldés</button></div>`;
      if (sec === 'targy') {
        const ib = A2.ib = A2.ib || { rarity: 'lila', slot: 'fegyver', level: hd.level, plus: 0, name: '', line: '', mythic: false, affixes: [], auto: true };
        const opt = (list, cur) => list.map(([v, n]) => `<option value="${v}"${String(cur) === String(v) ? ' selected' : ''}>${n}</option>`).join('');
        const affRow = i => { const a = ib.affixes[i] || {}; return `<div class="row" style="gap:6px"><select class="input" data-act="admin-ib" id="adm-ia${i}" style="height:34px">${opt([['', '— nincs —']].concat(D.AFFIXES.map(x => [x.id, x.text.replace('+{v}', '+X')])), a.id || '')}</select><input class="input" data-act="admin-ib" id="adm-iv${i}" type="number" min="1" max="100" value="${a.v || ''}" placeholder="érték" style="height:34px;width:80px"></div>`; };
        body = `<div class="nx-admbox"><h3>Tárgy készítése</h3><p class="small muted">Bármilyen tárgyat összeállíthatsz. Ha a tulajdonságokat üresen hagyod, a ritkaságnak megfelelően sorsolódnak.</p>
          <div class="nx-ib"><div class="nx-ib-form">
            <div class="row wrap" style="gap:8px"><label class="small">Ritkaság<select class="input" data-act="admin-ib" id="adm-irar" style="height:36px">${opt(D.RARITY_ORDER.map(r => [r, D.RARITIES[r].name]), ib.rarity)}</select></label>
              <label class="small">Hely<select class="input" data-act="admin-ib" id="adm-islot" style="height:36px">${opt(D.SLOT_ORDER.map(x => [x, D.SLOTS[x].name]), ib.slot)}</select></label>
              <label class="small">Szint<input class="input" data-act="admin-ib" id="adm-ilvl" type="number" min="1" max="99" value="${ib.level}" style="height:36px;width:80px"></label>
              <label class="small">Fejlesztés<input class="input" data-act="admin-ib" id="adm-iplus" type="number" min="0" max="12" value="${ib.plus}" style="height:36px;width:80px"></label></div>
            <label class="small" style="display:flex;margin-top:8px">Név (üresen: a játék ad nevet)<input class="input" data-act="admin-ib" id="adm-iname" maxlength="40" value="${esc(ib.name)}" style="height:36px"></label>
            <label class="small" style="display:flex;margin-top:6px">Rövid leírás (nem kötelező)<input class="input" data-act="admin-ib" id="adm-iline" maxlength="120" value="${esc(ib.line)}" style="height:36px"></label>
            <label class="row small" style="gap:8px;margin-top:8px"><input type="checkbox" data-act="admin-ib" id="adm-imyth"${ib.mythic ? ' checked' : ''}> Mitikus (egyedi ragyogás)</label>
            <p class="small" style="margin-top:8px"><b>Tulajdonságok</b> <span class="muted">(legfeljebb 4)</span></p><div class="stack" style="gap:6px;margin-top:4px">${[0, 1, 2, 3].map(affRow).join('')}</div>
          </div><div><p class="small muted">Előnézet</p><div id="adm-ipre" class="nx-ib-pre">${adminItemPreview()}</div>
            <button class="btn fakla sm" style="margin-top:10px" data-act="admin-icreate" data-v="${p.uid}">Odaadom ${esc(hd.name)} hősnek</button></div></div></div>`;
      }
      if (sec === 'taska') {
        const row = (it, where) => `<div class="nx-admitem">${itemHtml(it)}<div class="row wrap" style="gap:6px"><span class="small muted">${where}</span><button class="btn sm ghost" data-act="admin-iplus" data-v="${it.id}">+1 fejlesztés</button><button class="btn sm ghost" data-act="admin-iminus" data-v="${it.id}">−1</button><button class="btn sm danger" data-act="admin-idel" data-v="${it.id}">Törlés</button></div></div>`;
        const eq = D.SLOT_ORDER.map(k => hd.equipped[k]).filter(Boolean);
        body = `<div class="nx-admbox"><h3>Felszerelés (${eq.length})</h3>${eq.length ? eq.map(it => row(it, 'rajta van')).join('') : '<p class="small muted">Semmi.</p>'}</div>
          <div class="nx-admbox"><h3>Táska (${hd.inventory.length} / ${E.INVENTORY_MAX})</h3>${hd.inventory.length ? hd.inventory.map(it => row(it, 'táskában')).join('') : '<p class="small muted">Üres.</p>'}</div>`;
      }
      if (sec === 'hos') {
        const paths = D.PATHS[hd.classId] || [];
        body = `<div class="nx-admbox"><h3>Hős adatai</h3><p class="small muted">${esc(hd.name)} · ${D.CLASSES[hd.classId] ? D.CLASSES[hd.classId].name : ''} · harcerő ${fmt(hd.power)}</p>
          <div class="row wrap" style="gap:8px;margin-top:8px">${field('adm-hl', 'Szint', hd.level, 80)}${field('adm-ha', 'Aréna-pontszám', hd.arena)}${field('adm-ht', 'Torony legjobb emelet', hd.towerBest)}
            <label class="small">Ösvény<select class="input" id="adm-hp" style="height:36px"><option value="">nincs</option>${paths.map((x, i) => `<option value="${i}"${hd.path === i ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label></div>
          <p class="small muted" style="margin-top:6px">Szintállításkor a tapasztalat nullázódik, a képességek a szinthez igazodnak. Ösvény a ${D.PATH_LEVEL}. szinttől adható.</p>
          <button class="btn sm primary" style="margin-top:8px" data-act="admin-heroset" data-v="${p.uid}">Mentés</button></div>`;
      }
      if (sec === 'napi') {
        const opts = [['gift', 'Napi ajándék (még egyszer átveheti, a sorozat megmarad)'], ['arena', 'Aréna: napi párbajok'], ['team', 'Csapatküldetések'], ['tower', 'Holdtorony: napi vereségkeret'], ['event', 'Heti esemény: napi harcok'], ['patrol', 'Őrjárat (újra mehet; a futót megszakítja)'], ['shop', 'Vándorkereskedő: új áru'], ['expedition', 'Félbehagyott kaland törlése (ha beragadt)']];
        body = `<div class="nx-admbox"><h3>Napi keretek visszaállítása</h3><p class="small muted">Jelöld be, mit kapjon vissza ma.</p><div class="stack" style="gap:6px;margin-top:8px">${opts.map(([k, n]) => `<label class="row small" style="gap:8px"><input type="checkbox" class="adm-rd" value="${k}"> ${n}</label>`).join('')}</div>
          <button class="btn sm primary" style="margin-top:10px" data-act="admin-reset" data-v="${p.uid}">Visszaállítás</button></div>`;
      }
    }
    return `<div class="nx-admdetail">
      <div class="row" style="gap:12px;align-items:center">${d.hero ? `<div class="portrait" style="width:64px;height:76px;margin:0">${A.heroSvg(d.hero)}</div>` : ''}<div style="min-width:0"><h2>${esc(p.discord || '?')}</h2>
        <p class="small muted">Discord-azonosító: ${esc(p.discordId || '')} · csatlakozott: ${new Date(p.joined).toLocaleDateString('hu-HU')} · ma ${d.counts.d1} művelet</p>
        <p class="small">${p.banned ? `<b style="color:var(--veszely-400)">KITILTVA</b>${p.banReason ? ` (${esc(p.banReason)})` : ''} · ` : ''}${p.admin ? 'admin · ' : ''}${d.guild ? `céh: ${esc(d.guild.name)} [${esc(d.guild.tag)}]` : 'nincs céhe'}</p></div></div>
      ${heroes.length ? `<p class="small" style="margin-top:10px"><b>Melyik hősön dolgozol?</b></p><div class="row wrap" style="gap:6px;margin-top:4px">${heroes.map(x => `<button class="chip" data-act="admin-hslot" data-v="${x.slot}" aria-pressed="${hs === x.slot}">${esc(x.name)} · ${x.level}. szint${x.active ? ' (most ezzel játszik)' : ''}</button>`).join('')}</div>` : ''}
      <div class="seg nx-admtabs nx-admsec" style="margin-top:10px">${secs.map(([k, n]) => `<button data-act="admin-sec" data-v="${k}" aria-selected="${sec === k}">${n}</button>`).join('')}</div>
      ${body}
      <h3 class="nx-h3" style="margin-top:14px">Legutóbbi műveletei</h3>${d.actions.length ? `<div class="chron" style="max-height:220px">${d.actions.map(a => `<div class="chron-item"><span class="dot"></span><div><time>${new Date(a.at).toLocaleString('hu-HU')}</time>${esc(a.action)} <span class="small muted">${esc(JSON.stringify(a.info || {})).slice(0, 160)}</span></div></div>`).join('')}</div>` : '<p class="small muted">Még nincs.</p>'}
      ${d.adminLog.length ? `<h3 class="nx-h3" style="margin-top:14px">Admin-műveletek vele</h3><div class="chron" style="max-height:200px">${d.adminLog.map(a => `<div class="chron-item"><span class="dot"></span><div><time>${new Date(a.at).toLocaleString('hu-HU')}</time>${esc(ADMIN_ACT[a.action] || a.action)} <span class="small muted">${esc(JSON.stringify(a.info || {}))}</span></div></div>`).join('')}</div>` : ''}
    </div>`;
  }
  // a tárgykészítő előnézete: ugyanúgy rajzolja, ahogy a játékos látni fogja
  function adminItemPreview() {
    const ib = S.admin && S.admin.ib; if (!ib) return '';
    const it = { id: 'preview', rarity: ib.rarity, slot: ib.slot, level: Math.max(1, ib.level | 0), plus: Math.max(0, Math.min(12, ib.plus | 0)), name: ib.name || `(${D.RARITIES[ib.rarity].name} ${D.SLOTS[ib.slot].name.toLowerCase()}, véletlen név)`, affixes: ib.affixes.filter(a => a.id && a.v), mythic: ib.mythic };
    if (ib.line) it.line = ib.line;
    const auto = !it.affixes.length && D.RARITIES[ib.rarity].affixes ? `<p class="small muted" style="margin-top:6px">${D.RARITIES[ib.rarity].affixes} tulajdonság sorsolódik hozzá.</p>` : '';
    return itemHtml(it) + auto;
  }
  function adminFindItem(id) { const hd = S.admin.hd && S.admin.hd.data; if (!hd) return null; return D.SLOT_ORDER.map(k => hd.equipped[k]).filter(Boolean).concat(hd.inventory).filter(x => x.id === id)[0] || null; }
  function renderHeroes() {
    const h = hero(), list = heroList(), free = MAX_HEROES - 1 - list.length;
    const card = (x, active) => `<div class="nx-hcard${active ? ' on' : ''}"><div class="portrait">${A.heroSvg(x)}</div><div style="min-width:0"><b>${esc(x.name)}</b>
      <p class="small muted">${x.level}. szintű ${esc(D.CLASSES[x.classId] ? D.CLASSES[x.classId].name.toLowerCase() : '')}${x.path != null && D.PATHS[x.classId] && D.PATHS[x.classId][x.path] ? ' · ' + esc(D.PATHS[x.classId][x.path].name) : ''}</p>
      <div class="row wrap" style="gap:6px;margin-top:8px">${active ? '<span class="nx-tag" style="color:var(--jo-400)">Most vele játszol</span>' : `<button class="btn sm primary" data-act="hero-switch" data-v="${x.slot}">Vele játszom</button>${S.delSlot === x.slot ? `<input class="input" id="del-name" placeholder="Írd be: ${esc(x.name)}" style="height:34px;font-size:13px;max-width:180px"><button class="btn sm danger" data-act="hero-delete" data-v="${x.slot}">Végleg törlöm</button><button class="btn sm ghost" data-act="hero-del-no">Mégse</button>` : `<button class="btn sm ghost" data-act="hero-del-ask" data-v="${x.slot}">Törlés</button>`}`}</div></div></div>`;
    const empty = Array.from({ length: Math.max(0, free) }, () => `<button class="nx-hcard empty" data-act="hero-new"><span class="nx-hplus">+</span><div><b>Új hős</b><p class="small muted">Próbálj ki egy másik kasztot!</p></div></button>`).join('');
    return `<section class="panel"><h1>Hőseim</h1><p class="small muted" style="margin-top:4px">Legfeljebb ${MAX_HEROES} hősöd lehet, és bármikor válthatsz köztük. Mindegyik külön fejlődik (szint, felszerelés, fáklyák). A hőseid osztoznak ezeken: ${ONLINE ? 'a heti szörny napi 3 ütése, ládái és címei, a céhed (naponta legfeljebb 25 győzelem számít bele) és ' : ''}a napi ajándék.${h.expedition ? ' Ha most váltasz, a félbehagyott kaland megvárja a hősödet.' : ''}</p>
      <div class="nx-hcards">${card(Object.assign({ slot: 0 }, h), true)}${list.map(x => card(x, false)).join('')}${empty}</div></section>`;
  }
  function renderProfile() {
    const p = X.profileOf(S.save);
    if (ONLINE && S.guild) p.guild = S.guild;
    if (S.titles) p.titles = S.titles;
    return `<section class="panel"><div class="nx-ch-head"><div><h1>Profil</h1><p class="small muted">Ezt látják rólad a többiek${ONLINE ? ', ha a ranglistán rád kattintanak' : ''}. A mitikus tárgyak, a trófeák és a toronyban elért legjobb emelet mutatja meg igazán, mennyit tettél bele.</p></div></div>${profileHtml(p)}</section>`;
  }

  // ---------- kihívások: Holdtorony, esemény, vándorkereskedő, eredmények (logika: js/extra.js) ----------
  function giftBadge() { return S.save && X && X.giftState(S.save, now()).can ? ['Új', 'ma még nem vetted át', 'ok'] : null; }
  function towerBadge() { if (!S.save || !X || hero().level < 5) return null; const t = X.towerState(S.save, now()), l = X.TOWER_TRIES - t.tries; return l > 0 && t.floor === 0 ? ['Új', 'ezen a héten még nem másztál', 'warn'] : null; }
  function eventBadge() { if (!S.save || !X) return null; const l = X.EVENT_TRIES - X.eventState(S.save, now()).s.tries; return l > 0 ? [String(l), `ma még ${l} eseményharcod van`, 'warn'] : null; }
  function achBadge() { if (!S.save || !X) return null; const n = X.achList(S.save).filter(a => a.reached > a.claimed).length; return n ? [String(n), `${n} átvehető jutalom`, 'ok'] : null; }
  // névelő számok előtt: az 1., az 5., az 50., az 1000. – a 2., a 10., a 100.
  function azN(n) { const t = String(n); return (n === 1 || t[0] === '5' || (n >= 1000 && n < 2000)) ? 'az' : 'a'; }
  function chanceOf(mon) { const h = hero(); return E.winChance(E.fighterFromHero(h), mon, h.tactic, 120, 4242); }
  function chanceWord(c) { return c >= 0.8 ? 'könnyű' : c >= 0.6 ? 'jó esélyed van' : c >= 0.4 ? 'kiegyenlített' : c >= 0.2 ? 'nehéz' : 'nagyon nehéz'; }
  function rewardChips(rw) {
    return [rw.silver ? `<span class="gain">${I.silver}+${fmt(rw.silver)}</span>` : '', rw.dust && E.dustRoom(S.save, now()) > 0 ? `<span class="gain">${I.dust}+${fmt(Math.min(rw.dust, E.dustRoom(S.save, now())))}</span>` : '', rw.xp ? `<span class="gain">${I.xp}+${fmt(rw.xp)} TP</span>` : '',
      rw.item ? `<span class="gain r-${rw.item}">${icx('misc', 'lada-bare', '')}${D.RARITIES[rw.item].name} tárgy</span>` : ''].join('');
  }
  function afterChallenge(kind) {
    return c => {
      const o = c.extra.out || {};
      const bits = [o.silver ? `+${fmt(o.silver)} Holdezüst` : '', o.dust ? `+${fmt(o.dust)} Csillagpor` : '', o.item ? (o.salvaged ? `${o.item.name} (szétszedve)` : o.item.name) : '', o.points ? `+${o.points} pont` : ''].filter(Boolean);
      toast(kind === 'tower' ? (o.win ? `Megvan ${azN(o.floor)} ${o.floor}. emelet! ${bits.join(' · ')}` : `${azN(o.floor) === 'az' ? 'Az' : 'A'} ${o.floor}. emelet most nem sikerült.`) : (o.win ? `Győzelem! ${bits.join(' · ')}` : `Vereség, de ${o.points} pont így is jár.`));
    };
  }
  function renderTower() {
    tip('torony');
    if (hero().level < 5) return `<section class="panel"><h1>Holdtorony</h1><p class="muted">A Holdtorony az 5. szinttől nyílik: addig erősödj a kalandokon. Odafent emeletről emeletre egyre erősebb ellenfelek várnak, és minden új emeletért jutalom jár.</p></section>`;
    const h = hero(), t = X.towerState(S.save, now()), n = t.floor + 1, mon = X.towerMonster(n), left = X.TOWER_TRIES - t.tries, c = chanceOf(mon), rw = X.towerReward(h, n, (h.stats || {}).towerMax || 0);
    const ladder = [n + 3, n + 2, n + 1, n, t.floor].filter(x => x >= 1).map(f => {
      const r = X.towerReward(h, f, (S.save.hero.stats || {}).towerMax || 0), cls = f <= t.floor ? 'done' : f === n ? 'here' : '';
      return `<li class="${cls}"><span class="fl">${f}.</span><span class="fn">${esc(X.towerMonster(f).name)}</span><span class="fr">${f <= t.floor ? '' : r.item ? `<b class="r-${r.item}">${D.RARITIES[r.item].name} tárgy</b>` : `${I.silver}${fmt(r.silver)}`}</span>${f <= t.floor ? '<span class="ok">✓</span>' : ''}</li>`;
    }).join('');
    return `<section class="panel nx-ch"><div class="nx-ch-head"><div><h1>Holdtorony</h1><p class="small muted">Emeletről emeletre egyre erősebb ellenfelek. Amíg nyersz, mászhatsz tovább; naponta 5 vereség fér bele. Minden hétfőn elölről kezded, a legjobb eredményed megmarad; amit egyszer már megmásztál, azért legközelebb kevesebb jár.</p></div>
        <div class="nx-ch-stats"><span><small>Ezen a héten</small><b>${t.floor}. emelet</b></span><span><small>Legjobb</small><b>${t.best || 0}. emelet</b></span><span><small>Mai vereségkeret</small><b>${left} / ${X.TOWER_TRIES}</b></span></div></div>
      <div class="nx-ch-body"><div class="nx-ch-fight"><div class="nx-ch-mon">${A.monsterSvg(mon.name, X.towerRegion(n), { guard: n % 5 === 0 })}</div>
          <div><span class="tiny">${n}. emelet${n % 5 === 0 ? ' · kincses emelet' : ''}</span><h2>${esc(mon.name)}</h2><p class="small muted">${mon.level}. szintű · ${pct(c)} győzelmi esély (${chanceWord(c)})</p>
          <div class="gains" style="justify-content:flex-start;margin-top:8px">${rewardChips(rw)}</div>
          <button class="btn fakla lg" style="margin-top:12px" data-act="tower-fight" ${left > 0 ? '' : 'disabled'}>${ni('torony')}${left > 0 ? `Harc ${azN(n)} ${n}. emeletért` : 'Mára elfogyott a próbálkozás'}</button>
          ${left > 0 && t.floor < X.rushLimit(h) ? `<button class="btn ghost" style="margin-top:8px" data-act="tower-rush">Gyors mászás ${azN(X.rushLimit(h))} ${X.rushLimit(h)}. emeletig</button><p class="small muted" style="margin-top:4px">A hősödnél jóval gyengébb emeleteket egyben, harcjelenet nélkül vívja meg.</p>` : ''}
          ${left > 0 ? '' : '<p class="small muted" style="margin-top:6px">Éjfélkor újra 5 próbálkozásod lesz.</p>'}</div></div>
        <ol class="nx-ladder" aria-label="Emeletek">${ladder}</ol></div></section>`;
  }
  // ---------- Súgó (teljes oldal, képekkel) ----------
  function helpTok(t) {
    const P = (X && X.QUEST_SLOTS) || 3, map = {
      TORCH_MAX: E.TORCH.max, TORCH_MIN: Math.round(E.TORCH.regenMs / 60000), RESTED_MAX: E.TORCH.restedMax, // a BOSS_HITS és a HERO_SLOTS a szerveren él (3–3); ha ott változik, itt is át kell írni
      GATE_KEK: E.RARITY_GATE.kek, GATE_LILA: E.RARITY_GATE.lila, GATE_LEG: E.RARITY_GATE.legendas,
      PITY_LILA: E.PITY_PURPLE, PITY_LEG: E.PITY_LEGEND, INV_MAX: E.INVENTORY_MAX, REFUND: Math.round(E.REFUND * 100), PATH_LEVEL: D.PATH_LEVEL,
      TOWER_TRIES: X ? X.TOWER_TRIES : 5, EVENT_TRIES: X ? X.EVENT_TRIES : 3, ARENA_FIGHTS: X ? X.ARENA_FIGHTS : 5, TEAM_RUNS: X ? X.TEAM_RUNS : 3, STORY_TRIES: X ? X.STORY_TRIES : 3, QUEST_SLOTS: P,
      ELITE_MIN: E.ELITE ? E.ELITE.minLevel : 5, ELITE_PCT: E.ELITE ? Math.round(E.ELITE.chance * 100) : 20, MOON_MIN: E.MOONS.felhold.minLevel, BOSS_HITS: 3, HERO_SLOTS: 3
    };
    return String(t || '').replace(/\{([A-Z_]+)\}/g, (m, k) => map[k] != null ? map[k] : m);
  }
  function sampleHero(cls, i) { const P = D.PEOPLE_ORDER || ['ember']; try { return G.createSave({ name: 'Minta', classId: cls, people: P[(i || 0) % P.length] }, 0).hero; } catch (e) { return hero(); } }
  function helpFig(key) {
    const h = hero(), r = region(S.save.offers && S.save.offers[1] ? S.save.offers[1].region : 'kodlap');
    const tile = (it, plus) => `<span class="item-ic painted r-${it.rarity}">${NXI ? NXI.item(it) : ''}${plus ? `<span class="plus">+${plus}</span>` : ''}</span>`;
    const mk = (rar, slot) => E.makeItem(E.mulberry32(7 + rar.length), { rarity: rar, slot: slot, level: h.level, classId: h.classId });
    const box = (inner, cls) => `<div class="hf ${cls || ''}">${inner}</div>`;
    switch (key) {
      case 'hero': return box(`<div class="hf-hero">${A.heroSvg(h, { full: true })}</div>`);
      case 'classes': return box(Object.keys(D.CLASSES).slice(0, 8).map(c => `<figure class="hf-mini"><div class="hf-pt">${A.heroSvg(sampleHero(c, Object.keys(D.CLASSES).indexOf(c)))}</div><figcaption>${esc(D.CLASSES[c].name)}</figcaption></figure>`).join(''), 'grid4');
      case 'camp': case 'patrol': return box(`<div class="hf-scene">${A.sceneSvg(key === 'camp' ? 'tabor' : 'erdo', 4)}</div>`);
      case 'offers': return box(['konnyu', 'kozepes', 'nehez'].map(d => `<div class="hf-offer${d === 'kozepes' ? ' rec' : ''}">${d === 'kozepes' ? '<span class="hf-rec">AJÁNLOTT</span>' : ''}<span class="diff-pill d-${d}">${E.DIFF[d].name}</span><b class="d-${d}">${pct(E.DIFF[d].target)}</b><small>esély</small></div>`).join(''), 'row nowrap');
      case 'clearing': return box(['harc', 'kutatas', 'esemeny'].map(t => `<div class="hf-card t-${t}"><span class="ic">${I[t]}</span><b>${{ harc: 'Harc', kutatas: 'Kutatás', esemeny: 'Esemény' }[t]}</b></div>`).join(''), 'row');
      case 'events': return box(Object.keys(KIND_NAME).map(k => `<span class="hf-badge${k === 'arany' ? ' gold' : ''}">${KIND_NAME[k]}</span>`).join(''), 'wrap');
      case 'guard': return box(`<div class="portrait md elite">${A.monsterSvg('Öreg Brekus, a lápkirály', 'kodlap', true)}</div><div><span class="elite-tag">Elit</span><p class="small muted" style="margin-top:6px">Az elit őrzőt rózsaszín keret jelzi.</p></div>`, 'row');
      case 'combat': return box(`<div class="hf-pt lg">${A.heroSvg(h)}</div><b class="hf-vs">VS</b><div class="hf-pt lg">${A.monsterSvg('Nádi farkas', 'kodlap', false)}</div>`, 'row center');
      case 'tactics': return box(`<div class="seg">${['roham', 'kiegy', 'kitartas'].map(id => `<button aria-pressed="${h.tactic === id}" tabindex="-1">${D.TACTICS[id].name}</button>`).join('')}</div>`, 'center');
      case 'items': return box(D.RARITY_ORDER.map((r, i) => `<figure class="hf-mini">${tile(mk(r, D.SLOT_ORDER[i % D.SLOT_ORDER.length]))}<figcaption class="r-${r}">${esc(D.RARITIES[r].name)}</figcaption></figure>`).join(''), 'row');
      case 'upgrade': return box(`${tile(mk('lila', 'fegyver'), 5)}<span class="hf-arrow">←</span><span class="gain">${I.dust}Csillagpor</span><span class="gain">${I.silver}Holdezüst</span>`, 'row center');
      case 'moons': return box(E.MOON_ORDER.map((m, i) => `<figure class="hf-mini"><span class="hf-moon m${i}"></span><figcaption>${esc(E.MOONS[m].name)}</figcaption></figure>`).join(''), 'row');
      case 'torches': return box(`<div class="hf-torches">${Array.from({ length: E.TORCH.max }, (_, i) => `<span class="torch ${i < 5 ? 'on' : 'off'}">${I.torch}</span>`).join('')}</div><span class="gain">${I.rested}Frissesség</span>`, 'col center');
      case 'currencies': return box([[I.silver, 'Holdezüst'], [I.dust, 'Csillagpor'], [I.torch.replace('<svg', '<svg width="14" height="20"'), 'Fáklya'], [I.rested, 'Frissesség'], [I.xp, 'Tapasztalat']].map(([ic, n]) => `<span class="gain">${ic}${n}</span>`).join(''), 'wrap');
      case 'paths': { const P = (D.PATHS && D.PATHS[h.classId]) || []; return box(P.map(p => `<div class="hf-card"><b>${esc(p.name)}</b></div>`).join('') || '', 'col'); }
      case 'story': { const c = D.STORY && D.STORY.chapters[0]; return box(c ? `<div class="portrait md">${A.monsterSvg(c.boss.name, c.region, true)}</div><div><span class="tiny">1. fejezet</span><b style="display:block">${esc(c.title)}</b></div>` : '', 'row'); }
      case 'quests': return box(`<div class="qcard" style="width:100%"><div class="q-giver"><b>Teca néni, a fogadósné</b></div><b>A titkos fűszer</b><div class="q-prog"><div class="bar"><i style="width:50%"></i></div><span class="small">1 / 2</span></div></div>`);
      case 'tower': return box(`<ol class="nx-ladder hf-ladder">${[4, 3, 2, 1].map(f => `<li class="${f === 2 ? 'here' : f < 2 ? 'done' : ''}"><span class="fl">${f}.</span><span class="fn">${f === 2 ? 'itt tartasz' : f < 2 ? 'megvan' : 'még előtted'}</span></li>`).join('')}</ol>`);
      case 'event': case 'boss': return box(`<div class="portrait md">${A.monsterSvg(key === 'boss' ? 'A Fenevad' : 'Ködkirálynő', key === 'boss' ? 'holdfeny' : 'kodlap', true)}</div>`, 'center');
      case 'arena': return box(`<div class="hf-pt lg">${A.heroSvg(h)}</div><b class="hf-vs">VS</b><div class="hf-pt lg flip">${A.heroSvg(sampleHero(h.classId === 'harcos' ? 'magus' : 'harcos'))}</div>`, 'row center');
      case 'team': return box(['harcos', 'gyogyito', 'vadasz'].map((c, i) => `<div class="hf-pt">${A.heroSvg(sampleHero(c, i + 1))}</div>`).join('') + `<b class="hf-vs">VS</b><div class="hf-pt lg">${A.monsterSvg('Griffkirály', 'szirtek', true)}</div>`, 'row center');
      case 'guild': return box(`<span class="hf-emblem">${I.shield}</span>`, 'center');
      case 'album': return box(['Iszapmanó', 'Holdfarkas', 'Kőgólem', 'Szirti griff'].map((n, i) => `<div class="hf-pt${i > 1 ? ' unk' : ''}">${A.monsterSvg(n, ['kodlap', 'holdfeny', 'arnyromok', 'szirtek'][i], false)}</div>`).join(''), 'row');
      case 'gift': return box(`<span class="hf-big">${icx('misc', 'lada', I.item)}</span>`, 'center');
      case 'shop': return box(['kek', 'zold', 'kek'].map((r, i) => tile(mk(r, D.SLOT_ORDER[i + 2]))).join('') + `<span class="gain">${I.silver}Holdezüst</span>`, 'row center');
      case 'heroes': return box(`<div class="hf-pt">${A.heroSvg(h)}</div><div class="hf-slot">+</div><div class="hf-slot">+</div>`, 'row center');
      case 'settings': return box(`<span class="hf-big">${I.gear}</span>`, 'center');
      default: return '';
    }
  }
  function helpBlocks(sec) {
    return sec.blocks.map(b => b.tip ? `<div class="advice hf-tip">${A.OWL.replace('width="64" height="64"', 'width="34" height="34"')}<div>${esc(helpTok(b.tip))}</div></div>`
      : `${b.h ? `<h3>${esc(b.h)}</h3>` : ''}${b.p ? `<p>${esc(helpTok(b.p))}</p>` : ''}${b.list ? `<ul>${b.list.map(x => `<li>${esc(helpTok(x))}</li>`).join('')}</ul>` : ''}`).join('');
  }
  function helpText(sec) { return (sec.title + ' ' + sec.short + ' ' + sec.blocks.map(b => [b.h, b.p, b.tip].concat(b.list || []).join(' ')).join(' ')).toLowerCase(); }
  function renderHelp() {
    const H = D.HELP, q = (S.helpQ || '').trim().toLowerCase();
    const secs = H.sections.filter(x => ONLINE || !x.online);
    const match = x => !q || helpTok(helpText(x)).indexOf(q) >= 0;
    const shown = secs.filter(match);
    const byId = {}; secs.forEach(x => byId[x.id] = x);
    const toc = H.groups.map(g => { const items = g.ids.map(id => byId[id]).filter(x => x && match(x)); return items.length ? `<div class="hp-grp"><h4>${esc(g.title)}</h4>${items.map(x => `<a href="#hp-${x.id}" data-act="help-go" data-v="${x.id}">${esc(x.title)}</a>`).join('')}</div>` : ''; }).join('');
    const faq = (H.faq || []).filter(f => !q || helpTok(f.q + ' ' + f.a).toLowerCase().indexOf(q) >= 0);
    const body = shown.map(x => `<section class="panel hp-sec" id="hp-${x.id}"><div class="hp-txt"><h2>${esc(x.title)}</h2><p class="hp-short">${esc(helpTok(x.short))}</p>${helpBlocks(x)}${x.go ? `<button class="btn ghost sm" data-act="screen" data-v="${x.go}" style="margin-top:10px">Megnézem a játékban →</button>` : ''}</div>
        <figure class="hp-fig">${helpFig(x.fig)}${x.figCaption ? `<figcaption>${esc(x.figCaption)}</figcaption>` : ''}</figure></section>`).join('');
    return `<section class="panel hp-head"><div class="row" style="gap:14px;align-items:center">${A.OWL.replace('width="64" height="64"', 'width="56" height="56"')}<div><h1>Súgó</h1><p class="muted">${esc(helpTok(H.intro))}</p></div></div>
        <label class="hp-search"><span class="sr-only">Keresés a súgóban</span><input type="search" id="help-q" placeholder="Keresés: pl. fáklya, legendás, elit…" value="${esc(S.helpQ || '')}" autocomplete="off"></label>
        <select class="hp-jump" data-act="help-jump" aria-label="Ugrás egy témához"><option value="">Ugrás egy témához…</option>${H.groups.map(g => `<optgroup label="${esc(g.title)}">${g.ids.map(id => byId[id]).filter(x => x && match(x)).map(x => `<option value="${x.id}">${esc(x.title)}</option>`).join('')}</optgroup>`).join('')}${faq.length ? '<option value="gyik">Gyakori kérdések</option>' : ''}</select></section>
      <div class="hp-layout"><nav class="hp-toc" aria-label="Tartalom">${toc || '<p class="small muted">Nincs találat.</p>'}${faq.length ? '<div class="hp-grp"><h4>Kérdések</h4><a href="#hp-gyik" data-act="help-go" data-v="gyik">Gyakori kérdések</a></div>' : ''}</nav>
      <div class="hp-body">${body}${faq.length ? `<section class="panel hp-sec hp-faq" id="hp-gyik"><div class="hp-txt"><h2>Gyakori kérdések</h2>${faq.map(f => `<details><summary>${esc(helpTok(f.q))}</summary><p>${esc(helpTok(f.a))}</p></details>`).join('')}</div></section>` : ''}${!body && !faq.length ? '<section class="panel"><p class="muted">Erre nincs találat. Próbálj egy másik szót!</p></section>' : ''}</div></div>`;
  }
  // ---------- Bestiárium (a gyűjtőalbumban) ----------
  const WEEKLY_BOSSES = [['A Fenevad', 'holdfeny'], ['Ködkirálynő', 'kodlap'], ['A Holdfaló', 'ejkatlan'], ['Árnyékcsőr', 'arnyromok'], ['A Hamuszarvú', 'szirtek'], ['Csillagrém', 'szirtek'], ['A Mocsárkirály', 'kodlap'], ['Éjanya', 'ejkatlan']];
  function bestiary(al, mons, monHtml) {
    if (!D.QUESTS || !D.QUESTS.lore) return `<section class="panel"><h2>Gyűjtőalbum: legyőzött őrzők (${mons.length})</h2><ul class="nx-album mons">${monHtml}</ul></section>`;
    const K = al.kills || {}, M = al.mon || {}, L = D.QUESTS.lore;
    const seen = n => (K[n] || 0) > 0 || !!M[n] || !!(al.seen || {})[n] || (S.bossMine || []).some(m => m.name === n && m.damage > 0);
    const card = (n, rid, tag) => seen(n)
      ? `<li class="bst"><span class="pt">${A.monsterSvg(n, rid, { guard: tag !== 'mon' })}</span><div><b>${esc(n)}</b><span class="tiny">${tag === 'guard' ? 'Őrző' : tag === 'story' ? 'Holdkrónika' : tag === 'boss' ? 'Heti szörny' : 'Szörny'}${K[n] ? ` · legyőzve ${K[n]}×` : ''}</span><p class="small muted">${esc(L[n] || '')}</p></div></li>`
      : `<li class="bst unk"><span class="pt">${A.monsterSvg(n, rid, { guard: tag !== 'mon' })}</span><div><b>???</b><span class="tiny">${tag === 'guard' ? 'Őrző' : tag === 'story' ? 'Holdkrónika' : tag === 'boss' ? 'Heti szörny' : 'Szörny'}</span><p class="small muted">Még nem találkoztál vele.</p></div></li>`;
    const groups = D.REGIONS.map(r => { const list = r.monsters.map(n => [n, 'mon']).concat(r.guards.map(n => [n, 'guard'])); return { title: r.name, items: list.map(([n, t]) => card(n, r.id, t)), have: list.filter(([n]) => seen(n)).length, all: list.length }; });
    const sp = (D.STORY ? D.STORY.chapters.map(c => [c.boss.name, c.region, 'story']) : []).concat(WEEKLY_BOSSES.map(([n, r]) => [n, r, 'boss']));
    groups.push({ title: 'Különleges ellenfelek', items: sp.map(([n, r, t]) => card(n, r, t)), have: sp.filter(([n]) => seen(n)).length, all: sp.length });
    const tot = groups.reduce((a, g) => a + g.have, 0), all = groups.reduce((a, g) => a + g.all, 0);
    return `<section class="panel"><h2>Bestiárium (${tot} / ${all})</h2><p class="small muted">Minden lény, akivel a kalandjaid során összefutottál. Akit legyőzöl, annak a leírása is előkerül.</p>
      ${groups.map(g => `<details class="bst-grp"><summary>${esc(g.title)} <span class="small muted">${g.have} / ${g.all}</span></summary><ul class="nx-album bst-list">${g.items.join('')}</ul></details>`).join('')}</section>`;
  }
  // ---------- Megbízások ----------
  function questBadge() {
    if (!S.save || !X || !D.QUESTS) return null;
    const s = X.questState(S.save, now()), n = s.list.filter(q => q.prog >= q.n).length;
    return n ? [String(n), `${n} teljesített megbízás vár átvételre`, 'ok'] : null;
  }
  function renderQuests() {
    if (!D.QUESTS) return '<section class="panel"><h1>Megbízások</h1><p class="muted">Hamarosan.</p></section>';
    if (!S.save.quests || S.save.quests.day !== X.day(now())) { // a napi megbízásokat a szerver sorsolja ki
      if (S.qTried && S.qTried.d === X.day(now()) && now() - S.qTried.t < 60000) return '<section class="panel"><h1>Megbízások</h1><p class="muted">Most nem sikerült betölteni a megbízásokat. Próbáld újra kicsit később.</p></section>';
      if (!S.qLoading) { S.qLoading = true; S.qTried = { d: X.day(now()), t: now() }; setTimeout(() => act('questView', {}).finally(() => { S.qLoading = false; }), 0); }
      return '<section class="panel"><h1>Megbízások</h1><p class="muted">A tábor lakói épp összegyűlnek…</p></section>';
    }
    const h = hero(), s = S.save.quests, GV = D.QUESTS.givers;
    const cards = s.list.map(q => {
      const t = D.QUESTS.templates.filter(x => x.id === q.tpl)[0] || {}, g = GV[t.giver] || { name: 'Valaki a táborból' }, rw = X.questReward(h, q, X.questLm(S.save)), done = q.prog >= q.n, P = Math.round(q.prog / q.n * 100);
      return `<article class="qcard${done ? ' done' : ''}"><div class="q-giver"><b>${esc(g.name)}</b>${g.line ? `<span class="small muted">${esc(g.line)}</span>` : ''}</div>
        <h3>${esc(X.questText(q, 'title'))}</h3><p>${esc(X.questText(q, 'text'))}</p>
        <div class="q-prog"><div class="bar"><i style="width:${P}%"></i></div><span class="small">${q.prog} / ${q.n}</span></div>
        <div class="gains" style="justify-content:flex-start">${rewardChips(rw)}</div>
        <div class="row" style="gap:8px;margin-top:10px">${done ? `<button class="btn primary" data-act="quest-claim" data-v="${q.id}">Átveszem a jutalmat</button>` : `<button class="btn ghost sm" data-act="quest-drop" data-v="${q.id}" ${s.dropped >= 1 ? 'disabled title="Naponta egy megbízást mondhatsz le"' : ''}>Lemondom</button>`}</div></article>`;
    }).join('');
    const empty = QUEST_EMPTY(s);
    return `<section class="panel nx-ch"><div class="nx-ch-head"><div><h1>Megbízások</h1><p class="small muted">A tábor lakói kérnek tőled ezt-azt. A haladás magától számolódik, miközben kalandozol. Amit teljesítesz, annak a helyére másnap jön új; naponta egyet lemondhatsz.</p></div></div>
      ${S.questDone ? `<div class="result-box good" style="margin-top:12px"><p>${esc(S.questDone.text)}</p><div class="gains" style="justify-content:flex-start;margin-top:8px">${rewardChips(S.questDone)}</div></div>` : ''}
      <div class="qgrid">${cards}${empty}</div></section>`;
  }
  function QUEST_EMPTY(s) { const n = X.QUEST_SLOTS - s.list.length; return n > 0 ? Array(n).fill('<article class="qcard empty"><p class="muted">Holnap új megbízás érkezik ide.</p></article>').join('') : ''; }
  // ---------- Holdkrónika ----------
  function storyBadge() {
    if (!S.save || !X || !D.STORY) return null;
    const st = X.storyState(S.save, now()), ch = X.storyChapters()[st.done];
    return ch && hero().level >= ch.level && st.losses < X.STORY_TRIES ? ['Új', 'új fejezet vár a Holdkrónikában', 'warn'] : null;
  }
  function storyTxt(t) { return esc(String(t || '').replace(/\{nev\}/g, hero().name)); }
  function storyScenes(ch, choices) {
    const C = D.STORY.characters || {}, idx = D.STORY.chapters.indexOf(ch);
    const nm = w => w.later && idx >= w.later.from ? w.later.name : w.name;
    return ch.scenes.filter(sc => { if (!sc.if) return true; const p = sc.if.split(':'); return choices[p[0]] === p[1]; }).map(sc => {
      const who = sc.who && C[sc.who];
      return `<div class="st-scene${who ? '' : ' nar'}">${who ? `<b class="st-who">${esc(nm(who))}</b>` : ''}<p>${storyTxt(sc.text)}</p></div>`;
    }).join('');
  }
  function renderStory() {
    if (!D.STORY) return '<section class="panel"><h1>Holdkrónika</h1><p class="muted">Hamarosan.</p></section>';
    const h = hero(), st = X.storyState(S.save, now()), chs = X.storyChapters(), i = st.done, ch = chs[i];
    const head = `<div class="nx-ch-head"><div><h1>Holdkrónika</h1><p class="small muted">A Nyxoria fő története. Nagyjából ötszintenként új fejezet nyílik; mindegyik végén egy különleges ellenfél vár, és egyszeri, bőséges jutalom.</p></div>
      <div class="nx-ch-stats"><span><small>Fejezetek</small><b>${i} / ${chs.length}</b></span>${ch && h.level >= ch.level ? `<span><small>Mai vereségkeret</small><b>${X.STORY_TRIES - st.losses} / ${X.STORY_TRIES}</b></span>` : ''}</div></div>`;
    let res = '';
    if (S.storyRes) { const r = S.storyRes, c0 = chs[r.i]; res = `<div class="result-box ${r.win ? 'good' : 'bad'} st-res"><span class="tiny">${r.i + 1}. fejezet · ${r.win ? 'Győzelem' : 'Most nem sikerült'}</span><p style="margin-top:6px">${storyTxt(r.win ? c0.win : c0.lose)}</p>${r.win && c0.reward ? `<p class="small" style="margin-top:8px;color:var(--fakla-300)">${storyTxt(c0.reward)}</p>` : ''}${r.win && r.out ? `<div class="gains" style="justify-content:flex-start;margin-top:8px">${rewardChips({ silver: r.out.silver, dust: r.out.dust })}</div>${r.out.item ? `<div style="margin-top:10px">${itemHtml(r.out.item, { delta: true })}</div>` : ''}` : ''}</div>`; }
    let body = '';
    if (!ch) body = `<div class="result-box good"><h2>Vége… egyelőre</h2><p class="muted" style="margin-top:6px">A Holdkrónika minden fejezetét végigjártad. Bubó szerint a hold még tartogat meglepetéseket.</p></div>`;
    else if (h.level < ch.level) body = `<div class="st-locked"><span class="tiny">${i + 1}. fejezet · ${esc(region(ch.region).name)}</span><h2>${esc(ch.title)}</h2><p class="muted">${storyTxt(ch.teaser)}</p><p class="small" style="margin-top:8px">A ${ch.level}. szinttől nyílik. Most ${h.level}. szintű vagy.</p></div>`;
    else {
      const chosen = st.choices[ch.id], left = X.STORY_TRIES - st.losses, mon = X.storyBoss(i), c = chanceOf(mon), rw = X.storyReward(h, i);
      const choice = ch.choice ? (chosen ? `<div class="st-scene st-chosen"><b class="st-who">Te döntöttél</b><p>${esc(ch.choice[chosen].label)}</p><p class="muted" style="margin-top:4px">${storyTxt(ch.choice[chosen].reply)}</p></div>`
        : `<div class="st-choice"><p><b>${storyTxt(ch.choice.prompt)}</b></p><div class="event-choices"><button class="btn ev-opt" data-act="story-choice" data-v="a"><span>${esc(ch.choice.a.label)}</span></button><button class="btn ev-opt" data-act="story-choice" data-v="b"><span>${esc(ch.choice.b.label)}</span></button></div></div>`) : '';
      const ready = !ch.choice || chosen;
      const boss = ready ? `<div class="nx-ch-fight st-boss"><div class="nx-ch-mon">${A.monsterSvg(mon.name, ch.region, { guard: true })}</div>
          <div><span class="tiny">A fejezet ellenfele</span><h2>${esc(ch.boss.name)}</h2><p style="margin-top:4px">${storyTxt(ch.boss.intro)}</p><p class="small muted" style="margin-top:6px">${mon.level}. szintű · ${pct(c)} győzelmi esély (${chanceWord(c)})</p>
          <div class="gains" style="justify-content:flex-start;margin-top:8px">${rewardChips(rw)}</div>
          ${h.inventory.length >= E.INVENTORY_MAX ? '<p class="small" style="margin-top:10px;color:var(--veszely-400)">Tele a táskád. Csinálj helyet, hogy a fejezet jutalma beférjen.</p>' : ''}
          <button class="btn fakla lg" style="margin-top:12px" data-act="story-fight" ${left > 0 && h.inventory.length < E.INVENTORY_MAX ? '' : 'disabled'}>${ni('kronika')}${left > 0 ? 'Harcba!' : 'Mára elég volt'}</button>
          ${left > 0 ? '<p class="small muted" style="margin-top:6px">A taktikát a Tábor kalandjainál állíthatod. A vereség nem visz el semmit.</p>' : '<p class="small muted" style="margin-top:6px">Éjfélkor újra próbálhatod. Addig erősödj a kalandokon.</p>'}</div></div>` : '';
      body = `<article class="st-ch"><span class="tiny">${i + 1}. fejezet · ${esc(region(ch.region).name)}</span><h2>${esc(ch.title)}</h2><div class="st-scenes">${storyScenes(ch, st.choices)}${choice}</div>${boss}</article>`;
    }
    const past = chs.slice(0, i).map((c0, k) => `<details class="st-past"><summary><span class="tiny">${k + 1}. fejezet</span> ${esc(c0.title)} <span class="ok">✓</span></summary><div class="st-scenes">${storyScenes(c0, st.choices)}${c0.choice && st.choices[c0.id] ? `<div class="st-scene st-chosen"><b class="st-who">Te döntöttél</b><p>${esc(c0.choice[st.choices[c0.id]].label)}</p></div>` : ''}<div class="st-scene nar"><p>${storyTxt(c0.win)}</p></div></div></details>`).reverse().join('');
    return `<section class="panel nx-ch">${head}${res}${body}${past ? `<div class="st-pastlist"><h3>Az eddigi fejezetek</h3>${past}</div>` : ''}</section>`;
  }
  function renderEvent() {
    tip('esemeny');
    const x = X.eventState(S.save, now()), ev = x.ev, s = x.s, left = X.EVENT_TRIES - s.tries, h = hero();
    const daysLeft = ev.daysLeft || Math.max(1, Math.ceil((ev.ends - now()) / 864e5));
    const max = X.EVENT_TIERS[X.EVENT_TIERS.length - 1].p, P = Math.min(100, s.points / max * 100);
    const tiers = X.EVENT_TIERS.map((t, i) => {
      const got = s.claimed.indexOf(i) >= 0, can = !got && s.points >= t.p;
      const what = t.k === 'silver' ? `${I.silver}${fmt(Math.round(E.silverBase(h.level) * t.m))} Holdezüst` : t.k === 'dust' ? `${I.dust}${fmt(t.n)} Csillagpor${!got && E.dustRoom(S.save, now()) < t.n ? ' <span class="small muted">(heti keret: most csak ' + fmt(E.dustRoom(S.save, now())) + ')</span>' : ''}` : t.k === 'item' ? `${icx('misc', 'lada-bare', '')}<span class="r-${E.gateRarity('kek', h.level)}">${E.gateRarity('kek', h.level) === 'kek' ? 'Kék' : 'Zöld'} tárgy</span>` : `${icx('item', 'slot-' + ev.prize.slot, '')}<span class="r-${E.gateRarity('lila', h.level)}">${esc(ev.prize.name)}</span>${h.level < E.RARITY_GATE.lila ? ' <span class="small muted">(kék; a 12. szinttől lila)</span>' : ''}`;
      return `<li class="${got ? 'done' : can ? 'here' : ''}"><span class="pt">${t.p} pont</span><span class="w">${what}</span>${got ? '<span class="ok">Átvéve</span>' : can ? `<button class="btn sm primary" data-act="event-claim" data-v="${i}">Átveszem</button>` : `<span class="small muted">még ${t.p - s.points} pont</span>`}</li>`;
    }).join('');
    return `<section class="panel nx-ch nx-ev"><div class="nx-ev-banner">${A.sceneSvg(ev.region, 3)}<div class="nx-ev-txt"><span class="tiny">A hét eseménye · még ${daysLeft} napig</span><h1>${esc(ev.name)}</h1><p>${esc(ev.line)}</p></div></div>
      <div class="nx-ev-prog"><div class="row between"><b>${s.points} pont</b><span class="small muted">Győzelem 10 pont, vereség 3 pont · ma még ${left} harc</span></div><div class="xp" style="margin-top:6px"><i style="width:${P}%"></i></div></div>
      <div class="nx-ch-body"><div class="nx-ch-fight"><div class="nx-ch-mon">${A.monsterSvg(ev.monster, ev.region, { boss: true })}</div>
        <div><span class="tiny">Az esemény szörnye</span><h2>${esc(ev.monster)}</h2><p class="small muted">A szintedhez igazodik: nagyjából 60% győzelmi esély.</p>
        <button class="btn fakla lg" style="margin-top:12px" data-act="event-fight" ${left > 0 ? '' : 'disabled'}>${ni('esemeny')}${left > 0 ? 'Harcba szállok' : 'Mára elfogyott a harc'}</button></div></div>
        <div><h3 style="margin-bottom:8px">Jutalmak</h3><ol class="nx-tiers">${tiers}</ol><p class="small muted" style="margin-top:8px">Hétfőn új esemény jön: a pontok és a díj csak addig gyűjthetők.</p></div></div></section>`;
  }
  function renderShop() {
    tip('bolt');
    const h = hero(), sh = S.save.shop;
    if (!sh || sh.day !== G.budapestDate(now())) { if (!S.shopLoading) { S.shopLoading = true; setTimeout(() => act('shopOpen', {}, () => { S.shopLoading = false; }), 0); } return `<section class="panel"><h1>Vándorkereskedő</h1><p class="muted">A kereskedő kipakol…</p></section>`; }
    const cards = sh.items.map((x, i) => `<div class="panel nx-ware${x.sold ? ' sold' : ''}">${itemHtml(x.item, { delta: !x.sold })}
        <div class="row between" style="margin-top:10px"><b class="price">${I.silver}${fmt(x.price)}</b>${x.sold ? '<span class="badge">Elkelt</span>' : `<button class="btn primary sm" data-act="shop-buy" data-v="${i}" ${h.silver >= x.price ? '' : 'disabled'}>Megveszem</button>`}</div></div>`).join('');
    return `<section class="panel"><div class="nx-ch-head"><div><h1>Vándorkereskedő</h1><p class="small muted">Naponta új áru, a szintedhez és a kasztodhoz igazítva. Mindegyikből egy darab van. Éjfélkor új árut hoz.</p></div>
      <div class="nx-ch-stats"><span><small>Holdezüstöd</small><b>${I.silver}${fmt(h.silver)}</b></span></div></div>
      ${(() => { const left = X.SHOP_REROLLS - (sh.rerolls || 0), cost = X.shopRerollCost(h); return `<div class="row wrap" style="gap:10px;margin-top:10px;align-items:center"><button class="btn ghost sm" data-act="shop-reroll" ${left > 0 && h.silver >= cost ? '' : 'disabled'}>Új árut kérek (${I.silver}${fmt(cost)})</button><span class="small muted">${left > 0 ? `Ma még ${left}× pakoltathatsz újra.` : 'Ma már nem pakol újra.'}</span></div>`; })()}</section>
      <div class="nx-wares">${cards}</div>`;
  }
  function renderAch() {
    tip('eredmenyek');
    const list = X.achList(S.save), al = S.save.album || { mon: {}, items: {} };
    const cards = list.map(a => {
      const pips = a.tiers.map((t, i) => `<i class="${i < a.claimed ? 'got' : i < a.reached ? 'can' : ''}" title="${t} ${esc(a.unit)}"></i>`).join('');
      const nxt = a.claimed < a.tiers.length ? a.tiers[a.claimed] : null, P = nxt ? Math.min(100, a.value / nxt * 100) : 100;
      const can = a.reached > a.claimed;
      return `<div class="nx-ach${can ? ' can' : ''}${!nxt ? ' full' : ''}">${icx('misc', can || !nxt ? 'lada' : 'harcero', '')}<div class="t"><b>${esc(a.name)}</b><span class="small muted">${nxt ? `${fmt(Math.min(a.value, nxt))} / ${fmt(nxt)} ${esc(a.unit)}` : 'Minden fokozat megvan'}</span><div class="xp"><i style="width:${P}%"></i></div><div class="pips">${pips}</div></div>
        ${can ? `<button class="btn primary sm" data-act="ach-claim" data-v="${a.id}">Átveszem<small>${I.dust}${a.reward.dust} ${I.silver}${fmt(a.reward.silver)}${a.titles && a.titles[a.claimed] ? ` · cím: ${esc(a.titles[a.claimed])}` : ''}</small></button>` : ''}${!can && a.titles && a.titles[a.claimed] ? `<div class="small" style="color:var(--rit-legendas);margin-top:4px">Következő cím: ${esc(a.titles[a.claimed])}</div>` : ''}</div>`;
    }).join('');
    const mons = Object.keys(al.mon || {}), items = Object.keys(al.items || {});
    const monHtml = mons.length ? mons.map(m => `<li title="${esc(m)}"><span class="pt">${A.monsterSvg(m, al.mon[m], { guard: true })}</span><span>${esc(m)}</span></li>`).join('') : '<p class="small muted">Még egy őrzőt sem győztél le.</p>';
    const itemHtml2 = items.length ? items.map(n => { const x = al.items[n], r = x.r === 'mitikus' ? 'legendas' : x.r; return `<li><span class="item-ic painted r-${r}${x.r === 'mitikus' ? ' mythic' : ''}">${NXI ? NXI.item({ name: n, slot: x.slot, rarity: r, mythic: x.r === 'mitikus' }) : ''}</span><span class="r-${r}">${esc(n)}</span></li>`; }).join('') : '<p class="small muted">A kék, lila, legendás és mitikus tárgyaid ide kerülnek.</p>';
    return `<section class="panel"><div class="nx-ch-head"><div><h1>Eredmények</h1><p class="small muted">Minden eredménynek több fokozata van, mindegyikért jutalom jár.</p></div><div class="nx-ch-stats"><span><small>Album</small><b>${X.albumCount(S.save)} lap</b></span></div></div>
      <div class="nx-achs">${cards}</div></section>
      ${bestiary(al, mons, monHtml)}
      <section class="panel"><h2>Gyűjtőalbum: ritka tárgyak (${items.length})</h2><ul class="nx-album">${itemHtml2}</ul></section>`;
  }

  // ---------- együtt: Aréna, csapat, céh ----------
  function arenaBadge() { if (!S.save || !X) return null; const l = X.ARENA_FIGHTS - X.arenaState(S.save, now()).fights; return l > 0 ? [String(l), `ma még ${l} párbajod van`, 'warn'] : null; }
  function teamBadge() { if (!S.save || !X) return null; const l = X.TEAM_RUNS - X.teamState(S.save, now()).runs; return l > 0 ? [String(l), `ma még ${l} küldetésed van`, 'warn'] : null; }
  function snapPortrait(c) { return A.heroSvg({ name: c.name, classId: c.classId, rig: c.rig, look: c.look, people: c.people }); }
  function oppCard(c, body) {
    return `<span class="pt" aria-hidden="true">${snapPortrait(c)}</span><b>${esc(c.name)}</b><span class="small muted">${c.level}. szintű ${esc(D.CLASSES[c.classId].name.toLowerCase())}${c.bot ? ' · gépi' : ''}</span><span class="small">Harcerő ${fmt(c.power)}</span>${body || ''}`;
  }
  function renderArena() {
    tip('arena');
    const s = X.arenaState(S.save, now()), left = X.ARENA_FIGHTS - s.fights, c = s.cands || [];
    const reroll = c.length && left > 0 ? `<button class="btn ghost sm" style="margin-top:10px" data-act="arena-find" ${(s.rerolls || 0) >= 1 ? 'disabled' : ''}>${(s.rerolls || 0) >= 1 ? 'Ma már kértél új ellenfeleket' : 'Új ellenfeleket kérek (naponta egyszer)'}</button>` : '';
    const cards = c.length ? `<div class="nx-opps">${c.map((x, i) => `<div class="nx-opp">${oppCard(x, `<span class="nx-tag">${fmt(x.rating)} pont</span>${x.chance != null ? `<span class="small"><b style="color:${x.chance >= 0.6 ? 'var(--jo-400)' : x.chance >= 0.4 ? 'var(--fakla-300)' : '#ff8a8a'}">${pct(x.chance)}</b> győzelmi esély</span>` : ''}<span class="small muted">győzelem +${x.gain} · vereség −${x.loss} pont</span><button class="btn fakla" data-act="arena-fight" data-v="${i}">${ni('arena')}Kihívom</button>`)}</div>`).join('')}</div>`
      : `<button class="btn fakla lg" style="margin-top:14px" data-act="arena-find" ${left > 0 ? '' : 'disabled'}>${ni('arena')}${left > 0 ? 'Ellenfelet keresek' : 'Mára elfogytak a párbajok'}</button>`;
    return `<section class="panel"><div class="nx-ch-head"><div><h1>Aréna</h1><p class="small muted">Párbaj más játékosok hőseivel. A hősöd magától harcol: a felszerelés, a képességek sorrendje és a taktika dönt. ${ONLINE ? 'Az ellenfeleid hasonló erejű játékosok; ha épp nincs elég, gépi ellenfél pótolja őket.' : 'Gyakorló módban gépi ellenfelekkel párbajozol.'}</p></div>
      <div class="nx-ch-stats"><span><small>Pontszám</small><b>${fmt(s.rating)}</b></span><span><small>Győzelem / vereség</small><b>${s.wins} / ${s.losses}</b></span><span><small>Heti győzelem</small><b>${s.weekWins || 0}</b></span><span><small>Mai párbaj</small><b>${left} / ${X.ARENA_FIGHTS}</b></span></div></div>
      ${cards}${reroll}<p class="small muted" style="margin-top:12px">Győzelemért pontot, Holdezüstöt és Csillagport kapsz, vereségért kevesebb Holdezüstöt. Az erősebb ellenfél legyőzése több pontot ér.</p></section>`;
  }
  function renderTeam() {
    tip('csapat');
    const s = X.teamState(S.save, now()), left = X.TEAM_RUNS - s.runs, c = s.cands || [], pick = S.teamPick || [];
    const cards = c.length ? `<div class="nx-opps">${c.map((x, i) => `<button class="nx-opp pick" data-act="team-pick" data-v="${i}" aria-pressed="${pick.indexOf(i) >= 0}">${oppCard(x)}</button>`).join('')}</div>
        <p class="small" style="margin-top:12px">${pick.length ? `Az őrző a csapatotok erejéhez igazodik: nagyjából <b>50–55%</b> az esélyetek. Győzelemért: ${I.xp}${fmt(Math.round(E.xpBase(hero().level) * 1.5))} TP · ${I.silver}${fmt(E.silverBase(hero().level) * 2)} · ${I.dust}${fmt(15 + hero().level)} · 60% eséllyel legalább ${D.RARITIES[E.gateRarity('kek', hero().level)].name} tárgy${hero().level >= E.RARITY_GATE.legendas ? ', szerencsével lila vagy legendás' : hero().level >= E.RARITY_GATE.lila ? ', szerencsével lila' : ''}.` : 'Kattints a társakra: egyet vagy kettőt vihetsz.'}</p>
        <button class="btn fakla lg" style="margin-top:8px" data-act="team-go" ${pick.length ? '' : 'disabled'}>${ni('csapat')}${pick.length ? `Indulunk (${pick.length + 1} fő)` : 'Válassz 1 vagy 2 társat'}</button>`
      : `<button class="btn fakla lg" style="margin-top:14px" data-act="team-find" ${left > 0 ? '' : 'disabled'}>${ni('csapat')}${left > 0 ? 'Társakat keresek' : 'Mára elfogytak a küldetések'}</button>`;
    return `<section class="panel"><div class="nx-ch-head"><div><h1>Csapatküldetések</h1><p class="small muted">Egy vagy két társat viszel magaddal, és együtt mentek egy erős őrző ellen. A társak minden körben veled ütnek, a szörny a csapat erejéhez igazodik. A jutalom bőkezűbb${ONLINE ? ', és a társaid gazdái is kapnak belőle részt' : ''}.</p></div>
      <div class="nx-ch-stats"><span><small>Mai küldetés</small><b>${left} / ${X.TEAM_RUNS}</b></span></div></div>${cards}</section>`;
  }
  const EMB = { // céhjelvények (24×24, a zászló közepére)
    hold: '<path d="M15 4a8 8 0 1 0 5 13.5A7 7 0 0 1 15 4z"/>', csillag: '<path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
    kard: '<path d="M14.5 3.5 20 3.8l.3 5.5-8.6 8.6-3.2-3.2zM6.4 14l3.6 3.6M5 19l2.8-2.8"/>', pajzs: '<path d="M12 3 4.5 5.5V11c0 4.7 3.2 8.4 7.5 10 4.3-1.6 7.5-5.3 7.5-10V5.5z"/>',
    farkas: '<path d="M4 4l4 4h8l4-4v8l-3 4-5 4-5-4-3-4z"/><path d="M9 12h.01M15 12h.01"/>', fa: '<path d="M12 3c-3.6 0-6 2.7-6 5.8 0 2.6 1.8 4.6 4.2 5.1V21h3.6v-7.1c2.4-.5 4.2-2.5 4.2-5.1C18 5.7 15.6 3 12 3z"/>',
    korona: '<path d="M3.5 8 7 11l5-6 5 6 3.5-3-1.5 10h-14z"/>', lang: '<path d="M12 3c1 3.2 5.5 5.6 5.5 10.3A5.5 5.5 0 0 1 6.5 13.3c0-2.2 1.2-3.7 2.4-4.8.2 1.8 1 2.8 2.1 3.3C10.6 8.4 11 5.3 12 3z"/>'
  };
  function guildFlag(g) {
    const c = /^#[0-9a-fA-F]{6}$/.test(g.color || '') ? g.color : '#7f8cff';
    return `<svg class="nx-guild-flag" viewBox="0 0 64 76" aria-hidden="true"><defs><linearGradient id="gf${esc(String(g.id || 'x'))}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="#14183e"/></linearGradient></defs>
      <path d="M8 4h48v54L32 72 8 58z" fill="url(#gf${esc(String(g.id || 'x'))})" stroke="#e9c478" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 10h36v44L32 65 14 54z" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="1.2"/>
      <g transform="translate(16 16) scale(1.35)" fill="none" stroke="#fff4dc" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${EMB[g.emblem] || EMB.hold}</g></svg>`;
  }
  function renderGuild() {
    if (ONLINE) tip('ceh');
    if (!ONLINE) return `<section class="panel"><h1>Céh</h1><p class="muted">A céhek a közös szerveren élnek: ott csatlakozhatsz egyhez, vagy alapíthatsz sajátot. Gyakorló módban ez nem érhető el.</p>
      <ul class="nx-list" style="margin-top:12px"><li><span>Saját zászló<small>Szín, jelvény, mottó, céhjel</small></span></li><li><span>Heti közös cél<small>Minden győzelmetek beleszámít; a célokért minden tag jutalmat kap</small></span></li><li><span>Céhkrónika és céh-ranglista<small>Ki csatlakozott, ki mit ért el; melyik céh a legerősebb a héten</small></span></li></ul></section>`;
    const G2 = S.guildData;
    if (!G2) { if (!S.guildLoading) { S.guildLoading = true; loadGuild(); } return `<section class="panel"><h1>Céh</h1><p class="muted">Betöltés…</p></section>`; }
    if (G2.guild) {
      const g = G2.guild, pr = G2.progress, top = G2.goals[G2.goals.length - 1].w;
      const goals = G2.goals.map(x => { const got = G2.claimed.indexOf(x.i) >= 0, can = !got && pr.wins >= x.w, rw = x.silverM ? ` <span class="small muted">· ${I.silver}${fmt(Math.round(E.silverBase(hero().level) * x.silverM))} ${I.dust}${x.dust}</span>` : '';
        return `<li class="${got ? 'done' : can ? 'here' : ''}"><span>${x.w} közös győzelem${rw}</span>${got ? '<span class="small" style="color:var(--jo-400)">Átvéve</span>' : can ? `<button class="btn sm primary" data-act="guild-claim" data-v="${x.i}">Átveszem</button>` : `<span class="small muted">még ${x.w - pr.wins}</span>`}</li>`; }).join('');
      const mem = G2.members.map(m => `<li><span class="pt">${snapPortrait(m)}</span><span><b>${esc(m.name)}${m.role === 'vezeto' ? ' <span class="nx-tag">vezető</span>' : ''}</b><span class="small muted">${m.level}. szint · ${m.wins} győzelem a héten</span></span>${G2.owner && !m.me ? `<button class="btn ghost sm" data-act="guild-kick" data-v="${esc(m.uid)}" title="Elküldés a céhből">✕</button>` : ''}</li>`).join('');
      const log = G2.log.map(l => `<li><span class="small muted">${new Date(l.t).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}</span> ${l.html}</li>`).join('');
      return `<section class="panel"><div class="nx-ch-head"><div class="nx-guild-head">${guildFlag(g)}<div><h1>${esc(g.name)} <span class="nx-tag">${esc(g.tag)}</span>${g.stars ? ` <span class="nx-stars" title="Megnyert céhháborúk">${'★'.repeat(Math.min(10, g.stars))}${g.stars > 10 ? '+' : ''}</span>` : ''}</h1>${g.motto ? `<p class="small muted">„${esc(g.motto)}”</p>` : ''}</div></div>
        <div class="nx-ch-stats"><span><small>Tagok</small><b>${pr.members} / ${G2.max}</b></span><span><small>Közös győzelem a héten</small><b>${pr.wins}</b></span></div></div>
        <div class="xp" style="margin-top:12px"><i style="width:${Math.min(100, pr.wins / top * 100)}%"></i></div>
        ${warHtml(G2)}
        <div class="nx-ch-body"><div><h2 style="font-size:18px">Heti közös célok</h2><p class="small muted">Minden tag győzelme beleszámít (kaland fáklyával, aréna, esemény, csapat). A jutalmat mindenki magának veszi át, ha a héten legalább egyszer ő is nyert.</p><ul class="nx-goals">${goals}</ul></div>
          <div><h2 style="font-size:18px">Céhkrónika</h2><ul class="nx-glog">${log || '<li>Még nem történt semmi.</li>'}</ul></div></div></section>
        <section class="panel"><div class="row between"><h2>Tagok</h2><button class="btn ghost sm" data-act="guild-leave">Kilépek a céhből</button></div><ul class="nx-members">${mem}</ul></section>`;
    }
    const f = S.guildForm || (S.guildForm = { name: '', tag: '', color: '#7f8cff', emblem: 'hold', motto: '' });
    const list = (G2.guilds || []).map(g => `<li>${guildFlag(g)}<span><b>${esc(g.name)}</b> <span class="nx-tag">${esc(g.tag)}</span><br><span class="small muted">${g.members} / ${G2.max} tag · ${g.wins} győzelem a héten${g.motto ? ' · „' + esc(g.motto) + '”' : ''}</span></span><button class="btn primary sm" data-act="guild-join" data-v="${g.id}" ${g.members >= G2.max ? 'disabled' : ''}>Csatlakozom</button></li>`).join('');
    return `<section class="panel"><h1>Céh</h1><p class="small muted">Csatlakozz egy céhhez, vagy alapíts sajátot. A céh tagjai együtt gyűjtik a heti győzelmeket, és a közös célokért mindenki jutalmat kap.</p>
        <ul class="nx-glist">${list || '<li><span></span><span class="muted">Még nincs céh. Legyél te az első!</span></li>'}</ul></section>
      <section class="panel"><h2>Új céh alapítása</h2><p class="small muted">Az 5. szinttől, ${fmt(G2.cost || 1000)} Holdezüstért.</p>
        <div class="nx-gform"><label>A céh neve<input class="inp" id="g-name" maxlength="24" value="${esc(f.name)}" autocomplete="off"></label><label>Céhjel (2–4 betű)<input class="inp" id="g-tag" maxlength="4" value="${esc(f.tag)}" autocomplete="off"></label>
          <label>Szín<input class="inp" id="g-color" type="color" value="${esc(f.color)}"></label><label>Mottó<input class="inp" id="g-motto" maxlength="80" value="${esc(f.motto)}" autocomplete="off"></label></div>
        <p class="small" style="margin-top:10px;font-weight:700;color:var(--hold-300)">Jelvény</p><div class="nx-emblems">${Object.keys(EMB).map(k => `<button data-act="guild-emblem" data-v="${k}" aria-pressed="${f.emblem === k}" aria-label="${{ hold: 'Hold', csillag: 'Csillag', kard: 'Kard', pajzs: 'Pajzs', farkas: 'Farkas', fa: 'Fa', korona: 'Korona', lang: 'Láng' }[k]}">${guildFlag({ id: 'e' + k, color: f.color, emblem: k })}</button>`).join('')}</div>
        <button class="btn fakla" style="margin-top:12px" data-act="guild-create">${ni('ceh')}Megalapítom</button></section>`;
  }
  function warHtml(G2) {
    const w = G2.war, l = G2.lastWar, rw = G2.warReward || { silver: 8, dust: 100 };
    const oppName = x => x.opponent ? `${esc(x.opponent.name)} <span class="nx-tag">${esc(x.opponent.tag)}</span>` : '<i>feloszlott céh</i>';
    const now1 = w ? `<div class="nx-war"><span class="small muted">A heti céhháború ellenfele</span><div class="nx-war-row"><b>${esc(G2.guild.name)}</b><span class="nx-war-score">${w.mine} : ${w.theirs}</span><b>${oppName(w)}</b></div><span class="small muted">${w.mine > w.theirs ? 'Most ti vezettek.' : w.mine < w.theirs ? 'Most ők vezetnek.' : 'Döntetlen az állás.'} Vasárnap éjfélig minden győzelem számít. A győztes céh zászlójára csillag kerül, és aki a héten legalább egyszer nyert, jövő héten átveheti a jutalmat: ${I.silver}${fmt(Math.round(E.silverBase(hero().level) * rw.silver))} ${I.dust}${rw.dust}.</span></div>`
      : `<div class="nx-war"><span class="small muted">Céhháború: ezen a héten nem jutott ellenfél a céheteknek (páratlan számú céh van, vagy a hét közben alakultatok). Jövő hétfőn új párosítás jön.</span></div>`;
    const last = l ? `<div class="nx-war last"><span class="small">Múlt hét: ${esc(G2.guild.name)} ${l.mine} : ${l.theirs} ${l.opponent ? esc(l.opponent.name) : 'feloszlott céh'} – ${l.won ? 'győzelem!' : l.mine === l.theirs ? 'döntetlen.' : 'vereség.'}</span>${l.won ? (l.claimed ? '<span class="small" style="color:var(--jo-400)">Átvéve</span>' : l.eligible ? '<button class="btn sm primary" data-act="guild-war-claim">Átveszem a jutalmat</button>' : '<span class="small muted">A jutalom azoknak jár, akik múlt héten legalább egyszer nyertek a céhért, és csütörtökig csatlakoztak.</span>') : ''}</div>` : '';
    return now1 + last;
  }
  async function loadGuild() {
    try { const a = (await remote('guildInfo')).result; if (a.guild) S.guildData = a; else S.guildData = (await remote('guildList')).result; S.guild = a.guild || null; }
    catch (e) { handleError(e); S.guildData = { guilds: [] }; }
    finally { S.guildLoading = false; render(); }
  }
  function readGuildForm() { const f = S.guildForm || {}; ['name', 'tag', 'motto', 'color'].forEach(k => { const i = el('g-' + k); if (i) f[k] = i.value; }); S.guildForm = f; return f; }
  async function guildCall(action, args, msg) {
    if (S.busy) return; S.busy = true;
    try { const r = await remote(action, args); if (r.save) S.save = r.save; if (msg) toast(typeof msg === 'function' ? msg(r.result || {}) : msg); S.guildData = null; S.guildForm = null; if (ONLINE) refreshState().catch(() => {}); }
    catch (e) { handleError(e); } finally { S.busy = false; render(); }
  }

  // ---------- fő rajzolás ----------
  let lastModal = null, beforeModal = null;
  function render() {
    const fa = document.activeElement, sel = fa && fa !== document.body && fa.dataset && fa.dataset.act ? `[data-act="${fa.dataset.act}"]${fa.dataset.v != null ? `[data-v="${CSS.escape(fa.dataset.v)}"]` : ''}` : (fa && fa.id ? '#' + CSS.escape(fa.id) : null);
    // ugyanaz a gomb több helyen is lehet (oldalsáv, fülsáv): a sorszámát is megjegyezzük, hogy pontosan oda térjen vissza a fókusz
    let selIdx = 0;
    if (sel) { const all = app.querySelectorAll(sel); for (let i = 0; i < all.length; i++) if (all[i] === fa) { selIdx = i; break; } }
    // a legendás tárgy felfedése: a harc lejátszása után, ha éppen nincs más ablak nyitva
    if (S.legendQueue && S.legendQueue.length && !S.combat && !S.modal) S.modal = { type: 'legend', item: S.legendQueue.shift() };
    // a menü (és a belső görgethető listák) görgetése ne ugorjon vissza a tetejére újrarajzoláskor
    const keep = {}; ['.nx-rail-scroll', '.nx-admlist', '.c-body', '.chron'].forEach(q => { const e = app.querySelector(q); if (e && e.scrollTop) keep[q] = e.scrollTop; });
    renderInner();
    Object.keys(keep).forEach(q => { const e = app.querySelector(q); if (e) e.scrollTop = keep[q]; });
    const modal = app.querySelector('.modal');
    if (modal && S.modal !== lastModal) { beforeModal = sel ? { sel: sel, idx: selIdx } : null; const f = modal.querySelector('button, [href], input, select, textarea'); if (f) f.focus({ preventScroll: true }); }
    else if (!modal && lastModal && beforeModal) { const all = app.querySelectorAll(beforeModal.sel), e = all[beforeModal.idx] || all[0]; if (e) e.focus({ preventScroll: true }); }
    else if (sel && !(modal && modal.contains(document.activeElement))) { const e = app.querySelector(sel); if (e && document.activeElement !== e) e.focus({ preventScroll: true }); }
    lastModal = modal ? S.modal : null;
    // ha a fókusz elveszett (pl. Bubó tippje jelent meg), a tipp gombjára kerül
    if (document.activeElement === document.body) { const ow = app.querySelector('.owl [data-act="owl-ok"]') || app.querySelector('.nx-title .nx-continue'); if (ow) ow.focus({ preventScroll: true }); }
  }
  // a nyitott ablakból Tabbal nem lehet kilépni a mögötte lévő menüre
  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return; const m = app.querySelector('.modal'); if (!m) return;
    const fs = [...m.querySelectorAll('button:not([disabled]), [href], input, select, textarea')]; if (!fs.length) return;
    const first = fs[0], last = fs[fs.length - 1];
    if (!m.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  function renderInner() {
    if (S.phase === 'boot') { app.innerHTML = splash('A Nyxoria betöltődik…'); return; }
    if (S.phase === 'login') { app.innerHTML = (NEW_SHELL ? renderTitle(true) : renderLogin()) + modalHtml(); return; }
    if (S.phase === 'title' && S.save) { app.innerHTML = renderTitle(false) + modalHtml(); return; }
    if (S.phase === 'error') { app.innerHTML = splash(esc(S.loginError || 'Hiba történt.'), true); return; }
    if (S.phase === 'creator' || !S.save) {
      S.phase = 'creator';
      if (NEW_CREATOR) { renderNewCreator(); return; }
      app.innerHTML = renderCreator(); return;
    }
    if (S.cr && ((S.cr.mode === 'restyle' && S.screen !== 'kinezet') || (S.cr.mode === 'new' && S.screen !== 'ujhos') || S.combat)) dropCreator();
    if (S.screen === 'ujhos' && NEW_CREATOR && !S.combat) {
      app.innerHTML = (NEW_SHELL ? newTopbar() : topbar()) + `<div class="layout wide"><main class="main" id="main"><div class="exp-head"><div><div class="tiny">Új hős</div><h1>Új hős készítése</h1></div><button class="btn ghost sm" data-act="screen" data-v="hosok">Mégse</button></div><div id="cr-ph"></div></main></div>` + modalHtml();
      keepCreator('new'); return;
    }
    if (S.screen === 'kinezet' && NEW_CREATOR && !S.combat) {
      // itt nincs alsó menü (a készítőnek kell a hely); a Vissza gomb a fejlécben van
      app.innerHTML = (NEW_SHELL ? newTopbar() : topbar()) + `<div class="layout wide"><main class="main" id="main"><div class="exp-head"><div><div class="tiny">${esc(hero().name)}</div><h1>Kinézet átszabása</h1></div><button class="btn ghost sm" data-act="restyle-back">Vissza, mentés nélkül</button></div><div id="cr-ph"></div></main></div>` + modalHtml() + devbar();
      keepCreator('restyle'); return;
    }
    let main;
    if (S.combat) main = expHead() + renderCombat();
    else if (S.screen === 'kaland') main = S.save.expedition ? renderExpedition(S.save.expedition) : renderCamp();
    else if (S.screen === 'hos') main = renderHero();
    else if (S.screen === 'taska') main = renderBag();
    else if (S.screen === 'boss') main = renderBoss();
    else if (S.screen === 'kozosseg') main = renderCommunity();
    else if (S.screen === 'torony' && X) main = renderTower();
    else if (S.screen === 'holdkronika' && X) main = renderStory();
    else if (S.screen === 'megbizasok' && X) main = renderQuests();
    else if (S.screen === 'sugo' && D.HELP) main = renderHelp();
    else if (S.screen === 'esemeny' && X) main = renderEvent();
    else if (S.screen === 'bolt' && X) main = renderShop();
    else if (S.screen === 'eredmenyek' && X) main = renderAch();
    else if (S.screen === 'arena' && X) main = renderArena();
    else if (S.screen === 'csapat' && X) main = renderTeam();
    else if (S.screen === 'ceh') main = renderGuild();
    else if (S.screen === 'profil' && X) main = renderProfile();
    else if (S.screen === 'hosok') main = renderHeroes();
    else if (S.screen === 'admin' && ONLINE && S.me && S.me.admin) main = renderAdmin();
    else main = renderSettings();
    if (S.notice && !S.combat && S.screen !== 'admin' && (() => { try { return localStorage.getItem('nyx-notice') !== String(S.notice.at); } catch (e) { return true; } })())
      main = `<div class="nx-notice" role="status"><span aria-hidden="true">📣</span><div><b>Bejelentés</b><p>${esc(S.notice.text)}</p></div><button class="btn sm ghost" data-act="notice-ok">Rendben</button></div>` + main;
    const showLeft = S.screen === 'hos' && !S.combat;
    if (NEW_SHELL) {
      // Hős: balra a hőskártya, mellette a név, a jellemzők és a fáklyák (így nincs üres folt és a név sem kétszer szerepel)
      // a két oszlop egymástól függetlenül folyik (bal: kártya, fáklyák, felszerelés; jobb: név, tulajdonságok, képességek)
      if (showLeft) {
        const k = main.indexOf('<!--nx-split-->'), rest = main.slice(k + 15), m = rest.indexOf('<!--nx-eq-->');
        const gs = rest.indexOf('>') + 1, ge = rest.lastIndexOf('</div>');
        const eq = m > 0 ? rest.slice(gs, m) : '', sk = m > 0 ? rest.slice(m + 12, ge) : '';
        main = m > 0
          ? `<div class="nx-herotop"><div class="nx-herostack l">${heroCard(true)}${torchPanel()}${eq.replace('<section class="panel"', '<section class="panel nx-eqp"')}</div><div class="nx-herostack r">${main.slice(0, k)}${statsPanel()}${sk.replace('<section class="panel"', '<section class="panel nx-skp"')}</div></div>`
          : `<div class="nx-herotop"><div class="nx-herostack l">${heroCard(true)}${torchPanel()}</div><div class="nx-herostack r">${main.slice(0, k)}${statsPanel()}</div></div>` + rest;
      }
      const wide = S.screen === 'admin' || S.screen === 'sugo'; // az admin felületnek kell a hely: ott nincs jobb oldali sáv
      app.innerHTML = newTopbar() + `<div class="layout nx-layout${wide ? ' nx-wide' : ''}">${railHtml()}<main class="main" id="main">${main}</main>${wide ? '' : rightPanel()}</div>` +
        newBottomnav() + modalHtml() + owlHtml() + devbar();
    } else app.innerHTML = topbar() + `<div class="layout${showLeft ? ' show-left' : ''}">${heroPanel()}<main class="main" id="main">${main}</main>${rightPanel()}</div>` +
      bottomnav() + modalHtml() + owlHtml() + devbar();
    if (S.combat && !S.combat.mounted) mountCombat();
    const log = el('clog');
    if (log) log.scrollTop = log.scrollHeight;
  }
  function splash(text, withRetry) {
    return `<div class="creator" style="max-width:520px;padding-top:12vh;text-align:center"><div class="logo" style="justify-content:center;font-size:26px">${A.LOGO.replace('width="26" height="26"', 'width="40" height="40"')}<span>Nyxoria</span></div>
      <p class="muted" style="margin-top:18px">${text}</p>${withRetry ? '<button class="btn" style="margin-top:16px" data-act="logout">Kilépés</button>' : ''}</div>`;
  }

  function renderLogin() {
    return `<div class="login-wrap"><div class="login-card panel">
      <div class="login-scene">${A.sceneSvg('erdo', 7)}<div class="login-hero">${A.heroSvg({ name: 'Nyxoria', classId: 'magus', people: 'holdtunde', look: A.defaultLook('magus') })}</div></div>
      <div style="padding:22px 22px 24px;text-align:center">
        <div class="logo" style="justify-content:center;font-size:24px">${A.LOGO}<span>Nyxoria</span></div>
        <h1 style="margin-top:12px">Holdfényes kalandok a Nyxoria közösségének</h1>
        <p class="muted" style="margin-top:8px">Rövid kalandok, közös heti szörny és ritka zsákmány. Napi pár perc is elég, de órákra is elmerülhetsz benne.</p>
        ${S.loginError ? `<div class="advice" style="margin-top:14px;text-align:left">${A.OWL.replace('width="64" height="64"', 'width="34" height="34"')}<div>${esc(S.loginError)}</div></div>` : ''}
        <button class="btn discord lg block" style="margin-top:18px" data-act="login">${I.discord}Belépés Discorddal</button>
        <p class="small muted" style="margin-top:12px">A Discord-fiókoddal léphetsz be. A játék csak a Discord-nevedet és a profilképedet használja.</p>
      </div></div></div>`;
  }

  function mobileHeroStrip() {
    const h = hero(), t = E.torchState(S.save, now());
    return `<div class="panel mobile-only" style="margin-bottom:12px">
      <div class="row" style="gap:12px"><div class="portrait sm">${A.heroSvg(h)}</div>
        <div style="flex:1;min-width:0"><div class="row between"><b style="font-family:var(--display)">${esc(h.name)}</b><span class="small muted">${h.level}. szint</span></div>${xpBar(h)}</div></div>
      <div class="row between" style="margin-top:10px"><span class="small"><b>${t.count}/${E.TORCH.max}</b> fáklya${t.rested ? ` · <span style="color:var(--tunde-400)">${t.rested} Frissesség</span>` : ''}</span><span class="small muted">${t.count < E.TORCH.max ? 'Új: ' + timeLeft(t.nextIn) : 'Tele'}</span></div>
    </div>`;
  }

  // ---------- tábor ----------
  function bonusBadges() {
    const out = [];
    if (ONLINE && S.world) {
      const w = G.wind(hero().level, S.world.median);
      if (w > 1) out.push(`<span class="gain" style="color:var(--tunde-400)">Felzárkózó szél: ×${dec(w)} tapasztalat</span>`);
    }
    if (S.save.buffs && S.save.buffs.xpUntil > now()) out.push(`<span class="gain" style="color:var(--fakla-300)">Győzelmi lendület: +25% tapasztalat (még ${timeLeft(S.save.buffs.xpUntil - now())})</span>`);
    return out.length ? `<div class="gains" style="justify-content:flex-start;margin:0 0 12px">${out.join('')}</div>` : '';
  }
  function renderCamp() {
    const h = hero(), c = cls(h), t = E.torchState(S.save, now());
    if (!ONLINE && !S.save.offers) G.refreshOffers(S.save);
    const offers = S.save.offers || [];
    tip('fokepernyo');
    if (t.count === 0) tip('faklya');
    const tired = t.count === 0, xm = xpMultNow();
    const tacticSeg = ['roham', 'kiegy', 'kitartas'].map(id => `<button data-act="tactic" data-v="${id}" aria-pressed="${h.tactic === id}">${D.TACTICS[id].name}${c.tactic === id ? ' <span class="rec-tag">ajánlott</span>' : ''}</button>`).join('');
    const moonRow = h.level >= 20
      ? `<div class="row wrap" style="gap:6px">${E.MOON_ORDER.map(m => `<button class="chip" data-act="moon" data-v="${m}" aria-pressed="${S.save.settings.moon === m}">${E.MOONS[m].name}</button>`).join('')}</div>`
      : `<span class="small muted">A Hold-fokozatok a 20. szinttől nyílnak.</span>`;
    const cards = offers.map(o => {
      const r = region(o.region), rec = o.diff === 'kozepes';
      const tf = tired ? ((S.save.tiredRun || 0) < 8 ? 0.5 : (S.save.tiredRun || 0) < 16 ? 0.25 : 0.1) : 1;
      const xp = Math.round(o.rewards.xp * (t.rested && !tired ? 2 : 1) * xm * tf);
      return `<button class="offer${rec ? ' rec' : ''}${o.elite ? ' elite' : ''}" data-act="start" data-v="${o.diff}" aria-label="${E.DIFF[o.diff].name} kaland: ${esc(r.name)}, győzelmi esély ${pct(o.chance)}">
        <div class="scene">${A.sceneSvg(r.scene, A.hash(o.guard) % 997)}<span class="diff-pill d-${o.diff}">${E.DIFF[o.diff].name}</span>${rec ? '<span class="rec-pill">AJÁNLOTT</span>' : ''}</div>
        <div class="body">
          <div><h3>${esc(r.name)}</h3><div class="small muted">Őrző: ${esc(o.guard)} · <span style="white-space:nowrap">${o.level}. szint</span></div>${o.elite ? '<div class="elite-line">Elit őrző: kisebb esély, több jutalom</div>' : ''}</div>
          <div class="chance"><b class="d-${o.diff}">${pct(o.chance)}</b><span class="small muted">győzelmi esély</span></div>
          <div class="reward-line"><span>${I.xp}${fmt(xp)} TP${t.rested && !tired ? ' (×2)' : tired ? ' (fáradtan)' : ''}</span><span>${I.silver}${fmt(Math.round(o.rewards.silver * tf))}</span>${tired ? '<span>tárgy nélkül</span>' : `<span>${pct(o.rewards.itemChance)} tárgy</span>`}</div>
        </div></button>`;
    }).join('');
    return (NEW_SHELL ? campStage() : mobileHeroStrip()) + (ONLINE ? bossStrip() : '') + `
      <section class="panel" aria-labelledby="exp-title" id="offers-anchor">
        <div class="panel-title" style="align-items:flex-end"><div><h1 id="exp-title">Hová indulsz?</h1><p class="small muted">Egy kaland 1 fáklyába kerül, és nagyjából egy percig tart.</p></div></div>
        ${bonusBadges()}
        ${tired ? `<div class="advice" style="margin-bottom:12px">${I.torch.replace('<svg', '<svg width="20" height="28"')}<div><b>Elfogytak a fáklyák.</b> Fáradtan is mehetsz, de kevesebb tapasztalatot és Holdezüstöt kapsz, tárgyat pedig nem (${(S.save.tiredRun || 0) < 8 ? '50%' : (S.save.tiredRun || 0) < 16 ? '25%' : '10%'}). ${torchText(t)}</div></div>` : ''}
        <div class="offers">${cards || '<p class="muted">Az ajánlatok töltődnek…</p>'}</div>
      </section>
      <div id="patrol-anchor">${patrolPanel()}</div>
      <section class="panel">
        <div class="tactic-row"><div><h3>Taktika</h3><p class="tactic-desc">${D.TACTICS[h.tactic].desc} Az „ajánlott” illik a kasztodhoz.</p></div><div class="seg" role="group" aria-label="Taktika">${tacticSeg}</div></div>
        <hr class="divider"><div class="tactic-row"><div><h3>Hold-fokozat</h3><p class="tactic-desc">Erősebb szörnyek, cserébe sokkal több Csillagpor, több Holdezüst és egy kevés plusz tapasztalat.</p></div>${moonRow}</div>
      </section>`;
  }

  function patrolPanel() {
    const h = hero(), p = S.save.patrol, today = G.budapestDate(now());
    let body;
    if (p && p.end <= now()) {
      body = `<div class="row between wrap"><div><b>Visszatértél az őrjáratról!</b><p class="small muted">${p.hours} órát vigyáztál a környékre. Vedd át a jutalmat.</p></div><button class="btn fakla" data-act="patrol-claim">Jutalom átvétele</button></div>`;
    } else if (p) {
      const prog = Math.min(100, (now() - p.start) / (p.end - p.start) * 100);
      body = `<div class="row between wrap"><div><b>Őrjáraton vagy (${p.hours} óra)</b><p class="small muted">Közben nyugodtan kalandozhatsz is. Visszatérés: <span data-patrol-left>${timeLeft(p.end - now())}</span> múlva.</p></div></div>
        <div class="bar" style="margin-top:10px"><i style="width:${prog}%"></i></div>`;
    } else if (S.save.patrolDay === today) {
      body = `<p class="small muted">Ma már voltál őrjáraton. Holnap újra mehetsz.</p>`;
    } else {
      const xm = xpMultNow();
      body = `<p class="small muted" style="margin-bottom:10px">Küldd ki a hősöd a környékre, amíg nem vagy itt. Naponta egyszer mehetsz, és közben kalandozhatsz is.</p>
        <div class="patrol-grid">${G.PATROL_HOURS.map(hrs => { const rw = G.patrolReward(h, hrs); return `<button class="ccard" data-act="patrol" data-v="${hrs}" style="gap:4px"><b style="font-size:17px">${hrs} óra</b><span class="small">${I.xp}${fmt(rw.xp * xm)} TP</span><span class="small muted">${I.silver}${fmt(rw.silver)} · ${I.dust}${fmt(rw.dust)}${rw.itemChance ? ` · ${pct(rw.itemChance)} tárgy` : ''}</span></button>`; }).join('')}</div>`;
    }
    return `<section class="panel"><div class="panel-title"><h3>Őrjárat</h3></div>${body}</section>`;
  }

  // ---------- boss ----------
  function bossHitsToday() { const m = (S.bossMine || []).filter(x => S.boss && x.bossId === S.boss.id)[0]; return m ? m.hitsToday : 0; }
  function bossMineCur() { return (S.bossMine || []).filter(x => S.boss && x.bossId === S.boss.id)[0] || null; }
  function bossStatus(b) {
    if (!b) return 'Az első heti szörny hamarosan megérkezik.';
    if (b.killedAt) return 'Legyőztétek! Jövő hétfőn jön a következő.';
    if (Date.now() < b.startsAt) return `Hétfő reggel 6-kor érkezik.`;
    if (Date.now() >= b.endsAt) return 'Ez a hét lezárult. Hétfő reggel 6-kor jön az új heti szörny.';
    return `Még ${timeLeft(b.endsAt - Date.now())} van hátra.`;
  }
  function bossMini() {
    const b = S.boss;
    if (!b) return `<div class="panel"><div class="panel-title"><h3>Heti szörny</h3></div><p class="small muted">${bossStatus(b)}</p></div>`;
    const left = 3 - bossHitsToday();
    return `<div class="panel boss-mini"><div class="panel-title"><h3>Heti szörny</h3>${b.rage ? '<span class="badge" style="color:var(--boss-400)">DÜHÖDT</span>' : ''}</div>
      <div class="row" style="gap:12px"><div class="portrait sm" style="flex-shrink:0">${A.monsterSvg(b.name, b.region, true)}</div>
      <div style="flex:1;min-width:0"><b style="font-family:var(--display)">${esc(b.name)}</b><div class="bar mon" style="margin-top:6px"><i style="width:${b.hp / b.maxHp * 100}%"></i></div>
      <div class="bar-label"><span>${fmt(b.hp)} / ${fmt(b.maxHp)}</span></div></div></div>
      <p class="small muted" style="margin-top:8px">${bossStatus(b)}</p>
      <button class="btn ${b.active && left > 0 ? 'fakla' : ''} block" style="margin-top:10px" data-act="screen" data-v="boss">${b.active ? (left > 0 ? `Ütés (ma még ${left})` : 'Megnézem') : 'Megnézem'}</button></div>`;
  }
  function bossStrip() {
    const b = S.boss;
    if (!b) return '';
    const left = 3 - bossHitsToday();
    return `<button class="panel mobile-only boss-strip" data-act="screen" data-v="boss" style="margin-bottom:12px;width:100%;text-align:left;color:inherit;font:inherit;cursor:pointer">
      <div class="row between"><b style="font-family:var(--display)">${esc(b.name)}</b><span class="small" style="color:${b.active && left ? 'var(--fakla-300)' : 'var(--hold-500)'};font-weight:800">${b.active ? (left ? `${left} ütésed van ma` : 'Mára kész') : (b.killedAt ? 'Legyőzve' : 'Szünet')}</span></div>
      <div class="bar mon" style="margin-top:8px"><i style="width:${b.hp / b.maxHp * 100}%"></i></div></button>`;
  }
  function renderBoss() {
    const b = S.boss;
    if (!b) return `<section class="panel"><h1>Heti szörny</h1><p class="muted" style="margin-top:8px">${bossStatus(b)}</p></section>`;
    const mine = bossMineCur(), hits = mine ? mine.hits : 0, left = 3 - bossHitsToday();
    const tiers = [[3, 'Részvételi láda', 'Holdezüst, Csillagpor és egy tárgy'], [9, 'Ezüst láda', 'Legalább zöld tárgy'], [15, 'Arany láda', hero().level >= E.RARITY_GATE.legendas ? 'Legalább kék tárgy, jó eséllyel lila, szerencsével legendás' : hero().level >= E.RARITY_GATE.lila ? 'Legalább kék tárgy, jó eséllyel lila' : `Legalább ${D.RARITIES[E.gateRarity('kek', hero().level)].name} tárgy (a 12. szinttől lila is lehet)`]];
    const chest = (bossId, tier, label, desc, ok, claimed) => `<div class="chest ${claimed ? 'done' : ok ? 'ready' : ''}"><div><b>${label}</b><p class="small muted">${desc}</p></div>
      ${claimed ? '<span class="badge">KINYITVA</span>' : ok ? `<button class="btn fakla sm" data-act="boss-claim" data-v="${tier}" data-boss="${bossId}">Kinyitom</button>` : `<span class="small muted">${tier ? `${Math.min(hits, tier)} / ${tier} ütés` : 'Ha a boss elesik'}</span>`}</div>`;
    const chests = tiers.map(([n, l, d]) => chest(b.id, n, l, d, hits >= n, mine && mine.claimed.indexOf(n) >= 0)).join('') +
      chest(b.id, 0, 'Győzelmi láda', '+1 láda és 1 napig +25% tapasztalat', !!b.killedAt && hits > 0, mine && mine.claimed.indexOf(0) >= 0);
    const prev = (S.bossMine || []).filter(x => x.bossId !== b.id)[0];
    let prevHtml = '';
    if (prev) {
      const open = [3, 9, 15].filter(n => prev.hits >= n && prev.claimed.indexOf(n) < 0).concat(prev.killed && prev.hits > 0 && prev.claimed.indexOf(0) < 0 ? [0] : []);
      if (open.length) prevHtml = `<section class="panel"><h3>A múlt heti szörny ládái</h3><p class="small muted" style="margin:4px 0 10px">${esc(prev.name)}: ${prev.hits} ütés, ${fmt(prev.damage)} sebzés.</p>${open.map(n => chest(prev.bossId, n, n === 0 ? 'Győzelmi láda' : n === 3 ? 'Részvételi láda' : n === 9 ? 'Ezüst láda' : 'Arany láda', '', true, false)).join('')}</section>`;
    }
    const top = (S.ranks.boss || []).slice(0, 8).map((r, i) => `<div class="rank-row${r.me ? ' me' : ''}"><span class="rank-n">${i + 1}.</span><span class="rank-name">${ONLINE && !r.guild ? `<button class="nx-lnk" data-act="profile-open" data-v="${esc(r.name)}">${esc(r.name)}</button>` : esc(r.name)}</span><span class="small muted rank-cls">${D.CLASSES[r.classId] ? D.CLASSES[r.classId].name : ''}</span><b>${fmt(r.value)}</b></div>`).join('');
    const weakName = D.TACTICS[b.weakness] ? D.TACTICS[b.weakness].name : b.weakness;
    return `<section class="panel boss-hero">
        <div class="boss-scene">${A.sceneSvg(A.regionScene(b.region), 31)}<div class="boss-fig">${A.monsterSvg(b.name, b.region, { boss: true })}</div></div>
        <div class="boss-info">
          <div class="tiny">Heti szörny · ${b.level}. szint</div><h1>${esc(b.name)}</h1>
          <div class="bar mon lg" style="margin-top:10px"><i style="width:${b.hp / b.maxHp * 100}%"></i></div>
          <div class="bar-label"><span>${fmt(b.hp)} / ${fmt(b.maxHp)} ÉLET</span><span>${bossStatus(b)}</span></div>
          <div class="mods" style="margin-top:10px"><span>Gyenge pontja: <b>${esc(weakName)}</b> taktika (+30% sebzés)</span>${b.rage ? '<span class="bad">Dühödt: erősebben üt vissza, de több Csillagport ad</span>' : '<span>Péntektől dühödt lesz</span>'}</div>
          <div class="row wrap" style="margin-top:14px;gap:10px">
            <button class="btn fakla lg" data-act="boss-hit" ${b.active && left > 0 ? '' : 'disabled'}>${b.active ? (left > 0 ? `Ütés! (ma még ${left})` : 'Mára elfogytak az ütéseid') : 'Most nem támadható'}</button>
            <div class="seg" role="group" aria-label="Taktika">${['roham', 'kiegy', 'kitartas'].map(id => `<button data-act="tactic" data-v="${id}" aria-pressed="${hero().tactic === id}">${D.TACTICS[id].name}</button>`).join('')}</div>
          </div>
          <p class="small muted" style="margin-top:10px">Egy ütés egy 3 körös harc. A kiosztott sebzés számít, kiesés nincs. Naponta 3 ütésed van, ütésenként negyed kalandnyi tapasztalatot kapsz.</p>
        </div></section>
      <div class="hero-grid" style="margin-top:12px">
        <section class="panel"><div class="panel-title"><h2>Ládák</h2><span class="small muted">Ezen a héten: ${hits} ütés, ${fmt(mine ? mine.damage : 0)} sebzés</span></div>${chests}</section>
        <section class="panel"><div class="panel-title"><h2>Legnagyobb sebzők</h2><button class="btn ghost sm" data-act="ranks-open" data-v="boss">Mind</button></div>${top || '<p class="small muted">Még senki nem ütött. Légy te az első!</p>'}
          <p class="small muted" style="margin-top:10px">A hét végén a 3 legnagyobb sebző címet kap.</p></section>
      </div>${prevHtml}`;
  }

  // ---------- közösség: ranglisták és krónika ----------
  function renderCommunity() {
    if (!ONLINE) {
      const items = S.save.chronicle.map(chronItem).join('') || '<p class="muted">Még üres.</p>';
      return `<section class="panel"><div class="panel-title"><div><h1>Krónika</h1><p class="small muted">A hősöd története.</p></div></div><div class="chron" style="max-height:none">${items}</div></section>`;
    }
    const rows = S.ranks[S.rankTab];
    const rankHtml = rows ? (rows.length ? rows.map((r, i) => `<div class="rank-row${r.me ? ' me' : ''}"><span class="rank-n">${i + 1}.</span><span class="rank-name">${ONLINE && !r.guild ? `<button class="nx-lnk" data-act="profile-open" data-v="${esc(r.name)}">${esc(r.name)}</button>` : esc(r.name)}</span><span class="small muted rank-cls">${r.guild ? `${r.level} tag` : `${D.CLASSES[r.classId] ? D.CLASSES[r.classId].name : ''} · ${r.level}. szint`}</span><b>${S.rankTab === 'szint' || S.rankTab === 'ujonc' ? r.level + '.' : fmt(r.value)}</b><span class="small muted rank-unit">${S.rankTab === 'szint' || S.rankTab === 'ujonc' ? 'szint' : RANK_UNIT[S.rankTab]}</span></div>`).join('') : '<p class="small muted">Még üres ez a lista.</p>') : '<p class="small muted">Betöltés…</p>';
    const chronList = S.chronTab === 'sajat' ? S.save.chronicle : S.chronicle;
    return `<div class="hero-grid">
      <section class="panel"><div class="panel-title"><h1>Ranglisták</h1>${(() => { const rr = S.ranks[S.rankTab] || [], k = rr.findIndex(x => x.me); return k >= 0 ? `<span class="badge">Te: ${k + 1}. hely</span>` : ''; })()}</div>
        <div class="row wrap" style="gap:6px;margin-bottom:12px">${RANK_TABS.map(([id, l]) => `<button class="chip" data-act="rank-tab" data-v="${id}" aria-pressed="${S.rankTab === id}">${l}</button>`).join('')}</div>
        <div class="ranks">${rankHtml}</div>
        <p class="small muted" style="margin-top:10px">${{ szint: 'Az egész évad, szint szerint.', boss: 'Ki mennyit sebzett eddig a heti szörnyön.', ujonc: 'A 14 napnál fiatalabb hősök: itt az újak egymással mérkőznek.', gyujto: 'A megszerzett legendás tárgyak száma (holtversenynél a mitikusok döntenek).', ero: 'A hősök harcereje.', arena: 'Az aréna pontszáma (1000-ről indul).', torony: 'Ezen a héten ki jutott a legmagasabbra a Holdtoronyban.', ceh: 'A céhek közös győzelmei ezen a héten.' }[S.rankTab]}</p></section>
      <section class="panel"><div class="panel-title"><h1>Krónika</h1><div class="row" style="gap:6px"><button class="chip" data-act="chron-tab" data-v="kozos" aria-pressed="${S.chronTab === 'kozos'}">Közös</button><button class="chip" data-act="chron-tab" data-v="sajat" aria-pressed="${S.chronTab === 'sajat'}">Saját</button></div></div>
        <div class="chron" style="max-height:none">${chronList.map(chronItem).join('') || '<p class="muted">Még üres.</p>'}</div></section>
    </div>`;
  }

  // ---------- expedíció ----------
  function expHead() {
    const exp = S.save.expedition;
    if (!exp) return S.combat && S.combat.boss ? `<div class="exp-head"><div><div class="tiny">Heti szörny</div><h1>${esc(S.combat.monName)}</h1></div></div>` : '';
    const r = region(exp.offer.region), boss = exp.phase === 'guard' || exp.phase === 'result' || (S.combat && S.combat.guard);
    const steps = [0, 1, 2].map(i => `<i class="${i < exp.step ? 'done' : i === exp.step && !boss ? 'now' : ''}"></i>`).join('') + `<i class="boss ${boss ? 'now' : ''}"></i>`;
    const canRetreat = !S.combat && ['clearing', 'cardResult', 'event', 'guard'].indexOf(exp.phase) >= 0;
    return `<div class="exp-head"><div><div class="tiny">${E.DIFF[exp.offer.diff].name} kaland${exp.offer.moon !== 'ujhold' ? ' · ' + E.MOONS[exp.offer.moon].name : ''}</div><h1>${esc(r.name)}</h1></div>
      <div class="row" style="gap:12px"><div class="steps" aria-label="Haladás: ${Math.min(exp.step, 3)} / 3 tisztás">${steps}</div>
      ${canRetreat ? '<button class="btn ghost sm" data-act="retreat">Visszafordulok</button>' : ''}</div></div>`;
  }
  function renderExpedition(exp) {
    if (exp.phase === 'result') return renderResult(exp);
    if (exp.phase === 'guard') return expHead() + renderGuard(exp);
    const r = region(exp.offer.region), cl = exp.clearings[Math.min(exp.step, 2)];
    let body = '';
    if (exp.phase === 'clearing') {
      tip('expedicio');
      body = `<div class="cards">${cl.cards.map((c, i) => cardHtml(c, i)).join('')}</div>`;
    } else if (exp.phase === 'event') {
      const c = cl.cards[exp.pendingCard], ev = E.normEvent(c.event), h = hero();
      const opts = E.eventOptions(h, ev).map(x => {
        const o = x.o, cost = E.eventCost(exp.offer.lm, o), sub = [];
        if (cost) sub.push(`Ára: ${fmt(cost)} Holdezüst`);
        if (o.effect === 'heal' && exp.hpFactor >= 1) sub.push('Teljes erőben vagy: gyógyulás helyett tapasztalatot kapsz');
        if (o.check) sub.push(`${pct(E.eventCheckChance(h, o.check))} esély (${STAT_NAME[o.check.stat] || 'fürgeség'})`);
        if (o.needs) sub.push(o.needs.origin ? `${esc(D.ORIGINS[o.needs.origin].name)}ként` : `Mert ${esc(D.TRAITS[o.needs.trait].name.toLowerCase())} vagy`);
        const poor = cost > h.silver;
        return `<button class="btn ev-opt${o.needs ? ' ev-special' : ''}" data-act="event" data-v="${x.i}"${poor ? ' disabled' : ''}><span>${esc(o.label)}</span>${sub.length ? `<span class="ev-sub">${sub.join(' · ')}${poor ? ' · nincs elég' : ''}</span>` : ''}</button>`;
      }).join('');
      body = `<div class="result-box"><div class="row" style="gap:8px"><span class="ic-badge t-esemeny">${I.esemeny}</span><span class="tiny" style="color:var(--tunde-400)">${KIND_NAME[ev.kind] || 'Esemény'}</span></div>
        <h2 style="margin-top:8px">${esc(ev.title)}</h2><p style="margin-top:6px">${esc(ev.text)}</p>
        <div class="event-choices${E.eventOptions(h, ev).length > 2 ? ' many' : ''}">${opts}</div></div>`;
    } else if (exp.phase === 'cardResult') body = cardResultHtml(exp.lastOut);
    const introCl = exp.clearings[Math.min(exp.phase === 'cardResult' ? exp.step - 1 : exp.step, 2)];
    return expHead() + `<div class="exp-scene">${A.sceneSvg(r.scene, exp.step + 3)}<p class="intro">${esc(exp.step === 0 && exp.phase === 'clearing' ? r.intro + ' ' + introCl.intro : introCl.intro)}</p></div>` + body + modsHtml(exp);
  }
  function modsHtml(exp) {
    const m = [];
    if (exp.blessing) m.push(`<span class="good">Áldás: +${exp.blessing === true ? 10 : exp.blessing}% sebzés az őrző ellen</span>`);
    if (exp.hpFactor < 1) m.push(`<span class="bad">Sérülten érsz az őrzőhöz: ${Math.round(exp.hpFactor * 100)}%-os életerővel kezdesz</span>`);
    if (exp.loot.length || exp.silver) m.push(`<span>Eddig gyűjtöttél: ${exp.loot.length ? exp.loot.length + ' tárgy, ' : ''}${fmt(exp.silver)} Holdezüst</span>`);
    return m.length ? `<div class="mods">${m.join('')}</div>` : '';
  }
  const KIND_NAME = { esemeny: 'Esemény', szentely: 'Szentély', csapda: 'Csapda', arus: 'Vándorárus', rejtveny: 'Rejtvény', arany: 'Arany tisztás' };
  const KIND_HINT = { esemeny: 'Meglepetés: áldás, kincs vagy történet', szentely: 'Egy régi szentély: áldás vagy gyógyulás', csapda: 'Gyanús hely: ügyesség kell hozzá', arus: 'Valaki árul valamit: fizetni kell érte', rejtveny: 'Fejtörő: aki megfejti, jutalmat kap', arany: 'Ritka, ragyogó hely: bőséges jutalom' };
  const STAT_NAME = { fur: 'fürgeség', tam: 'támadás', ved: 'védekezés', elet: 'életerő' };
  function cardHtml(c, i) {
    const kind = c.type === 'esemeny' ? (c.event.kind || 'esemeny') : null;
    const label = kind ? KIND_NAME[kind] || 'Esemény' : { harc: 'Harc', kutatas: 'Kutatás' }[c.type];
    let extra = '';
    if (c.type === 'harc') extra = '<span class="small" style="color:var(--hold-300)">+ tapasztalat, kis Holdezüst</span>';
    if (c.type === 'kutatas') extra = `<span class="small" style="color:var(--fakla-300)">${pct(c.chance)} esély (a fürgeségedtől függ) · tárgy vagy Holdezüst</span>`;
    if (c.type === 'esemeny') extra = `<span class="small" style="color:var(--tunde-400)">${KIND_HINT[kind] || KIND_HINT.esemeny}</span>`;
    return `<button class="ccard t-${c.type}${kind === 'arany' ? ' k-arany' : ''}" data-act="card" data-v="${i}"><span class="ctype"><span class="ic">${I[c.type]}</span>${label}</span>
      <h3>${esc(c.title)}</h3><p>${esc(c.type === 'esemeny' ? c.event.text : c.text)}</p>${extra}</button>`;
  }
  function cardResultHtml(o) {
    if (!o) return '';
    let cls2 = 'good', html = '';
    if (o.type === 'harc') {
      if (o.win) html = `<h3>Legyőzted: ${esc(o.monster)}</h3><p class="muted" style="margin-top:4px">${esc(o.traitLine || '')}</p><div class="gains" style="justify-content:flex-start"><span class="gain">${I.xp}+${fmt(o.xp)} TP</span><span class="gain">${I.silver}+${fmt(o.silver)}</span></div>`;
      else { cls2 = 'bad'; html = `<h3>${esc(art(o.monster))} elkergetett</h3><p class="muted" style="margin-top:4px">Nem nagy baj, de megsérültél: az őrző ellen 10%-kal kevesebb életerővel indulsz.</p>`; }
    } else if (o.type === 'kutatas') {
      if (o.success) html = `<h3>Sikeres kutatás!</h3>${o.item ? `<div style="margin-top:10px">${itemHtml(o.item, { delta: true })}</div><p class="small muted" style="margin-top:6px">A tárgy a kaland végén a táskádba kerül.</p>` : `<div class="gains" style="justify-content:flex-start"><span class="gain">${I.silver}+${fmt(o.silver)} Holdezüst</span></div>`}`;
      else { cls2 = 'bad'; html = `<h3>Nem találtál semmit</h3><p class="muted" style="margin-top:4px">Közben megcsúsztál, és beverted a térded. Az őrző ellen kicsit (4%-kal) kevesebb életerővel indulsz.</p>`; }
    } else if (o.type === 'esemeny') {
      const eff = { blessing: `Áldást kaptál: +${o.blessPct || 10}% sebzés az őrző ellen.`, silver: `+${fmt(o.silver || 0)} Holdezüst`, dust: `+${fmt(o.dust || 0)} Csillagpor`, heal: 'Kipihented magad: több életerővel érsz az őrzőhöz.', hurt: 'Megsérültél: kevesebb életerővel érsz az őrzőhöz.', xp: o.healToXp ? `Teljes erőben voltál, így a pihenőből tapasztalat lett: +${fmt(o.xp || 0)} TP` : `+${fmt(o.xp || 0)} TP`, item: 'Új tárgyat kaptál!', none: 'Nem történt semmi különös.' }[o.effect] || '';
      if (o.effect === 'hurt' || (o.checkOk === false)) cls2 = 'bad';
      const pre = [o.cost ? `Fizettél: ${fmt(o.cost)} Holdezüst` : '', o.checkChance != null ? (o.checkOk ? `Sikerült (${pct(o.checkChance)} esély volt)` : `Nem sikerült (${pct(o.checkChance)} esély volt)`) : ''].filter(Boolean).join(' · ');
      html = `${pre ? `<p class="tiny muted">${pre}</p>` : ''}<h3>${esc(o.title)}</h3><p style="margin-top:6px">${esc(o.result)}</p><p class="small" style="margin-top:8px;color:var(--tunde-400);font-weight:800">${eff}</p>${o.item ? `<div style="margin-top:10px">${itemHtml(o.item, { delta: true })}</div>` : ''}${o.follow ? '<p class="small" style="margin-top:8px;color:var(--fakla-300)">Ennek még lesz folytatása a következő tisztáson…</p>' : ''}`;
    }
    const last = S.save.expedition.step >= 3;
    return `<div class="result-box ${cls2}">${html}<div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn primary" data-act="next">${last ? 'Tovább az őrzőhöz' : 'Tovább'}</button></div></div>`;
  }
  function eliteText(name) { return (D.GUARD_EXTRA && D.GUARD_EXTRA.elite && D.GUARD_EXTRA.elite[name]) || 'Ma különösen erős és dühös.'; }
  function guardText(name, k) { const g = D.ADVENTURE && D.ADVENTURE.guards && D.ADVENTURE.guards[name]; return g ? g[k] : ''; }
  function renderGuard(exp) {
    const h = hero(), r = region(exp.offer.region), c = cls(h);
    // A győzelmi esélyt a böngésző számolja ki a látható adatokból (az eredményt a szerver dönti el)
    const heroF = E.fighterFromHero(h, { hpFactor: exp.hpFactor, blessing: exp.blessing });
    const mon = E.monsterFighter(exp.offer.lm, { power: (E.MOONS[exp.offer.moon] || E.MOONS.ujhold).power, name: exp.offer.guard });
    const chance = E.winChance(heroF, mon, h.tactic, 400, 777);
    const tacticSeg = ['roham', 'kiegy', 'kitartas'].map(id => `<button data-act="tactic" data-v="${id}" aria-pressed="${h.tactic === id}">${D.TACTICS[id].name}${c.tactic === id ? ' <span class="rec-tag">ajánlott</span>' : ''}</button>`).join('');
    const col = chance >= 0.65 ? 'var(--jo-400)' : chance >= 0.45 ? 'var(--kozepes-400)' : 'var(--veszely-400)';
    return `<div class="exp-scene">${A.sceneSvg(r.scene, 9)}<p class="intro">${guardText(exp.offer.guard, 'intro') ? esc(guardText(exp.offer.guard, 'intro')) : `A tisztás végén ott vár a terület őrzője: <b>${esc(exp.offer.guard)}</b>.`}</p></div>
      <div class="result-box"><div class="guard-box">
        <div class="portrait md${exp.offer.elite ? ' elite' : ''}">${A.monsterSvg(exp.offer.guard, r.id, true)}</div>
        <div><div class="tiny">${exp.offer.elite ? '<span class="elite-tag">Elit</span> őrző' : 'Az őrző'}</div><h2>${esc(exp.offer.guard)}</h2><p class="small muted">${exp.offer.level}. szint · ${fmt(mon.maxHp)} ÉLET · ${fmt(mon.tam)} TÁM</p>
          <div class="chance" style="margin-top:8px"><b style="color:${col}">${pct(chance)}</b><span class="small muted">győzelmi esély (próbaharcok alapján)</span></div>
          ${exp.offer.elite ? `<p class="small elite-why">${esc(eliteText(exp.offer.guard))} Ha legyőzöd, több Holdezüst, Csillagpor és tapasztalat jár, és nagyobb eséllyel kapsz tárgyat.</p>` : ''}
          ${modsHtml(exp)}</div>
        <div class="stack" style="min-width:220px"><div class="seg" role="group" aria-label="Taktika">${tacticSeg}</div><button class="btn fakla lg block" data-act="fight">Harcba!</button></div>
      </div></div>`;
  }

  // ---------- harc ----------
  function petName(h) { return h.classId === 'idezo' ? 'Holdszellem' : 'Társ'; }
  function logLine(e, c) {
    const H = esc(c.heroName), M = esc(art(c.monName));
    switch (e.kind) {
      case 'round': return `<p class="r">${e.r}. KÖR</p>`;
      case 'skill': return `<p>${H}: <b style="color:var(--hold-300)">${esc(D.SKILLS[e.skill].name)}</b></p>`;
      case 'hit':
        if (e.who === 'h') {
          if (e.dodge) return `<p class="muted">${M} félreugrik, az ütés célt téveszt.</p>`;
          if (e.first) return `<p class="crit">Meglepetésszerű támadás! ${fmt(e.dmg)} sebzés.</p>`;
          if (e.crit) return `<p class="crit">Telitalálat! ${fmt(e.dmg)} sebzés.</p>`;
          return `<p>${H} eltalálja: ${fmt(e.dmg)} sebzés.</p>`;
        }
        if (e.who === 'pet') return e.dodge ? `<p class="muted">${c.pet} mellécsap.</p>` : `<p>${c.pet} odakap: ${fmt(e.dmg)}${e.crit ? ' (telitalálat!)' : ''}.</p>`;
        if (e.dodge) return `<p class="heal">${H} ügyesen kitér!</p>`;
        return `<p class="mon">${M} ${e.special ? esc(c.special) : 'üt'}: ${fmt(e.dmg)} sebzés${e.special ? '!' : '.'}${e.crit ? ' Ez fájt!' : ''}${e.absorbed ? ` (a pajzs ${fmt(e.absorbed)} pontot elnyelt)` : ''}</p>`;
      case 'heal': return e.amount > 0 ? `<p class="heal">${H} ${e.skill === 'regen' ? 'erőre kap a holdfénytől' : 'gyógyul'}: +${fmt(e.amount)} ÉLET.</p>` : '';
      case 'shield': return `<p class="heal">Védőpajzs: ${fmt(e.amount)} sebzést fog fel.</p>`;
      case 'stun': return `<p>${M} megszédül, és kihagy egy kört.</p>`;
      case 'dot': return `<p>A méreg tovább mar: ${fmt(e.dmg)}.</p>`;
      case 'skip': return `<p class="muted">${M} még kábult, nem tud támadni.</p>`;
    }
    return '';
  }
  function startCombat(kind, fight, extra) {
    const h = hero();
    const rid = extra && extra.region ? extra.region : fight.boss ? (S.boss ? S.boss.region : 'ejkatlan') : (S.save.expedition ? S.save.expedition.offer.region : 'kodlap');
    S.combat = {
      // a harc eredményét a krónika csak a harc végén árulja el (az utolsó pár másodperc bejegyzései addig rejtve)
      chronCut: now() - 3000,
      kind: kind, fight: fight, heroF: fight.heroF, mon: fight.mon, idx: 0, done: false, mounted: false, timer: null,
      heroName: h.name, monName: fight.mon.name, pet: fight.allies && fight.allies.length ? fight.allies.join(' és ') : petName(h), special: (extra && extra.special) || D.MONSTER_SPECIALS[Math.floor(Math.random() * D.MONSTER_SPECIALS.length)],
      // Aréna: az ellenfél hőse (kinézettel) rajzolódik a szörny helyére
      oppHero: extra && extra.opp ? { name: extra.opp.name, classId: extra.opp.classId, rig: safeRig({ classId: extra.opp.classId, rig: extra.opp.rig, look: extra.opp.look, people: extra.opp.people }) } : null,
      region: rid, guard: kind === 'guard' || kind === 'story', boss: !!fight.boss, hp: fight.heroF.hpStart, mhp: fight.mon.hpStart, round: 1, logHtml: '', extra: extra || {}, dealt: 0
    };
    tip('harc');
  }
  const NEW_STAGE = !!(window.NYX.stage && A.isNew);
  function safeRig(h) { try { if (h && h.rig && !(h.equipped && !Array.isArray(h.equipped)) && G.cleanWorn) return G.cleanWorn(h.rig, h.classId); return G.wornLook ? G.wornLook(h) : G.migrateLook(h); } catch (e) { return G.cleanRig(null, h.classId); } }
  // az új harci színpad: táj, hős, szörny, fejléc (élet, kör); alatta a napló és a gombok
  function renderStage(c, h, r, speed) {
    const hpP = Math.max(0, c.hp / c.heroF.maxHp * 100), mP = Math.max(0, c.mhp / c.mon.maxHp * 100);
    const narrow = window.matchMedia ? matchMedia('(max-width: 760px)').matches : (window.innerWidth || 1440) <= 760;
    const tag = c.boss ? '<em class="tag">Heti szörny</em>' : c.guard ? '<em class="tag">Őrző</em>' : '';
    const hud = `<div class="nx-hud">
        <div class="nx-hp"><span class="nm">${esc(c.heroName)}</span><div class="nx-bar h${hpP < 30 ? ' low' : ''}" id="bar-h"><i id="hp-h" style="width:${hpP}%"></i></div><span class="hpn" id="hpt-h">${fmt(c.hp)} / ${fmt(c.heroF.maxHp)}</span></div>
        <div class="nx-round" aria-hidden="true">KÖR<b id="rnd">${c.round}</b>${c.boss ? `<span class="dealt">Sebzés<b id="dealt">${fmt(c.dealt)}</b></span>` : ''}</div>
        <div class="nx-hp r"><span class="nm${c.monName.length > 16 ? ' long' : ''}">${tag}${esc(c.monName)}</span><div class="nx-bar m"><i id="hp-m" style="width:${mP}%"></i></div><span class="hpn" id="hpt-m">${fmt(c.mhp)} / ${fmt(c.mon.maxHp)}</span></div>
      </div>`;
    const inner = window.NYX.stage.html({ region: r.id, narrow: narrow, hud: hud, hero: { name: h.name, classId: h.classId, rig: safeRig(h) }, mon: { name: c.monName, guard: c.guard, boss: c.boss, hero: c.oppHero || null } });
    return `<div class="arena nx-arena" id="arena" role="img" aria-label="${esc(c.heroName)} harcol: ${esc(c.monName)}">${inner}</div>
      <div class="panel combat-log" id="clog" aria-live="polite">${c.logHtml}</div>
      <div class="combat-ctrl" id="cctrl">${combatCtrl(speed)}</div>`;
  }
  function renderCombat() {
    const c = S.combat, h = hero(), r = region(c.region), speed = S.save.settings.speed || 1;
    c.mounted = false;
    if (NEW_STAGE) return renderStage(c, h, r, speed);
    const hpP = Math.max(0, c.hp / c.heroF.maxHp * 100), mP = Math.max(0, c.mhp / c.mon.maxHp * 100);
    return `<div class="arena" id="arena">${A.isNew ? `<div class="bg">${A.sceneSvg(r.scene, 21, { live: true })}</div>` : A.sceneSvg(r.scene, 21).replace('<svg', '<svg class="bg"')}
      <div class="arena-inner">
        <div class="fighter" id="f-h"><div class="figure" id="fig-h">${A.heroSvg(h, { full: true, live: true })}</div><div class="fname">${esc(c.heroName)}</div>
          <div class="fbar"><div class="bar hp lg${hpP < 30 ? ' low' : ''}" id="bar-h"><i id="hp-h" style="width:${hpP}%"></i></div><div class="bar-label"><span id="hpt-h">${fmt(c.hp)} / ${fmt(c.heroF.maxHp)}</span></div></div></div>
        <div class="vs"><div class="round">KÖR<b id="rnd">${c.round}</b></div>${c.boss ? `<div class="small" style="margin-top:6px;color:var(--fakla-300);font-weight:800">Sebzés:<br><span id="dealt" style="font-family:var(--display);font-size:20px">${fmt(c.dealt)}</span></div>` : ''}</div>
        <div class="fighter" id="f-m"><div class="figure" id="fig-m">${A.monsterSvg(c.monName, r.id, { guard: c.guard, boss: c.boss, live: true })}</div><div class="fname">${esc(c.monName)}</div>
          <div class="fbar"><div class="bar mon lg"><i id="hp-m" style="width:${mP}%"></i></div><div class="bar-label"><span id="hpt-m">${fmt(c.mhp)} / ${fmt(c.mon.maxHp)}</span></div></div></div>
      </div></div>
      <div class="panel combat-log" id="clog" aria-live="polite">${c.logHtml}</div>
      <div class="combat-ctrl" id="cctrl">${combatCtrl(speed)}</div>`;
  }
  function combatCtrl(speed) {
    const c = S.combat;
    if (c && c.done) return `<button class="btn primary lg" data-act="combat-done">Tovább</button>`;
    return `<div class="seg" role="group" aria-label="Sebesség">${[1, 2, 4].map(v => `<button data-act="speed" data-v="${v}" aria-pressed="${speed === v}">${v}×</button>`).join('')}</div>
      <button class="btn" data-act="skip">Ugrás a végére</button>`;
  }
  function mountCombat() {
    const c = S.combat;
    c.mounted = true;
    if (NEW_STAGE) {
      const ar = el('arena'); if (!ar) return;
      const cls0 = D.CLASSES[hero().classId];
      c.stage = window.NYX.stage.create(ar, { basic: cls0 ? cls0.basic : null, boss: c.boss, monName: c.monName });
      c.stage.setRate(S.save.settings.speed || 1);
      if (c.done) { c.stage.setEnd(c.fight.win); return; }
      const g = c.stage.newGen();
      playStage(c, c.stage, g);
      return;
    }
    if (!c.done && !c.timer) c.timer = setTimeout(stepCombat, 450);
  }
  // Az események lejátszása az új színpadon. Az állapot (élet, napló, kör) csak akkor lép tovább, amikor az adott
  // esemény látványa ott tart (take); ha közben újrarajzolás vagy átugrás jön, ez a lejátszás leáll, és ahol abbahagyta,
  // onnan folytatja a következő (nem lép kétszer és nem hagy ki eseményt).
  async function playStage(c, st, g) {
    const log = c.fight.log, basic = D.CLASSES[hero().classId].basic;
    const ok = () => st.alive(g) && S.combat === c && !c.done;
    const take = e => { if (log[c.idx] === e) { c.idx++; applyEvent(e, true); } };
    // újrarajzolás után nincs újabb bevezető szünet, és a folyamatban lévő képesség sem vész el
    if (c.idx === 0) await st.wait(420);
    let pending = c.pending || null;
    while (ok() && c.idx < log.length) {
      const start = c.idx, e = log[c.idx];
      try {
        if (e.kind === 'round') { take(e); await st.wait(300); }
        else if (e.kind === 'skill') {
          take(e); pending = c.pending = e.skill;
          const nx = log[c.idx];
          // erősítő képesség (gyógyítás, pajzs): a hős mozdulata és a varázslat, mielőtt a hatás látszik
          if (nx && (nx.kind === 'heal' || nx.kind === 'shield')) { await st.heroCast(g, pending); pending = c.pending = null; }
        }
        else if (e.kind === 'hit' && e.who === 'h') {
          const hits = []; for (let j = c.idx; j < log.length && log[j].kind === 'hit' && log[j].who === 'h'; j++) hits.push(log[j]);
          await st.heroSkill(g, pending || basic, hits, take); if (st.alive(g)) pending = c.pending = null; await st.wait(380);
        }
        else if (e.kind === 'hit' && e.who === 'pet') { await st.pet(g, e, take); await st.wait(300); }
        else if (e.kind === 'hit' && e.who === 'm') { await st.monAttack(g, e.special, e, take, c.special); await st.wait(480); }
        else if (e.kind === 'heal') { st.heal(g, e.amount); take(e); await st.wait(320); }
        else if (e.kind === 'shield') { st.shield(g); take(e); await st.wait(320); }
        else if (e.kind === 'stun' || e.kind === 'skip') { st.stun(g); take(e); await st.wait(e.kind === 'skip' ? 650 : 260); }
        else if (e.kind === 'dot') { st.dot(g, e); take(e); await st.wait(320); }
        else take(e);
      } catch (err) { /* a látvány hibája nem akaszthatja meg a harcot */ }
      // ha a látvány valamiért nem léptetett (de a lejátszás még érvényes), az eseményt akkor is alkalmazzuk
      if (ok() && c.idx === start) take(e);
    }
    if (!ok() || c.idx < log.length) return;
    await st.wait(250);
    if (!ok()) return;
    finishCombatAnim();
    try { st.finish(c.fight.win); } catch (err) { /* csak látvány */ }
  }
  function floatAt(figId, text, cls2) {
    const f = el(figId);
    if (!f) return;
    const d = document.createElement('span');
    d.className = 'float ' + cls2; d.textContent = text;
    f.appendChild(d);
    setTimeout(() => d.remove(), 1000);
  }
  function anim(id, cls2) { const f = el(id); if (!f) return; f.classList.remove(cls2); void f.offsetWidth; f.classList.add(cls2); }
  function applyEvent(e, animate) {
    const c = S.combat;
    if (e.hp != null) {
      c.hp = e.hp;
      if (c.boss) { c.dealt = 1e12 - e.mhp; c.mhp = Math.max(0, c.mon.hpStart - c.dealt); } else c.mhp = e.mhp;
    }
    if (e.kind === 'round') c.round = e.r;
    const line = logLine(e, c);
    c.logHtml += line;
    if (!animate) return;
    const log = el('clog');
    if (log && line) { log.insertAdjacentHTML('beforeend', line); log.scrollTop = log.scrollHeight; }
    if (el('rnd')) el('rnd').textContent = c.round;
    if (el('dealt')) el('dealt').textContent = fmt(c.dealt);
    if (c.stage) { updateBars(); return; }
    if (e.kind === 'skill') {
      const f = el('f-h');
      if (f) { const s = document.createElement('span'); s.className = 'skill-flash'; s.textContent = D.SKILLS[e.skill].name; f.appendChild(s); setTimeout(() => s.remove(), 1100); }
    }
    if (e.kind === 'hit' || e.kind === 'dot') {
      if (e.who === 'm') { anim('fig-m', 'lunge-l'); if (!e.dodge) anim('fig-h', 'hit-shake'); floatAt('fig-h', e.dodge ? 'kitért' : '-' + fmt(e.dmg), e.dodge ? 'miss' : e.crit ? 'crit' : 'dmg'); }
      else { if (e.kind === 'hit' && e.who === 'h') anim('fig-h', 'lunge-r'); if (!e.dodge) anim('fig-m', 'hit-shake'); floatAt('fig-m', e.dodge ? 'mellé' : '-' + fmt(e.dmg), e.dodge ? 'miss' : (e.crit || e.first) ? 'crit' : 'dmg'); }
    }
    if (e.kind === 'heal' && e.amount > 0) floatAt('fig-h', '+' + fmt(e.amount), 'heal');
    if (e.kind === 'shield') floatAt('fig-h', 'pajzs', 'heal');
    updateBars();
  }
  function updateBars() {
    const c = S.combat;
    const hpP = Math.max(0, c.hp / c.heroF.maxHp * 100), mP = Math.max(0, c.mhp / c.mon.maxHp * 100);
    if (el('hp-h')) { el('hp-h').style.width = hpP + '%'; el('bar-h').classList.toggle('low', hpP < 30); el('hpt-h').textContent = fmt(Math.max(0, c.hp)) + ' / ' + fmt(c.heroF.maxHp); }
    if (el('hp-m')) { el('hp-m').style.width = mP + '%'; el('hpt-m').textContent = fmt(c.mhp) + ' / ' + fmt(c.mon.maxHp); }
  }
  function delayFor(e) {
    const base = { round: 380, skill: 520, hit: 700, heal: 520, shield: 480, stun: 520, dot: 520, skip: 560 }[e.kind] || 500;
    return base / (S.save.settings.speed || 1);
  }
  function stepCombat() {
    const c = S.combat;
    if (!c) return;
    c.timer = null;
    if (c.idx >= c.fight.log.length) return finishCombatAnim();
    const e = c.fight.log[c.idx++];
    const visible = !!el('arena');
    applyEvent(e, visible);
    c.timer = setTimeout(stepCombat, visible ? delayFor(e) : 0);
  }
  function endLine() {
    const c = S.combat, f = c.fight, H = esc(c.heroName), M = esc(art(c.monName));
    if (c.boss) return `<p class="r">VÉGE</p><p class="crit">${H} ${fmt(c.extra.damage || c.dealt)} sebzést vitt be a heti szörnynek (${esc(c.monName)})${c.extra.weak ? ', telibe találta a gyenge pontját' : ''}!</p>`;
    if (f.timeout) return `<p class="r">VÉGE</p><p><b>Letelt a 15 kör!</b> Az nyer, akinek százalékban több élete maradt: ${f.win ? H : M}.</p>`;
    return f.win ? `<p class="r">VÉGE</p><p class="crit">${M} a földre rogy. Győzelem!</p>` : `<p class="r">VÉGE</p><p class="mon">${H} megbotlik és elesik. Most nem sikerült.</p>`;
  }
  function finishCombatAnim() {
    const c = S.combat;
    c.done = true;
    // a legyőzött fél elesik, a győztes az arénában is látszik
    if (!c.boss && !c.stage) { const lose = el(c.fight.win ? 'fig-m' : 'fig-h'); if (lose) lose.classList.add('ko'); const ar = el(c.fight.win ? 'f-h' : 'f-m'); if (ar && c.fight.win) ar.classList.add('winner'); }
    const line = endLine();
    c.logHtml += line;
    const log = el('clog');
    if (log) { log.insertAdjacentHTML('beforeend', line); log.scrollTop = log.scrollHeight; }
    const ctrl = el('cctrl');
    if (ctrl) ctrl.innerHTML = combatCtrl(S.save.settings.speed);
  }
  function skipCombat() {
    const c = S.combat;
    if (!c || c.done) return;
    clearTimeout(c.timer); c.timer = null;
    if (c.stage) c.stage.newGen();
    while (c.idx < c.fight.log.length) applyEvent(c.fight.log[c.idx++], false);
    c.done = true; c.logHtml += endLine();
    render();
  }
  function combatDone() {
    const c = S.combat;
    if (c) { clearTimeout(c.timer); if (c.stage) c.stage.newGen(); }
    if (window.NYX.vfx && window.NYX.vfx.setRate) window.NYX.vfx.setRate(1);
    S.combat = null;
    if (c && c.extra && typeof c.extra.after === 'function') { try { c.extra.after(c); } catch (e) { console.error(e); } }
    if (c && c.boss) {
      const x = c.extra;
      toast(`${fmt(x.damage)} sebzés · +${fmt(x.xp)} TP · +${fmt(x.dust)} Csillagpor`);
      if (x.levelUps && x.levelUps.length) S.modal = { type: 'level', ups: x.levelUps };
      if (ONLINE) refreshState().then(render).catch(() => {});
    }
    render(); scrollTop();
  }

  // ---------- eredmény ----------
  function renderResult(exp) {
    const res = S.save.pendingResult, h = hero(), tr = D.TRAITS[h.trait];
    if (!res) return '<div class="panel"><button class="btn primary" data-act="camp">Vissza a táborba</button></div>';
    if (S.seenResult !== res.expId && (() => { try { return sessionStorage.getItem('nyx-seen') !== res.expId; } catch (e) { return true; } })()) { S.seenResult = res.expId; try { sessionStorage.setItem('nyx-seen', res.expId); } catch (e) { /* privát mód */ } if (res.levelUps.length) S.modal = { type: 'level', ups: res.levelUps }; tip('eredmeny'); }
    const gains = [`<span class="gain">${I.xp}+${fmt(res.xp)} TP${res.rested ? ' <span style="color:var(--tunde-400)">(Frissesség ×2)</span>' : ''}${res.windMult > 1 ? ` <span style="color:var(--tunde-400)">(szél ×${dec(res.windMult)})</span>` : ''}${res.tired ? ' <span class="muted">(fáradt)</span>' : ''}</span>`];
    if (res.silver) gains.push(`<span class="gain">${I.silver}+${fmt(res.silver)}</span>`);
    if (res.dust) gains.push(`<span class="gain">${I.dust}+${fmt(res.dust)}</span>`);
    const found = res.items.length ? `<div class="panel" style="margin-top:12px"><h3>Útközben találtad</h3><div class="stack" style="margin-top:10px">${res.items.map(i => itemHtml(i, { delta: true })).join('')}</div><p class="small muted" style="margin-top:8px">Ezek már a táskádban vannak.</p></div>` : '';
    const mythic = res.mythic ? `<div class="panel" style="margin-top:12px;border-color:var(--tunde-400);box-shadow:0 0 24px rgba(127,243,255,.25)"><div class="tiny" style="color:var(--tunde-400)">✦ Mitikus tárgy ✦</div><h2 style="margin:6px 0 10px;color:var(--tunde-400)">Hihetetlen szerencse!</h2>${itemHtml(res.mythic, { delta: true })}<p class="small muted" style="margin-top:8px">Legendás erejű, és a ragyogása egyedi.${ONLINE ? ' A Discordon a krónika már ki is hirdette.' : ''}</p></div>` : '';
    const choices = res.win && !res.chosen ? `<section style="margin-top:16px"><h2>Válassz egy jutalmat</h2><div class="choices">${res.choices.map((ch, i) => choiceHtml(ch, i)).join('')}</div></section>` : '';
    const after = (!res.win || res.chosen) ? `<div class="row" style="justify-content:center;margin-top:16px"><button class="btn primary lg" data-act="camp">Vissza a táborba</button></div>` : '';
    return `<div class="banner ${res.win ? 'win' : 'lose'}">
        <div class="tiny">${esc(region(exp.offer.region).name)} · ${E.DIFF[exp.offer.diff].name}</div>
        <h1>${res.win ? 'Győzelem!' : 'Most nem sikerült'}</h1>
        ${guardText(exp.offer.guard, res.win ? 'win' : 'lose') ? `<p style="margin-top:6px;max-width:560px;margin-left:auto;margin-right:auto">${esc(guardText(exp.offer.guard, res.win ? 'win' : 'lose'))}</p>` : ''}
        <p class="muted" style="margin-top:4px">${esc(res.win ? tr.win : tr.lose)}</p>
        <div class="gains">${gains.join('')}</div>
        <div style="max-width:420px;margin:14px auto 0;text-align:left">${xpBar(h)}</div>
        ${!res.win ? `<div class="advice">${A.OWL.replace('width="64" height="64"', 'width="36" height="36"')}<div><b>Bubó tanácsa:</b> ${esc(res.advice)}<br><span class="small muted">A vereségért is jár a tapasztalat fele, és semmit nem veszítesz.</span></div></div>` : ''}
      </div>${mythic}${choices}${found}${after}`;
  }
  function choiceHtml(ch, i) {
    let body;
    if (ch.kind === 'item') body = `<span class="tiny">Tárgy</span>${itemHtml(ch.item, { delta: true })}`;
    else if (ch.kind === 'silver') body = `<span class="tiny">Holdezüst</span><span class="big">${I.silver}${fmt(ch.amount)}</span><span class="small muted">A Vándorkereskedőnél, céhalapításhoz és tárgyak újrasorsolásához.</span>`;
    else if (ch.kind === 'dust') body = `<span class="tiny">Csillagpor</span><span class="big">${I.dust}${fmt(ch.amount)}</span><span class="small muted">${(() => { const room = E.dustRoom(S.save, now()); return room <= 0 ? '<b style="color:#ff8a8a">A heti keret betelt: most 0-t ér.</b> Hétfőn újraindul.' : room < ch.amount ? `A heti keretből már csak ${fmt(room)} fér bele.` : `A tárgyaid fejlesztéséhez. Heti keret: ${fmt(E.dustCap(hero().level))}.`; })()}</span>`;
    else body = `<span class="tiny">Tapasztalat-tekercs</span><span class="big">${I.xp}+${fmt(ch.amount * xpMultNow())} TP</span><span class="small muted">Gyorsabban jön a következő szint.</span>`;
    return `<button class="choice${ch.kind === 'item' && ch.item.rarity === 'legendas' ? ' legend' : ''}" data-act="choose" data-v="${i}">${body}</button>`;
  }

  // ---------- hős ----------
  function renderHero() {
    const h = hero(), c = cls(h), s = E.heroStats(h), sc = 40 + 8 * h.level;
    tip('hos');
    const crit = 5 + 25 * s.fur / (s.fur + sc) + s.crit, dodge = 3 + 12 * s.fur / (s.fur + sc) + s.dodge;
    const slots = D.SLOT_ORDER.map(slot => {
      const it = h.equipped[slot];
      return `<button class="slot" data-act="slot" data-v="${slot}" aria-pressed="${S.slot === slot}">${it ? itemHtml(it) : `<span class="muted">${D.SLOTS[slot].name}: üres</span>`}</button>`;
    }).join('');
    const sel = h.equipped[S.slot];
    let detail = '';
    if (sel) {
      const cost = E.upgradeCost(sel), rc = sel.affixes.length ? E.rerollCost(sel) : null;
      const room = E.dustRoom(S.save, now()), mx = E.maxPlus(sel), sc = E.upgradeSilver(sel);
      detail = `<div class="detail">${itemHtml(sel)}<hr class="divider">
        <div class="row between"><div><b>Fejlesztés</b><p class="small muted">Lépcsőnként +3% az alapértékekre. Most: +${sel.plus || 0} / +${mx} (${D.RARITIES[sel.rarity].name} tárgynál ennyi a határ). Ha később szétszeded vagy eladod, a beletett Csillagpor 70%-a visszajár.</p></div>
        ${cost == null ? `<span class="badge">KÉSZ +${Math.max(mx, sel.plus || 0)}</span>` : `<button class="btn fakla sm" data-act="upgrade" data-v="${sel.id}" ${h.dust < cost || h.silver < sc ? 'disabled' : ''}>${I.dust}${fmt(cost)} · ${I.silver}${fmt(sc)}</button>`}</div>
        ${rc != null ? `<div class="row between" style="margin-top:10px"><div><b>Tárgyjellemző újrasorsolása</b><p class="small muted">Új véletlen jellemzők. Minden újabb próba drágább.</p></div><button class="btn sm" data-act="reroll" data-v="${sel.id}" ${h.silver < rc ? 'disabled' : ''}>${I.silver}${fmt(rc)}</button></div>` : ''}
        ${h.dust < (cost || 0) ? `<p class="small muted" style="margin-top:8px">Csillagpor a győzelmekből, az őrjáratból, a heti szörny ládáiból és a tárgyak szétszedéséből jön. Hetente legfeljebb ${fmt(E.dustCap(h.level))} szerezhető${room != null ? `, ezen a héten még ${fmt(room)}` : ''}.</p>` : ''}
      </div>`;
    }
    const unlocked = E.unlockedSkills(h), basic = c.basic;
    const loadout = h.loadout.map((id, i) => `<div class="skill"><span class="num">${i + 1}</span>${skillIc(id)}<div style="min-width:0"><div class="sn">${esc(D.SKILLS[id].name)} <span class="small muted">· ${D.SKILLS[id].cd} körönként</span></div><div class="sd">${esc(D.SKILLS[id].desc)}</div></div>
      <div class="move"><button data-act="skill-move" data-v="${i}" data-dir="-1" aria-label="Előrébb" ${i === 0 ? 'disabled' : ''}>${I.up}</button><button data-act="skill-move" data-v="${i}" data-dir="1" aria-label="Hátrébb" ${i === h.loadout.length - 1 ? 'disabled' : ''}>${I.down}</button></div></div>`).join('');
    const locked = c.skills.map((id, i) => unlocked.indexOf(id) < 0 ? `<div class="skill locked"><span class="num">${D.SKILL_LEVELS[i]}.</span>${skillIc(id, true)}<div><div class="sn">${esc(D.SKILLS[id].name)}</div><div class="sd">${esc(D.SKILLS[id].desc)} <b>A ${D.SKILL_LEVELS[i]}. szinten nyílik.</b></div></div></div>` : '').join('');
    return `<section class="panel"><div class="panel-title"><div><h1>${esc(h.name)}</h1><p class="small muted">${esc(D.ORIGINS[h.origin].name)} · ${esc(D.TRAITS[h.trait].name)}${h.motto ? ` · „${esc(h.motto)}”` : ''}</p></div>${NEW_CREATOR ? '<button class="btn sm" data-act="restyle">Kinézet átszabása</button>' : ''}</div>
        <div class="row wrap" style="gap:8px"><span class="badge">Telitalálat esélye ${dec(crit)}%</span><span class="badge">Kitérés ${dec(dodge)}%</span>${s.dmg ? `<span class="badge">+${s.dmg}% sebzés</span>` : ''}${s.heal ? `<span class="badge">+${s.heal}% gyógyítás</span>` : ''}<span class="badge">Győzelmek: ${h.stats.wins} / ${h.stats.expeditions}</span>${(S.titles || []).map(t => `<span class="badge" style="color:var(--fakla-300)">${esc(t)}</span>`).join('')}</div></section><!--nx-split-->
      <div class="hero-grid" style="margin-top:12px">
        <section class="panel"><div class="panel-title"><h2>Felszerelés</h2><button class="btn ghost sm" data-act="screen" data-v="taska">Táska (${h.inventory.length})</button></div><div class="slots">${slots}</div><div style="margin-top:12px">${detail}</div></section>
<!--nx-eq-->        <section class="panel"><div class="panel-title"><h2>Képességek</h2></div>
          <p class="small muted" style="margin-bottom:10px">A hős mindig a lista első kész képességét használja. A sorrendet a nyilakkal állíthatod. Ha egyik sincs kész: <b>${esc(D.SKILLS[basic].name)}</b> (${esc(D.SKILLS[basic].desc.toLowerCase().replace(/\.\s*$/, ''))}).</p>
          ${loadout || '<p class="small muted">A 3. szinten kapod az első képességet.</p>'}${locked}
          <hr class="divider">${pathsHtml(h)}
        </section>
      </div>${lookPanel(h)}`;
  }
  // ---------- kinézet a felszerelésből (gyűjtemény) ----------
  const SLOT_NAME = { fegyver: 'Fegyver', pancel: 'Páncél', sisak: 'Fejfedő', gyuru: 'Gyűrű', amulett: 'Amulett' };
  function lookLabel(h, sl, key) { const nm = (h.lookNames || {})[sl + ':' + key], ln = G.lookName(key); return (nm && nm !== ln ? nm + ' · ' : '') + ln + (G.lookVisible(sl, key) ? '' : ' (nem látszik)'); }
  function lookPanel(h) {
    if (!G.wornLook) return '';
    const own = h.looks || {}, pick = h.lookPick || {}, cos = G.cosmeticList ? G.cosmeticList(S.save) : [], C = h.cosm || { wings: [], aura: [] };
    const rows = D.SLOT_ORDER.filter(sl => sl !== 'amulett' || (own.amulett || []).some(k => G.lookVisible('amulett', k))).map(sl => {
      const cur = pick[sl] || 'auto', it = h.equipped[sl];
      const ik = it && G.lookKey(it), vis = ik && G.lookVisible(sl, ik);
      const opts = [['auto', it ? `A viselt tárgy: ${G.lookName(ik) || D.RARITIES[it.rarity].name}${vis ? '' : ' (nem látszik)'}` : 'A viselt tárgy (nincs)'], ['alap', sl === 'sisak' ? 'Nem látszik (amit a hőskészítőben választottál)' : 'Amit a hőskészítőben választottál']].concat((own[sl] || []).filter(k => k.indexOf(':') > 0 || k.indexOf('u|') === 0).map(k => [k, lookLabel(h, sl, k)]));
      return `<label class="lk-row"><span>${SLOT_NAME[sl]}</span><select data-act="look-pick" data-v="${sl}">${opts.map(([k, l]) => `<option value="${esc(k)}"${k === cur ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
    }).join('');
    const cosSel = (kind, slot, label) => { const list = cos.filter(c => c.kind === kind && c.done); return `<label class="lk-row"><span>${label}</span><select data-act="look-pick" data-v="${slot}"${list.length ? '' : ' disabled'}><option value="nincs">${list.length ? 'Nincs' : 'Még nincs (eredményekért jár)'}</option>${list.map(c => `<option value="${c.id}"${pick[slot] === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}${(C[kind] || []).filter(id => !cos.some(c => c.kind === kind && c.id === id)).map(id => `<option value="${id}"${pick[slot] === id ? ' selected' : ''}>${esc(id)} (régi)</option>`).join('')}</select></label>`; };
    const n = Object.keys(own).reduce((t, k) => t + own[k].length, 0);
    const dye = h.dye || {}, pend = S.dyePend || {}, w0 = G.wornLook(h), canDye = !!(w0.gset || w0.uniqP);
    const sw = (k) => `<div class="dye-row"><span class="tiny">${k === 'c1' ? 'Fő szín' : 'Díszítés'}</span><div class="dye-sw">${G.DYES.map(c => `<button class="sw${(pend[k] || dye[k]) === c ? ' on' : ''}" style="background:${c}" data-act="dye-pick" data-v="${k}|${c}" aria-label="Szín kiválasztása"${canDye ? '' : ' disabled'}></button>`).join('')}</div></div>`;
    const pendN = Object.keys(pend).length;
    const ach = cos.map(c => `<li class="${c.done ? 'ok' : ''}"><b>${esc(c.name)}</b><span class="small muted">${esc(c.how)}</span><span class="small">${c.done ? 'Megvan' : `${fmt(c.have)} / ${fmt(c.goal)}`}</span></li>`).join('');
    return `<section class="panel lk-panel" style="margin-top:12px"><div class="panel-title"><div><h2>Ruhatár</h2><p class="small muted">A tárgyak a tájegységük szettjét adják: ahonnan a tárgy származik, olyan a stílusa, és minél ritkább, annál gazdagabb. A névvel ellátott legendás és mitikus tárgyak egyedi kinézetűek. A fegyvered a fejlesztéstől kezd fényleni (+4, +8, +10, +12). Amit egyszer viseltél, ide kerül (${n} darab), és bármikor magadra öltheted.</p></div></div>
      <div class="lk-grid"><div class="lk-fig">${A.heroSvg(pendN ? Object.assign({}, h, { dye: Object.assign({}, h.dye, pend) }) : h, { full: true })}</div><div class="lk-rows">${rows}${cosSel('wings', 'szarny', 'Szárny')}${cosSel('aura', 'aura', 'Aura')}</div></div>
      <details class="lk-more"${S.dyeOpen ? ' open' : ''}><summary>Festés (${G.DYE_COST} Csillagpor / festés)</summary><p class="small muted">${canDye ? 'Válassz színt: a képen rögtön látod. Csak a Festés gombbal fizetsz.' : 'Festeni csak szett- vagy egyedi páncélt lehet (a zöldtől felfelé).'}</p>${sw('c1')}${sw('c2')}<div class="row" style="gap:8px;margin-top:10px">${pendN ? `<button class="btn primary sm" data-act="dye" data-v="go">Festés: ${G.DYE_COST} Csillagpor</button><button class="btn ghost sm" data-act="dye" data-v="cancel">Mégse</button>` : ''}${h.dye && !pendN ? '<button class="btn ghost sm" data-act="dye" data-v="clear">Eredeti színek (ingyen)</button>' : ''}</div></details>
      <details class="lk-more"><summary>Szárnyak és aurák (${cos.filter(c => c.done).length} / ${cos.length})</summary><ul class="lk-ach">${ach}</ul></details></section>`;
  }


  // ---------- táska ----------
  function renderBag() {
    const h = hero();
    const list = h.inventory.slice().sort((a, b) => E.powerDelta(h, b) - E.powerDelta(h, a));
    const room = E.dustRoom(S.save, now());
    // széttörés vagy eladás: amíg van hely a heti Csillagpor-keretben, a szétszedés éri meg, utána az eladás
    const items = list.map(it => {
      const sv = Math.min(room, E.salvageValue(it)), rf = E.refundValue(it), better = sv >= E.salvageValue(it) * 0.5 ? 'salvage' : 'sell';
      return `<div class="inv-item">${itemHtml(it, { delta: true })}<div class="actions">
      <button class="btn primary sm" data-act="equip" data-v="${it.id}">Felveszem</button>
      <button class="btn ghost sm" data-act="try-on" data-v="${it.id}">${S.tryOn === it.id ? 'Bezárom' : 'Felpróbálom'}</button>
      <button class="btn ${better === 'salvage' ? '' : 'ghost '}sm" data-act="salvage" data-v="${it.id}">${I.dust}Szétszedés (+${fmt(sv + rf)})</button>
      <button class="btn ${better === 'sell' ? '' : 'ghost '}sm" data-act="sell" data-v="${it.id}">${I.silver}Eladás (+${fmt(E.sellValue(it))}${rf ? ` · ${I.dust}+${fmt(rf)}` : ''})</button></div></div>`;
    }).join('');
    const weak = h.inventory.filter(it => !it.mythic && (it.rarity === 'szurke' || it.rarity === 'zold') && !E.isUpgrade(h, it)).length;
    const tryIt = S.tryOn && h.inventory.filter(x => x.id === S.tryOn)[0];
    const tryHtml = tryIt ? (() => { const t = JSON.parse(JSON.stringify(h)); t.equipped[tryIt.slot] = tryIt; if (t.lookPick) delete t.lookPick[tryIt.slot];
      return `<section class="panel try-on"><div class="panel-title"><h2>Próbafülke: ${esc(tryIt.name)}</h2><button class="btn ghost sm" data-act="try-on" data-v="${tryIt.id}">Bezárom</button></div>
        ${JSON.stringify(G.wornLook(h)) === JSON.stringify(G.wornLook(t)) ? '<p class="small muted" style="margin-bottom:8px">Ez a tárgy nem változtat a kinézeteden (a szürke ruha a sajátodat mutatja, a gyűrű a kéktől látszik, az amulett csak mitikusként).</p>' : ''}
        <div class="try-grid"><figure><div class="try-fig">${A.heroSvg(h, { full: true })}</div><figcaption>Most</figcaption></figure><span class="hf-arrow">→</span><figure><div class="try-fig">${A.heroSvg(t, { full: true })}</div><figcaption>Ebben</figcaption></figure></div></section>`; })() : '';
    return tryHtml + `<section class="panel"><div class="panel-title"><div><h1>Táska</h1><p class="small muted">${h.inventory.length} / ${E.INVENTORY_MAX} hely · a zöld nyíl azt jelzi, hogy a tárgy erősebb a mostaninál</p></div></div>
      <p class="small" style="margin-bottom:10px">${room > 0 ? `A heti Csillagpor-keretből még <b>${fmt(room)}</b> fér bele: amíg van hely, a szétszedés éri meg jobban.` : 'A heti Csillagpor-keret betelt (hétfőn nyílik újra): most az <b>eladás</b> éri meg jobban.'} A fejlesztett tárgyakba tett por 70%-a mindkét esetben visszajár, a kereten felül.</p>
      <div class="row wrap between"><label class="row small" style="cursor:pointer;gap:10px"><input type="checkbox" data-act="autosalvage" ${S.save.settings.autoSalvage ? 'checked' : ''} style="width:18px;height:18px"> A gyengébb szürke és zöld tárgyak automatikus szétszedése</label>
      ${weak ? `<button class="btn sm" data-act="salvage-weak">Gyengébbek szétszedése (${weak})</button>` : ''}</div></section>
      <section style="margin-top:12px">${items ? `<div class="inv-list">${items}</div>` : '<div class="panel"><p class="muted">A táskád üres. Tárgyat kalandokon, őrjáraton és a heti szörny ládáiból szerezhetsz.</p></div>'}</section>`;
  }

  // ---------- beállítások ----------
  function renderSettings() {
    const st = S.save.settings;
    let account, save = '', reset = '', admin = '';
    if (ONLINE) {
      account = `<div class="row between wrap"><div><b>Fiók</b><p class="small muted">Discordon belépve: ${esc(S.me ? S.me.name : '')}. A hősöd a közös szerveren van elmentve.</p></div><button class="btn sm" data-act="logout">Kilépés</button></div>`;
      if (S.me && S.me.admin) {
        admin = `<hr class="divider"><div class="row between wrap"><div><b>Admin</b><p class="small muted">Játékosok kezelése, bejelentések, ajándékok, heti szörny és céhek.</p></div><button class="btn sm" data-act="screen" data-v="admin">Admin megnyitása</button></div>`;
      }
    } else {
      account = `<div><b>Gyakorló mód</b><p class="small muted">Gyakorló módban játszol: a hőseid csak ebben a böngészőben vannak meg. Másik gépre a lenti mentéssel viheted át (mindig a most játszott hőst).</p></div>`;
      save = `<hr class="divider"><div><b>Mentés</b><p class="small muted">Másik gépre a kimásolt mentéssel viheted át.</p>
          <div class="row wrap" style="margin-top:8px"><button class="btn sm" data-act="export">Mentés kimásolása</button></div>${S.showExport ? `<textarea class="input" style="height:120px;padding:10px;font-size:12px;font-weight:600;margin-top:8px" readonly id="export-box">${esc(btoa(unescape(encodeURIComponent(JSON.stringify(S.save)))))}</textarea>` : ''}
          <div class="row" style="margin-top:10px;gap:8px"><input class="input" id="import-box" placeholder="Mentés beillesztése…" style="height:38px;font-size:13px"><button class="btn sm" data-act="import">Importálás</button></div></div>`;
      reset = `<hr class="divider"><div class="row between wrap"><div><b>Hőseim</b><p class="small muted">Legfeljebb 3 hősöd lehet, köztük bármikor válthatsz.</p></div><button class="btn sm" data-act="screen" data-v="hosok">Hőseim</button></div>`;
    }
    return `<section class="panel"><h1>Beállítások</h1>
      <div class="stack" style="margin-top:14px">
        ${account}<hr class="divider">
        <div class="row between wrap"><div><b>Harc sebessége</b><p class="small muted">Alapértelmezett lejátszási sebesség.</p></div><div class="seg">${[1, 2, 4].map(v => `<button data-act="speed" data-v="${v}" aria-pressed="${st.speed === v}">${v}×</button>`).join('')}</div></div>
        <div class="row between wrap"><div><b>Bubó tippjei</b><p class="small muted">A kalauz bagoly rövid tanácsai.</p></div><div class="row"><button class="chip" data-act="owl-toggle" aria-pressed="${st.owl}">${st.owl ? 'Bekapcsolva' : 'Kikapcsolva'}</button><button class="btn ghost sm" data-act="owl-reset">Újra mind</button></div></div>
        ${save}${reset}${admin}
        <hr class="divider"><p class="small muted">Nyxoria · zárt teszt. Még sok minden változhat.</p>
      </div></section>`;
  }

  // ---------- ablakok ----------
  function modalHtml() {
    const m = S.modal;
    if (!m) return '';
    if (m.type === 'info') return infoModal(m.kind);
    const still = S.modalShown === m ? ' still' : ''; S.modalShown = m;
    if (m.type === 'legend') {
      const it = m.item, inBag = hero().inventory.some(x => x.id === it.id), better = inBag && E.isUpgrade(hero(), it);
      return `<div class="modal-back legend-back${still}" role="dialog" aria-modal="true" aria-labelledby="leg-t"><div class="modal legend-modal">
        <div class="legend-rays" aria-hidden="true"></div>
        <div class="tiny legend-kicker">${it.mythic ? '✦ Mitikus tárgy ✦' : '★ Legendás tárgy ★'}</div>
        <h2 id="leg-t" class="legend-name">${esc(it.name)}</h2>
        <div class="legend-item">${itemHtml(it, { delta: inBag })}</div>
        <p class="small muted" style="margin-top:10px">${it.mythic ? 'A legritkább fajta: legendás erő, egyedi ragyogás.' : 'Kevés hős mondhat magáénak ilyet.'}${ONLINE ? ' A szerver krónikája már hírül is adta.' : ''}</p>
        <div class="row" style="gap:8px;justify-content:center;margin-top:14px">${better ? `<button class="btn primary" data-act="legend-equip" data-v="${it.id}">Felveszem</button>` : ''}<button class="btn ${better ? '' : 'primary'}" data-act="modal-close">Csodás!</button></div></div></div>`;
    }
    if (m.type === 'level') {
      const h = hero(), last = m.ups[m.ups.length - 1], g = cls(h).base, n = m.ups.length;
      const skills = m.ups.filter(u => u.skill).map(u => `<div class="skill" style="text-align:left;margin-top:8px">${skillIc(u.skill) || '<span class="num">★</span>'}<div><div class="sn">Új képesség: ${esc(D.SKILLS[u.skill].name)}</div><div class="sd">${esc(D.SKILLS[u.skill].desc)}</div></div></div>`).join('');
      return `<div class="modal-back${still}" role="dialog" aria-modal="true" aria-labelledby="lvl-t"><div class="modal">
        <div class="portrait md" style="margin:0 auto 12px">${A.heroSvg(h)}</div>
        <div class="tiny" style="color:var(--fakla-300)">Szintlépés</div><h2 id="lvl-t">${last.level}. szint!</h2>
        <p class="muted" style="margin-top:6px">+${fmt(g.elet[1] * n)} ÉLET · +${dec(g.tam[1] * n)} TÁM · +${dec(g.ved[1] * n)} VÉD · +${dec(g.fur[1] * n)} FÜR</p>
        ${skills}${m.ups.some(u => u.level === D.PATH_LEVEL) ? `<div class="skill" style="text-align:left;margin-top:8px"><span class="num">★</span><div><div class="sn">Megnyíltak az ösvények</div><div class="sd">A Hős képernyőn választhatsz egyet a kasztod három útja közül. Az első választás ingyenes.</div></div></div>` : ''}<button class="btn primary lg block" style="margin-top:16px" data-act="modal-close">Szuper!</button></div></div>`;
    }
    if (m.type === 'chest' || m.type === 'patrol') {
      const r = m.res;
      const title = m.type === 'patrol' ? `Visszatértél a ${r.hours} órás őrjáratról` : ({ 0: 'Győzelmi láda', 3: 'Részvételi láda', 9: 'Ezüst láda', 15: 'Arany láda' }[r.tier]);
      return `<div class="modal-back${still}" role="dialog" aria-modal="true" aria-labelledby="ch-t"><div class="modal">
        <div class="tiny" style="color:var(--fakla-300)">${m.type === 'patrol' ? 'Őrjárat' : 'Szörnyláda'}</div><h2 id="ch-t">${esc(title)}</h2>
        <div class="gains">${r.xp ? `<span class="gain">${I.xp}+${fmt(r.xp)} TP</span>` : ''}<span class="gain">${I.silver}+${fmt(r.silver)}</span><span class="gain">${I.dust}+${fmt(r.dust)}</span></div>
        ${r.buff ? '<p class="small" style="margin-top:10px;color:var(--fakla-300);font-weight:800">Győzelmi lendület: 1 napig +25% tapasztalat!</p>' : ''}
        ${r.item ? `<div class="detail" style="margin-top:12px;text-align:left">${itemHtml(r.item, { delta: true })}${r.itemResult && r.itemResult.salvaged ? '<p class="small muted" style="margin-top:6px">A táskád tele volt, ezért szétszedted.</p>' : ''}</div>` : ''}
        <button class="btn primary lg block" style="margin-top:16px" data-act="modal-close">Szuper!</button></div></div>`;
    }
    return '';
  }
  function owlHtml() {
    if (S.screen === 'kinezet') return ''; // a készítőben Bubó nem takarja ki a választást
    if (!S.owl || S.modal || (S.owlScreen && S.owlScreen !== S.screen)) return '';
    const text = D.OWL_TIPS[S.owl];
    if (!text) return '';
    const still = S.owlShown === S.owl ? ' still' : ''; S.owlShown = S.owl;
    return `<div class="owl${still}" role="note"><div class="bubble">${esc(text)}<div class="row"><button data-act="owl-ok">Értem</button></div></div>${A.OWL}</div>`;
  }
  function devbar() {
    if (!DEV) return '';
    return `<div class="devbar"><button data-act="dev" data-v="torch">+8 fáklya</button><button data-act="dev" data-v="level">+1 szint</button><button data-act="dev" data-v="dust">+1000 por</button><button data-act="dev" data-v="silver">+5000 ezüst</button><button data-act="dev" data-v="time">+3 óra</button><button data-act="dev" data-v="purple">lila tárgy</button><button data-act="dev" data-v="legend">legendás tárgy</button></div>`;
  }

  // ---------- karakterkészítő ----------
  function newCreator() {
    return { step: 1, name: '', people: 'holdtunde', classId: 'magus', look: A.defaultLook('magus'), outfitTouched: false, origin: 'arva', trait: 'kivancsi', motto: '', error: '' };
  }
  function renderCreator() {
    const c = S.creator || (S.creator = newCreator());
    const fake = { name: c.name || 'Hős', classId: c.classId, people: c.people, look: c.look };
    const k = D.CLASSES[c.classId];
    let body = '';
    if (c.step === 1) {
      const sw = (key, list) => `<div class="swatches">${list.map(([n, hex]) => `<button class="swatch" style="background:${hex}" data-act="c-look" data-k="${key}" data-v="${hex}" aria-label="${n}" aria-pressed="${c.look[key] === hex}"></button>`).join('')}</div>`;
      body = `<div class="field"><label for="c-name">A hősöd neve</label><div class="row"><input id="c-name" class="input" maxlength="16" value="${esc(c.name)}" placeholder="pl. Lumi" autocomplete="off"><button class="btn" data-act="c-random">Meglepetés</button></div>${c.error ? `<p class="small" style="color:var(--veszely-400);margin-top:6px;font-weight:800">${esc(c.error)}</p>` : ''}</div>
        <div class="field"><span class="label">Faj</span><div class="opt-grid">${D.PEOPLE_ORDER.map(id => `<button class="opt-card" data-act="c-set" data-k="people" data-v="${id}" aria-pressed="${c.people === id}"><b>${D.PEOPLES[id].name}</b><span>${esc(D.PEOPLES[id].note)}</span></button>`).join('')}</div></div>
        <div class="field"><span class="label">Frizura</span><div class="options">${Object.keys(A.HAIR_STYLES).map(id => `<button class="chip" data-act="c-look" data-k="hairStyle" data-v="${id}" aria-pressed="${c.look.hairStyle === id}">${A.HAIR_STYLES[id]}</button>`).join('')}</div></div>
        <div class="field"><span class="label">Hajszín</span>${sw('hair', D.HAIR_COLORS)}</div>
        <div class="field"><span class="label">Hajvég színe</span>${sw('tip', D.HAIR_COLORS)}</div>
        <div class="field"><span class="label">Szem</span><div class="options">${[['sotet', 'Sötét'], ['kek', 'Kék'], ['zold', 'Zöld'], ['arany', 'Arany'], ['tunde', 'Világító']].map(([id, n]) => `<button class="chip" data-act="c-look" data-k="eyes" data-v="${id}" aria-pressed="${c.look.eyes === id}"><span class="diff-dot" style="background:${A.EYE_COLORS[id]}"></span>${n}</button>`).join('')}</div></div>
        <div class="field"><span class="label">Jegy az arcon</span><div class="options">${Object.keys(A.MARKS).map(id => `<button class="chip" data-act="c-look" data-k="mark" data-v="${id}" aria-pressed="${c.look.mark === id}">${A.MARKS[id]}</button>`).join('')}</div></div>
        <div class="field"><span class="label">Ruha színe</span><div class="swatches">${A.OUTFITS.concat([A.CLASS_OUTFIT[c.classId]]).filter((v, i, a) => a.indexOf(v) === i).map(hex => `<button class="swatch" style="background:${hex}" data-act="c-look" data-k="outfit" data-v="${hex}" aria-label="Ruhaszín" aria-pressed="${c.look.outfit === hex}"></button>`).join('')}</div></div>`;
    } else if (c.step === 2) {
      body = `<div class="field"><span class="label">Honnan jött a hősöd?</span><div class="opt-grid">${D.ORIGIN_ORDER.map(id => `<button class="opt-card" data-act="c-set" data-k="origin" data-v="${id}" aria-pressed="${c.origin === id}"><b>${esc(D.ORIGINS[id].name)}</b><span>${esc(D.ORIGINS[id].line)}</span></button>`).join('')}</div></div>
        <div class="field"><span class="label">Jellem</span><div class="options">${D.TRAIT_ORDER.map(id => `<button class="chip" data-act="c-set" data-k="trait" data-v="${id}" aria-pressed="${c.trait === id}">${esc(D.TRAITS[id].name)}</button>`).join('')}</div>
          <p class="small muted" style="margin-top:8px">A jellem csak a hangulatot adja: így reagál a hősöd győzelemkor és vereségkor. Például: „${esc(D.TRAITS[c.trait].win)}”</p></div>
        <div class="field"><label for="c-motto">Jelmondat (nem kötelező)</label><input id="c-motto" class="input" maxlength="40" value="${esc(c.motto)}" placeholder="pl. Előbb ütök, aztán kérdezek."></div>`;
    } else {
      const diffCol = { 'könnyű': 'var(--jo-400)', 'közepes': 'var(--kozepes-400)', 'haladó': 'var(--veszely-400)' };
      body = `<div class="class-grid">${D.CLASS_ORDER.map(id => {
        const cc = D.CLASSES[id];
        return `<button class="class-card" data-act="c-class" data-v="${id}" aria-pressed="${c.classId === id}"><div class="portrait">${A.heroSvg({ name: cc.name, classId: id, people: c.people, look: Object.assign({}, c.look, { outfit: c.outfitTouched ? c.look.outfit : A.CLASS_OUTFIT[id] }) })}</div><b>${cc.name}</b><span><i class="diff-dot" style="background:${diffCol[cc.diff]}"></i>${cc.diff}</span></button>`;
      }).join('')}</div>
      <div class="detail class-detail"><div class="row between wrap"><h2>${k.name}</h2><span class="badge">${esc(k.role)} · ajánlott: ${D.TACTICS[k.tactic].name}</span></div>
        <p style="margin-top:6px">${esc(k.style)}</p>
        <div class="stats" style="grid-template-columns:repeat(4,1fr)">${['elet', 'tam', 'ved', 'fur'].map(s => `<div class="stat"><div><span>${STAT_NAMES[s]}</span><b>${k.base[s][0]}</b></div></div>`).join('')}</div>
        <div class="tiny" style="margin-top:12px">Képességek</div>
        <div style="margin-top:6px">${[k.basic].concat(k.skills).map((id, i) => `<div class="skill"><span class="num">${i === 0 ? '1.' : D.SKILL_LEVELS[i - 1] + '.'}</span>${skillIc(id)}<div><div class="sn">${esc(D.SKILLS[id].name)}</div><div class="sd">${esc(D.SKILLS[id].desc)}</div></div></div>`).join('')}</div>
        <p class="small muted" style="margin-top:10px">Ösvények a 15. szinttől: ${esc(k.paths)}</p></div>`;
    }
    const titles = ['Milyen a hősöd?', 'Ki a hősöd?', 'Válassz kasztot'];
    return `<div class="creator"><div class="creator-head"><div class="logo" style="justify-content:center">${A.LOGO}<span>Nyxoria</span></div><h1 style="margin-top:10px">${titles[c.step - 1]}</h1><p class="muted small">${c.step}. lépés / 3</p>
      <div class="progress3"><span class="${c.step >= 1 ? 'on' : ''}"></span><span class="${c.step >= 2 ? 'on' : ''}"></span><span class="${c.step >= 3 ? 'on' : ''}"></span></div></div>
      <div class="creator-grid"><div class="panel creator-preview"><div class="portrait">${A.heroSvg(fake)}</div><div><div class="hero-name">${esc(c.name || 'Névtelen hős')}</div><div class="hero-sub">${D.PEOPLES[c.people].name} ${k.name.toLowerCase()}</div>${c.step >= 2 ? `<p class="small muted" style="margin-top:6px">${esc(D.ORIGINS[c.origin].name)} · ${esc(D.TRAITS[c.trait].name)}</p>` : ''}</div></div>
      <div class="panel">${body}
        <div class="creator-nav">${c.step > 1 ? '<button class="btn" data-act="c-back">Vissza</button>' : '<span></span>'}${c.step < 3 ? '<button class="btn primary" data-act="c-next">Tovább</button>' : '<button class="btn fakla lg" data-act="c-done">Kész, indulhat a kaland!</button>'}</div>
      </div></div></div>`;
  }
  // ---------- új karakterkészítő (js/creator.js) ----------
  // A készítő a saját elemeit maga kezeli; a játék újrarajzolásakor ugyanazt a (félretett) elemet tesszük vissza,
  // így nem vész el se a forgatás, se a félkész választás.
  const NEW_CREATOR = !!(window.NYX.creator && A.isNew);
  function dropCreator() { if (S.cr) { try { S.cr.inst.destroy(); } catch (e) { /* már nincs a lapon */ } S.cr = null; } }
  function keepCreator(mode) {
    const ph = el('cr-ph'); if (!ph) return;
    if (S.cr && S.cr.mode === mode) { ph.replaceWith(S.cr.host); return; }
    dropCreator();
    const host = document.createElement('div'); host.className = 'creator-host'; ph.replaceWith(host);
    S.cr = { mode: mode, host: host, inst: window.NYX.creator.mount(host, mode === 'restyle' ? restyleOpts() : newHeroOpts()) };
  }
  // a régi szerver (és a régi kliens) is értse: a régi kinézet-mezők a lehető legközelebbi értékkel
  function legacyLook(L) {
    const back = L.hairBack, front = L.hairFront;
    const hairStyle = front === 'tuskes' || front === 'irokez' ? 'tuskes' : back === 'copf' || back === 'ketcopf' ? 'copf' : back === 'konty' ? 'konty' : back === 'hosszu' || back === 'hullamos' || back === 'vallig' ? 'hosszu' : 'rovid';
    const mark = { holdjel: 'holdjel', csillagok: 'csillag', forradas: 'heg', szeplok: 'szeplo' }[L.mark] || 'nincs';
    return { hairStyle: hairStyle, hair: L.hair, tip: L.tip || L.hair, eyes: L.eyeGlow ? 'tunde' : 'sotet', mark: mark, outfit: L.c1 };
  }
  // a félkész új hős újratöltés után is megmarad (csak ebben a böngészőlapban, mentés után törlődik)
  const DRAFT_KEY = 'nyx-hos-vazlat';
  function readDraft() {
    try {
      const d = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
      if (!d || typeof d !== 'object' || !D.CLASSES[d.classId]) return null;
      return { classId: d.classId, people: D.PEOPLES[d.people] ? d.people : 'holdtunde', look: G.cleanRig(d.look, d.classId), name: typeof d.name === 'string' ? d.name.slice(0, 16) : '',
        origin: D.ORIGINS[d.origin] ? d.origin : undefined, trait: D.TRAITS && D.TRAITS[d.trait] ? d.trait : undefined, motto: typeof d.motto === 'string' ? d.motto.slice(0, 80) : '' };
    } catch (e) { return null; }
  }
  function saveDraft() { if (S.cr && S.cr.mode === 'new') { try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(S.cr.inst.state())); } catch (e) { /* privát mód */ } } }
  function clearDraft() { try { sessionStorage.removeItem(DRAFT_KEY); } catch (e) { /* privát mód */ } }
  window.addEventListener('pagehide', saveDraft);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveDraft(); });
  function newHeroOpts() {
    const start = Object.assign(window.NYX.rig.defaultLook('magus'), { hairBack: 'hosszu', hairFront: 'oldal', ears: 'tunde', skin: '#d9def5', eyeGlow: true, cape: 'csillagos', mark: 'holdjel' });
    const dr = readDraft();
    return {
      mode: 'new', classId: dr ? dr.classId : 'magus', people: dr ? dr.people : 'holdtunde', look: dr ? dr.look : start, name: dr ? dr.name : '',
      origin: dr && dr.origin, trait: dr && dr.trait, motto: dr ? dr.motto : '',
      validName: G.validName, nameHint: ONLINE ? 'Legfeljebb 16 karakter. Ezen a néven látnak majd a többiek a harcokban és a ranglistán.' : 'Legfeljebb 16 karakter: betű, szám, szóköz vagy kötőjel.', nameRule: 'A név 2–16 karakter legyen: betűk, számok, szóköz vagy kötőjel.',
      onDone: async r => {
        if (S.busy) return;
        if (!G.validName((r.name || '').trim())) { const e = new Error('A név 2–16 karakter legyen: betűk, számok, szóköz vagy kötőjel.'); e.code = 'name'; throw e; }
        S.busy = true; document.body.classList.add('busy');
        try {
          await api(S.save ? 'heroNew' : 'create', { name: r.name.trim(), classId: r.classId, people: r.people || 'ember', look: legacyLook(r.look), rig: r.look, origin: r.origin, trait: r.trait, motto: r.motto });
          S.phase = 'game'; S.screen = 'kaland'; S.combat = null; S.modal = null; dropCreator(); clearDraft();
          if (ONLINE) await refreshState();
        } catch (e) {
          if (e && (e.code === 'name' || e.code === 'state')) throw e; // a készítő kiírja a név mellé
          handleError(e);
        } finally { S.busy = false; document.body.classList.remove('busy'); }
        render(); scrollTop();
      }
    };
  }
  function restyleOpts() {
    const h = hero();
    return {
      mode: 'restyle', classId: h.classId, people: h.people, look: G.migrateLook(h), name: h.name,
      onCancel: () => { if (!leaveOk()) return; S.screen = 'hos'; render(); scrollTop(); },
      onDone: async r => {
        if (S.busy) return;
        S.busy = true;
        try { await api('restyle', { rig: r.look }); S.screen = 'hos'; toast('Elmentve: új kinézet.'); }
        catch (e) { handleError(e); }
        finally { S.busy = false; }
        render(); scrollTop();
      }
    };
  }
  // átszabás közben a menüre kattintva nem vész el szó nélkül a munka: az első kattintás figyelmeztet, a második (5 mp-en belül) kilép
  function restyleDirty() {
    if (S.screen !== 'kinezet' || !S.cr || S.cr.mode !== 'restyle') return false;
    let a, b;
    try { a = G.cleanRig(S.cr.inst.state().look, hero().classId); b = G.migrateLook(hero()); } catch (e) { return false; }
    const keys = new Set(Object.keys(a).concat(Object.keys(b)));
    for (const k of keys) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) return true;
    return false;
  }
  function leaveOk() {
    if (!restyleDirty()) { S.leaveArmed = 0; return true; }
    if (S.leaveArmed && Date.now() - S.leaveArmed < 5000) { S.leaveArmed = 0; return true; }
    S.leaveArmed = Date.now();
    toast('Az új kinézet még nincs elmentve. Kattints újra, ha mentés nélkül lépsz tovább.');
    return false;
  }
  function renderNewCreator() {
    if (S.cr && S.cr.mode === 'new' && S.cr.host.isConnected) return; // már a lapon van
    app.innerHTML = `<div class="creator-shell"><div class="creator-head"><div class="logo" style="justify-content:center">${A.LOGO}<span>Nyxoria</span></div><h1 style="margin-top:10px">Rakd össze a hősödet</h1><p class="muted small">Húzd oldalra a hőst, és megfordul. Bármikor visszaléphetsz, és minden mozdulatod visszavonható.</p></div><div id="cr-ph"></div></div>`;
    keepCreator('new');
  }
  function syncCreatorInputs() {
    const c = S.creator; if (!c) return;
    const n = el('c-name'); if (n) c.name = n.value.trim();
    const m = el('c-motto'); if (m) c.motto = m.value.trim();
  }
  function scrollTop() { try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); } }

  // ---------- gombok ----------
  const actions = {
    screen(v) {
      if (S.combat) { toast('Előbb fejezd be a harcot.'); return; }
      if (v !== S.screen && !leaveOk()) return;
      if (S.phase === 'title') { markTitle(); S.phase = 'game'; }
      S.modal = S.modal && S.modal.type === 'info' ? null : S.modal;
      S.screen = v; S.confirmReset = false; if (v === 'ceh') S.guildData = null;
      if (ONLINE && (v === 'kozosseg' || v === 'boss')) loadRanks(v === 'boss' ? 'boss' : S.rankTab);
      render(); scrollTop();
    },
    tactic(v) { act('tactic', { v: v }); },
    moon(v) { act('moon', { v: v }); },
    start(v) { act('start', { diff: v }, () => scrollTop()); },
    card(v) { act('card', { i: +v }, res => { if (res.fight) startCombat('card', res.fight); }); },
    event(v) { act('event', { v: v }); },
    next() { act('next', {}, () => scrollTop()); },
    fight() { act('fight', {}, res => { startCombat('guard', res.fight); scrollTop(); }); },
    speed(v) {
      S.save.settings.speed = +v;
      if (S.combat && S.combat.stage) S.combat.stage.setRate(+v);
      const ctrl = el('cctrl');
      if (ctrl && S.combat) ctrl.innerHTML = combatCtrl(+v); else render();
      api('settings', { speed: +v }).catch(() => {});
    },
    skip() { skipCombat(); },
    'combat-done'() { combatDone(); },
    'gift-claim'() { act('gift', {}, r => { S.modal = r.levelUps && r.levelUps.length ? { type: 'level', ups: r.levelUps } : null; const b = [r.silver ? `+${fmt(r.silver)} Holdezüst` : '', r.dust ? `+${fmt(r.dust)} Csillagpor` : '', r.xp ? `+${fmt(r.xp)} TP` : '', r.item ? (r.salvaged ? `${r.item.name} (szétszedve)` : r.item.name) : ''].filter(Boolean).join(' · '); toast(`${r.day}. napi ajándék: ${b}`); }); },
    'shop-reroll'() { act('shopReroll', {}, () => toast('A kereskedő új árut pakolt ki.')); },
    'shop-buy'(v) { act('shopBuy', { i: +v }, r => toast(`Megvetted: ${r.item.name}`)); },
    'arena-find'() { act('arenaFind', {}); },
    'arena-fight'(v) { const c = (X.arenaState(S.save, now()).cands || [])[+v]; act('arenaFight', { i: +v }, r => { startCombat('arena', r.fight, { out: r.out, opp: c || r.out.opp, region: 'arnyromok', after: cc => { const o = cc.extra.out; toast(`${o.win ? 'Győzelem' : 'Vereség'} · ${o.delta >= 0 ? '+' : ''}${o.delta} pont (${o.rating}) · +${fmt(o.silver)} Holdezüst${o.dust ? ` · +${fmt(o.dust)} Csillagpor` : ''}`); } }); scrollTop(); }); },
    'team-find'() { S.teamPick = []; act('teamFind', {}); },
    'team-pick'(v) { const i = +v, p = S.teamPick || (S.teamPick = []), k = p.indexOf(i); if (k >= 0) p.splice(k, 1); else { if (p.length >= 2) p.shift(); p.push(i); } render(); },
    'team-go'() { const ids = (S.teamPick || []).slice(); act('teamFight', { ids: ids }, r => { S.teamPick = []; startCombat('team', r.fight, { out: r.out, region: r.out.region, after: cc => { const o = cc.extra.out; if (o.levelUps && o.levelUps.length) S.modal = { type: 'level', ups: o.levelUps }; toast(o.win ? `Győztetek! +${fmt(o.xp)} TP · +${fmt(o.silver)} Holdezüst · +${fmt(o.dust)} Csillagpor${o.item ? ' · ' + o.item.name : ''}` : (() => { const l = X.TEAM_RUNS - X.teamState(S.save, now()).runs; return l > 0 ? `Most nem sikerült. Ma még ${l} küldetésed van.` : 'Most nem sikerült. Mára elfogytak a küldetéseid, holnap újra próbálhatjátok.'; })()); } }); scrollTop(); }); },
    'guild-emblem'(v) { readGuildForm().emblem = v; render(); },
    'guild-create'() { const f = readGuildForm(); guildCall('guildCreate', f, 'Megvan a céhed!'); },
    'guild-join'(v) { guildCall('guildJoin', { id: +v }, 'Csatlakoztál!'); },
    'guild-leave'() { if (!S.leaveGuildArmed || Date.now() - S.leaveGuildArmed > 5000) { S.leaveGuildArmed = Date.now(); toast((S.guildData && S.guildData.owner) ? 'Biztosan kilépsz? A vezetést a legrégebbi tag kapja; ha nincs más tag, a céh megszűnik. Kattints újra.' : 'Biztosan kilépsz? Kattints újra a megerősítéshez.'); return; } S.leaveGuildArmed = 0; guildCall('guildLeave', {}, r => r.disbanded ? 'Kiléptél; a céh megszűnt.' : 'Kiléptél a céhből.'); },
    'guild-kick'(v) { if (S.kickArmed !== v) { S.kickArmed = v; toast('Biztosan elküldöd? Kattints újra a megerősítéshez.'); return; } S.kickArmed = null; guildCall('guildKick', { uid: v }, 'A tagot elküldted a céhből.'); },
    'go-paths'() { window.NYX.ui.actions.screen('hos'); setTimeout(() => { const el = document.querySelector('.nx-paths-h'); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 60); },
    'hero-new'() { S.screen = 'ujhos'; render(); scrollTop(); },
    'hero-switch'(v) { const x = heroList().filter(y => y.slot === +v)[0]; act('heroSwitch', { slot: +v }, async () => { S.combat = null; S.modal = null; S.screen = 'kaland'; if (ONLINE) await refreshState(); toast(`Most ${x ? x.name : 'a másik hősöd'} indul kalandra.`); }); },
    'hero-del-ask'(v) { S.delSlot = +v; render(); },
    'hero-del-no'() { S.delSlot = null; render(); },
    'hero-delete'(v) { const inp = el('del-name'), x = heroList().filter(y => y.slot === +v)[0]; if (!x || !inp || inp.value.trim().toLowerCase() !== x.name.toLowerCase()) { toast('A törléshez írd be pontosan a hős nevét.'); return; } act('heroDelete', { slot: +v, confirm: inp.value.trim() }, async () => { S.delSlot = null; if (ONLINE) await refreshState(); toast(`${x.name} törölve.`); }); },
    'notice-ok'() { try { localStorage.setItem('nyx-notice', String(S.notice.at)); } catch (e) { /* privát mód */ } render(); },
    'admin-tab'(v) { S.admin.tab = v; render(); },
    'admin-refresh'() { const t = S.admin ? S.admin.tab : 'attekintes', sel = S.admin && S.admin.sel; S.admin = { tab: t, q: S.admin && S.admin.q, sel: sel }; if (sel) actions['admin-open'](sel); else render(); },
    'admin-search'() { S.admin.q = (el('adm-q') || {}).value || ''; S.admin.players = null; render(); },
    'admin-open'(v) { const A2 = S.admin; if (A2.sel !== v) { A2.hslot = 0; A2.hd = null; A2.ib = null; } A2.sel = v; if (A2.tab !== 'jatekosok') { A2.tab = 'jatekosok'; } adminCall('player', { uid: v }, r => { A2.detail = r; }); render(); },
    'admin-hslot'(v) { S.admin.hslot = +v; S.admin.hd = null; render(); },
    'admin-sec'(v) { S.admin.sec = v; render(); },
    'admin-ib'() { const ib = S.admin.ib, g = id => el(id); if (!ib) return;
      ib.rarity = g('adm-irar').value; ib.slot = g('adm-islot').value; ib.level = +g('adm-ilvl').value || 1; ib.plus = +g('adm-iplus').value || 0; ib.name = g('adm-iname').value.trim(); ib.line = g('adm-iline').value.trim(); ib.mythic = g('adm-imyth').checked;
      ib.affixes = [0, 1, 2, 3].map(i => ({ id: g('adm-ia' + i).value, v: +g('adm-iv' + i).value || 0 })).filter(a => a.id);
      const pre = el('adm-ipre'); if (pre) pre.innerHTML = adminItemPreview(); },
    'admin-icreate'(v) { actions['admin-ib'](); const ib = S.admin.ib; if (ib.affixes.some(a => !a.v)) { toast('Adj értéket minden kiválasztott tulajdonságnak.'); return; }
      adminCall('itemCreate', { uid: v, hslot: S.admin.hslot || 0, item: { rarity: ib.rarity, slot: ib.slot, level: ib.level, plus: ib.plus, name: ib.name, line: ib.line, mythic: ib.mythic, affixes: ib.affixes.length ? ib.affixes : null } }, r => { toast(`Odaadva: ${r.item}`); S.admin.hd = null; }); },
    'admin-res'(v) { const val = id => Number((el(id) || {}).value) || 0, a = { uid: v, hslot: S.admin.hslot || 0, silver: val('adm-s'), dust: val('adm-d'), torches: val('adm-t'), rested: val('adm-r'), xp: val('adm-x'), note: (el('adm-n') || {}).value || '' };
      if (!a.silver && !a.dust && !a.torches && !a.rested && !a.xp) { toast('Nincs mit küldeni.'); return; }
      adminCall('resources', a, r => { toast(`Elküldve${r.levelUps ? ` · ${r.levelUps} szintlépés` : ''}.`); S.admin.hd = null; }); },
    'admin-quick'(v) { const hd = S.admin.hd && S.admin.hd.data; if (!hd) return; const a = { uid: S.admin.sel, hslot: S.admin.hslot || 0 };
      if (v === 'torch') a.torches = E.TORCH.max - hd.torches; if (v === 'rested') a.rested = E.TORCH.restedMax - hd.rested; if (v === 'level') a.xp = Math.max(1, hd.xpNeed - hd.xp);
      adminCall('resources', a, () => { toast('Kész.'); S.admin.hd = null; }); },
    'admin-iplus'(v) { const it = adminFindItem(v); if (!it) return; adminCall('itemEdit', { uid: S.admin.sel, hslot: S.admin.hslot || 0, itemId: v, plus: Math.min(12, (it.plus || 0) + 1) }, () => { S.admin.hd = null; }); },
    'admin-iminus'(v) { const it = adminFindItem(v); if (!it) return; adminCall('itemEdit', { uid: S.admin.sel, hslot: S.admin.hslot || 0, itemId: v, plus: Math.max(0, (it.plus || 0) - 1) }, () => { S.admin.hd = null; }); },
    'admin-idel'(v) { const it = adminFindItem(v); if (!it || !confirm(`Biztosan törlöd: ${it.name}? Nem vonható vissza.`)) return; adminCall('itemRemove', { uid: S.admin.sel, hslot: S.admin.hslot || 0, itemId: v }, () => { toast('Törölve.'); S.admin.hd = null; }); },
    'admin-heroset'(v) { const g = id => (el(id) || {}).value, hd = S.admin.hd.data, a = { uid: v, hslot: S.admin.hslot || 0 };
      if (+g('adm-hl') !== hd.level) a.level = +g('adm-hl'); if (+g('adm-ha') !== hd.arena) a.arena = +g('adm-ha'); if (+g('adm-ht') !== hd.towerBest) a.towerBest = +g('adm-ht');
      const pv = g('adm-hp'), pn = pv === '' ? null : +pv; if (pn !== (hd.path == null ? null : hd.path)) a.path = pn;
      if (Object.keys(a).length <= 2) { toast('Nincs változás.'); return; } adminCall('heroSet', a, () => { toast('Elmentve.'); S.admin.hd = null; S.admin.players = null; }); },
    'admin-reset'(v) { const what = [...document.querySelectorAll('.adm-rd:checked')].map(x => x.value); if (!what.length) { toast('Jelölj be legalább egyet.'); return; }
      adminCall('resetDaily', { uid: v, hslot: S.admin.hslot || 0, what: what }, r => { toast(`Visszaállítva: ${r.done.join(', ')}.`); S.admin.hd = null; }); },
    'admin-grant'(v) { const val = id => Number((el(id) || {}).value) || 0, ir = (el('adm-ir') || {}).value, is = (el('adm-is') || {}).value;
      const a = { uid: v, silver: val('adm-s'), dust: val('adm-d'), torches: val('adm-t'), item: ir ? { rarity: ir, slot: is || null } : null, note: (el('adm-n') || {}).value || '' };
      if (!a.silver && !a.dust && !a.torches && !a.item) { toast('Nincs mit küldeni.'); return; }
      if (!confirm('Biztosan elküldöd?')) return; adminCall('grant', a, r => { toast(`Elküldve${r.item ? ': ' + r.item : ''}.`); actions['admin-open'](v); }); },
    'admin-rename'(v) { const n = ((el('adm-rn') || {}).value || '').trim(); if (!n) return; adminCall('rename', { uid: v, newName: n }, () => { toast('Átnevezve.'); S.admin.players = null; actions['admin-open'](v); }); },
    'admin-ban'(v) { const r = ((el('adm-br') || {}).value || '').trim(); if (!confirm('Biztosan kitiltod?')) return; adminCall('ban', { uid: v, reason: r }, () => { toast('Kitiltva.'); S.admin.players = null; actions['admin-open'](v); }); },
    'admin-unban'(v) { adminCall('unban', { uid: v }, () => { toast('Visszaengedve.'); S.admin.players = null; actions['admin-open'](v); }); },
    'admin-setadmin'(v, e) { const on = (e && e.dataset && e.dataset.on) === '1' || (document.querySelector(`[data-act="admin-setadmin"][data-v="${v}"]`) || {}).dataset.on === '1'; if (!confirm(on ? 'Admin jogot adsz neki?' : 'Elveszed az admin jogát?')) return; adminCall('setAdmin', { uid: v, on: on }, () => { toast('Kész.'); actions['admin-open'](v); }); },
    'admin-notice'() { const t = ((el('adm-notice') || {}).value || '').trim(); adminCall('notice', { text: t, chronicle: !!(el('adm-notice-chr') || {}).checked, discord: !!(el('adm-notice-dc') || {}).checked }, () => toast(t ? 'Bejelentés elküldve.' : 'Bejelentés törölve.')); },
    'admin-giftall'() { const s = Number((el('adm-g-s') || {}).value) || 0, d = Number((el('adm-g-d') || {}).value) || 0, n = (el('adm-g-n') || {}).value || ''; if (!s && !d) { toast('Adj meg Holdezüstöt vagy Csillagport.'); return; } if (!confirm(`Minden játékos kap: ${s} Holdezüst, ${d} Csillagpor. Biztos?`)) return; adminCall('giftAll', { silver: s, dust: d, note: n }, r => toast(`Elküldve ${r.count} játékosnak.`)); },
    'admin-bossreset'() { if (!confirm('Biztosan újraindítod a heti szörnyet? Minden sebzés és láda törlődik.')) return; adminCall('bossReset', {}, () => { toast('Újraindítva.'); S.admin.world = null; }); },
    'admin-grename'(v) { const n = prompt('Új céhnév (3–24 karakter):'); if (!n) return; const t = prompt('Új céhjel (2–4 karakter):'); if (!t) return; adminCall('guildRename', { gid: +v, newName: n, tag: t }, () => { toast('Átnevezve.'); S.admin.world = null; }); },
    'admin-gdisband'(v) { if (!confirm('Biztosan feloszlatod ezt a céhet? Nem vonható vissza.')) return; adminCall('guildDisband', { gid: +v }, () => { toast('Feloszlatva.'); S.admin.world = null; }); },
    'legend-equip'(v) { S.modal = null; act('equip', { id: v }, () => toast('Felvetted. Jól áll!')); },
    'guild-war-claim'() { guildCall('guildWarClaim', {}, r => `Céhháborús jutalom: +${fmt(r.silver)} Holdezüst · +${fmt(r.dust)} Csillagpor`); },
    'path-pick'(v) { const p = D.PATHS[hero().classId][+v]; if (S.pathArmed !== v || Date.now() - (S.pathArmedAt || 0) > 8000) { S.pathArmed = v; S.pathArmedAt = Date.now(); toast(hero().path != null ? `Biztosan a(z) ${p.name} ösvényre váltasz? ${fmt(X.pathCost(hero()))} Holdezüstbe kerül. Kattints újra.` : `${p.name}: biztos? A későbbi váltás Holdezüstbe kerül. Kattints újra.`); return; } S.pathArmed = null; act('pathPick', { i: +v }, () => toast(`Új ösvényen jársz: ${p.name}`)); },
    'profile-open'(v) { S.profileView = null; const m = S.modal = { type: 'info', kind: 'profile' }; render(); remote('profile', { name: v }).then(r => { if (S.modal !== m) return; S.profileView = r.result; render(); }).catch(e => { if (S.modal === m) S.modal = null; handleError(e); render(); }); },
    'guild-claim'(v) { guildCall('guildClaim', { i: +v }, r => `+${fmt(r.silver)} Holdezüst · +${fmt(r.dust)} Csillagpor`); },
    'tower-rush'() { act('towerRush', {}, r => toast(r.to === r.from ? `${azN(r.lost)} ${r.lost}. emeleten elbuktál.` : `${r.from + 1}–${r.to}. emelet megvan${r.lost ? ` (${azN(r.lost)} ${r.lost}. emeleten elbuktál)` : ''}: +${fmt(r.silver)} Holdezüst · +${fmt(r.dust)} Csillagpor${r.items.length ? ' · ' + r.items.map(i => i.name).join(', ') : ''}`)); },
    'quest-claim'(v) { act('questClaim', { id: v }, r => { S.questDone = { text: r.done || 'Köszönöm!', silver: r.silver, dust: r.dust, xp: r.xp }; if (r.levelUps && r.levelUps.length) S.modal = { type: 'level', ups: r.levelUps }; render(); }); },
    'quest-drop'(v) { S.questDone = null; act('questDrop', { id: v }); },
    'help-open'() { if (D.HELP) { S.screen = 'sugo'; S.helpQ = ''; render(); scrollTop(); } else actions.info('sugo'); },
    'help-jump'(v, t) { const id = t && t.value; if (id) actions['help-go'](id); },
    'help-go'(v) { const el = document.getElementById('hp-' + v); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    'look-pick'(v, t) { act('lookPick', { slot: v, key: t ? t.value : 'auto' }); },
    'dye-pick'(v) { const [k, c] = String(v).split('|'); S.dyePend = Object.assign({}, S.dyePend, { [k]: c }); S.dyeOpen = true; render(); },
    dye(v) {
      if (v === 'clear') return act('dye', { clear: true });
      if (v === 'cancel') { S.dyePend = null; return render(); }
      const h = hero(); if ((h.dust || 0) < G.DYE_COST) return toast(`A festés ${G.DYE_COST} Csillagporba kerül.`);
      const p = S.dyePend || {}; S.dyePend = null; act('dye', { c1: p.c1, c2: p.c2 });
    },
    'try-on'(v) { S.tryOn = S.tryOn === v ? null : v; render(); },
    'story-choice'(v) { act('storyChoice', { v: v }); },
    'story-fight'() { S.storyRes = null; act('storyFight', {}, r => { const i = r.out.chapter - 1; startCombat('story', r.fight, { out: r.out, region: r.out.region, special: (X.storyChapters()[i] || { boss: {} }).boss.special, after: () => { S.storyRes = { i: i, win: r.out.win, out: r.out }; render(); scrollTop(); } }); scrollTop(); }); },
    'tower-fight'() { act('towerFight', {}, r => { startCombat('tower', r.fight, { out: r.out, region: r.out.region, after: afterChallenge('tower') }); scrollTop(); }); },
    'event-fight'() { act('eventFight', {}, r => { startCombat('event', r.fight, { out: r.out, region: r.out.region, after: afterChallenge('event') }); scrollTop(); }); },
    'event-claim'(v) { act('eventClaim', { i: +v }, r => toast(r.item ? `Átvetted: ${r.item.name}` : r.silver ? `+${fmt(r.silver)} Holdezüst` : `+${fmt(r.dust)} Csillagpor`)); },
    'ach-claim'(v) { act('achClaim', { id: v }, r => toast(`+${fmt(r.dust)} Csillagpor · +${fmt(r.silver)} Holdezüst${r.title ? ` · új cím: ${r.title}` : ''}`)); },
    choose(v) {
      act('choose', { i: +v }, info => {
        if (info.kind === 'item') toast(info.salvaged ? `A táska megtelt, a tárgyat szétszedted: +${info.dust} Csillagpor` : info.equipped ? `Felvetted: ${info.name}` : 'A tárgy a táskádba került.');
        else if (info.kind === 'silver') toast(`+${fmt(info.silver)} Holdezüst`);
        else if (info.kind === 'dust') toast(`+${fmt(info.dust)} Csillagpor`);
        else if (info.kind === 'xp') { toast(`+${fmt(info.xp)} tapasztalat`); if (info.levelUps && info.levelUps.length) S.modal = { type: 'level', ups: info.levelUps }; }
      });
    },
    camp() { act('camp', {}, () => { scrollTop(); if (ONLINE) refreshState().catch(() => {}); }); },
    retreat() { act('retreat', {}, res => { toast('Visszafordultál. Amit gyűjtöttél, megmaradt.'); if (res.levelUps && res.levelUps.length) S.modal = { type: 'level', ups: res.levelUps }; }); },
    slot(v) { S.slot = v; render(); },
    upgrade(v) { act('upgrade', { id: v }, r => toast(`Fejlesztve: +${r.plus}`)); },
    reroll(v) { act('reroll', { id: v }, () => toast('Új tárgyjellemzők!')); },
    'skill-move'(v, x) { act('skillMove', { i: +v, dir: +x.dataset.dir }); },
    equip(v) { const it = E.findItem(hero(), v); act('equip', { id: v }, () => it && toast('Felvetted: ' + it.name)); },
    salvage(v) { const it = hero().inventory.filter(x => x.id === v)[0]; if (it && (it.rarity === 'kek' || it.rarity === 'lila' || it.rarity === 'legendas' || it.mythic || it.plus) && !confirm(`Biztosan szétszeded? (${it.name || 'tárgy'}) +${fmt(Math.min(E.dustRoom(S.save, now()), E.salvageValue(it)) + E.refundValue(it))} Csillagpor`)) return; act('salvage', { id: v }, r => toast(`+${fmt(r.dust)} Csillagpor`)); },
    sell(v) { const it = hero().inventory.filter(x => x.id === v)[0]; if (it && (it.rarity === 'kek' || it.rarity === 'lila' || it.rarity === 'legendas' || it.mythic || it.plus) && !confirm(`Biztosan eladod? (${it.name || 'tárgy'}) +${fmt(E.sellValue(it))} Holdezüst${E.refundValue(it) ? ` és +${fmt(E.refundValue(it))} Csillagpor` : ''}`)) return; act('sell', { id: v }, r => toast(`+${fmt(r.silver)} Holdezüst`)); },
    'salvage-weak'() { act('salvageWeak', {}, r => toast(`+${r.dust} Csillagpor`)); },
    autosalvage(v, x) { act('settings', { autoSalvage: !!x.checked }); },
    patrol(v) { act('patrolStart', { hours: +v }, () => toast('Őrjáratra indultál!')); },
    'patrol-claim'() { act('patrolClaim', {}, r => { S.modal = { type: 'patrol', res: r }; if (r.levelUps && r.levelUps.length) S.pendingLevel = r.levelUps; }); },
    'boss-hit'() {
      if (!S.boss) return;
      act('bossHit', { bossId: S.boss.id }, r => { startCombat('boss', r.fight, r); scrollTop(); });
    },
    'boss-claim'(v, x) { act('bossClaim', { bossId: +x.dataset.boss, tier: +v }, r => { S.modal = { type: 'chest', res: r }; return refreshState(); }); },
    'ranks-open'(v) { S.rankTab = v; actions.screen('kozosseg'); },
    'rank-tab'(v) { S.rankTab = v; loadRanks(v); render(); },
    'chron-tab'(v) { S.chronTab = v; render(); },
    'modal-close'() { S.modal = null; if (S.pendingLevel) { S.modal = { type: 'level', ups: S.pendingLevel }; S.pendingLevel = null; } render(); },
    'owl-ok'() { const k = S.owl; S.owl = null; if (k) { S.save.seenTips[k] = true; api('tip', { v: k }).catch(() => {}); } render(); },
    'owl-toggle'() { act('settings', { owl: !S.save.settings.owl }); },
    'owl-reset'() { if (S.modal && S.modal.type === 'info') S.modal = null; act('settings', { owl: true, resetTips: true }, () => toast('Bubó újra elmondja a tippjeit.')); },
    export() { S.showExport = !S.showExport; render(); const b = el('export-box'); if (b) { b.focus(); b.select(); try { navigator.clipboard.writeText(b.value).then(() => toast('Kimásoltam a mentést. Illeszd be a másik gépen.'), () => {}); } catch (e) {} } },
    import() {
      const v = (el('import-box') || {}).value || '';
      try {
        const s = JSON.parse(decodeURIComponent(escape(atob(v.trim()))));
        if (!s || s.version !== 1 || !s.hero) throw new Error('rossz');
        if (s.hero.rig) s.hero.rig = G.cleanRig(s.hero.rig, s.hero.classId); // a beillesztett mentés kinézetét is ellenőrizzük
        S.save = s; S.combat = null; persist(); toast('Mentés betöltve!'); S.screen = 'kaland'; render();
      } catch (e) { toast('Ez nem érvényes Nyxoria-mentés.'); }
    },
    async login() {
      try {
        await S.sb.auth.signInWithOAuth({ provider: 'discord', options: { scopes: 'identify guilds', redirectTo: location.origin + location.pathname } });
      } catch (e) { S.loginError = 'Nem sikerült elindítani a belépést. Próbáld újra.'; render(); }
    },
    async logout() { try { if (S.sb) await S.sb.auth.signOut(); } catch (e) { /* már kint van */ } S.save = null; S.phase = ONLINE ? 'login' : 'creator'; S.loginError = ''; render(); },
    'admin-stats'() { remote('admin', { op: 'stats' }).then(r => { S.adminStats = r; render(); }).catch(handleError); },
    'admin-ban'(v) { const n = (el('admin-name') || {}).value; remote('admin', { op: v, name: n }).then(() => toast(v === 'ban' ? 'Felfüggesztve.' : 'Visszaengedve.')).catch(e => toast(e.message)); },
    dev(v) {
      const h = hero();
      if (v === 'torch') { S.save.torches.count = E.TORCH.max; S.save.torches.rested = Math.min(16, S.save.torches.rested + 8); }
      if (v === 'level') { const ups = E.addXp(h, E.xpNeeded(h.level) - h.xp); if (ups.length) S.modal = { type: 'level', ups: ups }; }
      if (v === 'dust') h.dust += 1000;
      if (v === 'silver') h.silver += 5000;
      if (v === 'time') S.save.devOffset = (S.save.devOffset || 0) + 3 * 3600 * 1000;
      if (v === 'purple') E.addItem(S.save, h, E.makeItem(E.mulberry32(E.newSeed()), { rarity: 'lila', level: h.level, classId: h.classId }), now());
      if (v === 'legend') { const it = E.makeItem(E.mulberry32(E.newSeed()), { rarity: 'legendas', level: h.level, classId: h.classId, hero: h }); E.addItem(S.save, h, it, now()); S.legendQueue = (S.legendQueue || []).concat([it]); }
      G.refreshOffers(S.save); persist(); render();
    },
    // karakterkészítő
    restyle() { S.screen = 'kinezet'; render(); scrollTop(); },
    info(v) { S.modal = { type: 'info', kind: v }; render(); },
    goto(v) { if (!leaveOk()) return; S.modal = null; gotoTarget(v); },
    'title-go'() { markTitle(); S.phase = 'game'; S.screen = 'kaland'; render(); scrollTop(); const g = el('nx-greet'); if (g) g.focus({ preventScroll: true }); },
    copy(v) { try { navigator.clipboard.writeText(v).then(() => toast('Kimásoltam: ' + v), () => toast('Jelöld ki és másold: ' + v)); } catch (e) { toast('Jelöld ki és másold: ' + v); } },
    'restyle-back'() { if (!leaveOk()) return; S.screen = 'hos'; render(); scrollTop(); },
    'c-set'(v, x) { // választáskor ne ugorjon az oldal a tetejére
      const y = window.scrollY; syncCreatorInputs(); S.creator[x.dataset.k] = v; render();
      window.scrollTo(0, y);
      const b = document.querySelector(`[data-act="c-set"][data-k="${x.dataset.k}"][data-v="${v}"]`); if (b) b.focus({ preventScroll: true });
    },
    'c-look'(v, x) { syncCreatorInputs(); S.creator.look[x.dataset.k] = v; if (x.dataset.k === 'outfit') S.creator.outfitTouched = true; render(); },
    'c-class'(v) { syncCreatorInputs(); const c = S.creator; c.classId = v; if (!c.outfitTouched) c.look.outfit = A.CLASS_OUTFIT[v]; render(); },
    'c-random'() {
      syncCreatorInputs();
      const c = S.creator, pickA = a => a[Math.floor(Math.random() * a.length)];
      c.name = pickA(NAMES); c.people = pickA(D.PEOPLE_ORDER);
      c.look.hairStyle = pickA(Object.keys(A.HAIR_STYLES)); c.look.hair = pickA(D.HAIR_COLORS)[1]; c.look.tip = pickA(D.HAIR_COLORS)[1];
      c.look.eyes = pickA(Object.keys(A.EYE_COLORS)); c.look.mark = pickA(Object.keys(A.MARKS));
      c.error = ''; render();
    },
    'c-next'() {
      syncCreatorInputs();
      const c = S.creator;
      if (c.step === 1 && !G.validName(c.name)) { c.error = 'A név 2–16 karakter legyen: betűk, számok, szóköz vagy kötőjel.'; render(); return; }
      c.error = ''; c.step++; render(); scrollTop();
    },
    'c-back'() { syncCreatorInputs(); S.creator.step--; render(); scrollTop(); },
    'c-done'() {
      syncCreatorInputs();
      const c = S.creator;
      act('create', { name: c.name, classId: c.classId, people: c.people, look: c.look, origin: c.origin, trait: c.trait, motto: c.motto }, async () => {
        S.creator = null; S.phase = 'game'; S.screen = 'kaland';
        if (ONLINE) await refreshState();
        scrollTop();
      }).then(() => {
        if (S.phase === 'creator' && S.creator) { // a szerver visszadobta (pl. foglalt név)
          S.creator.step = 1; render();
        }
      });
    }
  };
  function loadRanks(tab) {
    remote('ranks', { tab: tab }).then(r => { S.ranks[tab] = r.rows; if (!S.combat) render(); }).catch(() => {});
  }

  document.addEventListener('click', ev => {
    // a tájékoztató ablak a háttérre kattintva is bezárul (a szintlépés-ablak nem, azt el kell olvasni)
    if (ev.target.classList && ev.target.classList.contains('modal-back') && S.modal && S.modal.type === 'info') { actions['modal-close'](); return; }
    const t = ev.target.closest('[data-act]');
    if (!t || t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.disabled) return;
    const fn = actions[t.dataset.act];
    if (fn) { ev.preventDefault(); fn(t.dataset.v, t); }
  });
  document.addEventListener('change', ev => {
    const t = ev.target;
    if (t.matches && t.matches('input[data-act], select[data-act]')) { const fn = actions[t.dataset.act]; if (fn) fn(t.dataset.v, t); }
  });
  // súgó: keresés gépelés közben (a fókusz és a kurzor megmarad az újrarajzolás után)
  let helpT = 0;
  document.addEventListener('input', ev => {
    if (ev.target.id !== 'help-q') return;
    clearTimeout(helpT);
    helpT = setTimeout(() => { const v = ev.target.value, pos = ev.target.selectionStart; S.helpQ = v; render(); const n = el('help-q'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* régi böngésző */ } } }, 160);
  });
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' && ev.target.id === 'c-name') actions['c-next']();
    if (ev.key === 'Escape' && S.modal) actions['modal-close']();
  });

  // óra: fáklyák, őrjárat; online módban percenként frissül a boss és a krónika
  let tick = 0;
  setInterval(() => {
    if (S.phase !== 'game' || !S.save) return;
    tick++;
    const before = S.save.torches.count + ':' + S.save.torches.rested;
    const t = E.torchState(S.save, now());
    const patrolDone = S.save.patrol && S.save.patrol.end <= now() && !S.patrolNotified;
    if (patrolDone) S.patrolNotified = true;
    if (!S.combat && !S.busy && !S.modal && (before !== t.count + ':' + t.rested || patrolDone)) { persist(); render(); }
    document.querySelectorAll('[data-torch-timer]').forEach(n => { n.textContent = timeLeft(t.nextIn); });
    if (S.save.patrol) document.querySelectorAll('[data-patrol-left]').forEach(n => { n.textContent = timeLeft(S.save.patrol.end - now()); });
    if (ONLINE && tick % 3 === 0 && !S.combat && !S.busy && !S.modal && document.visibilityState === 'visible') {
      refreshState().then(() => { if (!S.combat && !S.busy) render(); }).catch(() => {});
    }
  }, 20000);

  // ---------- indulás ----------
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  async function enterGame() {
    try {
      await refreshState();
      S.phase = S.save ? (NEW_SHELL && !titleSeen() ? 'title' : 'game') : 'creator';
    } catch (e) {
      if (e.code === 'verify' || e.status === 401) { S.phase = 'login'; S.loginError = e.code === 'verify' ? 'Jelentkezz be újra, hogy ellenőrizni tudjuk a Nyxoria-tagságodat.' : e.message; }
      else if (e.code === 'banned') { S.phase = 'error'; S.loginError = e.message; }
      else { S.phase = 'error'; S.loginError = e.message; }
    }
    render();
  }
  async function verifyAndEnter(session) {
    try {
      const v = await remote('verify', { providerToken: session ? session.provider_token : '' });
      if (!v.ok) { S.phase = 'login'; S.loginError = v.error; if (S.sb) await S.sb.auth.signOut(); render(); return; }
    } catch (e) { handleError(e); render(); return; }
    await enterGame();
  }
  async function boot() {
    if (!ONLINE) {
      S.save = loadLocal();
      if (S.save) { G.refreshOffers(S.save); if (S.save.expedition && S.save.expedition.phase === 'cardFight') S.save.expedition.phase = 'cardResult'; }
      S.phase = S.save ? (NEW_SHELL && !titleSeen() ? 'title' : 'game') : 'creator';
      render(); return;
    }
    if (TEST_TOKEN) { await verifyAndEnter(null); return; }
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.99.3/dist/umd/supabase.js');
    } catch (e) { S.phase = 'error'; S.loginError = 'Nem sikerült betölteni a belépéshez szükséges részt. Ellenőrizd az internetet.'; render(); return; }
    S.sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } });
    let handled = false;
    S.sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session && session.provider_token && !handled) {
        handled = true;
        history.replaceState(null, '', location.pathname);
        setTimeout(() => verifyAndEnter(session), 0);
      }
    });
    const { data } = await S.sb.auth.getSession();
    if (handled) return;
    if (!data.session) { S.phase = 'login'; render(); return; }
    await enterGame();
  }

  render();
  boot();
  NYX.ui = { S: S, render: render, actions: actions, _startCombat: startCombat };
})();
