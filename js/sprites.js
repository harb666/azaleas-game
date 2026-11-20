/* Cake Dash — small pre-rendered sprites (drawn once, blitted many times) */
(function () {
  'use strict';
  var CD = window.CD;
  var K = 3; // supersampling so sprites stay crisp on retina screens

  function cakePiece(top, body, cream, slice, line) {
    return CD.makeCanvas(14, 14, K, function (c) {
      CD.rr(c, 1, 3, 12, 10, 3);
      c.fillStyle = body || '#f7d59a'; c.fill();
      c.fillStyle = cream || '#fff';
      c.fillRect(1.5, 7, 11, 2.2);
      c.fillStyle = slice || '#ff5c7f';
      c.beginPath(); c.arc(5, 8.1, 1.3, 0, Math.PI * 2); c.arc(9.5, 8.1, 1.3, 0, Math.PI * 2); c.fill();
      CD.rr(c, 1, 2, 12, 4.5, 2.5);
      c.fillStyle = top; c.fill();
      c.lineWidth = 1; c.strokeStyle = line || '#a8566f';
      CD.rr(c, 1, 2, 12, 11, 3); c.stroke();
    });
  }

  function heart(col) {
    return CD.makeCanvas(14, 14, K, function (c) {
      CD.heartPath(c, 7, 7.5, 6);
      c.fillStyle = col; c.fill();
      c.fillStyle = 'rgba(255,255,255,0.6)';
      c.beginPath(); c.ellipse(4.6, 5, 1.3, 1.8, -0.5, 0, Math.PI * 2); c.fill();
    });
  }

  function sparkle(col) {
    return CD.makeCanvas(14, 14, K, function (c) {
      CD.sparklePath(c, 7, 7, 6.5);
      c.fillStyle = col; c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(7, 7, 1.4, 0, Math.PI * 2); c.fill();
    });
  }

  function dot(col) {
    return CD.makeCanvas(10, 10, K, function (c) {
      c.fillStyle = col;
      c.beginPath(); c.arc(5, 5, 4.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.55)';
      c.beginPath(); c.arc(3.6, 3.6, 1.4, 0, Math.PI * 2); c.fill();
    });
  }

  function cloud(w, h, seed) {
    return CD.makeCanvas(w, h, 2, function (c) {
      var puffs = [[0.2, 0.62, 0.2], [0.38, 0.45, 0.27], [0.6, 0.42, 0.3], [0.8, 0.6, 0.2], [0.5, 0.68, 0.26]];
      if (seed) puffs.push([0.3, 0.7, 0.22]);
      c.fillStyle = 'rgba(214, 196, 255, 0.55)';
      for (var i = 0; i < puffs.length; i++) {
        c.beginPath(); c.arc(puffs[i][0] * w, puffs[i][1] * h + 4, puffs[i][2] * w * 0.6, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = '#fff';
      for (var j = 0; j < puffs.length; j++) {
        c.beginPath(); c.arc(puffs[j][0] * w, puffs[j][1] * h, puffs[j][2] * w * 0.6, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = 'rgba(255, 220, 238, 0.6)';
      c.beginPath(); c.ellipse(w * 0.5, h * 0.83, w * 0.36, h * 0.07, 0, 0, Math.PI * 2); c.fill();
    });
  }

  var skinCache = {};

  CD.Sprites = {
    // Trail pieces in the selected character's flavour
    useSkin: function (sk) {
      if (!skinCache[sk.id]) {
        skinCache[sk.id] = {
          pieces: [cakePiece(sk.frost, sk.sponge, sk.cream, sk.slice, sk.line), cakePiece(sk.cream, sk.sponge, sk.cream, sk.slice, sk.line)],
          dots: sk.dots.map(dot),
          mini: CD.makeCanvas(14, 14, K, function (c) {
            if (sk.topper === 'strawberry') CD.drawStrawberry(c, 7, 8, 5.5); else CD.drawTopper(c, sk.topper, 7, 8, 5);
          })
        };
      }
      this.trail = skinCache[sk.id];
    },
    build: function () {
      var s = this;
      s.cakePink = cakePiece('#ff9ec4');
      s.cakeWhite = cakePiece('#fff3f8');
      s.heartPink = heart('#ff8fbf');
      s.heartLav = heart('#c3a8ff');
      s.heartMint = heart('#8fe3c4');
      s.heartBlue = heart('#9fd2ff');
      s.sparkWhite = sparkle('#fffbe0');
      s.sparkGold = sparkle('#ffe17a');
      s.sparkPink = sparkle('#ffc2de');
      s.dotPink = dot('#ff9ec4');
      s.dotHot = dot('#ff6fae');
      s.dotCream = dot('#fff3f8');
      s.berry = CD.makeCanvas(14, 14, K, function (c) { CD.drawStrawberry(c, 7, 8, 5.5); });
      s.berryBig = CD.makeCanvas(36, 38, K, function (c) { CD.drawStrawberry(c, 18, 20, 15, true); });
      s.cloud1 = cloud(120, 72, 0);
      s.cloud2 = cloud(90, 56, 1);
      s.hearts = [s.heartPink, s.heartLav, s.heartMint, s.heartBlue];
      s.sparks = [s.sparkWhite, s.sparkGold, s.sparkPink];
      s.useSkin(CD.SKINS[0]);
    }
  };
})();
