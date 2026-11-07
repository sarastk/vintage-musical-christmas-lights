/*
 * Wires everything together: controller buttons, display, lights,
 * scene drawing, fullscreen and keyboard shortcuts.
 */
(function () {
  "use strict";
  var XL = window.XL;
  var $ = function (id) { return document.getElementById(id); };

  var chip = new XL.Chip();
  var player = new XL.Player(chip, XL.SONGS);
  var lights = new XL.Lights();
  var scene = new XL.Scene($("scene"));
  var lcd = new XL.LCD($("lcd"));
  var ctrlEl = $("controller");
  var body = document.body;

  /* ---------- saved settings ---------- */
  var STORE = "xl-lights-1999";
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE) || "{}") || {}; } catch (e) { saved = {}; }
  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify({
        song: player.selected, mode: lights.mode, vol: chip.volume, auto: player.auto, delay: lightDelay
      }));
    } catch (e) {}
  }
  if (typeof saved.song === "number" && saved.song < XL.SONGS.length) player.selected = saved.song;
  if (typeof saved.mode === "number") lights.setMode(saved.mode);
  if (typeof saved.vol === "number") chip.volume = Math.max(0, Math.min(1, saved.vol));
  if (typeof saved.auto === "boolean") player.auto = saved.auto;
  /* Extra delay (seconds) for the lights, for speakers that play late (Bluetooth, TVs). */
  var lightDelay = typeof saved.delay === "number" ? Math.max(0, Math.min(0.5, saved.delay)) : 0;
  $("vol").value = Math.round(chip.volume * 100);
  $("autoSw").setAttribute("aria-checked", player.auto ? "true" : "false");
  body.classList.add("not-started");

  /* ---------- display ---------- */
  var overlay = { text: "", vol: null, until: 0 };
  function two(n) { return (n < 10 ? "0" : "") + n; }
  function titleCase(t) {
    return String(t).toLowerCase().replace(/(^|[\s-])([a-z])/g, function (m, p, c) { return p + c.toUpperCase(); });
  }

  function updateDisplay(now) {
    var s = { l1: "", icon: null, l2: "", right: "", vol: null };
    if (!player.started && Math.floor(now / 1.6) % 2 === 1) s.l1 = "Press PLAY to start";
    else s.l1 = two(player.selected + 1) + "  " + XL.SONGS[player.selected].title;
    if (overlay.until > now) {
      if (overlay.vol !== null) s.vol = overlay.vol;
      else s.l2 = overlay.text;
    } else {
      s.icon = player.playing ? "play" : "pause";
      s.l2 = XL.LIGHT_MODES[lights.mode].short;
      s.right = player.auto ? "AUTO" : "HOLD";
    }
    lcd.show(s, now);
  }
  function flashOverlay(text, secs, vol) {
    overlay.text = text;
    overlay.vol = vol === undefined ? null : vol;
    overlay.until = performance.now() / 1000 + (secs || 1.4);
  }

  /* ---------- controls ---------- */
  function press(el) {
    el.classList.add("pressed");
    setTimeout(function () { el.classList.remove("pressed"); }, 110);
    chip.click();
  }

  function togglePlay() {
    press($("btnPlay"));
    player.toggle();
    body.classList.remove("not-started");
    $("btnPlay").setAttribute("aria-label", player.playing ? "Pause" : "Play");
  }
  function nextMelody(dir) {
    press($("btnMelody"));
    player.step(dir || 1);
    lights.vEnd = 0; lights.lastEnd = 0;
    save();
  }
  function nextMode(dir) {
    press($("btnMode"));
    lights.setMode(lights.mode + (dir || 1));
    flashOverlay(XL.LIGHT_MODES[lights.mode].name, 1.3);
    save();
  }
  function setVolume(v, show) {
    v = Math.max(0, Math.min(1, v));
    chip.setVolume(v);
    $("vol").value = Math.round(v * 100);
    if (show) flashOverlay("", 1.2, v);
    save();
  }
  function nudgeDelay(d) {
    lightDelay = Math.max(0, Math.min(0.5, Math.round((lightDelay + d) * 1000) / 1000));
    flashOverlay("Light delay: " + Math.round(lightDelay * 1000) + " ms", 1.5);
    save();
  }
  function toggleAuto() {
    player.setAuto(!player.auto);
    $("autoSw").setAttribute("aria-checked", player.auto ? "true" : "false");
    chip.click();
    flashOverlay(player.auto ? "Auto: plays all songs" : "Hold: repeats this song", 1.3);
    save();
  }

  $("btnPlay").addEventListener("click", togglePlay);
  $("btnMelody").addEventListener("click", function (e) { nextMelody(e.shiftKey ? -1 : 1); });
  $("btnMode").addEventListener("click", function (e) { nextMode(e.shiftKey ? -1 : 1); });
  $("vol").addEventListener("input", function () { setVolume(this.value / 100, true); });
  $("autoSw").addEventListener("click", toggleAuto);

  /* ---------- fullscreen ---------- */
  var root = document.documentElement;
  var fsSupported = !!(root.requestFullscreen || root.webkitRequestFullscreen);
  if (!fsSupported) $("fsBtn").classList.add("hidden-api");
  function isFs() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function toggleFullscreen() {
    try {
      if (isFs()) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else {
        var p = (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
        if (p && p.catch) p.catch(function () {});
      }
    } catch (e) {}
  }
  $("fsBtn").addEventListener("click", toggleFullscreen);
  function onFsChange() {
    body.classList.toggle("is-fs", isFs());
    poke();
    scheduleLayout();
  }
  document.addEventListener("fullscreenchange", onFsChange);
  document.addEventListener("webkitfullscreenchange", onFsChange);

  /* In fullscreen the controls fade away after a few quiet seconds. */
  var idleTimer = null;
  function poke() {
    body.classList.remove("idle");
    clearTimeout(idleTimer);
    if (isFs()) idleTimer = setTimeout(function () { body.classList.add("idle"); }, 3500);
  }
  ["mousemove", "mousedown", "touchstart", "keydown"].forEach(function (ev) {
    window.addEventListener(ev, poke, { passive: true });
  });

  /* Tap / click the scene to hide or show the controller. */
  $("scene").addEventListener("click", function () {
    if (body.classList.contains("idle")) return;
    body.classList.toggle("ui-hidden");
  });

  /* ---------- keyboard ---------- */
  window.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    if (k === " " || k === "Spacebar" || k === "p" || k === "P") { e.preventDefault(); togglePlay(); }
    else if (k === "m" || k === "M" || k === "n" || k === "N") nextMelody(e.shiftKey ? -1 : 1);
    else if (k === "l" || k === "L") nextMode(e.shiftKey ? -1 : 1);
    else if (k === "f" || k === "F") toggleFullscreen();
    else if (k === "a" || k === "A") toggleAuto();
    else if (k === "]") nudgeDelay(0.02);
    else if (k === "[") nudgeDelay(-0.02);
    else if (k === "h" || k === "H") body.classList.toggle("ui-hidden");
    else if (k === "ArrowUp" || k === "ArrowRight") { e.preventDefault(); setVolume(chip.volume + 0.1, true); }
    else if (k === "ArrowDown" || k === "ArrowLeft") { e.preventDefault(); setVolume(chip.volume - 0.1, true); }
  });

  /* ---------- layout ---------- */
  function sizeController() {
    var W = window.innerWidth, H = window.innerHeight;
    var narrow = W < 640 || H > W * 1.05;
    body.classList.toggle("narrow", narrow);
    ctrlEl.style.setProperty("--s", "1");
    var h = ctrlEl.offsetHeight || 260;
    var s;
    if (narrow) s = Math.min((W - 24) / 300, (H * 0.3) / h, 1.0);
    else s = Math.min((H * 0.36) / h, (W * 0.22) / 300, 1.05);
    s = Math.max(0.5, s);
    ctrlEl.style.setProperty("--s", s.toFixed(3));
  }
  function layout() {
    sizeController();
    var prev = scene.bulbs;
    var r = ctrlEl.getBoundingClientRect();
    scene.layout({ left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
    if (prev && prev.length === scene.bulbs.length) {
      for (var i = 0; i < prev.length; i++) scene.bulbs[i].level = prev[i].level;
    }
    lights.setBulbs(scene.bulbs);
    lcd.resize();
  }
  var layoutTimer = null;
  function scheduleLayout() {
    clearTimeout(layoutTimer);
    layoutTimer = setTimeout(layout, 120);
  }
  window.addEventListener("resize", scheduleLayout);
  window.addEventListener("orientationchange", scheduleLayout);

  /* ---------- main loop ---------- */
  var seg = null;            // the song currently being heard: {t, bpm, lb}
  var beat = 0;
  var last = performance.now();

  function frame(ts) {
    var now = ts / 1000;
    var dt = Math.min(0.1, Math.max(0, (ts - last) / 1000));
    last = ts;

    // events that have just become audible
    var heard = player.now() - lightDelay;
    var due = [];
    while (player.events.length && player.events[0].t <= heard) due.push(player.events.shift());
    for (var i = 0; i < due.length; i++) {
      var e = due[i];
      if (e.type === "song") {
        seg = e;
        if (!e.repeat && player.selected !== e.index) { player.selected = e.index; save(); }
      } else if (e.type === "note") {
        lights.onNote(e);
      }
    }

    // musical beat clock: locked to the audio while playing, free-running otherwise
    if (player.playing && seg && chip.ctx && chip.ctx.state === "running") {
      beat = (heard - seg.t) * seg.bpm / 60 / seg.lb;
    } else {
      var bpm = seg ? seg.bpm / seg.lb : 110;
      beat += dt * Math.min(140, Math.max(70, bpm)) / 60;
    }

    lights.update(dt, { time: now, beat: beat, playing: player.playing && !!chip.ctx, heard: heard });
    scene.draw(now, dt);

    var ledOn = player.playing && lights.anyNoteOn(heard);
    if (ledOn !== frame.led) { $("led").classList.toggle("on", ledOn); frame.led = ledOn; }
    updateDisplay(now);

    requestAnimationFrame(frame);
  }

  // expose for debugging / tests
  XL.app = { player: player, lights: lights, scene: scene, chip: chip, lcd: lcd,
             togglePlay: togglePlay, nextMelody: nextMelody, nextMode: nextMode,
             setVolume: setVolume, toggleAuto: toggleAuto, nudgeDelay: nudgeDelay, toggleFullscreen: toggleFullscreen,
             debug: function () { return { beat: beat, seg: seg }; } };

  layout();
  updateDisplay(performance.now() / 1000);
  requestAnimationFrame(frame);
  // fonts / late layout changes
  window.addEventListener("load", scheduleLayout);
})();
