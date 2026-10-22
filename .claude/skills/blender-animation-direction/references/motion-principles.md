# Motion principles for hard-surface and product animation

The 12 principles were written for drawn characters. Applied literally to a rigid product they
produce rubber. Applied correctly they produce **causality, mass, constraint and function** —
which is what a product film is selling.

Before animating anything, establish: real dimensions and units · mass and center of mass · pivot,
hinge, rail and contact constraints · actuator force or torque · material stiffness, damping,
friction, restitution · **which parts are truly rigid and which can flex**.

---

## 1. The 12 principles on rigid objects

### 1 — Squash and stretch

**Do not scale a rigid housing.** Ever. Rigid shells stay at scale `(1,1,1)`.

Compression lives where it physically can: tires, seals, rubber feet, suspension, springs, foam,
sheet metal, flexible housings, fluid bags, telescoping assemblies. A rigid product achieves a
"squash" *silhouette* by folding its joints inward and a "stretch" silhouette by extending them.

For extremely fast action, motion blur or a one-frame graphic smear substitutes for literal
deformation.

Where stylized deformation *is* wanted, preserve volume: under axis scaling, keep `sx·sy·sz ≈ 1`.
Keep contact points planted. No unexplained interpenetration.

### 2 — Anticipation

Show the cause before the effect. A latch retracts before a lid opens. Suspension loads before
launch. Gears take up backlash. A motor twitches or spins up. An LED changes state. A valve opens
before fluid moves. A robot arm rotates toward its work axis before extending.

Separate the two kinds:

- **Physical anticipation** — preload, pressure buildup, backlash. Only valid if the mechanism can
  actually preload or flex.
- **Communicative anticipation** — a light cue, a camera move, a highlight travelling toward the
  part that is about to act. Always available, even on perfectly rigid geometry.

A tiny reverse motion on something that physically cannot compress is a lie the viewer feels
without being able to name.

### 3 — Staging

One mechanical event at a time. Choose the angle that exposes the hinge, contact surface, assembly
path or transformation.

**Verify in clay render and in silhouette before materials exist.** If the action does not read
without reflections, materials are hiding a staging problem, not solving one.

Avoid: tangencies · hidden contacts · competing reflections · simultaneous motions of equal visual
weight.

### 4 — Straight-ahead vs pose-to-pose

- **Pose-to-pose** for engineered motion: define locked, released, maximum-travel, contact and
  settled states, then compute the transitions.
- **Straight-ahead / simulation** for cables, cloth, liquid, debris, vibration — anything whose
  result depends on prior frames.

Almost all product work is a **hybrid**: block the primary rigid mechanism pose-to-pose, then layer
procedural secondary behaviour on top.

**Never let interpolation move a component through a mechanical stop** or violate an assembly
constraint. Bézier handles cheerfully drive a piston through its own cylinder head.

### 5 — Follow-through and overlapping action

When the chassis stops, the subordinate systems do not: suspension compresses, a lid overshoots on
its hinge, a cable bows, cloth trails, liquid sloshes, a knob vibrates, a fan coasts down.

**Animate in causal order:** driver → rigid assembly → compliant mounts → cables/cloth/liquid.
Each layer gets its own delay, overshoot amplitude, oscillation frequency and damping.

A hard mechanical stop can be genuinely abrupt — but its *attachments* must respond afterwards.

### 6 — Slow in and slow out

This means **acceleration and deceleration**, not "smooth Bézier handles".

- Motors typically run acceleration → cruise → deceleration.
- Premium mechanisms use jerk-limited S-curves (acceleration itself ramps).
- Impacts, solenoids and hard stops change velocity sharply — a symmetric ease is wrong there.
- **Gravity is constant downward acceleration, not a symmetric ease.**

Plot velocity and acceleration, not only position:

| Motion | Position curve |
|---|---|
| Constant velocity | Linear |
| Constant acceleration | Parabolic |
| Jerk-limited controller | Designed S-curve |

### 7 — Arcs

Use the trajectory the **mechanism** dictates. Hinge points move in circles. Crank linkages trace
constrained curves. Projectiles are parabolic. Sliders move in straight lines. A free rigid body
translates while rotating about its center of mass.

**Do not add decorative curvature to a linear rail or a piston.** That is the hard-surface
equivalent of a floating character.

Track the correct point: a door handle follows an arc around the hinge even though the hinge itself
never moves. Check in orthographic views. Verify contacts do not slide accidentally.

### 8 — Secondary action

Subordinate events that *clarify* the main function: a gauge needle rises as pressure builds, vents
open during cooling, an indicator pulses while charging, internal gears turn as a panel deploys, a
controlled reflection reveals a surface change.

Secondary action must **explain**, not compete. If the viewer looks at it first, reduce its
amplitude, contrast, speed or screen area. And keep it causally synchronized — a needle that rises
before the pressure does is worse than no needle.

### 9 — Timing

Timing conveys scale, power, precision and apparent weight.

**Mass alone does not specify timing.** A large assembly accelerates more slowly than a small one
*under the same applied force* — but you also need force, torque, friction, travel distance,
velocity limits and control programming.

Derive a first pass from `F = ma`, `τ = Iα`, gravity or measured reference. Then adjust only within
the intended level of realism. Extra frames do not merely slow motion — they change the apparent
**material, load and purpose** of it.

### 10 — Exaggeration

In advertising, exaggerate what the product **already does**: increase temporal separation between
release and deployment, slightly enlarge permissible joint travel, strengthen a controlled
overshoot, simplify a transformation, amplify parallax, hold the hero state longer.

Preserve product identity, proportions, mating relationships and advertised capabilities. Prefer
exaggerating **clarity, timing, lighting and camera perspective** over inventing impossible
deformation. Keep it internally consistent rather than sprinkled everywhere.

### 11 — Solid form

Consistent volume, scale, perspective, balance, center of mass and construction. The product must
be the same object from every angle: wheels stay circular, panels keep thickness, pivots stay
fixed, textures do not slide, parts keep believable clearance.

Keep rigid transforms at scale `(1,1,1)`. Apply transforms before rigging. Inspect silhouettes,
normals, thickness, contact shadows, intersections, and whether the center of mass is actually
supported. If stylized deformation is used, it must **return exactly to the manufactured form**.

### 12 — Appeal

For products: strong silhouette, coherent proportions, satisfying fit and finish, legible function,
deliberate material response, confident timing, a memorable hero pose.

**Precision itself is appealing.** Clean alignment, synchronized closure and a decisive final lock
usually outperform more movement. Remove jitter, accidental symmetry, weak poses and needless
secondary activity.

Appeal means compelling clarity — not cuteness.

---

## 2. Physics of timing

| Quantity | Formula | Use |
|---|---:|---|
| Frame duration | `Δt = 1/fps` | 24 fps → 0.041667 s |
| Frames for an event | `N = t · fps` | Keep it continuous while calculating; round only when placing keys |
| Velocity | `v = v₀ + a·t` | Speed after an acceleration interval |
| Position | `x = x₀ + v₀t + ½at²` | Physically correct frame spacing |
| Acceleration | `a = F_net / m` | Heavier accelerates less under the same force |
| Time to change speed | `t = Δv/a = m·Δv/F_net` | Only answerable when force **and** target speed are known |
| Momentum | `p = m·v` | How hard it is to stop or redirect |
| Impulse | `J = ∫F dt = Δp` | Relates collision force to stopping time |
| Angular acceleration | `α = τ / I` | Rotational counterpart; geometry enters via `I` |
| Rotation | `θ = θ₀ + ω₀t + ½αt²` | Doors, wheels, knobs, rotors, robot joints |

### Frame spacing under constant acceleration

From rest, at frame `n`: `xₙ = ½ · a · (n/fps)²`.

Per-frame distances follow the ratio:

```
1 : 3 : 5 : 7 : 9 : 11 ...
```

A physically accelerating object shows **progressively increasing** frame-to-frame gaps. A generic
symmetric Bézier ease is not equivalent unless it happens to match the required acceleration.

### Free fall at 24 fps

`t = √(2h/g)`, `N = 24·t`, with `g = 9.81 m/s²`.

| Height | Time | Frames @24 | Round | Impact speed |
|---:|---:|---:|---:|---:|
| 0.10 m | 0.143 s | 3.43 | 3 | 1.40 m/s |
| 0.25 m | 0.226 s | 5.42 | 5 | 2.21 m/s |
| 0.50 m | 0.319 s | 7.66 | 8 | 3.13 m/s |
| 1.00 m | 0.452 s | 10.84 | 11 | 4.43 m/s |
| 2.00 m | 0.639 s | 15.33 | 15 | 6.26 m/s |
| 5.00 m | 1.010 s | 24.23 | 24 | 9.90 m/s |
| 10.00 m | 1.428 s | 34.27 | 34 | 14.01 m/s |

**Mass does not change fall time.** All masses fall at the same acceleration. Do not float a light
object — that is the single most common weight error in product animation.

At 30 fps, multiply frame counts by 1.25.

### How mass affects acceleration time

`t = m·Δv / F_net`. Illustration at 20 N net force, target +2 m/s:

| Mass | a | Time | Frames @24 |
|---:|---:|---:|---:|
| 0.10 kg | 200 m/s² | 0.010 s | 0.24 |
| 0.50 kg | 40 m/s² | 0.050 s | 1.20 |
| 1.00 kg | 20 m/s² | 0.100 s | 2.40 |
| 2.00 kg | 10 m/s² | 0.200 s | 4.80 |
| 5.00 kg | 4 m/s² | 0.500 s | 12.00 |
| 10.00 kg | 2 m/s² | 1.000 s | 24.00 |

Real mechanisms add friction, motor torque curves, gearing, controller limits and load deformation.

### Rest-to-rest move

Over distance `d`, equal max acceleration and deceleration `a`, no cruise phase:

```
T = 2·√(d/a)          v_peak = √(a·d)
```

If the mechanism has a speed ceiling `v_max`, use accelerate → cruise → decelerate instead. A
polished precision machine uses jerk-limited transitions so acceleration ramps rather than stepping.

---

## 3. Overshoot and settle patterns

Production starting points. Frame offsets are relative to the start of the main move.

| Character | Value pattern | Keys @24 | Keys @30 |
|---|---|---:|---:|
| Snappy graphic | 0 → 105–112% → 97–99% → target | 0, 6, 9, 13 | 0, 8, 11, 16 |
| General character/prop | 0 → 103–108% → 98–99% → target | 0, 12, 16, 22 | 0, 15, 20, 28 |
| Heavy | 0 → 101–104% → 99–99.5% → target | 0, 16, 22, 32 | 0, 20, 28, 40 |
| Light springy | 0 → 110–120% → 92–97% → 102–105% → target | 0, 8, 12, 16, 22 | 0, 10, 15, 20, 28 |
| Camera stop | 0 → 100–102% → 99.5–100% → target | 0, 18, 23, 30 | 0, 23, 29, 38 |

Worked example at 24 fps, moving 0 → 10:

```
f1   = 0.0
f13  = 10.6    # 6% overshoot
f17  = 9.8     # 2% undershoot
f23  = 10.0    # settle
```

**The overshoot key must not equal the target value.** To show real overshoot the curve has to
cross the target, reach an extremum beyond it, reverse, and decay back. A key *at* the target
followed by another key at the target is a hold, not an overshoot.

### Impact pattern

For a contact at frame `C`:

```
C-2 or C-1   pre-contact approach
C            contact
C+1 .. C+3   maximum compression / recoil
C+4 .. C+8   first recovery
C+8 .. C+16  residual settle
```

---

## 4. Follow-through delays

Behind the driver, at 24 fps (multiply by 1.25 for 30 fps):

| Part | Delay @24 | Note |
|---|---:|---|
| Chest / upper torso | 1–2 fr | Small delay preserves connection |
| Head | 2–4 fr | Often counter-rotates to stabilize gaze |
| Elbows / forearms | 2–5 fr | Depends on muscular intent |
| Hands / fingers | 3–6 fr | More delay when relaxed |
| Ponytail / soft accessory | 4–8 fr | Add reversal and decaying settle |
| Coat hem / loose cloth | 5–10 fr | Shape and drag matter more than uniform offset |
| Heavy rigid load | 2–5 fr | Small amplitude, clear inertia |

### How to implement

1. Animate and **approve** the primary control first.
2. Establish matching extrema on the follower.
3. Shift the follower's keys right by the chosen delay.
4. **Reduce or reshape the amplitude** — never merely clone the driver.
5. Add a later reversal and a smaller settle.
6. Make sure the follower returns because of the parent's force, not at an arbitrary time.

**Vary the delay per event.** A uniform offset on every key is exactly what makes overlap look
mechanical:

| Event | Behaviour |
|---|---|
| Fast launch | Larger lag |
| Sustained motion | Follower catches up |
| Sudden stop | Follower **passes** the driver |
| Gentle stop | Smaller overshoot |

Secondary animation should have lower screen-space amplitude, lower contrast, or later timing than
the primary action. If it has all three the same, it competes.

---

## 5. Inertia and momentum — the visible cues

| Physical behaviour | What the viewer sees |
|---|---|
| Larger mass, same force | Delayed startup, lower acceleration, longer to reach speed |
| Larger momentum `p = mv` | Resists stopping or reversing; velocity persists |
| Large rotational inertia | Slow spin-up and spin-down even at moderate total mass |
| Short high-force impact | Very rapid velocity change, then support vibration |
| Flexible mounting | Main mass moves first; mounted part lags, overshoots, damps |
| Backlash | Driver turns a small distance before the driven part engages |
| Stiction | Brief hold, then a comparatively sudden release |
| Air drag | Bigger effect on low-mass high-area objects; flutter, terminal speed |
| Damping | Successive overshoots diminish rather than continuing |

Attachment as a spring-damper: `m·ẍ + c·ẋ + k·x = F(t)`, or rotational `I·θ̈ + c·θ̇ + k·θ = τ(t)`.
Higher stiffness `k` → faster oscillation. More attached mass → lower natural frequency. More
damping `c` → fewer repeated overshoots.

| Attachment | Correct follow-through |
|---|---|
| Rigid hinged panel | Rotational lag, limit contact, one or more damped rebounds |
| Cable / hose | Root follows product; curvature propagates toward the free end |
| Cloth | Broad lag near attachments, folds and flutter toward free edges, collides with product |
| Liquid | Free surface resists acceleration, then tilts or sloshes; **preserve volume** |
| Hair, brush fibres, tassels | Progressive root-to-tip delay with drag and bending stiffness |
| Rubber seal or mount | Small compression and shear, then a fast strongly-damped recovery |

---

## 6. Motion blur and shutter angle

```
T_exposure = θ / (360° · fps)
```

At 24 fps, 180° = 1/48 s. Blur length ≈ `D · θ/360°`, where `D` is per-frame screen displacement.

| Shutter | Exposure @24 | Blur as % of frame travel | Reads as |
|---:|---:|---:|---|
| 90° | 1/96 s | 25% | Crisp, mechanical, can strobe |
| 144° | 1/60 s | 40% | Crisp detail with moderate continuity |
| **180°** | 1/48 s | 50% | **Cinematic baseline** |
| 270° | 1/32 s | 75% | Smoother, faster-looking, smeared |
| 360° | 1/24 s | 100% | Maximum continuity, least edge clarity |

For product work:

- Start at **180°**.
- **90–144°** when engraved detail or hard edges must stay legible.
- **216–270°** when speed matters more than per-frame detail.
- Render proper **rotational and deformation** blur for wheels, fans, cables, cloth — not just
  transform blur.
- **Judge blur in playback, never from an isolated frame.**
- Too little → fast motion strobes. Too much → silhouette, branding, seams and the contact moment
  all disappear.
- **Blur never fixes an incorrect motion path or impossible acceleration.** It only hides it from
  you, not from the viewer.

---

## 7. Heavy vs light — from timing alone

| Cue | Heavy | Light |
|---|---|---|
| Start | Longer delay and acceleration ramp | Immediate response, short ramp |
| Position spacing | Gaps grow gradually | Gaps grow rapidly |
| Stop | Long deceleration, momentum persists | Quick controlled stop |
| Direction reversal | Broad, deliberate, clear loss of speed | Fast, little preparation |
| Cruise | Stable unwavering speed | Frequent speed changes plausible |
| Settle | Few low-frequency damped corrections | Short higher-frequency corrections |
| Control profile | Long ramps, restrained jerk | Short ramps, higher jerk |
| Impact | Fast stop only if a large opposing force is implied, then structural response | Smaller impulse, quicker recovery |
| Free fall | **Identical timing** to a light object | **Identical timing** |

**Constant-velocity motion contains almost no mass information.** Weight becomes readable only when
velocity *changes* — startup, braking, collision, reversal — or when attached parts reveal inertia.

A heavy product does not move slowly everywhere. It is **reluctant to change velocity**.
A light product feels light through rapid acceleration, short braking and quick reversals — not by
violating gravity.

---

## 8. Production order

1. Set real units, mass, pivots, constraints, center of mass.
2. Define locked, release, contact, max-travel and settled states.
3. Block the primary rigid action pose-to-pose (stepped).
4. Calculate gravity, force/torque, acceleration, approximate frame counts.
5. Build physically meaningful velocity curves — trapezoidal, ballistic or jerk-limited.
6. Add rigid-part overlap, backlash, suspension, structural settling.
7. Add cables, cloth, liquid, hair.
8. Stage with camera, silhouette, lighting and controlled pauses.
9. Add motion blur; evaluate at full playback speed.
10. **Apply advertising exaggeration only after the physically credible version works.**
