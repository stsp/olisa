# Olli & Lissa — Intro Remake

A modern re-creation of the title/credits intro of *Olli & Lissa: The Ghost of Shilmoore Castle*
(ZX Spectrum, Ionis Software International, 1986), built as a single web page.

Everything is drawn and synthesized from code: the stormy sky, lightning, dead trees, rolling
green hills, the castle with its glowing windows, the red gate with the peeking ghost, and the
cycling credits. The music is an original three-minute chiptune written in the style of the 1986 beeper tune
(pulse-wave lead, bouncing octave bass, buzzing arpeggio), played through the Web Audio API,
with synthesized thunder timed to the lightning. It follows a song form: intro, verse,
chorus, second verse, chorus, bridge, third verse (an octave up), chorus, outro.

## Run

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

then visit http://localhost:8000. Click or press any key to start (browsers require a gesture
before audio can play).

## Keys

| Key | Action |
| --- | --- |
| any | start the intro / "press any key to begin" |
| M | mute music |
| S | toggle scanlines |
| F | fullscreen |

## Layout

- `js/scene.js` — procedural artwork and the credits sequence
- `js/music.js` — chiptune engine, the tune, thunder
- `js/main.js` — input, timing, start-up
- `js/rng.js` — seeded random numbers so the scene looks the same every run

## Deploy

`.github/workflows/deploy.yml` publishes the page to GitHub Pages on every push to the
default branch (or manually via "Run workflow"). One-time setup: in the repository
**Settings → Pages**, set *Source* to **GitHub Actions**.
