/* Cake Dash — game loop, state machine, menus, input */
(function () {
  'use strict';
  var CD = window.CD;
  CD.FONT = 'ui-rounded, "SF Pro Rounded", "Arial Rounded MT Bold", "Nunito", system-ui, -apple-system, sans-serif';

  var $ = function (id) { return document.getElementById(id); };
  var canvas = $('game'), ctx = canvas.getContext('2d');
  var wrap = $('wrap');
  var STEP = 1 / 120;      // fixed physics step (same speed on 60Hz and 120Hz screens)
  CD.Sprites.build();

  var game = {
    scene: 'menu',          // menu | level | gameover | victory
    level: null,
    levelNum: 1,
    score: 0,
    berries: 0,
    particles: new CD.Particles(),
    wallet: Math.max(0, CD.store.get('points', 0) | 0),          // points to spend in the shop
    owned: CD.store.get('owned', ['shortcake']),
    skinId: CD.store.get('skin', 'shortcake'),
    best: { 1: CD.store.get('best1', 0) | 0, 2: CD.store.get('best2', 0) | 0 },
    shakeT: 0, shakeMag: 0,
    fade: null,             // { t, dur, mid, done }
    paused: false,
    lockH: false,
    menuT: 0,
    menuCake: { y: 0, arm: 0 },
    menuBg: null
  };
  window.__cake = game; // debug / test handle
  if (!Array.isArray(game.owned)) game.owned = ['shortcake'];
  if (game.owned.indexOf(game.skinId) < 0) game.skinId = 'shortcake';
  game.skin = CD.skinById(game.skinId);
  CD.Sprites.useSkin(game.skin);

  // ---------------- layout ----------------
  var probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;' +
    'padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);';
  document.body.appendChild(probe);

  function resize() {
    var vw = window.innerWidth, vh = window.innerHeight;
    if (!game.lockH) CD.H = Math.round(CD.clamp(CD.W * vh / vw, 600, 780));
    var W = CD.W, H = CD.H;
    var scale = Math.min(vw / W, vh / H);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    wrap.style.width = W + 'px';
    wrap.style.height = H + 'px';
    wrap.style.transform = 'translate(' + ((vw - W * scale) / 2) + 'px,' + ((vh - H * scale) / 2) + 'px) scale(' + scale + ')';
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = Math.round(W * scale * dpr);
    canvas.height = Math.round(H * scale * dpr);
    CD.view.k = canvas.width / W;
    var cs = getComputedStyle(probe);
    var sat = parseFloat(cs.paddingTop) || 0, sab = parseFloat(cs.paddingBottom) || 0;
    // safe-area insets only matter when the game reaches the screen edge
    var gapTop = (vh - H * scale) / 2;
    wrap.style.setProperty('--sat', Math.max(0, sat - gapTop) / scale + 'px');
    wrap.style.setProperty('--sab', Math.max(0, sab - gapTop) / scale + 'px');
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', function () { setTimeout(resize, 200); });
  resize();

  // ---------------- UI helpers ----------------
  var overlays = ['menu', 'hud', 'shop', 'gameOver', 'victory', 'paused'];
  function show(ids) {
    for (var i = 0; i < overlays.length; i++) $(overlays[i]).classList.toggle('hidden', ids.indexOf(overlays[i]) < 0);
  }

  function refreshSoundLabels() {
    var m = CD.Audio.isMuted();
    $('btnSound').textContent = m ? '🔇' : '🔊';
    $('hudMute').textContent = m ? '🔇' : '🔊';
  }

  function cheapestNew() {
    var c = null;
    for (var i = 0; i < CD.SKINS.length; i++) {
      var sk = CD.SKINS[i];
      if (game.owned.indexOf(sk.id) < 0 && (!c || sk.price < c.price)) c = sk;
    }
    return c;
  }

  function refreshMenu() {
    $('menuPoints').textContent = '⭐ ' + game.wallet + (game.wallet === 1 ? ' point' : ' points');
    var b = [];
    if (game.best[1]) b.push('Fly best: ' + game.best[1]);
    if (game.best[2]) b.push('Run best: ' + game.best[2]);
    $('menuBest').textContent = b.join('  ·  ');
    var nx = cheapestNew();
    $('shopBadge').classList.toggle('hidden', !(nx && game.wallet >= nx.price));
    refreshSoundLabels();
  }

  var lastScoreTxt = '', lastBerryTxt = '', lastProg = '';
  function refreshHud(force) {
    var s = String(game.score), b = String(game.berries);
    if (force || s !== lastScoreTxt) { $('scoreVal').textContent = s; lastScoreTxt = s; }
    if (force || b !== lastBerryTxt) { $('berryVal').textContent = b; lastBerryTxt = b; }
    var L = game.level;
    if (!L) return;
    var prog = $('hudProgress');
    if (L.num === 1) {
      var key = 'p' + L.passed;
      if (force || key !== lastProg) {
        prog.innerHTML = '<span class="hud-count">🍭 ' + L.passed + (L.passed === 1 ? ' pipe' : ' pipes') + '</span>';
        lastProg = key;
      }
    } else {
      if (force || lastProg.charAt(0) !== 'b') { prog.innerHTML = '<div class="bar"><i></i></div>'; lastProg = 'b'; }
      prog.firstChild.firstChild.style.width = Math.round(L.progress() * 100) + '%';
    }
  }

  function setStars(container, n) {
    var spans = container.querySelectorAll('.stars span');
    for (var i = 0; i < spans.length; i++) spans[i].classList.toggle('off', i >= n);
  }

  function saveBest() {
    var n = game.levelNum;
    if (game.score > game.best[n]) { game.best[n] = game.score; CD.store.set('best' + n, game.score); return true; }
    return false;
  }

  // Put this run's score into the points bank; returns a hint if a new cake became affordable
  function bankPoints() {
    var before = game.wallet;
    game.wallet += game.score;
    CD.store.set('points', game.wallet);
    var nx = cheapestNew();
    if (nx && before < nx.price && game.wallet >= nx.price) return 'You can buy ' + nx.name + ' now! 🎂';
    if (nx) return (nx.price - game.wallet) + ' more points for ' + nx.name;
    return '';
  }

  function showEndCard(prefix) {
    var isBest = saveBest();
    var hint = bankPoints();
    $(prefix + 'BestPts').textContent = '+' + game.score + ' ⭐  (you have ' + game.wallet + ')';
    $(prefix + 'Best').textContent = isBest && game.score > 0 ? '🎉 New best score!' : (game.best[game.levelNum] ? 'Best: ' + game.best[game.levelNum] : '');
    var u = $(prefix + 'BestUnlock');
    u.textContent = hint;
    u.classList.toggle('hidden', !hint);
  }

  var toastTimer = null;
  game.toast = function (text) {
    var el = $('toast');
    el.textContent = text;
    el.classList.remove('hidden');
    el.style.animation = 'none';
    void el.offsetWidth; // restart the animation
    el.style.animation = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.add('hidden'); }, 1800);
  };

  // ---------------- game API used by levels ----------------
  game.addScore = function (n) { game.score += n; refreshHud(); };
  game.addBerry = function () { game.berries++; game.score += 1; refreshHud(); };
  game.onProgress = function () { refreshHud(); };
  game.shake = function (t, mag) { game.shakeT = t; game.shakeMag = mag; };

  game.onDead = function () {
    game.scene = 'gameover';
    $('goScore').textContent = game.score;
    showEndCard('go');
    $('btnRetry').textContent = game.levelNum === 1 ? '↻ FLY AGAIN' : '↻ RUN AGAIN';
    CD.Audio.play('gameOver');
    show(['gameOver']);
  };

  game.onVictory = function () {
    game.scene = 'victory';
    var L = game.level;
    var stars = 1 + (L.collected >= Math.ceil(L.totalBerries / 2) ? 1 : 0) + (L.collected >= L.totalBerries - 1 ? 1 : 0);
    setStars($('victory'), stars);
    $('vScore').textContent = game.score;
    showEndCard('v');
    show(['victory']);
  };

  game.drawHint = function (ctx, big, small, y) {
    var t = performance.now() / 1000;
    var W = CD.W;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var s = 1 + Math.sin(t * 5) * 0.05;
    ctx.translate(W / 2, y);
    ctx.scale(s, s);
    ctx.font = '900 30px ' + CD.FONT;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#fff';
    ctx.strokeText(big, 0, 0);
    ctx.fillStyle = '#ff6fae';
    ctx.fillText(big, 0, 0);
    ctx.restore();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 16px ' + CD.FONT;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#fff';
    ctx.strokeText(small, W / 2, y + 30);
    ctx.fillStyle = '#7c55d6';
    ctx.fillText(small, W / 2, y + 30);
    // tapping finger
    var fy = y + 66 + Math.abs(Math.sin(t * 4)) * -8;
    ctx.font = '30px ' + CD.FONT;
    ctx.fillText('👆', W / 2, fy);
    ctx.restore();
  };

  // ---------------- flow ----------------
  function startFade(mid) {
    game.fade = { t: 0, dur: 0.45, mid: mid, done: false };
  }

  function startLevel(n) {
    game.lockH = true;
    resize();
    game.levelNum = n;
    game.particles.clear();
    game.score = 0;
    game.berries = 0;
    game.level = n === 1 ? new CD.Level1(game) : new CD.Level2(game);
    game.scene = 'level';
    game.paused = false;
    $('hudLevel').textContent = n === 1 ? 'LEVEL 1 · FLY' : 'LEVEL 2 · RUN';
    $('toast').classList.add('hidden');
    show(['hud']);
    refreshHud(true);
  }

  function retry() { startLevel(game.levelNum); }

  // ---------------- character shop ----------------
  function openShop() {
    game.scene = 'shop';
    game.level = null;
    game.lockH = false;
    if (!game.menuBg) game.menuBg = new CD.Background('sky');
    renderShop();
    show(['shop']);
  }

  function renderShop() {
    $('shopPoints').textContent = '⭐ ' + game.wallet;
    var grid = $('shopGrid');
    grid.innerHTML = '';
    CD.SKINS.forEach(function (sk) {
      var owned = game.owned.indexOf(sk.id) >= 0, chosen = game.skinId === sk.id;
      var card = document.createElement('div');
      card.className = 'cake-card' + (chosen ? ' selected' : '');
      var cv = document.createElement('canvas');
      var k = 2 * Math.min(window.devicePixelRatio || 1, 2);
      cv.width = 72 * k; cv.height = 72 * k;
      var c2 = cv.getContext('2d');
      c2.scale(k, k);
      CD.drawCake(c2, 36, 41, 34, { skin: sk, legs: 'stand', arms: 'rest', face: chosen ? 'joy' : 'happy', t: 1 });
      var nm = document.createElement('div');
      nm.className = 'nm';
      nm.textContent = sk.name;
      var b = document.createElement('button');
      if (chosen) { b.className = 'btn chosen'; b.textContent = '✓ PLAYING'; }
      else if (owned) { b.className = 'btn mint'; b.textContent = 'CHOOSE'; }
      else if (game.wallet >= sk.price) { b.className = 'btn pink'; b.textContent = 'BUY ⭐' + sk.price; }
      else { b.className = 'btn locked'; b.textContent = '🔒 ⭐' + sk.price; }
      b.addEventListener('click', function (e) {
        e.preventDefault();
        CD.Audio.unlock();
        if (chosen) return;
        if (!owned) {
          if (game.wallet < sk.price) {
            CD.Audio.play('land');
            b.textContent = 'Need ' + (sk.price - game.wallet) + ' ⭐';
            return;
          }
          game.wallet -= sk.price;
          game.owned.push(sk.id);
          CD.store.set('points', game.wallet);
          CD.store.set('owned', game.owned);
          CD.Audio.play('levelComplete');
        } else {
          CD.Audio.play('click');
        }
        selectSkin(sk.id);
        renderShop();
      });
      card.appendChild(cv); card.appendChild(nm); card.appendChild(b);
      grid.appendChild(card);
    });
  }

  function selectSkin(id) {
    game.skinId = id;
    game.skin = CD.skinById(id);
    CD.Sprites.useSkin(game.skin);
    CD.store.set('skin', id);
  }
  game.selectSkin = selectSkin;

  function toMenu() {
    game.scene = 'menu';
    game.level = null;
    game.paused = false;
    game.particles.clear();
    game.lockH = false;
    resize();
    game.menuBg = new CD.Background('sky');
    refreshMenu();
    show(['menu']);
  }

  // ---------------- input ----------------
  function action() {
    CD.Audio.unlock();
    if (game.paused) return;
    if (game.scene === 'level' && game.level && !game.fade) game.level.input();
  }

  function isUi(target) { return target && target.closest && target.closest('button, .card, .shop-panel'); }

  window.addEventListener('pointerdown', function (e) {
    CD.Audio.unlock();
    if (isUi(e.target)) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    action();
  }, { passive: false });

  // iOS Safari only unlocks audio on touchend / pointerup gestures
  window.addEventListener('touchend', function () { CD.Audio.unlock(); }, { passive: true });
  window.addEventListener('pointerup', function () { CD.Audio.unlock(); });

  // stop iOS scrolling, rubber-banding, double-tap zoom and pinch zoom (the shop list may scroll)
  document.addEventListener('touchstart', function (e) {
    if (!isUi(e.target)) e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchmove', function (e) {
    if (e.target && e.target.closest && e.target.closest('.shop-grid')) return;
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  var keyDown = {};
  window.addEventListener('keydown', function (e) {
    var k = e.code || e.key;
    var isAction = k === 'Space' || k === ' ' || k === 'ArrowUp' || k === 'KeyW' || k === 'Enter';
    if (!isAction) return;
    e.preventDefault();
    if (e.repeat || keyDown[k]) return; // holding a key never repeats the flap/jump
    keyDown[k] = true;
    CD.Audio.unlock();
    if (game.scene === 'menu') { CD.Audio.play('click'); startLevel(1); return; }
    if (game.scene === 'shop') return;
    if (game.paused) { resume(); return; }
    if ((game.scene === 'gameover') && game.level && game.level.phaseT > 0.4) { retry(); return; }
    action();
  });
  window.addEventListener('keyup', function (e) { keyDown[e.code || e.key] = false; });
  window.addEventListener('blur', function () { keyDown = {}; });

  function bind(id, fn) {
    $(id).addEventListener('click', function (e) {
      e.preventDefault();
      CD.Audio.unlock();
      CD.Audio.play('click');
      fn(e);
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });
  }
  bind('btnL1', function () { startLevel(1); });
  bind('btnL2', function () { startLevel(2); });
  bind('btnShop', openShop);
  bind('btnShop1', openShop);
  bind('btnShop2', openShop);
  bind('btnShopBack', toMenu);
  bind('btnSound', function () { CD.Audio.toggle(); refreshSoundLabels(); });
  bind('hudMute', function () { CD.Audio.toggle(); refreshSoundLabels(); });
  bind('btnRetry', retry);
  bind('btnAgain', function () { startLevel(2); });
  bind('btnMenu1', toMenu);
  bind('btnMenu2', toMenu);
  bind('btnResume', function () { resume(); });

  // ---------------- pause on tab switch / app background ----------------
  function resume() {
    game.paused = false;
    show(game.scene === 'level' ? ['hud'] : []);
    last = performance.now();
    CD.Audio.resume();
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      CD.Audio.suspend();
      var L = game.level;
      if (game.scene === 'level' && L && (L.phase === 'play')) {
        game.paused = true;
        show(['hud', 'paused']);
      }
    } else {
      if (!game.paused) CD.Audio.resume();
      last = performance.now();
    }
  });

  // ---------------- loop ----------------
  function updateMenu(dt) {
    game.menuT += dt;
    if (!game.menuBg) game.menuBg = new CD.Background('sky');
    game.menuBg.update(dt, 50);
    var c = game.menuCake;
    c.y = CD.H * 0.47 + Math.sin(game.menuT * 2.4) * 12;
    c.arm += dt * 14;
    game.menuTrail = (game.menuTrail || 0) + dt * 30;
    while (game.menuTrail > 1) {
      game.menuTrail -= 1;
      game.particles.trail(CD.W / 2 - 34, c.y + 2, 18, -70);
    }
  }

  function drawMenu() {
    game.menuBg.draw(ctx);
    game.particles.draw(ctx);
    CD.resetTransform(ctx);
    var c = game.menuCake;
    CD.drawCake(ctx, CD.W / 2, c.y, 72, {
      rot: Math.sin(game.menuT * 2.4) * 0.08, t: game.menuT, legs: 'dangle', legPhase: game.menuT * 4,
      arms: 'flap', armPhase: c.arm, face: Math.sin(game.menuT * 0.7) > 0.85 ? 'joy' : 'happy', skin: game.skin,
      sx: 1 + Math.sin(game.menuT * 4.8) * 0.03, sy: 1 - Math.sin(game.menuT * 4.8) * 0.03
    });
  }

  function step(dt) {
    if (game.paused) return;
    if (game.fade) {
      var f = game.fade;
      f.t += dt;
      if (!f.done && f.t >= f.dur) { f.done = true; if (f.mid) f.mid(); }
      if (f.t >= f.dur * 2) game.fade = null;
    }
    if (game.scene === 'menu' || game.scene === 'shop') updateMenu(dt);
    else if (game.level) game.level.update(dt);
    game.particles.update(dt);
    if (game.shakeT > 0) game.shakeT -= dt;
  }

  function render() {
    // base transform + screen shake
    CD.view.ox = 0; CD.view.oy = 0;
    if (game.shakeT > 0) {
      var m = game.shakeMag * Math.min(1, game.shakeT / 0.2);
      CD.view.ox = CD.rand(-m, m); CD.view.oy = CD.rand(-m, m);
    }
    CD.resetTransform(ctx);
    ctx.globalAlpha = 1;
    if (game.scene === 'menu' || game.scene === 'shop') drawMenu();
    else if (game.level) game.level.draw(ctx);
    CD.view.ox = 0; CD.view.oy = 0;
    CD.resetTransform(ctx);
    if (game.fade) {
      var f = game.fade;
      var a = f.t < f.dur ? f.t / f.dur : 1 - (f.t - f.dur) / f.dur;
      ctx.globalAlpha = CD.clamp(a, 0, 1);
      ctx.fillStyle = '#ffe3f0';
      ctx.fillRect(0, 0, CD.W, CD.H);
      ctx.globalAlpha = 1;
    }
  }

  var last = performance.now(), acc = 0;
  function frame(now) {
    var dt = (now - last) / 1000;
    last = now;
    if (dt > 0.1) dt = 0.1; // after a hiccup, don't teleport
    if (dt < 0) dt = 0;
    acc += dt;
    var n = 0;
    while (acc >= STEP && n < 16) { step(STEP); acc -= STEP; n++; }
    if (n === 16) acc = 0;
    if (game.scene === 'level' && game.level && game.level.num === 2 && !game.paused) refreshHud();
    try { render(); } catch (err) { console.error(err); }
    requestAnimationFrame(frame);
  }

  toMenu();
  requestAnimationFrame(frame);
})();
