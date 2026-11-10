/* Nyxoria RPG – karakterkészítő (forgatható hős, csempék, előnézet, visszavonás).
   A stilus.html bemutatójából átvéve, újrahasználható modulként: NYX.creator.mount(hely, beállítások).
   beállítások: { mode: 'new' | 'restyle', classId, people, look, name, origin, trait, motto,
                  onDone(eredmény) → Promise (hibánál { code, message }), onCancel(), onChange(állapot) } */
(function (root) {
  'use strict';
  const D = root.NYX.data, R = root.NYX.rig, SC = root.NYX.scenes, V = root.NYX.vfx;
  function mount(HOST, O) {
  O = O || {};
  const $ = s => HOST.querySelector(s);
  const CLS = D.CLASS_ORDER;
  const PEOPLE = D.PEOPLE_LOOK;
  let seed = Date.now() % 100000;
  const rnd = () => { seed = (seed * 16807 + 11) % 2147483647; return seed / 2147483647; };
  const AC = new AbortController();
  let RO = null;
  HOST.classList.add('nxc');
  HOST.innerHTML = '<div class="nxc-creator" id="creator"><div class="c-stage" id="cstage"></div><div class="nxc-panel c-panel" id="cpanel"></div></div><div class="nxc-toast" id="ctoast" role="status" aria-live="polite"></div>';
  // ---------- karakterkészítő ----------
  const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const C = {
    classId: O.classId || 'magus', people: O.people || null, scene: O.scene || 'holdfeny', name: O.name || '', step: 'alap', yaw: 0, zoom: 'full', preview: null, seen: new Set(['alap']),
    look: Object.assign(R.defaultLook(O.classId || 'magus'), O.look || {}),
    origin: O.origin || 'arva', trait: O.trait || 'kivancsi', motto: O.motto || '', locks: new Set(), ideas: null
  };
  const RESTYLE = O.mode === 'restyle';
  if (window.NYX) window.NYX.creatorDebug = () => JSON.parse(JSON.stringify({ look: C.look, people: C.people, name: C.name, classId: C.classId, locks: [...C.locks] }));
  const NAME_HINT = O.nameHint || 'Legfeljebb 16 karakter: betű, szám, szóköz vagy kötőjel.';
  const HIST = { undo: [], redo: [] };

  // ikonok (24×24, vonalas)
  const IC = {
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    unlock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    dice: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><g fill="currentColor" stroke="none"><circle cx="8.3" cy="8.3" r="1.5"/><circle cx="15.7" cy="8.3" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="8.3" cy="15.7" r="1.5"/><circle cx="15.7" cy="15.7" r="1.5"/></g>',
    reset: '<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6l-2.5 2.5"/><path d="M3.5 3.5v5h5"/>',
    scene: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m3 17 5.5-5.5 4 4 2.5-2.5L21 19"/><circle cx="16" cy="9" r="1.8"/>',
    rotL: '<path d="M16.5 7.3C19.2 8.2 21 9.6 21 11.3c0 2.9-4 5.2-9 5.2s-9-2.3-9-5.2c0-1.4 1-2.7 2.6-3.6"/><path d="m2.6 5.2 3 2.7-3.4 1.9"/>',
    rotR: '<path d="M7.5 7.3C4.8 8.2 3 9.6 3 11.3c0 2.9 4 5.2 9 5.2s9-2.3 9-5.2c0-1.4-1-2.7-2.6-3.6"/><path d="m21.4 5.2-3 2.7 3.4 1.9"/>',
    spin: '<path d="M20.5 12a8.5 8.5 0 1 1-2.5-6l2.5 2.5"/><path d="M20.5 3.5v5h-5"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/>',
    zFull: '<circle cx="12" cy="4.6" r="2.4"/><path d="M12 7.6v7.2M7.6 10.6h8.8M12 14.8l-3 6.4M12 14.8l3 6.4"/>',
    zUpper: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.6 4.3-7.2 8-7.2s7 2.6 8 7.2"/>',
    zFace: '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="10.5" r="1.1" fill="currentColor" stroke="none"/><path d="M9 15c1.7 1.3 4.3 1.3 6 0"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    left: '<path d="m15 5-7 7 7 7"/>', right: '<path d="m9 5 7 7-7 7"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    alap: '<circle cx="12" cy="6.5" r="3.5"/><path d="M5 21v-2.5A5.5 5.5 0 0 1 10.5 13h3a5.5 5.5 0 0 1 5.5 5.5V21"/>',
    arc: '<path d="M12 3c4.4 0 7.5 3.4 7.5 8.2 0 5.4-3.6 9.8-7.5 9.8s-7.5-4.4-7.5-9.8C4.5 6.4 7.6 3 12 3z"/><path d="M8.6 11.2h1.6M13.8 11.2h1.6M10 16c1.3.9 2.7.9 4 0"/>',
    haj: '<path d="M5 21c-.6-9.5 1.6-17 7-17s7.6 7.5 7 17"/><path d="M8.5 21c0-6 .8-9.8 3.5-11.6M15.5 21c0-6-.8-9.8-3.5-11.6"/><path d="M7.5 9c2.3.7 6.7.7 9 0"/>',
    fej: '<path d="M4 18h16l1.2-10.5-5.2 4L12 4.5 8 11.5l-5.2-4z"/><path d="M4 21h16"/>',
    ruha: '<path d="M8.5 3 3 6.2l2.2 5 2.8-1.1V21h8V10.1l2.8 1.1 2.2-5L15.5 3c-.6 1.8-1.9 3-3.5 3S9.1 4.8 8.5 3z"/>',
    fegyver: '<path d="M19.5 3.5 9 14"/><path d="M19.5 3.5h-4.2M19.5 3.5v4.2"/><path d="m6 12 6 6"/><path d="m3.5 20.5 4-4"/>',
    varazs: '<path d="M11 3c.6 4.4 2.4 6.2 6.8 6.8-4.4.6-6.2 2.4-6.8 6.8-.6-4.4-2.4-6.2-6.8-6.8C8.6 9.2 10.4 7.4 11 3z"/><path d="M18.5 14.5v5M16 17h5"/>',
    nev: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'
  };
  const icon = n => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[n]}</svg>`;

  const STEPS = [
    { id: 'alap', name: 'Alap', desc: RESTYLE ? 'Nem, testalkat, bőrszín és farok. A kaszt és a faj nem változik.' : 'Nem, kaszt, faj, testalkat és farok. Ezzel kezdődik minden.', zoom: 'full', keys: ['sex', 'body', 'height', 'skin', 'tail'],
      groups: RESTYLE ? [['ideas'], ['sex'], ['opt', 'body'], ['opt', 'height'], ['color', 'skin'], ['opt', 'tail']] : [['sex'], ['class'], ['ideas'], ['people'], ['opt', 'body'], ['opt', 'height'], ['color', 'skin'], ['opt', 'tail']] },
    { id: 'arc', name: 'Arc', desc: 'Arcforma, szemek és az, hogy milyen képet vág a hősöd.', zoom: 'face', keys: ['face', 'eyeShape', 'eye', 'eye2', 'eyeGlow', 'brows', 'nose', 'mouth', 'mark'],
      groups: [['opt', 'face'], ['opt', 'eyeShape'], ['color', 'eye'], ['color', 'eye2', true], ['toggle', 'eyeGlow'], ['opt', 'brows'], ['opt', 'nose'], ['opt', 'mouth'], ['opt', 'mark']] },
    { id: 'haj', name: 'Haj', desc: 'Válassz frizurát és hajszínt. A haj végét külön is átszínezheted.', zoom: 'upper', keys: ['hairFront', 'hairBack', 'hair', 'tip', 'beard'],
      groups: [['opt', 'hairStyle'], ['color', 'hair'], ['color', 'tip', true], ['opt', 'beard']] },
    { id: 'fej', name: 'Fej', desc: 'Fül, szarv és ékszerek: ettől lesz igazán egyedi.', zoom: 'face', keys: ['ears', 'horns', 'hornColor', 'headwear', 'earring'],
      groups: [['opt', 'ears'], ['opt', 'horns'], ['color', 'hornColor'], ['opt', 'headwear'], ['opt', 'earring']] },
    { id: 'ruha', name: 'Öltözet', desc: 'A ruhád szabása végig a tiéd marad. A színét, a díszeit és a köpenyt később a felvett páncél adja: minél ritkább, annál díszesebb. Ezeket a színeket a Ruhatárban bármikor visszaveheted.', zoom: 'full', keys: ['outfit', 'c1', 'c2', 'metal', 'cape'],
      groups: [['opt', 'outfit'], ['color', 'c1'], ['color', 'c2'], ['metal'], ['opt', 'cape']] },
    { id: 'fegyver', name: 'Fegyver', desc: 'A kedvenc fegyvered: ez marad a kezedben végig. A ritkább fegyverek ugyanezt a fegyvert díszítik fel: a lila halványan izzik, a legendás aranyban ragyog.', zoom: 'full', keys: ['weapon'],
      groups: [['opt', 'weapon']] },
    RESTYLE ? { id: 'nev', name: 'Összegzés', desc: 'Nézd át, mit raktál össze, és mentsd el.', zoom: 'full', keys: [], groups: [['summary']] }
      : { id: 'nev', name: 'Név', desc: 'Adj nevet a hősödnek, mondd el, honnan jött, és nézd át, mit raktál össze.', zoom: 'full', keys: [], groups: [['name'], ['story'], ['summary']] }
  ];
  const STEP = {}; STEPS.forEach((s, i) => { s.i = i; STEP[s.id] = s; });

  // bélyegképek: melyik csoport hogyan mutassa a hőst (fej / egész alak, kivágás, nézőszög)
  const VB_HEAD = '66 -28 188 214', VB_EYES = '102 88 116 66', VB_LOW = '106 108 108 72', VB_FULL = '6 -40 308 480';
  const TH = {
    sex: { head: true, vb: '76 2 168 178' }, people: { head: true, vb: '76 2 168 178' }, class: { vb: VB_FULL }, body: { vb: VB_FULL }, height: { vb: VB_FULL },
    face: { head: true, vb: '82 30 156 158', bare: true }, eyeShape: { head: true, vb: VB_EYES, bare: true }, brows: { head: true, vb: VB_EYES, bare: true },
    nose: { head: true, vb: VB_LOW, bare: true }, mouth: { head: true, vb: VB_LOW, bare: true }, mark: { head: true, vb: '88 50 144 136', bare: true },
    hairStyle: { head: true, vb: '66 -4 188 222', yaw: 28, bare: true }, beard: { head: true, vb: '88 62 144 136', bare: true },
    ears: { head: true, vb: VB_HEAD, bare: true }, horns: { head: true, vb: VB_HEAD, bare: true }, headwear: { head: true, vb: VB_HEAD }, earring: { head: true, vb: '80 66 160 134', yaw: -38, bare: true },
    outfit: { vb: '40 60 240 380' }, cape: { vb: VB_FULL, yaw: 150 }, weapon: { vb: VB_FULL }, wings: { vb: VB_FULL, yaw: 165 }, tail: { vb: VB_FULL, yaw: 125 }, aura: { vb: VB_FULL },
    _me: { head: true, vb: '76 0 168 186' }
  };
  const FULL_KEYS = ['class', 'body', 'height', 'outfit', 'cape', 'weapon', 'wings', 'tail', 'aura'];
  const ratio = vb => { const p = vb.split(' ').map(Number); return `${p[2]} / ${p[3]}`; };
  const FEMALE = ['Lumi', 'Szirom', 'Ködvirág', 'Zsálya', 'Éjke', 'Holdvirág', 'Bodza', 'Vadóc', 'Rezeda', 'Harmat', 'Ilka', 'Liliom', 'Csillagszem', 'Szellő', 'Mirtill', 'Hajnal', 'Ezüstke', 'Nádja', 'Ibolya', 'Lenke'];
  const MALE = ['Nox', 'Ében', 'Hollós', 'Tüske', 'Vadon', 'Kord', 'Dorian', 'Zord', 'Örs', 'Kelen', 'Bátor', 'Vazul', 'Sólyom', 'Darvas', 'Farkas', 'Torda', 'Kopján', 'Ármin', 'Bodor', 'Szilaj'];
  const FACE_HIDERS = ['szemkoto', 'sisak', 'csuklya'];

  function comboCount() {
    let n = 1;
    Object.keys(R.OPTIONS).forEach(k => { if (k !== 'outfit' && k !== 'weapon') n *= Object.keys(R.OPTIONS[k].items).length; });
    n *= 2 * 3; // öltözet és fegyver kasztonként
    n *= R.SKIN.length * R.HAIR.length * (R.HAIR.length + 1) * R.EYES.length * (R.EYES.length + 1) * 2 * R.CLOTH.length * R.CLOTH.length * Object.keys(R.METAL).length * R.HORN_COLORS.length * CLS.length;
    return n;
  }
  function bigNum(n) {
    const units = [[1e33, 'kvintilliárd'], [1e30, 'kvintillió'], [1e27, 'kvadrilliárd'], [1e24, 'kvadrillió'], [1e21, 'trilliárd'], [1e18, 'trillió'], [1e15, 'billiárd'], [1e12, 'billió'], [1e9, 'milliárd'], [1e6, 'millió']];
    for (const [v, w] of units) if (n >= v) return `${Math.floor(n / v).toLocaleString('hu-HU')} ${w}`;
    return Math.round(n).toLocaleString('hu-HU');
  }
  function heroObj() { return { name: C.name, classId: C.classId, rig: C.look, people: C.people }; }
  const pick = a => a[Math.floor(rnd() * a.length)];
  const norm = y => ((y % 360) + 540) % 360 - 180;            // (−180, 180]
  const quant = y => { const q = Math.round(norm(y) / 4) * 4; return q === -180 ? 180 : q; };
  const optName = (k, v) => (R.OPTIONS[k] && R.OPTIONS[k].items[v]) || '';
  function colorName(key, hex) {
    if (!hex) return key === 'tip' ? 'Egyszínű' : key === 'eye2' ? 'Egyforma' : 'Nincs';
    const hit = R.COLOR_SLOTS[key][1].filter(c => c[1].toLowerCase() === String(hex).toLowerCase())[0];
    return hit ? hit[0] : 'Saját szín';
  }
  function valueName(k, L, cls) {
    L = L || C.look; cls = cls || C.classId;
    if (k === 'outfit') return R.OUTFIT_NAMES[cls][+L.outfit];
    if (k === 'weapon') return R.WEAPON_NAMES[cls][+L.weapon];
    if (k === 'metal') return R.METAL[L.metal] ? R.METAL[L.metal][0] : '';
    if (k === 'eyeGlow') return L.eyeGlow ? 'Bekapcsolva' : 'Kikapcsolva';
    if (R.COLOR_SLOTS[k]) return colorName(k, L[k]);
    if (k === 'class') return D.CLASSES[cls].name;
    if (k === 'hairStyle') return optName('hairStyle', R.hairStyleOf(L)) || 'Egyedi';
    if (k === 'people') return C.people ? D.PEOPLES[C.people].name : 'Egyedi';
    return optName(k, L[k]);
  }
  function classLook(L, cls) { const def = R.defaultLook(cls); return Object.assign({}, L, { c1: def.c1, c2: def.c2, metal: def.metal, outfit: 0, weapon: 0 }); }
  // egy lehetőség „kipróbálva”: a jelenlegi hős, csak ez az egy dolog más
  function variant(key, v) {
    let cls = C.classId, L = Object.assign({}, C.look), people = C.people;
    if (key === 'class') { cls = v; L = classLook(L, v); }
    else if (key === 'people') { Object.assign(L, PEOPLE[v]); people = v; }
    else if (key === 'sex') { L.sex = v; if (v === 'no') L.beard = 'nincs'; }
    else if (key === 'metal') L.metal = v;
    else if (key === 'eyeGlow') L.eyeGlow = !!v;
    else if (key === 'hairStyle') R.applyHairStyle(L, v);
    else if (key === '_me') { /* a jelenlegi */ }
    else if (R.COLOR_SLOTS[key]) L[key] = v || null;
    else L[key] = /^\d+$/.test(v) ? +v : v;
    return { cls, look: L, people };
  }
  // a szárnyat és az aurát a ritka tárgyakból lehet kiérdemelni, ezért a készítő (és a Meglepetés) nem ad ilyet
  function tidy(L) { if (FACE_HIDERS.indexOf(L.headwear) >= 0) L.headwear = 'nincs'; if (L.mark === 'harcifestek') L.mark = 'nincs'; if (!RESTYLE) { L.aura = 'nincs'; L.wings = 'nincs'; } else if (typeof C !== 'undefined' && C && C.look) { L.aura = C.look.aura; L.wings = C.look.wings; } return L; }
  function randomName(sex, avoid) { const list = sex === 'ferfi' ? MALE : FEMALE; let n; do n = pick(list); while (n === avoid && list.length > 1); return n; }

  // ---------- előzmények ----------
  const snap = () => ({ classId: C.classId, look: Object.assign({}, C.look), name: C.name, people: C.people });
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function commit(fn, opts) {
    const before = snap();
    fn();
    if (same(before, snap())) { if (C.preview) { C.preview = null; scheduleFigure(); updateNote(); } return false; }
    HIST.undo.push(before); if (HIST.undo.length > 80) HIST.undo.shift();
    HIST.redo.length = 0;
    changed(before, opts || {});
    return true;
  }
  function restore(s) { C.classId = s.classId; C.look = Object.assign({}, s.look); C.name = s.name; C.people = s.people; }
  function undo() { if (!HIST.undo.length) return; const before = snap(); HIST.redo.push(before); restore(HIST.undo.pop()); changed(before, {}); }
  function redo() { if (!HIST.redo.length) return; const before = snap(); HIST.undo.push(before); restore(HIST.redo.pop()); changed(before, {}); }
  function changed(before, opts) {
    C.preview = null;
    if (!opts.noPop) wantPop = true;
    scheduleFigure(); updateStageText(); updateNote(); syncPanel(); updateHistory(); applyZoom();
    if (O.onChange) O.onChange(snap());
  }
  function updateHistory() {
    const u = $('#cundo'), r = $('#credo');
    u.disabled = !HIST.undo.length; r.disabled = !HIST.redo.length;
  }

  // ---------- színpad ----------
  const VIEWS = [['front', 'Szemből', 0], ['back', 'Hátulról', 180]];
  const ZOOMS = { full: ['Egész alak', 'zFull'], upper: ['Felsőtest', 'zUpper'], face: ['Arc', 'zFace'] };
  const POSES = [['attack', 'Támadás'], ['cast', 'Varázslat'], ['hit', 'Találat'], ['dodge', 'Kitérés'], ['victory', 'Győzelem']];
  function initStage() {
    const ticks = [0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = a * Math.PI / 180; return `<circle class="tick" cx="${(100 * Math.sin(r)).toFixed(1)}" cy="${(22 * Math.cos(r)).toFixed(1)}" r="${a % 90 ? 1.6 : 2.4}"/>`; }).join('');
    $('#cstage').innerHTML =
      `<div class="c-view" id="cview">
        <div class="scene-wrap" id="cscene"></div><div class="halo"></div><div class="vignette"></div>
        <div class="cam" id="ccam"><div class="fig-box" id="cfigbox"><div class="floor"></div><svg class="ring" viewBox="-110 -30 220 60" aria-hidden="true"><ellipse class="rim" rx="100" ry="22"/>${ticks}<circle class="mk" id="cmark" r="4.5" cx="0" cy="22"/></svg><div id="cfig"></div></div></div>
        <div class="drag" id="cdrag" role="button" tabindex="0" aria-label="A hős megfordítása. Húzd oldalra, vagy nyomd meg az Entert." aria-pressed="false"></div>
        <div class="hud-top">
          <div class="glass id-card"><div class="c-name" id="cnm"></div><div class="sub" id="csub"></div><div class="combo" id="ccombo"></div></div>
          <div class="tools">
            <button class="ibtn" id="cundo" data-act="undo" title="Visszavonás (Ctrl+Z)" aria-label="Visszavonás" disabled>${icon('undo')}</button>
            <button class="ibtn" id="credo" data-act="redo" title="Újra (Ctrl+Y)" aria-label="Újra" disabled>${icon('redo')}</button>
            <span class="sep"></span>
            <button class="ibtn accent" data-act="random" title="Teljesen véletlen hős (a kaszt marad)" aria-label="Meglepetés: véletlen hős">${icon('dice')}<span class="lbl">Meglepetés</span></button>
            <button class="ibtn" data-act="reset" title="Alaphelyzet: a kaszt alap kinézete" aria-label="Alaphelyzet">${icon('reset')}</button>
            <button class="ibtn" id="cbgbtn" data-act="bg" title="Háttér választása" aria-label="Háttér választása" aria-haspopup="true" aria-expanded="false" aria-controls="cbgpop">${icon('scene')}</button>
          </div>
        </div>
        <div class="bg-pop" id="cbgpop" hidden role="group" aria-label="Háttér"><div class="t">Háttér</div>${Object.keys(SC.SC).map(k => `<button data-scene="${k}" aria-pressed="false"><span class="im"><img alt="" data-sc="${k}"></span>${SC.SC[k].name}</button>`).join('')}</div>
        <div class="zoom-rail" role="group" aria-label="Közelítés">${Object.keys(ZOOMS).map(k => `<button class="ibtn" data-zoom="${k}" aria-pressed="false" title="${ZOOMS[k][0]}" aria-label="Közelítés: ${ZOOMS[k][0]}">${icon(ZOOMS[k][1])}<span class="lbl">${ZOOMS[k][0]}</span></button>`).join('')}</div>
        <div class="stage-note" id="cnote" aria-hidden="true"></div>
        <div class="rot-bar" role="group" aria-label="Nézőpont">
          ${VIEWS.map(([k, l]) => `<button data-view="${k}" aria-pressed="false">${l}</button>`).join('')}
        </div>
      </div>
      <div class="c-tools" id="ctools">
        <span class="lbl">Próbáld ki</span>${POSES.map(([k, l]) => `<button class="tbtn" data-pose="${k}">${l}</button>`).join('')}
      </div>`;
    renderScene();
  }
  function renderScene() {
    const cs = $('#cscene').getBoundingClientRect(); $('#cscene').innerHTML = SC.scene(C.scene, { seed: 4, moonX: cs.width / Math.max(1, cs.height) < 1.1 ? 780 : 960, narrow: cs.width / Math.max(1, cs.height) < 1.1 });
    document.querySelectorAll('#cbgpop [data-scene]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.scene === C.scene)));
  }
  function updateStageText() {
    $('#cnm').textContent = C.name || 'Névtelen hős';
    $('#csub').textContent = `${D.CLASSES[C.classId].name} · ${C.people ? D.PEOPLES[C.people].name : 'Egyedi faj'} · ${optName('sex', C.look.sex)}`;
    $('#ccombo').innerHTML = `<b>Rengeteg</b> kinézet`;
  }
  let hintOn = true;
  try { hintOn = localStorage.getItem('nyx-forgatas') !== '1'; } catch (e) { /* privát mód */ }
  function hideHint() { if (!hintOn) return; hintOn = false; try { localStorage.setItem('nyx-forgatas', '1'); } catch (e) { /* mindegy */ } updateNote(); }
  let pvLabel = '';
  function updateNote() {
    const n = $('#cnote'); if (!n) return;
    if (C.preview) { n.textContent = 'Előnézet: ' + pvLabel; n.className = 'stage-note pv'; n.hidden = false; }
    else if (hintOn) { n.textContent = '↔ Húzd oldalra, és megfordul'; n.className = 'stage-note'; n.hidden = false; }
    else n.hidden = true;
  }

  // a nagy figura: csak akkor rajzoljuk újra, ha tényleg más lett (kinézet vagy 4°-ra kerekített szög)
  let figKey = '', figRaf = 0, figTimer = 0, wantPop = false, poseUntil = 0, focusKey = '';
  const FOCUS = { fy: 0.27 };
  function shown() { return C.preview || { cls: C.classId, look: C.look }; }
  function scheduleFigure() { if (!figRaf) figRaf = requestAnimationFrame(() => { figRaf = 0; renderFigureNow(); }); }
  function renderFigureNow() {
    const now = performance.now();
    if (now < poseUntil) { if (!figTimer) figTimer = setTimeout(() => { figTimer = 0; renderFigureNow(); }, poseUntil - now + 20); return; }
    const st = shown(), yq = quant(C.yaw), lookKey = JSON.stringify([st.cls, st.look]), key = lookKey + '|' + yq, fig = $('#cfig');
    if (key !== figKey) {
      figKey = key;
      fig.style.setProperty('--t', (-now / 1000).toFixed(3) + 's');
      fig.innerHTML = R.hero({ name: C.name, classId: st.cls, rig: st.look }, { yaw: yq });
      if (lookKey !== focusKey && measureFocus()) focusKey = lookKey;
    }
    if (wantPop) { wantPop = false; if (!REDUCED) pose(fig.querySelector('svg'), 'pop'); }
  }
  // az arc helye a figurán (a közelítéshez): a szemek közepe, a rig saját koordinátáiból
  function measureFocus() {
    const svg = $('#cfig svg'), eyes = svg && svg.querySelector('.r-eyes'), h = $('#cfigbox').offsetHeight;
    if (!eyes || !h) return false;
    try {
      const b = eyes.getBBox();
      if (b.width < 2) return false;
      const p = new DOMPoint(b.x + b.width / 2, b.y + b.height / 2).matrixTransform(eyes.getCTM());
      const fy = p.y / h;
      if (fy > 0.05 && fy < 0.6 && Math.abs(fy - FOCUS.fy) > 0.004) { FOCUS.fy = fy; applyZoom(); }
      return true;
    } catch (e) { return false; }
  }
  function tallHead(L) { return L.headwear === 'suveg' || L.headwear === 'sisak' || ['sarlo', 'demon', 'agancs'].indexOf(L.horns) >= 0 || L.ears === 'hosszutunde' || L.ears === 'roka' || ['tuskes', 'irokez', 'felfesult'].indexOf(L.hairFront) >= 0; }
  function applyZoom(instant) {
    const view = $('#cview'), cam = $('#ccam'), box = $('#cfigbox');
    if (!view || !box.offsetHeight) return;
    if (instant) { cam.classList.add('instant'); requestAnimationFrame(() => requestAnimationFrame(() => cam.classList.remove('instant'))); }
    document.querySelectorAll('#cview [data-zoom]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.zoom === C.zoom)));
    if (C.zoom === 'full') { cam.style.transform = ''; return; }
    // a Fej lépésnél (szarv, fejdísz) mindig marad hely a feje fölött, hogy az előnézetnél se vágódjon le semmi
    const vw = view.clientWidth, vh = view.clientHeight, tall = tallHead(C.look) || C.step === 'fej';
    const z = C.zoom === 'face' ? { s: tall ? 1.75 : 2.0, dy: tall ? -0.03 : 0.0, ty: tall ? 0.52 : 0.47 } : { s: 1.32, dy: 0.13, ty: 0.5 };
    const px = box.offsetLeft + box.offsetWidth / 2, py = box.offsetTop + box.offsetHeight * (FOCUS.fy + z.dy);
    const s = Math.min(z.s, Math.max(1.2, z.s * Math.min(1, vw / (box.offsetWidth * 1.15))));
    cam.style.transform = `translate(${(vw / 2 - s * px).toFixed(1)}px, ${(vh * z.ty - s * py).toFixed(1)}px) scale(${s.toFixed(3)})`;
  }
  function setZoom(z) { C.zoom = z; applyZoom(); }

  // forgatás: húzás, lendület, körbeforgatás és nézetváltás egyetlen animációs körben
  const MOT = { kind: null, raf: 0, last: 0 };
  function startMotion(kind, p) { Object.assign(MOT, p || {}, { kind, last: performance.now() }); if (!MOT.raf) MOT.raf = requestAnimationFrame(tick); updateSpin(); }
  function stopMotion() { MOT.kind = null; if (MOT.raf) cancelAnimationFrame(MOT.raf); MOT.raf = 0; updateSpin(); }
  function tick(t) {
    MOT.raf = 0;
    const dt = Math.min(120, Math.max(0, t - MOT.last)); MOT.last = t;
    if (MOT.kind === 'spin') C.yaw += 0.03 * dt;
    else if (MOT.kind === 'inertia') { C.yaw += MOT.v * dt; MOT.v *= Math.pow(0.92, dt / 16.7); if (Math.abs(MOT.v) < 0.006) MOT.kind = null; }
    else if (MOT.kind === 'tween') { const k = Math.min(1, (t - MOT.t0) / MOT.dur), e = 1 - Math.pow(1 - k, 3); C.yaw = MOT.from + (MOT.to - MOT.from) * e; if (k >= 1) MOT.kind = null; }
    if (figRaf) { cancelAnimationFrame(figRaf); figRaf = 0; }
    renderFigureNow(); updateYaw();
    if (MOT.kind) MOT.raf = requestAnimationFrame(tick); else updateSpin();
  }
  function turnTo(target, exact) {
    hideHint();
    const from = C.yaw, to = exact ? target : from + (norm(target - from));
    if (REDUCED) { stopMotion(); C.yaw = to; scheduleFigure(); updateYaw(); return; }
    startMotion('tween', { from, to, t0: performance.now(), dur: 260 + Math.abs(to - from) * 1.6 });
  }
  function turnBy(d) { const base = MOT.kind === 'tween' ? MOT.to : C.yaw, r = base / 45, onGrid = Math.abs(r - Math.round(r)) < 0.05; turnTo(onGrid ? Math.round(r) * 45 + d : (d > 0 ? Math.ceil(r) : Math.floor(r)) * 45); }
  function updateSpin() { const b = $('#cspin'); if (b) b.setAttribute('aria-pressed', String(MOT.kind === 'spin')); }
  function viewTarget(k) { return k === 'back' ? 180 : 0; }
  // két nézet van: szemből és hátulról; a köztes szögek csak a fordulás pillanatában látszanak
  const facingBack = () => Math.abs(norm((MOT.kind === 'tween' ? MOT.to : C.yaw))) > 90;
  function flip(dir) { const base = Math.round((MOT.kind === 'tween' ? MOT.to : C.yaw) / 180) * 180; turnTo(base + (dir < 0 ? -180 : 180), true); }
  function updateYaw() {
    const yq = quant(C.yaw), deg = (yq + 360) % 360, r = yq * Math.PI / 180, a = Math.abs(yq);
    const mk = $('#cmark'); mk.setAttribute('cx', (100 * Math.sin(r)).toFixed(1)); mk.setAttribute('cy', (22 * Math.cos(r)).toFixed(1)); mk.style.opacity = Math.cos(r) > -0.2 ? 1 : 0.45;
    const back = facingBack(), d = $('#cdrag'); d.setAttribute('aria-pressed', String(back));
    document.querySelectorAll('#cview [data-view]').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.view === 'back' ? back : !back)); });
  }
  function bindStage() {
    const drag = $('#cdrag');
    let G = null;
    drag.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      stopMotion(); poseUntil = 0; hideHint(); closeBg();
      G = { id: e.pointerId, x: e.clientX, y0: Math.abs(norm(C.yaw)) > 90 ? 180 : 0, lx: e.clientX, lt: e.timeStamp, v: 0 };
      try { drag.setPointerCapture(e.pointerId); } catch (err) { /* nem baj */ }
      drag.classList.add('grabbing');
    });
    drag.addEventListener('pointermove', e => {
      if (!G || e.pointerId !== G.id) return;
      // húzás közben csak egy kicsit fordul utána (legfeljebb 35°), elengedéskor dől el, hogy megfordul-e
      const dx = e.clientX - G.x, f = 35 * Math.tanh(dx / 120);
      C.yaw = G.y0 + f;
      const dt = e.timeStamp - G.lt;
      if (dt > 0) { G.v = G.v * 0.5 + ((e.clientX - G.lx) / dt) * 0.5; G.lx = e.clientX; G.lt = e.timeStamp; }
      scheduleFigure(); updateYaw();
    });
    const end = e => {
      if (!G || e.pointerId !== G.id) return;
      drag.classList.remove('grabbing');
      const dx = e.clientX - G.x, fast = e.timeStamp - G.lt < 90 && Math.abs(G.v) > 0.35, base = G.y0;
      G = null;
      if (e.type === 'pointerup' && (Math.abs(dx) > 48 || (fast && Math.abs(dx) > 14))) turnTo(base + (dx < 0 ? -180 : 180), true);
      else turnTo(base);
    };
    drag.addEventListener('pointerup', end); drag.addEventListener('pointercancel', end);
    drag.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') flip(-1);
      else if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') flip(1);
      else if (e.key === 'Home') turnTo(0); else if (e.key === 'End') turnTo(180);
      else if (e.key === '+' || e.key === '=') setZoom(C.zoom === 'full' ? 'upper' : 'face');
      else if (e.key === '-') setZoom(C.zoom === 'face' ? 'upper' : 'full');
      else return;
      e.preventDefault();
    });
    if (window.ResizeObserver) { RO = new ResizeObserver(() => applyZoom(true)); RO.observe($('#cview')); }
  }
  // háttérválasztó
  function openBg() {
    const pop = $('#cbgpop');
    pop.querySelectorAll('img[data-sc]').forEach(img => { if (!img.src) { const s = SC.scene(img.dataset.sc, { seed: 4, moonX: 960, single: true }); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(/xmlns=/.test(s.slice(0, 300)) ? s : s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')); } });
    pop.hidden = false; $('#cbgbtn').setAttribute('aria-expanded', 'true');
    const cur = pop.querySelector('[aria-pressed="true"]'); if (cur) cur.focus({ preventScroll: true });
  }
  function closeBg(refocus) {
    const pop = $('#cbgpop'); if (!pop || pop.hidden) return;
    pop.hidden = true; $('#cbgbtn').setAttribute('aria-expanded', 'false');
    if (refocus) $('#cbgbtn').focus({ preventScroll: true });
  }
  function pose(svg, k) {
    if (!svg) return;
    const map = { attack: 'act-attack', cast: 'act-cast', hit: 'act-hit', dodge: 'act-dodge', victory: 'act-victory', shoot: 'act-shoot', ko: 'act-ko', pop: 'act-pop' };
    const cl = map[k] || (k.indexOf('act-') === 0 ? k : 'act-' + k);
    svg.classList.remove(cl); void svg.getBoundingClientRect(); svg.classList.add(cl);
    const DUR = { skycall: 1200, thrust: 950, shelter: 1100, victory: 1900, backstab: 1500, aim: 1450, charge: 1150, strum: 1200, pray: 1200, roar: 1100, guard: 1500, beast: 1050, leap: 1000, attack: 1050, shoot2: 1250, kneel: 1300, bless: 1200, lull: 1300, march: 1300, taunt: 1300, anthem: 1300, maul: 1150, pounce: 1000, ward: 1100, sweep: 1100, clench: 1100, zap: 1050, slam: 1050, toss: 900, bash: 950, jab: 850, push: 1000, point: 950 };
    setTimeout(() => svg.classList.remove(cl), DUR[k] || 1000);
    if (/^act-(shoot|shoot2|aim|leap)$/.test(cl)) R.bowString(svg, DUR[k] || 1000, cl);
  }
  function stagePose(k) {
    stopMotion();
    if (C.preview) { C.preview = null; updateNote(); }
    if (C.zoom !== 'full') setZoom('full');
    if (k === 'attack' && C.classId === 'vadasz') k = 'shoot';
    renderFigureNow();
    poseUntil = performance.now() + (k === 'victory' ? 1850 : 950);
    pose($('#cfig svg'), k);
  }

  // ---------- panel ----------
  function initPanel() {
    $('#cpanel').innerHTML =
      `<div class="nxc-steps" id="csteps" role="tablist" aria-label="A karakterkészítés lépései">${STEPS.map(s => `<button role="tab" id="ctab-${s.id}" data-step="${s.id}" aria-controls="cbody" aria-selected="false" tabindex="-1"><span class="n">${s.i + 1}</span><span class="seen" hidden></span>${icon(s.id)}<span>${s.name}</span></button>`).join('')}</div>
      <div class="step-head"><div><div class="cnt" id="ccnt"></div><h3 id="ctitle"></h3><p id="cdesc"></p></div><div class="row" style="gap:6px"><button class="tbtn" id="clock" data-act="lockstep" aria-pressed="false">${icon('unlock')}<span class="lbl">Zárolás</span></button><button class="tbtn" id="crstep" data-act="randstep" title="Csak ennek a lépésnek a beállításait sorsolja újra">${icon('dice')}<span class="lbl">Sorsolás</span></button></div></div>
      <div class="c-body" id="cbody" role="tabpanel" tabindex="-1"></div>
      <div class="c-foot"><button class="btn" id="cprev" data-act="prev">${icon('left')}Előző</button><div class="prog"><span id="cprog"></span><div class="track"><i id="cbar"></i></div></div><button class="btn primary" id="cnext" data-act="next"></button></div>`;
  }
  function updateChrome() {
    const s = STEP[C.step], last = s.i === STEPS.length - 1;
    STEPS.forEach(x => {
      const b = $('#ctab-' + x.id), on = x.id === C.step;
      b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
      b.querySelector('.seen').hidden = on || !C.seen.has(x.id);
    });
    $('#cbody').setAttribute('aria-labelledby', 'ctab-' + s.id);
    $('#ccnt').textContent = `${s.i + 1}/${STEPS.length}. lépés`;
    $('#ctitle').textContent = s.name; $('#cdesc').textContent = s.desc;
    $('#crstep').title = s.id === 'nev' ? 'Új névötlet' : s.id === 'alap' ? 'Nem, faj, testalkat, bőrszín és farok újrasorsolása (a kaszt marad)' : 'Csak ennek a lépésnek a beállításait sorsolja újra';
    $('#crstep').setAttribute('aria-label', s.id === 'nev' ? 'Névötlet' : `Sorsolás ennél a lépésnél: ${s.name}`);
    // zárolás: a Meglepetés gomb és az Ötletek a zárolt lépés beállításait nem változtatják
    const lk = $('#clock'), on = C.locks.has(s.id), lockable = !(RESTYLE && s.id === 'nev');
    lk.hidden = !lockable; lk.setAttribute('aria-pressed', String(on)); lk.innerHTML = `${icon(on ? 'lock' : 'unlock')}<span class="lbl">${on ? 'Zárolva' : 'Zárolás'}</span>`;
    lk.title = on ? 'Zárolva: a Meglepetés gomb ezt a lépést nem változtatja. Kattints a feloldáshoz.' : 'Zárold, ha ez így tetszik: a Meglepetés gomb és az ötletek ezt a lépést nem változtatják.';
    STEPS.forEach(x => $('#ctab-' + x.id).classList.toggle('locked', C.locks.has(x.id)));
    $('#cprev').disabled = s.i === 0;
    const nx = $('#cnext');
    if (last) { nx.className = 'btn fakla'; nx.dataset.act = 'done'; nx.innerHTML = `${icon('star')}${RESTYLE ? 'Mentés' : 'Kész'}`; }
    else { nx.className = 'btn primary'; nx.dataset.act = 'next'; nx.innerHTML = `<span>Tovább<span class="nx">: ${STEPS[s.i + 1].name}</span></span>${icon('right')}`; }
    $('#cprog').textContent = `${s.i + 1}/${STEPS.length}`;
    $('#cbar').style.width = ((s.i + 1) / STEPS.length * 100) + '%';
    // a lépéssor (telefonon vízszintesen görgethető) mutassa a kiválasztott fület – az oldal ne mozduljon
    const bar = $('#csteps'), tab = $('#ctab-' + s.id);
    if (bar.scrollWidth > bar.clientWidth) { const l = tab.getBoundingClientRect().left - bar.getBoundingClientRect().left + bar.scrollLeft, r = l + tab.offsetWidth; if (l < bar.scrollLeft + 24) bar.scrollLeft = Math.max(0, l - 24); else if (r > bar.scrollLeft + bar.clientWidth - 24) bar.scrollLeft = r - bar.clientWidth + 24; }
  }
  const tileImg = (key, v, cls) => { const t = TH[key]; return `<span class="th loading" data-th="${key}" data-v="${v}" style="aspect-ratio:${ratio(t.vb)}"><img alt="" decoding="async"></span>`; };
  const ck = `<span class="ck">${icon('check')}</span>`;
  // hosszú összetett szavakba lágy kötőjel, hogy a csempe nevét szótaghatáron törje (ne „Varázslósüv-eg” legyen)
  const SOFT = ['vágású', 'süveg', 'koszorú', 'választott', 'szárny', 'farok', 'szem', 'szarv', 'szakáll', 'festék', 'csepp', 'köntös', 'talár', 'palást', 'öltözet', 'pengék', 'lámpás', 'könyv', 'pálca', 'buzogány', 'fésült', 'mellény', 'köpönyeg', 'kabát', 'vért', 'pajzs'];
  const soft = n => R.esc(n).replace(/[\p{L}]{10,}/gu, w => { for (const x of SOFT) { const i = w.indexOf(x); if (i >= 2) return w.slice(0, i) + '&shy;' + w.slice(i); } return w; });
  function grpHead(id, label, key) { return `<div class="grp-h"><h4 id="g-${id}">${label}</h4><span class="val" data-val="${key}"></span></div>`; }
  function optTiles(key) {
    const items = key === 'outfit' ? R.OUTFIT_NAMES[C.classId].map((n, i) => [String(i), n]) : key === 'weapon' ? R.WEAPON_NAMES[C.classId].map((n, i) => [String(i), n]) : Object.keys(R.OPTIONS[key].items).map(v => [v, R.OPTIONS[key].items[v]])
      // a frizurák közül elöl azok, amelyek a hős nemének jobban állnak (a többi is választható)
      .sort((x, y) => { if (key !== 'hairStyle') return 0; const sx = C.look.sex === 'ferfi' ? 'f' : 'n', rank = id => { const t = R.HAIRSTYLES.find(h => h[0] === id)[4]; return t === sx ? 0 : !t ? 1 : 2; }; return rank(x[0]) - rank(y[0]); });
    const kind = FULL_KEYS.indexOf(key) >= 0 ? (key === 'outfit' || key === 'weapon' ? 'full wide' : 'full') : '';
    return `<div class="grp" data-g="${key}">${grpHead(key, R.OPTIONS[key].label, key)}<div class="tiles ${kind}" role="group" aria-labelledby="g-${key}">${items.map(([v, n]) => `<button class="tile" data-set="${key}" data-v="${v}" data-pv aria-pressed="false" title="${R.esc(n)}">${ck}${tileImg(key, v)}<span class="nm">${soft(n)}</span></button>`).join('')}</div><p class="note" data-note="${key}" hidden></p></div>`;
  }
  function colorGroup(key, allowNone) {
    const [label, list] = R.COLOR_SLOTS[key];
    const noneLbl = key === 'tip' ? 'Egyszínű haj, nincs hajvég' : 'Mindkét szem egyforma';
    const glabel = key === 'eye2' ? 'Másik szem (két különböző szín)' : key === 'tip' ? 'Hajvég színe' : label;
    return `<div class="grp" data-g="${key}">${grpHead(key, glabel, key)}<div class="sw" role="group" aria-labelledby="g-${key}">` +
      (allowNone ? `<button class="none" data-col="${key}" data-v="" data-pv title="${noneLbl}" aria-label="${noneLbl}" aria-pressed="false"><span class="x"></span>${icon('check')}</button><span class="gap"></span>` : '') +
      list.map(([n, h]) => `<button style="background:${h};color:${lum(h) > 0.55 ? '#141a45' : '#fff'}" data-col="${key}" data-v="${h}" data-pv title="${n}" aria-label="${n}" aria-pressed="false">${icon('check')}</button>`).join('') +
      `<span class="gap"></span><label class="cust" title="Saját szín"><input type="color" data-cust="${key}" aria-label="Saját szín: ${label.toLowerCase()}"><i></i></label></div><p class="note" data-note="${key}" hidden></p></div>`;
  }
  function lum(h) { const n = parseInt(h.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
  function buildGroup(g) {
    const t = g[0];
    if (t === 'opt') return optTiles(g[1]);
    if (t === 'color') return colorGroup(g[1], g[2]);
    if (t === 'ideas') return `<div class="grp" data-g="ideas"><div class="grp-h"><h4 id="g-ideas">Ötletek</h4><button class="tbtn sm" data-act="ideas">${icon('dice')}<span class="lbl">Újak</span></button></div><p class="note" style="margin:0 0 8px">Kész hősök egy kattintásra; utána mindent átállíthatsz. A zárolt lépéseket megtartják.</p><div class="tiles ideas" id="cideas" role="group" aria-labelledby="g-ideas">${ideasHtml()}</div></div>`;
    if (t === 'sex') return `<div class="grp" data-g="sex">${grpHead('sex', 'Nem', 'sex')}<div class="sex" role="group" aria-labelledby="g-sex">${[['no', 'Nő', 'Karcsúbb váll, lágyabb vonások'], ['ferfi', 'Férfi', 'Szélesebb váll, markánsabb arc']].map(([v, n, d]) => `<button class="tile" data-set="sex" data-v="${v}" data-pv aria-pressed="false">${ck}${tileImg('sex', v)}<span><b>${n}</b><small>${d}</small></span></button>`).join('')}</div></div>`;
    if (t === 'class') return `<div class="grp" data-g="class">${grpHead('class', 'Kaszt', 'class')}<div class="tiles full cls" role="group" aria-labelledby="g-class">${CLS.map(c => `<button class="tile" data-class="${c}" data-pv aria-pressed="false">${ck}${tileImg('class', c)}<span class="nm">${D.CLASSES[c].name}</span><span class="sm">${D.CLASSES[c].role}</span></button>`).join('')}</div><div class="info" id="cclassinfo"></div></div>`;
    if (t === 'people') return `<div class="grp" data-g="people">${grpHead('people', 'Faj', 'people')}<div class="tiles" role="group" aria-labelledby="g-people">${D.PEOPLE_ORDER.map(p => `<button class="tile" data-people="${p}" data-pv aria-pressed="false">${ck}${tileImg('people', p)}<span class="nm">${D.PEOPLES[p].name}</span></button>`).join('')}</div><div class="info" id="cpeopleinfo"></div></div>`;
    if (t === 'toggle') return `<div class="grp" data-g="${g[1]}">${grpHead(g[1], 'Különleges', g[1])}<button class="switch" role="switch" data-tog="${g[1]}" aria-checked="false"><span class="knob"></span><span>Világító szem</span></button><p class="note">A szem halványan dereng, sötétben még jobban látszik.</p></div>`;
    if (t === 'metal') return `<div class="grp" data-g="metal">${grpHead('metal', 'Fém (csatok, díszek, páncél)', 'metal')}<div class="sw" role="group" aria-labelledby="g-metal">${Object.keys(R.METAL).map(k => `<button style="background:linear-gradient(135deg, ${R.light(R.METAL[k][1], 0.45)}, ${R.METAL[k][1]} 55%, ${R.dark(R.METAL[k][1], 0.3)});color:${lum(R.METAL[k][1]) > 0.55 ? '#141a45' : '#fff'}" data-metal="${k}" data-pv title="${R.METAL[k][0]}" aria-label="${R.METAL[k][0]}" aria-pressed="false">${icon('check')}</button>`).join('')}</div></div>`;
    if (t === 'name') return `<div class="grp" data-g="name"><div class="grp-h"><h4><label for="cname">A hősöd neve</label></h4><span class="val" id="cnamecount"></span></div><div class="name-row"><input class="inp" id="cname" maxlength="16" autocomplete="off" spellcheck="false" aria-describedby="cnamehelp"><button class="btn" data-act="namegen" title="Új név, a hősöd neméhez illően">${icon('dice')}Névötlet</button></div><p class="note" id="cnamehelp">${R.esc(NAME_HINT)}</p></div>`;
    if (t === 'story') return `<div class="grp" data-g="origin"><div class="grp-h"><h4 id="g-origin">Honnan jött a hősöd?</h4><span class="val" data-val="origin"></span></div><div class="story-opts" role="group" aria-labelledby="g-origin">${D.ORIGIN_ORDER.map(id => `<button class="story-card" data-origin="${id}" aria-pressed="false"><b>${R.esc(D.ORIGINS[id].name)}</b><span>${R.esc(D.ORIGINS[id].line)}</span></button>`).join('')}</div></div>` +
      `<div class="grp" data-g="trait"><div class="grp-h"><h4 id="g-trait">Jellem</h4><span class="val" data-val="trait"></span></div><div class="story-chips" role="group" aria-labelledby="g-trait">${D.TRAIT_ORDER.map(id => `<button class="chip" data-trait="${id}" aria-pressed="false">${R.esc(D.TRAITS[id].name)}</button>`).join('')}</div><p class="note" id="ctraitnote"></p></div>` +
      `<div class="grp" data-g="motto"><div class="grp-h"><h4><label for="cmotto">Jelmondat (nem kötelező)</label></h4><span class="val" id="cmottocount"></span></div><input class="inp" id="cmotto" maxlength="40" autocomplete="off" placeholder="pl. Előbb ütök, aztán kérdezek."></div>`;
    if (t === 'summary') return `<div class="grp" data-g="summary"><div class="grp-h"><h4>Így néz ki a hősöd</h4><span class="val">Kattints egy sorra, ha módosítanál</span></div><div class="summary" id="csummary"></div><div class="done-row">${RESTYLE && O.onCancel ? '<button class="btn" data-act="cancel">Mégse</button>' : ''}<button class="btn fakla big" data-act="done">${icon('star')}${RESTYLE ? 'Mentés' : 'Kész, indulhat a kaland!'}</button></div></div>`;
    return '';
  }
  // azonosító a gombhoz, hogy újraépítés után is ugyanoda kerüljön vissza a fókusz
  function focusSel() {
    const a = document.activeElement;
    if (!a || !$('#cpanel').contains(a) || a === document.body) return '';
    if (a.id) return '#' + a.id;
    return [...a.attributes].filter(x => x.name.startsWith('data-')).map(x => `[${x.name}="${x.value}"]`).join('');
  }
  function buildBody(keep) {
    const body = $('#cbody'), top = keep ? body.scrollTop : 0, winY = window.scrollY, sel = keep ? focusSel() : '';
    body.innerHTML = STEP[C.step].groups.map(buildGroup).join('');
    body.dataset.sig = C.step + '|' + C.classId;
    body.scrollTop = top;
    if (sel) { const el = body.querySelector(sel); if (el) el.focus({ preventScroll: true }); }
    syncBody();
    if (window.scrollY !== winY) window.scrollTo(window.scrollX, winY);
  }
  function syncPanel() {
    const body = $('#cbody');
    if (body.dataset.sig !== C.step + '|' + C.classId) buildBody(true); else syncBody();
    updateChrome();
  }
  function syncBody() {
    const body = $('#cbody'), L = C.look;
    body.querySelectorAll('[data-set]').forEach(b => b.setAttribute('aria-pressed', String(String(b.dataset.set === 'hairStyle' ? R.hairStyleOf(L) : L[b.dataset.set]) === b.dataset.v)));
    body.querySelectorAll('[data-class]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.class === C.classId)));
    body.querySelectorAll('[data-people]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.people === C.people)));
    body.querySelectorAll('[data-metal]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.metal === L.metal)));
    body.querySelectorAll('[data-col]').forEach(b => b.setAttribute('aria-pressed', String((L[b.dataset.col] || '').toLowerCase() === b.dataset.v.toLowerCase())));
    body.querySelectorAll('[data-cust]').forEach(inp => {
      const k = inp.dataset.cust, v = L[k], custom = !!v && colorName(k, v) === 'Saját szín', lab = inp.parentNode;
      lab.classList.toggle('on', custom); lab.style.setProperty('--c', custom ? v : 'transparent');
      if (document.activeElement !== inp) inp.value = /^#[0-9a-f]{6}$/i.test(v || '') ? v.toLowerCase() : (k === 'eye2' ? L.eye : k === 'tip' ? L.hair : '#888888');
    });
    body.querySelectorAll('[data-tog]').forEach(b => b.setAttribute('aria-checked', String(!!L[b.dataset.tog])));
    body.querySelectorAll('[data-val]').forEach(s => { s.textContent = valueName(s.dataset.val); });
    const ci = $('#cclassinfo'); if (ci) { const c = D.CLASSES[C.classId]; ci.innerHTML = `<b>${c.name}</b> · ${c.role}<span class="tag">${c.diff}</span><br>${R.esc(c.style)}`; }
    const pi = $('#cpeopleinfo'); if (pi) pi.innerHTML = C.people ? `<b>${D.PEOPLES[C.people].name}:</b> ${R.esc(D.PEOPLES[C.people].note)} A faj beállítja a hozzá illő bőrszínt és fület, de utána bármelyiket átírhatod.` : '';
    // figyelmeztetések, ha valami eltakar egy másik részt
    const note = (k, txt) => { const n = body.querySelector(`[data-note="${k}"]`); if (n) { n.hidden = !txt; n.textContent = txt || ''; n.classList.toggle('warn', !!txt); } };
    const hw = L.headwear, hwName = optName('headwear', hw).toLowerCase();
    note('hairStyle', hw === 'sisak' ? 'A sisak alatt nem látszik a frizura. A Fej lépésnél leveheted.' : hw === 'csuklya' || hw === 'suveg' ? `A ${hwName} részben eltakarja a hajat. A Fej lépésnél leveheted.` : '');
    note('eyeShape', hw === 'szemkoto' ? 'A szemkötő eltakarja az egyik szemet. A Fej lépésnél leveheted.' : '');
    note('mouth', C.classId === 'orgyilkos' && +L.outfit === 0 ? 'Az álarc eltakarja a szájat. Az Öltözet lépésnél választhatsz álarc nélküli ruhát.' : '');
    note('beard', L.sex !== 'ferfi' && L.beard !== 'nincs' ? '' : C.classId === 'orgyilkos' && +L.outfit === 0 ? 'Az álarc eltakarja a szakállt is.' : '');
    note('hornColor', L.horns === 'nincs' ? 'Most nincs szarva a hősödnek. Fent válassz egyet, és utána itt kiszínezheted.' : '');
    const hg = body.querySelector('[data-g="hornColor"]'); if (hg) hg.classList.toggle('dim', L.horns === 'nincs');
    note('tail', L.tail !== 'nincs' ? 'Forgasd meg a hőst, hátulról látszik igazán.' : '');
    note('cape', L.cape !== 'nincs' ? 'Forgasd meg a hőst, hátulról látszik igazán.' : '');
    note('wings', L.wings !== 'nincs' ? 'Forgasd meg a hőst, hátulról látszik igazán.' : '');
    const nm = $('#cname');
    if (nm) { if (document.activeElement !== nm) nm.value = C.name; $('#cnamecount').textContent = `${nm.value.length}/16`; }
    const sm = $('#csummary'); if (sm) renderSummary(sm);
    body.querySelectorAll('[data-origin]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.origin === C.origin)));
    body.querySelectorAll('[data-trait]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.trait === C.trait)));
    const tn = $('#ctraitnote'); if (tn) tn.textContent = `A jellem csak a hangulatot adja: így reagál a hősöd győzelemkor. Például: „${D.TRAITS[C.trait].win}”`;
    const mo = $('#cmotto'); if (mo) { if (document.activeElement !== mo) mo.value = C.motto; $('#cmottocount').textContent = `${mo.value.length}/40`; }
    refreshThumbs();
  }
  function renderSummary(el) {
    const L = C.look, nm = k => valueName(k);
    const rows = [
      ['Kaszt', `${nm('class')} (${D.CLASSES[C.classId].role.toLowerCase()})`, 'alap'], ['Faj és nem', `${nm('people')}, ${nm('sex').toLowerCase()}`, 'alap'],
      ['Alkat', `${nm('body')}, ${nm('height').toLowerCase()} · ${nm('skin').toLowerCase()} bőr`, 'alap'],
      ['Arc', `${nm('face')} arc, ${nm('eyeShape').toLowerCase()} szem`, 'arc'],
      ['Szem', L.eye2 ? `${nm('eye')} és ${nm('eye2').toLowerCase()}` + (L.eyeGlow ? ', világít' : '') : nm('eye') + (L.eyeGlow ? ', világít' : ''), 'arc'],
      ['Haj', `${nm('hairStyle')} · ${nm('hair').toLowerCase()}${L.tip ? ' → ' + nm('tip').toLowerCase() : ''}`, 'haj'],
      ['Fej', [/fül$/i.test(nm('ears')) ? nm('ears') : nm('ears') + ' fül', L.horns !== 'nincs' ? nm('horns').toLowerCase() : '', L.headwear !== 'nincs' ? nm('headwear').toLowerCase() : '', L.earring !== 'nincs' ? nm('earring').toLowerCase() + ' fülbevaló' : ''].filter(Boolean).join(', '), 'fej'],
      ['Öltözet', `${nm('outfit')} · ${nm('c1').toLowerCase()}, ${nm('c2').toLowerCase()}${L.cape !== 'nincs' ? ' · köpeny: ' + nm('cape').toLowerCase() : ''}`, 'ruha'],
      ['Fegyver', nm('weapon'), 'fegyver'],
      ['Farok', L.tail !== 'nincs' ? nm('tail') : 'Nincs', 'alap']
    ];
    const keep = el.querySelector('[data-th]');
    el.innerHTML = `${keep ? keep.outerHTML : tileImg('_me', '')}<div class="who"><b>${R.esc(C.name || 'Névtelen hős')}</b><span>${nm('people')} ${nm('class').toLowerCase()}, ${nm('sex').toLowerCase()}</span></div>` +
      `<div class="sum-list">${rows.map(([l, v, s]) => `<button data-jump="${s}" title="${STEP[s].name}: módosítás"><small>${l}</small><span>${R.esc(v)}</span></button>`).join('')}</div>`;
  }
  function goStep(id) {
    if (!STEP[id] || id === C.step) return;
    closeBg();
    if (C.preview) { C.preview = null; scheduleFigure(); updateNote(); }
    C.step = id; C.seen.add(id);
    setZoom(STEP[id].zoom);
    buildBody(false); updateChrome();
    // telefonon a panel az oldallal görög: ha a lépés eleje a ragadós színpad alá csúszott, finoman hozzuk vissza
    if (matchMedia('(max-width: 819px)').matches) {
      const head = document.querySelector('#cpanel .step-head'), stuck = $('#cview').getBoundingClientRect().bottom + $('#csteps').offsetHeight;
      const top = head.getBoundingClientRect().top;
      if (top < stuck - 1) window.scrollTo({ top: window.scrollY + top - stuck - 4, behavior: REDUCED ? 'auto' : 'smooth' });
    }
  }

  // ---------- bélyegképek: lustán, kötegekben, gyorsítótárral ----------
  const TCACHE = new Map(), TQ = { list: [], raf: 0 };
  function thumbSpec(el) {
    const key = el.dataset.th, t = TH[key], vr = variant(key, el.dataset.v), L = vr.look;
    if (t.bare && FACE_HIDERS.concat(['suveg']).indexOf(L.headwear) >= 0 && key !== 'headwear') L.headwear = 'nincs';
    if (t.bare && (key === 'mouth' || key === 'beard') && vr.cls === 'orgyilkos' && +L.outfit === 0) L.outfit = 1;
    if ((key === 'cape' || key === 'wings') && ['hosszu', 'hullamos', 'vallig'].indexOf(L.hairBack) >= 0) L.hairBack = 'rovid'; // a hosszú haj ne takarja el a köpenyt a mintaképen
    if (t.head) { ['c2', 'weapon', 'cape', 'wings', 'tail', 'aura', 'body', 'height'].forEach(k => { delete L[k]; }); }
    else if (key !== 'aura') L.aura = 'nincs'; // az aura elmosása drága és zavaró is a kis képeken – csak az Aura csempéin kell
    return { t, cls: vr.cls, look: L, k: `${key}|${t.vb}|${t.yaw || 0}|${vr.cls}|${JSON.stringify(L)}` };
  }
  function thumbSrc(sp) {
    let s = TCACHE.get(sp.k);
    if (s) { TCACHE.delete(sp.k); TCACHE.set(sp.k, s); return s; }
    const svg = R.hero({ name: '', classId: sp.cls, rig: sp.look }, { yaw: sp.t.yaw || 0, headOnly: !!sp.t.head, portrait: !!sp.t.head }).replace(/viewBox="[^"]*"/, `viewBox="${sp.t.vb}"`);
    s = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    TCACHE.set(sp.k, s);
    if (TCACHE.size > 360) TCACHE.delete(TCACHE.keys().next().value);
    return s;
  }
  function setThumb(el, src, k) {
    const img = el.firstElementChild;
    el.dataset.k = k;
    if (img.getAttribute('src') === src) return;
    if (el.classList.contains('loading')) img.onload = () => el.classList.remove('loading');
    img.src = src;
  }
  function refreshThumbs() {
    const need = [], vh = window.innerHeight;
    document.querySelectorAll('#cbody [data-th]').forEach(el => {
      const sp = thumbSpec(el);
      if (el.dataset.k === sp.k) return;
      const hit = TCACHE.get(sp.k);
      if (hit) setThumb(el, hit, sp.k);
      else { const r = el.getBoundingClientRect(); need.push({ el, sp, d: r.bottom < 0 ? -r.bottom : r.top > vh ? r.top - vh : 0 }); }
    });
    need.sort((a, b) => a.d - b.d);
    TQ.list = need;
    if (need.length && !TQ.raf) TQ.raf = requestAnimationFrame(pumpThumbs);
  }
  function pumpThumbs() {
    TQ.raf = 0;
    const t0 = performance.now();
    let n = 0; // képkockánként legfeljebb 4 új kép, hogy a kirajzolás is szétoszoljon
    while (TQ.list.length && n++ < 4 && performance.now() - t0 < 7) {
      const it = TQ.list.shift();
      if (it.el.isConnected) setThumb(it.el, thumbSrc(it.sp), it.sp.k);
    }
    if (TQ.list.length) TQ.raf = requestAnimationFrame(pumpThumbs);
  }

  // ---------- előnézet: egér a csempe fölött (vagy billentyűs fókusz) → a nagy figurán látszik ----------
  let pvTimer = 0, pvEl = null;
  function previewOf(el) {
    const d = el.dataset;
    if (d.set) return [variant(d.set, d.v), (el.querySelector('.nm, b') || el).textContent.replace(/\u00ad/g, '')];
    if (d.col !== undefined) return [variant(d.col, d.v), el.getAttribute('aria-label')];
    if (d.class) return [variant('class', d.class), D.CLASSES[d.class].name];
    if (d.people) return [variant('people', d.people), D.PEOPLES[d.people].name];
    if (d.metal) return [variant('metal', d.metal), R.METAL[d.metal][0]];
    return null;
  }
  function setPreview(el) {
    clearTimeout(pvTimer);
    if (el === pvEl && C.preview) return;
    const p = previewOf(el); if (!p) return;
    pvEl = el; pvLabel = p[1];
    C.preview = same({ cls: p[0].cls, look: p[0].look }, { cls: C.classId, look: C.look }) ? null : { cls: p[0].cls, look: p[0].look };
    scheduleFigure(); updateNote();
  }
  function clearPreviewSoon() {
    clearTimeout(pvTimer);
    pvTimer = setTimeout(() => { pvEl = null; if (C.preview) { C.preview = null; scheduleFigure(); updateNote(); } }, 70);
  }

  // ---------- műveletek ----------
  function randomizeStep() {
    const s = C.step;
    if (s === 'nev') { if (!RESTYLE) commit(() => { C.name = randomName(C.look.sex, C.name); }, { noPop: true }); return; }
    commit(() => {
      for (let tries = 0; tries < 10; tries++) {
        let r, n = 0;
        do r = tidy(R.randomLook(C.classId, rnd)); while (s !== 'alap' && r.sex !== C.look.sex && ++n < 12);
        const next = Object.assign({}, C.look);
        STEP[s].keys.forEach(k => { next[k] = r[k]; });
        if (s === 'alap') {
          if (!RESTYLE) { const p = pick(D.PEOPLE_ORDER); C.people = p; next.ears = PEOPLE[p].ears; if (rnd() < 0.5) next.skin = PEOPLE[p].skin; }
          if (next.sex === 'no') next.beard = 'nincs';
        }
        if (s === 'alap') {
          const keys = o => Object.keys(R.OPTIONS[o].items).filter(v => v !== 'nincs');
          next.tail = rnd() < 0.35 ? (next.ears === 'roka' || next.ears === 'macska' ? next.ears : pick(keys('tail'))) : 'nincs';
        }
        if (s === 'ruha' && C.classId === 'orgyilkos' && rnd() < 0.5) next.outfit = 1;
        if (!same(next, C.look)) { C.look = next; break; }
      }
    });
  }
  // egy véletlen hős a zárolt lépések megtartásával (a Meglepetés gomb és az Ötletek is ezt használja)
  function lockedRandom() {
    const L = tidy(R.randomLook(C.classId, rnd));
    if (C.classId === 'orgyilkos') L.outfit = 1; // az álarcos ruha eltakarná az arcot
    const keepAlap = C.locks.has('alap');
    // zárolt haj szakállal: a szakáll csak férfin marad meg, ezért ilyenkor a nem is marad
    if (C.locks.has('haj') && C.look.beard && C.look.beard !== 'nincs') L.sex = C.look.sex;
    const p = RESTYLE || keepAlap ? C.people : pick(D.PEOPLE_ORDER);
    if (p && PEOPLE[p] && rnd() < 0.5) L.skin = PEOPLE[p].skin;
    if (p && PEOPLE[p] && ['roka', 'macska'].indexOf(L.ears) < 0) L.ears = PEOPLE[p].ears;
    STEPS.forEach(st => { if (C.locks.has(st.id)) st.keys.forEach(k => { L[k] = C.look[k]; }); });
    if (keepAlap) L.ears = C.look.ears;
    if (L.sex === 'no') L.beard = 'nincs';
    return { look: tidy(L), people: p, name: RESTYLE || C.locks.has('nev') ? C.name : randomName(L.sex, C.name) };
  }
  function randomizeAll() {
    commit(() => { const r = lockedRandom(); C.look = r.look; if (!RESTYLE) { C.people = r.people; C.name = r.name; } });
  }
  // Ötletek: négy kész, azonnal választható hős (csak kinézet: az erő minden ötletnél ugyanaz), utána szabadon szerkeszthető
  function newIdeas() { C.ideas = [0, 1, 2, 3].map(() => lockedRandom()); }
  function ideasHtml() {
    if (!C.ideas) newIdeas();
    return C.ideas.map((x, i) => `<button class="tile idea" data-idea="${i}" aria-label="${i + 1}. ötlet kiválasztása"><span class="idea-fig">${R.hero({ name: '', classId: C.classId, rig: x.look }, { yaw: 0 }).replace(/viewBox="[^"]*"/, `viewBox="${VB_FULL}"`)}</span></button>`).join('');
  }
  function resetLook() {
    const ok = commit(() => {
      const male = C.look.sex === 'ferfi';
      C.look = Object.assign(R.defaultLook(C.classId), { sex: C.look.sex }, male ? { hairFront: 'oldalvalasztott', hairBack: 'nincs', eyeShape: 'mandula', brows: 'egyenes', mouth: 'magabiztos' } : {}, C.people ? PEOPLE[C.people] : {});
    });
    toast(ok ? 'Visszaállt az alap kinézet. Ha mégsem kell, a Visszavonás gombbal visszahozhatod.' : 'Már most is az alap kinézet van rajta.');
  }
  let toastT = 0;
  function toast(msg) { const t = $('#ctoast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3200); }
  // a névhiba mindig látható helyre kerül: a Név lépésre ugrunk, a mező a képernyő közepére gördül
  function nameError(msg) {
    if (C.step !== 'nev') goStep('nev');
    const hlp = $('#cnamehelp'), i = $('#cname');
    if (hlp) { hlp.textContent = msg; hlp.classList.add('err'); }
    if (i) { i.setAttribute('aria-invalid', 'true'); i.scrollIntoView({ block: 'center', behavior: 'smooth' }); i.focus({ preventScroll: true }); }
    toast(msg);
  }
  function finish() {
    const inp = $('#cname'), nm = (C.name || '').trim();
    if (!nm && !RESTYLE) { if (C.step !== 'nev') goStep('nev'); const i = $('#cname'); if (i) { i.setAttribute('aria-invalid', 'true'); i.focus({ preventScroll: true }); i.scrollIntoView({ block: 'center', behavior: 'smooth' }); const hlp = $('#cnamehelp'); if (hlp) { hlp.textContent = 'Adj nevet a hősödnek.'; hlp.classList.add('err'); } } toast('Előbb adj nevet a hősödnek!'); return; }
    if (!RESTYLE && O.validName && !O.validName(nm)) { nameError(O.nameRule || 'Ez a név nem jó. 2–16 karakter: betűk, számok, szóköz vagy kötőjel.'); return; }
    if (inp) inp.removeAttribute('aria-invalid');
    stopMotion(); turnTo(0);
    const wait = MOT.kind === 'tween' ? MOT.dur + 40 : 0;
    setTimeout(() => {
      stagePose('victory');
      try { const b = $('#cfigbox'); V.levelup($('#cview'), { at: { x: b.offsetLeft + b.offsetWidth / 2, y: b.offsetTop + b.offsetHeight * 0.95 } }); } catch (e) { /* csak díszítés */ }
    }, wait);
    if (O.onDone) Promise.resolve(O.onDone({ classId: C.classId, people: C.people, look: Object.assign({}, C.look), name: C.name, origin: C.origin, trait: C.trait, motto: C.motto })).catch(err => {
      const msg = (err && err.message) || 'Valami nem sikerült. Próbáld újra!';
      if (err && err.code === 'name' && !RESTYLE) { nameError(msg); return; }
      toast(msg);
    });
  }

  function bindCreator() {
    const root = HOST;
    root.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || !root.contains(b)) return;
      const d = b.dataset;
      if (d.act !== 'bg' && !b.closest('#cbgpop')) closeBg();
      if (d.step) { goStep(d.step); return; }
      if (d.jump) { goStep(d.jump); $('#ctab-' + d.jump).focus({ preventScroll: true }); return; }
      if (d.set === 'sex') { commit(() => { C.look.sex = d.v; if (d.v === 'no') C.look.beard = 'nincs'; }); return; }
      if (d.set === 'hairStyle') { commit(() => { R.applyHairStyle(C.look, d.v); }); return; }
      if (d.set) { commit(() => { C.look[d.set] = /^\d+$/.test(d.v) ? +d.v : d.v; }); return; }
      if (d.col !== undefined) { commit(() => { C.look[d.col] = d.v || null; }); return; }
      if (d.metal) { commit(() => { C.look.metal = d.metal; }); return; }
      if (d.tog) { commit(() => { C.look[d.tog] = !C.look[d.tog]; }); return; }
      if (d.class) {
        // a ruha szabása és a fegyver kasztonként más: kasztváltáskor ezek zárolása feloldódik (szólunk is róla)
        const had = ['ruha', 'fegyver'].filter(x => C.locks.has(x));
        commit(() => { C.classId = d.class; C.look = classLook(C.look, d.class); had.forEach(x => C.locks.delete(x)); C.ideas = null; });
        if (had.length && d.class) toast('Új kaszt, új szabás és fegyver: az öltözet és a fegyver zárolását feloldottam.');
        return;
      }
      if (d.idea != null && C.ideas && C.ideas[+d.idea]) { const x = C.ideas[+d.idea]; commit(() => { C.look = Object.assign({}, x.look); if (!RESTYLE) { C.people = x.people; C.name = x.name; } }); return; }
      if (d.people) { commit(() => { C.people = d.people; Object.assign(C.look, PEOPLE[d.people]); }); return; }
      if (d.origin) { C.origin = d.origin; syncBody(); return; }
      if (d.trait) { C.trait = d.trait; syncBody(); return; }
      if (d.scene) { C.scene = d.scene; renderScene(); closeBg(true); return; }
      if (d.zoom) { setZoom(d.zoom); return; }
      if (d.view) { stopMotion(); turnTo(viewTarget(d.view)); return; }
      if (d.pose) { stagePose(d.pose); return; }
      switch (d.act) {
        case 'undo': undo(); break;
        case 'redo': redo(); break;
        case 'random': randomizeAll(); break;
        case 'lockstep': { const id = C.step; if (C.locks.has(id)) C.locks.delete(id); else C.locks.add(id); C.ideas = null; updateChrome(); if (id === 'alap') syncBody(); break; }
        case 'ideas': newIdeas(); { const el = $('#cideas'); if (el) el.innerHTML = ideasHtml(); } break;
        case 'reset': resetLook(); break;
        case 'randstep': randomizeStep(); break;
        case 'namegen': commit(() => { C.name = randomName(C.look.sex, C.name); }, { noPop: true }); break;
        case 'bg': if ($('#cbgpop').hidden) openBg(); else closeBg(); break;
        case 'prev': goStep(STEPS[Math.max(0, STEP[C.step].i - 1)].id); break;
        case 'next': goStep(STEPS[Math.min(STEPS.length - 1, STEP[C.step].i + 1)].id); break;
        case 'done': finish(); break;
        case 'cancel': if (O.onCancel) O.onCancel(); break;
      }
    });
    const panel = $('#cpanel');
    panel.addEventListener('pointerover', e => { if (e.pointerType === 'touch') return; const el = e.target.closest('[data-pv]'); if (el && panel.contains(el)) setPreview(el); });
    panel.addEventListener('pointerout', e => { if (e.pointerType === 'touch') return; const el = e.target.closest('[data-pv]'); if (!el || (e.relatedTarget && el.contains(e.relatedTarget))) return; clearPreviewSoon(); });
    panel.addEventListener('focusin', e => { const el = e.target.closest('[data-pv]'); if (el && el.matches(':focus-visible')) setPreview(el); });
    panel.addEventListener('focusout', e => { if (e.target.closest('[data-pv]')) clearPreviewSoon(); });
    panel.addEventListener('input', e => {
      const t = e.target;
      if (t.dataset.cust) { clearTimeout(pvTimer); const v = variant(t.dataset.cust, t.value); C.preview = { cls: v.cls, look: v.look }; pvLabel = 'saját szín'; scheduleFigure(); updateNote(); }
      if (t.id === 'cmotto') { C.motto = t.value.slice(0, 40); $('#cmottocount').textContent = `${t.value.length}/40`; }
      if (t.id === 'cname') { C.name = t.value; t.removeAttribute('aria-invalid'); { const hl = $('#cnamehelp'); if (hl && hl.classList.contains('err')) { hl.classList.remove('err'); hl.textContent = NAME_HINT; } } $('#cnamecount').textContent = `${t.value.length}/16`; updateStageText(); }
    });
    panel.addEventListener('change', e => {
      const t = e.target;
      if (t.dataset.cust) { const k = t.dataset.cust, v = t.value; C.preview = null; commit(() => { C.look[k] = v; }); }
      if (t.id === 'cname') {
        const v = t.value.trim(); t.value = v; const prev = HIST.lastName != null ? HIST.lastName : C.name;
        C.name = prev; commit(() => { C.name = v; }, { noPop: true }); HIST.lastName = v;
      }
    });
    panel.addEventListener('focusin', e => { if (e.target.id === 'cname') HIST.lastName = C.name; });
    // fülek: nyilakkal lépkedés (automatikus aktiválás)
    $('#csteps').addEventListener('keydown', e => {
      const i = STEP[C.step].i, map = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: STEPS.length - 1 };
      if (!(e.key in map)) return;
      e.preventDefault();
      const j = (map[e.key] + STEPS.length) % STEPS.length;
      goStep(STEPS[j].id); $('#ctab-' + STEPS[j].id).focus({ preventScroll: true });
    });
    document.addEventListener('keydown', e => {
      if (!root.isConnected) return;
      if (e.key === 'Escape' && !$('#cbgpop').hidden) { closeBg(true); return; }
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (typing) return;
      if (t !== document.body && !root.contains(t)) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
    }, { signal: AC.signal });
    document.addEventListener('pointerdown', e => { if (!root.isConnected) return; const pop = $('#cbgpop'); if (!pop.hidden && !pop.contains(e.target) && !$('#cbgbtn').contains(e.target)) closeBg(); }, { signal: AC.signal });
  }
  function initCreator() {
    initStage(); initPanel(); bindStage(); bindCreator();
    updateStageText(); updateNote(); updateHistory(); updateYaw();
    buildBody(false); updateChrome();
    renderFigureNow(); applyZoom(true);
    setTimeout(() => { if (hintOn && HOST.isConnected && $('#cnote')) { hintOn = false; updateNote(); } }, 9000); // a tipp magától is eltűnik, de legközelebb újra megjelenik
  }
  initCreator();
  return {
    destroy() { AC.abort(); if (RO) RO.disconnect(); stopMotion(); HOST.innerHTML = ''; HOST.classList.remove('nxc'); },
    state: () => ({ classId: C.classId, people: C.people, look: Object.assign({}, C.look), name: C.name, origin: C.origin, trait: C.trait, motto: C.motto }),
    toast: toast
  };
  }
  root.NYX.creator = { mount: mount };
})(typeof window !== 'undefined' ? window : globalThis);
