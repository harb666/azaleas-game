/* Cake Dash — Square Shortcake, the hero! Drawn entirely with canvas paths. */
(function () {
  'use strict';
  var CD = window.CD;

  var SPONGE = '#f8d79c', SPONGE_DARK = '#e9b56b', FROST = '#ff9ec4', FROST_DARK = '#f27aac';
  var LINE = '#8a3f5c', CREAM = '#fffafc';

  function limb(ctx, x1, y1, x2, y2, w, col) {
    ctx.strokeStyle = LINE;
    ctx.lineWidth = w + 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  function ball(ctx, x, y, r, col) {
    ctx.fillStyle = col;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  /**
   * o: { rot, sx, sy, t, legs: 'run'|'tuck'|'dangle'|'stand', legPhase,
   *      arms: 'flap'|'swing'|'up'|'rest', armPhase, face: 'happy'|'dizzy'|'joy'|'wow' }
   */
  CD.drawCake = function (ctx, x, y, s, o) {
    o = o || {};
    var h = s / 2, t = o.t || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(o.rot || 0);
    // squash & stretch anchored at the bottom of the body
    var sx = o.sx || 1, sy = o.sy || 1;
    ctx.translate(0, h);
    ctx.scale(sx, sy);
    ctx.translate(0, -h);

    // ---- legs ----
    var legLen = s * 0.2, lp = o.legPhase || 0, legW = s * 0.11;
    var legs = o.legs || 'dangle';
    for (var i = -1; i <= 1; i += 2) {
      var lx = i * h * 0.45, ly = h - 2, ex = lx, ey = ly + legLen;
      if (legs === 'run') {
        var ph = lp + (i > 0 ? Math.PI : 0);
        ex = lx + Math.cos(ph) * s * 0.13;
        ey = ly + legLen - Math.max(0, Math.sin(ph)) * s * 0.12;
      } else if (legs === 'tuck') {
        ex = lx - s * 0.1; ey = ly + legLen * 0.6;
      } else if (legs === 'dangle') {
        ex = lx + Math.sin(lp + i) * s * 0.05 - s * 0.04; ey = ly + legLen;
      }
      limb(ctx, lx, ly, ex, ey, legW, SPONGE_DARK);
      // little pink shoe
      ctx.fillStyle = '#ff6fae';
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.ellipse(ex + s * 0.03, ey + 1, s * 0.09, s * 0.06, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }

    // ---- arms ----
    var ap = o.armPhase || 0, arms = o.arms || 'rest', armLen = s * 0.24;
    for (var j = -1; j <= 1; j += 2) {
      var axs = j * (h - 1), ays = s * 0.08, ang;
      if (arms === 'flap') ang = -0.5 + Math.sin(ap) * 0.9;
      else if (arms === 'swing') ang = 0.5 + Math.sin(ap + (j > 0 ? Math.PI : 0)) * 0.6;
      else if (arms === 'up') ang = -1.1 + Math.sin(ap) * 0.25;
      else ang = 0.8 + Math.sin(t * 2) * 0.1;
      var ax = axs + j * Math.cos(ang) * armLen, ay = ays + Math.sin(ang) * armLen;
      limb(ctx, axs, ays, ax, ay, s * 0.09, SPONGE_DARK);
      ball(ctx, ax, ay, s * 0.075, CREAM);
    }

    // ---- body ----
    var R = s * 0.2;
    CD.rr(ctx, -h, -h, s, s, R);
    ctx.fillStyle = SPONGE;
    ctx.fill();
    ctx.save();
    CD.rr(ctx, -h, -h, s, s, R);
    ctx.clip();
    // sponge shading
    ctx.fillStyle = SPONGE_DARK;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(-h, h - s * 0.12, s, s * 0.12);
    ctx.globalAlpha = 1;
    // sponge holes
    ctx.fillStyle = 'rgba(214, 150, 70, 0.35)';
    var holes = [[-0.32, 0.38], [0.3, 0.42], [0.05, 0.4], [-0.15, 0.08], [0.38, 0.05]];
    for (var k = 0; k < holes.length; k++) {
      ctx.beginPath(); ctx.arc(holes[k][0] * s, holes[k][1] * s, s * 0.022, 0, Math.PI * 2); ctx.fill();
    }
    // cream layer with strawberry slices
    var cy = s * 0.2, ch = s * 0.12;
    ctx.fillStyle = CREAM;
    ctx.fillRect(-h, cy, s, ch);
    ctx.fillStyle = '#ff4d6d';
    for (var m = -2; m <= 2; m++) {
      ctx.beginPath();
      ctx.arc(m * s * 0.22, cy + ch * 0.55, s * 0.065, Math.PI, 0);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd0da';
    for (var n = -2; n <= 2; n++) {
      ctx.beginPath(); ctx.arc(n * s * 0.22, cy + ch * 0.55, s * 0.025, Math.PI, 0); ctx.fill();
    }
    // pink strawberry frosting with drips
    var fy = -h + s * 0.3;
    ctx.fillStyle = FROST;
    ctx.beginPath();
    ctx.moveTo(-h, -h);
    ctx.lineTo(h, -h);
    ctx.lineTo(h, fy - s * 0.04);
    var drips = [[0.42, 0.06], [0.3, 0.13], [0.16, 0.04], [0.02, 0.1], [-0.14, 0.03], [-0.28, 0.15], [-0.42, 0.05]];
    for (var d = 0; d < drips.length; d++) {
      var dx = drips[d][0] * s, dl = drips[d][1] * s;
      ctx.quadraticCurveTo(dx + s * 0.05, fy, dx + s * 0.04, fy + dl * 0.5);
      ctx.arc(dx, fy + dl * 0.5, s * 0.04, 0, Math.PI);
      ctx.quadraticCurveTo(dx - s * 0.05, fy, dx - s * 0.07, fy - s * 0.01);
    }
    ctx.lineTo(-h, fy - s * 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = FROST_DARK;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(-h, -h, s, s * 0.04);
    ctx.globalAlpha = 1;
    // glossy highlight
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    CD.rr(ctx, -h + s * 0.1, -h + s * 0.07, s * 0.28, s * 0.07, s * 0.035);
    ctx.fill();
    // sprinkles
    var spr = [[0.15, 0.12, '#fff', 0.5], [0.3, 0.2, '#a8ecd2', -0.6], [-0.05, 0.2, '#ffe27a', 0.2], [0.38, 0.09, '#c8b4ff', 1.1]];
    for (var q = 0; q < spr.length; q++) {
      ctx.save();
      ctx.translate(spr[q][0] * s, -h + spr[q][1] * s);
      ctx.rotate(spr[q][3]);
      ctx.fillStyle = spr[q][2];
      CD.rr(ctx, -s * 0.035, -s * 0.012, s * 0.07, s * 0.024, s * 0.012);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    // outline
    CD.rr(ctx, -h, -h, s, s, R);
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = LINE;
    ctx.stroke();

    // ---- face ----
    var face = o.face || 'happy';
    var ex2 = s * 0.2, ey2 = -s * 0.03;
    ctx.lineCap = 'round';
    if (face === 'dizzy') {
      ctx.strokeStyle = '#4a1a2c';
      ctx.lineWidth = s * 0.05;
      for (var e = -1; e <= 1; e += 2) {
        var cx = e * ex2;
        ctx.beginPath();
        for (var a = 0; a < Math.PI * 3.2; a += 0.3) {
          var rr = a * s * 0.012;
          var px = cx + Math.cos(a + t * 8) * rr, py = ey2 + Math.sin(a + t * 8) * rr;
          if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    } else if (face === 'joy') {
      ctx.strokeStyle = '#4a1a2c';
      ctx.lineWidth = s * 0.055;
      for (var e2 = -1; e2 <= 1; e2 += 2) {
        ctx.beginPath(); ctx.arc(e2 * ex2, ey2 + s * 0.03, s * 0.07, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      }
    } else {
      var blink = (t % 3.2) > 3.08;
      for (var e3 = -1; e3 <= 1; e3 += 2) {
        var ecx = e3 * ex2;
        if (blink) {
          ctx.strokeStyle = '#4a1a2c';
          ctx.lineWidth = s * 0.05;
          ctx.beginPath(); ctx.moveTo(ecx - s * 0.07, ey2); ctx.lineTo(ecx + s * 0.07, ey2); ctx.stroke();
        } else {
          var ery = face === 'wow' ? s * 0.13 : s * 0.115;
          ctx.fillStyle = '#3a1424';
          ctx.beginPath(); ctx.ellipse(ecx, ey2, s * 0.088, ery, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#7b3b8f';
          ctx.beginPath(); ctx.ellipse(ecx, ey2 + ery * 0.45, s * 0.06, ery * 0.35, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(ecx + s * 0.03, ey2 - ery * 0.38, s * 0.036, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(ecx - s * 0.03, ey2 + ery * 0.3, s * 0.017, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    // blush
    ctx.fillStyle = 'rgba(255, 120, 160, 0.55)';
    ctx.beginPath(); ctx.ellipse(-s * 0.34, s * 0.09, s * 0.075, s * 0.04, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.34, s * 0.09, s * 0.075, s * 0.04, 0, 0, Math.PI * 2); ctx.fill();
    // mouth
    ctx.strokeStyle = '#4a1a2c';
    ctx.lineWidth = s * 0.04;
    if (face === 'joy' || face === 'wow') {
      ctx.fillStyle = '#c2365f';
      ctx.beginPath();
      ctx.arc(0, s * 0.08, s * 0.075, 0, Math.PI);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff8fab';
      ctx.beginPath(); ctx.arc(0, s * 0.125, s * 0.03, Math.PI, 0); ctx.fill();
    } else if (face === 'dizzy') {
      ctx.beginPath();
      ctx.moveTo(-s * 0.08, s * 0.12);
      ctx.quadraticCurveTo(-s * 0.04, s * 0.07, 0, s * 0.12);
      ctx.quadraticCurveTo(s * 0.04, s * 0.17, s * 0.08, s * 0.12);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(-s * 0.035, s * 0.08, s * 0.035, 0.1, Math.PI - 0.1);
      ctx.arc(s * 0.035, s * 0.08, s * 0.035, 0.1, Math.PI - 0.1);
      ctx.stroke();
    }

    // ---- whipped cream + strawberry on top ----
    ctx.fillStyle = CREAM;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-s * 0.13, -h - s * 0.01, s * 0.1, Math.PI * 0.9, Math.PI * 2.1);
    ctx.arc(0, -h - s * 0.06, s * 0.12, Math.PI, 0);
    ctx.arc(s * 0.13, -h - s * 0.01, s * 0.1, Math.PI * 0.9, Math.PI * 2.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    var bob = Math.sin(t * 5) * s * 0.01;
    CD.drawStrawberry(ctx, 0, -h - s * 0.2 + bob, s * 0.16);

    // ---- dizzy stars ----
    if (face === 'dizzy') {
      for (var st = 0; st < 3; st++) {
        var ang2 = t * 4 + st * (Math.PI * 2 / 3);
        ctx.fillStyle = '#ffd84d';
        CD.sparklePath(ctx, Math.cos(ang2) * s * 0.55, -h - s * 0.32 + Math.sin(ang2) * s * 0.12, s * 0.1);
        ctx.fill();
      }
    }
    ctx.restore();
  };
})();
