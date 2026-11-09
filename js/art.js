/* Nyxoria RPG – vektoros rajzok: hős, szörnyek, tájak, ikonok, Bubó a bagoly.
   Ideiglenes grafika: a végleges képek a játékmenet után készülnek. */
(function (root) {
  'use strict';
  var D = root.NYX.data;

  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function shade(hex, f) { // f<0 sötétít, f>0 világosít
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var t = f < 0 ? 0 : 255, p = Math.abs(f);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  var EYE_COLORS = { sotet: '#2b2350', kek: '#3f6fd8', zold: '#2f9e6a', arany: '#c98a1c', tunde: '#7ff3ff' };
  var HAIR_STYLES = { hosszu: 'Hosszú', rovid: 'Rövid', copf: 'Copf', konty: 'Konty', tuskes: 'Tüskés' };
  var MARKS = { nincs: 'Nincs', holdjel: 'Holdjel', csillag: 'Csillagjel', heg: 'Forradás', szeplo: 'Szeplők' };
  var OUTFITS = ['#3a3f9c', '#6b2f4f', '#2f6b4f', '#5a4632', '#2b2f45', '#7a5a1e', '#4b2f7a', '#7a2f2f'];
  var CLASS_OUTFIT = { harcos: '#5a6378', vadasz: '#2f6b4f', magus: '#3a3f9c', gyogyito: '#d9cfae', orgyilkos: '#2b2f45', idezo: '#4b2f7a', dalnok: '#7a2f2f', alakvalto: '#5a4632' };

  function defaultLook(classId) {
    return { hairStyle: 'hosszu', hair: '#e8e8ff', tip: '#7f8cff', eyes: 'tunde', mark: 'nincs', outfit: CLASS_OUTFIT[classId || 'magus'] };
  }

  // ---------- Hős ----------
  function weaponSvg(classId, skin) {
    switch (classId) {
      case 'harcos': return '' +
        '<path d="M150 200 L150 120" stroke="#cfd8ff" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M150 120 L150 104" stroke="#eef0ff" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M138 196 H162" stroke="#c4702a" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M150 198 V214" stroke="#5a3a20" stroke-width="5" stroke-linecap="round"/>' +
        '<circle cx="56" cy="184" r="24" fill="#2e3672" stroke="#c4702a" stroke-width="4"/>' +
        '<path d="M56 166 L60 180 L74 184 L60 188 L56 202 L52 188 L38 184 L52 180 Z" fill="#f2b84b"/>';
      case 'vadasz': return '' +
        '<path d="M150 116 C176 150 176 196 150 230" stroke="#8a5a32" stroke-width="5" fill="none" stroke-linecap="round"/>' +
        '<path d="M150 116 L150 230" stroke="#eef0ff" stroke-width="1.5"/>' +
        '<path d="M60 150 L64 214" stroke="#5a3a20" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M58 146 L56 136 M63 146 L64 135 M68 147 L71 137" stroke="#5fd39a" stroke-width="3" stroke-linecap="round"/>';
      case 'magus': return '' +
        '<path d="M148 120 V228" stroke="#8a6a4a" stroke-width="5" stroke-linecap="round"/>' +
        '<circle cx="148" cy="112" r="17" fill="#7ff3ff" opacity="0.22"/><circle cx="148" cy="112" r="9" fill="#7ff3ff"/>' +
        '<path d="M140 116 Q148 100 156 116" stroke="#cfd8ff" stroke-width="3" fill="none"/>';
      case 'gyogyito': return '' +
        '<path d="M148 124 V228" stroke="#f2e2a0" stroke-width="5" stroke-linecap="round"/>' +
        '<circle cx="148" cy="112" r="14" fill="none" stroke="#f2b84b" stroke-width="4"/>' +
        '<path d="M148 100 V124 M136 112 H160" stroke="#ffe2a0" stroke-width="3" stroke-linecap="round"/>' +
        '<circle cx="148" cy="112" r="22" fill="#ffe2a0" opacity="0.18"/>';
      case 'orgyilkos': return '' +
        '<path d="M140 194 L162 160" stroke="#cfd8ff" stroke-width="5" stroke-linecap="round"/><path d="M136 198 L144 190" stroke="#5a3a20" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M64 196 L42 162" stroke="#cfd8ff" stroke-width="5" stroke-linecap="round"/><path d="M68 200 L60 192" stroke="#5a3a20" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M162 160 L166 154" stroke="#9b6bff" stroke-width="3" stroke-linecap="round"/>';
      case 'idezo': return '' +
        '<path d="M140 186 L140 204" stroke="#8a6a4a" stroke-width="3"/>' +
        '<rect x="128" y="204" width="24" height="26" rx="6" fill="#2e3672" stroke="#cfd8ff" stroke-width="2.5"/>' +
        '<circle cx="140" cy="217" r="7" fill="#7ff3ff"/><circle cx="140" cy="217" r="14" fill="#7ff3ff" opacity="0.2"/>' +
        '<g opacity="0.9"><path d="M162 130 C150 130 150 112 162 108 C174 104 182 118 176 128 C184 136 176 150 166 146 C166 140 166 134 162 130 Z" fill="#bfefff" opacity="0.75"/>' +
        '<circle cx="164" cy="120" r="2.4" fill="#141a45"/><circle cx="172" cy="120" r="2.4" fill="#141a45"/></g>';
      case 'dalnok': return '' +
        '<ellipse cx="146" cy="200" rx="18" ry="22" fill="#a8642a" stroke="#5a3a20" stroke-width="3"/>' +
        '<circle cx="146" cy="198" r="6" fill="#3a2410"/>' +
        '<path d="M146 178 L160 128" stroke="#5a3a20" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M141 196 L157 132 M151 200 L163 134" stroke="#ffe2a0" stroke-width="1"/>';
      case 'alakvalto': return '' +
        '<path d="M132 190 L124 180 M138 186 L134 174 M144 186 L146 174" stroke="#eef0ff" stroke-width="3.5" stroke-linecap="round"/>' +
        '<path d="M70 192 L78 182 M64 188 L68 176 M58 188 L56 176" stroke="#eef0ff" stroke-width="3.5" stroke-linecap="round"/>';
    }
    return '';
  }

  function outfitDetail(classId, outfit) {
    var dark = shade(outfit, -0.35), light = shade(outfit, 0.35);
    switch (classId) {
      case 'harcos': return '<path d="M62 166 C62 150 78 144 92 146 L86 170 Z" fill="#9aa0c4"/><path d="M138 166 C138 150 122 144 108 146 L114 170 Z" fill="#9aa0c4"/><path d="M84 176 H116 L112 200 H88 Z" fill="' + light + '" opacity="0.6"/>';
      case 'vadasz': return '<path d="M70 150 L100 178 L130 150" stroke="' + light + '" stroke-width="4" fill="none"/><path d="M76 206 H124" stroke="#8a5a32" stroke-width="5"/>';
      case 'magus': return '<path d="M100 146 V226" stroke="#cfd8ff" stroke-width="3"/><path d="M80 148 Q100 164 120 148" stroke="#cfd8ff" stroke-width="3" fill="none"/><path d="M82 196 l2 4 4 1 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -1 Z" fill="#ffe2a0"/>';
      case 'gyogyito': return '<path d="M100 150 V226" stroke="#f2b84b" stroke-width="4"/><path d="M90 176 H110" stroke="#f2b84b" stroke-width="4"/><path d="M80 148 Q100 162 120 148" stroke="#f2b84b" stroke-width="3" fill="none"/>';
      case 'orgyilkos': return '<path d="M74 152 L126 152 L118 166 L82 166 Z" fill="' + dark + '"/><path d="M80 204 H120" stroke="#9b6bff" stroke-width="3"/>';
      case 'idezo': return '<path d="M100 146 V226" stroke="' + light + '" stroke-width="2"/><circle cx="100" cy="160" r="5" fill="#7ff3ff"/>';
      case 'dalnok': return '<path d="M76 152 L124 152 L116 168 L84 168 Z" fill="' + light + '" opacity="0.7"/><path d="M100 168 V226" stroke="#f2b84b" stroke-width="2" stroke-dasharray="4 4"/>';
      case 'alakvalto': return '<path d="M58 168 C70 146 130 146 142 168 C130 160 120 166 112 158 C106 166 94 166 88 158 C80 166 70 160 58 168 Z" fill="#8a6a4a"/>';
    }
    return '';
  }

  function headwear(classId, outfit) {
    switch (classId) {
      case 'vadasz': return '<path d="M56 96 C52 46 148 46 144 96 C138 72 122 62 100 62 C78 62 62 72 56 96 Z" fill="' + outfit + '"/>';
      case 'orgyilkos': return '<path d="M56 98 C52 44 148 44 144 98 C138 70 122 60 100 60 C78 60 62 70 56 98 Z" fill="' + shade(outfit, -0.2) + '"/><path d="M66 114 Q100 134 134 114 L132 130 Q100 146 68 130 Z" fill="' + shade(outfit, -0.3) + '"/>';
      case 'dalnok': return '<path d="M52 72 C70 50 130 50 148 72 C130 66 70 66 52 72 Z" fill="' + outfit + '"/><path d="M66 68 C70 40 130 40 134 68 Z" fill="' + outfit + '"/><path d="M128 52 C150 30 168 34 172 26 C160 48 146 52 132 60 Z" fill="#f2b84b"/>';
      case 'alakvalto': return '<path d="M66 70 L58 40 L82 60 Z" fill="#8a6a4a"/><path d="M134 70 L142 40 L118 60 Z" fill="#8a6a4a"/><path d="M68 64 L64 50 L76 60 Z" fill="#e8b994"/><path d="M132 64 L136 50 L124 60 Z" fill="#e8b994"/>';
      case 'harcos': return '<path d="M62 84 C62 50 138 50 138 84 L132 80 C128 64 72 64 68 80 Z" fill="#9aa0c4"/><path d="M100 50 V40" stroke="#c4702a" stroke-width="5" stroke-linecap="round"/>';
    }
    return '';
  }

  function hairBack(style, hair, tip) {
    switch (style) {
      case 'hosszu': return '<path d="M52 152 C52 172 50 190 46 206 L60 200 C62 186 64 170 66 152 Z" fill="' + tip + '"/><path d="M148 152 C148 172 150 190 154 206 L140 200 C138 186 136 170 134 152 Z" fill="' + tip + '"/>' +
        '<path d="M52 96 C50 44 150 44 148 96 L148 156 C140 150 134 136 132 118 L68 118 C66 136 60 150 52 156 Z" fill="' + hair + '"/>';
      case 'copf': return '<path d="M136 76 C178 82 182 140 164 176 C166 150 158 118 132 96 Z" fill="' + hair + '"/><path d="M172 150 C172 160 168 170 164 176 C164 168 166 160 166 152 Z" fill="' + tip + '"/>' +
        '<path d="M58 98 C56 50 144 50 142 98 C142 106 140 112 138 114 L62 114 C60 112 58 106 58 98 Z" fill="' + hair + '"/><circle cx="138" cy="80" r="5" fill="' + tip + '"/>';
      case 'konty': return '<circle cx="100" cy="50" r="18" fill="' + hair + '"/><path d="M86 42 Q100 34 114 42" stroke="' + tip + '" stroke-width="4" fill="none"/>' +
        '<path d="M58 98 C56 50 144 50 142 98 C142 106 140 112 138 114 L62 114 C60 112 58 106 58 98 Z" fill="' + hair + '"/>';
      case 'tuskes': return '<path d="M56 100 L50 70 L64 72 L60 46 L78 58 L84 34 L98 52 L110 30 L118 54 L136 38 L136 62 L152 58 L144 80 L152 100 Z" fill="' + hair + '"/><path d="M84 34 L88 44 M110 30 L110 42 M60 46 L66 54" stroke="' + tip + '" stroke-width="4" stroke-linecap="round"/>';
      default: return '<path d="M58 98 C56 50 144 50 142 98 C142 106 140 112 138 114 L62 114 C60 112 58 106 58 98 Z" fill="' + hair + '"/>';
    }
  }
  function hairFront(style, hair, tip) {
    if (style === 'tuskes') return '<path d="M60 92 C62 62 138 62 140 92 L128 80 L120 90 L110 76 L100 90 L90 76 L80 90 L72 80 Z" fill="' + hair + '"/>';
    return '<path d="M60 90 C60 54 140 54 140 90 C126 76 112 72 100 82 C88 72 74 76 60 90 Z" fill="' + hair + '"/>' +
      '<path d="M60 90 C61 82 64 76 70 70 C68 78 66 84 60 90 Z" fill="' + tip + '"/><path d="M140 90 C139 82 136 76 130 70 C132 78 134 84 140 90 Z" fill="' + tip + '"/>';
  }
  function markSvg(mark) {
    switch (mark) {
      case 'holdjel': return '<path d="M74 104 A8 8 0 1 0 80 116 A6 6 0 1 1 74 104 Z" fill="#7ff3ff" opacity="0.9"/>';
      case 'csillag': return '<path d="M126 104 L128 109 L133 110 L129 113 L130 118 L126 115 L122 118 L123 113 L119 110 L124 109 Z" fill="#ffe2a0"/>';
      case 'heg': return '<path d="M74 88 L92 116" stroke="#b05a5a" stroke-width="3" stroke-linecap="round" opacity="0.8"/>';
      case 'szeplo': return '<g fill="#a8643a" opacity="0.55"><circle cx="74" cy="112" r="1.6"/><circle cx="79" cy="115" r="1.6"/><circle cx="72" cy="117" r="1.6"/><circle cx="126" cy="112" r="1.6"/><circle cx="121" cy="115" r="1.6"/><circle cx="128" cy="117" r="1.6"/></g>';
    }
    return '';
  }

  // Teljes alakos hős (viewBox 0 0 200 240)
  function heroSvg(hero, opts) {
    opts = opts || {};
    var look = hero.look || defaultLook(hero.classId);
    var ppl = D.PEOPLES[hero.people] || D.PEOPLES.ember, skin = ppl.skin;
    var outfit = look.outfit || CLASS_OUTFIT[hero.classId];
    var eyes = EYE_COLORS[look.eyes] || EYE_COLORS.sotet, glow = look.eyes === 'tunde';
    var pointy = ppl.ears === 'pointy';
    var earL = pointy ? 'M64 96 L34 66 L68 82 Z' : 'M64 88 C50 88 50 110 64 110 Z';
    var earR = pointy ? 'M136 96 L166 66 L132 82 Z' : 'M136 88 C150 88 150 110 136 110 Z';
    var aura = '';
    if (hero.people === 'arnyszulott') aura = '<ellipse cx="100" cy="150" rx="78" ry="92" fill="#9b6bff" opacity="0.10"/>';
    if (hero.people === 'csillagfenyu') aura = '<g fill="#ffe2a0"><circle cx="40" cy="60" r="2"/><circle cx="166" cy="48" r="1.6"/><circle cx="30" cy="140" r="1.4"/><circle cx="174" cy="130" r="2"/></g>';
    if (hero.people === 'holdtunde') aura = '<ellipse cx="100" cy="98" rx="56" ry="58" fill="#cfd8ff" opacity="0.10"/>';
    var stone = hero.people === 'koszivu' ? '<path d="M70 96 L80 104 L76 112 M128 92 L120 100 L126 108" stroke="#7d7a88" stroke-width="2" fill="none"/>' : '';
    var hw = headwear(hero.classId, outfit);
    var hideHair = hero.classId === 'orgyilkos' || hero.classId === 'vadasz';
    var mouth = opts.mood === 'hurt' ? '<path d="M93 124 Q100 118 107 124" stroke="#3a3560" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
      : '<path d="M94 120 Q100 125 106 120" stroke="#3a3560" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
    return '<svg viewBox="0 0 200 240" role="img" aria-label="' + esc(hero.name || 'Hős') + '" xmlns="http://www.w3.org/2000/svg">' +
      aura +
      '<ellipse cx="100" cy="230" rx="52" ry="8" fill="#05071a" opacity="0.6"/>' +
      (hideHair ? '' : hairBack(look.hairStyle, look.hair, look.tip)) +
      '<path d="M56 228 C58 170 76 142 100 142 C124 142 142 170 144 228 Z" fill="' + outfit + '"/>' +
      '<path d="M56 228 C58 200 64 180 74 166 C70 186 70 206 72 228 Z" fill="' + shade(outfit, -0.25) + '"/>' +
      outfitDetail(hero.classId, outfit) +
      '<circle cx="64" cy="196" r="9" fill="' + skin + '"/><circle cx="140" cy="194" r="9" fill="' + skin + '"/>' +
      weaponSvg(hero.classId, skin) +
      '<path d="' + earL + '" fill="' + skin + '"/><path d="' + earR + '" fill="' + skin + '"/>' +
      '<ellipse cx="100" cy="98" rx="40" ry="42" fill="' + skin + '"/>' + stone +
      (hideHair ? '' : hairFront(look.hairStyle, look.hair, look.tip)) +
      hw +
      (glow ? '<circle cx="84" cy="102" r="13" fill="' + eyes + '" opacity="0.25"/><circle cx="116" cy="102" r="13" fill="' + eyes + '" opacity="0.25"/>' : '') +
      '<ellipse cx="84" cy="102" rx="6" ry="7" fill="' + eyes + '"/><ellipse cx="116" cy="102" rx="6" ry="7" fill="' + eyes + '"/>' +
      '<circle cx="86" cy="99" r="2" fill="#fff"/><circle cx="118" cy="99" r="2" fill="#fff"/>' +
      (hero.classId === 'orgyilkos' ? '' : '<circle cx="76" cy="116" r="5" fill="#ff9fb5" opacity="0.35"/><circle cx="124" cy="116" r="5" fill="#ff9fb5" opacity="0.35"/>' + mouth) +
      markSvg(look.mark) +
      '</svg>';
  }

  // ---------- Szörnyek ----------
  var REGION_COLORS = { kodlap: ['#6f8f86', '#9fd1b8'], holdfeny: ['#4d6fa8', '#cfd8ff'], arnyromok: ['#6a5590', '#c9a7ff'], szirtek: ['#3f8fb0', '#7ff3ff'], ejkatlan: ['#7a2f4f', '#ff7a9a'] };
  function monsterSvg(name, regionId, guard) {
    var h = hash(name), kind = ['wisp', 'beast', 'golem', 'spider'][h % 4];
    var c = REGION_COLORS[regionId] || REGION_COLORS.kodlap, body = c[0], glow = c[1], dark = shade(body, -0.4), light = shade(body, 0.25);
    var eye = '<circle cx="84" cy="112" r="7" fill="' + glow + '"/><circle cx="116" cy="112" r="7" fill="' + glow + '"/><circle cx="84" cy="112" r="14" fill="' + glow + '" opacity="0.2"/><circle cx="116" cy="112" r="14" fill="' + glow + '" opacity="0.2"/>';
    var art = '';
    if (kind === 'wisp') art =
      '<path d="M100 40 C146 40 158 92 150 132 C146 160 156 186 146 214 C134 196 128 222 116 204 C106 226 96 204 86 222 C78 200 66 220 56 204 C48 180 56 160 52 132 C44 90 56 40 100 40 Z" fill="' + body + '" opacity="0.92"/>' +
      '<path d="M72 70 C80 56 96 50 110 52" stroke="' + light + '" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.7"/>' + eye +
      '<path d="M86 140 Q100 152 114 140" stroke="' + dark + '" stroke-width="5" fill="none" stroke-linecap="round"/>';
    else if (kind === 'beast') art =
      '<path d="M40 210 C34 150 60 110 100 108 C140 110 166 150 160 210 Z" fill="' + dark + '"/>' +
      '<path d="M58 96 L46 44 L84 78 Z" fill="' + body + '"/><path d="M142 96 L154 44 L116 78 Z" fill="' + body + '"/>' +
      '<ellipse cx="100" cy="118" rx="52" ry="46" fill="' + body + '"/>' +
      '<ellipse cx="100" cy="142" rx="24" ry="16" fill="' + light + '"/><ellipse cx="100" cy="134" rx="8" ry="5" fill="#141a45"/>' +
      '<path d="M86 154 L90 166 L94 154 M106 154 L110 166 L114 154" fill="#eef0ff"/>' + eye.replace(/cy="112"/g, 'cy="108"');
    else if (kind === 'golem') art =
      '<path d="M44 214 L52 130 L76 112 L124 112 L148 130 L156 214 Z" fill="' + dark + '"/>' +
      '<path d="M28 150 L50 132 L58 196 L34 200 Z M172 150 L150 132 L142 196 L166 200 Z" fill="' + body + '"/>' +
      '<path d="M64 56 L136 56 L146 92 L130 130 L70 130 L54 92 Z" fill="' + body + '"/>' +
      '<path d="M70 66 L92 70 M108 70 L130 66" stroke="' + dark + '" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M86 176 L100 160 L114 176 L100 192 Z" fill="' + glow + '" opacity="0.85"/>' + eye.replace(/cy="112"/g, 'cy="92"') +
      '<path d="M84 114 H116" stroke="' + dark + '" stroke-width="5" stroke-linecap="round"/>';
    else art =
      '<g stroke="' + dark + '" stroke-width="7" stroke-linecap="round" fill="none"><path d="M70 140 L30 120 L18 170"/><path d="M68 156 L26 168 L22 214"/><path d="M130 140 L170 120 L182 170"/><path d="M132 156 L174 168 L178 214"/></g>' +
      '<ellipse cx="100" cy="170" rx="46" ry="40" fill="' + dark + '"/><ellipse cx="100" cy="118" rx="44" ry="40" fill="' + body + '"/>' +
      '<circle cx="84" cy="100" r="5" fill="' + glow + '"/><circle cx="116" cy="100" r="5" fill="' + glow + '"/>' + eye +
      '<path d="M90 140 L94 152 M110 140 L106 152" stroke="#eef0ff" stroke-width="4" stroke-linecap="round"/>';
    var crown = guard ? '<path d="M70 44 L78 18 L92 36 L100 10 L108 36 L122 18 L130 44 Z" fill="#f2b84b" stroke="#c4702a" stroke-width="2"/><circle cx="100" cy="26" r="4" fill="' + glow + '"/>' : '';
    var aura = guard ? '<ellipse cx="100" cy="130" rx="92" ry="104" fill="' + glow + '" opacity="0.08"/>' : '';
    return '<svg viewBox="0 0 200 240" role="img" aria-label="' + esc(name) + '" xmlns="http://www.w3.org/2000/svg">' + aura +
      '<ellipse cx="100" cy="226" rx="60" ry="9" fill="#05071a" opacity="0.6"/>' + art + crown + '</svg>';
  }

  // ---------- Tájak ----------
  var SCENES = {
    kod:    { sky: ['#1a2a3a', '#2f4a52'], moon: '#dfe9e0', far: '#22383e', near: '#16262b', fog: '#9fd1b8', kind: 'reeds' },
    erdo:   { sky: ['#101a40', '#1e3266'], moon: '#eef0ff', far: '#1a2a55', near: '#0e1736', fog: '#cfd8ff', kind: 'trees' },
    rom:    { sky: ['#1a1238', '#3a2a5e'], moon: '#e6dcff', far: '#2a2050', near: '#160f30', fog: '#c9a7ff', kind: 'ruins' },
    szirt:  { sky: ['#0c2438', '#1f5470'], moon: '#dffcff', far: '#183a52', near: '#0b2234', fog: '#7ff3ff', kind: 'cliffs' },
    katlan: { sky: ['#1a0a1e', '#4a1430'], moon: '#ffd0dc', far: '#2e1026', near: '#160814', fog: '#ff7a9a', kind: 'crater' }
  };
  function sceneSvg(sceneId, seed) {
    var s = SCENES[sceneId] || SCENES.erdo, id = 'g' + sceneId + (seed || 0);
    var r = (seed || 1) % 1000, mx = 70 + (r % 5) * 40;
    var stars = '';
    for (var i = 0; i < 14; i++) { var x = (i * 73 + r * 7) % 400, y = (i * 37 + r * 3) % 90; stars += '<circle cx="' + x + '" cy="' + y + '" r="' + (i % 3 ? 0.8 : 1.4) + '" fill="#fff" opacity="0.7"/>'; }
    var far = '', near = '';
    if (s.kind === 'trees') {
      far = '<path d="M0 150 L20 110 L36 150 L52 96 L72 150 L92 104 L110 150 L130 90 L152 150 L176 108 L196 150 L220 96 L244 150 L262 112 L282 150 L306 92 L330 150 L350 106 L372 150 L392 100 L400 120 V240 H0 Z" fill="' + s.far + '"/>';
      near = '<path d="M0 240 V180 L18 130 L38 182 L58 120 L82 186 L100 150 L120 190 H280 L300 140 L322 188 L344 124 L366 184 L386 136 L400 170 V240 Z" fill="' + s.near + '"/>';
    } else if (s.kind === 'reeds') {
      far = '<path d="M0 160 C80 140 140 170 220 150 C300 132 350 160 400 148 V240 H0 Z" fill="' + s.far + '"/>';
      near = '<path d="M0 240 V196 C60 186 120 204 200 194 C280 184 340 200 400 190 V240 Z" fill="' + s.near + '"/>' +
        '<g stroke="' + s.near + '" stroke-width="3" stroke-linecap="round"><path d="M30 196 L26 150 M38 196 L42 160 M46 196 L44 140 M330 194 L326 146 M340 194 L346 158 M352 194 L350 136"/></g>' +
        '<g fill="' + s.near + '"><ellipse cx="44" cy="140" rx="3" ry="9"/><ellipse cx="350" cy="136" rx="3" ry="9"/></g>';
    } else if (s.kind === 'ruins') {
      far = '<path d="M0 160 H40 V110 H60 V160 H120 V96 L134 84 L148 96 V160 H230 V120 H246 V100 H262 V160 H330 V90 H350 V160 H400 V240 H0 Z" fill="' + s.far + '"/>';
      near = '<path d="M0 240 V190 H70 V150 H86 V136 H100 V190 H290 V160 H306 V128 H322 V190 H400 V240 Z" fill="' + s.near + '"/>' +
        '<path d="M86 150 h4 v4 h-4 Z M306 140 h4 v4 h-4 Z" fill="' + s.fog + '" opacity="0.8"/>';
    } else if (s.kind === 'cliffs') {
      far = '<path d="M0 170 L40 120 L70 140 L110 80 L150 130 L190 100 L240 150 L280 96 L330 136 L370 110 L400 130 V240 H0 Z" fill="' + s.far + '"/>';
      near = '<path d="M0 240 V200 L50 160 L90 196 L130 170 L170 204 H240 L280 172 L320 200 L360 156 L400 186 V240 Z" fill="' + s.near + '"/>' +
        '<path d="M200 60 L190 96 L206 92 L196 126" stroke="' + s.fog + '" stroke-width="2" fill="none" opacity="0.5"/>';
    } else {
      far = '<path d="M0 150 L60 130 L120 150 L170 120 L230 146 L290 118 L350 140 L400 128 V240 H0 Z" fill="' + s.far + '"/>';
      near = '<ellipse cx="200" cy="232" rx="230" ry="50" fill="' + s.near + '"/><ellipse cx="200" cy="226" rx="120" ry="18" fill="' + s.fog + '" opacity="0.25"/>';
    }
    return '<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + s.sky[0] + '"/><stop offset="1" stop-color="' + s.sky[1] + '"/></linearGradient>' +
      '<radialGradient id="' + id + 'm"><stop offset="0" stop-color="' + s.moon + '" stop-opacity="0.55"/><stop offset="1" stop-color="' + s.moon + '" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="400" height="240" fill="url(#' + id + ')"/>' + stars +
      '<circle cx="' + (400 - mx) + '" cy="52" r="60" fill="url(#' + id + 'm)"/><circle cx="' + (400 - mx) + '" cy="52" r="20" fill="' + s.moon + '"/>' +
      far + '<rect y="150" width="400" height="40" fill="' + s.fog + '" opacity="0.07"/>' + near + '</svg>';
  }
  function regionScene(regionId) {
    var r = D.REGIONS.filter(function (x) { return x.id === regionId; })[0];
    return r ? r.scene : 'erdo';
  }

  // ---------- Ikonok ----------
  var I = {
    torch: '<svg viewBox="0 0 26 36" xmlns="http://www.w3.org/2000/svg"><path d="M10 18 H16 L14.5 34 H11.5 Z" fill="#8a5a32"/><path d="M9 16 H17 V19 H9 Z" fill="#5a3a20"/><g class="flame"><path d="M13 2 C18 8 20 12 17 16 H9 C6 12 8 8 13 2 Z" fill="#c4702a"/><path d="M13 6 C16 10 17 12 15 15.5 H11 C9 12 10 10 13 6 Z" fill="#f2b84b"/><path d="M13 9 C14.5 11.5 14.5 13 13.6 15 H12.4 C11.5 13 11.5 11.5 13 9 Z" fill="#ffe2a0"/></g></svg>',
    silver: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="#cfd8ff"/><path d="M10.5 4 A4.5 4.5 0 1 0 10.5 12 A3.5 3.5 0 1 1 10.5 4 Z" fill="#6b74b8"/></svg>',
    dust: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0.5 L10 6 L15.5 8 L10 10 L8 15.5 L6 10 L0.5 8 L6 6 Z" fill="#f2b84b"/><circle cx="8" cy="8" r="2" fill="#ffe2a0"/></svg>',
    xp: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1 L9.8 5.6 L14.7 5.9 L10.9 9 L12.2 13.8 L8 11.1 L3.8 13.8 L5.1 9 L1.3 5.9 L6.2 5.6 Z" fill="#ffe2a0"/></svg>',
    rested: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M11 2 A6 6 0 1 0 14 11 A5 5 0 0 1 11 2 Z" fill="#7ff3ff"/></svg>',
    heart: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21 C5 15 2 12 2 8 A5 5 0 0 1 12 6 A5 5 0 0 1 22 8 C22 12 19 15 12 21 Z" fill="#ff8f8f"/></svg>',
    sword: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#f2c66d" stroke-width="2.2" stroke-linecap="round"><path d="M14 4 L20 4 L20 10 L9 21 L3 15 Z" fill="#f2c66d" fill-opacity="0.25"/><path d="M5 13 L11 19"/></svg>',
    shield: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 L20 5 V11 C20 16 16 20 12 22 C8 20 4 16 4 11 V5 Z" fill="#6fa8ff" fill-opacity="0.3" stroke="#6fa8ff" stroke-width="2"/></svg>',
    wing: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20 C6 10 12 5 21 3 C19 9 16 12 12 13 C14 14 16 14 18 13 C15 18 9 20 3 20 Z" fill="#5fd39a" fill-opacity="0.35" stroke="#5fd39a" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    map: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 6 L9 4 L15 6 L21 4 V18 L15 20 L9 18 L3 20 Z"/><path d="M9 4 V18 M15 6 V20"/></svg>',
    user: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21 C4 16 8 13 12 13 C16 13 20 16 20 21"/></svg>',
    bag: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 8 H19 L18 21 H6 Z"/><path d="M9 8 V6 A3 3 0 0 1 15 6 V8"/></svg>',
    scroll: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3 H17 A2 2 0 0 1 19 5 V19 A2 2 0 0 1 17 21 H8 A2 2 0 0 1 6 19 Z"/><path d="M9 8 H16 M9 12 H16 M9 16 H13"/></svg>',
    gear: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M4.9 4.9 L7 7 M17 17 L19.1 19.1 M4.9 19.1 L7 17 M17 7 L19.1 4.9"/></svg>',
    up: '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 2 L10 8 H2 Z" fill="currentColor"/></svg>',
    down: '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 10 L10 4 H2 Z" fill="currentColor"/></svg>',
    harc: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 4 L14 14 M20 4 L10 14 M6 16 L4 20 M18 16 L20 20 M3 13 L8 18 M21 13 L16 18"/></svg>',
    kutatas: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10" cy="10" r="6"/><path d="M15 15 L21 21"/></svg>',
    esemeny: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2 L14 9 L21 12 L14 15 L12 22 L10 15 L3 12 L10 9 Z"/></svg>',
    back: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5 L8 12 L15 19"/></svg>',
    fegyver: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 3 L21 3 L21 10 L10 21 L3 14 Z"/><path d="M6 12 L12 18"/></svg>',
    pancel: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M8 3 L4 6 L5 11 L7 10 V21 H17 V10 L19 11 L20 6 L16 3 C15 5 9 5 8 3 Z"/></svg>',
    sisak: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 16 C4 8 8 4 12 4 C16 4 20 8 20 16 Z"/><path d="M4 16 H20 V19 H4 Z M12 4 V10"/></svg>',
    gyuru: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="14" r="6"/><path d="M9 6 L12 3 L15 6 L12 8 Z" fill="currentColor"/></svg>',
    amulett: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 3 C6 9 9 11 12 11 C15 11 18 9 19 3"/><path d="M12 11 L16 16 L12 21 L8 16 Z" fill="currentColor" fill-opacity="0.35"/></svg>',
    boss: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 9 L7 3 L10 7 L12 2 L14 7 L17 3 L20 9 C20 15 17 20 12 21 C7 20 4 15 4 9 Z"/><circle cx="9.5" cy="12" r="1.3" fill="currentColor"/><circle cx="14.5" cy="12" r="1.3" fill="currentColor"/></svg>',
    discord: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M19.6 5.4A17 17 0 0 0 15.4 4l-.5 1a15.7 15.7 0 0 0-5.8 0L8.6 4a17 17 0 0 0-4.2 1.4C1.7 9.4 1 13.3 1.3 17.2A17 17 0 0 0 6.5 19.8l1.1-1.8a11 11 0 0 1-1.7-.8l.4-.3a12.2 12.2 0 0 0 11.4 0l.4.3a11 11 0 0 1-1.7.8l1.1 1.8a17 17 0 0 0 5.2-2.6c.4-4.5-.7-8.4-3.1-11.8ZM8.7 14.8c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1Zm6.6 0c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1Z"/></svg>',
    moon: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3 A9 9 0 1 0 21 15 A7 7 0 0 1 16 3 Z" fill="#cfd8ff"/></svg>'
  };
  var LOGO = '<svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#1e2556" stroke="#cfd8ff" stroke-width="1.5"/><path d="M20 7 A9.5 9.5 0 1 0 25 20 A7.5 7.5 0 0 1 20 7 Z" fill="#cfd8ff"/><circle cx="11" cy="11" r="1.3" fill="#ffe2a0"/></svg>';
  var OWL = '<svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="38" rx="20" ry="22" fill="#6b5aa8"/><ellipse cx="32" cy="44" rx="12" ry="14" fill="#c9bdf0"/>' +
    '<path d="M14 22 L18 8 L26 18 Z M50 22 L46 8 L38 18 Z" fill="#6b5aa8"/><circle cx="24" cy="28" r="9" fill="#eef0ff"/><circle cx="40" cy="28" r="9" fill="#eef0ff"/>' +
    '<circle cx="25" cy="29" r="4.5" fill="#1a1f4a"/><circle cx="39" cy="29" r="4.5" fill="#1a1f4a"/><circle cx="26.5" cy="27.5" r="1.5" fill="#fff"/><circle cx="40.5" cy="27.5" r="1.5" fill="#fff"/>' +
    '<path d="M29 35 L32 40 L35 35 Z" fill="#f2b84b"/><path d="M16 26 C16 20 22 17 26 19" stroke="#ffe2a0" stroke-width="1.5" fill="none" opacity="0.6"/>' +
    '<path d="M24 58 L26 54 M30 59 L30 55 M38 58 L36 54" stroke="#f2b84b" stroke-width="2" stroke-linecap="round"/></svg>';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // ---------- új grafika (rig.js, monsters.js, scenes.js) ----------
  // Ha az új rajzolók be vannak töltve, a régi függvények helyett azok rajzolnak. Az állóképek (portrék, kártyák)
  // képként (data-URI) kerülnek a lapra és gyorsítótárba: a teljes képernyő újrarajzolásakor nem kell újra kiszámolni őket.
  // Élő (mozgó) SVG csak ott kell, ahol animálunk: harc, tábor-színpad.
  var NEW = root.NYX.rig && root.NYX.monsters && root.NYX.scenes;
  var IMG_CACHE = new Map();
  function asImg(key, make, cls, alt) {
    var src = IMG_CACHE.get(key);
    if (!src) {
      // Blob-hivatkozás: a lapra csak egy rövid cím kerül, nem a teljes kép szövege (gyorsabb újrarajzolás)
      var svg = make();
      try { src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); }
      catch (e) { src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }
      IMG_CACHE.set(key, src);
      if (IMG_CACHE.size > 160) { var old = IMG_CACHE.keys().next().value, u = IMG_CACHE.get(old); IMG_CACHE.delete(old); if (/^blob:/.test(u)) setTimeout(function () { URL.revokeObjectURL(u); }, 5000); }
    }
    return '<img class="' + cls + '" src="' + src + '" alt="' + esc(alt || '') + '" draggable="false">';
  }
  function rigOf(hero) {
    var G = root.NYX.game;
    try { return G && G.migrateLook ? G.migrateLook(hero) : (hero.rig || {}); }
    catch (e) { return G && G.cleanRig ? G.cleanRig(null, hero && hero.classId) : {}; }
  }
  function regionOfScene(sceneId) {
    if (root.NYX.scenes.SC[sceneId]) return sceneId;
    var r = D.REGIONS.filter(function (x) { return x.scene === sceneId; })[0];
    return r ? r.id : (sceneId === 'tabor' ? 'tabor' : 'holdfeny');
  }
  var oldHero = heroSvg, oldMonster = monsterSvg, oldScene = sceneSvg;
  if (NEW) {
    // opts.live: mozgó SVG (harc, színpad); opts.full: egész alak (különben mellkép)
    heroSvg = function (hero, opts) {
      opts = opts || {};
      var h = { name: hero.name, classId: hero.classId, rig: rigOf(hero) };
      var ro = opts.full ? { yaw: opts.yaw || 0 } : { bust: true, yaw: opts.yaw || 0 };
      if (opts.live) return root.NYX.rig.hero(h, ro);
      return asImg('h|' + h.classId + '|' + JSON.stringify(h.rig) + '|' + JSON.stringify(ro), function () { return root.NYX.rig.hero(h, ro); }, 'art-img hero-img', hero.name);
    };
    // a harmadik paraméter: régen „őrző vagy főellenfél” igaz/hamis volt; most { guard, boss, live } is lehet
    monsterSvg = function (name, regionId, tier) {
      var o = typeof tier === 'object' && tier ? tier : { guard: !!tier };
      var mo = { guard: !!o.guard && !o.boss, boss: !!o.boss };
      if (o.live) return root.NYX.monsters.monster(name, regionId, mo);
      return asImg('m|' + name + '|' + regionId + '|' + mo.guard + mo.boss, function () { return root.NYX.monsters.monster(name, regionId, mo); }, 'art-img mon-img', name);
    };
    // opts.live: rétegzett, mozgó táj; különben egyetlen állókép
    sceneSvg = function (sceneId, seed, opts) {
      opts = opts || {};
      var reg = regionOfScene(sceneId);
      if (opts.live) return '<div class="scene-stack">' + root.NYX.scenes.scene(reg, { seed: seed || 7, narrow: !!opts.narrow }) + '</div>';
      return asImg('s|' + reg + '|' + seed + '|' + !!opts.narrow, function () { return root.NYX.scenes.scene(reg, { seed: seed || 7, single: true, narrow: !!opts.narrow }); }, 'art-img scene-img', '');
    };
  }

  root.NYX.art = {
    heroSvg: heroSvg, monsterSvg: monsterSvg, sceneSvg: sceneSvg, regionScene: regionScene, icons: I, LOGO: LOGO, OWL: OWL,
    EYE_COLORS: EYE_COLORS, HAIR_STYLES: HAIR_STYLES, MARKS: MARKS, OUTFITS: OUTFITS, CLASS_OUTFIT: CLASS_OUTFIT,
    defaultLook: defaultLook, esc: esc, hash: hash, isNew: !!NEW, regionOfScene: NEW ? regionOfScene : null
  };
})(typeof window !== 'undefined' ? window : globalThis);
