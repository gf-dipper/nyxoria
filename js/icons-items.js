/* Nyxoria – tárgyikonok (minta: kard, íj, gyűrű, páncéling). A rajzolás szabályai a js/icons.js fejlécében. */
(function (root) {
  'use strict';
  const I = root.NYX.icons;

  // kard: átlós, kétoldalt csiszolt penge (bal lap világos, jobb sötétebb), széles keresztvas, bőrös markolat, gomb
  I.def('item', 'kard', k => {
    return k.shadow(32, 58, 20, 3.4) +
      `<g transform="rotate(45 32 32)">` +
      k.p('M26 9 L32 0 L38 9 L38 40 L26 40 Z', k.mat('steel', 'v')) +
      k.f('M32 2 L32 39 L27.4 39 L27.4 9.6 Z', '#ffffff', 0.5) +
      k.f('M32 2 L36.6 9.6 L36.6 39 L32 39 Z', '#3a4266', 0.28) +
      k.s('M32 4 L32 38', '#ffffff', 1.1, 0.8) +
      k.p('M17 39 L47 39 C50 39 50 46 47 46 L17 46 C14 46 14 39 17 39 Z', k.mat('gold', 'v')) +
      k.f('M17 40.4 L47 40.4 L47 42.2 L17 42.2 Z', '#fff6d0', 0.6) +
      k.gem(32, 42.5, 2.6, '#e04a5a') +
      k.p('M28.5 46 L35.5 46 L35.5 56 L28.5 56 Z', k.mat('leather', 'h')) +
      k.s('M28.5 49 L35.5 50.6 M28.5 52.6 L35.5 54.2', k.INK, 1.3, 0.55) +
      k.p('M27 56 L37 56 L35 61 L29 61 Z', k.mat('gold', 'v'), { sw: 2 }) +
      `</g>`;
  });

  // íj: zömök, erősen visszahajló (reflex) rövid íj – a karok vége kifelé kunkorodik, középen bőr markolat, feszes húr
  I.def('item', 'íj', k => {
    // rövid íj: egyetlen C-ív (markolat jobbra), a végein kis visszahajlás; a húr hegytől hegyig feszül
    const limb = 'M12 6 C15 6.5 17.5 8 19.5 10.5 C33 17 44 22 44 32 C44 42 33 47 19.5 53.5 C17.5 56 15 57.5 12 58';
    return k.shadow(30, 59, 17, 3.2) +
      k.s('M13 7 L13 57', k.INK, 3.4) + k.s('M13 7 L13 57', '#f3ead2', 1.7) +
      k.s(limb, k.INK, 10.6) + k.s(limb, k.mat('wood', 'h'), 6.4) +
      k.s('M21 12.6 C31 17.6 39.5 22 41.5 29', '#fff', 1.7, 0.45) +
      k.p('M38.8 25 L47.6 25 L47.6 39 L38.8 39 Z', k.mat('leather', 'h'), { sw: 2 }) +
      k.s('M38.8 29 L47.6 30 M38.8 33 L47.6 34 M38.8 37 L47.6 38', k.INK, 1, 0.5) +
      k.p('M8.5 3.5 L15.5 5 L12.5 9.5 Z', k.mat('gold'), { sw: 1.8 }) + k.p('M8.5 60.5 L15.5 59 L12.5 54.5 Z', k.mat('gold'), { sw: 1.8 });
  });

  // gyűrű: arany karika, foglalt kő
  I.def('item', 'gyűrű', k => {
    return k.shadow(32, 56, 14, 3) +
      `<ellipse cx="32" cy="38" rx="15" ry="13" fill="none" stroke="${k.INK}" stroke-width="9"/>` +
      `<ellipse cx="32" cy="38" rx="15" ry="13" fill="none" stroke="${k.mat('gold')}" stroke-width="5.4"/>` +
      k.s('M20 33 Q24 27 31 26', '#fff8d8', 1.6, 0.8) +
      k.p('M24 24 L40 24 L37 17 L27 17 Z', k.mat('gold'), { sw: 1.8 }) +
      k.gem(32, 17, 7, '#4ad0ff') + k.spark(36, 12, 3.4);
  });

  // páncéling: láncszemes ing bőrszegéllyel
  I.def('item', 'páncéling', k => {
    const mail = k.mat('steel');
    let rings = '';
    for (let y = 22; y <= 50; y += 4) for (let x = 18 + ((y / 4) % 2) * 2; x <= 46; x += 4) rings += `<circle cx="${x}" cy="${y}" r="1.5" fill="none" stroke="${k.INK}" stroke-width="0.7" opacity="0.45"/>`;
    return k.shadow(32, 58, 18, 3) +
      k.p('M22 8 L28 6 Q32 11 36 6 L42 8 L56 18 L50 30 L46 27 L46 54 Q32 58 18 54 L18 27 L14 30 L8 18 Z', mail) +
      `<g clip-path="none">${rings}</g>` +
      k.p('M28 6 Q32 13 36 6 L38 7 Q32 18 26 7 Z', k.mat('leather'), { sw: 1.6 }) +
      k.p('M18 47 Q32 51 46 47 L46 54 Q32 58 18 54 Z', k.mat('leather', 'v'), { sw: 1.8 }) +
      k.hl('M23 11 L12 18 L14 22 L24 15 Z', 0.4);
  });
})(typeof window !== 'undefined' ? window : globalThis);
