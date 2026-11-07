/*
 * Melody library – simple monophonic renditions of traditional
 * (public-domain) Christmas melodies, written the way a 1990s
 * musical IC would store them: one note at a time, pitch + length.
 *
 * FORMAT
 *   Each token is  NOTE:LENGTH   e.g.  "F#4:1.5"  "Bb4:0.5"  "R:1"
 *     NOTE   = letter A–G, optional # or b, octave number (C4 = middle C)
 *              or R for a rest
 *     LENGTH = length in "units" (usually a quarter note = 1)
 *   "|" is a bar line. It is ignored by the player but lets the
 *   validator check that every full bar adds up to `meter` units.
 *
 *   bpm   = units per minute
 *   meter = units per bar (for validation only)
 *   lb    = units per "light beat" (used by the beat-driven light patterns)
 *
 * To add a song: copy one entry, change title/bpm/meter and the notes.
 * The player transposes everything up one octave so it sounds like a
 * tiny piezo/speaker chip.
 *
 * Only traditional / public-domain melodies are included.
 */
window.XL = window.XL || {};

XL.SONGS = [
  {
    title: "Jingle Bells", bpm: 184, meter: 4, lb: 1,
    notes: `
      | D4:1 B4:1 A4:1 G4:1 | D4:3 D4:0.5 D4:0.5 | D4:1 B4:1 A4:1 G4:1 | E4:4
      | E4:1 C5:1 B4:1 A4:1 | F#4:4 | D5:1 D5:1 C5:1 A4:1 | B4:4
      | D4:1 B4:1 A4:1 G4:1 | D4:3 D4:0.5 D4:0.5 | D4:1 B4:1 A4:1 G4:1 | E4:3 E4:1
      | E4:1 C5:1 B4:1 A4:1 | D5:1 D5:1 D5:1 D5:1 | E5:1 D5:1 C5:1 A4:1 | G4:2 R:2
      | B4:1 B4:1 B4:2 | B4:1 B4:1 B4:2 | B4:1 D5:1 G4:1.5 A4:0.5 | B4:4
      | C5:1 C5:1 C5:1.5 C5:0.5 | C5:1 B4:1 B4:1 B4:0.5 B4:0.5 | B4:1 A4:1 A4:1 B4:1 | A4:2 D5:2
      | B4:1 B4:1 B4:2 | B4:1 B4:1 B4:2 | B4:1 D5:1 G4:1.5 A4:0.5 | B4:4
      | C5:1 C5:1 C5:1.5 C5:0.5 | C5:1 B4:1 B4:1 B4:0.5 B4:0.5 | D5:1 D5:1 C5:1 A4:1 | G4:4 |`
  },
  {
    title: "Silent Night", bpm: 168, meter: 6, lb: 3,
    notes: `
      | G4:3 A4:1 G4:2 | E4:6 | G4:3 A4:1 G4:2 | E4:6
      | D5:4 D5:2 | B4:6 | C5:4 C5:2 | G4:6
      | A4:4 A4:2 | C5:3 B4:1 A4:2 | G4:3 A4:1 G4:2 | E4:6
      | A4:4 A4:2 | C5:3 B4:1 A4:2 | G4:3 A4:1 G4:2 | E4:6
      | D5:4 D5:2 | F5:3 D5:1 B4:2 | C5:6 | E5:6
      | C5:2 G4:2 E4:2 | G4:3 F4:1 D4:2 | C4:6 | R:6 |`
  },
  {
    title: "We Wish You a Merry Christmas", bpm: 168, meter: 3, lb: 1,
    notes: `
      D4:1 | G4:1 G4:0.5 A4:0.5 G4:0.5 F#4:0.5 | E4:1 E4:1 E4:1
      | A4:1 A4:0.5 B4:0.5 A4:0.5 G4:0.5 | F#4:1 D4:1 D4:1
      | B4:1 B4:0.5 C5:0.5 B4:0.5 A4:0.5 | G4:1 E4:1 D4:0.5 D4:0.5
      | E4:1 A4:1 F#4:1 | G4:2 D4:1
      | G4:1 G4:1 G4:1 | F#4:2 F#4:1 | G4:1 F#4:1 E4:1 | D4:2 A4:1
      | B4:1 A4:0.5 A4:0.5 G4:0.5 G4:0.5 | D5:1 D4:1 D4:0.5 D4:0.5
      | E4:1 A4:1 F#4:1 | G4:2 |`
  },
  {
    title: "Hark! The Herald Angels Sing", bpm: 132, meter: 4, lb: 1,
    notes: `
      | D4:1 G4:1 G4:1.5 F#4:0.5 | G4:1 B4:1 B4:1 A4:1 | D5:1 D5:1 D5:1.5 C5:0.5 | B4:1 A4:1 B4:2
      | D4:1 G4:1 G4:1.5 F#4:0.5 | G4:1 B4:1 B4:1 A4:1 | D5:1 A4:1 A4:1.5 F#4:0.5 | F#4:1 E4:1 D4:2
      | D5:1 D5:1 D5:1 G4:1 | C5:1 B4:1 B4:1 A4:1 | D5:1 D5:1 D5:1 G4:1 | C5:1 B4:1 B4:1 A4:1
      | E5:1 E5:1 E5:1 D5:1 | C5:1 B4:1 C5:2 | A4:1 B4:0.5 C5:0.5 D5:1.5 G4:0.5 | G4:1 A4:1 B4:2
      | E5:1.5 E5:0.5 E5:1 D5:1 | C5:1 B4:1 C5:2 | A4:1 B4:0.5 C5:0.5 D5:1.5 G4:0.5 | G4:1 A4:1 G4:2 |`
  },
  {
    title: "Angels We Have Heard on High", bpm: 150, meter: 4, lb: 1,
    notes: `
      | A4:1 A4:1 A4:1 C5:1 | C5:1.5 Bb4:0.5 A4:2 | A4:1 G4:1 A4:1 C5:1 | A4:1.5 G4:0.5 F4:2
      | A4:1 A4:1 A4:1 C5:1 | C5:1.5 Bb4:0.5 A4:2 | A4:1 G4:1 A4:1 C5:1 | A4:1.5 G4:0.5 F4:2
      | C5:2 D5:0.5 C5:0.5 Bb4:0.5 A4:0.5 | Bb4:2 C5:0.5 Bb4:0.5 A4:0.5 G4:0.5
      | A4:2 Bb4:0.5 A4:0.5 G4:0.5 F4:0.5 | G4:3 C4:1 | F4:1 G4:1 A4:1 Bb4:1 | A4:2 G4:2
      | C5:2 D5:0.5 C5:0.5 Bb4:0.5 A4:0.5 | Bb4:2 C5:0.5 Bb4:0.5 A4:0.5 G4:0.5
      | A4:2 Bb4:0.5 A4:0.5 G4:0.5 F4:0.5 | G4:3 C4:1 | F4:1 G4:1 A4:1 Bb4:1 | A4:2 G4:2 | F4:4 |`
  },
  {
    title: "Joy to the World", bpm: 104, meter: 2, lb: 1,
    notes: `
      | D5:1 C#5:0.75 B4:0.25 | A4:1.5 G4:0.5 | F#4:1 E4:1 | D4:1.5 A4:0.5
      | B4:1.5 B4:0.5 | C#5:1.5 C#5:0.5 | D5:1.5 D5:0.5
      | D5:0.5 C#5:0.5 B4:0.5 A4:0.5 | A4:0.75 G4:0.25 F#4:0.5 D5:0.5
      | D5:0.5 C#5:0.5 B4:0.5 A4:0.5 | A4:0.75 G4:0.25 F#4:0.5 F#4:0.5
      | F#4:0.5 F#4:0.5 F#4:0.5 F#4:0.25 G4:0.25 | A4:1.5 G4:0.25 F#4:0.25
      | E4:0.5 E4:0.5 E4:0.5 E4:0.25 F#4:0.25 | G4:1.5 F#4:0.25 E4:0.25
      | D4:0.5 D5:1 B4:0.5 | A4:0.75 G4:0.25 F#4:0.5 G4:0.5 | F#4:1 E4:1 | D4:2 |`
  },
  {
    title: "O Christmas Tree", bpm: 116, meter: 3, lb: 1,
    notes: `
      D4:1 | G4:0.75 G4:0.25 G4:1.5 A4:0.5 | B4:0.75 B4:0.25 B4:1.5 B4:0.5
      | A4:0.5 B4:0.5 C5:1 F#4:1 | A4:1 G4:1 D5:1
      | D5:0.5 B4:0.5 E5:1.5 D5:0.5 | D5:0.5 C5:0.5 C5:1.5 C5:0.5
      | C5:0.5 A4:0.5 D5:1.5 C5:0.5 | C5:0.5 B4:0.5 B4:1 D4:1
      | G4:0.75 G4:0.25 G4:1.5 A4:0.5 | B4:0.75 B4:0.25 B4:1.5 B4:0.5
      | A4:0.5 B4:0.5 C5:1 F#4:1 | A4:1 G4:2 |`
  },
  {
    title: "The First Noel", bpm: 150, meter: 3, lb: 1,
    notes: `
      F#4:0.5 E4:0.5 | D4:1.5 E4:0.5 F#4:0.5 G4:0.5 | A4:2 B4:0.5 C#5:0.5 | D5:1 C#5:1 B4:1
      | A4:2 B4:0.5 C#5:0.5 | D5:1 C#5:1 B4:1 | A4:1 B4:1 C#5:1 | D5:1 A4:1 G4:1 | F#4:2 F#4:0.5 E4:0.5
      | D4:1.5 E4:0.5 F#4:0.5 G4:0.5 | A4:2 B4:0.5 C#5:0.5 | D5:1 C#5:1 B4:1
      | A4:2 B4:0.5 C#5:0.5 | D5:1 C#5:1 B4:1 | A4:1 B4:1 C#5:1 | D5:1 A4:1 G4:1 | F#4:2 F#4:0.5 E4:0.5
      | D4:1.5 E4:0.5 F#4:0.5 G4:0.5 | A4:2 D5:0.5 C#5:0.5 | B4:2 B4:1
      | A4:2 B4:0.5 C#5:0.5 | D5:1 C#5:1 B4:1 | A4:1 B4:1 C#5:1 | D5:1 A4:1 G4:1 | F#4:3 |`
  },
  {
    title: "Deck the Halls", bpm: 160, meter: 4, lb: 1,
    notes: `
      | C5:1.5 Bb4:0.5 A4:1 G4:1 | F4:1 G4:1 A4:1 F4:1
      | G4:0.5 A4:0.5 Bb4:0.5 G4:0.5 A4:1.5 G4:0.5 | F4:1 E4:1 F4:2
      | C5:1.5 Bb4:0.5 A4:1 G4:1 | F4:1 G4:1 A4:1 F4:1
      | G4:0.5 A4:0.5 Bb4:0.5 G4:0.5 A4:1.5 G4:0.5 | F4:1 E4:1 F4:2
      | G4:1.5 A4:0.5 Bb4:1 G4:1 | A4:1.5 Bb4:0.5 C5:1 G4:1
      | A4:0.5 B4:0.5 C5:1 D5:0.5 E5:0.5 F5:1 | E5:1 D5:1 C5:2
      | C5:1.5 Bb4:0.5 A4:1 G4:1 | F4:1 G4:1 A4:1 F4:1
      | D5:0.5 D5:0.5 D5:0.5 D5:0.5 C5:1.5 Bb4:0.5 | A4:1 G4:1 F4:2 |`
  },
  {
    title: "O Come, All Ye Faithful", bpm: 132, meter: 4, lb: 1,
    notes: `
      G4:1 | G4:2 D4:1 G4:1 | A4:2 D4:2 | B4:1 A4:1 B4:1 C5:1 | B4:2 A4:1 G4:1
      | G4:2 F#4:1 E4:1 | F#4:1 G4:1 A4:1 B4:1 | F#4:1.5 E4:0.5 D4:2
      | D5:2 C5:1 B4:1 | C5:2 B4:2 | A4:1 B4:1 G4:1 A4:1 | F#4:1.5 E4:0.5 D4:1 G4:1
      | G4:1 F#4:1 G4:1 A4:1 | G4:2 D4:1 B4:1 | B4:1 A4:1 B4:1 C5:1 | B4:2 A4:1 B4:1
      | C5:1 B4:1 A4:1 G4:1 | F#4:2 G4:1 C5:1 | B4:2 A4:1.5 G4:0.5 | G4:4 |`
  },
  {
    title: "The Twelve Days of Christmas", bpm: 150, meter: 4, lb: 1,
    notes: `
      | D4:0.5 D4:0.5 D4:1 G4:1 G4:0.5 G4:1 F#4:0.5 G4:0.5 A4:0.5 B4:0.5 C5:0.5 A4:0.5 B4:1.5
        C5:0.5 D5:0.5 E5:0.5 C5:0.5 B4:0.5 G4:0.5 A4:1 G4:2 R:1
        D4:0.5 D4:0.5 D4:0.5 D4:0.5 G4:1 G4:0.5 G4:1 F#4:0.5 G4:0.5 A4:0.5 B4:0.5 C5:0.5 A4:0.5 B4:1.5
        D5:1 A4:0.5 B4:0.5 C5:1
        B4:0.5 C5:0.5 D5:0.5 E5:0.5 C5:0.5 B4:0.5 G4:0.5 A4:1 G4:2 R:1
        D4:0.5 D4:0.5 D4:1 G4:1 G4:0.5 G4:1 F#4:0.5 G4:0.5 A4:0.5 B4:0.5 C5:0.5 A4:0.5 B4:1.5
        D5:2 E5:1 C#5:1 D5:3 R:1
        D5:0.5 C5:0.5 B4:0.5 A4:0.5 G4:1
        C5:0.5 E4:0.5 G4:1 A4:0.5 G4:0.5 F#4:0.5 E4:0.5 D4:1
        B4:0.5 C5:0.5 D5:0.5 E5:0.5 C5:0.5 B4:0.5 G4:0.5 A4:1 G4:3 |`
  },
  {
    title: "O Little Town of Bethlehem", bpm: 100, meter: 4, lb: 1,
    notes: `
      B4:1 | B4:1 B4:1 A#4:1 B4:1 | D5:1 C5:1 E4:1 A4:1 | G4:1 F#4:1 G4:1 A4:1 | D4:3 B4:1
      | B4:1 B4:1 E5:1 D5:1 | D5:1 C5:1 E4:1 A4:1 | G4:1 F#4:1 G4:1 B4:0.5 A4:0.5 | G4:3 B4:1
      | B4:1 B4:1 A4:1 G4:1 | F#4:2 F#4:1 F#4:1 | E4:1 F#4:1 G4:1 A4:1 | B4:3 B4:1
      | B4:1 B4:1 A#4:1 B4:1 | D5:1 C5:1 E4:1 E5:1 | D5:1 G4:1 B4:1.5 A4:0.5 | G4:3 |`
  },
  {
    title: "God Rest Ye Merry, Gentlemen", bpm: 160, meter: 4, lb: 1,
    notes: `
      E4:1 | E4:1 B4:1 B4:1 A4:1 | G4:1 F#4:1 E4:1 D4:1 | E4:1 F#4:1 G4:1 A4:1 | B4:3 E4:1
      | E4:1 B4:1 B4:1 A4:1 | G4:1 F#4:1 E4:1 D4:1 | E4:1 F#4:1 G4:1 A4:1 | B4:3 B4:1
      | C5:1 A4:1 B4:1 C5:1 | D5:1 E5:1 B4:1 A4:1 | G4:1 E4:1 F#4:1 G4:1 | A4:2 G4:1 A4:1
      | B4:2 C5:1 B4:1 | B4:1 A4:1 G4:1 F#4:1 | E4:2 G4:0.5 F#4:0.5 E4:1 | A4:2 G4:1 A4:1
      | B4:1 C5:1 D5:1 E5:1 | B4:1 A4:1 G4:1 F#4:1 | E4:3 |`
  },
  {
    title: "Away in a Manger", bpm: 112, meter: 3, lb: 1,
    notes: `
      C4:1 | F4:1 F4:1 G4:0.5 A4:0.5 | F4:1 F4:1 A4:0.5 Bb4:0.5 | C5:1 C5:1 D5:1 | Bb4:2 G4:0.5 A4:0.5
      | Bb4:1 Bb4:1 C5:1 | A4:1 A4:1 F4:0.5 A4:0.5 | G4:1 D4:1 F4:1 | E4:2 C4:1
      | F4:1 F4:1 G4:0.5 A4:0.5 | F4:1 F4:1 A4:0.5 Bb4:0.5 | C5:1 C5:1 D5:1 | Bb4:2 G4:0.5 A4:0.5
      | Bb4:1 Bb4:1 C5:1 | A4:1 A4:1 F4:0.5 A4:0.5 | G4:1 D4:1 E4:1 | F4:2 |`
  },
  {
    title: "Carol of the Bells", bpm: 176, meter: 3, lb: 1,
    notes: `
      | Bb4:1 A4:0.5 Bb4:0.5 G4:1 | Bb4:1 A4:0.5 Bb4:0.5 G4:1 | Bb4:1 A4:0.5 Bb4:0.5 G4:1 | Bb4:1 A4:0.5 Bb4:0.5 G4:1
      | D5:1 C5:0.5 D5:0.5 Bb4:1 | D5:1 C5:0.5 D5:0.5 Bb4:1 | D5:1 C5:0.5 D5:0.5 Bb4:1 | D5:1 C5:0.5 D5:0.5 Bb4:1
      | G5:1 G5:0.5 G5:0.5 F5:0.5 Eb5:0.5 | D5:1 D5:0.5 D5:0.5 C5:0.5 Bb4:0.5 | C5:1 C5:0.5 C5:0.5 D5:0.5 C5:0.5 | G4:1 G4:0.5 G4:0.5 G4:1
      | G5:1 G5:0.5 G5:0.5 F5:0.5 Eb5:0.5 | D5:1 D5:0.5 D5:0.5 C5:0.5 Bb4:0.5 | C5:1 C5:0.5 C5:0.5 D5:0.5 C5:0.5 | G4:1 G4:0.5 G4:0.5 G4:1
      | D4:0.5 E4:0.5 F#4:0.5 G4:0.5 A4:0.5 Bb4:0.5 | C5:0.5 D5:0.5 C5:1 Bb4:1
      | D4:0.5 E4:0.5 F#4:0.5 G4:0.5 A4:0.5 Bb4:0.5 | C5:0.5 D5:0.5 C5:1 Bb4:1
      | Bb4:1 A4:0.5 Bb4:0.5 G4:1 | Bb4:1 A4:0.5 Bb4:0.5 G4:1 | Bb4:1 A4:0.5 Bb4:0.5 G4:1 | G4:3 |`
  },
  {
    title: "What Child Is This?", bpm: 156, meter: 3, lb: 1,
    notes: `
      E4:1 | G4:2 A4:1 | B4:1.5 C5:0.5 B4:1 | A4:2 F#4:1 | D4:1.5 E4:0.5 F#4:1
      | G4:2 E4:1 | E4:1.5 D#4:0.5 E4:1 | F#4:2 D#4:1 | B3:2 E4:1
      | G4:2 A4:1 | B4:1.5 C5:0.5 B4:1 | A4:2 F#4:1 | D4:1.5 E4:0.5 F#4:1
      | G4:1.5 F#4:0.5 E4:1 | D#4:1.5 C#4:0.5 D#4:1 | E4:3
      | D5:3 | D5:1.5 C#5:0.5 B4:1 | A4:2 F#4:1 | D4:1.5 E4:0.5 F#4:1
      | G4:2 E4:1 | E4:1.5 D#4:0.5 E4:1 | F#4:2 D#4:1 | B3:3
      | D5:3 | D5:1.5 C#5:0.5 B4:1 | A4:2 F#4:1 | D4:1.5 E4:0.5 F#4:1
      | G4:1.5 F#4:0.5 E4:1 | D#4:1.5 C#4:0.5 D#4:1 | E4:3 |`
  },
  {
    title: "Good King Wenceslas", bpm: 144, meter: 4, lb: 1,
    notes: `
      | G4:1 G4:1 G4:1 A4:1 | G4:1 G4:1 D4:2 | E4:1 D4:1 E4:1 F#4:1 | G4:2 G4:2
      | G4:1 G4:1 G4:1 A4:1 | G4:1 G4:1 D4:2 | E4:1 D4:1 E4:1 F#4:1 | G4:2 G4:2
      | D5:1 C5:1 B4:1 A4:1 | B4:1 A4:1 G4:2 | E4:1 D4:1 E4:1 F#4:1 | G4:2 G4:2
      | D4:1 D4:1 E4:1 F#4:1 | G4:1 G4:1 A4:2 | D5:1 C5:1 B4:1 A4:1 | G4:2 C5:2 | G4:4 |`
  },
  {
    title: "We Three Kings", bpm: 150, meter: 3, lb: 1,
    notes: `
      | B4:2 A4:1 | G4:2 E4:1 | F#4:1 G4:1 F#4:1 | E4:3
      | B4:2 A4:1 | G4:2 E4:1 | F#4:1 G4:1 F#4:1 | E4:3
      | G4:2 G4:1 | A4:2 A4:1 | B4:2 B4:1 | D5:1 C5:1 B4:1 | A4:1 B4:1 A4:1 | G4:2 F#4:1 | E4:3
      | F#4:2 A4:1 | G4:2 G4:1 | G4:2 D4:1 | G4:2 E4:1 | G4:3
      | G4:2 G4:1 | G4:2 D4:1 | G4:2 E4:1 | G4:3
      | G4:2 A4:1 | B4:2 C5:1 | B4:2 A4:1 | B4:2 G4:1
      | G4:2 G4:1 | G4:2 D4:1 | G4:2 E4:1 | G4:3 |`
  }
];

/* ---------- parser ---------- */
XL.NOTE_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

XL.parseSong = function (song) {
  var out = [];
  var bars = [];
  var cur = 0;
  var errors = [];
  song.notes.split(/\s+/).forEach(function (tok) {
    if (!tok) return;
    if (tok === "|") { bars.push(cur); cur = 0; return; }
    var m = tok.match(/^(R|([A-G])(#|b)?(\d)):(\d*\.?\d+)$/);
    if (!m) { errors.push("bad token '" + tok + "'"); return; }
    var dur = parseFloat(m[5]);
    var midi = null;
    if (m[1] !== "R") {
      var acc = m[3] === "#" ? 1 : m[3] === "b" ? -1 : 0;
      midi = 12 * (parseInt(m[4], 10) + 1) + XL.NOTE_INDEX[m[2]] + acc;
    }
    out.push({ midi: midi, dur: dur });
    cur += dur;
  });
  if (cur > 0) bars.push(cur);
  return { notes: out, bars: bars, errors: errors };
};

/* Checks every bar except the first (pick-up) and last for the right length. */
XL.validateSongs = function () {
  var report = [];
  XL.SONGS.forEach(function (s, i) {
    var p = XL.parseSong(s);
    p.errors.forEach(function (e) { report.push(s.title + ": " + e); });
    var b = p.bars.filter(function (x) { return x > 0; });
    for (var k = 1; k < b.length - 1; k++) {
      if (Math.abs(b[k] - s.meter) > 1e-6) {
        report.push(s.title + ": bar " + (k + 1) + " has " + b[k] + " units (expected " + s.meter + ")");
      }
    }
  });
  return report;
};

/* Parse everything once at load. */
XL.SONGS.forEach(function (s) {
  var p = XL.parseSong(s);
  s.parsed = p.notes;
  var pitched = p.notes.filter(function (n) { return n.midi !== null; }).map(function (n) { return n.midi; });
  s.minMidi = Math.min.apply(null, pitched);
  s.maxMidi = Math.max.apply(null, pitched);
  s.totalUnits = p.notes.reduce(function (a, n) { return a + n.dur; }, 0);
});
