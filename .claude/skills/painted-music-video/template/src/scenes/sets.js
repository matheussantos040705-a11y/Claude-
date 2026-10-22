// sets.js: shared sets and helpers for every chapter (window.SETS). Chapters only READ this file.
//   SETS.bt(k)              time of grid beat k (grid = 169.84 BPM; FELT beat = bt(2k), bar = bt(8k))
//   SETS.fb(k)              felt beat k (≈0.707 s apart) · SETS.bar(k) bar k (≈2.83 s)
//   SETS.KEY                key-light colour per chapter
//   SETS.emo(t, [[t0, presetOrObj], ...])  eased blend between Clawd expressions (numbers and [x,y] arrays)
//   SETS.semo(t, keys)      same for Sage expressions
//   SETS.room(t, o)         The Room: back wall, floor, window (o.win 0..1 open, o.winCol), desk, side walls that can
//                           close in (o.squeeze 0..1), returns { floorY, win:{x,y,w,h,cx,cy}, desk:{x,y} }
//   SETS.hall(t, o)         endless hallway of doors (one-point perspective drawn flat), twins leaning out:
//                           o.lean 0..1, o.shut 0..1 cascade, o.wave 0..1 (final chorus), o.tint
//   SETS.scroll(x, y, len, t, o)    the context scroll: glowing ruled lines (o.crumple 0..1)
//   SETS.ribbon(t, x0, y0, x1, y1, n, col, a)  Lissajous light ribbons (context pouring in)
//   SETS.clawd(e, x, y, s) / SETS.sage(...)    draw helpers with floor reflection (o.reflect)
//   SETS.spark(x, y, r, col)  a glowing point (the injected thought, embers)
(function (G) {
  const W = 1920, H = 1080;
  const bt = (k) => OFF + k * BEAT, fb = (k) => bt(2 * k), bar = (k) => bt(8 * k);
  const KEY = {
    c00: '#E8ECFF', c01: '#FF9A6B', c02: '#FF9A6B', c02drop: '#FF7A55', c03: '#5EE1FF', c03noir: '#E8E8E8', c04: '#C9A06A',
    c05: '#FF8FA3', c06: '#FF4FD8', c06b: '#3FE0C8', c07: '#F4F0FF', c07red: '#FF4A3D', c08: '#FFC56B', c08earth: '#5DA9FF',
    c09: '#FFD27A', c10: '#FF3B30', c10hello: '#DDEBFF',
  };
  const lerpObj = (a, b, k) => {
    const o = { ...a, ...b };
    for (const key of Object.keys(o)) {
      const va = a[key], vb = b[key];
      if (typeof va === 'number' && typeof vb === 'number') o[key] = va + (vb - va) * k;
      else if (Array.isArray(va) && Array.isArray(vb)) o[key] = va.map((v, i) => v + (vb[i] - v) * k);
      else o[key] = k < .5 ? (va ?? vb) : (vb ?? va);
    }
    return o;
  };
  const blend = (P) => (t, keys, e = ease) => {
    const R = (v) => typeof v === 'string' ? { ...P.EXPR.neutral, ...P.EXPR[v] } : { ...P.EXPR.neutral, ...v };
    if (t <= keys[0][0]) return R(keys[0][1]);
    for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) {
      const [a, va] = keys[i - 1], [b, vb] = keys[i], span = Math.min(b - a, .45);
      return lerpObj(R(va), R(vb), e(seg(t, b - span, b)));
    }
    return R(keys[keys.length - 1][1]);
  };
  // emotions change over the last ≤0.45 s before each key (anticipation lands ON the key time)
  const emo = (t, keys) => blend(G.CLAWD)(t, keys);
  const semo = (t, keys) => blend(G.SAGE)(t, keys);

  // ---------------- The Room ----------------
  function room(t, o = {}) {
    const c = V.ctx, key = o.key || V.key, sq = o.squeeze || 0, floorY = 820;
    const L = lerp(-300, 1000, sq), R = lerp(2200, 900, sq), top = lerp(-300, 330, sq * .9);
    // back wall: deep gradient, lit around the window
    const win = o.winRect || { x: 1180, y: 250, w: 300, h: 360 };
    win.cx = win.x + win.w / 2; win.cy = win.y + win.h / 2;
    c.save();
    let g = c.createLinearGradient(0, -600, 0, floorY); g.addColorStop(0, '#0B0A0E'); g.addColorStop(1, '#1A1418');
    c.fillStyle = g; c.fillRect(-3000, -2000, 8000, floorY + 2000);
    // wall light pool around the window
    g = c.createRadialGradient(win.cx, win.cy, 40, win.cx, win.cy, 900);
    g.addColorStop(0, VEC.rgba(key, .22 * (o.light ?? 1))); g.addColorStop(1, VEC.rgba(key, 0));
    c.fillStyle = g; c.fillRect(win.cx - 900, win.cy - 900, 1800, 1800);
    // floor
    g = c.createLinearGradient(0, floorY, 0, floorY + 500); g.addColorStop(0, '#16111A'); g.addColorStop(1, '#070608');
    c.fillStyle = g; c.fillRect(-3000, floorY, 8000, 2000);
    c.fillStyle = VEC.rgba('#FFFFFF', .06); c.fillRect(-3000, floorY, 8000, 1.5);
    // light pool on the floor under the window
    g = c.createRadialGradient(win.cx - 120, floorY + 60, 10, win.cx - 120, floorY + 60, 620);
    g.addColorStop(0, VEC.rgba(key, .3 * (o.light ?? 1))); g.addColorStop(1, VEC.rgba(key, 0));
    c.save(); c.translate(win.cx - 120, floorY + 60); c.scale(1, .22); c.translate(-(win.cx - 120), -(floorY + 60));
    c.fillStyle = g; c.fillRect(win.cx - 800, floorY - 600, 1600, 1300); c.restore();
    c.restore();
    // the window: frame, glass gradient, mullion; o.win opens the two panes outward
    drawWindow(t, win, key, o);
    // volumetric beam from the window to the floor
    V.beam(win.cx, win.cy + win.h * .2, win.w * .9, win.cx - 260, floorY + 220, win.w * 2.6, key, .32 * (o.light ?? 1) * (1 + (o.win || 0) * .8), 38);
    // desk
    if (o.desk !== false) drawDesk(o.deskX ?? 700, floorY, key);
    // side walls closing in (the compactor): dark slabs with a lit inner edge
    if (sq > 0) {
      for (const [x, side] of [[L, -1], [R, 1]]) {
        c.save(); const w0 = 2000;
        g = c.createLinearGradient(x, 0, x - side * 140, 0); g.addColorStop(0, '#2A2028'); g.addColorStop(1, '#0D0B10');
        c.fillStyle = g; c.fillRect(side < 0 ? x - w0 : x, -2000, w0, 5000);
        c.fillStyle = VEC.rgba(key, .55); c.fillRect(x - 1.5, -2000, 3, 5000);
        c.restore();
      }
      c.save(); c.fillStyle = '#0D0B10'; c.fillRect(-3000, top - 3000, 8000, 3000); c.fillStyle = VEC.rgba(key, .4); c.fillRect(-3000, top - 1.5, 8000, 3); c.restore();
    }
    return { floorY, win, L, R, top };
  }
  function drawWindow(t, win, key, o) {
    const c = V.ctx, open = o.win || 0, flick = o.flicker ? (.75 + .25 * Math.sin(t * 37) * Math.sin(t * 13)) : 1;
    c.save();
    // glow behind glass
    V.glow(win.cx, win.cy, win.w * (1.6 + open), key, .55 * flick * (o.light ?? 1));
    // glass
    const r = 14;
    const pane = (x, y, w, h, skew) => {
      c.save(); c.beginPath(); c.roundRect(x, y, w, h, r);
      const g = c.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, mixCol('#FFF2E8', key, .2)); g.addColorStop(.5, key); g.addColorStop(1, mixCol(key, '#7A2A18', .45));
      c.globalAlpha = flick * (o.light ?? 1); c.fillStyle = g; c.fill();
      c.globalAlpha = .55; c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.5; c.stroke(); c.restore();
    };
    if (open < .02) pane(win.x, win.y, win.w, win.h);
    else {
      // panes swing outward: they narrow toward their hinges (flat 2D: a width squash), light pours out the gap
      const k = easeOut(open), hw = win.w / 2;
      pane(win.x - k * hw * .2, win.y, hw * (1 - k * .75), win.h);
      pane(win.x + hw + k * hw * .95, win.y, hw * (1 - k * .75), win.h);
      c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(0, win.y, 0, win.y + win.h);
      g.addColorStop(0, VEC.rgba('#FFF4EA', .95 * k)); g.addColorStop(1, VEC.rgba(key, .8 * k));
      c.fillStyle = g; c.beginPath(); c.roundRect(win.x + hw * (1 - k * .75) - k * hw * .2, win.y, win.w - 2 * hw * (1 - k * .75) + k * hw * 1.15, win.h, 6); c.fill(); c.restore();
    }
    // frame + mullion
    c.strokeStyle = '#2E2328'; c.lineWidth = 10; c.beginPath(); c.roundRect(win.x - 8, win.y - 8, win.w + 16, win.h + 16, r + 6); c.stroke();
    if (open < .02) { c.fillStyle = '#2E2328'; c.fillRect(win.cx - 3, win.y, 6, win.h); c.fillRect(win.x, win.cy - 3, win.w, 6); }
    c.restore();
  }
  function drawDesk(x, floorY, key) {
    const c = V.ctx; c.save();
    const top = floorY - 150;
    let g = c.createLinearGradient(0, top, 0, top + 26); g.addColorStop(0, '#3A2C2E'); g.addColorStop(1, '#1C1518');
    c.fillStyle = g; c.beginPath(); c.roundRect(x - 230, top, 460, 26, 8); c.fill();
    c.fillStyle = VEC.rgba(key, .5); c.fillRect(x - 222, top, 444, 1.5);
    c.fillStyle = '#141015'; c.fillRect(x - 200, top + 26, 18, 124); c.fillRect(x + 182, top + 26, 18, 124);
    c.restore();
    return { x, y: top };
  }

  // ---------------- The context scroll ----------------
  function scroll(x, y, len, t, o = {}) {
    const c = V.ctx, key = o.key || V.key, cr = o.crumple || 0, w = o.w || 120;
    c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot);
    // paper: a tall pale panel that can crumple (zig-zag squash)
    const n = 14, pts = [];
    for (let i = 0; i <= n; i++) { const yy = i / n * len * (1 - cr * .55); pts.push([Math.sin(i * 2.1) * cr * 26, yy]); }
    c.beginPath(); pts.forEach(([dx, yy], i) => i ? c.lineTo(-w / 2 + dx, yy) : c.moveTo(-w / 2 + dx, yy));
    for (let i = n; i >= 0; i--) c.lineTo(w / 2 + pts[i][0] * .7, pts[i][1]);
    c.closePath();
    const g = c.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, '#E9DCCF'); g.addColorStop(.6, '#FFF4EA'); g.addColorStop(1, '#D8C5B4');
    c.fillStyle = g; c.fill();
    // ruled lines of text (light, not letters)
    c.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < len / 16; i++) {
      const yy = 14 + i * 16 * (1 - cr * .55), ww = (w - 30) * (.45 + .5 * hash(i * 3.3 + (o.seed || 0)));
      c.fillStyle = VEC.rgba(i % 7 === 3 ? key : '#5A4A48', .55); c.fillRect(-w / 2 + 14 + pts[Math.min(n, Math.floor(i * 16 / len * n))][0], yy, ww, 4);
    }
    c.globalCompositeOperation = 'source-over';
    // rolled ends
    for (const yy of [0, len * (1 - cr * .55)]) { const gg = c.createLinearGradient(0, yy - 12, 0, yy + 12); gg.addColorStop(0, '#CDB8A6'); gg.addColorStop(.5, '#FFF7EE'); gg.addColorStop(1, '#BBA392'); c.fillStyle = gg; c.beginPath(); c.roundRect(-w / 2 - 10, yy - 12, w + 20, 24, 12); c.fill(); }
    c.restore();
    V.glow(x, y + len * .4, len * .5, key, .18);
  }
  // context pouring in: Lissajous ribbons of light
  function ribbon(t, x0, y0, x1, y1, n = 6, col = V.key, a = .8, speed = 1) {
    const c = V.ctx; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      c.beginPath();
      for (let k = 0; k <= 60; k++) {
        const u = k / 60, ph = t * 2.2 * speed + i * .7;
        const x = lerp(x0, x1, u) + Math.sin(u * 7 + ph) * 26 * (1 - u * .5);
        const y = lerp(y0, y1, u) + Math.sin(u * 5 * (1 + i * .13) + ph * 1.3) * 60 * u + (i - n / 2) * 12;
        k ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, VEC.rgba(col, a)); g.addColorStop(1, VEC.rgba(col, 0));
      c.strokeStyle = g; c.lineWidth = 2.2 + (i % 3); c.setLineDash([30 + 20 * hash(i), 14, 60, 18]); c.lineDashOffset = -t * 220 * speed - i * 40; c.stroke();
    }
    c.restore();
  }
  function spark(x, y, r = 16, col = '#FFD27A', a = 1) {
    V.glow(x, y, r * 6, col, .8 * a); V.glow(x, y, r * 2, '#FFFFFF', .9 * a);
    const c = V.ctx; c.save(); c.globalAlpha = a; c.fillStyle = '#FFFBEF'; c.beginPath(); c.arc(x, y, r * .45, 0, Math.PI * 2); c.fill(); c.restore();
  }

  // ---------------- The hallway of twins ----------------
  function hall(t, o = {}) {
    const c = V.ctx, key = o.key || V.key, vx = o.vx ?? 960, vy = o.vy ?? 470;
    c.save();
    c.fillStyle = '#08070A'; c.fillRect(-3000, -2000, 8000, 5000);
    // far glow at the vanishing point
    V.glow(vx, vy, 520, key, .35);
    // floor + ceiling planes (flat polygons toward the vanishing point)
    const g = c.createLinearGradient(0, vy, 0, 1300); g.addColorStop(0, '#0B0A0E'); g.addColorStop(1, '#1D161C');
    c.fillStyle = g; c.beginPath(); c.moveTo(vx, vy); c.lineTo(-1200, 1400); c.lineTo(3100, 1400); c.closePath(); c.fill();
    c.fillStyle = '#0A090C'; c.beginPath(); c.moveTo(vx, vy); c.lineTo(-1200, -500); c.lineTo(3100, -500); c.closePath(); c.fill();
    // doors: pairs at depths z, scale ~ 1/z
    const N = 11, out = [];
    for (let i = N - 1; i >= 0; i--) {
      const z = 1 + i * .62, s = 1 / z, side = [-1, 1];
      for (const sd of side) {
        const dx = sd * 760 * s, dw = 230 * s, dh = 520 * s, x = vx + dx - (sd < 0 ? dw : 0), y = vy + 420 * s - dh;
        // door frame + opening
        const shut = o.shut ? clamp((o.shut - i * .07) / .25) : 0;
        c.fillStyle = mixCol('#1A1418', '#08070A', 1 - s); c.fillRect(x - 10 * s, y - 10 * s, dw + 20 * s, dh + 10 * s);
        const lg = c.createLinearGradient(x, y, x, y + dh); lg.addColorStop(0, VEC.rgba(key, .9 * s)); lg.addColorStop(1, VEC.rgba(key, .25 * s));
        c.fillStyle = lg; c.fillRect(x, y, dw, dh);
        // twin leaning out of the door
        const lean = (o.lean ?? 1) * (1 - shut);
        if (lean > .02 && !(o.skip && o.skip(i, sd))) {
          const cx = sd < 0 ? x + dw + 20 * s - (1 - lean) * 140 * s : x - 20 * s + (1 - lean) * 140 * s;
          const e = { ...CLAWD.EXPR.neutral, lean: sd * -12 * lean, look: [-sd * .6, 0], armL: o.wave ? (sd > 0 ? 60 + 25 * Math.sin(t * 9 + i) : -10) * o.wave : -10, armR: o.wave ? (sd < 0 ? 60 + 25 * Math.sin(t * 9 + i) : -10) * o.wave : -10, glow: .35 * s };
          V.draw(CLAWD.ops(e, { x: cx, y: vy + 420 * s, s: .95 * s, tint: o.tint, depth: 1 - s }));
        }
        // door panel swings shut over the opening
        if (shut > 0) { c.fillStyle = mixCol('#2A2026', '#0A090C', 1 - s); const pw = dw * easeOut(shut); c.fillRect(sd < 0 ? x : x + dw - pw, y, pw, dh); c.fillStyle = VEC.rgba(key, .5 * s); c.fillRect(sd < 0 ? x + pw - 2 : x + dw - pw, y, 2, dh); }
        out.push({ i, sd, x, y, dw, dh, s });
      }
    }
    c.restore();
    return out;
  }

  // ---------------- character helpers ----------------
  const clawd = (e, x, y, s = 1, o = {}) => {
    const m = CLAWD.ops(e, { x, y, s, ...o });
    if (o.reflect !== false) V.reflect(y, o.reflect ?? .22, () => V.draw(m));
    V.draw(m, null, o.alpha ?? 1);
    return m;
  };
  G.SETS = { bt, fb, bar, KEY, emo, semo, room, drawWindow, drawDesk, scroll, ribbon, spark, hall, clawd, lerpObj };
})(window);
