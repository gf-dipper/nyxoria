/* Nyxoria RPG – hang. Minden hangot a böngésző állít elő (WebAudio), nincs letöltendő hangfájl.
   Hatások: rövid, halk jelzések a harchoz és a felülethez. Zene: lassú, holdfényes háttér (alapból kikapcsolva).
   A beállítás eszközönként tárolódik (localStorage), mert a hangerő a géptől függ, nem a hőstől. */
(function (root) {
  'use strict';
  var KEY = 'nyx-sound', AC = root.AudioContext || root.webkitAudioContext;
  var cfg = { fx: true, music: false, vol: 0.6 };
  try { var raw = JSON.parse(root.localStorage.getItem(KEY) || 'null'); if (raw && typeof raw === 'object') { cfg.fx = raw.fx !== false; cfg.music = !!raw.music; if (typeof raw.vol === 'number' && raw.vol >= 0 && raw.vol <= 1) cfg.vol = raw.vol; } } catch (e) { /* privát mód */ }
  var ctx = null, master = null, fxBus = null, musBus = null, noiseBuf = null, musTimer = null, musNodes = [], lastAt = {}, unlocked = false;

  function save() { try { root.localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) { /* privát mód */ } }
  function ensure() {
    if (ctx || !AC) return !!ctx;
    try {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = cfg.vol; master.connect(ctx.destination);
      fxBus = ctx.createGain(); fxBus.gain.value = 0.5; fxBus.connect(master);
      musBus = ctx.createGain(); musBus.gain.value = 0; musBus.connect(master);
      var n = Math.floor(ctx.sampleRate * 0.6); noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ctx = null; }
    return !!ctx;
  }
  // a böngészők csak felhasználói mozdulat után engednek hangot: az első kattintás/érintés oldja fel
  function unlock() {
    if (unlocked || !AC) return;
    if (!cfg.fx && !cfg.music) return;
    if (!ensure()) return;
    unlocked = true;
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume().catch(function () {});
    if (cfg.music) startMusic();
  }
  function ready() { return !!(ctx && unlocked && ctx.state !== 'closed'); }

  // ---------- építőkockák ----------
  function tone(o) { // { f, f2, type, t, dur, vol, attack }
    var t0 = ctx.currentTime + (o.t || 0), osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t0 + o.dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t0 + (o.attack || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    osc.connect(g); g.connect(o.bus || fxBus); osc.start(t0); osc.stop(t0 + o.dur + 0.03);
  }
  function noise(o) { // { t, dur, vol, freq, q, type, f2 }
    var t0 = ctx.currentTime + (o.t || 0), src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf; f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.freq || 1200, t0); f.Q.value = o.q || 0.8;
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t0 + o.dur);
    g.gain.setValueAtTime(o.vol || 0.2, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    src.connect(f); f.connect(g); g.connect(fxBus); src.start(t0); src.stop(t0 + o.dur + 0.03);
  }
  function seq(notes, type, step, dur, vol) { notes.forEach(function (f, i) { if (f) tone({ f: f, type: type, t: i * step, dur: dur, vol: vol }); }); }

  var FX = {
    click: function () { tone({ f: 660, f2: 520, type: 'triangle', dur: 0.045, vol: 0.07 }); },
    tab: function () { tone({ f: 520, f2: 600, type: 'sine', dur: 0.05, vol: 0.06 }); },
    hit: function () { noise({ dur: 0.11, vol: 0.32, freq: 900, f2: 300, q: 0.7 }); tone({ f: 150, f2: 60, type: 'sine', dur: 0.12, vol: 0.3 }); },
    crit: function () { noise({ dur: 0.16, vol: 0.4, freq: 1800, f2: 400, q: 0.6 }); tone({ f: 190, f2: 55, type: 'sine', dur: 0.18, vol: 0.36 }); tone({ f: 1320, f2: 880, type: 'triangle', t: 0.02, dur: 0.14, vol: 0.1 }); },
    hurt: function () { noise({ dur: 0.13, vol: 0.26, freq: 500, f2: 180, q: 0.9 }); tone({ f: 110, f2: 70, type: 'triangle', dur: 0.15, vol: 0.24 }); },
    dodge: function () { noise({ dur: 0.16, vol: 0.12, freq: 2400, f2: 5200, q: 1.4 }); },
    skill: function () { noise({ dur: 0.22, vol: 0.12, freq: 600, f2: 3200, q: 1.1 }); tone({ f: 330, f2: 660, type: 'sine', dur: 0.2, vol: 0.09 }); },
    heal: function () { seq([523, 659, 784], 'sine', 0.07, 0.22, 0.11); },
    shield: function () { tone({ f: 392, type: 'triangle', dur: 0.26, vol: 0.1 }); tone({ f: 587, type: 'sine', t: 0.03, dur: 0.26, vol: 0.08 }); },
    stun: function () { tone({ f: 880, f2: 440, type: 'square', dur: 0.12, vol: 0.05 }); tone({ f: 660, f2: 330, type: 'square', t: 0.09, dur: 0.12, vol: 0.05 }); },
    poison: function () { noise({ dur: 0.18, vol: 0.1, freq: 3000, f2: 1400, q: 2 }); },
    win: function () { seq([523, 659, 784, 1047], 'triangle', 0.1, 0.34, 0.16); tone({ f: 262, type: 'sine', t: 0.3, dur: 0.6, vol: 0.12 }); },
    lose: function () { seq([392, 349, 294, 220], 'triangle', 0.14, 0.4, 0.13); },
    level: function () { seq([392, 523, 659, 784, 1047, 1319], 'triangle', 0.085, 0.36, 0.16); tone({ f: 196, type: 'sine', t: 0.1, dur: 0.9, vol: 0.14 }); },
    loot: function () { seq([988, 1319, 1568, 1976], 'sine', 0.055, 0.3, 0.1); },
    coin: function () { tone({ f: 1244, type: 'square', dur: 0.05, vol: 0.05 }); tone({ f: 1661, type: 'square', t: 0.05, dur: 0.12, vol: 0.05 }); },
    upgrade: function () { seq([440, 554, 659, 880], 'triangle', 0.06, 0.24, 0.13); noise({ t: 0.2, dur: 0.25, vol: 0.06, freq: 5000, q: 2 }); },
    error: function () { tone({ f: 196, f2: 147, type: 'sawtooth', dur: 0.16, vol: 0.07 }); }
  };
  function play(name) {
    if (!cfg.fx || !ready() || !FX[name]) return;
    var now = ctx.currentTime;
    if (lastAt[name] != null && now - lastAt[name] < 0.04) return; // ugyanaz a hang nem torlódhat
    lastAt[name] = now;
    try { FX[name](); } catch (e) { /* a hang hibája sosem akaszthatja meg a játékot */ }
  }

  // ---------- háttérzene: lassan lélegző akkord + ritka, halk harangok (pentaton) ----------
  var CHORDS = [[110, 164.81, 196, 246.94], [98, 146.83, 196, 220], [87.31, 130.81, 174.61, 220], [98, 146.83, 185, 246.94]];
  var BELLS = [440, 493.88, 587.33, 659.25, 783.99, 880, 987.77];
  function startMusic() {
    if (!cfg.music || !ready() || musTimer) return;
    musBus.gain.cancelScheduledValues(ctx.currentTime); musBus.gain.setTargetAtTime(0.16, ctx.currentTime, 1.5);
    var bar = 0;
    function chord() {
      if (!cfg.music || !ready()) return;
      var notes = CHORDS[bar % CHORDS.length], t0 = ctx.currentTime, len = 9;
      notes.forEach(function (f, i) {
        [0, 1].forEach(function (k) {
          var osc = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
          osc.type = i === 0 ? 'sine' : 'triangle'; osc.frequency.value = f * (k ? 1.004 : 0.997);
          lp.type = 'lowpass'; lp.frequency.value = 900;
          g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(i === 0 ? 0.22 : 0.09, t0 + 3); g.gain.linearRampToValueAtTime(0.0001, t0 + len + 2.5);
          osc.connect(lp); lp.connect(g); g.connect(musBus); osc.start(t0); osc.stop(t0 + len + 2.8);
          musNodes.push(osc); osc.onended = function () { var j = musNodes.indexOf(osc); if (j >= 0) musNodes.splice(j, 1); };
        });
      });
      var n = 2 + Math.floor(Math.random() * 3);
      for (var b = 0; b < n; b++) tone({ f: BELLS[Math.floor(Math.random() * BELLS.length)], type: 'sine', t: 1 + Math.random() * (len - 2), dur: 2.4, vol: 0.05, attack: 0.02, bus: musBus });
      bar++;
    }
    function safe() { try { chord(); } catch (e) { /* a zene hibája sosem akaszthatja meg a játékot */ } }
    safe(); musTimer = root.setInterval(safe, 9000);
  }
  function stopMusic() {
    if (musTimer) { root.clearInterval(musTimer); musTimer = null; }
    if (ctx && musBus) { musBus.gain.cancelScheduledValues(ctx.currentTime); musBus.gain.setTargetAtTime(0, ctx.currentTime, 0.4); }
    var old = musNodes.slice(); musNodes = [];
    root.setTimeout(function () { old.forEach(function (o) { try { o.stop(); } catch (e) { /* már leállt */ } }); }, 1500);
  }
  // háttérbe tett lapon a zene elhallgat (telefonon ne szóljon a zsebben)
  if (root.document) root.document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (root.document.hidden) { stopMusic(); if (ctx.suspend) ctx.suspend().catch(function () {}); }
    else { if (ctx.resume) ctx.resume().catch(function () {}); if (cfg.music && unlocked) root.setTimeout(startMusic, 300); }
  });

  root.NYX = root.NYX || {};
  root.NYX.sound = {
    supported: !!AC,
    get: function () { return { fx: cfg.fx, music: cfg.music, vol: cfg.vol }; },
    setFx: function (on) { cfg.fx = !!on; save(); if (on) { unlocked = false; unlock(); play('tab'); } },
    setMusic: function (on) { cfg.music = !!on; save(); if (on) { unlocked = false; unlock(); startMusic(); } else stopMusic(); },
    setVol: function (v) { cfg.vol = Math.max(0, Math.min(1, +v || 0)); save(); if (master) master.gain.setTargetAtTime(cfg.vol, ctx.currentTime, 0.05); },
    play: play, unlock: unlock
  };
})(typeof window !== 'undefined' ? window : globalThis);
