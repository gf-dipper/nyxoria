/* Nyxoria – festett hatású ikonok (tárgyak, képességek, jellemzők, készletek).
   Minden ikon 64×64-es SVG. Stílus: sötét körvonal (#140f26, 2.2), színátmenetes kitöltés felülről-balról jövő fénnyel,
   fehér csillanás, alul árnyék. A tárgyikonoknak nincs háttere (a keretet és a ritkaság színét a CSS adja),
   a képességikonok saját, elemhez illő háttérrel készülnek.
   STÍLUS (ehhez igazodjon minden ikon – minta: js/icons-items.js „kard”, „íj”, „páncéling”; js/icons-skills.js):
   - Zömök, játékos arányok: a fő forma a 64-es dobozból kb. 50–58 egységet foglal el, a legvékonyabb fontos rész is ≥5 egység,
     hogy 24–32 px-en is felismerhető legyen. Kevés, nagy forma; apró részlet csak díszítésnek.
   - Körvonal: k.p() (INK, 2.2); belső vonalak 1–1.4, 0.5–0.7 átlátszósággal.
   - Fény balról-fentről: a lapok bal/felső fele világosabb (k.f(…,'#fff',0.35–0.55)), a jobb/alsó sötétebb (k.f(…, sötét, 0.25–0.35)).
   - Anyagok: k.mat('steel'|'silver'|'gold'|'bronze'|'wood'|'leather'|'bone'|'dark'| tetszőleges szín, irány 'h'|'v').
   - Tárgyikon: nincs háttér, alul k.shadow(); fegyver jellemzően átlósan (rotate 45) vagy függőlegesen.
   - Képességikon: k.bg(elem) teljes háttér (phys, fire, frost, arcane, holy, nature, shadow, poison, spirit, music, moon, hunt),
     közepén egy erős, felismerhető motívum ragyogással (k.glow) és 1–3 csillogással (k.spark). Mozgást ívelt fénycsíkkal jelezz.
   - Semmi szöveg, semmi márkajel. Minden azonosító a k-ból jön (ütközésmentes).
   Regisztráció: NYX.icons.def('item', 'kard', k => '...'), NYX.icons.def('skill', 'kardcsapas', k => '...').
   A k (készlet) a rajzoló segédfüggvényeit adja; minden színátmenet-azonosító ikononként egyedi. */
(function (root) {
  'use strict';
  const NYX = root.NYX = root.NYX || {};
  const REG = { item: {}, skill: {}, misc: {} };
  let UID = 0;
  const INK = '#140f26';

  // ---------- színek ----------
  const hx = c => { c = c.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join(''); return [0, 2, 4].map(i => parseInt(c.substr(i, 2), 16)); };
  const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = hx(a), y = hx(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
  const lighten = (c, t) => mix(c, '#ffffff', t), darken = (c, t) => mix(c, INK, t);

  // anyagok: [csúcsfény, alap, árnyék]
  const MAT = {
    steel: ['#f6f8ff', '#b8c2de', '#5d6688'], silver: ['#ffffff', '#d4dcf2', '#7c86aa'], dark: ['#8a90b0', '#4a4f6e', '#1e2138'],
    gold: ['#fff4c2', '#e8b44c', '#8c5714'], bronze: ['#ffd8a8', '#c9844a', '#6e3a18'], copper: ['#ffc9a8', '#d07a4e', '#7a3418'],
    wood: ['#e6ad72', '#a8693a', '#55301a'], darkwood: ['#b07a50', '#6e4228', '#2e180c'], leather: ['#d6995e', '#8f5a32', '#4a2a14'],
    bone: ['#fffbea', '#e6dcbc', '#9a8a68'], cloth: null
  };
  const ELEM = { // képességek háttere: [középső fény, alap, perem]
    phys: ['#ffb08a', '#8a2f3a', '#2a0c18'], fire: ['#ffe08a', '#d8582a', '#3a0c10'], frost: ['#e2fbff', '#3a9ad0', '#0a1a3e'],
    arcane: ['#d8d0ff', '#5a4ad8', '#140c3e'], holy: ['#fff6c8', '#d8a838', '#3a2408'], nature: ['#d6ffb0', '#3f9a4a', '#0a2a14'],
    shadow: ['#d2a8ff', '#4a2a7a', '#0e0620'], poison: ['#e8ffa0', '#5aa82a', '#0e2408'], spirit: ['#c8fff4', '#2a9a96', '#06222a'],
    music: ['#ffd0ec', '#c0408a', '#2e0a24'], moon: ['#f0f4ff', '#6a7ad8', '#101848'], hunt: ['#e8ffc0', '#6a8a3a', '#1a2410']
  };

  // a gyorsítótárban az azonosítók helyén jelölő áll; minden kirajzoláskor friss előtag kerül a helyére,
  // így egy rejtett (display:none) példány sem „viszi el” a színátmenetet a többi elől
  const IDTOK = '@@NXI@@';
  function kit() {
    const id = IDTOK;
    let n = 0;
    const defs = [];
    const k = {
      id, INK, MAT, ELEM, mix, lighten, darken,
      // lineáris színátmenet (alapból balról-fentről jobbra-le), visszaadja: url(#…)
      lg(stops, x1 = 0, y1 = 0, x2 = 1, y2 = 1) {
        const g = `${id}g${n++}`;
        defs.push(`<linearGradient id="${g}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`);
        return `url(#${g})`;
      },
      rg(stops, cx = 0.5, cy = 0.5, r = 0.5, fx, fy) {
        const g = `${id}g${n++}`;
        defs.push(`<radialGradient id="${g}" cx="${cx}" cy="${cy}" r="${r}"${fx != null ? ` fx="${fx}" fy="${fy}"` : ''}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`);
        return `url(#${g})`;
      },
      // anyag-színátmenet: m = MAT kulcs vagy [fény, alap, árnyék] vagy egy szín
      mat(m, dir) {
        const c = Array.isArray(m) ? m : MAT[m] || [lighten(m, 0.45), m, darken(m, 0.5)];
        const [x1, y1, x2, y2] = dir === 'h' ? [0, 0, 1, 0] : dir === 'v' ? [0, 0, 0, 1] : [0.15, 0, 0.85, 1];
        return k.lg([[0, c[0]], [0.45, c[1]], [1, c[2]]], x1, y1, x2, y2);
      },
      // körvonalas alakzat
      p(d, fill, o = {}) { return `<path d="${d}" fill="${fill}" stroke="${o.stroke || INK}" stroke-width="${o.sw == null ? 2.2 : o.sw}" stroke-linejoin="round" stroke-linecap="round"${o.op != null ? ` opacity="${o.op}"` : ''}${o.extra || ''}/>`; },
      // körvonal nélküli kitöltés (csillanás, árnyék)
      f(d, fill, op = 1) { return `<path d="${d}" fill="${fill}"${op !== 1 ? ` opacity="${op}"` : ''}/>`; },
      // vonal
      s(d, color, w = 2, op = 1) { return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op !== 1 ? ` opacity="${op}"` : ''}/>`; },
      c(cx, cy, r, fill, o = {}) { return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${o.noStroke ? '' : ` stroke="${o.stroke || INK}" stroke-width="${o.sw == null ? 2.2 : o.sw}"`}${o.op != null ? ` opacity="${o.op}"` : ''}/>`; },
      // fehér csillanás
      hl(d, op = 0.55) { return `<path d="${d}" fill="#ffffff" opacity="${op}"/>`; },
      // drágakő (kerek, csiszolt)
      gem(cx, cy, r, color) {
        const g = k.rg([[0, lighten(color, 0.75)], [0.45, color], [1, darken(color, 0.55)]], 0.38, 0.32, 0.7);
        return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${g}" stroke="${INK}" stroke-width="${Math.min(2.2, r * 0.45)}"/>` +
          `<path d="M${cx - r * 0.55} ${cy - r * 0.1} Q${cx - r * 0.45} ${cy - r * 0.6} ${cx} ${cy - r * 0.62}" fill="none" stroke="#fff" stroke-width="${Math.max(0.8, r * 0.28)}" stroke-linecap="round" opacity="0.85"/>`;
      },
      // ragyogás (körvonal nélküli fényfolt)
      glow(cx, cy, r, color, op = 0.8) { return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${k.rg([[0, color, op], [0.4, color, op * 0.45], [1, color, 0]])}"/>`; },
      // négyágú csillogás
      spark(x, y, r, color = '#ffffff', op = 1) { return `<path d="M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r} Z" fill="${color}" opacity="${op}"/>`; },
      // tárgy alatti puha árnyék
      shadow(cx = 32, cy = 57, rx = 16, ry = 3.5) { return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity="0.28"/>`; },
      // képesség-háttér: elemhez illő sugaras fény + finom sugarak + belső perem
      bg(elem, o = {}) {
        const e = Array.isArray(elem) ? elem : ELEM[elem] || ELEM.arcane;
        const g = k.rg([[0, e[0]], [0.42, e[1]], [1, e[2]]], o.cx || 0.5, o.cy || 0.42, 0.75);
        const rays = o.rays === false ? '' : `<g opacity="0.16" fill="${e[0]}">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => `<path d="M32 27 L${32 + 60 * Math.cos((i * 30 - 4) * Math.PI / 180)} ${27 + 60 * Math.sin((i * 30 - 4) * Math.PI / 180)} L${32 + 60 * Math.cos((i * 30 + 4) * Math.PI / 180)} ${27 + 60 * Math.sin((i * 30 + 4) * Math.PI / 180)} Z"/>`).join('')}</g>`;
        const vig = k.rg([[0.6, '#000', 0], [1, '#000', 0.45]], 0.5, 0.5, 0.72);
        return `<rect x="0" y="0" width="64" height="64" fill="${g}"/>${rays}<rect x="0" y="0" width="64" height="64" fill="${vig}"/>`;
      },
      defs() { return defs.length ? `<defs>${defs.join('')}</defs>` : ''; }
    };
    return k;
  }

  function def(kind, key, draw) { REG[kind][key] = draw; }
  function has(kind, key) { return !!REG[kind][key]; }
  const CACHE = new Map();
  function svg(kind, key, o) {
    o = o || {};
    const ck = kind + '|' + key;
    let body = CACHE.get(ck);
    if (body == null) {
      const draw = REG[kind][key];
      if (!draw) return '';
      const k = kit();
      const inner = draw(k);
      body = k.defs() + inner;
      CACHE.set(ck, body);
    }
    const cls = 'nxi nxi-' + kind + (o.cls ? ' ' + o.cls : '');
    const fresh = 'ni' + (++UID).toString(36);
    return `<svg class="${cls}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${body.split(IDTOK).join(fresh)}</svg>`;
  }

  // tárgy → ikonkulcs: a név végén álló főnév (pl. „Viharvert páncéling” → páncéling); mitikus tárgyak saját ikonnal
  function itemKey(item) {
    const D = NYX.data;
    if (!item) return null;
    // mitikus: a saját ikonja, ha a helye illik a nevéhez (régebbi mentésben más helyen is lehet: ott a hely ikonja)
    if (item.mythic && D && D.MYTHIC_NAMES) { const i = D.MYTHIC_NAMES.indexOf(item.name); if (i >= 0 && REG.item['mitikus' + i] && (!D.MYTHIC_SLOTS || D.MYTHIC_SLOTS[i] === item.slot)) return 'mitikus' + i; if (i >= 0 && REG.item['slot-' + item.slot]) return 'slot-' + item.slot; }
    const nm = String(item.name || '').toLowerCase();
    if (item.slot === 'fegyver' && nm.endsWith('agyarnyaklánc') && REG.item['agyarbuzogány']) return 'agyarbuzogány'; // régi név
    let nouns = [];
    if (D && D.ITEM_NAMES) {
      if (item.slot === 'fegyver') Object.keys(D.ITEM_NAMES.fegyver).forEach(t => { nouns = nouns.concat(D.ITEM_NAMES.fegyver[t]); });
      else nouns = (D.ITEM_NAMES[item.slot] || []).slice();
    }
    nouns.sort((a, b) => b.length - a.length);
    const hit = nouns.find(w => nm.endsWith(' ' + w) || nm.endsWith('-' + w) || nm === w);
    if (hit && REG.item[hit]) return hit;
    return REG.item['slot-' + item.slot] ? 'slot-' + item.slot : null;
  }
  function item(it, o) { const key = itemKey(it); return key ? svg('item', key, o) : ''; }
  function skill(id, o) { return svg('skill', id, o); }
  function misc(id, o) { return svg('misc', id, o); }

  NYX.icons = { def, has, svg, item, itemKey, skill, misc, REG, kit, _clear: () => CACHE.clear() };
})(typeof window !== 'undefined' ? window : globalThis);
