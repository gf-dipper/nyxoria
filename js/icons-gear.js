/* Nyxoria – ikonok (gear): páncélok, fejfedők, gyűrűk, amulettek, mitikus tárgyak, foglalat-tartalékok.
   A rajzolás szabályai a js/icons.js fejlécében; minta: js/icons-items.js. */
(function (root) {
  'use strict';
  const I = root.NYX.icons;

  // ---------- segédek ----------
  const r1 = v => Math.round(v * 100) / 100;
  // ellipszis útvonalként (evenodd lyukakhoz)
  const E = (cx, cy, rx, ry) => `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
  // ötágú csillag
  const star = (cx, cy, r, inner = 0.45, rot = -90) => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = (rot + i * 36) * Math.PI / 180, rr = i % 2 ? r * inner : r;
      d += (i ? 'L' : 'M') + r1(cx + rr * Math.cos(a)) + ' ' + r1(cy + rr * Math.sin(a));
    }
    return d + 'Z';
  };
  // pontok egy másodfokú Bézier-görbén
  const qpts = (x0, y0, cx, cy, x1, y1, n) => {
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1), u = 1 - t;
      out.push([r1(u * u * x0 + 2 * u * t * cx + t * t * x1), r1(u * u * y0 + 2 * u * t * cy + t * t * y1)]);
    }
    return out;
  };
  // lánc: apró, váltakozó szemek egy görbén
  const chain = (k, x0, y0, cx, cy, x1, y1, n, col = 'silver') => {
    const m = k.mat(col);
    return k.s(`M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}`, k.INK, 2.6, 0.9) + k.s(`M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}`, k.MAT[col][1], 1.2) + qpts(x0, y0, cx, cy, x1, y1, n).map(([x, y], i) =>
      `<ellipse cx="${x}" cy="${y}" rx="${i % 2 ? 1.6 : 2.3}" ry="${i % 2 ? 2.3 : 1.6}" fill="${m}" stroke="${k.INK}" stroke-width="1.3"/>`).join('');
  };
  // vastag karika (gyűrűkhöz): sötét körvonal + anyagszín
  const band = (k, cx, cy, rx, ry, w, fill) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${k.INK}" stroke-width="${w + 3.6}"/>` +
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${fill}" stroke-width="${w}"/>`;
  // mitikus aura: lila és arany ragyogás
  const aura = (k, cx = 32, cy = 31) => k.glow(cx, cy, 31, '#a86bff', 0.85) + k.glow(cx, cy, 19, '#ffd77a', 0.55);

  // =============== PÁNCÉLOK ===============

  // köpeny: hátulról látott, vállról lelógó, kiterülő mélybordó köpeny – két vállcsat lánccal, sötét nyakkivágás,
  // redők, hullámos alsó szegély arany díszcsíkkal, a jobb alsó sarka kifordul (arany bélés látszik); nincs csuklya
  I.def('item', 'köpeny', k => {
    const body = 'M19 9.6 Q32 12.6 45 9.6 C51 22 54 34 58 47 Q53 54 46 54 Q39 58.4 32 55.6 Q25 58.4 18.6 54.6 Q11.6 57.6 5.4 52.6 C9.6 38 13 22 19 9.6 Z';
    return k.shadow(32, 58, 25, 3.2) +
      k.p(body, k.mat(['#f08a96', '#a8202e', '#3e0612'])) +
      k.f('M18.4 14 C14 26 11 39 8.2 51 Q12 53.6 16 52.6 C17.6 40 20 28 24 16 Z', '#fff', 0.22) +
      k.f('M45.6 14 C49 24 51.6 34 54.6 45 L48 50 C46.4 40 44 28 40.4 16 Z', '#2a0008', 0.35) +
      // redők
      k.s('M25 16 Q21 34 19 54 M32 16 L32 55 M39 16 Q43 34 45.4 53', k.INK, 1.4, 0.45) +
      k.s('M26.4 18 Q23 34 21.2 51', '#ffb0b8', 1.1, 0.35) +
      // alsó arany szegély
      k.s('M6.4 51.4 Q12.4 56.2 18.6 52.6 Q25 56.8 32 53.6 Q39 56.6 46 52', '#e8b44c', 2.2, 0.95) +
      // kifordult sarok (bélés)
      k.p('M46 54 Q53 54.6 60 49 C56.6 44 54 39 51 32 C51.4 42 49.4 49 46 54 Z', k.mat(['#fff4c2', '#e8b44c', '#8c5714'], 'h'), { sw: 2 }) +
      // nyakkivágás
      k.p('M19 9.6 Q32 4.6 45 9.6 Q32 15.6 19 9.6 Z', k.lg([[0, '#3a0610'], [1, '#12020a']], 0, 0, 0, 1), { sw: 2 }) +
      // lánc + vállcsatok
      k.s('M20 11.4 Q32 18.6 44 11.4', k.INK, 3.6) + k.s('M20 11.4 Q32 18.6 44 11.4', '#ffe08a', 1.6) +
      k.c(19.5, 11.5, 5, k.mat('gold')) + k.gem(19.5, 11.5, 2.6, '#4ad0ff') +
      k.c(44.5, 11.5, 5, k.mat('gold')) + k.gem(44.5, 11.5, 2.6, '#4ad0ff') +
      k.spark(13, 30, 2.6);
  });

  // mellvért: acél vért vállvasakkal, középgerinc, arany szegély
  I.def('item', 'mellvért', k => {
    return k.shadow(32, 58, 18, 3) +
      // vért
      k.p('M19 11 L26 9 Q32 15 38 9 L45 11 Q49 17 48 23 L47 44 Q46 52 32 56 Q18 52 17 44 L16 23 Q15 17 19 11 Z', k.mat('steel')) +
      k.f('M32 14 Q28 13 26 10.5 L20 12.5 Q17 17 18 23 L19 44 Q20 50 32 54 Z', '#fff', 0.32) +
      k.f('M32 14 Q36 13 38 10.5 L44 12.5 Q47 17 46 23 L45 44 Q44 50 32 54 Z', '#3a4266', 0.3) +
      k.s('M32 14 L32 53', k.INK, 1.3, 0.6) + k.s('M31 16 L31 51', '#fff', 1, 0.7) +
      // mellvonal
      k.s('M19 30 Q25 34 32 30 Q39 34 45 30', k.INK, 1.3, 0.55) +
      // öv-lemezek
      k.p('M18 42 Q32 47 46 42 L46.6 46 Q32 52 17.4 46 Z', k.mat('gold', 'v'), { sw: 1.8 }) +
      // vállvasak
      k.p('M6 22 Q6 10 19 9 L22 19 Q13 19 10 26 Q6 26 6 22 Z', k.mat('steel'), { sw: 2 }) +
      k.p('M58 22 Q58 10 45 9 L42 19 Q51 19 54 26 Q58 26 58 22 Z', k.mat('steel'), { sw: 2 }) +
      k.hl('M9 19 Q10 13 17 11 L18 14 Q12 15 11 20 Z', 0.6) +
      k.s('M8 21 Q11 15 20 14', k.INK, 1, 0.45) + k.s('M56 21 Q53 15 44 14', k.INK, 1, 0.45) +
      // nyakszegély
      k.p('M25.5 8.6 Q32 16 38.5 8.6', 'none', { sw: 4 }) + k.s('M25.5 8.6 Q32 16 38.5 8.6', '#e8b44c', 2) +
      [[22, 24], [42, 24], [22, 38], [42, 38]].map(([x, y]) => k.c(x, y, 1.5, k.mat('gold'), { sw: 1 })).join('') +
      k.spark(24, 20, 2.6);
  });

  // köntös: csillagmintás lila varázslóköntös, bő ujjak, arany öv
  I.def('item', 'köntös', k => {
    const stars = [[24, 20, 2.2], [40, 22, 2], [28, 42, 2.4], [40, 46, 2.2], [22, 52, 1.8], [10, 32, 1.8], [54, 32, 1.8], [35, 36, 1.6]];
    return k.shadow(32, 58, 22, 3.2) +
      k.p('M24 6 Q32 13 40 6 L48 9 Q56 18 61 34 L51 39 L45 28 L50 55 Q32 59 14 55 L19 28 L13 39 L3 34 Q8 18 16 9 Z', k.mat(['#c79cff', '#6a38c0', '#24104e'])) +
      k.f('M24 7 L16 10 Q9 18 5 33 L12 36 L19 27 L15 54 Q20 55.5 24 56 L27 20 Z', '#fff', 0.2) +
      k.f('M45.4 27 L49.6 54.6 Q47 55.6 44 56.2 L42.6 30 Z', '#14082e', 0.3) +
      // ujjak szegélye
      k.p('M3 34 L13 39 L14.6 36 L4.6 31 Z', k.mat('gold'), { sw: 1.6 }) + k.p('M61 34 L51 39 L49.4 36 L59.4 31 Z', k.mat('gold'), { sw: 1.6 }) +
      // csillagok
      stars.map(([x, y, r]) => k.f(star(x, y, r), '#ffe08a', 0.9)).join('') +
      // V-nyak, középszegély
      k.p('M24 6 Q32 13 40 6 L37 8 L32 22 L27 8 Z', k.mat('gold'), { sw: 1.6 }) +
      k.s('M32 22 L32 56', '#e8b44c', 2.6) + k.s('M32 22 L32 56', k.INK, 0.9, 0.5) +
      // öv
      k.p('M18.6 30 Q32 34 45.4 30 L46 35 Q32 39 18 35 Z', k.mat('gold', 'v'), { sw: 1.8 }) +
      k.gem(32, 34, 3, '#4ad0ff') +
      k.p('M14 55 Q32 59 50 55 L49.4 51.6 Q32 55.6 14.6 51.6 Z', k.mat('gold', 'v'), { sw: 1.6 }) +
      k.spark(46, 16, 3);
  });

  // zeke: bőr tunika rövid ujjal, fűzővel, övvel
  I.def('item', 'zeke', k => {
    let lace = '';
    for (let y = 20; y <= 36; y += 5) lace += k.s(`M29 ${y} L35 ${y + 4} M35 ${y} L29 ${y + 4}`, '#f3e2b8', 1.5);
    return k.shadow(32, 58, 19, 3) +
      k.p('M22 7 L27 6 Q32 13 37 6 L42 7 L55 16 L50 28 L46 25 L48 52 Q32 57 16 52 L18 25 L14 28 L9 16 Z', k.mat('leather')) +
      k.f('M27 6.6 L22 7.6 L10.6 16 L14.4 25.6 L18.6 23 L17 51 Q21 52.6 25 53.4 L28 14 Z', '#fff', 0.2) +
      k.f('M42 7.6 L53.4 16 L50 26 L46 23.6 L47 51 Q43 52.6 39 53.4 L38 18 Z', '#2a1408', 0.28) +
      // varrás
      k.s('M12 17 L22 10 M52 17 L42 10', '#f3d8a8', 1, 0.6) + k.s('M19 49 Q32 53 45 49', '#f3d8a8', 1, 0.55) +
      // nyílás és fűző
      k.p('M27 6 Q32 13 37 6 L35 40 L29 40 Z', '#3a200e', { sw: 1.6 }) +
      lace + [20, 25, 30, 35, 40].map(y => k.c(29, y, 0.9, '#e8b44c', { sw: 0.6 }) + k.c(35, y, 0.9, '#e8b44c', { sw: 0.6 })).join('') +
      // öv
      k.p('M17.4 40 Q32 44 46.6 40 L47 46 Q32 50 17 46 Z', k.mat('darkwood', 'v'), { sw: 1.8 }) +
      k.p('M28 40.8 L36 40.8 L36 47.4 L28 47.4 Z', 'none', { stroke: '#e8b44c', sw: 2 }) +
      k.p('M28 40.8 L36 40.8 L36 47.4 L28 47.4 Z', 'none', { sw: 0.8 });
  });

  // =============== FEJFEDŐK ===============

  // csuklya: zöld vándorcsuklya hátracsapott csúccsal, vállgallérral
  I.def('item', 'csuklya', k => {
    return k.shadow(32, 58, 20, 3) +
      // csúcs hátul
      k.p('M40 8 Q50 4 59 9 Q52 12 48 18 Z', k.mat(['#9ad88a', '#3f7a3e', '#163018']), { sw: 2 }) +
      // gallér
      k.p('M10 42 Q14 34 22 34 L42 34 Q50 34 54 42 L57 52 Q44 57 32 54 Q20 57 7 52 Z', k.mat(['#8ac87a', '#356a34', '#122812'])) +
      k.s('M18 45 L16 53 M32 46 L32 54 M46 45 L48 53', k.INK, 1.1, 0.5) +
      // fejrész
      k.p('M32 5 C46 5 52 16 50 30 L49 44 Q32 50 15 44 L14 30 C12 16 18 5 32 5 Z', k.mat(['#a4e092', '#4a8a46', '#183418'])) +
      k.f('M31 7 C21 8 16 16 17 28 L18 42 Q21 43.4 24 44 L22 28 C21 18 25 11 31 7 Z', '#fff', 0.25) +
      k.f('M45 12 C49 18 50 26 48.6 32 L47.6 43 Q44 44.6 41 45 L44 30 Z', '#0a1a0a', 0.3) +
      // arcnyílás
      k.p('M32 13 C40 13 44 21 43 30 C42 38 36 42 32 42 C28 42 22 38 21 30 C20 21 24 13 32 13 Z', k.rg([[0, '#1c2a24'], [1, '#04080a']], 0.5, 0.4, 0.7), { sw: 1.8 }) +
      k.s('M23 22 Q32 10 41 22', '#c8f0b0', 1.4, 0.55) +
      // két csillogó szem a sötétben
      k.c(28, 30, 1.6, '#ffe08a', { noStroke: true }) + k.c(36, 30, 1.6, '#ffe08a', { noStroke: true }) +
      // szegély-varrás
      k.s('M15 44 Q32 50 49 44', '#d8c08a', 1.2, 0.7);
  });

  // sisak: zárt lovagsisak rostéllyal, piros forgóval
  I.def('item', 'sisak', k => {
    let holes = '';
    for (const y of [42, 46]) for (const x of [38, 41.5, 45]) holes += k.c(x, y, 0.9, '#140f26', { noStroke: true, op: 0.75 });
    return k.shadow(32, 58, 18, 3) +
      // forgó (toll)
      k.p('M30 12 C28 2 44 -1 56 8 C50 7 50 10 54 14 C46 12 44 15 46 19 C40 15 36 16 34 18 Z', k.mat(['#ff9a8a', '#d0303c', '#5a0c18']), { sw: 2 }) +
      k.s('M33 15 C38 8 46 6 53 8', '#ffd0c8', 1.1, 0.7) +
      // sisaktest
      k.p('M13 32 C13 16 21 9 32 9 C43 9 51 16 51 32 L51 47 Q51 55 43 55 L21 55 Q13 55 13 47 Z', k.mat('steel')) +
      k.f('M31 10.6 C22 11 15 17 15 32 L15 47 Q15 52 20 53 L22 30 Q22 18 31 10.6 Z', '#fff', 0.38) +
      k.f('M41 13 Q49 19 49 32 L49 47 Q49 53 43 53.4 L42 30 Z', '#3a4266', 0.3) +
      // középgerinc
      k.p('M30 10 L34 10 L34 25 L30 25 Z', k.mat('steel', 'h'), { sw: 1.6 }) +
      // szemrés
      k.p('M15 27 L49 27 L49 34 L15 34 Z', '#0e0c1e', { sw: 2 }) +
      k.f('M17 29 L47 29 L47 30.6 L17 30.6 Z', '#6a7ad8', 0.35) +
      k.s('M32 27 L32 34', k.INK, 1.6) +
      // rostély-perem és szellőzők
      k.p('M14 35 L50 35 L50 38 L14 38 Z', k.mat('gold', 'v'), { sw: 1.6 }) +
      holes + k.s('M32 38 L32 54', k.INK, 1.2, 0.55) +
      [[18, 43], [18, 50]].map(([x, y]) => k.c(x, y, 1.3, k.mat('gold'), { sw: 0.9 })).join('') +
      k.spark(22, 18, 2.8);
  });

  // fejpánt: vékony ezüst diadém 3/4-es nézetben (ferde ellipszis), elöl kis csúcsos foglalat egyetlen kővel
  I.def('item', 'fejpánt', k => {
    const back = 'M7.5 36 C7.5 24 18 19 32 19 C46 19 56.5 24 56.5 36';
    const front = 'M7.5 36 C7.5 46 18 51 32 51 C46 51 56.5 46 56.5 36';
    return k.shadow(32, 57, 22, 3) +
      // hátsó ív (sötétebb, vékonyabb)
      k.s(back, k.INK, 7.6) + k.s(back, k.mat(['#9aa2c4', '#5d6688', '#2e3456'], 'v'), 3.8) +
      // elülső ív
      k.s(front, k.INK, 9) + k.s(front, k.mat('silver', 'v'), 5.2) +
      k.s('M10.6 40.6 Q16 47.6 26 49.4', '#fff', 1.4, 0.85) +
      k.s('M14 44.6 L14 47.4 M50 44.6 L50 47.4', k.INK, 1, 0.4) +
      // csúcsos homlokdísz
      k.p('M22 50.6 Q26.6 40 32 27 Q37.4 40 42 50.6 Q32 54.6 22 50.6 Z', k.mat('silver')) +
      k.f('M32 30 Q28 40 24.4 49.6 L32 50.6 Z', '#fff', 0.4) +
      k.gem(32, 44.4, 5.4, '#3ad0c0') +
      k.c(32, 31.6, 1.6, '#ffffff', { sw: 0.9 }) +
      k.spark(42, 28, 3.2);
  });

  // kalap: hegyes, megtört csúcsú varázslósüveg széles karimával, arany csillaggal
  I.def('item', 'kalap', k => {
    return k.shadow(32, 58, 24, 3) +
      // karima
      k.p(E(32, 49, 29, 8), k.mat(['#8a9cff', '#2e3ea8', '#0e1450'])) +
      k.f('M5 48 Q12 41.6 30 41.4 L30 44 Q14 44.4 8 50 Z', '#fff', 0.28) +
      // kúp
      k.p('M17 47 L28 18 Q31 8 40 6 Q49 5 55 13 Q48 11 44 14 Q40 17 41 24 L47 47 Q32 52 17 47 Z', k.mat(['#9aa8ff', '#3446b8', '#10165a'])) +
      k.f('M28 18 Q31 9 39 7 Q34 11 32 18 L24 46 Q20.6 45.6 18.4 46 Z', '#fff', 0.3) +
      k.f('M41 24 L47 47 Q44 48.4 40 49 L37 26 Z', '#080c30', 0.35) +
      // szalag
      k.p('M19.6 39.4 Q32 44 44.6 39.4 L46.6 46.4 Q32 51.4 17.4 46.4 Z', k.mat(['#ffb0c0', '#c03860', '#4a0c22'], 'v'), { sw: 1.8 }) +
      // csillag
      k.p(star(32, 31, 7.4, 0.48), k.mat('gold'), { sw: 1.8 }) +
      k.c(55, 13.4, 2.6, k.mat('gold'), { sw: 1.4 }) +
      k.spark(28, 26, 2.4) + k.spark(50, 24, 2.2, '#ffe9a8');
  });

  // korona: arany korona öt ággal, gyöngyökkel, kövekkel
  I.def('item', 'korona', k => {
    const gold = k.mat('gold');
    return k.shadow(32, 58, 22, 3) +
      k.p('M9 46 L6 16 L19 28 L25 10 L32 24 L39 10 L45 28 L58 16 L55 46 Z', gold) +
      k.f('M8.6 19.6 L18.4 30 L24.6 13.6 L28 22 L22 42 L10.6 42 Z', '#fff', 0.35) +
      k.f('M45 28 L56 18.6 L53.6 42 L44 42 Z', '#6a3a08', 0.25) +
      // pánt
      k.p('M8 40 Q32 46 56 40 L56 50 Q32 56 8 50 Z', k.mat('gold', 'v')) +
      k.s('M10 43 Q32 48.6 54 43', '#fff6d0', 1.2, 0.7) +
      // gyöngyök a csúcsokon
      [[6, 15], [25, 9], [39, 9], [58, 15]].map(([x, y]) => k.c(x, y, 3, k.mat('bone'), { sw: 1.6 })).join('') +
      // kövek
      k.gem(32, 48.5, 4.2, '#e04a5a') + k.gem(18, 47.2, 3, '#4a8aff') + k.gem(46, 47.2, 3, '#4a8aff') +
      k.gem(32, 31, 3.6, '#3ad08a') +
      k.spark(16, 22, 3);
  });

  // =============== GYŰRŰK ===============

  // pecsétgyűrű: arany karika, lapos sötétkék pecsétlap ezüst holddal
  I.def('item', 'pecsétgyűrű', k => {
    return k.shadow(32, 57, 15, 3) +
      band(k, 32, 40, 15.4, 13, 6.2, k.mat('gold')) +
      k.s('M19 40 Q19 33 24 30', '#fff8d8', 1.6, 0.8) +
      // pecsétlap vastagsága
      k.p(E(32, 26, 17, 10.6), k.mat(['#e8b44c', '#a8691c', '#5a3008'], 'v')) +
      // pecsétlap
      k.p(E(32, 22.4, 17, 10.6), k.mat('gold')) +
      k.p(E(32, 22, 13, 7.6), k.rg([[0, '#4a62c8'], [0.6, '#1c2a78'], [1, '#0a1040']], 0.4, 0.35, 0.7), { sw: 1.6 }) +
      // vésett hold
      k.p('M34 16.4 A6 6 0 1 0 34 27.6 A4.6 4.6 0 1 1 34 16.4 Z', k.mat('silver'), { sw: 1.2 }) +
      k.f(star(38.6, 19.4, 1.8), '#fff', 0.9) +
      k.s('M17.6 20 Q21 13.4 30 12.4', '#fff8d8', 1.4, 0.8);
  });

  // karika: vastag, sima ezüst gyűrű vésett rúnákkal
  I.def('item', 'karika', k => {
    const runes = 'M17.4 40 L19.4 46 L21.4 40 M25 43 L25 50 M25 45 L28 43 M31.4 44 L31.4 51 L34.4 49 M38.6 43 L40.4 49 M40.4 43 L38.6 49 M44.4 40 L44.4 46 L47 44';
    return k.shadow(32, 57, 20, 3.2) +
      // a gyűrű teste: külső ellipszis, belső (feljebb tolt) lyuk
      k.p(E(32, 36, 23, 18) + E(32, 31.4, 15.4, 10.4), k.mat('silver'), { extra: ' fill-rule="evenodd"' }) +
      // belső fal (sötétebb, látszik a vastagság)
      k.p('M16.6 31.4 A15.4 10.4 0 0 1 47.4 31.4 A15.4 12.6 0 0 0 16.6 31.4 Z', k.mat(['#a8b2d4', '#6c769c', '#343c60'], 'v'), { sw: 1.2 }) +
      k.f('M10 34 Q11 22 24 19 Q14 24 13.6 35 Z', '#fff', 0.8) +
      k.f('M52 38 Q52 50 36 53.6 Q48 48 50.6 38 Z', '#3a4266', 0.4) +
      // rúnák, kékes izzással
      k.s(runes, '#7ad8ff', 3, 0.35) + k.s(runes, '#1c2a68', 1.4) +
      k.spark(16, 22, 3.2);
  });

  // =============== AMULETTEK ===============

  // amulett: kerek arany medalion láncon, nagy piros kővel
  I.def('item', 'amulett', k => {
    return k.shadow(32, 59, 14, 2.8) +
      chain(k, 10, 4, 14, 22, 27, 27, 7, 'gold') + chain(k, 54, 4, 50, 22, 37, 27, 7, 'gold') +
      k.p('M28 24 L36 24 L35 30 L29 30 Z', k.mat('gold'), { sw: 1.8 }) +
      k.c(32, 42, 15, k.mat('gold')) +
      k.c(32, 42, 11.4, k.mat(['#8c5714', '#e8b44c', '#fff4c2']), { sw: 1.4 }) +
      [0, 60, 120, 180, 240, 300].map(a => { const r = a * Math.PI / 180; return k.c(r1(32 + 13.2 * Math.cos(r)), r1(42 + 13.2 * Math.sin(r)), 1.1, '#fff4c2', { sw: 0.8 }); }).join('') +
      k.gem(32, 42, 8.4, '#e0344a') +
      k.f('M19 36 Q22 29 30 28', 'none') + k.s('M19.4 36 Q22 30 29 28.6', '#fff8d8', 1.4, 0.75) +
      k.spark(38, 36, 3);
  });

  // talizmán: faragott bronz lap bőrzsinóron, szem- és holdjellel
  I.def('item', 'talizmán', k => {
    return k.shadow(32, 59, 13, 2.8) +
      k.s('M12 3 Q16 18 28 21 M52 3 Q48 18 36 21', k.INK, 4) + k.s('M12 3 Q16 18 28 21 M52 3 Q48 18 36 21', '#a8693a', 2) +
      k.c(32, 21, 3.6, 'none', { sw: 2.6 }) + k.c(32, 21, 3.6, 'none', { stroke: '#e6ad72', sw: 1.2 }) +
      // hatszögletű lap
      k.p('M32 24 L47 32 L47 48 L32 57 L17 48 L17 32 Z', k.mat('bronze')) +
      k.f('M32 25.6 L18.4 33 L18.4 47 L32 55 Z', '#fff', 0.22) +
      k.p('M32 28 L43.4 34.4 L43.4 46 L32 52.6 L20.6 46 L20.6 34.4 Z', 'none', { sw: 1, op: 0.55 }) +
      // hold a szem fölött
      k.p('M27 31.6 Q32 36 37 31.6 Q32 34 27 31.6 Z', '#3a1c08', { sw: 1.4 }) +
      // szem
      k.p('M21.6 42 Q32 33 42.4 42 Q32 51 21.6 42 Z', k.mat(['#fff2c8', '#e8c88a', '#a07a44']), { sw: 1.8 }) +
      k.c(32, 42, 4.2, k.rg([[0, '#a8f0ff'], [0.5, '#2a9ac0'], [1, '#0a2a48']], 0.4, 0.35, 0.7), { sw: 1.4 }) +
      k.c(32, 42, 1.6, '#0a0e20', { noStroke: true }) + k.c(30.6, 40.6, 0.9, '#fff', { noStroke: true }) +
      k.spark(22, 30, 2.4, '#ffe0b8');
  });

  // medál: szív alakú ezüst medál vékony láncon, kis kővel
  I.def('item', 'medál', k => {
    const heart = 'M32 28 C36 20 50 20 50 32 C50 42 40 49 32 56 C24 49 14 42 14 32 C14 20 28 20 32 28 Z';
    return k.shadow(32, 59, 13, 2.8) +
      chain(k, 12, 3, 18, 16, 30, 21, 6) + chain(k, 52, 3, 46, 16, 34, 21, 6) +
      k.c(32, 22.6, 2.6, 'none', { sw: 2.8 }) + k.c(32, 22.6, 2.6, 'none', { stroke: '#d4dcf2', sw: 1.4 }) +
      k.p(heart, k.mat('silver')) +
      k.p('M32 32 C35 26 45 26 45 33 C45 40 38 45 32 50 C26 45 19 40 19 33 C19 26 29 26 32 32 Z', 'none', { sw: 1, op: 0.5 }) +
      k.f('M17.4 30 Q18 24 25 23.6 Q20 27 19.4 33 Z', '#fff', 0.9) +
      k.f('M46.6 34 Q46 42 36 50.6 Q43 42 44 34 Z', '#3a4266', 0.35) +
      // zsanér
      k.c(14.6, 34, 1.6, k.mat('silver'), { sw: 1 }) +
      k.gem(32, 38, 4.4, '#ff6aa8') +
      k.spark(42, 28, 2.6);
  });

  // nyaklánc: gyöngysor csepp alakú kék függővel
  I.def('item', 'nyaklánc', k => {
    const pearls = qpts(6, 6, 32, 58, 58, 6, 15);
    return k.shadow(32, 59, 12, 2.6) +
      k.s('M6 6 Q32 58 58 6', k.INK, 1.2, 0.6) +
      pearls.map(([x, y], i) => i === 7 ? '' : k.c(x, y, 3.4, k.rg([[0, '#ffffff'], [0.55, '#ece6f6'], [1, '#9a8ab8']], 0.35, 0.3, 0.7), { sw: 1.4 })).join('') +
      // függő
      k.p('M29 30 L35 30 L34 35 L30 35 Z', k.mat('gold'), { sw: 1.6 }) +
      k.p('M32 34 C38 40 41 45 41 49 C41 54.6 37 58 32 58 C27 58 23 54.6 23 49 C23 45 26 40 32 34 Z', k.rg([[0, '#c8f0ff'], [0.45, '#3a8ae0'], [1, '#0e2060']], 0.38, 0.4, 0.7)) +
      k.s('M27 47 Q27.6 42 31 38.6', '#fff', 1.6, 0.85) +
      k.spark(38, 44, 2.6);
  });

  // =============== MITIKUS ===============

  // Csillagpenge: éjkék, csillagos penge, arany szárnyas keresztvas
  I.def('item', 'mitikus0', k => {
    return aura(k) +
      k.shadow(32, 59, 20, 3.2) +
      `<g transform="rotate(45 32 32)">` +
      k.p('M25.4 10 L32 -1 L38.6 10 L38.6 40 L25.4 40 Z', k.lg([[0, '#9ab0ff'], [0.4, '#3a2a9a'], [1, '#140a40']], 0, 0, 0, 1)) +
      k.f('M32 1 L32 39 L27.2 39 L27.2 10.4 Z', '#c8b8ff', 0.3) +
      k.s('M32 3 L32 38', '#e8e0ff', 1.1, 0.7) +
      k.f(star(29.6, 14, 2.1), '#fff') + k.f(star(34.6, 22, 1.7), '#ffe08a') + k.f(star(29.4, 29, 1.9), '#fff') + k.f(star(34.4, 35, 1.4), '#ffe08a') +
      // szárnyas keresztvas
      k.p('M19 39 Q15.6 35 17 30.6 Q21.6 34.6 25 39 Z', k.mat('gold'), { sw: 1.6 }) + k.p('M45 39 Q48.4 35 47 30.6 Q42.4 34.6 39 39 Z', k.mat('gold'), { sw: 1.6 }) +
      k.p('M18 39 L46 39 C49 39 49 46 46 46 L18 46 C15 46 15 39 18 39 Z', k.mat('gold', 'v')) +
      k.f('M18 40.4 L46 40.4 L46 42 L18 42 Z', '#fff6d0', 0.6) +
      k.gem(32, 42.5, 3.4, '#b86bff') +
      k.p('M28.5 46 L35.5 46 L35.5 55 L28.5 55 Z', k.mat(['#9a7ae0', '#4a2a8a', '#1a0c3a'], 'h')) +
      k.s('M28.5 48.6 L35.5 50.2 M28.5 52 L35.5 53.6', '#ffd77a', 1.1, 0.7) +
      k.p(star(32, 58.6, 4.6, 0.5), k.mat('gold'), { sw: 1.6 }) +
      `</g>` +
      k.spark(50, 12, 4.4) + k.spark(12, 22, 2.8, '#ffe08a') + k.spark(54, 44, 2.4, '#e0c8ff');
  });

  // Holdkorona-ékkő: nagy, félhold alakúra csiszolt kő arany koronafoglalatban
  I.def('item', 'mitikus1', k => {
    const moon = 'M40 5 A20 20 0 1 0 51 41 A16 16 0 1 1 40 5 Z';
    return aura(k, 32, 30) +
      k.shadow(32, 59, 21, 3) +
      // korona-foglalat
      k.p('M10 56 L8 38 L18 46 L24 34 L32 44 L40 34 L46 46 L56 38 L54 56 Z', k.mat('gold')) +
      k.f('M9.6 41 L17.4 48 L23.6 37.6 L27 42 L22 53 L11 53 Z', '#fff', 0.35) +
      k.p('M9.6 50 Q32 55 54.4 50 L54 56.6 Q32 61 10 56.6 Z', k.mat('gold', 'v'), { sw: 1.8 }) +
      k.c(8, 37, 2.4, k.mat('bone'), { sw: 1.4 }) + k.c(56, 37, 2.4, k.mat('bone'), { sw: 1.4 }) +
      // holdkő
      k.p(moon, k.lg([[0, '#ffffff'], [0.35, '#d8e2ff'], [0.75, '#8a9ae8'], [1, '#3a3aa0']], 0.1, 0.1, 0.9, 0.9)) +
      // csiszolási él a sarló közepén
      k.s('M36 7.6 Q21 12 20.4 26 Q20.6 38 33 44.6', '#5a5ac8', 1.2, 0.5) +
      k.f('M16 22 Q20 10 34 6 Q24 12 20 24 Z', '#fff', 0.85) +
      k.gem(32, 53.4, 2.6, '#b86bff') +
      k.spark(48, 16, 4.4) + k.spark(14, 14, 2.8, '#ffe08a') + k.spark(52, 30, 2.2, '#e0c8ff');
  });

  // Az Éj Lehelete: kerek üvegcse, benne csillagos éjszakai örvény, kiszálló lila köd
  I.def('item', 'mitikus2', k => {
    return aura(k, 32, 34) +
      k.shadow(32, 59, 17, 3) +
      // köd a nyakból
      k.p('M30 13 C24 9 22 3 28 1.6 C26 5 30 7 33 6 C34 2 40 1 42 4 C38 4 38 8 41 10 C44 12 42 16 36 14 Z', k.mat(['#f0e0ff', '#b08ae8', '#5a3a9a']), { sw: 1.6, op: 0.95 }) +
      // nyak és dugó
      k.p('M27 13 L37 13 L37 22 L27 22 Z', k.lg([[0, '#c8b8f0', 0.9], [1, '#5a4a9a', 0.9]], 0, 0, 1, 0)) +
      k.p('M25 12 L39 12 L39 16 L25 16 Z', k.mat('gold', 'v'), { sw: 1.8 }) +
      // gömb
      k.c(32, 39, 18.4, k.rg([[0, '#6a4ad0'], [0.45, '#2a1a70'], [1, '#08061e']], 0.42, 0.38, 0.7)) +
      // örvény
      k.s('M20 42 C20 30 36 26 42 34 C47 41 40 50 32 48 C25 46 26 37 33 38 C37 39 37 43 34 44', '#c8a8ff', 2.4, 0.75) +
      k.s('M22 47 C30 54 44 52 47 42', '#8a6ae8', 1.6, 0.6) +
      k.f(star(25, 32, 1.8), '#fff') + k.f(star(41, 45, 1.6), '#ffe08a') + k.f(star(28, 50, 1.3), '#fff') + k.f(star(43, 31, 1.3), '#fff') +
      k.c(33, 41, 1.2, '#ffe08a', { noStroke: true }) +
      // üveg-csillanás
      k.f('M18 34 Q20 25 29 22.4 Q23 27 21 36 Z', '#fff', 0.7) +
      k.s('M24 54 Q32 57.4 40 54', '#c8b8ff', 1.2, 0.5) +
      k.spark(50, 22, 4) + k.spark(13, 50, 2.6, '#ffe08a');
  });

  // Ezüstszarv-amulett: hajlított ezüstszarv arany sapkával, lánc, lila kő
  I.def('item', 'mitikus3', k => {
    const horn = 'M24 22 C14 30 14 46 26 52 C34 56 44 54 50 48 C44 50 36 50 31 46 C25 41 26 32 32 26 Z';
    return aura(k, 32, 36) +
      k.shadow(34, 59, 16, 2.8) +
      chain(k, 12, 3, 16, 14, 25, 18, 5, 'gold') + chain(k, 52, 3, 48, 14, 39, 18, 5, 'gold') +
      k.c(32, 19, 3.2, 'none', { sw: 3.2 }) + k.c(32, 19, 3.2, 'none', { stroke: '#e8b44c', sw: 1.6 }) +
      // szarv
      k.p(horn, k.mat('silver')) +
      k.f('M23 25 C16 32 16 44 24 49 C20 42 20 32 25.6 26.4 Z', '#fff', 0.8) +
      k.s('M18.6 36 Q22 37 26.8 36.4 M20 44 Q24 43.4 28.4 42 M27 50 Q30 48 32.6 47.2', k.INK, 1.2, 0.5) +
      // arany sapka a tövén
      k.p('M22 20 L34 25 L31 30 L19 25 Z', k.mat('gold'), { sw: 1.8 }) +
      k.p('M25.6 18 L33 21.6', 'none', { sw: 3 }) + k.s('M25.6 18 L33 21.6', '#e8b44c', 1.4) +
      k.gem(26.6, 25.2, 3.2, '#b86bff') +
      // hegye csillag
      k.f(star(51, 47.6, 3.4), '#ffe9a8') +
      k.spark(44, 30, 4.2) + k.spark(14, 22, 2.6, '#ffe08a') + k.spark(52, 54, 2.2, '#e0c8ff');
  });

  // Csillaghullás-köpeny: éjlila, széttárt köpeny arany szegéllyel, csillagos béléssel, hulló csillagokkal
  I.def('item', 'mitikus4', k => {
    const lining = k.rg([[0, '#4a3ab0'], [0.6, '#1a1050'], [1, '#08061e']], 0.5, 0.3, 0.8);
    const fall = (x, y, l) => k.f(`M${x + 1.4} ${y - 1.4} L${x - l} ${y - l} L${x - 1.4} ${y + 1.4} Z`, '#ffe9a8', 0.75) + k.f(star(x, y, 2.8), '#fff');
    return aura(k, 32, 30) +
      k.shadow(32, 59, 24, 3) +
      // külső köpeny
      k.p('M22 9 Q32 14 42 9 L48 12 Q58 32 61 54 Q52 50 46 55 Q40 51 32 55 Q24 51 18 55 Q12 50 3 54 Q6 32 16 12 Z', k.mat(['#b08ae8', '#4a2a8a', '#160a36'])) +
      // bélés
      k.p('M24 14 Q32 18 40 14 Q47 30 46 53 Q40 50 32 54 Q24 50 18 53 Q17 30 24 14 Z', lining, { sw: 1.8 }) +
      [[27, 26, 1.6], [37, 31, 2], [30, 40, 1.4], [40, 45, 1.4], [24, 47, 1.6], [34, 20, 1.2]].map(([x, y, r]) => k.f(star(x, y, r), '#fff', 0.95)).join('') +
      k.c(33, 37, 0.8, '#ffe08a', { noStroke: true }) + k.c(26, 34, 0.7, '#fff', { noStroke: true }) +
      // arany szegély
      k.s('M24 14 Q17 30 18 53', '#e8b44c', 1.8) + k.s('M40 14 Q47 30 46 53', '#e8b44c', 1.8) +
      k.f('M15 14 Q9 28 6 50 L9 50.6 Q12 30 18 14 Z', '#fff', 0.25) +
      // gallér és csat
      k.p('M16 12 Q20 3 26 6 L32 13 L38 6 Q44 3 48 12 Q40 10 32 17 Q24 10 16 12 Z', k.mat('gold'), { sw: 1.8 }) +
      k.p(star(32, 15.4, 5.6, 0.48), k.mat('gold'), { sw: 1.6 }) +
      // hulló csillagok
      fall(38, 27, 9) + fall(29, 44, 8) + fall(58, 30, 6) +
      k.spark(50, 8, 3.6) + k.spark(10, 40, 2.4, '#ffe08a');
  });

  // =============== FOGLALAT-TARTALÉKOK ===============

  // slot-fegyver: keresztbe tett kard és varázsbot
  I.def('item', 'slot-fegyver', k => {
    return k.shadow(32, 58, 20, 3.2) +
      // bot (jobbra dől)
      `<g transform="rotate(-45 32 32)">` +
      k.p('M29.4 16 L34.6 16 L34.6 62 L29.4 62 Z', k.mat('wood', 'h')) +
      k.f('M29.6 16 L31.4 16 L31.4 61 L29.6 61 Z', '#fff', 0.3) +
      k.p('M27 13 L37 13 L36 18 L28 18 Z', k.mat('gold'), { sw: 1.8 }) +
      `</g>` +
      // kard (balra dől)
      `<g transform="rotate(45 32 32)">` +
      k.p('M27 9 L32 1 L37 9 L37 40 L27 40 Z', k.mat('steel', 'v')) +
      k.f('M32 3 L32 39 L28.4 39 L28.4 9.6 Z', '#fff', 0.5) +
      k.f('M32 3 L35.6 9.6 L35.6 39 L32 39 Z', '#3a4266', 0.28) +
      k.p('M19 39 L45 39 C47.6 39 47.6 45 45 45 L19 45 C16.4 45 16.4 39 19 39 Z', k.mat('gold', 'v')) +
      k.p('M29 45 L35 45 L35 54 L29 54 Z', k.mat('leather', 'h'), { sw: 2 }) +
      k.c(32, 57, 3.2, k.mat('gold'), { sw: 1.8 }) +
      `</g>` +
      // a bot gömbje legfelül
      k.glow(17.6, 17.6, 10, '#8ad8ff', 0.7) + k.gem(17.6, 17.6, 6.2, '#4ab0ff') + k.spark(13, 12, 2.6);
  });

  // slot-pancel: egyszerű acél mellvas bőrövvel
  I.def('item', 'slot-pancel', k => {
    return k.shadow(32, 58, 18, 3) +
      k.p('M21 8 L27 7 Q32 12 37 7 L43 8 L54 15 L50 27 L46 25 L46 52 Q32 57 18 52 L18 25 L14 27 L10 15 Z', k.mat('steel')) +
      k.f('M27 7.6 L21.4 8.6 L11.6 15 L14.6 25 L19.6 22.6 L19.6 51 Q24 52.8 28 53.6 L28 14 Z', '#fff', 0.3) +
      k.f('M42.6 8.6 L52.4 15 L49.6 25 L44.4 22.6 L44.4 51 Q41 52.6 37 53.4 L37 16 Z', '#3a4266', 0.3) +
      k.s('M32 13 L32 52', k.INK, 1.2, 0.5) +
      k.p('M18 39 Q32 43 46 39 L46 45 Q32 49 18 45 Z', k.mat('leather', 'v'), { sw: 1.8 }) +
      k.p('M29 40.4 L35 40.4 L35 46.4 L29 46.4 Z', k.mat('steel'), { sw: 1.4 }) +
      k.spark(24, 18, 2.6);
  });

  // slot-sisak: nyitott orrvédős acélsisak
  I.def('item', 'slot-sisak', k => {
    return k.shadow(32, 58, 18, 3) +
      k.p('M12 38 C10 18 20 8 32 8 C44 8 54 18 52 38 L52 50 L44 52 L42 38 L36 38 L35 52 L29 52 L28 38 L22 38 L20 52 L12 50 Z', k.mat('steel')) +
      k.f('M31 10 C21 10.6 14 18 14.6 36 L14.6 48.6 L18.6 49.4 L19 36 Q19 20 31 10 Z', '#fff', 0.38) +
      k.f('M44 13 Q51 20 50 36 L50 48.6 L46 49.4 L45 36 Z', '#3a4266', 0.3) +
      // arcnyílás sötét
      k.f('M22.4 38.2 L28 38.2 L28.8 51.4 L20.6 51.4 Z M35.6 38.2 L41.6 38.2 L43.4 51.4 L35.2 51.4 Z', '#0e0c1e', 0.85) +
      k.p('M11.6 32 Q32 26 52.4 32 L52.6 38 Q32 32 11.4 38 Z', k.mat('bronze', 'v'), { sw: 1.8 }) +
      k.s('M32 9 L32 30', k.INK, 1.2, 0.5) +
      k.spark(22, 18, 2.6);
  });

  // slot-gyuru: egyszerű ezüstgyűrű kis kővel
  I.def('item', 'slot-gyuru', k => {
    return k.shadow(32, 56, 14, 3) +
      band(k, 32, 38, 15, 13, 5.4, k.mat('silver')) +
      k.s('M20 33 Q24 27 31 26', '#fff', 1.6, 0.85) +
      k.p('M26 26 L38 26 L36 20 L28 20 Z', k.mat('silver'), { sw: 1.8 }) +
      k.gem(32, 19, 6, '#b86bff') + k.spark(37, 13, 3);
  });

  // slot-amulett: csepp alakú ezüst függő zsinóron, lila kővel
  I.def('item', 'slot-amulett', k => {
    return k.shadow(32, 59, 12, 2.6) +
      k.s('M12 3 Q16 20 30 22 M52 3 Q48 20 34 22', k.INK, 3.6) + k.s('M12 3 Q16 20 30 22 M52 3 Q48 20 34 22', '#7c86aa', 1.8) +
      k.c(32, 22.4, 2.8, 'none', { sw: 2.8 }) + k.c(32, 22.4, 2.8, 'none', { stroke: '#d4dcf2', sw: 1.4 }) +
      k.p('M32 25 C40 33 46 40 46 46 C46 53 40 58 32 58 C24 58 18 53 18 46 C18 40 24 33 32 25 Z', k.mat('silver')) +
      k.gem(32, 46, 7, '#8a5ae0') +
      k.f('M21 44 Q22 37 28 31.6 Q24 38 23.6 45 Z', '#fff', 0.8) +
      k.spark(40, 38, 2.6);
  });
})(typeof window !== 'undefined' ? window : globalThis);
