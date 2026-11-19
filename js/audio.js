/* Cake Dash — synthesised sound effects + music (Web Audio, no files to load) */
(function () {
  'use strict';
  var CD = window.CD;

  var ctx = null, master = null, sfxBus = null, musicBus = null;
  var muted = !!CD.store.get('muted', false);
  var musicTimer = null, nextTime = 0, step = 0;

  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  function unlock() {
    try {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : 0.9;
        master.connect(ctx.destination);
        sfxBus = ctx.createGain();
        sfxBus.gain.value = 0.55;
        sfxBus.connect(master);
        musicBus = ctx.createGain();
        musicBus.gain.value = 0.16;
        musicBus.connect(master);
        // iOS: play a silent buffer inside the gesture to fully unlock output
        var b = ctx.createBuffer(1, 1, 22050);
        var s = ctx.createBufferSource();
        s.buffer = b;
        s.connect(ctx.destination);
        s.start(0);
      }
      if (ctx.state === 'suspended') ctx.resume();
      startMusic();
    } catch (e) { /* audio is optional */ }
  }

  // One enveloped oscillator note
  function tone(freq, dur, opt) {
    if (!ctx || muted) return;
    opt = opt || {};
    var t = (opt.when || ctx.currentTime) + (opt.delay || 0);
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = opt.type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (opt.slide) o.frequency.exponentialRampToValueAtTime(opt.slide, t + dur);
    var vol = opt.vol == null ? 0.4 : opt.vol;
    var atk = opt.attack || 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(opt.bus || sfxBus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noise(dur, vol, freq) {
    if (!ctx || muted) return;
    var len = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var s = ctx.createBufferSource();
    s.buffer = buf;
    var f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq || 1200;
    var g = ctx.createGain();
    g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(sfxBus);
    s.start();
  }

  var sfx = {
    flap: function () {
      tone(520, 0.13, { type: 'sine', slide: 980, vol: 0.32 });
      tone(1040, 0.08, { type: 'triangle', vol: 0.08, delay: 0.02 });
    },
    jump: function () {
      tone(330, 0.18, { type: 'triangle', slide: 760, vol: 0.4 });
      tone(660, 0.12, { type: 'sine', slide: 1200, vol: 0.12, delay: 0.03 });
    },
    land: function () { tone(190, 0.09, { type: 'sine', slide: 90, vol: 0.25 }); },
    collect: function () {
      tone(1319, 0.12, { type: 'sine', vol: 0.3 });
      tone(1976, 0.2, { type: 'sine', vol: 0.25, delay: 0.07 });
      tone(2637, 0.15, { type: 'triangle', vol: 0.08, delay: 0.12 });
    },
    pass: function () {
      tone(880, 0.1, { type: 'triangle', vol: 0.3 });
      tone(1320, 0.18, { type: 'triangle', vol: 0.3, delay: 0.08 });
    },
    hit: function () {
      noise(0.25, 0.5, 900);
      tone(360, 0.45, { type: 'square', slide: 70, vol: 0.18 });
      tone(140, 0.3, { type: 'sine', slide: 50, vol: 0.5 });
    },
    fall: function () { tone(700, 0.7, { type: 'triangle', slide: 120, vol: 0.3 }); },
    levelComplete: function () {
      var n = [72, 76, 79, 84, 79, 84, 88];
      for (var i = 0; i < n.length; i++) tone(midi(n[i]), i === n.length - 1 ? 0.6 : 0.16, { type: 'triangle', vol: 0.32, delay: i * 0.1 });
      tone(midi(60), 0.8, { type: 'sine', vol: 0.25, delay: 0.6 });
    },
    victory: function () {
      var n = [67, 72, 76, 79, 76, 79, 84, 84, 88, 91];
      var d = [0, 0.12, 0.24, 0.36, 0.52, 0.64, 0.8, 1.0, 1.12, 1.28];
      for (var i = 0; i < n.length; i++) tone(midi(n[i]), i === n.length - 1 ? 0.9 : 0.18, { type: 'triangle', vol: 0.32, delay: d[i] });
      tone(midi(48), 1.2, { type: 'sine', vol: 0.3, delay: 1.0 });
      tone(midi(55), 1.2, { type: 'sine', vol: 0.2, delay: 1.0 });
    },
    click: function () { tone(1200, 0.06, { type: 'sine', vol: 0.2 }); },
    gameOver: function () {
      var n = [76, 72, 67, 64];
      for (var i = 0; i < n.length; i++) tone(midi(n[i]), 0.25, { type: 'triangle', vol: 0.25, delay: 0.35 + i * 0.16 });
    }
  };

  // --- Background music: a little music-box loop ---
  var MEL = [72, 76, 79, 76, 77, 81, 79, 0, 76, 79, 84, 79, 81, 79, 76, 0,
    74, 77, 81, 77, 79, 77, 74, 71, 72, 76, 79, 84, 79, 0, 72, 0];
  var BASS = [48, 48, 53, 53, 48, 48, 45, 45, 50, 50, 55, 55, 48, 55, 48, 0];
  var STEP = 60 / 138 / 2; // eighth notes at 138 bpm

  function schedule() {
    if (!ctx) return;
    while (nextTime < ctx.currentTime + 0.15) {
      if (!muted) {
        var m = MEL[step % MEL.length];
        if (m) {
          tone(midi(m), STEP * 1.6, { type: 'sine', vol: 0.5, when: nextTime, bus: musicBus });
          tone(midi(m + 12), STEP * 0.9, { type: 'triangle', vol: 0.08, when: nextTime, bus: musicBus });
        }
        if (step % 2 === 0) {
          var b = BASS[(step / 2) % BASS.length];
          if (b) tone(midi(b), STEP * 1.8, { type: 'triangle', vol: 0.35, when: nextTime, bus: musicBus });
        }
      }
      nextTime += STEP;
      step++;
    }
  }

  function startMusic() {
    if (!ctx || musicTimer) return;
    nextTime = ctx.currentTime + 0.1;
    musicTimer = setInterval(schedule, 40);
  }

  function setMuted(m) {
    muted = !!m;
    CD.store.set('muted', muted);
    if (master) master.gain.setValueAtTime(muted ? 0 : 0.9, ctx.currentTime);
  }

  CD.Audio = {
    unlock: unlock,
    play: function (name) { try { if (sfx[name]) sfx[name](); } catch (e) { /* ignore */ } },
    isMuted: function () { return muted; },
    setMuted: setMuted,
    toggle: function () { setMuted(!muted); return muted; },
    suspend: function () { try { if (ctx && ctx.state === 'running') ctx.suspend(); } catch (e) { /* ignore */ } },
    resume: function () { try { if (ctx && ctx.state === 'suspended') ctx.resume(); if (ctx) nextTime = Math.max(nextTime, ctx.currentTime + 0.05); } catch (e) { /* ignore */ } }
  };
})();
