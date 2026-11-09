/* Nyxoria – ikonok (w2): tőr, penge, kés, lámpás, szellemlámpás, idézőkönyv, lant, hárfa, furulya, karmok, agyarbuzogány, vadonbot.
   A rajzolás szabályai a js/icons.js fejlécében. */
(function (root) {
  'use strict';
  const I = root.NYX.icons;

  // tőr: rövid, széles levélpenge vércsatornával, ívelt keresztvas, kerek gomb kővel (átlós)
  I.def('item', 'tőr', k => {
    // zömök tőr: rövid (a kard pengéjének ~55%-a), széles levélpenge, kerek tárcsa-keresztvas, vaskos markolat; ≈30°-ban
    return k.shadow(32, 58, 15, 3.2) +
      `<g transform="translate(32 33) rotate(30) translate(-32 -32)">` +
      k.p('M32 10.5 L40 19 L38.6 32 L25.4 32 L24 19 Z', k.mat('steel', 'v')) +
      k.f('M32 12.5 L32 31 L26.6 31 L25.6 19.4 Z', '#ffffff', 0.5) +
      k.f('M32 12.5 L38.4 19.4 L37.4 31 L32 31 Z', '#3a4266', 0.3) +
      k.s('M32 15.5 L32 30', '#5d6688', 1.6, 0.8) +
      // tárcsás keresztvas (élről látott korong)
      `<ellipse cx="32" cy="34.5" rx="9.5" ry="4" fill="${k.mat('gold', 'v')}" stroke="${k.INK}" stroke-width="2.2"/>` +
      k.f('M24.6 33.6 Q32 30.6 39.4 33.6 Q32 32.4 24.6 34.6 Z', '#fff6d0', 0.7) +
      k.p('M28 38.5 L36 38.5 L36 49 L28 49 Z', k.mat('leather', 'h')) +
      k.s('M28 41.6 L36 43.2 M28 45.2 L36 46.8', k.INK, 1.3, 0.55) +
      `<ellipse cx="32" cy="38.5" rx="5.6" ry="2" fill="${k.mat('gold', 'v')}" stroke="${k.INK}" stroke-width="1.6"/>` +
      k.c(32, 53, 5, k.mat('gold')) +
      k.gem(32, 53, 2.4, '#6ad86a') +
      `</g>` + k.spark(48, 12, 3.4);
  });

  // penge: ívelt orgyilkos-penge sötét acélból, lila fényű éllel, tüskés keresztvas
  I.def('item', 'penge', k => {
    const blade = k.lg([[0, '#b8a8ff'], [0.35, '#5a4f86'], [0.75, '#2a2446'], [1, '#160f2a']], 0, 0, 1, 0);
    return k.shadow(32, 58, 18, 3.4) +
      k.glow(36, 22, 22, '#a070ff', 0.45) +
      `<g transform="rotate(42 32 32)">` +
      // ívelt, hullámos hátú penge (balra hajló hegy)
      k.p('M26 38 Q22 31 25.5 26 Q29 21 25 15 Q22 9 18 2 Q31 6 36 15 Q40 22 38 30 L38 38 Z', blade) +
      k.f('M26.5 37 Q23.5 31 27 26 Q30.5 21 27 15 Q25 10 21.5 4.5 Q27 8 30 14 Q32.5 21 30 27 Q28 32 29.5 37 Z', '#d8c8ff', 0.4) +
      k.s('M20 3.6 Q32 8 35.6 17 Q38.6 24 37 31', '#e2d4ff', 1.2, 0.85) +
      k.s('M31 35 Q33 26 31 19', '#c090ff', 1.6, 0.75) +
      // keresztvas
      k.p('M16 37 L22 38 L42 38 L48 35 L46 42 L42 43 L22 43 L18 42 Z', k.mat('dark', 'v')) +
      k.f('M19 38.6 L42 38.6 L46 36.8 L45.4 39.4 L19.5 39.4 Z', '#c8b8ff', 0.45) +
      k.gem(32, 40.5, 2.4, '#b45aff') +
      k.p('M28.5 43 L35.5 43 L35.5 53 L28.5 53 Z', k.mat(['#6a5a8a', '#3a2e56', '#1a1430'], 'h')) +
      k.s('M28.5 46 L35.5 47.6 M28.5 49.6 L35.5 51.2', '#b08aff', 1.1, 0.6) +
      k.p('M27 53 L37 53 L32 61 Z', k.mat('dark', 'v'), { sw: 2 }) +
      `</g>` + k.spark(14, 14, 3.6, '#e8d8ff') + k.spark(50, 30, 2.4, '#d0b0ff');
  });

  // kés: egyetlen egyélű vadászkés – egyenes hát, ívelt él, sötét fém szegecselt kengyel, fa nyél szegecsekkel (átlósan felfelé)
  I.def('item', 'kés', k => {
    return k.shadow(32, 58, 19, 3.2) +
      `<g transform="translate(32 32) rotate(-40) translate(-32 -32)">` +
      // penge: egyenes hát fent, ívelt él lent
      k.p('M25 25 L50 25 C56 25 60 27 62 30.5 C54 38 40 39.5 25 38.5 Z', k.mat('steel', 'v')) +
      k.f('M26 26.4 L50 26.4 C55 26.4 58 27.6 60 29.6 L26 30.6 Z', '#ffffff', 0.55) +
      k.f('M26 33.6 C40 34.2 52 33 59.6 30.8 C53 36.6 40 38 26 37.2 Z', '#3a4266', 0.3) +
      k.s('M27 32.6 C40 33.2 51 32 58 30', '#ffffff', 1.1, 0.75) +
      // kengyel
      k.p('M20.6 23 L26 23 L26 40.5 L20.6 40.5 Z', k.mat('dark', 'h'), { sw: 2 }) +
      // fa nyél
      k.p('M21 26.5 L6 27 C2.6 27.2 1.8 37.8 6 38 L21 37.5 Z', k.mat('wood', 'v')) +
      k.f('M20 27.8 L7 28.2 C5.4 28.4 4.6 30 4.6 31.4 L20 30.6 Z', '#fff', 0.35) +
      k.c(9, 32.4, 1.6, k.mat('gold'), { sw: 1.1 }) + k.c(16, 32.2, 1.6, k.mat('gold'), { sw: 1.1 }) +
      `</g>` + k.spark(50, 10, 3.2);
  });

  // lámpás: bronz kalitkás szellemlámpás, türkiz lánggal, karikafogantyúval
  I.def('item', 'lámpás', k => {
    const br = k.mat('bronze');
    return k.shadow(32, 59, 16, 3.2) +
      `<circle cx="32" cy="8.5" r="5" fill="none" stroke="${k.INK}" stroke-width="5.4"/>` +
      `<circle cx="32" cy="8.5" r="5" fill="none" stroke="${k.mat('bronze')}" stroke-width="2.6"/>` +
      k.p('M22 18 L42 18 L46 24 L18 24 Z', br) +
      k.p('M26 13.5 L38 13.5 L40 18 L24 18 Z', br, { sw: 2 }) +
      k.f('M24 19 L33 19 L32 22.4 L21 22.4 Z', '#fff', 0.35) +
      // üveg, láng
      k.p('M19 24 L45 24 L45 48 L19 48 Z', k.lg([[0, '#1a4a5a'], [1, '#0a2028']], 0, 0, 0, 1)) +
      k.glow(32, 37, 15, '#6affe8', 0.85) +
      k.p('M32 26 Q38 33 37.5 39 Q37 45 32 45.5 Q27 45 26.5 39.5 Q26.5 35 30 32 Q29.6 36 32 37 Q31 32 32 26 Z', k.lg([[0, '#e8fffa'], [0.4, '#7affe6'], [1, '#1fb8a8']], 0, 0, 0, 1), { sw: 1.6 }) +
      k.f('M32 34 Q35 38 34.4 41.6 Q32 43.4 30 41.6 Q30 38.5 32 34 Z', '#ffffff', 0.8) +
      k.hl('M21.5 26 L24.5 26 L24.5 40 L21.5 42 Z', 0.3) +
      // kalitka rudak
      k.p('M17.5 23 L22 23 L22 49 L17.5 49 Z', br, { sw: 1.8 }) + k.p('M42 23 L46.5 23 L46.5 49 L42 49 Z', br, { sw: 1.8 }) +
      k.p('M30.4 24 L33.6 24 L33.6 48 L30.4 48 Z', br, { sw: 1.4, op: 0.85 }) +
      k.s('M22 36 L42 36', k.INK, 1, 0.35) +
      // talp
      k.p('M16 48 L48 48 L45 54 L19 54 Z', br) +
      k.f('M18 49.2 L36 49.2 L35 51.6 L19.2 51.6 Z', '#fff', 0.35) +
      k.spark(50, 30, 3.2, '#c8fff4') + k.spark(13, 40, 2.4, '#c8fff4');
  });

  // szellemlámpás: díszes, gömbölyű ezüst-ibolya lámpás hagymakupolával, kék-lila láng, körülötte lebegő lidércek
  I.def('item', 'szellemlámpás', k => {
    const met = k.mat(['#e8e2ff', '#8a80c0', '#2e2858']);
    const wisp = (x, y, s, flip) => `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">` +
      k.glow(0, 0, 7, '#9af4ff', 0.7) +
      k.p('M0 -4.5 C3.6 -4.5 4.6 -1 3.4 1.6 C2.4 4 -1 5 -4 9 C-3.6 5 -5 3 -4.4 0 C-4 -2.8 -2.4 -4.5 0 -4.5 Z', k.lg([[0, '#ffffff'], [0.5, '#b8f6ff'], [1, '#8a70ff', 0.6]], 0, 0, 0.4, 1), { sw: 1.4 }) +
      k.c(-0.8, -0.8, 0.9, k.INK, { noStroke: true }) + k.c(1.8, -0.8, 0.9, k.INK, { noStroke: true }) + `</g>`;
    return k.shadow(32, 59, 15, 3) +
      k.glow(32, 36, 26, '#8a6aff', 0.55) +
      // akasztó + kupola + tüske
      k.p('M32 2 L34.4 8 L29.6 8 Z', k.mat('silver'), { sw: 1.6 }) +
      k.p('M32 7 C36 9 43 12 44 19 L20 19 C21 12 28 9 32 7 Z', met) +
      k.f('M31 9 C27 11 23 14 22.6 17.6 L28 17.6 C28.4 14 29.6 11 31 9 Z', '#fff', 0.45) +
      k.p('M17 19 L47 19 L45 23 L19 23 Z', met, { sw: 2 }) +
      // gömb üveg
      k.p('M21 23 L43 23 C49 28 49 44 43 49 L21 49 C15 44 15 28 21 23 Z', k.rg([[0, '#3a2a7a'], [1, '#100a2a']], 0.5, 0.55, 0.6)) +
      k.glow(32, 36, 14, '#7af0ff', 0.9) +
      k.p('M32 26 C37 31 39 36 37.4 41 C36 45 28 45 26.6 41 C25.4 37 28 34 30 32.4 C29.6 35.6 31 37 32.4 37.4 C31.4 33 32.6 29 32 26 Z', k.lg([[0, '#ffffff'], [0.45, '#8af4ff'], [1, '#9a6aff']], 0, 0, 0, 1), { sw: 1.6 }) +
      k.f('M32 35 C34.6 38 34.6 41 32.4 42.4 C30.4 42.4 29.6 40 32 35 Z', '#ffffff', 0.85) +
      k.hl('M20.6 28 C19.2 32 19.2 38 20.6 42 L23 41 C22 37 22 33 23.4 28.6 Z', 0.35) +
      // díszes bordák
      k.s('M24.6 23 C21 30 21 42 24.6 49 M39.4 23 C43 30 43 42 39.4 49', k.INK, 3.6) +
      k.s('M24.6 23 C21 30 21 42 24.6 49 M39.4 23 C43 30 43 42 39.4 49', '#b8b0e8', 1.6) +
      // talp
      k.p('M19 49 L45 49 L42 53 L22 53 Z', met, { sw: 2 }) +
      k.p('M24 53 L40 53 L43 57 L21 57 Z', met, { sw: 2 }) +
      k.gem(32, 21, 2.4, '#7af0ff') +
      wisp(11, 22, 1, false) + wisp(53, 33, 0.85, true) + wisp(10, 47, 0.7, false) +
      k.spark(52, 12, 3.2, '#e0fbff');
  });

  // idézőkönyv: vaskos grimoár lila bőrkötésben, arany sarokveretekkel, izzó szemes rúnakörrel és csattal
  I.def('item', 'idézőkönyv', k => {
    const gold = k.mat('gold');
    return k.shadow(32, 58, 21, 3.4) +
      // lapok (jobb és alsó élen)
      k.p('M15 10 L51 10 Q54 10 54 13 L54 53 Q54 56 51 56 L15 56 Z', k.mat(['#fffbea', '#e6dcbc', '#9a8a68'], 'v')) +
      k.s('M50.8 14 L50.8 52 M52.4 14 L52.4 52', '#9a8a68', 0.8, 0.8) +
      // borító
      k.p('M10 7 L47 7 Q50 7 50 10 L50 50 Q50 53 47 53 L10 53 Z', k.mat(['#9a5ad8', '#5a2a8a', '#22103e'])) +
      k.p('M10 7 L17 7 L17 53 L10 53 Z', k.mat(['#7a3ab0', '#3e1a66', '#1a0a30'], 'h'), { sw: 2 }) +
      k.s('M10 14 L17 14 M10 46 L17 46', '#e8b44c', 2.2) +
      k.f('M19 9 L46 9 L46 12 L19 12 Z', '#ffffff', 0.2) +
      // rúnakör + szem
      k.glow(33.5, 30, 15, '#e070ff', 0.7) +
      `<circle cx="33.5" cy="30" r="10" fill="none" stroke="${k.INK}" stroke-width="4"/>` +
      `<circle cx="33.5" cy="30" r="10" fill="none" stroke="#f0a8ff" stroke-width="1.8"/>` +
      k.s('M33.5 18.5 L33.5 21 M33.5 39 L33.5 41.5 M22 30 L24.5 30 M42.5 30 L45 30', '#f0a8ff', 1.6) +
      k.p('M25.5 30 Q33.5 21.5 41.5 30 Q33.5 38.5 25.5 30 Z', k.lg([[0, '#fff2ff'], [1, '#e8b0ff']], 0, 0, 0, 1), { sw: 1.8 }) +
      k.c(33.5, 30, 3.6, k.rg([[0, '#ffe08a'], [0.6, '#ff6a3a'], [1, '#8a1a2a']]), { sw: 1.4 }) +
      k.c(33.5, 30, 1.3, k.INK, { noStroke: true }) +
      // sarokveretek
      k.p('M47 7 Q50 7 50 10 L50 16 L44 7 Z', gold, { sw: 1.6 }) +
      k.p('M50 44 L50 50 Q50 53 47 53 L44 53 Z', gold, { sw: 1.6 }) +
      // csat
      k.p('M44 25 L56 25 Q58 25 58 27 L58 33 Q58 35 56 35 L44 35 Z', k.mat('leather', 'v'), { sw: 2 }) +
      k.p('M51 26.5 L57 26.5 L57 33.5 L51 33.5 Z', gold, { sw: 1.6 }) +
      k.c(54, 30, 1.4, k.INK, { noStroke: true }) +
      k.spark(46, 18, 3, '#ffe0ff');
  });

  // lant: kerek, körtealakú fatest hanglyukkal, nyak érintőkkel, hátrahajló kulcsfej kulcsokkal (átlós)
  I.def('item', 'lant', k => {
    return k.shadow(28, 58, 18, 3.4) +
      `<g transform="rotate(40 32 32)">` +
      // kulcsfej (hátrahajló) + kulcsok
      k.p('M29.4 1.5 L34.6 1.5 L35 13 L29 13 Z', k.mat('darkwood', 'h'), { sw: 2 }) +
      k.p('M25 3.5 L29.4 3.5 L29.4 6.5 L25 6.5 Z', k.mat('gold'), { sw: 1.4 }) +
      k.p('M25 8.5 L29.4 8.5 L29.4 11.5 L25 11.5 Z', k.mat('gold'), { sw: 1.4 }) +
      k.p('M34.6 3.5 L39 3.5 L39 6.5 L34.6 6.5 Z', k.mat('gold'), { sw: 1.4 }) +
      k.p('M34.6 8.5 L39 8.5 L39 11.5 L34.6 11.5 Z', k.mat('gold'), { sw: 1.4 }) +
      // nyak
      k.p('M28.6 12 L35.4 12 L35.8 34 L28.2 34 Z', k.mat('darkwood', 'h')) +
      k.s('M28.6 17 L35.4 17 M28.5 22 L35.5 22 M28.4 27 L35.6 27', '#e8b44c', 1, 0.8) +
      // test
      k.p('M32 28 C44 28 48 40 47 47 C46 56 39 61 32 61 C25 61 18 56 17 47 C16 40 20 28 32 28 Z', k.mat('wood')) +
      k.f('M30 30.5 C23 32 19.6 39 19.6 46 C19.6 50 21 53 23 55 C22 46 24 36 30 30.5 Z', '#fff', 0.35) +
      k.f('M44.5 45 C45 52 40 58 33 59 C40 55 43 50 44.5 45 Z', '#3a1a08', 0.35) +
      k.c(32, 43, 5.4, k.lg([[0, '#2e180c'], [1, '#120806']]), { sw: 2 }) +
      `<circle cx="32" cy="43" r="7.4" fill="none" stroke="#e8b44c" stroke-width="1.4" opacity="0.85"/>` +
      // húrláb
      k.p('M26 52 L38 52 L38 55 L26 55 Z', k.mat('darkwood', 'v'), { sw: 1.6 }) +
      // húrok
      k.s('M30.4 4 L30.4 53 M32 4 L32 53 M33.6 4 L33.6 53', '#fff6dc', 0.8, 0.95) +
      `</g>` + k.spark(50, 44, 3.2) + k.spark(14, 18, 2.4, '#ffe8c0');
  });

  // hárfa: kis arany keretes hárfa, ívelt nyakkal, oszloppal, fa rezonátorral és húrokkal
  I.def('item', 'hárfa', k => {
    const gold = k.mat('gold');
    const strings = [0, 1, 2, 3, 4, 5].map(i => {
      const x = 21.5 + i * 4.8;
      const yTop = 13 + (i === 0 ? 1 : i === 1 ? 1.5 : i === 2 ? 3 : i === 3 ? 4.2 : i === 4 ? 4 : 2.5);
      const yBot = 54 - (x - 20) * 1.28;
      return `M${x} ${yTop} L${x} ${yBot}`;
    }).join(' ');
    return k.shadow(32, 59, 19, 3.2) +
      // rezonátor (fa, átlós)
      k.p('M46 9 L54 12 L22 58 L13 56 Z', k.mat('wood')) +
      k.f('M47 10.6 L50 11.8 L19 56.4 L16 55.8 Z', '#fff', 0.3) +
      k.s('M50 14.6 L19.6 54.6', k.INK, 1, 0.45) +
      // húrok (a nyaktól a rezonátorig)
      k.s(strings, '#fff6dc', 1.1, 0.95) +
      // oszlop
      k.p('M11 12 L17 12 L17.6 52 Q18 56 14 58 L10 58 Q11 54 11 50 Z', gold) +
      k.f('M12.3 13 L14.4 13 L14.4 53 L12.4 55 Z', '#fff8d8', 0.55) +
      // ívelt nyak
      k.p('M8 12 C8 4 16 3 22 7 C28 11 34 12 40 7 C44 4 50 4 53 8 L54 13 C50 10 46 10 42 13 C35 18 27 18 20 14 C16 12 13 12 13 15 Z', gold) +
      k.f('M10 10 C11 6 15 5.6 20 8 C25 11 30 12.6 36 11 C30 14.4 24 13 19 10.6 C15 9 12 9.4 10 10 Z', '#fff8d8', 0.6) +
      // díszgomb a nyak végén és talp
      k.c(10.6, 12, 3.4, gold, { sw: 1.8 }) +
      k.gem(10.6, 12, 1.6, '#4ad0ff') +
      k.p('M8 56 L24 56 L24 60 L8 60 Z', k.mat('gold', 'v'), { sw: 1.8 }) +
      k.spark(56, 26, 3.4) + k.spark(45, 44, 2.4, '#fff6c8');
  });

  // furulya: átlós fafurulya, csőr alakú fúvóka ablakkal, hat lyuk, fém gyűrűk és kis szalag
  I.def('item', 'furulya', k => {
    const holes = [30, 35, 40, 45, 50].map(y => k.c(32, y - 4, 2.6, '#2e180c', { sw: 1.1 })).join('') + k.c(32, 50.5, 1.8, '#2e180c', { sw: 1 });
    return k.shadow(32, 58, 19, 3.2) +
      `<g transform="rotate(45 32 32)">` +
      // test
      k.p('M25 12 L39 12 L38.6 51 L41.6 58 Q32 61.6 22.4 58 L25.4 51 Z', k.mat('wood', 'h')) +
      k.f('M26.6 13 L29.6 13 L29.4 56 L25.8 56 Z', '#fff', 0.35) +
      // fúvóka
      k.p('M25.8 2.5 Q32 0.4 38.2 2.5 L39.4 12 L24.6 12 Z', k.mat('darkwood', 'h'), { sw: 2 }) +
      k.p('M29.4 13.5 L34.6 13.5 L33.6 17 L30.4 17 Z', '#1a0c06', { sw: 1.2 }) +
      // gyűrűk
      k.p('M24 10.4 L40 10.4 L40 14 L24 14 Z', k.mat('gold', 'v'), { sw: 1.6 }) +
      k.p('M24.6 51 L39.4 51 L39.4 54.4 L24.6 54.4 Z', k.mat('gold', 'v'), { sw: 1.6 }) +
      holes +
      `</g>` +
      // szalag a fúvóka alatt
      k.p('M44.6 20 Q42 26 43 33 Q45.6 32 46.4 29 Q47 25 46.6 21 Z', k.mat('#e04a5a'), { sw: 1.6 }) +
      k.p('M45.6 20.4 Q50 24 52.6 29.6 Q50.4 31 48.6 29.4 Q47 26 45.6 21.6 Z', k.mat('#e04a5a'), { sw: 1.6 }) +
      k.c(45.2, 19.6, 2.6, k.mat('#ff6a7a'), { sw: 1.6 }) +
      k.spark(46, 46, 2.8, '#ffe8c0') + k.spark(16, 22, 2.6, '#ffe8c0');
  });

  // karmok: ≈25°-ban döntött bőr harci kesztyű (mandzsetta, kézfej, hüvelykujj, bütykök), a bütykökből három
  // horgas, csontszínű karom nő ki sötét heggyel
  I.def('item', 'karmok', k => {
    const boneC = k.lg([[0, '#2a1a14'], [0.2, '#7a6248'], [0.5, '#e6dcbc'], [1, '#fffbea']], 0, 0, 0, 1);
    const claw = (x, h) => {
      const t = 26 - h;
      return k.p(`M${x - 3.8} 27 C${x - 4.6} ${t + h * 0.45} ${x - 2} ${t + 3} ${x + 7.4} ${t + 1.4} C${x + 2.6} ${t + 5.6} ${x + 3} ${t + h * 0.5} ${x + 3.8} 27 Z`, boneC, { sw: 2 }) +
        k.s(`M${x - 2.2} 25 C${x - 2.6} ${t + h * 0.5} ${x - 0.6} ${t + 5} ${x + 3} ${t + 3}`, '#fff', 1.1, 0.6);
    };
    const lea = k.mat('leather');
    return k.shadow(32, 59, 19, 3.2) +
      `<g transform="translate(31 36) rotate(25) scale(0.92) translate(-32 -34)">` +
      claw(23.5, 24) + claw(31.5, 30) + claw(39.5, 25) +
      // kézfej
      k.p('M19 46 C17 38 17 31 19.5 27 C22 24 42 24 44.5 27 C47 31 47 38 45 46 Z', lea) +
      k.f('M21 44 C19.6 38 19.6 32 21.4 28.4 C23 26.6 28 26 31 26 C26 29 24 36 25 44 Z', '#fff', 0.25) +
      // bütykök
      [21.8, 28.4, 35, 41.6].map(x => k.c(x, 27.6, 3.6, k.mat('dark'), { sw: 1.8 }) + k.c(x - 1, 26.6, 1.1, '#c8cce8', { noStroke: true, op: 0.7 })).join('') +
      // hüvelykujj
      k.p('M19.6 33 C12 31.6 9.6 38 12.6 42 C14.6 44.6 18 44.4 20 42.6 Z', lea, { sw: 2 }) +
      k.s('M25 34 L26.6 43 M32 34 L32 43.6 M39 34 L37.4 43', k.INK, 1.1, 0.4) +
      // mandzsetta
      k.p('M16.5 46 L47.5 46 L50 61 L14 61 Z', k.mat(['#b8784a', '#6e3e1e', '#2e180a'], 'h')) +
      k.p('M16 45 L48 45 L48.4 49.6 L15.6 49.6 Z', k.mat('bronze', 'v'), { sw: 1.8 }) +
      k.s('M22 52 L20.6 59 M32 52 L32 59.4 M42 52 L43.4 59', '#f3d8a8', 1.1, 0.6) +
      `</g>` + k.spark(53, 12, 3.4);
  });

  // agyarbuzogány: göcsörtös, átlós fabunkó; a fején körben kiálló, csontszínű agyarak, bőrrel tekert markolat
  I.def('item', 'agyarbuzogány', k => {
    const bone = k.mat('bone', 'h');
    // agyar a fej szélén (x,y), rot fokkal kifelé fordítva
    const fang = (x, y, rot, s) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">` +
      k.p('M-3.4 0 L3.4 0 C3.6 -5 2 -9.6 -1.8 -13 C-0.6 -8.6 -3.8 -5 -3.4 0 Z', bone, { sw: 1.8 / s }) +
      k.f('M-2.2 -1 L0 -1 C0 -5 -0.4 -7.6 -1.2 -10 C-1.4 -7 -2.6 -4.4 -2.2 -1 Z', '#fff', 0.65) + `</g>`;
    return k.shadow(30, 59, 18, 3.2) +
      k.glow(40, 22, 16, '#ffb070', 0.35) +
      // nyél (átlósan, bal lent → jobb fent)
      k.p('M11 58 L15.6 61.4 L33.6 36.6 L29 33 Z', k.mat('wood', 'h')) +
      k.f('M12.4 57.6 L14 58.8 L31.8 34.6 L30.2 33.4 Z', '#fff', 0.3) +
      // bőr markolat és szíjak
      k.p('M12.4 52.6 L18.4 57 L24.6 48.6 L18.6 44.2 Z', k.mat('leather', 'v')) +
      k.s('M14.4 52.4 L19.6 56 M16.6 49.4 L21.8 53 M18.8 46.4 L24 50', '#f3d8a8', 1.1, 0.55) +
      k.c(13.2, 58.6, 3, k.mat('bronze'), { sw: 1.8 }) +
      // agyarak a fej körül (a fej mögött)
      fang(38, 10, -10, 1) + fang(50, 14, 40, 0.95) + fang(55, 26, 85, 0.9) + fang(26, 17, -62, 0.9) + fang(49, 36, 130, 0.85) + fang(31, 10, -35, 0.8) +
      // a bunkó feje: göcsörtös fa
      k.p('M27 32 C22 26 24 15 32 11 C40 7 50 11 53 19 C56 27 51 36 43 38.6 C37 40.6 31 37 27 32 Z', k.mat('wood')) +
      k.f('M30 28 C28 21 31 15 37 13 C34 17 32.6 22 33.6 28 Z', '#fff', 0.3) +
      // erezet és egy göcs (nem arc: hosszú, ívelt csíkok a fej formáját követik)
      k.s('M31 17 C35 13 43 12 48 16 M30 25 C34 19 43 17 50 21 M33 33 C39 30 46 30 51 26', k.INK, 1, 0.35) +
      k.c(44.6, 28.6, 2.2, k.mat('dark'), { sw: 1.2 }) +
      // bronz pánt a fej tövén
      k.p('M26.4 31 L33.8 37.8 L31.6 40 L24.2 33.2 Z', k.mat('bronze', 'v'), { sw: 1.6 }) +
      k.spark(55, 9, 3.2, '#fffbea');
  });

  // vadonbot: göcsörtös fabot, a tetején ágakból font fészekben izzó zöld mag, levelek
  I.def('item', 'vadonbot', k => {
    const leaf = (x, y, rot, s) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">` +
      k.p('M0 0 C3 -4 9 -5 13 -2 C9 2 4 3 0 0 Z', k.mat(['#d6ffb0', '#58b84a', '#1f5a24']), { sw: 1.6 / s }) +
      k.s('M1 -0.2 C5 -1.6 8 -2 11 -2', '#1f5a24', 0.8, 0.7) + `</g>`;
    return k.shadow(26, 59, 16, 3) +
      k.glow(42, 17, 18, '#9aff6a', 0.75) +
      // bot
      k.p('M12 60 C11 56 14 51 16 46 C18 41 18 36 22 32 C25 29 27 26 30 22 L34.6 25 C32 29 29.6 32 27.6 35.6 C24.6 40 24 44 22 49 C20 54 18 58 17 61 Z', k.mat('wood', 'h')) +
      k.f('M13.6 58 C13.4 54.6 16 50 17.6 46 C19.4 41.4 19.4 37 22.6 33.6 C25 31 27 28 29.6 24.6 L31 25.6 C28.6 29 26.6 32 24.4 35 C21.6 39 21 44 19 48.6 C17.4 52.6 15.4 56 14.8 59.6 Z', '#fff', 0.3) +
      k.s('M19 50 L23 49 M21.6 41 L25 41.6', k.INK, 1.1, 0.5) +
      // fészek: két ívelt ág fonja körbe a magot
      k.p('M30 22 C27 16 30 7 38 5 C35 9 34 14 36 19 Z', k.mat('wood'), { sw: 2 }) +
      k.p('M33 25 C40 28 50 24 52 15 C52 9 48 5 44 4.6 C48 9 48 16 44 20 C41 22.6 37 22.6 34.6 21 Z', k.mat('wood')) +
      k.f('M45.6 6 C48.6 8 49.6 12 49 15.6 C48.4 12 47.4 9 45.6 6 Z', '#fff', 0.4) +
      // mag
      k.glow(41, 13.6, 10, '#d6ffb0', 0.9) +
      k.p('M41 6.6 C45.6 8.6 46.6 14 43.6 18.4 C42 20.4 39.6 20.4 38.2 18.4 C35.6 14 36.6 9 41 6.6 Z', k.lg([[0, '#f4ffd0'], [0.45, '#8aff5a'], [1, '#2a9a2a']], 0.2, 0, 0.8, 1), { sw: 1.8 }) +
      k.f('M40.4 9 C38.4 11 38.2 14 39.4 16 C39.6 13.6 40 11.4 40.4 9 Z', '#fff', 0.8) +
      // levelek
      leaf(29, 24, 200, 1.05) + leaf(34, 23, 20, 0.95) + leaf(24, 37, 160, 0.85) + leaf(37, 5.6, -40, 0.75) +
      k.spark(55, 26, 3.2, '#eaffd0') + k.spark(30, 4.6, 2.4, '#eaffd0');
  });
})(typeof window !== 'undefined' ? window : globalThis);
