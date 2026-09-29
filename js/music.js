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
const SONG = [
  // ---- A: brooding theme --------------------------------------------------------------
  { chord: 'Em', lead: 'E5:2 G5:2 B5:3 A5:1 G5:2 F#5:2 E5:4' },
  { chord: 'C',  lead: 'C6:2 B5:2 A5:4 G5:2 A5:2 E5:4' },
  { chord: 'D',  lead: 'F#5:2 A5:2 D6:4 C#6:1 D6:1 A5:2 F#5:4' },
  { chord: 'Bm', lead: 'B5:6 A5:2 F#5:4 D5:4' },
  { chord: 'Em', lead: 'E5:2 G5:2 B5:3 A5:1 G5:2 F#5:2 E5:4' },
  { chord: 'C',  lead: 'C6:2 B5:2 A5:4 G5:2 A5:2 B5:4' },
  { chord: 'D',  lead: 'D6:2 C#6:2 D6:2 E6:2 F#6:4 D6:4' },
  { chord: 'B7', lead: 'D#6:2 B5:2 F#5:4 D#5:2 F#5:2 B5:4' },
  // ---- B: answer, brighter then falling back ----------------------------------------
  { chord: 'G',  lead: 'G5:2 B5:2 D6:4 B5:2 G5:2 A5:4' },
  { chord: 'D',  lead: 'F#5:2 A5:2 D6:4 A5:2 F#5:2 D5:4' },
  { chord: 'C',  lead: 'E5:2 G5:2 C6:4 B5:2 A5:2 G5:4' },
  { chord: 'B7', lead: 'F#5:4 D#5:2 F#5:2 B5:8' },
  { chord: 'G',  lead: 'G5:2 B5:2 D6:2 G6:2 F#6:2 D6:2 B5:4' },
  { chord: 'D',  lead: 'A5:2 D6:2 F#6:2 A6:2 G6:2 F#6:2 D6:4' },
  { chord: 'Am', lead: 'C6:2 B5:2 A5:2 E6:2 C6:2 A5:2 E5:4' },
  { chord: 'B7', lead: 'D#6:4 F#6:2 D#6:2 B5:8' },
  // ---- A': theme returns an octave up in the tail, then a cadence and a breath -------
  { chord: 'Em', lead: 'E5:2 G5:2 B5:3 A5:1 G5:2 F#5:2 E5:4' },
  { chord: 'C',  lead: 'C6:2 B5:2 A5:4 G5:2 A5:2 E5:4' },
  { chord: 'D',  lead: 'F#5:2 A5:2 D6:4 C#6:1 D6:1 A5:2 F#5:4' },
  { chord: 'Bm', lead: 'B5:6 A5:2 F#5:4 D5:4' },
  { chord: 'Em', lead: 'E6:2 G6:2 B6:3 A6:1 G6:2 F#6:2 E6:4' },
  { chord: 'C',  lead: 'C7:2 B6:2 A6:4 G6:2 A6:2 B6:4' },
  { chord: 'D',  lead: 'D7:2 C#7:2 D7:2 E7:2 F#7:4 D7:4' },
  { chord: 'B7', lead: 'D#7:2 B6:2 F#6:2 D#6:2 B5:2 F#5:2 D#5:4' },
  { chord: 'Em', lead: 'E5:4 B5:4 E6:8' },
  { chord: 'Em1', lead: '-:16', bass: 'rest', arp: 'rest', drums: 'rest' },
];

function compileSong() {
  const STEPS = 16;
  const ev = { lead: [], bass: [], arp: [], drums: [] };
  SONG.forEach((bar, bi) => {
    const t0 = bi * STEPS;
    const [rootName, tones] = CH[bar.chord];
    const root = noteToMidi(rootName);
    // lead
    let t = t0;
    for (const tok of bar.lead.trim().split(/\s+/)) {
      const [n, d] = tok.split(':');
      const dur = parseInt(d, 10);
      if (n !== '-') ev.lead.push({ t, dur, midi: noteToMidi(n) });
      t += dur;
    }
    if (bar.bass !== 'rest') {
      // bouncing octave bass on every 8th, fifth on the last beat
      const pat = [0, 12, 0, 12, 0, 12, 7, 12];
      pat.forEach((off, i) => ev.bass.push({ t: t0 + i * 2, dur: 2, midi: root + off }));
    }
    if (bar.arp !== 'rest') {
      // buzzing 16th-note arpeggio of chord tones, an octave and a half above the bass
      const cyc = tones.length === 4 ? [0, 1, 2, 3] : [0, 1, 2, 1];
      for (let i = 0; i < STEPS; i++) {
        const off = tones[cyc[i % cyc.length]] + 24 + (i % 8 >= 4 ? 12 : 0) * 0;
        ev.arp.push({ t: t0 + i, dur: 1, midi: root + off });
      }
    }
    if (bar.drums !== 'rest') {
      for (let i = 0; i < STEPS; i += 2) {
        const beat = i / 4;
        let kind = 'hat';
        if (i === 0 || i === 8) kind = 'kick';
        else if (i === 4 || i === 12) kind = 'snare';
        ev.drums.push({ t: t0 + i, kind, accent: Number.isInteger(beat) });
      }
    }
  });
  return { events: ev, length: SONG.length * STEPS };
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

  // short "begin" jingle when a key is pressed
  jingle() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.02;
    ['E5', 'B5', 'E6', 'G6'].forEach((n, i) => this.playNote('lead', noteToMidi(n), t + i * 0.07, 0.35 - i * 0.05));
  }
}
