/* Nyxoria – képességikonok (sk1): harcos, vadász, mágus, gyógyító. Szabályok: js/icons.js fejléce, minta: js/icons-skills.js. */
(function (root) {
  'use strict';
  const I = root.NYX.icons;

  // ---------- közös segédek ----------
  // nyílvessző vízszintesen: x=0 a tollazat vége, x=L a hegy; utána transformmal forgatható
  const arrow = (k, L, fl = '#e8504a', head = 'steel') => {
    const fd = k.darken(fl, 0.35);
    return k.p(`M0 -8.5 L11 -8.5 L17 -2.4 L5 -2.4 Z`, k.mat([k.lighten(fl, 0.5), fl, fd], 'v'), { sw: 1.8 }) +
      k.p(`M0 8.5 L11 8.5 L17 2.4 L5 2.4 Z`, k.mat([fl, fd, k.darken(fl, 0.6)], 'v'), { sw: 1.8 }) +
      k.p(`M2 -2.4 L${L - 11} -2.4 L${L - 11} 2.4 L2 2.4 Z`, k.mat('wood', 'v'), { sw: 1.8 }) +
      k.f(`M4 -1.4 L${L - 12} -1.4 L${L - 12} -0.2 L4 -0.2 Z`, '#fff', 0.45) +
      k.p(`M${L - 15} -7.5 L${L} 0 L${L - 15} 7.5 L${L - 11} 0 Z`, k.mat(head, 'v'), { sw: 1.8 }) +
      k.f(`M${L - 13} -5 L${L - 2} 0 L${L - 10.5} 0 Z`, '#fff', 0.6);
  };
  // ötágú csillag
  const star = (cx, cy, R, r = R * 0.48, rot = -90) => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = (rot + i * 36) * Math.PI / 180, rr = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(2) + ' ' + (cy + rr * Math.sin(a)).toFixed(2) + ' ';
    }
    return d + 'Z';
  };
  // ütés-csillag (robbanás)
  const burst = (cx, cy, R, r, n = 8, rot = 0) => {
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const a = (rot + i * 180 / n) * Math.PI / 180, rr = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(2) + ' ' + (cy + rr * Math.sin(a)).toFixed(2) + ' ';
    }
    return d + 'Z';
  };
  const hexP = (cx, cy, r) => {
    let d = '';
    for (let i = 0; i < 6; i++) { const a = (i * 60 - 90) * Math.PI / 180; d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2) + ' '; }
    return d + 'Z';
  };

  // ================= HARCOS =================

  // Lendületes roham: előredőlve, jobbra rontó szarvas sisak, mögötte vastag sebességcsíkok és porfelhő, elöl becsapódás
  I.def('skill', 'lenduletes_roham', k => {
    const streak = (y, x1, x2, w, op) => k.f(`M${x1} ${y - w / 2} L${x2} ${y - w * 0.42} Q${x2 + w * 0.6} ${y} ${x2} ${y + w * 0.42} L${x1} ${y + w / 2} Z`, k.lg([[0, '#fff2e0', 0], [0.5, '#fff2e0', op * 0.7], [1, '#ffffff', op]], 0, 0, 1, 0));
    const dust = [[5, 55, 6], [13, 58, 7], [22, 60, 5.5], [9, 48, 4.5]];
    const helm =
      // hátralobogó tollforgó
      k.p('M18 16 C12 9 7 12 2 8 C3 14 1 18 1 22 C5 22 7 26 2 29 C8 31 13 30 17 27 Z', k.mat(['#ffb0a0', '#d0303a', '#5a0a14']), { sw: 2.4 }) +
      k.s('M15 18 C10 15 7 16 4 14 M15 24 C10 24 8 25 5 26', k.INK, 1.3, 0.5) +
      k.p('M12 36 C12 19 22 11 32 11 C43 11 49 20 49 33 L49 50 C41 55 20 55 12 49 Z', k.mat('steel'), { sw: 2.6 }) +
      k.f('M15 34 C15 21 23 14 31 14 C25 18 21 26 21 36 Z', '#fff', 0.5) +
      k.p('M30 27 L50 27 L50 33 L36 33 L36 45 L30 45 Z', k.mat(['#5a5f80', '#22243a', '#0a0a16'], 'v'), { sw: 2.2 }) +
      k.p('M10 46 C22 52 38 52 51 46 L51 52 C38 58 22 58 10 52 Z', k.mat('gold', 'v'), { sw: 2.2 }) +
      k.c(18, 40, 1.8, '#fff4c0', { noStroke: true }) + k.c(18, 30, 1.8, '#fff4c0', { noStroke: true }) +
      k.p('M36 15 C40 6 50 2 60 5 C52 7 47 11 44 19 Z', k.mat('bone'), { sw: 2.4 });
    return k.bg('phys', { cx: 0.7 }) +
      k.glow(55, 34, 15, '#ffd9a0', 1) +
      k.p(burst(56, 35, 9.5, 4.6, 7, 8), k.mat(['#ffffff', '#ffe08a', '#ff8a3a']), { sw: 1.8 }) +
      // vastag sebességcsíkok
      streak(17, 0, 24, 5, 0.95) + streak(29, 0, 18, 6, 1) + streak(41, 2, 20, 5, 0.9) +
      // porfelhő a sarkánál
      dust.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${k.INK}" stroke="${k.INK}" stroke-width="4"/>`).join('') +
      dust.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${k.mat(['#fff2dc', '#d8b490', '#8a6448'])}"/>`).join('') +
      `<g transform="translate(37 31) rotate(14) scale(0.78) translate(-31 -31)">` + helm + `</g>` +
      k.spark(58, 16, 4) + k.spark(58, 56, 2.8, '#ffd2b0');
  });

  // Pajzscsapás: kerek, acélperemes fapajzs, fölötte kábulás-csillagok körpályán
  I.def('skill', 'pajzscsapas', k => {
    const st = (x, y, r, rot) => k.p(star(x, y, r, r * 0.45, rot), k.mat(['#fffbe0', '#ffd84a', '#c07a10']), { sw: 1.5 });
    return k.bg(['#ffe0a8', '#9a3a3a', '#200810'], { cy: 0.5 }) +
      k.glow(32, 38, 26, '#ffe0a0', 0.6) +
      // ütésvonalak
      k.s('M50 46 L60 52 M52 38 L62 38 M50 54 L56 61', '#fff4d8', 2.6, 0.85) +
      // pajzs: kerek, deszkás fapajzs acélperemmel és dudorral (nem céltábla)
      k.c(30, 40, 19, k.mat('wood')) +
      k.s('M23 23 L23 57 M30 21 L30 59 M37 23 L37 57', k.INK, 1.3, 0.55) +
      `<circle cx="30" cy="40" r="16.6" fill="none" stroke="${k.INK}" stroke-width="5.6"/>` +
      `<circle cx="30" cy="40" r="16.6" fill="none" stroke="${k.mat('steel')}" stroke-width="3.2"/>` +
      [[30, 25.6], [44.4, 40], [30, 54.4], [15.6, 40]].map(([x, y]) => k.c(x, y, 1.5, '#fff', { noStroke: true, op: 0.8 })).join('') +
      k.c(30, 40, 7, k.mat('steel'), { sw: 2 }) + k.hl('M26.5 37.5 Q28 34.5 31 34.5 L30 37 Z', 0.85) +
      k.hl('M15 34 Q18 26 26 23 L27 26 Q20 29 18 35 Z', 0.4) +
      // kábulás-pálya és csillagok
      `<ellipse cx="32" cy="13" rx="20" ry="6" fill="none" stroke="#fff3c0" stroke-width="1.6" opacity="0.7" stroke-dasharray="3 3"/>` +
      st(14, 13, 6, -80) + st(34, 7.5, 7, -95) + st(51, 15, 5.5, -70) +
      k.spark(55, 28, 3.2);
  });

  // Harci kiáltás: üvöltő, agyaras száj, két oldalt hanghullámok, vörös-narancs
  I.def('skill', 'harci_kialtas', k => {
    const wave = (side) => {
      const s = side;
      return k.s(`M${32 + s * 21} 22 Q${32 + s * 26} 33 ${32 + s * 21} 44`, '#fff0c0', 3.6, 0.95) +
        k.s(`M${32 + s * 26.5} 16 Q${32 + s * 33} 33 ${32 + s * 26.5} 50`, '#ffd08a', 3, 0.75);
    };
    return k.bg('fire', { cy: 0.5 }) + k.glow(32, 33, 24, '#ffe08a', 0.7) +
      wave(-1) + wave(1) +
      // száj külső (ajak)
      k.p('M14 30 C14 16 50 16 50 30 C50 46 42 56 32 56 C22 56 14 46 14 30 Z', k.mat(['#ffb08a', '#c8402a', '#5a0e0e'])) +
      // torok
      k.p('M19 31 C19 23 45 23 45 31 C45 44 39 51 32 51 C25 51 19 44 19 31 Z', k.rg([[0, '#6a0a14'], [1, '#1a0408']], 0.5, 0.65, 0.6), { sw: 1.6 }) +
      // nyelv
      k.f('M23 46 C25 40 39 40 41 46 C38 50 26 50 23 46 Z', '#e0505a') + k.f('M26 44 C29 42 33 42 35 43', '#ff8a90', 0.6) +
      // felső fogsor + agyarak
      k.p('M19.5 28 C24 25 40 25 44.5 28 L42 31 L22 31 Z', k.mat('bone', 'v'), { sw: 1.5 }) +
      k.p('M21 29 L25.5 30 L23 38 Z', k.mat('bone'), { sw: 1.5 }) + k.p('M43 29 L38.5 30 L41 38 Z', k.mat('bone'), { sw: 1.5 }) +
      // alsó agyarak
      k.p('M24.5 49 L28.5 48.5 L26 42.5 Z', k.mat('bone'), { sw: 1.4 }) + k.p('M39.5 49 L35.5 48.5 L38 42.5 Z', k.mat('bone'), { sw: 1.4 }) +
      k.hl('M18 24 C21 19 28 17.5 34 17.5 L33 20 C27 20 22 22 20 26 Z', 0.5) +
      k.spark(54, 10, 4.5) + k.spark(9, 54, 3, '#ffe0a0');
  });

  // Kitartó állás: földbe döfött toronypajzs, alatta izzó repedések, acélkék aura
  I.def('skill', 'kitarto_allas', k => {
    return k.bg(['#d8ecff', '#3a5a8e', '#0a1228'], { cy: 0.38 }) +
      k.glow(32, 30, 28, '#8ac8ff', 0.75) +
      // aura-körvonal
      k.s('M11 12 Q32 -2 53 12 Q56 34 50 54 M11 12 Q8 34 14 54', '#bfe4ff', 3.4, 0.55) +
      // domború toronypajzs
      k.p('M14 13 Q32 2 50 13 Q53 34 47 56 L17 56 Q11 34 14 13 Z', k.mat('steel')) +
      k.p('M18.5 16 Q32 7.5 45.5 16 Q48 34 43 56 L21 56 Q16 34 18.5 16 Z', k.mat(['#a8bce0', '#4a6290', '#18223e']), { sw: 1.6 }) +
      k.p('M29.5 9 L34.5 9 L34.5 56 L29.5 56 Z', k.mat(['#fff4c2', '#e8b44c', '#8c5714'], 'h'), { sw: 1.4 }) +
      k.p('M17 27.5 L47 27.5 L47.3 32.5 L16.7 32.5 Z', k.mat(['#fff4c2', '#e8b44c', '#8c5714'], 'v'), { sw: 1.4 }) +
      k.c(32, 30, 7, k.mat('gold'), { sw: 1.8 }) + k.gem(32, 30, 3.4, '#5ab8ff') +
      k.hl('M16 14 Q22 9.5 29 7.6 L29 10.2 Q23 12 17.4 16.4 Z', 0.75) +
      k.f('M15.6 16 L18.4 16.6 Q16.5 30 19 48 L16.8 48 Q13.8 30 15.6 16 Z', '#fff', 0.4) +
      // talaj elöl (a pajzs bele van döfve)
      k.p('M0 50 Q32 44 64 50 L64 64 L0 64 Z', k.mat(['#7a6a8a', '#3e3452', '#16101e'], 'v'), { sw: 2 }) +
      // izzó repedések
      k.s('M32 49 L24 55 L17 54 L8 60 M32 49 L41 56 L48 54 L57 60 M32 49 L31 56 L35 64 M24 55 L22 61 M48 54 L50 49', '#9ad8ff', 2.6, 0.75) +
      k.s('M32 49 L24 55 L17 54 L8 60 M32 49 L41 56 L48 54 L57 60 M32 49 L31 56 L35 64 M24 55 L22 61 M48 54 L50 49', k.INK, 1.2, 0.9) +
      k.f('M10 49 L13 46 L15 49 Z M50 47 L53 44 L55 48 Z', '#7a6a8a') +
      k.spark(57, 12, 4.5) + k.spark(7, 26, 3, '#cfe8ff');
  });

  // ================= VADÁSZ =================

  // Íjlövés: egy nagy, átlósan repülő nyíl, mögötte fénycsíkok
  I.def('skill', 'ijlovesz', k => {
    return k.bg('hunt') + k.glow(36, 28, 22, '#f4ffd0', 0.6) +
      k.f('M6 50 Q22 40 50 16 Q30 38 10 56 Z', '#fbffe8', 0.45) +
      k.s('M4 40 Q14 36 22 30', '#f4ffd8', 2.6, 0.7) + k.s('M22 60 Q28 50 34 42', '#f4ffd8', 2.6, 0.7) +
      `<g transform="translate(9 55) rotate(-45)">${arrow(k, 61, '#e8504a')}</g>` +
      k.spark(54, 8, 4.5) + k.spark(14, 18, 2.8, '#eaffc0');
  });

  // Célzott lövés: vörös célkereszt, közepébe csapódó nyíl
  I.def('skill', 'celzott_loves', k => {
    const R = '#ff5a4a';
    return k.bg(['#fff0c0', '#a8682a', '#22120a']) + k.glow(32, 32, 24, '#ffe8a0', 0.65) +
      `<circle cx="32" cy="32" r="19" fill="none" stroke="${k.INK}" stroke-width="7"/>` +
      `<circle cx="32" cy="32" r="19" fill="none" stroke="${k.mat(['#ffc0b0', R, '#8a1a14'])}" stroke-width="3.6"/>` +
      `<circle cx="32" cy="32" r="9" fill="none" stroke="${k.INK}" stroke-width="5"/>` +
      `<circle cx="32" cy="32" r="9" fill="none" stroke="${R}" stroke-width="2"/>` +
      k.p('M30 3 L34 3 L34 15 L30 15 Z M30 49 L34 49 L34 61 L30 61 Z M3 30 L15 30 L15 34 L3 34 Z M49 30 L61 30 L61 34 L49 34 Z', k.mat(['#ffd8c8', R, '#8a1a14']), { sw: 1.6 }) +
      k.s('M17 20 Q22 14 29 13', '#fff', 1.6, 0.7) +
      `<g transform="translate(6 58) rotate(-45)">${arrow(k, 37, '#4a9ae8', 'silver')}</g>` +
      k.c(32, 32, 2.4, '#fff', { noStroke: true }) +
      k.spark(48, 12, 4.5) + k.spark(52, 50, 2.8, '#ffe8c0');
  });

  // Kettős lövés: két párhuzamos nyíl fénycsíkkal
  I.def('skill', 'kettos_loves', k => {
    return k.bg(['#e0ffd8', '#2e8a5a', '#06200e']) + k.glow(36, 28, 24, '#e8ffd8', 0.55) +
      k.f('M2 38 Q16 30 36 10 Q22 30 4 44 Z', '#f0fff0', 0.4) + k.f('M20 62 Q34 50 54 28 Q42 48 26 62 Z', '#f0fff0', 0.4) +
      `<g transform="translate(3 40) rotate(-45)">${arrow(k, 47, '#ffc83a')}</g>` +
      `<g transform="translate(20 60) rotate(-45)">${arrow(k, 47, '#ffc83a')}</g>` +
      k.spark(50, 10, 4.2) + k.spark(10, 12, 2.6, '#e0ffc8');
  });

  // Csapda: felülről, 3/4 nézetben látott nyitott medvecsapda – fogas acélgyűrű, középen kioldólap, két oldalt rugó, lánc
  I.def('skill', 'csapda', k => {
    const cx = 32, cy = 33, rx = 21, ry = 12;
    const teeth = [];
    for (let i = 0; i < 14; i++) {
      const a = (i * 360 / 14 + 360 / 28) * Math.PI / 180, x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
      teeth.push([y, `M${(x - 3).toFixed(1)} ${(y + 0.8).toFixed(1)} L${x.toFixed(1)} ${(y - 9.5).toFixed(1)} L${(x + 3).toFixed(1)} ${(y + 0.8).toFixed(1)} Z`]);
    }
    teeth.sort((p, q) => p[0] - q[0]);
    const back = teeth.filter(t => t[0] < cy).map(t => t[1]).join(' '), front = teeth.filter(t => t[0] >= cy).map(t => t[1]).join(' ');
    const ring = `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
    const spring = (s) => k.s(`M${32 + s * 19} ${cy - 3} L${32 + s * 27} ${cy - 3.6} Q${32 + s * 31.5} ${cy} ${32 + s * 27} ${cy + 3.6} L${32 + s * 19} ${cy + 3}`, k.INK, 6.6) +
      k.s(`M${32 + s * 19} ${cy - 3} L${32 + s * 27} ${cy - 3.6} Q${32 + s * 31.5} ${cy} ${32 + s * 27} ${cy + 3.6} L${32 + s * 19} ${cy + 3}`, '#c8d0e8', 3);
    const links = [[44, 49, 3.6, 2.4, 30], [49, 53, 2.4, 3.6, 30], [54, 57, 3.6, 2.4, 30], [59, 61, 2.4, 3.6, 30]];
    return k.bg(['#ffe0b0', '#7a5a2e', '#1a1006']) + k.glow(32, 30, 26, '#ffe8c0', 0.55) +
      `<ellipse cx="32" cy="${cy + 6}" rx="29" ry="13" fill="#000" opacity="0.3"/>` +
      // lánc a jobb alsó sarokba
      k.s('M39 42 L44 49', k.INK, 3.4) +
      links.map(([x, y, a, b, r]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" transform="rotate(${r} ${x} ${y})" fill="none" stroke="${k.INK}" stroke-width="4.4"/><ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" transform="rotate(${r} ${x} ${y})" fill="none" stroke="#d8deef" stroke-width="2"/>`).join('') +
      // keresztrúd + rugók
      k.p(`M10 ${cy - 2.2} L54 ${cy - 2.2} L54 ${cy + 2.2} L10 ${cy + 2.2} Z`, k.mat('dark', 'v'), { sw: 1.6 }) +
      spring(-1) + spring(1) +
      // hátsó fogak (a gyűrű mögött)
      k.p(back, k.mat('silver', 'v'), { sw: 1.5 }) +
      // pofák gyűrűje
      `<path d="${ring}" fill="none" stroke="${k.INK}" stroke-width="9"/>` +
      `<path d="${ring}" fill="none" stroke="${k.mat('steel', 'v')}" stroke-width="5.4"/>` +
      k.c(cx - rx, cy, 3.4, k.mat('dark'), { sw: 1.8 }) + k.c(cx + rx, cy, 3.4, k.mat('dark'), { sw: 1.8 }) +
      k.s(`M${cx - rx + 3} ${cy - 3} Q${cx - rx + 6} ${cy - ry + 1} ${cx - 2} ${cy - ry - 1.2}`, '#ffffff', 1.6, 0.85) +
      // kioldólap
      `<ellipse cx="${cx}" cy="${cy}" rx="8" ry="4.8" fill="${k.mat(['#ffe8b0', '#c88a2a', '#5a3008'])}" stroke="${k.INK}" stroke-width="1.8"/>` +
      k.f(`M${cx - 5} ${cy - 1} Q${cx - 3} ${cy - 3.4} ${cx + 1} ${cy - 3.4}`, '#fff', 0.6) +
      // elülső fogak
      k.p(front, k.mat('silver', 'v'), { sw: 1.5 }) +
      k.spark(54, 8, 4) + k.spark(8, 52, 2.8, '#ffe8c0');
  });

  // Kitérő ugrás: hátraszökkenő csizma szárnyas lendülettel, kitérő ív és mellette elsuhanó nyíl
  I.def('skill', 'kitero_ugras', k => {
    return k.bg('spirit', { cx: 0.45 }) + k.glow(34, 26, 22, '#d8fff6', 0.6) +
      // kitérő ív
      k.s('M56 54 Q50 14 18 10', '#e8fffa', 4.2, 0.8) + k.s('M58 44 Q54 22 34 14', '#a8fff0', 2.2, 0.55) +
      // nyíl alul, jobbról balra suhan el
      `<g transform="translate(59 52) rotate(180)">${arrow(k, 44, '#e8504a')}</g>` +
      // csizma (balra fordul, megdöntve)
      `<g transform="rotate(-18 30 26)">` +
      k.p('M24 6 L40 6 L40 30 C40 34 37 36 32 37 L14 38 C8 38 6 34 9 31 C13 28 20 28 24 26 Z', k.mat('leather')) +
      k.p('M22 2 L42 2 L42 9 L22 9 Z', k.mat(['#ffe0b0', '#c87a3a', '#5a2a10'], 'v'), { sw: 1.8 }) +
      k.p('M7 36 L40 34 L40 39 C30 41 16 42 9 41 Z', k.mat('dark', 'v'), { sw: 1.8 }) +
      k.s('M27 14 L36 14 M27 19 L36 19', k.INK, 1.3, 0.55) +
      k.hl('M26 10 L29 10 L29 25 C26 27 21 29 17 30 C20 27 24 25 26 23 Z', 0.4) +
      // kis szárny a sarkon
      k.p('M40 14 C50 8 56 12 58 16 C53 16 50 18 46 18 C51 19 54 22 54 25 C49 24 44 24 40 24 Z', k.mat(['#ffffff', '#d8f8f0', '#7ab8b0']), { sw: 1.6 }) +
      `</g>` +
      k.spark(54, 8, 4) + k.spark(8, 50, 2.8, '#c8fff4');
  });

  // ================= MÁGUS =================

  // Holdnyíl: holdsarló-fejű varázslövedék, csóvával
  I.def('skill', 'holdnyil', k => {
    return k.bg(['#ece4ff', '#3a44b0', '#080a2a'], { cx: 0.62, cy: 0.36 }) +
      // csóva
      k.f('M4 60 Q18 46 40 26 L46 34 Q26 50 10 62 Z', k.lg([[0, '#8ab8ff', 0], [1, '#d8e8ff', 0.85]], 0, 1, 1, 0)) +
      k.f('M14 58 Q24 46 41 30 L43 33 Q28 48 17 59 Z', '#ffffff', 0.7) +
      k.s('M6 46 Q16 40 26 34', '#c8d8ff', 2.4, 0.6) + k.s('M22 62 Q28 54 34 46', '#c8d8ff', 2.4, 0.6) +
      k.glow(42, 24, 22, '#e0ecff', 1) +
      // holdsarló (hegyével előre)
      k.p('M30 12 C40 4 56 8 58 22 C60 34 50 44 38 42 C48 38 52 30 50 22 C48 14 40 10 30 12 Z', k.mat(['#ffffff', '#cfe0ff', '#6a80d8'])) +
      k.hl('M36 10 C44 7 52 10 55 17 L52.5 18 C49.5 12.5 43 10 36 11.5 Z', 0.85) +
      k.c(40, 27, 5, k.rg([[0, '#ffffff'], [0.6, '#c8dcff'], [1, '#7a90e8']]), { sw: 1.6 }) +
      k.spark(16, 14, 4.2) + k.spark(56, 50, 3, '#d8e4ff') + k.spark(26, 28, 2.2, '#eaf0ff');
  });

  // Csillagszilánk: égből hulló csillagok csóvával
  I.def('skill', 'csillagszilank', k => {
    const fall = (x, y, R, rot) =>
      k.f(`M${x - R * 0.5} ${y - R * 0.6} L${x + R * 1.9} ${y - R * 3.1} L${x + R * 0.6} ${y + R * 0.4} Z`, k.lg([[0, '#ffe8a0', 0.9], [1, '#ffe8a0', 0]], 0, 1, 1, 0)) +
      k.p(star(x, y, R, R * 0.46, rot), k.mat(['#ffffff', '#ffe066', '#d07a18']), { sw: 1.8 }) +
      k.hl(`M${x - R * 0.35} ${y - R * 0.15} L${x} ${y - R * 0.75} L${x + R * 0.1} ${y - R * 0.1} Z`, 0.75);
    return k.bg(['#ffe2ff', '#6a3ab8', '#120830'], { cy: 0.3 }) + k.glow(30, 38, 24, '#ffe0f0', 0.6) +
      fall(47, 17, 7, -100) + fall(15, 23, 6, -80) + fall(27, 40, 13, -95) +
      // becsapódási szikrák
      k.s('M14 58 Q27 52 42 58', '#ffe8a0', 2.4, 0.7) +
      k.spark(54, 40, 3.6) + k.spark(8, 42, 2.6, '#ffe0ff') + k.spark(36, 8, 2.4, '#fff4d0');
  });

  // Varázspajzs: lila buborék méhsejt-hatszögekkel, közepén rúna
  I.def('skill', 'magikus_pajzs', k => {
    const cells = [[32, 32]].concat([0, 60, 120, 180, 240, 300].map(a => [32 + 14 * Math.cos((a + 30) * Math.PI / 180), 32 + 14 * Math.sin((a + 30) * Math.PI / 180)]));
    return k.bg('arcane') + k.glow(32, 32, 30, '#d8c8ff', 0.8) +
      k.c(32, 32, 25, k.rg([[0, '#c8b8ff', 0.15], [0.7, '#9a80ff', 0.35], [1, '#e8dcff', 0.85]], 0.42, 0.38, 0.6), { sw: 2.4 }) +
      cells.map(([x, y]) => `<path d="${hexP(x, y, 7.6)}" fill="#e8deff" fill-opacity="0.18" stroke="#f2ecff" stroke-width="1.6" stroke-opacity="0.85"/>`).join('') +
      `<circle cx="32" cy="32" r="22.5" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.5"/>` +
      `<path d="${hexP(32, 32, 7.6)}" fill="${k.mat(['#ffffff', '#c8b0ff', '#6a48d8'])}" stroke="${k.INK}" stroke-width="1.8"/>` +
      k.s('M32 27.5 L32 36.5 M28.5 30 L35.5 34 M35.5 30 L28.5 34', '#3a1a8a', 1.6) +
      k.hl('M13 26 Q17 13 30 10 L30.5 13 Q20 16 16 27 Z', 0.65) +
      k.spark(52, 10, 4.5) + k.spark(10, 54, 3, '#e0d8ff');
  });

  // Láncvillám: felülről érkező villám, ami két ágra hasad, két becsapódással
  I.def('skill', 'lancvillam', k => {
    const bolt = k.mat(['#ffffff', '#fff27a', '#e8a020']);
    return k.bg(['#d8ecff', '#2a3ab0', '#06082a'], { cy: 0.3 }) + k.glow(30, 26, 26, '#bfe0ff', 0.7) +
      k.glow(14, 54, 12, '#fff6a0', 0.9) + k.glow(52, 52, 12, '#fff6a0', 0.9) +
      // fő ág
      k.p('M26 1 L40 1 L33 15 L39 15 L30 28 L35 28 L27 32 L19 30 L24 20 L18 20 Z', bolt, { sw: 2 }) +
      // bal ág
      k.p('M22 29 L28 31 L22 41 L26 41 L13 58 L16 44 L11 44 Z', bolt, { sw: 2 }) +
      // jobb ág
      k.p('M27 31 L34 28 L44 38 L40 39 L54 53 L37 43 L40 41 Z', bolt, { sw: 2 }) +
      k.hl('M28 3 L36 3 L30 14 Z', 0.85) + k.hl('M21 22 L28 21 L24 28 Z', 0.6) +
      k.p(burst(13, 57, 6, 2.6, 6, 15), '#fffbe0', { sw: 1.2 }) + k.p(burst(53, 53, 6, 2.6, 6, 0), '#fffbe0', { sw: 1.2 }) +
      k.spark(52, 12, 4) + k.spark(8, 14, 3, '#cfe8ff');
  });

  // ================= GYÓGYÍTÓ =================

  // Fényszúrás: átlós fénylándzsa sugárzó heggyel
  I.def('skill', 'fenyszuras', k => {
    return k.bg('holy', { cx: 0.66, cy: 0.34 }) + k.glow(44, 20, 22, '#fffbe0', 1) +
      k.f('M4 56 Q24 42 50 14 Q30 40 10 62 Z', '#fffbe8', 0.5) +
      k.s('M2 44 Q12 40 20 34', '#fff6d0', 2.4, 0.7) + k.s('M20 62 Q26 54 30 46', '#fff6d0', 2.4, 0.7) +
      `<g transform="rotate(45 32 32)">` +
      // nyél
      k.p('M29.5 26 L34.5 26 L34.5 62 L29.5 62 Z', k.mat('wood', 'h')) +
      k.s('M29.5 48 L34.5 50 M29.5 52 L34.5 54', k.INK, 1.2, 0.5) +
      // hegy (fénylő)
      k.p('M32 -4 L39.5 14 L35.5 24 L28.5 24 L24.5 14 Z', k.mat(['#ffffff', '#fff2a8', '#e0a030'], 'h')) +
      k.f('M32 -1 L32 23 L29.5 23 L26.5 14 Z', '#fff', 0.7) +
      k.p('M22 22 L42 22 C44 22 44 27 42 27 L22 27 C20 27 20 22 22 22 Z', k.mat('gold', 'v'), { sw: 1.8 }) +
      k.gem(32, 24.5, 2.4, '#ffe066') +
      `</g>` +
      k.spark(50, 12, 6) + k.spark(14, 22, 3, '#fff4c0') + k.spark(56, 38, 2.4, '#fffbe0');
  });

  // Gyógyító fény: zöld kereszt arany fényben, felszálló kis keresztekkel
  I.def('skill', 'gyogyito_feny', k => {
    const plus = (x, y, s, c, op) => k.f(`M${x - s * 0.35} ${y - s} L${x + s * 0.35} ${y - s} L${x + s * 0.35} ${y - s * 0.35} L${x + s} ${y - s * 0.35} L${x + s} ${y + s * 0.35} L${x + s * 0.35} ${y + s * 0.35} L${x + s * 0.35} ${y + s} L${x - s * 0.35} ${y + s} L${x - s * 0.35} ${y + s * 0.35} L${x - s} ${y + s * 0.35} L${x - s} ${y - s * 0.35} L${x - s * 0.35} ${y - s * 0.35} Z`, c, op);
    return k.bg(['#faffd0', '#3e9a4a', '#081e10'], { cy: 0.45 }) +
      k.glow(32, 34, 30, '#fff2a0', 0.9) +
      `<circle cx="32" cy="34" r="22" fill="none" stroke="#fff4b0" stroke-width="2.6" opacity="0.55"/>` +
      k.p('M25.5 12 C25.5 10.5 26.5 10 28 10 L36 10 C37.5 10 38.5 10.5 38.5 12 L38.5 27.5 L54 27.5 C55.5 27.5 56 28.5 56 30 L56 38 C56 39.5 55.5 40.5 54 40.5 L38.5 40.5 L38.5 56 C38.5 57.5 37.5 58 36 58 L28 58 C26.5 58 25.5 57.5 25.5 56 L25.5 40.5 L10 40.5 C8.5 40.5 8 39.5 8 38 L8 30 C8 28.5 8.5 27.5 10 27.5 L25.5 27.5 Z', k.mat(['#e8ffb8', '#4ac85a', '#14602a'])) +
      `<path d="M28 13 L36 13 L36 30 L53 30 L53 38" fill="none" stroke="#fff6c0" stroke-width="1.4" opacity="0.6"/>` +
      k.f('M27.5 12.5 L31 12.5 L31 30.5 L10.5 30.5 L10.5 33.5 L27.5 33.5 Z', '#fff', 0.5) +
      plus(52, 12, 4.5, '#fff8c0', 0.95) + plus(12, 16, 3.2, '#f0ffc0', 0.85) + plus(48, 52, 2.6, '#fff8c0', 0.7) +
      k.spark(18, 52, 3.2, '#fffbe0');
  });

  // Áldás: arany glória fölött, két kitárt tollas szárny
  I.def('skill', 'aldas', k => {
    const wing = (s) => {
      const P = (x, y) => `${(32 + s * x).toFixed(1)} ${y}`;
      return k.p(`M${P(3, 34)} C${P(8, 20)} ${P(18, 12)} ${P(30, 9)} L${P(29.5, 22)} L${P(25.5, 19)} L${P(26, 31)} L${P(21.5, 27.5)} L${P(20.5, 39)} L${P(16.5, 34)} L${P(12, 44)} L${P(10, 39)} L${P(3, 43)} Z`,
        k.mat(s < 0 ? ['#ffffff', '#f6eedc', '#bba984'] : ['#ffffff', '#ece2c8', '#a8946a'])) +
        k.s(`M${P(25.5, 19)} L${P(14, 28)} M${P(21.5, 27.5)} L${P(12, 33)} M${P(16.5, 34)} L${P(9, 37)}`, k.INK, 1.2, 0.55) +
        k.f(`M${P(6, 31)} C${P(10, 21)} ${P(18, 14)} ${P(27, 11.5)} C${P(19, 17)} ${P(12, 24)} ${P(9, 32)} Z`, '#fff', 0.7);
    };
    return k.bg('holy', { cy: 0.42 }) + k.glow(32, 32, 28, '#fffbe0', 0.9) +
      k.f('M27 22 L37 22 L40 64 L24 64 Z', '#fffbe0', 0.35) +
      wing(-1) + wing(1) +
      k.c(32, 38, 5.5, k.rg([[0, '#ffffff'], [0.6, '#fff2b0'], [1, '#e8b848']]), { sw: 1.6 }) +
      // glória
      `<ellipse cx="32" cy="13" rx="13" ry="5" fill="none" stroke="${k.INK}" stroke-width="7"/>` +
      `<ellipse cx="32" cy="13" rx="13" ry="5" fill="none" stroke="${k.mat('gold', 'v')}" stroke-width="3.4"/>` +
      k.s('M22 11 Q25.5 8.6 31 8.4', '#fffbe0', 1.4, 0.9) +
      k.spark(55, 54, 3.6) + k.spark(9, 54, 3, '#fff4c0') + k.spark(32, 55, 2.6, '#fffbe0');
  });

  // Holdfény-pajzs: ezüst címerpajzs holdsarlóval, ezüstös fényburokban
  I.def('skill', 'holdfeny_pajzs', k => {
    return k.bg('moon', { cy: 0.4 }) + k.glow(32, 32, 30, '#f0f4ff', 0.85) +
      // ezüst fényív
      k.s('M10 18 Q32 2 54 18', '#ffffff', 2.6, 0.6) + k.s('M8 34 Q10 52 24 60', '#e8eeff', 2.2, 0.5) + k.s('M56 34 Q54 52 40 60', '#e8eeff', 2.2, 0.5) +
      k.p('M14 13 Q32 5 50 13 L50 30 Q50 47 32 58 Q14 47 14 30 Z', k.mat('silver')) +
      k.p('M18.5 16.5 Q32 10.5 45.5 16.5 L45.5 30 Q45.5 43.5 32 52.5 Q18.5 43.5 18.5 30 Z', k.mat(['#a8b8ff', '#4a58b8', '#141c5a']), { sw: 1.6 }) +
      // holdsarló
      k.p('M36 20 C27 18 21 26 23 34 C25 42 34 45 40 41 C33 41 28 36 28 30 C28 25 31 21 36 20 Z', k.mat(['#ffffff', '#f0f4ff', '#a8b4e0']), { sw: 1.6 }) +
      k.spark(39, 27, 3.2, '#ffffff') +
      k.hl('M16.5 15.5 Q23 11.5 30 10 L30 12.6 Q23.5 14 17.5 18 Z', 0.8) +
      k.f('M47.5 15 L47.5 30 Q47.5 44 34.5 55 Q45.5 43 45.5 30 L45.5 16.5 Z', '#2a3060', 0.35) +
      k.spark(54, 10, 4.5) + k.spark(9, 48, 3, '#f0f4ff');
  });

  // Tisztító ima: összetett, imádkozó kezek ragyogó fénygyűrűben, felszálló szikrákkal
  I.def('skill', 'tisztito_ima', k => {
    const hand = (s, fill) => {
      const P = (x, y) => `${(32 + s * x).toFixed(1)} ${y}`;
      return k.p(`M${P(0, 7)} C${P(-2.4, 7)} ${P(-3.6, 8.5)} ${P(-4, 11)} L${P(-4.3, 13)} C${P(-6.6, 13)} ${P(-7.6, 14.5)} ${P(-8, 17)} L${P(-8.3, 19)} C${P(-10.6, 19)} ${P(-11.6, 20.5)} ${P(-11.8, 23)} L${P(-12, 36)} C${P(-12.5, 42)} ${P(-11, 46)} ${P(-8, 50)} L${P(0, 50)} Z`, fill) +
        k.s(`M${P(-4.2, 13)} L${P(-4.4, 30)} M${P(-8.2, 19)} L${P(-8.4, 32)}`, k.INK, 1.1, 0.5) +
        k.p(`M${P(-10.5, 34)} C${P(-9, 30)} ${P(-2, 30)} ${P(-0.5, 35)} L${P(-0.5, 43)} C${P(-5, 43)} ${P(-9.5, 40)} ${P(-10.5, 34)} Z`, fill, { sw: 1.6 });
    };
    const ring = 'M32 6 A24 24 0 1 1 31.99 6 Z';
    return k.bg(['#ffffff', '#3aa898', '#06242a'], { cy: 0.45 }) +
      k.glow(32, 30, 32, '#fffbe0', 1) +
      // fénysugarak a gyűrűből
      `<g opacity="0.55" fill="#fffbe0">${[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = (i * 45 + 22.5) * Math.PI / 180, b = 5 * Math.PI / 180; return `<path d="M${32 + 24 * Math.cos(a - b)} ${30 + 24 * Math.sin(a - b)} L${32 + 34 * Math.cos(a)} ${30 + 34 * Math.sin(a)} L${32 + 24 * Math.cos(a + b)} ${30 + 24 * Math.sin(a + b)} Z"/>`; }).join('')}</g>` +
      // fénygyűrű (glória a kezek körül)
      `<circle cx="32" cy="30" r="23" fill="none" stroke="${k.INK}" stroke-width="8"/>` +
      `<circle cx="32" cy="30" r="23" fill="none" stroke="${k.mat(['#ffffff', '#fff2a8', '#e0a830'], 'v')}" stroke-width="4.6"/>` +
      `<circle cx="32" cy="30" r="20.4" fill="#fffbe8" opacity="0.28"/>` +
      k.s('M13 22 Q18 10 30 7.6', '#fff', 1.6, 0.9) +
      `<g transform="translate(32 30) scale(0.86) translate(-32 -29)">` +
      hand(1, k.mat(['#f8dcc0', '#dca880', '#8a5434'])) + hand(-1, k.mat(['#fff0dc', '#f2c49a', '#a8704a'])) +
      k.hl('M30 9.5 C29 11 28.6 13 28.4 16 L27.5 26 L29.5 26 L30.5 13 Z', 0.6) + `</g>` +
      // a csuklók fénybe olvadnak
      `<ellipse cx="32" cy="55" rx="16" ry="7" fill="${k.rg([[0, '#ffffff', 1], [0.55, '#fffbe0', 0.85], [1, '#fffbe0', 0]])}"/>` +
      k.spark(32, 3.5, 3.6) + k.spark(8, 10, 3, '#fffbe0') + k.spark(56, 10, 2.6, '#ffffff') + k.spark(55, 54, 2.4, '#e0fff4');
  });
})(typeof window !== 'undefined' ? window : globalThis);
