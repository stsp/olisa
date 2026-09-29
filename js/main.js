// Wires the scene, the music and the input together.
(function () {
  const canvas = document.getElementById('screen');
  const overlay = document.getElementById('overlay');
  const scene = new Scene(canvas);
  const music = new Chiptune();
  scene.gameOver = new GameOver(scene, music);
  let started = false, last = 0, muted = false;

  scene.storm.onThunder = (delay, strength) => { if (started && !muted) music.thunder(delay, strength); };

  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    scene.update(dt);
    scene.draw();
    requestAnimationFrame(frame);
  }

  function start() {
    if (started) return;
    started = true;
    overlay.classList.add('hidden');
    music.start();
    music.thunder(0.2, 1);
  }

  function onKey(e) {
    if (!started) { start(); e.preventDefault(); return; }
    const k = e.key.toLowerCase();
    if (k === 'm') { muted = !muted; music.setMuted(muted); return; }
    if (k === 's') { scene.scanlines = !scene.scanlines; return; }
    if (k === 'f') { (document.fullscreenElement ? document.exitFullscreen() : document.getElementById('stage').requestFullscreen()); return; }
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
    scene.gameOver.start();
  }

  overlay.addEventListener('click', start);
  canvas.addEventListener('click', () => { if (started) scene.gameOver.start(); });
  window.addEventListener('keydown', onKey);

  const go = () => requestAnimationFrame(frame);
  if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]).then(go);
  else go();
})();
