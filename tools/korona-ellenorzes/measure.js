// a szem(ek) helyéből és a test sziluettjéből megkeresi a fejtetőt: a szem fölötti oszlopokban
// felfelé haladva az első (majdnem) átlátszó képpontig, a fülek/szarvak kiszűrésére mediánnal
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 900 } });
 await p.goto('file:///home/claude/nyxoria-game/stilus.html'); await p.waitForTimeout(300);
 const out = await p.evaluate(async () => {
  const M = NYX.monsters, g = {}; for (const [n, s] of Object.entries(M.NAMES)) { const k = (s.kind || M.kindOf(n)) + '|' + (s.variant || '') + (s.horns || '') + (s.moon ? 'moon' : '') + (s.acc || ''); if (!g[k]) g[k] = n; }
  const res = [];
  for (const [k, n] of Object.entries(g).sort()) {
   let svg = M.monster(n, 'holdfeny', {}).replace(/<ellipse class="m-shadow"[^>]*\/>/, '').replace(/<ellipse cx="180" cy="180" rx="170" ry="150"[^>]*\/>/, '');
   const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;width:680px;height:680px'; host.innerHTML = svg; document.body.appendChild(host);
   const el = host.querySelector('svg'); el.style.width = '680px'; el.style.height = '680px';
   const eyes = [...el.querySelectorAll('.m-eye')].map(e => { const bb = e.querySelector('ellipse:nth-child(2)').getBBox(), m = e.querySelector('ellipse:nth-child(2)').getCTM(), r = el.getScreenCTM().inverse().multiply(e.querySelector('ellipse:nth-child(2)').getScreenCTM()); const x = bb.x + bb.width / 2, y = bb.y + bb.height / 2; return [r.a * x + r.c * y + r.e, r.b * x + r.d * y + r.f]; });
   host.remove();
   const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', '<svg width="680" height="680" '));
   await img.decode();
   const cv = document.createElement('canvas'); cv.width = 680; cv.height = 680; const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0); const d = cx.getImageData(0, 0, 680, 680).data;
   const A = (ux, uy) => { const px = Math.round(ux * 2), py = Math.round((uy + 20) * 2); if (px < 0 || py < 0 || px >= 680 || py >= 680) return 0; return d[(py * 680 + px) * 4 + 3]; };
   let E = eyes; if (k.startsWith('rider')) E = eyes.slice(1); if (k.startsWith('swarm')) E = eyes.slice(4); if (k.startsWith('spider')) E = eyes;
   let top = null, cxm = null, w = null;
   if (E.length) {
    const ex = E.reduce((a, e) => a + e[0], 0) / E.length, ey = Math.min(...E.map(e => e[1]));
    const front = E.length >= 2, x0 = front ? Math.min(...E.map(e => e[0])) - 8 : ex - 10, x1 = front ? Math.max(...E.map(e => e[0])) + 8 : ex + 30;
    const tops = [];
    for (let x = x0; x <= x1; x += 1) { let y = ey; while (y > -20 && (A(x, y) > 60 || A(x, y - 1) > 60 || A(x, y - 2) > 60)) y -= 1; tops.push(y); }
    tops.sort((a, b) => a - b); top = Math.round(tops[Math.floor(tops.length / 2)]); cxm = Math.round((x0 + x1) / 2); w = Math.round(x1 - x0);
   }
   res.push({ k, n, eyes: E.map(e => e.map(v => Math.round(v))), anchor: [cxm, top], w });
  }
  return res;
 });
 console.log(JSON.stringify(out, null, 0).replace(/\},\{/g, '},\n{'));
 await b.close(); })();
