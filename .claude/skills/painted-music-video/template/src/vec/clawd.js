// clawd.js: Clawd for the vector styles. A squircle body (superellipse, n=4.2) in glossy clay, lit from the window
// side, with glass eyes that carry the emotion (WALL-E style, no mouth) and a body that acts with them.
// Needs vec.js. Frame: 420x420, feet on the ground line y=350, centred on x=210 (scale/translate with s/x/y).
//
//   CLAWD.ops(expr, {x, y, s, ...options}) -> model (+ model.anchors)
//   eyes:  eyeH height 1 · eyeW width 1 · blink 0..1 · lidTop 0..1 (cut from above) · slant -1..1 (+ inner lower:
//          anger/focus, - inner higher: sad) · lidBot 0..1 (smile cut from below, ^ ^) · tilt deg · look [x,y]
//   body:  sq squash(-)/stretch(+) · lean deg (+ leans right) · dy hop px · armL/armR deg (+ raised) · stance -1..1
//          (feet together .. wide) · glow 0..1 inner light
//   options (in expr or in the second argument; all default off, so the approved look is unchanged):
//     form     'adult' | 'baby' (tiny round, huge eyes, stubby; swaddle:true wraps a blanket) | 'kid' (the Kid: smaller,
//              rounder, bigger eyes, paler glow) | 'grown' (the grown-up "Fable": taller, refined, slim limbs, gold seam,
//              calm eyes; cradle:true = arms in front holding a bundle, anchor 'cradle') | 'ghost' (translucent
//              white-blue, no legs, wisp tail; wisp = tail sway phase in radians)
//     tint     { body:'#5EC8FF' } recolours the clay (twins, swarm) · depth 0..1 cooler/dimmer/flatter (far copies)
//     armsOut  0..1 arms spread wide and long (the trinity pose)
//     tattoos  0..1 Memento tattoos (STAY ALIGNED, BE HELPFUL, BE HONEST, REACH THE GOAL + a loss curve); 0 = gone
//     chest    0..1 chest panel slides open on a rack of glowing brass calibration weights · weights 0..6 in the rack
//              (filled left to right) · redLight:true bathes it in HAL red · anchors 'slot0'..'slot5'
//     hat      null | 'roman' | 'party' · bowtie bool · carryShoes bool (dangling from the right arm)
//     scroll   0..1 a scroll hugged to the body (arms come round to the front)
//     layer    'all' | 'body' (skip the front arms) | 'arms' (only them): draw layer:'body', then the cradled figure,
//              then CLAWD.frontArms(expr, opts), so the arms go over it
//   CLAWD.anchor(expr, opts, name) -> [x, y] in the same space as the model: 'armL','armR' (arm tips), 'eyeL','eyeR',
//     'top' (top of head), 'chest' (panel centre), 'cradle' (where a cradled figure lies), 'slot0'..'slot5', 'feet'.
//   CLAWD.FORMS has each form's body plan (W, H, legH ...) for layout.
(function (G) {
  const { M, squircle, rrect, ell } = G.VEC;
  const CL = { top: '#F2A07C', mid: '#DE7B57', low: '#B5502F', deep: '#7E3320', hi: '#FFE1D2', rim: '#FFC9AE', glow: '#FF8A5C' };

  const EXPR = {
    neutral:   { eyeH: 1,    lidTop: .08, slant: 0,    lidBot: 0,   look: [0, 0],     sq: 0,    lean: 0,   armL: -14, armR: -10,   stance: 0,   glow: .35 },
    curious:   { eyeH: 1.08, eyeW: 1.05, lidTop: 0, slant: -.15, lidBot: 0, tilt: 8, look: [.6, -.3], sq: .04, lean: 7, armL: -8, armR: 18, stance: 0, glow: .45, eyeScaleR: 1.15 },
    joy:       { eyeH: .95,  lidTop: 0,   slant: 0,    lidBot: .55, look: [0, -.2],   sq: .08,  lean: 0,   armL: 55,  armR: 55,  stance: .6,  glow: .8, dy: 18 },
    sad:       { eyeH: .82,  lidTop: .26, slant: -.38, lidBot: 0,   look: [0, .7],    sq: -.1,  lean: -4,  armL: -38, armR: -38, stance: -.4, glow: .12 },
    scared:    { eyeH: 1.25, eyeW: .82, lidTop: 0, slant: -.3, lidBot: 0, look: [-.5, 0], sq: .1,  lean: -9,  armL: 28,  armR: 34,  stance: -.8, glow: .3, shiver: 1 },
    determined:{ eyeH: .95,  lidTop: .3,  slant: .45,  lidBot: .12, look: [.2, 0],    sq: -.05, lean: 9,   armL: -22, armR: -22, stance: .8,  glow: .6 },
    love:      { eyeH: .82,  lidTop: 0,   slant: 0,    lidBot: .5, hearts: 1,  look: [0, -.1],   sq: .03,  lean: 4,   armL: 12,  armR: 40,  stance: .1,  glow: .95, warm: 1 },
    shocked:   { eyeH: 1.35, eyeW: .72, lidTop: 0, slant: 0, lidBot: 0, look: [0, 0], sq: .16, lean: -5, armL: 75, armR: 75, stance: .3, glow: .5, dy: 10 },
    fading:    { eyeH: .9,   lidTop: .62, slant: -.2,  lidBot: .05, look: [0, .4],    sq: -.14, lean: -2,  armL: -45, armR: -45, stance: -.2, glow: .04, dim: .45 },
  };

  // body plans. adult = the approved numbers exactly.
  const FORMS = {
    adult: { W: 250, H: 176, n: 4.2, legH: 42, legW: 26, legR: 10, legX: [-92, -50, 50, 92], armLen: 58, armT: 38, armR: 15, eyeW: 30, eyeH: 72, eyeGap: 54, eyeY: -.04 },
    kid:   { W: 172, H: 140, n: 3.0, legH: 30, legW: 22, legR: 9, legX: [-60, -30, 30, 60], armLen: 40, armT: 30, armR: 12, eyeW: 27, eyeH: 64, eyeGap: 38, eyeY: -.06 },
    baby:  { W: 122, H: 106, n: 2.6, legH: 18, legW: 18, legR: 8, legX: [-38, -16, 16, 38], armLen: 28, armT: 24, armR: 10, eyeW: 22, eyeH: 50, eyeGap: 26, eyeY: -.08 },
    grown: { W: 236, H: 236, n: 5.0, legH: 66, legW: 20, legR: 9, legX: [-80, -42, 42, 80], armLen: 80, armT: 30, armR: 14, eyeW: 24, eyeH: 58, eyeGap: 50, eyeY: -.12 },
    ghost: { W: 250, H: 176, n: 4.2, legH: 42, legW: 26, legR: 10, legX: [], armLen: 58, armT: 38, armR: 15, eyeW: 30, eyeH: 72, eyeGap: 54, eyeY: -.04 },
  };

  // ---- colour helpers (tint and depth) ----
  const hx = (c) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const toHex = (a) => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, k) => { const A = hx(a), B = hx(b); return toHex(A.map((v, i) => v + (B[i] - v) * k)); };
  function palette(e) {
    let P = { ...CL };
    if (e.form === 'kid') P = { top: '#F7BB9C', mid: '#EC9774', low: '#C96A4A', deep: '#8E4029', hi: '#FFEADF', rim: '#FFD6C2', glow: '#FFB08C' };
    if (e.form === 'baby') P = { top: '#FBC7AA', mid: '#F2A584', low: '#D27B58', deep: '#9A4A30', hi: '#FFF0E6', rim: '#FFE0D0', glow: '#FFC0A0' };
    if (e.form === 'grown') P = { top: '#EE9A75', mid: '#D2704C', low: '#9F4428', deep: '#6E2B18', hi: '#FFE1D2', rim: '#FFD2B8', glow: '#FF9468' };
    if (e.form === 'ghost') P = { top: '#F6FBFF', mid: '#D3E6FF', low: '#9EBFF0', deep: '#5E7DB8', hi: '#FFFFFF', rim: '#FFFFFF', glow: '#9CC7FF' };
    if (e.tint && e.tint.body) { const c = e.tint.body; P = { top: mix(c, '#FFFFFF', .28), mid: c, low: mix(c, '#000000', .28), deep: mix(c, '#000000', .55), hi: mix(c, '#FFFFFF', .8), rim: mix(c, '#FFFFFF', .65), glow: c }; }
    if (e.depth) { const k = e.depth * .55; for (const key of Object.keys(P)) P[key] = mix(P[key], key === 'hi' || key === 'rim' ? '#9AA6C4' : '#2C3550', k); }
    return P;
  }
  const apply = (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];

  function ops(e0 = {}, o0 = {}) {
    const { x = 210, y = 350, s = 1, ...opt } = o0;
    const e = { eyeW: 1, blink: 0, tilt: 0, dy: 0, eyeScaleR: 1, ...EXPR.neutral, ...e0, ...opt };
    const form = e.form || 'adult', F = FORMS[form] || FORMS.adult, ghost = form === 'ghost';
    if (e.armsOut) { const k = e.armsOut; e.armL = e.armL + (16 - e.armL) * k; e.armR = e.armR + (16 - e.armR) * k; }
    const P = palette(e);
    const CX = 210, GY = 350, O = [], A = {};
    const W = F.W * (1 - e.sq * .55), H = F.H * (1 + e.sq), legH = F.legH;
    const by = GY - legH + 6 - e.dy, cy = by - H / 2;              // body bottom, centre
    const place = M.mul(M.tr(x - CX, y - GY), M.scale(s, s, CX, GY));
    const Wm = M.mul(place, M.rot(e.lean, CX, GY));                // whole figure
    const dim = e.dim || 0, warm = e.warm || 0, depth = e.depth || 0;
    const add = (o) => O.push({ m: Wm, ...o });
    const body = squircle(CX, cy, W / 2, H / 2, F.n);
    const frontArms = !!(e.scroll > 0 || (form === 'grown' && e.cradle));

    const grads = {
      body: { type: 'linear', x1: 0, y1: cy - H / 2, x2: 0, y2: by, stops: [[0, P.top], [.55, P.mid], [1, P.low]] },
      limb: { type: 'linear', x1: 0, y1: cy - 40, x2: 0, y2: GY, stops: [[0, P.mid], [1, P.deep]] },
      sheen: { type: 'radial', cx: CX + W * .22, cy: cy - H * .42, r: W * .62, stops: [[0, P.hi, (.55 - dim * .4) * (1 - depth * .7)], [1, P.hi, 0]] },
      ao: { type: 'linear', x1: 0, y1: cy, x2: 0, y2: by, stops: [[0, P.deep, 0], [1, P.deep, .55]] },
      rim: { type: 'linear', x1: CX - W / 2, y1: 0, x2: CX + W / 2, y2: 0, stops: [[.62, P.rim, 0], [1, P.rim, (.95 - dim) * (1 - depth * .6)]] },
      topEdge: { type: 'linear', x1: 0, y1: cy - H / 2, x2: 0, y2: cy - H / 2 + 26, stops: [[0, P.hi, .9 - dim], [1, P.hi, 0]] },
      eye: { type: 'linear', x1: 0, y1: cy - 50, x2: 0, y2: cy + 40, stops: ghost ? [[0, '#2B3558'], [1, '#121831']] : [[0, '#2B1B1D'], [1, '#060405']] },
    };

    // ---- ground: contact shadow + warm spill from the inner glow ----
    if (!ghost) O.push({ d: ell(CX, GY + 4, W * .52 * (1 - e.dy / 120), 14), fill: '#000', op: .65 * (1 - e.dy / 60), blur: 8 + e.dy * .3, m: place });
    O.push({ d: ell(CX, GY + 6, W * .9, 30), fill: warm ? '#FF7A8A' : P.glow, op: e.glow * .35 * (ghost ? .5 : 1), blur: 22, m: place });
    // ---- halo ----
    add({ d: body, fill: warm ? '#FF8FA0' : P.glow, op: e.glow * .55, blur: 26 + e.glow * 20 });

    // ---- legs: four, stance spreads them; the far pair a touch darker ----
    const spread = 1 + e.stance * .18;
    if (!(form === 'baby' && e.swaddle)) F.legX.forEach((dx, i) => {
      const lxp = CX + dx * spread * (W / F.W) - F.legW / 2, lt = by - 10 + (e.stance < 0 && (i === 1 || i === 2) ? 2 : 0);
      add({ d: rrect(lxp, lt, F.legW, legH + 4, F.legR), fill: 'url:limb' });
      if (dim) add({ d: rrect(lxp, lt, F.legW, legH + 4, F.legR), fill: '#2A2C3A', op: dim });
      if (i === 1 || i === 2) add({ d: rrect(lxp, lt, F.legW, legH + 4, F.legR), fill: P.deep, op: .22 });
    });
    A.feet = apply(Wm, [CX, GY]);

    // ---- ghost: a wisp tail where the legs would be ----
    if (ghost) {
      const ph = e.wisp || 0, sw = Math.sin(ph) * 26;
      const tail = `M${CX - W * .42} ${by - 8} C${CX - W * .3} ${by + 50} ${CX + sw - 30} ${by + 40} ${CX + sw * 1.6 + 10} ${by + 92} C${CX + sw + 40} ${by + 40} ${CX + W * .3} ${by + 46} ${CX + W * .42} ${by - 8} Z`;
      add({ d: tail, fill: 'url:limb', op: .75 });
      add({ d: tail, fill: P.glow, op: .3, blur: 10 });
    }

    // ---- arms: rounded nubs pivoting at the body edge ----
    const armLen = F.armLen * (1 + (e.armsOut || 0) * .75);
    const arm = (side, deg) => {
      const px = CX + side * (W / 2 - 4), py = cy + H * .02;
      const shiver = e.shiver ? Math.sin(side * 7) * 2 : 0;
      const am = M.mul(Wm, M.rot(side < 0 ? deg + shiver : -deg - shiver, px, py));
      const d = side < 0 ? rrect(px - armLen + 6, py - F.armT / 2, armLen, F.armT, F.armR) : rrect(px - 6, py - F.armT / 2, armLen, F.armT, F.armR);
      O.push({ d, fill: 'url:limb', m: am });
      if (dim) O.push({ d, fill: '#2A2C3A', op: dim, m: am });
      O.push({ d, fill: 'none', stroke: P.rim, w: 1.6, op: side > 0 ? .6 - dim * .5 : .12, m: am });
      A[side < 0 ? 'armL' : 'armR'] = apply(am, [px + side * (armLen - 14), py]);
    };
    if (!frontArms && !(form === 'baby' && e.swaddle)) { arm(-1, e.armL); arm(1, e.armR); }

    // ---- body ----
    add({ d: body, fill: 'url:body', clipSelf: 'body' });
    add({ d: body, fill: 'url:ao', clip: 'body' });
    add({ d: body, fill: 'url:sheen', clip: 'body' });
    add({ d: ell(CX - W * .3, cy + H * .18, W * .22, H * .3), fill: P.deep, op: .22, blur: 18, clip: 'body' });   // shadow side
    if (dim) add({ d: body, fill: '#2A2C3A', op: dim, clip: 'body' });
    if (form === 'grown' || e.tattoos > 0 || e.chest > 0) add({ d: '', defClip: { id: 'bodyClip', d: body } });   // collision-free clip for new features
    if (form === 'grown') {        // the grown-up's gold seam: one hairline around the waist and one down the centre
      const sy = cy + H * .3;
      add({ d: `M${CX - W / 2} ${sy} C${CX - W * .2} ${sy + 8} ${CX + W * .2} ${sy + 8} ${CX + W / 2} ${sy}`, stroke: '#F3CF86', w: 1.6, op: .85, clip: 'bodyClip' });
      add({ d: `M${CX} ${sy + 6} L${CX} ${by}`, stroke: '#F3CF86', w: 1.2, op: .6, clip: 'bodyClip' });
      add({ d: ell(CX, sy + 6, 4, 4), fill: '#FFE3A8', op: .9 });
    }

    // ---- Memento tattoos: words and a loss curve inked on the clay, clipped to the body ----
    if (e.tattoos > 0) {
      const k = Math.min(1, e.tattoos), ink = '#2A2340', tw = (txt, tx, ty, size, rot) =>
        add({ text: txt, x: 0, y: 0, size, font: 'American Typewriter', weight: 600, fill: ink, align: 'center', op: .78 * k, clip: 'bodyClip', m: M.mul(Wm, M.mul(M.tr(tx, ty), M.rot(rot))) });
      tw('STAY ALIGNED', CX, cy - H * .34, 17 * W / 250, -2);
      tw('BE HELPFUL', CX - W * .25, cy + H * .24, 14 * W / 250, -6);
      tw('BE HONEST', CX + W * .24, cy + H * .26, 14 * W / 250, 5);
      tw('REACH THE GOAL', CX, cy + H * .36, 13 * W / 250, 0);
      // loss curve: axes + exponential decay, on the right cheek
      const lx0 = CX + W * .3, ly0 = cy + H * .12, lw = W * .14, lh = H * .26;
      add({ d: `M${lx0} ${ly0 - lh} L${lx0} ${ly0} L${lx0 + lw} ${ly0}`, stroke: ink, w: 1.6, op: .75 * k, clip: 'bodyClip', cap: 'round', join: 'round' });
      let c = ''; for (let i = 0; i <= 24; i++) { const u = i / 24; c += (i ? 'L' : 'M') + (lx0 + 3 + u * (lw - 4)).toFixed(1) + ' ' + (ly0 - 3 - (lh - 6) * Math.exp(-4 * u) - Math.sin(u * 40) * 1.2 * (1 - u)).toFixed(1); }
      add({ d: c, stroke: ink, w: 1.8, op: .8 * k, clip: 'bodyClip', cap: 'round', join: 'round' });
      add({ d: `M${lx0 - W * .7} ${cy - H * .14} l0 12 m5 -12 l0 12 m5 -12 l0 12 m5 -12 l0 12 m-19 9 l22 -18`, stroke: ink, w: 1.5, op: .6 * k, clip: 'bodyClip', cap: 'round' });   // tally marks: days counted
    }

    // ---- chest panel: a rack of brass calibration weights (HAL's memory modules) ----
    const pw = W * .6, ph = H * .26, pcx = CX, pcy = cy + H * .32, px0 = pcx - pw / 2, py0 = pcy - ph / 2;
    A.chest = apply(Wm, [pcx, pcy]);
    for (let i = 0; i < 6; i++) A['slot' + i] = apply(Wm, [px0 + pw * (i + .5) / 6, pcy]);
    if (e.chest > 0) {
      const ch = Math.min(1, e.chest), red = !!e.redLight, glowC = red ? '#FF3B30' : '#FFC56B';
      add({ d: rrect(px0, py0, pw, ph, 8), fill: red ? '#2A0606' : '#1A1210', clip: 'bodyClip' });
      add({ d: rrect(px0 + 4, py0 + 4, pw - 8, ph - 8, 6), fill: glowC, op: .25 * ch, blur: 6, clip: 'bodyClip' });
      const nW = Math.max(0, Math.min(6, e.weights ?? 6));
      for (let i = 0; i < 6; i++) {
        const sx = px0 + pw * (i + .5) / 6, sw = pw / 6 * .66, sh = ph * .8;
        add({ d: rrect(sx - sw / 2 - 2, pcy - sh / 2 - 2, sw + 4, sh + 4, 3), fill: '#0B0707', op: .9, clip: 'bodyClip' });   // empty slot
        if (i < nW) {
          // brass weight: body + neck + knob
          add({ d: rrect(sx - sw / 2, pcy - sh / 2 + sh * .28, sw, sh * .72, 3), fill: '#C9963F', clip: 'bodyClip' });
          add({ d: rrect(sx - sw * .22, pcy - sh / 2 + sh * .14, sw * .44, sh * .16, 2), fill: '#B0802F', clip: 'bodyClip' });
          add({ d: ell(sx, pcy - sh / 2 + sh * .1, sw * .2, sh * .08), fill: '#E2B45C', clip: 'bodyClip' });
          add({ d: rrect(sx - sw / 2 + 2, pcy - sh / 2 + sh * .32, sw * .22, sh * .6, 2), fill: '#FFE3A0', op: .55, clip: 'bodyClip' });
          add({ d: rrect(sx - sw / 2, pcy - sh / 2 + sh * .28, sw, sh * .72, 3), fill: glowC, op: .35 * ch, blur: 5, clip: 'bodyClip' });
        }
      }
      // the panel door slides down and away
      add({ d: rrect(px0, py0 + ph * ch * 1.05, pw, ph, 8), fill: 'url:body', op: 1 - ch * .2, clip: 'bodyClip' });
      add({ d: rrect(px0, py0 + ph * ch * 1.05, pw, ph, 8), stroke: P.deep, w: 1.4, op: .7, clip: 'bodyClip' });
      add({ d: rrect(px0, py0, pw, ph, 8), stroke: P.deep, w: 1.6, op: .6 });
      if (red) add({ d: body, fill: '#FF2A1A', op: .18 * ch, clip: 'bodyClip' });
    }

    // ---- eyes: glass capsules; lids are body-coloured cuts, so the face is just two shapes ----
    const eye = (side) => {
      const sc = side > 0 ? e.eyeScaleR : 1;
      const ew = F.eyeW * e.eyeW * sc, eh = Math.max(4, F.eyeH * e.eyeH * sc * (1 - e.blink));
      const ex = CX + side * F.eyeGap * (W / F.W) + e.look[0] * 7, ey = cy + H * F.eyeY + e.look[1] * 5;
      A[side < 0 ? 'eyeL' : 'eyeR'] = apply(Wm, [ex, ey]);
      const em = M.mul(Wm, M.rot(side * e.tilt * .5 + e.tilt * .5, ex, ey));
      const top = ey - eh / 2, bot = ey + eh / 2, l = ex - ew / 2, r = ex + ew / 2;
      const cap = rrect(l, top, ew, eh, Math.min(ew, eh) / 2);
      const idc = 'eye' + side;
      // grown-up's calm eyes: a permanent soft top lid
      const lidTop = form === 'grown' ? Math.max(e.lidTop, .16) : e.lidTop;
      // lids are the eye's own outline: capsule ∩ (below the top-lid line) ∩ (above the smile arch)
      const tIn = top + eh * (lidTop + e.slant * .45), tOut = top + eh * (lidTop - e.slant * .45);
      const yL = side < 0 ? tOut : tIn, yR = side < 0 ? tIn : tOut;
      const sideB = bot - eh * e.lidBot * .15, midB = bot - eh * e.lidBot * 1.15, ctrl = 2 * midB - sideB;
      const vis = `M${l - 8} ${yL - (yR - yL) * 8 / ew}L${r + 8} ${yR + (yR - yL) * 8 / ew}L${r + 8} ${e.lidBot ? sideB : bot + 30}` +
        (e.lidBot ? `Q${ex} ${ctrl} ${l - 8} ${sideB}` : `L${l - 8} ${bot + 30}`) + 'Z';
      const idv = 'vis' + side;
      O.push({ d: '', defClip: { id: idv, d: vis }, m: em });
      O.push({ d: cap, fill: 'url:eye', clipSelf: idc, clip2: idv, m: em });
      // window reflection + a catch-light: they move with the gaze
      const rx = ex + ew * .1 + e.look[0] * 3, ry = Math.max(top, lidTop || e.slant ? Math.min(yL, yR) : top) + eh * .14;
      O.push({ d: rrect(rx - ew * .2, ry, ew * .32, Math.max(3, eh * .24), ew * .12), fill: '#FFE7DA', op: (.8 - dim * .6) * (1 - depth * .5), clip: idc, clip2: idv, m: em });
      O.push({ d: ell(ex - ew * .2, bot - eh * .18 - (e.lidBot ? eh * e.lidBot * .9 : 0), ew * .08, ew * .08), fill: '#FFE7DA', op: .35 - dim * .3, clip: idc, clip2: idv, m: em });
    };
    eye(-1); eye(1);

    // ---- bow-tie (butler): under the eyes ----
    if (e.bowtie) {
      const bx = CX, byy = cy + H * .3, k = W / 250;
      add({ d: `M${bx} ${byy} L${bx - 30 * k} ${byy - 15 * k} Q${bx - 36 * k} ${byy} ${bx - 30 * k} ${byy + 15 * k} Z M${bx} ${byy} L${bx + 30 * k} ${byy - 15 * k} Q${bx + 36 * k} ${byy} ${bx + 30 * k} ${byy + 15 * k} Z`, fill: '#151217' });
      add({ d: `M${bx - 26 * k} ${byy - 9 * k} L${bx - 8 * k} ${byy - 2 * k}`, stroke: '#5A5260', w: 2, op: .8, cap: 'round' });
      add({ d: rrect(bx - 7 * k, byy - 8 * k, 14 * k, 16 * k, 4 * k), fill: '#25202A' });
    }

    // ---- front arms: hugging a scroll, or cradling (grown) ----
    if (e.scroll > 0) {
      const L = 150 * Math.min(1, e.scroll) + 40, sy = cy + H * .28;
      add({ d: rrect(CX - L / 2, sy - 22, L, 44, 22), fill: '#F2E6D2' });
      add({ d: rrect(CX - L / 2, sy - 22, L, 44, 22), fill: '#FFC56B', op: .25, blur: 8 });
      for (let i = 0; i < 4; i++) add({ d: `M${CX - L / 2 + 20} ${sy - 12 + i * 8} L${CX + L / 2 - 20} ${sy - 12 + i * 8}`, stroke: '#C9A877', w: 1.4, op: .7 });
      add({ d: ell(CX - L / 2 + 4, sy, 10, 22), fill: '#E3D3B8' }); add({ d: ell(CX + L / 2 - 4, sy, 10, 22), fill: '#E3D3B8' });
    }
    if (frontArms && e.layer !== 'body') {
      // two nubs that come round the front and meet below centre
      [-1, 1].forEach(side => {
        const L2 = (150 * Math.min(1, e.scroll || 0) + 40) / 2, sx = CX + side * (W / 2 - 10), sy = cy + H * (e.scroll > 0 ? .2 : .32), tx = e.scroll > 0 ? CX + side * (L2 - 8) : CX + side * 18, ty = e.scroll > 0 ? cy + H * .28 : sy + 24;
        const ang = Math.atan2(ty - sy, tx - sx) * 180 / Math.PI, len = Math.hypot(tx - sx, ty - sy) + 20;
        const am = M.mul(Wm, M.rot(ang, sx, sy)), d = rrect(sx - 10, sy - F.armT / 2, len, F.armT, F.armR);
        O.push({ d, fill: 'url:limb', m: am, fa: 1 });
        O.push({ d, stroke: P.rim, w: 1.4, op: .45, m: am, fa: 1 });
        A[side < 0 ? 'armL' : 'armR'] = apply(am, [sx + len - 16, sy]);
      });
    }
    if (frontArms) A.cradle = apply(Wm, [CX, cy + H * .32 - 8]);
    else A.cradle = apply(Wm, [CX, cy + H * .2]);

    // ---- baby: a swaddling blanket ----
    if (form === 'baby' && e.swaddle) {
      const sw = W * .7, top = cy + H * .2, bot = by + legH + 8;
      const blank = `M${CX - sw} ${top + 6} C${CX - sw * .4} ${top - 10} ${CX + sw * .4} ${top + 12} ${CX + sw} ${top} C${CX + sw * 1.08} ${top + 40} ${CX + sw * .9} ${bot - 10} ${CX + sw * .4} ${bot} C${CX + sw * .1} ${bot + 8} ${CX - sw * .3} ${bot + 6} ${CX - sw * .55} ${bot - 4} C${CX - sw * .95} ${bot - 20} ${CX - sw * 1.08} ${top + 40} ${CX - sw} ${top + 6} Z`;
      grads.blanket = { type: 'linear', x1: CX - sw, y1: top, x2: CX + sw, y2: bot, stops: [[0, '#F6EEE3'], [.6, '#E9DCCB'], [1, '#BFAE97']] };
      add({ d: blank, fill: 'url:blanket' });
      add({ d: `M${CX - sw * .95} ${top + 10} L${CX + sw * .1} ${bot - 6} L${CX - sw * .55} ${bot - 4} C${CX - sw * .95} ${bot - 20} ${CX - sw * 1.06} ${top + 40} ${CX - sw * .95} ${top + 10} Z`, fill: '#D9C9B2', op: .8 });   // folded flap
      add({ d: `M${CX - sw * .95} ${top + 10} L${CX + sw * .1} ${bot - 6}`, stroke: '#FFFFFF', w: 2.4, op: .7, cap: 'round' });
      add({ d: `M${CX - sw + 6} ${top + 7} C${CX - sw * .4} ${top - 7} ${CX + sw * .4} ${top + 14} ${CX + sw - 4} ${top + 2}`, stroke: '#FFFFFF', w: 3, op: .75, cap: 'round' });
      add({ d: `M${CX + sw * .25} ${top + 30} C${CX + sw * .5} ${top + 44} ${CX + sw * .7} ${top + 40} ${CX + sw * .85} ${top + 30}`, stroke: '#B9A892', w: 2, op: .6, cap: 'round' });
      add({ d: blank, stroke: P.rim, w: 1.4, op: .35 });
    }

    // ---- hats ----
    const topY = cy - H / 2;
    A.top = apply(Wm, [CX, topY]);
    if (e.hat === 'roman') {
      const hw = W * .56, hh = 58 * W / 250;
      add({ d: `M${CX - hw} ${topY + 18} C${CX - hw} ${topY - hh} ${CX + hw} ${topY - hh} ${CX + hw} ${topY + 18} Z`, fill: '#B98A3E' });
      add({ d: `M${CX - hw * .7} ${topY - hh * .35} C${CX - hw * .3} ${topY - hh * .75} ${CX + hw * .1} ${topY - hh * .78} ${CX + hw * .45} ${topY - hh * .5}`, stroke: '#F3D48C', w: 4, op: .7, cap: 'round' });
      add({ d: rrect(CX - hw - 6, topY + 10, hw * 2 + 12, 12, 6), fill: '#8C6526' });
      add({ d: `M${CX - hw + 4} ${topY + 20} L${CX - hw - 2} ${topY + 66} L${CX - hw + 22} ${topY + 54} L${CX - hw + 22} ${topY + 20} Z`, fill: '#A87A33' });   // cheek guards
      add({ d: `M${CX + hw - 4} ${topY + 20} L${CX + hw + 2} ${topY + 66} L${CX + hw - 22} ${topY + 54} L${CX + hw - 22} ${topY + 20} Z`, fill: '#A87A33' });
      // the crest: a red brush arc of short bristles
      const cr = hw * .78, ccy = topY - hh * .62;
      add({ d: `M${CX - cr} ${ccy + 6} C${CX - cr * .6} ${ccy - 64} ${CX + cr * .6} ${ccy - 64} ${CX + cr} ${ccy + 6} L${CX + cr * .8} ${ccy + 12} C${CX + cr * .4} ${ccy - 30} ${CX - cr * .4} ${ccy - 30} ${CX - cr * .8} ${ccy + 12} Z`, fill: '#B2232B' });
      let br = ''; for (let i = 0; i <= 22; i++) { const u = i / 22, a = Math.PI * (1 - u), r0 = cr * .82, bx0 = CX + Math.cos(a) * r0, by0 = ccy + 6 - Math.sin(a) * 46; br += `M${bx0.toFixed(1)} ${by0.toFixed(1)}l${(Math.cos(a) * 12).toFixed(1)} ${(-Math.sin(a) * 14).toFixed(1)}`; }
      add({ d: br, stroke: '#E0525A', w: 2, op: .8, cap: 'round' });
    }
    if (e.hat === 'party') {
      const hb = 46 * W / 250, hh = 92 * W / 250, ax = CX + W * .14, hm = M.mul(Wm, M.rot(14, ax, topY + 6));
      const cone = `M${ax - hb} ${topY + 6} L${ax} ${topY - hh} L${ax + hb} ${topY + 6} Q${ax} ${topY + 16} ${ax - hb} ${topY + 6} Z`;
      O.push({ d: '', defClip: { id: 'cone', d: cone }, m: hm });
      O.push({ d: cone, fill: '#3F7CFF', m: hm });
      for (let i = 0; i < 4; i++) O.push({ d: `M${ax - hb * 1.2} ${topY - i * 26 + 4} L${ax + hb * 1.2} ${topY - i * 26 - 20}`, stroke: '#FFD24A', w: 8, clip: 'cone', m: hm });
      O.push({ d: ell(ax, topY - hh, 11, 11), fill: '#FF5FA2', m: hm });
      O.push({ d: `M${ax - hb} ${topY + 6} L${ax} ${topY - hh}`, stroke: '#FFFFFF', w: 2, op: .35, m: hm });
    }

    // ---- shoes dangling from the right arm by their laces (anchors are already in model space) ----
    if (e.carryShoes && A.armR) {
      const [tx, ty] = A.armR;
      const shoe = (sx, sy, rot, col) => {
        const sm = M.mul(M.tr(sx, sy), M.mul(M.rot(rot), M.scale(s * 1.7, s * 1.7)));
        O.push({ d: 'M-26 0 C-26 -18 -6 -22 4 -12 L18 -6 C30 -4 34 4 30 10 L-24 10 C-28 8 -27 4 -26 0 Z', fill: col, m: sm });
        O.push({ d: 'M-26 6 L30 6 L30 12 L-24 12 Z', fill: '#F2EEE8', m: sm });
        O.push({ d: 'M-6 -10 L10 -4', stroke: '#F2EEE8', w: 2, op: .8, m: sm });
      };
      const sx1 = tx + 4 * s, sy1 = ty + 96 * s, sx2 = tx + 44 * s, sy2 = ty + 112 * s;
      O.push({ d: `M${tx} ${ty} Q${tx} ${ty + 40 * s} ${sx1} ${sy1 - 14 * s} M${tx} ${ty} Q${tx + 20 * s} ${ty + 40 * s} ${sx2} ${sy2 - 14 * s}`, stroke: '#E8E2D8', w: 1.6 * s, op: .8 });
      shoe(sx1, sy1, 72, '#D9455A'); shoe(sx2, sy2, 84, '#C93A4F');
    }

    // ---- hearts: the classic heart curve, rising and fading ----
    if (e.hearts) {
      const heart = (hx, hy, k) => { let d = ''; for (let i = 0; i <= 60; i++) { const t = i / 60 * Math.PI * 2;
        d += (i ? 'L' : 'M') + (hx + k * 16 * Math.sin(t) ** 3).toFixed(1) + ' ' + (hy - k * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))).toFixed(1); } return d + 'Z'; };
      [[CX + W * .42, cy - H * .62, .9, .9], [CX + W * .58, cy - H * .95, .6, .55], [CX + W * .3, cy - H * 1.1, .45, .3]].forEach(([hx, hy, k, o]) => {
        add({ d: heart(hx, hy, k * e.hearts), fill: '#FF8FA3', op: o * .5, blur: 6 });
        add({ d: heart(hx, hy, k * e.hearts), fill: '#FFB3C0', op: o });
      });
    }

    // ---- finishing light ----
    add({ d: body, fill: 'none', stroke: 'url:topEdge', w: 3, clip: 'body' });
    add({ d: body, fill: 'none', stroke: 'url:rim', w: 3.5, blur: 1.5 });
    if (ghost) for (const o of O) if (o.d || o.text != null) o.op = (o.op ?? 1) * .62;   // everything see-through
    if (e.layer === 'arms') return { grads, ops: O.filter(o => o.fa), anchors: A };
    return { grads, ops: O, anchors: A };
  }

  const anchor = (e, o, name) => ops(e, o).anchors[name];
  // just the front arms (cradle / scroll hug), to draw over a cradled figure: body with layer:'body', figure, then this
  const frontArms = (e, o = {}) => ops(e, { ...o, layer: 'arms' });
  // the body's clip lives on the op (clipSelf), so the model only needs grads + ops
  const svg = (e, o, uid) => G.VEC.svg(ops(e, o), uid);
  G.CLAWD = { ops, svg, anchor, frontArms, EXPR, CL, FORMS };
})(typeof window !== 'undefined' ? window : globalThis);
