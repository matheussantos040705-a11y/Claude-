// engine.js: the vector-style frame engine (PROJECT.style !== 'painted'). Replaces the p5.brush frame with a plain
// Canvas2D frame on #out, keeping the kit's timeline (shots), timing helpers (seg, kf, ease, pulse...) and render.mjs.
//
// A shot is fn(t, lt, dur) as before, but it draws with V.* on V.ctx (1920x1080). Every frame is a pure function of t.
//   V.bg(c0, c1, cx, cy)               radial near-black background (screen space)
//   V.cam(cx, cy, zoom, rot) / V.camEnd()   world point (cx,cy) to screen centre; one level; V.toScreen(x,y)
//   V.draw(model, m)                   draw a vec model (CLAWD.ops, SAGE.full, PROPS.*...) at the current transform
//   V.glow(x, y, r, col, a)            additive light
//   V.beam(x0, y0, w0, x1, y1, w1, col, a, blur)   volumetric light beam (a trapezoid, fading along its length)
//   V.dust(t, seed, n, x, y, w, h, col, a, size)   drifting particles, deterministic
//   V.reflect(groundY, a, fn)          floor reflection: fn() redrawn mirrored about groundY, fading down
//   V.layer(fn, alpha)                 draw fn() into an offscreen layer and composite (group opacity)
//   V.flash(k, col) · V.fade(k, col) · V.wipe(p, col, ang) (light-sweep transition; cut at p=.5) · V.iris(x, y, r)
//   V.key = '#FF9A6B'                  this frame's key-light colour (the kinetic type uses it)
//   V.type = { x, y, w, align, mode }  where this frame's lyric sits: mode 'left'|'right'|'center'|'top'|'off'
// Lyrics are drawn automatically after the shot (src/vec/type.js); set V.type in the shot to place them.
(function (G) {
  if (typeof PROJECT === 'undefined' || PROJECT.style === 'painted') return;
  const W = 1920, H = 1080;
  const V = G.V = { W, H, ctx: null, key: '#FF9A6B', type: null, CAM: null };
  const lay = {};
  const off = (k) => { let c = lay[k]; if (!c) { c = lay[k] = document.createElement('canvas'); c.width = W; c.height = H; } return c; };

  V.bg = (c0 = '#1E1520', c1 = '#040405', cx = .6, cy = .38) => {
    const c = V.ctx; c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    const g = c.createRadialGradient(W * cx, H * cy, 0, W * cx, H * cy, W * .85);
    g.addColorStop(0, c0); g.addColorStop(.6, mix(c0, c1, .75)); g.addColorStop(1, c1);
    c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
  };
  V.cam = (cx = W / 2, cy = H / 2, zoom = 1, rot = 0) => {
    const c = V.ctx; c.save(); c.translate(W / 2, H / 2); c.rotate(rot); c.scale(zoom, zoom); c.translate(-cx, -cy);
    V.CAM = { cx, cy, zoom, rot }; G.LAST_CAM = V.CAM;
  };
  V.camEnd = () => { V.ctx.restore(); V.CAM = null; };
  V.toScreen = (x, y, cam = V.CAM) => {
    if (!cam) return [x, y];
    const c = Math.cos(cam.rot), s = Math.sin(cam.rot), dx = (x - cam.cx) * cam.zoom, dy = (y - cam.cy) * cam.zoom;
    return [W / 2 + dx * c - dy * s, H / 2 + dx * s + dy * c];
  };
  V.draw = (model, m, a = 1) => VEC.draw(V.ctx, model, m, a);
  V.glow = (x, y, r, col = '#FFB08C', a = 1) => {
    if (a <= 0 || r < 1) return;
    const c = V.ctx; c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, VEC.rgba(col, .9 * a)); g.addColorStop(.25, VEC.rgba(col, .45 * a)); g.addColorStop(.6, VEC.rgba(col, .12 * a)); g.addColorStop(1, VEC.rgba(col, 0));
    c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore();
  };
  V.beam = (x0, y0, w0, x1, y1, w1, col = '#FF9A6B', a = .5, blur = 30) => {
    const c = V.ctx; c.save(); c.globalCompositeOperation = 'lighter';
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, VEC.rgba(col, a)); g.addColorStop(1, VEC.rgba(col, 0));
    c.filter = `blur(${blur * (V.CAM ? V.CAM.zoom : 1)}px)`; c.fillStyle = g; c.beginPath();
    c.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); c.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2); c.lineTo(x1 - nx * w1 / 2, y1 - ny * w1 / 2); c.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2); c.closePath(); c.fill(); c.restore();
  };
  V.dust = (t, seed, n, x, y, w, h, col = '#FFD9C2', a = .5, size = 2.2) => {
    const c = V.ctx; c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const hh = (k) => hash(seed * 131 + i * 7.3 + k);
      const px = x + ((hh(1) * w + t * (8 + hh(2) * 14) * (hh(5) > .5 ? 1 : -1)) % w + w) % w;
      const py = y + ((hh(3) * h - t * (5 + hh(4) * 10)) % h + h) % h;
      const tw = .55 + .45 * Math.sin(t * (1 + hh(6) * 2) + hh(7) * 6);
      c.globalAlpha = a * tw * (.35 + hh(8) * .65); c.fillStyle = col;
      c.beginPath(); c.arc(px, py, size * (.4 + hh(9)), 0, Math.PI * 2); c.fill();
    }
    c.restore();
  };
  V.layer = (fn, alpha = 1, key = 'L1') => {
    const cv = off(key), L = cv.getContext('2d'), c = V.ctx, t = c.getTransform();
    L.setTransform(1, 0, 0, 1, 0, 0); L.clearRect(0, 0, W, H); L.setTransform(t);
    const prev = V.ctx; V.ctx = L; fn(); V.ctx = prev;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = alpha; c.drawImage(cv, 0, 0); c.restore();
  };
  V.reflect = (gy, a, fn, depth = 260) => {
    if (a <= 0) return;
    const cv = off('R'), L = cv.getContext('2d'), c = V.ctx, t = c.getTransform();
    L.setTransform(1, 0, 0, 1, 0, 0); L.clearRect(0, 0, W, H); L.setTransform(t); L.translate(0, 2 * gy); L.scale(1, -1);
    const prev = V.ctx; V.ctx = L; fn(); V.ctx = prev;
    L.setTransform(t); L.globalCompositeOperation = 'destination-in';
    const g = L.createLinearGradient(0, gy, 0, gy + depth); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    L.fillStyle = g; L.fillRect(-5000, gy, 12000, depth); L.globalCompositeOperation = 'source-over';
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = a; c.drawImage(cv, 0, 0); c.restore();
  };
  const scr = (fn) => { const c = V.ctx; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); fn(c); c.restore(); };
  const FX = []; let deferFX = false;
  const fx = (fn) => (...a) => deferFX ? FX.push(() => fn(...a)) : fn(...a);
  V.flash = fx((k, col = '#FFF6EE') => { if (k > .005) scr(c => { c.globalAlpha = clamp(k); c.fillStyle = col; c.fillRect(0, 0, W, H); }); });
  V.fade = (k, col = '#000') => V.flash(k, col);
  // light sweep: a soft bright band crosses the frame; at p=.5 the frame is fully covered (cut there)
  V.wipe = fx((p, col = '#FFB08C', ang = -.35) => {
    if (p <= 0 || p >= 1) return;
    scr(c => {
      c.translate(W / 2, H / 2); c.rotate(ang);
      const span = W * 1.6, x = lerp(-span, span, p);
      const g = c.createLinearGradient(x - 900, 0, x + 900, 0);
      g.addColorStop(0, VEC.rgba(col, 0)); g.addColorStop(.3, VEC.rgba(col, .9)); g.addColorStop(.5, '#FFF8F2'); g.addColorStop(.7, VEC.rgba(col, .9)); g.addColorStop(1, VEC.rgba(col, 0));
      c.fillStyle = g; c.fillRect(x - 900, -H * 1.5, 1800, H * 3);
      // under the band, the frame is solid: covers the cut
      const cover = 1 - Math.abs(p - .5) * 2;
      if (cover > .55) { c.globalAlpha = (cover - .55) / .45; c.fillStyle = '#FFF8F2'; c.fillRect(-W, -H, W * 2, H * 2); }
    });
  });
  V.iris = fx((x, y, r, col = '#000') => scr(c => { c.fillStyle = col; c.beginPath(); c.rect(0, 0, W, H); c.arc(x, y, Math.max(0, r), 0, Math.PI * 2, true); c.fill('evenodd'); }));

  function mix(a, b, k) { return mixCol(a, b, k); }

  // ---- post: vignette + fine grain (keynote film) ----
  let grain = null;
  function makeGrain() {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512; const c = cv.getContext('2d'), id = c.createImageData(512, 512), d = id.data;
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < d.length; i += 4) { const v = 128 + (r() - .5) * 60; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    c.putImageData(id, 0, 0); return cv;
  }
  function post(c, t) {
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.filter = 'none';
    const g = c.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .72);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (!grain) grain = makeGrain();
    const f = Math.floor(t * 24); c.globalCompositeOperation = 'overlay'; c.globalAlpha = .07;
    c.drawImage(grain, -(f * 97) % 512, -(f * 61) % 512, W + 1024, H + 1024);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  }

  function frame(t) {
    const c = V.ctx = document.getElementById('out').getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
    c.fillStyle = '#050506'; c.fillRect(0, 0, W, H);
    V.key = '#FF9A6B'; V.type = null; V.CAM = null; V.post = true;
    if (window.LOOP) window.LOOP(t);
    else if (SHOTS.length) {
      let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1][0]) i++;
      const t0 = SHOTS[i][0], end = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : DUR;
      FX.length = 0; deferFX = true;
      try { c.save(); SHOTS[i][1](t, t - t0, end - t0); c.restore(); } finally { deferFX = false; }
      V.CAM = null;
    }
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.filter = 'none'; c.globalCompositeOperation = 'source-over';
    if (V.post) post(c, t);
    if (G.TYPE && PROJECT.lyrics !== 'off') TYPE.draw(c, t);
    for (const f of FX) f(); FX.length = 0;
  }
  V.frame = frame;

  // ---- render hooks (same contract as core.js, so render.mjs works unchanged) ----
  const outC = () => document.getElementById('out');
  G.renderAt = async (t, type = 'image/png', q = .92) => { G.T = t; frame(t); return outC().toDataURL(type, q); };
  G.renderSheet = async (times, cols = 3, w = 640, crop = null, at = null) => {
    if (at) at = at.map((v) => typeof v === 'string' ? (0, eval)(v) : v);
    const [, , cw, ch] = at || crop || [0, 0, W, H], h = Math.round(w * ch / cw), rows = Math.ceil(times.length / cols), sc = document.createElement('canvas');
    sc.width = cols * w; sc.height = rows * h; const c = sc.getContext('2d'), ms = [];
    for (let i = 0; i < times.length; i++) {
      const t0 = performance.now(); frame(times[i]); ms.push(Math.round(performance.now() - t0));
      const x = (i % cols) * w, y = Math.floor(i / cols) * h;
      const [cx, cy] = at ? V.toScreen(at[0], at[1], G.LAST_CAM).map((v, j) => v - (j ? ch : cw) / 2) : crop || [0, 0];
      c.drawImage(outC(), cx, cy, cw, ch, x, y, w, h); c.fillStyle = 'rgba(0,0,0,.65)'; c.fillRect(x, y, 84, 24); c.fillStyle = '#fff'; c.font = '15px sans-serif'; c.fillText(times[i].toFixed(2) + 's', x + 6, y + 17);
    }
    return { url: sc.toDataURL('image/jpeg', .9), ms };
  };
  // the p5 sketch still boots (it sets window.ready) but must not draw the painted pipeline
  G.draw = () => {};
  G.devUIVec = () => {
    const s = document.getElementById('scrub'), lab = document.getElementById('tt'); s.max = DUR; s.step = 1 / 24;
    const go = () => { const t0 = performance.now(); frame(+s.value); lab.textContent = `${(+s.value).toFixed(2)}s · ${Math.round(performance.now() - t0)} ms`; };
    s.addEventListener('input', go); s.value = +(new URLSearchParams(location.search).get('t') || 0); go();
  };
})(typeof window !== 'undefined' ? window : globalThis);
