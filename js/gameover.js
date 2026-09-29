// Game-over sequence, played when a key is pressed on the "press any key to begin" prompt.
// It follows the original's order:
//   1. Rainbow tunnel: concentric Spectrum-coloured frames rush inward around a chunky "GAME OVER".
//   2. "GAME OVER" alone on black, cycling through the Spectrum inks.
//   3. The ghost sneaks in from the left with a garden pitchfork and bonks the green intruder
//      on the head; stars, a flash, and the stage light cycles yellow → white → red.
//   4. "GAME OVER" once more, then a fade back to the intro.

const GO_COLORS = ['#0000ff', '#ff0000', '#ff00ff', '#00ff00', '#00ffff', '#ffff00', '#ffffff', '#000000'];
const INKS = ['#ffff00', '#ffffff', '#ff2020', '#00ffff', '#ff00ff', '#00ff00'];

class GameOver {
  constructor(scene, music) {
    this.scene = scene; this.music = music;
    this.active = false; this.t = 0;
    this.rng = makeRng(7);
    this.stars = [];
    this.T_RED = 4.6; this.T_BONK = 7.4; this.T_HIT = this.T_BONK + 3.3; this.T_GO2 = this.T_BONK + 8.2; this.T_END = this.T_GO2 + 2.6;
    this.done = {};
  }
  start() {
    if (this.active) return;
    this.active = true; this.t = 0; this.done = {};
    this.music.pause();
    this.music.tunnel(this.T_RED);
  }
  once(key, at, fn) { if (!this.done[key] && this.t >= at) { this.done[key] = true; fn(); } }
  update(dt) {
    if (!this.active) return;
    this.t += dt;
    this.once('red', this.T_RED, () => this.music.gameOverChord());
    this.once('tiptoe', this.T_BONK + 0.2, () => this.music.tiptoe(this.T_HIT - this.T_BONK - 0.9));
    this.once('whoosh', this.T_HIT - 0.42, () => this.music.whoosh(0));
    this.once('hit', this.T_HIT, () => {
      this.music.bonk();
      this.stars = Array.from({ length: 7 }, (_, i) => ({ a: i * (Math.PI * 2 / 7), r: 58 + this.rng.range(-8, 8), s: this.rng.range(0.7, 1.2) }));
    });
    this.once('go2', this.T_GO2, () => this.music.gameOverChord());
    if (this.t >= this.T_END) { this.active = false; this.music.resume(); }
  }

  // ------------------------------------------------------------------ drawing helpers
  // Garden pitchfork: origin at the tip of the tines, handle extending along +y.
  drawPitchfork(c) {
    const hg = c.createLinearGradient(-14, 0, 14, 0);
    hg.addColorStop(0, '#5a3413'); hg.addColorStop(0.45, '#b8763a'); hg.addColorStop(1, '#4a2a0f');
    c.fillStyle = hg; c.fillRect(-11, 120, 22, 520);
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-8 + i * 4, 130); c.lineTo(-8 + i * 4 + 2, 640); c.stroke(); }
    c.fillStyle = '#3a2008'; c.beginPath(); c.roundRect(-16, 610, 32, 40, 10); c.fill();     // handle knob
    const sg = c.createLinearGradient(-20, 0, 20, 0);
    sg.addColorStop(0, '#6b6f78'); sg.addColorStop(0.5, '#e8ecf2'); sg.addColorStop(1, '#4a4e57');
    c.fillStyle = sg; c.fillRect(-15, 92, 30, 36);                                              // socket
    c.beginPath(); c.roundRect(-58, 78, 116, 18, 8); c.fill();                                   // yoke
    for (let i = 0; i < 4; i++) {                                                                // four tines
      const x = -45 + i * 30;
      c.beginPath(); c.moveTo(x - 7, 86); c.quadraticCurveTo(x - 9, 30, x - 1, 0); c.lineTo(x + 1, 0); c.quadraticCurveTo(x + 9, 30, x + 7, 86); c.closePath();
      const tg = c.createLinearGradient(x - 8, 0, x + 8, 0);
      tg.addColorStop(0, '#5c6069'); tg.addColorStop(0.4, '#f3f5f8'); tg.addColorStop(0.7, '#b9bec8'); tg.addColorStop(1, '#4f535b');
      c.fillStyle = tg; c.fill();
    }
  }
  // Pitchfork held at the hand point (handX, handY); angle 0 = tines straight up, positive = clockwise.
  drawPitchforkHeld(c, handX, handY, angle, size) {
    c.save(); c.translate(handX, handY); c.rotate(angle); c.scale(size, size); c.translate(0, -300);
    c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 16; c.shadowOffsetY = 8;
    this.drawPitchfork(c); c.restore();
  }
  // The green intruder: a squat, big-footed castle-buyer of my own design.
  drawGoblin(c, x, y, size, t, stunned) {
    c.save(); c.translate(x, y); c.scale(size, size);
    const shiver = stunned ? 0 : Math.sin(t * 22) * 1.2;
    c.translate(shiver, 0);
    const squash = stunned && stunned < 0.3 ? 1 - Math.sin(stunned / 0.3 * Math.PI) * 0.35 : 1;
    c.scale(1 / squash, squash);
    c.shadowColor = 'rgba(60,255,80,0.6)'; c.shadowBlur = 14;
    // feet
    c.fillStyle = '#1f8f2a';
    for (const fx of [-26, 20]) { c.beginPath(); c.ellipse(fx, 54, 24, 11, 0, 0, Math.PI * 2); c.fill(); }
    // body
    const bg = c.createRadialGradient(-10, -10, 4, 0, 10, 60);
    bg.addColorStop(0, '#9dff7a'); bg.addColorStop(0.6, '#3fc94a'); bg.addColorStop(1, '#176b22');
    c.fillStyle = bg; c.beginPath(); c.ellipse(0, 14, 34, 40, 0, 0, Math.PI * 2); c.fill();
    // arms
    c.strokeStyle = '#2fa83a'; c.lineWidth = 9; c.lineCap = 'round';
    const armUp = stunned ? -22 : Math.sin(t * 6) * 6;
    c.beginPath(); c.moveTo(-28, 10); c.lineTo(-46, 24 + armUp); c.moveTo(28, 10); c.lineTo(46, 24 + armUp); c.stroke();
    c.shadowBlur = 0;
    // belly patch
    c.fillStyle = 'rgba(200,255,170,0.45)'; c.beginPath(); c.ellipse(0, 24, 18, 22, 0, 0, Math.PI * 2); c.fill();
    // head
    const hg = c.createRadialGradient(-8, -46, 4, 0, -36, 40);
    hg.addColorStop(0, '#b6ff9a'); hg.addColorStop(0.7, '#4bd457'); hg.addColorStop(1, '#1d7a27');
    c.fillStyle = hg; c.beginPath(); c.ellipse(0, -36, 32, 28, 0, 0, Math.PI * 2); c.fill();
    // ears
    c.fillStyle = '#3fc94a';
    c.beginPath(); c.moveTo(-28, -44); c.lineTo(-52, -60); c.lineTo(-30, -26); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(28, -44); c.lineTo(52, -60); c.lineTo(30, -26); c.closePath(); c.fill();
    // nose
    c.fillStyle = '#2fa83a'; c.beginPath(); c.ellipse(0, -30, 9, 7, 0, 0, Math.PI * 2); c.fill();
    // eyes
    if (!stunned) {
      c.fillStyle = '#fff';
      c.beginPath(); c.ellipse(-12, -42, 8, 9, 0, 0, Math.PI * 2); c.ellipse(12, -42, 8, 9, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#100'; const lx = -3 + Math.sin(t * 3) * 1.5;
      c.beginPath(); c.arc(-12 + lx, -41, 3.5, 0, Math.PI * 2); c.arc(12 + lx, -41, 3.5, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#100'; c.lineWidth = 2; c.beginPath(); c.arc(0, -18, 7, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();   // nervous grin
    } else {
      c.strokeStyle = '#100'; c.lineWidth = 3; c.lineCap = 'round';
      for (const ex of [-12, 12]) { c.beginPath(); c.moveTo(ex - 5, -47); c.lineTo(ex + 5, -37); c.moveTo(ex + 5, -47); c.lineTo(ex - 5, -37); c.stroke(); }
      c.fillStyle = '#ff6b8a'; c.beginPath(); c.ellipse(4, -14, 6, 9, 0.3, 0, Math.PI * 2); c.fill();            // tongue out
      c.fillStyle = '#7ee66f'; c.beginPath(); c.ellipse(-4, -62, 9, 7, 0, 0, Math.PI * 2); c.fill();               // the lump
    }
    c.restore();
  }
  drawStars(c, cx, cy, since, size) {
    c.fillStyle = '#ffff00'; c.strokeStyle = '#7a5a00'; c.lineWidth = 1;
    for (const s of this.stars) {
      const a = s.a + since * 4, r = s.r * size;
      const sx = cx + Math.cos(a) * r, sy = cy + Math.sin(a) * r * 0.35;
      c.save(); c.translate(sx, sy); c.scale(s.s * size * 0.55, s.s * size * 0.55); c.rotate(since * 5);
      c.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? 4 : 9, an = i * Math.PI / 5; c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
      c.closePath(); c.fill(); c.stroke(); c.restore();
    }
  }
  drawChunkyText(c, text, x, y, size, fill, stroke) {
    c.font = `700 ${size}px Bungee, "Arial Black", Impact, sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if (stroke) { c.lineWidth = size * 0.12; c.lineJoin = 'round'; c.strokeStyle = stroke; c.strokeText(text, x, y); }
    c.fillStyle = fill; c.fillText(text, x, y);
  }

  // ------------------------------------------------------------------ phases
  draw(c) {
    const t = this.t, W = 1024, H = 768;
    if (t < this.T_RED) this.drawTunnel(c, t);
    else if (t < this.T_BONK) this.drawGameOverCard(c, t - this.T_RED, true);
    else if (t < this.T_GO2) this.drawBonk(c, t - this.T_BONK);
    else this.drawGameOverCard(c, t - this.T_GO2, false);
    if (t > this.T_END - 0.8) { c.fillStyle = `rgba(0,0,0,${(t - (this.T_END - 0.8)) / 0.8})`; c.fillRect(0, 0, W, H); }
  }

  drawTunnel(c, t) {
    const W = 1024, H = 768;
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    const rings = 22, speed = 2.4, phase = (t * speed) % 1;
    for (let i = rings; i >= 0; i--) {
      const inset = (1 - (i + phase) / rings) * 0.5;
      c.fillStyle = GO_COLORS[(i + Math.floor(t * speed)) % GO_COLORS.length];
      c.fillRect(W * inset, H * inset, W * (1 - inset * 2), H * (1 - inset * 2));
    }
    const g = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 520);
    g.addColorStop(0, 'rgba(255,255,255,0.25)'); g.addColorStop(0.4, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const wob = Math.sin(t * 7) * 3;
    c.fillStyle = 'rgba(255,255,255,0.10)'; c.fillRect(W / 2 - 260, H / 2 - 105 + wob, 520, 210);
    this.drawChunkyText(c, 'GAME', W / 2, H / 2 - 48 + wob, 92, '#000');
    this.drawChunkyText(c, 'OVER', W / 2, H / 2 + 52 + wob, 92, '#000');
  }

  drawGameOverCard(c, t, first) {
    const W = 1024, H = 768;
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    const ink = first ? '#ff1a1a' : INKS[Math.floor(t * 3) % INKS.length];
    const a = Math.min(1, t / 0.35) * (0.88 + 0.12 * Math.sin(t * 30));
    c.save(); c.globalAlpha = a; c.shadowColor = ink; c.shadowBlur = 40;
    this.drawChunkyText(c, 'GAME', W / 2, H / 2 - 52, 96, ink);
    this.drawChunkyText(c, 'OVER', W / 2, H / 2 + 56, 96, ink);
    c.restore();
    if (!first && t > 0.8) {
      c.globalAlpha = Math.min(1, (t - 0.8) / 0.5) * (0.6 + 0.4 * Math.sin(t * 4));
      this.scene.drawText(c, 'SHILMOORE CASTLE KEEPS ITS GHOST', W / 2, H - 90, PAL.yellow, '700 24px Cinzel, Georgia, serif', 7);
      c.globalAlpha = 1;
    }
  }

  drawBonk(c, t) {
    const W = 1024, H = 768, sc = this.scene;
    const hitAt = this.T_HIT - this.T_BONK, hit = t >= hitAt, since = hit ? t - hitAt : 0;
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    // stage light cycling through the inks, as the original's sprites did
    const ink = INKS[Math.floor(t * 1.5) % 3];
    const spot = c.createRadialGradient(560, 430, 40, 560, 430, 560);
    spot.addColorStop(0, ink + '33'); spot.addColorStop(0.5, ink + '12'); spot.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = spot; c.fillRect(0, 0, W, H);
    // floor line
    c.strokeStyle = ink + '55'; c.lineWidth = 2; c.beginPath(); c.moveTo(80, 560); c.lineTo(W - 80, 560); c.stroke();
    c.save();
    if (hit && since < 0.45) { const k = (0.45 - since) * 26; c.translate(this.rng.range(-k, k), this.rng.range(-k, k)); }
    // the intruder waits on the right
    const gobX = 640, gobY = 470;
    this.drawGoblin(c, gobX, gobY, 1.7, t, hit ? since : 0);
    // the ghost sneaks in from the left, pitchfork over its shoulder, and stops beside him
    const approach = Math.min(1, t / (hitAt - 0.6));
    const gx = -120 + (400 + 120) * (1 - Math.pow(1 - approach, 2));
    const bobT = hit ? sc.time * 4 : sc.time * 2;
    const gy = 400 + (hit ? Math.sin(since * 9) * 6 : 0);
    const size = 3.4;
    // swing: raise during the last 0.6 s, then slam down and recoil
    let angle = -0.55 + Math.sin(t * 2.5) * 0.04;
    if (!hit && t > hitAt - 0.6) { const p = (t - (hitAt - 0.6)) / 0.6; angle = -0.55 - 0.7 * Math.sin(p * Math.PI * 0.5) * (p < 0.7 ? 1 : 1) ; if (p > 0.7) angle = -1.25 + (1.42 + 1.25) * Math.pow((p - 0.7) / 0.3, 2); }
    else if (hit) angle = 1.42 - Math.min(0.5, since * 1.6) + (since < 0.3 ? Math.sin(since * 50) * 0.04 : 0);
    const handX = gx + 52, handY = gy + 6;
    sc.drawGhost(c, bobT, size, gx, gy);
    this.drawPitchforkHeld(c, handX, handY, angle, 0.5);
    if (hit) {
      this.drawStars(c, gobX - 6, gobY - 120, since, 1.7);
      if (since < 0.18) { c.fillStyle = `rgba(255,255,255,${(0.18 - since) / 0.18 * 0.85})`; c.fillRect(-60, -60, W + 120, H + 120); }
      if (since < 1.7) {
        const pop = Math.min(1, since / 0.12), a = since < 1.3 ? 1 : (1.7 - since) / 0.4;
        c.save(); c.globalAlpha = a; c.translate(gobX + 150, gobY - 230); c.rotate(-0.18); c.scale(pop, pop);
        c.beginPath();
        for (let i = 0; i < 16; i++) { const r = i % 2 ? 78 : 112, an = i * Math.PI / 8; c.lineTo(Math.cos(an) * r, Math.sin(an) * r); }
        c.closePath(); c.fillStyle = '#ffff00'; c.fill(); c.lineWidth = 6; c.strokeStyle = '#000'; c.stroke();
        this.drawChunkyText(c, 'BONK!', 0, 4, 44, '#ff0000', '#000');
        c.restore();
      }
    }
    c.restore();
  }
}
