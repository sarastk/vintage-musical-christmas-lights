/*
 * Audio: a tiny "melody chip" voice + a sequencer that plays the songs.
 *
 * The voice imitates the cheap single-channel music ICs that sat inside
 * 1990s Christmas light controllers: one square-wave note at a time,
 * slightly detuned (the chip divides a crystal clock by whole numbers),
 * short gaps between notes, and a small tinny speaker.
 */
window.XL = window.XL || {};

/*
 * Tones ("voices"). Different brands of light set used different melody
 * chips and speakers, so the controller offers several. Each one sets:
 *   wave      – "square" or a narrow pulse (duty 0..0.5)
 *   oct       – octave shift (piezo buzzers sang very high)
 *   peak      – note loudness
 *   decay     – null = held note, or a time constant in seconds for a
 *               "plucked" note that dies away (bell / music-box like)
 *   sustain   – level a held note droops to
 *   trem      – tremolo rate in Hz (0 = none): the fluttery "brrr" sound
 *   vib       – vibrato depth in cents (0 = none)
 *   hp/pk/pkGain/pkQ/lp – speaker / piezo colouring
 */
XL.TONES = [
  { id: "chip",   name: "CLASSIC", wave: "square", oct: 1, peak: 0.5,  decay: null, sustain: 0.72, trem: 0,  vib: 0,
    hp: 340, pk: 2400, pkGain: 5, pkQ: 1.1, lp: 5600 },
  { id: "buzzer", name: "BUZZER",       wave: 0.125,    oct: 2, peak: 0.62, decay: null, sustain: 1,    trem: 0,  vib: 0,
    hp: 900, pk: 3300, pkGain: 9, pkQ: 2.2, lp: 11000 },
  { id: "chime",  name: "CHIME",        wave: "square", oct: 1, peak: 0.7,  decay: 0.13, sustain: 0,    trem: 0,  vib: 0,
    hp: 300, pk: 2000, pkGain: 3, pkQ: 1,   lp: 3800 },
  { id: "warble", name: "WARBLE",       wave: 0.25,     oct: 1, peak: 0.85, decay: 0.45, sustain: 0,    trem: 17, vib: 0,
    hp: 380, pk: 2600, pkGain: 6, pkQ: 1.3, lp: 6000 },
  { id: "card",   name: "MUSIC CARD",   wave: 0.25,     oct: 2, peak: 0.72, decay: 0.22, sustain: 0,    trem: 0,  vib: 18,
    hp: 700, pk: 3000, pkGain: 7, pkQ: 1.8, lp: 9000 },
  { id: "toy",    name: "TOY ORGAN",    wave: "square", oct: 0, peak: 0.42, decay: null, sustain: 0.85, trem: 0,  vib: 10,
    hp: 220, pk: 1500, pkGain: 2, pkQ: 0.8, lp: 2600 }
];

XL.Chip = function () {
  this.ctx = null;
  this.volume = 0.6;
  this.tone = 0;
  this.clock = 131072;      // fake IC clock for divider-style tuning
  this.live = [];
  this.waves = {};
};

XL.Chip.prototype.init = function () {
  if (this.ctx) return;
  var AC = window.AudioContext || window.webkitAudioContext;
  var c = new AC({ latencyHint: "interactive" });
  this.ctx = c;

  this.voice = c.createGain();
  this.voice.gain.value = 1;

  // "tiny speaker": no bass, a resonant bump, soft top end (set per tone)
  this.hp = c.createBiquadFilter(); this.hp.type = "highpass"; this.hp.Q.value = 0.7;
  this.pk = c.createBiquadFilter(); this.pk.type = "peaking";
  this.lp = c.createBiquadFilter(); this.lp.type = "lowpass"; this.lp.Q.value = 0.4;

  this.master = c.createGain();
  this.master.gain.value = this.volGain(this.volume);

  var comp = c.createDynamicsCompressor();
  comp.threshold.value = -8; comp.knee.value = 6; comp.ratio.value = 4;
  comp.attack.value = 0.003; comp.release.value = 0.15;

  this.voice.connect(this.hp); this.hp.connect(this.pk); this.pk.connect(this.lp);
  this.lp.connect(this.master); this.master.connect(comp); comp.connect(c.destination);
  this.setTone(this.tone);
};

XL.Chip.prototype.setTone = function (i) {
  var n = XL.TONES.length;
  this.tone = ((i % n) + n) % n;
  if (!this.ctx) return;
  var v = XL.TONES[this.tone], t = this.ctx.currentTime;
  this.hp.frequency.setTargetAtTime(v.hp, t, 0.01);
  this.pk.frequency.setTargetAtTime(v.pk, t, 0.01);
  this.pk.gain.setTargetAtTime(v.pkGain, t, 0.01);
  this.pk.Q.setTargetAtTime(v.pkQ, t, 0.01);
  this.lp.frequency.setTargetAtTime(v.lp, t, 0.01);
};

/* A narrow pulse wave (like a cheap chip driving a piezo directly). */
XL.Chip.prototype.pulseWave = function (duty) {
  if (this.waves[duty]) return this.waves[duty];
  var N = 64, re = new Float32Array(N), im = new Float32Array(N);
  for (var k = 1; k < N; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
  return (this.waves[duty] = this.ctx.createPeriodicWave(re, im));
};

XL.Chip.prototype.volGain = function (v) { return v * v * 0.34; };

XL.Chip.prototype.setVolume = function (v) {
  this.volume = v;
  if (this.ctx) this.master.gain.setTargetAtTime(this.volGain(v), this.ctx.currentTime, 0.03);
};

XL.Chip.prototype.freq = function (midi, oct) {
  var f = 440 * Math.pow(2, (midi + 12 * oct - 69) / 12);
  var n = Math.max(2, Math.round(this.clock / f));
  return this.clock / n;     // integer divider → charmingly imperfect tuning
};

XL.Chip.prototype.playNote = function (midi, t, gate) {
  var c = this.ctx;
  var v = XL.TONES[this.tone];
  var o = c.createOscillator();
  if (v.wave === "square") o.type = "square";
  else o.setPeriodicWave(this.pulseWave(v.wave));
  var f = this.freq(midi, v.oct);
  o.frequency.setValueAtTime(f, t);
  var extra = [];
  if (v.vib) {                                   // slow pitch wobble
    var lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = 6;
    lg.gain.value = f * (Math.pow(2, v.vib / 1200) - 1);
    lfo.connect(lg); lg.connect(o.frequency);
    lfo.start(t); lfo.stop(t + gate + 0.06);
    extra.push(lfo);
  }
  var g = c.createGain();
  var peak = v.peak;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.003);
  if (v.decay) g.gain.setTargetAtTime(0, t + 0.003, v.decay);          // plucked: dies away
  else g.gain.setTargetAtTime(peak * v.sustain, t + 0.004, 0.22);     // held, gentle droop
  g.gain.setTargetAtTime(0, t + gate, 0.006);                          // crisp note off
  o.connect(g);
  var out = g;
  if (v.trem) {                                  // fast on/off flutter
    var tr = c.createGain(), tl = c.createOscillator(), td = c.createGain();
    tr.gain.value = 0.55;
    tl.type = "square"; tl.frequency.value = v.trem;
    td.gain.value = 0.45;
    tl.connect(td); td.connect(tr.gain);
    g.connect(tr); out = tr;
    tl.start(t); tl.stop(t + gate + 0.06);
    extra.push(tl);
  }
  out.connect(this.voice);
  o.start(t);
  o.stop(t + gate + 0.06);
  var rec = { o: o, g: g, end: t + gate + 0.06 };
  this.live.push(rec);
  var self = this;
  o.onended = function () {
    try { g.disconnect(); out.disconnect(); } catch (e) {}
    var i = self.live.indexOf(rec);
    if (i >= 0) self.live.splice(i, 1);
  };
};

/* Silence every scheduled / sounding note right now. */
XL.Chip.prototype.stopAll = function () {
  if (!this.ctx) return;
  var now = this.ctx.currentTime;
  this.live.forEach(function (r) {
    try {
      r.g.gain.cancelScheduledValues(now);
      r.g.gain.setValueAtTime(r.g.gain.value, now);
      r.g.gain.setTargetAtTime(0, now, 0.005);
      r.o.stop(now + 0.04);
    } catch (e) {}
  });
};

/* Small mechanical "tick" for button presses. */
XL.Chip.prototype.click = function () {
  var c = this.ctx;
  if (!c || c.state !== "running") return;
  var t = c.currentTime;
  var o = c.createOscillator();
  o.type = "square";
  o.frequency.setValueAtTime(3100, t);
  var g = c.createGain();
  g.gain.setValueAtTime(0.06, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
  o.connect(g); g.connect(this.master);
  o.start(t); o.stop(t + 0.02);
};

/* ------------------------------------------------------------------ */
/*  Sequencer                                                          */
/* ------------------------------------------------------------------ */

XL.Player = function (chip, songs) {
  this.chip = chip;
  this.songs = songs;
  this.selected = 0;        // the melody shown on the display
  this.auto = true;         // automatically advance to the next melody
  this.playing = false;
  this.started = false;
  this.events = [];         // timed events for the lights + display
  this.timer = null;
  this._resetSchedule();
};

XL.Player.prototype._resetSchedule = function () {
  this.schedSong = this.selected;
  this.noteIdx = 0;
  this.nextTime = 0;
  this.pass = 0;            // how many times the current song has played
};

/* Time "as heard": audio clock minus output latency, so lights match sound. */
XL.Player.prototype.now = function () {
  var c = this.chip.ctx;
  if (!c) return 0;
  var lat = c.outputLatency || c.baseLatency || 0;
  return c.currentTime - lat;
};

XL.Player.prototype._startSongAt = function (index, t) {
  this.schedSong = index;
  this.noteIdx = 0;
  this.pass = 0;
  this.nextTime = t;
  var s = this.songs[index];
  this.events.push({ type: "song", t: t, index: index, bpm: s.bpm, lb: s.lb || 1 });
};

XL.Player.prototype._schedule = function () {
  var c = this.chip.ctx;
  if (!c || !this.started) return;
  var ahead = document.hidden ? 3.0 : 0.25;   // background tabs get throttled timers
  var horizon = c.currentTime + ahead;
  var guard = 0;
  while (this.nextTime < horizon && guard++ < 500) {
    var song = this.songs[this.schedSong];
    var notes = song.parsed;
    if (this.noteIdx >= notes.length) {
      // song finished: repeat, loop, or move on
      this.pass++;
      var secs = song.totalUnits * 60 / song.bpm;
      var repeats = secs < 26 ? 2 : 1;
      if (!this.auto || this.pass < repeats) {
        this.noteIdx = 0;
        this.nextTime += 0.7;
        this.events.push({ type: "song", t: this.nextTime, index: this.schedSong, bpm: song.bpm, lb: song.lb || 1, repeat: true });
        continue;
      }
      var next = (this.schedSong + 1) % this.songs.length;
      this._startSongAt(next, this.nextTime + 1.5);
      continue;
    }
    var n = notes[this.noteIdx];
    var dur = n.dur * 60 / song.bpm;
    if (n.midi !== null) {
      var gate = dur - Math.min(0.065, dur * 0.22);
      this.chip.playNote(n.midi, this.nextTime, gate);
      this.events.push({
        type: "note", t: this.nextTime, end: this.nextTime + gate,
        midi: n.midi, dur: dur, beats: n.dur / (song.lb || 1),
        lo: song.minMidi, hi: song.maxMidi
      });
    }
    this.nextTime += dur;
    this.noteIdx++;
  }
};

XL.Player.prototype._ensureTimer = function () {
  if (this.timer) return;
  var self = this;
  this.timer = setInterval(function () { self._schedule(); }, 25);
};

XL.Player.prototype.play = function () {
  this.chip.init();
  var c = this.chip.ctx;
  var self = this;
  if (!this.started) {
    this.started = true;
    this.events.length = 0;
    this._startSongAt(this.selected, c.currentTime + 0.25);
  }
  this.playing = true;
  var p = c.resume();
  if (p && p.then) p.then(function () { self._schedule(); });
  this._ensureTimer();
  this._schedule();
};

XL.Player.prototype.pause = function () {
  this.playing = false;
  if (this.chip.ctx) this.chip.ctx.suspend();
};

XL.Player.prototype.toggle = function () {
  if (this.playing) this.pause(); else this.play();
  return this.playing;
};

/* Jump to another melody immediately (dir = +1 / -1). */
XL.Player.prototype.step = function (dir) {
  var n = this.songs.length;
  this.selected = (this.selected + (dir || 1) + n) % n;
  this.select(this.selected);
};

XL.Player.prototype.select = function (index) {
  this.selected = index;
  if (!this.started || !this.chip.ctx) { this._resetSchedule(); return; }
  this.chip.stopAll();
  var c = this.chip.ctx;
  var now = c.currentTime;
  this.events = this.events.filter(function (e) { return e.t <= now; });
  this._startSongAt(index, now + 0.18);
  this._schedule();
};

XL.Player.prototype.setAuto = function (on) { this.auto = !!on; };

/* Hand out events whose time has come (in "heard" time). */
XL.Player.prototype.takeDue = function () {
  var t = this.now();
  var due = [];
  while (this.events.length && this.events[0].t <= t) due.push(this.events.shift());
  return due;
};
