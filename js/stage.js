/* Nyxoria RPG – harci színpad: a hős és a szörny mozgása, képesség-effektek a motor harci eseményeire.
   A harc menetét és állapotát (élet, napló, vége) a ui.js vezeti; ez csak a látványt adja hozzá.
   Minden lejátszás megszakítható: ha a képernyő újrarajzolódik vagy a játékos a végére ugrik, a futó
   lejátszás „elavul” (gen), és nem nyúl többé a lapon lévő elemekhez. */
(function (root) {
  'use strict';
  const R = root.NYX.rig, M = root.NYX.monsters, SC = root.NYX.scenes, V = root.NYX.vfx, D = root.NYX.data;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

  // a hős mozdulatainak hossza (ms, 1× sebességen) – ennyi után vesszük le a mozdulat osztályát
  const DUR = { skycall: 1200, thrust: 950, shelter: 1100, victory: 1900, backstab: 1500, aim: 1450, charge: 1150, strum: 1200, pray: 1200, roar: 1100, guard: 1500, beast: 1050, leap: 1000, attack: 1050, shoot2: 1250, kneel: 1300, bless: 1200, lull: 1300, march: 1300, taunt: 1300, anthem: 1300, maul: 1150, pounce: 1000, ward: 1100, sweep: 1100, clench: 1100, zap: 1050, slam: 1050, toss: 900, bash: 950, jab: 850, push: 1000, point: 950 };
  const POSE = { attack: 'act-attack', cast: 'act-cast', hit: 'act-hit', dodge: 'act-dodge', victory: 'act-victory', shoot: 'act-shoot', ko: 'act-ko', pop: 'act-pop' };

  // A színpad HTML-je. o: { region, hero{name,classId,rig}, mon{name, guard, boss}, narrow, hud }
  function html(o) {
    const sc = M.sizeOf(o.mon.name, { guard: o.mon.guard, boss: o.mon.boss });
    return SC.scene(o.region, { seed: 9, moonX: o.narrow ? 760 : 820, moonY: o.narrow ? 150 : 120, frameOverlay: true, narrow: o.narrow }) +
      (o.hud || '') +
      `<div class="hero-box" data-box="h">${R.hero(o.hero)}</div>` +
      // ellenfél lehet egy másik hős is (Aréna): tükrözve áll a jobb oldalon
      (o.mon.hero ? `<div class="mon-box is-hero" data-box="m">${R.hero(o.mon.hero, { cls: 'mon-hero' })}</div>`
        : `<div class="mon-box" data-box="m" style="--msc:${sc.toFixed(2)}">${M.monster(o.mon.name, o.region, { guard: o.mon.guard, boss: o.mon.boss })}</div>`) +
      `<div class="fg">${SC.frame(o.region, { seed: 9 })}</div>`;
  }

  function create(stage, opts) {
    opts = opts || {};
    const st = { stage: stage, gen: 0, rate: 1, basic: opts.basic, boss: !!opts.boss, monName: opts.monName || '' };
    const $ = s => stage.querySelector(s);
    const heroSvg = () => $('.hero-box svg'), monSvg = () => $('.mon-box svg');
    const alive = g => g === st.gen && stage.isConnected;
    const quiet = () => reduced();
    function setRate(r) { st.rate = r || 1; V.setRate(st.rate); }
    // CSS-animációk (mozdulatok) gyorsítása is: a most futó animációk lejátszási sebessége
    function speedUp(el) { if (!el || st.rate === 1) return; (el.getAnimations ? el.getAnimations({ subtree: true }) : []).forEach(a => { try { a.playbackRate = st.rate; } catch (e) {} }); }
    function pose(svg, k) {
      if (!svg) return;
      const cl = POSE[k] || (k.indexOf('act-') === 0 ? k : 'act-' + k);
      svg.classList.remove(cl); void svg.getBoundingClientRect(); svg.classList.add(cl);
      speedUp(svg);
      setTimeout(() => svg.classList.remove(cl), (DUR[k] || 1000) / st.rate);
    }
    function figBox() {
      const a = stage.getBoundingClientRect(), svg = heroSvg(), s = svg.getBoundingClientRect();
      const r = svg.querySelector('.r-body').getBoundingClientRect();
      const k = Math.min(s.width / 320, s.height / 480), ox = s.left + (s.width - 320 * k) / 2, oy = s.top + (s.height - 480 * k) / 2;
      const axis = ox + 160 * k, feet = oy + 460 * k, half = Math.max(axis - r.left, r.right - axis);
      return { x: axis - a.left, y: (r.top + feet) / 2 - a.top, w: half * 2, h: feet - r.top };
    }
    function points() {
      const a = stage.getBoundingClientRect(), h = $('.hero-box').getBoundingClientRect(), mb = $('.mon-box').getBoundingClientRect(), mf = $('.mon-box .m-fx'), m = mf ? mf.getBoundingClientRect() : mb;
      const rel = (x, y) => ({ x: x - a.left, y: y - a.top });
      return {
        hero: { box: figBox(), hand: rel(h.left + h.width * 0.72, h.top + h.height * 0.5), center: rel(h.left + h.width * 0.5, h.top + h.height * 0.48), feet: rel(h.left + h.width * 0.5, h.top + h.height * 0.82), head: rel(h.left + h.width * 0.5, h.top + h.height * 0.22) },
        monFeet: rel(m.left + m.width * 0.45, m.bottom - m.height * 0.03),
        mon: rel(m.left + m.width * 0.42, m.top + m.height * 0.5), monHead: rel(m.left + m.width * 0.3, m.top + m.height * 0.12), monFront: rel(m.left, m.top + m.height * 0.5)
      };
    }
    // várakozás egy animáció adott pillanatáig (a mozdulathoz igazítva; lassú gépen sem csúszik szét)
    function atOf(an) {
      return ms => new Promise(res => { const t0 = performance.now(); const f = () => { const a = an(); (a ? (a.playState !== 'running' || a.currentTime >= ms) : performance.now() - t0 >= ms / st.rate) ? res() : requestAnimationFrame(f); }; f(); });
    }
    const w = ms => V.wait(ms);

    // a hős egy képessége (vagy sima ütése) és a találatok. onHit(d) az ütés pillanatában fut (élet, napló).
    async function heroSkill(g, skillId, hits, onHit) {
      if (!alive(g)) return;
      const sv = heroSvg(), mon = monSvg();
      if (quiet() || !sv || !mon) { for (const d of hits) { if (!alive(g)) return; onHit && onHit(d); numberOnMon(d); await w(260); } return; }
      const fx = V.SKILL_FX[skillId] || ['attack', 'slash'], p = points();
      if (skillId && skillId !== st.basic && D.SKILLS[skillId]) V.banner(stage, D.SKILLS[skillId].name, 'skill', window.NYX.icons && window.NYX.icons.has('skill', skillId) ? window.NYX.icons.svg('skill', skillId) : '');
      const r = sv.getBoundingClientRect(), k = Math.min(r.width / 320, r.height / 480) || 1, W = stage.clientWidth;
      sv.style.setProperty('--cx', Math.max(60, (p.mon.x - 175 * k - p.hero.box.x) / k).toFixed(0) + 'px');
      const mr = $('.mon-box').getBoundingClientRect(), ar = stage.getBoundingClientRect();
      const behindX = Math.min(mr.right - ar.left - mr.width * 0.12, W - 60 * k);
      sv.style.setProperty('--bx', ((behindX - p.hero.box.x) / k).toFixed(0) + 'px');
      if (V.TRAVEL.indexOf(fx[0]) >= 0) { const hb = $('.hero-box'); hb.style.zIndex = 6; setTimeout(() => { hb.style.zIndex = ''; }, 1500 / st.rate); }
      sv.dataset.skill = skillId || ''; clearTimeout(sv._skT); sv._skT = setTimeout(() => { delete sv.dataset.skill; }, 1600 / st.rate);
      pose(sv, fx[0]);
      const at = atOf(() => (sv.querySelector('.r-root').getAnimations() || []).filter(x => x.animationName !== 'rig-sway')[0]);
      if (fx[0] === 'backstab') {
        const behind = { x: behindX, y: p.mon.y };
        await at(120); if (!alive(g)) return; V.smoke(stage, { at: p.hero.center });
        await at(300); if (!alive(g)) return; V.smoke(stage, { at: behind });
        await at(560); if (!alive(g)) return; V.slash(stage, { to: p.mon, color: '#b06bff', double: true, big: true });
        await at(620); if (!alive(g)) return; V.shake(stage, 10); V.impact(stage, { to: p.mon, color: '#d6a8ff', big: true });
        at(960).then(() => { if (alive(g)) V.smoke(stage, { at: behind }); });
      } else {
        await at(fx[2] != null ? fx[2] : 260); if (!alive(g)) return;
        const tip = () => { const gl = heroSvg() && heroSvg().querySelector('.r-weapon .r-glow'); if (!gl) return null; const b = gl.getBoundingClientRect(), a = stage.getBoundingClientRect(); return b.width ? { x: b.left + b.width / 2 - a.left, y: b.top + b.height / 2 - a.top } : null; };
        const hero = Object.assign({}, p.hero, { at: at, contact: V.CONTACT[fx[0]], tip: tip, monFeet: p.monFeet }, V.TRAVEL.indexOf(fx[0]) >= 0 ? { hand: { x: p.mon.x - 90, y: p.mon.y } } : {});
        if (skillId === 'fagyrog') at(760).then(() => { const m = monSvg(); if (m && alive(g)) { m.classList.add('frozen'); setTimeout(() => m.classList.remove('frozen'), 1600 / st.rate); } });
        await V.playSkill(stage, fx[1], hero, p.mon);
      }
      for (const d of hits) {
        if (!alive(g)) return;
        if (d.dodge) { pose(monSvg(), 'act-dodge'); V.number(stage, p.mon.x, p.mon.y - 40, 'mellé', 'miss'); onHit && onHit(d); continue; }
        pose(monSvg(), 'act-hit');
        if (d.crit || d.first) { V.shake(stage, 9); V.number(stage, p.mon.x, p.mon.y - 50, d.dmg + '!', 'crit'); }
        else V.number(stage, p.mon.x, p.mon.y - 40, String(d.dmg), st.boss ? 'boss' : 'hit');
        onHit && onHit(d);
        await w(140);
      }
    }
    // csak a hős mozdulata és a képesség látványa, sebzés nélkül (gyógyítás, pajzs, erősítés)
    async function heroCast(g, skillId) {
      if (!alive(g) || quiet()) return;
      const sv = heroSvg(); if (!sv) return;
      const fx = V.SKILL_FX[skillId] || ['cast', 'buff'], p = points();
      if (skillId && D.SKILLS[skillId]) V.banner(stage, D.SKILLS[skillId].name, 'skill', window.NYX.icons && window.NYX.icons.has('skill', skillId) ? window.NYX.icons.svg('skill', skillId) : '');
      pose(sv, fx[0]);
      const at = atOf(() => (sv.querySelector('.r-root').getAnimations() || []).filter(x => x.animationName !== 'rig-sway')[0]);
      await at(fx[2] != null ? fx[2] : 260); if (!alive(g)) return;
      try { await V.playSkill(stage, fx[1], Object.assign({}, p.hero, { at: at, monFeet: p.monFeet }), p.mon); } catch (e) { /* a látvány hibája nem állíthatja meg a harcot */ }
    }
    function numberOnMon(d) {
      if (quiet()) return;
      const p = points();
      V.number(stage, p.mon.x, p.mon.y - 40, d.dodge ? 'mellé' : String(d.dmg) + (d.crit ? '!' : ''), d.dodge ? 'miss' : d.crit ? 'crit' : 'hit');
    }
    async function monAttack(g, special, d, onHit, specialName) {
      if (!alive(g)) return;
      const ms = monSvg(), p = points();
      if (quiet() || !ms) { onHit && onHit(d); V.number(stage, p.hero.head.x + 10, p.hero.head.y - 50, d.dodge ? 'kitért' : String(d.dmg), d.dodge ? 'miss' : 'hit'); await w(300); return; }
      const mr = ms.getBoundingClientRect(), k = Math.min(mr.width, mr.height) / 340 || 1, hb = $('.hero-box').getBoundingClientRect(), ar = stage.getBoundingClientRect();
      ms.style.setProperty('--mx', (-Math.max(0, (p.monFront.x + ar.left) - (hb.left + hb.width * 0.62)) / k).toFixed(0) + 'px');
      const mb = $('.mon-box'); mb.style.zIndex = 6; setTimeout(() => { mb.style.zIndex = ''; }, (special ? 1300 : 1000) / st.rate);
      const at = atOf(() => (ms.querySelector('.m-root').getAnimations() || [])[0]);
      if (special) {
        V.banner(stage, specialName ? `${st.monName}: ${specialName}!` : `${st.monName} különleges támadása!`, 'mon');
        pose(ms, 'act-special'); await at(330); if (!alive(g)) return; V.shake(stage, 6);
        await at(660); if (!alive(g)) return;
        const mf = $('.mon-box .m-fx').getBoundingClientRect(), ar2 = stage.getBoundingClientRect();
        V.shockwave(stage, { at: { x: mf.left - ar2.left + mf.width * 0.3, y: mf.bottom - ar2.top - 4 }, color: '#ff8aa8' }); V.shake(stage, 12);
      } else { pose(ms, 'act-attack'); await at(420); if (!alive(g)) return; }
      if (d.dodge) { pose(heroSvg(), 'dodge'); V.number(stage, p.hero.head.x + 10, p.hero.head.y - 50, 'kitért', 'miss'); onHit && onHit(d); return; }
      V.impact(stage, { to: p.hero.center, color: '#ff8aa8', big: special });
      pose(heroSvg(), 'hit');
      V.number(stage, p.hero.head.x + 10, p.hero.head.y - 50, String(d.dmg) + (d.crit ? '!' : ''), d.crit ? 'crit' : 'hit');
      if (d.absorbed) V.shield(stage, { at: p.hero.center, box: p.hero.box });
      onHit && onHit(d);
    }
    async function pet(g, e, onHit) {
      if (!alive(g)) return;
      const p = points();
      if (!quiet()) await V.projectile(stage, { from: { x: p.hero.head.x + 40, y: p.hero.head.y }, to: p.mon, kind: 'spirit', color: '#9ff0ff', arc: -50 });
      if (!alive(g)) return;
      if (!e.dodge) { pose(monSvg(), 'act-hit'); V.number(stage, p.mon.x + 30, p.mon.y - 20, String(e.dmg), 'hit'); } else V.number(stage, p.mon.x + 30, p.mon.y - 20, 'mellé', 'miss');
      onHit && onHit(e);
    }
    // az ellenfél (párbajban a másik hős) társa: szellemlövedék tőle a hős felé
    async function petM(g, e, onHit) {
      if (!alive(g)) return;
      const p = points();
      if (!quiet()) await V.projectile(stage, { from: { x: p.monHead.x - 30, y: p.monHead.y }, to: p.hero.center, kind: 'spirit', color: '#ffb3c8', arc: -50 });
      if (!alive(g)) return;
      if (!e.dodge) { pose(heroSvg(), 'act-hit'); V.number(stage, p.hero.head.x + 10, p.hero.head.y - 50, String(e.dmg), 'hit'); } else { pose(heroSvg(), 'dodge'); V.number(stage, p.hero.head.x + 10, p.hero.head.y - 50, 'kitért', 'miss'); }
      onHit && onHit(e);
    }
    // side: 'm' = a hatás az ellenfélen látszik (párbajban az ellenfél is gyógyul, pajzsot húz, kábít, mérgez)
    function heal(g, amount, side) { if (!alive(g)) return; const p = points(); if (amount > 0) { if (side === 'm') { if (!quiet()) V.heal(stage, { at: p.mon }); V.number(stage, p.mon.x + 10, p.monHead.y - 30, '+' + amount, 'heal'); return; } if (!quiet()) V.heal(stage, { at: p.hero.center }); V.number(stage, p.hero.head.x + 10, p.hero.head.y - 50, '+' + amount, 'heal'); } }
    function shield(g, side) { if (!alive(g)) return; const p = points(); if (side === 'm') { V.number(stage, p.mon.x + 10, p.monHead.y - 30, 'pajzs', 'heal'); return; } if (!quiet()) V.shield(stage, { at: p.hero.center, box: p.hero.box }); V.number(stage, p.hero.head.x + 10, p.hero.head.y - 50, 'pajzs', 'heal'); }
    function stun(g, onHero) { if (!alive(g) || quiet()) return; V.stun(stage, { to: onHero ? points().hero.head : points().monHead }); }
    function dot(g, e, onHero) { if (!alive(g)) return; const p = points(); if (onHero) { if (!quiet()) V.poison(stage, { to: p.hero.center }); V.number(stage, p.hero.head.x, p.hero.head.y - 30, String(e.dmg), 'poison'); return; } if (!quiet()) V.poison(stage, { to: p.mon }); V.number(stage, p.mon.x, p.mon.y - 30, String(e.dmg), 'poison'); }
    // harc vége: a vesztes elesik (a heti szörny nem – ő marad), a győztes ünnepel
    function finish(win) {
      const hs = heroSvg(), ms = monSvg();
      if (win) { if (ms && !st.boss) ms.classList.add('act-ko'); pose(hs, 'victory'); if (!quiet() && !st.boss) V.levelup(stage, { at: points().hero.feet }); }
      else if (hs) hs.classList.add('act-ko');
    }
    // végállapot (átugrás után, újrarajzoláskor): csak a pózok, effektek nélkül
    function setEnd(win) { const hs = heroSvg(), ms = monSvg(); if (win) { if (ms && !st.boss) ms.classList.add('act-ko'); } else if (hs) hs.classList.add('act-ko'); }
    return Object.assign(st, { setRate, heroSkill, heroCast, monAttack, pet, petM, heal, shield, stun, dot, finish, setEnd, wait: w, newGen: () => ++st.gen, alive });
  }

  root.NYX.stage = { html: html, create: create, esc: esc };
})(typeof window !== 'undefined' ? window : globalThis);
