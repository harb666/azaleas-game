/* Cake Dash — parallax candy backgrounds */
(function () {
  'use strict';
  var CD = window.CD;

  function Background(mode) {
    this.mode = mode; // 'sky' | 'land'
    this.off = 0;
    this.t = 0;
    this.build();
  }

  Background.prototype.build = function () {
    var W = CD.W, H = CD.H, mode = this.mode;
    this.builtH = H;
    this.grad = CD.makeCanvas(W, H, 1, function (c) {
      var g = c.createLinearGradient(0, 0, 0, H);
      if (mode === 'sky') {
        g.addColorStop(0, '#9fd6ff');
        g.addColorStop(0.45, '#d4c4ff');
        g.addColorStop(0.8, '#ffc8e2');
        g.addColorStop(1, '#ffe0ee');
      } else {
        g.addColorStop(0, '#ffc4de');
        g.addColorStop(0.5, '#ffe0d0');
        g.addColorStop(1, '#fff1df');
      }
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      // soft rainbow
      var cx = W * 0.75, cy = H * 0.42, cols = ['#ffb3c7', '#ffd9a8', '#fff3a8', '#c4f2c9', '#bfe3ff', '#d9c7ff'];
      c.globalAlpha = mode === 'sky' ? 0.35 : 0.3;
      for (var i = 0; i < cols.length; i++) {
        c.strokeStyle = cols[i];
        c.lineWidth = 9;
        c.beginPath();
        c.arc(cx, cy, 170 - i * 9, Math.PI * 1.05, Math.PI * 1.95);
        c.stroke();
      }
      c.globalAlpha = 1;
      // sparkly dots
      c.fillStyle = 'rgba(255,255,255,0.7)';
      for (var k = 0; k < 26; k++) {
        CD.sparklePath(c, Math.random() * W, Math.random() * H * 0.55, CD.rand(1.5, 3.5));
        c.fill();
      }
    });
    this.clouds = [];
    for (var i = 0; i < 7; i++) {
      var far = i < 4;
      this.clouds.push({
        x: CD.rand(-60, W + 60), y: far ? CD.rand(30, H * 0.35) : CD.rand(60, H * 0.55),
        s: far ? CD.rand(0.45, 0.7) : CD.rand(0.8, 1.15), f: far ? 0.12 : 0.28,
        img: Math.random() < 0.5 ? 'cloud1' : 'cloud2', drift: CD.rand(4, 10)
      });
    }
    this.floaters = [];
    for (var j = 0; j < 5; j++) {
      this.floaters.push({ x: CD.rand(0, W), y: CD.rand(H * 0.1, H * 0.6), ph: CD.rand(0, 6), f: CD.rand(0.18, 0.3), s: CD.rand(0.5, 0.8) });
    }
  };

  Background.prototype.update = function (dt, speed) {
    if (this.builtH !== CD.H) this.build();
    this.t += dt;
    this.off += speed * dt;
    var W = CD.W;
    for (var i = 0; i < this.clouds.length; i++) {
      var c = this.clouds[i];
      c.x -= (speed * c.f + c.drift) * dt;
      if (c.x < -140) { c.x = W + CD.rand(20, 120); c.y = c.f < 0.2 ? CD.rand(30, CD.H * 0.35) : CD.rand(60, CD.H * 0.55); }
    }
    for (var j = 0; j < this.floaters.length; j++) {
      var f = this.floaters[j];
      f.x -= (speed * f.f + 6) * dt;
      if (f.x < -30) { f.x = W + CD.rand(10, 80); f.y = CD.rand(CD.H * 0.1, CD.H * 0.6); }
    }
  };

  function hills(ctx, off, base, a1, f1, a2, f2, col, cream) {
    var W = CD.W, H = CD.H, pts = [];
    for (var x = -10; x <= W + 10; x += 6) {
      var wx = x + off;
      pts.push(x, base - (Math.sin(wx * f1) * a1 + Math.sin(wx * f2 + 1.3) * a2 + a1 + a2));
    }
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-10, H);
    for (var i = 0; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.lineTo(W + 10, H);
    ctx.closePath();
    ctx.fill();
    if (cream) {
      ctx.strokeStyle = cream;
      ctx.lineWidth = 7;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (var k = 0; k < pts.length; k += 2) {
        if (k === 0) ctx.moveTo(pts[k], pts[k + 1] + 3); else ctx.lineTo(pts[k], pts[k + 1] + 3);
      }
      ctx.stroke();
    }
  }

  function lollipop(ctx, x, y, r, c1) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 2, y, 4, r * 2.6);
    ctx.fillStyle = c1;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = r * 0.22;
    ctx.beginPath();
    for (var a = 0; a < Math.PI * 4; a += 0.25) {
      var rr = (a / (Math.PI * 4)) * r * 0.85;
      var px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  function cakeTower(ctx, x, base, w, tiers, col) {
    var y = base;
    for (var i = 0; i < tiers; i++) {
      var tw = w * (1 - i * 0.22), th = 26 - i * 3;
      y -= th;
      CD.rr(ctx, x - tw / 2, y, tw, th, 6);
      ctx.fillStyle = col; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      CD.rr(ctx, x - tw / 2, y, tw, 7, 4); ctx.fill();
    }
    ctx.fillStyle = '#ff7f9f';
    ctx.beginPath(); ctx.arc(x, y - 4, 5, 0, Math.PI * 2); ctx.fill();
  }

  Background.prototype.draw = function (ctx, groundY) {
    var W = CD.W, H = CD.H, S = CD.Sprites;
    ctx.drawImage(this.grad, 0, 0, W, H);
    // floating strawberries (far)
    for (var j = 0; j < this.floaters.length; j++) {
      var f = this.floaters[j];
      var b = S.berryBig, sc = f.s;
      ctx.globalAlpha = 0.55;
      ctx.drawImage(b, f.x - b.lw * sc / 2, f.y + Math.sin(this.t * 1.5 + f.ph) * 8 - b.lh * sc / 2, b.lw * sc, b.lh * sc);
    }
    ctx.globalAlpha = 1;
    // far clouds
    for (var i = 0; i < this.clouds.length; i++) {
      var c = this.clouds[i];
      if (c.f >= 0.2) continue;
      var im = S[c.img];
      ctx.globalAlpha = 0.8;
      ctx.drawImage(im, c.x, c.y, im.lw * c.s, im.lh * c.s);
    }
    ctx.globalAlpha = 1;

    if (this.mode === 'sky') {
      // far cake towers + candy hills near the bottom
      var o1 = this.off * 0.15;
      var spacing = 150;
      var first = Math.floor(o1 / spacing) - 1;
      for (var k = first; k < first + 5; k++) {
        var tx = k * spacing - o1 + 40;
        cakeTower(ctx, tx, H - 70, 70 + ((k * 37) % 3) * 12, 2 + (Math.abs(k) % 2), ['#e9dcff', '#ffe0ef', '#d8f5ea'][Math.abs(k) % 3]);
      }
      hills(ctx, this.off * 0.25, H - 60, 14, 0.018, 8, 0.041, '#d9c7ff', 'rgba(255,255,255,0.8)');
    } else {
      var gy = groundY || H - 120;
      var o2 = this.off * 0.12;
      for (var m = Math.floor(o2 / 170) - 1; m < Math.floor(o2 / 170) + 4; m++) {
        cakeTower(ctx, m * 170 - o2 + 60, gy - 80, 80 + (Math.abs(m) % 3) * 14, 2 + (Math.abs(m) % 2), ['#ffe0ef', '#e9dcff', '#fff0c8'][Math.abs(m) % 3]);
      }
      hills(ctx, this.off * 0.2, gy - 55, 18, 0.014, 9, 0.037, '#c9b6ff', 'rgba(255,255,255,0.85)');
      hills(ctx, this.off * 0.4, gy - 18, 14, 0.02, 7, 0.05, '#a8ecd2', 'rgba(255,255,255,0.9)');
      // lollipop trees (mid layer)
      var o3 = this.off * 0.55, sp = 130;
      for (var n = Math.floor(o3 / sp) - 1; n < Math.floor(o3 / sp) + 5; n++) {
        var lx = n * sp - o3 + 30 + ((n * 53) % 40);
        lollipop(ctx, lx, gy - 46 - (Math.abs(n) % 2) * 10, 13, ['#ff8fbf', '#c8b4ff', '#8fe3c4', '#9fd2ff'][Math.abs(n) % 4]);
      }
    }
    // near clouds
    for (var q = 0; q < this.clouds.length; q++) {
      var c2 = this.clouds[q];
      if (c2.f < 0.2) continue;
      var im2 = S[c2.img];
      ctx.globalAlpha = this.mode === 'sky' ? 0.95 : 0.75;
      ctx.drawImage(im2, c2.x, c2.y, im2.lw * c2.s, im2.lh * c2.s);
    }
    ctx.globalAlpha = 1;
  };

  CD.Background = Background;
})();
