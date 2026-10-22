# Designing & Rigging Any Character or Subject

In this framework, characters are procedural 2D puppets rendered in watercolor and ink. Whether designing a human, an animal, a mascot, a robot, or a personified inanimate object (a dancing coffee cup, a floating cloud, a walking computer), the architecture remains identical.

---

## 1. Anatomy of a Code Rig

Every character rig is built around 6 components:

1. **The Scale Unit `u`:**
   All coordinates are defined in multiples of `u` (world pixels per unit).
   - If a character's body is 10 units wide and 8 units tall, setting `u = 24` draws a 240×192 px character (ideal for medium shots).
   - In close-ups, scale `u` up to `40–70`. In wide establishing shots, scale `u` down to `12–16`.
2. **Ground Anchor `(x, y)`:**
   Always place `(x, y)` at the ground point directly between the feet or base of the object.
   - Legs or treads reach down to `y = 0`.
   - The body torso sits at negative Y coordinates (e.g., `-8u .. -2u`).
   - This ensures grounding, jumping (`dy`), and floor shadows work automatically.
3. **Key Views (Drawn Perspectives):**
   Characters rotate by switching between hand-crafted key views:
   - `front`: Facing directly toward camera. Full face, both arms visible, legs symmetrical.
   - `q` (3/4 view): Facing diagonally right. Face shifted right (`+cx`), far side in darker shadow, far arm behind body.
   - `side` (profile): Facing 90° right. Single profile eye, forward snout/chin, near arm leading.
   - `qback`: 3/4 from behind. No face, hair/hat back, darker side strip.
   - `back`: Facing directly away. No face.
   - Mirroring: Set `flip: true` to face screen-left.
4. **Facial Feature Anchors:**
   - Eye coordinates relative to face center.
   - Look direction offsets: `lookX` and `lookY` ranging from `-1` to `+1`.
   - Squint progress: interpolates eyes to horizontal ink slashes.
   - Mouth states: smile, open, frown, grin, gasp, talking frames.
5. **Limbs & Prop Attachment Points:**
   - Define arm shoulder pivot points `(ax, ay)`.
   - Arm tip hook: `armR(u, sw)` and `armL(u, sw)` are invoked in local arm coordinates (+X points outward along the limb). Props drawn at `(0, 0)` naturally follow the hand.
6. **Emotions & Idle Motions:**
   - Rhythmic breathing, leg bounces, and body sways tied to `PROJECT.bpm`.

---

## 2. Step-by-Step: Rigging a New Character

### Step 1: Establish the Silhouette
Pick primitive point generators from `core.js`:
- Rounded rectangles: `rrPts(x, y, w, h, r, jitter)`
- Ellipses: `ellPts(cx, cy, rx, ry, n, jitter)`
- Tapered paths / appendages: `ribbon([[x0,y0], [x1,y1], ...], w0, w1)`
- Smooth curves: `through([[x0,y0], ...])`

Keep the silhouette readable in solid black. Avoid visual clutter.

### Step 2: Define the View Map
```javascript
const ROBOT_VIEWS = {
  front: { headX: 0, bodyW: 8, bodyH: 9, eyeSpread: 2.5, arms: [[-4.5, 'L'], [4.5, 'R']] },
  q:     { headX: 1.2, bodyW: 7.5, bodyH: 9, eyeSpread: 1.8, arms: [[-4, 'L'], [4.8, 'R']] },
  side:  { headX: 2.0, bodyW: 5.5, bodyH: 9, eyeSpread: 0,   arms: [[2.2, 'R']] },
  back:  { headX: 0, bodyW: 8, bodyH: 9, eyeSpread: 0, back: true, arms: [[-4.5, 'R'], [4.5, 'L']] }
};
```

### Step 3: Implement Turns
Use `spinView(a)` and `turn(t, t0, t1, a0, a1)` to smoothly step through the key views with a momentary horizontal motion smear during the transition.

### Step 4: Add Props & Costume Pieces
Use the `draw(u, sw)` body hook to layer costumes, medals, backpacks, or equipment directly over the torso, squashing and rotating in lockstep with the body.

---

## 3. Personifying Inanimate Objects & Non-Human Subjects

Any subject can become a lively animated character:
- **Vehicles (Cars, Ships, Planes):**
  - Chassis squashes downward on acceleration, pitches upward on braking.
  - Headlights act as eyes with pupil pupils; bumper acts as the mouth.
  - Exhaust puffs use additive `glow()` and expanding `ellPts`.
- **Creatures & Animals (Birds, Cats, Dogs):**
  - Tapered tail with `ribbon()` reacting via secondary spring motion (`spring(t, t0)`).
  - Ear pivots reacting with slight delay to head movements.
- **Abstract Objects (Lightbulb, Coffee Cup, Computer):**
  - Steam / wires / cords trailing with `ribbon()`.
  - Dial needles or screen faces emoting dynamically.
