/* Nyxoria – képességikonok (sk2): Orgyilkos, Idéző, Dalnok, Alakváltó. Szabályok: js/icons.js fejléce, minta: js/icons-skills.js. */
(function (root) {
  'use strict';
  const I = root.NYX.icons;
  const R = Math.PI / 180;

  // ---------- közös segédek ----------
  // csillag alakú robbanás (n ág, külső r1, belső r2)
  const star = (cx, cy, n, r1, r2, rot = -90) => {
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 ? r2 : r1, a = (rot + i * 180 / n) * R;
      d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1) + ' ';
    }
    return d + 'Z';
  };
  // elvékonyodó, ívelt forma (karom, ujj, csóva): alapközép (x1,y1), hegy (x2,y2), alapszélesség w, hajlás b
  const taper = (x1, y1, x2, y2, w, b = 0) => {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
    const mx = (x1 + x2) / 2 + nx * b, my = (y1 + y2) / 2 + ny * b;
    const f = v => v.toFixed(1);
    return `M${f(x1 + nx * w / 2)} ${f(y1 + ny * w / 2)} Q${f(mx + nx * w * 0.35)} ${f(my + ny * w * 0.35)} ${f(x2)} ${f(y2)} Q${f(mx - nx * w * 0.35)} ${f(my - ny * w * 0.35)} ${f(x1 - nx * w / 2)} ${f(y1 - ny * w / 2)} Z`;
  };
  // tőr függőlegesen, hegye felfelé (y≈2), gombja lent (y≈53) – forgatással használd
  const dagger = (k, blade) =>
    k.p('M27.5 30 L27.5 14 Q28 8 32 2 Q36 8 36.5 14 L36.5 30 Z', blade || k.mat('silver', 'h')) +
    k.f('M32 4 Q29.6 9 29.4 14 L29.4 29 L32 29 Z', '#fff', 0.5) +
    k.f('M32 4 Q34.4 9 34.6 14 L34.6 29 L32 29 Z', '#2a2050', 0.22) +
    k.s('M32 7 L32 28', '#fff', 1, 0.75) +
    k.p('M20 29.5 L44 29.5 Q46.5 29.5 45 32.5 L43 35 L21 35 L19 32.5 Q17.5 29.5 20 29.5 Z', k.mat('gold', 'v')) +
    k.f('M21 30.8 L43 30.8 L42.4 32.2 L21.6 32.2 Z', '#fff6d0', 0.6) +
    k.p('M29 35 L35 35 L35 46 L29 46 Z', k.mat('leather', 'h')) +
    k.s('M29 38.4 L35 40 M29 42 L35 43.6', k.INK, 1.1, 0.5) +
    k.c(32, 49.5, 3.8, k.mat('gold'), { sw: 2 }) + k.f('M30 48 Q31 46.6 32.6 46.8', '#fff', 0.7);
  // hangjegy (nyolcad), fej a (x,y)-ban; s méretarány
  const note = (k, x, y, s, fill) => {
    const t = `translate(${x} ${y}) scale(${s})`;
    return `<g transform="${t}">` +
      k.s('M3.4 -1 L3.4 -17 Q10 -14 11 -7', k.INK, 5.2) + k.s('M3.4 -1 L3.4 -17 Q10 -14 11 -7', fill, 2.4) +
      `<ellipse cx="0" cy="0" rx="4.6" ry="3.4" transform="rotate(-22)" fill="${fill}" stroke="${k.INK}" stroke-width="2"/>` +
      k.f('M-2.8 -0.6 Q-2 -2.6 0.4 -2.8', '#fff', 0.75) + `</g>`;
  };
  // kettős (gerendás) hangjegy
  const note2 = (k, x, y, s, fill) => {
    const t = `translate(${x} ${y}) scale(${s})`;
    const st = 'M3.4 -1 L3.4 -16 L17.4 -19 L17.4 -4';
    return `<g transform="${t}">` +
      k.s(st, k.INK, 5.2) + k.p('M3.4 -16 L17.4 -19 L17.4 -15 L3.4 -12 Z', fill, { sw: 1.6 }) + k.s(st, fill, 2.4) +
      `<ellipse cx="0" cy="0" rx="4.6" ry="3.4" transform="rotate(-22)" fill="${fill}" stroke="${k.INK}" stroke-width="2"/>` +
      `<ellipse cx="14" cy="-3" rx="4.6" ry="3.4" transform="rotate(-22 14 -3)" fill="${fill}" stroke="${k.INK}" stroke-width="2"/>` +
      k.f('M-2.8 -0.6 Q-2 -2.6 0.4 -2.8', '#fff', 0.75) + k.f('M11.2 -3.6 Q12 -5.6 14.4 -5.8', '#fff', 0.75) + `</g>`;
  };
  // körvonalas felhő körökből (előbb a körvonalak, aztán a kitöltés → egybefüggő folt)
  const cloud = (k, circles, fill, sw = 2.2) =>
    circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${k.INK}" stroke="${k.INK}" stroke-width="${sw * 2}"/>`).join('') +
    circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');
  // szellemtest (lekerekített fej, hullámos alj)
  const ghostD = (cx, top, w, h) => {
    const l = cx - w / 2, r = cx + w / 2, b = top + h, q = w / 6;
    return `M${l} ${top + w / 2} C${l} ${top - w * 0.12} ${r} ${top - w * 0.12} ${r} ${top + w / 2} L${r} ${b} ` +
      `Q${r - q * 0.5} ${b - 5} ${r - q} ${b - 2} Q${r - q * 1.5} ${b + 3} ${r - q * 2} ${b - 1} Q${cx} ${b - 6} ${l + q * 2} ${b - 1} ` +
      `Q${l + q * 1.5} ${b + 3} ${l + q} ${b - 2} Q${l + q * 0.5} ${b - 5} ${l} ${b} Z`;
  };

  // ================= ORGYILKOS =================
  // Tőrdöfés: vízszintes, jobbra döfő tőr, a hegyénél sugaras átszúrás-robbanás, mögötte sebességcsíkok (orgyilkos lila-bíbor)
  I.def('skill', 'tordofes', k => {
    const streak = (y, x1, x2, w, op) => k.f(`M${x1} ${y - w / 2} L${x2} ${y - w * 0.3} Q${x2 + 2} ${y} ${x2} ${y + w * 0.3} L${x1} ${y + w / 2} Z`, k.lg([[0, '#ffd8f0', 0], [1, '#ffe8f6', op]], 0, 0, 1, 0));
    return k.bg(['#ffb4d8', '#7a1e5e', '#16041c'], { cx: 0.72, cy: 0.5 }) +
      k.glow(53, 32, 18, '#ffd0e8', 1) +
      // sugaras átszúrás
      k.p(star(53, 32, 10, 13, 5, -90), k.mat(['#ffffff', '#ffd0ea', '#e0608a']), { sw: 1.6 }) +
      k.c(53, 32, 4.2, '#fff', { noStroke: true }) +
      streak(20, 2, 20, 3.6, 0.85) + streak(44, 4, 22, 3.6, 0.85) + streak(13, 10, 24, 2.4, 0.6) + streak(51, 12, 26, 2.4, 0.6) +
      `<g transform="translate(-9 0) rotate(90 32 32)">` + dagger(k) + `</g>` +
      k.spark(57, 12, 4.2) + k.spark(10, 30, 2.4, '#ffd0ea');
  });

  // Árnyékdöfés: lila árnyékörvényből kicsapó tőr
  I.def('skill', 'arnyekdofes', k => {
    const vortex = k.rg([[0, '#05020e'], [0.55, '#2a1050'], [0.85, '#7a4ad0'], [1, '#c8a0ff']]);
    const blade = k.mat(['#fbf2ff', '#b89ae6', '#4a2c86'], 'h');
    return k.bg('shadow') +
      k.f(taper(19, 19, 50, 50, 20, -3), '#c8a0ff', 0.25) +
      k.glow(44, 44, 18, '#e2c8ff', 0.6) +
      `<g transform="translate(-1 -1) rotate(135 32 32)">` + dagger(k, blade) + `</g>` +
      cloud(k, [[15, 15, 11], [27, 11, 7], [9, 29, 7], [25, 25, 8], [5, 14, 5], [17, 31, 6], [31, 19, 5]], '#2c1454') +
      k.f('M8 12 Q12 6 20 6 Q14 10 12 16 Z', '#8a5ad8', 0.7) + k.c(18, 18, 7, '#0a0418', { noStroke: true, op: 0.85 }) +
      k.f('M10 24 Q6 14 14 8 Q11 16 14 22 Z', '#c8a0ff', 0.45) +
      k.s('M16 9 Q26 10 25 18 Q23 24 16 23 Q11 21 12 16 Q14 13 17 14', '#d8b8ff', 1.8, 0.85) +
      k.s('M30 28 Q36 30 38 36', '#d8b8ff', 1.6, 0.6) + k.s('M28 32 Q30 38 35 40', '#d8b8ff', 1.2, 0.45) +
      k.spark(52, 52, 5, '#f4e8ff') + k.spark(50, 14, 3, '#d2a8ff');
  });

  // Füstbomba: fekete bomba égő kanóccal, szürkéslila füstpamacsokban
  I.def('skill', 'fustbomba', k => {
    const smoke = k.rg([[0, '#f2eefa'], [0.6, '#b4aacb'], [1, '#6e6390']], 0.4, 0.3, 0.8);
    const smokeB = k.rg([[0, '#cdc4e0'], [1, '#5e5480']], 0.4, 0.3, 0.8);
    return k.bg(['#e6def5', '#5f5684', '#100c20']) +
      cloud(k, [[12, 20, 8], [8, 33, 7], [52, 24, 7], [57, 36, 6]], smokeB) +
      cloud(k, [[11, 48, 10], [22, 55, 10], [36, 57, 9], [50, 54, 10], [57, 45, 7], [6, 40, 6]], smoke) +
      k.p('M36 20 L42 14 L47 19 L41 25 Z', k.mat('dark'), { sw: 2 }) +
      k.c(30, 37, 15, k.rg([[0, '#8a86b0'], [0.35, '#3c3a5e'], [1, '#100e22']], 0.35, 0.3, 0.75)) +
      k.f('M20 32 Q22 25 29 23 Q24 28 23 34 Z', '#fff', 0.55) +
      k.s('M44.5 16.5 Q47 9 53 10', k.INK, 3.6) + k.s('M44.5 16.5 Q47 9 53 10', '#d8b88a', 1.8) +
      k.glow(53, 10, 9, '#ffd070', 0.9) + k.f(star(53, 10, 6, 6.5, 2.4), '#ffe8a0') + k.c(53, 10, 1.8, '#fff', { noStroke: true }) +
      cloud(k, [[22, 50, 5], [30, 52, 6], [39, 50, 5]], smoke, 2) +
      k.spark(16, 24, 2.6, '#fff', 0.8);
  });

  // Méregpenge: zölddel bevont penge, csöpögő méreg
  I.def('skill', 'meregpenge', k => {
    const blade = k.mat(['#f6ffd8', '#a4dc58', '#2e5e14'], 'h');
    const drop = (x, y, s) => k.p(`M${x} ${y - 6 * s} Q${x + 4.4 * s} ${y} ${x} ${y + 3 * s} Q${x - 4.4 * s} ${y} ${x} ${y - 6 * s} Z`, k.mat(['#f0ffb0', '#7ad430', '#2a6010']), { sw: 1.8 }) +
      k.f(`M${x - 1.4 * s} ${y - 0.4 * s} Q${x - 1.2 * s} ${y - 2.6 * s} ${x} ${y - 3.6 * s}`, '#fff', 0.8);
    return k.bg('poison') + k.glow(22, 28, 22, '#e8ffa0', 0.55) +
      `<g transform="translate(5 3) rotate(-60 32 32)">` + dagger(k, blade) +
      k.f('M27.5 22 L36.5 22 L36.5 30 L27.5 30 Z', '#4aa020', 0.35) + `</g>` +
      // lecsorgó méreg a penge alsó élén
      k.p('M15 33 Q17 37 16.5 40 Q16 43 18 43 Q20 43 19.5 40 Q19.5 37 22 35.5 Q24 39 24 44 Q24 47.5 26 47.5 Q28 47.5 28 44 Q28 40 29.5 38.5 Z', k.mat(['#f0ffb0', '#86de38', '#2e6a12'], 'h'), { sw: 1.8 }) +
      drop(18, 52, 1.05) + drop(27, 58, 0.8) +
      k.spark(12, 14, 4.4, '#fbffe0') + k.spark(50, 54, 2.6, '#e8ffa0');
  });

  // Hátbaszúrás: hátulról látott sötét alak, a lapockájába csapódó tőr, kerülő ív
  I.def('skill', 'hatbaszuras', k => {
    const body = k.mat(['#6a5a92', '#2e2448', '#0c0818'], 'h');
    return k.bg(['#ffb4a0', '#701c3a', '#14040e']) +
      k.s('M6 22 Q4 8 18 5', '#ffd8c8', 2.6, 0.6) + k.f('M15 1.5 L22 5.2 L15.6 9 Z', '#ffd8c8', 0.6) +
      `<g transform="translate(-6 0)">` +
      k.p('M2 64 L4 52 Q6 42 16 39 Q22 37 26 36 L34 36 Q40 37 44 40 Q50 44 52 54 L54 64 Z', body) +
      k.p('M20 25 Q20 13 30 13 Q40 13 40 25 Q40 33 34 37 L26 37 Q20 33 20 25 Z', body) +
      k.s('M22 22 Q23 15 30 14.6', '#c8b4ff', 1.8, 0.7) + k.s('M6 50 Q9 42 18 40', '#c8b4ff', 1.8, 0.55) +
      k.s('M30 40 L30 63', k.INK, 1.2, 0.5) + `</g>` +
      k.s('M62 12 Q54 22 46 26', '#ffd8c8', 2, 0.5) +
      `<g transform="translate(15 -9) rotate(-135 32 32) scale(0.8) translate(8 8)">` + dagger(k) + `</g>` +
      k.glow(31, 41, 10, '#ff6a5a', 0.95) + k.f(star(31, 41, 7, 7.5, 2.8), '#ffd0b0', 0.95) +
      k.spark(54, 10, 3.4, '#ffe0d0') + k.spark(12, 30, 2.4, '#ffb4a0');
  });

  // ================= IDÉZŐ =================
  // Szellemcsapás: áttetsző szellemkéz behajlított karmokkal csap le jobbra-le, mögötte három türkiz csapásív, a csuklóból szellemcsóva
  I.def('skill', 'szellemcsapas', k => {
    const body = k.lg([[0, '#ffffff'], [0.4, '#b4fff2'], [1, '#3ab8b4']], 0.2, 0, 0.8, 1);
    // ujjak: [alap x, alap y, hegy x, hegy y, hajlás]
    const fingers = [[23, 31, 18, 12, -3], [28.5, 29, 27, 6, -3], [34, 29.5, 36, 7, -3], [39, 32, 44, 14, -3]];
    const fd = ([x1, y1, x2, y2, b]) => `M${x1} ${y1} Q${(x1 + x2) / 2 + b} ${(y1 + y2) / 2} ${x2} ${y2}`;
    const claw = ([, , x2, y2]) => k.p(taper(x2, y2 + 2.5, x2 + 4.5, y2 - 6, 4.8, 1.6), k.mat(['#ffffff', '#5ad8d8', '#0e4a58']), { sw: 1.5 });
    const thumb = 'M21 41 Q14 38 11 30';
    const palm = 'M20 32 Q22 26 31 26 Q41 26 42 33 L41 44 Q38 52 31 52 Q23 52 20 45 Z';
    const tail = 'M24 50 Q18 56 8 56 Q2 56 0 62 L0 64 L14 64 Q20 60 26 60 Q33 60 38 52 Z';
    const hand =
      k.p(tail, k.lg([[0, '#4ac8c0', 0], [1, '#8ef0e6', 0.9]], 0, 1, 1, 0), { sw: 1.6, op: 0.9 }) +
      `<path d="${palm}" fill="none" stroke="${k.INK}" stroke-width="4.4" stroke-linejoin="round"/>` +
      fingers.map(f => k.s(fd(f), k.INK, 8.8)).join('') + k.s(thumb, k.INK, 8.8) +
      fingers.map(f => k.s(fd(f), body, 4.6)).join('') + k.s(thumb, body, 4.6) +
      k.f(palm, body) +
      fingers.map(claw).join('') + k.p(taper(11, 31.5, 7, 23, 4.6, -1.4), k.mat(['#ffffff', '#5ad8d8', '#0e4a58']), { sw: 1.5 }) +
      k.s('M24 30 Q27 28 31 28', '#fff', 1.4, 0.8) + fingers.map(([x1, y1, x2, y2]) => k.s(`M${x1 - 1} ${y1 - 3} L${(x1 + x2) / 2 - 1.6} ${(y1 + y2) / 2}`, '#fff', 1.1, 0.75)).join('') +
      k.s('M24 44 Q31 47 38 43', '#1a7a80', 1.2, 0.55);
    return k.bg('spirit', { cx: 0.42, cy: 0.42 }) + k.glow(32, 30, 26, '#c8fff4', 0.75) +
      // csapásívek (a kéz mozgását követik)
      k.s('M4 14 Q30 6 54 24', '#e0fffa', 4.2, 0.7) + k.s('M2 26 Q30 20 50 42', '#c8fff4', 3.4, 0.55) + k.s('M10 40 Q30 36 44 56', '#a8fff0', 2.6, 0.45) +
      `<g opacity="0.92" transform="translate(33 35) rotate(32) scale(0.9) translate(-31 -32)">` + hand + `</g>` +
      k.spark(55, 10, 4.4) + k.spark(56, 54, 2.8, '#c8fff4');
  });

  // Lélekrobbanás: szétrobbanó lélekgömb, szilánkokkal
  I.def('skill', 'lelekrobbanas', k => {
    const burst = k.rg([[0, '#ffffff'], [0.4, '#c8fff6'], [0.8, '#5ad8e0'], [1, '#3a7ad8']]);
    const shard = k.mat(['#ffffff', '#9ef4ff', '#3a8ad0']);
    const fr = [[8, 12, -135], [56, 10, -45], [58, 50, 40], [8, 54, 140], [32, 3, -90], [32, 61, 90]];
    return k.bg(['#d8f4ff', '#3a54b0', '#0a0c2e']) + k.glow(32, 32, 30, '#c8f8ff', 0.85) +
      fr.map(([x, y, a]) => k.p(taper(x - 7 * Math.cos(a * R), y - 7 * Math.sin(a * R), x, y, 4.4), shard, { sw: 1.6 })).join('') +
      k.p(star(32, 32, 10, 25, 13, -80), burst, { sw: 2 }) +
      k.c(32, 32, 10.5, k.rg([[0, '#ffffff'], [0.5, '#d8fff8'], [1, '#6ad0e8']], 0.4, 0.35, 0.7)) +
      k.s('M32 26 Q37 26 37.5 31 Q37 36 32 36 Q28 35.6 28 32 Q28.4 29.2 31.4 29.4', '#2a8aa8', 1.6, 0.8) +
      k.spark(32, 32, 4) + k.spark(52, 30, 3, '#e0fcff') + k.spark(14, 34, 2.4, '#e0fcff');
  });

  // Védőszellem: szellem nagy pajzzsal
  I.def('skill', 'vedoszellem', k => {
    const ghost = k.rg([[0, '#ffffff'], [0.5, '#b4fff2'], [1, '#3ab0b0']], 0.4, 0.3, 0.8);
    const shield = k.mat(['#ffffff', '#b8d0e8', '#4a6488']);
    return k.bg('spirit') + k.glow(32, 30, 28, '#c8fff4', 0.7) +
      k.p(ghostD(32, 5, 34, 44), ghost) +
      k.f('M19 18 Q22 9 31 8', '#fff', 0.7) +
      `<ellipse cx="25.5" cy="17.5" rx="2.6" ry="3.6" fill="#0e3a44"/><ellipse cx="38.5" cy="17.5" rx="2.6" ry="3.6" fill="#0e3a44"/>` +
      k.c(26.3, 16.4, 0.9, '#fff', { noStroke: true }) + k.c(39.3, 16.4, 0.9, '#fff', { noStroke: true }) +
      k.p('M14 26 Q32 20 50 26 L50 40 Q50 54 32 61 Q14 54 14 40 Z', k.mat('gold')) +
      k.p('M18 29 Q32 24.5 46 29 L46 40 Q46 51 32 57 Q18 51 18 40 Z', shield, { sw: 1.6 }) +
      k.f('M19.5 30 Q25 28 32 27 L32 55.5 Q19.5 50 19.5 40 Z', '#fff', 0.35) +
      k.p('M32 32 Q38 38 36 44 Q34.6 49 32 50 Q29.4 49 28 44 Q26 38 32 32 Z', k.mat(['#e8fffb', '#5ae0d8', '#1a7a80']), { sw: 1.6 }) +
      k.f('M30 40 Q30 36 32 34.6 Q31.6 39 31.4 43 Z', '#fff', 0.8) +
      k.spark(54, 12, 4.2) + k.spark(10, 46, 2.6, '#c8fff4');
  });

  // Falka: két szellemfarkasfej
  const wolfHead = (k, x, y, s, fill, eye) =>
    `<g transform="translate(${x} ${y}) scale(${s})">` +
    k.p('M-15 -18 L-6 -7.5 Q0 -10 6 -7.5 L15 -18 L15.5 -3 L19 4 L12.5 5.5 L8.5 14 Q0 21 -8.5 14 L-12.5 5.5 L-19 4 L-15.5 -3 Z', fill) +
    k.f('M-12.5 -12.5 L-7 -6.5 L-12 -4 Z', '#0e3a44', 0.5) + k.f('M12.5 -12.5 L7 -6.5 L12 -4 Z', '#0e3a44', 0.5) +
    k.p('M-5.5 2 Q0 -1 5.5 2 L5 11 Q0 16.5 -5 11 Z', k.mat(['#ffffff', '#e0fff8', '#9adcd8']), { sw: 1.4 }) +
    `<ellipse cx="0" cy="9.6" rx="3" ry="2.2" fill="${k.INK}"/>` +
    k.f('M-10 -1.5 L-3.5 -0.5 L-8.5 2.6 Z', eye) + k.f('M10 -1.5 L3.5 -0.5 L8.5 2.6 Z', eye) +
    k.f('M-11 -6 Q-4 -9.5 0 -9', '#fff', 0.45) + `</g>`;
  I.def('skill', 'falka', k => {
    const back = k.mat(['#a8e8f0', '#3a90a8', '#123a58']);
    const front = k.mat(['#ffffff', '#8ef0ea', '#2a8a9a']);
    return k.bg(['#c8fff4', '#2a6a8a', '#061428']) + k.glow(32, 34, 28, '#c8fff4', 0.65) +
      k.s('M4 50 Q14 42 20 50', '#c8fff4', 2, 0.45) + k.s('M44 58 Q54 54 60 58', '#c8fff4', 2, 0.45) +
      wolfHead(k, 20, 29, 0.86, back, '#e8fffc') +
      wolfHead(k, 41, 38, 1.04, front, '#ffffff') +
      k.spark(52, 10, 4.4) + k.spark(8, 56, 2.6, '#c8fff4');
  });

  // Lélekcsere: fénytől szétrepedő szellem, körülötte két egymásba forduló ív
  I.def('skill', 'lelekcsere', k => {
    const ghost = k.rg([[0, '#ffffff'], [0.5, '#c8fff4'], [1, '#4ab8b8']], 0.4, 0.35, 0.8);
    const arcA = 'M10 30 A22 22 0 0 1 48 14', arcB = 'M54 34 A22 22 0 0 1 16 50';
    return k.bg(['#ffe4c8', '#7a2a82', '#16041e']) + k.glow(32, 32, 26, '#fff0c8', 0.85) +
      k.s(arcA, k.INK, 7.4) + k.s(arcA, '#ffcf6a', 4) + k.p('M44 7 L55 15 L43.4 20.6 Z', '#ffcf6a', { sw: 2 }) +
      k.s(arcB, k.INK, 7.4) + k.s(arcB, '#7af0e8', 4) + k.p('M20 57 L9 49 L20.6 43.4 Z', '#7af0e8', { sw: 2 }) +
      k.p(ghostD(32, 16, 22, 28), ghost) +
      k.f('M24 24 Q26 18 31 17.6', '#fff', 0.8) +
      `<ellipse cx="28" cy="26" rx="1.9" ry="2.8" fill="#0e3a44"/><ellipse cx="36" cy="26" rx="1.9" ry="2.8" fill="#0e3a44"/>` +
      k.s('M32 31 L30 36 L34 39 L31 44', '#fff6c8', 2.2) + k.s('M32 31 L30 36 L34 39 L31 44', '#ffb84a', 1, 0.8) +
      k.spark(32, 38, 5, '#fff8e0') + k.spark(54, 52, 3, '#fff') + k.spark(10, 12, 2.6, '#ffe4c8');
  });

  // ================= DALNOK =================
  // Lantütés: lendülő lant, a teste becsapódik
  I.def('skill', 'lantutes', k => {
    const body = k.mat('wood');
    return k.bg('music') +
      k.glow(18, 46, 18, '#ffe0f0', 0.85) + k.f(star(18, 46, 9, 15, 6, -60), '#fff0f8', 0.8) +
      k.s('M30 60 Q50 54 58 34', '#ffe0f4', 2.6, 0.55) + k.s('M40 62 Q56 58 62 44', '#ffe0f4', 2, 0.4) +
      `<g transform="translate(2 -2) rotate(40 32 32)">` +
      k.p('M29 6 L35 6 L35 30 L29 30 Z', k.mat('darkwood', 'h')) +
      k.p('M28 0 L37 1 L36 8 L28 7 Z', k.mat('darkwood'), { sw: 2 }) +
      k.p('M32 26 C46 26 48 42 46 48 C44 56 38 60 32 60 C26 60 20 56 18 48 C16 42 18 26 32 26 Z', body) +
      k.f('M22 36 Q25 29 32 28.5 Q24 33 22.6 44 Z', '#fff', 0.45) +
      k.c(32, 40, 5, '#3a1e10', { sw: 1.8 }) + `<circle cx="32" cy="40" r="3" fill="none" stroke="#e8b44c" stroke-width="1" opacity="0.8"/>` +
      k.p('M26.5 50 L37.5 50 L37 53 L27 53 Z', k.mat('gold'), { sw: 1.4 }) +
      k.s('M30.6 4 L30.6 51 M32 4 L32 51 M33.4 4 L33.4 51', '#fff4d8', 0.6, 0.9) + `</g>` +
      note(k, 13, 22, 1, '#ffe08a') + k.spark(18, 46, 5) + k.spark(54, 8, 3, '#ffe0f4');
  });

  // Altatódal: nagy, puha holdsarló lebegő hangjegyekkel
  I.def('skill', 'altatodal', k => {
    const moon = k.mat(['#ffffff', '#ffe8c0', '#e0a8c8']);
    return k.bg(['#ffe2f4', '#7466c4', '#141036']) + k.glow(24, 30, 24, '#fff0f8', 0.7) +
      k.p('M30 6 A23 23 0 1 0 50 44 A18 18 0 1 1 30 6 Z', moon) +
      k.f('M22 12 Q10 22 12 36 Q14 26 24 13 Z', '#fff', 0.6) +
      k.s('M34 58 Q42 50 50 54 Q58 58 62 50', '#ffe2f4', 2, 0.5) +
      note(k, 45, 33, 0.95, '#ffd8f0') + note(k, 52, 15, 0.7, '#d8e0ff') +
      k.spark(50, 46, 3, '#fff') + k.spark(14, 52, 2.6, '#ffe2f4') + k.spark(42, 6, 2.2, '#fff');
  });

  // Harci induló: hadidob keresztbe tett dobverőkkel, arany hangjegyek
  I.def('skill', 'harci_indulo', k => {
    const drum = k.mat(['#ff9a7a', '#c8302a', '#4a0a10'], 'h');
    const stick = (r) => `<g transform="rotate(${r} 32 30)">` + k.p('M30.6 2 L33.4 2 L33.4 28 L30.6 28 Z', k.mat('wood', 'h'), { sw: 1.8 }) + k.c(32, 2.5, 3.6, k.mat('bone'), { sw: 1.8 }) + `</g>`;
    return k.bg(['#ffe6a0', '#b8302a', '#240808']) + k.glow(32, 36, 26, '#ffe6a0', 0.7) +
      k.p('M12 32 L12 50 Q32 60 52 50 L52 32 Z', drum) +
      k.f('M14 34 L20 36 L20 53 Q16 52 14 50 Z', '#fff', 0.35) +
      k.s('M12 50 L22 34 L32 52 L42 34 L52 50', '#f4c860', 2.2) +
      k.p('M10.6 49 Q32 60 53.4 49 L53.4 52.4 Q32 64 10.6 52.4 Z', k.mat('gold', 'v'), { sw: 1.8 }) +
      `<ellipse cx="32" cy="32" rx="21" ry="7.2" fill="${k.mat('gold', 'v')}" stroke="${k.INK}" stroke-width="2.2"/>` +
      `<ellipse cx="32" cy="31.6" rx="17.4" ry="5" fill="${k.mat(['#ffffff', '#f4e4c4', '#c8a878'])}" stroke="${k.INK}" stroke-width="1.2"/>` +
      stick(-38) + stick(38) +
      note(k, 9, 20, 0.8, '#ffe08a') + note(k, 52, 16, 0.8, '#ffe08a') +
      k.spark(32, 26, 4.4) + k.spark(56, 40, 2.4, '#ffe6a0');
  });

  // Gúnydal: nevető bohócmaszk csörgősipkával, hangjeggyel
  I.def('skill', 'gunydal', k => {
    const face = k.mat(['#ffffff', '#fbeedc', '#d0a888']);
    const bell = (x, y) => k.c(x, y, 3.4, k.mat('gold'), { sw: 1.8 });
    return k.bg('music') + k.glow(32, 34, 24, '#ffd0ec', 0.6) +
      k.p('M15 27 Q8 16 3 18 Q8 8 18 14 Q24 4 32 5 Q40 4 46 14 Q56 8 61 18 Q56 16 49 27 Z', k.mat(['#c8a0ff', '#6a3ab8', '#22104a'])) +
      k.p('M32 5 Q40 4 46 14 Q56 8 61 18 Q56 16 49 27 L32 27 Z', k.mat(['#9ae078', '#3a9a3a', '#123a12']), { sw: 0 }) +
      k.p('M15 27 Q8 16 3 18 Q8 8 18 14 Q24 4 32 5 Q40 4 46 14 Q56 8 61 18 Q56 16 49 27 Z', 'none') +
      bell(4, 18) + bell(32, 5) + bell(60, 18) +
      k.p('M14 27 Q32 21 50 27 Q51 48 32 58 Q13 48 14 27 Z', face) +
      k.f('M17 29 Q24 25.6 30 25.4 Q20 32 18.6 44 Q16 38 17 29 Z', '#fff', 0.6) +
      k.s('M19.5 36 Q23.5 30.5 27.5 36', k.INK, 2.6) + k.s('M36.5 36 Q40.5 30.5 44.5 36', k.INK, 2.6) +
      k.c(20, 41, 3, '#ff8aa8', { noStroke: true, op: 0.6 }) + k.c(44, 41, 3, '#ff8aa8', { noStroke: true, op: 0.6 }) +
      k.p('M21 41 Q32 45 43 41 Q41 54 32 54 Q23 54 21 41 Z', '#5a0e24', { sw: 2 }) +
      k.f('M23 42 Q32 45.6 41 42 L40.6 44.4 Q32 47.4 23.4 44.4 Z', '#fff') +
      k.f('M27 50.5 Q32 47 37 50.5 Q35 53.4 32 53.4 Q29 53.4 27 50.5 Z', '#ff6a88') +
      note(k, 53, 50, 0.75, '#ffe08a') + k.spark(9, 46, 3, '#ffd0ec') + k.spark(56, 32, 2.4);
  });

  // Hősének: ragyogó arany-vörös szív, körülötte hangjegyek
  I.def('skill', 'hosenek', k => {
    const heart = k.rg([[0, '#fff4e0'], [0.35, '#ff8a8a'], [1, '#a8182e']], 0.35, 0.3, 0.8);
    return k.bg('holy') + k.glow(32, 34, 30, '#fff6c8', 0.9) +
      k.p('M32 54 C12 42 9 26 15 19 C21 12 29 15 32 22 C35 15 43 12 49 19 C55 26 52 42 32 54 Z', heart, { sw: 2.4 }) +
      k.p('M32 54 C12 42 9 26 15 19 C21 12 29 15 32 22 C35 15 43 12 49 19 C55 26 52 42 32 54 Z', 'none', { stroke: '#ffd870', sw: 1.2, op: 0.9 }) +
      k.f('M15.6 26 Q16 18 22 17.4 Q26 17.6 27.4 20 Q20 19.6 18 28 Z', '#fff', 0.8) +
      note(k, 10, 50, 0.72, '#fff2b0') + note2(k, 43, 14, 0.62, '#fff2b0') +
      k.spark(32, 33, 4.4, '#fff8e0') + k.spark(56, 46, 3) + k.spark(8, 12, 2.4);
  });

  // ================= ALAKVÁLTÓ =================
  // Karmos csapás: jobbra fent a mancs karmaiból induló három vastag, izzó karomnyom, sötét széllel
  I.def('skill', 'karmos_csapas', k => {
    const slash = k.lg([[0, '#ffffff'], [0.5, '#ffe4b0'], [1, '#ff9a4a']], 1, 0, 0, 1);
    const lens = (x1, y1, x2, y2, w) => {
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
      const mx = (x1 + x2) / 2 + nx * 3, my = (y1 + y2) / 2 + ny * 3;
      return `M${x1} ${y1} Q${(mx + nx * w).toFixed(1)} ${(my + ny * w).toFixed(1)} ${x2} ${y2} Q${(mx - nx * w).toFixed(1)} ${(my - ny * w).toFixed(1)} ${x1} ${y1} Z`;
    };
    const marks = [[37, 16, 6, 51], [45, 22, 13, 58], [52, 29, 22, 63]];
    return k.bg(['#ffe2a8', '#a04a2a', '#240c08'], { cx: 0.45, cy: 0.55 }) + k.glow(30, 38, 26, '#ffe2a8', 0.7) +
      // sötét, vöröses szél (seb)
      marks.map(([a, b, c, d]) => k.f(lens(a, b, c, d, 9.5), '#3a0a0c', 0.85)).join('') +
      marks.map(([a, b, c, d]) => k.p(lens(a, b, c, d, 6), slash, { sw: 1.8 })).join('') +
      marks.map(([a, b, c, d]) => k.s(`M${a - 3} ${b + 5} Q${(a + c) / 2 - 1} ${(b + d) / 2 - 2} ${c + 7} ${d - 9}`, '#fff', 1.5, 0.85)).join('') +
      // a csapás elején a karmok hegye
      [[37, 16], [45, 22], [52, 29]].map(([x, y]) => k.p(`M${x + 9} ${y - 10} Q${x + 7} ${y - 2} ${x} ${y} Q${x + 3} ${y - 6} ${x + 4} ${y - 12} Z`, k.mat(['#fffbea', '#e6dcbc', '#6a5a40']), { sw: 1.8 })).join('') +
      [[37, 16], [45, 22], [52, 29]].map(([x, y]) => k.p(`M${x + 2} ${y - 13} Q${x + 7} ${y - 17} ${x + 11} ${y - 12} L${x + 9} ${y - 9} L${x + 4} ${y - 11} Z`, k.mat(['#b0703e', '#6a3a1a', '#2a140a']), { sw: 1.6 })).join('') +
      k.spark(14, 30, 3.2, '#ffe2a8') + k.spark(58, 52, 3.6);
  });

  // Medveforma: vicsorgó medvefej – tátott száj agyarakkal, ráncolt, szögletes szemöldök, világos pofa
  I.def('skill', 'medveforma', k => {
    const fur = k.rg([[0, '#d8945a'], [0.5, '#8a5028'], [1, '#3e200e']], 0.4, 0.3, 0.8);
    const fang = (x, y, dir, len = 6) => k.p(`M${x - 2} ${y} L${x + 2} ${y} L${x + dir * 0.6} ${y + len} Z`, k.mat('bone'), { sw: 1.3 });
    const fangU = (x, y, len = 5) => k.p(`M${x - 1.8} ${y} L${x + 1.8} ${y} L${x} ${y - len} Z`, k.mat('bone'), { sw: 1.3 });
    return k.bg('nature') + k.glow(32, 34, 28, '#d6ffb0', 0.6) +
      // hátracsapott fülek
      k.p('M10 22 Q6 10 16 8 Q22 9 22 16 Z', fur) + k.p('M54 22 Q58 10 48 8 Q42 9 42 16 Z', fur) +
      k.f('M12 19 Q10 12 16 11 Q19 12 19 16 Z', '#e8a888') + k.f('M52 19 Q54 12 48 11 Q45 12 45 16 Z', '#e8a888') +
      k.p('M32 12 C48 12 56 23 55 35 C54 49 45 59 32 59 C19 59 10 49 9 35 C8 23 16 12 32 12 Z', fur) +
      k.f('M14 30 Q16 17 30 14.4 Q20 20 18 33 Z', '#ffd8a8', 0.4) +
      // világos pofa
      k.p('M32 31 C44 31 47 39 47 45 C47 53 40 58 32 58 C24 58 17 53 17 45 C17 39 20 31 32 31 Z', k.mat(['#fff6e0', '#ecc898', '#a87444'])) +
      // orrnyereg-ráncok
      k.s('M27 29 Q32 27 37 29 M28.5 32 Q32 30.6 35.5 32', k.INK, 1.3, 0.65) +
      // orr
      k.p('M27 34 Q32 32 37 34 Q36 38.4 32 39.4 Q28 38.4 27 34 Z', k.INK, { sw: 1.2 }) + k.f('M29 34.2 Q31 33.2 33 33.6', '#fff', 0.6) +
      // tátott száj
      k.p('M21.5 43 Q26 40.6 32 42.4 Q38 40.6 42.5 43 Q42 54 32 55.4 Q22 54 21.5 43 Z', k.mat(['#c8404a', '#5a0a14', '#1a0408'], 'v'), { sw: 2 }) +
      k.f('M26 51 Q32 47.6 38 51 Q35 54 32 54 Q29 54 26 51 Z', '#e0606a') +
      fang(25, 42.8, 1, 7) + fang(39, 42.8, -1, 7) + fang(29.5, 43, 0, 3.6) + fang(34.5, 43, 0, 3.6) +
      fangU(26.6, 53.2, 5) + fangU(37.4, 53.2, 5) +
      // dühös, lefelé forduló szemöldök
      k.p('M13 22 L29 28.6 L28 31.8 L14.6 27 Z', k.INK, { sw: 1 }) + k.p('M51 22 L35 28.6 L36 31.8 L49.4 27 Z', k.INK, { sw: 1 }) +
      // izzó, összehúzott szemek
      k.p('M17.6 29 L27 31.6 Q24 34.6 19.6 32.6 Z', '#ffd040', { sw: 1.4 }) + k.p('M46.4 29 L37 31.6 Q40 34.6 44.4 32.6 Z', '#ffd040', { sw: 1.4 }) +
      k.c(23, 32, 1.1, k.INK, { noStroke: true }) + k.c(41, 32, 1.1, k.INK, { noStroke: true }) +
      k.spark(56, 54, 3.6, '#e8ffd0') + k.spark(8, 50, 2.4, '#d6ffb0');
  });

  // Farkasforma: oldalnézeti farkasfej, mögötte sebességcsíkok
  I.def('skill', 'farkasforma', k => {
    const fur = k.mat(['#f4f6ff', '#9aa6cc', '#3a4270']);
    return k.bg(['#e4ecff', '#46559a', '#0c1030']) + k.glow(36, 32, 26, '#e4ecff', 0.6) +
      k.s('M2 22 L16 22', '#e4ecff', 3, 0.65) + k.s('M0 32 L12 32', '#e4ecff', 3, 0.8) + k.s('M2 42 L14 42', '#e4ecff', 3, 0.65) +
      k.s('M4 52 L16 50', '#e4ecff', 2.4, 0.45) +
      k.p('M14 56 Q12 40 18 28 L17 9 L28 21 L35 8 L39 23 Q45 25 50 30 L60 34 Q62 38 59 41 L49 44 Q44 50 36 52 L30 54 L32 60 L20 58 Z', fur) +
      k.f('M17 11 L26 22 L19 27 Z', '#2a2a50', 0.45) + k.f('M35 11 L37.4 22.4 L31.4 22 Z', '#2a2a50', 0.45) +
      k.f('M18 30 Q22 22 30 22 Q22 28 20 40 Z', '#fff', 0.55) +
      k.p('M49 44 Q44 50 36 52 L30 54 Q36 46 44 42.6 Z', '#f4f6ff', { sw: 1.4 }) +
      k.p('M57.4 32.6 Q62 34.4 61 38 Q59 39.6 57 38.6 Z', k.INK, { sw: 1.2 }) +
      k.p('M36 29 L44.4 29.4 L39 33 Z', '#ffd040', { sw: 1.4 }) + k.c(40, 30.6, 0.9, k.INK, { noStroke: true }) +
      k.s('M34 27 L44 27.4', k.INK, 1.6, 0.8) +
      k.s('M24 34 L22 44 M28 36 L26 46', k.INK, 1.2, 0.35) +
      k.spark(54, 12, 4.4) + k.spark(10, 58, 2.4, '#e4ecff');
  });

  // Gyökérfonat: a földből kitörő vastag gyökerek béklyóba fonnak egy sötét ellenséget
  I.def('skill', 'gyokerfonat', k => {
    const wood = k.mat(['#ffd8a0', '#c07a3e', '#5a3016'], 'h');
    const woodB = k.mat(['#9a6438', '#6a3e1e', '#2e160a'], 'h');
    const seg = (d, w, front) => k.s(d, k.INK, w + 4.4) + k.s(d, front ? wood : woodB, w) + (front ? k.s(d, '#ffe8c0', 1.6, 0.7) : '');
    const leaf = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})">` + k.p('M0 0 Q6 -6.5 12 0 Q6 6.5 0 0 Z', k.mat(['#eaffb8', '#6ac83a', '#1a5a1a']), { sw: 1.6 }) + k.s('M1 0 L10 0', '#1a4a12', 0.9, 0.6) + `</g>`;
    const foe = k.mat(['#6a5a8a', '#2e2448', '#0c0818'], 'h');
    return k.bg(['#d6ffb0', '#2e7a32', '#041206'], { cy: 0.4 }) + k.glow(32, 28, 24, '#e8ffc0', 0.65) +
      `<circle cx="32" cy="32" r="30" fill="none" stroke="#020a04" stroke-width="5" opacity="0.5"/>` +
      // föld
      k.p('M0 56 Q32 50 64 56 L64 64 L0 64 Z', k.mat(['#7a5a3a', '#4a3020', '#1a0e06'], 'v'), { sw: 2 }) +
      // hátsó gyökérvég (a test mögé bukik)
      seg('M44 36 Q48 33 46 29', 4.6, false) +
      // ellenség: feltartott karokkal vergődő sötét alak
      k.s('M25 31 L14 12 M39 31 L50 12', k.INK, 9.6) + k.s('M25 31 L14 12 M39 31 L50 12', foe, 5) +
      k.p('M23 55 L24 32 Q32 26 40 32 L41 55 Z', foe) + k.s('M27 33 L26 52', '#a898d0', 1.4, 0.5) +
      k.c(32, 19, 7.2, foe) + k.f('M27 18 L31 20 L27 21.4 Z M37 18 L33 20 L37 21.4 Z', '#ff5a4a') +
      // gyökerek a test körül
      seg('M3 64 Q5 51 20 48 Q32 45.6 44 47 Q53 47 55 39 Q56 32 51 29', 6.6, true) +
      seg('M61 64 Q60 49 46 40 Q36 34.6 22 36.6 Q12 37 11.4 29 Q11 23 16 20', 6.6, true) +
      leaf(16, 20, -100) + leaf(51, 29, -60) + leaf(6, 48, 210) +
      k.spark(55, 9, 4) + k.spark(9, 9, 2.6, '#e8ffc0');
  });

  // Holdfény-újjászületés: holdsarló alatt kihajtó, fényben fürdő hajtás
  I.def('skill', 'holdfeny_ujjaszuletes', k => {
    const moon = k.mat(['#ffffff', '#e8eeff', '#9aa8e8']);
    const leaf = k.mat(['#eaffc0', '#6ad04a', '#1a6a2a']);
    return k.bg('moon') +
      k.f('M10 12 L40 12 L50 60 L14 60 Z', '#f0f4ff', 0.12) +
      k.p('M20 4 A15 15 0 1 0 38 22 A12 12 0 1 1 20 4 Z', moon) +
      k.f('M14 8 Q7 14 9 24 Q10 15 16 9 Z', '#fff', 0.7) +
      k.glow(34, 44, 20, '#d0ffc0', 0.75) +
      k.s('M34 60 Q33 48 36 38', k.INK, 6.4) + k.s('M34 60 Q33 48 36 38', '#5ab83a', 3) +
      k.p('M35 42 Q22 44 15 34 Q28 28 35 42 Z', leaf) + k.f('M17.6 34.6 Q26 32 33 40', '#fff', 0.5) +
      k.p('M36 38 Q40 24 54 22 Q54 38 36 38 Z', leaf) + k.f('M38 35 Q44 26 52 24', '#fff', 0.5) +
      `<ellipse cx="34" cy="60" rx="14" ry="3.4" fill="#d0ffc0" opacity="0.35"/>` +
      k.c(48, 50, 1.8, '#e0ffd0', { noStroke: true, op: 0.9 }) + k.c(22, 50, 1.5, '#e0ffd0', { noStroke: true, op: 0.8 }) + k.c(54, 38, 1.3, '#e0ffd0', { noStroke: true, op: 0.8 }) +
      k.spark(46, 10, 4.4) + k.spark(26, 30, 2.6, '#f0f4ff') + k.spark(50, 56, 2.4, '#d0ffc0');
  });
})(typeof window !== 'undefined' ? window : globalThis);
