/*
 * The controller's little backlit display.
 * Two lines in a plain sans-serif font: song number + title (scrolls
 * smoothly when it is too long), and the status line underneath.
 */
window.XL = window.XL || {};

(function () {
  var FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  var INK = "rgba(20,32,10,0.92)";

  var LCD = XL.LCD = function (canvas) {
    this.cv = canvas;
    this.key = "";
    this.scrollKey = "";
    this.scrollStart = 0;
  };

  LCD.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = this.cv.getBoundingClientRect();
    var scale = this.cv.offsetWidth ? rect.width / this.cv.offsetWidth : 1;   // controller may be scaled
    this.cv.width = Math.round(this.cv.offsetWidth * dpr * Math.max(1, scale));
    this.cv.height = Math.round(this.cv.offsetHeight * dpr * Math.max(1, scale));
    this.key = "";
  };

  /*
   * s = { l1: "01  Jingle Bells", icon: "play"|"pause"|null, l2: "Music Sync",
   *       right: "AUTO", vol: null | 0..1 }
   */
  LCD.prototype.show = function (s, now) {
    var key = [s.l1, s.icon, s.l2, s.right, s.vol].join("|");
    if (key !== this.key) { this.key = key; this.s = s; }
    else if (!this.scrolling) return;
    this._draw(now || 0);
  };

  LCD.prototype._draw = function (now) {
    var s = this.s, cv = this.cv, g = cv.getContext("2d");
    var W = cv.width, H = cv.height;
    var bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#a9bb52");
    bg.addColorStop(1, "#93a843");
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    var sh = g.createLinearGradient(0, 0, 0, H * 0.22);
    sh.addColorStop(0, "rgba(0,0,0,0.22)"); sh.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = sh; g.fillRect(0, 0, W, H * 0.22);

    var pad = W * 0.045;
    var f1 = Math.round(H * 0.33), f2 = Math.round(H * 0.27);
    var y1 = H * 0.38, y2 = H * 0.8;
    g.fillStyle = INK;
    g.textBaseline = "alphabetic";

    // line 1 – song number and title, scrolling if it does not fit
    g.font = "600 " + f1 + "px " + FONT;
    var text = s.l1 || "";
    var tw = g.measureText(text).width;
    var avail = W - pad * 2;
    this.scrolling = tw > avail;
    g.save();
    g.beginPath(); g.rect(pad * 0.6, 0, W - pad * 1.2, H * 0.52); g.clip();
    if (this.scrolling) {
      if (this.scrollKey !== text) { this.scrollKey = text; this.scrollStart = now; }
      var gapW = f1 * 3;
      var speed = f1 * 1.6;                                   // px per second
      var t = Math.max(0, now - this.scrollStart - 1.8);
      var off = (t * speed) % (tw + gapW);
      g.fillText(text, pad - off, y1);
      g.fillText(text, pad - off + tw + gapW, y1);
    } else {
      g.fillText(text, pad, y1);
    }
    g.restore();

    // line 2 – status
    var x = pad;
    if (s.vol !== null && s.vol !== undefined) {
      g.font = "500 " + f2 + "px " + FONT;
      g.fillText("Volume", x, y2);
      var bx = x + g.measureText("Volume").width + f2 * 0.6;
      var bw = W - pad - bx, bh = f2 * 0.62, by = y2 - bh;
      g.strokeStyle = INK; g.lineWidth = Math.max(1, H * 0.025);
      g.strokeRect(bx, by, bw, bh);
      g.fillRect(bx + 2, by + 2, Math.max(0, (bw - 4) * s.vol), bh - 4);
      return;
    }
    if (s.icon) {
      var ih = f2 * 0.72, iy = y2 - ih;
      g.beginPath();
      if (s.icon === "play") {
        g.moveTo(x, iy); g.lineTo(x + ih * 0.85, iy + ih / 2); g.lineTo(x, iy + ih); g.closePath(); g.fill();
      } else {
        g.fillRect(x, iy, ih * 0.3, ih); g.fillRect(x + ih * 0.55, iy, ih * 0.3, ih);
      }
      x += ih * 1.5;
    }
    g.font = "500 " + f2 + "px " + FONT;
    g.fillText(s.l2 || "", x, y2);
    if (s.right) {
      g.font = "700 " + Math.round(f2 * 0.85) + "px " + FONT;
      g.textAlign = "right";
      g.fillText(s.right, W - pad, y2);
      g.textAlign = "left";
    }
  };
})();
