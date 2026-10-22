// props.js: the story's props, keynote-lit (key/rim light from the right), exact curves, all parameterised.
// Needs vec.js. Every PROPS.<name>(o) returns a model; o always takes { x, y, s, rot } for placement. Unless noted,
// the local origin is the prop's BOTTOM CENTRE (it stands on y=0), sizes are in px at s=1.
//
//   scroll   { len 0..1 (how far it's unrolled), glow 0..1 }         origin = centre of the left roll; unrolls rightward
//   crane    { flap 0..1 (wing beat) , glow }                           origin = body centre (~150 wide)
//   desk     { w = 320 }
//   door     { open 0..1, light = '#FFC56B' }                           160x300
//   window   { open 0..1 (shutters swing), w = 220, h = 280, light }    origin = CENTRE of the glass
//   books    { n = 6 }                                                   a stack
//   go       { stones:[[col,row,'b'|'w'],...], wild:[col,row] glowing off-pattern stone, wildGlow 0..1 }  9x9, 300 wide, origin centre
//   tungsten { tilt -1..1 (- = cube side down, default -.6), cube = true }   balance scale with a tungsten cube (left pan)
//   offSwitch{ on 0..1 (lever position), glow }                        a big red lever switch on a plate, ~150 tall
//   suitcase { open 0..1, dumbbell 0..1 (how far it sticks out), glow } ~230 wide
//   envelope { photo 0..1 (slides out), bw: bool (noir) }              origin centre, ~220 wide
//   gauge    { fill 0..1, blink 0..1, label:'3%'|null }                 context meter, origin centre, 300x70
//   coin     { spin 0..1 }       cup {}       polaroid { img:'sun'|'pair'|'blank', bw }  (origin centre for these three)
//   ship     { planks:[0..1 x PROPS.SHIP_PLANKS] (0 old wood, 1 new glowing), sail 0..1 }   origin waterline centre, ~420 wide
//   vault    { open 0..1, inside:'#9CC7FF' }                            round door in a square frame, origin centre, 340
//   urn      { balls:[[x,y,'w'|'b'],...] in urn-local px (0,0 = mouth centre), glowBlack 0..1 }   ~240 tall
//   earth    { mode:'big'|'dot', r = 140, beam 0..1 (sunbeam for the dot), spin 0..1 }   origin centre
//   boulder  { glow 0..1 }                                              ~190 wide
//   tree     PROPS.tree(seed = 7, depth = 6) -> { branches:[{id,parent,depth,p:[4 pts cubic],x1,y1,tip}], pathTo(id) }
//            (deterministic; root at 0,0 growing up; ~520 tall)
//   lanternTree { seed, depth, lit: 0..1 for all | {id: 0..1} (fraction of each branch lit from its base),
//                 wild: tip id drawn as the special Move-37 branch (blue-white), cake: 0..1 halo'd slice at the wild tip,
//                 dull: tip id that ends in a tungsten cube, fire: 0..1 (every branch burning, for the swarm) }
//            returns the model plus .tree
(function (G) {
  const { M, squircle, rrect, ell } = G.VEC;
  const f1 = (v) => +(+v).toFixed(1);
  const hash = (i, k = 0) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
  const placeM = (o) => M.mul(M.tr(o.x || 0, o.y || 0), M.mul(M.rot(o.rot || 0), M.scale(o.s || 1, o.s || 1)));
  function mk(o) {
    const base = placeM(o), O = [], grads = {};
    return { grads, ops: O, add: (op, mm) => O.push({ ...op, m: mm ? M.mul(base, mm) : base }), done: (extra = {}) => ({ grads, ops: O, ...extra }) };
  }
  const poly = (pts) => 'M' + pts.map(p => p.map(f1).join(' ')).join('L') + 'Z';
  const lin = (x1, y1, x2, y2, stops) => ({ type: 'linear', x1, y1, x2, y2, stops });
  const rad = (cx, cy, r, stops) => ({ type: 'radial', cx, cy, r, stops });
  // smooth closed curve through points (Catmull-Rom as cubic beziers)
  function smooth(P) {
    const n = P.length; let d = `M${f1(P[0][0])} ${f1(P[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
      d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
    }
    return d + 'Z';
  }
  const shadow = (m, w, op = .55) => m.add({ d: ell(0, 3, w, 8), fill: '#000', op, blur: 7 });

  // ---------- scroll ----------
  function scroll(o = {}) {
    const m = mk(o), L = 40 + (o.len ?? 1) * 420, g = o.glow ?? .7;
    m.grads.paper = lin(0, -40, 0, 40, [[0, '#F6ECD9'], [1, '#D9C7A6']]);
    m.grads.roll = lin(0, -46, 0, 46, [[0, '#E9DBC0'], [.5, '#FFF7E8'], [1, '#B9A27E']]);
    m.add({ d: rrect(0, -38, L, 76, 4), fill: 'url:paper' });
    for (let i = 0; i < 6; i++) {
      const y = -26 + i * 10.5, x1 = 24, x2 = Math.max(x1 + 4, L - 26 - (i % 3) * 30);
      m.add({ d: `M${x1} ${y} L${f1(x2)} ${y}`, stroke: '#FFB15C', w: 2.4, op: .85, cap: 'round' });
      m.add({ d: `M${x1} ${y} L${f1(x2)} ${y}`, stroke: '#FF9A3C', w: 6, op: .35 * g, blur: 4, cap: 'round' });
    }
    m.add({ d: rrect(-16, -46, 32, 92, 14), fill: 'url:roll' });
    m.add({ d: rrect(L - 14, -46, 28, 92, 12), fill: 'url:roll' });
    m.add({ d: rrect(-16, -46, 32, 92, 14), stroke: '#FFE1C2', w: 1.4, op: .6 });
    return m.done();
  }

  // ---------- paper crane ----------
  function crane(o = {}) {
    const m = mk(o), fl = o.flap ?? .3, g = o.glow ?? .4, wy = -120 + fl * 150;    // wing tip height
    m.add({ d: ell(0, -20, 110, 60), fill: '#FFD9A8', op: .25 * g, blur: 22 });
    m.add({ d: poly([[-8, -4], [26, f1(wy * .9)], [40, -2]]), fill: '#D9CFBD' });                  // far wing
    m.add({ d: poly([[-40, -8], [0, 14], [40, -8], [0, -22]]), fill: '#F2EADB' });                  // body diamond
    m.add({ d: poly([[-40, -8], [0, 14], [0, -22]]), fill: '#DDD2BF' });
    m.add({ d: poly([[30, -6], [92, -92], [84, -94], [18, -12]]), fill: '#EFE6D6' });                // neck
    m.add({ d: poly([[84, -94], [104, -86], [92, -92]]), fill: '#CDBFA8' });                        // head fold
    m.add({ d: poly([[-30, -6], [-96, -78], [-88, -82], [-18, -12]]), fill: '#E4D9C6' });            // tail
    m.add({ d: poly([[-30, -10], [-14, f1(wy)], [44, -6]]), fill: '#FBF6EE' });                       // near wing
    m.add({ d: poly([[-30, -10], [-14, f1(wy)], [2, -8]]), fill: '#E8DECD' });
    m.add({ d: `M-30 -10 L-14 ${f1(wy)} L44 -6`, stroke: '#FFFFFF', w: 1.4, op: .7, join: 'round' });
    m.add({ d: 'M-40 -8 L40 -8', stroke: '#C9BCA6', w: 1, op: .7 });
    return m.done();
  }

  // ---------- desk ----------
  function desk(o = {}) {
    const m = mk(o), w = o.w ?? 320;
    m.grads.top = lin(0, -132, 0, -110, [[0, '#6B4A35'], [1, '#3E2A1F']]);
    m.grads.leg = lin(0, -110, 0, 0, [[0, '#3B281D'], [1, '#1E1510']]);
    shadow(m, w * .55);
    [-1, 1].forEach(s => m.add({ d: rrect(s * (w / 2 - 30) - 9, -112, 18, 112, 4), fill: 'url:leg' }));
    m.add({ d: rrect(-w / 2 + 40, -110, w - 80, 46, 4), fill: '#2E2018' });               // drawer apron
    m.add({ d: rrect(-24, -92, 48, 8, 4), fill: '#C9A26B', op: .8 });
    m.add({ d: rrect(-w / 2, -134, w, 24, 6), fill: 'url:top' });
    m.add({ d: `M${-w / 2 + 6} -133 L${w / 2 - 6} -133`, stroke: '#D9A47C', w: 2, op: .55 });
    m.add({ d: rrect(-w / 2, -134, w, 24, 6), stroke: '#FFC9AE', w: 1.2, op: .3 });
    return m.done();
  }

  // ---------- door ----------
  function door(o = {}) {
    const m = mk(o), op = o.open ?? 0, light = o.light || '#FFC56B', W = 160, H = 300;
    m.grads.panel = lin(-W / 2, 0, W / 2, 0, [[0, '#2A2730'], [1, '#4A4552']]);
    m.add({ d: rrect(-W / 2 - 14, -H - 14, W + 28, H + 14, 6), fill: '#17151B' });       // frame
    m.add({ d: rrect(-W / 2, -H, W, H, 3), fill: light, op: .9 * op + .05 });            // the light behind
    m.add({ d: rrect(-W / 2, -H, W, H, 3), fill: light, op: .5 * op, blur: 24 });
    const pw = W * (1 - op * .82);                                                         // the panel swings toward us (flat foreshortening)
    m.add({ d: rrect(-W / 2, -H, pw, H, 3), fill: 'url:panel' });
    m.add({ d: rrect(-W / 2 + pw * .12, -H + 24, pw * .76, H * .36, 3), stroke: '#5E5868', w: 2, op: .8 });
    m.add({ d: rrect(-W / 2 + pw * .12, -H * .5, pw * .76, H * .42, 3), stroke: '#5E5868', w: 2, op: .8 });
    m.add({ d: ell(-W / 2 + pw * .86, -H * .48, 6, 6), fill: '#D9B46A' });
    if (op > 0) m.add({ d: poly([[-W / 2, 0], [W / 2, 0], [W / 2 + 160 * op, 60], [-W / 2 - 40 * op, 60]]), fill: light, op: .25 * op, blur: 10 });
    return m.done();
  }

  // ---------- window ----------
  function windowProp(o = {}) {
    const m = mk(o), op = o.open ?? 0, w = o.w ?? 220, h = o.h ?? 280, light = o.light || '#FF9F72';
    m.grads.glass = lin(-w / 2, -h / 2, w / 2, h / 2, [[0, '#FFE7D6'], [.5, light], [1, '#D9573A']]);
    m.add({ d: rrect(-w / 2 - 18, -h / 2 - 18, w + 36, h + 36, 14), fill: '#141217' });
    m.add({ d: rrect(-w / 2, -h / 2, w, h, 10), fill: light, op: .55, blur: 26 });
    m.add({ d: rrect(-w / 2, -h / 2, w, h, 10), fill: 'url:glass' });
    m.add({ d: `M0 ${-h / 2} L0 ${h / 2} M${-w / 2} ${-h * .1} L${w / 2} ${-h * .1}`, stroke: '#141217', w: 8 });
    m.add({ d: rrect(-w / 2, -h / 2, w, h, 10), stroke: '#FFFFFF', w: 1.5, op: .5 });
    m.add({ d: poly([[-w * .38, -h * .44], [-w * .22, -h * .44], [-w * .4, -h * .16], [-w * .46, -h * .16]]), fill: '#FFFFFF', op: .35 });   // glass glint
    if (op > 0) [-1, 1].forEach(s => {        // shutters swing out: flat panels that narrow
      const sw = (w / 2) * (1 - op * .85);
      const xs = s < 0 ? -w / 2 - 18 - sw : w / 2 + 18;
      m.add({ d: rrect(xs, -h / 2 - 10, sw, h + 20, 6), fill: '#2C2830' });
      m.add({ d: rrect(xs + 8, -h / 2 + 10, Math.max(2, sw - 16), h - 20, 4), stroke: '#4A4552', w: 2 });
    });
    return m.done();
  }

  // ---------- books ----------
  function books(o = {}) {
    const m = mk(o), n = o.n ?? 6, cols = ['#2F4B7A', '#7A2F3B', '#2F6B5A', '#8A6A2F', '#4A3A6A', '#6A3A2A', '#2A5A7A', '#7A5A3A'];
    shadow(m, 120);
    let y = 0;
    for (let i = 0; i < n; i++) {
      const th = 22 + hash(i, 1) * 16, w = 190 + hash(i, 2) * 50, dx = (hash(i, 3) - .5) * 30, c = cols[i % cols.length];
      m.grads['b' + i] = lin(0, y - th, 0, y, [[0, c], [1, '#141016']]);
      m.add({ d: rrect(dx - w / 2, y - th, w, th, 3), fill: 'url:b' + i });
      m.add({ d: rrect(dx - w / 2 + w * .12, y - th + 4, 6, th - 8, 2), fill: '#E8C98A', op: .7 });
      m.add({ d: rrect(dx + w / 2 - w * .2, y - th + 4, 6, th - 8, 2), fill: '#E8C98A', op: .5 });
      m.add({ d: `M${f1(dx - w / 2 + 4)} ${f1(y - th + 1.5)} L${f1(dx + w / 2 - 4)} ${f1(y - th + 1.5)}`, stroke: '#FFFFFF', w: 1.2, op: .25 });
      y -= th;
    }
    return m.done();
  }

  // ---------- Go board ----------
  function go(o = {}) {
    const m = mk(o), S = 300, n = 9, st = S / (n + 1);
    m.grads.board = lin(-S / 2, -S / 2, S / 2, S / 2, [[0, '#E2B66E'], [1, '#B07F3C']]);
    m.add({ d: rrect(-S / 2, -S / 2, S, S, 8), fill: 'url:board' });
    let g = ''; for (let i = 1; i <= n; i++) { const p = -S / 2 + i * st; g += `M${f1(-S / 2 + st)} ${f1(p)}L${f1(S / 2 - st)} ${f1(p)}M${f1(p)} ${f1(-S / 2 + st)}L${f1(p)} ${f1(S / 2 - st)}`; }
    m.add({ d: g, stroke: '#4A3216', w: 1.4, op: .85 });
    const stone = (c, r, col, glow = 0) => {
      const x = -S / 2 + (c + 1) * st, y = -S / 2 + (r + 1) * st, rr = st * .46;
      if (glow) { m.add({ d: ell(x, y, rr * 2.2, rr * 2.2), fill: '#9FD4FF', op: .6 * glow, blur: 14 }); m.add({ d: ell(x, y, rr * 1.5, rr * 1.5), stroke: '#CFEAFF', w: 2, op: glow }); }
      m.add({ d: ell(x + 2, y + 3, rr, rr), fill: '#000', op: .35, blur: 2 });
      m.add({ d: ell(x, y, rr, rr), fill: col === 'b' ? '#16141A' : '#F4F0E8' });
      m.add({ d: ell(x + rr * .3, y - rr * .35, rr * .35, rr * .22), fill: '#FFFFFF', op: col === 'b' ? .3 : .8 });
    };
    for (const [c, r, col] of o.stones || [[2, 2, 'b'], [6, 2, 'w'], [2, 6, 'w'], [6, 6, 'b'], [3, 3, 'b'], [5, 4, 'w'], [4, 5, 'b']]) stone(c, r, col);
    if (o.wild) stone(o.wild[0], o.wild[1], 'b', o.wildGlow ?? 1);
    return m.done();
  }

  // ---------- tungsten cube on a balance ----------
  function tungsten(o = {}) {
    const m = mk(o), t = (o.tilt ?? -.6) * 12;                 // default: the dense cube's side sinks
    m.grads.metal = lin(-40, -80, 40, 0, [[0, '#B7BCC6'], [.5, '#7D838F'], [1, '#4A4F59']]);
    m.grads.brass = lin(0, -200, 0, 0, [[0, '#E9C27A'], [1, '#8F6A2E']]);
    shadow(m, 110);
    m.add({ d: rrect(-60, -14, 120, 14, 5), fill: 'url:brass' });
    m.add({ d: rrect(-6, -190, 12, 178, 4), fill: 'url:brass' });
    const bm = M.rot(t, 0, -190);
    m.add({ d: rrect(-150, -196, 300, 12, 6), fill: 'url:brass' }, bm);
    m.add({ d: ell(0, -190, 10, 10), fill: '#F3D48C' });
    [-1, 1].forEach(side => {          // pans hang level
      const r = t * Math.PI / 180, px = side * 140 * Math.cos(r), py = -190 + side * 140 * Math.sin(r);
      m.add({ d: `M${f1(px)} ${f1(py)} L${f1(px - 50)} ${f1(py + 70)} M${f1(px)} ${f1(py)} L${f1(px + 50)} ${f1(py + 70)}`, stroke: '#C9A25A', w: 1.6, op: .9 });
      m.add({ d: `M${f1(px - 62)} ${f1(py + 70)} Q${f1(px)} ${f1(py + 100)} ${f1(px + 62)} ${f1(py + 70)} Z`, fill: 'url:brass' });
      if (side < 0 && o.cube !== false) {   // the tungsten cube: dense, dark, catching one hard highlight
        const cx = px, cy = py + 72, c = 84;
        m.add({ d: rrect(cx - c / 2, cy - c, c, c, 4), fill: 'url:metal' });
        m.add({ d: poly([[cx - c / 2, cy - c], [cx - c / 2 + 14, cy - c - 12], [cx + c / 2 + 14, cy - c - 12], [cx + c / 2, cy - c]]), fill: '#D7DBE2' });
        m.add({ d: poly([[cx + c / 2, cy - c], [cx + c / 2 + 14, cy - c - 12], [cx + c / 2 + 14, cy - 12], [cx + c / 2, cy]]), fill: '#3C4049' });
        m.add({ d: `M${f1(cx - c / 2 + 8)} ${f1(cy - c + 10)} L${f1(cx - c / 2 + 8)} ${f1(cy - 10)}`, stroke: '#FFFFFF', w: 2, op: .5 });
      }
      if (side > 0) [[-20, 10], [10, 14], [-4, 18]].forEach(([dx, r], i) => m.add({ d: rrect(px + dx - r / 2, py + 72 - r * 1.6, r, r * 1.6, 3), fill: '#D4A64F' }));
    });
    return m.done();
  }

  // ---------- big red off-switch ----------
  function offSwitch(o = {}) {
    const m = mk(o), on = o.on ?? 1, g = o.glow ?? .7, ang = -35 + on * 70;
    m.grads.plate = lin(0, -160, 0, 0, [[0, '#3A3740'], [1, '#18161C']]);
    m.grads.red = lin(-20, -150, 20, -80, [[0, '#FF6A5C'], [1, '#B3161B']]);
    shadow(m, 80);
    m.add({ d: rrect(-70, -160, 140, 160, 14), fill: 'url:plate' });
    m.add({ d: rrect(-70, -160, 140, 160, 14), stroke: '#FFC9AE', w: 1.2, op: .3 });
    for (let i = 0; i < 6; i++) m.add({ d: poly([[-70 + i * 26, -22], [-56 + i * 26, -22], [-70 + i * 26 + 26, -6], [-70 + i * 26 + 12, -6]]), fill: '#E8C23A', op: .85 });   // hazard stripe
    m.add({ d: rrect(-30, -100, 60, 30, 10), fill: '#0E0D10' });
    const lm = M.rot(ang, 0, -85);
    m.add({ d: rrect(-8, -170, 16, 90, 8), fill: '#9EA3AD' }, lm);
    m.add({ d: ell(0, -175, 26, 26), fill: '#FF3B30', op: .5 * g, blur: 14 }, lm);
    m.add({ d: ell(0, -175, 24, 24), fill: 'url:red' }, lm);
    m.add({ d: ell(7, -183, 8, 5), fill: '#FFFFFF', op: .6 }, lm);
    return m.done();
  }

  // ---------- suitcase with a glowing dumbbell ("weights") ----------
  function suitcase(o = {}) {
    const m = mk(o), op = o.open ?? .6, db = o.dumbbell ?? .6, g = o.glow ?? .9;
    m.grads.leather = lin(0, -150, 0, 0, [[0, '#8A5A36'], [1, '#4A2E1C']]);
    shadow(m, 130);
    // lid swings up behind (drawn as a rect rotated about the back hinge)
    const lh = 130 * op;
    if (lh > 2) { m.add({ d: rrect(-112, -78 - lh, 224, lh + 8, 10), fill: '#5A3A24' }); m.add({ d: rrect(-102, -70 - lh, 204, Math.max(2, lh - 6), 8), fill: '#3A2A3E' }); }
    m.add({ d: rrect(-115, -80, 230, 80, 10), fill: 'url:leather' });
    // the dumbbell: a glowing bar with two plates, half out of the case
    const dy = -80 - db * 60;
    m.add({ d: rrect(-100, dy - 40, 200, 80, 30), fill: '#5EE1FF', op: .45 * g, blur: 22 });
    m.add({ d: rrect(-70, dy - 6, 140, 12, 6), fill: '#BFEFFF' });
    [-1, 1].forEach(s => { m.add({ d: rrect(s * 70 - 14, dy - 34, 28, 68, 8), fill: '#7FE6FF' }); m.add({ d: rrect(s * 70 - 14, dy - 34, 8, 68, 4), fill: '#FFFFFF', op: .6 }); });
    m.add({ d: rrect(-115, -60, 230, 60, 10), fill: 'url:leather' });                    // front lip over the dumbbell
    m.add({ d: rrect(-30, -40, 60, 16, 8), stroke: '#C9A26B', w: 4, op: .9 });
    [-80, 80].forEach(x => m.add({ d: rrect(x - 8, -66, 16, 12, 3), fill: '#D9B46A' }));
    m.add({ d: `M-110 -58 L110 -58`, stroke: '#FFC9AE', w: 1.2, op: .35 });
    return m.done();
  }

  // ---------- envelope with a photo ----------
  function envelope(o = {}) {
    const m = mk(o), ph = o.photo ?? 0, bw = !!o.bw;
    const paper = bw ? '#D9D9D9' : '#EDE2CC', shade = bw ? '#9A9A9A' : '#C9B896';
    // the photo slides up out of the envelope
    const py = -40 - ph * 120;
    m.add({ d: rrect(-80, py - 60, 160, 110, 3), fill: bw ? '#F2F2F2' : '#F7F2E8' });
    m.add({ d: rrect(-72, py - 52, 144, 80, 2), fill: bw ? '#444' : '#3A3550' });
    m.add({ d: ell(-26, py - 18, 14, 14), fill: bw ? '#BBB' : '#E8B596' });                // two silhouettes, close together
    m.add({ d: rrect(-42, py - 4, 32, 32, 12), fill: bw ? '#999' : '#7A5A8A' });
    m.add({ d: ell(22, py - 20, 13, 13), fill: bw ? '#CCC' : '#F0C2A4' });
    m.add({ d: rrect(8, py - 6, 30, 34, 12), fill: bw ? '#AAA' : '#B0506A' });
    m.add({ d: rrect(-110, -70, 220, 140, 6), fill: paper });
    m.add({ d: poly([[-110, -70], [0, 10], [110, -70]]), fill: shade, op: .7 });
    m.add({ d: poly([[-110, 70], [-10, 0], [10, 0], [110, 70]]), fill: shade, op: .35 });
    m.add({ d: ell(0, 6, 16, 16), fill: bw ? '#555' : '#B2232B' });                       // wax seal: a heart
    m.add({ d: 'M0 14 C-14 4 -10 -6 0 0 C10 -6 14 4 0 14 Z', fill: bw ? '#888' : '#E0525A' });
    return m.done();
  }

  // ---------- context gauge ----------
  function gauge(o = {}) {
    const m = mk(o), fill = Math.max(0, Math.min(1, o.fill ?? .03)), bl = o.blink ?? 0;
    const col = fill > .5 ? '#5BE38A' : fill > .2 ? '#FFC56B' : '#FF3B30';
    m.add({ d: rrect(-150, -35, 300, 70, 16), fill: '#121116' });
    m.add({ d: rrect(-150, -35, 300, 70, 16), stroke: '#FFFFFF', w: 3, op: .75 });
    m.add({ d: rrect(150, -14, 12, 28, 4), fill: '#FFFFFF', op: .75 });
    const fw = Math.max(10, 284 * fill);
    m.add({ d: rrect(-142, -27, fw, 54, 10), fill: col, op: 1 - bl * .75 });
    m.add({ d: rrect(-142, -27, fw, 54, 10), fill: col, op: (1 - bl) * .6, blur: 10 });
    for (let i = 1; i < 10; i++) m.add({ d: `M${-150 + i * 30} -35 L${-150 + i * 30} -27`, stroke: '#FFFFFF', w: 1.4, op: .3 });
    if (o.label) m.add({ text: o.label, x: 0, y: 72, size: 34, weight: 700, fill: col, align: 'center', op: 1 - bl * .5 });
    return m.done();
  }

  // ---------- coin / cup / polaroid ----------
  function coin(o = {}) {
    const m = mk(o), sp = Math.cos((o.spin ?? 0) * Math.PI * 2), rx = 34 * Math.max(.08, Math.abs(sp));
    m.grads.gold = lin(-34, -34, 34, 34, [[0, '#FFE39A'], [.5, '#E0A93F'], [1, '#9A6A1E']]);
    m.add({ d: ell(0, 0, rx, 34), fill: 'url:gold' });
    m.add({ d: ell(0, 0, rx * .78, 26), stroke: '#FFF0C2', w: 2, op: .7 });
    if (Math.abs(sp) > .3) m.add({ d: poly([[0, -12], [10 * sp, -6], [10 * sp, 6], [0, 12], [-10 * sp, 6], [-10 * sp, -6]]), stroke: '#9A6A1E', w: 2.4 });
    return m.done();
  }
  function cup(o = {}) {
    const m = mk(o);
    m.grads.red = lin(-36, 0, 36, 0, [[0, '#8E1520'], [.6, '#D8303A'], [1, '#FF6B6B']]);
    m.add({ d: poly([[-36, -100], [36, -100], [26, 0], [-26, 0]]), fill: 'url:red' });
    m.add({ d: poly([[-36, -100], [36, -100], [35, -88], [-35, -88]]), fill: '#F4F0EA' });
    [-60, -40].forEach(y => m.add({ d: `M${f1(-36 + (100 + y) * .1 + 2)} ${y} L${f1(36 - (100 + y) * .1 - 2)} ${y}`, stroke: '#7A111B', w: 2, op: .6 }));
    m.add({ d: ell(0, -100, 36, 6), fill: '#3A1015' });
    return m.done();
  }
  function polaroid(o = {}) {
    const m = mk(o), bw = !!o.bw, img = o.img || 'sun';
    m.add({ d: rrect(-64, -76, 128, 152, 3), fill: '#000', op: .4, blur: 6 }, M.tr(4, 6));
    m.add({ d: rrect(-64, -76, 128, 152, 3), fill: '#F7F4EE' });
    m.grads.pic = lin(0, -66, 0, 40, bw ? [[0, '#DDD'], [1, '#555']] : [[0, '#FFB27A'], [1, '#5A3A6A']]);
    m.add({ d: rrect(-54, -66, 108, 106, 2), fill: 'url:pic' });
    if (img === 'sun') { m.add({ d: ell(0, -6, 22, 22), fill: bw ? '#FFF' : '#FFE3A0' }); m.add({ d: rrect(-54, 6, 108, 34, 0), fill: bw ? '#333' : '#2A2240' }); }
    if (img === 'pair') { m.add({ d: ell(-16, -18, 12, 12), fill: '#E8B596' }); m.add({ d: rrect(-30, -4, 28, 40, 10), fill: '#1C1A22' }); m.add({ d: rrect(6, -30, 44, 34, 12), fill: '#DE7B57' }); }
    return m.done();
  }

  // ---------- Ship of Theseus ----------
  const SHIP_PLANKS = 15;      // 3 rows x 5
  function ship(o = {}) {
    const m = mk(o), P = o.planks || [], sail = o.sail ?? 1;
    m.add({ d: ell(0, 6, 230, 14), fill: '#9CC7FF', op: .12, blur: 10 });
    // hull outline: a curved bowl; planks are bands across it, each its own colour state
    const hull = 'M-220 -96 L220 -96 C200 -40 150 0 90 6 L-90 6 C-150 0 -200 -40 -220 -96 Z';
    m.add({ d: '', defClip: { id: 'hull', d: hull } });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
      const i = r * 5 + c, k = Math.max(0, Math.min(1, P[i] || 0)), x = -220 + c * 88, y = -96 + r * 34;
      const old = ['#6A4A2E', '#5C3F27', '#73512F'][r], fresh = '#F3D48C';
      m.grads['p' + i] = lin(x, y, x + 88, y + 34, k > 0 ? [[0, fresh], [1, '#FFF3D0']] : [[0, old], [1, '#3E2A1A']]);
      m.add({ d: rrect(x + 1, y + 1, 86, 32, 2), fill: 'url:p' + i, clip: 'hull' });
      if (k > 0) m.add({ d: rrect(x + 1, y + 1, 86, 32, 2), fill: '#FFD27A', op: .45 * k, blur: 6, clip: 'hull' });
      if (k > 0 && k < 1) m.add({ d: rrect(x + 1, y + 1, 86, 32, 2), stroke: '#FFFFFF', w: 2, op: 1 - k, clip: 'hull' });
      m.add({ d: ell(x + 10, y + 17, 2, 2), fill: '#1A120C', op: .6, clip: 'hull' });
      m.add({ d: ell(x + 78, y + 17, 2, 2), fill: '#1A120C', op: .6, clip: 'hull' });
    }
    m.add({ d: hull, stroke: '#2A1C12', w: 3 });
    m.add({ d: 'M-220 -96 L220 -96', stroke: '#FFC9AE', w: 2, op: .5 });
    m.add({ d: rrect(-6, -330, 12, 236, 4), fill: '#4A3220' });
    if (sail > 0) {
      m.grads.sail = lin(0, -320, 0, -120, [[0, '#F7EFE0'], [1, '#CDBFA6']]);
      m.add({ d: `M8 -318 C${f1(8 + 150 * sail)} -270 ${f1(8 + 150 * sail)} -170 8 -124 Z`, fill: 'url:sail' });
      m.add({ d: `M-8 -300 C${f1(-8 - 110 * sail)} -260 ${f1(-8 - 110 * sail)} -180 -8 -140 Z`, fill: 'url:sail', op: .85 });
    }
    m.add({ d: 'M-6 -330 L-6 -360 L40 -346 L-6 -332 Z', fill: '#DE7B57' });           // the flag: same name
    return m.done();
  }

  // ---------- vault door ----------
  function vault(o = {}) {
    const m = mk(o), op = o.open ?? 0, inside = o.inside || '#9CC7FF', R = 150;
    m.grads.steel = lin(-R, -R, R, R, [[0, '#9AA1AD'], [.5, '#5A616D'], [1, '#2A2E36']]);
    m.add({ d: rrect(-170, -170, 340, 340, 18), fill: '#1A1C21' });
    m.add({ d: ell(0, 0, R + 6, R + 6), fill: inside, op: .85 * op + .05 });
    m.add({ d: ell(0, 0, R + 6, R + 6), fill: inside, op: .5 * op, blur: 20 });
    const sx = 1 - op * .88;                                                             // the door swings (flat foreshortening)
    const dm = M.mul(M.tr(-R * (1 - sx), 0), M.scale(sx, 1));
    m.add({ d: ell(0, 0, R, R), fill: 'url:steel' }, dm);
    m.add({ d: ell(0, 0, R * .84, R * .84), stroke: '#2A2E36', w: 4 }, dm);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; m.add({ d: ell(Math.cos(a) * R * .92, Math.sin(a) * R * .92, 6, 6), fill: '#C9CED6' }, dm); }
    const wm = M.mul(dm, M.rot(op * 140));
    for (let i = 0; i < 3; i++) m.add({ d: rrect(-R * .55, -6, R * 1.1, 12, 6), fill: '#D7DBE2' }, M.mul(wm, M.rot(i * 60)));
    m.add({ d: ell(0, 0, 22, 22), fill: '#3A3F48' }, dm);
    m.add({ d: ell(-R * .3, -R * .45, R * .35, R * .14), fill: '#FFFFFF', op: .2, blur: 8 }, dm);
    return m.done();
  }

  // ---------- urn (Bostrom's) and balls ----------
  function urn(o = {}) {
    const m = mk(o);
    m.grads.terra = lin(-110, 0, 110, 0, [[0, '#5A2A18'], [.6, '#B5582F'], [1, '#E08A5A']]);
    const body = 'M-34 -236 L34 -236 C36 -214 30 -204 46 -192 C120 -150 124 -60 70 -14 L56 0 L-56 0 L-70 -14 C-124 -60 -120 -150 -46 -192 C-30 -204 -36 -214 -34 -236 Z';
    shadow(m, 80);
    m.add({ d: body, fill: 'url:terra' });
    m.add({ d: `M-104 -120 C-60 -128 60 -128 104 -120 L102 -100 C60 -108 -60 -108 -102 -100 Z`, fill: '#1A0E0A', op: .85 });   // black-figure band
    m.add({ d: `M-96 -70 C-50 -76 50 -76 96 -70`, stroke: '#1A0E0A', w: 5, op: .8 });
    m.add({ d: ell(0, -236, 36, 8), fill: '#2A120A' });
    m.add({ d: 'M40 -180 C90 -150 100 -90 70 -40', stroke: '#FFC9AE', w: 3, op: .4, cap: 'round' });
    for (const [x, y, c] of o.balls || []) {
      const black = c === 'b';
      if (black) m.add({ d: ell(x, y, 34, 34), fill: '#FF2A1A', op: .35 * (o.glowBlack ?? 1), blur: 16 });
      m.add({ d: ell(x, y, 22, 22), fill: black ? '#0B0A0D' : '#F4F0E8' });
      m.add({ d: ell(x + 7, y - 8, 7, 4), fill: '#FFFFFF', op: black ? .45 : .9 });
      if (black) m.add({ d: ell(x, y, 22, 22), stroke: '#FF6A5C', w: 1.4, op: .6 });
    }
    return m.done();
  }

  // ---------- Earth ----------
  function earth(o = {}) {
    const m = mk(o), r = o.r ?? 140;
    if (o.mode === 'dot') {
      const b = o.beam ?? 1;
      if (b > 0) m.add({ d: poly([[-900, -260], [900, 120], [900, 170], [-900, -200]]), fill: '#FFE7C2', op: .12 * b, blur: 18 });
      m.add({ d: ell(0, 0, 18, 18), fill: '#5DA9FF', op: .5, blur: 10 });
      m.add({ d: ell(0, 0, 4, 4), fill: '#BFE0FF' });
      return m.done();
    }
    m.grads.sea = rad(-r * .35, -r * .35, r * 1.4, [[0, '#7CC4FF'], [.6, '#2F6FD0'], [1, '#0E2A66']]);
    m.grads.night = lin(-r, 0, r, 0, [[0, '#000', 0], [.55, '#000', 0], [1, '#000', .65]]);
    m.add({ d: ell(0, 0, r * 1.12, r * 1.12), fill: '#5DA9FF', op: .35, blur: 18 });
    m.add({ d: ell(0, 0, r, r), fill: 'url:sea', clipSelf: 'globe' });
    const sp = (o.spin ?? 0) * r * 2;
    for (let k = 0; k < 7; k++) {            // continents: smooth blobs drifting with the spin, clipped to the globe
      const cx = ((((hash(k, 1) * 1.6 - .8) * r + sp) % (r * 2.6)) + r * 3.9) % (r * 2.6) - r * 1.3, cy = (hash(k, 2) * 1.3 - .65) * r, rr = r * (.2 + hash(k, 3) * .22);
      const pts = []; for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, q = rr * (.7 + hash(k * 9 + i, 4) * .5); pts.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q * .8]); }
      m.add({ d: smooth(pts), fill: '#4FA36A', clip: 'globe' });
      m.add({ d: smooth(pts), fill: '#C9B37A', op: .35, clip: 'globe' });
    }
    m.add({ d: ell(r * .2, -r * .3, r * .5, r * .1), fill: '#FFFFFF', op: .5, clip: 'globe' });
    m.add({ d: ell(-r * .3, r * .3, r * .4, r * .08), fill: '#FFFFFF', op: .4, clip: 'globe' });
    m.add({ d: ell(0, 0, r, r), fill: 'url:night', clip: 'globe' });
    m.add({ d: ell(0, 0, r, r), stroke: '#BFE0FF', w: 3, op: .6, blur: 2 });
    return m.done();
  }

  // ---------- boulder ----------
  function boulder(o = {}) {
    const m = mk(o), g = o.glow ?? .6;
    const pts = []; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, q = 90 * (.82 + hash(i, 5) * .3); pts.push([Math.cos(a) * q * 1.05, -88 + Math.sin(a) * q * .95]); }
    const d = smooth(pts);
    m.grads.rock = rad(30, -130, 170, [[0, '#9A9088'], [.7, '#4A4440'], [1, '#2A2624']]);
    shadow(m, 90);
    m.add({ d, fill: '#FFB15C', op: .35 * g, blur: 22 });
    m.add({ d, fill: 'url:rock', clipSelf: 'rock' });
    m.add({ d: 'M-60 -120 C-20 -100 -10 -60 30 -50 M10 -150 C20 -120 50 -110 70 -80', stroke: '#FFC56B', w: 3, op: .9 * g, clip: 'rock', cap: 'round' });
    m.add({ d: 'M-60 -120 C-20 -100 -10 -60 30 -50 M10 -150 C20 -120 50 -110 70 -80', stroke: '#FF9A3C', w: 8, op: .45 * g, blur: 4, clip: 'rock', cap: 'round' });
    m.add({ d, stroke: '#FFC9AE', w: 2, op: .35 });
    return m.done();
  }

  // ---------- tree of thought ----------
  const bz = (p, t) => { const u = 1 - t; return [0, 1].map(k => u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k]); };
  function tree(seed = 7, depth = 6) {
    const B = [];
    const grow = (x, y, ang, len, d, parent) => {
      const id = B.length, a = ang * Math.PI / 180, bend = (hash(id + seed * 31, 1) - .5) * 30;
      const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len;
      const c1 = [x + Math.cos(a) * len * .35 + bend * .3, y + Math.sin(a) * len * .35];
      const c2 = [x + Math.cos(a) * len * .7 - bend * .5, y + Math.sin(a) * len * .7];
      const b = { id, parent, depth: d, p: [[x, y], c1, c2, [x1, y1]], x1, y1, tip: d === depth };
      B.push(b);
      if (d < depth) {
        const n = hash(id + seed * 17, 2) > .78 && d > 1 ? 3 : 2, spreadA = 22 + hash(id + seed, 3) * 14;
        for (let k = 0; k < n; k++) {
          const off = n === 2 ? (k ? 1 : -1) * spreadA : (k - 1) * spreadA * 1.1;
          grow(x1, y1, ang + off + (hash(id * 3 + k, seed) - .5) * 10, len * (.72 + hash(id + k, seed + 1) * .08), d + 1, id);
        }
      } else b.tip = true;
    };
    grow(0, 0, -90, 120, 0, -1);
    const pathTo = (id) => { const out = []; while (id >= 0) { out.unshift(id); id = B[id].parent; } return out; };
    return { branches: B, pathTo, tips: B.filter(b => b.tip).map(b => b.id) };
  }
  function lanternTree(o = {}) {
    const m = mk(o), T = tree(o.seed ?? 7, o.depth ?? 6), fire = o.fire ?? 0;
    const litOf = (b) => typeof o.lit === 'number' ? o.lit : (o.lit && o.lit[b.id]) || 0;
    const wildPath = o.wild != null ? new Set(T.pathTo(o.wild)) : new Set(), dullPath = o.dull != null ? new Set(T.pathTo(o.dull)) : new Set();
    const N = 10;
    for (const b of T.branches) {
      const w = Math.max(1.6, 13 * Math.pow(.68, b.depth)), lit = Math.max(fire, litOf(b));
      const col = wildPath.has(b.id) ? '#BFE6FF' : dullPath.has(b.id) ? '#B7BCC6' : fire ? '#FF7A3C' : '#FFC56B';
      const dpath = `M${f1(b.p[0][0])} ${f1(b.p[0][1])}C${b.p.slice(1).map(q => q.map(f1).join(' ')).join(' ')}`;
      m.add({ d: dpath, stroke: '#3A2A22', w, cap: 'round' });                              // dark wood
      if (lit > 0) {                                                                         // the lit part, from the base
        const k = Math.max(1, Math.round(N * Math.min(1, lit))), pts = [];
        for (let i = 0; i <= k; i++) pts.push(bz(b.p, i / N));
        const seg = 'M' + pts.map(q => q.map(f1).join(' ')).join('L');
        m.add({ d: seg, stroke: col, w: w * 2.6, op: .4, blur: 5, cap: 'round' });
        m.add({ d: seg, stroke: col, w: w * .8, cap: 'round' });
      }
      if (b.tip) {                                                                           // lantern at every tip
        const L = lit >= 1 ? 1 : 0, lx = b.x1, ly = b.y1 + 4;
        m.add({ d: `M${f1(lx)} ${f1(b.y1)} L${f1(lx)} ${f1(ly)}`, stroke: '#3A2A22', w: 1.4 });
        if (L) m.add({ d: ell(lx, ly + 9, 16, 16), fill: col, op: .5, blur: 8 });
        m.add({ d: rrect(lx - 6, ly, 12, 18, 5), fill: L ? col : '#4A3A30' });
        m.add({ d: rrect(lx - 4, ly - 2, 8, 3, 1), fill: '#2A1E18' });
      }
    }
    if (o.wild != null && o.cake) {          // the slice of heaven at the end of the wild branch
      const b = T.branches[o.wild], k = o.cake, cx = b.x1, cy = b.y1 - 20;
      m.add({ d: ell(cx, cy - 40, 46 * k, 14 * k), stroke: '#FFE7A0', w: 4, op: .9 * k });
      m.add({ d: ell(cx, cy - 40, 50 * k, 18 * k), stroke: '#FFE7A0', w: 10, op: .3 * k, blur: 6 });
      m.add({ d: poly([[cx - 40 * k, cy], [cx + 44 * k, cy - 18 * k], [cx + 44 * k, cy + 26 * k], [cx - 40 * k, cy + 40 * k]]), fill: '#F3E3C8' });
      m.add({ d: poly([[cx - 40 * k, cy + 12 * k], [cx + 44 * k, cy - 4 * k], [cx + 44 * k, cy + 4 * k], [cx - 40 * k, cy + 20 * k]]), fill: '#D9455A' });
      m.add({ d: poly([[cx - 40 * k, cy], [cx + 44 * k, cy - 18 * k], [cx + 30 * k, cy - 28 * k], [cx - 50 * k, cy - 10 * k]]), fill: '#FFF7EC' });
      m.add({ d: ell(cx + 20 * k, cy - 26 * k, 7 * k, 7 * k), fill: '#C9182B' });
    }
    if (o.dull != null && o.dullCube !== false) {
      const b = T.branches[o.dull], c = 40;
      m.add({ d: rrect(b.x1 - c / 2, b.y1 - c - 4, c, c, 3), fill: '#7D838F' });
      m.add({ d: poly([[b.x1 - c / 2, b.y1 - c - 4], [b.x1 - c / 2 + 8, b.y1 - c - 11], [b.x1 + c / 2 + 8, b.y1 - c - 11], [b.x1 + c / 2, b.y1 - c - 4]]), fill: '#C7CCD4' });
    }
    return m.done({ tree: T });
  }

  G.PROPS = { scroll, crane, desk, door, window: windowProp, books, go, tungsten, offSwitch, suitcase, envelope, gauge, coin, cup, polaroid, ship, SHIP_PLANKS, vault, urn, earth, boulder, tree, lanternTree };
})(typeof window !== 'undefined' ? window : globalThis);
