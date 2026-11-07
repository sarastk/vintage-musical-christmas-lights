/*
 * The scene: strings of vintage mini lights draped across a dark,
 * cozy background. The lights are the whole show.
 *
 * Static parts (background, wires, cable) are drawn once into an
 * off-screen layer whenever the window size changes. Every frame only
 * the bulbs, their glow and the ambient colour wash are drawn on top.
 */
window.XL = window.XL || {};

XL.BULB_COLORS = [
  { name: "red",    rgb: [255, 38, 26] },
  { name: "green",  rgb: [36, 230, 70] },
  { name: "blue",   rgb: [52, 96, 255] },
  { name: "yellow", rgb: [255, 212, 36] },
  { name: "orange", rgb: [255, 122, 14] },
  { name: "white",  rgb: [255, 208, 140] }
];

(function () {
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rgba(c, a) { return "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + "," + a + ")"; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function makeCanvas(w, h) {
    var c = document.createElement("canvas");
    c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
    return c;
  }

  var Scene = XL.Scene = function (canvas) {
    this.cv = canvas;
    this.g = canvas.getContext("2d");
    this.bulbs = [];
    this.rows = [];
  };

  /* ---------------------------------------------------------------- */
  /*  Layout: rows of draped light strings                             */
  /* ---------------------------------------------------------------- */
  Scene.prototype.layout = function (ctrl) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = window.innerWidth, H = window.innerHeight;
    this.W = W; this.H = H; this.dpr = dpr;
    this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr);
    this.cv.style.width = W + "px"; this.cv.style.height = H + "px";
    ctrl = ctrl || { left: W, top: H, right: W, bottom: H, width: 0, height: 0 };
    this.ctrl = ctrl;
    var narrow = document.body.classList.contains("narrow");
    this.narrow = narrow;

    this.u = Math.max(3.2, Math.min(9, Math.min(W, H) * (narrow ? 0.014 : 0.0115)));
    this._buildRows();
    this._buildBulbs();
    this._buildSprites();
    this._renderBackground();
  };

  /* Each row is a series of swags hanging between hooks. */
  Scene.prototype._buildRows = function () {
    var W = this.W, H = this.H, c = this.ctrl, u = this.u;
    var rows = [];
    var top = H * 0.05;
    var bottom, nRows, spans;
    if (this.narrow) {
      bottom = (c.width ? c.top : H) - u * 6;
      nRows = Math.max(2, Math.min(6, Math.round((bottom - top) / (H * 0.15))));
      spans = 2;
    } else {
      bottom = (c.width ? c.top : H * 0.9) - u * 5;
      nRows = Math.max(2, Math.min(5, Math.round((bottom - top) / (H * 0.16))));
      spans = Math.max(3, Math.round(W / 430));
    }
    var sw = (W * 1.04) / spans;
    var sag = Math.min(H * 0.07, sw * 0.17);
    var gap = nRows > 1 ? (bottom - top - sag) / (nRows - 1) : 0;
    for (var r = 0; r < nRows; r++) {
      rows.push({ y: top + r * gap, x0: -W * 0.02 - (r % 2 ? sw / 2 : 0), x1: W * 1.02 + (r % 2 ? sw / 2 : 0), sw: sw, sag: sag });
    }
    // in landscape, one more short row fills the space left of the controller
    if (!this.narrow && c.width && c.left > W * 0.35) {
      var y = c.top + (H - c.top) * 0.35;
      if (y < H - sag - u * 4) {
        var spansB = Math.max(1, Math.round((c.left - W * 0.04) / sw));
        var swB = (c.left + W * 0.02 - u * 3) / spansB;
        rows.push({ y: y, x0: -W * 0.02, x1: c.left - u * 3, sw: swB, sag: Math.min(sag, swB * 0.17), last: true });
      }
    }
    this.rows = rows;
  };

  Scene.prototype._rowPoint = function (row, x) {
    var k = (x - row.x0) / row.sw;
    var f = k - Math.floor(k);
    return row.y + row.sag * (1 - Math.pow(2 * f - 1, 2));
  };

  Scene.prototype._buildBulbs = function () {
    var r = rng(1999);
    var u = this.u, step = u * 6.6;
    var bulbs = [];
    var idx = 0;
    var self = this;
    this.rows.forEach(function (row, ri) {
      // walk the wire, placing bulbs at equal distances along it
      var dir = ri % 2 ? -1 : 1;                        // serpentine: one long string
      var xs = dir > 0 ? row.x0 : row.x1, xe = dir > 0 ? row.x1 : row.x0;
      var prevX = xs, prevY = self._rowPoint(row, xs), acc = step * 0.5;
      var n = Math.ceil(Math.abs(xe - xs));
      for (var i = 1; i <= n; i++) {
        var x = xs + dir * i, y = self._rowPoint(row, x);
        acc -= Math.hypot(x - prevX, y - prevY);
        if (acc <= 0) {
          acc += step;
          var down = r() < 0.72;
          var ang = (down ? Math.PI / 2 : -Math.PI / 2) + (r() - 0.5) * 1.1;
          bulbs.push({ x: x, y: y, ang: ang, u: u, idx: idx++, front: true, string: "main" });
        }
        prevX = x; prevY = y;
      }
    });
    bulbs.forEach(function (b) {
      b.color = b.idx % 6;
      b.circuit = b.idx % 4;
      var gl = 2.2 * b.u;
      b.gx = b.x + Math.cos(b.ang) * gl;
      b.gy = b.y + Math.sin(b.ang) * gl;
      b.level = 1;
    });
    this.bulbs = bulbs;
  };

  Scene.prototype._buildSprites = function () {
    var self = this;
    this.spr = { main: XL.BULB_COLORS.map(function (col) {
      return { off: self._bulbSprite(self.u, col, false), on: self._bulbSprite(self.u, col, true) };
    }) };
    this.halo = XL.BULB_COLORS.map(function (c) { return self._glowSprite(c.rgb, "halo"); });
    this.spill = XL.BULB_COLORS.map(function (c) { return self._glowSprite(c.rgb, "spill"); });
  };

  Scene.prototype._bulbSprite = function (u, col, lit) {
    var k = u * this.dpr;
    var w = 3.5 * k, h = 1.1 * k;
    var c = makeCanvas(w + 2, h + 2);
    var g = c.getContext("2d");
    g.translate(1, 1 + h / 2);
    var rgb = col.rgb;
    // glass
    g.beginPath();
    g.moveTo(0.95 * k, -0.36 * k);
    g.lineTo(2.35 * k, -0.4 * k);
    g.quadraticCurveTo(3.4 * k, -0.34 * k, 3.4 * k, 0);
    g.quadraticCurveTo(3.4 * k, 0.34 * k, 2.35 * k, 0.4 * k);
    g.lineTo(0.95 * k, 0.36 * k);
    g.closePath();
    var lg;
    if (lit) {
      lg = g.createLinearGradient(0.95 * k, 0, 3.4 * k, 0);
      lg.addColorStop(0, rgba(mix(rgb, [255, 255, 235], 0.75), 1));
      lg.addColorStop(0.35, rgba(mix(rgb, [255, 255, 240], 0.45), 1));
      lg.addColorStop(1, rgba(mix(rgb, [255, 255, 255], 0.12), 1));
    } else {
      var d = mix(rgb, [0, 0, 0], 0.62);
      lg = g.createLinearGradient(0.95 * k, 0, 3.4 * k, 0);
      lg.addColorStop(0, rgba(d, 0.92));
      lg.addColorStop(1, rgba(mix(d, [0, 0, 0], 0.25), 0.92));
    }
    g.fillStyle = lg;
    g.fill();
    // cylindrical shading
    var sg = g.createLinearGradient(0, -0.4 * k, 0, 0.4 * k);
    sg.addColorStop(0, "rgba(0,0,0," + (lit ? 0.12 : 0.35) + ")");
    sg.addColorStop(0.3, "rgba(255,255,255," + (lit ? 0.18 : 0.1) + ")");
    sg.addColorStop(0.55, "rgba(0,0,0,0)");
    sg.addColorStop(1, "rgba(0,0,0," + (lit ? 0.18 : 0.45) + ")");
    g.fillStyle = sg;
    g.fill();
    if (lit) {   // filament
      g.strokeStyle = "rgba(255,255,230,0.95)";
      g.lineWidth = Math.max(0.6, 0.12 * k);
      g.beginPath(); g.moveTo(1.35 * k, 0); g.lineTo(2.05 * k, 0); g.stroke();
    }
    // socket (green plastic)
    var so = g.createLinearGradient(0, -0.45 * k, 0, 0.45 * k);
    so.addColorStop(0, "#082b0c"); so.addColorStop(0.35, "#2c7a32"); so.addColorStop(0.6, "#1a5a20"); so.addColorStop(1, "#061f09");
    g.fillStyle = so;
    g.beginPath();
    g.moveTo(0, -0.3 * k); g.lineTo(1.05 * k, -0.45 * k); g.lineTo(1.05 * k, 0.45 * k); g.lineTo(0, 0.3 * k); g.closePath();
    g.fill();
    g.fillStyle = "rgba(0,0,0,0.35)";
    g.fillRect(0.55 * k, -0.4 * k, 0.08 * k, 0.8 * k);
    return c;
  };

  Scene.prototype._glowSprite = function (rgb, kind) {
    var S = kind === "spill" ? 128 : 96;
    var c = makeCanvas(S, S);
    var g = c.getContext("2d");
    var gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    if (kind === "spill") {
      gr.addColorStop(0, rgba(rgb, 0.5));
      gr.addColorStop(0.25, rgba(rgb, 0.22));
      gr.addColorStop(0.6, rgba(rgb, 0.06));
      gr.addColorStop(1, rgba(rgb, 0));
    } else {
      var hot = mix(rgb, [255, 255, 255], 0.55);
      gr.addColorStop(0, rgba(hot, 1));
      gr.addColorStop(0.09, rgba(mix(rgb, [255, 255, 255], 0.25), 0.85));
      gr.addColorStop(0.25, rgba(rgb, 0.42));
      gr.addColorStop(0.55, rgba(rgb, 0.1));
      gr.addColorStop(1, rgba(rgb, 0));
    }
    g.fillStyle = gr;
    g.fillRect(0, 0, S, S);
    return c;
  };

  /* ---------------------------------------------------------------- */
  /*  Static layer: dark background, wires, hooks, controller cable    */
  /* ---------------------------------------------------------------- */
  Scene.prototype._renderBackground = function () {
    var W = this.W, H = this.H, u = this.u, self = this;
    var c = makeCanvas(W * this.dpr, H * this.dpr);
    var g = c.getContext("2d");
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // warm, very dark background
    var bg = g.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, Math.max(W, H) * 0.8);
    bg.addColorStop(0, "#1b0d0b");
    bg.addColorStop(0.55, "#0e0606");
    bg.addColorStop(1, "#050303");
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    // a little grain against banding
    var r = rng(7);
    for (var i = 0; i < W * H / 900; i++) {
      g.fillStyle = r() < 0.5 ? "rgba(255,230,210,0.018)" : "rgba(0,0,0,0.05)";
      g.fillRect(r() * W, r() * H, 1, 1);
    }

    // wires
    var ww = Math.max(1.3, u * 0.3);
    g.lineCap = "round"; g.lineJoin = "round";
    this.rows.forEach(function (row) {
      g.beginPath();
      for (var x = row.x0; x <= row.x1; x += 3) {
        var y = self._rowPoint(row, x);
        if (x === row.x0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.strokeStyle = "#0e3612"; g.lineWidth = ww; g.stroke();
      g.strokeStyle = "rgba(90,160,90,0.22)"; g.lineWidth = ww * 0.4; g.stroke();
      // hooks
      for (var hx = row.x0; hx <= row.x1 + 1; hx += row.sw) {
        g.fillStyle = "#5c5546";
        g.beginPath(); g.arc(hx, row.y - 1.5, Math.max(1.6, u * 0.32), 0, 6.283); g.fill();
      }
    });

    // cable from the string down into the controller
    var ct = this.ctrl;
    var last = this.rows[this.rows.length - 1];
    if (ct && ct.width && last) {
      var bx = ct.left + ct.width * 0.18, by = ct.top - ct.width * 0.03;
      var sx = last.last ? last.x1 : bx, sy = self._rowPoint(last, sx);
      g.strokeStyle = "#0b2b0e"; g.lineWidth = Math.max(1.6, u * 0.38);
      g.beginPath();
      g.moveTo(sx, sy);
      g.bezierCurveTo(sx + (bx - sx) * 0.5, sy + (by - sy) * 0.1, bx, by - Math.min(60, (by - sy) * 0.6), bx, by);
      g.stroke();
      var ox = ct.left + ct.width * 0.82;
      g.beginPath();
      g.moveTo(ox, by);
      g.bezierCurveTo(ox, by - 40, Math.min(W - 6, ct.right + 10), by - 30, Math.min(W - 4, ct.right + 14), by + 30);
      g.lineTo(Math.min(W - 4, ct.right + 14), H + 10);
      g.stroke();
    }

    // vignette
    var vg = g.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.3, W / 2, H * 0.45, Math.max(W, H) * 0.8);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.55)");
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);
    this.bg = c;
  };

  /* ---------------------------------------------------------------- */
  /*  Per-frame drawing                                                */
  /* ---------------------------------------------------------------- */
  Scene.prototype.draw = function (time) {
    var g = this.g, W = this.W, H = this.H, dpr = this.dpr;
    if (!this.bg) return;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
    g.drawImage(this.bg, 0, 0);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    var bulbs = this.bulbs, n = bulbs.length, i, b, L;

    // the whole background takes on the colour of the lights
    var ar = 0, ag = 0, ab = 0, sum = 0;
    for (i = 0; i < n; i++) {
      b = bulbs[i]; L = b.out || 0;
      var rgb = XL.BULB_COLORS[b.color].rgb;
      ar += rgb[0] * L; ag += rgb[1] * L; ab += rgb[2] * L; sum += L;
    }
    g.globalCompositeOperation = "lighter";
    if (sum > 0.01) {
      var k = sum / n, col = [ar / sum, ag / sum, ab / sum];
      var amb = g.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.max(W, H) * 0.75);
      amb.addColorStop(0, rgba(col, 0.1 * k));
      amb.addColorStop(1, rgba(col, 0.02 * k));
      g.fillStyle = amb;
      g.fillRect(0, 0, W, H);
    }

    // soft light spill on the wall
    for (i = 0; i < n; i++) {
      b = bulbs[i]; L = b.out || 0; if (L < 0.02) continue;
      var ss = b.u * 12;
      g.globalAlpha = L * 0.3;
      g.drawImage(this.spill[b.color], b.gx - ss, b.gy - ss, ss * 2, ss * 2);
    }

    // bulb bodies
    g.globalCompositeOperation = "source-over";
    for (i = 0; i < n; i++) {
      b = bulbs[i]; L = b.out || 0;
      var spr = this.spr.main[b.color];
      var cs = Math.cos(b.ang), sn = Math.sin(b.ang);
      g.setTransform(cs, sn, -sn, cs, b.x * dpr, b.y * dpr);
      var oy = -spr.off.height / 2;
      g.globalAlpha = 1;
      g.drawImage(spr.off, -1, oy);
      if (L > 0.01) {
        g.globalAlpha = Math.min(1, L * 1.1);
        g.drawImage(spr.on, -1, oy);
      }
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    // halos
    g.globalCompositeOperation = "lighter";
    for (i = 0; i < n; i++) {
      b = bulbs[i]; L = b.out || 0; if (L < 0.02) continue;
      var hz = b.u * 4.4;
      g.globalAlpha = Math.min(1, L * 0.95);
      g.drawImage(this.halo[b.color], b.gx - hz, b.gy - hz, hz * 2, hz * 2);
    }
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
  };
})();
