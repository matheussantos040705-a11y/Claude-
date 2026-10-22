# F-curves, interpolation and the Graph Editor

An F-curve maps **time in frames (X)** to **property value (Y)**. Interpolation belongs to the
segment that *begins* at a keyframe and ends at the next one — so a key's `interpolation`,
`easing` and `handle_right` describe what happens **after** it, while `handle_left` shapes what
arrives **into** it.

---

## 1. Reading a curve as motion

For a scalar `y(t)`: value = `y(t)`, velocity = `y'(t)`, acceleration = `y''(t)`.

| Curve appearance | Motion |
|---|---|
| Horizontal | Stationary |
| Shallow slope | Slow change |
| Steep slope | Fast change |
| Straight diagonal | Constant scalar velocity |
| Slope steepening | Accelerating |
| Slope flattening | Decelerating (slow-in) |
| Local max or min | Velocity hits zero and reverses |
| Oscillation around a target | Overshoot and settle |
| Abrupt corner | Instantaneous velocity change — a hit or mechanical snap |
| Constant-interpolation step | Instantaneous pose change |

**For XYZ motion, perceived speed is not one channel's slope:**

```
v(t) = √( x'(t)² + y'(t)² + z'(t)² )
```

An X curve can look perfectly even while the object accelerates, because Y or Z is changing. This
is the single most common reason "the curve looks fine but the motion is wrong".

### Spacing

Spacing is the distance between successive equal-time samples of the moving object:

- Close together → slow
- Spreading apart → accelerating
- Evenly spaced → constant speed
- Bunching before a pose → slow-in
- Spreading away from a pose → slow-out

On a single F-curve this is **slope**, not horizontal key distance. Two keys ten frames apart can
produce fast or slow motion depending on their value difference and handles.

A classic slow-out/slow-in transition has: near-horizontal tangent leaving pose A → steep middle →
near-horizontal tangent arriving at pose B.

---

## 2. Interpolation modes

| Mode | Result | Use for | Risk |
|---|---|---|---|
| **Constant** | Holds the outgoing value until the next key | Blocking, visibility switches, stepped mechanical states | No interpolated motion |
| **Linear** | Constant rate of value change | Turntables, conveyors, clocks, parameter ramps, diagnostics | Hard speed change at each key; **multiple linear XYZ channels do not produce constant world-space speed** |
| **Bézier** | Cubic curve controlled by handles | Almost everything polished | Automatic handles overshoot or soften impacts silently |
| **Sine → Expo** | Preset acceleration/deceleration profiles | Motion graphics, repeatable transitions | Less art-directable than custom handles |
| **Back** | Moves past or initially away from the target | Graphic overshoot, anticipation-like motion | Synthetic on realistic subjects |
| **Elastic** | Decaying alternating overshoots | Springs, elastic UI, stylized props | Turns noisy or cartoonish fast |
| **Bounce** | Decaying collision rebounds | Dropped objects, graphic impacts | Preset timing rarely matches your physical scale — usually better to hand-key from the gravity table |

**T** in the Graph Editor sets interpolation on selected keys (applies from each key to the next).

---

## 3. Handle types

| Handle | Behaviour | Use for |
|---|---|---|
| **Automatic** | Blender computes a smooth tangent | Fast first pass where overshoot is acceptable |
| **Auto Clamped** | Smooth tangent that **avoids overshoot and direction reversal** | **The safe default.** Held poses, camera stops, blocking→spline |
| **Aligned** | Handles stay opposite (tangent continuity), lengths can differ | Polished work where arrival and departure timing differ |
| **Free** | Left and right move independently | Impacts, contacts, direction changes, asymmetric transitions |
| **Vector** | Straight segments | Linear-looking arrivals/departures, deliberate corners |

### Practical rule

- Convert to spline with **Auto Clamped**.
- Switch to **Aligned** where the motion flows continuously but incoming and outgoing timing differ.
- Break to **Free** at contacts, foot plants, catches, impacts and direction changes.
- Use plain **Automatic** only where you *want* generated overshoot — and then inspect every
  affected channel, because it will overshoot channels you were not thinking about.
- **Vector** or Linear where mechanical constancy is the design.

---

## 4. Auto-smoothing

`fcurve.auto_smoothing` controls how Automatic and Auto Clamped handles are computed.

| Mode | Behaviour | Trade-off |
|---|---|---|
| `'NONE'` | Uses directly adjacent key values | Predictable and **local**; acceleration can kink |
| `'CONT_ACCEL'` | Solves handles to reduce acceleration discontinuities across a broader span | Smoother with sparse keys, but **editing one key can change distant segments** |

Continuous Acceleration propagates until interrupted by a Free, Aligned, Vector or certain
Auto Clamped extremum.

Use `CONT_ACCEL` for sparse flowing curves (camera moves). Use `NONE` for dense hand-polished
work — locality is worth more than smoothness once you are polishing.

---

## 5. Easing equations

Normalized segment time `t = (f − f₀)/(f₁ − f₀)`, mapped as `y(f) = y₀ + (y₁ − y₀)·E(t)`.

From an ease-in base `F(t)`:

```
E_in(t)     = F(t)
E_out(t)    = 1 − F(1 − t)
E_in_out(t) = ½·F(2t)             for t < ½
              1 − ½·F(2 − 2t)     for t ≥ ½
```

| Family | `F(t)` ease-in form | Character |
|---|---:|---|
| **Sine** | `1 − cos(πt/2)` | Gentle, almost linear |
| **Quad** | `t²` | Moderate acceleration |
| **Cubic** | `t³` | Stronger ease |
| **Quart** | `t⁴` | Pronounced |
| **Expo** | `0` at `t=0`, else `2^(10(t−1))` | Very delayed start, forceful finish |
| **Back** | `t²((s+1)t − s)`, `s ≈ 1.70158` | Moves backward first |
| **Elastic** | `−2^(10t−10)·sin((10t − 10.75)·2π/3)` | Decaying spring |
| **Bounce** | `1 − B(1−t)` | Decaying parabolic rebounds |

Canonical ease-out bounce, `n = 7.5625`, `d = 2.75`:

```
B(t) = n·t²                          t < 1/d
       n·(t − 1.5/d)²   + 0.75       t < 2/d
       n·(t − 2.25/d)²  + 0.9375     t < 2.5/d
       n·(t − 2.625/d)² + 0.984375   otherwise
```

Blender exposes `back`, `amplitude` and `period` to modify Back and Elastic.

### Ease In vs Ease Out — the naming trap

The names describe **which end is eased**, not whether the object enters or leaves the shot.

| Desired | Easing |
|---|---|
| Starts at rest, accelerates away | `EASE_IN` |
| Arrives and stops gently | `EASE_OUT` |
| Starts and ends at rest | `EASE_IN_OUT` |
| Overshoots after approaching | `BACK` + `EASE_OUT` |
| Pulls back before launching | `BACK` + `EASE_IN` |

---

## 6. Graph Editor workflow

```
1. POSE + TIME in the Dope Sheet
   Storytelling poses, contacts, silhouettes, rhythm. Keys stay synchronized
   while broad timing is still moving.

2. ISOLATE channels
   Select one controller. Hide or mute everything irrelevant.

3. FRAME
   Home = frame all visible. Numpad . = frame selected.
   Normalization changes display scale only, never values.

4. TIMING BEFORE HANDLES
   G,X to move keys in time. S,X to scale timing around the cursor.
   Do not polish handles while the duration is still uncertain.

5. INTERPOLATION + HANDLES
   T = interpolation. V = handle type.
   Auto Clamped first, then break only the keys that need it.

6. READ SLOPES at the events that matter
   Foot plant, hand contact, direction reversal, camera stop, overshoot extremum.

7. CURVES AND VIEWPORT TOGETHER
   Curves diagnose velocity. The viewport judges appeal, weight, silhouette,
   arc and screen-space spacing. Neither alone is sufficient.

8. PLAYBLAST AT FINAL FPS
   Full speed, half speed, frame by frame. Scrubbing hides one-frame pops.
```

### Diagnostics

- **Convert a suspicious segment to Linear.** If the problem survives, it is timing or posing —
  not handles. This is the fastest way to stop tweaking curves that were never the issue.
- **Mute individual channels** to find unwanted wobble.
- **Inspect Euler channels** for sudden 360° jumps.
- Do not use Gaussian/Butterworth smoothing as a substitute for posing. They are cleanup tools.
- **Check camera-space, not just world-space.** An elegant world arc can be flat from the render
  camera — which is the only view that ships.

---

## 7. Blocking in Constant

Constant interpolation holds a pose until the next key. Block in it.

Why stepped blocking is worth the discipline:

- Exposes weak poses instead of hiding them behind interpolation
- Separates **pose quality** from **transition quality**
- Makes timing changes cheap
- Reveals whether anticipation, contact, recoil and settle poses actually exist
- Stops premature smoothness being mistaken for finished animation

### Blocking → spline

| Pass | Interpolation | Goal |
|---|---|---|
| Story poses | Constant | Readability, staging, silhouette, intent |
| Timing | Constant | Rhythm, pose duration, contact frames |
| Breakdowns | Constant | Arcs, favouring, leading part, path of action |
| First spline | Auto Clamped Bézier | Reveal real spacing without accidental overshoot |
| Timing repair | Bézier / Constant mix | Fix rushed transitions and dead holds |
| Curve polish | Aligned / Free where needed | Acceleration, contacts, reversals |
| Overlap | Offset keys, extra controls | Drag, follow-through, secondary motion |
| Cleanup | Mixed | Remove pops, slide, wobble, redundant keys |

**Do not spline every controller at once.** Root/camera first, then the main action, then torso and
head, then limbs, fingers, face, accessories. When something breaks you need to know which layer
did it.

---

## 8. Floaty — the diagnosis table

"Floaty" means forces, contacts or hierarchy are unclear. It is almost never "the curves are too
smooth".

| Cause | Fix |
|---|---|
| Symmetric Auto handles everywhere | Auto Clamped, then Aligned/Free to make arrivals and departures **asymmetric** |
| Equal timing everywhere | Contrast quick transitions against longer holds |
| Slow-in/slow-out on everything | Reserve easing for real acceleration. Sharpen departures or arrivals where force demands it |
| No clear contact frame | Add an exact plant/contact key; remove residual movement from the constrained part |
| All parts start and stop together | Offset torso, head, hands, cloth, accessories |
| Too many small keys | Delete non-essential keys; restore readable long curve phrases |
| Root drifts through a hold | Flatten or intentionally lock root/COG channels |
| Unplanned overshoot on every channel | Keep overshoot on the dominant direction; reduce it on orthogonal ones |
| Camera also eases heavily | Simplify the camera while judging body mechanics |
| Tiny counter-motions in rotation | Remove reversals not supported by anatomy or force |
| Linear timing with soft poses | Add anticipation/compression and decisive extremes — not just handle curvature |

For weight specifically: the center of mass must visibly accelerate under force · downward motion
generally feels faster under gravity unless resisted · contacts need compression, reaction or
momentum transfer · heavy things have **smaller** overshoot, slower reversals, longer settles ·
light or flexible things reverse quickly and oscillate more.

---

## 9. Rotation: Euler vs Quaternion

### Euler

Three ordered rotations. Easy to graph-edit, good for hinges, wheels, limited-axis controls and
intentional multi-turn spins. Sensitive to **rotation order**.

**Gimbal lock:** when the middle axis approaches 90°, two axes align and a rotational degree of
freedom is effectively lost — producing discontinuous interpolation.

Mitigations: choose a rotation order whose *middle* axis changes least · split complex motion
across parent controls · use Euler filtering / compatible keying · avoid unnecessary full
revolutions on multiple channels.

### Quaternion

WXYZ. No gimbal lock. Correct for free 3D orientation, tumbling objects, shoulders, flying cameras.

Harder to graph-edit (four coupled values for one rotation). Favours the *shortest* orientation
transition — so use Euler or rig hierarchy when you deliberately want multi-turn spins. Keep them
normalized; `q` and `−q` are the same orientation with opposite channel values, so avoid gratuitous
sign flips.

```python
obj.rotation_mode = 'QUATERNION'
obj.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)   # W, X, Y, Z
```

### For cameras

- Build a **parented hierarchy**: dolly → pan/yaw → tilt → roll/shake.
- Let separate controls carry separate rotational responsibilities.
- Use **Damped Track** or **Track To** for aim rather than keying camera Euler channels to chase a
  target.
- A Blender camera looks along local **−Z**, with local **+Y** as screen up. Roll is around local Z.
- Quaternion for unconstrained flying/tumbling cameras; Euler on dedicated pan/tilt/roll controls
  where the channels should stay artist-readable.

---

## 10. Arcs — checking them

Most organic movement follows curved paths because limbs rotate around joints and forces combine.

**Motion Paths** — select the object or bones, `Object/Pose Properties → Motion Paths`, choose the
range, `Calculate Paths` / `Update Paths`.

Look for: accidental corners · flat spots · hooks immediately before contact · uneven equal-frame
spacing · arc reversals the action does not justify · wrist/ankle/head/COM paths fighting each other.

Motion Paths track **origins and bone joints**, not arbitrary points on a deforming mesh. For a hand
or a prop tip, calculate the path of the appropriate control, or parent a dedicated marker Empty.

**Onion skinning** is a Grease Pencil feature, not general mesh ghosting. For 3D subjects: use
Motion Paths for trajectory and spacing, pose-bone paths for hands/feet/hips/head, temporary
duplicates when you need real silhouette ghosts, and a camera-view Grease Pencil layer when you
want to draw over the arc.

For hard-surface work, remember §7 of `motion-principles.md`: **do not add decorative arcs to a
linear rail.** The mechanism dictates the path.

---

## 11. Actions and the NLA

Actions are the animation containers; the NLA layers reusable strips that reference them.

| Element | Use |
|---|---|
| **Action** | One reusable performance: `Walk`, `Idle`, `CameraPush`, `DoorOpen` |
| **NLA strip** | An instance of an Action at a particular scene time |
| **NLA track** | A layer or sequence of strips |
| **Strip scale / repeat** | Retiming and looping |
| **Blend type / influence** | Replace, Add, Subtract, Combine |
| **Tweak Mode** | Edit a strip's Action in NLA context |

Keep cyclic clips' first and last poses compatible, but **avoid duplicating a perceptually
identical frame** if the runtime loops end-to-start — that is the one-frame hitch on every repeat.

An Action's manual frame range describes the intended clip and guides strip creation and exporters,
but it does not change evaluation.
