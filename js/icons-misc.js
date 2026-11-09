/* Nyxoria – ikonok (misc): jellemzők, készletek, pénznemek. Minden kulcs kétszer: háttérrel ('elet') és
   háttér nélkül, kis méretű számok mellé ('elet-bare'). Stílus: js/icons.js fejléce. */
(function (root) {
  'use strict';
  const I = root.NYX.icons;
  const R = Math.PI / 180;
  const f1 = v => Math.round(v * 100) / 100;
  const star = (cx, cy, Ro, ri, n, rot = -90) => {
    let d = '';
    for (let i = 0; i < n * 2; i++) { const a = (rot + i * 180 / n) * R, rr = i % 2 ? ri : Ro; d += (i ? 'L' : 'M') + f1(cx + rr * Math.cos(a)) + ' ' + f1(cy + rr * Math.sin(a)); }
    return d + 'Z';
  };
  // holdsarló: C1 körből kivágva a C2 kör
  const crescent = (x1, y1, r1, x2, y2, r2) => {
    const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy);
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
    const mx = x1 + a * dx / d, my = y1 + a * dy / d;
    const P = [mx + h * dy / d, my - h * dx / d], Q = [mx - h * dy / d, my + h * dx / d];
    const tw = 2 * Math.PI;
    const arc = (cx, cy, r, A, B, refAng, contain) => {
      const a1 = Math.atan2(A[1] - cy, A[0] - cx), a2 = Math.atan2(B[1] - cy, B[0] - cx);
      const e = ((a2 - a1) % tw + tw) % tw, has = (((refAng - a1) % tw + tw) % tw) < e;
      const sweep = has === contain ? 1 : 0, ext = sweep ? e : tw - e;
      return `A${f1(r)} ${f1(r)} 0 ${ext > Math.PI ? 1 : 0} ${sweep} ${f1(B[0])} ${f1(B[1])}`;
    };
    return `M${f1(P[0])} ${f1(P[1])} ` + arc(x1, y1, r1, P, Q, Math.atan2(dy, dx), false) + ' ' + arc(x2, y2, r2, Q, P, Math.atan2(-dy, -dx), true) + 'Z';
  };
  const coin = (k, cx, cy, r) => k.c(cx, cy, r, k.mat('gold'), { sw: Math.min(2, r * 0.36) }) +
    k.c(cx, cy, r * 0.62, 'none', { sw: 0.9, stroke: '#8c5714', op: 0.7 }) + k.s(`M${cx - r * 0.6} ${cy - r * 0.15} Q${cx - r * 0.5} ${cy - r * 0.6} ${cx - r * 0.05} ${cy - r * 0.65}`, '#fff', Math.max(0.8, r * 0.22), 0.8);

  // ---------- emblémák (64-es dobozban, kb. 56 egység) ----------
  const E = {};

  // élet: piros szív
  E.elet = k => k.p('M32 57 C15 45 4 35 4 21 C4 11 11.5 5 19.5 5 C25.5 5 29.6 8.6 32 13.4 C34.4 8.6 38.5 5 44.5 5 C52.5 5 60 11 60 21 C60 35 49 45 32 57 Z', k.mat(['#ffb4c0', '#e8304a', '#7a0c22'])) +
    k.f('M58 22 C57 34 47 43 32 53 C44 42 52 33 54.5 20 Z', '#4a0012', 0.3) +
    k.hl('M10.5 20 C10.5 13 15 9.6 20 9.6 C16.4 11.6 14.4 15 14.6 21 Z', 0.7) + k.c(19.5, 24, 2.2, '#fff', { noStroke: true, op: 0.55 });

  // támadás: keresztbe tett kard és csatabárd (a kard elöl)
  E.tam = k => `<g transform="translate(32 32.5) scale(0.88) translate(-32 -32)"><g transform="translate(32 32) rotate(-42) translate(-32 -32)">` +
    // bárd: fa nyél, félhold alakú acélfej balra, hátul tüske
    k.p('M28.6 12 L35.4 12 L35 61 L29 61 Z', k.mat('wood', 'h')) +
    k.f('M29.8 13 L31.6 13 L31.2 60 L30.2 60 Z', '#fff', 0.35) +
    k.p('M35 15 L43 17.6 L35 22 Z', k.mat('steel'), { sw: 1.8 }) +
    k.p('M30 9.6 C24 10 17 7 11 2.6 C6 12.6 6 27.6 11 37 C17 31.6 24 28.6 30 28.6 Z', k.mat('steel')) +
    k.f('M28 11.6 C22.6 11.6 17 9.6 12.4 6.6 C9.4 14 9.2 22 10.6 28.4 L14 19 Z', '#fff', 0.5) +
    k.s('M11.6 5.4 C7.6 14 7.6 26 11.6 34', '#ffffff', 1.4, 0.85) +
    k.p('M27.6 8 L36.4 8 L36.4 30 L27.6 30 Z', k.mat('dark', 'h'), { sw: 2 }) +
    k.p('M28 56 L36 56 L35.4 62.4 L28.6 62.4 Z', k.mat('bronze', 'v'), { sw: 1.8 }) +
    `</g>` +
    `<g transform="translate(32 32) rotate(42) translate(-32 -32)">` +
    k.p('M27 8 L32 0.5 L37 8 L37 38 L27 38 Z', k.mat('silver', 'v')) +
    k.f('M32 2.5 L32 37 L28.4 37 L28.4 8.6 Z', '#ffffff', 0.55) +
    k.f('M32 2.5 L35.6 8.6 L35.6 37 L32 37 Z', '#3a4266', 0.28) +
    k.p('M18 38 L46 38 C49.5 38 49.5 45 46 45 L18 45 C14.5 45 14.5 38 18 38 Z', k.mat('gold', 'v')) +
    k.f('M18 39.4 L46 39.4 L46 41.2 L18 41.2 Z', '#fff6d0', 0.6) +
    k.p('M28.4 45 L35.6 45 L35.6 55 L28.4 55 Z', k.mat('leather', 'h')) +
    k.s('M28.4 48 L35.6 49.6 M28.4 51.4 L35.6 53', k.INK, 1.3, 0.55) +
    k.c(32, 58.6, 4, k.mat('gold'), { sw: 2 }) + `</g></g>`;

  // védekezés: címerpajzs holdsarlóval
  E.ved = k => k.p('M32 3 L55 9.5 L55 28 C55 44 45 54 32 60.5 C19 54 9 44 9 28 L9 9.5 Z', k.mat('steel')) +
    k.p('M32 8.5 L50 13.6 L50 28 C50 40.5 42.5 49 32 54.8 C21.5 49 14 40.5 14 28 L14 13.6 Z', k.mat(['#a8ccff', '#3a6ad0', '#122a6a']), { sw: 1.6 }) +
    k.f('M32 9.6 L32 53.6 C21.8 48 15 40 15 28 L15 14.4 Z', '#fff', 0.18) +
    k.p(crescent(31, 31, 12, 37, 26, 10), k.mat('silver'), { sw: 1.8 }) +
    k.hl('M12 11.6 L30 6.4 L30 8.4 L13.8 13 L13.8 26 L12 26 Z', 0.5);

  // fürgeség: toll
  E.fur = k => `<g transform="rotate(40 32 32)">` +
    k.p('M32 1 C46 10 48 31 38.5 48 L33.5 53 L30.5 53 C20 44 17 24 32 1 Z', k.mat(['#ffffff', '#c4f4ea', '#3a9a96'])) +
    k.f('M32 3 L31.6 52 C22 43 19.6 24 32 3 Z', '#fff', 0.45) +
    k.s('M44.6 15.6 L39.6 19.6 M46.6 26 L40.4 28.6 M45 37.6 L39.4 38.6 M24.4 19 L28.6 23 M21.4 30 L27 32.6 M22.4 41 L27.4 41.6', k.INK, 1.4, 0.6) +
    k.f('M30.5 53 C27 52 25 49 26 46.5 C28 49 29.6 50 31 50 Z M33.5 53 C37 52 39 49.4 38.4 47 C36.6 49.4 35 50.2 33 50.2 Z', '#e8fff8', 0.9) +
    k.s('M32 4 Q33.4 30 32 62', k.INK, 3.6) + k.s('M32 5 Q33.4 30 32 61', '#fffbe8', 1.6) +
    `</g>`;

  // fáklya: fa nyél, bőrcsavar, nagy láng
  E.fakla = k => k.glow(32, 18, 18, '#ffd27a', 0.6) +
    k.p('M26.5 33 L37.5 33 L36 61.5 L28 61.5 Z', k.mat('wood', 'h')) +
    k.f('M28 34 L31 34 L30.6 60.5 L29.4 60.5 Z', '#fff', 0.35) +
    k.p('M24.6 26.5 L39.4 26.5 L37.8 36.5 L26.2 36.5 Z', k.mat('leather', 'h')) +
    k.s('M25.4 30 L38.8 31.6 M25.8 33.4 L38.4 35', k.INK, 1.2, 0.55) +
    k.p('M26.4 36.5 L37.6 36.5 L37.2 40 L26.8 40 Z', k.mat('dark', 'v'), { sw: 1.6 }) +
    k.p('M31 1.5 C35 8.5 42 9.5 45 17 C48 24 43.5 30 32 30.6 C20.5 30 16 24 19 17 C20.4 13 23.6 12 24.8 7.4 C27.4 11.4 28.4 13.6 29.4 15 C30.4 10 30 5.6 31 1.5 Z', k.lg([[0, '#ffe08a'], [0.5, '#ff8a2a'], [1, '#c8300e']], 0.2, 0, 0.8, 1)) +
    k.f('M32 11 C36 16.6 39.6 20.6 37.8 25 C36.6 28.4 27.6 28.4 26.4 25 C25 20.6 28.6 17.4 32 11 Z', '#fff4b0', 0.95) +
    k.f('M32 18 C34 21 35 23.4 34 25.4 C33 27 31 27 30 25.4 C29.2 23.4 30.4 21 32 18 Z', '#ffffff', 0.9);

  // frissesség: cián holdsarló csillagokkal
  E.frissesseg = k => k.p(crescent(29, 34, 25, 41, 23, 20.5), k.mat(['#f0ffff', '#78e6f0', '#1a7a9a'])) +
    k.hl('M8 28 C9 19 14 13.4 19.4 11 C15.4 15.6 12.4 21 12 28.6 Z', 0.6) +
    k.p(star(47, 31, 7.4, 3.2, 4, -90), k.mat(['#ffffff', '#c8f8ff', '#4ab8d0']), { sw: 1.6 }) +
    k.p(star(52.5, 15, 4.6, 2, 4, -90), k.mat(['#ffffff', '#c8f8ff', '#4ab8d0']), { sw: 1.4 });

  // holdezüst: ezüstérme domború holdsarlóval
  E.holdezust = k => {
    let ticks = '';
    for (let i = 0; i < 9; i++) { const a = (25 + i * 16.25) * R; ticks += `M${f1(32 + 24.5 * Math.cos(a))} ${f1(31 + 24.5 * Math.sin(a))} L${f1(32 + 24.5 * Math.cos(a))} ${f1(35 + 24.5 * Math.sin(a))} `; }
    return k.c(32, 35, 25, k.mat(['#c8d0ec', '#7c86aa', '#3a4266'], 'v')) +
      k.s(ticks, k.INK, 1, 0.45) +
      k.c(32, 31, 25, k.mat('silver')) +
      k.c(32, 31, 19, 'none', { sw: 1.4, stroke: '#7c86aa', op: 0.75 }) +
      k.p(crescent(30, 31, 13, 37.5, 26, 10.8), k.mat(['#ffffff', '#b8c2e2', '#6a7498']), { sw: 1.6 }) +
      k.s('M12.5 24 Q16 13 27 9', '#fff', 2.4, 0.8) + k.spark(45, 39, 3.4, '#ffffff', 0.9);
  };

  // csillagpor: aranycsillag szikrázó porszemekkel
  E.csillagpor = k => k.p(star(29, 35, 23.5, 10.4, 5, -90), k.mat(['#fffbe0', '#ffd23a', '#b86a0c'])) +
    k.f('M29 14 L25 31 L29 35 Z M8.5 28.4 L23.6 29.5 L25.8 34 Z', '#fff', 0.55) +
    k.c(29, 35.6, 3.6, '#fff8d8', { noStroke: true, op: 0.75 }) +
    k.p(star(51, 12, 7.6, 2.6, 4, -90), k.mat(['#ffffff', '#ffe68a', '#d89420']), { sw: 1.4 }) +
    k.p(star(55.5, 33, 4.6, 1.8, 4, -90), k.mat(['#ffffff', '#ffe68a', '#d89420']), { sw: 1.2 }) +
    k.c(44.5, 22.5, 2.2, k.mat('gold'), { sw: 1.2 }) + k.c(53, 47, 2, k.mat('gold'), { sw: 1.2 }) + k.c(12, 9, 2.2, k.mat('gold'), { sw: 1.2 });

  // tapasztalat: nyitott könyv, fölötte ragyogó csillag
  E.tp = k => k.glow(32, 17, 17, '#ffeaa0', 0.85) +
    k.p('M3.5 27 L3.5 52 C14 47.5 24 47.5 32 52.5 C40 47.5 50 47.5 60.5 52 L60.5 27 Z', k.mat(['#b28cff', '#5a34b8', '#20104e'], 'v')) +
    k.p('M32 48.5 C24 43.6 15 43 6.5 45.6 L6.5 25.6 C15 23 24 23.6 32 28.6 Z', k.mat(['#ffffff', '#f2e8d2', '#c4b090'], 'h'), { sw: 1.8 }) +
    k.p('M32 48.5 C40 43.6 49 43 57.5 45.6 L57.5 25.6 C49 23 40 23.6 32 28.6 Z', k.mat(['#f6eedc', '#e2d4b4', '#a8946c'], 'h'), { sw: 1.8 }) +
    k.s('M11 31 C17 29.8 22 30.2 27 32.4 M11 36 C17 34.8 22 35.2 27 37.4 M11 41 C17 39.8 22 40.2 27 42.4 M37 32.4 C42 30.2 47 29.8 53 31 M37 37.4 C42 35.2 47 34.8 53 36', '#8a7a5a', 1.2, 0.6) +
    k.p(star(32, 17, 14, 6.2, 5, -90), k.mat(['#fffbe0', '#ffd23a', '#b86a0c'])) +
    k.f('M32 5 L28.4 15 L32 18 Z', '#fff', 0.6);

  // harcerő: lángoló páncélkesztyűs ököl
  E.harcero = k => {
    const fl = k.lg([[0, '#ffe08a'], [0.45, '#ff7a26'], [1, '#b8200e']], 0.5, 0, 0.5, 1);
    const fing = (x) => k.p(`M${x} 22 C${x} 16 ${x + 9.6} 16 ${x + 9.6} 22 L${x + 9.6} 42 L${x} 42 Z`, k.mat('steel', 'h'), { sw: 2 }) + k.f(`M${x + 1.6} 21.6 C${x + 1.6} 19 ${x + 4.6} 18.4 ${x + 5} 18.6 L${x + 4} 30 L${x + 1.6} 30 Z`, '#fff', 0.55);
    return k.p('M32 1 Q34 7 37.5 10.5 Q40 5 45 3.5 Q44 9 45.5 14 Q50 10 55 10 Q52 15 52.5 20.5 Q57 20 61 22 Q56 26 56 32 L58 38 L6 38 L8 32 Q8 26 3 22 Q7 20 11.5 20.5 Q12 15 9 10 Q14 10 18.5 14 Q20 9 19 3.5 Q24 5 26.5 10.5 Q30 7 32 1 Z', fl) +
      k.f('M32 9 Q34 14 37 16 Q39.6 13 42 12.4 Q41.4 16.6 42.4 20 Q45.6 19 48.4 19.6 Q46 23 46 28 L18 28 Q18 23 15.6 19.6 Q18.4 19 21.6 20 Q22.6 16.6 22 12.4 Q24.4 13 27 16 Q30 14 32 9 Z', '#fff2a0', 0.75) +
      k.p('M15 44 L49 44 L47 61 L17 61 Z', k.mat('dark', 'h')) +
      k.p('M16 47.5 L48 47.5 L47.6 51 L16.4 51 Z', k.mat('gold', 'v'), { sw: 1.4 }) +
      fing(12.4) + fing(22) + fing(31.6) + fing(41.2) +
      k.p('M10.5 37 C10.5 31 14 29.6 18 30.6 L40 34 C45 35 45 44.6 40 45.4 L17 47 C12.6 47.2 10.5 44 10.5 40.5 Z', k.mat('steel')) +
      k.f('M13 34 C14 32 16.4 31.8 18.4 32.4 L38 35.4 L37.4 37.4 L17 35.2 C15 35 13.6 35.4 13 37 Z', '#fff', 0.6) +
      k.gem(40.4, 40.2, 2.6, '#ff6a3a');
  };

  // zsákmány: kötött bőrzsák kikandikáló aranyakkal
  E.zsakmany = k => coin(k, 26, 10, 6.2) + coin(k, 37.5, 8.6, 6.2) +
    k.p('M24 21 C10 27 5.5 41 9.5 50.5 C12.5 58 22 60.5 32 60.5 C42 60.5 51.5 58 54.5 50.5 C58.5 41 54 27 40 21 Z', k.mat(['#ecc890', '#a8743e', '#4e2c12'])) +
    k.f('M23 25 C14 31 11 41 13.4 49 C15 44 17 34 25 27 Z', '#fff', 0.35) +
    k.p('M17 8.5 C22 12.6 25 15 27 19 L37 19 C39 15 42 12.6 47 8.5 C42 11.6 37.6 13.4 32 13 C26.4 13.4 22 11.6 17 8.5 Z', k.mat(['#ecc890', '#b07c44', '#5a3418'])) +
    k.p('M21 18 Q32 22.4 43 18 L43.4 23.6 Q32 28 20.6 23.6 Z', k.mat(['#ffe7a8', '#c8963a', '#6e4a14'], 'v'), { sw: 1.8 }) +
    k.s('M24 23.5 Q22 30 18.6 32.4 M26.4 24.4 Q26 31 23.6 34.6', k.INK, 3.4) + k.s('M24 23.5 Q22 30 18.6 32.4 M26.4 24.4 Q26 31 23.6 34.6', '#d8a850', 1.6) +
    k.p(crescent(33, 42, 8, 36.5, 39, 6.6), k.mat('gold'), { sw: 1.6 }) +
    coin(k, 49, 53, 7.2);

  // láda: kincsesláda aranyveretekkel és zárral
  E.lada = k => {
    const wood = k.mat('wood', 'v'), gold = k.mat('gold', 'v');
    return k.p('M7 29 L7 21 C7 13 13 8 21 8 L43 8 C51 8 57 13 57 21 L57 29 Z', wood) +
      k.f('M10 27 L10 21 C10 14.6 15 11 21 11 L32 11 L32 13.4 L21 13.4 C16 13.4 12.4 16.4 12.4 21 L12.4 27 Z', '#fff', 0.35) +
      k.p('M7 29 L57 29 L57 55 L7 55 Z', k.mat(['#d89a60', '#9a5c30', '#4a2814'], 'v')) +
      k.s('M7 38 L57 38 M7 46.6 L57 46.6', k.INK, 1.2, 0.45) +
      k.f('M7.5 29.5 L56.5 29.5 L56.5 32 L7.5 32 Z', '#fff', 0.18) +
      k.p('M13 8.8 L20 8.4 L20 55 L13 55 Z M44 8.4 L51 8.8 L51 55 L44 55 Z', gold, { sw: 1.8 }) +
      k.p('M5.5 27 L58.5 27 L58.5 31.6 L5.5 31.6 Z', gold, { sw: 1.8 }) +
      k.p('M5.5 53.5 L58.5 53.5 L58.5 57.5 L5.5 57.5 Z', gold, { sw: 1.8 }) +
      k.f('M14 9.6 L15.8 9.6 L15.8 54 L14 54 Z M45 9.6 L46.8 9.6 L46.8 54 L45 54 Z M6.5 28 L57.5 28 L57.5 29.2 L6.5 29.2 Z', '#fff8d8', 0.6) +
      k.p('M25.5 24 L38.5 24 L38.5 37 C38.5 41 35.5 43 32 43 C28.5 43 25.5 41 25.5 37 Z', k.mat('gold')) +
      k.p('M32 29 C34.2 29 34.8 32.4 33.4 33.6 L34.4 38.4 L29.6 38.4 L30.6 33.6 C29.2 32.4 29.8 29 32 29 Z', k.INK, { sw: 0 }) +
      k.c(17.5, 18, 1.4, '#fff3c0', { noStroke: true }) + k.c(47.5, 18, 1.4, '#fff3c0', { noStroke: true });
  };

  // háttérszínek és díszítés a háttéres változathoz
  const BG = {
    elet: { e: ['#ffb8c4', '#b8243a', '#2a0610'], g: '#ff8a9a' },
    tam: { e: ['#ffd8a8', '#b8642a', '#2a1008'], g: '#ffe0b0' },
    ved: { e: ['#d8e4ff', '#4a62b0', '#0e1432'], g: '#bcd2ff' },
    fur: { e: 'nature', g: '#e0fff0' },
    fakla: { e: 'fire', g: '#ffd27a' },
    frissesseg: { e: ['#d8fbff', '#2a8aa8', '#061a2e'], g: '#bff6ff', noSpark: true },
    holdezust: { e: 'moon', g: '#e8eeff' },
    csillagpor: { e: ['#ffe8f8', '#7a4ad0', '#140c3e'], g: '#ffe8a0', noSpark: true },
    tp: { e: 'arcane', g: '#ffe8a0' },
    harcero: { e: 'phys', g: '#ffb070' },
    zsakmany: { e: ['#f6e0b0', '#8a6a3a', '#1e1408'], g: '#ffe0a0' },
    lada: { e: 'holy', g: '#fff0b0' }
  };
  Object.keys(E).forEach(key => {
    const b = BG[key];
    I.def('misc', key, k => k.bg(b.e) + k.glow(32, 33, 27, b.g, 0.55) +
      `<g transform="translate(32 33.5) scale(0.84) translate(-32 -32)">${E[key](k)}</g>` + (b.noSpark ? '' : k.spark(53, 11, 3.6, '#ffffff', 0.9)));
    I.def('misc', key + '-bare', k => E[key](k));
  });
})(typeof window !== 'undefined' ? window : globalThis);
