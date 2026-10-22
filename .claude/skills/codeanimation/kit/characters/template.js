// kit/characters/template.js: Blueprint for creating ANY custom character or object.
//
// In code animation, characters are not 3D meshes: they are hand-drawn 2D rigs defined
// by silhouette points, flat wash fills, boiling ink outlines, and key views.
//
// Every character needs:
//   1. A scale unit `u` (e.g., body width = 10u, height = 8u).
//   2. Ground anchor (x, y) located between the feet / base.
//   3. Key views: front, 3/4 (q), side (profile), back.
//   4. Facial feature anchors (eyes, mouth, cheeks, emotes).
//   5. Limbs and accessories with prop attachment points.
//   6. An idle/emotion function returning pose offsets locked to PROJECT.bpm.

/**
 * Example Custom Character: "Pebble" (a round curious creature / robot / mascot)
 */
const PEBBLE_VIEWS = {
  front: { cx: 0, rx: 5, ry: 4.5, eyeSpread: 2.2, eyeY: -5, mouthY: -3.5, arms: [[-4.5, -1], [4.5, 1]] },
  q:     { cx: 0.8, rx: 4.8, ry: 4.5, eyeSpread: 1.8, eyeY: -5, mouthY: -3.5, arms: [[-4.2, -1], [4.8, 1]] },
  side:  { cx: 1.2, rx: 4.2, ry: 4.5, eyeSpread: 0, eyeY: -5, mouthY: -3.5, arms: [[2.5, 1]] },
  back:  { cx: 0, rx: 5, ry: 4.5, eyeSpread: 0, eyeY: -5, mouthY: -3.5, arms: [[-4.5, -1], [4.5, 1]], back: true }
};

/**
 * Draw the character at ground point (x, y) with unit size u.
 * @param {number} x - Ground X position
 * @param {number} y - Ground Y position
 * @param {number} u - Size unit in world pixels
 * @param {object} o - Pose, view, mood, and attachment options
 */
function customCharacter(x, y, u, o = {}) {
  const id = o.boilKey ?? 1;
  const rs = part => boilSeed(`char_${id}_${part}`);

  const V = PEBBLE_VIEWS[o.view] || PEBBLE_VIEWS.front;
  const dy = (o.dy || 0) * u;
  const dx = (o.dx || 0) * u;
  const sq = (o.sq || 0); // squash & stretch factor: positive squashes, negative stretches

  x += dx;
  const groundY = y;
  const centerY = y - 4.5 * u + dy;

  push();
  translate(x, groundY);
  if (o.flip) scale(-1, 1);
  if (o.rot) rotate(o.rot);

  // 1. Shadow (on ground)
  if (!o.noShadow) {
    rs('shadow');
    const sw = (5 + sq * 1.5) * u, sh = (1.5 - sq * 0.4) * u;
    paint(ellPts(0, 0, sw, sh, 16, 1), { fill: PAL.ink, fillOp: 35, bleed: 0.2, ink: null });
  }

  // 2. Far limbs (drawn behind body)
  rs('far_limbs');
  // ... draw legs or back arm here ...

  // 3. Main body
  rs('body');
  const bw = (V.rx + sq * 1.2) * u;
  const bh = (V.ry - sq * 1.4) * u;
  const bodyCol = o.color || PAL.clay;
  const bodyPts = ellPts(V.cx * u, -4.5 * u + dy, bw, bh, 24, 1.2);
  paint(bodyPts, { wash: bodyCol, fill: mixCol(bodyCol, PAL.night, 0.3), fillOp: 70, bleed: 0.1, tex: 0.5, ink: PAL.ink, sw: 1.2 });

  // 4. Face (if not facing back)
  if (!V.back) {
    rs('face');
    const faceX = V.cx * u;
    const faceY = V.eyeY * u + dy;

    // Eyes
    if (V.eyeSpread > 0) {
      // Two eyes
      for (const s of [-1, 1]) {
        const ex = faceX + s * V.eyeSpread * u + (o.lookX || 0) * 0.4 * u;
        const ey = faceY + (o.lookY || 0) * 0.4 * u;
        if (o.squint) {
          inkLine([[ex - 0.7 * u, ey], [ex + 0.7 * u, ey]], 1.2, PAL.ink);
        } else {
          paint(ellPts(ex, ey, 0.8 * u, 1.2 * u, 12, 0.4), { wash: PAL.ink, ink: null });
          // Highlight
          paint(ellPts(ex - 0.2 * u, ey - 0.4 * u, 0.25 * u, 0.25 * u, 8), { wash: PAL.cream, ink: null });
        }
      }
    } else {
      // One profile eye
      const ex = faceX + 1.2 * u + (o.lookX || 0) * 0.4 * u;
      const ey = faceY + (o.lookY || 0) * 0.4 * u;
      paint(ellPts(ex, ey, 0.8 * u, 1.2 * u, 12, 0.4), { wash: PAL.ink, ink: null });
    }

    // Mouth
    const my = V.mouthY * u + dy;
    if (o.mouth === 'smile' || !o.mouth) {
      inkLine([[faceX - 0.8 * u, my - 0.2 * u], [faceX, my + 0.4 * u], [faceX + 0.8 * u, my - 0.2 * u]], 1, PAL.ink, 'ink', 0.6);
    } else if (o.mouth === 'open') {
      paint(ellPts(faceX, my + 0.3 * u, 0.8 * u, 0.9 * u, 12), { wash: PAL.clayDk, ink: PAL.ink, sw: 1 });
    }
  }

  // 5. Near limbs & Prop attachment
  rs('near_limbs');
  if (o.armR) {
    push();
    translate(4.5 * u, -4.5 * u + dy);
    o.armR(u, 1);
    pop();
  }

  // 6. Custom decoration hook
  if (o.draw) {
    push();
    translate(0, -4.5 * u + dy);
    o.draw(u, 1);
    pop();
  }

  pop();
}

/**
 * Idle animation helper: calculates secondary breathing and bounce.
 */
function charIdle(t, tempo = 1) {
  const p = frac(bpOf(t) * tempo);
  const breath = Math.sin(t * 2.5);
  return {
    dy: -Math.sin(p * Math.PI) * 0.3,
    sq: Math.sin(p * Math.PI) * 0.15 + breath * 0.05
  };
}
