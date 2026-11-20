/* Cake Dash — Square Shortcake, the hero! Drawn entirely with canvas paths. */
(function () {
  'use strict';
  var CD = window.CD;

  // Character flavours. price = points needed in the Cakes shop (0 = free).
  CD.SKINS = [
    { id: 'shortcake', name: 'Shortcake', price: 0,
      sponge: '#f8d79c', spongeDark: '#e9b56b', frost: '#ff9ec4', frostDark: '#f27aac', cream: '#fffafc',
      slice: '#ff4d6d', sliceIn: '#ffd0da', line: '#8a3f5c', shoe: '#ff6fae', holes: 'rgba(214,150,70,0.35)',
      sprinkles: ['#fff', '#a8ecd2', '#ffe27a', '#c8b4ff'], topper: 'strawberry', dots: ['#ff9ec4', '#ff6fae', '#fff3f8'] },
    { id: 'choco', name: 'Choco Cake', price: 20, dark: true,
      sponge: '#a0673f', spongeDark: '#7d4a2a', frost: '#4e2a16', frostDark: '#3a1d0e', cream: '#f7e7d4',
      slice: '#3a1d0e', sliceIn: '#6b3d22', line: '#2e1508', shoe: '#ff8fbf', holes: 'rgba(60,25,10,0.35)',
      sprinkles: ['#fff', '#ff8fbf', '#ffe27a', '#f7e7d4'], topper: 'cherry', dots: ['#6b3d22', '#4e2a16', '#f7e7d4'] },
    { id: 'mint', name: 'Mint Choc Chip', price: 60,
      sponge: '#c4f2dc', spongeDark: '#8fdcb9', frost: '#5a3420', frostDark: '#432414', cream: '#ffffff',
      slice: '#4a2a17', sliceIn: '#6b3d22', line: '#2f5e4a', shoe: '#5a3420', holes: 'rgba(60,140,100,0.3)',
      sprinkles: ['#a8ecd2', '#fff', '#c4f2dc', '#ffe27a'], topper: 'mint', dots: ['#a8ecd2', '#5a3420', '#ffffff'] },
    { id: 'blueberry', name: 'Blueberry Cheesecake', price: 120,
      sponge: '#fff0c4', spongeDark: '#e8cf8a', frost: '#8c7ae6', frostDark: '#6f5bd4', cream: '#ffffff',
      slice: '#4f5fd0', sliceIn: '#9fb0ff', line: '#4a3a8a', shoe: '#8c7ae6', holes: 'rgba(200,170,90,0.3)',
      sprinkles: ['#fff', '#bfe3ff', '#c8b4ff', '#ffe27a'], topper: 'blueberries', dots: ['#8c7ae6', '#4f5fd0', '#bfe3ff'] },
    { id: 'rainbow', name: 'Rainbow Sprinkle', price: 200, rainbow: true,
      sponge: '#fff4e6', spongeDark: '#f1d9b5', frost: '#ffffff', frostDark: '#f3e8ff', cream: '#ffe3f0',
      slice: '#ff6fae', sliceIn: '#fff', line: '#7c55d6', shoe: '#a98bff', holes: 'rgba(200,160,120,0.25)',
      sprinkles: ['#ff6fae', '#ffd84d', '#7fdcb9', '#9fd2ff', '#c8b4ff', '#ff9f5a'], topper: 'star',
      dots: ['#ff6fae', '#ffd84d', '#7fdcb9', '#9fd2ff', '#c8b4ff'] },
    { id: 'royal', name: 'Royal Gold Cake', price: 400,
      sponge: '#ffe7a3', spongeDark: '#f0c75e', frost: '#ffd23f', frostDark: '#e6b400', cream: '#fffaf0',
      slice: '#ff6fae', sliceIn: '#ffd0e4', line: '#9a6a00', shoe: '#ff6fae', holes: 'rgba(200,150,40,0.3)',
      sprinkles: ['#fff', '#ff6fae', '#c8b4ff', '#fff6c9'], topper: 'crown', dots: ['#ffd23f', '#fff6c9', '#ffb703'] }
  ];
  CD.skinById = function (id) {
    for (var i = 0; i < CD.SKINS.length; i++) if (CD.SKINS[i].id === id) return CD.SKINS[i];
    return CD.SKINS[0];
  };

  // Little toppers that sit on the cream (also used as mini trail pieces)
  CD.drawTopper = function (ctx, type, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    if (type === 'cherry') {
      ctx.strokeStyle = '#4c8a2e'; ctx.lineWidth = Math.max(1, r * 0.18); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -r * 0.6); ctx.quadraticCurveTo(r * 0.2, -r * 1.4, r * 0.8, -r * 1.5); ctx.stroke();
      ctx.fillStyle = '#e8203f';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a3112a'; ctx.lineWidth = Math.max(0.8, r * 0.1); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath(); ctx.arc(-r * 0.28, -r * 0.28, r * 0.22, 0, Math.PI * 2); ctx.fill();
    } else if (type === 'blueberries') {
      var pts = [[-0.55, 0.15], [0.55, 0.15], [0, -0.4]];
      for (var i = 0; i < 3; i++) {
        ctx.fillStyle = '#4f5fd0';
        ctx.beginPath(); ctx.arc(pts[i][0] * r, pts[i][1] * r, r * 0.55, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#2f3a96'; ctx.lineWidth = Math.max(0.8, r * 0.08); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath(); ctx.arc(pts[i][0] * r - r * 0.15, pts[i][1] * r - r * 0.18, r * 0.13, 0, Math.PI * 2); ctx.fill();
      }
    } else if (type === 'mint') {
      ctx.fillStyle = '#4cc38a';
      ctx.beginPath(); ctx.ellipse(-r * 0.45, -r * 0.2, r * 0.6, r * 0.28, -0.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(r * 0.45, -r * 0.2, r * 0.6, r * 0.28, 0.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a2a17';
      ctx.beginPath(); ctx.moveTo(0, -r * 0.9); ctx.quadraticCurveTo(r * 0.6, r * 0.4, 0, r * 0.45); ctx.quadraticCurveTo(-r * 0.6, r * 0.4, 0, -r * 0.9); ctx.fill();
    } else if (type === 'star') {
      ctx.fillStyle = '#ffd84d'; ctx.strokeStyle = '#f2a516'; ctx.lineWidth = Math.max(0.8, r * 0.12);
      ctx.beginPath();
      for (var k = 0; k < 10; k++) {
        var a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r;
        if (k === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (type === 'crown') {
      ctx.fillStyle = '#ffcf33'; ctx.strokeStyle = '#b8860b'; ctx.lineWidth = Math.max(0.8, r * 0.12);
      ctx.beginPath();
      ctx.moveTo(-r, r * 0.55); ctx.lineTo(-r, -r * 0.45); ctx.lineTo(-r * 0.5, r * 0.05); ctx.lineTo(0, -r * 0.75);
      ctx.lineTo(r * 0.5, r * 0.05); ctx.lineTo(r, -r * 0.45); ctx.lineTo(r, r * 0.55); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff6fae';
      ctx.beginPath(); ctx.arc(0, r * 0.25, r * 0.18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7fdcb9';
      ctx.beginPath(); ctx.arc(-r * 0.55, r * 0.3, r * 0.13, 0, Math.PI * 2); ctx.arc(r * 0.55, r * 0.3, r * 0.13, 0, Math.PI * 2); ctx.fill();
    } else {
      CD.drawStrawberry(ctx, 0, 0, r);
    }
    ctx.restore();
  };

  var SPONGE, SPONGE_DARK, FROST, FROST_DARK, LINE, CREAM, SK;

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
    SK = o.skin || CD.SKINS[0];
    SPONGE = SK.sponge; SPONGE_DARK = SK.spongeDark; FROST = SK.frost; FROST_DARK = SK.frostDark;
    LINE = SK.line; CREAM = SK.cream;
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
      ctx.fillStyle = SK.shoe;
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
    ctx.fillStyle = SK.holes;
    var holes = [[-0.32, 0.38], [0.3, 0.42], [0.05, 0.4], [-0.15, 0.08], [0.38, 0.05]];
    for (var k = 0; k < holes.length; k++) {
      ctx.beginPath(); ctx.arc(holes[k][0] * s, holes[k][1] * s, s * 0.022, 0, Math.PI * 2); ctx.fill();
    }
    // cream layer with strawberry slices
    var cy = s * 0.2, ch = s * 0.12;
    ctx.fillStyle = CREAM;
    ctx.fillRect(-h, cy, s, ch);
    var rainbowCols = SK.sprinkles;
    ctx.fillStyle = SK.slice;
    for (var m = -2; m <= 2; m++) {
      if (SK.rainbow) ctx.fillStyle = rainbowCols[(m + 2) % rainbowCols.length];
      ctx.beginPath();
      ctx.arc(m * s * 0.22, cy + ch * 0.55, s * 0.065, Math.PI, 0);
      ctx.fill();
    }
    ctx.fillStyle = SK.sliceIn;
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
    var sc = SK.sprinkles;
    var spr = [[0.15, 0.12, sc[0], 0.5], [0.3, 0.2, sc[1], -0.6], [-0.05, 0.2, sc[2], 0.2], [0.38, 0.09, sc[3], 1.1]];
    if (SK.rainbow) spr.push([-0.3, 0.14, sc[4], 0.9], [-0.38, 0.06, sc[5], -0.3], [0.05, 0.08, sc[1], 1.4]);
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
      ctx.strokeStyle = SK.dark ? '#fff' : '#4a1a2c';
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
      ctx.strokeStyle = SK.dark ? '#fff' : '#4a1a2c';
      ctx.lineWidth = s * 0.055;
      for (var e2 = -1; e2 <= 1; e2 += 2) {
        ctx.beginPath(); ctx.arc(e2 * ex2, ey2 + s * 0.03, s * 0.07, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      }
    } else {
      var blink = (t % 3.2) > 3.08;
      for (var e3 = -1; e3 <= 1; e3 += 2) {
        var ecx = e3 * ex2;
        if (blink) {
          ctx.strokeStyle = SK.dark ? '#fff' : '#4a1a2c';
          ctx.lineWidth = s * 0.05;
          ctx.beginPath(); ctx.moveTo(ecx - s * 0.07, ey2); ctx.lineTo(ecx + s * 0.07, ey2); ctx.stroke();
        } else {
          var ery = face === 'wow' ? s * 0.13 : s * 0.115;
          if (SK.dark) {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.ellipse(ecx, ey2, s * 0.115, ery + s * 0.03, 0, 0, Math.PI * 2); ctx.fill();
          }
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
    ctx.strokeStyle = SK.dark ? '#fff' : '#4a1a2c';
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
    if (SK.topper === 'strawberry') CD.drawStrawberry(ctx, 0, -h - s * 0.2 + bob, s * 0.16);
    else CD.drawTopper(ctx, SK.topper, 0, -h - s * 0.2 + bob, s * 0.15);

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
