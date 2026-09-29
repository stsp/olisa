// Chiptune engine + original title tune in the spirit of 1986 ZX Spectrum beeper music.
// Three pulse-wave voices (lead, bouncing octave bass, buzzing arpeggio) plus soft drums,
// a touch of reverb, and synthesized thunder for the lightning.

const NOTE_NAMES = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
function noteToMidi(name) {
  const m = /^([A-G][#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error('bad note ' + name);
  return 12 * (parseInt(m[2], 10) + 1) + NOTE_NAMES[m[1]];
}
const midiToHz = (n) => 440 * Math.pow(2, (n - 69) / 12);

// ---- Composition (E minor, 150 BPM, 16 steps per bar) ------------------------------------
// Chords: root note name and chord tones as semitone offsets from root.
const CH = {
  Em: ['E2', [0, 3, 7]], C: ['C3', [0, 4, 7]], D: ['D3', [0, 4, 7]], Bm: ['B2', [0, 3, 7]],
  B7: ['B2', [0, 4, 7, 10]], G: ['G2', [0, 4, 7]], Am: ['A2', [0, 3, 7]], Em1: ['E2', [0, 3, 7]],
};
// Melody: "note:steps" tokens, "-" = rest.  Each bar is 16 steps (16th notes).
// The tune is built from named sections arranged in a song form:
//   intro – verse 1 – chorus – verse 2 – chorus – bridge – verse 3 – chorus – outro
const bar = (chord, lead) => ({ chord, lead });

const SECTIONS = {
  intro: {
    bass: 'long', arp: 'soft', drums: 'none',
    bars: [
      bar('Em', 'E5:8 B4:8'), bar('Em', 'E5:4 G5:4 B5:8'),
      bar('C', 'C6:8 B5:8'), bar('B7', 'D#6:8 F#6:4 B5:4'),
    ],
  },
  // ---- verse: the brooding theme -------------------------------------------------------
  verse: {
    bass: 'bounce', arp: 'buzz', drums: 'beat',
    bars: [
      bar('Em', 'E5:2 G5:2 B5:3 A5:1 G5:2 F#5:2 E5:4'),
      bar('C', 'C6:2 B5:2 A5:4 G5:2 A5:2 E5:4'),
      bar('D', 'F#5:2 A5:2 D6:4 C#6:1 D6:1 A5:2 F#5:4'),
      bar('Bm', 'B5:6 A5:2 F#5:4 D5:4'),
      bar('Em', 'E5:2 G5:2 B5:3 A5:1 G5:2 F#5:2 E5:4'),
      bar('C', 'C6:2 B5:2 A5:4 G5:2 A5:2 B5:4'),
      bar('D', 'D6:2 C#6:2 D6:2 E6:2 F#6:4 D6:4'),
      bar('B7', 'D#6:2 B5:2 F#5:4 D#5:2 F#5:2 B5:4'),
      bar('G', 'G5:2 B5:2 D6:4 B5:2 G5:2 A5:4'),
      bar('D', 'F#5:2 A5:2 D6:4 A5:2 F#5:2 D5:4'),
      bar('C', 'E5:2 G5:2 C6:4 B5:2 A5:2 G5:4'),
      bar('B7', 'F#5:4 D#5:2 F#5:2 B5:8'),
      bar('G', 'G5:2 B5:2 D6:2 G6:2 F#6:2 D6:2 B5:4'),
      bar('D', 'A5:2 D6:2 F#6:2 A6:2 G6:2 F#6:2 D6:4'),
      bar('Am', 'C6:2 B5:2 A5:2 E6:2 C6:2 A5:2 E5:4'),
      bar('B7', 'D#6:4 F#6:2 D#6:2 B5:8'),
    ],
  },
  // ---- verse 2: same harmony, the melody ornamented and reaching higher ----------------
  verse2: {
    bass: 'bounce', arp: 'buzz', drums: 'beat',
    bars: [
      bar('Em', 'E5:1 F#5:1 G5:2 B5:2 A5:2 G5:2 F#5:2 E5:4'),
      bar('C', 'C6:2 D6:2 E6:4 D6:2 C6:2 B5:4'),
      bar('D', 'A5:2 D6:2 F#6:2 E6:2 D6:2 C#6:2 A5:4'),
      bar('Bm', 'B5:4 D6:2 B5:2 A5:2 F#5:2 D5:4'),
      bar('Em', 'E5:2 G5:2 B5:2 E6:2 D6:2 B5:2 G5:4'),
      bar('C', 'C6:2 E6:2 G6:4 E6:2 C6:2 B5:4'),
      bar('D', 'D6:2 E6:2 F#6:2 A6:2 G6:2 F#6:2 D6:4'),
      bar('B7', 'D#6:2 F#6:2 B6:4 A6:2 F#6:2 D#6:4'),
      bar('G', 'G5:2 B5:2 D6:4 B5:2 G5:2 A5:4'),
      bar('D', 'F#5:2 A5:2 D6:4 A5:2 F#5:2 D5:4'),
      bar('C', 'E5:2 G5:2 C6:4 B5:2 A5:2 G5:4'),
      bar('B7', 'F#5:4 D#5:2 F#5:2 B5:8'),
      bar('G', 'G5:2 B5:2 D6:2 G6:2 F#6:2 D6:2 B5:4'),
      bar('D', 'A5:2 D6:2 F#6:2 A6:2 G6:2 F#6:2 D6:4'),
      bar('Am', 'C6:2 B5:2 A5:2 E6:2 C6:2 A5:2 E5:4'),
      bar('B7', 'D#6:4 F#6:2 D#6:2 B5:8'),
    ],
  },
  // ---- verse 3: the theme an octave up, then the long fall back down -------------------
  verse3: {
    bass: 'bounce', arp: 'buzz', drums: 'beat',
    bars: [
      bar('Em', 'E6:2 G6:2 B6:3 A6:1 G6:2 F#6:2 E6:4'),
      bar('C', 'C7:2 B6:2 A6:4 G6:2 A6:2 B6:4'),
      bar('D', 'D7:2 C#7:2 D7:2 E7:2 F#7:4 D7:4'),
      bar('B7', 'D#7:2 B6:2 F#6:2 D#6:2 B5:2 F#5:2 D#5:4'),
      bar('Em', 'E5:2 G5:2 B5:3 A5:1 G5:2 F#5:2 E5:4'),
      bar('C', 'C6:2 B5:2 A5:4 G5:2 A5:2 B5:4'),
      bar('D', 'D6:2 C#6:2 D6:2 E6:2 F#6:4 D6:4'),
      bar('B7', 'D#6:2 B5:2 F#5:4 D#5:2 F#5:2 B5:4'),
      bar('G', 'G5:2 B5:2 D6:2 G6:2 F#6:2 D6:2 B5:4'),
      bar('D', 'A5:2 D6:2 F#6:2 A6:2 G6:2 F#6:2 D6:4'),
      bar('Am', 'C6:2 B5:2 A5:2 E6:2 C6:2 A5:2 E5:4'),
      bar('B7', 'D#6:4 F#6:2 D#6:2 B5:8'),
      bar('G', 'G6:2 B6:2 D7:4 B6:2 G6:2 A6:4'),
      bar('D', 'F#6:2 A6:2 D7:4 A6:2 F#6:2 D6:4'),
      bar('Am', 'E6:2 C6:2 A5:2 E6:2 C6:2 A5:2 E5:4'),
      bar('B7', 'D#6:2 F#6:2 B6:4 A6:2 F#6:2 D#6:4'),
    ],
  },
  // ---- chorus: the hook, punchier bass and octave-jumping arpeggio ----------------------
  chorus: {
    bass: 'drive', arp: 'jump', drums: 'full',
    bars: [
      bar('Em', 'B5:2 B5:2 E6:4 D6:2 B5:2 G5:4'),
      bar('G', 'G5:2 G5:2 B5:4 D6:2 B5:2 G5:4'),
      bar('D', 'A5:2 A5:2 D6:4 F#6:2 D6:2 A5:4'),
      bar('Em', 'B5:4 G5:4 E5:8'),
      bar('C', 'C6:2 C6:2 E6:4 G6:2 E6:2 C6:4'),
      bar('G', 'B5:2 B5:2 D6:4 G6:2 D6:2 B5:4'),
      bar('B7', 'D#6:4 F#6:4 B5:2 D#6:2 F#6:4'),
      bar('Em', 'E6:12 -:4'),
      bar('Em', 'B5:2 B5:2 E6:4 D6:2 B5:2 G5:4'),
      bar('G', 'G5:2 G5:2 B5:4 D6:2 B5:2 G5:4'),
      bar('D', 'A5:2 A5:2 D6:4 F#6:2 D6:2 A5:4'),
      bar('Em', 'B5:2 D6:2 G5:4 E5:8'),
      bar('C', 'E6:2 E6:2 G6:4 A6:2 G6:2 E6:4'),
      bar('D', 'F#6:2 F#6:2 A6:4 D7:2 A6:2 F#6:4'),
      bar('B7', 'D#7:2 B6:2 F#6:2 D#6:2 B5:2 F#5:2 D#5:4'),
      bar('Em', 'E6:8 B5:4 E5:4'),
    ],
  },
  // ---- bridge: the storm holds its breath ----------------------------------------------
  bridge: {
    bass: 'long', arp: 'soft', drums: 'none',
    bars: [
      bar('Am', 'A5:8 C6:4 E6:4'), bar('Em', 'B5:8 G5:4 E5:4'),
      bar('Am', 'A5:4 C6:4 E6:8'), bar('Em', 'G5:4 F#5:4 E5:8'),
      bar('C', 'C6:6 D6:2 E6:8'), bar('D', 'D6:6 E6:2 F#6:8'),
      bar('B7', 'D#6:8 F#6:8'), bar('B7', 'B6:8 A6:4 F#6:4'),
    ],
  },
  outro: {
    bass: 'drive', arp: 'jump', drums: 'full',
    bars: [
      bar('Em', 'E6:2 D6:2 B5:2 G5:2 E5:8'), bar('C', 'C6:4 B5:4 A5:8'),
      bar('B7', 'D#6:4 F#6:4 B6:8'), bar('Em', 'E6:12 -:4'),
    ],
  },
  rest: { bass: 'none', arp: 'none', drums: 'none', bars: [bar('Em', '-:16')] },
};

const FORM = ['intro', 'verse', 'chorus', 'verse2', 'chorus', 'bridge', 'verse3', 'chorus', 'outro', 'rest'];

const BASS_PATTERNS = {                       // offsets from the chord root, one per 8th note
  bounce: [0, 12, 0, 12, 0, 12, 7, 12],
  drive: [0, 12, 0, 12, 7, 12, 0, 12],
  long: [0, null, null, null, 7, null, null, null],
};

function compileSong() {
  const STEPS = 16;
  const ev = { lead: [], bass: [], arp: [], drums: [] };
  let bi = 0;
  const sections = [];
  for (const name of FORM) {
    const sec = SECTIONS[name];
    sections.push({ name, start: bi * STEPS, bars: sec.bars.length });
    for (const b of sec.bars) {
      const t0 = bi * STEPS;
      const [rootName, tones] = CH[b.chord];
      const root = noteToMidi(rootName);
      let t = t0;
      for (const tok of b.lead.trim().split(/\s+/)) {
        const [n, d] = tok.split(':');
        const dur = parseInt(d, 10);
        if (n !== '-') ev.lead.push({ t, dur, midi: noteToMidi(n) });
        t += dur;
      }
      if (t - t0 !== STEPS) throw new Error(`bar ${bi + 1} (${name}) has ${t - t0} steps`);
      const bp = BASS_PATTERNS[sec.bass];
      if (bp) bp.forEach((off, i) => {
        if (off === null) return;
        const dur = sec.bass === 'long' ? 8 : 2;
        ev.bass.push({ t: t0 + i * 2, dur, midi: root + off });
      });
      if (sec.arp !== 'none') {
        const cyc = tones.length === 4 ? [0, 1, 2, 3] : [0, 1, 2, 1];
        for (let i = 0; i < STEPS; i++) {
          if (sec.arp === 'soft' && i % 2) continue;
          const jump = sec.arp === 'jump' && (i % 8) >= 4 ? 12 : 0;
          ev.arp.push({ t: t0 + i, dur: sec.arp === 'soft' ? 2 : 1, midi: root + tones[cyc[i % cyc.length]] + 24 + jump });
        }
      }
      if (sec.drums !== 'none') {
        for (let i = 0; i < STEPS; i += 2) {
          let kind = 'hat';
          if (i === 0 || i === 8) kind = 'kick';
          else if (i === 4 || i === 12) kind = 'snare';
          ev.drums.push({ t: t0 + i, kind, accent: i % 4 === 0 });
        }
        if (sec.drums === 'full') {
          for (let i = 1; i < STEPS; i += 2) ev.drums.push({ t: t0 + i, kind: 'hat', accent: false });
          // snare fill on the last beat of every 4th bar
          if ((bi + 1) % 4 === 0) for (let i = 12; i < 16; i++) ev.drums.push({ t: t0 + i, kind: 'snare', accent: false });
        }
      }
      bi++;
    }
  }
  for (const k in ev) ev[k].sort((a, b) => a.t - b.t);
  return { events: ev, length: bi * STEPS, sections };
}

class Chiptune {
  constructor() {
    this.ctx = null;
    this.bpm = 150;
    this.stepSec = 60 / this.bpm / 4;
    this.muted = false;
    this.song = compileSong();
    this.nextStep = 0;
    this.loopStart = 0;
    this.timer = null;
    this.cursor = { lead: 0, bass: 0, arp: 0, drums: 0 };
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -14; this.comp.ratio.value = 4; this.comp.attack.value = 0.003; this.comp.release.value = 0.2;
    this.master.connect(this.comp).connect(ctx.destination);

    // gentle stone-hall reverb from a generated impulse response
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.makeImpulse(1.6, 2.8);
    this.reverbGain = ctx.createGain(); this.reverbGain.gain.value = 0.18;
    this.reverb.connect(this.reverbGain).connect(this.master);

    // one soft low-pass so the squares do not shriek
    this.tone = ctx.createBiquadFilter(); this.tone.type = 'lowpass'; this.tone.frequency.value = 7000;
    this.tone.connect(this.master); this.tone.connect(this.reverb);

    this.bus = {};
    for (const [name, g] of [['lead', 0.16], ['bass', 0.15], ['arp', 0.06], ['drums', 0.12]]) {
      const gain = ctx.createGain(); gain.gain.value = g; gain.connect(this.tone); this.bus[name] = gain;
    }
    this.waves = { pulse25: this.makePulse(0.25), pulse12: this.makePulse(0.125), pulse50: this.makePulse(0.5) };
    this.noise = this.makeNoise(3);
    this.thunderBus = ctx.createGain(); this.thunderBus.gain.value = 0.9; this.thunderBus.connect(this.master);
  }

  makePulse(duty) {
    const n = 48, real = new Float32Array(n), imag = new Float32Array(n);
    for (let k = 1; k < n; k++) { real[k] = 0; imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty); }
    return this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
  }
  makeNoise(seconds) {
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
  makeImpulse(seconds, decay) {
    const rate = this.ctx.sampleRate, len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  start() {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.timer) return;
    this.loopStart = this.ctx.currentTime + 0.15;
    this.nextStep = 0;
    this.cursor = { lead: 0, bass: 0, arp: 0, drums: 0 };
    this.timer = setInterval(() => this.schedule(), 40);
  }
  stop() { if (this.timer) { clearInterval(this.timer); this.timer = null; } }
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.02); }

  // look-ahead scheduler: emit every event that starts within the next 0.25 s
  schedule() {
    const horizon = this.ctx.currentTime + 0.25;
    while (this.loopStart + this.nextStep * this.stepSec < horizon) {
      const s = this.nextStep;
      const when = this.loopStart + s * this.stepSec;
      const E = this.song.events;
      for (const ch of ['lead', 'bass', 'arp']) {
        const list = E[ch];
        while (this.cursor[ch] < list.length && list[this.cursor[ch]].t === s) {
          const e = list[this.cursor[ch]++];
          this.playNote(ch, e.midi, when, e.dur * this.stepSec);
        }
      }
      while (this.cursor.drums < E.drums.length && E.drums[this.cursor.drums].t === s) {
        const e = E.drums[this.cursor.drums++];
        this.playDrum(e.kind, when, e.accent);
      }
      this.nextStep++;
      if (this.nextStep >= this.song.length) {
        this.loopStart += this.song.length * this.stepSec;
        this.nextStep = 0;
        this.cursor = { lead: 0, bass: 0, arp: 0, drums: 0 };
      }
    }
  }

  playNote(ch, midi, when, dur) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const hz = midiToHz(midi);
    if (ch === 'lead') {
      osc.setPeriodicWave(this.waves.pulse25);
      // tiny vibrato on longer notes, like a hand-coded beeper routine wobbling the pitch
      if (dur > this.stepSec * 3) {
        const lfo = ctx.createOscillator(), lg = ctx.createGain();
        lfo.frequency.value = 6; lg.gain.value = hz * 0.006;
        lfo.connect(lg).connect(osc.frequency); lfo.start(when); lfo.stop(when + dur + 0.05);
      }
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(1, when + 0.004);
      g.gain.setValueAtTime(1, when + Math.max(0.01, dur - 0.03));
      g.gain.linearRampToValueAtTime(0, when + dur);
    } else if (ch === 'bass') {
      osc.setPeriodicWave(this.waves.pulse50);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(1, when + 0.003);
      g.gain.exponentialRampToValueAtTime(0.35, when + dur * 0.9);
      g.gain.linearRampToValueAtTime(0, when + dur);
    } else {
      osc.setPeriodicWave(this.waves.pulse12);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(1, when + 0.002);
      g.gain.linearRampToValueAtTime(0, when + dur * 0.8);
    }
    osc.frequency.setValueAtTime(hz, when);
    osc.connect(g).connect(this.bus[ch]);
    osc.start(when);
    osc.stop(when + dur + 0.1);
  }

  playDrum(kind, when, accent) {
    const ctx = this.ctx, bus = this.bus.drums;
    if (kind === 'kick') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(140, when); o.frequency.exponentialRampToValueAtTime(40, when + 0.12);
      g.gain.setValueAtTime(1, when); g.gain.exponentialRampToValueAtTime(0.001, when + 0.16);
      o.connect(g).connect(bus); o.start(when); o.stop(when + 0.2);
    } else {
      const src = ctx.createBufferSource(); src.buffer = this.noise;
      const f = ctx.createBiquadFilter(); const g = ctx.createGain();
      if (kind === 'snare') { f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.7; }
      else { f.type = 'highpass'; f.frequency.value = 7000; }
      const len = kind === 'snare' ? 0.11 : 0.03;
      const vol = kind === 'snare' ? 0.7 : (accent ? 0.28 : 0.16);
      g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(0.001, when + len);
      src.connect(f).connect(g).connect(bus); src.start(when, Math.random() * 2); src.stop(when + len + 0.02);
    }
  }

  // Rolling thunder: filtered noise sweeping downward with a sub-bass rumble underneath.
  thunder(delay = 0, strength = 1) {
    if (!this.ctx) return;
    const ctx = this.ctx, when = ctx.currentTime + delay;
    const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.2;
    lp.frequency.setValueAtTime(1200 * strength + 200, when);
    lp.frequency.exponentialRampToValueAtTime(90, when + 2.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(0.55 * strength, when + 0.05);
    g.gain.linearRampToValueAtTime(0.3 * strength, when + 0.5);
    g.gain.linearRampToValueAtTime(0.42 * strength, when + 0.9);
    g.gain.exponentialRampToValueAtTime(0.001, when + 3.2);
    src.connect(lp).connect(g).connect(this.thunderBus);
    src.start(when, Math.random() * 2); src.stop(when + 3.4);
    const sub = ctx.createOscillator(), sg = ctx.createGain();
    sub.type = 'sine'; sub.frequency.setValueAtTime(52, when); sub.frequency.exponentialRampToValueAtTime(30, when + 2.5);
    sg.gain.setValueAtTime(0, when); sg.gain.linearRampToValueAtTime(0.35 * strength, when + 0.1);
    sg.gain.exponentialRampToValueAtTime(0.001, when + 2.8);
    sub.connect(sg).connect(this.thunderBus); sub.start(when); sub.stop(when + 3);
  }

  pause() {
    this.stop();
    if (this.tone) this.tone.frequency.setTargetAtTime(200, this.ctx.currentTime, 0.15);   // muffle what is already queued
  }
  resume() {
    if (!this.ctx) return;
    this.tone.frequency.setValueAtTime(7000, this.ctx.currentTime);
    this.start();
  }

  // ---- game-over sound effects ---------------------------------------------------------
  // pitchfork swinging through the air: a band-passed noise sweep
  whoosh(delay = 0) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const src = ctx.createBufferSource(); src.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.5;
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3200, t + 1.1);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 0.9); g.gain.linearRampToValueAtTime(0, t + 1.25);
    src.connect(f).connect(g).connect(this.thunderBus); src.start(t, 0.3); src.stop(t + 1.3);
  }
  // the bonk: a hollow thud plus the metallic ring of the tines
  bonk() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.25);
    g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    o.connect(g).connect(this.thunderBus); o.start(t); o.stop(t + 0.5);
    const n = ctx.createBufferSource(); n.buffer = this.noise;
    const nf = ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 900;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.8, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    n.connect(nf).connect(ng).connect(this.thunderBus); n.start(t, 1); n.stop(t + 0.15);
    [1720, 2580, 3410, 4300].forEach((hz, i) => {
      const r = ctx.createOscillator(), rg = ctx.createGain();
      r.type = 'triangle'; r.frequency.value = hz * (1 + i * 0.003);
      rg.gain.setValueAtTime(0.12 / (i + 1), t + 0.01); rg.gain.exponentialRampToValueAtTime(0.0005, t + 1.4);
      r.connect(rg).connect(this.master); r.start(t + 0.01); r.stop(t + 1.5);
    });
  }
  // sneaking up: staccato tiptoe notes on the bass voice
  tiptoe(seconds) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime, step = 0.32, n = Math.floor(seconds / step);
    const pat = ['E3', 'G3', 'B3', 'G3'];
    for (let i = 0; i < n; i++) this.playNote('bass', noteToMidi(pat[i % 4]) + (i % 8 >= 4 ? 1 : 0), t0 + i * step, 0.09);
  }
  // rainbow tunnel: a falling siren of beeper notes, like the Spectrum's attribute-flash screens
  tunnel(seconds) {
    if (!this.ctx) return;
    const ctx = this.ctx, t0 = ctx.currentTime;
    const step = 0.075, n = Math.floor(seconds / step);
    for (let i = 0; i < n; i++) {
      const midi = 88 - (i % 16) * 2 - Math.floor(i / 16) * 3;
      this.playNote('arp', midi, t0 + i * step, step * 0.9);
      if (i % 4 === 0) this.playNote('bass', midi - 24, t0 + i * step, step * 3);
    }
  }
  // final red screen: a low minor chord that slowly dies
  gameOverChord() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    ['E2', 'B2', 'E3', 'G3'].forEach((n, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.setPeriodicWave(this.waves.pulse25); o.frequency.value = midiToHz(noteToMidi(n));
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16 - i * 0.02, t + 0.4 + i * 0.15); g.gain.exponentialRampToValueAtTime(0.001, t + 3.8);
      o.connect(g).connect(this.tone); o.start(t); o.stop(t + 4);
    });
  }
}
