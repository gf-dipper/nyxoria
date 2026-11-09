// a korona animált szülőcsoportjának és a fej (szem) animált szülőcsoportjának képernyő-mátrixa minden pillanatban azonos-e
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 900 } });
 await p.goto('file:///home/claude/nyxoria-game/stilus.html'); await p.waitForTimeout(300);
 console.log(await p.evaluate(() => {
  const M = NYX.monsters, out = [];
  for (const n of Object.keys(M.NAMES)) {
   const h = document.createElement('div'); h.style.cssText = 'position:fixed;left:0;top:0;width:600px;height:600px'; h.innerHTML = M.monster(n, 'holdfeny', { boss: true }); document.body.appendChild(h);
   const svg = h.querySelector('svg'); svg.style.cssText = 'width:600px;height:600px';
   const crown = [...svg.querySelectorAll('path')].filter(q => (q.getAttribute('d') || '').indexOf('L160 8') >= 0).pop();
   const cAnim = crown.closest('.m-body, .m-float');
   let eyes = [...svg.querySelectorAll('.m-eye')]; const kind = svg.getAttribute('class').match(/k-(\w+)/)[1];
   if (kind === 'rider') eyes = eyes.slice(1); if (kind === 'swarm') eyes = eyes.slice(4);
   const hAnim = eyes.length ? eyes[0].parentElement.closest('.m-body, .m-float') : svg.querySelector('.m-fx > .m-body');
   const anims = svg.getAnimations({ subtree: true }); let worst = 0;
   for (const t of [0, 300, 700, 1100, 1500, 1900, 2400, 2900]) {
    anims.forEach(a => { a.pause(); a.currentTime = t; });
    const A = cAnim.getScreenCTM(), B = hAnim.getScreenCTM();
    // ugyanaz a pont a két csoportban
    const pa = [A.a * 150 + A.c * 80 + A.e, A.b * 150 + A.d * 80 + A.f], pb = [B.a * 150 + B.c * 80 + B.e, B.b * 150 + B.d * 80 + B.f];
    worst = Math.max(worst, Math.hypot(pa[0] - pb[0], pa[1] - pb[1]));
   }
   out.push(`${n.padEnd(28)} ${kind.padEnd(8)} ${worst.toFixed(3)}px`); h.remove();
  }
  return out.join('\n');
 }));
 await b.close(); })();
