/* Cake Dash — particle system: shortcake trail, confetti, puffs, sparkles */
(function () {
  'use strict';
  var CD = window.CD;
  var MAX = 320;
  var CONFETTI_COLS = ['#ff8fbf', '#ffd84d', '#a8ecd2', '#bfe3ff', '#c8b4ff', '#ff6fae', '#fff'];

  function Particles() { this.list = []; }

  Particles.prototype.clear = function () { this.list.length = 0; };

  Particles.prototype.add = function (p) {
    if (this.list.length >= MAX) this.list.shift();
    p.age = 0;
    p.rot = p.rot || 0;
    p.vr = p.vr || 0;
    p.g = p.g || 0;
    p.drag = p.drag == null ? 0.9 : p.drag;
    p.size = p.size || 1;
    this.list.push(p);
    return p;
  };

  // The magical strawberry-shortcake trail behind the character
  Particles.prototype.trail = function (x, y, spread, worldVx) {
    var S = CD.Sprites;
    var r = Math.random();
    var img, size = 1, life = CD.rand(0.7, 1.2), g = 0, vy = CD.rand(-25, 25);
    var T = S.trail;
    if (r < 0.18) { img = Math.random() < 0.6 ? T.pieces[0] : T.pieces[1]; size = CD.rand(0.7, 1.0); g = 120; }
    else if (r < 0.42) { img = CD.pick(T.dots); size = CD.rand(0.45, 0.9); g = 40; }
    else if (r < 0.64) { img = CD.pick(S.sparks); size = CD.rand(0.5, 1.0); }
    else if (r < 0.80) { img = T.mini; size = CD.rand(0.7, 1.0); g = 90; }
    else { img = CD.pick(S.hearts); size = CD.rand(0.6, 1.0); g = -40; vy = CD.rand(-35, -10); }
    this.add({
      kind: 'img', img: img,
      x: x + CD.rand(-3, 3), y: y + CD.rand(-spread, spread),
      vx: worldVx + CD.rand(-20, 10), vy: vy, g: g, drag: 0.6,
      rot: CD.rand(-1, 1), vr: CD.rand(-4, 4),
      life: life, size: size, twinkle: img === S.sparkWhite || img === S.sparkGold || img === S.sparkPink
    });
  };

  Particles.prototype.confetti = function (x, y, n, power) {
    power = power || 1;
    for (var i = 0; i < n; i++) {
      var a = CD.rand(-Math.PI, 0);
      var sp = CD.rand(150, 420) * power;
      this.add({
        kind: 'confetti', col: CD.pick(CONFETTI_COLS),
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80,
        g: 420, drag: 0.35, rot: CD.rand(0, 6), vr: CD.rand(-10, 10),
        w: CD.rand(5, 9), h: CD.rand(3, 6), life: CD.rand(1.6, 2.6), wob: CD.rand(0, 6)
      });
    }
  };

  // Confetti raining from the top of the screen
  Particles.prototype.confettiRain = function (n) {
    for (var i = 0; i < n; i++) {
      this.add({
        kind: 'confetti', col: CD.pick(CONFETTI_COLS),
        x: CD.rand(0, CD.W), y: CD.rand(-40, -5), vx: CD.rand(-30, 30), vy: CD.rand(60, 160),
        g: 60, drag: 0.1, rot: CD.rand(0, 6), vr: CD.rand(-8, 8),
        w: CD.rand(5, 9), h: CD.rand(3, 6), life: CD.rand(2.5, 4), wob: CD.rand(0, 6)
      });
    }
  };

  Particles.prototype.burst = function (x, y, n, imgs, speed) {
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2 + CD.rand(-0.2, 0.2);
      var sp = CD.rand(0.6, 1) * (speed || 140);
      this.add({
        kind: 'img', img: CD.pick(imgs), x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 2.5,
        rot: CD.rand(0, 6), vr: CD.rand(-6, 6), life: CD.rand(0.5, 0.8), size: CD.rand(0.7, 1.2), twinkle: true
      });
    }
  };

  Particles.prototype.puff = function (x, y, n, vx) {
    for (var i = 0; i < n; i++) {
      this.add({
        kind: 'puff', x: x + CD.rand(-14, 14), y: y + CD.rand(-3, 2),
        vx: (vx || 0) + CD.rand(-60, 60), vy: CD.rand(-50, -10), drag: 3, g: 0,
        r: CD.rand(4, 8), life: CD.rand(0.35, 0.6)
      });
    }
  };

  Particles.prototype.update = function (dt) {
    var L = this.list;
    for (var i = L.length - 1; i >= 0; i--) {
      var p = L[i];
      p.age += dt;
      if (p.age >= p.life) { L.splice(i, 1); continue; }
      var d = Math.max(0, 1 - p.drag * dt);
      p.vx *= d;
      p.vy = p.vy * d + p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
  };

  Particles.prototype.draw = function (ctx) {
    var L = this.list;
    for (var i = 0; i < L.length; i++) {
      var p = L[i];
      var k = p.age / p.life;
      var alpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      if (p.kind === 'img') {
        var sc = p.size * (k < 0.15 ? 0.5 + k / 0.3 : 1 - k * 0.35);
        if (p.twinkle) sc *= 0.75 + 0.25 * Math.sin(p.age * 20 + i);
        var w = p.img.lw * sc, h = p.img.lh * sc;
        ctx.globalAlpha = alpha;
        CD.resetTransform(ctx);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.drawImage(p.img, -w / 2, -h / 2, w, h);
      } else if (p.kind === 'confetti') {
        ctx.globalAlpha = alpha;
        CD.resetTransform(ctx);
        ctx.translate(p.x + Math.sin(p.age * 6 + p.wob) * 6, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.age * 9 + p.wob));
        ctx.fillStyle = p.col;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else if (p.kind === 'puff') {
        ctx.globalAlpha = alpha * 0.85;
        CD.resetTransform(ctx);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (0.6 + k), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };

  CD.Particles = Particles;
})();
