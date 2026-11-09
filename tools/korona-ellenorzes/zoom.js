// a korona környéke nagyítva, minden változatnál (2 fázis: nyugalmi és a lélegzés/lebegés csúcsa)
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
 await p.goto('file:///home/claude/nyxoria-game/stilus.html'); await p.waitForTimeout(300);
 const list = await p.evaluate(() => { const M = NYX.monsters, g = {}; for (const [n, s] of Object.entries(M.NAMES)) { const k = (s.kind || M.kindOf(n)) + '|' + (s.variant || '') + (s.horns || '') + (s.moon ? 'moon' : '') + (s.acc || ''); if (!g[k]) g[k] = n; } return Object.entries(g).sort(); });
 const phase = process.argv[2] || '0';
 for (let page = 0; page * 12 < list.length; page++) {
  await p.evaluate(({ chunk, phase }) => {
   document.body.innerHTML = `<style>body{margin:0;background:#1a1f40;display:grid;grid-template-columns:repeat(4,360px);gap:6px;padding:6px} .c{position:relative;width:360px;height:300px;overflow:hidden;background:#2a3060} .c b{position:absolute;left:4px;bottom:2px;color:#fff;font:12px sans-serif;z-index:2;background:#0008} .c svg{position:absolute;width:1100px;height:1100px} .mon *{animation-play-state:paused!important;animation-delay:${phase === '0' ? '0s' : '-1.3s'}!important}</style>` +
    chunk.map(([k, n]) => `<div class="c" data-n="${n}"><b>${k}</b>${NYX.monsters.monster(n, 'holdfeny', { boss: true })}</div>`).join('');
   // a korona köré igazítás
   document.querySelectorAll('.c').forEach(c => { const svg = c.querySelector('svg'); const cr = [...svg.querySelectorAll('path')].filter(q => (q.getAttribute('d') || '').indexOf('L160 8') >= 0).pop(); const r = cr.getBoundingClientRect(), s = svg.getBoundingClientRect(); svg.style.left = (180 - (r.left + r.width / 2 - s.left)) + 'px'; svg.style.top = (150 - (r.top + r.height / 2 - s.top)) + 'px'; });
  }, { chunk: list.slice(page * 12, page * 12 + 12), phase });
  await p.waitForTimeout(200);
  await p.screenshot({ path: `${__dirname}/z${phase}_${page}.png`, fullPage: true });
 }
 await b.close(); })();
