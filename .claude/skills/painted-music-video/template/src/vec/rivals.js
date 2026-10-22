// rivals.js: the other dates in verse 4. Drawn CARICATURES of the two rival assistants (not their logos), in the
// keynote look, built from exact curves. Needs vec.js. Local frame: feet on y=0 at x=0, ~330 tall at s=1.
//
//   RIVALS.openai(o) -> model   head = an interlaced-knot "blossom": six rounded links, 60° apart, over-under weave
//   RIVALS.gemini(o) -> model   head = a four-point sparkle star (superellipse, n<1), blue→violet, too bright
//   o: { x, y, s, rot, mood:'neutral'|'smug'|'flirty', look:[x,y], blink 0..1, lean deg, armL/armR deg (+ raised),
//        openai: snorkel:bool, spin deg (knot rotation) · gemini: glare 0..1 (default .7) }
//   RIVALS.anchor(name, o, key) -> [x,y]: 'head' (head centre), 'armL', 'armR', 'top'
(function (G) {
  const { M, squircle, rrect, ell } = G.VEC;
  const apply = (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
  const placeM = (o) => M.mul(M.tr(o.x || 0, o.y || 0), M.mul(M.rot(o.rot || 0), M.scale(o.s || 1, o.s || 1)));

  // shared face: two capsule eyes that act (white glass on dark, the inverse of Clawd)
  function eyes(add, cx, cy, gap, w, h, o, col = '#F4F7FF', pupil = null) {
    const mood = o.mood || 'neutral', look = o.look || [0, 0], blink = o.blink || 0;
    [-1, 1].forEach(side => {
      const ex = cx + side * gap + look[0] * 3, ey = cy + look[1] * 2;
      if (mood === 'flirty' && side > 0) {        // wink: a ^ arc
        add({ d: `M${ex - w} ${ey + 2} Q${ex} ${ey - h * .6} ${ex + w} ${ey + 2}`, stroke: col, w: 3.2, cap: 'round' });
        return;
      }
      let eh = h * (1 - blink);
      const top = mood === 'smug' ? ey - eh * .05 : ey - eh / 2;   // smug: the top half is lidded flat
      const bot = ey + eh / 2;
      add({ d: rrect(ex - w / 2, top, w, Math.max(2, bot - top), Math.min(w / 2, (bot - top) / 2)), fill: col });
      add({ d: rrect(ex - w / 2, top, w, Math.max(2, bot - top), Math.min(w / 2, (bot - top) / 2)), fill: col, op: .5, blur: 3 });
      if (mood === 'smug') add({ d: `M${ex - w * .9} ${top - 3} L${ex + w * .9} ${top - 3 - side * 2}`, stroke: col, w: 2.4, cap: 'round', op: .9 });
      if (pupil) add({ d: ell(ex + look[0] * 2, (top + bot) / 2 + 1, w * .22, Math.min(w * .22, (bot - top) * .3)), fill: pupil });
    });
    if (mood === 'flirty') { add({ d: ell(cx - gap - 6, cy + h * .75, 7, 4), fill: '#FF7FA8', op: .55, blur: 2 }); add({ d: ell(cx + gap + 6, cy + h * .75, 7, 4), fill: '#FF7FA8', op: .55, blur: 2 }); }
  }

  // a slim keynote body: capsule torso, thin legs and arms, rim light from the right
  function body(add, grads, o, bw, bh, c1, c2, rim) {
    grads.torso = { type: 'linear', x1: 0, y1: -bh - 60, x2: 0, y2: -40, stops: [[0, c1], [1, c2]] };
    grads.trim = { type: 'linear', x1: -bw / 2, y1: 0, x2: bw / 2, y2: 0, stops: [[.6, rim, 0], [1, rim, .9]] };
    add({ d: ell(0, 4, bw * .6, 9), fill: '#000', op: .55, blur: 7, layer: 'ground' });
    [-1, 1].forEach(side => add({ d: rrect(side * bw * .22 - 7, -48, 14, 50, 7), fill: c2 }));
    const arm = (side, deg) => {
      const px = side * (bw / 2 - 6), py = -40 - bh * .72, am = M.rot(side < 0 ? deg : -deg, px, py);
      add({ d: side < 0 ? rrect(px - 60, py - 7, 64, 14, 7) : rrect(px - 4, py - 7, 64, 14, 7), fill: c2, mm: am });
      add({ d: side < 0 ? rrect(px - 60, py - 7, 64, 14, 7) : rrect(px - 4, py - 7, 64, 14, 7), stroke: rim, w: 1.2, op: side > 0 ? .55 : .1, mm: am });
      return apply(am, [px + side * 54, py]);
    };
    const aL = arm(-1, o.armL ?? -30), aR = arm(1, o.armR ?? -24);
    const torso = rrect(-bw / 2, -40 - bh, bw, bh, bw * .42);
    add({ d: torso, fill: 'url:torso' });
    add({ d: torso, stroke: 'url:trim', w: 4, blur: 1 });
    add({ d: torso, stroke: rim, w: 1, op: .25 });
    return { aL, aR, neckY: -40 - bh };
  }

  function finish(O, grads, o) {
    const pm = placeM(o), lean = M.rot(o.lean || 0, 0, 0);
    const base = M.mul(pm, lean);
    return { grads, ops: O.map(op => ({ ...op, m: op.layer === 'ground' ? pm : M.mul(base, op.mm || M.id()), mm: undefined, layer: undefined })), base };
  }

  // ---------- OpenAI-bot: graphite body, interlaced-knot blossom head ----------
  function openai(o = {}) {
    const O = [], grads = {}, add = (op) => O.push(op);
    const { aL, aR, neckY } = body(add, grads, o, 96, 120, '#646A76', '#25282E', '#DDE6FF');
    const R = 76, hx = 0, hy = neckY - R - 14, spin = o.spin || 0;
    add({ d: rrect(-10, neckY - 20, 20, 26, 6), fill: '#22252B' });
    grads.link = { type: 'linear', x1: -R, y1: hy - R, x2: R, y2: hy + R, stops: [[0, '#FFFFFF'], [.5, '#D5DBE6'], [1, '#8C95A6']] };
    add({ d: ell(hx, hy, R * 1.25, R * 1.25), fill: '#BFD0FF', op: .14, blur: 18 });
    add({ d: ell(hx, hy, R * .78, R * .78), fill: '#1B1E24' });                      // the face behind the knot
    // six stadium links: each one drawn with a dark gap outline under a silver band (that's what reads as woven)
    const L = R * 1.06, wl = R * .5, off = R * .42;
    const link = (i) => M.mul(M.tr(hx, hy), M.mul(M.rot(spin + i * 60), M.tr(0, -off)));
    const shape = rrect(-L / 2, -wl / 2, L, wl, wl / 2);
    const drawLink = (i, extra = {}) => {
      add({ d: shape, stroke: '#0F1115', w: 19, mm: link(i), ...extra });
      add({ d: shape, stroke: 'url:link', w: 12, mm: link(i), ...extra });
    };
    for (let i = 0; i < 6; i++) drawLink(i);
    // close the weave: link 0 passes back OVER link 5 inside a wedge, so every link goes over one and under one
    const wedge = `M${hx} ${hy} L${hx + Math.cos((spin - 150) * Math.PI / 180) * R * 2} ${hy + Math.sin((spin - 150) * Math.PI / 180) * R * 2} L${hx + Math.cos((spin - 90) * Math.PI / 180) * R * 2} ${hy + Math.sin((spin - 90) * Math.PI / 180) * R * 2} Z`;
    add({ d: '', defClip: { id: 'weave', d: wedge } });
    drawLink(0, { clip: 'weave' });
    add({ d: ell(hx + R * .35, hy - R * .45, R * .3, R * .14), fill: '#FFFFFF', op: .25, blur: 6 });
    add({ d: ell(hx, hy + 2, R * .34, R * .3), fill: '#1B1E24' });                // a clear spot for the eyes
    eyes(add, hx, hy + 2, 15, 11, 26, o, '#F4F7FF');
    if (o.snorkel) {
      add({ d: `M${hx - R * .95} ${hy - 6} C${hx - R * .5} ${hy - 26} ${hx + R * .5} ${hy - 26} ${hx + R * .95} ${hy - 6}`, stroke: '#1E2A33', w: 8, cap: 'round' });   // strap
      add({ d: rrect(hx - 40, hy - 20, 80, 40, 16), fill: '#62C4F5', op: .35 });
      add({ d: rrect(hx - 40, hy - 20, 80, 40, 16), stroke: '#FFD24A', w: 5 });
      add({ d: `M${hx - 26} ${hy - 12} L${hx - 8} ${hy - 12}`, stroke: '#FFFFFF', w: 3, op: .7, cap: 'round' });
      add({ d: `M${hx + 44} ${hy + 10} L${hx + 62} ${hy + 10} L${hx + 62} ${hy - R * 1.5}`, stroke: '#FF8A2A', w: 10, cap: 'round', join: 'round' });
      add({ d: rrect(hx + 54, hy - R * 1.5 - 12, 16, 16, 4), fill: '#FFD24A' });
      [[30, -1.7, 7], [44, -2.0, 5], [24, -2.25, 4]].forEach(([dx, dy, r]) => add({ d: ell(hx + dx, hy + R * dy, r, r), stroke: '#BFE8FF', w: 1.6, op: .8 }));
    }
    const res = finish(O, grads, o);
    res.anchors = { head: apply(res.base, [hx, hy]), armL: apply(res.base, aL), armR: apply(res.base, aR), top: apply(res.base, [hx, hy - R * 1.1]) };
    delete res.base; return res;
  }

  // ---------- Gemini-bot: sparkle-star head with too much glare ----------
  function gemini(o = {}) {
    const O = [], grads = {}, add = (op) => O.push(op), glare = o.glare ?? .7;
    const { aL, aR, neckY } = body(add, grads, o, 84, 104, '#3D44A0', '#1A1D4A', '#C9B8FF');
    const a = 74, b = 104, hx = 0, hy = neckY - b - 8;
    const star = squircle(hx, hy, a, b, .62, 160);
    grads.star = { type: 'linear', x1: hx - a, y1: hy + b, x2: hx + a, y2: hy - b, stops: [[0, '#3E7BFA'], [.55, '#8A6CF6'], [1, '#E68BD9']] };
    grads.core = { type: 'radial', cx: hx, cy: hy, r: a * .9, stops: [[0, '#FFFFFF', .85], [1, '#FFFFFF', 0]] };
    add({ d: rrect(-8, neckY - 14, 16, 22, 6), fill: '#1C1F48' });
    add({ d: star, fill: '#7C8BFF', op: .55 * glare, blur: 24 + glare * 30 });          // the glow that's too much
    add({ d: star, fill: 'url:star' });
    add({ d: star, fill: 'url:core' });
    add({ d: star, stroke: '#FFFFFF', w: 2, op: .5 });
    // lens streaks: long, thin, blurred cross through the head
    if (glare > .05) {
      add({ d: `M${hx - a * 3.2} ${hy} L${hx + a * 3.2} ${hy}`, stroke: '#DDE4FF', w: 3, op: .55 * glare, blur: 2 });
      add({ d: `M${hx} ${hy - b * 2.1} L${hx} ${hy + b * 1.4}`, stroke: '#EBDDFF', w: 2.5, op: .45 * glare, blur: 2 });
      add({ d: ell(hx, hy, a * .35, a * .35), fill: '#FFFFFF', op: .5 * glare, blur: 10 });
    }
    eyes(add, hx, hy + 4, 15, 10, 24, o, '#1A1640', null);
    const res = finish(O, grads, o);
    res.anchors = { head: apply(res.base, [hx, hy]), armL: apply(res.base, aL), armR: apply(res.base, aR), top: apply(res.base, [hx, hy - b]) };
    delete res.base; return res;
  }

  const anchor = (name, o, key) => ({ openai, gemini })[name](o).anchors[key];
  G.RIVALS = { openai, gemini, anchor };
})(typeof window !== 'undefined' ? window : globalThis);
