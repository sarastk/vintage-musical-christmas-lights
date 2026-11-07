# Christmas Lights '99 – Musical Light Set 🎄

A nostalgic, browser-based recreation of those cheap multicoloured musical
Christmas lights from the late 1990s – the ones with the little green plastic
controller that beeped out carols while the bulbs flashed along.

- 18 traditional carols played by a synthesized "melody chip": square-wave tones, one note at a time, slightly out of tune like the real ICs
- 8 light functions, as on the real "8 function" controllers: Music Sync, Alternating, Chasing, Twinkling, All Flash, Classic Sequence, Slo-Glo and Steady On – while the music plays, **every** function follows the melody: the lights blink, step or change on each note
- Strings of big multicoloured mini lights draped across a dark, cozy background – the lights are the whole show
- Works offline, has no dependencies and needs no installation

---

## Run it on your computer

1. Unzip the folder.
2. Double-click **`index.html`** – it opens in your browser (Chrome or Firefox recommended).
3. Press the big red **▶❚❚** button on the green controller. Browsers only allow sound after a click, so the music starts the first time you press Play. After that it keeps going on its own.

That's it. No server needed.

## The controller

| Control | What it does |
|---|---|
| **MELODY** | Next melody (Shift-click = previous) |
| **PLAY/PAUSE** | Start / pause the music. The lights keep glowing while it's paused. |
| **LIGHTS** | Next lighting function |
| **VOL** slider | Volume |
| **AUTO / HOLD** switch | AUTO plays all melodies in turn. HOLD repeats the current one forever. |
| ⛶ (top-right corner) | Fullscreen – the controls fade away after a few seconds; move the mouse or tap to bring them back |
| Tap / click the scene | Hide or show the controller |

**Keyboard:** `Space` play/pause · `M` next melody · `L` next lights · `A` auto/hold · `F` fullscreen · `H` hide controller · `↑ ↓` volume · `[ ]` light delay

**Lights ahead of the sound?** Bluetooth speakers and some TVs play sound a little late. Press `]` a few
times (20 ms per press) until the flashes land exactly on the notes; `[` goes back. The setting is remembered.

Your last melody, light mode, volume, light delay and AUTO/HOLD setting are remembered in your browser.

**Tip for a TV:** open the page, press Play, then press fullscreen.

## Melodies

1. Jingle Bells · 2. Silent Night · 3. We Wish You a Merry Christmas ·
4. Hark! The Herald Angels Sing · 5. Angels We Have Heard on High · 6. Joy to the World ·
7. O Christmas Tree · 8. The First Noel · 9. Deck the Halls · 10. O Come, All Ye Faithful ·
11. The Twelve Days of Christmas · 12. O Little Town of Bethlehem · 13. God Rest Ye Merry, Gentlemen ·
14. Away in a Manger · 15. Carol of the Bells · 16. What Child Is This? · 17. Good King Wenceslas ·
18. We Three Kings

All of them are traditional, public-domain melodies, written out note by note as
simple single-line chip arrangements. Songs still under copyright (for example
*Rudolph*, *Frosty the Snowman* or *White Christmas*) are not included.

### Adding or fixing a song

Songs live in `js/songs.js` in a tiny text format:

```js
{ title: "SILENT NIGHT", bpm: 168, meter: 6, lb: 3,
  notes: `| G4:3 A4:1 G4:2 | E4:6 | ...` }
```

- `G4:3` = note G in octave 4 (C4 is middle C) lasting 3 units. `F#4`, `Bb4` for sharps and flats, `R:1` for a rest.
- `bpm` = units per minute, `meter` = units per bar (used only to check your work), `lb` = units per light beat.
- `|` bar lines are optional, but they let you check for mistakes: open the browser console and run `XL.validateSongs()`. It lists any bar that doesn't add up.

---

## Share it online for free

### Option A – Netlify Drop (easiest, about 2 minutes, no Git)

1. Go to **https://app.netlify.com/drop**
2. Drag the whole `xmas-lights` folder (the one that contains `index.html`) onto the page.
3. You get a link like `https://something-random.netlify.app`.
4. **Sign up (free) and claim the site.** If you don't, Netlify deletes anonymous sites after about an hour. You can also rename the site under *Site configuration → Change site name*.

To update it later, drag the folder onto the site's **Deploys** page again.

### Option B – GitHub Pages (permanent, free)

1. Create a free account at https://github.com and click **New repository**. Give it a name such as `christmas-lights`, make it **Public**, and create it.
2. On the new repo page, click **uploading an existing file**. Drag in the *contents* of the folder (`index.html`, `README.md`, and the `css` and `js` folders), then click **Commit changes**.
3. Go to **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, select branch **main** and folder **/ (root)**, then click **Save**.
4. After a minute or two your site is live at
   `https://YOUR-USERNAME.github.io/christmas-lights/`

Send that link to friends and family. It works on phones too.

---

## Troubleshooting

- **No sound?** Press the red Play button – browsers block sound until you click. Check the VOL slider and your device volume. On iPhone, the ring/silent switch must be on *ring*.
- **Fullscreen button missing on iPhone?** iPhone Safari doesn't allow web pages to go fullscreen. Use *Share → Add to Home Screen* for an almost-fullscreen view, or turn the phone sideways.
- **Music stutters in a background tab?** Keep the tab visible (it's meant to be watched 🙂). Browsers slow down hidden tabs.

## Project layout

```
index.html        page + controller markup
css/style.css     controller and page styles
js/songs.js       melody library (edit/add songs here)
js/audio.js       chip synth + sequencer (Web Audio API)
js/lights.js      the 8 light functions
js/scene.js       light strings, bulbs and glow rendering (canvas)
js/lcd.js         the controller's backlit display
js/main.js        wiring, controls, fullscreen, keyboard
```

Merry Christmas! 🎅
