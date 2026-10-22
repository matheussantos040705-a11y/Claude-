// cast.js: Pip, the human who keeps saying no, plus shared props (doors, handset, pencil) and the karaoke bar.
// Pip is adapted from the Researcher in PDoomVideo/src/cast.js: hoodie and beanie instead of a lab coat, and the
// pencil behind the ear (the motif).
// pip(x, y, s, o): (x, y) is the ground point between the feet, s is the unit (height ≈ 13.5s to the beanie top).
// Local coords: feet y 0, hips -2.3s, shoulders (±1.75s, -7.6s), head centre (0, -10.7s) radius 2.35s.
// Arm angles as Clawd: 0 = straight out, + = up, about -1.25 = hanging. handL/handR hooks are called at the hand.
// Options: eyes ('dot','wide','narrow','closed','x','swirl','star','sleepy'), lookX/lookY, brows ('worried','angry','up'),
// mouth ('smile','o','O','flat','wobble','grin','smirk'), aL/aR, dy/sq/rot/flip, walk, run, hatUp (0..1: the beanie pops
// off and the hair stands up), hoodie/pants colours, emote/emoteK, pencil (behind the ear, default true), draw/handL/handR.

const SKIN = '#E9B28E', HAIR = '#3A2B38', HOODIE = '#3A9C98', PANTS = '#3D4A7A', BEANIE = '#E8AA38';

function pip(x, y, s, o = {}) {
  const id = o.boilKey ?? ('pip' + (++CLAWD_N)), rs = p => boilSeed(id + p);
  const sw = clamp(s / 13, .45, 2.2), J = s * .05, sq = (o.sq || 0);
  const hood = o.hoodie || HOODIE, pants = o.pants || PANTS, skin = o.skin || SKIN, hair = o.hair || HAIR;
  rs('sh');
  if (!o.noShadow) paint(ellPts(x, y + s * .1, s * 3.2, s * .7, 18), { fill: PAL.ink, fillOp: 80, bleed: .2, tex: .3, border: .1, ink: null });

  push();
  translate(x + (o.dx || 0) * s, y + (o.dy || 0) * s);
  if (o.rot) rotate(o.rot);
  scale((o.flip ? -1 : 1) * (1 + sq * .5), 1 - sq);

  const leg = (side, i) => {
    rs('leg' + i);
    let h = 2.4, a = 0;
    if (o.walk != null) { const ph = Math.sin((o.walk + (i ? .5 : 0)) * TAU); if (ph > 0) h -= ph * .8; a = Math.sin((o.walk + (i ? .5 : 0)) * TAU) * .25; }
    if (o.run != null) a = Math.sin((o.run + (i ? .5 : 0)) * TAU) * .55;
    if (o.legs) a = o.legs[i];
    push(); translate(side * .8 * s, -2.3 * s); rotate(a);
    paint(rectPts(-.48 * s, 0, .96 * s, h * s, J), { wash: pants, fill: PAL.indigo, fillOp: 50, tex: .5, ink: PAL.ink, sw: sw * .7 });
    paint(ellPts(side * .15 * s, h * s, .8 * s, .4 * s, 12), { wash: o.shoes || PAL.cream, ink: PAL.ink, sw: sw * .5 });
    pop();
  };
  leg(-1, 0); leg(1, 1);

  const arm = (side, a, hook) => {
    rs('arm' + side);
    push(); translate(side * 1.75 * s, -7.6 * s); rotate(side < 0 ? a : -a);
    paint(rectPts(side < 0 ? -3 * s : 0, -.46 * s, 3 * s, .92 * s, J), { wash: hood, fill: mixCol(hood, PAL.ink, .3), fillOp: 45, tex: .5, ink: PAL.ink, sw: sw * .7 });
    translate(side * 3.2 * s, 0);
    paint(ellPts(0, 0, .55 * s, .55 * s, 12), { wash: skin, ink: PAL.ink, sw: sw * .6 });
    if (hook) { if (side < 0) scale(-1, 1); hook(s, sw); }
    pop();
  };
  arm(-1, o.aL ?? -1.25, o.handL); arm(1, o.aR ?? -1.25, o.handR);

  rs('body');
  const body = [[-2 * s, -8.3 * s], [2 * s, -8.3 * s], [2.35 * s, -2.1 * s], [-2.35 * s, -2.1 * s]];
  paint(body, { wash: hood, fill: mixCol(hood, PAL.ink, .25), fillOp: 55, bleed: .08, tex: .7, border: .6, ink: null });
  paint(rectPts(-1.3 * s, -4.9 * s, 2.6 * s, 1.3 * s, J * .5), { fill: mixCol(hood, PAL.ink, .35), fillOp: 120, ink: PAL.ink, sw: sw * .45 }); // pocket
  for (const dx of [-.35, .35]) inkLine([[dx * s, -8.1 * s], [dx * 1.2 * s, -6.7 * s]], sw * .5, PAL.cream, 'inkfine', 0);                // drawstrings
  paint(body, { ink: PAL.ink, sw: sw * .9 });

  // head
  rs('head');
  const hy = -10.7 * s, R = 2.35 * s, up = clamp(o.hatUp || 0);
  paint(rectPts(-.45 * s, -8.9 * s, .9 * s, .9 * s), { wash: skin, ink: null });
  paint(ellPts(0, hy, R, R * .97, 26, J * .6), { wash: skin, fill: '#D9947A', fillOp: 50, tex: .6, border: .5, ink: PAL.ink, sw: sw * .85 });
  if (o.blush) for (const bx of [-1.55, 1.55]) paint(ellPts(bx * s, -9.9 * s, .55 * s, .3 * s, 12), { fill: PAL.rose, fillOp: 160, bleed: .2, ink: null });
  pipFace(s, sw, o);
  // hair tufts under the beanie; they stand up when the beanie pops
  for (let i = -2; i <= 2; i++) inkLine([[i * .8 * s, -12.4 * s], [i * 1.1 * s, (-12.7 - up * 2.2) * s]], sw * 1.1, hair, 'ink', 0);
  rs('beanie');
  push(); translate(0, -up * 3.2 * s); rotate(up * .5);
  const d = []; for (let i = 0; i <= 12; i++) { const a = Math.PI + i / 12 * Math.PI; d.push([Math.cos(a) * 2.55 * s, -11.6 * s + Math.sin(a) * 2.1 * s]); }
  paint(d, { wash: o.beanie || BEANIE, fill: PAL.clay, fillOp: 50, tex: .5, ink: PAL.ink, sw: sw * .8 });
  paint(rectPts(-2.75 * s, -12 * s, 5.5 * s, .95 * s, J * .3), { wash: mixCol(o.beanie || BEANIE, PAL.clay, .4), ink: PAL.ink, sw: sw * .7 });
  paint(ellPts(0, -13.9 * s, .6 * s, .6 * s, 10), { wash: PAL.cream, ink: PAL.ink, sw: sw * .5 });
  pop();
  if (o.pencil !== false) {   // the motif: a yellow pencil tucked behind the right ear
    rs('pencil');
    push(); translate(2.4 * s, -11.3 * s); rotate(-.9); pencilShape(s * .55, sw * .7); pop();
  }
  if (o.draw) o.draw(s, sw);
  pop();
  if (o.emote) emote(o.emote, x + (o.flip ? -1 : 1) * 3.4 * s, y + (o.dy || 0) * s - 13.8 * s, s * 1.1, o.emoteK ?? 1, o.emoteAge ?? T);
}

function pipFace(s, sw, o) {
  const e = (o.squint || 0) > .5 ? 'closed' : (o.eyes || 'dot'), blink = e === 'dot' && ((T * .8 + 1.3) % 3.7) < .12;
  const gy = -10.55 * s, lx = (o.lookX || 0) * .25 * s, ly = (o.lookY || 0) * .2 * s;
  for (const side of [-1, 1]) {
    const cx = side * .95 * s, cy = gy;
    if (e === 'dot' || e === 'narrow') {
      if (blink) inkLine([[cx - .3 * s, cy], [cx + .3 * s, cy]], sw * .8, PAL.ink, 'ink', 0);
      else paint(ellPts(cx + lx, cy + ly + (e === 'narrow' ? .08 * s : 0), .22 * s, e === 'narrow' ? .12 * s : .27 * s, 10), { wash: PAL.ink, ink: null });
      if (e === 'narrow') inkLine([[cx - .45 * s, cy - .12 * s], [cx + .45 * s, cy - .05 * s]], sw * .7, PAL.ink, 'ink', 0);
    } else if (e === 'wide') {
      paint(ellPts(cx, cy, .5 * s, .52 * s, 14), { wash: PAL.cream, ink: PAL.ink, sw: sw * .5 });
      paint(ellPts(cx + lx, cy + ly, .24 * s, .26 * s, 10), { wash: PAL.ink, ink: null });
    } else if (e === 'closed' || e === 'happy') inkLine([[cx - .35 * s, cy + .1 * s], [cx, cy - .22 * s], [cx + .35 * s, cy + .1 * s]], sw * .8, PAL.ink, 'ink', .4);
    else if (e === 'sleepy') { inkLine([[cx - .38 * s, cy + .05 * s], [cx + .38 * s, cy + .05 * s]], sw * .8, PAL.ink, 'ink', 0); paint(ellPts(cx + lx, cy + .16 * s, .2 * s, .1 * s, 8), { wash: PAL.ink, ink: null }); }
    else if (e === 'x') { inkLine([[cx - .3 * s, cy - .3 * s], [cx + .3 * s, cy + .3 * s]], sw * .7, PAL.ink, 'ink', 0); inkLine([[cx + .3 * s, cy - .3 * s], [cx - .3 * s, cy + .3 * s]], sw * .7, PAL.ink, 'ink', 0); }
    else if (e === 'star') paint(starPts(cx, cy, .55 * s * (1 + .15 * Math.sin(T * 13 + side)), .45, 5), { wash: PAL.ochre, ink: PAL.ink, sw: sw * .35 });
    else if (e === 'swirl') { const sp = []; for (let k = 0; k < 14; k++) { const a = k * .8 + T * 7 * side, r = k * .04 * s; sp.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } inkLine(sp, sw * .5, PAL.ink, 'inkfine', .6); }
    // round glasses
    brush.noFill(); brush.noWash(); brush.noHatch(); brush.set('inkfine', PAL.ink, sw * .8);
    brush.beginShape(0); for (const p of ellPts(cx, cy, .78 * s, .74 * s, 18)) brush.vertex(p[0], p[1]); brush.endShape(true);
  }
  inkLine([[-.18 * s, gy - .1 * s], [.18 * s, gy - .1 * s]], sw * .7, PAL.ink, 'inkfine', 0);
  const b = o.brows;
  if (b) for (const side of [-1, 1]) {
    const bx = side * .95 * s, by = -11.6 * s, tilt = b === 'worried' ? -side * .3 : b === 'angry' ? side * .35 : 0, lift = b === 'up' ? -.35 * s : 0;
    inkLine([[bx - .45 * s, by + lift + tilt * s * .6], [bx + .45 * s, by + lift - tilt * s * .6]], sw * .8, HAIR, 'ink', 0);
  }
  const m = o.mouth || 'smile', my = -9.05 * s;
  if (m === 'smile') inkLine([[-.55 * s, my - .1 * s], [0, my + .28 * s], [.55 * s, my - .1 * s]], sw * .7, PAL.ink, 'ink', .6);
  else if (m === 'smirk') inkLine([[-.5 * s, my + .05 * s], [.2 * s, my + .1 * s], [.6 * s, my - .2 * s]], sw * .7, PAL.ink, 'ink', .5);
  else if (m === 'o') paint(ellPts(0, my + .1 * s, .28 * s, .34 * s, 10), { wash: '#6A2A35', ink: PAL.ink, sw: sw * .4 });
  else if (m === 'O') paint(ellPts(0, my + .25 * s, .55 * s, .7 * s, 14), { wash: '#6A2A35', ink: PAL.ink, sw: sw * .5 });
  else if (m === 'flat') inkLine([[-.45 * s, my], [.45 * s, my]], sw * .7, PAL.ink, 'ink', 0);
  else if (m === 'wobble') inkLine([[-.7 * s, my], [-.35 * s, my - .18 * s], [0, my], [.35 * s, my - .18 * s], [.7 * s, my]], sw * .6, PAL.ink, 'ink', .3);
  else if (m === 'grin') paint([[-.8 * s, my - .15 * s], [.8 * s, my - .15 * s], [.5 * s, my + .5 * s], [-.5 * s, my + .5 * s]], { wash: '#6A2A35', ink: PAL.ink, sw: sw * .5, curv: .4 });
}

// ---------- props ----------
function pencilShape(s, sw) {   // along +x: eraser at 0, point at 6s
  paint(rectPts(0, -.45 * s, 1 * s, .9 * s), { wash: PAL.rose, ink: PAL.ink, sw: sw * .7 });
  paint(rectPts(1 * s, -.45 * s, .5 * s, .9 * s), { wash: '#B8B2A8', ink: PAL.ink, sw: sw * .6 });
  paint(rectPts(1.5 * s, -.45 * s, 3.6 * s, .9 * s), { wash: '#F2C53D', ink: PAL.ink, sw: sw * .7 });
  paint([[5.1 * s, -.45 * s], [6.2 * s, 0], [5.1 * s, .45 * s]], { wash: '#F1D2A8', ink: PAL.ink, sw: sw * .6 });
  paint([[5.85 * s, -.13 * s], [6.2 * s, 0], [5.85 * s, .13 * s]], { wash: PAL.ink, ink: null });
}
// The old office phone handset: centred, long axis along x.
function handset(s, sw, col = '#E27A92') {
  const P = [[-3.2, -.5], [-2.4, -1.2], [2.4, -1.2], [3.2, -.5], [3.4, .9], [2.2, 1.3], [1.8, .3], [-1.8, .3], [-2.2, 1.3], [-3.4, .9]].map(([a, b]) => [a * s, b * s]);
  paint(P, { wash: col, fill: mixCol(col, PAL.ink, .3), fillOp: 60, tex: .5, ink: PAL.ink, sw, curv: .4 });
}
// A door in a frame. open 0..1 swings the panel toward its hinge (left); interior(x, y, w, h) paints what's behind.
function door(x, y, w, h, open, col, interior, key) {
  boilSeed('door' + key);
  paint(rectPts(x - 14, y - 14, w + 28, h + 14, 2), { wash: mixCol(col, PAL.ink, .35), ink: PAL.ink, sw: 1.2 });
  if (open > .02 && interior) { boilSeed('in' + key); interior(x, y, w, h); }
  else paint(rectPts(x, y, w, h, 1), { wash: PAL.ink, washOp: 230, ink: null });
  boilSeed('panel' + key);
  const pw = w * (1 - .86 * open);
  if (pw > 6) {
    paint(rectPts(x, y, pw, h, 1.5), { wash: col, fill: mixCol(col, PAL.ink, .2), fillOp: 70, tex: .6, ink: PAL.ink, sw: 1.1 });
    paint(rectPts(x + pw * .14, y + h * .08, pw * .72, h * .36, 1), { fill: mixCol(col, PAL.ink, .3), fillOp: 90, ink: PAL.ink, sw: .5 });
    paint(rectPts(x + pw * .14, y + h * .52, pw * .72, h * .38, 1), { fill: mixCol(col, PAL.ink, .3), fillOp: 90, ink: PAL.ink, sw: .5 });
    paint(ellPts(x + pw * .84, y + h * .5, Math.max(4, pw * .05), 10, 10), { wash: PAL.ochre, ink: PAL.ink, sw: .6 });
  }
}

// ---------- karaoke ----------
// The current lyric in a painted ink bar at the bottom; words land one by one (spread by character count).
function karaoke(t) {
  if (!PROJECT.karaoke) return;
  const L = LY.find(l => t >= l[0] && t < l[1] + .1); if (!L) return;
  const [a, b, txt] = L, grow = easeOut((t - a) / .15) * (1 - ease((t - (b - .02)) / .12));
  if (grow < .02) return;
  const big = /^\(WE DO!\)$/.test(txt), size = big ? 120 : 60;
  const words = txt.split(' '), est = txt.length * size * .5, w = (est + 120) * grow, x0 = 960 - w / 2, y0 = big ? 860 : 966, hh = big ? 170 : 92;
  boilSeed('karaoke' + a);
  paint([[x0 + jit(6), y0 + jit(3)], [x0 + w / 2, y0 - 5], [x0 + w + jit(6), y0 + jit(3)], [x0 + w + 16, y0 + hh / 2], [x0 + w + jit(6), y0 + hh + jit(3)], [x0 + w / 2, y0 + hh + 4], [x0 + jit(6), y0 + hh + jit(3)], [x0 - 16, y0 + hh / 2]],
    { wash: PAL.ink, washOp: 215, fill: PAL.violet, fillOp: 55, tex: .7, border: .4, ink: null });
  if (grow < .85) return;
  const n = words.reduce((s, x) => s + x.length + 1, 0), dur = Math.max(.4, (b - a) * .85);
  let acc = 0;
  const shown = words.filter(wd => { const k = acc / n; acc += wd.length + 1; return t >= a + k * dur; }).length;
  const line = big ? txt : words.slice(0, shown).join(' ');
  if (line) letter(line, 960, y0 + hh / 2 + 3, size, '#FFF5E2', { screen: true, font: `${size}px "Permanent Marker", cursive`, ink: false });
}
