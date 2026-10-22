# Craft & Animation Principles in Code

Hand-painted code animation blends traditional 2D animation principles with deterministic procedural rendering. Every frame is rendered with p5.brush and p5.js using watercolor washes, bleeding edges, and boiling ink linework over an organic paper texture.

---

## 1. The Medium: Solid 2D, Brush Strokes & Boiling Ink

1. **Paint everything with p5.brush through `paint()` and `inkLine()`:**
   - Characters and foreground elements receive a flat `wash` color plus an organic `ink` outline.
   - Backgrounds and environments use soft watercolor `fill` shapes with bleeding borders (`bleed: 0.1–0.3`, `tex: 0.4–0.8`).
   - **Never** use raw digital shapes (`rect()`, `ellipse()`, `fill()`) or CSS gradients—they look sterile and break the painterly illusion.
2. **Boiling Linework:**
   - Hand-drawn cartoons wobble slightly between drawings because no two hand-inked frames are identical.
   - The engine boils randomness 12 times a second (`BOIL = 12`).
   - **Crucial Rule:** Call `boilSeed(key)` before each separate visual element (background layers, props, characters). If a moving element draws before a static background element without separate seeds, the changing random count shifts the random stream and causes still objects to jitter violently.
3. **Flat 2D Layering (Never Fake 3D Projection):**
   - Do **not** use `rotateY`, WebGL 3D matrices, or perspective transformations.
   - Turns are represented through **hand-drawn key views** (front → 3/4 → profile/side → back 3/4 → back) with motion smears between them (`spinView()`, `turn()`).
   - Depth is communicated through overlapping painter's order, scale, atmospheric color shift (farther = bluer, paler, lower contrast), and parallax.
4. **Lighting & Glows:**
   - p5.brush mixes pigment subtractively: painting yellow over blue yields green.
   - For light sources, lamps, stars, and magical energy, use `glow(x, y, r, color, alpha)`. It uses additive screen blending on an offscreen buffer before paper multiplication.
5. **Harmonious Palette:**
   - Avoid pure `#000000` or `#FFFFFF`.
   - Use `PAL.ink` (`#2B2233`) for line art and `PAL.paper` (`#F3EBDC`) / `PAL.cream` (`#FFF5E2`) for whites.

---

## 2. The 12 Principles of Character Animation in Code

Procedural animation often looks stiff and mechanical because code naturally moves all properties simultaneously at constant linear speeds. These classic principles breathe life into code-driven motion:

### 1. Anticipation
Before any major action, execute a smaller preparatory motion in the opposite direction:
- Crouch down before leaping upward (`jump()`).
- Pull an arm back before throwing a ball or pointing.
- Squint and widen before a shocked take (`take()`).
Anticipation warns the viewer's eye where to look before the action occurs.

### 2. Squash and Stretch
Living bodies squash on impact and stretch when moving at high speeds:
- Maintain approximate volume: when squashing vertically (`+sq`), widen horizontally (`bw = V.rx + sq * 1.2`, `bh = V.ry - sq * 1.4`).
- Rigid objects (machines, mugs) don't squash their chassis, but their passengers, antennae, or liquids do.

### 3. Staging & Silhouette
- Frame one focal action at a time.
- The silhouette must read cleanly against the background: ensure character silhouettes don't get lost in busy backgrounds.
- High contrast between character and backdrop.

### 4. Straight Ahead vs. Pose to Pose
- **Block key poses first:** In `STORYBOARD.md` and in code, define the resting, extreme, and landing poses.
- Render still contact sheets (`--sheet`) of key poses. Verify they read clearly *before* coding interpolation or motion curves.

### 5. Follow-Through and Overlapping Action
Parts of a body do not move at the same time:
- The head leads, the torso follows, and dangling appendages (arms, ears, tails, hats, hair) drag behind.
- When the body stops, attachments overshoot the resting position and oscillate to a halt using damped springs (`spring(t, t0, k, w)`).

### 6. Slow In and Slow Out (Easing)
Nothing in nature moves at constant velocity:
- Always run interpolation progress `k` through easing functions: `ease(k)`, `easeIn(k)`, `easeOut(k)`, or `backOut(k)`.
- Use linear progress only for endless conveyor belts or clock hands.

### 7. Arcs
Natural motion follows curved trajectories, not rigid Cartesian lines:
- Jumping characters, thrown objects, and swinging limbs travel on parabolic or circular arcs (`arcPt(p0, p1, h, k)`).

### 8. Secondary Action
Small supplementary movements enrich the primary action without distracting from it:
- A bouncing hat, blinking eyes, fluttering scarf, or leaves stirring in the wind while a character walks.

### 9. Timing & Modeling the Viewer's Eye
- **The golden rule of animation:** Code executes instantly; human perception takes time.
- Break every shot into **reads**:
  - Time for the eye to find the subject (0.3–0.5s).
  - Time to witness the action (0.2–0.5s).
  - Time to register the emotional reaction or consequence (0.6–1.5s).
- **Contrast fast action with held reaction:** A punch or jump can happen in 4 frames (0.16s), but the shocked reaction must hold for 24+ frames (1.0s+).

### 10. Exaggeration
- Subtle facial expressions or tiny bounces disappear in stylized animation.
- Push squash, lean angles, takes, and emote pops further than reality. If it feels slightly over-the-top on a still frame, it will read just right in motion.

### 11. Solid Drawing
- Consistent proportions across shots.
- Grounding: ensure feet firmly contact the ground plane and cast contact shadows.

### 12. Appeal
- Clean character designs with clear personality.
- Warm, tactile surface textures (paper tooth and watercolor pigment blooms).

---

## 3. Review & Verification Checklist

Before finalizing any animation, render contact sheets and verify:
- [ ] **No Unseeded Jitter:** Does static scenery stay still between boil frames?
- [ ] **No Dead Frames:** Is the camera gently drifting or is something always breathing?
- [ ] **Reads Landed:** Does every event have sufficient hold time for the audience to comprehend it?
- [ ] **Seams Covered:** Does every transition in and out have an iris, wipe, pan, or cut-on-action?
- [ ] **No Pure Text:** Are concepts communicated visually, metaphorically, or through hand-painted marks?
