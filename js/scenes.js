/* Nyxoria – animált, rétegelt tájképek.
   Felépítés hátulról előre (atmoszférikus perspektíva: ami messzebb van, az világosabb és kékebb):
   ég → csillagok → hold, holdudvar, sugarak → felhők → távoli hegyek (holdfényes oldallal)
   → távoli fasor / épületek → köd → középtér (kétszínű, megvilágított fák, tárgyak) → talaj (ösvény,
   fű, kövek, gombák) → köd → szentjánosbogarak → előtér-keret (sötét sziluettek a széleken) → vignetta.
   A hold mindig jobbra fent van, ezért minden tárgy jobb oldala a megvilágított oldal. */
(function (root) {
  'use strict';
  const R = root.NYX.rig, mix = R.mix;
  let UID = 0;
  const SC = {
    kodlap: { name: 'Ködláp', sky: ['#0b1724', '#1a3640', '#3a6a60'], moon: '#e8f4e6', far: '#22424a', mid: '#173230', near: '#0a1a18', ground: '#1e3a2e', fog: '#a8ffd8', fly: '#c8ff9a', kind: 'swamp' },
    holdfeny: { name: 'Holdfény-erdő', sky: ['#070d2a', '#15235a', '#3a4c96'], moon: '#f2f4ff', far: '#22306c', mid: '#14204e', near: '#060a22', ground: '#1a2a52', fog: '#cfdcff', fly: '#fff2b0', kind: 'forest' },
    arnyromok: { name: 'Árnyromok', sky: ['#0d0720', '#26184c', '#5a3c88'], moon: '#efe2ff', far: '#30245a', mid: '#21173f', near: '#0b0720', ground: '#2a2048', fog: '#d6b8ff', fly: '#d6a8ff', kind: 'ruins' },
    szirtek: { name: 'Csillaghullás-szirtek', sky: ['#03122a', '#0d385c', '#2a7aa0'], moon: '#e8fcff', far: '#1a4766', mid: '#10304c', near: '#051626', ground: '#173a54', fog: '#8ff6ff', fly: '#8ff6ff', kind: 'cliffs' },
    ejkatlan: { name: 'Éjkatlan', sky: ['#07020a', '#1c0616', '#3c0c22'], moon: '#d8a8b8', far: '#2a0a1e', mid: '#1c0614', near: '#080206', ground: '#1e0812', fog: '#c0506a', fly: '#ffb070', kind: 'crater', dimMoon: true },
    tabor: { name: 'Tábor', sky: ['#090e2c', '#1d2454', '#4a3a6e'], moon: '#fff4dc', far: '#22285a', mid: '#151a3c', near: '#070a1c', ground: '#2a2a46', fog: '#ffd9a0', fly: '#ffd27a', kind: 'camp' }
  };

  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const f = v => (+v).toFixed(1);
  const poly = pts => 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join(' L') + ' Z';

  // ---------- fenyő ----------
  // Szintenként egy-egy tűlevélcsokor: fűrészfogas, lelógó alsó él, enyhén homorú oldalak.
  // Kétszínű: a hold felőli fele világosabb, és a szélén vékony holdfény-perem fut.
  function pineParts(x, y0, h, w, r) {
    const n = Math.max(4, Math.min(7, Math.round(h / 40))), yTop = y0 - h, foot = y0 - h * 0.1, Hf = foot - yTop;
    const tiers = [];
    for (let k = 0; k < n; k++) {
      const yb = yTop + Hf * (k + 1) / n, yt = k === 0 ? yTop : yTop + Hf * k / n - Hf / n * 0.95;
      const wk = w * (0.22 + 0.78 * (k + 1) / n) * (0.92 + r() * 0.16), dr = wk * 0.16;
      const A = [x + (r() - 0.5) * 2, yt];
      const Lt = [x - wk, yb + dr], Rt = [x + wk, yb + dr];
      const left = [[x - wk * 0.42, yt + (yb - yt) * 0.5], [x - wk * 0.36, yt + (yb - yt) * 0.56]];
      const right = [[x + wk * 0.36, yt + (yb - yt) * 0.56], [x + wk * 0.42, yt + (yb - yt) * 0.5]];
      const m = 3 + Math.min(4, k), bottom = [];
      for (let i = 1; i < m * 2; i++) {
        const t = i / (m * 2), bx = x - wk + 2 * wk * t;
        bottom.push(i % 2 ? [bx, yb - (yb - yt) * (0.12 + r() * 0.1)] : [bx, yb + dr * (0.3 + r() * 0.7) * (1 - Math.abs(t - 0.5))]);
      }
      tiers.push({ A, Lt, Rt, left, right, bottom });
    }
    return { tiers, trunk: [[x - w * 0.07, y0], [x - w * 0.05, foot - 10], [x + w * 0.05, foot - 10], [x + w * 0.07, y0]] };
  }
  function pineSilhouette(x, y0, h, w, r) {
    const P = pineParts(x, y0, h, w, r);
    let d = poly(P.trunk) + ' ';
    P.tiers.forEach(t => { d += poly([t.A].concat(t.left, [t.Lt], t.bottom, [t.Rt], t.right)) + ' '; });
    return d;
  }
  function pineLit(x, y0, h, w, r, base, lit, rim) {
    // alulról felfelé rajzolunk: a felső szint fűrészfogas alja a következőre lóg, alatta árnyékkal;
    // a hold felőli (jobb) szélén keskeny megvilágított sáv és vékony perem
    const P = pineParts(x, y0, h, w, r), shadow = mix(base, '#000000', 0.35);
    let out = `<path d="${poly(P.trunk)}" fill="${shadow}"/>`;
    for (let k = P.tiers.length - 1; k >= 0; k--) {
      const t = P.tiers[k], wk = t.Rt[0] - x;
      const shape = poly([t.A].concat(t.left, [t.Lt], t.bottom, [t.Rt], t.right));
      if (k < P.tiers.length - 1) out += `<path d="${shape}" fill="${shadow}" opacity="0.55" transform="translate(2 7)"/>`;
      out += `<path d="${shape}" fill="${base}"/>`;
      const br = t.bottom.filter(p => p[0] > x + wk * 0.4).reverse();
      const litP = [t.A].concat(t.right.slice().reverse(), [t.Rt], br, [[x + wk * 0.32, t.bottom[0][1] - (t.Lt[1] - t.A[1]) * 0.2], [x + wk * 0.12, t.A[1] + (t.Lt[1] - t.A[1]) * 0.4]]);
      out += `<path d="${poly(litP)}" fill="${lit}"/>`;
      out += `<path d="M${[t.A].concat(t.right.slice().reverse(), [t.Rt]).map(p => f(p[0]) + ' ' + f(p[1])).join(' L')}" fill="none" stroke="${rim}" stroke-width="1.3" stroke-linejoin="round" opacity="0.45"/>`;
    }
    return out;
  }
  function forestRow(r, y0, count, h, x0, x1, opts) {
    // a fák egyenletesen, kis szórással; a középső (harci) sávban opcionálisan ritkább
    let s = '', sil = '';
    for (let i = 0; i < count; i++) {
      const x = x0 + (i + 0.5) * ((x1 - x0) / count) + (r() - 0.5) * (x1 - x0) / count * 0.7;
      const hh = h * (0.72 + r() * 0.5), w = hh * (opts.lit ? 0.34 + r() * 0.08 : 0.28 + r() * 0.06), y = y0 + r() * 12;
      if (opts.lit) s += pineLit(x, y, hh, w, r, opts.base, opts.lit, opts.rim);
      else sil += pineSilhouette(x, y, hh, w, r);
    }
    return opts.lit ? s : `<path d="${sil}" fill="${opts.base}"/>`;
  }

  // ---------- hegyek ----------
  function ridge(r, y0, amp, n, col, litCol) {
    const pts = [[-40, 640], [-40, y0]];
    const peaks = [];
    for (let i = 0; i <= n; i++) {
      const x = -40 + i * (1280 / n), px = x + (r() - 0.5) * 60, py = y0 - amp * (0.45 + r() * 0.55);
      const vx = x + 1280 / n / 2, vy = y0 - amp * (0.05 + r() * 0.25);
      pts.push([px, py]); peaks.push([px, py, vx, vy]);
      // apró zúzottság a lejtőn
      pts.push([(px + vx) / 2 + 6, (py + vy) / 2 - 4 + r() * 8]); pts.push([vx, vy]);
    }
    pts.push([1240, 640]);
    let lit = '';
    // holdfényes (jobb) lejtő: csúcs → völgy → a csúcs alatti pont
    peaks.forEach(([px, py, vx, vy]) => { lit += poly([[px, py], [(px + vx) / 2 + 6, (py + vy) / 2 - 2], [vx, vy], [px + (vx - px) * 0.25, vy + (y0 - vy) * 0.6]]) + ' '; });
    return `<path d="${poly(pts)}" fill="${col}"/><path d="${lit}" fill="${litCol}" opacity="0.4"/>`;
  }

  // ---------- felhők ----------
  function clouds(r, s, n, yMin, yMax, id) {
    let out = '';
    for (let i = 0; i < n; i++) {
      const x = r() * 1300 - 100, y = yMin + r() * (yMax - yMin), w = 160 + r() * 220, h = 14 + r() * 16;
      let d = '';
      for (let k = 0; k < 5; k++) { const cx = x + (k - 2) * w * 0.18, cy = y - Math.sin(k / 4 * Math.PI) * h * 0.8; d += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(w * 0.22)}" ry="${f(h * (0.7 + 0.3 * Math.sin(k / 4 * Math.PI)))}"/>`; }
      // felhő: halvány, holdfényes perem (hátul, kicsit eltolva) és a sötétebb, elmosott test
      out += `<g class="sc-cloud" style="animation-duration:${(70 + r() * 60).toFixed(0)}s;animation-delay:-${(r() * 60).toFixed(0)}s"><g fill="${s.moon}" opacity="0.22" filter="url(#${id}-b3)" transform="translate(5 -5)">${d}</g><g fill="${mix(s.sky[1], s.sky[0], 0.3)}" opacity="0.85" filter="url(#${id}-b3)">${d}</g></g>`;
    }
    return out;
  }

  // ---------- talaj és apróságok ----------
  function grassTuft(x, y, sc, col, tip) {
    let d = '', t = '';
    const n = 5;
    for (let i = 0; i < n; i++) {
      const a = (i - (n - 1) / 2) * 0.28, len = (10 + (i % 3) * 5) * sc, bx = x + (i - 2) * 2.2 * sc;
      const tx = bx + Math.sin(a) * len * 1.2, ty = y - Math.cos(a) * len;
      d += `M${f(bx - 1.6 * sc)} ${f(y)} Q${f(bx + Math.sin(a) * len * 0.4)} ${f(y - len * 0.6)} ${f(tx)} ${f(ty)} Q${f(bx + Math.sin(a) * len * 0.5 + 1)} ${f(y - len * 0.5)} ${f(bx + 1.6 * sc)} ${f(y)} Z `;
      if (i >= 2) t += `M${f(tx)} ${f(ty)} L${f(tx - Math.sin(a) * 3 * sc)} ${f(ty + 4 * sc)} `;
    }
    return `<path d="${d}" fill="${col}"/>` + (tip ? `<path d="${t}" stroke="${tip}" stroke-width="${f(1.1 * sc)}" stroke-linecap="round" opacity="0.6"/>` : '');
  }
  function rock(x, y, w, h, col, lit, r) {
    const pts = [[x - w / 2, y], [x - w * 0.46, y - h * 0.55], [x - w * 0.2, y - h * (0.9 + r() * 0.1)], [x + w * 0.15, y - h], [x + w * 0.42, y - h * 0.6], [x + w / 2, y]];
    const litP = [[x + w * 0.15, y - h], [x + w * 0.42, y - h * 0.6], [x + w / 2, y], [x + w * 0.12, y], [x + w * 0.02, y - h * 0.62]];
    return `<path d="${poly(pts)}" fill="${col}"/><path d="${poly(litP)}" fill="${lit}" opacity="0.75"/><path d="M${f(x - w * 0.2)} ${f(y - h * 0.95)} L${f(x + w * 0.15)} ${f(y - h)} L${f(x + w * 0.42)} ${f(y - h * 0.6)}" stroke="${mix(lit, '#ffffff', 0.4)}" stroke-width="1.4" fill="none" opacity="0.5"/>`;
  }
  function mushroom(x, y, sc, cap, glow, delay) {
    return `<g class="sc-rune" style="animation-delay:${delay}s"><ellipse cx="${x}" cy="${f(y - 8 * sc)}" rx="${f(12 * sc)}" ry="${f(9 * sc)}" fill="${glow}" opacity="0.35" filter="url(#__B3__)"/></g>` +
      `<path d="M${f(x - 1.6 * sc)} ${y} L${f(x - 1.2 * sc)} ${f(y - 7 * sc)} L${f(x + 1.2 * sc)} ${f(y - 7 * sc)} L${f(x + 1.6 * sc)} ${y} Z" fill="#e8e2d0"/>` +
      `<path d="M${f(x - 6 * sc)} ${f(y - 6 * sc)} C${f(x - 6 * sc)} ${f(y - 13 * sc)} ${f(x + 6 * sc)} ${f(y - 13 * sc)} ${f(x + 6 * sc)} ${f(y - 6 * sc)} Z" fill="${cap}"/>` +
      `<circle cx="${f(x - 2 * sc)}" cy="${f(y - 9.5 * sc)}" r="${f(1 * sc)}" fill="#fff" opacity="0.8"/><circle cx="${f(x + 2.4 * sc)}" cy="${f(y - 8 * sc)}" r="${f(0.8 * sc)}" fill="#fff" opacity="0.7"/>`;
  }
  function groundPlane(s, y0, id, pathC) {
    // hullámzó talaj sávja, és perspektivikusan kiszélesedő ösvény a közepén
    const g = `<path d="M-40 ${y0} C200 ${y0 - 14} 420 ${y0 + 8} 640 ${y0 - 6} C860 ${y0 - 18} 1040 ${y0 + 4} 1240 ${y0 - 8} L1240 640 L-40 640 Z" fill="url(#${id}-gnd)"/>`;
    const p = pathC ? `<path d="M560 ${y0 + 2} C590 ${y0 + 1} 620 ${y0 + 1} 650 ${y0 + 2} C700 ${y0 + 40} 760 ${y0 + 80} 860 640 L360 640 C440 ${y0 + 80} 520 ${y0 + 40} 560 ${y0 + 2} Z" fill="${pathC}" opacity="0.55"/>` +
      `<path d="M650 ${y0 + 2} C700 ${y0 + 40} 760 ${y0 + 80} 860 640" stroke="${s.moon}" stroke-opacity="0.12" stroke-width="2" fill="none"/>` : '';
    let tex = '';
    for (let i = 0; i < 16; i++) { const x = (i * 83) % 1240 - 20, y = y0 + 18 + ((i * 37) % 80), w = 40 + (i * 29) % 70; tex += `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${(w * 0.12).toFixed(1)}" fill="${mix(s.ground, '#000000', 0.25)}" opacity="0.45"/>`; }
    return g + tex + p;
  }
  function frameForeground(r, s, id) {
    // sötét keret a széleken – területenként a tájhoz illő elemekből
    const c = s.near, rim = mix(s.moon, s.near, 0.55);
    let out = '';
    if (s.kind === 'swamp') {
      // nádas és gyékény a két alsó sarokban
      let reed = '', heads = '';
      [[40, 46], [1160, 40]].forEach(([x0, n]) => { for (let i = 0; i < n; i++) { const x = x0 + (r() - 0.5) * 150, h = 120 + r() * 200, lean = (x0 < 600 ? 1 : -1) * r() * 40; reed += `M${f(x - 2)} 606 Q${f(x + lean * 0.4)} ${f(606 - h * 0.5)} ${f(x + lean)} ${f(606 - h)} Q${f(x + lean * 0.4 + 3)} ${f(606 - h * 0.5)} ${f(x + 3)} 606 Z `; if (r() < 0.25) heads += `<ellipse cx="${f(x + lean * 0.96)}" cy="${f(606 - h * 0.92)}" rx="5" ry="16" fill="${mix(c, '#3a2414', 0.5)}" transform="rotate(${f(lean * 0.4)} ${f(x + lean)} ${f(606 - h * 0.9)})"/>`; } });
      return out + `<path d="${reed}" fill="${c}"/>` + heads + `<path d="${reed}" fill="none" stroke="${rim}" stroke-width="1" opacity="0.18"/>`;
    }
    if (s.kind === 'ruins') {
      // bal oldalt egy közeli, letört oszlop csonkja, jobb alul omladék
      out += `<path d="M-40 606 L-40 120 L20 108 L46 132 L60 118 L74 606 Z" fill="${c}"/><path d="M60 118 L74 606 L56 606 L46 132 Z" fill="${rim}" opacity="0.22"/>`;
      let joints = ''; for (let y = 170; y < 600; y += 64) joints += `M-40 ${y} L72 ${y + 4} `; out += `<path d="${joints}" stroke="${mix(c, '#000', 0.5)}" stroke-width="3"/>`;
      out += `<path d="M1020 606 L1050 560 L1110 548 L1150 520 L1220 512 L1240 606 Z" fill="${c}"/><path d="M1110 548 L1150 520 L1170 540 L1130 560 Z" fill="${rim}" opacity="0.2"/><path d="M960 606 L990 580 L1030 584 L1040 606 Z" fill="${c}"/>`;
      return out;
    }
    if (s.kind === 'cliffs' || s.kind === 'crater') {
      // sötét sziklák (a szirteken kristályszilánkokkal) a sarkokban
      const hot = s.kind === 'crater';
      out += `<path d="M-40 606 L-40 400 L0 370 L30 420 L56 410 L80 490 L100 540 L120 606 Z" fill="${c}"/><path d="M0 370 L30 420 L56 410 L80 490 L40 460 Z" fill="${hot ? '#ff6a3a' : rim}" opacity="${hot ? 0.18 : 0.22}"/>`;
      out += `<path d="M1240 606 L1240 430 L1210 400 L1190 450 L1166 470 L1146 540 L1120 606 Z" fill="${c}"/><path d="M1210 400 L1190 450 L1166 470 L1196 480 Z" fill="${hot ? '#ff6a3a' : rim}" opacity="${hot ? 0.18 : 0.22}"/>`;
      if (!hot) [[20, 390, 64, -0.3], [56, 420, 44, 0.2], [1206, 410, 64, 0.25], [1176, 460, 40, -0.2]].forEach(([x, y, h, a]) => { out += crystal(x, y, h, h * 0.32, a, s.fog, id); });
      else out += `<path d="M80 490 L96 520 L90 560 M1166 470 L1150 510 L1158 550" stroke="#ff7a3a" stroke-width="2" fill="none" opacity="0.7"/>`;
      return out;
    }
    // bal felső ágak (lelógó tűlevél-legyezők)
    let br = '';
    [[-20, 40, 200], [-30, 120, 170], [-20, 200, 120]].forEach(([x, y, len]) => {
      br += `M${x} ${y} C${x + len * 0.4} ${y - 6} ${x + len * 0.8} ${y + 10} ${x + len} ${y + 34} `;
    });
    // lelógó tűlevél-pamacsok az ágak mentén
    let tufts = '';
    [[-20, 40, 200], [-30, 120, 170], [-20, 200, 120]].forEach(([x, y, len]) => {
      for (let i = 0; i < 14; i++) {
        const t = i / 14, bx = x + len * t, by = y + 34 * t * t - 4, l = 30 * (1 - t * 0.5);
        tufts += `M${f(bx - 8)} ${f(by - 2)} L${f(bx - 4)} ${f(by + l)} L${f(bx)} ${f(by + l * 0.6)} L${f(bx + 4)} ${f(by + l * 0.95)} L${f(bx + 9)} ${f(by)} Z `;
      }
    });
    // a táborban nincs közeli fatörzs és lelógó ág: a széles, alacsony képkivágásban csak egy értelmetlen fekete csík látszana belőle
    const noTrunk = s.kind === 'camp';
    if (!noTrunk) out += `<g class="sc-sway" style="transform-origin:0px 100px"><path d="${br}" stroke="${c}" stroke-width="6" stroke-linecap="round" fill="none"/><path d="${tufts}" fill="${c}"/><path d="${br}" stroke="${rim}" stroke-width="1.2" fill="none" opacity="0.25" transform="translate(2 -3)"/></g>`;
    // közeli fatörzs kéreggel, gyökérrel és holdfényes peremmel
    let bark = '';
    for (let i = 0; i < 14; i++) { const y = r() * 600, x = 4 + r() * 26; bark += `M${f(x)} ${f(y)} q${f((r() - 0.5) * 6)} ${f(20 + r() * 20)} ${f((r() - 0.5) * 4)} ${f(40 + r() * 40)} `; }
    if (!noTrunk) out += `<path d="M-40 -10 L34 -10 C36 200 40 420 46 560 L58 606 L-40 606 Z" fill="${c}"/><path d="${bark}" stroke="${mix(c, '#000000', 0.5)}" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
      `<path d="M34 -10 C36 200 40 420 46 560 L58 606" stroke="${rim}" stroke-width="2.2" fill="none" opacity="0.4"/>`;
    // jobb alsó páfrány
    let fern = '';
    [[1200, 600, -150, -120], [1210, 610, -110, -170], [1190, 600, -190, -60]].forEach(([x, y, dx, dy]) => {
      const n = 10;
      fern += `M${x} ${y} Q${x + dx * 0.4} ${y + dy * 0.8} ${x + dx} ${y + dy} `;
      for (let i = 1; i < n; i++) {
        const t = i / n, px = x + dx * t, py = y + dy * (t * (2 - t)), l = 26 * (1 - t * 0.7);
        fern += `M${f(px)} ${f(py)} Q${f(px - l * 0.5)} ${f(py - l * 0.2)} ${f(px - l * 0.55)} ${f(py - l * 0.7)} Q${f(px - l * 0.1)} ${f(py - l * 0.4)} ${f(px)} ${f(py)} Z M${f(px)} ${f(py)} Q${f(px + l * 0.1)} ${f(py - l * 0.5)} ${f(px + l * 0.45)} ${f(py - l * 0.8)} Q${f(px + l * 0.45)} ${f(py - l * 0.25)} ${f(px)} ${f(py)} Z `;
      }
    });
    out += `<g class="sc-sway2" style="transform-origin:1200px 600px"><path d="${fern}" fill="${rim}" opacity="0.25" transform="translate(1.5 -1.5)"/><path d="${fern}" fill="${c}" stroke="${c}" stroke-width="3" stroke-linejoin="round"/></g>`;
    // alsó fűsziluett
    let grass = '';
    for (let x = -20; x < 1240; x += 14 + r() * 10) { const h = 10 + r() * 22, lean = (r() - 0.5) * 12; grass += `M${f(x - 4)} 604 Q${f(x + lean * 0.5)} ${f(604 - h * 0.6)} ${f(x + lean)} ${f(604 - h)} Q${f(x + lean * 0.4 + 2)} ${f(604 - h * 0.5)} ${f(x + 4)} 604 Z `; }
    out += `<path d="${grass}" fill="${c}"/>`;
    return out;
  }

  // ---------- régióspecifikus elemek ----------
  function deadTree(x, y, h, col, r, rim) {
    // görcsös, csupasz fa: elágazó, elvékonyodó ágak
    let s = '';
    const branch = (x0, y0, ang, len, w, depth) => {
      const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len, bend = (r() - 0.5) * len * 0.4;
      const mx = (x0 + x1) / 2 + Math.cos(ang + Math.PI / 2) * bend, my = (y0 + y1) / 2 + Math.sin(ang + Math.PI / 2) * bend;
      s += `<path d="M${f(x0)} ${f(y0)} Q${f(mx)} ${f(my)} ${f(x1)} ${f(y1)}" stroke="${col}" stroke-width="${f(w)}" stroke-linecap="round" fill="none"/>`;
      if (rim && w > 3) s += `<path d="M${f(x0 + w * 0.3)} ${f(y0)} Q${f(mx + w * 0.3)} ${f(my)} ${f(x1 + w * 0.2)} ${f(y1)}" stroke="${rim}" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.35"/>`;
      if (depth > 0) { branch(x1, y1, ang - 0.35 - r() * 0.4, len * 0.68, w * 0.62, depth - 1); branch(x1, y1, ang + 0.3 + r() * 0.45, len * 0.62, w * 0.58, depth - 1); }
      else if (r() < 0.5) s += `<path d="M${f(x1)} ${f(y1)} q${f(-3 + r() * 6)} 10 ${f(-2 + r() * 4)} ${f(18 + r() * 14)}" stroke="${mix(col, '#6a8a6a', 0.4)}" stroke-width="1.4" fill="none" opacity="0.7"/>`;
    };
    s += `<path d="M${f(x - h * 0.06)} ${y} C${f(x - h * 0.03)} ${f(y - h * 0.3)} ${f(x - h * 0.05)} ${f(y - h * 0.45)} ${f(x)} ${f(y - h * 0.55)} C${f(x + h * 0.04)} ${f(y - h * 0.45)} ${f(x + h * 0.03)} ${f(y - h * 0.3)} ${f(x + h * 0.06)} ${y} Z" fill="${col}"/>`;
    branch(x, y - h * 0.5, -Math.PI / 2 - 0.25, h * 0.3, h * 0.05, 3);
    branch(x, y - h * 0.4, -Math.PI / 2 + 0.6, h * 0.24, h * 0.04, 2);
    return s;
  }
  function stoneArch(x, y, w, h, col, lit, line, broken, r) {
    // két oszlop kőtömbökből, rajtuk ívelt boltív; a jobb (holdfényes) oldaluk világosabb
    const pw = w * 0.18, top = y - h, ar = (w - pw * 2) / 2, ay = top + ar * 0.2;
    let s = '';
    [x, x + w - pw].forEach((px, i) => {
      const ph = i === 1 && broken ? h * 0.55 : h;
      const ptop = y - ph;
      s += `<path d="M${f(px)} ${y} L${f(px)} ${f(ptop + (broken && i === 1 ? 8 : 0))} L${f(px + pw * 0.4)} ${f(ptop - (broken && i === 1 ? 10 : 0))} L${f(px + pw)} ${f(ptop + (broken && i === 1 ? 4 : 0))} L${f(px + pw)} ${y} Z" fill="${col}"/>`;
      s += `<path d="M${f(px + pw * 0.62)} ${y} L${f(px + pw * 0.62)} ${f(ptop + 4)} L${f(px + pw)} ${f(ptop + 4)} L${f(px + pw)} ${y} Z" fill="${lit}" opacity="0.5"/>`;
      let bricks = '';
      for (let by = y - 22; by > ptop + 10; by -= 22) bricks += `M${f(px)} ${f(by)} L${f(px + pw)} ${f(by)} M${f(px + pw * (0.3 + ((by / 22) % 2) * 0.35))} ${f(by)} L${f(px + pw * (0.3 + ((by / 22) % 2) * 0.35))} ${f(by + 22)} `;
      s += `<path d="${bricks}" stroke="${line}" stroke-width="1.4" opacity="0.6"/>`;
      s += `<path d="M${f(px - 6)} ${f(y)} L${f(px + pw + 6)} ${f(y)} L${f(px + pw + 4)} ${f(y - 12)} L${f(px - 4)} ${f(y - 12)} Z" fill="${col}"/>`;
    });
    if (!broken) {
      const ox = x + pw, ix = x + w - pw;
      const arc = `M${f(x)} ${f(top)} C${f(x)} ${f(top - ar * 1.2)} ${f(x + w)} ${f(top - ar * 1.2)} ${f(x + w)} ${f(top)} L${f(ix)} ${f(top)} C${f(ix)} ${f(top - ar * 0.75)} ${f(ox)} ${f(top - ar * 0.75)} ${f(ox)} ${f(top)} Z`;
      s += `<path d="${arc}" fill="${col}"/>`;
      let vous = '';
      for (let i = 1; i < 8; i++) { const a = Math.PI - i * Math.PI / 8, cx = x + w / 2, rx1 = (ix - ox) / 2, rx2 = w / 2; vous += `M${f(cx + Math.cos(a) * rx1)} ${f(top - Math.sin(a) * ar * 0.56)} L${f(cx + Math.cos(a) * rx2)} ${f(top - Math.sin(a) * ar * 0.9)} `; }
      s += `<path d="${vous}" stroke="${line}" stroke-width="1.4" opacity="0.6"/><path d="M${f(x + w * 0.55)} ${f(top - ar * 0.9)} C${f(x + w * 0.8)} ${f(top - ar * 0.86)} ${f(x + w)} ${f(top - ar * 0.4)} ${f(x + w)} ${f(top)}" stroke="${lit}" stroke-width="3" fill="none" opacity="0.6"/>`;
    }
    // indák
    let vine = '';
    for (let i = 0; i < 3; i++) {
      // az inda kőből indul: ép boltívnél a belső ív aljáról, töröttnél az oszlop tetejéről
      let vx, vy;
      if (broken) { vx = x + r() * pw; vy = top + 6; }
      else { const ox = x + pw, ix = x + w - pw, cx = (ox + ix) / 2, rx1 = (ix - ox) / 2; vx = ox + 6 + r() * (ix - ox - 12); const t = Math.max(-1, Math.min(1, (vx - cx) / rx1)); vy = top - Math.sqrt(1 - t * t) * ar * 0.56 + 2; }
      const len = 40 + r() * 70;
      vine += `<path d="M${f(vx)} ${f(vy)} q${f((r() - 0.5) * 20)} ${f(len / 2)} ${f((r() - 0.5) * 10)} ${f(len)}" stroke="#2f5a3a" stroke-width="2" fill="none"/>`;
      for (let k = 1; k < 5; k++) vine += `<ellipse cx="${f(vx + (k % 2 ? 3 : -3))}" cy="${f(vy + len * k / 5)}" rx="3.2" ry="1.8" fill="#3f7a4a" transform="rotate(${k % 2 ? 30 : -30} ${f(vx)} ${f(vy + len * k / 5)})"/>`;
    }
    return s + vine;
  }
  function crystal(x, y, h, w, ang, c, id) {
    // hatszögletű kristályhasáb: két lap (világos és sötét), hegyes csúcs, ragyogás mögötte
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const T = (px, py) => [x + px * ca - py * sa, y + px * sa + py * ca];
    const tip = T(0, -h), l1 = T(-w / 2, -h * 0.78), l0 = T(-w / 2, 0), m0 = T(w * 0.08, 0), m1 = T(w * 0.08, -h * 0.8), r1 = T(w / 2, -h * 0.76), r0 = T(w / 2, 0);
    return `<path d="${poly([l0, l1, tip, m1, m0])}" fill="${mix(c, '#0a1a3a', 0.35)}"/><path d="${poly([m0, m1, tip, r1, r0])}" fill="${mix(c, '#ffffff', 0.25)}"/>` +
      `<path d="M${f(m1[0])} ${f(m1[1])} L${f(tip[0])} ${f(tip[1])} L${f(r1[0])} ${f(r1[1])}" stroke="#ffffff" stroke-width="1.4" fill="none" opacity="0.7"/>` +
      `<path d="${poly([l0, l1, tip, r1, r0])}" fill="none" stroke="${mix(c, '#04102a', 0.6)}" stroke-width="1.4" stroke-linejoin="round"/>`;
  }
  function crystalCluster(x, y, sc, c, r, id) {
    let s = `<ellipse class="sc-rune" style="animation-delay:${(r() * 2).toFixed(2)}s" cx="${x}" cy="${f(y - 30 * sc)}" rx="${f(40 * sc)}" ry="${f(46 * sc)}" fill="${c}" opacity="0.3" filter="url(#${id}-b12)"/>`;
    [[-0.5, 40, 14], [0.05, 70, 20], [0.45, 50, 15], [-0.15, 34, 12], [0.8, 28, 10]].forEach(([a, h, w], i) => {
      s += crystal(x + (i - 2) * 6 * sc, y, h * sc, w * sc, a + (r() - 0.5) * 0.1, c, id);
    });
    return s;
  }
  function tent(x, y, w, h, c, lit, glow) {
    const ap = [x, y - h];
    return `<path d="${poly([[x - w / 2, y], ap, [x, y]])}" fill="${mix(c, '#000000', 0.25)}"/><path d="${poly([ap, [x + w / 2, y], [x, y]])}" fill="${lit}"/>` +
      `<path d="${poly([[x - w * 0.12, y], [x, y - h * 0.62], [x + w * 0.12, y]])}" fill="${glow}" opacity="0.85"/>` +
      `<path d="M${f(x - w / 2 - 10)} ${y} L${f(ap[0])} ${f(ap[1] - 10)} L${f(x + w / 2 + 10)} ${y}" stroke="#3a2418" stroke-width="2" fill="none"/>` +
      `<path d="M${f(ap[0])} ${f(ap[1] - 10)} L${f(ap[0])} ${f(ap[1] - 30)}" stroke="#3a2418" stroke-width="2.4"/><path class="sc-flag" d="M${f(ap[0])} ${f(ap[1] - 30)} L${f(ap[0] + 22)} ${f(ap[1] - 25)} L${f(ap[0])} ${f(ap[1] - 19)} Z" fill="#c25a8a"/>`;
  }
  function campfire(x, y, id) {
    let s = `<ellipse cx="${x}" cy="${y - 10}" rx="260" ry="70" fill="#ff9a40" opacity="0.22" filter="url(#${id}-b20)"/>`;
    // kőgyűrű
    for (let i = 0; i < 9; i++) { const a = Math.PI * (0.05 + i * 0.9 / 8), sx = x + Math.cos(a) * 46 * (i % 2 ? 1 : 0.96), sy = y + 4 - Math.sin(a) * -8; s += `<ellipse cx="${f(sx)}" cy="${f(sy)}" rx="11" ry="7" fill="#4a4660"/><ellipse cx="${f(sx + 2)}" cy="${f(sy - 3)}" rx="7" ry="3" fill="#ffb070" opacity="0.45"/>`; }
    s += `<path d="M${x - 40} ${y + 2} L${x + 36} ${y - 14}" stroke="#4a2e1c" stroke-width="10" stroke-linecap="round"/><path d="M${x - 36} ${y - 14} L${x + 40} ${y + 2}" stroke="#5a3a22" stroke-width="10" stroke-linecap="round"/>` +
      `<path d="M${x - 30} ${y - 4} L${x + 30} ${y - 14}" stroke="#ff9a40" stroke-width="2" opacity="0.6"/>`;
    const base = s; s = '';
    s += `<g class="sc-fire"><path d="M${x - 28} ${y - 6} C${x - 34} ${y - 40} ${x - 10} ${y - 56} ${x - 6} ${y - 92} C${x + 8} ${y - 60} ${x + 34} ${y - 50} ${x + 26} ${y - 6} Z" fill="#ff7a2a"/>` +
      `<path d="M${x - 16} ${y - 6} C${x - 20} ${y - 30} ${x - 2} ${y - 40} ${x + 2} ${y - 66} C${x + 10} ${y - 40} ${x + 22} ${y - 34} ${x + 16} ${y - 6} Z" fill="#ffc04a"/>` +
      `<path d="M${x - 7} ${y - 6} C${x - 8} ${y - 20} ${x + 2} ${y - 26} ${x + 3} ${y - 40} C${x + 8} ${y - 24} ${x + 12} ${y - 18} ${x + 8} ${y - 6} Z" fill="#fff2c0"/></g>`;
    for (let i = 0; i < 10; i++) s += `<circle class="sc-ember" style="animation-delay:-${(i * 0.37).toFixed(2)}s;animation-duration:${(2.4 + (i % 4) * 0.5).toFixed(1)}s" cx="${x - 16 + (i * 7) % 34}" cy="${y - 40}" r="${1.4 + (i % 3) * 0.6}" fill="#ffd27a"/>`;
    return { base: base, live: s };
  }
  function lavaCracks(r, y0, id) {
    // elágazó, elvékonyodó repedések: a fő ágból kisebb mellékágak indulnak
    let glow = '', core = '';
    const crack = (x, y, ang, len, w, depth) => {
      let d = `M${f(x)} ${f(y)}`;
      for (let k = 0; k < 4; k++) { ang += (r() - 0.5) * 0.9; x += Math.cos(ang) * len / 4; y += Math.sin(ang) * len / 4 * 0.35; d += ` L${f(x)} ${f(y)}`; if (depth > 0 && r() < 0.45) crack(x, y, ang + (r() < 0.5 ? -1 : 1) * (0.6 + r() * 0.5), len * 0.5, w * 0.6, depth - 1); }
      glow += `<path d="${d}" stroke="#ff5a2a" stroke-width="${f(w * 3.2)}" fill="none" opacity="0.28" stroke-linecap="round" stroke-linejoin="round"/>`;
      core += `<path d="${d}" stroke="#ffb070" stroke-width="${f(w)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    };
    [60, 330, 600, 760, 1080].forEach(x0 => crack(x0 + r() * 60, y0 + 30 + r() * 70, (r() - 0.5) * 0.6, 110 + r() * 90, 1.6 + r() * 1.2, 1));
    return `<g filter="url(#${id}-b3)">${glow}</g>${core}`;
  }
  function embers(n, x0, x1, y0, c, r) {
    let s = '';
    for (let i = 0; i < n; i++) s += `<circle class="sc-ember" style="animation-delay:-${(r() * 5).toFixed(2)}s;animation-duration:${(4 + r() * 4).toFixed(1)}s" cx="${f(x0 + r() * (x1 - x0))}" cy="${f(y0 + r() * 60)}" r="${f(1 + r() * 2)}" fill="${c}"/>`;
    return s;
  }

  // ---------- jelenet ----------
  function scene(regionId, opts) {
    opts = opts || {};
    const s = SC[regionId] || SC.holdfeny, id = 'sc' + (++UID), r = rng(opts.seed || 7);
    const moonX = opts.moonX || 880, moonY = opts.moonY || 130;
    const litOf = c => mix(c, s.moon, 0.14), rimOf = c => mix(c, s.moon, 0.5);
    let stars = '';
    for (let i = 0; i < 90; i++) {
      const x = r() * 1200, y = r() * 340, sz = r() < 0.1 ? 1.9 : 0.7 + r() * 0.7;
      stars += `<circle class="sc-tw" style="animation-delay:${(r() * 4).toFixed(2)}s;animation-duration:${(2.5 + r() * 3).toFixed(1)}s" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${sz.toFixed(1)}" fill="#fff"/>`;
      if (sz > 1.8) stars += `<path d="M${(x - 5).toFixed(0)} ${y.toFixed(0)} L${(x + 5).toFixed(0)} ${y.toFixed(0)} M${x.toFixed(0)} ${(y - 5).toFixed(0)} L${x.toFixed(0)} ${(y + 5).toFixed(0)}" stroke="#fff" stroke-width="0.8" opacity="0.6"/>`;
    }
    const shooting = `<g class="sc-shoot" opacity="0"><path d="M0 0 L-120 40" stroke="url(#${id}-shoot)" stroke-width="2.4" stroke-linecap="round"/></g>`;
    const fFar = mix(s.far, s.sky[2], 0.4), fFar2 = mix(s.far, s.sky[2], 0.65);
    let mountains = ridge(r, 360, 150, 5, fFar2, mix(fFar2, s.moon, 0.25)) + ridge(r, 400, 110, 7, fFar, mix(fFar, s.moon, 0.22));
    let far = '', mid = '', ground = '', props = '', after = '', live = '';
    const G = 500; // a középtér talajvonala
    switch (s.kind) {
      case 'forest':
        far = forestRow(r, 440, 30, 140, -40, 1240, { base: mix(fFar, s.mid, 0.3) });
        mid = forestRow(r, 500, 5, 260, -60, 380, { base: s.mid, lit: litOf(s.mid), rim: rimOf(s.mid) }) + forestRow(r, 500, 5, 280, 840, 1260, { base: s.mid, lit: litOf(s.mid), rim: rimOf(s.mid) }) + forestRow(r, 470, 4, 170, 400, 820, { base: mix(s.mid, fFar, 0.45), lit: litOf(mix(s.mid, fFar, 0.45)), rim: rimOf(s.mid) }) + `<ellipse cx="600" cy="430" rx="620" ry="90" fill="${s.fog}" opacity="0.10"/>`;
        ground = groundPlane(s, G, id, mix(s.ground, s.moon, 0.18));
        props = rock(470, 548, 70, 30, mix(s.ground, '#000', 0.3), litOf(s.ground), r) + rock(1160, 556, 90, 36, mix(s.ground, '#000', 0.3), litOf(s.ground), r) +
          mushroom(520, 556, 1.4, '#7ff3ff', '#7ff3ff', 0) + mushroom(536, 560, 1, '#7ff3ff', '#7ff3ff', 0.7) + mushroom(760, 566, 1.3, '#ff8ac6', '#ff8ac6', 1.2) + mushroom(778, 570, 0.9, '#ff8ac6', '#ff8ac6', 0.4);
        for (let i = 0; i < 26; i++) props += grassTuft(r() * 1200, G + 14 + r() * 80, 0.8 + r() * 0.8, mix(s.ground, '#000', 0.25), rimOf(s.ground));
        break;
      case 'swamp': {
        far = forestRow(r, 440, 14, 90, -40, 1240, { base: mix(fFar, s.mid, 0.3) }) + [120, 420, 760, 1090].map(x => deadTree(x + (r() - 0.5) * 60, 470, 150 + r() * 60, mix(fFar, s.mid, 0.5), r)).join('');
        // víztükör a középtérben, a hold tükörképével
        mid = `<path d="M-40 470 C200 462 420 476 640 466 C860 458 1040 472 1240 464 L1240 560 L-40 560 Z" fill="url(#${id}-water)"/>`;
        let refl = '';
        for (let i = 0; i < 7; i++) { const y = 478 + i * 10, w = 60 - i * 5 + r() * 16, x0 = moonX - w / 2 + (r() - 0.5) * 16; refl += `<path d="M${f(x0)} ${y} q${f(w / 4)} -2.5 ${f(w / 2)} 0 t${f(w / 2)} 0" stroke="${s.moon}" stroke-width="2" fill="none" stroke-linecap="round" opacity="${(0.42 - i * 0.05).toFixed(2)}"/>`; }
        mid += `<path d="M-40 470 C200 462 420 476 640 466 C860 458 1040 472 1240 464" stroke="${mix(s.moon, s.sky[2], 0.4)}" stroke-width="2" fill="none" opacity="0.5"/>`;
        mid += refl;
        [[300, 500], [520, 520], [700, 494], [940, 530], [160, 516]].forEach(([x, y]) => { mid += `<path d="M${x} ${y} m-16 0 a16 6 0 1 0 32 0 a16 6 0 1 0 -32 0 Z" fill="#2f6a4a"/><path d="M${x} ${y} L${x + 14} ${y - 3} L${x + 14} ${y + 3} Z" fill="#173a2a"/>`; if (r() < 0.6) mid += `<circle cx="${x - 6}" cy="${y - 3}" r="3.2" fill="#ffd6f0"/>`; });
        mid += deadTree(250, 520, 230, s.mid, r, rimOf(s.mid)) + deadTree(980, 516, 260, s.mid, r, rimOf(s.mid));
        ground = `<path d="M-40 540 C200 528 420 548 640 538 C860 528 1040 546 1240 534 L1240 640 L-40 640 Z" fill="url(#${id}-gnd)"/>`;
        // nádas csomók és lidércfények
        let reed = '';
        [[60, 560, 14], [430, 548, 8], [820, 552, 9], [1150, 556, 14]].forEach(([x, y, n]) => {
          for (let i = 0; i < n; i++) { const rx = x + (r() - 0.5) * 70, h = 40 + r() * 60, lean = (r() - 0.5) * 22; reed += `<path d="M${f(rx)} ${y} Q${f(rx + lean / 2)} ${f(y - h / 2)} ${f(rx + lean)} ${f(y - h)}" stroke="${mix(s.mid, '#000', 0.2)}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`; if (r() < 0.4) reed += `<ellipse cx="${f(rx + lean)}" cy="${f(y - h + 6)}" rx="3" ry="9" fill="#4a3424"/>`; }
        });
        live += [[380, 470], [640, 430], [880, 460]].map(([x, y], i) => `<g class="sc-wisp" style="animation-delay:-${i * 1.3}s"><circle cx="${x}" cy="${y}" r="16" fill="${s.fog}" opacity="0.35" filter="url(#${id}-b3)"/><circle cx="${x}" cy="${y}" r="4" fill="#eafff4"/></g>`).join(''); props = reed;
        for (let i = 0; i < 18; i++) props += grassTuft(r() * 1200, 548 + r() * 50, 0.8 + r() * 0.7, mix(s.ground, '#000', 0.25), rimOf(s.ground));
        break;
      }
      case 'ruins': {
        // távoli tornyok világító ablakokkal
        let towers = '';
        [[140, 120, 50], [430, 180, 40], [880, 150, 60], [1110, 100, 44]].forEach(([x, h, w]) => {
          towers += `<path d="M${x} 440 L${x} ${440 - h} L${x + w * 0.2} ${440 - h - 12} L${x + w * 0.45} ${440 - h + 4} L${x + w * 0.7} ${440 - h - 18} L${x + w} ${440 - h} L${x + w} 440 Z" fill="${mix(fFar, s.mid, 0.2)}"/>`;
          towers += `<rect class="sc-rune" x="${x + w * 0.4}" y="${440 - h * 0.6}" width="6" height="12" rx="3" fill="${s.fog}" opacity="0.8"/>`;
        });
        far = towers;
        mid = stoneArch(150, G + 4, 150, 170, s.mid, litOf(s.mid), mix(s.mid, '#000', 0.4), false, r) + stoneArch(520, G - 6, 120, 120, mix(s.mid, fFar, 0.3), litOf(s.mid), mix(s.mid, '#000', 0.4), true, r) +
          stoneArch(880, G + 6, 170, 200, s.mid, litOf(s.mid), mix(s.mid, '#000', 0.4), false, r);
        ground = groundPlane(s, G, id, null);
        // kőlapos út repedésekkel
        let tiles = '';
        let ty = G + 16; // a sorok összeérnek, így a burkolat folytonos (nem lépcsőnek hat)
        for (let row = 0; row < 5; row++) {
          const sc = 1 + row * 0.35, y = ty; ty += 9 * sc;
          for (let x = 400 - row * 60; x < 820 + row * 60; x += 46 * sc) tiles += `<path d="M${f(x)} ${f(y)} L${f(x + 42 * sc)} ${f(y)} L${f(x + 44 * sc)} ${f(y + 9 * sc)} L${f(x - 2)} ${f(y + 9 * sc)} Z" fill="${mix(s.ground, s.moon, 0.12)}" stroke="${mix(s.ground, '#000', 0.4)}" stroke-width="1.2"/>`;
        }
        props = tiles + rock(470, 560, 80, 24, mix(s.ground, '#000', 0.3), litOf(s.ground), r) + `<path d="M1120 572 L1140 520 L1200 516 L1210 572 Z" fill="${s.mid}"/><path d="M1180 517 L1200 516 L1210 572 L1186 572 Z" fill="${litOf(s.mid)}" opacity="0.6"/>`;
        // világító rúnák az oszlopokon (a bevezető szerint a falakon vannak)
        const rune = (x, y, k) => [`M${x} ${y} l0 22 M${x - 7} ${y + 6} l14 0 M${x - 6} ${y + 16} l12 -8`, `M${x - 7} ${y} l7 11 l7 -11 M${x} ${y + 11} l0 12`, `M${x} ${y} l0 24 M${x} ${y + 4} l8 6 l-8 6`][k % 3];
        mid += [[164, G - 120], [270, G - 70], [536, G - 40], [904, G - 140], [1022, G - 90]].map(([x, y], i) => `<path d="${rune(x, y, i)}" fill="none" stroke="${s.fog}" stroke-width="2.4" stroke-linecap="round"/><path d="${rune(x, y, i)}" fill="none" stroke="${s.fog}" stroke-width="7" stroke-linecap="round" opacity="0.18"/>`).join('');
        for (let i = 0; i < 14; i++) props += grassTuft(r() * 1200, G + 20 + r() * 80, 0.7 + r() * 0.7, mix(s.ground, '#000', 0.25), rimOf(s.ground));
        break;
      }
      case 'cliffs': {
        // lebegő szigetek és csillámló kristályszirtek
        let isl = '';
        [[330, 150, 64], [900, 130, 56], [620, 210, 36]].forEach(([x, y, w], i) => {
          isl += `<g class="sc-float" style="animation-delay:-${i * 1.7}s"><path d="M${x - w} ${y} C${x - w * 0.6} ${y + w * 0.4} ${x - w * 0.2} ${y + w * 1.1} ${x} ${y + w * 1.3} C${x + w * 0.3} ${y + w * 0.9} ${x + w * 0.7} ${y + w * 0.4} ${x + w} ${y} Z" fill="${fFar}"/>` +
            `<path d="M${x} ${y + w * 1.3} C${x + w * 0.3} ${y + w * 0.9} ${x + w * 0.7} ${y + w * 0.4} ${x + w} ${y} L${x + w * 0.2} ${y} Z" fill="${litOf(fFar)}" opacity="0.5"/>` +
            `<path d="M${x - w - 4} ${y} C${x - w * 0.5} ${y - 10} ${x + w * 0.5} ${y - 10} ${x + w + 4} ${y} Z" fill="#2f6a6a"/>` + crystalCluster(x + w * 0.2, y - 2, 0.5, s.fog, r, id) + '</g>';
        });
        far = isl;
        let spire = '';
        [[40, 200], [170, 250], [1050, 240], [1170, 190]].forEach(([x, h]) => {
          spire += `<path d="M${x - 70} ${G + 10} L${x - 30} ${G - h * 0.6} L${x - 8} ${G - h} L${x + 20} ${G - h * 0.7} L${x + 70} ${G + 10} Z" fill="${s.mid}"/><path d="M${x - 8} ${G - h} L${x + 20} ${G - h * 0.7} L${x + 70} ${G + 10} L${x + 6} ${G + 10} L${x - 2} ${G - h * 0.5} Z" fill="${litOf(s.mid)}" opacity="0.55"/>`;
          spire += crystalCluster(x + 10, G - h * 0.55, 0.6, s.fog, r, id);
        });
        mid = spire;
        // a lehullott csillag krátere: kőperem, izzó, megrepedt csillagdarab a mélyedésben
        mid += `<ellipse cx="640" cy="${G + 8}" rx="170" ry="26" fill="${mix(s.mid, '#000', 0.35)}"/><ellipse cx="640" cy="${G + 4}" rx="150" ry="18" fill="${mix(s.ground, '#000', 0.45)}"/>` +
          `<ellipse cx="640" cy="${G - 2}" rx="110" ry="40" fill="${s.fog}" opacity="0.18" filter="url(#${id}-b12)"/>` +
          `<path d="M612 ${G + 6} L622 ${G - 26} L640 ${G - 44} L660 ${G - 24} L672 ${G + 6} Z" fill="${mix(s.fog, '#ffffff', 0.4)}" stroke="${mix(s.fog, '#04102a', 0.5)}" stroke-width="2"/><path d="M640 ${G - 44} L660 ${G - 24} L672 ${G + 6} L644 ${G + 6} Z" fill="${s.fog}" opacity="0.6"/><path d="M630 ${G - 10} L642 ${G - 26} L650 ${G - 8}" stroke="#ffffff" stroke-width="1.6" fill="none"/>` +
          `<path d="M470 ${G + 10} L488 ${G - 4} L512 ${G + 2} M790 ${G + 8} L806 ${G - 6} L826 ${G + 4}" stroke="${mix(s.mid, s.moon, 0.3)}" stroke-width="3" fill="none"/>`;
        ground = groundPlane(s, G, id, null);
        props = crystalCluster(470, 566, 0.9, s.fog, r, id) + crystalCluster(1160, 566, 1.2, '#bfa8ff', r, id) + rock(540, 556, 60, 20, mix(s.ground, '#000', 0.3), litOf(s.ground), r) + rock(760, 560, 50, 18, mix(s.ground, '#000', 0.3), litOf(s.ground), r);
        for (let i = 0; i < 3; i++) after += `<g class="sc-shoot" opacity="0" style="animation-delay:${(i * 2.7 + 1).toFixed(1)}s;animation-duration:7s"><path d="M${i * 120} ${i * 30} L-90 ${i * 30 + 34}" stroke="url(#${id}-shoot)" stroke-width="2" stroke-linecap="round"/></g>`;
        for (let i = 0; i < 12; i++) props += grassTuft(r() * 1200, G + 20 + r() * 80, 0.6 + r() * 0.6, mix(s.ground, '#000', 0.25), rimOf(s.ground));
        break;
      }
      case 'crater': {
        // vulkán izzó kráterrel és füstoszloppal
        far = `<g transform="translate(-305 0)"><path d="M720 440 L880 250 L930 262 L960 248 L1120 440 Z" fill="${fFar}"/><path d="M930 262 L960 248 L1120 440 L1000 440 Z" fill="${litOf(fFar)}" opacity="0.4"/>` +
          `<ellipse class="sc-pulse" cx="918" cy="256" rx="70" ry="22" fill="#ff5a2a" opacity="0.6" filter="url(#${id}-b12)"/><path d="M880 250 C900 262 930 262 960 248" stroke="#ffb070" stroke-width="3" fill="none"/>` +
          [0, 1, 2, 3].map(i => `<ellipse class="sc-smoke" style="animation-delay:-${i * 2}s" cx="${920 + i * 14}" cy="${210 - i * 40}" rx="${40 + i * 16}" ry="${22 + i * 8}" fill="#3a1a2a" opacity="0.6" filter="url(#${id}-b12)"/>`).join('') +
          `<path d="M900 252 C890 300 870 330 860 380 M940 252 C952 300 960 350 990 400" stroke="#ff7a2a" stroke-width="3" fill="none" opacity="0.7"/></g>`;
        let rocks = '';
        [[70, 180], [250, 110], [1120, 150]].forEach(([x, h]) => { rocks += `<path d="M${x - 80} ${G + 10} L${x - 40} ${G - h * 0.7} L${x - 10} ${G - h} L${x + 30} ${G - h * 0.75} L${x + 90} ${G + 10} Z" fill="${s.mid}"/><path d="M${x - 10} ${G - h} L${x + 30} ${G - h * 0.75} L${x + 90} ${G + 10} L${x + 10} ${G + 10} Z" fill="${mix(s.mid, '#ff6a3a', 0.25)}" opacity="0.5"/>`; });
        mid = `<ellipse cx="600" cy="${G}" rx="700" ry="60" fill="#ff4a2a" opacity="0.1" filter="url(#${id}-b20)"/>` + rocks;
        ground = groundPlane(s, G, id, null) + lavaCracks(r, G, id);
        props = rock(480, 560, 70, 34, '#1a0a14', mix('#1a0a14', '#ff6a3a', 0.35), r) + rock(1150, 566, 90, 40, '#1a0a14', mix('#1a0a14', '#ff6a3a', 0.35), r); live += embers(18, 0, 1200, G + 20, '#ffb070', r);
        break;
      }
      default: { // tábor
        far = forestRow(r, 440, 26, 130, -40, 1240, { base: mix(fFar, s.mid, 0.3) });
        mid = forestRow(r, 490, 8, 230, -60, 1260, { base: s.mid, lit: litOf(s.mid), rim: rimOf(s.mid) }) +
          tent(80, G + 24, 150, 110, '#7a5a8a', mix('#7a5a8a', s.moon, 0.2), '#ffcf7a') + tent(1120, G + 18, 130, 96, '#5a6a8a', mix('#5a6a8a', s.moon, 0.2), '#ffcf7a') + tent(380, G - 4, 90, 66, '#6a4a5a', mix('#6a4a5a', s.moon, 0.2), '#ffcf7a');
        ground = groundPlane(s, G, id, mix(s.ground, '#ffb070', 0.15));
        // lampionfüzér két rúd között
        let lamps = `<path d="M470 ${G - 140} L470 ${G + 20} M760 ${G - 150} L760 ${G + 16}" stroke="#3a2418" stroke-width="4"/><path d="M470 ${G - 136} Q615 ${G - 90} 760 ${G - 146}" stroke="#2a1c14" stroke-width="1.4" fill="none"/>`;
        for (let i = 1; i < 8; i++) { const t = i / 8, x = 470 + 290 * t, y = (1 - t) * (1 - t) * (G - 136) + 2 * (1 - t) * t * (G - 90) + t * t * (G - 146); lamps += `<g class="sc-rune" style="animation-delay:${(i * 0.3).toFixed(1)}s"><circle cx="${f(x)}" cy="${f(y + 8)}" r="10" fill="#ffcf7a" opacity="0.35" filter="url(#${id}-b3)"/><ellipse cx="${f(x)}" cy="${f(y + 8)}" rx="4.5" ry="6" fill="${['#ffcf7a', '#ff8ac6', '#7ff3ff'][i % 3]}"/></g>`; }
        // keskeny (telefonos) képen a tűz beljebb kerül, hogy látsszon a hős mellett
        const cfx = opts && opts.narrow ? 730 : 860, dx = cfx - 860;
        const cf = campfire(cfx, 560, id); props = lamps + cf.base + `<g transform="translate(${dx} 0)"><path d="M930 576 L1050 570 L1052 586 L932 592 Z" fill="#5a3a22"/><path d="M930 576 L1050 570 L1051 576 L931 582 Z" fill="#7a5232"/><ellipse cx="931" cy="584" rx="5" ry="8" fill="#8a6a42"/></g>`; live += cf.live;
        for (let i = 0; i < 16; i++) props += grassTuft(r() * 1200, G + 20 + r() * 80, 0.7 + r() * 0.7, mix(s.ground, '#000', 0.25), rimOf(s.ground));
      }
    }
    let flies = '';
    for (let i = 0; i < (opts.flies == null ? 22 : opts.flies); i++) {
      const x = 40 + r() * 1120, y = 300 + r() * 260, d = (r() * 6).toFixed(2);
      flies += `<g class="sc-fly" style="animation-delay:-${d}s;animation-duration:${(5 + r() * 6).toFixed(1)}s"><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="7" fill="${s.fly}" opacity="0.25"/><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1.6 + r() * 1.4).toFixed(1)}" fill="${s.fly}"/></g>`;
    }
    const B3 = id + '-b3';
    const defs = `<defs>
        <linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.sky[0]}"/><stop offset="0.6" stop-color="${s.sky[1]}"/><stop offset="1" stop-color="${s.sky[2]}"/></linearGradient>
        <radialGradient id="${id}-halo"><stop offset="0" stop-color="${s.moon}" stop-opacity="${s.dimMoon ? 0.3 : 0.55}"/><stop offset="0.3" stop-color="${s.moon}" stop-opacity="${s.dimMoon ? 0.08 : 0.16}"/><stop offset="1" stop-color="${s.moon}" stop-opacity="0"/></radialGradient>
        <radialGradient id="${id}-moon" cx="0.4" cy="0.38"><stop offset="0" stop-color="${s.dimMoon ? s.moon : '#ffffff'}"/><stop offset="0.7" stop-color="${s.moon}"/><stop offset="1" stop-color="${mix(s.moon, s.sky[1], 0.25)}"/></radialGradient>
        <linearGradient id="${id}-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.moon}" stop-opacity="0.26"/><stop offset="1" stop-color="${s.moon}" stop-opacity="0"/></linearGradient>
        <linearGradient id="${id}-fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.fog}" stop-opacity="0"/><stop offset="0.5" stop-color="${s.fog}" stop-opacity="${s.kind === 'swamp' ? 0.3 : 0.16}"/><stop offset="1" stop-color="${s.fog}" stop-opacity="0"/></linearGradient>
        <linearGradient id="${id}-gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(s.ground, s.moon, 0.12)}"/><stop offset="0.35" stop-color="${s.ground}"/><stop offset="1" stop-color="${s.near}"/></linearGradient>
        <linearGradient id="${id}-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(s.sky[2], s.moon, 0.32)}"/><stop offset="0.08" stop-color="${mix(s.sky[2], s.moon, 0.12)}"/><stop offset="1" stop-color="${s.mid}"/></linearGradient>
        <linearGradient id="${id}-shoot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <radialGradient id="${id}-vig" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#03040f" stop-opacity="0.7"/></radialGradient>
        <filter id="${id}-b20" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>
        <filter id="${id}-b12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
        <filter id="${id}-b3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>`;
    // keskeny (álló) képen a terület jellegzetes elemei (boltívek, vulkán, tűhegyek) közelebb kerülnek a középhez
    const NAR = opts.narrow ? ` transform="translate(600 ${G}) scale(0.62) translate(-600 -${G})"` : '';
    const moonG = `<circle cx="${moonX}" cy="${moonY}" r="300" fill="url(#${id}-halo)"/>` +
      (s.dimMoon ? '' : `<g>${[-24, -10, 6, 20, 34].map((a, i) => `<path d="M${moonX - 18} ${moonY} L${moonX - 70 - i * 10} 640 L${moonX + 40 - i * 4} 640 L${moonX + 18} ${moonY} Z" fill="url(#${id}-ray)" transform="rotate(${a} ${moonX} ${moonY})" opacity="${0.5 - i * 0.06}"/>`).join('')}</g>`) +
      `<circle cx="${moonX}" cy="${moonY}" r="52" fill="url(#${id}-moon)"${s.dimMoon ? ' opacity="0.8"' : ''}/>` +
      `<g opacity="0.16" fill="${mix(s.moon, '#606a9a', 0.6)}"><circle cx="${moonX - 16}" cy="${moonY - 10}" r="10"/><circle cx="${moonX + 14}" cy="${moonY + 14}" r="7"/><circle cx="${moonX + 20}" cy="${moonY - 18}" r="4"/></g>`;
    // a mozdulatlan réteg nem animálódik: így a böngésző egyszer festi meg (a homályosítás drága), és csak a kis mozgó rétegek frissülnek
    const still = str => str.replace(/ class="sc-(rune|pulse|smoke|float|shimmer|flag|sway2?)"/g, '');
    const fogBand = (y, h) => `<rect x="-600" y="${y}" width="2400" height="${h}" fill="url(#${id}-fog)"/>`;
    const staticBody = `<g>${mountains}</g>${fogBand(330, 130)}<g${NAR}>${far}</g>${fogBand(400, 120)}<g${NAR}>${mid}</g>${ground}${props}`;
    const frame = opts.noFrame ? '' : frameForeground(r, s, id);
    const vig = opts.noVignette ? '' : `<rect width="1200" height="600" fill="url(#${id}-vig)"/>`;
    const svg = (cls, body, d) => `<svg class="scene${cls}" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${d || ''}${body}</svg>`;
    let out;
    if (opts.single) out = svg('', `<rect width="1200" height="600" fill="url(#${id}-sky)"/><g>${stars}</g>${moonG}${clouds(r, s, 5, 80, 300, id)}${still(staticBody)}${live}${fogBand(470, 150)}<g>${flies}</g>${still(frame)}${vig}`, defs);
    else out = svg(' sc-back', `<rect width="1200" height="600" fill="url(#${id}-sky)"/><g>${stars}</g>${shooting}${after}${moonG}${clouds(r, s, 5, 80, 300, id)}`, defs) +
      svg(' sc-static', still(staticBody)) +
      svg(' sc-front', `${live}<rect class="sc-fog2" x="-600" y="470" width="2400" height="150" fill="url(#${id}-fog)"/><g>${flies}</g>${opts.frameOverlay ? '' : still(frame)}${vig}`);
    return out.split('url(#__B3__)').join(`url(#${B3})`);
  }
  // előtér-keret külön rétegként, a harcosok FÖLÉ (az aréna használja); területenként saját elemekkel
  function frame(regionId, opts) {
    opts = opts || {};
    const s = SC[regionId] || SC.holdfeny, id = 'fr' + (++UID), r = rng((opts.seed || 7) + 3);
    return `<svg class="scene sc-frame" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${frameForeground(r, s, id).replace(/ class="sc-sway2?"/g, '')}</svg>`;
  }

  root.NYX.scenes = { scene: scene, frame: frame, SC: SC };
})(typeof window !== 'undefined' ? window : globalThis);
