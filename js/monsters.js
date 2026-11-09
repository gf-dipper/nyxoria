/* Nyxoria – szörnyek és bossok ugyanabban a stílusban, mint a hősök. Balra néznek (a hős felé).
   Minden faj valódi anatómiára épül (oldalnézet, talajvonal y=300):
   – a közeli oldal végtagjai elöl és világosabbak, a túlsó oldaliak a test mögött, sötétebben;
   – a végtagok ízületes, elvékonyodó formák (limb), nem egyenes pálcikák;
   – a fény balról felülről jön (mint a hősöknél), a test alja árnyékos. */
(function (root) {
  'use strict';
  const R = root.NYX.rig, sh = R.shaded, P = R.P, S = R.S, mix = R.mix, dark = R.dark, light = R.light, line = R.line;
  let UID = 0;
  const f = v => (+v).toFixed(1);

  const PAL = { // test, második, ragyogás
    kodlap: ['#6f9488', '#3f5e58', '#a8ffd8'], holdfeny: ['#5b77b8', '#2f3f78', '#cfe0ff'], arnyromok: ['#6b5a98', '#3a2f62', '#d6a8ff'],
    szirtek: ['#3f92b4', '#1f5a78', '#8ff6ff'], ejkatlan: ['#8a2f56', '#4a1430', '#ff8aa8']
  };
  const KIND_BY_NAME = [
    [/lidérc|szellem|Ködanya|Árnyék|Üresség|Fekete Holdpap|Ködkirálynő/i, 'wisp'],
    [/farkas|kos|Fenevad|Hamuszarvú|lovas|Brekus|Mocsárkirály/i, 'beast'],
    [/gólem|Kő|Kapuőr|lovag|Kristály|Csillagrém|elementál|Lehullott/i, 'golem'],
    [/pók|bogár|Éjszövő|féreg|Holdfaló|Éjanya|kígyó/i, 'spider'],
    [/bagoly|griff|Griff|csőr|Hullócsillag|sárkány/i, 'flyer'],
    [/manó|kobold|Iszap|Rúnatolvaj|pap|vadász|Fenyő|Holdvadász/i, 'imp']
  ];
  function kindOf(name) {
    const n = String(name || '').replace(/^Heti szörny:\s*/, '');
    if (typeof NAMES !== 'undefined' && NAMES[n]) return NAMES[n].kind;
    if (typeof console !== 'undefined' && name) console.warn('Nyxoria: ismeretlen szörnynév, alapértelmezett alak:', name);
    for (const [re, k] of KIND_BY_NAME) if (re.test(name)) return k;
    let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return ['wisp', 'beast', 'golem', 'spider', 'flyer', 'imp'][h % 6];
  }

  // ---------- geometriai segédek ----------
  // Catmull–Rom görbe mintavételezése a vezérlőpontokon át (szélesség is interpolálva)
  function spline(pts, ws, n) {
    const out = [], wo = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        const q = j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
        out.push([q(0), q(1)]); wo.push(ws[i] + (ws[i + 1] - ws[i]) * t);
      }
    }
    out.push(pts[pts.length - 1]); wo.push(ws[ws.length - 1]);
    return [out, wo];
  }
  // elvékonyodó végtag körvonala: a középvonal két oldalára eltolt pontsor, lekerekített végekkel
  function limb(pts, ws, n) {
    const [c, w] = spline(pts, ws, n || 6), Lp = [], Rp = [];
    for (let i = 0; i < c.length; i++) {
      const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      Lp.push([c[i][0] - ty * w[i] / 2, c[i][1] + tx * w[i] / 2]); Rp.push([c[i][0] + ty * w[i] / 2, c[i][1] - tx * w[i] / 2]);
    }
    const e = c[c.length - 1], s0 = c[0];
    return 'M' + Lp.map(p => f(p[0]) + ' ' + f(p[1])).join(' L') + ` Q${f(e[0] + (e[0] - c[c.length - 2][0]) * 0.8)} ${f(e[1] + (e[1] - c[c.length - 2][1]) * 0.8)} ` +
      Rp.reverse().map(p => f(p[0]) + ' ' + f(p[1])).join(' L') + ` Q${f(s0[0] - (c[1][0] - s0[0]) * 0.8)} ${f(s0[1] - (c[1][1] - s0[1]) * 0.8)} ${f(Lp[0][0])} ${f(Lp[0][1])} Z`;
  }
  function ell(cx, cy, rx, ry, rot) {
    const k = 0.5523, a = (rot || 0) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    const T = (x, y) => f(cx + x * ca - y * sa) + ' ' + f(cy + x * sa + y * ca);
    return `M${T(rx, 0)} C${T(rx, ry * k)} ${T(rx * k, ry)} ${T(0, ry)} C${T(-rx * k, ry)} ${T(-rx, ry * k)} ${T(-rx, 0)} C${T(-rx, -ry * k)} ${T(-rx * k, -ry)} ${T(0, -ry)} C${T(rx * k, -ry)} ${T(rx, -ry * k)} ${T(rx, 0)} Z`;
  }
  function glowEye(id, x, y, rx, ry, c, rot) {
    // a forgatás külön, külső csoporton van, mert a pislogó animáció a belső csoport transformját írja felül
    return `<g transform="rotate(${rot || 0} ${x} ${y})"><g class="m-eye"><ellipse cx="${x}" cy="${y}" rx="${f(rx * 2.2)}" ry="${f(ry * 2.2)}" fill="${c}" opacity="0.4" filter="url(#${id}-b4)"/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${light(c, 0.55)}"/><ellipse cx="${f(x - rx * 0.25)}" cy="${f(y - ry * 0.2)}" rx="${f(rx * 0.38)}" ry="${f(ry * 0.4)}" fill="#fff"/></g></g>`;
  }
  // sokszögletű, facettás kő: minden él a középpont felé egy háromszöget kap, a fényirányhoz mért árnyalattal
  function rock(id, pts, col, o) {
    o = o || {};
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length + (o.cx || 0), cy = pts.reduce((s, p) => s + p[1], 0) / pts.length + (o.cy || -6);
    const d = 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join(' L') + ' Z';
    let s = `<path d="${d}" fill="${col}"/>`;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const lit = (-nx * 0.6 - ny * 0.8); // fény balról felülről
      const c2 = lit > 0 ? mix(col, '#e8f0ff', lit * 0.32) : mix(col, '#140a30', -lit * 0.42);
      s += `<path d="M${f(cx)} ${f(cy)} L${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])} Z" fill="${c2}"/>`;
    }
    s += `<path d="M${f(cx)} ${f(cy)} m-${f(o.core || 10)} 0" fill="none"/>`;
    return s + `<path d="${d}" fill="none" stroke="${line(col)}" stroke-width="2.2" stroke-linejoin="round"/>`;
  }

  // ---------- fajok ----------
  const DRAW = {
    // PÓK: kis fejtor elöl, nagy, megemelt potroh hátul, vékony nyélen; nyolc ízelt láb – a térdek a test fölé
    // emelkednek, a lábvégek a talajon; elöl csáprágók méregfoggal és nyolc szem.
    spider(id, c) {
      const legC = dark(c[0], 0.12), farC = dark(c[0], 0.42);
      const near = [
        [[118, 214], [80, 154], [44, 210], [24, 296]],
        [[130, 220], [104, 166], [80, 226], [72, 298]],
        [[146, 222], [184, 160], [212, 226], [222, 298]],
        [[158, 216], [232, 140], [282, 206], [306, 296]]
      ];
      const far = near.map(l => l.map((p, i) => i === 0 ? [p[0] + 8, p[1] - 8] : [p[0] + 14, p[1] - (i === 3 ? 6 : 10)]));
      const W = [15, 11.5, 8, 3];
      const legSvg = (pts, col, isFar) => {
        const d = limb(pts, W, 7);
        let s = isFar ? `<path d="${d}" fill="${col}" stroke="${line(col)}" stroke-width="1.6" stroke-linejoin="round"/>` : sh(id, d, col, { off: [-3, -2], rim: 1.4, sw: 1.8 });
        // ízületi gyűrűk és sörték
        [1, 2].forEach(i => { s += `<ellipse cx="${pts[i][0]}" cy="${pts[i][1]}" rx="${W[i] * 0.62}" ry="${W[i] * 0.5}" fill="${isFar ? col : light(col, 0.18)}" stroke="${line(col)}" stroke-width="1.2"/>`; });
        if (!isFar) {
          const [cc] = spline(pts, W, 7);
          for (let i = 3; i < cc.length - 4; i += 3) s += `<path d="M${f(cc[i][0])} ${f(cc[i][1])} l${i < 7 ? -5 : 4} ${i < 7 ? -4 : -3}" stroke="${line(col)}" stroke-width="1.1" stroke-linecap="round"/>`;
          s += `<path d="${limb(pts.slice(1), W.slice(1), 7)}" fill="none" stroke="${c[2]}" stroke-width="1" opacity="0.35"/>`;
        }
        return s;
      };
      const abd = ell(232, 172, 66, 52, -14);
      let s = `<g class="m-body" style="transform-origin:170px 290px">`;
      s += far.map(l => legSvg(l, farC, true)).join('');
      // potroh: szőrös perem, világító mintázat, fonószemölcs
      let fur = '';
      for (let i = 0; i < 22; i++) { const a = Math.PI * (1.05 + i * 0.9 / 21), x = 232 + Math.cos(a - 0.24) * 67, y = 172 + Math.sin(a - 0.24) * 53; fur += `M${f(x)} ${f(y)} l${f(Math.cos(a - 0.24) * 6)} ${f(Math.sin(a - 0.24) * 6)} `; }
      s += `<path d="${fur}" stroke="${line(c[0])}" stroke-width="2" stroke-linecap="round"/>`;
      s += sh(id, abd, c[0], { off: [-12, -10], dark: 0.42 });
      // potrohminta: a hátvonal mentén futó, egyre kisebb világító foltpárok és köztük egy sötét sáv
      s += `<path d="M176 160 C206 144 248 140 286 160" stroke="${dark(c[0], 0.35)}" stroke-width="12" stroke-linecap="round" fill="none" opacity="0.55"/>`;
      s += `<g class="m-glow">` + [0, 1, 2, 3].map(i => { const x = 196 + i * 24, y = 152 - i * 2 + i * i * 1.6, r = 6 - i * 1.1; return `<ellipse cx="${x}" cy="${f(y - 8)}" rx="${f(r)}" ry="${f(r * 0.7)}" fill="${c[2]}"/><ellipse cx="${x + 2}" cy="${f(y + 9)}" rx="${f(r)}" ry="${f(r * 0.7)}" fill="${c[2]}"/>`; }).join('') + `</g>`;
      s += `<path d="M190 136 C208 124 236 122 258 130" stroke="${light(c[0], 0.5)}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.55"/>`;
      s += sh(id, ell(296, 188, 9, 6, 30), dark(c[0], 0.2), { rim: 1 });
      // nyél és fejtor
      s += sh(id, ell(170, 194, 12, 9, 0), dark(c[0], 0.2), { rim: 1 });
      s += near.slice(0, 2).map(l => legSvg(l, legC, false)).join('');
      s += sh(id, 'M96 200 C96 178 116 166 140 170 C162 174 176 190 172 208 C168 224 148 230 128 228 C108 226 96 216 96 200 Z', c[1], { off: [-6, -5] });
      s += `<path d="M118 178 C130 172 146 172 158 180" stroke="${light(c[1], 0.4)}" stroke-width="3" fill="none" opacity="0.6"/>`;
      s += near.slice(2).map(l => legSvg(l, legC, false)).join('');
      // tapogatók és csáprágók méregfoggal
      s += sh(id, limb([[104, 210], [82, 206], [74, 224]], [7, 5, 4], 5), legC, { rim: 1, sw: 1.4 });
      s += sh(id, 'M98 206 C92 214 92 228 100 234 C108 238 114 230 112 220 C110 212 104 206 98 206 Z', dark(c[1], 0.1), { rim: 1, sw: 1.6 }) +
        sh(id, 'M112 210 C108 218 110 230 118 234 C126 236 128 226 124 218 C122 212 116 208 112 210 Z', c[1], { rim: 1, sw: 1.6 });
      s += P('M100 232 C98 240 100 246 106 250 C104 244 104 238 106 234 Z', '#efe4cc', { sw: 1.2 }) + P('M116 232 C116 240 118 246 124 248 C121 242 121 237 122 233 Z', '#efe4cc', { sw: 1.2 });
      s += `<circle class="m-glow" cx="106" cy="252" r="2.4" fill="#9dff7a"/>`;
      // nyolc szem: két nagy elöl, mellettük kisebbek
      s += glowEye(id, 108, 190, 6, 6, c[2]) + glowEye(id, 124, 186, 5, 5, c[2]) + glowEye(id, 116, 178, 3, 3, c[2]) + glowEye(id, 132, 178, 3, 3, c[2]) +
        glowEye(id, 100, 182, 2.4, 2.4, c[2]) + glowEye(id, 138, 188, 2.4, 2.4, c[2]) + glowEye(id, 106, 172, 2, 2, c[2]) + glowEye(id, 126, 170, 2, 2, c[2]);
      return s + `</g>`;
    },

    // FARKAS: mély mellkas, karcsú derék, izmos far; mellső láb egyenes csuklóval, hátsó láb hátrahajló
    // csánkkal; sörény, hegyes fül, vicsorgó pofa, bozontos farok.
    beast(id, c) {
      const far = dark(c[0], 0.38), fur = c[0], belly = light(c[0], 0.18);
      const paw = (x, y, col) => sh(id, `M${x - 13} ${y + 4} C${x - 15} ${y - 4} ${x - 8} ${y - 9} ${x} ${y - 9} C${x + 8} ${y - 9} ${x + 12} ${y - 3} ${x + 11} ${y + 4} Z`, col, { rim: 1.2, sw: 1.8 }) +
        `<path d="M${x - 6} ${y + 4} l0 -5 M${x} ${y + 4} l0 -6 M${x + 5} ${y + 4} l0 -5" stroke="${line(col)}" stroke-width="1.2"/>` + P(`M${x - 14} ${y + 4} l3 -3 l1 3 Z M${x - 8} ${y + 4} l3 -3 l1 3 Z`, '#efe4cc', { sw: 0.8 });
      let s = `<g class="m-body" style="transform-origin:180px 300px">`;
      // túlsó lábak
      s += `<path d="${ell(258, 200, 26, 34, -18)}" fill="${far}"/><path d="${limb([[260, 220], [250, 246], [270, 268], [264, 290]], [24, 14, 10, 9])}" fill="${far}" stroke="${line(far)}" stroke-width="1.8"/>` + paw(260, 292, far);
      s += `<path d="${ell(154, 196, 18, 26, 8)}" fill="${far}"/><path d="${limb([[154, 212], [154, 244], [150, 270], [148, 290]], [20, 13, 10, 9])}" fill="${far}" stroke="${line(far)}" stroke-width="1.8"/>` + paw(142, 292, far);
      // farok
      s += `<g class="m-tail" style="transform-origin:276px 164px">` + sh(id, limb([[274, 162], [298, 142], [314, 112], [318, 80]], [18, 28, 24, 4], 6), fur, { off: [-5, -4] });
      s += `<path d="${limb([[310, 120], [316, 100], [318, 80]], [22, 18, 4], 5)}" fill="${belly}" opacity="0.9"/>`;
      s += S('M290 140 C302 124 308 110 312 96 M298 150 C310 132 316 118 318 104', dark(fur, 0.3), 1.4, { op: 0.6 }) + `</g>`;
      // törzs: hát vonala, mély mellkas, behúzott has, bozontos alj
      s += sh(id, 'M118 152 C140 134 190 128 230 134 C258 138 278 150 284 174 C290 198 280 218 264 228 L256 236 L250 226 L240 232 L236 222 C214 220 190 224 168 228 L160 238 L154 226 L144 234 L138 222 C122 222 108 210 104 194 C100 178 106 162 118 152 Z', fur, { off: [-12, -9], dark: 0.4 });
      s += S('M128 146 C160 132 210 130 256 140', light(fur, 0.5), 3, { op: 0.6 }) + S('M244 176 C254 192 256 206 250 220 M168 170 C176 182 180 196 178 210', dark(fur, 0.3), 1.6, { op: 0.5 });
      // közeli lábak
      // hátsó láb: izmos comb a testből, hátrahajló csánk, vékonyodó lábszár
      s += sh(id, limb([[244, 222], [232, 248], [252, 270], [244, 290]], [26, 15, 11, 10]), fur, { off: [-4, -3] }) + paw(240, 292, fur);
      s += sh(id, ell(246, 196, 32, 40, -16), fur, { off: [-8, -6], dark: 0.3, stroke: false }) + S('M222 170 C214 196 220 222 238 234', dark(fur, 0.35), 1.8, { op: 0.6 }) + S('M240 166 C256 164 268 176 270 192', light(fur, 0.4), 2.4, { op: 0.5 });
      // mellső láb: lapocka és könyök a mellkasból, egyenes alkar, csukló
      s += sh(id, limb([[130, 216], [128, 246], [124, 270], [120, 290]], [20, 15, 11, 10]), fur, { off: [-4, -3] }) + paw(114, 292, fur);
      s += sh(id, ell(134, 200, 22, 30, 6), fur, { off: [-6, -5], dark: 0.3, stroke: false }) + S('M150 182 C156 204 150 222 138 232', dark(fur, 0.35), 1.6, { op: 0.6 });
      // sörény a nyakon
      s += sh(id, 'M156 146 C152 124 132 108 110 106 C100 128 96 160 104 198 L112 188 L116 202 L124 190 L132 200 L136 186 C150 176 158 164 156 146 Z', light(fur, 0.12), { off: [-5, -4] });
      // fej: homlok, hosszú pofa, állkapocs; fülek
      s += sh(id, 'M84 100 L82 66 L100 94 Z', far, { rim: 1, sw: 1.8 });
      s += sh(id, 'M124 116 C114 98 94 92 76 98 C64 102 54 110 46 118 L26 126 C16 130 14 140 20 146 C26 152 38 154 50 154 C58 166 72 172 88 170 C104 168 118 158 124 142 C128 132 128 124 124 116 Z', fur, { off: [-7, -5] });
      s += sh(id, 'M96 100 L104 62 L118 108 Z', fur, { rim: 1.2, sw: 1.8 }) + `<path d="M101 94 L104 72 L112 102 Z" fill="${dark(c[1], 0.1)}" opacity="0.8"/>`;
      s += S('M48 118 C64 112 80 110 96 112', light(fur, 0.45), 2.4, { op: 0.6 });
      // pofa: orr, száj, agyarak, pofaszőr
      s += `<ellipse cx="19" cy="134" rx="6" ry="5" fill="#120a24"/><ellipse cx="17" cy="132" rx="2" ry="1.4" fill="#fff" opacity="0.7"/>`;
      s += P('M22 146 C32 150 46 152 60 150 C56 158 42 160 30 156 Z', '#2a0e1c', { stroke: line(fur), sw: 1.4 });
      s += P('M30 148 L33 157 L36 149 Z M44 150 L47 159 L50 150 Z', '#efe4cc', { sw: 0.8 }) + P('M52 151 L54 156 L56 151 Z', '#efe4cc', { sw: 0.6 });
      s += S('M118 138 L128 142 L120 148 L130 154', light(fur, 0.12), 2.2) + S('M26 126 C38 124 52 124 62 128', dark(fur, 0.35), 1.2, { op: 0.6 });
      // szem mérges szemöldökívvel
      s += S('M58 112 L84 118', dark(fur, 0.55), 3) + glowEye(id, 72, 122, 6.5, 3.6, c[2], -10);
      return s + `</g>`;
    },

    // GÓLEM: facettás sziklatömbökből rakott test, a fej alacsonyan a vállak között, hatalmas karok
    // földig érő ököllel, a repedésekben izzó rúnák, a vállon moha és kristály.
    golem(id, c) {
      const base = c[0], farC = dark(c[0], 0.35), moss = '#4f8a52';
      let s = `<g class="m-body" style="transform-origin:170px 300px">`;
      // túlsó kar és láb
      s += rock(id, [[232, 108], [270, 120], [276, 160], [250, 172], [226, 150]], farC);
      s += rock(id, [[246, 166], [272, 172], [276, 222], [252, 230], [240, 200]], farC);
      s += rock(id, [[236, 222], [282, 220], [292, 262], [270, 290], [236, 284], [228, 252]], farC);
      s += rock(id, [[190, 240], [228, 238], [236, 296], [188, 298]], farC);
      // törzs
      s += rock(id, [[112, 128], [150, 96], [220, 98], [258, 136], [252, 210], [216, 248], [140, 250], [104, 204]], base, { cy: -10 });
      s += `<g class="m-glow">` + S('M150 130 L168 158 L156 188 M214 126 L198 160 L216 196 M168 158 L198 160', c[2], 3.2) + `</g>`;
      s += `<circle class="m-glow" cx="182" cy="178" r="18" fill="${c[2]}" opacity="0.55" filter="url(#${id}-b4)"/><path class="m-glow" d="M182 162 L194 178 L182 194 L170 178 Z" fill="${light(c[2], 0.5)}" stroke="${c[2]}" stroke-width="1.4"/>`;
      // közeli láb
      s += rock(id, [[130, 242], [172, 240], [180, 298], [124, 298]], dark(base, 0.12));
      // közeli kar: váll, felkar, hatalmas ököl
      s += rock(id, [[90, 120], [132, 112], [146, 150], [120, 172], [86, 160]], base);
      s += rock(id, [[86, 160], [120, 168], [116, 214], [82, 216], [76, 186]], dark(base, 0.05));
      s += rock(id, [[52, 216], [118, 212], [126, 254], [108, 292], [58, 294], [44, 258]], base, { cy: -8 });
      s += S('M66 252 L104 250 M64 268 L108 266', line(base), 2, { op: 0.6 });
      // fej (alacsonyan, előreugró homlokkal)
      s += rock(id, [[100, 104], [118, 66], [166, 56], [202, 76], [206, 116], [176, 138], [116, 134]], base);
      s += P('M112 96 L186 88 L188 104 L114 112 Z', '#120a24', { stroke: line(base), sw: 1.6 });
      s += glowEye(id, 132, 102, 8, 4.2, c[2], -5) + glowEye(id, 166, 98, 8, 4.2, c[2], -5);
      s += S('M124 124 L140 118 L154 126 L170 118 L182 124', dark(base, 0.55), 2.4) + S('M110 92 C130 80 170 74 196 82', light(base, 0.5), 2, { op: 0.6 });
      // moha és kristályok
      s += `<path d="M94 122 C102 112 118 108 132 112 C126 118 116 118 108 124 C102 126 96 126 94 122 Z" fill="${moss}"/><path d="M124 66 C140 56 168 54 190 66 C176 68 160 66 146 72 C136 74 128 72 124 66 Z" fill="${moss}"/>` +
        S('M100 118 l-2 -6 M110 114 l0 -7 M122 112 l2 -6 M136 64 l-1 -6 M152 60 l0 -7 M172 60 l2 -6', '#6fbf6a', 1.6);
      s += [[226, 104, 22, -0.4], [238, 112, 30, 0.1], [250, 120, 18, 0.5]].map(([x, y, h, a]) => {
        const ca = Math.cos(a), sa = Math.sin(a), T = (px, py) => f(x + px * ca - py * sa) + ' ' + f(y + px * sa + py * ca);
        return `<path d="M${T(-5, 0)} L${T(-5, -h * 0.75)} L${T(0, -h)} L${T(5, -h * 0.75)} L${T(5, 0)} Z" fill="${light(c[2], 0.2)}" stroke="${dark(c[2], 0.5)}" stroke-width="1.2"/><path d="M${T(0, 0)} L${T(0, -h)} L${T(5, -h * 0.75)} L${T(5, 0)} Z" fill="${dark(c[2], 0.2)}" opacity="0.6"/>`;
      }).join('') + `<ellipse class="m-glow" cx="238" cy="96" rx="22" ry="18" fill="${c[2]}" opacity="0.3" filter="url(#${id}-b4)"/>`;
      return s + `</g>`;
    },

    // LIDÉRC: előrehajló, csuklyás jelenés. A csuklya hegye hátralendül, az arc helye mély sötétség,
    // benne csak két ferde, izzó szem. Lába nincs: a lepel hátrafelé egy kunkorodó, elhalványuló
    // szellemfarokban végződik, az alja rongyos. Előrenyúló, csontos, karmos kéz.
    wisp(id, c) {
      const g = `${id}-wg`, gi = `${id}-wv`, bone = mix(c[2], '#ffffff', 0.55);
      let s = `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="${light(c[0], 0.15)}" stop-opacity="0.97"/><stop offset="0.55" stop-color="${c[0]}" stop-opacity="0.85"/><stop offset="1" stop-color="${dark(c[0], 0.1)}" stop-opacity="0.2"/></linearGradient>` +
        `<radialGradient id="${gi}" cx="0.55" cy="0.4" r="0.6"><stop offset="0" stop-color="#000" stop-opacity="1"/><stop offset="0.8" stop-color="#07031a" stop-opacity="1"/><stop offset="1" stop-color="${dark(c[0], 0.5)}" stop-opacity="1"/></radialGradient></defs>`;
      s += `<g class="m-float">`;
      s += `<ellipse cx="176" cy="170" rx="104" ry="120" fill="${c[2]}" opacity="0.16" filter="url(#${id}-b12)"/>`;
      // hátsó, halványabb leplek a mélységért
      s += `<path d="M200 150 C228 170 240 200 236 230 C248 254 272 262 292 246 C288 270 258 282 232 270 C222 244 214 210 196 176 Z" fill="${dark(c[0], 0.3)}" opacity="0.45"/>`;
      // test: csuklya → hát → kunkorodó farok → rongyos szegély → elöl fel a csuklya pereméig
      // váll, keskenyedő derék, hátrafelé kanyarodó és felkunkorodó szellemfarok
      const body = 'M150 72 C170 58 204 52 238 36 C228 58 214 74 200 90 C206 110 206 132 200 150 C214 160 224 178 222 200 C220 226 206 248 214 268 C226 290 264 300 288 282 C296 276 300 264 296 252 C306 278 292 304 260 308 C236 310 214 300 200 288 L190 298 L184 280 L172 292 L168 272 L154 282 L156 262 L142 268 C146 246 140 220 132 196 C122 180 112 166 108 150 C100 128 102 104 116 88 C126 78 138 74 150 72 Z';
      s += `<path d="${body}" fill="url(#${g})"/>`;
      s += `<path d="M150 72 C170 58 204 52 238 36 M108 150 C100 128 102 104 116 88 C126 78 138 74 150 72 M132 196 C140 220 146 246 142 268" fill="none" stroke="${light(c[2], 0.3)}" stroke-width="2.4" stroke-linecap="round" opacity="0.7"/>`;
      s += `<path d="${body}" fill="none" stroke="${dark(c[0], 0.45)}" stroke-width="1.6" stroke-linejoin="round" opacity="0.6"/>`;
      // ráncok a lepelben
      s += S('M178 98 C186 130 190 160 186 200 C184 230 188 256 200 282 M206 160 C212 190 208 224 210 256 M154 186 C160 214 164 240 162 270', dark(c[0], 0.3), 2, { op: 0.45 }) +
        S('M166 92 C176 124 178 160 172 210', light(c[0], 0.35), 2.4, { op: 0.4 }) + S('M226 272 C246 290 270 292 288 280', light(c[2], 0.2), 2, { op: 0.5 });
      // izzó mag a mellkasban
      s += `<circle class="m-glow" cx="170" cy="176" r="18" fill="${c[2]}" opacity="0.45" filter="url(#${id}-b4)"/><circle class="m-glow" cx="170" cy="176" r="4" fill="${light(c[2], 0.6)}"/>`;
      // csuklya pereme és az arc sötétsége
      s += `<path d="${ell(136, 126, 22, 32, 14)}" fill="url(#${gi})"/>`;
      s += `<path d="M118 100 C126 88 146 86 158 96 C164 104 164 118 160 132" fill="none" stroke="${light(c[0], 0.25)}" stroke-width="5" stroke-linecap="round" opacity="0.8"/>`;
      s += `<path d="M118 100 C126 88 146 86 158 96" fill="none" stroke="${line(c[0])}" stroke-width="1.4" opacity="0.7"/>`;
      // két ferde, izzó szem (a túlsó kisebb), halvány pofacsont-ív
      s += glowEye(id, 128, 122, 5.5, 2.4, c[2], 16) + glowEye(id, 146, 116, 4.2, 2, c[2], 22);
      // előrenyúló kar: rongyos ujj, csontos kéz hosszú karmokkal
      // lelógó, rongyos ujjú ruhaujj: a felső éle ívesen fut előre, az alja lefelé csüng
      const sleeve = 'M170 150 C148 146 124 152 104 162 L96 156 L98 168 L88 170 L96 180 L90 192 L102 192 L100 206 L112 200 L118 212 L126 202 C142 208 158 206 172 198 Z';
      s += S('M100 176 L80 180 M100 182 L82 184', bone, 2.4) + `<path d="${sleeve}" fill="${c[0]}" opacity="0.94"/>` +
        `<path d="M170 150 C148 146 124 152 104 162 M126 202 C142 208 158 206 172 198" fill="none" stroke="${light(c[2], 0.3)}" stroke-width="1.6" opacity="0.6"/>` +
        S('M160 160 C140 162 122 168 108 176 M162 180 C146 184 130 190 116 196 M150 196 C138 198 126 200 118 202', dark(c[0], 0.3), 1.4, { op: 0.5 });
      s += `<ellipse cx="76" cy="180" rx="10" ry="8" fill="${bone}" stroke="${dark(bone, 0.45)}" stroke-width="1.4"/>`;
      s += [[[70, 176], [56, 166], [42, 168]], [[68, 180], [52, 176], [38, 182]], [[68, 184], [54, 186], [44, 196]], [[72, 188], [62, 196], [58, 208]], [[82, 174], [76, 162], [66, 156]]]
        .map(p => `<path d="${limb(p, [4.2, 3, 1], 5)}" fill="${bone}" stroke="${dark(bone, 0.45)}" stroke-width="1.1" stroke-linejoin="round"/>`).join('');
      s += `<circle cx="72" cy="180" r="16" fill="${c[2]}" opacity="0.25" filter="url(#${id}-b4)"/>`;
      // lebegő szellemszikrák
      s += [[110, 230], [210, 200], [250, 150], [140, 260], [96, 140], [230, 260]].map(([x, y], i) => `<circle class="m-p" style="animation-delay:-${(i * 0.6).toFixed(1)}s" cx="${x}" cy="${y}" r="${2 + (i % 3) * 0.6}" fill="${c[2]}"/>`).join('');
      return s + `</g>`;
    },

    // BAGOLYSZERŰ RAGADOZÓ: tojás alakú tollas test, arckorong, nagy szemek, horgas csőr, fülpamacsok;
    // a szárny evezőtollakból áll, alul markoló karmok.
    flyer(id, c) {
      const wingC = c[1], body = c[0], belly = light(c[0], 0.3);
      const wing = (dir) => {
        // a szárny a test oldalán ered; elülső éle ívesen fut a szárnyvégig, a hátsó élét az evezőtollak
        // lekerekített csúcsai adják, a fedőtollak világosabb sávja az elülső él mentén húzódik
        const X = x => 170 + dir * (x - 170);
        const tips = [[318, 104], [314, 124], [304, 142], [290, 158], [272, 170], [252, 178], [230, 180], [212, 174]];
        let d = `M${X(204)} 132 C${X(236)} 104 ${X(276)} 92 ${X(318)} 104`;
        for (let i = 1; i < tips.length; i++) {
          const a = tips[i - 1], b = tips[i], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
          const ix = mx + (204 - mx) * 0.12, iy = my + (140 - my) * 0.12;
          d += ` Q${f(X(a[0] + 4))} ${f(a[1] + 6)} ${f(X(ix))} ${f(iy)} Q${f(X(b[0] + 2))} ${f(b[1] - 2)} ${f(X(b[0]))} ${f(b[1])}`;
        }
        d += ` L${X(204)} 168 Z`;
        let s = sh(id, d, wingC, { off: [-6, -5] });
        s += tips.slice(1).map((b, i) => { const a = tips[i], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; return S(`M${f(X(mx + (204 - mx) * 0.12))} ${f(my + (140 - my) * 0.12)} L${f(X(232 + i * 2))} ${f(128 + i * 4)}`, dark(wingC, 0.35), 1.2, { op: 0.7 }); }).join('');
        s += sh(id, `M${X(204)} 132 C${X(236)} 104 ${X(276)} 92 ${X(310)} 102 C${X(290)} 112 ${X(272)} 118 ${X(256)} 128 Q${X(246)} 136 ${X(238)} 132 Q${X(228)} 142 ${X(220)} 138 Q${X(212)} 148 ${X(204)} 146 Z`, light(wingC, 0.18), { rim: 1.2, sw: 1.4 });
        return s;
      };
      let s = `<g class="m-float">`;
      s += `<g class="m-wingR" style="transform-origin:204px 150px">${wing(1)}</g><!--WL-->`;
      // farok
      s += [[-10, 0], [0, 4], [10, 0]].map(([dx, dy]) => sh(id, limb([[170 + dx * 0.3, 232], [170 + dx, 262 + dy]], [12, 8], 3), dark(body, 0.2), { rim: 1, sw: 1.4 })).join('');
      // test
      s += sh(id, 'M170 104 C206 104 224 140 222 182 C220 224 198 248 170 248 C142 248 120 224 118 182 C116 140 134 104 170 104 Z', body, { off: [-10, -8] });
      s += sh(id, 'M170 156 C192 156 204 178 202 204 C200 228 186 240 170 240 C154 240 140 228 138 204 C136 178 148 156 170 156 Z', belly, { off: [-5, -4], stroke: false });
      for (let r = 0; r < 4; r++) for (let k = 0; k < 4 - (r % 2); k++) { const x = 152 + k * 12 + (r % 2) * 6, y = 176 + r * 15; s += `<path d="M${x - 5} ${y} Q${x} ${y + 6} ${x + 5} ${y}" stroke="${dark(belly, 0.3)}" stroke-width="1.4" fill="none" opacity="0.7"/>`; }
      // fülpamacsok, arckorong, szemek, csőr
      s += sh(id, 'M136 120 L118 82 L150 112 Z', dark(body, 0.15), { rim: 1, sw: 1.6 }) + sh(id, 'M204 120 L222 82 L190 112 Z', dark(body, 0.15), { rim: 1, sw: 1.6 });
      s += sh(id, ell(152, 140, 20, 18, 0), light(body, 0.22), { rim: 1, sw: 1.6 }) + sh(id, ell(188, 140, 20, 18, 0), light(body, 0.22), { rim: 1, sw: 1.6 });
      s += S('M134 120 L168 134 M206 120 L172 134', dark(body, 0.6), 4);
      s += `<circle cx="152" cy="141" r="11" fill="#0c0620"/><circle cx="188" cy="141" r="11" fill="#0c0620"/>` + glowEye(id, 152, 141, 8, 8, c[2]) + glowEye(id, 188, 141, 8, 8, c[2]);
      s += P('M162 150 C164 144 176 144 178 150 L172 166 C170 170 168 168 166 164 Z', '#e8b94a', { stroke: '#8a5a1a', sw: 1.4 });
      // karmok
      s += [154, 186].map(x => sh(id, limb([[x, 238], [x, 252]], [12, 9], 3), dark(body, 0.1), { rim: 1, sw: 1.4 }) +
        [-7, 0, 7].map(dx => S(`M${x + dx * 0.4} 254 Q${x + dx} 260 ${x + dx * 1.2} 266`, '#3a2a1a', 3)).join('')).join('');
      s = s.replace('<!--WL-->', `<g class="m-wingL" style="transform-origin:136px 150px">${wing(-1)}</g>`);
      return s + `</g>`;
    },

    // KOBOLD: görnyedt, vékony végtagú kis lény nagy fejjel, lelógó hegyes fülekkel, hosszú orral,
    // fogas vigyorral; foltozott tunika, öv erszénnyel, szöges bunkó a kezében.
    imp(id, c) {
      const skin = c[0], cloth = c[1], far = dark(skin, 0.35);
      const foot = (x, y, col) => sh(id, `M${x + 10} ${y} C${x + 10} ${y - 8} ${x} ${y - 10} ${x - 10} ${y - 8} C${x - 20} ${y - 6} ${x - 26} ${y - 2} ${x - 26} ${y + 2} L${x + 10} ${y + 2} Z`, col, { rim: 1.2, sw: 1.8 });
      let s = `<g class="m-body" style="transform-origin:160px 300px">`;
      // túlsó láb és kar
      s += `<path d="${limb([[178, 236], [190, 262], [182, 290]], [16, 11, 9])}" fill="${far}" stroke="${line(far)}" stroke-width="1.6"/>` + foot(190, 296, far);
      s += `<path d="${limb([[196, 176], [214, 204], [206, 232]], [14, 10, 9])}" fill="${far}" stroke="${line(far)}" stroke-width="1.6"/><circle cx="206" cy="236" r="7" fill="${far}" stroke="${line(far)}" stroke-width="1.6"/>`;
      // közeli láb
      s += sh(id, limb([[150, 236], [136, 264], [148, 290]], [18, 12, 10]), skin, { off: [-3, -2] }) + foot(156, 296, skin);
      // tunika rongyos szegéllyel, öv, erszény
      s += sh(id, 'M136 172 C150 160 192 160 204 174 L212 236 L202 230 L196 244 L186 234 L178 248 L168 236 L160 248 L152 234 L142 244 L136 230 L126 238 Z', cloth, { off: [-6, -5] });
      s += S('M132 216 C152 224 188 224 210 214', '#3a2418', 6) + `<rect x="160" y="214" width="10" height="9" rx="2" fill="#c4702a" stroke="#5a3a1a" stroke-width="1.2"/>`;
      s += sh(id, 'M190 222 C200 220 206 228 204 238 C200 246 188 246 186 238 C184 230 184 224 190 222 Z', '#7a5232', { rim: 1, sw: 1.4 });
      s += P('M176 186 L190 184 L188 196 L174 198 Z', light(cloth, 0.2), { sw: 1 }) + S('M178 186 l2 10 M184 185 l2 10', dark(cloth, 0.4), 0.8);
      // fej: nagy, előreugró orr, lelógó fülek
      s += sh(id, 'M206 112 C226 104 250 108 268 120 C252 122 238 128 226 140 C222 128 216 118 206 112 Z', far, { rim: 1, sw: 1.6 });
      s += sh(id, 'M120 120 C118 92 140 74 168 76 C194 78 210 98 208 124 C206 150 188 170 162 170 C140 170 122 148 120 120 Z', skin, { off: [-8, -6] });
      s += sh(id, 'M134 112 C110 102 86 104 64 116 C84 118 100 126 112 142 C118 130 126 120 134 112 Z', skin, { rim: 1.2, sw: 1.8 }) + `<path d="M124 116 C108 112 92 112 80 116 C94 120 104 126 112 136 Z" fill="${dark(skin, 0.3)}" opacity="0.6"/>`;
      s += sh(id, 'M134 126 C126 128 116 134 112 142 C114 150 126 150 136 144 Z', light(skin, 0.06), { rim: 1, sw: 1.6 });
      s += `<circle cx="150" cy="96" r="2.4" fill="${dark(skin, 0.25)}"/><circle cx="186" cy="104" r="1.8" fill="${dark(skin, 0.25)}"/>`;
      s += S('M134 108 L152 114 M168 112 L186 106', dark(skin, 0.55), 3) + glowEye(id, 146, 120, 6, 5, c[2], 8) + glowEye(id, 176, 118, 6, 5, c[2], -8);
      s += P('M134 150 C144 144 170 144 182 148 C178 160 146 164 134 150 Z', '#1a0a14', { stroke: line(skin), sw: 1.4 }) + P('M140 150 L143 156 L146 149 L150 156 L153 148 L157 155 L160 148 L164 155 L168 148 L172 154 L176 149 Z', '#efe4cc', { sw: 0.6 });
      // közeli kar szöges bunkóval
      s += sh(id, limb([[140, 178], [118, 200], [102, 220]], [16, 12, 10]), skin, { off: [-3, -2] });
      s += sh(id, limb([[100, 250], [92, 190], [78, 128]], [8, 12, 22], 5), '#7a5232', { off: [-3, -2], rim: 1.2 });
      s += [[72, 132, -1], [86, 142, 1], [76, 154, -1]].map(([x, y, d]) => P(`M${x} ${y} l${d * 9} -3 l${-d * 2} 6 Z`, '#cfd6ea', { sw: 0.8 })).join('');
      s += `<circle cx="100" cy="222" r="9" fill="${skin}" stroke="${line(skin)}" stroke-width="1.8"/>` + S('M94 218 l10 0 M94 224 l10 0', dark(skin, 0.4), 1);
      return s + `</g>`;
    }
  };


  // ---------- további fajok (az ellenőrzés után: minden névhez a neve szerinti lény) ----------
  // keresztirányú gyűrűk egy cső mentén (féreg szelvényei, kígyó hasi pikkelyei)
  function bands(pts, ws, n, every, from, to, side) {
    const [c, w] = spline(pts, ws, n || 6); let d = '';
    for (let i = Math.max(1, from || 1); i < Math.min(c.length - 1, to || c.length - 1); i += every) {
      const a = c[i - 1], b = c[i + 1]; let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const h = w[i] / 2, s0 = side === 'L' ? 0 : -h, s1 = side === 'R' ? 0 : h;
      d += `M${f(c[i][0] - ty * s0)} ${f(c[i][1] + tx * s0)} Q${f(c[i][0] + tx * 4)} ${f(c[i][1] + ty * 4)} ${f(c[i][0] - ty * s1)} ${f(c[i][1] + tx * s1)} `;
    }
    return d;
  }
  function crystal(x, y, h, a, c) {
    const ca = Math.cos(a), sa = Math.sin(a), T = (px, py) => f(x + px * ca - py * sa) + ' ' + f(y + px * sa + py * ca), w = Math.max(4, h * 0.2);
    return `<path d="M${T(-w, 0)} L${T(-w, -h * 0.75)} L${T(0, -h)} L${T(w, -h * 0.75)} L${T(w, 0)} Z" fill="${light(c, 0.2)}" stroke="${dark(c, 0.5)}" stroke-width="1.2"/><path d="M${T(0, 0)} L${T(0, -h)} L${T(w, -h * 0.75)} L${T(w, 0)} Z" fill="${dark(c, 0.2)}" opacity="0.6"/>`;
  }
  Object.assign(DRAW, {
    // KÍGYÓ: a farok a földön összetekeredik, a nyak magasra ágaskodik, mögötte kiterített csuklya;
    // ék alakú fej, villás nyelv, méregfogak, a hason világos haspikkelyek.
    serpent(id, c, o) {
      const body = c[0], far = dark(c[0], 0.38), belly = light(c[0], 0.42);
      const back = [[150, 280], [184, 256], [236, 250], [276, 262], [288, 280]];
      const main = [[318, 230], [308, 262], [280, 280], [228, 286], [178, 284], [142, 272], [120, 248], [112, 216], [120, 182], [130, 152], [122, 128]];
      const W = [4, 12, 24, 32, 34, 32, 30, 28, 26, 24, 22];
      let s = `<g class="m-body" style="transform-origin:200px 300px">`;
      s += `<path d="${limb(back, [30, 32, 32, 30, 26], 6)}" fill="${far}" stroke="${line(far)}" stroke-width="1.8"/>`;
      // csuklya a nyak mögött, rajta a világító „szemüveg”-minta
      s += sh(id, 'M128 104 C158 110 170 146 162 184 C158 204 142 214 124 212 C102 210 90 194 88 168 C86 136 100 106 128 104 Z', dark(body, 0.1), { off: [-6, -5] });
      s += `<path class="m-glow" d="M120 140 C132 134 146 142 146 156 C146 170 132 176 122 168 M110 178 C120 186 138 186 148 176" fill="none" stroke="${c[2]}" stroke-width="3" stroke-linecap="round" opacity="0.8"/>`;
      s += sh(id, limb(main, W, 6), body, { off: [-6, -5], dark: 0.35 });
      // hasi pikkelyek a felénk forduló oldalon, háti pikkelyminta
      const neck = main.slice(5).map(p => [p[0] - 7, p[1]]);
      s += `<path d="${limb(neck, [14, 13, 12, 11, 10, 9], 6)}" fill="${belly}" opacity="0.92"/>`;
      s += S(bands(neck, [14, 13, 12, 11, 10, 9], 6, 2), dark(belly, 0.3), 1.2, { op: 0.8 });
      s += S(bands(main, W, 6, 3, 8, 50, 'R'), dark(body, 0.35), 1.4, { op: 0.6 });
      s += S('M300 262 C286 282 262 292 228 294 M130 270 C120 250 116 226 120 196', light(body, 0.45), 2.4, { op: 0.5 });
      // fej
      s += sh(id, 'M132 128 C128 110 114 100 96 100 C78 100 62 108 52 118 C46 126 50 134 58 138 C72 144 94 148 112 146 C126 144 134 138 132 128 Z', body, { off: [-6, -5] });
      s += S('M60 118 C76 110 96 108 118 114', light(body, 0.45), 2.4, { op: 0.6 }) + S('M56 132 C74 136 94 138 110 136', dark(body, 0.5), 1.6);
      s += P('M70 135 L73 145 L76 136 Z M86 137 L88 145 L91 137 Z', '#efe4cc', { sw: 0.8 });
      s += `<path class="m-tongue" d="M54 128 L34 130 L26 124 M34 130 L26 136" fill="none" stroke="#e0405a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
      s += S('M82 108 L106 114', dark(body, 0.6), 3) + glowEye(id, 94, 117, 6, 3, c[2], 8);
      s += `<ellipse cx="64" cy="122" rx="2" ry="1.4" fill="#120a24"/>`;
      return s + `</g>`;
    },

    // BÉKA (láp királya): zömök test, előrefordított széles fej, kidülledő szemek, széles száj, fehéres
    // torokzsák, behajlított, izmos hátsó láb úszóhártyás lábfejjel, bibircsókos hát, lelógó moha-„szakáll”.
    frog(id, c, o) {
      const skin = c[0], far = dark(c[0], 0.38), belly = mix(light(c[0], 0.35), '#e8e0b8', 0.35);
      const web = (x, y, col, dir) => sh(id, `M${x + 6 * dir} ${y - 10} C${x - 4 * dir} ${y - 12} ${x - 16 * dir} ${y - 8} ${x - 26 * dir} ${y - 2} C${x - 30 * dir} ${y + 1} ${x - 28 * dir} ${y + 3} ${x - 24 * dir} ${y + 2} L${x - 18 * dir} ${y} L${x - 14 * dir} ${y + 3} L${x - 8 * dir} ${y + 1} L${x - 2 * dir} ${y + 3} L${x + 6 * dir} ${y + 1} Z`, col, { rim: 1, sw: 1.6 }) + [[-24, 2], [-14, 3], [-2, 3]].map(([dx, dy]) => `<circle cx="${x + dx * dir}" cy="${y + dy - 1}" r="3" fill="${light(col, 0.2)}" stroke="${line(col)}" stroke-width="1"/>`).join('');
      let s = `<g class="m-body" style="transform-origin:180px 300px">`;
      s += `<path d="${ell(248, 246, 44, 30, -18)}" fill="${far}" stroke="${line(far)}" stroke-width="1.8"/>`;
      s += `<path d="${limb([[166, 250], [176, 278], [170, 296]], [18, 13, 11])}" fill="${far}" stroke="${line(far)}" stroke-width="1.6"/>` + web(178, 300, far, -1);
      // test és fej egyben
      s += sh(id, 'M92 196 C90 160 120 132 166 130 C220 128 266 158 278 202 C288 244 268 284 224 294 L150 296 C116 292 98 268 94 236 Z', skin, { off: [-12, -10], dark: 0.4 });
      s += sh(id, 'M94 214 C104 250 130 270 168 274 C196 276 214 270 226 262 C212 290 182 296 150 294 C116 290 98 266 94 236 Z', belly, { off: [-4, -3], stroke: false });
      s += S('M108 168 C134 148 182 140 226 152', light(skin, 0.45), 3, { op: 0.6 });
      // bibircsókok
      s += [[196, 160, 6], [222, 172, 5], [246, 190, 6], [180, 180, 4], [236, 214, 4], [206, 196, 5], [258, 222, 4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${dark(skin, 0.22)}"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.4}" fill="${light(skin, 0.35)}"/>`).join('');
      // száj, torok, moha-szakáll
      s += S('M92 210 C112 222 150 226 190 212', dark(skin, 0.6), 3) + S('M190 212 C196 210 200 204 198 198', dark(skin, 0.6), 2.4);
      if (o && o.old) s += `<path d="M110 224 C114 240 112 254 106 266 M124 228 C130 246 128 262 122 276 M140 230 C146 244 146 256 142 266" fill="none" stroke="#5f8a4a" stroke-width="4" stroke-linecap="round" opacity="0.85"/>`;
      // kidülledő szemek
      s += sh(id, ell(122, 142, 20, 18, 0), skin, { off: [-4, -3] }) + sh(id, ell(158, 132, 18, 16, 0), dark(skin, 0.08), { off: [-4, -3] });
      s += `<circle cx="122" cy="142" r="12" fill="#0c0620"/><circle cx="158" cy="132" r="10" fill="#0c0620"/>` + glowEye(id, 122, 142, 8, 4, c[2]) + glowEye(id, 158, 132, 7, 3.4, c[2]);
      s += S('M104 130 C114 124 132 124 140 132 M144 120 C152 116 166 116 174 122', dark(skin, 0.55), 3.2);
      s += `<ellipse cx="96" cy="190" rx="2.4" ry="1.6" fill="#120a24"/>`;
      // közeli hátsó láb: izmos comb, behajlított lábszár, úszóhártyás lábfej
      s += sh(id, ell(236, 254, 48, 34, -16), skin, { off: [-6, -5] });
      s += sh(id, limb([[268, 264], [262, 288], [222, 296]], [26, 18, 14], 6), skin, { off: [-4, -3] }) + web(214, 300, skin, 1);
      // közeli mellső láb
      s += sh(id, limb([[136, 246], [126, 274], [122, 294]], [22, 15, 12]), skin, { off: [-4, -3] }) + web(124, 300, skin, 1);
      return s + `</g>`;
    },

    // FÉREG: a földből kiemelkedő, szelvényes óriásféreg; a teste a hős felé hajlik, a feje kerek,
    // fogkoszorús száj, mélyén izzás; a hátán holdsarló alakú világító foltok.
    worm(id, c, o) {
      const body = c[0], pts = [[232, 302], [228, 250], [214, 198], [188, 160], [152, 134], [116, 122]], W = [70, 64, 58, 54, 50, 52];
      let s = `<g class="m-body" style="transform-origin:220px 300px">`;
      // kitúrt föld
      s += `<path d="M160 300 C170 280 196 274 232 276 C268 274 292 282 300 300 Z" fill="#3a2a2a"/><path d="M168 300 C178 288 200 284 232 286 C262 284 282 290 290 300" fill="none" stroke="#5a4440" stroke-width="3"/>`;
      s += sh(id, limb(pts, W, 7), body, { off: [-8, -6], dark: 0.38 });
      s += S(bands(pts, W, 7, 3, 2, 34), dark(body, 0.4), 2.2, { op: 0.75 }) + S(bands(pts, W.map(w => w - 6), 7, 3, 3, 34, 'L'), light(body, 0.4), 1.4, { op: 0.5 });
      s += S('M244 270 C240 226 228 190 204 164 C184 146 160 134 134 128', light(body, 0.4), 3, { op: 0.45 });
      s += `<g class="m-glow">` + [[206, 196, 10], [176, 156, 8], [228, 246, 9]].map(([x, y, r]) => `<path d="M${x} ${y - r} A${r} ${r} 0 1 0 ${x} ${y + r} A${f(r * 0.65)} ${r} 0 1 1 ${x} ${y - r} Z" fill="${c[2]}" opacity="0.85"/>`).join('') + `</g>`;
      s += [[270, 290], [180, 292], [292, 296]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="5" fill="#2a1e1e" stroke="#5a4440" stroke-width="1.2"/>`).join('');
      // száj: a hős felé néző fogkoszorú
      s += sh(id, ell(110, 122, 18, 34, -8), dark(body, 0.15), { off: [-3, -2] });
      s += `<path d="${ell(106, 122, 11, 25, -8)}" fill="#12040e"/><ellipse class="m-glow" cx="108" cy="122" rx="6" ry="14" fill="${c[2]}" opacity="0.6" filter="url(#${id}-b4)"/>`;
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, x = 106 + Math.cos(a) * 11, y = 122 + Math.sin(a) * 25, ix = 106 + Math.cos(a) * 4, iy = 122 + Math.sin(a) * 12; s += `<path d="M${f(x - Math.sin(a) * 3)} ${f(y + Math.cos(a) * 4)} L${f(ix)} ${f(iy)} L${f(x + Math.sin(a) * 3)} ${f(y - Math.cos(a) * 4)} Z" fill="#efe4cc" stroke="#6a5a4a" stroke-width="0.6"/>`; }
      return s + `</g>`;
    },

    // BOGÁR: kupolás, kemény szárnyfedő, előrenyúló kristályszarv, három pár ízelt láb; a páncélon
    // kristályok nőnek, a szárnyfedőn fényes csík.
    beetle(id, c, o) {
      const shell = c[0], far = dark(c[0], 0.42), legC = dark(c[1], 0.1);
      const leg = (pts, col, isFar) => { const d = limb(pts, [12, 8, 6, 3], 6); return isFar ? `<path d="${d}" fill="${col}" stroke="${line(col)}" stroke-width="1.4"/>` : sh(id, d, col, { rim: 1.2, sw: 1.6 }); };
      let s = `<g class="m-body" style="transform-origin:200px 300px">`;
      [[[170, 250], [150, 270], [128, 284], [112, 298]], [[214, 254], [214, 272], [222, 288], [230, 298]], [[262, 250], [282, 266], [298, 282], [314, 298]]].forEach(l => { s += leg(l.map(([x, y]) => [x + 12, y - 8]), far, true); });
      // szárnyfedő
      s += sh(id, 'M150 236 C148 170 196 124 256 130 C302 136 326 180 318 228 C314 252 298 262 276 264 L166 264 C156 262 150 252 150 236 Z', shell, { off: [-12, -10], dark: 0.42 });
      s += S('M168 226 C190 196 236 180 300 190', dark(shell, 0.45), 2.4, { op: 0.7 }) + S('M178 168 C204 144 246 138 282 150', light(shell, 0.6), 5, { op: 0.55 });
      s += [[214, 140, 30, -0.3], [236, 134, 40, 0.05], [258, 140, 26, 0.4], [282, 154, 22, 0.7]].map(([x, y, h, a]) => crystal(x, y, h, a, c[2])).join('') + `<ellipse class="m-glow" cx="240" cy="122" rx="34" ry="20" fill="${c[2]}" opacity="0.3" filter="url(#${id}-b4)"/>`;
      // előtor és fej
      s += sh(id, ell(138, 224, 32, 30, -10), dark(shell, 0.1), { off: [-6, -5] });
      s += S('M116 206 C130 196 150 196 164 206', light(shell, 0.5), 3, { op: 0.6 });
      s += sh(id, ell(100, 236, 22, 20, 0), dark(shell, 0.2), { off: [-4, -3] });
      // kristályszarv és csáprágók
      s += `<path d="M104 220 C88 196 80 168 86 136 C96 164 108 186 122 204 Z" fill="${light(c[2], 0.25)}" stroke="${dark(c[2], 0.5)}" stroke-width="1.4"/><path d="M96 206 C88 186 86 164 88 146" stroke="#fff" stroke-width="2" opacity="0.6" fill="none"/>`;
      s += P('M82 244 C70 246 64 254 68 262 C74 256 80 254 88 252 Z', dark(shell, 0.4), { sw: 1.2 }) + S('M96 222 C84 206 70 198 56 196 M104 220 C98 202 92 192 82 184', line(shell), 1.6);
      s += glowEye(id, 92, 232, 5, 4, c[2]);
      [[[150, 252], [128, 266], [106, 280], [92, 298]], [[196, 260], [190, 276], [198, 290], [204, 298]], [[248, 260], [266, 274], [280, 286], [292, 298]]].forEach(l => { s += leg(l, legC, false); });
      return s + `</g>`;
    }
  });


  Object.assign(DRAW, {
    // GRIFF: oroszlántest, sasfej horgas csőrrel és tolltaréjjal, hatalmas felemelt szárnyak,
    // elöl sasláb karmokkal, hátul oroszlánláb, bojtos farok.
    griffin(id, c, o) {
      const fur = c[0], far = dark(c[0], 0.38), feather = mix(c[0], '#e8e0d0', 0.35), talon = '#d6b25a';
      const wing = (dx, dy, col, rot) => {
        const tips = [[300, 34], [306, 58], [302, 84], [292, 106], [276, 126], [256, 142], [234, 154]];
        let d = `M170 168 C188 120 230 64 300 34`;
        for (let i = 1; i < tips.length; i++) { const a = tips[i - 1], b = tips[i]; d += ` Q${a[0] - 14} ${a[1] + 14} ${b[0]} ${b[1]}`; }
        d += ` C212 166 190 176 170 178 Z`;
        return `<g transform="translate(${dx} ${dy}) rotate(${rot || 0} 170 170)">` + sh(id, d, col, { off: [-6, -5] }) +
          tips.slice(1).map((b, i) => S(`M${b[0] - 6} ${b[1] - 4} L${200 + i * 4} ${150 - i * 10}`, dark(col, 0.3), 1.2, { op: 0.6 })).join('') +
          sh(id, 'M170 168 C188 120 230 64 296 38 C270 70 240 96 222 124 C206 144 190 160 172 172 Z', light(col, 0.15), { rim: 1, sw: 1.2 }) + `</g>`;
      };
      const claw = (x, y, col) => [-12, -4, 4].map(dx => sh(id, limb([[x, y - 6], [x + dx * 0.8, y - 1], [x + dx * 1.3, y + 4]], [6, 4, 1.6], 4), col, { rim: 0.8, sw: 1.2 })).join('');
      let s = `<g class="m-body" style="transform-origin:190px 300px">`;
      s += `<g class="m-wingR" style="transform-origin:180px 170px">${wing(22, -6, dark(c[1], 0.15), -8)}</g>`;
      s += `<path d="${limb([[254, 226], [244, 258], [262, 280], [258, 294]], [30, 15, 11, 10])}" fill="${far}" stroke="${line(far)}" stroke-width="1.6"/>`;
      s += `<path d="${limb([[152, 232], [148, 264], [146, 292]], [16, 10, 8])}" fill="${dark(talon, 0.35)}" stroke="${line(talon)}" stroke-width="1.4"/>` + claw(146, 296, dark(talon, 0.35));
      s += sh(id, limb([[280, 196], [306, 214], [318, 244], [312, 268]], [12, 9, 7, 5], 6), fur, { rim: 1, sw: 1.4 }) + sh(id, ell(310, 274, 9, 13, 20), dark(c[1], 0.1), { rim: 1, sw: 1.4 });
      s += sh(id, 'M126 172 C146 152 200 148 238 154 C268 158 288 174 290 198 C292 222 276 240 250 244 L156 244 C130 242 114 226 112 206 C112 192 116 180 126 172 Z', fur, { off: [-10, -8], dark: 0.4 });
      s += S('M140 160 C176 150 222 150 262 162', light(fur, 0.45), 3, { op: 0.55 });
      // tollas mell és nyak
      s += sh(id, 'M150 148 C140 128 128 112 112 108 C96 124 92 160 102 204 C114 214 132 214 146 204 C156 186 158 166 150 148 Z', feather, { off: [-5, -4] });
      for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) { const x = 108 + k * 13 + (r % 2) * 6, y = 140 + r * 14; s += `<path d="M${x - 6} ${y} Q${x} ${y + 7} ${x + 6} ${y}" stroke="${dark(feather, 0.3)}" stroke-width="1.3" fill="none" opacity="0.7"/>`; }
      s += `<path d="${limb([[256, 226], [240, 260], [258, 282], [252, 294]], [36, 17, 12, 11])}" fill="${fur}" stroke="${line(fur)}" stroke-width="1.8"/>` + sh(id, ell(248, 294, 13, 6, 0), fur, { rim: 1, sw: 1.4 });
      s += sh(id, limb([[130, 230], [124, 264], [120, 292]], [18, 12, 9]), talon, { rim: 1, sw: 1.4 }) + S('M118 250 l12 0 M117 262 l11 0 M116 274 l10 0', dark(talon, 0.4), 1.1) + claw(120, 296, talon);
      // fej: tolltaréj, horgas csőr
      s += sh(id, 'M132 102 L162 84 L146 104 L170 100 L148 116 Z', dark(feather, 0.2), { rim: 1, sw: 1.4 });
      s += sh(id, 'M136 116 C132 96 116 84 98 86 C84 88 72 98 70 112 C68 126 76 140 92 146 C108 150 124 144 132 134 C136 128 138 122 136 116 Z', feather, { off: [-6, -5] });
      s += sh(id, 'M74 104 C60 102 46 108 40 122 C36 132 42 140 50 136 C48 128 54 122 64 122 C70 122 74 118 74 112 Z', '#e8b94a', { stroke: '#7a5418', sw: 1.6 });
      s += S('M48 134 C56 128 64 126 72 128', '#7a5418', 1.6);
      s += S('M78 98 L104 104', dark(feather, 0.6), 3) + glowEye(id, 92, 108, 6, 3.6, c[2], 8);
      s += `<g class="m-wingL" style="transform-origin:180px 170px">${wing(0, 0, c[1])}</g>`;
      return s + `</g>`;
    },

    // SÁRKÁNYFIÓKA: négylábú hüllőtest, ívelt nyak, szarvas fej, kicsi hártyás szárny,
    // hosszú, felkunkorodó farok, a hátán kristálytüskék.
    drake(id, c, o) {
      const sc = c[0], far = dark(c[0], 0.38), belly = light(c[0], 0.38), memb = mix(c[1], c[2], 0.25);
      const claw = (x, y, col) => [-8, -1, 6].map(dx => P(`M${x + dx} ${y - 4} l${-4} 7 l6 -2 Z`, '#efe4cc', { sw: 0.8 })).join('') + sh(id, ell(x, y - 4, 12, 6, 0), col, { rim: 1, sw: 1.4 });
      let s = `<g class="m-body" style="transform-origin:200px 300px">`;
      s += `<path d="${limb([[240, 236], [262, 262], [250, 292]], [34, 18, 12])}" fill="${far}" stroke="${line(far)}" stroke-width="1.6"/>` + claw(250, 298, far);
      s += `<path d="${limb([[176, 244], [168, 270], [174, 292]], [22, 15, 12])}" fill="${far}" stroke="${line(far)}" stroke-width="1.6"/>` + claw(174, 298, far);
      // szárny (túlsó)
      s += `<path d="M206 196 L236 104 L262 150 L284 128 L280 182 Z" fill="${dark(memb, 0.3)}" stroke="${line(memb)}" stroke-width="1.4"/>`;
      // farok
      s += sh(id, limb([[256, 228], [292, 250], [318, 236], [324, 204], [312, 186]], [30, 20, 13, 8, 3], 6), sc, { off: [-5, -4] });
      // test
      s += sh(id, ell(208, 230, 64, 40, -4), sc, { off: [-10, -8], dark: 0.4 });
      s += sh(id, 'M150 236 C170 264 230 270 262 250 C250 270 214 276 184 272 C164 268 152 256 150 236 Z', belly, { stroke: false });
      s += S(bands([[160, 256], [210, 270], [256, 252]], [10, 10, 10], 6, 2), dark(belly, 0.3), 1.2, { op: 0.6 });
      // nyak
      s += sh(id, limb([[168, 214], [138, 184], [124, 150], [118, 124]], [42, 32, 26, 24], 6), sc, { off: [-6, -5] });
      s += `<path d="${limb([[160, 222], [130, 190], [116, 156], [110, 130]], [16, 13, 11, 10], 6)}" fill="${belly}" opacity="0.9"/>` + S(bands([[160, 222], [130, 190], [116, 156], [110, 130]], [16, 13, 11, 10], 6, 2), dark(belly, 0.3), 1.1, { op: 0.6 });
      // kristálytüskék a háton
      s += [[150, 168, 20, -0.7], [176, 194, 24, -0.4], [204, 192, 26, -0.1], [232, 196, 22, 0.25], [262, 214, 16, 0.6], [292, 232, 12, 0.9]].map(([x, y, h, a]) => crystal(x, y, h, a, c[2])).join('');
      // fej: szarvak, orrlyuk, fogsor
      s += sh(id, 'M120 96 C130 84 142 72 158 66 C150 78 142 92 134 104 Z', light(c[2], 0.2), { rim: 1, sw: 1.2 }) + sh(id, 'M110 96 C116 80 122 66 134 56 C130 72 126 86 122 100 Z', light(c[2], 0.3), { rim: 1, sw: 1.2 });
      s += sh(id, 'M132 118 C130 100 116 90 98 92 C84 94 70 100 58 108 L44 114 C36 118 38 128 46 130 L62 134 C76 142 96 146 112 142 C126 138 134 130 132 118 Z', sc, { off: [-6, -5] });
      s += S('M48 128 C62 132 82 134 100 132', dark(sc, 0.55), 1.8) + P('M60 130 l3 6 l3 -5 Z M74 132 l3 6 l3 -5 Z M88 133 l2 5 l3 -5 Z', '#efe4cc', { sw: 0.6 });
      s += `<ellipse cx="50" cy="116" rx="2.6" ry="1.6" fill="#120a24"/>` + S('M80 102 L104 106', dark(sc, 0.6), 3) + glowEye(id, 94, 110, 5.5, 3, c[2], 6);
      s += S('M62 108 C78 100 98 98 116 104', light(sc, 0.45), 2.2, { op: 0.6 });
      // közeli szárny
      s += `<g class="m-wingL" style="transform-origin:200px 200px"><path d="M196 206 L212 98 L238 142 L262 116 L264 176 L246 170 L232 196 Z" fill="${memb}" stroke="${line(memb)}" stroke-width="1.6" opacity="0.95"/>` + S('M200 200 L212 98 M206 198 L238 142 M214 196 L262 116', dark(memb, 0.35), 2.2) + `</g>`;
      // közeli lábak
      s += sh(id, limb([[236, 236], [256, 264], [242, 292]], [38, 20, 13]), sc, { off: [-5, -4] }) + claw(242, 298, sc);
      s += sh(id, limb([[160, 246], [150, 272], [154, 292]], [24, 16, 13]), sc, { off: [-4, -3] }) + claw(152, 298, sc);
      return s + `</g>`;
    },

    // LOVAG: páncélos alak sisakkal (a sisakrésen át izzó szemek), vállvért, köpeny, fegyverrel a hős felé.
    // változatok: 'shadow' (alabárd, rongyos köpeny), 'fallen' (repedt páncél, a résekben szellemfény,
    // letört tollforgó), 'lord' (szarvas sisak, hatalmas köpeny, kétkezes kard).
    knight(id, c, o) {
      const v = (o && o.variant) || '', steel = mix(c[0], '#b8c0d8', 0.45), far = dark(steel, 0.35), cloth = c[1];
      let s = `<g class="m-body" style="transform-origin:170px 300px">`;
      // köpeny
      const capeEnd = v === 'lord' ? 'L300 296 C276 284 262 296 240 290 C226 298 210 290 200 296' : v === 'shadow' ? 'L268 292 L256 270 L246 294 L232 276 L222 296 L206 280 L196 296' : 'L264 294 C246 288 226 296 206 290 L196 296';
      s += v === 'rider' ? sh(id, 'M188 118 C230 120 262 150 300 160 L290 176 L300 196 L266 186 L250 210 L230 196 L190 214 Z', dark(cloth, 0.1), { off: [-6, -5] }) : sh(id, `M188 118 C224 126 250 170 ${v === 'lord' ? 280 : 256} 220 ${capeEnd} L184 220 Z`, dark(cloth, 0.1), { off: [-6, -5] });
      // lábak (lovon ülve nincs)
      if (v !== 'rider') s += `<path d="${limb([[190, 208], [192, 252], [190, 290]], [28, 22, 18])}" fill="${far}" stroke="${line(far)}" stroke-width="1.6"/>` + `<path d="M178 288 L206 288 L210 300 L172 300 Z" fill="${far}" stroke="${line(far)}" stroke-width="1.4"/>`;
      if (v !== 'rider') s += sh(id, limb([[160, 208], [150, 252], [146, 290]], [30, 24, 20]), steel, { off: [-5, -4] }) + sh(id, 'M126 286 L156 286 L162 300 L118 300 Z', steel, { rim: 1, sw: 1.4 }) + sh(id, ell(152, 250, 13, 10, 0), light(steel, 0.15), { rim: 1, sw: 1.4 });
      else s += sh(id, limb([[160, 206], [138, 226], [140, 262]], [30, 24, 18]), steel, { off: [-5, -4] }) + sh(id, 'M126 258 L152 258 L156 272 L120 272 Z', steel, { rim: 1, sw: 1.4 });
      // páncéling és mellvért
      s += sh(id, 'M134 196 L218 196 L226 248 L198 238 L178 254 L156 238 L128 248 Z', cloth, { off: [-4, -3] });
      s += sh(id, 'M136 132 C148 116 200 114 214 130 L218 200 C204 214 150 214 138 200 Z', steel, { off: [-8, -6], dark: 0.4 });
      s += S('M176 122 L174 208', dark(steel, 0.4), 1.6) + S('M146 138 C150 170 150 186 146 200', light(steel, 0.6), 3, { op: 0.6 }) + S('M140 196 L216 196', dark(steel, 0.5), 3);
      // sisak
      if (v === 'lord') s += sh(id, 'M160 66 C140 50 128 30 132 8 C140 30 154 44 170 52 Z', dark(c[1], 0.2), { rim: 1, sw: 1.4 }) + sh(id, 'M196 64 C212 44 230 34 248 34 C232 44 220 56 206 74 Z', dark(c[1], 0.2), { rim: 1, sw: 1.4 });
      if (v !== 'lord') s += `<path d="M184 52 C200 30 226 26 244 40 C226 40 210 50 200 66" fill="${v === 'fallen' ? dark(cloth, 0.3) : light(c[2], 0.0)}" stroke="${line(cloth)}" stroke-width="1.4" opacity="${v === 'fallen' ? 0.9 : 0.85}"/>`;
      s += sh(id, 'M148 74 C148 54 164 44 182 46 C200 48 210 62 208 80 L206 110 C198 122 162 122 152 110 Z', steel, { off: [-6, -5] });
      s += P('M146 84 L196 80 L196 92 L148 96 Z', '#0a0618', { stroke: line(steel), sw: 1.4 }) + glowEye(id, 158, 89, 6, 2.6, c[2]) + glowEye(id, 180, 87, 5, 2.4, c[2]);
      s += S('M160 100 l0 12 M168 100 l0 12 M176 100 l0 12', dark(steel, 0.45), 1.6) + S('M154 60 C164 52 182 50 196 56', light(steel, 0.6), 2.4, { op: 0.6 });
      // vállvért
      s += sh(id, ell(140, 138, 24, 17, -10), light(steel, 0.05), { off: [-4, -3] }) + S('M120 140 C132 150 150 152 162 146', dark(steel, 0.4), 1.4);
      // fegyver
      if (v === 'shadow') {
        s += sh(id, 'M98 40 L104 40 L106 300 L96 300 Z', '#5a3a2a', { rim: 1, sw: 1.4 });
        s += sh(id, 'M98 52 C76 52 60 64 56 84 C70 80 84 84 98 92 Z', light(steel, 0.25), { rim: 1, sw: 1.4 }) + sh(id, 'M104 56 L120 64 L104 72 Z', light(steel, 0.25), { rim: 1, sw: 1.2 }) + P('M96 30 L101 12 L106 30 Z', light(steel, 0.3), { sw: 1 });
        s += sh(id, limb([[140, 146], [122, 176], [104, 196]], [20, 16, 14]), steel, { off: [-3, -2] }) + sh(id, ell(101, 198, 10, 9, 0), dark(steel, 0.15), { rim: 1, sw: 1.4 });
      } else {
        const big = v === 'lord';
        s += sh(id, limb([[140, 146], [124, 180], [112, 206]], [20, 16, 14]), steel, { off: [-3, -2] });
        s += `<g transform="rotate(${big ? -40 : -34} 110 208)">` + sh(id, `M104 ${big ? 60 : 92} L110 ${big ? 40 : 72} L116 ${big ? 60 : 92} L116 196 L104 196 Z`, light(steel, 0.3), { rim: 1, sw: 1.4 }) + S(`M110 ${big ? 50 : 82} L110 194`, light(steel, 0.75), 1.4, { op: 0.8 }) +
          sh(id, 'M92 196 L128 196 L128 204 L92 204 Z', '#e8b94a', { rim: 1, sw: 1.2 }) + sh(id, 'M106 204 L114 204 L114 226 L106 226 Z', '#5a3a2a', { rim: 1, sw: 1.2 }) + `<circle cx="110" cy="230" r="5" fill="#e8b94a" stroke="#7a5418" stroke-width="1.2"/></g>`;
        s += sh(id, ell(110, 210, 11, 10, 0), dark(steel, 0.15), { rim: 1, sw: 1.4 });
      }
      if (v === 'fallen') s += `<g class="m-glow">` + S('M150 140 L162 158 L156 176 L168 196 M200 126 L192 150 L204 170 M164 60 L172 76 L166 86', c[2], 2.4) + `</g>` + `<ellipse class="m-glow" cx="176" cy="164" rx="40" ry="50" fill="${c[2]}" opacity="0.06" filter="url(#${id}-b4)"/>`;
      return s + `</g>`;
    },

    // PAP / VARÁZSLÓ: csuklyás, földig érő köpeny, a csuklya alatt sötétség és izzó szemek, botja a hős
    // felé néz, a másik keze varázsjelet tart. 'dryad' (Fenyőkirálynő): kéregbőr, ágkorona, leveles ruha;
    // 'hunter' (Holdvadász): csuklya, köpeny, felajzott íj.
    priest(id, c, o) {
      const v = (o && o.variant) || '', robe = v === 'dryad' ? mix(c[0], '#4f8a52', 0.45) : dark(c[1], 0.1), trim = c[2];
      let s = `<g class="m-body" style="transform-origin:170px 300px">`;
      // hátsó köpenyszárny
      s += `<path d="M176 110 C214 130 236 200 250 296 L196 296 Z" fill="${dark(robe, 0.35)}"/>`;
      // köpeny / ruha
      const hem = v === 'dryad' ? 'L232 300 L222 286 L212 300 L198 286 L186 300 L172 286 L160 300 L146 286 L134 300 L122 286 L112 300' : 'L234 300 C200 292 150 296 112 300';
      s += sh(id, `M146 112 C170 104 196 112 204 140 C214 190 226 250 236 296 ${hem} C120 240 128 170 146 112 Z`, robe, { off: [-10, -8], dark: 0.42 });
      s += S('M152 140 C146 190 138 244 132 294 M184 140 C190 190 198 240 208 292', dark(robe, 0.35), 2, { op: 0.6 });
      if (v === 'dryad') s += [[150, 170], [176, 196], [160, 232], [196, 248], [140, 268], [212, 280]].map(([x, y], i) => `<path d="M${x} ${y} c-8 -10 2 -20 10 -14 c6 6 0 16 -10 14 Z" fill="${light(robe, 0.25)}" stroke="${line(robe)}" stroke-width="1" transform="rotate(${i * 40} ${x} ${y})"/>`).join('');
      else s += S('M120 296 C160 290 200 290 234 296', trim, 2.4, { op: 0.8 }) + S('M168 116 L168 296', trim, 2, { op: 0.45 });
      // fej
      if (v === 'dryad') {
        s += sh(id, 'M182 80 C200 110 204 170 198 220 C190 180 178 140 168 110 Z', '#3a5a2a', { rim: 1, sw: 1.2 });
        s += sh(id, 'M146 72 C146 54 160 46 174 48 C188 50 196 62 194 80 C192 98 182 112 166 112 C152 112 146 96 146 72 Z', mix(c[0], '#8a6a4a', 0.5), { off: [-5, -4] });
        s += S('M154 60 L156 70 M184 64 L182 76 M160 100 L164 106', dark(mix(c[0], '#8a6a4a', 0.5), 0.4), 1.4);
        s += [[150, 54, -40], [160, 46, -20], [180, 46, 10], [192, 56, 30]].map(([x, y, a]) => `<g transform="rotate(${a} ${x} ${y})"><path d="M${x} ${y} L${x} ${y - 34} M${x} ${y - 14} L${x - 10} ${y - 24} M${x} ${y - 24} L${x + 8} ${y - 34}" stroke="#5a3a2a" stroke-width="4" stroke-linecap="round"/></g>`).join('') +
          [[138, 22], [156, 10], [186, 12], [210, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${trim}" class="m-glow"/>`).join('');
        s += glowEye(id, 156, 80, 5, 3, c[2], 6) + glowEye(id, 176, 78, 4.4, 2.6, c[2], 6) + S('M150 72 L162 76 M172 74 L184 72', '#3a2a1a', 2.2) + S('M158 96 C164 98 170 98 174 96', '#3a2a1a', 1.6);
      } else {
        s += sh(id, 'M140 78 C140 50 160 34 184 38 C206 42 216 64 212 92 C210 110 204 124 196 132 C178 130 156 128 138 118 C134 104 136 92 140 78 Z', robe, { off: [-6, -5] });
        s += `<path d="M144 86 C146 70 160 62 174 66 C186 70 190 84 186 100 C182 114 168 120 154 116 C146 112 142 100 144 86 Z" fill="#06030f"/>`;
        s += glowEye(id, 156, 92, 5.5, 2.6, c[2], 8) + glowEye(id, 174, 90, 4.6, 2.2, c[2], 8);
        s += S('M140 80 C146 60 166 50 186 54', light(robe, 0.35), 2.6, { op: 0.6 });
      }
      // kezek és eszköz
      const hand = mix(c[0], '#d8c8b8', 0.3);
      if (v === 'hunter') {
        s += sh(id, limb([[148, 140], [126, 160], [100, 168]], [18, 14, 12]), robe, { off: [-3, -2] });
        s += `<path d="M96 90 C70 120 70 214 96 246" fill="none" stroke="#7a5232" stroke-width="7" stroke-linecap="round"/><path d="M96 90 L132 168 L96 246" fill="none" stroke="#efe4cc" stroke-width="1.4"/>`;
        s += `<path d="M78 168 L150 168" stroke="#c8a46a" stroke-width="2.6"/><path d="M78 168 l10 -5 l0 10 Z" fill="#cfd6ea"/>` + sh(id, ell(96, 168, 8, 8, 0), hand, { rim: 1, sw: 1.2 }) + sh(id, ell(134, 166, 8, 7, 0), hand, { rim: 1, sw: 1.2 });
        s += `<path d="M200 120 L214 196" stroke="#5a3a2a" stroke-width="10" stroke-linecap="round"/>` + S('M196 112 l4 -10 M204 114 l6 -8 M210 116 l8 -6', '#e8e6f2', 2);
      } else {
        const top = v === 'dryad' ? `<path d="M100 70 C90 56 96 40 108 36 M100 70 C110 58 122 56 130 62" stroke="#5a3a2a" stroke-width="5" fill="none" stroke-linecap="round"/><circle class="m-glow" cx="104" cy="52" r="8" fill="${trim}"/>` :
          o && o.moon ? `<path d="M90 30 A22 22 0 1 0 122 66 A16 16 0 1 1 90 30 Z" fill="${light(trim, 0.2)}" stroke="${dark(trim, 0.5)}" stroke-width="1.4"/><circle class="m-glow" cx="104" cy="52" r="20" fill="${trim}" opacity="0.35" filter="url(#${id}-b4)"/>` :
          `<path d="M104 30 L114 52 L104 74 L94 52 Z" fill="${light(trim, 0.3)}" stroke="${dark(trim, 0.5)}" stroke-width="1.4"/><circle class="m-glow" cx="104" cy="52" r="18" fill="${trim}" opacity="0.4" filter="url(#${id}-b4)"/>`;
        s += sh(id, 'M101 70 L107 70 L110 300 L98 300 Z', v === 'dryad' ? '#5a3a2a' : '#3a2a3a', { rim: 1, sw: 1.2 }) + top;
        s += sh(id, limb([[150, 140], [126, 160], [110, 172]], [20, 16, 14]), robe, { off: [-3, -2] }) + sh(id, ell(106, 172, 9, 9, 0), hand, { rim: 1, sw: 1.2 });
        // varázsló kéz a túlsó oldalon, fénylő jellel
        s += `<circle class="m-glow" cx="222" cy="150" r="16" fill="${trim}" opacity="0.35" filter="url(#${id}-b4)"/>` + sh(id, ell(220, 152, 8, 8, 0), dark(hand, 0.2), { rim: 1, sw: 1.2 });
      }
      return s + `</g>`;
    }
  });


  Object.assign(DRAW, {
    // LOVAS: lidércló (lángoló sörény és farok, izzó szem) és a hátán ülő páncélos lovag
    rider(id, c, o) {
      const hide = dark(c[1], 0.35), far = dark(hide, 0.35), flame = c[2];
      const hoof = (x, y, col) => sh(id, `M${x - 9} ${y} L${x - 7} ${y - 10} L${x + 7} ${y - 10} L${x + 9} ${y} Z`, dark(col, 0.3), { rim: 1, sw: 1.4 });
      let s = `<g class="m-body" style="transform-origin:190px 300px">`;
      s += `<path d="${limb([[262, 222], [250, 258], [270, 278], [266, 292]], [32, 14, 10, 9])}" fill="${far}" stroke="${line(far)}" stroke-width="1.6"/>` + hoof(266, 300, far);
      s += `<path d="${limb([[162, 226], [158, 262], [152, 292]], [20, 12, 9])}" fill="${far}" stroke="${line(far)}" stroke-width="1.6"/>` + hoof(152, 300, far);
      // lángoló farok
      s += `<path class="m-glow" d="M286 196 C312 196 326 216 322 246 C316 232 306 226 296 226 C306 238 308 254 300 268 C294 248 284 236 270 230 Z" fill="${flame}" opacity="0.85"/>`;
      s += sh(id, 'M124 196 C140 170 200 164 248 170 C278 174 296 190 294 214 C292 238 272 250 246 250 L170 250 C140 248 120 230 124 196 Z', hide, { off: [-10, -8], dark: 0.4 });
      s += S('M140 180 C180 168 230 168 270 178', light(hide, 0.4), 3, { op: 0.5 });
      // nyak és fej
      s += sh(id, limb([[156, 196], [132, 156], [116, 120]], [50, 38, 30], 6), hide, { off: [-6, -5] });
      s += sh(id, 'M128 112 C122 96 108 92 96 96 L58 118 C46 124 44 140 54 146 C62 150 76 148 86 142 C100 136 118 132 128 122 Z', hide, { off: [-6, -5] });
      s += sh(id, 'M112 98 L116 76 L124 98 Z', far, { rim: 1, sw: 1.2 }) + `<ellipse cx="56" cy="134" rx="3" ry="2" fill="#000"/>` + S('M48 142 C58 144 70 142 80 138', dark(hide, 0.5), 1.4) + glowEye(id, 102, 108, 5, 3, flame, -6);
      s += `<g class="m-glow">` + [[124, 104], [132, 128], [142, 150], [152, 172]].map(([x, y], i) => `<path d="M${x} ${y} C${x + 14} ${y - 12} ${x + 28} ${y - 16} ${x + 40} ${y - 30 + i * 2} C${x + 30} ${y - 10} ${x + 22} ${y + 2} ${x + 8} ${y + 12} Z" fill="${flame}" opacity="0.85"/>`).join('') + `</g>`;
      // nyereg
      s += sh(id, 'M176 168 C190 160 222 160 236 168 L238 186 L174 186 Z', '#3a2418', { rim: 1, sw: 1.2 });
      s += sh(id, limb([[246, 228], [236, 262], [256, 280], [252, 292]], [38, 16, 11, 10]), hide, { off: [-5, -4] }) + hoof(252, 300, hide);
      s += sh(id, limb([[140, 228], [134, 262], [128, 292]], [24, 14, 10]), hide, { off: [-4, -3] }) + hoof(128, 300, hide);
      // a lovag a nyeregben
      s += `<g transform="translate(64 -2) scale(0.82)">${DRAW.knight(id, c, { variant: 'rider' })}</g>`;
      return s + `</g>`;
    },
    // BAGOLYRAJ: három, különböző méretű bagoly
    swarm(id, c, o) {
      const one = (tx, ty, sc, d) => `<g transform="translate(${tx} ${ty}) scale(${sc})"><g class="m-float" style="animation-delay:-${d}s">${DRAW.flyer(id, c, o)}</g></g>`;
      return one(130, 110, 0.42, 0.7) + one(-20, 40, 0.5, 1.4) + one(40, 70, 0.68, 0);
    }
  });


  Object.assign(DRAW, {
    // KOS: gyapjas, gömbölyű test, vékony lábak patával, rövid farok, rövid pofa, hatalmas, csigavonalú szarvak
    ram(id, c, o) {
      const wool = mix(light(c[0], 0.3), '#efe8d8', 0.35), skin = dark(c[0], 0.25), far = dark(skin, 0.3), horn = o && o.ash ? '#6a5a50' : '#d8c8a0';
      const hoof = (x, y, col) => sh(id, `M${x - 8} ${y} L${x - 6} ${y - 9} L${x + 6} ${y - 9} L${x + 8} ${y} Z`, dark(col, 0.45), { rim: 1, sw: 1.2 });
      const fluff = (cx, cy, rx, ry, n) => { let d = ''; for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, am = (a0 + a1) / 2; d += (i ? ' ' : `M${f(cx + Math.cos(a0) * rx)} ${f(cy + Math.sin(a0) * ry)} `) + `Q${f(cx + Math.cos(am) * rx * 1.16)} ${f(cy + Math.sin(am) * ry * 1.16)} ${f(cx + Math.cos(a1) * rx)} ${f(cy + Math.sin(a1) * ry)}`; } return d + ' Z'; };
      let s = `<g class="m-body" style="transform-origin:190px 300px">`;
      s += `<path d="${limb([[250, 236], [254, 266], [252, 292]], [20, 12, 10])}" fill="${far}" stroke="${line(far)}" stroke-width="1.4"/>` + hoof(252, 300, far);
      s += `<path d="${limb([[160, 240], [158, 268], [156, 292]], [18, 11, 9])}" fill="${far}" stroke="${line(far)}" stroke-width="1.4"/>` + hoof(156, 300, far);
      s += sh(id, fluff(276, 190, 14, 12, 7), wool, { rim: 1, sw: 1.4 });
      s += sh(id, fluff(206, 196, 80, 52, 22), wool, { off: [-10, -8], dark: 0.35 });
      for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) { const x = 150 + k * 22 + (r % 2) * 11, y = 168 + r * 22; s += `<path d="M${x - 6} ${y} q6 -7 12 0" fill="none" stroke="${dark(wool, 0.2)}" stroke-width="1.4" opacity="0.7"/>`; }
      s += sh(id, limb([[236, 238], [240, 268], [238, 292]], [24, 13, 11]), skin, { off: [-3, -2] }) + hoof(238, 300, skin);
      s += sh(id, limb([[146, 240], [142, 268], [140, 292]], [22, 12, 10]), skin, { off: [-3, -2] }) + hoof(140, 300, skin);
      // nyak és fej
      s += sh(id, fluff(136, 168, 34, 40, 12), wool, { off: [-5, -4] });
      s += sh(id, 'M124 118 C118 102 102 96 88 100 C72 104 58 116 54 130 C50 142 56 152 68 154 C82 156 98 152 110 146 C122 140 128 130 124 118 Z', skin, { off: [-6, -5] });
      s += S('M60 132 C70 128 80 130 88 136', dark(skin, 0.5), 1.4) + `<ellipse cx="58" cy="128" rx="2.4" ry="1.6" fill="#120a24"/>` + S('M74 112 L96 118', dark(skin, 0.6), 2.6) + glowEye(id, 86, 122, 5, 2.6, c[2], 6);
      const hd = 'M100 108 C102 76 142 66 156 92 C168 116 150 142 124 140 C104 138 98 118 110 110 C120 104 132 112 128 122';
      s += `<path d="${hd}" fill="none" stroke="${dark(horn, 0.55)}" stroke-width="21" stroke-linecap="round"/><path d="${hd}" fill="none" stroke="${horn}" stroke-width="16" stroke-linecap="round"/><path d="M104 92 C114 72 142 70 154 92" fill="none" stroke="${light(horn, 0.45)}" stroke-width="4" stroke-linecap="round" opacity="0.8"/>` + S('M108 80 l7 8 M122 72 l2 10 M138 72 l-2 10 M152 82 l-8 6 M160 102 l-10 2 M156 124 l-9 -4 M140 138 l-4 -9', dark(horn, 0.4), 1.6);
      if (o && o.ash) s += `<g class="m-glow">` + S('M150 180 L166 196 L158 214 M220 172 L212 192 L226 206', '#ff9a4a', 2.6) + [[120, 70], [170, 90], [240, 140], [200, 130]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#ffb86a"/>`).join('') + `</g>`;
      return s + `</g>`;
    }
  });
  // minden név kifejezett hozzárendelése: test + változat (szín, kiegészítő, méret). Ismeretlen névnél: figyelmeztetés.
  // a js/guards.js új őrzőinek és a Holdkrónika főellenfeleinek kinézete a NAMES végére fűződik (lásd lent)
  const NAMES = {
    'Mocsári lidérc': { kind: 'wisp' },
    'Iszapmanó': { kind: 'imp', tint: '#7a5a3a', acc: 'mud' },
    'Ködpók': { kind: 'spider' },
    'Nádi farkas': { kind: 'beast', acc: 'reed' },
    'Öreg Brekus, a lápkirály': { kind: 'frog', acc: 'old' },
    'Ködanya': { kind: 'wisp', acc: 'veil', tint: '#cfe8e0' },
    'Ezüstpikkelyű kígyó': { kind: 'serpent', tint: '#c8d4e0' },
    'Vándorló lidérc': { kind: 'wisp', acc: 'lantern' },
    'Holdfarkas': { kind: 'beast', tint: '#c8d8f0' },
    'Fenyőkobold': { kind: 'imp', acc: 'pine', tint: '#9fc070' },
    'Éjbagoly-raj': { kind: 'swarm' },
    'Ezüstszarvú kos': { kind: 'ram', tint: '#b8c4dc' },
    'A Fenyőkirálynő': { kind: 'priest', variant: 'dryad' },
    'Holdvadász': { kind: 'priest', variant: 'hunter' },
    'Árnyőr': { kind: 'knight', variant: 'shadow' },
    'Kőgólem': { kind: 'golem' },
    'Sikoltó szellem': { kind: 'wisp', acc: 'scream' },
    'Rúnatolvaj': { kind: 'imp', acc: 'thief' },
    'A Romok Kapuőre': { kind: 'golem', acc: 'slab', scale: 1.1 },
    'Árnypap': { kind: 'priest' },
    'Bukott lovag': { kind: 'knight', variant: 'fallen' },
    'Csillagszilánk-elementál': { kind: 'golem', acc: 'shards' },
    'Szirti griff': { kind: 'griffin' },
    'Kristálybogár': { kind: 'beetle' },
    'Hullócsillag-szellem': { kind: 'wisp', acc: 'star', tint: '#ffe9a8' },
    'A Lehullott Csillag Őre': { kind: 'golem', acc: 'star', scale: 1.1 },
    'Kristálysárkány-fióka': { kind: 'drake' },
    'Griffkirály': { kind: 'griffin', scale: 1.1 },
    'Éjszövő': { kind: 'spider', acc: 'web' },
    'Sötét lovas': { kind: 'rider' },
    'Üresség-vándor': { kind: 'wisp', acc: 'void', tint: '#2a1a40' },
    'Holdfaló féreg': { kind: 'worm' },
    'Az Éjkatlan Ura': { kind: 'knight', variant: 'lord', scale: 1.12 },
    'Fekete Holdpap': { kind: 'priest', moon: true, tint: '#2a2440' },
    'Az Utolsó Árnyék': { kind: 'wisp', acc: 'void', tint: '#120a20', scale: 1.15 },
    // heti szörnyek
    'A Fenevad': { kind: 'beast', horns: 'spike', acc: 'spikes' },
    'Ködkirálynő': { kind: 'wisp', acc: 'queen', tint: '#9fe8ff' },
    'A Holdfaló': { kind: 'worm' },
    'Árnyékcsőr': { kind: 'griffin', tint: '#2a2440' },
    'A Hamuszarvú': { kind: 'ram', ash: true, tint: '#4a3e3c' },
    'Csillagrém': { kind: 'golem', acc: 'rem', tint: '#b89aff' },
    'A Mocsárkirály': { kind: 'frog' },
    'Éjanya': { kind: 'spider', acc: 'eggs' }
  };
  { const X = root.NYX.data && root.NYX.data.GUARD_EXTRA; if (X && X.art) Object.keys(X.art).forEach(k => { if (!NAMES[k]) NAMES[k] = X.art[k]; }); }
  // korona: az alsó közepe a fej tetejére kerül. [x, y, méretszorzó] a szörny saját koordinátáiban; a pontokat a szemek
  // helyéből és a sziluettből mértük ki (tools/korona-ellenorzes/measure.js), majd nagyított képen ellenőriztük (zoom.js), a chain.js pedig azt nézi, hogy a korona a fejjel együtt mozog-e. Változatonként eltérhet.
  const HEAD_TOP = {
    beast: [84, 98, 0.72, -8], beetle: [101, 219, 0.62], drake: [103, 94, 0.7, -5], frog: [139, 121, 0.8, -12], golem: [149, 60, 0.95],
    griffin: [103, 88, 0.72], imp: [161, 78, 0.8], 'imp:pine': [161, 65, 0.8], 'imp:thief': [161, 70, 0.8],
    knight: [178, 48, 0.78], priest: [172, 42, 0.66], 'priest:dryad': [166, 49, 0.72], ram: [80, 106, 0.5, -14], rider: [203, 37, 0.66],
    serpent: [99, 104, 0.7, -9], spider: [119, 165, 0.8], wisp: [140, 86, 0.75, -14], flyer: [170, 106, 0.8], worm: [112, 92, 0.55, -10], swarm: [170, 106, 0.8]
  };
  const CROWN_W = 80, CROWN_CX = 160, CROWN_BOTTOM = 52;
  const CROWN_NEST = {
    rider: { at: 'knight', k: 0.82, pre: '<g transform="translate(64 -2) scale(0.82)"><g class="m-body" style="transform-origin:170px 300px">', post: '</g></g>' },
    swarm: { at: 'flyer', k: 0.68, pre: '<g transform="translate(40 70) scale(0.68)"><g class="m-float"><g class="m-float">', post: '</g></g></g>' }
  };
  function bossDecor(c) {
    return `<path d="M120 52 L130 20 L146 44 L160 8 L174 44 L190 20 L200 52 Z" fill="#e8b94a" stroke="#8a5a1a" stroke-width="2"/><path d="M122 46 L198 46" stroke="#fff4c0" stroke-width="2" opacity="0.6"/><circle cx="160" cy="34" r="5" fill="${c[2]}"/><circle cx="136" cy="40" r="3" fill="#ff6fae"/><circle cx="184" cy="40" r="3" fill="#ff6fae"/>`;
  }

  // ---------- névenkénti kiegészítők (hogy az azonos fajú szörnyek ne legyenek egymás klónjai) ----------
  function accessory(kind, acc, id, c, spec) {
    let s = '';
    const A = acc || '';
    if (kind === 'wisp') {
      if (A === 'queen') s += `<g opacity="0.85">` + [0, 1, 2, 3, 4].map(i => `<path d="M${146 + i * 9} ${70 + i * 3} C${200 + i * 16} ${100 + i * 12} ${230 + i * 10} ${180 + i * 16} ${290 + i * 6} ${260 + i * 8}" fill="none" stroke="${light(c[0], 0.6)}" stroke-width="${7 - i}" stroke-linecap="round"/>`).join('') + `</g>` + [[96, 150], [214, 120], [240, 220]].map(([x, y]) => `<circle class="m-glow" cx="${x}" cy="${y}" r="7" fill="#ffffff" opacity="0.7"/>`).join('');
      if (A === 'veil') s += `<g opacity="0.75">` + [0, 1, 2, 3].map(i => `<path d="M${150 + i * 10} ${72 + i * 4} C${190 + i * 14} ${110 + i * 10} ${200 + i * 8} ${170 + i * 14} ${236 + i * 10} ${236 + i * 10}" fill="none" stroke="${light(c[0], 0.5)}" stroke-width="${6 - i}" stroke-linecap="round"/>`).join('') + `</g>`;
      if (A === 'lantern') s += S('M72 190 L66 214', '#5a4a3a', 2) + `<rect x="54" y="214" width="24" height="30" rx="4" fill="#3a2a1a" stroke="#c4902a" stroke-width="2"/><rect class="m-glow" x="59" y="219" width="14" height="20" rx="3" fill="#ffd36a"/><circle class="m-glow" cx="66" cy="229" r="22" fill="#ffd36a" opacity="0.3" filter="url(#${id}-b4)"/>`;
      if (A === 'scream') s += `<path d="${ell(134, 142, 6, 11, 14)}" fill="#000"/><path class="m-glow" d="${ell(134, 144, 3, 6, 14)}" fill="${c[2]}" opacity="0.7"/>` + S('M96 130 C88 140 88 152 94 162 M84 124 C72 140 72 158 82 172', light(c[2], 0.2), 2.2, { op: 0.7 });
      if (A === 'star') s += `<path class="m-glow" d="M170 154 L176 170 L192 172 L180 182 L184 198 L170 190 L156 198 L160 182 L148 172 L164 170 Z" fill="#fff2b0" stroke="#e8b94a" stroke-width="1.4"/>` + [[120, 90], [230, 120], [210, 230], [110, 250]].map(([x, y]) => `<path class="m-glow" d="M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2} Z" fill="#fff2b0"/>`).join('');
      if (A === 'void') s += `<circle cx="188" cy="236" r="18" fill="#000"/><circle class="m-glow" cx="188" cy="236" r="18" fill="none" stroke="${c[2]}" stroke-width="3"/><circle cx="188" cy="236" r="28" fill="none" stroke="${c[2]}" stroke-width="1" opacity="0.4"/>`;
    }
    if (kind === 'imp') {
      if (A === 'mud') s += [[150, 250, 8], [190, 256, 6], [140, 200, 5], [180, 140, 6], [130, 290, 7]].map(([x, y, r]) => `<path d="M${x - r} ${y} C${x - r} ${y - r} ${x + r} ${y - r} ${x + r} ${y} C${x + r} ${y + r * 1.6} ${x} ${y + r * 2.4} ${x} ${y + r * 2.4} C${x} ${y + r * 2.4} ${x - r} ${y + r * 1.6} ${x - r} ${y} Z" fill="#5a3e26" opacity="0.85"/>`).join('');
      if (A === 'pine') s += sh(id, ell(78, 122, 14, 20, -20), '#7a5232', { rim: 1, sw: 1.2 }) + S('M68 112 L88 118 M66 124 L88 130 M70 136 L86 140', '#4a3020', 1.4) + sh(id, 'M126 84 C140 60 176 54 200 74 C184 70 168 74 158 84 C148 78 136 80 126 84 Z', '#4f8a52', { rim: 1, sw: 1.2 });
      if (A === 'thief') s += sh(id, 'M116 120 C114 86 138 66 168 68 C200 70 216 94 212 126 C206 108 190 96 168 96 C144 96 126 104 116 120 Z', dark(c[1], 0.3), { rim: 1, sw: 1.4 }) + `<circle class="m-glow" cx="196" cy="232" r="5" fill="${c[2]}"/>`;
    }
    if (kind === 'beast') {
      if (spec.horns === 'ram') { const hd = 'M92 92 C100 62 142 58 154 86 C164 112 146 138 120 136 C100 134 94 114 106 106 C116 100 128 108 124 118'; s += `<path d="${hd}" fill="none" stroke="#5a4a30" stroke-width="19" stroke-linecap="round"/><path d="${hd}" fill="none" stroke="#d8c8a0" stroke-width="15" stroke-linecap="round"/><path d="M96 80 C108 62 140 62 150 86" fill="none" stroke="#f4ead0" stroke-width="4" stroke-linecap="round" opacity="0.8"/>` + S('M104 70 l6 9 M118 64 l2 10 M134 64 l-2 10 M148 74 l-7 7 M156 96 l-9 2 M152 118 l-9 -3 M136 132 l-4 -8', '#8a7a5a', 1.6); }
      if (spec.horns === 'spike') s += sh(id, 'M96 96 C90 70 70 50 46 44 C64 60 76 78 84 100 Z', '#efe4cc', { rim: 1, sw: 1.4 }) + sh(id, 'M110 100 C110 70 98 46 80 34 C92 54 98 76 98 104 Z', '#efe4cc', { rim: 1, sw: 1.4 });
      if (A === 'wool') s += [[112, 128], [124, 118], [138, 124], [118, 146], [132, 140], [146, 136], [112, 166], [126, 160], [140, 154], [120, 184], [136, 176]].map(([x, y]) => `<path d="M${x - 8} ${y} a5 5 0 0 1 5 -6 a5 5 0 0 1 7 0 a5 5 0 0 1 4 7 a5 5 0 0 1 -4 6 a5 5 0 0 1 -8 0 a5 5 0 0 1 -4 -7 Z" fill="${mix(light(c[0], 0.5), '#f0ead8', 0.5)}" stroke="${dark(c[0], 0.15)}" stroke-width="1"/>`).join('');
      if (A === 'spikes') s += [[150, 134, 26, -0.5], [180, 128, 32, -0.2], [210, 130, 30, 0.1], [240, 138, 24, 0.4], [266, 150, 18, 0.7]].map(([x, y, h, a]) => crystal(x, y, h, a, '#efe4cc')).join('') + S('M150 182 L170 196 M200 172 L214 192', '#ff6f8a', 2.4, { op: 0.8 });
      if (A === 'ember') s += `<g class="m-glow">` + S('M150 160 L164 176 L158 194 M210 150 L204 170 L216 186 M250 170 L240 190', '#ff9a4a', 2.4) + [[130, 120], [220, 120], [270, 140], [180, 110]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#ffb86a"/>`).join('') + `</g>`;
      if (A === 'reed') s += [[60, 300], [74, 300], [300, 300]].map(([x, y], i) => `<path d="M${x} ${y} C${x - 4} ${y - 40} ${x + 2} ${y - 70} ${x + 6} ${y - 96}" fill="none" stroke="#6a8a4a" stroke-width="3"/><path d="${ell(x + 6, y - 92, 4, 12, 8)}" fill="#6a4a2a"/>`).join('');
    }
    if (kind === 'golem') {
      if (A === 'slab') s += rock(id, [[20, 170], [96, 160], [104, 300], [16, 300]], dark(c[0], 0.05)) + `<path class="m-glow" d="M60 200 L60 260 M44 214 L76 214 M48 244 L72 232" stroke="${c[2]}" stroke-width="3.2" fill="none"/>`;
      if (A === 'rem') s += [[116, 70, 34, -0.6], [150, 52, 42, -0.1], [190, 62, 30, 0.4], [96, 124, 26, -1.2], [250, 100, 30, 0.6]].map(([x, y, h, a]) => crystal(x, y, h, a, '#ffe9a8')).join('') + `<path class="m-glow" d="M182 152 L190 170 L210 172 L194 184 L200 204 L182 192 L164 204 L170 184 L154 172 L174 170 Z" fill="#fff2b0" stroke="#e8b94a" stroke-width="1.6"/>` + S('M120 150 L104 140 M126 236 L104 250 M240 160 L262 150', '#ffe9a8', 4);
      if (A === 'shards') s += [[116, 70, 30, -0.6], [150, 56, 36, -0.1], [188, 64, 26, 0.4], [96, 126, 22, -1.2]].map(([x, y, h, a]) => crystal(x, y, h, a, c[2])).join('');
      if (A === 'star') s += `<path class="m-glow" d="M182 152 L190 170 L210 172 L194 184 L200 204 L182 192 L164 204 L170 184 L154 172 L174 170 Z" fill="#fff2b0" stroke="#e8b94a" stroke-width="1.6"/><circle class="m-glow" cx="182" cy="178" r="34" fill="#fff2b0" opacity="0.25" filter="url(#${id}-b4)"/>`;
    }
    if (kind === 'spider') {
      if (A === 'web') s = `<g opacity="0.55">` + S('M200 -20 L210 150 M60 -20 L120 170 M330 0 L250 140', '#e8e6f2', 1.2) + S('M120 40 C170 60 220 50 290 30 M110 90 C160 110 220 100 280 80', '#e8e6f2', 1, { op: 0.7 }) + `</g>` + s;
      if (A === 'eggs') s += [[262, 118], [280, 128], [270, 108], [290, 112], [254, 104]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="8" fill="#efe4cc" stroke="#8a7a6a" stroke-width="1.2"/><ellipse class="m-glow" cx="${x}" cy="${y}" rx="4" ry="3" fill="${c[2]}" opacity="0.6"/>`).join('');
    }
    if (kind === 'frog' && A === 'old') s += sh(id, 'M88 178 L82 300 L90 300 L96 180 Z', '#5a3a2a', { rim: 1, sw: 1.2 }) + sh(id, ell(92, 176, 10, 8, 0), '#7a5232', { rim: 1, sw: 1.2 });
    return s;
  }

  // a szörny mérete a hőshöz képest (a doboz méretét szorozza): a nagy testű fajok nagyobbak, a boss még nagyobb
  const KIND_SCALE = { golem: 1.25, rider: 1.22, worm: 1.18, griffin: 1.15, drake: 1.12, knight: 1.04, priest: 1.02, wisp: 1.06, imp: 0.86, swarm: 1.05, ram: 1.02 };
  function sizeOf(name, opts) {
    opts = opts || {}; const key = String(name || '').replace(/^Heti szörny:\s*/, ''), spec = NAMES[key] || {}, kind = opts.kind || spec.kind || kindOf(name);
    return (KIND_SCALE[kind] || 1) * (spec.scale || 1) * (opts.boss ? 1.3 : opts.guard ? 1.08 : 1);
  }
  // a fejen/testen ülő kiegészítő (sapka, csuklya, szarv, kristály, tojás) a test mozgó csoportjába kerül, hogy együtt lélegezzen vele;
  // ami a földön áll vagy a háttérben lóg (nád, háló, bot, kőtábla), az marad helyben
  function accWrap(kind, spec, body, acc) {
    if (!acc) return '';
    if (kind === 'wisp') return `<g class="m-float">${acc}</g>`;
    const A = spec.acc || '', still = { beast: ['reed'], golem: ['slab'], spider: ['web'], frog: ['old'] };
    if ((still[kind] || []).indexOf(A) >= 0 || ['imp', 'beast', 'golem', 'spider'].indexOf(kind) < 0) return acc;
    const wrap = body.match(/^<g class="m-body"[^>]*>/);
    return wrap ? wrap[0] + acc + '</g>' : acc;
  }
  function monster(name, regionId, opts) {
    opts = opts || {};
    const key = String(name || '').replace(/^Heti szörny:\s*/, ''), spec = Object.assign({}, NAMES[key] || {}, opts.kind ? { kind: opts.kind } : {});
    const id = 'm' + (++UID), base = PAL[regionId] || PAL.kodlap, kind = spec.kind || kindOf(name);
    const c = spec.tint ? [mix(base[0], spec.tint, 0.55), mix(base[1], spec.tint, 0.35), base[2]] : base;
    const sc = sizeOf(name, opts);
    const o = Object.assign({}, opts, { variant: spec.variant, moon: spec.moon, ash: spec.ash, old: spec.acc === 'old' });
    const aura = (opts.guard || opts.boss) ? `<ellipse class="m-glow" cx="170" cy="190" rx="${opts.boss ? 150 : 120}" ry="${opts.boss ? 140 : 110}" fill="${c[2]}" opacity="${opts.boss ? 0.2 : 0.12}" filter="url(#${id}-b12)"/>` : '';
    // a korona ugyanabba a mozgó csoportba kerül, mint a fej (m-body / m-float), különben a lélegzés és a ringás alatt elcsúszik
    const vkey = kind + ':' + (spec.variant || spec.acc || (spec.moon ? 'moon' : '') || '');
    const ht = HEAD_TOP[vkey] || HEAD_TOP[kind] || [170, 60, 0.8];
    let body = DRAW[kind](id, c, o), crown = '';
    if (opts.guard || opts.boss) {
      // a lovas és a raj feje egy beágyazott, saját animációjú csoportban van: a korona ugyanazt a láncot kapja
      const nest = CROWN_NEST[kind], at = nest ? HEAD_TOP[nest.at] : ht, k = nest ? nest.k : 1;
      const cs = (opts.boss ? 0.85 : 0.6) * ht[2] / k, sink = 3 / k;
      let g = `<g transform="translate(${f(at[0])} ${f(at[1] + sink)}) rotate(${at[3] || 0}) translate(${(-CROWN_CX * cs).toFixed(2)} ${(-CROWN_BOTTOM * cs).toFixed(2)}) scale(${cs.toFixed(4)})">${bossDecor(c)}</g>`;
      if (nest) g = nest.pre + g + nest.post;
      const wrap = body.match(/^<g class="m-(?:body|float)"[^>]*>/);
      if (kind === 'wisp') g = `<g class="m-float">${g}</g>`;
      else if (wrap) g = wrap[0] + g + '</g>';
      crown = g;
    }
    const wide = ['ram', 'beast', 'spider', 'flyer', 'griffin', 'drake', 'rider', 'serpent', 'beetle', 'frog', 'swarm'].indexOf(kind) >= 0;
    return `<svg class="mon k-${kind}${opts.cls ? ' ' + opts.cls : ''}" data-sc="${f(sc)}" viewBox="0 -20 340 340" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${R.esc(key)}">
      <defs><radialGradient id="${id}-bg"><stop offset="0" stop-color="${c[2]}" stop-opacity="0.22"/><stop offset="1" stop-color="${c[2]}" stop-opacity="0"/></radialGradient><filter id="${id}-b4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter><filter id="${id}-b12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter></defs>
      <ellipse class="m-shadow" cx="${kind === 'beast' || kind === 'rider' ? 190 : 170}" cy="300" rx="${wide ? 130 : 90}" ry="12" fill="#05071a" opacity="0.55"/>
      <ellipse cx="180" cy="180" rx="170" ry="150" fill="url(#${id}-bg)"/>
      <g><g class="m-root" style="transform-origin:170px 300px">${aura}<g class="m-fx">${body}${accWrap(kind, spec, body, accessory(kind, spec.acc, id, c, spec))}${crown}</g></g></g></svg>`;
  }

  root.NYX.monsters = { monster: monster, sizeOf: sizeOf, kindOf: kindOf, PAL: PAL, KINDS: Object.keys(DRAW), NAMES: NAMES };
})(typeof window !== 'undefined' ? window : globalThis);
