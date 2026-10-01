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
    this.T_RED = 2.3; this.T_BONK = 5.1;
    this.APPROACH = 4.4; this.HITS = 5; this.HIT_GAP = 0.8; this.FIRST_HIT = this.APPROACH + 0.7;
    this.T_GO2 = this.T_BONK + this.FIRST_HIT + this.HITS * this.HIT_GAP + 2.2; this.T_END = this.T_GO2 + 2.6;
    this.done = {};
  }
  start() {
    if (this.active) return;
    this.active = true; this.t = 0; this.done = {}; this.hits = 0; this.notes = [];
    this.music.pause();
    this.music.tunnel(this.T_RED);
  }
  once(key, at, fn) { if (!this.done[key] && this.t >= at) { this.done[key] = true; fn(); } }
  update(dt) {
    if (!this.active) return;
    this.t += dt;
    this.once('red', this.T_RED, () => this.music.gameOverChord());
    this.once('whistle', this.T_BONK + 0.1, () => this.music.whistle(this.APPROACH + 0.3));
    this.once('huh', this.T_BONK + this.APPROACH - 0.9, () => this.music.huh());
    for (let i = 0; i < this.HITS; i++) {
      const at = this.T_BONK + this.FIRST_HIT + i * this.HIT_GAP;
      this.once('whoosh' + i, at - 0.16, () => this.music.whoosh(0, 0.18));
      this.once('hit' + i, at, () => {
        this.music.bonk(0.7 + i * 0.08);
        this.hits = i + 1;
        this.stars = Array.from({ length: 3 + i * 2 }, (_, k) => ({ a: k * (Math.PI * 2 / (3 + i * 2)), r: 56 + this.rng.range(-8, 8), s: this.rng.range(0.7, 1.2) }));
      });
    }
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
  // The intruder: a chubby little fellow with a big nose, hair tufts and big shoes (my own design).
  drawIntruder(c, x, y, size, t, dazed, squash) {
    c.save(); c.translate(x, y); c.scale(size, size);
    c.scale(1 / squash, squash);
    c.shadowColor = 'rgba(120,255,120,0.45)'; c.shadowBlur = 12;
    // shoes
    c.fillStyle = '#1d1d24';
    for (const fx of [-24, 22]) { c.beginPath(); c.ellipse(fx, 56, 26, 11, 0, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#3a3a48'; for (const fx of [-24, 22]) { c.beginPath(); c.ellipse(fx, 52, 22, 7, 0, 0, Math.PI * 2); c.fill(); }
    // legs
    c.fillStyle = '#245d2a'; c.fillRect(-24, 30, 16, 22); c.fillRect(8, 30, 16, 22);
    // body (green jacket, round belly)
    const bg = c.createRadialGradient(-10, 0, 4, 0, 12, 52);
    bg.addColorStop(0, '#8ee27a'); bg.addColorStop(0.6, '#3ea54a'); bg.addColorStop(1, '#1b5e22');
    c.fillStyle = bg; c.beginPath(); c.ellipse(0, 14, 32, 30, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffd36b'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, 2 + i * 12, 2.6, 0, Math.PI * 2); c.fill(); }   // buttons
    // arms
    c.strokeStyle = '#3ea54a'; c.lineWidth = 10; c.lineCap = 'round';
    const wave = dazed ? -18 : Math.sin(t * 5) * 5;
    c.beginPath(); c.moveTo(-26, 8); c.lineTo(-44, 26 + wave); c.moveTo(26, 8); c.lineTo(44, 26 + wave); c.stroke();
    c.fillStyle = '#f5c7a3'; for (const hx of [-46, 46]) { c.beginPath(); c.arc(hx, 28 + wave, 7, 0, Math.PI * 2); c.fill(); }
    c.shadowBlur = 0;
    // head
    const hg = c.createRadialGradient(-8, -46, 4, 0, -36, 40);
    hg.addColorStop(0, '#ffe3c9'); hg.addColorStop(0.75, '#f0b98f'); hg.addColorStop(1, '#c98a5c');
    c.fillStyle = hg; c.beginPath(); c.ellipse(0, -36, 30, 30, 0, 0, Math.PI * 2); c.fill();
    // hair tufts and ears
    c.fillStyle = '#7a3b12';
    for (const [tx, ang] of [[-22, -2.4], [-8, -1.9], [8, -1.3], [22, -0.8]]) {
      c.beginPath(); c.moveTo(tx, -60); c.quadraticCurveTo(tx + Math.cos(ang) * 22, -60 + Math.sin(ang) * 22, tx + Math.cos(ang) * 8 + 6, -74); c.lineTo(tx + 6, -58); c.closePath(); c.fill();
    }
    c.fillStyle = '#e8a97c'; for (const ex of [-31, 31]) { c.beginPath(); c.ellipse(ex, -36, 6, 9, 0, 0, Math.PI * 2); c.fill(); }
    // cheeks and the big nose
    c.fillStyle = 'rgba(255,110,110,0.35)'; for (const cx of [-17, 17]) { c.beginPath(); c.ellipse(cx, -26, 8, 5, 0, 0, Math.PI * 2); c.fill(); }
    const ng = c.createRadialGradient(-3, -32, 2, 0, -29, 12); ng.addColorStop(0, '#ffb6a0'); ng.addColorStop(1, '#d9694c');
    c.fillStyle = ng; c.beginPath(); c.ellipse(0, -29, 11, 9, 0, 0, Math.PI * 2); c.fill();
    // eyebrows, eyes, mouth
    c.strokeStyle = '#4a2410'; c.lineWidth = 3; c.lineCap = 'round';
    if (!dazed) {
      const look = Math.sin(t * 2.5) * 2;
      c.beginPath(); c.moveTo(-20, -52); c.lineTo(-8, -49); c.moveTo(8, -50); c.lineTo(20, -54); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(-12, -41, 7, 8, 0, 0, Math.PI * 2); c.ellipse(12, -41, 7, 8, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1a0a05'; c.beginPath(); c.arc(-12 + look, -40, 3.2, 0, Math.PI * 2); c.arc(12 + look, -40, 3.2, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#4a2410'; c.lineWidth = 2.5; c.beginPath(); c.arc(0, -18, 9, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    } else {
      c.beginPath(); c.moveTo(-20, -55); c.lineTo(-8, -50); c.moveTo(8, -50); c.lineTo(20, -55); c.stroke();
      for (const ex of [-12, 12]) { c.beginPath(); c.moveTo(ex - 5, -46); c.lineTo(ex + 5, -36); c.moveTo(ex + 5, -46); c.lineTo(ex - 5, -36); c.stroke(); }
      c.fillStyle = '#ff6b8a'; c.beginPath(); c.ellipse(4, -14, 6, 9, 0.3, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#f5b0a0'; c.beginPath(); c.ellipse(-2, -64, 10, 8, 0, 0, Math.PI * 2); c.fill();   // the lump
    }
    c.restore();
  }
  drawQuestion(c, x, y, k) {
    c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 3;
    c.beginPath(); c.ellipse(0, 0, 34, 28, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-8, 22); c.lineTo(-16, 42); c.lineTo(6, 26); c.closePath(); c.fill(); c.stroke();
    this.drawChunkyText(c, '?', 0, 2, 38, '#000');
    c.restore();
  }
  drawNote(c, x, y, k, col) {
    c.save(); c.translate(x, y); c.scale(k, k); c.rotate(-0.15);
    c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.ellipse(-6, 10, 8, 6, -0.4, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(1, 8); c.lineTo(1, -18); c.quadraticCurveTo(10, -14, 12, -4); c.stroke();
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
    const hitsStart = this.FIRST_HIT, hitsEnd = hitsStart + this.HITS * this.HIT_GAP;
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    // stage light cycling through the inks, as the original's sprites did
    const ink = INKS[Math.floor(t * 1.5) % 3];
    const spot = c.createRadialGradient(560, 430, 40, 560, 430, 560);
    spot.addColorStop(0, ink + '30'); spot.addColorStop(0.5, ink + '10'); spot.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = spot; c.fillRect(0, 0, W, H);
    c.strokeStyle = ink + '55'; c.lineWidth = 2; c.beginPath(); c.moveTo(80, 560); c.lineTo(W - 80, 560); c.stroke();

    // which hit are we in, and where inside it (0..1)?
    let hitIdx = -1, hitPhase = 0, sinceHit = 99;
    if (t >= hitsStart - 0.45) {
      const k = (t - hitsStart) / this.HIT_GAP;
      hitIdx = Math.min(this.HITS - 1, Math.floor(k + 0.56));          // the wind-up belongs to the coming hit
      hitPhase = k - hitIdx;                                              // -0.56 .. 0.44 around the impact
      const lastImpact = hitsStart + Math.min(this.HITS - 1, Math.max(0, Math.floor(k))) * this.HIT_GAP;
      sinceHit = t - lastImpact;
    }
    const dazed = this.hits > 0;
    c.save();
    if (dazed && sinceHit < 0.25) { const k = (0.25 - sinceHit) * 30; c.translate(this.rng.range(-k, k), this.rng.range(-k, k)); }

    // the intruder waits on the right, puzzled as the ghost gets close
    const gobX = 650, gobY = 470, gsize = 1.7;
    const squash = dazed && sinceHit < 0.22 ? 1 - Math.sin(sinceHit / 0.22 * Math.PI) * 0.3 : 1;
    this.drawIntruder(c, gobX, gobY, gsize, t, dazed, squash);
    if (!dazed && t > this.APPROACH - 1.2) this.drawQuestion(c, gobX + 70, gobY - 200, Math.min(1, (t - (this.APPROACH - 1.2)) / 0.25));

    // the ghost drifts in from the left, whistling, fork hidden behind its back
    const approach = Math.min(1, t / this.APPROACH);
    const gx = -140 + (445 + 140) * (1 - Math.pow(1 - approach, 2));
    const gy = 400 + (approach < 1 ? Math.sin(t * 3) * 8 : 0);
    // fork angle: hidden behind (tines up-left, behind the body) → raised overhead → slammed flat onto the head
    const hidden = -0.38, overhead = 0.1, down = 1.5;
    const size = 3.4;
    let angle = hidden, behind = true;
    if (t >= this.APPROACH && t < hitsStart - 0.45) {                    // bring it round in front
      const p = (t - this.APPROACH) / (hitsStart - 0.45 - this.APPROACH);
      angle = hidden + (overhead - hidden) * (1 - Math.pow(1 - p, 2)); behind = p < 0.5;
    } else if (t >= hitsStart - 0.45 && t < hitsEnd) {
      behind = false;
      if (hitPhase < 0) {
        const p = 1 + hitPhase / 0.56;                                   // 0..1 across the wind-up
        const from = hitIdx === 0 ? overhead : down;
        if (p < 0.82) angle = from + (overhead - from) * Math.min(1, p / 0.6);      // lift it up
        else angle = overhead + (down - overhead) * Math.pow((p - 0.82) / 0.18, 2); // and slam it down
      }
      else angle = down + (hitPhase < 0.12 ? Math.sin(hitPhase * 60) * 0.05 : 0);
    } else if (t >= hitsEnd) { behind = false; angle = overhead + Math.sin(t * 2) * 0.05; }
    const lift = behind ? 0 : Math.min(1, Math.max(0, (t - this.APPROACH) / 0.5));
    const handX = gx + 40 - (behind ? 34 : 0), handY = gy + 12 - 52 * lift, fsize = 0.5 + 0.08 * lift;
    if (behind) { this.drawPitchforkHeld(c, handX, handY, angle, fsize); sc.drawGhost(c, sc.time * 2, size, gx, gy); }
    else { sc.drawGhost(c, sc.time * (dazed ? 4 : 2), size, gx, gy); this.drawPitchforkHeld(c, handX, handY, angle, fsize); }

    // whistled notes drifting up from the ghost
    if (approach < 1) {
      if (this.notes.length < 6 && Math.floor(t * 2.5) !== this.lastNoteBeat) { this.lastNoteBeat = Math.floor(t * 2.5); this.notes.push({ x: gx + 70, y: gy - 60, t: 0, col: INKS[this.notes.length % 6] }); }
    }
    for (const n of this.notes) { n.t += 1 / 60; }
    this.notes = this.notes.filter((n) => n.t < 1.6);
    for (const n of this.notes) {
      c.globalAlpha = 1 - n.t / 1.6;
      this.drawNote(c, n.x + Math.sin(n.t * 6) * 14 + n.t * 25, n.y - n.t * 90, 1.2 + n.t * 0.3, n.col);
    }
    c.globalAlpha = 1;

    if (dazed) {
      this.drawStars(c, gobX - 6, gobY - 125, t, 1.7);
      if (sinceHit < 0.12) { c.fillStyle = `rgba(255,255,255,${(0.12 - sinceHit) / 0.12 * 0.7})`; c.fillRect(-60, -60, W + 120, H + 120); }
      if (sinceHit < 0.55) {
        const pop = Math.min(1, sinceHit / 0.08), a = sinceHit < 0.4 ? 1 : (0.55 - sinceHit) / 0.15;
        const bx = gobX + 170 + (this.hits % 2) * 40, by = gobY - 250 - (this.hits % 3) * 30;
        c.save(); c.globalAlpha = a; c.translate(bx, by); c.rotate(-0.18 + (this.hits % 2) * 0.3); c.scale(pop * 0.85, pop * 0.85);
        c.beginPath();
        for (let i = 0; i < 16; i++) { const r = i % 2 ? 78 : 112, an = i * Math.PI / 8; c.lineTo(Math.cos(an) * r, Math.sin(an) * r); }
        c.closePath(); c.fillStyle = '#ffff00'; c.fill(); c.lineWidth = 6; c.strokeStyle = '#000'; c.stroke();
        this.drawChunkyText(c, ['BONK!', 'WHACK!', 'THUMP!', 'BOP!', 'CLONK!'][this.hits - 1] || 'BONK!', 0, 4, 40, '#ff0000', '#000');
        c.restore();
      }
    }
    c.restore();
  }
}
