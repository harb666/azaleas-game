/* Cake Dash — shared helpers and constants */
(function () {
  'use strict';
  var CD = (window.CD = window.CD || {});

  CD.W = 360; // logical width (portrait)
  CD.H = 640; // logical height (adjusted to screen aspect at runtime)

  // Base view transform: logical units -> backing pixels, plus screen-shake offset
  CD.view = { k: 1, ox: 0, oy: 0 };
  CD.resetTransform = function (ctx) {
    var v = CD.view;
    ctx.setTransform(v.k, 0, 0, v.k, v.ox * v.k, v.oy * v.k);
  };

  CD.rand = function (a, b) { return a + Math.random() * (b - a); };
  CD.randi = function (a, b) { return Math.floor(CD.rand(a, b + 1)); };
  CD.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  CD.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  CD.lerp = function (a, b, t) { return a + (b - a) * t; };

  // Rounded rectangle path (Safari-safe; no ctx.roundRect)
  CD.rr = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // Collision helpers
  CD.rectHit = function (a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };
  CD.circleRect = function (cx, cy, r, b) {
    var nx = CD.clamp(cx, b.x, b.x + b.w);
    var ny = CD.clamp(cy, b.y, b.y + b.h);
    var dx = cx - nx, dy = cy - ny;
    return dx * dx + dy * dy < r * r;
  };

  // Safe localStorage (private mode / blocked storage must never break the game)
  CD.store = {
    get: function (key, def) {
      try {
        var v = window.localStorage.getItem('cakedash.' + key);
        return v === null ? def : JSON.parse(v);
      } catch (e) { return def; }
    },
    set: function (key, val) {
      try { window.localStorage.setItem('cakedash.' + key, JSON.stringify(val)); } catch (e) { /* ignore */ }
    }
  };

  // Shape helpers shared by sprites, obstacles and decorations
  CD.heartPath = function (ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.9);
    ctx.bezierCurveTo(x - r * 1.35, y + r * 0.05, x - r * 0.65, y - r * 1.15, x, y - r * 0.4);
    ctx.bezierCurveTo(x + r * 0.65, y - r * 1.15, x + r * 1.35, y + r * 0.05, x, y + r * 0.9);
    ctx.closePath();
  };

  CD.drawStrawberry = function (ctx, x, y, r, face) {
    ctx.save();
    ctx.translate(x, y);
    // body
    ctx.beginPath();
    ctx.moveTo(0, r);
    ctx.bezierCurveTo(-r * 0.95, r * 0.55, -r * 1.1, -r * 0.35, -r * 0.55, -r * 0.62);
    ctx.quadraticCurveTo(0, -r * 0.85, r * 0.55, -r * 0.62);
    ctx.bezierCurveTo(r * 1.1, -r * 0.35, r * 0.95, r * 0.55, 0, r);
    ctx.closePath();
    var g = ctx.createLinearGradient(0, -r, 0, r);
    g.addColorStop(0, '#ff6b86');
    g.addColorStop(1, '#ec2f5b');
    ctx.fillStyle = g;
    ctx.fill();
    if (r > 8) {
      ctx.lineWidth = Math.max(1, r * 0.08);
      ctx.strokeStyle = '#b81f48';
      ctx.stroke();
    }
    // shine
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.42, -r * 0.18, r * 0.14, r * 0.28, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // seeds
    ctx.fillStyle = '#ffe27a';
    var seeds = r > 8 ? [[-0.3, 0.05], [0.25, -0.15], [0.05, 0.3], [-0.15, 0.6], [0.35, 0.3], [-0.5, 0.3], [0.1, -0.3], [0.5, 0.0]]
      : [[-0.25, 0.1], [0.25, 0], [0, 0.45]];
    for (var i = 0; i < seeds.length; i++) {
      if (face && seeds[i][1] < 0.35 && Math.abs(seeds[i][0]) < 0.4) continue;
      ctx.beginPath();
      ctx.ellipse(seeds[i][0] * r, seeds[i][1] * r, r * 0.05 + 0.4, r * 0.08 + 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // leaves
    ctx.fillStyle = '#5ccb7a';
    for (var k = 0; k < 5; k++) {
      var a = -Math.PI / 2 + (k - 2) * 0.6;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * r * 0.32, -r * 0.62 + Math.sin(a) * r * 0.12 + r * 0.08, r * 0.3, r * 0.12, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#3fae5f';
    CD.rr(ctx, -r * 0.06, -r * 0.98, r * 0.12, r * 0.3, r * 0.05);
    ctx.fill();
    if (face) {
      ctx.fillStyle = '#4a1a2c';
      ctx.beginPath(); ctx.ellipse(-r * 0.26, r * 0.08, r * 0.08, r * 0.11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(r * 0.26, r * 0.08, r * 0.08, r * 0.11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-r * 0.23, r * 0.04, r * 0.03 + 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.29, r * 0.04, r * 0.03 + 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#4a1a2c';
      ctx.lineWidth = r * 0.05;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, r * 0.25, r * 0.1, 0.2, Math.PI - 0.2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,170,190,0.8)';
      ctx.beginPath(); ctx.ellipse(-r * 0.45, r * 0.28, r * 0.1, r * 0.06, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(r * 0.45, r * 0.28, r * 0.1, r * 0.06, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };

  // 4-point twinkle star
  CD.sparklePath = function (ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.closePath();
  };

  CD.makeCanvas = function (w, h, scale, draw) {
    var c = document.createElement('canvas');
    c.width = Math.ceil(w * scale);
    c.height = Math.ceil(h * scale);
    var x = c.getContext('2d');
    x.scale(scale, scale);
    draw(x, w, h);
    c.lw = w;
    c.lh = h;
    return c;
  };
})();
