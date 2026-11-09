/* Nyxoria – képességikonok (minta: kardcsapás, dermesztő jég). Elemhez illő háttér + központi motívum, ragyogással. */
(function (root) {
  'use strict';
  const I = root.NYX.icons;

  // kardcsapás: vaskos, átlós kard és mögötte széles, fehér, ívelt vágásnyom (a hegy útja balról-lentről fel, jobbra)
  I.def('skill', 'kardcsapas', k => {
    const trail = k.lg([[0, '#ffffff', 0], [0.35, '#ffe6cc', 0.55], [1, '#ffffff', 0.98]], 0, 1, 1, 0);
    return k.bg('phys') +
      // széles vágásív: külső és belső ív közti sarló, a vége (jobbra fent) a legvilágosabb
      k.f('M2 56 C-2 22 18 1 58 2 C40 10 28 17 22 27 C17 35 15 45 15 56 Z', trail) +
      k.f('M6 44 C6 22 22 6 52 4 C36 11 24 18 18 28 C14 34 12 39 11 44 Z', '#ffffff', 0.6) +
      k.s('M2 56 C-2 22 18 1 58 2', '#ffffff', 2, 0.85) +
      `<g transform="rotate(45 32 32)">` +
      k.p('M26 9 L32 -1 L38 9 L38 40 L26 40 Z', k.mat('silver', 'v')) +
      k.f('M32 1 L32 39 L27.4 39 L27.4 9.6 Z', '#ffffff', 0.5) + k.f('M32 1 L36.6 9.6 L36.6 39 L32 39 Z', '#3a4266', 0.28) +
      k.p('M17 39 L47 39 C50 39 50 46 47 46 L17 46 C14 46 14 39 17 39 Z', k.mat('gold', 'v')) + k.gem(32, 42.5, 2.6, '#ff5a6a') +
      k.p('M28.5 46 L35.5 46 L35.5 55 L28.5 55 Z', k.mat('leather', 'h')) + k.p('M27 55 L37 55 L35 60 L29 60 Z', k.mat('gold', 'v'), { sw: 2 }) +
      `</g>` + k.spark(54, 4, 5) + k.spark(52, 54, 3.4, '#ffd2b0');
  });

  I.def('skill', 'fagyrog', k => {
    const ice = k.mat(['#ffffff', '#9fe6ff', '#2a78b8']);
    const shard = (r, s) => `<g transform="rotate(${r} 32 32)">${k.p(`M32 ${32 - 22 * s} L${32 + 5 * s} ${32 - 8 * s} L32 32 L${32 - 5 * s} ${32 - 8 * s} Z`, ice, { sw: 1.8 })}${k.f(`M32 ${32 - 20 * s} L${32 + 2 * s} ${32 - 9 * s} L32 ${32 - 4 * s} Z`, '#fff', 0.7)}</g>`;
    return k.bg('frost') + k.glow(32, 32, 26, '#d8f8ff', 0.7) +
      [0, 60, 120, 180, 240, 300].map(r => shard(r, 1)).join('') + [30, 90, 150, 210, 270, 330].map(r => shard(r, 0.55)).join('') +
      k.c(32, 32, 4.5, k.mat(['#fff', '#cff4ff', '#5aaee0']), { sw: 1.6 }) + k.spark(48, 14, 4) + k.spark(14, 50, 3);
  });
})(typeof window !== 'undefined' ? window : globalThis);
