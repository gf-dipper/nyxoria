/* Nyxoria – ikonok (w1): kard-, íj-, bot- és jogarcsalád további fegyverei. Stílus: js/icons.js fejléce. */
(function (root) {
  'use strict';
  const I = root.NYX.icons;
  const R = Math.PI / 180;
  const f1 = v => Math.round(v * 100) / 100;
  // csillag-sokszög (n ág, R külső, r belső sugár, rot fokban; -90 = felfelé mutató ág)
  const star = (cx, cy, Ro, ri, n, rot = -90) => {
    let d = '';
    for (let i = 0; i < n * 2; i++) { const a = (rot + i * 180 / n) * R, rr = i % 2 ? ri : Ro; d += (i ? 'L' : 'M') + f1(cx + rr * Math.cos(a)) + ' ' + f1(cy + rr * Math.sin(a)); }
    return d + 'Z';
  };
  // vékony fénysugarak egy pont körül
  const rays = (k, cx, cy, r1, r2, n, w, color, op, rot = 0) => {
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = (rot + i * 360 / n) * R;
      d += `M${f1(cx + r1 * Math.cos(a - w * R))} ${f1(cy + r1 * Math.sin(a - w * R))} L${f1(cx + r2 * Math.cos(a))} ${f1(cy + r2 * Math.sin(a))} L${f1(cx + r1 * Math.cos(a + w * R))} ${f1(cy + r1 * Math.sin(a + w * R))} Z`;
    }
    return k.f(d, color, op);
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

  // pallos: széles, kétkezes penge vércsatornával, szárnyas keresztvas, hosszú markolat
  I.def('item', 'pallos', k => {
    // meredeken (≈25°) álló kétkezes kard: a kardnál ~1,5× szélesebb, hosszabb penge, sötét vércsatorna,
    // élezetlen ricasso parírtüskékkel, egyenes keresztvas, kétkezes (hosszú, középen gyűrűs) markolat
    return k.shadow(32, 59, 18, 3.2) +
      `<g transform="translate(32 32) rotate(25) scale(0.94) translate(-32 -32)">` +
      k.p('M23 10 L32 -1 L41 10 L41 37 L23 37 Z', k.mat('steel', 'v')) +
      k.f('M32 1 L32 36 L24.8 36 L24.8 10.6 Z', '#ffffff', 0.5) +
      k.f('M32 1 L39.2 10.6 L39.2 36 L32 36 Z', '#3a4266', 0.3) +
      k.p('M29.8 9 Q32 4.5 34.2 9 L34.2 37 L29.8 37 Z', k.mat('dark', 'h'), { sw: 1.4 }) +
      k.s('M31 9.6 L31 36', '#c8d0f0', 1, 0.7) +
      // ricasso + parírtüskék
      k.p('M27.5 37 L36.5 37 L36.5 42 L27.5 42 Z', k.mat('steel', 'h'), { sw: 2 }) +
      k.p('M27.5 37.4 L21 35.6 L23 40.6 L27.5 40.6 Z M36.5 37.4 L43 35.6 L41 40.6 L36.5 40.6 Z', k.mat('steel'), { sw: 1.8 }) +
      // keresztvas
      k.p('M15 42 L49 42 C52.4 42 52.4 47.4 49 47.4 L15 47.4 C11.6 47.4 11.6 42 15 42 Z', k.mat('gold', 'v')) +
      k.f('M15 43.2 L49 43.2 L49 44.6 L15 44.6 Z', '#fff6d0', 0.6) +
      // hosszú, kétkezes markolat
      k.p('M28.8 47.4 L35.2 47.4 L35.2 60.4 L28.8 60.4 Z', k.mat('leather', 'h')) +
      k.s('M28.8 49.8 L35.2 51 M28.8 57 L35.2 58.2', k.INK, 1.2, 0.55) +
      k.p('M27.8 52.6 L36.2 52.6 L36.2 55.2 L27.8 55.2 Z', k.mat('gold', 'v'), { sw: 1.6 }) +
      k.p('M27 60.2 L37 60.2 L35.2 65 L28.8 65 Z', k.mat('gold', 'v'), { sw: 1.8 }) +
      `</g>`;
  });

  // szablya: ívelt, egyélű penge, kosaras (ív alakú) kézvédő
  I.def('item', 'szablya', k => {
    return k.shadow(30, 59, 20, 3.2) +
      k.p('M16.5 41 C22 25 36 10 58 3.5 C47 15 33 29 25.5 45.5 Z', k.mat('steel')) +
      k.f('M19.5 40 C25 27 36 14 53 6.5 C40 16 30 27 23.5 41.6 Z', '#ffffff', 0.5) +
      k.s('M24.8 43.5 C31 30 42 18 54 8', '#3a4266', 1.4, 0.45) +
      `<g transform="rotate(27 21 43)">` +
      k.s('M28.6 44.5 C36 50 34 60 24 62', k.INK, 6) + k.s('M28.6 44.5 C36 50 34 60 24 62', k.mat('gold'), 3) +
      k.p('M18 46 L24 46 L24 57 L18 57 Z', k.mat('leather', 'h')) +
      k.s('M18 49 L24 50.4 M18 52.4 L24 53.8', k.INK, 1.2, 0.55) +
      k.p('M12 40 L30 40 C32 40 32 46 30 46 L12 46 C10 46 10 40 12 40 Z', k.mat('gold', 'v')) +
      k.f('M12.5 41.3 L29.5 41.3 L29.5 43 L12.5 43 Z', '#fff6d0', 0.6) +
      k.p('M16.5 57 L25.5 57 L24.5 61.5 L17.5 61.5 Z', k.mat('gold', 'v'), { sw: 1.8 }) +
      `</g>` +
      k.gem(21, 43, 2.4, '#e04a5a');
  });

  // hosszúíj: magas, karcsú, függőleges íj, a húr jobb oldalt
  I.def('item', 'hosszúíj', k => {
    const yew = k.mat(['#f2cf98', '#b47a3c', '#57301a'], 'h');
    // a teljes magasságot kitöltő, alig hajló D-ív; a húr majdnem egyenes vonalban a bal oldalon
    const limb = 'M27 3.5 C37 14 40 24 40 32 C40 40 37 50 27 60.5';
    return k.shadow(32, 61, 13, 2.6) +
      k.s('M25.5 5 L25.5 59', k.INK, 3.2) + k.s('M25.5 5 L25.5 59', '#f3ead2', 1.5) +
      k.s(limb, k.INK, 10) + k.s(limb, yew, 5.8) +
      k.s('M29.6 8 C35 14.6 37.6 22 38 27', '#fff', 1.6, 0.5) +
      k.s('M35.6 17 L39 15.4 M36.2 47 L39.6 48.6', k.INK, 1.1, 0.45) +
      k.p('M35 24 L45 24 L45 40 L35 40 Z', k.mat(['#a8e09a', '#3f7a3a', '#173a18'], 'h'), { sw: 2 }) +
      k.s('M35 28 L45 29 M35 32 L45 33 M35 36 L45 37', k.INK, 1, 0.5) +
      k.p('M22 1.4 L31 2 L27 8 Z', k.mat('silver'), { sw: 1.8 }) +
      k.p('M22 62.6 L31 62 L27 56 Z', k.mat('silver'), { sw: 1.8 });
  });

  // számszeríj: felülnézet – acél ív, fa agy, betöltött vessző
  I.def('item', 'számszeríj', k => {
    return k.shadow(32, 59, 17, 3) +
      k.p('M27.5 17 L36.5 17 L37.5 44 L41 57 Q32 62 23 57 L26.5 44 Z', k.mat('wood', 'h')) +
      k.f('M28.6 18 L31 18 L30 44 L26.6 56 L25 56.5 L27.8 44 Z', '#fff', 0.35) +
      k.s('M7.5 28.5 L32 37 L56.5 28.5', k.INK, 3) + k.s('M7.5 28.5 L32 37 L56.5 28.5', '#f3ead2', 1.3) +
      k.p('M3.5 29 Q16 11.5 32 11.5 Q48 11.5 60.5 29 L56.5 31.5 Q45 18 32 18 Q19 18 7.5 31.5 Z', k.mat('steel', 'v')) +
      k.f('M6.5 27 Q17 14 32 13.4 L32 15.4 Q19 16 8 28.6 Z', '#fff', 0.6) +
      k.p('M26 12.5 L38 12.5 L38 21 L26 21 Z', k.mat('dark', 'h'), { sw: 2 }) +
      k.p('M30.4 8 L33.6 8 L33.6 38.5 L30.4 38.5 Z', k.mat('bone', 'h'), { sw: 1.6 }) +
      k.p('M32 1.5 L36.4 9.6 L27.6 9.6 Z', k.mat('silver'), { sw: 1.8 }) +
      k.p('M30.4 31 L26.6 38.4 L30.4 37 Z M33.6 31 L37.4 38.4 L33.6 37 Z', k.mat('#d8404e'), { sw: 1.4 }) +
      k.p('M36.6 42 L41.6 48 L37.4 48.6 Z', k.mat('dark'), { sw: 1.6 });
  });

  // bot: egyszerű fa varázsbot, karmos fej, holdkék gömb
  I.def('item', 'bot', k => {
    const orb = k.rg([[0, '#ffffff'], [0.35, '#c4e4ff'], [0.75, '#4a8ae0'], [1, '#1e3a8a']], 0.38, 0.32, 0.7);
    return k.shadow(26, 58, 16, 3) + k.glow(45.4, 18.6, 18, '#9fd0ff', 0.75) +
      `<g transform="rotate(45 32 32)">` +
      k.p('M29.3 22 L34.7 22 L33.9 61 L30.1 61 Z', k.mat('wood', 'h')) +
      k.f('M30.4 24 L31.9 24 L31.6 60 L30.9 60 Z', '#fff', 0.35) +
      k.s('M29.7 36 L32.6 38 M30 47 L33.4 45.6', k.INK, 1.1, 0.45) +
      k.p('M29.7 56 L34.3 56 L33.6 62.2 L30.4 62.2 Z', k.mat('bronze', 'h'), { sw: 1.8 }) +
      k.p('M29.5 23 C21 20 19.5 10 24.5 3.5 C25 10 26.5 16 31.5 19.5 Z', k.mat('wood', 'h'), { sw: 1.8 }) +
      k.p('M34.5 23 C43 20 44.5 10 39.5 3.5 C39 10 37.5 16 32.5 19.5 Z', k.mat('wood', 'h'), { sw: 1.8 }) +
      k.c(32, 12.5, 8.6, orb) +
      k.s('M27 10 Q28.5 6.4 32.5 6', '#fff', 1.8, 0.85) +
      k.p('M27.6 20.5 L36.4 20.5 L36.4 25.5 L27.6 25.5 Z', k.mat('bronze', 'v'), { sw: 1.8 }) +
      `</g>` + k.spark(53, 9, 3.6) + k.spark(36, 13, 2.2, '#d8eeff');
  });

  // pálca: rövid fa pálca, aranycsillag a hegyén
  I.def('item', 'pálca', k => {
    const gold = k.mat(['#fffbe0', '#ffd23a', '#b86a0c']);
    return k.shadow(24, 57, 14, 2.8) + k.glow(41, 22, 19, '#ffe08a', 0.7) +
      `<g transform="rotate(45 32 32)">` +
      k.p('M30.4 26 L33.6 26 L35 57 L29 57 Z', k.mat('darkwood', 'h')) +
      k.f('M31 28 L32 28 L31.4 56 L30.2 56 Z', '#fff', 0.3) +
      k.p('M28.8 42 L35.2 42 L35.4 45.5 L28.6 45.5 Z', k.mat('gold', 'v'), { sw: 1.6 }) +
      k.p('M28.4 56 L35.6 56 L34.6 60.6 L29.4 60.6 Z', k.mat('gold', 'v'), { sw: 1.6 }) +
      `</g>` +
      k.p(star(41, 22, 14.5, 6.4, 5, -90), gold, { sw: 2.2 }) +
      k.f('M41 9.2 L37.6 17.2 L41 20 Z M28.6 17.9 L37.4 17.1 L39 20.6 Z', '#fff', 0.55) +
      k.c(41, 22.6, 3, '#fff8d8', { noStroke: true, op: 0.8 }) +
      k.spark(56, 10, 3.2) + k.spark(28, 12, 2.6, '#fff4c0');
  });

  // varázsbot: díszes, sötét bot, holdsarló bölcsőben lebegő ibolya kristály
  I.def('item', 'varázsbot', k => {
    const cry = k.mat(['#fff0ff', '#c070f4', '#4a1a8a']);
    return k.shadow(22, 59, 14, 2.8) + k.glow(42.5, 13.5, 18, '#c99aff', 0.75) +
      `<g transform="rotate(30 32 32)">` +
      k.p('M29.4 25 L34.6 25 L33.8 61 L30.2 61 Z', k.mat(['#9a7ab8', '#4e3070', '#1e1030'], 'h')) +
      k.s('M30 31 L34 35 M30 39 L34 43 M30 47 L34 51', '#f0c45a', 1.6, 0.9) +
      k.p('M29.6 57 L34.4 57 L33.6 62.4 L30.4 62.4 Z', k.mat('gold', 'v'), { sw: 1.8 }) +
      k.p(crescent(32, 12, 12.5, 32, 5.5, 10.5), k.mat('gold'), { sw: 2.2 }) +
      k.p('M27 21.5 L37 21.5 L35.6 27 L28.4 27 Z', k.mat('gold', 'v'), { sw: 1.8 }) +
      k.p('M32 1.5 L37 10 L32 18.5 L27 10 Z', cry, { sw: 2 }) +
      k.f('M32 3.5 L32 16.5 L28.6 10 Z', '#fff', 0.55) +
      k.gem(32, 24, 2.2, '#5ad8ff') +
      `</g>` + k.spark(53, 6, 3.4) + k.spark(30, 6, 2.4, '#ecd8ff');
  });

  // jogar: zömök aranyjogar, fején napkorong sugarakkal
  I.def('item', 'jogar', k => {
    return k.shadow(22, 57, 14, 2.8) + k.glow(42, 22, 20, '#ffe49a', 0.75) +
      `<g transform="rotate(45 32 32)">` +
      k.p('M29.4 30 L34.6 30 L34.6 53 L29.4 53 Z', k.mat('gold', 'h')) +
      k.p('M28 37 L36 37 L36 40.5 L28 40.5 Z M28 46 L36 46 L36 49.5 L28 49.5 Z', k.mat('gold', 'v'), { sw: 1.6 }) +
      k.c(32, 56.6, 4.4, k.mat('gold'), { sw: 2 }) +
      k.p('M26.5 26 L37.5 26 L35 32 L29 32 Z', k.mat('gold', 'v'), { sw: 1.8 }) +
      `</g>` +
      k.p(star(42, 22, 15, 10.2, 12, -90), k.mat(['#fff6c8', '#f2c040', '#a8620e']), { sw: 1.8 }) +
      k.c(42, 22, 8.6, k.mat('gold'), { sw: 2 }) +
      k.c(42, 22, 5.6, 'none', { sw: 1, stroke: '#8c5714', op: 0.6 }) +
      k.gem(42, 22, 4, '#ff7a3a') + k.spark(25, 11, 2.8, '#fff6d0');
  });

  // szent bot: hosszú, elefántcsont bot, fején glóriás kereszt
  I.def('item', 'szent bot', k => {
    const ring = 'M23.5 13 A8.5 8.5 0 1 0 40.5 13 A8.5 8.5 0 1 0 23.5 13 Z';
    return k.shadow(24, 59, 14, 2.8) + k.glow(38.2, 15.1, 21, '#fff2c0', 0.8) +
      rays(k, 38.2, 15.1, 12, 19.5, 8, 7, '#fff6d0', 0.55, 22.5) +
      `<g transform="rotate(20 32 32)">` +
      k.p('M29.6 28 L34.4 28 L33.8 61 L30.2 61 Z', k.mat('bone', 'h')) +
      k.p('M29.4 39 L34.6 39 L34.6 42 L29.4 42 Z', k.mat('gold', 'v'), { sw: 1.4 }) +
      k.p('M29.6 57.5 L34.4 57.5 L33.6 62.4 L30.4 62.4 Z', k.mat('gold', 'v'), { sw: 1.6 }) +
      `<path d="${ring}" fill="none" stroke="${k.INK}" stroke-width="7.4"/>` +
      `<path d="${ring}" fill="none" stroke="${k.mat('gold')}" stroke-width="3.6"/>` +
      k.p('M28.6 1.5 L35.4 1.5 L34.6 10 L44 9.4 L44 16.6 L34.6 16 L35 30 L29 30 L29.4 16 L20 16.6 L20 9.4 L29.4 10 Z', k.mat('silver')) +
      k.f('M30 3 L31.8 3 L31.6 29 L30.2 29 Z M21.4 10.8 L29.4 11.3 L29.4 12.8 L21.4 12.6 Z', '#fff', 0.7) +
      k.gem(32, 13, 2.8, '#ffd84a') +
      k.p('M27.6 26 L36.4 26 L35.4 30.5 L28.6 30.5 Z', k.mat('gold', 'v'), { sw: 1.6 }) +
      `</g>` + k.spark(53, 6, 3.2);
  });

  // fénypálca: ezüst pálca, fehér-arany fénykristály sugarakkal
  I.def('item', 'fénypálca', k => {
    const cry = k.mat(['#ffffff', '#fff2b0', '#d8a030']);
    return k.shadow(24, 57, 14, 2.8) + k.glow(43, 21, 20, '#fff4c0', 0.9) +
      rays(k, 43, 21, 9, 18.5, 8, 6.5, '#fffbe0', 0.75, 22.5) +
      `<g transform="rotate(45 32 32)">` +
      k.p('M30.2 28 L33.8 28 L34.6 56 L29.4 56 Z', k.mat('silver', 'h')) +
      k.p('M29 40 L35 40 L35.2 43 L28.8 43 Z', k.mat('gold', 'v'), { sw: 1.4 }) +
      k.p('M28.6 55.4 L35.4 55.4 L34.4 60 L29.6 60 Z', k.mat('gold', 'v'), { sw: 1.6 }) +
      k.p('M32 4.5 L37 12 L37 21.5 L32 27.5 L27 21.5 L27 12 Z', cry, { sw: 2 }) +
      k.f('M32 6 L32 26 L28.4 21 L28.4 12.4 Z', '#fff', 0.7) +
      k.s('M32 6 L32 26', '#c08a20', 0.9, 0.5) +
      k.p('M26 24 L29.5 22 L32 26 L34.5 22 L38 24 L36.4 30.5 L27.6 30.5 Z', k.mat('gold', 'v'), { sw: 1.6 }) +
      `</g>` + k.spark(45, 19, 4.2) + k.spark(26, 12, 2.6, '#fff8d8');
  });
})(typeof window !== 'undefined' ? window : globalThis);
