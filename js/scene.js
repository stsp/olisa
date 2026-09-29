// Procedural rendering of the intro scene: stormy sky, lightning, dead trees, rolling hills,
// the castle silhouette with glowing windows, the red gate with a peeking ghost, and the
// cycling title / credits text. Everything is drawn from code; no bitmaps are used.

const W = 1024, H = 768;
const HORIZON = 470;

const PAL = {
  cyan: '#00ffff', magenta: '#ff00ff', yellow: '#ffff00', red: '#ff2020', green: '#00ff00', white: '#ffffff',
};

class Scene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.rng = makeRng(0x5EC7);
    this.time = 0;
    this.scanlines = true;
    this.storm = { next: 1.2, bolts: [], flash: 0, onThunder: null };
    this.ghost = { x: 362, y: 442 };
    this.credits = this.makeCredits();
    this.credit = { index: 0, t: 0 };
    this.begin = null;                    // "press any key" animation state
    this.windows = [
      [445, 200, 10, 22], [445, 292, 10, 22], [322, 222, 8, 18], [322, 304, 8, 18],
      [544, 262, 8, 18], [544, 334, 8, 18], [208, 332, 7, 16], [250, 398, 8, 16], [622, 398, 8, 16],
    ].map((w, i) => ({ x: w[0], y: w[1], w: w[2], h: w[3], phase: i * 1.7 }));
    this.buildStatic();
    this.buildRain();
    this.buildStars();
  }

  // ------------------------------------------------------------------ static layers
  hillY(x) {
    const bump = (cx, h, wdt) => h * Math.exp(-((x - cx) * (x - cx)) / (2 * wdt * wdt));
    return HORIZON - bump(900, 165, 110) - bump(745, 55, 70) - bump(110, 26, 90) + 6 * Math.sin(x * 0.012);
  }

  buildStatic() {
    const off = (draw) => { const c = document.createElement('canvas'); c.width = W; c.height = H; draw(c.getContext('2d')); return c; };

    // Castle silhouette
    const castlePath = () => {
      const p = new Path2D();
      const rect = (x, y, w, h) => p.rect(x, y, w, h);
      const tri = (ax, ay, bx, by, cx, cy) => { p.moveTo(ax, ay); p.lineTo(bx, by); p.lineTo(cx, cy); p.closePath(); };
      const battlements = (x0, x1, y, mw = 13, mh = 12) => { for (let x = x0; x < x1; x += mw * 2) rect(x, y - mh, Math.min(mw, x1 - x), mh); };
      // wings
      rect(150, 332, 190, HORIZON - 332); battlements(150, 340, 332);
      rect(575, 342, 110, HORIZON - 342); battlements(575, 685, 342);
      // far-left towers
      rect(140, 302, 30, HORIZON - 302); tri(136, 302, 174, 302, 155, 232);
      rect(190, 242, 42, HORIZON - 242); tri(184, 242, 238, 242, 211, 150);
      // left tall tower
      rect(298, 162, 54, HORIZON - 162); tri(290, 162, 360, 162, 325, 62);
      rect(318, 100, 14, 62);                                 // spire needle
      // gate wall between tower and keep
      rect(350, 332, 32, HORIZON - 332); battlements(350, 382, 332, 8, 8);
      // keep
      rect(380, 124, 132, HORIZON - 124); battlements(380, 512, 124, 12, 14);
      rect(372, 152, 148, 22);                                 // machicolation ring
      // right tower
      rect(520, 192, 56, HORIZON - 192); tri(510, 192, 586, 192, 548, 84);
      rect(541, 60, 14, 30);                                   // flagpole block
      return p;
    };
    this.castlePath = castlePath();

    this.castleLayer = off((c) => {
      c.fillStyle = '#05050f';
      c.fill(this.castlePath);
      // faint stone texture
      c.save(); c.clip(this.castlePath);
      const r = makeRng(77);
      for (let i = 0; i < 900; i++) {
        c.fillStyle = `rgba(120,130,200,${r.range(0.02, 0.06)})`;
        c.fillRect(r.range(130, 700), r.range(60, HORIZON), r.range(6, 16), r.range(3, 7));
      }
      c.restore();
    });
    this.castleRim = off((c) => { c.fillStyle = '#8fb8ff'; c.fill(this.castlePath); });

    // Hills and ground
    this.groundLayer = off((c) => {
      const g = c.createLinearGradient(0, 300, 0, H);
      g.addColorStop(0, '#02140a'); g.addColorStop(0.45, '#010a05'); g.addColorStop(1, '#000000');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W; x += 4) c.lineTo(x, this.hillY(x));
      c.lineTo(W, H); c.closePath(); c.fill();
      // grass contour lines in the foreground, like the original's green strokes
      const r = makeRng(31);
      for (let i = 0; i < 9; i++) {
        const y0 = 492 + i * 30 + r.range(-6, 6);
        c.strokeStyle = `rgba(0,255,0,${0.22 - i * 0.018})`; c.lineWidth = 2;
        c.beginPath();
        let x0 = r.range(0, 200);
        const len = r.range(300, 700);
        for (let x = x0; x < x0 + len && x < W; x += 6) c.lineTo(x, y0 + 5 * Math.sin(x * 0.03 + i) + 2 * Math.sin(x * 0.11));
        c.stroke();
      }
    });
    this.groundEdge = off((c) => {
      c.strokeStyle = 'rgba(40,255,60,0.9)'; c.lineWidth = 1.8; c.shadowColor = PAL.green; c.shadowBlur = 6;
      c.beginPath(); for (let x = 0; x <= W; x += 4) c.lineTo(x, this.hillY(x) + 1); c.stroke();
    });

    // Dead trees
    this.treeLayer = off((c) => {
      const r = makeRng(1986);
      const branch = (x, y, len, ang, w, depth) => {
        const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
        c.lineCap = 'round';
        if (w > 2.5) {
          c.strokeStyle = 'rgba(40,230,70,0.22)'; c.lineWidth = w + 2;
          c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
        }
        c.strokeStyle = '#020306'; c.lineWidth = w;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
        if (depth <= 0 || len < 5) return;
        const n = depth > 5 ? 2 : (r() < 0.35 ? 1 : 2);
        for (let i = 0; i < n; i++) {
          const a = ang + r.range(-1.1, 1.1) * (i === 0 ? 0.55 : 1) - 0.1;
          branch(x2, y2, len * r.range(0.68, 0.86), a, Math.max(0.8, w * 0.6), depth - 1);
        }
      };
      branch(802, this.hillY(802) + 2, 70, -Math.PI / 2 + 0.06, 12, 8);
      branch(705, this.hillY(705) + 2, 48, -Math.PI / 2 - 0.12, 7, 7);
      branch(940, this.hillY(940) + 2, 26, -Math.PI / 2 + 0.2, 5, 5);
    });

    // Clouds: a wide strip that scrolls and wraps
    this.cloudLayer = document.createElement('canvas');
    this.cloudLayer.width = W * 2; this.cloudLayer.height = 420;
    {
      const c = this.cloudLayer.getContext('2d'); const r = makeRng(555);
      for (let i = 0; i < 26; i++) {
        const cx = r.range(0, W * 2), cy = r.range(20, 330), sz = r.range(90, 240);
        for (let k = 0; k < 7; k++) {
          const ex = cx + r.range(-sz, sz), ey = cy + r.range(-sz * 0.25, sz * 0.25), rx = r.range(sz * 0.35, sz * 0.7), ry = rx * r.range(0.35, 0.55);
          const g = c.createRadialGradient(ex, ey, 0, ex, ey, rx);
          g.addColorStop(0, 'rgba(2,2,40,0.55)'); g.addColorStop(0.7, 'rgba(6,6,70,0.25)'); g.addColorStop(1, 'rgba(10,10,90,0)');
          c.fillStyle = g; c.beginPath(); c.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); c.fill();
        }
      }
    }

    // Scanline pattern
    const sl = document.createElement('canvas'); sl.width = 1; sl.height = 3;
    const sc = sl.getContext('2d'); sc.fillStyle = 'rgba(0,0,0,0.22)'; sc.fillRect(0, 2, 1, 1);
    this.scanPattern = this.ctx.createPattern(sl, 'repeat');
  }

  buildRain() {
    const r = makeRng(9);
    this.rain = Array.from({ length: 260 }, () => ({ x: r.range(0, W), y: r.range(0, H), len: r.range(14, 30), v: r.range(760, 1050) }));
  }
  buildStars() {
    const r = makeRng(42);
    this.stars = Array.from({ length: 90 }, () => ({ x: r.range(0, W), y: r.range(0, 280), s: r.range(0.6, 1.6), p: r.range(0, 6.28) }));
  }

  // ------------------------------------------------------------------ text screens
  makeCredits() {
    const big = (text, color) => ({ text, color, font: '700 40px Cinzel, Georgia, serif', spacing: 9 });
    return [
      { hold: 9, title: true },
      { hold: 7, lines: [big('PRESENTED BY', PAL.magenta), big('IONIS SOFTWARE INTERNATIONAL', PAL.magenta), big('1986', PAL.yellow)] },
      { hold: 7, lines: [big('ORIGINAL MUSIC BY', PAL.magenta), big('JERRY ASTLEY', PAL.yellow)] },
      { hold: 7, lines: [big('PROGRAM AND DESIGN', PAL.red), big('ROGER DANISON', PAL.cyan)] },
      { hold: 7, lines: [big('REMAKE', PAL.cyan), big('NEW GRAPHICS AND MUSIC', PAL.yellow), big('2026', PAL.magenta)] },
    ];
  }

  // ------------------------------------------------------------------ storm
  strike() {
    const r = this.rng;
    const bolts = [];
    const sides = r() < 0.35 ? ['L', 'R'] : [r() < 0.5 ? 'L' : 'R'];
    for (const s of sides) {
      const x0 = s === 'L' ? r.range(120, 280) : r.range(600, 780);
      const x1 = s === 'L' ? r.range(150, 320) : r.range(540, 700);
      bolts.push({ pts: this.boltPoints(x0, -10, x1, r.range(180, 290), 5), life: 0, dur: r.range(0.45, 0.8), branches: [] });
      const b = bolts[bolts.length - 1];
      for (let i = 0; i < 3; i++) {
        const k = Math.floor(r.range(0.2, 0.7) * b.pts.length);
        const [bx, by] = b.pts[k];
        b.branches.push(this.boltPoints(bx, by, bx + r.range(-90, 90), by + r.range(40, 110), 3));
      }
    }
    this.storm.bolts = bolts;
    this.storm.next = r.range(2.8, 7.5);
    if (this.storm.onThunder) this.storm.onThunder(r.range(0.25, 1.1), r.range(0.55, 1) * (sides.length === 2 ? 1.15 : 1));
  }
  boltPoints(x0, y0, x1, y1, depth) {
    let pts = [[x0, y0], [x1, y1]];
    for (let d = 0; d < depth; d++) {
      const out = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
        const mx = (ax + bx) / 2, my = (ay + by) / 2;
        const len = Math.hypot(bx - ax, by - ay);
        out.push([mx + this.rng.range(-len * 0.28, len * 0.28), my + this.rng.range(-len * 0.12, len * 0.12)], pts[i]);
      }
      pts = out;
    }
    return pts;
  }
  updateStorm(dt) {
    const st = this.storm;
    if (st.bolts.length === 0) { st.next -= dt; if (st.next <= 0) this.strike(); }
    let flash = 0;
    for (const b of st.bolts) {
      b.life += dt;
      const k = 1 - b.life / b.dur;
      b.alpha = k <= 0 ? 0 : k * (this.rng() < 0.3 ? 0.35 : 1);
      flash = Math.max(flash, b.alpha);
    }
    st.bolts = st.bolts.filter((b) => b.life < b.dur);
    st.flash += (flash - st.flash) * Math.min(1, dt * 30);
  }
  drawBolt(c, pts, width, alpha) {
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = `rgba(160,190,255,${0.35 * alpha})`; c.lineWidth = width * 3.5;
    c.shadowColor = 'rgba(140,170,255,1)'; c.shadowBlur = 28 * alpha;
    c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    c.shadowBlur = 0;
    c.strokeStyle = `rgba(255,255,255,${alpha})`; c.lineWidth = width;
    c.stroke();
  }

  // ------------------------------------------------------------------ text helpers
  drawText(c, text, x, y, color, font, spacing, glow = 16) {
    c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle';
    if ('letterSpacing' in c) c.letterSpacing = spacing + 'px';
    const dx = spacing / 2; // letterSpacing adds trailing space; re-centre
    c.shadowBlur = 0; c.fillStyle = 'rgba(0,0,0,0.9)';
    c.fillText(text, x + 4 + dx, y + 4);
    c.shadowColor = color; c.shadowBlur = glow; c.fillStyle = color;
    c.fillText(text, x + dx, y);
    c.shadowBlur = 0;
    c.fillText(text, x + dx, y);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
  }
  drawTitle(c, alpha) {
    c.globalAlpha = alpha;
    const f = (px) => `700 ${px}px UnifrakturCook, "Old English Text MT", serif`;
    this.drawText(c, 'Olli & Lissa', W / 2, 552, PAL.cyan, f(74), 2, 22);
    this.drawText(c, 'The Ghost of Shilmoore', W / 2, 630, PAL.magenta, f(70), 2, 22);
    this.drawText(c, 'Castle', W / 2, 700, PAL.cyan, f(70), 2, 22);
    c.globalAlpha = 1;
  }
  drawCredits(c, screen, alpha) {
    c.globalAlpha = alpha;
    const n = screen.lines.length;
    const y0 = 596 - (n - 1) * 28;
    screen.lines.forEach((l, i) => this.drawText(c, l.text, W / 2, y0 + i * 56, l.color, l.font, l.spacing));
    c.globalAlpha = 1;
  }
  drawFooter(c, t, showPress) {
    if (showPress) {
      const pulse = 0.72 + 0.28 * Math.sin(t * 4);
      c.globalAlpha = pulse;
      this.drawText(c, 'PRESS ANY KEY TO BEGIN', W / 2, 722, PAL.yellow, '700 34px Cinzel, Georgia, serif', 8);
      c.globalAlpha = 1;
    } else {
      this.drawText(c, 'IONIS SOFTWARE INTERNATIONAL', W / 2, 745, PAL.cyan, '700 17px Cinzel, Georgia, serif', 5, 8);
    }
  }

  // ------------------------------------------------------------------ ghost
  drawGhost(c, t, scale = 1, cx = this.ghost.x, cy = this.ghost.y) {
    const bob = Math.sin(t * 2.2) * 4;
    const shy = Math.max(0, Math.sin(t * 0.45)) ** 6 * 34;   // now and then it ducks back into the gate
    const y = cy + bob + shy;
    c.save();
    c.translate(cx, y); c.scale(scale, scale);
    c.shadowColor = 'rgba(255,80,255,0.9)'; c.shadowBlur = 18;
    const body = new Path2D();
    body.moveTo(-17, 0); body.arc(0, 0, 17, Math.PI, 0);
    body.lineTo(17, 22);
    for (let i = 0; i < 4; i++) { const x = 17 - i * 8.5; body.quadraticCurveTo(x - 4.25, 26 + Math.sin(t * 6 + i) * 2.5, x - 8.5, 22); }
    body.closePath();
    const g = c.createLinearGradient(0, -17, 0, 26);
    g.addColorStop(0, '#ffe8ff'); g.addColorStop(0.55, '#ff9cff'); g.addColorStop(1, '#e040e0');
    c.fillStyle = g; c.fill(body);
    c.shadowBlur = 0;
    // waving arm
    c.strokeStyle = '#ffb0ff'; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(14, 6); c.lineTo(26, 2 - Math.sin(t * 5) * 6); c.stroke();
    // eyes
    const look = Math.sin(t * 0.8) * 2.2;
    c.fillStyle = '#12001a';
    c.beginPath(); c.ellipse(-6 + look, -3, 3.2, 4.2, 0, 0, Math.PI * 2); c.ellipse(6 + look, -3, 3.2, 4.2, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(-7 + look, -4.5, 1.1, 0, Math.PI * 2); c.arc(5 + look, -4.5, 1.1, 0, Math.PI * 2); c.fill();
    // grin
    c.strokeStyle = '#12001a'; c.lineWidth = 1.6;
    c.beginPath(); c.arc(0, 4, 5, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.restore();
  }

  drawGate(c, flash) {
    // red arched gate; the ghost is drawn behind an inner frame so it seems to peek out
    const x = 338, w = 48, top = 402, bottom = HORIZON + 2;
    const arch = (inset) => { const p = new Path2D(); const r = (w - inset * 2) / 2; p.moveTo(x + inset, bottom); p.lineTo(x + inset, top + r); p.arc(x + w / 2, top + r, r, Math.PI, 0); p.lineTo(x + w - inset, bottom); p.closePath(); return p; };
    const g = c.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, '#ff3030'); g.addColorStop(1, '#8a0000');
    c.shadowColor = 'rgba(255,40,40,0.8)'; c.shadowBlur = 14 + flash * 10;
    c.fillStyle = g; c.fill(arch(0));
    c.shadowBlur = 0;
    c.fillStyle = '#2a0008'; c.fill(arch(6));
    if (!this.begin) { c.save(); c.clip(arch(6)); this.drawGhost(c, this.time); c.restore(); }
    // frame studs
    c.fillStyle = '#ff6060';
    for (let i = 0; i < 5; i++) { c.fillRect(x + 2, top + 26 + i * 9, 2, 2); c.fillRect(x + w - 4, top + 26 + i * 9, 2, 2); }
  }

  // ------------------------------------------------------------------ frame
  update(dt) {
    this.time += dt;
    this.updateStorm(dt);
    const cr = this.credit;
    cr.t += dt;
    const scr = this.credits[cr.index];
    if (cr.t >= scr.hold) { cr.t = 0; cr.index = (cr.index + 1) % this.credits.length; }
    for (const d of this.rain) {
      d.y += d.v * dt; d.x -= 70 * dt;
      if (d.y > H + 30) { d.y = -30; d.x = this.rng.range(0, W + 80); }
      if (d.x < -20) d.x += W + 40;
    }
    if (this.begin) {
      this.begin.t += dt;
      if (this.begin.t > 4.6) this.begin = null;
    }
  }

  draw() {
    const c = this.ctx, t = this.time, flash = this.storm.flash;
    // sky
    const sky = c.createLinearGradient(0, 0, 0, HORIZON);
    sky.addColorStop(0, '#02023a'); sky.addColorStop(0.45, '#0b0bcf'); sky.addColorStop(0.72, '#1a1aff'); sky.addColorStop(1, '#2a2aff');
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    // stars
    for (const s of this.stars) {
      c.globalAlpha = (0.35 + 0.35 * Math.sin(t * 1.5 + s.p)) * (1 - flash);
      c.fillStyle = '#dfe8ff'; c.fillRect(s.x, s.y, s.s, s.s);
    }
    c.globalAlpha = 1;
    // clouds
    const scroll = (t * 14) % (W * 2);
    c.drawImage(this.cloudLayer, -scroll, -10); c.drawImage(this.cloudLayer, W * 2 - scroll, -10);
    const scroll2 = (t * 30 + 700) % (W * 2);
    c.globalAlpha = 0.6; c.drawImage(this.cloudLayer, -scroll2, 120); c.drawImage(this.cloudLayer, W * 2 - scroll2, 120); c.globalAlpha = 1;
    // lightning
    for (const b of this.storm.bolts) {
      if (b.alpha <= 0) continue;
      this.drawBolt(c, b.pts, 2.6, b.alpha);
      for (const br of b.branches) this.drawBolt(c, br, 1.4, b.alpha * 0.8);
    }
    if (flash > 0.01) { c.fillStyle = `rgba(220,230,255,${flash * 0.42})`; c.fillRect(0, 0, W, H); }
    // hills, trees, castle
    c.drawImage(this.groundLayer, 0, 0);
    if (flash > 0.02) { c.globalAlpha = flash * 0.5; c.drawImage(this.castleRim, -2, -3); c.globalAlpha = 1; }
    c.save(); const sway = Math.sin(t * 0.7) * 0.006 + (flash * 0.004);
    c.translate(800, HORIZON); c.rotate(sway); c.translate(-800, -HORIZON); c.drawImage(this.treeLayer, 0, 0); c.restore();
    c.drawImage(this.castleLayer, 0, 0);
    c.drawImage(this.groundEdge, 0, 0);
    this.drawGate(c, flash);
    // windows
    for (const w of this.windows) {
      const k = 0.7 + 0.3 * Math.sin(t * 7 + w.phase) * Math.sin(t * 2.3 + w.phase * 2);
      const cx = w.x + w.w / 2, cy = w.y + w.h / 2;
      const g = c.createRadialGradient(cx, cy, 2, cx, cy, 34);
      g.addColorStop(0, `rgba(255,240,120,${0.45 * k})`); g.addColorStop(1, 'rgba(255,220,80,0)');
      c.fillStyle = g; c.fillRect(cx - 34, cy - 34, 68, 68);
      c.fillStyle = `rgba(255,255,${Math.floor(120 + 100 * k)},${0.75 + 0.25 * k})`; c.fillRect(w.x, w.y, w.w, w.h);
      c.fillStyle = '#05050f'; c.fillRect(w.x + w.w / 2 - 0.5, w.y, 1, w.h); c.fillRect(w.x, w.y + w.h / 2 - 0.5, w.w, 1);
    }
    // rain
    c.strokeStyle = `rgba(190,205,255,${0.2 + flash * 0.4})`; c.lineWidth = 1;
    c.beginPath();
    for (const d of this.rain) { c.moveTo(d.x, d.y); c.lineTo(d.x - d.len * 0.09, d.y + d.len); }
    c.stroke();
    // text
    if (this.begin) this.drawBegin(c);
    else {
      const scr = this.credits[this.credit.index];
      const ct = this.credit.t, fade = 0.5;
      const alpha = Math.min(1, ct / fade, (scr.hold - ct) / fade);
      if (scr.title) this.drawTitle(c, alpha); else this.drawCredits(c, scr, alpha);
      const showPress = !scr.title;
      c.globalAlpha = showPress ? 1 : alpha; this.drawFooter(c, t, showPress); c.globalAlpha = 1;
    }
    // vignette + scanlines
    const v = c.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
    c.fillStyle = v; c.fillRect(0, 0, W, H);
    if (this.scanlines) { c.fillStyle = this.scanPattern; c.fillRect(0, 0, W, H); }
  }

  // Key pressed: a flash, the ghost swoops out of the gate towards the viewer, and a short card.
  drawBegin(c) {
    const b = this.begin, t = b.t;
    if (t < 0.25) { c.fillStyle = `rgba(255,255,255,${1 - t / 0.25})`; c.fillRect(0, 0, W, H); }
    const k = Math.min(1, t / 1.6);
    const ease = 1 - Math.pow(1 - k, 3);
    const gx = this.ghost.x + (W / 2 - this.ghost.x) * ease, gy = this.ghost.y + (H * 0.74 - this.ghost.y) * ease;
    this.drawGhost(c, this.time * 3, 1 + ease * 9, gx, gy);
    if (t > 1.4) {
      const a = Math.min(1, (t - 1.4) / 0.5) * Math.min(1, (4.6 - t) / 0.6);
      c.fillStyle = `rgba(0,0,0,${0.55 * a})`; c.fillRect(0, 0, W, H);
      c.globalAlpha = a;
      this.drawText(c, 'SHILMOORE CASTLE AWAITS', W / 2, 150, PAL.yellow, '700 44px Cinzel, Georgia, serif', 10);
      this.drawText(c, 'THIS REMAKE COVERS THE INTRO ONLY', W / 2, 212, PAL.cyan, '700 22px Cinzel, Georgia, serif', 6);
      c.globalAlpha = 1;
    }
  }
  pressBegin() { if (!this.begin) this.begin = { t: 0 }; }
}
