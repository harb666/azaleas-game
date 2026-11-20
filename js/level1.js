/* Cake Dash — Level 1: Flying Cake (tap to flap through 5 candy pipes) */
(function () {
  'use strict';
  var CD = window.CD;

  var PW = 62;            // pipe width
  var CAP_W = 76, CAP_H = 26;
  // Endless: it starts gentle and gets a little harder with every pipe.
  function difficulty(n) {
    return {
      speed: Math.min(115 + n * 3.5, 205),        // scroll speed
      gap: Math.max(196 - n * 2.5, 132),          // opening between pipes
      spacing: Math.max(230 - n * 1.6, 188),      // distance between pipe pairs
      up: Math.min(100 + n * 1.5, 125),           // biggest climb from one gap to the next
      down: Math.min(110 + n * 3, 170)            // biggest drop from one gap to the next
    };
  }
  var MILESTONES = { 5: 'Amazing! 🍓', 10: 'Faster! 🚀', 15: 'Super cake! ⭐', 20: 'Wow, 20 pipes! 🎉', 30: 'Cake legend! 👑' };
  var GRAVITY = 1350;
  var FLAP_V = -410;
  var MAX_FALL = 560;
  var CAKE_X = 100, CAKE_S = 40, HIT_R = 14; // forgiving round hitbox
  var FLOOR_H = 48;

  var PIPE_THEMES = [
    { a: '#ffb3d1', b: '#fff', edge: '#e77fab', cap: '#fff2f8', drip: '#ff9ec4' },
    { a: '#a8ecd2', b: '#f4fffa', edge: '#5cc49d', cap: '#ffffff', drip: '#ff9ec4' },
    { a: '#cdb8ff', b: '#fbf8ff', edge: '#9a80e8', cap: '#fff2f8', drip: '#ffd84d' },
    { a: '#a9d8ff', b: '#f5fbff', edge: '#6aaee6', cap: '#ffffff', drip: '#c8b4ff' }
  ];

  var pipeArt = null;
  function buildPipeArt() {
    pipeArt = PIPE_THEMES.map(function (th) {
      var body = CD.makeCanvas(PW, 900, 2, function (c) {
        c.fillStyle = th.a;
        c.fillRect(0, 0, PW, 900);
        // candy-cane stripes
        c.save();
        c.beginPath(); c.rect(0, 0, PW, 900); c.clip();
        c.fillStyle = th.b;
        for (var y = -PW; y < 900 + PW; y += 34) {
          c.beginPath();
          c.moveTo(0, y); c.lineTo(PW, y - 26); c.lineTo(PW, y - 12); c.lineTo(0, y + 14);
          c.closePath(); c.fill();
        }
        c.restore();
        // shading
        var g = c.createLinearGradient(0, 0, PW, 0);
        g.addColorStop(0, 'rgba(255,255,255,0.55)');
        g.addColorStop(0.25, 'rgba(255,255,255,0.0)');
        g.addColorStop(0.75, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(120,40,90,0.22)');
        c.fillStyle = g;
        c.fillRect(0, 0, PW, 900);
        c.fillStyle = th.edge;
        c.fillRect(0, 0, 2.5, 900);
        c.fillRect(PW - 2.5, 0, 2.5, 900);
        // sprinkles scattered on the pipe
        var cols = ['#ffd84d', '#ff6fae', '#7fdcb9', '#9fd2ff', '#fff'];
        for (var i = 0; i < 40; i++) {
          c.save();
          c.translate(CD.rand(10, PW - 10), CD.rand(0, 900));
          c.rotate(CD.rand(0, 3));
          c.fillStyle = cols[i % cols.length];
          CD.rr(c, -3.5, -1.2, 7, 2.4, 1.2);
          c.fill();
          c.restore();
        }
      });
      var cap = CD.makeCanvas(CAP_W, CAP_H + 16, 2, function (c) {
        // frosting drips hanging below the cap
        c.fillStyle = th.drip;
        var drips = [[10, 9], [22, 14], [36, 7], [50, 15], [64, 10]];
        for (var i = 0; i < drips.length; i++) {
          CD.rr(c, drips[i][0] - 4, CAP_H - 6, 8, drips[i][1] + 4, 4);
          c.fill();
          c.beginPath(); c.arc(drips[i][0], CAP_H - 2 + drips[i][1], 4.5, 0, Math.PI * 2); c.fill();
        }
        CD.rr(c, 0, 0, CAP_W, CAP_H, 12);
        c.fillStyle = th.cap; c.fill();
        c.lineWidth = 2.5; c.strokeStyle = th.edge; c.stroke();
        CD.rr(c, 6, 4, CAP_W * 0.5, 6, 3);
        c.fillStyle = 'rgba(255,255,255,0.9)'; c.fill();
        // sprinkles + gumdrops on the frosting
        var cols = ['#ff6fae', '#ffd84d', '#7fdcb9', '#9fd2ff', '#c8b4ff'];
        for (var k = 0; k < 9; k++) {
          c.save();
          c.translate(8 + k * 7.5, 13 + (k % 3) * 3);
          c.rotate(k * 0.9);
          c.fillStyle = cols[k % cols.length];
          CD.rr(c, -3, -1, 6, 2.2, 1.1); c.fill();
          c.restore();
        }
        c.fillStyle = '#ff6f8f';
        c.beginPath(); c.arc(12, 6, 4, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#8fe3c4';
        c.beginPath(); c.arc(CAP_W - 12, 6, 4, 0, Math.PI * 2); c.fill();
      });
      return { body: body, cap: cap };
    });
  }

  function Level1(game) {
    this.g = game;
    this.num = 1;
    if (!pipeArt) buildPipeArt();
    this.bg = new CD.Background('sky');
    this.reset();
  }

  Level1.prototype.reset = function () {
    var H = CD.H;
    this.phase = 'ready';
    this.t = 0;
    this.phaseT = 0;
    this.diff = difficulty(0);
    this.speed = this.diff.speed;
    this.cake = { x: CAKE_X, y: H * 0.42, vy: 0, rot: 0, sq: 0, sqv: 0, arm: 0, face: 'happy', spin: 0 };
    this.pipes = [];
    this.berries = [];
    this.passed = 0;
    this.spawned = 0;
    this.trailAcc = 0;
    this.collected = 0;
    this.lastGapY = H * 0.45;
    this.spawnPipe(CD.W + 90);
    while (this.pipes[this.pipes.length - 1].x < CD.W * 2) this.spawnPipe();
  };

  // Add the next pipe pair, always reachable from the previous gap
  Level1.prototype.spawnPipe = function (x) {
    var H = CD.H, d = difficulty(this.spawned);
    var last = this.pipes[this.pipes.length - 1];
    if (x == null) x = last.x + d.spacing;
    var floor = H - FLOOR_H;
    var minY = 78 + d.gap / 2, maxY = floor - 62 - d.gap / 2;
    var gy = CD.clamp(CD.rand(minY, maxY), this.lastGapY - d.up, this.lastGapY + d.down);
    gy = CD.clamp(gy, minY, maxY);
    var p = { x: x, gapY: gy, gap: d.gap, passed: false, theme: this.spawned % PIPE_THEMES.length };
    // strawberries: inside every other gap, and sometimes floating between pipes
    if (this.spawned % 2 === 1) this.berries.push({ x: x + PW / 2, y: gy, got: false, ph: this.spawned });
    else if (last && this.spawned % 4 === 0) this.berries.push({ x: last.x + PW + (x - last.x - PW) / 2, y: (last.gapY + gy) / 2, got: false, ph: this.spawned });
    this.pipes.push(p);
    this.lastGapY = gy;
    this.spawned++;
  };

  Level1.prototype.input = function () {
    var c = this.cake;
    if (this.phase === 'ready') { this.phase = 'play'; this.phaseT = 0; }
    if (this.phase !== 'play') return;
    c.vy = FLAP_V;
    c.sq = 0.22; c.sqv = 0;
    c.arm = 0;
    CD.Audio.play('flap');
    for (var i = 0; i < 4; i++) this.g.particles.trail(c.x - 10, c.y + 12, 8, -this.speed * 0.5);
  };

  Level1.prototype.die = function () {
    if (this.phase !== 'play') return;
    this.phase = 'dying';
    this.phaseT = 0;
    var c = this.cake;
    c.vy = -330;
    c.face = 'dizzy';
    c.spin = 6;
    CD.Audio.play('hit');
    this.g.shake(0.35, 7);
    this.g.particles.burst(c.x, c.y, 14, [CD.Sprites.trail.pieces[0], CD.Sprites.trail.dots[0], CD.Sprites.sparkGold], 220);
  };

  Level1.prototype.update = function (dt) {
    var c = this.cake, H = CD.H, P = this.g.particles;
    this.t += dt;
    this.phaseT += dt;

    // speed eases toward the current difficulty
    var target = this.phase === 'play' ? this.diff.speed : (this.phase === 'ready' ? 0 : this.speed);
    if (this.phase === 'dying' || this.phase === 'dead') target = 0;
    this.speed += (target - this.speed) * Math.min(1, dt * 2);
    var bgSpeed = this.phase === 'ready' ? 60 : this.speed;
    this.bg.update(dt, bgSpeed);

    c.sqv += (-c.sq * 260 - c.sqv * 14) * dt;
    c.sq += c.sqv * dt;
    c.arm += dt * (c.vy < 0 ? 26 : 12);

    if (this.phase === 'ready') {
      c.y = H * 0.42 + Math.sin(this.t * 3) * 10;
      c.rot = Math.sin(this.t * 3) * 0.08;
    } else if (this.phase === 'play') {
      c.vy = Math.min(c.vy + GRAVITY * dt, MAX_FALL);
      c.y += c.vy * dt;
      if (c.y < CAKE_S * 0.5) { c.y = CAKE_S * 0.5; if (c.vy < 0) c.vy = 0; }
      var tr = CD.clamp(c.vy / 700, -0.45, 0.9) * 0.75;
      c.rot += (tr - c.rot) * Math.min(1, dt * 10);
      for (var i = 0; i < this.pipes.length; i++) {
        var p = this.pipes[i];
        p.x -= this.speed * dt;
        var top = { x: p.x + 3, y: -200, w: PW - 6, h: p.gapY - p.gap / 2 + 200 };
        var bot = { x: p.x + 3, y: p.gapY + p.gap / 2, w: PW - 6, h: H };
        if (CD.circleRect(c.x, c.y, HIT_R, top) || CD.circleRect(c.x, c.y, HIT_R, bot)) { this.die(); break; }
        if (!p.passed && p.x + PW < c.x - HIT_R) {
          p.passed = true;
          this.passed++;
          this.diff = difficulty(this.passed);
          this.g.addScore(1);
          CD.Audio.play('pass');
          P.burst(p.x + PW / 2, p.gapY, 10, CD.Sprites.sparks, 160);
          if (MILESTONES[this.passed] || (this.passed > 30 && this.passed % 10 === 0)) {
            this.g.toast(MILESTONES[this.passed] || (this.passed + ' pipes! 🌟'));
            P.confetti(CD.W / 2, CD.H * 0.3, 40, 0.9);
            CD.Audio.play('collect');
          }
          this.g.onProgress();
        }
      }
      for (var b = 0; b < this.berries.length; b++) {
        var be = this.berries[b];
        be.x -= this.speed * dt;
        if (!be.got) {
          var dx = be.x - c.x, dy = be.y - c.y;
          if (dx * dx + dy * dy < 28 * 28) {
            be.got = true;
            this.collected++;
            this.g.addBerry();
            CD.Audio.play('collect');
            P.burst(be.x, be.y, 10, CD.Sprites.hearts.concat([CD.Sprites.sparkGold]), 150);
          }
        }
      }
      // endless: keep pipes coming, forget the ones far behind
      while (this.pipes[this.pipes.length - 1].x < CD.W + 160) this.spawnPipe();
      while (this.pipes.length && this.pipes[0].x < -CAP_W - 20) this.pipes.shift();
      while (this.berries.length && this.berries[0].x < -40) this.berries.shift();
      if (this.phase === 'play' && c.y + HIT_R > H - FLOOR_H + 8) this.die();
    } else if (this.phase === 'dying') {
      c.vy += GRAVITY * dt;
      c.y += c.vy * dt;
      c.rot += c.spin * dt;
      if (this.phaseT > 1.3) { this.phase = 'dead'; this.g.onDead(); }
    }

    if (this.phase === 'ready' || this.phase === 'play') {
      this.trailAcc += dt * 46;
      while (this.trailAcc > 1) {
        this.trailAcc -= 1;
        P.trail(c.x - CAKE_S * 0.45, c.y + 2, CAKE_S * 0.3, -Math.max(this.speed, 60) * 0.75);
      }
    }
  };

  Level1.prototype.drawFloor = function (ctx) {
    var W = CD.W, H = CD.H, y = H - FLOOR_H, off = this.bg.off % 40;
    ctx.fillStyle = '#ffd3e6';
    ctx.fillRect(0, y + 14, W, FLOOR_H);
    for (var x = -off - 20; x < W + 40; x += 40) {
      ctx.fillStyle = '#ffe9f3';
      ctx.beginPath(); ctx.arc(x, y + 18, 24, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x + 20, y + 14, 18, Math.PI, 0); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,143,191,0.5)';
    for (var s = -off; s < W + 40; s += 40) {
      ctx.beginPath(); ctx.arc(s + 8, y + 30, 3, 0, Math.PI * 2); ctx.fill();
    }
  };

  Level1.prototype.draw = function (ctx) {
    var H = CD.H, c = this.cake;
    this.bg.draw(ctx);
    // pipes
    for (var i = 0; i < this.pipes.length; i++) {
      var p = this.pipes[i];
      if (p.x > CD.W + 20 || p.x < -CAP_W - 10) continue;
      var art = pipeArt[p.theme];
      var topEnd = p.gapY - p.gap / 2, botStart = p.gapY + p.gap / 2;
      // top pipe (hangs from the sky)
      ctx.drawImage(art.body, 0, 0, art.body.width, Math.min(art.body.height, topEnd * 2), p.x, 0, PW, Math.min(900, topEnd));
      ctx.drawImage(art.cap, p.x - (CAP_W - PW) / 2, topEnd - CAP_H, CAP_W, CAP_H + 16);
      // bottom pipe
      var bh = H - botStart;
      ctx.drawImage(art.body, 0, 0, art.body.width, Math.min(art.body.height, bh * 2), p.x, botStart, PW, Math.min(900, bh));
      ctx.drawImage(art.cap, p.x - (CAP_W - PW) / 2, botStart, CAP_W, CAP_H + 16);
    }
    // strawberries to collect
    var B = CD.Sprites.berryBig;
    for (var b = 0; b < this.berries.length; b++) {
      var be = this.berries[b];
      if (be.got || be.x < -30 || be.x > CD.W + 30) continue;
      var bob = Math.sin(this.t * 4 + be.ph) * 4;
      var sc = 0.8 + Math.sin(this.t * 6 + be.ph) * 0.04;
      ctx.drawImage(B, be.x - B.lw * sc / 2, be.y + bob - B.lh * sc / 2, B.lw * sc, B.lh * sc);
    }
    this.drawFloor(ctx);
    this.g.particles.draw(ctx);
    CD.resetTransform(ctx);
    CD.drawCake(ctx, c.x, c.y, CAKE_S, {
      rot: c.rot, sx: 1 - c.sq * 0.8, sy: 1 + c.sq, t: this.t,
      legs: 'dangle', legPhase: this.t * 6, arms: this.phase === 'dying' ? 'up' : 'flap', armPhase: c.arm, face: c.face, skin: this.g.skin
    });
    if (this.phase === 'ready') this.g.drawHint(ctx, 'TAP TO FLAP!', 'How far can you fly?', c.y + 70);
  };

  CD.Level1 = Level1;
})();
