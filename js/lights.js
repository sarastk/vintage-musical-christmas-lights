/*
 * Lighting patterns – modelled on the classic 4-circuit "8 function"
 * controllers: every bulb belongs to one of 4 circuits (bulb index % 4),
 * so chasing, alternating and sequencing work exactly like the real thing.
 *
 * Each frame a pattern sets a target brightness per bulb; the bulb then
 * follows it with incandescent-style lag (fast heat-up, slower cool-down)
 * plus small flicker and per-bulb brightness variance.
 */
window.XL = window.XL || {};

XL.LIGHT_MODES = [
  { id: "sync",      name: "Music Sync",       short: "Music Sync" },
  { id: "alternate", name: "Alternating",      short: "Alternating" },
  { id: "chase",     name: "Chasing Lights",   short: "Chasing" },
  { id: "twinkle",   name: "Twinkling",        short: "Twinkling" },
  { id: "flash",     name: "All Flash",        short: "All Flash" },
  { id: "classic",   name: "Classic Sequence", short: "Classic" },
  { id: "sloglo",    name: "Slo-Glo Fade",     short: "Slo-Glo" },
  { id: "steady",    name: "Steady On",        short: "Steady On" }
];

XL.Lights = function () {
  this.mode = 0;
  this.bulbs = [];
  this.syncCircuits = [0, 0, 0, 0];  // "on until" times per circuit (heard time)
  this.noteUntil = 0;
  this.lastNoteT = -10;
  this.time = 0;
  this.nc = 0;
  this.vEnd = 0;
  this.lastEnd = 0;
  this.syncC = -1;
  this.prevC = -1;
};

function fmod(a, n) { return ((a % n) + n) % n; }
function hash(i, k) {
  var x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

XL.Lights.prototype.setBulbs = function (bulbs) {
  this.bulbs = bulbs;
  var n = bulbs.length;
  for (var i = 0; i < n; i++) {
    var b = bulbs[i];
    if (b.level === undefined) b.level = 1;
    b.target = 1;
    b.vary = 0.82 + 0.18 * hash(i, 3);
    b.ph = hash(i, 9) * 6.283;
    b.fr = 7 + hash(i, 5) * 9;
    b.spark = -10;
    b.dip = 0;
  }
  this.looseIdx = n ? Math.floor(hash(n, 1) * n) : -1;
  this.looseUntil = 0;
  this.looseNext = 6;
};

XL.Lights.prototype.setMode = function (m) {
  this.mode = (m + XL.LIGHT_MODES.length) % XL.LIGHT_MODES.length;
};

/*
 * Called for every note at the moment it is heard. While music plays,
 * EVERY light function is driven by these note events, so the lights
 * step, blink and change exactly with the melody.
 */
XL.Lights.prototype.onNote = function (ev) {
  this.nc = (this.nc || 0) + 1;                       // notes heard so far
  this.lastNoteT = ev.t;
  this.noteUntil = ev.end;
  // the bulbs are visibly "on" for the first part of each note and drop
  // out before the next one, so even fast repeated notes blink clearly
  var len = Math.max(0.06, Math.min(ev.end - ev.t, ev.dur * 0.62));
  this.vEnd = ev.t + len;
  this.lastEnd = ev.end;

  // Music Sync: pitch chooses the circuit (low notes → circuit 0 … high → 3)
  var span = Math.max(1, ev.hi - ev.lo + 1);
  var c = Math.min(3, Math.max(0, Math.floor((ev.midi - ev.lo) / span * 4)));
  if (ev.midi === this.prevMidi && this.prevC >= 0) c = (this.prevC + 2) % 4;   // repeated note → other bulbs
  this.prevMidi = ev.midi;
  this.prevC = c;
  this.syncC = ev.beats >= 1.9 ? -1 : c;              // long notes light everything

  // twinkle: every note sparks a handful of random bulbs
  var n = this.bulbs.length;
  var count = Math.max(3, Math.round(n * 0.08));
  for (var s = 0; s < count; s++) {
    var bb = this.bulbs[Math.floor(Math.random() * n)];
    if (bb) bb.spark = this.time;
  }
};

/*
 * info: { time (s, wall clock), beat (float), playing (bool), heard (audio time) }
 */
XL.Lights.prototype.update = function (dt, info) {
  this.time = info.time;
  var t = info.time;
  var bulbs = this.bulbs;
  var n = bulbs.length;
  var mode = XL.LIGHT_MODES[this.mode].id;
  var music = info.playing && this.nc > 0;
  var i, b, v;

  if (music) {
    var h = info.heard;
    var k = this.nc;
    var on = h < this.vEnd;                            // a note is "lit" right now
    var resting = h > this.lastEnd + 0.45;            // pause in the melody / between songs
    var hold = resting ? 0.18 : 1;
    var OFF = 0.02;
    var sub = Math.floor(k / 16) % 6;
    this.classicSub = sub;
    for (i = 0; i < n; i++) {
      b = bulbs[i];
      var c = b.circuit;
      switch (mode) {
        case "sync":
          v = on && (this.syncC < 0 || c === this.syncC) ? 1 : OFF;
          break;
        case "alternate":                              // groups swap on every note
          v = (c % 2) === (k % 2) ? (on ? 1 : 0.45 * hold) : OFF;
          break;
        case "chase":                                  // one step along the string per note
          var lead = k % 4;
          v = c === lead ? (on ? 1 : 0.5 * hold) : c === (lead + 3) % 4 ? 0.22 * hold : OFF;
          break;
        case "twinkle":
          if (Math.random() < dt * 0.04) b.spark = t;
          var age = t - b.spark;
          var env = age < 0.08 ? age / 0.08 : Math.exp(-(age - 0.08) / 0.45);
          v = Math.max(0.08, env);
          break;
        case "flash":                                  // everything blinks with each note
          v = on ? 1 : OFF;
          break;
        case "classic":
          v = this._classicNotes(sub, k, on, hold, i, c);
          break;
        case "sloglo":                                 // halves glide across, a step per note
          v = (c % 2) === (k % 2) ? 1 : 0.08;
          break;
        default:                                       // steady on, with a gentle pulse per note
          v = on ? 1 : 0.8;
      }
      b.target = v;
    }
  } else {
    this._idle(mode, t, info.beat, dt);
  }

  // incandescent response: fast heat-up, quick cool-down so blinks read clearly
  var tauUp = 0.02, tauDown = music ? 0.04 : 0.085;
  if (mode === "sloglo") { tauUp = 0.22; tauDown = 0.3; }
  var up = 1 - Math.exp(-dt / tauUp);
  var down = 1 - Math.exp(-dt / tauDown);
  // the slightly loose bulb
  if (t > this.looseNext) {
    this.looseUntil = t + 0.4 + Math.random() * 0.6;
    this.looseNext = t + 7 + Math.random() * 14;
  }
  if (Math.random() < dt * 1.2 && n) {
    var d = bulbs[Math.floor(Math.random() * n)];
    d.dip = t + 0.04 + Math.random() * 0.08;
  }
  for (i = 0; i < n; i++) {
    b = bulbs[i];
    var kk = b.target > b.level ? up : down;
    b.level += (b.target - b.level) * kk;
    var f = b.vary * (0.965 + 0.035 * Math.sin(t * b.fr + b.ph));
    if (b.dip > t) f *= 0.62;
    if (i === this.looseIdx && this.looseUntil > t && Math.random() < 0.5) f *= 0.15;
    b.out = Math.max(0, Math.min(1, b.level * f));
  }
};

/* Classic sequence while music plays: each sub-pattern steps with the notes. */
XL.Lights.prototype._classicNotes = function (sub, k, on, hold, i, c) {
  var OFF = 0.02;
  switch (sub) {
    case 0: // "in waves": two neighbouring circuits, rolling one step per note
      return (c === k % 4 || c === (k + 1) % 4) ? (on ? 1 : 0.5 * hold) : 0.05;
    case 1: // "sequential": circuits build up note by note, then switch off
      var s = k % 8;
      return (s < 4 ? c <= s : c > s - 4) ? (on ? 1 : 0.6 * hold) : OFF;
    case 2: // "glow pulse": everything swells on each note
      return on ? 1 : 0.2;
    case 3: // "chasing / flash"
      if (Math.floor(k / 8) % 2 === 0) return c === k % 4 ? (on ? 1 : 0.45 * hold) : OFF;
      return on ? 1 : OFF;
    case 4: // "twinkle / flash": a new random half of the bulbs on every note
      return hash(i, k) > 0.5 ? (on ? 1 : 0.35 * hold) : 0.04;
    default: // "combination"
      return (c % 2) === (k % 2) ? (on ? 1 : 0.5 * hold) : 0.12;
  }
};

/* When the music is paused or not started yet, the patterns keep running
   on a gentle internal clock so the lights still look alive. */
XL.Lights.prototype._idle = function (mode, t, beat, dt) {
  var bulbs = this.bulbs, n = bulbs.length, OFF = 0.02;
  if (mode === "classic") this.classicSub = fmod(Math.floor(beat / 8), 6);
  for (var i = 0; i < n; i++) {
    var b = bulbs[i], c = b.circuit, v = 1;
    switch (mode) {
      case "sync":
        v = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 1.4 - c * Math.PI / 2));
        break;
      case "alternate":
        v = (c % 2) === fmod(Math.floor(beat), 2) ? 1 : OFF;
        break;
      case "chase":
        var lead = fmod(Math.floor(beat * 2), 4);
        v = c === lead ? 1 : c === fmod(lead - 1, 4) ? 0.28 : OFF;
        break;
      case "twinkle":
        if (Math.random() < dt * 0.22) b.spark = t;
        var age = t - b.spark;
        v = Math.max(0.1, age < 0.14 ? age / 0.14 : Math.exp(-(age - 0.14) / 0.55));
        break;
      case "flash":
        v = fmod(beat, 1) < 0.5 ? 1 : OFF;
        break;
      case "classic":
        v = this._classic(this.classicSub, beat, i, c);
        break;
      case "sloglo":
        v = 0.04 + 0.96 * (0.5 - 0.5 * Math.cos(Math.PI * 2 * beat / 8 + (c % 2) * Math.PI));
        break;
      default:
        v = 1;
    }
    b.target = v;
  }
};

XL.Lights.prototype._classic = function (sub, beat, i, c) {
  var OFF = 0.02;
  switch (sub) {
    case 0: // "in waves"
      return 0.06 + 0.94 * Math.max(0, Math.sin(Math.PI * 2 * (beat / 2) - c * Math.PI / 2));
    case 1: // "sequential": circuits build up, then switch off one by one
      var s = fmod(Math.floor(beat * 2), 8);
      return (s < 4 ? c <= s : c > s - 4) ? 1 : OFF;
    case 2: // "slo-glo"
      return 0.04 + 0.96 * (0.5 - 0.5 * Math.cos(Math.PI * 2 * beat / 4));
    case 3: // "chasing / flash"
      if (fmod(Math.floor(beat / 2), 2) === 0) return c === fmod(Math.floor(beat * 4), 4) ? 1 : OFF;
      return fmod(beat * 4, 1) < 0.5 ? 1 : OFF;
    case 4: // "twinkle / flash"
      return hash(i, Math.floor(beat * 2)) > 0.55 ? 1 : 0.06;
    default: // "combination"
      return (c % 2) === fmod(Math.floor(beat), 2) ? 1 : 0.15;
  }
};

XL.Lights.prototype.anyNoteOn = function (heard) { return heard < this.noteUntil; };
