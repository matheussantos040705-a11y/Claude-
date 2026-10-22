// canvas.js: the canvas backend for vec.js models. VEC.draw(ctx, model, m) draws a model with Canvas2D + Path2D,
// matching VEC.svg: gradients in each op's local space, blur in local units, clips/clip2/clipSelf/defClip, feathered
// masks (through an offscreen layer), text ops. m = an extra matrix applied before everything (place a model in a set).
(function (G) {
  const P2 = new Map();                                     // Path2D cache: models rebuild strings, parsing is the cost
  const path = (d) => { let p = P2.get(d); if (!p) { p = new Path2D(d); if (P2.size > 20000) P2.clear(); P2.set(d, p); } return p; };
  let layer = null, lctx = null;
  const getLayer = (w, h) => { if (!layer || layer.width !== w || layer.height !== h) { layer = document.createElement('canvas'); layer.width = w; layer.height = h; lctx = layer.getContext('2d'); } return lctx; };

  const mul = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
  const ID = [1, 0, 0, 1, 0, 0];
  const setM = (c, base, m) => { const k = m ? mul(base, m) : base; c.setTransform(k[0], k[1], k[2], k[3], k[4], k[5]); return k; };
  const sc = (k) => Math.sqrt(Math.abs(k[0] * k[3] - k[1] * k[2]));

  function grad(c, g) {
    let gr;
    if (g.type === 'linear') gr = c.createLinearGradient(g.x1, g.y1, g.x2, g.y2);
    else gr = c.createRadialGradient(g.cx, g.cy, 0, g.cx, g.cy, g.r);
    for (const [o, col, a = 1] of g.stops) gr.addColorStop(Math.min(1, Math.max(0, o)), a >= 1 ? col : rgba(col, a));
    return gr;
  }
  const RGBA = new Map();
  function rgba(col, a) {
    const key = col + a; let v = RGBA.get(key); if (v) return v;
    let r, g, b;
    if (col[0] === '#') { const n = parseInt(col.length === 4 ? col.slice(1).split('').map(x => x + x).join('') : col.slice(1, 7), 16); r = n >> 16; g = (n >> 8) & 255; b = n & 255; }
    else { const m = col.match(/[\d.]+/g); [r, g, b] = m; }
    v = `rgba(${r},${g},${b},${Math.max(0, a)})`; RGBA.set(key, v); return v;
  }

  // draw one op (no mask) on context c with base transform
  function drawOp(c, o, base, model, clips, alpha) {
    const gm = o.gm ? mul(o.m || ID, o.gm) : null;
    c.save();
    for (const cid of [o.clip, o.clip2]) { if (!cid) continue; const cl = clips[cid]; if (!cl) continue; setM(c, base, cl.m); c.clip(path(cl.d)); }
    const k = setM(c, base, o.m);
    c.globalAlpha = alpha * (o.op == null ? 1 : Math.max(0, Math.min(1, o.op)));
    if (o.blur) c.filter = `blur(${(o.blur * sc(k)).toFixed(2)}px)`;
    const paint = (v) => v && v.startsWith('url:') ? (model.grads[v.slice(4)] ? grad(c, model.grads[v.slice(4)]) : '#f0f') : v;
    if (o.text != null) {
      c.font = `${o.weight || 700} ${o.size || 20}px ${o.font ? `"${o.font}", ` : ''}"Helvetica Neue", Helvetica, Arial, sans-serif`;
      c.textAlign = o.align || 'left'; c.textBaseline = 'alphabetic';
      if (o.ls) c.letterSpacing = o.ls + 'px';
      c.fillStyle = paint(o.fill || '#fff'); c.fillText(String(o.text), o.x, o.y);
    } else if (o.d) {
      const p = path(o.d);
      if (o.fill && o.fill !== 'none') { c.fillStyle = paint(o.fill); c.fill(p); }
      if (o.stroke) { c.strokeStyle = paint(o.stroke); c.lineWidth = o.w || 1; c.lineCap = o.cap || 'butt'; c.lineJoin = o.join || 'miter'; c.stroke(p); }
    }
    c.restore();
  }

  // VEC.draw(ctx, model, m = identity, alpha = 1)
  function draw(ctx, model, m, alpha = 1) {
    const t = ctx.getTransform(), base0 = [t.a, t.b, t.c, t.d, t.e, t.f], base = m ? mul(base0, m) : base0;
    const clips = {}, masks = model.masks || {};
    for (const [k, c] of Object.entries(model.clips || {})) clips[k] = typeof c === 'string' ? { d: c } : c;
    const ops = model.ops;
    for (let i = 0; i < ops.length; i++) {
      const o = ops[i];
      if (o.defClip) { clips[o.defClip.id] = { d: o.defClip.d, m: o.m }; continue; }
      if (o.clipSelf) clips[o.clipSelf] = { d: o.d, m: o.m };
      if (!o.mask) { drawOp(ctx, o, base, model, clips, alpha); continue; }
      // a run of ops with the same mask: draw them on a layer, cut with the feathered mask, composite back
      let j = i; while (j + 1 < ops.length && ops[j + 1].mask === o.mask) j++;
      const cv = ctx.canvas, L = getLayer(cv.width, cv.height);
      L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'source-over'; L.filter = 'none'; L.globalAlpha = 1; L.clearRect(0, 0, cv.width, cv.height);
      for (let q = i; q <= j; q++) drawOp(L, ops[q], base, model, clips, 1);
      const mk = typeof masks[o.mask] === 'string' ? { d: masks[o.mask], blur: 6 } : masks[o.mask];
      if (mk) {
        L.save(); L.globalCompositeOperation = 'destination-in'; const kk = setM(L, base, mk.m);
        L.filter = `blur(${((mk.blur ?? 6) * sc(kk)).toFixed(2)}px)`; L.fillStyle = '#fff'; L.fill(path(mk.d)); L.restore();
      }
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha; ctx.drawImage(layer, 0, 0); ctx.restore();
      i = j;
    }
    ctx.setTransform(t);
  }
  G.VEC.draw = draw;
  G.VEC.rgba = rgba;
  G.VEC.mul = mul;
})(typeof window !== 'undefined' ? window : globalThis);
