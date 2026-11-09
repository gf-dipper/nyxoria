/* Nyxoria – harci látványeffektek (vágás, lövedék, villám, gyógyítás, pajzs stb.).
   Egy „színpad” elemre (position:relative) rajzol, Web Animations API-val. */
(function (root) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  // RATE: lejátszási sebesség (a játékban 1×, 2×, 4×). Minden időzítés és animáció ezzel osztva fut.
  let RATE = 1;
  const wait = ms => new Promise(r => setTimeout(r, ms / RATE));

  function layer(stage, x, y, size, html, z) {
    const d = document.createElement('div');
    d.className = 'fx';
    d.style.cssText = `position:absolute;left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;pointer-events:none;z-index:${z || 20}`;
    d.innerHTML = html;
    stage.appendChild(d);
    return d;
  }
  function kill(el, ms) { setTimeout(() => el.remove(), ms / RATE); }
  function anim(el, frames, ms, easing, delay) { return el.animate(frames, { duration: ms / RATE, easing: easing || 'ease-out', fill: 'forwards', delay: (delay || 0) / RATE }); }
  function glowFilter(id, c, s) { return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${s || 4}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`; }
  let FX = 0;

  const E = {
    slash(stage, o) {
      const c = o.color || '#ffffff', id = 'fx' + (++FX), arcs = o.double ? 2 : 1;
      let h = `<svg viewBox="0 0 200 200" width="200" height="200"><defs>${glowFilter(id, c, 5)}</defs>`;
      for (let i = 0; i < arcs; i++) h += `<path class="a${i}" d="${i ? 'M40 40 Q120 70 170 160' : 'M30 150 Q90 60 172 40'}" fill="none" stroke="${c}" stroke-width="${o.big ? 14 : 9}" stroke-linecap="round" filter="url(#${id})" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/>`;
      const el = layer(stage, o.to.x, o.to.y, 200, h + '</svg>');
      el.querySelectorAll('path').forEach((p, i) => { anim(p, [{ strokeDashoffset: 100, opacity: 1 }, { strokeDashoffset: 0, opacity: 1, offset: 0.55 }, { strokeDashoffset: -60, opacity: 0 }], 380, 'cubic-bezier(.2,.8,.3,1)', i * 120); });
      kill(el, 700);
      return wait(220);
    },
    claws(stage, o) {
      const c = o.color || '#ffe8c8', id = 'fx' + (++FX);
      let h = `<svg viewBox="0 0 200 200" width="200" height="200"><defs>${glowFilter(id, c, 4)}</defs>`;
      for (let i = 0; i < 3; i++) h += `<path d="M${50 + i * 26} 40 Q${80 + i * 26} 100 ${70 + i * 26} 170" fill="none" stroke="${c}" stroke-width="${o.big ? 11 : 7}" stroke-linecap="round" filter="url(#${id})" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/>`;
      const el = layer(stage, o.to.x, o.to.y, 200, h + '</svg>');
      el.querySelectorAll('path').forEach((p, i) => anim(p, [{ strokeDashoffset: 100 }, { strokeDashoffset: 0, opacity: 1, offset: 0.5 }, { strokeDashoffset: -40, opacity: 0 }], 360, 'ease-out', i * 50));
      kill(el, 700);
      return wait(200);
    },
    impact(stage, o) {
      const c = o.color || '#ffe2a0', id = 'fx' + (++FX), big = o.big ? 1.5 : 1;
      let rays = '';
      for (let i = 0; i < 10; i++) { const a = i * 36 + (i % 2) * 12; rays += `<line x1="100" y1="100" x2="${100 + Math.cos(a * Math.PI / 180) * 90}" y2="${100 + Math.sin(a * Math.PI / 180) * 90}" stroke="${c}" stroke-width="${i % 2 ? 3 : 5}" stroke-linecap="round" pathLength="100" stroke-dasharray="30 100" stroke-dashoffset="0"/>`; }
      const el = layer(stage, o.to.x, o.to.y, 200 * big, `<svg viewBox="0 0 200 200" width="100%" height="100%"><defs>${glowFilter(id, c, 4)}</defs><g filter="url(#${id})"><circle class="ring" cx="100" cy="100" r="20" fill="none" stroke="${c}" stroke-width="6"/><circle class="core" cx="100" cy="100" r="26" fill="#fff"/><g class="rays">${rays}</g></g></svg>`);
      anim(el.querySelector('.ring'), [{ r: 14, opacity: 1, strokeWidth: 8 }, { r: 80, opacity: 0, strokeWidth: 1 }], 420);
      anim(el.querySelector('.core'), [{ r: 26, opacity: 1 }, { r: 4, opacity: 0 }], 170);
      el.querySelectorAll('line').forEach(l => anim(l, [{ strokeDashoffset: 30 }, { strokeDashoffset: -70, opacity: 0 }], 360));
      kill(el, 600);
      return Promise.resolve();
    },
    projectile(stage, o) {
      const kind = o.kind || 'orb', c = o.color || '#bff7ff', id = 'fx' + (++FX), dur = o.ms || 380;
      let body;
      if (kind === 'arrow') body = `<g filter="url(#${id})"><line x1="6" y1="40" x2="68" y2="40" stroke="#efe4cc" stroke-width="5"/><path d="M66 31 L88 40 L66 49 Z" fill="${c}" stroke="#fff" stroke-width="1"/><path d="M8 32 L22 40 L8 48 L0 48 L10 40 L0 32 Z" fill="${c}"/></g>`;
      else if (kind === 'star') body = `<g filter="url(#${id})"><path d="M40 8 L48 32 L72 34 L52 48 L60 72 L40 58 L20 72 L28 48 L8 34 L32 32 Z" fill="#ffe8a8" stroke="#fff" stroke-width="2"/></g>`;
      else if (kind === 'spirit') body = `<g filter="url(#${id})"><path d="M44 18 C62 18 70 34 66 46 C70 58 58 66 50 62 C46 70 34 70 30 62 C20 64 14 54 20 46 C12 36 24 18 44 18 Z" fill="${c}" opacity="0.9"/><circle cx="38" cy="38" r="3" fill="#123"/><circle cx="50" cy="38" r="3" fill="#123"/></g>`;
      else if (kind === 'note') body = `<g filter="url(#${id})"><path d="M30 60 C20 60 18 50 26 46 C32 43 38 46 38 50 L38 16 L58 12 L58 20 L44 23 L44 56 C44 62 38 64 30 60 Z" fill="${c}"/></g>`;
      else if (kind === 'crescent') body = `<g filter="url(#${id})"><path d="M52 10 C30 14 18 30 20 46 C22 62 38 72 56 70 C40 64 32 52 33 40 C34 28 42 16 52 10 Z" fill="${c}" stroke="#fff" stroke-width="2"/></g>`;
      else if (kind === 'lance') body = `<g filter="url(#${id})"><path d="M2 40 L58 35 L78 40 L58 45 Z" fill="${c}"/><path d="M8 40 L60 38.5 L74 40 L60 41.5 Z" fill="#fff"/></g>`;
      else if (kind === 'shard') body = `<g filter="url(#${id})"><path d="M14 40 L34 22 L66 30 L80 40 L66 52 L32 58 Z" fill="#cff6ff" stroke="#7fd8ff" stroke-width="2.5"/><path d="M34 22 L44 40 L32 58 M44 40 L80 40" fill="none" stroke="#fff" stroke-width="1.6" opacity="0.8"/></g>`;
      else if (kind === 'trapItem') body = `<g><path d="M18 46 C20 30 60 30 62 46 Z" fill="#8a8fa8" stroke="#3a3f58" stroke-width="2"/><path d="M22 44 l5 -8 l5 8 l5 -8 l5 8 l5 -8 l5 8 l5 -8" fill="none" stroke="#e8ecff" stroke-width="2"/><rect x="16" y="45" width="48" height="5" rx="2" fill="#5a5f78"/></g>`;
      else if (kind === 'wolf') body = `<g filter="url(#${id})"><path d="M2 42 C4 36 10 36 14 40 C18 34 24 32 30 33 L46 32 C50 26 53 22 56 16 L59 25 L63 20 L63 29 C69 31 75 35 78 40 L70 43 C66 45 61 45 58 45 L57 49 L58 66 L52 66 L50 51 L33 51 L31 66 L25 66 L24 50 C18 50 14 47 12 44 C8 47 4 47 2 42 Z" fill="${c}" opacity="0.92"/><circle cx="63" cy="35" r="2.4" fill="#1b1238"/></g>`;
      else if (kind === 'bomb') body = `<g><circle cx="40" cy="44" r="12" fill="#2a2440" stroke="#5a4a88" stroke-width="2"/><path d="M44 32 Q48 24 54 22" fill="none" stroke="#c8a46a" stroke-width="2.5"/><circle cx="55" cy="21" r="4" fill="#ffd36a" filter="url(#${id})"/></g>`;
      else body = `<g filter="url(#${id})"><circle cx="40" cy="40" r="15" fill="${c}"/><circle cx="36" cy="36" r="6" fill="#fff"/></g>`;
      const ps = o.size || 80, el = layer(stage, o.from.x, o.from.y, ps, `<svg viewBox="0 0 80 80" width="${ps}" height="${ps}"><defs>${glowFilter(id, c, 5)}</defs>${body}</svg>`, 25);
      const dx = o.to.x - o.from.x, dy = o.to.y - o.from.y, arc = o.arc == null ? -40 : o.arc;
      const rot = kind === 'arrow' || kind === 'lance' || kind === 'shard' ? Math.atan2(dy, dx) * 180 / Math.PI : 0;
      const spin = kind === 'star' ? 540 : kind === 'crescent' ? 720 : kind === 'bomb' ? 360 : 0;
      anim(el, [
        { transform: `translate(0,0) rotate(${rot}deg) scale(0.6)`, opacity: 0.4 },
        { transform: `translate(${dx * 0.5}px,${dy * 0.5 + arc}px) rotate(${rot + spin / 2}deg) scale(1.1)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px,${dy}px) rotate(${rot + spin}deg) scale(1)`, opacity: 1 }
      ], dur, 'cubic-bezier(.4,0,.6,1)');
      // csóva
      for (let i = 1; i <= 4; i++) {
        const t = layer(stage, o.from.x, o.from.y, ps, el.innerHTML, 24);
        t.style.opacity = String(0.5 - i * 0.1);
        anim(t, [{ transform: `translate(0,0) scale(${0.6 - i * 0.08})` }, { transform: `translate(${dx * 0.5}px,${dy * 0.5 + arc}px) scale(${1 - i * 0.15})`, offset: 0.5 }, { transform: `translate(${dx}px,${dy}px) scale(${0.9 - i * 0.15})`, opacity: 0 }], dur, 'cubic-bezier(.4,0,.6,1)', i * 28);
        kill(t, dur + 200);
      }
      kill(el, dur + 40);
      return wait(dur);
    },
    lightning(stage, o) {
      const c = o.color || '#9ff6ff', id = 'fx' + (++FX), x = o.to.x, top = 0, h = o.to.y + 40;
      let d = `M${60} 0`;
      for (let i = 1; i <= 8; i++) d += ` L${60 + (Math.random() - 0.5) * 50} ${(h / 8) * i}`;
      const el = layer(stage, x, h / 2 + top, Math.max(120, h), `<svg viewBox="0 0 120 ${h}" width="120" height="${h}" style="position:absolute;left:50%;top:0;transform:translateX(-50%)"><defs>${glowFilter(id, c, 6)}</defs><path d="${d}" fill="none" stroke="${c}" stroke-width="7" filter="url(#${id})" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></svg>`, 26);
      anim(el, [{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 0.2, offset: 0.3 }, { opacity: 1, offset: 0.45 }, { opacity: 0 }], 420, 'linear');
      kill(el, 500);
      E.flash(stage, { color: 'rgba(190,250,255,0.35)' });
      return wait(160).then(() => E.impact(stage, { to: o.to, color: c }));
    },
    frost(stage, o) {
      const id = 'fx' + (++FX);
      let shards = '';
      for (let i = 0; i < 8; i++) { const a = i * 45; shards += `<path transform="rotate(${a} 100 100)" d="M100 100 L92 60 L100 20 L108 60 Z" fill="#cff6ff" stroke="#7fd8ff" stroke-width="2"/>`; }
      const el = layer(stage, o.to.x, o.to.y, 200, `<svg viewBox="0 0 200 200" width="200" height="200"><defs>${glowFilter(id, '#9ff', 4)}</defs><g class="s" filter="url(#${id})" style="transform-origin:100px 100px">${shards}</g><circle class="r" cx="100" cy="100" r="30" fill="none" stroke="#bff" stroke-width="4"/></svg>`);
      anim(el.querySelector('.s'), [{ transform: 'scale(0.2) rotate(0deg)', opacity: 1 }, { transform: 'scale(1) rotate(25deg)', opacity: 1, offset: 0.5 }, { transform: 'scale(1.1) rotate(30deg)', opacity: 0 }], 650);
      anim(el.querySelector('.r'), [{ r: 10, opacity: 1 }, { r: 90, opacity: 0 }], 500);
      kill(el, 800);
      return wait(220);
    },
    heal(stage, o) {
      const id = 'fx' + (++FX), c = o.color || '#7dffb4';
      let sp = '';
      for (let i = 0; i < 12; i++) sp += `<g class="p" style="transform:translate(${20 + Math.random() * 160}px,${120 + Math.random() * 60}px)"><path d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2 Z" fill="${i % 3 ? c : '#fff'}"/></g>`;
      const el = layer(stage, o.at.x, o.at.y, 220, `<svg viewBox="0 0 200 200" width="220" height="220"><defs>${glowFilter(id, c, 3)}</defs><ellipse class="ring" cx="100" cy="170" rx="70" ry="16" fill="none" stroke="${c}" stroke-width="4" filter="url(#${id})"/><g filter="url(#${id})">${sp}</g><rect class="col" x="40" y="0" width="120" height="180" fill="url(#${id}g)"/><defs><linearGradient id="${id}g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${c}" stop-opacity="0.45"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs></svg>`, 18);
      anim(el.querySelector('.ring'), [{ rx: 20, ry: 4, opacity: 1 }, { rx: 90, ry: 22, opacity: 0 }], 800);
      anim(el.querySelector('.col'), [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }], 900);
      el.querySelectorAll('.p').forEach((p, i) => { const t = p.style.transform; anim(p, [{ transform: t, opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: t.replace(/,(\d+\.?\d*)px\)/, (m, y) => `,${y - 120}px)`), opacity: 0 }], 900 + i * 30, 'ease-out', i * 40); });
      kill(el, 1400);
      return wait(300);
    },
    shield(stage, o) {
      // Varázsbuborék az EGÉSZ alak körül: talpgyűrűből felnövő, tojás alakú burok, a peremén erősebb
      // fénnyel (mint egy szappanbuborék), benne halvány méhsejtmintával, végigfutó csillanással;
      // a végén szétpattan. o.box: a hős dobozának közepe és mérete (ha nincs, kisebb alapméret).
      const id = 'fx' + (++FX), c = o.color || '#9fd8ff';
      const b = o.box || { x: o.at.x, y: o.at.y, w: 200, h: 280 };
      // a buborék bőven nagyobb az alaknál (oldalt 40%, függőlegesen 20% ráhagyás), hogy a fej és a vállak magasságában is minden beleférjen
      const rx = b.w * 0.5 * 1.4 + 10, ry = b.h * 0.5 * 1.2 + 10, W = Math.round(rx * 2 + 24), H = Math.round(ry * 2 + 24), cx = W / 2, cy = H / 2;
      const d = document.createElement('div');
      d.className = 'fx';
      d.style.cssText = `position:absolute;left:${b.x - W / 2}px;top:${b.y - H / 2}px;width:${W}px;height:${H}px;pointer-events:none;z-index:22;transform-origin:50% 92%`;
      const hs = 16, hh = hs * Math.sqrt(3);
      const hex = (x, y) => { let p = ''; for (let k = 0; k < 6; k++) { const a = Math.PI / 3 * k; p += (k ? 'L' : 'M') + (x + Math.cos(a) * hs * 0.92).toFixed(1) + ' ' + (y + Math.sin(a) * hs * 0.92).toFixed(1); } return p + 'Z'; };
      const shards = [];
      for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; shards.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, a]); }
      d.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" overflow="visible"><defs>${glowFilter(id, c, 6)}
        <radialGradient id="${id}r" cx="0.5" cy="0.5" r="0.5"><stop offset="0.62" stop-color="${c}" stop-opacity="0.04"/><stop offset="0.9" stop-color="${c}" stop-opacity="0.28"/><stop offset="1" stop-color="${c}" stop-opacity="0.6"/></radialGradient>
        <pattern id="${id}p" width="${hs * 3}" height="${hh.toFixed(2)}" patternUnits="userSpaceOnUse"><path d="${hex(hs, hh / 2)} ${hex(hs * 2.5, 0)} ${hex(hs * 2.5, hh)}" fill="none" stroke="${c}" stroke-width="1.2"/></pattern>
        <clipPath id="${id}c"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath>
        <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
        <ellipse class="base" cx="${cx}" cy="${(cy + b.h / 2).toFixed(1)}" rx="${(rx * 0.95).toFixed(1)}" ry="${(rx * 0.2).toFixed(1)}" fill="none" stroke="${c}" stroke-width="3" filter="url(#${id})"/>
        <g class="bub">
          <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id}r)"/>
          <g clip-path="url(#${id}c)"><rect class="hexes" x="0" y="0" width="${W}" height="${H}" fill="url(#${id}p)" opacity="0.35"/>
            <rect class="sweep" x="${-W}" y="0" width="${W * 0.5}" height="${H}" fill="url(#${id}s)" transform="skewX(-18)"/></g>
          <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${c}" stroke-width="3" filter="url(#${id})"/>
          <path d="M${(cx - rx * 0.62).toFixed(1)} ${(cy - ry * 0.55).toFixed(1)} Q${(cx - rx * 0.2).toFixed(1)} ${(cy - ry * 0.98).toFixed(1)} ${(cx + rx * 0.3).toFixed(1)} ${(cy - ry * 0.9).toFixed(1)}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.75"/>
          <path d="M${(cx - rx * 0.86).toFixed(1)} ${(cy - ry * 0.1).toFixed(1)} Q${(cx - rx * 0.9).toFixed(1)} ${(cy + ry * 0.25).toFixed(1)} ${(cx - rx * 0.75).toFixed(1)} ${(cy + ry * 0.5).toFixed(1)}" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity="0.45"/>
        </g>
        <g class="shards" opacity="0">${shards.map(([x, y, a]) => `<path data-a="${a.toFixed(3)}" d="M${x.toFixed(1)} ${y.toFixed(1)} l${(Math.cos(a + 1.8) * 9).toFixed(1)} ${(Math.sin(a + 1.8) * 9).toFixed(1)} l${(Math.cos(a) * 12).toFixed(1)} ${(Math.sin(a) * 12).toFixed(1)} Z" fill="${c}" stroke="#fff" stroke-width="0.8"/>`).join('')}</g>
      </svg>`;
      stage.appendChild(d);
      const T = 1900;
      anim(d.querySelector('.base'), [{ transform: 'scale(0.2)', transformOrigin: `${cx}px ${(cy + b.h / 2).toFixed(1)}px`, opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.12 }, { opacity: 0.8, offset: 0.8 }, { opacity: 0 }], T);
      const bub = d.querySelector('.bub');
      anim(bub, [{ transform: 'scale(0.6, 0.05)', transformOrigin: `${cx}px ${(cy + ry).toFixed(1)}px`, opacity: 0 }, { transform: 'scale(1.04, 1.04)', opacity: 1, offset: 0.16 }, { transform: 'scale(1, 1)', opacity: 1, offset: 0.24 },
        { transform: 'scale(1.015, 0.99)', opacity: 0.95, offset: 0.5 }, { transform: 'scale(1, 1)', opacity: 1, offset: 0.78 }, { transform: 'scale(1.08, 1.08)', opacity: 0 }], T, 'ease-out');
      anim(d.querySelector('.hexes'), [{ opacity: 0.6 }, { opacity: 0.15, offset: 0.4 }, { opacity: 0.45, offset: 0.7 }, { opacity: 0.2 }], T);
      anim(d.querySelector('.sweep'), [{ transform: 'skewX(-18deg) translateX(0)' }, { transform: `skewX(-18deg) translateX(${W * 2.2}px)` }], 1100, 'ease-in-out', 300);
      const sh = d.querySelector('.shards');
      anim(sh, [{ opacity: 0 }, { opacity: 0, offset: 0.8 }, { opacity: 1, offset: 0.82 }, { opacity: 0 }], T);
      sh.querySelectorAll('path').forEach(p => { const a = +p.dataset.a; anim(p, [{ transform: 'translate(0,0)' }, { transform: 'translate(0,0)', offset: 0.8 }, { transform: `translate(${(Math.cos(a) * 40).toFixed(0)}px,${(Math.sin(a) * 40).toFixed(0)}px)` }], T, 'ease-out'); });
      kill(d, T + 100);
      return wait(450);
    },
    buff(stage, o) {
      const id = 'fx' + (++FX), c = o.color || '#ffd36a';
      let ch = '';
      for (let i = 0; i < 6; i++) ch += `<path class="c" d="M${30 + i * 28} ${150 + (i % 2) * 20} l12 -12 l12 12" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
      const el = layer(stage, o.at.x, o.at.y, 220, `<svg viewBox="0 0 200 200" width="220" height="220"><defs>${glowFilter(id, c, 4)}</defs><g filter="url(#${id})">${ch}<ellipse class="ring" cx="100" cy="170" rx="60" ry="14" fill="none" stroke="${c}" stroke-width="4"/></g></svg>`, 18);
      el.querySelectorAll('.c').forEach((p, i) => anim(p, [{ transform: 'translateY(0)', opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: 'translateY(-130px)', opacity: 0 }], 900, 'ease-out', i * 60));
      anim(el.querySelector('.ring'), [{ rx: 20, ry: 4, opacity: 1 }, { rx: 90, ry: 22, opacity: 0 }], 700);
      kill(el, 1400);
      return wait(300);
    },
    poison(stage, o) {
      const id = 'fx' + (++FX), c = o.color || '#7dff7a';
      let b = '';
      for (let i = 0; i < 10; i++) b += `<circle class="b" cx="${50 + Math.random() * 100}" cy="${120 + Math.random() * 50}" r="${4 + Math.random() * 7}" fill="${c}" fill-opacity="0.55" stroke="${c}" stroke-width="2"/>`;
      const el = layer(stage, o.to.x, o.to.y, 200, `<svg viewBox="0 0 200 200" width="200" height="200"><defs>${glowFilter(id, c, 3)}</defs><g filter="url(#${id})">${b}</g></svg>`);
      el.querySelectorAll('.b').forEach((p, i) => anim(p, [{ transform: 'translateY(0) scale(0.4)', opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: 'translateY(-90px) scale(1.3)', opacity: 0 }], 900, 'ease-out', i * 50));
      kill(el, 1500);
      return wait(200);
    },
    stun(stage, o) {
      const el = layer(stage, o.to.x, o.to.y, 160, `<svg viewBox="0 0 160 80" width="160" height="80"><g class="o" style="transform-origin:80px 40px">${[0, 120, 240].map(a => `<g transform="rotate(${a} 80 40) translate(50 0)"><path d="M80 30 L83 37 L90 38 L85 43 L86 50 L80 46 L74 50 L75 43 L70 38 L77 37 Z" fill="#ffe28a" stroke="#c4702a" stroke-width="1"/></g>`).join('')}</g></svg>`);
      anim(el.querySelector('.o'), [{ transform: 'scaleY(0.4) rotate(0deg)', opacity: 0 }, { opacity: 1, offset: 0.15 }, { transform: 'scaleY(0.4) rotate(720deg)', opacity: 0 }], 1200, 'linear');
      kill(el, 1300);
      return wait(200);
    },
    smoke(stage, o) {
      let p = '';
      for (let i = 0; i < 9; i++) p += `<circle class="s" cx="${50 + Math.random() * 100}" cy="${80 + Math.random() * 80}" r="${18 + Math.random() * 16}" fill="#8a86a8" fill-opacity="0.6"/>`;
      const el = layer(stage, o.at.x, o.at.y, 220, `<svg viewBox="0 0 200 200" width="220" height="220">${p}</svg>`, 30);
      el.querySelectorAll('.s').forEach((c, i) => anim(c, [{ transform: 'scale(0.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 0.9, offset: 0.3 }, { transform: 'scale(1.6)', opacity: 0 }], 1000, 'ease-out', i * 30));
      kill(el, 1400);
      return wait(250);
    },
    transform(stage, o) {
      const c = o.color || '#c8ffb0';
      const el = layer(stage, o.at.x, o.at.y, 260, `<svg viewBox="0 0 200 200" width="260" height="260"><circle cx="100" cy="100" r="40" fill="${c}"/></svg>`, 30);
      anim(el, [{ transform: 'scale(0.3)', opacity: 0.9, filter: 'blur(2px)' }, { transform: 'scale(1.6)', opacity: 0, filter: 'blur(10px)' }], 600);
      kill(el, 700);
      return E.buff(stage, { at: o.at, color: c });
    },
    roots(stage, o) {
      const id = 'fx' + (++FX);
      let v = '';
      for (let i = 0; i < 5; i++) v += `<path class="v" d="M${40 + i * 30} 200 C${30 + i * 30} 150 ${70 + i * 28} 120 ${50 + i * 30} 70" fill="none" stroke="#5fd36a" stroke-width="8" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/>`;
      const el = layer(stage, o.to.x, o.to.y, 200, `<svg viewBox="0 0 200 200" width="200" height="200"><defs>${glowFilter(id, '#5fd36a', 3)}</defs><g filter="url(#${id})">${v}</g></svg>`);
      el.querySelectorAll('.v').forEach((p, i) => anim(p, [{ strokeDashoffset: 100 }, { strokeDashoffset: 0, offset: 0.4 }, { strokeDashoffset: 0, opacity: 1, offset: 0.8 }, { opacity: 0 }], 1200, 'ease-out', i * 60));
      kill(el, 1500);
      return wait(300);
    },
    shockwave(stage, o) {
      const c = o.color || '#ff6a8a', id = 'fx' + (++FX);
      const el = layer(stage, o.at.x, o.at.y, 420, `<svg viewBox="0 0 200 200" width="420" height="420"><defs>${glowFilter(id, c, 4)}</defs><ellipse class="r" cx="100" cy="100" rx="20" ry="6" fill="none" stroke="${c}" stroke-width="6" filter="url(#${id})"/><ellipse class="r2" cx="100" cy="100" rx="10" ry="3" fill="none" stroke="#fff" stroke-width="3"/></svg>`, 15);
      anim(el.querySelector('.r'), [{ rx: 10, ry: 3, opacity: 1 }, { rx: 100, ry: 30, opacity: 0 }], 600);
      anim(el.querySelector('.r2'), [{ rx: 6, ry: 2, opacity: 1 }, { rx: 80, ry: 24, opacity: 0 }], 500, 'ease-out', 80);
      kill(el, 800);
      E.shake(stage, 10);
      return wait(200);
    },
    levelup(stage, o) {
      const id = 'fx' + (++FX), c = '#ffe2a0';
      const el = layer(stage, o.at.x, o.at.y - 60, 300, `<svg viewBox="0 0 200 300" width="200" height="300" style="position:absolute;left:50px;top:0"><defs>${glowFilter(id, c, 8)}<linearGradient id="${id}g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${c}" stop-opacity="0.8"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><rect class="p" x="60" y="0" width="80" height="300" fill="url(#${id}g)" filter="url(#${id})"/></svg>`, 12);
      anim(el.querySelector('.p'), [{ transform: 'scaleX(0)', opacity: 0, transformOrigin: '100px 300px' }, { transform: 'scaleX(1.2)', opacity: 1, offset: 0.3 }, { transform: 'scaleX(0.8)', opacity: 0 }], 1600, 'ease-out');
      kill(el, 1700);
      return E.buff(stage, { at: o.at, color: c });
    },
    flash(stage, o) {
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;inset:0;background:${(o && o.color) || 'rgba(255,255,255,0.4)'};pointer-events:none;z-index:40;mix-blend-mode:screen`;
      stage.appendChild(d);
      anim(d, [{ opacity: 1 }, { opacity: 0 }], 260);
      kill(d, 300);
      return Promise.resolve();
    },
    // nagy, gomolygó füstfelhő (füstbomba): sok, egymásra rakódó pamacs, lassan oszlik
    smokeBomb(stage, o) {
      const sz = o.size || 380;
      let p = '';
      for (let i = 0; i < 22; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * 62; p += `<circle class="s" cx="${(100 + Math.cos(a) * r).toFixed(1)}" cy="${(112 + Math.sin(a) * r * 0.75).toFixed(1)}" r="${(20 + Math.random() * 22).toFixed(1)}" fill="${i % 3 ? '#7a7698' : '#a29ec0'}" fill-opacity="0.82"/>`; }
      const el = layer(stage, o.at.x, o.at.y, sz, `<svg viewBox="0 0 200 200" width="${sz}" height="${sz}" overflow="visible">${p}<circle class="fl" cx="100" cy="120" r="24" fill="#fff6d0"/></svg>`, 30);
      anim(el.querySelector('.fl'), [{ r: 6, opacity: 1 }, { r: 60, opacity: 0 }], 260);
      el.querySelectorAll('.s').forEach((c, i) => { const dx = (Math.random() - 0.5) * 50, dy = -10 - Math.random() * 30; anim(c, [{ transform: 'translate(0,0) scale(0.15)', opacity: 0 }, { transform: 'translate(0,0) scale(1)', opacity: 0.95, offset: 0.18 }, { transform: `translate(${dx * 0.4}px,${dy * 0.4}px) scale(1.15)`, opacity: 0.9, offset: 0.6 }, { transform: `translate(${dx}px,${dy}px) scale(1.5)`, opacity: 0 }], 1700 + Math.random() * 400, 'ease-out', i * 12); });
      kill(el, 2300);
      return wait(260);
    },
    // célkereszt, ami a célpontra szűkül (célzott lövés)
    reticle(stage, o) {
      const c = o.color || '#ffe28a', id = 'fx' + (++FX), ms = o.ms || 700;
      const el = layer(stage, o.to.x, o.to.y, 160, `<svg viewBox="0 0 160 160" width="160" height="160"><defs>${glowFilter(id, c, 3)}</defs><g filter="url(#${id})" fill="none" stroke="${c}" stroke-width="3"><circle class="o" cx="80" cy="80" r="50"/><circle cx="80" cy="80" r="4" fill="${c}"/><path d="M80 14 L80 44 M80 116 L80 146 M14 80 L44 80 M116 80 L146 80"/></g></svg>`, 28);
      anim(el, [{ transform: 'scale(2) rotate(-90deg)', opacity: 0 }, { transform: 'scale(1) rotate(0deg)', opacity: 1, offset: 0.55 }, { transform: 'scale(0.85)', opacity: 1, offset: 0.9 }, { transform: 'scale(0.6)', opacity: 0 }], ms, 'cubic-bezier(.3,.7,.3,1)');
      kill(el, ms + 50);
      return wait(ms * 0.9);
    },
    // táguló hanghullám-gyűrűk (harci kiáltás): csak körvonal, hogy ne takarja el az arcot
    rings(stage, o) {
      const c = o.color || '#ffb36a', id = 'fx' + (++FX);
      const el = layer(stage, o.at.x, o.at.y, 320, `<svg viewBox="0 0 200 200" width="320" height="320"><defs>${glowFilter(id, c, 3)}</defs><g filter="url(#${id})" fill="none" stroke="${c}">${[0, 1, 2].map(i => `<circle class="w" cx="100" cy="100" r="20" stroke-width="${5 - i}"/>`).join('')}</g></svg>`, 24);
      const r0 = o.r0 || 22; el.querySelectorAll('.w').forEach((w, i) => anim(w, [{ r: r0, opacity: 0.95 }, { r: 98, opacity: 0 }], 650, 'ease-out', i * 150));
      kill(el, 1200);
      return wait(200);
    },
    // megidézett lény (szellem vagy szellemfarkas), ami egy ideig a helyén lebeg
    ghost(stage, o) {
      const c = o.color || '#bff6ff', id = 'fx' + (++FX), sz = o.size || 150;
      const body = o.kind === 'wolf'
        ? `<path d="M2 42 C4 36 10 36 14 40 C18 34 24 32 30 33 L46 32 C50 26 53 22 56 16 L59 25 L63 20 L63 29 C69 31 75 35 78 40 L70 43 C66 45 61 45 58 45 L57 49 L58 66 L52 66 L50 51 L33 51 L31 66 L25 66 L24 50 C18 50 14 47 12 44 C8 47 4 47 2 42 Z" fill="${c}" opacity="0.85"/><circle cx="63" cy="35" r="2.4" fill="#1b1238"/>`
        : `<path d="M40 8 C58 8 66 24 64 40 C66 52 60 64 52 70 C48 64 44 72 40 66 C36 72 32 64 28 70 C20 64 14 52 16 40 C14 24 22 8 40 8 Z" fill="${c}" opacity="0.8"/><circle cx="33" cy="32" r="3.4" fill="#1b1238"/><circle cx="47" cy="32" r="3.4" fill="#1b1238"/><path d="M34 44 C38 47 42 47 46 44" fill="none" stroke="#1b1238" stroke-width="2"/>`;
      const el = layer(stage, o.at.x, o.at.y, sz, `<svg viewBox="0 0 80 80" width="${sz}" height="${sz}"><defs>${glowFilter(id, c, 5)}</defs><g filter="url(#${id})">${body}</g></svg>`, o.z || 23);
      const ms = o.ms || 1200;
      anim(el, [{ transform: 'translateY(20px) scale(0.3)', opacity: 0 }, { transform: 'translateY(0) scale(1.05)', opacity: 1, offset: 0.2 }, { transform: 'translateY(-6px) scale(1)', opacity: 1, offset: 0.8 }, { transform: 'translateY(-10px) scale(0.9)', opacity: 0 }], ms, 'ease-out');
      kill(el, ms + 50);
      return wait(200);
    },
    // vascsapda, ami összecsapódik az ellenfél lábánál
    trap(stage, o) {
      const id = 'fx' + (++FX);
      const teeth = n => { let d = ''; for (let i = 0; i < 7; i++) { const x = 32 + i * 12; d += `M${x} ${n} L${x + 6} ${n + (n > 60 ? -12 : 12)} L${x + 12} ${n}`; } return d; };
      const el = layer(stage, o.to.x, o.to.y, 340, `<svg viewBox="0 0 160 120" width="340" height="255"><defs>${glowFilter(id, '#cfd6ea', 2)}</defs><ellipse cx="80" cy="96" rx="62" ry="12" fill="#000" opacity="0.35"/>
        <g class="jl" style="transform-origin:80px 90px"><path d="M28 90 C30 62 130 62 132 90" fill="none" stroke="#8a8fa8" stroke-width="6"/><path d="${teeth(66)}" fill="#cfd6ea" stroke="#5a5f78" stroke-width="1"/></g>
        <g class="jr" style="transform-origin:80px 90px"><path d="M28 90 C30 118 130 118 132 90" fill="none" stroke="#8a8fa8" stroke-width="6"/><path d="${teeth(114)}" fill="#cfd6ea" stroke="#5a5f78" stroke-width="1"/></g>
        <circle cx="80" cy="90" r="8" fill="#5a5f78" stroke="#cfd6ea" stroke-width="2"/></svg>`, 21);
      anim(el.querySelector('.jl'), [{ transform: 'scaleY(1.6) translateY(-18px)' }, { transform: 'scaleY(1.6) translateY(-18px)', offset: 0.35 }, { transform: 'scaleY(0.3)', offset: 0.45 }, { transform: 'scaleY(0.4)', offset: 0.8 }, { transform: 'scaleY(0.4)', opacity: 0 }], 1300, 'linear');
      anim(el.querySelector('.jr'), [{ transform: 'scaleY(1.6) translateY(18px)' }, { transform: 'scaleY(1.6) translateY(18px)', offset: 0.35 }, { transform: 'scaleY(0.3)', offset: 0.45 }, { transform: 'scaleY(0.4)', offset: 0.8 }, { transform: 'scaleY(0.4)', opacity: 0 }], 1300, 'linear');
      anim(el, [{ opacity: 0, transform: 'translateY(-14px)' }, { opacity: 1, transform: 'translateY(0)', offset: 0.2 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], 1300);
      kill(el, 1400);
      return wait(620).then(() => { E.impact(stage, { to: o.to, color: '#cfd6ea' }); E.shake(stage, 6); });
    },
    // altatódal: lebegő „Z”-k az ellenfél feje fölött
    sleep(stage, o) {
      const el = layer(stage, o.to.x, o.to.y, 200, `<svg viewBox="0 0 200 200" width="200" height="200">${[0, 1, 2].map(i => `<text class="z" x="${80 + i * 22}" y="${140 - i * 20}" font-size="${46 + i * 16}" font-weight="900" fill="#e4ecff" stroke="#1b2460" stroke-width="4" paint-order="stroke" font-family="Georgia,serif">Z</text>`).join('')}</svg>`, 28);
      el.querySelectorAll('.z').forEach((z, i) => anim(z, [{ transform: 'translate(0,10px)', opacity: 0 }, { opacity: 1, offset: 0.25 }, { transform: 'translate(14px,-40px)', opacity: 0 }], 1300, 'ease-out', i * 220));
      kill(el, 2000);
      return wait(300);
    },
    // por a talp alatt (rohamnál, ugrásnál)
    dust(stage, o) {
      let p = '';
      for (let i = 0; i < 8; i++) p += `<ellipse class="d" cx="${60 + Math.random() * 80}" cy="${150 + Math.random() * 20}" rx="${12 + Math.random() * 12}" ry="${8 + Math.random() * 6}" fill="#a89a88" fill-opacity="0.65"/>`;
      const el = layer(stage, o.at.x, o.at.y - 60, 200, `<svg viewBox="0 0 200 200" width="200" height="200">${p}</svg>`, 14);
      el.querySelectorAll('.d').forEach((d, i) => { const dir = o.dir || -1; anim(d, [{ transform: 'translate(0,0) scale(0.3)', opacity: 0 }, { transform: 'translate(0,0) scale(1)', opacity: 0.85, offset: 0.25 }, { transform: `translate(${dir * (20 + Math.random() * 40)}px,-${10 + Math.random() * 20}px) scale(1.6)`, opacity: 0 }], 800, 'ease-out', i * 25); });
      kill(el, 1100);
      return Promise.resolve();
    },
    // sebességcsíkok és árnyékmásolatok egy vonal mentén (árnyékdöfés, roham)
    trail(stage, o) {
      const c = o.color || '#c8a8ff', dx = o.to.x - o.from.x, dy = o.to.y - o.from.y, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) * 180 / Math.PI;
      const d = document.createElement('div');
      d.className = 'fx';
      d.style.cssText = `position:absolute;left:${o.from.x}px;top:${o.from.y}px;width:${len}px;height:120px;margin-top:-60px;transform-origin:0 50%;transform:rotate(${ang}deg);pointer-events:none;z-index:${o.z || 19}`;
      let l = '';
      for (let i = 0; i < 7; i++) { const y = 20 + i * 13 + Math.random() * 6; l += `<line class="l" x1="0" y1="${y}" x2="${len}" y2="${y}" stroke="${c}" stroke-width="${2 + (i % 3)}" stroke-linecap="round" pathLength="100" stroke-dasharray="40 100" stroke-dashoffset="40" opacity="0.8"/>`; }
      d.innerHTML = `<svg width="${len}" height="120" viewBox="0 0 ${len} 120" overflow="visible">${l}</svg>`;
      stage.appendChild(d);
      d.querySelectorAll('.l').forEach((x, i) => anim(x, [{ strokeDashoffset: 40, opacity: 0.9 }, { strokeDashoffset: -100, opacity: 0 }], 360, 'ease-in', i * 18));
      kill(d, 600);
      return Promise.resolve();
    },
    // fényoszlop (áldás, holdfény-újjászületés, ima)
    pillar(stage, o) {
      const id = 'fx' + (++FX), c = o.color || '#fff2b0', h = o.h || 380, pw = o.w || 76;
      const el = layer(stage, o.at.x, o.at.y - h / 2 + 60, h, `<svg viewBox="0 0 200 ${h}" width="${h}" height="${h}" preserveAspectRatio="xMidYMax meet"><defs>${glowFilter(id, c, 8)}<linearGradient id="${id}g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${c}" stop-opacity="0.75"/><stop offset="0.7" stop-color="${c}" stop-opacity="0.3"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><linearGradient id="${id}h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.3" stop-color="#fff" stop-opacity="1"/><stop offset="0.7" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="${id}m"><rect x="${100 - pw / 2}" y="0" width="${pw}" height="${h}" fill="url(#${id}h)"/></mask><rect class="p" x="${100 - pw / 2}" y="0" width="${pw}" height="${h}" rx="${pw / 2}" fill="url(#${id}g)" mask="url(#${id}m)"/><ellipse class="g" cx="100" cy="${h - 14}" rx="70" ry="14" fill="none" stroke="${c}" stroke-width="4" filter="url(#${id})"/></svg>`, 4);
      anim(el.querySelector('.p'), [{ transform: 'scaleX(0)', opacity: 0, transformOrigin: `100px ${h}px` }, { transform: 'scaleX(1.15)', opacity: 1, offset: 0.25 }, { transform: 'scaleX(1)', opacity: 0.9, offset: 0.6 }, { transform: 'scaleX(0.6)', opacity: 0 }], o.ms || 1400, 'ease-out');
      anim(el.querySelector('.g'), [{ rx: 10, ry: 2, opacity: 1 }, { rx: 90, ry: 18, opacity: 0 }], 900);
      kill(el, (o.ms || 1400) + 100);
      return wait(350);
    },
    // vízszintes villám a kézből a célpontig, majd tovább ugrik (láncvillám)
    arcBolt(stage, o) {
      const c = o.color || '#9ff6ff', id = 'fx' + (++FX), dx = o.to.x - o.from.x, dy = o.to.y - o.from.y, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) * 180 / Math.PI;
      let p = 'M0 40';
      for (let i = 1; i < 10; i++) p += ` L${(len / 10 * i).toFixed(1)} ${(40 + (Math.random() - 0.5) * 34).toFixed(1)}`;
      p += ` L${len.toFixed(1)} 40`;
      const d = document.createElement('div');
      d.className = 'fx';
      d.style.cssText = `position:absolute;left:${o.from.x}px;top:${o.from.y}px;width:${len}px;height:80px;margin-top:-40px;transform-origin:0 50%;transform:rotate(${ang}deg);pointer-events:none;z-index:26`;
      d.innerHTML = `<svg width="${len}" height="80" viewBox="0 0 ${len} 80" overflow="visible"><defs>${glowFilter(id, c, 5)}</defs><path d="${p}" fill="none" stroke="${c}" stroke-width="6" stroke-linejoin="round" filter="url(#${id})"/><path d="${p}" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/></svg>`;
      stage.appendChild(d);
      anim(d, [{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 0.3, offset: 0.35 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], 380, 'linear');
      kill(d, 450);
      E.flash(stage, { color: 'rgba(190,250,255,0.28)' });
      return wait(150).then(() => E.impact(stage, { to: o.to, color: c }));
    },
    shake(stage, p) {
      p = p || 8;
      stage.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${-p}px,${p / 2}px)` }, { transform: `translate(${p}px,${-p / 2}px)` }, { transform: `translate(${-p / 2}px,${p / 3}px)` }, { transform: 'translate(0,0)' }], { duration: 320 / RATE, easing: 'ease-out' });
      return Promise.resolve();
    }
  };

  function number(stage, x, y, text, kind) {
    const d = document.createElement('div');
    d.className = 'dmg dmg-' + (kind || 'hit');
    d.textContent = text;
    d.style.cssText = `position:absolute;left:${x}px;top:${y}px;z-index:45;pointer-events:none`;
    stage.appendChild(d);
    const big = kind === 'crit';
    anim(d, [{ transform: 'translate(-50%,-50%) scale(0.3)', opacity: 0 }, { transform: `translate(-50%,-90%) scale(${big ? 1.5 : 1.15})`, opacity: 1, offset: 0.18 }, { transform: 'translate(-50%,-140%) scale(1)', opacity: 1, offset: 0.6 }, { transform: 'translate(-50%,-190%) scale(0.9)', opacity: 0 }], big ? 1300 : 1000, 'cubic-bezier(.2,.9,.3,1)');
    kill(d, 1400);
  }
  function banner(stage, text, kind, iconHtml) {
    const d = document.createElement('div');
    d.className = 'fx-banner fx-banner-' + (kind || 'skill') + (iconHtml ? ' has-ic' : '');
    d.textContent = text;
    if (iconHtml) { const ic = document.createElement('span'); ic.className = 'fx-banner-ic'; ic.innerHTML = iconHtml; d.prepend(ic); }
    stage.appendChild(d);
    anim(d, [{ transform: 'translate(-50%,0) scale(0.6)', opacity: 0 }, { transform: 'translate(-50%,0) scale(1.05)', opacity: 1, offset: 0.15 }, { transform: 'translate(-50%,0) scale(1)', opacity: 1, offset: 0.75 }, { transform: 'translate(-50%,-10px) scale(1)', opacity: 0 }], 1200, 'ease-out');
    kill(d, 1300);
  }

  // Melyik képességhez melyik látvány tartozik
  // Melyik képességhez milyen mozdulat (a hős animációja), milyen látvány, és hány ms-mal a mozdulat indulása után induljon a látvány
  const SKILL_FX = {
    kardcsapas: ['attack', 'slash1', 280], lenduletes_roham: ['charge', 'charge', 0], pajzscsapas: ['bash', 'impactStun', 0], harci_kialtas: ['roar', 'roar', 0], kitarto_allas: ['guard', 'guard', 220],
    ijlovesz: ['shoot', 'arrow', 490], celzott_loves: ['aim', 'aimed', 0], kettos_loves: ['shoot2', 'arrow2x', 0], csapda: ['toss', 'trap', 0], kitero_ugras: ['leap', 'leapShot', 0],
    holdnyil: ['point', 'crescent', 350], csillagszilank: ['skycall', 'starRain', 400], fagyrog: ['push', 'frost', 400], magikus_pajzs: ['ward', 'shieldOrb', 0], lancvillam: ['zap', 'chain', 380],
    fenyszuras: ['thrust', 'lance', 340], gyogyito_feny: ['pray', 'healOrb', 420], aldas: ['bless', 'bless', 440], holdfeny_pajzs: ['shelter', 'shieldMoon', 0], tisztito_ima: ['kneel', 'purify', 380],
    tordofes: ['jab', 'slashPurple', 180], arnyekdofes: ['dash', 'shadowDash', 0], fustbomba: ['throw', 'smokeBomb', 0], meregpenge: ['attack', 'poisonSlash', 280], hatbaszuras: ['backstab', 'backstab', 0],
    szellemcsapas: ['point', 'spirit', 350], lelekrobbanas: ['push', 'spiritBurst', 400], vedoszellem: ['ward', 'guardian', 0], falka: ['sweep', 'pack', 0], lelekcsere: ['clench', 'soulSwap', 0],
    lantutes: ['attack', 'noteHit', 280], altatodal: ['lull', 'lullaby', 250], harci_indulo: ['march', 'buffNotes', 250], gunydal: ['taunt', 'notesRed', 250], hosenek: ['anthem', 'healNotes', 250],
    karmos_csapas: ['attack', 'claws', 280], medveforma: ['maul', 'bear', 0], farkasforma: ['pounce', 'wolf', 0], gyokerfonat: ['slam', 'rootsStun', 470], holdfeny_ujjaszuletes: ['pray', 'rebirth', 420]
  };
  // ezek a mozdulatok odaviszik a hőst az ellenfélhez (a harcmező ehhez állítja be a távolságot és a rétegsorrendet)
  // az érintkezés pillanata (ms a mozdulat elejétől) – ekkor villan a találat
  const CONTACT = { attack: 420, jab: 315, bash: 340 };
  const TRAVEL = ['attack', 'jab', 'bash', 'charge', 'dash', 'backstab', 'maul', 'pounce'];


  async function playSkill(stage, fxName, hero, target) {
    const s = stage, f = (hero.tip && hero.tip()) || hero.hand, t = target;
    // A(ms): várj, amíg a hős mozdulata ide ér (a harcmező adja át az animáció óráját); ha nincs, a hívás pillanatától mér
    const t0 = performance.now(), A = hero.at || (ms => wait(Math.max(0, ms - (performance.now() - t0))));
    switch (fxName) {
      case 'slash': return E.slash(s, { to: t });
      case 'slash1': E.slash(s, { to: t, big: true }); await A(hero.contact || 0); E.shake(s, 6); return E.impact(s, { to: t, color: '#ffffff', big: true });
      // lendületes roham: por a talp alatt, sebességcsíkok, majd egy nagy kettős vágás
      case 'charge': E.dust(s, { at: hero.feet, dir: -1 }); await A(120); E.trail(s, { from: hero.center, to: t, color: '#ffe2a0' }); await A(380);
        E.slash(s, { to: t, double: true, big: true }); await A(441); E.shake(s, 11); E.dust(s, { at: { x: t.x - 60, y: hero.feet.y }, dir: -1 }); return E.impact(s, { to: t, big: true });
      // harci kiáltás: hanghullámok a hősből, a földön lökéshullám, felfelé szálló erőnyilak, és csak utána az ütés
      case 'roar': {
        // a kiáltás a mellkasból indul (nem a fej körül), a kiabálás csúcsán
        await A(360); E.shake(s, 7); E.rings(s, { at: { x: hero.center.x + 70, y: hero.head.y + 20 }, color: '#ffb36a', r0: 48 }); E.shockwave(s, { at: hero.feet, color: '#ff9a4a' }); E.buff(s, { at: hero.feet, color: '#ff9a6a' });
        await A(560); E.trail(s, { from: hero.center, to: t, color: '#ffb36a' }); await wait(120); E.slash(s, { to: t, color: '#ffd0a0' }); return E.impact(s, { to: t, color: '#ffb36a' });
      }
      case 'guard': await A(240); E.dust(s, { at: hero.feet, dir: 1 }); E.shake(s, 4); await E.shield(s, { at: hero.center, box: hero.box, color: '#ffd88a' }); await A(1010); E.trail(s, { from: hero.center, to: t, color: '#ffd88a' }); await wait(120); E.slash(s, { to: t, color: '#ffd88a' }); return E.impact(s, { to: t, color: '#ffd88a' });
      case 'slash2': await E.slash(s, { to: t, double: true, big: true }); return E.impact(s, { to: t, big: true });
      case 'impactStun': await A(340); E.shake(s, 7); E.impact(s, { to: t, color: '#cfd6ea', big: true }); E.stun(s, { to: { x: t.x, y: t.y - 90 } }); return Promise.resolve();
      case 'buffHit': await E.buff(s, { at: hero.feet, color: '#ff9a6a' }); return E.slash(s, { to: t });
      case 'shieldHit': await E.shield(s, { at: hero.center, box: hero.box }); return E.slash(s, { to: t });
      case 'arrow': await E.projectile(s, { from: f, to: t, kind: 'arrow', color: '#efe4cc', arc: -12, ms: 300, size: 96 }); return E.impact(s, { to: t, color: '#efe4cc' });
      case 'arrowGlow': await E.projectile(s, { from: f, to: t, kind: 'arrow', color: '#ffe28a', arc: -10, ms: 260 }); return E.impact(s, { to: t, color: '#ffe28a', big: true });
      case 'arrow2': await A(400); E.projectile(s, { from: f, to: t, kind: 'arrow', color: '#efe4cc', arc: -18, ms: 300, size: 96 }); await A(800); await E.projectile(s, { from: f, to: { x: t.x, y: t.y + 20 }, kind: 'arrow', color: '#efe4cc', arc: -8, ms: 300, size: 96 }); return E.impact(s, { to: t, color: '#efe4cc' });
      case 'arrow2x': await A(400); E.projectile(s, { from: f, to: t, kind: 'arrow', color: '#efe4cc', arc: -18, ms: 280, size: 96 }).then(() => E.impact(s, { to: t, color: '#efe4cc' })); await A(805); await E.projectile(s, { from: f, to: { x: t.x, y: t.y + 20 }, kind: 'arrow', color: '#efe4cc', arc: -8, ms: 280, size: 96 }); return E.impact(s, { to: { x: t.x, y: t.y + 20 }, color: '#efe4cc' });
      case 'aimed': E.reticle(s, { to: t, ms: 1080 }); await A(995); await E.projectile(s, { from: f, to: t, kind: 'arrow', color: '#ffe28a', arc: -3, ms: 150, size: 110 }); E.shake(s, 8); E.flash(s, { color: 'rgba(255,230,160,0.22)' }); return E.impact(s, { to: t, color: '#ffe28a', big: true });
      case 'trap': { const ft = hero.monFeet || { x: t.x, y: t.y + 90 }; await A(400); await E.projectile(s, { from: { x: hero.feet.x + 50, y: hero.feet.y - 50 }, to: { x: ft.x, y: ft.y - 20 }, kind: 'trapItem', arc: -110, ms: 460, size: 120 }); await E.trap(s, { to: { x: ft.x, y: ft.y - 30 } }); E.stun(s, { to: { x: t.x, y: t.y - 90 } }); return Promise.resolve(); }
      case 'leapShot': E.dust(s, { at: hero.feet, dir: 1 }); await A(440); await E.projectile(s, { from: { x: f.x - 75, y: f.y - 60 }, to: t, kind: 'arrow', color: '#efe4cc', arc: 8, ms: 300, size: 96 }); E.dust(s, { at: { x: hero.feet.x - 56, y: hero.feet.y }, dir: 1 }); return E.impact(s, { to: t, color: '#efe4cc', big: true });
      case 'rootsStun': E.shockwave(s, { at: { x: hero.feet.x + 20, y: hero.feet.y }, color: '#5fd36a' }); await wait(160); E.roots(s, { to: t }); await wait(240); E.impact(s, { to: t, color: '#7dff7a' }); E.stun(s, { to: { x: t.x, y: t.y - 90 } }); return Promise.resolve();
      case 'smokeArrow': E.smoke(s, { at: hero.center }); await E.projectile(s, { from: f, to: t, kind: 'arrow', color: '#efe4cc' }); return E.impact(s, { to: t });
      case 'orb': await E.projectile(s, { from: f, to: t, kind: 'orb', color: '#cfe0ff' }); return E.impact(s, { to: t, color: '#cfe0ff' });
      case 'star': await E.projectile(s, { from: f, to: t, kind: 'star', color: '#ffe28a', arc: -90, ms: 480 }); E.flash(s, { color: 'rgba(255,230,160,0.35)' }); return E.impact(s, { to: t, color: '#ffe28a', big: true });
      case 'crescent': await E.projectile(s, { from: f, to: t, kind: 'crescent', color: '#cfe0ff', arc: -30, ms: 420, size: 104 }); return E.impact(s, { to: t, color: '#cfe0ff' });
      case 'starRain': {
        E.flash(s, { color: 'rgba(255,230,160,0.2)' });
        E.projectile(s, { from: { x: t.x - 150, y: 70 }, to: { x: t.x - 30, y: t.y + 10 }, kind: 'star', color: '#ffe28a', arc: 0, ms: 380, size: 96 });
        setTimeout(() => E.projectile(s, { from: { x: t.x - 50, y: 50 }, to: { x: t.x + 30, y: t.y - 10 }, kind: 'star', color: '#ffe28a', arc: 0, ms: 380, size: 96 }), 120 / RATE);
        await E.projectile(s, { from: { x: t.x + 40, y: 40 }, to: t, kind: 'star', color: '#ffe28a', arc: 0, ms: 480, size: 110 }); E.shake(s, 7); E.impact(s, { to: { x: t.x - 30, y: t.y + 10 }, color: '#ffe28a' }); return E.impact(s, { to: t, color: '#ffe28a', big: true });
      }
      case 'chain': await E.arcBolt(s, { from: f, to: t }); await wait(70); await E.arcBolt(s, { from: t, to: { x: t.x + 60, y: t.y + 50 } }); await wait(50); return E.arcBolt(s, { from: { x: t.x + 60, y: t.y + 50 }, to: { x: t.x - 30, y: t.y - 40 } });
      case 'lance': await E.projectile(s, { from: f, to: t, kind: 'lance', color: '#fff2b0', arc: -6, ms: 240, size: 120 }); E.flash(s, { color: 'rgba(255,245,200,0.25)' }); return E.impact(s, { to: t, color: '#fff2b0', big: true });
      case 'bless': E.pillar(s, { at: hero.feet, color: '#ffe28a', ms: 1600 }); E.heal(s, { at: hero.center, color: '#ffe28a' }); await E.buff(s, { at: hero.feet, color: '#ffe28a' }); await E.projectile(s, { from: f, to: t, kind: 'orb', color: '#fff2b0' }); return E.impact(s, { to: t, color: '#fff2b0' });
      case 'purify': E.pillar(s, { at: hero.feet, color: '#ffffff', ms: 1600 }); E.heal(s, { at: hero.center, color: '#cfe8ff' }); E.rings(s, { at: hero.center, color: '#ffffff', r0: 40 }); await A(980); await E.projectile(s, { from: hero.head, to: t, kind: 'lance', color: '#ffffff', ms: 260, size: 120 }); return E.impact(s, { to: t, color: '#ffffff' });
      case 'shieldMoon': await A(360); E.shield(s, { at: hero.center, box: hero.box, color: '#cfe0ff' }); await A(780); await E.projectile(s, { from: (hero.tip && hero.tip()) || f, to: t, kind: 'crescent', color: '#cfe0ff', ms: 360, size: 96 }); return E.impact(s, { to: t, color: '#cfe0ff' });
      case 'rebirth': E.pillar(s, { at: hero.feet, color: '#cfe2ff', ms: 1700, w: 180, h: 380 }); E.flash(s, { color: 'rgba(200,220,255,0.22)' }); E.heal(s, { at: hero.center, color: '#bfe0ff' }); await A(800); E.heal(s, { at: hero.center, color: '#ffffff' }); await E.projectile(s, { from: hero.head, to: t, kind: 'crescent', color: '#bfd8ff', ms: 380, size: 96 }); return E.impact(s, { to: t, color: '#bfd8ff' });
      case 'frost': await E.projectile(s, { from: f, to: t, kind: 'shard', color: '#9ff0ff', arc: -10, ms: 360, size: 110 }); E.shake(s, 5); E.impact(s, { to: t, color: '#bff6ff' }); E.frost(s, { to: t }); return Promise.resolve();
      case 'shieldOrb': await A(380); E.shield(s, { at: hero.center, box: hero.box }); await A(780); await E.projectile(s, { from: (hero.tip && hero.tip()) || f, to: t, kind: 'orb', color: '#cfe0ff', ms: 320 }); return E.impact(s, { to: t, color: '#cfe0ff' });
      case 'lightning2': await E.lightning(s, { to: t }); await wait(80); return E.lightning(s, { to: { x: t.x + 20, y: t.y + 10 } });
      case 'lightOrb': await E.projectile(s, { from: f, to: t, kind: 'orb', color: '#fff2b0' }); return E.impact(s, { to: t, color: '#fff2b0' });
      case 'healOrb': E.pillar(s, { at: hero.feet, color: '#7dffb4', ms: 1400 }); E.heal(s, { at: hero.center }); E.heal(s, { at: { x: hero.center.x, y: hero.center.y - 40 }, color: '#ffffff' }); await E.projectile(s, { from: f, to: t, kind: 'orb', color: '#fff2b0' }); return E.impact(s, { to: t, color: '#fff2b0' });
      case 'buffOrb': E.buff(s, { at: hero.feet, color: '#ffe28a' }); await E.projectile(s, { from: f, to: t, kind: 'orb', color: '#fff2b0' }); return E.impact(s, { to: t, color: '#fff2b0' });
      case 'slashPurple': E.slash(s, { to: t, color: '#d6a8ff' }); await A(hero.contact || 0); return E.impact(s, { to: t, color: '#d6a8ff' });
      case 'slashPurple2': await E.slash(s, { to: t, color: '#c48aff', double: true }); return E.impact(s, { to: t, color: '#c48aff' });
      // hátbaszúrás: füst a hős helyén, majd az ellenfél mögött; a döfés a hős animációjának közepén csattan
      case 'backstab': {
        E.smoke(s, { at: hero.center }); await wait(300);
        E.smoke(s, { at: { x: t.x + 95, y: t.y } }); await wait(330);
        await E.slash(s, { to: t, color: '#b06bff', double: true, big: true }); E.shake(s, 10); E.impact(s, { to: t, color: '#d6a8ff', big: true });
        await wait(200); E.smoke(s, { at: { x: t.x + 95, y: t.y } }); return wait(120);
      }
      case 'slashPurpleBig': await E.slash(s, { to: t, color: '#b06bff', double: true, big: true }); E.shake(s, 9); return E.impact(s, { to: t, color: '#d6a8ff', big: true });
      case 'smokeSlash': E.smoke(s, { at: hero.center }); return E.slash(s, { to: t, color: '#d6a8ff' });
      // füstbomba: a bomba a hős lába elé repül, nagy villanás és sűrű füstfelhő nyeli el, a füstből vág ki
      case 'smokeBomb': await A(300); await E.projectile(s, { from: { x: hero.center.x + 30, y: hero.head.y - 30 }, to: { x: hero.feet.x + 20, y: hero.feet.y - 20 }, kind: 'bomb', arc: 0, ms: 160, size: 100 }); E.shake(s, 6); E.smokeBomb(s, { at: { x: hero.center.x + 10, y: hero.center.y + 10 }, size: 380 });
        // a füstből egy árnyékcsík csap ki az ellenfélig, ott vág
        await wait(380); E.trail(s, { from: hero.center, to: t, color: '#b07cff' }); await wait(160); await E.slash(s, { to: t, color: '#d6a8ff', double: true }); return E.impact(s, { to: t, color: '#d6a8ff' });
      // árnyékdöfés: sötét füst a kiinduló helyén, lila sebességcsíkok, két gyors döfés
      case 'shadowDash': E.smoke(s, { at: hero.center }); await A(100); E.trail(s, { from: hero.center, to: t, color: '#b07cff' }); await A(300); E.slash(s, { to: t, color: '#c48aff', double: true }); await A(360); return E.impact(s, { to: t, color: '#c48aff' });
      case 'lullaby': E.projectile(s, { from: f, to: t, kind: 'note', color: '#cfe0ff', arc: -70, ms: 520, size: 96 }); await wait(160); await E.projectile(s, { from: f, to: t, kind: 'note', color: '#d6a8ff', arc: -30, ms: 520, size: 96 }); E.impact(s, { to: t, color: '#cfe0ff' }); E.sleep(s, { to: { x: t.x + 80, y: t.y - 150 } }); return Promise.resolve();
      case 'poisonSlash': E.slash(s, { to: t, color: '#9dff7a', big: true }); await A(hero.contact || 0); E.impact(s, { to: t, color: '#9dff7a' }); E.poison(s, { to: t }); return Promise.resolve();
      case 'spirit': await E.projectile(s, { from: f, to: t, kind: 'spirit', color: '#9ff0ff', arc: -50, ms: 400, size: 100 }); return E.impact(s, { to: t, color: '#9ff0ff' });
      case 'guardian': await A(380); E.shield(s, { at: hero.center, box: hero.box, color: '#9ff0ff' }); E.ghost(s, { at: { x: hero.center.x - 75, y: hero.head.y - 55 }, color: '#bff6ff', size: 150, ms: 1500, z: 4 }); await A(780); await E.projectile(s, { from: (hero.tip && hero.tip()) || f, to: t, kind: 'spirit', color: '#9ff0ff', ms: 360, size: 96 }); return E.impact(s, { to: t, color: '#9ff0ff' });
      case 'pack': {
        // két szellemfarkas jelenik meg a hős két oldalán, aztán rárontanak az ellenfélre
        await A(300); const a = { x: hero.center.x + 90, y: hero.feet.y - 70 }, b = { x: hero.center.x + 170, y: hero.feet.y - 55 };
        E.ghost(s, { at: a, color: '#9ff0ff', kind: 'wolf', size: 190, ms: 800 }); E.ghost(s, { at: b, color: '#c8a8ff', kind: 'wolf', size: 190, ms: 800 });
        await A(820); E.projectile(s, { from: a, to: { x: t.x - 10, y: t.y + 20 }, kind: 'wolf', color: '#9ff0ff', arc: -30, ms: 420, size: 180 }).then(() => { E.claws(s, { to: { x: t.x - 10, y: t.y + 20 }, color: '#9ff0ff' }); E.impact(s, { to: t, color: '#9ff0ff' }); });
        await wait(120); await E.projectile(s, { from: b, to: { x: t.x + 10, y: t.y - 10 }, kind: 'wolf', color: '#c8a8ff', arc: -50, ms: 420, size: 180 }); E.claws(s, { to: t, color: '#c8a8ff' }); return E.impact(s, { to: t, color: '#c8a8ff' });
      }
      case 'soulSwap': {
        // a társ megjelenik, felfénylik, a hős lerántja az öklét: a társ az ellenfélhez repül és felrobban
        const c0 = { x: hero.center.x + 120, y: hero.center.y - 10 };
        E.ghost(s, { at: c0, color: '#c8a8ff', size: 140, ms: 600 }); await A(560);
        E.flash(s, { color: 'rgba(200,170,255,0.22)' }); await E.projectile(s, { from: c0, to: t, kind: 'spirit', color: '#c8a8ff', arc: -60, ms: 380, size: 140 });
        E.shake(s, 12); E.flash(s, { color: 'rgba(255,120,200,0.25)' }); E.shockwave(s, { at: { x: t.x, y: t.y + 30 }, color: '#ff7ad9' }); E.rings(s, { at: t, color: '#ff9ae0', r0: 30 }); E.impact(s, { to: { x: t.x - 30, y: t.y + 20 }, color: '#ff7ad9', big: true }); return E.impact(s, { to: t, color: '#ffd0f0', big: true });
      }
      case 'spirit2': E.projectile(s, { from: f, to: t, kind: 'spirit', color: '#9ff0ff', arc: -80 }); await wait(140); await E.projectile(s, { from: f, to: t, kind: 'spirit', color: '#c8a8ff', arc: 20 }); return E.impact(s, { to: t, color: '#c8a8ff' });
      case 'spiritBurst': await E.projectile(s, { from: f, to: t, kind: 'orb', color: '#c8a8ff', arc: -20, ms: 380, size: 150 }); E.shake(s, 9); E.flash(s, { color: 'rgba(200,170,255,0.22)' }); E.shockwave(s, { at: { x: t.x, y: t.y + 30 }, color: '#c8a8ff' }); E.rings(s, { at: t, color: '#e0c8ff' }); return E.impact(s, { to: t, color: '#e0c8ff', big: true });
      case 'shieldSpirit': return E.shield(s, { at: hero.center, box: hero.box, color: '#9ff0ff' });
      case 'spiritBig': E.flash(s, { color: 'rgba(200,170,255,0.3)' }); await E.projectile(s, { from: f, to: t, kind: 'spirit', color: '#c8a8ff', arc: -100, ms: 500 }); E.shake(s, 10); return E.impact(s, { to: t, color: '#e0c8ff', big: true });
      case 'noteHit': E.slash(s, { to: t, color: '#ffe28a', big: true }); await A(hero.contact || 0); E.impact(s, { to: t, color: '#ffe28a' }); E.projectile(s, { from: t, to: { x: t.x + 30, y: t.y - 70 }, kind: 'note', color: '#ffe28a', ms: 420 }); return Promise.resolve();
      case 'notesStun': E.projectile(s, { from: f, to: t, kind: 'note', color: '#cfe0ff', arc: -70 }); await wait(120); await E.projectile(s, { from: f, to: t, kind: 'note', color: '#d6a8ff', arc: -30 }); return E.stun(s, { to: { x: t.x, y: t.y - 90 } });
      case 'buffNotes': for (let i = 0; i < 3; i++) setTimeout(() => E.projectile(s, { from: f, to: { x: f.x + (i - 1) * 40, y: f.y - 100 - i * 10 }, kind: 'note', color: ['#ffe28a', '#ffb36a', '#ff8a6a'][i], ms: 500 }), i * 140 / RATE); E.buff(s, { at: hero.feet, color: '#ffb36a' }); E.shockwave(s, { at: hero.feet, color: '#ffb36a' }); await wait(520); await E.projectile(s, { from: f, to: t, kind: 'note', color: '#ffb36a', arc: -40, ms: 380, size: 96 }); return E.impact(s, { to: t, color: '#ffb36a' });
      case 'notesRed': E.projectile(s, { from: f, to: t, kind: 'note', color: '#ff8a8a', arc: -60 }); await wait(120); await E.projectile(s, { from: f, to: t, kind: 'note', color: '#ff8a8a', arc: -20 }); return E.impact(s, { to: t, color: '#ff8a8a' });
      case 'healNotes': E.projectile(s, { from: f, to: { x: f.x + 30, y: f.y - 90 }, kind: 'note', color: '#ffe28a', size: 96 }); setTimeout(() => E.projectile(s, { from: f, to: { x: f.x - 20, y: f.y - 110 }, kind: 'note', color: '#7dffb4', size: 96 }), 160 / RATE); E.pillar(s, { at: hero.feet, color: '#ffe28a', ms: 1200 }); await E.heal(s, { at: hero.center }); await wait(300); await E.projectile(s, { from: f, to: t, kind: 'note', color: '#ffe28a', arc: -40, ms: 380, size: 96 }); return E.impact(s, { to: t, color: '#ffe28a' });
      case 'claws': E.claws(s, { to: t, big: true, color: '#fff3d8' }); await A(hero.contact || 0); return E.impact(s, { to: t, color: '#ffe0b8' });
      case 'bear': await A(180); E.transform(s, { at: hero.center, color: '#d9b88a' }); await A(470); { const land = { x: hero.hand.x - 30, y: hero.feet.y }; E.dust(s, { at: land, dir: -1 }); E.rings(s, { at: { x: land.x, y: hero.center.y }, color: '#d9b88a' }); } await A(500); E.shake(s, 12); E.claws(s, { to: t, big: true, color: '#ffe0b8' }); E.shockwave(s, { at: { x: t.x - 20, y: hero.feet.y }, color: '#d9b88a' }); return E.impact(s, { to: t, color: '#d9b88a', big: true });
      case 'wolf': E.dust(s, { at: hero.feet, dir: -1 }); await A(230); E.trail(s, { from: hero.center, to: t, color: '#cfe0ff' }); await A(390); E.transform(s, { at: { x: hero.hand.x - 30, y: hero.center.y }, color: '#cfe0ff' }); E.dust(s, { at: { x: hero.hand.x - 30, y: hero.feet.y }, dir: -1 }); await A(410); E.claws(s, { to: t, color: '#ffffff', big: true }); E.impact(s, { to: t, color: '#cfe0ff' }); await A(520); E.claws(s, { to: { x: t.x + 14, y: t.y + 12 }, color: '#cfe0ff', big: true }); return E.impact(s, { to: t, color: '#ffffff' });
      case 'heal': return E.heal(s, { at: hero.center });
    }
    return E.impact(s, { to: t });
  }

  root.NYX.vfx = Object.assign(E, { setRate: r => { RATE = Math.max(0.25, +r || 1); }, getRate: () => RATE, number: number, banner: banner, SKILL_FX: SKILL_FX, TRAVEL: TRAVEL, CONTACT: CONTACT, playSkill: playSkill, wait: wait });
})(typeof window !== 'undefined' ? window : globalThis);
