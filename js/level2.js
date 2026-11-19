/* Cake Dash — Level 2: Cake Runner (no more flying! tap to jump over obstacles) */
(function () {
  'use strict';
  var CD = window.CD;

  var SPEED = 185;
  var GRAVITY = 2200;
  var JUMP_V = -820;      // ~150px high, ~140px long jump
  var CAKE_S = 44;
  var CAKE_X = 95;        // screen x of the cake
  var LEG = CAKE_S * 0.2 + 2;
  var HALF_W = 14;        // forgiving hitbox half-width
  var JUMP_BUFFER = 0.1;
  var SWEET_ROLL = 70;    // rolling sweets move toward you

  // Obstacle sizes (hitboxes are inset inside the drawn art)
  var TYPES = {
    choc:    { w: 46, h: 42, inset: 4 },
    berry:   { w: 46, h: 52, inset: 7 },
    spikes:  { w: 54, h: 30, inset: 7 },
    barrier: { w: 30, h: 56, inset: 3 },
    sweet:   { w: 38, h: 38, inset: 4 },
    gap:     { w: 80, h: 0 }
  };

  // Hand-made course: every obstacle is spaced so a jump always fits.
  var COURSE = [
    ['choc', 0], ['berry', 340], ['spikes', 330], ['gap', 340], ['sweet', 360],
    ['barrier', 400], ['choc', 320], ['gap', 330], ['berry', 330], ['sweet', 360],
    ['spikes', 400], ['barrier', 320], ['gap', 330], ['choc', 320], ['sweet', 360], ['berry', 400]
  ];

  function Level2(game) {
    this.g = game;
    this.num = 2;
    this.bg = new CD.Background('land');
    this.reset();
  }

  Level2.prototype.reset = function () {
    var H = CD.H;
    this.GY = H - 118;
    this.phase = 'drop';
    this.t = 0;
    this.phaseT = 0;
    this.dist = 0;
    this.speed = 0;
    this.trailAcc = 0;
    this.jumpBuf = 0;
    this.cake = { y: -60, vy: 0, grounded: false, rot: 0, sq: 0, sqv: 0, legPhase: 0, face: 'wow', spin: 0, wasGrounded: false };

    this.obs = [];
    this.gaps = [];
    this.berries = [];
    var x = 620;
    for (var i = 0; i < COURSE.length; i++) {
      x += COURSE[i][1];
      var type = COURSE[i][0], T = TYPES[type];
      if (type === 'gap') {
        this.gaps.push({ x: x, w: T.w });
        // a reward berry floating over the gap
        this.berries.push({ x: x + T.w / 2, y: this.GY - 95, got: false, ph: i });
      } else {
        this.obs.push({ type: type, x: x, w: T.w, h: T.h, inset: T.inset, passed: false, roll: 0, rolling: false });
        if (i % 3 === 1) this.berries.push({ x: x + T.w / 2, y: this.GY - T.h - 70, got: false, ph: i });
      }
      // ground-level berries between obstacles
      if (i % 2 === 0 && i < COURSE.length - 1) this.berries.push({ x: x + 170, y: this.GY - 24, got: false, ph: i + 0.5 });
    }
    this.finishX = x + 420;
    this.totalBerries = this.berries.length;
    this.collected = 0;
    this.cleared = 0;
  };

  Level2.prototype.cakeY = function () { return this.GY - LEG - CAKE_S / 2; };

  Level2.prototype.input = function () {
    if (this.phase === 'ready') { this.phase = 'play'; this.phaseT = 0; return; }
    if (this.phase !== 'play') return;
    var c = this.cake;
    if (c.grounded) this.jump();
    else this.jumpBuf = JUMP_BUFFER; // pressed just before landing: jump right after touching down
  };

  Level2.prototype.jump = function () {
    var c = this.cake;
    c.vy = JUMP_V;
    c.grounded = false;
    c.sq = 0.25; c.sqv = 0;
    this.jumpBuf = 0;
    CD.Audio.play('jump');
    this.g.particles.puff(CAKE_X, this.GY, 6, -this.speed * 0.5);
  };

  Level2.prototype.overGap = function (worldX) {
    for (var i = 0; i < this.gaps.length; i++) {
      var g = this.gaps[i];
      // only fall when the whole (narrow) hitbox is over the hole
      if (worldX - HALF_W + 2 > g.x && worldX + HALF_W - 2 < g.x + g.w) return g;
    }
    return null;
  };

  Level2.prototype.hitbox = function () {
    var c = this.cake;
    return { x: CAKE_X - HALF_W, y: c.y - CAKE_S / 2 + 6, w: HALF_W * 2, h: CAKE_S - 6 + LEG - 4 };
  };

  Level2.prototype.obsBox = function (o) {
    var sx = o.x - this.dist - o.roll;
    if (o.type === 'sweet') return { circle: true, x: sx + o.w / 2, y: this.GY - o.h / 2, r: o.w / 2 - o.inset };
    return { x: sx + o.inset, y: this.GY - o.h + o.inset * 0.5, w: o.w - o.inset * 2, h: o.h - o.inset * 0.5 };
  };

  Level2.prototype.die = function (fell) {
    if (this.phase !== 'play') return;
    this.phase = fell ? 'falling' : 'dying';
    this.phaseT = 0;
    var c = this.cake;
    c.face = 'dizzy';
    if (fell) {
      CD.Audio.play('fall');
    } else {
      c.vy = -420;
      c.spin = -7;
      c.grounded = false;
      CD.Audio.play('hit');
      this.g.shake(0.35, 7);
      this.g.particles.burst(CAKE_X, c.y, 14, [CD.Sprites.cakePink, CD.Sprites.dotPink, CD.Sprites.sparkGold], 220);
    }
  };

  Level2.prototype.finish = function () {
    this.phase = 'finish';
    this.phaseT = 0;
    this.cake.face = 'joy';
    this.g.addScore(50);
    CD.Audio.play('victory');
    var P = this.g.particles;
    P.confetti(CAKE_X + 40, this.GY - 120, 70, 1.1);
    P.confettiRain(80);
  };

  Level2.prototype.update = function (dt) {
    var c = this.cake, P = this.g.particles, GY = this.GY;
    this.t += dt;
    this.phaseT += dt;
    var base = this.cakeY();

    // speed: stand still before start, run during play, slow down at the finish
    var targetSpeed = (this.phase === 'play') ? SPEED : (this.phase === 'finish' ? 60 : 0);
    if (this.phase === 'dying' || this.phase === 'falling' || this.phase === 'dead') targetSpeed = 0;
    this.speed += (targetSpeed - this.speed) * Math.min(1, dt * (this.phase === 'play' ? 6 : 3));
    if (this.phase === 'dying' || this.phase === 'falling' || this.phase === 'dead') this.speed = 0;
    this.dist += this.speed * dt;
    this.bg.update(dt, this.speed);

    c.sqv += (-c.sq * 260 - c.sqv * 13) * dt;
    c.sq += c.sqv * dt;
    c.legPhase += dt * (this.speed > 5 ? this.speed * 0.075 : 0);

    if (this.phase === 'drop') {
      // the cake lands on the ground — no more flying!
      c.vy += GRAVITY * 0.7 * dt;
      c.y += c.vy * dt;
      c.rot = Math.sin(this.t * 10) * 0.15;
      if (c.y >= base) {
        c.y = base; c.vy = 0; c.grounded = true; c.rot = 0;
        c.sq = -0.3; c.sqv = 0;
        c.face = 'happy';
        CD.Audio.play('land');
        P.puff(CAKE_X, GY, 14, 0);
        this.phase = 'ready';
        this.phaseT = 0;
      }
    } else if (this.phase === 'ready') {
      c.y = base;
    } else if (this.phase === 'play' || this.phase === 'finish') {
      if (this.jumpBuf > 0) this.jumpBuf -= dt;
      var worldX = this.dist + CAKE_X;
      var hole = this.overGap(worldX);
      if (c.grounded && hole) c.grounded = false;
      if (!c.grounded) {
        c.vy += GRAVITY * dt;
        c.y += c.vy * dt;
        if (c.vy > 0 && c.y >= base && !this.overGap(worldX)) {
          c.y = base; c.vy = 0; c.grounded = true;
          c.sq = -0.22; c.sqv = 0;
          CD.Audio.play('land');
          P.puff(CAKE_X, GY, 5, -this.speed * 0.4);
          if (this.jumpBuf > 0 && this.phase === 'play') this.jump();
        }
        // fell into a hole
        if (this.phase === 'play' && c.y > base + 14 && this.overGap(worldX)) this.die(true);
      }
      var tgt = c.grounded ? Math.sin(c.legPhase * 2) * 0.04 : CD.clamp(c.vy / 1600, -0.25, 0.25);
      c.rot += (tgt - c.rot) * Math.min(1, dt * 12);

      if (this.phase === 'play') {
        var hb = this.hitbox();
        for (var i = 0; i < this.obs.length; i++) {
          var o = this.obs[i];
          if (o.type === 'sweet') {
            var sx = o.x - this.dist;
            if (sx < CD.W + 40) o.rolling = true;
            if (o.rolling) o.roll += SWEET_ROLL * dt;
          }
          var ob = this.obsBox(o);
          var bx = ob.circle ? ob.x - ob.r : ob.x;
          if (bx > CD.W || bx < -80) { if (!o.passed && bx < -80) o.passed = true; continue; }
          var hit = ob.circle ? CD.circleRect(ob.x, ob.y, ob.r, hb) : CD.rectHit(hb, ob);
          if (hit) { this.die(false); break; }
          var right = ob.circle ? ob.x + ob.r : ob.x + ob.w;
          if (!o.passed && right < hb.x) {
            o.passed = true;
            this.cleared++;
            this.g.addScore(10);
            CD.Audio.play('pass');
            P.burst(CAKE_X - 20, c.y - 20, 6, CD.Sprites.sparks, 120);
          }
        }
        for (var g = 0; g < this.gaps.length; g++) {
          var gp = this.gaps[g];
          if (!gp.passed && gp.x + gp.w - this.dist < CAKE_X - HALF_W && c.y <= base + 1) {
            gp.passed = true;
            this.cleared++;
            this.g.addScore(10);
            CD.Audio.play('pass');
          }
        }
        if (worldX >= this.finishX + 20) this.finish();
        this.g.onProgress();
      } else {
        // finish celebration: happy hops
        if (c.grounded && this.phaseT > 0.4 && this.phaseT < 2.6) {
          c.vy = -520; c.grounded = false; c.sq = 0.2;
          P.burst(CAKE_X, c.y - 30, 6, CD.Sprites.hearts, 120);
        }
        if (this.phaseT > 0.8 && this.phaseT - dt <= 0.8) P.confettiRain(60);
        if (this.phaseT > 2.9 && !this.won) { this.won = true; this.g.onVictory(); }
      }
      // collect strawberries
      var cx = CAKE_X, cy = c.y;
      for (var b = 0; b < this.berries.length; b++) {
        var be = this.berries[b];
        if (be.got) continue;
        var dx = be.x - this.dist - cx, dy = be.y - cy;
        if (dx * dx + dy * dy < 30 * 30) {
          be.got = true;
          this.collected++;
          this.g.addBerry();
          CD.Audio.play('collect');
          P.burst(be.x - this.dist, be.y, 10, CD.Sprites.hearts.concat([CD.Sprites.sparkGold]), 150);
        }
      }
    } else if (this.phase === 'dying') {
      c.vy += GRAVITY * 0.6 * dt;
      c.y += c.vy * dt;
      c.rot += c.spin * dt;
      if (this.phaseT > 1.3) { this.phase = 'dead'; this.g.onDead(); }
    } else if (this.phase === 'falling') {
      c.vy += GRAVITY * 0.5 * dt;
      c.y += c.vy * dt;
      c.rot += 3 * dt;
      if (this.phaseT > 1.1) { this.phase = 'dead'; this.g.onDead(); }
    }

    // shortcake trail keeps going while running
    if (this.phase === 'play' || this.phase === 'finish' || this.phase === 'ready') {
      this.trailAcc += dt * (this.speed > 20 ? 40 : 12);
      while (this.trailAcc > 1) {
        this.trailAcc -= 1;
        P.trail(CAKE_X - CAKE_S * 0.45, c.y + 4, CAKE_S * 0.28, -this.speed * 0.6);
      }
    }
  };

  Level2.prototype.progress = function () {
    return CD.clamp((this.dist + CAKE_X) / (this.finishX + 20), 0, 1);
  };

  // ---------- drawing ----------

  var tile = null, tileH = 0;
  function buildTile(h) {
    tileH = h;
    tile = CD.makeCanvas(120, h, 2, function (c) {
      // sponge
      c.fillStyle = '#f8d79c';
      c.fillRect(0, 0, 120, h);
      c.fillStyle = '#fffafc';
      c.fillRect(0, 34, 120, 14);
      c.fillStyle = '#ff4d6d';
      for (var x = 10; x < 120; x += 30) { c.beginPath(); c.arc(x, 44, 7, Math.PI, 0); c.fill(); }
      c.fillStyle = '#ffd0da';
      for (var x2 = 10; x2 < 120; x2 += 30) { c.beginPath(); c.arc(x2, 44, 3, Math.PI, 0); c.fill(); }
      c.fillStyle = 'rgba(214,150,70,0.35)';
      for (var i = 0; i < 14; i++) { c.beginPath(); c.arc((i * 37) % 120, 60 + ((i * 23) % Math.max(10, h - 60)), 2.2, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#fffafc';
      c.fillRect(0, 76, 120, 9);
      // pink frosting top with drips
      c.fillStyle = '#ff9ec4';
      c.fillRect(0, 0, 120, 14);
      var drips = [[8, 10], [26, 18], [44, 8], [62, 15], [82, 9], [100, 19], [116, 8]];
      for (var d = 0; d < drips.length; d++) {
        CD.rr(c, drips[d][0] - 5, 8, 10, drips[d][1], 5);
        c.fill();
      }
      c.fillStyle = 'rgba(255,255,255,0.6)';
      c.fillRect(0, 3, 120, 3);
      var cols = ['#fff', '#ffd84d', '#7fdcb9', '#9fd2ff', '#c8b4ff'];
      for (var k = 0; k < 8; k++) {
        c.save(); c.translate(7 + k * 15, 9); c.rotate(k * 1.3);
        c.fillStyle = cols[k % cols.length]; CD.rr(c, -3, -1, 6, 2.2, 1.1); c.fill(); c.restore();
      }
    });
  }

  Level2.prototype.drawGround = function (ctx) {
    var W = CD.W, H = CD.H, GY = this.GY, d = this.dist;
    var h = H - GY;
    if (!tile || tileH !== h) buildTile(h);
    // solid ground with holes cut out
    ctx.save();
    ctx.beginPath();
    var x = -10;
    var vis = [];
    for (var i = 0; i < this.gaps.length; i++) {
      var g = this.gaps[i], gx = g.x - d;
      if (gx + g.w < -10 || gx > W + 10) continue;
      vis.push(gx, g.w);
    }
    for (var j = 0; j < vis.length; j += 2) {
      if (vis[j] > x) ctx.rect(x, GY, vis[j] - x, h);
      x = vis[j] + vis[j + 1];
    }
    if (x < W + 10) ctx.rect(x, GY, W + 10 - x, h);
    ctx.clip();
    var off = d % 120;
    for (var tx = -off; tx < W; tx += 120) ctx.drawImage(tile, tx, GY, 120, h);
    ctx.restore();
    // holes: bubbling jam pit with rounded frosting edges
    for (var k = 0; k < vis.length; k += 2) {
      var hx = vis[k], hw = vis[k + 1];
      var jg = ctx.createLinearGradient(0, GY, 0, H);
      jg.addColorStop(0, '#b0306a');
      jg.addColorStop(1, '#5e1240');
      ctx.fillStyle = jg;
      ctx.fillRect(hx, GY + 10, hw, h);
      ctx.fillStyle = 'rgba(255,120,170,0.6)';
      for (var bb = 0; bb < 3; bb++) {
        var bx = hx + 14 + bb * (hw - 28) / 2;
        var by = H - 20 - ((this.t * 30 + bb * 17) % (h - 30));
        ctx.beginPath(); ctx.arc(bx, by, 3 + bb, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#ff9ec4';
      ctx.beginPath(); ctx.arc(hx, GY + 7, 7, -Math.PI / 2, Math.PI / 2); ctx.fill();
      ctx.beginPath(); ctx.arc(hx + hw, GY + 7, 7, Math.PI / 2, Math.PI * 1.5); ctx.fill();
    }
  };

  function eyes(ctx, x, y, r) {
    ctx.fillStyle = '#3a1424';
    ctx.beginPath(); ctx.ellipse(x - r * 2.2, y, r, r * 1.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + r * 2.2, y, r, r * 1.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x - r * 1.9, y - r * 0.5, r * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 2.5, y - r * 0.5, r * 0.4, 0, Math.PI * 2); ctx.fill();
  }

  Level2.prototype.drawObstacle = function (ctx, o) {
    var GY = this.GY, x = o.x - this.dist - o.roll, w = o.w, h = o.h, t = this.t;
    if (x > CD.W + 60 || x < -80) return;
    ctx.save();
    // soft shadow
    ctx.fillStyle = 'rgba(150,60,100,0.18)';
    ctx.beginPath(); ctx.ellipse(x + w / 2, GY + 2, w * 0.55, 4, 0, 0, Math.PI * 2); ctx.fill();
    if (o.type === 'choc') {
      CD.rr(ctx, x, GY - h, w, h, 7);
      ctx.fillStyle = '#7a4a32'; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#4e2a1c'; ctx.stroke();
      ctx.fillStyle = '#93603f';
      for (var r = 0; r < 2; r++) for (var cc = 0; cc < 2; cc++) {
        CD.rr(ctx, x + 5 + cc * (w / 2 - 3), GY - h + 6 + r * (h / 2 - 3), w / 2 - 7, h / 2 - 7, 3); ctx.fill();
      }
      // pink drizzle on top
      ctx.fillStyle = '#ff9ec4';
      ctx.beginPath();
      ctx.moveTo(x + 4, GY - h + 2);
      ctx.lineTo(x + w - 4, GY - h + 2);
      ctx.quadraticCurveTo(x + w - 2, GY - h + 12, x + w - 8, GY - h + 10);
      ctx.quadraticCurveTo(x + w * 0.65, GY - h + 18, x + w * 0.5, GY - h + 9);
      ctx.quadraticCurveTo(x + w * 0.3, GY - h + 16, x + 6, GY - h + 9);
      ctx.closePath(); ctx.fill();
      eyes(ctx, x + w / 2, GY - h * 0.38, 2.6);
    } else if (o.type === 'berry') {
      CD.drawStrawberry(ctx, x + w / 2, GY - h * 0.5 + 2, h * 0.5, true);
    } else if (o.type === 'spikes') {
      CD.rr(ctx, x, GY - 8, w, 8, 3);
      ctx.fillStyle = '#c8b4ff'; ctx.fill();
      var n = 3, sw = w / n;
      for (var i = 0; i < n; i++) {
        var sx = x + i * sw;
        ctx.beginPath();
        ctx.moveTo(sx + 2, GY - 6);
        ctx.lineTo(sx + sw / 2, GY - h);
        ctx.lineTo(sx + sw - 2, GY - 6);
        ctx.closePath();
        ctx.fillStyle = '#fff'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#e75c98'; ctx.stroke();
        ctx.save(); ctx.clip();
        ctx.fillStyle = '#ff8fbf';
        for (var st = 0; st < 4; st++) ctx.fillRect(sx, GY - 10 - st * 7, sw, 3.5);
        ctx.restore();
      }
    } else if (o.type === 'barrier') {
      CD.rr(ctx, x, GY - h, w, h, 10);
      ctx.fillStyle = '#fff4fa'; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#e77fab'; ctx.stroke();
      ctx.fillStyle = '#ff9ec4';
      for (var s2 = 0; s2 < 3; s2++) {
        CD.rr(ctx, x + 3, GY - h + 12 + s2 * 15, w - 6, 5, 2.5); ctx.fill();
      }
      // swirl of frosting + cherry on top
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x + w / 2, GY - h, w * 0.42, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.arc(x + w / 2, GY - h - 7, w * 0.28, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#e77fab'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x + w / 2, GY - h, w * 0.42, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = '#ff3d6e';
      ctx.beginPath(); ctx.arc(x + w / 2, GY - h - 13, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.arc(x + w / 2 - 1.5, GY - h - 14.5, 1.6, 0, Math.PI * 2); ctx.fill();
    } else if (o.type === 'sweet') {
      var rr = w / 2, cx = x + rr, cy = GY - rr;
      ctx.translate(cx, cy);
      // little wrapper bows
      ctx.fillStyle = '#c8b4ff';
      ctx.beginPath(); ctx.moveTo(-rr + 2, 0); ctx.lineTo(-rr - 10, -9); ctx.lineTo(-rr - 10, 9); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(rr - 2, 0); ctx.lineTo(rr + 10, -9); ctx.lineTo(rr + 10, 9); ctx.closePath(); ctx.fill();
      ctx.rotate(-(this.dist + o.roll) / rr);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff6fae';
      for (var k = 0; k < 6; k++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, rr, k * Math.PI / 3, k * Math.PI / 3 + Math.PI / 6);
        ctx.closePath(); ctx.fill();
      }
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#d14a8a';
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(0, 0, rr * 0.3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };

  Level2.prototype.drawFinish = function (ctx) {
    var x = this.finishX - this.dist, GY = this.GY, t = this.t;
    if (x > CD.W + 80 || x < -120) return;
    var top = GY - 175, w = 110;
    // poles
    for (var p = 0; p < 2; p++) {
      var px = x + p * w;
      ctx.save();
      CD.rr(ctx, px - 5, top, 10, GY - top, 5);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.clip();
      ctx.fillStyle = '#ff6fae';
      for (var s = top - 20; s < GY; s += 16) {
        ctx.beginPath(); ctx.moveTo(px - 6, s); ctx.lineTo(px + 6, s - 8); ctx.lineTo(px + 6, s - 2); ctx.lineTo(px - 6, s + 6); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      CD.drawStrawberry(ctx, px, top - 8, 9);
    }
    // checkered banner (waving)
    var bh = 30, by = top + 6;
    for (var i = 0; i < 11; i++) {
      for (var j = 0; j < 3; j++) {
        var cxp = x + 5 + i * ((w - 10) / 11);
        var wave = Math.sin(t * 4 + i * 0.6) * 2;
        ctx.fillStyle = (i + j) % 2 ? '#ff8fbf' : '#fff';
        ctx.fillRect(cxp, by + j * (bh / 3) + wave, (w - 10) / 11 + 0.5, bh / 3 + 0.5);
      }
    }
    ctx.fillStyle = '#fff';
    CD.rr(ctx, x + 14, by + bh + 6, w - 28, 22, 11);
    ctx.fill();
    ctx.fillStyle = '#e75c98';
    ctx.font = '900 15px ' + CD.FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FINISH', x + w / 2, by + bh + 17.5);
  };

  Level2.prototype.draw = function (ctx) {
    var c = this.cake, GY = this.GY;
    this.bg.draw(ctx, GY);
    this.drawFinish(ctx);
    this.drawGround(ctx);
    for (var i = 0; i < this.obs.length; i++) this.drawObstacle(ctx, this.obs[i]);
    var B = CD.Sprites.berryBig;
    for (var b = 0; b < this.berries.length; b++) {
      var be = this.berries[b];
      var bx = be.x - this.dist;
      if (be.got || bx < -30 || bx > CD.W + 30) continue;
      var bob = Math.sin(this.t * 4 + be.ph) * 4, sc = 0.72;
      ctx.drawImage(B, bx - B.lw * sc / 2, be.y + bob - B.lh * sc / 2, B.lw * sc, B.lh * sc);
    }
    this.g.particles.draw(ctx);
    CD.resetTransform(ctx);
    var running = c.grounded && this.speed > 5;
    var bounce = running ? -Math.abs(Math.sin(c.legPhase)) * 3 : 0;
    // shadow under the cake
    if (this.phase !== 'falling' && this.phase !== 'dying' && !this.overGap(this.dist + CAKE_X)) {
      var hgt = CD.clamp((this.cakeY() - c.y) / 160, 0, 1);
      ctx.fillStyle = 'rgba(150,60,100,' + (0.22 * (1 - hgt * 0.6)) + ')';
      ctx.beginPath(); ctx.ellipse(CAKE_X, GY + 2, 20 * (1 - hgt * 0.4), 4, 0, 0, Math.PI * 2); ctx.fill();
    }
    var legs = this.phase === 'drop' ? 'dangle' : (running ? 'run' : (c.grounded ? 'stand' : 'tuck'));
    CD.drawCake(ctx, CAKE_X, c.y + bounce, CAKE_S, {
      rot: c.rot, sx: 1 - c.sq * 0.8, sy: 1 + c.sq, t: this.t,
      legs: legs, legPhase: c.legPhase, arms: this.phase === 'finish' ? 'up' : (running ? 'swing' : 'up'),
      armPhase: c.legPhase + this.t * 2, face: c.face
    });
    if (this.phase === 'ready') this.g.drawHint(ctx, 'TAP TO JUMP!', 'No more flying — run & jump!', GY - 190);
  };

  CD.Level2 = Level2;
})();
