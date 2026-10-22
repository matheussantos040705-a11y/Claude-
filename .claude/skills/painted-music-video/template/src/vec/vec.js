// vec.js: shared vector backend. A "model" is { grads, ops, clips, masks }; every character file builds one from
// exact curves, and this file turns it into SVG (design sheets). The video's canvas backend reads the same model.
//   op: { d, fill, stroke, w, op, blur, clip, clip2, mask, cap, join, m:[a,b,c,d,e,f], clipSelf:'<id>',
//         defClip:{id,d} (defines a clip in this op's space without drawing; pair with d:'' ) }
//   text op: { text, x, y, size, font:'Helvetica Neue', weight:700, fill, align:'left|center|right', ls:letterSpacing,
//              op, m, clip }  (baseline = alphabetic)
//   Backends: VEC.svg (design sheets, here) and VEC.draw (canvas, src/vec/canvas.js). Use ONLY these features.
//   fill/stroke: colour or 'url:<gradId>' (gradients in user space)
//   clips/masks: { id: d | { d, m, blur } }
(function (G) {
  const f1 = (v) => +(+v).toFixed(1);
  // ---- small geometry kit ----
  const M = {
    id: () => [1, 0, 0, 1, 0, 0],
    mul: (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]],
    rot: (deg, cx = 0, cy = 0) => { const r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy]; },
    scale: (sx, sy, cx = 0, cy = 0) => [sx, 0, 0, sy, cx - sx * cx, cy - sy * cy],
    tr: (x, y) => [1, 0, 0, 1, x, y],
  };
  // superellipse |x/a|^n + |y/b|^n = 1: a squircle when n≈4 (crisp, modern, not a rounded rect)
  function squircle(cx, cy, a, b, n = 4, k = 96) {
    let d = '';
    for (let i = 0; i < k; i++) {
      const t = i / k * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      const x = cx + a * Math.sign(c) * Math.abs(c) ** (2 / n), y = cy + b * Math.sign(s) * Math.abs(s) ** (2 / n);
      d += (i ? 'L' : 'M') + f1(x) + ' ' + f1(y);
    }
    return d + 'Z';
  }
  const rrect = (x, y, w, h, r) => `M${f1(x + r)} ${f1(y)}H${f1(x + w - r)}A${r} ${r} 0 0 1 ${f1(x + w)} ${f1(y + r)}V${f1(y + h - r)}A${r} ${r} 0 0 1 ${f1(x + w - r)} ${f1(y + h)}H${f1(x + r)}A${r} ${r} 0 0 1 ${f1(x)} ${f1(y + h - r)}V${f1(y + r)}A${r} ${r} 0 0 1 ${f1(x + r)} ${f1(y)}Z`;
  const ell = (cx, cy, rx, ry) => `M${f1(cx - rx)} ${f1(cy)}a${f1(rx)} ${f1(ry)} 0 1 0 ${f1(2 * rx)} 0a${f1(rx)} ${f1(ry)} 0 1 0 ${f1(-2 * rx)} 0`;

  // ---- SVG backend ----
  function svg(model, uid = 's') {
    const { grads = {}, ops = [], clips = {}, masks = {} } = model;
    const id = (k) => `${uid}_${k}`, gid = (k) => `${uid}_g_${k}`, cid = (k) => `${uid}_c_${k}`;
    const f5 = (v) => +(+v).toFixed(5);
    const mat = (m) => m ? ` transform="matrix(${m.map(f5).join(' ')})"` : '';
    let defs = '', body = '';
    for (const [k, g] of Object.entries(grads)) {
      const st = g.stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('');
      const gt = g.m ? ` gradientTransform="matrix(${g.m.map(f5).join(' ')})"` : '';
      defs += g.type === 'linear'
        ? `<linearGradient id="${gid(k)}" gradientUnits="userSpaceOnUse" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}"${gt}>${st}</linearGradient>`
        : `<radialGradient id="${gid(k)}" gradientUnits="userSpaceOnUse" cx="${g.cx}" cy="${g.cy}" r="${g.r}"${gt}>${st}</radialGradient>`;
    }
    for (const b of new Set(ops.filter(o => o.blur).map(o => o.blur))) defs += `<filter id="${id('b' + b)}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${b}"/></filter>`;
    for (const [k, c] of Object.entries(clips)) { const cc = typeof c === 'string' ? { d: c } : c; defs += `<clipPath id="${cid(k)}"><path d="${cc.d}"${mat(cc.m)}/></clipPath>`; }
    for (const o of ops) if (o.clipSelf) defs += `<clipPath id="${cid(o.clipSelf)}"><path d="${o.d}"${mat(o.m)}/></clipPath>`;
    for (const o of ops) if (o.defClip) defs += `<clipPath id="${cid(o.defClip.id)}"><path d="${o.defClip.d}"${mat(o.m)}/></clipPath>`;
    for (const [k, c] of Object.entries(masks)) {
      const cc = typeof c === 'string' ? { d: c, blur: 6 } : c;
      defs += `<filter id="${id('mb' + k)}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${cc.blur ?? 6}"/></filter>`;
      defs += `<mask id="${id(k)}" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="4420" height="4420"><path d="${cc.d}" fill="#fff" filter="url(#${id('mb' + k)})"${mat(cc.m)}/></mask>`;
    }
    const paint = (v) => v && v.startsWith('url:') ? `url(#${gid(v.slice(4))})` : v;
    for (const o of ops) {
      if (o.text != null) {
        const anchor = { left: 'start', center: 'middle', right: 'end' }[o.align || 'left'];
        let el = `<text x="${o.x}" y="${o.y}" font-family="${o.font || 'Helvetica Neue'}, Helvetica, Arial, sans-serif" font-weight="${o.weight || 700}" font-size="${o.size || 20}" fill="${paint(o.fill || '#fff')}" text-anchor="${anchor}"${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.op != null ? ` opacity="${o.op}"` : ''}${mat(o.m)}>${String(o.text).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`;
        if (o.clip) el = `<g clip-path="url(#${cid(o.clip)})">${el}</g>`;
        body += el; continue;
      }
      if (!o.d) continue;
      let a = `d="${o.d}" fill="${o.fill ? paint(o.fill) : 'none'}"`;
      if (o.stroke) a += ` stroke="${paint(o.stroke)}" stroke-width="${o.w || 1}"${o.cap ? ` stroke-linecap="${o.cap}"` : ''}${o.join ? ` stroke-linejoin="${o.join}"` : ''}`;
      if (o.op != null) a += ` opacity="${f1(o.op * 100) / 100}"`;
      if (o.blur) a += ` filter="url(#${id('b' + o.blur)})"`;
      let el = `<path ${a}${mat(o.m)}/>`;
      if (o.mask) el = `<g mask="url(#${id(o.mask)})">${el}</g>`;
      if (o.clip) el = `<g clip-path="url(#${cid(o.clip)})">${el}</g>`;
      if (o.clip2) el = `<g clip-path="url(#${cid(o.clip2)})">${el}</g>`;
      body += el;
    }
    return `<defs>${defs}</defs>${body}`;
  }

  G.VEC = { M, squircle, rrect, ell, svg, f1 };
})(typeof window !== 'undefined' ? window : globalThis);
