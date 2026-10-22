---
name: animation-direction
description: Direct and build 3D animation in Blender with cinematographic rigor — product/hero shots, camera moves that hold the subject in frame, lens and forced-perspective math, F-curve timing, and the 12 principles applied to hard-surface objects. Use when animating a product, a camera move, a turntable, a reveal, a dolly zoom, a drop or an exploded view; when choosing focal length, framing or shot duration; when animation looks floaty, weightless or mechanical; or when writing bpy keyframe/camera-rig code. Triggers: "animate this", "product animation", "hero shot", "camera move", "turntable", "dolly zoom", "forced perspective", "keyframe", "F-curve", "easing", "make it feel heavy", "animacija", "kamera", "kadar".
---

# Animation Direction

Animate for the **camera**, not for the viewport. A move that reads beautifully in world space
can be flat, tangent or unreadable through the lens — and the lens is the only thing that ships.

Two jobs, always in this order:

1. **Direct** — decide the shot: lens, framing, beat, what moves and why. Sections 1–4 here.
2. **Build** — key it so the curves say what the direction meant. Sections 5–7, then `scripts/`.

## Non-negotiables

| Rule | Why |
|---|---|
| **Set the sensor before you name a focal length.** | "85 mm" means nothing without `sensor_width`. Blender defaults to 36 mm (full-frame); state it explicitly. |
| **Separate position from aim.** | Camera on a path/dolly, a *separate* target Empty for what it looks at, a third for focus. Never key camera Euler channels to chase a subject. |
| **Never overshoot the camera.** | Camera overshoot reads as operator error. Product overshoot is a style choice. Keep camera settle under ~0.2–0.5° / 0.5% of travel. |
| **Never scale a rigid product to "squash" it.** | Rigid shells keep scale (1,1,1). Compression lives in the parts that can actually deform. |
| **Offset everything by 3–8 frames.** | If camera, product, focus and lights all start and stop together, it reads as procedural. |
| **Judge at playback speed, at final aspect.** | Scrubbing hides one-frame pops. A 16:9 master can be tangent in 9:16. |
| **A hold is part of the move.** | 1–2 s of stillness at the hero frame is what makes the whole thing land. It is not dead time. |

## Workflow

```
1. HERO FRAME FIRST      pick the one angle where silhouette, logo, material and
                         key highlight all read. Everything is designed backward from it.
2. LENS + DISTANCE       choose distance for the depth ratios you want (§2),
                         then focal length for framing. Never the reverse.
3. BEAT STRUCTURE        lay the shot on a timeline in seconds (§3), not in frames.
4. BLOCK STEPPED         Constant interpolation. Poses only. Timing only.  (§5)
5. SPLINE                Auto Clamped first. Read the curves, fix the spacing. (§5)
6. OFFSET + OVERLAP      followers lag the driver. Secondary motion last.    (§6)
7. PROVE                 checklist below. Playblast at fps. Then render.
```

Do not spline everything at once. Root/camera first, then subject, then attachments, then
lights and focus. When something breaks you want to know which layer did it.

---

## 1. Quick lookup — camera moves

Full detail, easing profiles and rig notes: `references/camera-moves.md`.

| Move | Duration | Speed | Says |
|---|---:|---:|---|
| Slow orbit | 2.5–5 s | 5–15°/s, 15–45° total | Premium inspection |
| Reveal arc | 2–4 s | 15–30°/s, 35–90° total | Mystery → recognition |
| Turntable (loop) | 8–15 s / 360° | 24–45°/s, **linear** | Catalog, technical |
| Dolly-in | 2–4 s | 5–20% of start distance per s | Importance, intimacy |
| Slow push-in | 3–6 s | +3–8% frame height per s | Quiet confidence |
| Arc + push-in | 2.5–4.5 s | 10–25°/s + 15–30% closer | The standard hero reveal |
| Crane rise/fall | 2–4 s | 0.15–0.5 product-heights/s | Monumental |
| Parallax slide | 2–4 s | 0.1–0.35 frame widths/s | Depth, sophistication |
| Rack focus | 0.6–1.5 s snappy / 1.5–3 s luxury | — | Redirect attention |
| Whip pan | 6–16 frames | 180–600°/s | Energy, hidden transition |
| Hero hold | 0.5–2 s | 0°/s | Recognition. **Required.** |

**Preserve seconds across frame rates, not frame counts.** A 3 s orbit is 72 frames at 24 fps
and 90 at 30 fps — it is the same move.

## 2. Quick lookup — lens

Full-frame (36 mm sensor) equivalents. Conversion math and forced perspective: `references/forced-perspective.md`.

| Lens | Use | Says | Watch |
|---|---|---|---|
| 100 mm macro | Logo, knurling, texture, droplets | Precision, forensic | Razor DOF; use f/5.6–f/11 |
| 85 mm | Primary beauty packshot | Premium, calm, isolated | Orbits can go flat |
| 50 mm | Neutral full product | Honest, human-scale | Polish must come from light |
| 35 mm | Environmental, parallax slide | Modern, spatial | Near edges stretch |
| 24 mm | Low-angle hero, exploded view | Monumental, aggressive | **Not** a packshot lens |

Aperture: packshot f/8–f/11 · beauty f/4–f/5.6 · premium shallow f/2.8–f/4 · macro f/5.6–f/11.
**Never default to f/1.4.** If logo, material boundary and silhouette cannot all be read at once,
the DOF is too shallow.

**The one thing to remember about lenses:** focal length does not create perspective — *distance*
does. Relative apparent size is `(H₁/H₂)·(Z₂/Z₁)`; `f` cancels out. A wide lens looks exaggerated
only because it lets you stand closer. Near-feature enlargement is `E = D/(D−δ)`.

## 3. Quick lookup — beat structure

| Beat | 10 s | 15 s | 20 s | What happens |
|---|---:|---:|---:|---|
| Hook | 0–1.2 | 0–2 | 0–2.5 | Macro, silhouette, unexpected angle. Identity incomplete. |
| Orientation | →2.8 | →4.5 | →6 | 20–45° arc reveals the category. |
| Feature proof | →5.2 | →8 | →11 | 1–2 s per feature insert. |
| Build to hero | →7.2 | →11.5 | →15 | Arc + push-in; product rotates to its best angle. |
| Hero arrival | →8.5 | →13 | →17 | Motion decelerates, focus lands, highlight resolves. |
| Hold / lockup | →10 | →15 | →20 | 1.5–3 s. Only micro-motion. |

**The hero moment is not the fastest or closest shot.** It is the instant motion, focus,
silhouette, highlight and branding all resolve at once — held long enough to be understood.

## 4. Framing

| What | Value |
|---|---|
| Hero product size | 60–80% of frame height |
| Detail insert | 70–110% of frame height |
| Headroom above silhouette | 5–10% of frame height |
| Negative space for copy | 30–45% of frame width, decided **before** animating |
| Centered symmetry | center within 1–2%, verticals level within 0.2–0.5° |
| Dynamic asymmetry | product center at 35–42% or 58–65% of width |
| Lead room | 10–25% extra space in the direction of travel |
| Title safe | logo ≥5% from edges, copy ~10%; render 10–15% overscan for reframes |

Symmetry = authority, precision, the final lockup. Thirds/asymmetry = movement, features, copy.
Common arc: asymmetric during the reveal → symmetric at the hero.

**Screen direction:** pick a convention (arcs clockwise, features reveal left-to-right) and hold
it across cuts. Match not only direction but angular momentum — cut from a 15°/s right arc into
another 10–20°/s right move, not into a dead frame or a reversal. Cross the axis only through a
centered neutral shot, a visible continuous crossing, or a blur/whip/macro cover.

## 5. Curves — what the shape means

Full reference incl. easing equations, handle types and gimbal: `references/blender-fcurves.md`.

| Curve | Motion |
|---|---|
| Flat | Stationary |
| Straight diagonal | Constant velocity |
| Steepening | Accelerating |
| Flattening | Decelerating (slow-in) |
| Local extremum | Velocity hits zero and reverses — overshoot |
| Sharp corner | Instant velocity change — a hit |
| Constant/stepped | Instant pose change |

Perceived speed is `√(x'² + y'² + z'²)` — an evenly-spaced X curve can still accelerate because
Y or Z is moving. **Block in Constant.** Stepped poses expose weak posing that interpolation hides.
Then spline with **Auto Clamped** (never plain Auto — it overshoots silently), and break to
**Free** handles only at contacts, impacts and reversals.

**Floaty is a diagnosis, not a texture.** Almost always one of: symmetric handles everywhere ·
equal timing everywhere · easing on motion that has no reason to decelerate · no clear contact
frame · every part starting and stopping together · too many small keys. Fix the cause, not the
handles.

## 6. Weight and timing

Physics tables, free-fall frame counts and overshoot patterns: `references/motion-principles.md`.

**Constant-velocity motion carries almost no mass information.** Weight is readable only when
velocity *changes*. A heavy product is not one that moves slowly everywhere — it is one that is
**reluctant to change velocity**: slow start, long braking, broad reversals, small damped settles.

Under constant acceleration from rest, successive per-frame distances go `1 : 3 : 5 : 7 : 9`.
A generic symmetric Bézier ease is not the same thing.

Free fall at 24 fps: 0.25 m = 5 fr · 0.5 m = 8 fr · 1 m = 11 fr · 2 m = 15 fr · 5 m = 24 fr.
Mass does **not** change fall time. Do not float a light object.

Overshoot templates at 24 fps (frames from start of move):

| Feel | Pattern | Keys |
|---|---|---|
| Snappy graphic | 0 → 105–112% → 97–99% → target | 0, 6, 9, 13 |
| General prop | 0 → 103–108% → 98–99% → target | 0, 12, 16, 22 |
| Heavy | 0 → 101–104% → 99–99.5% → target | 0, 16, 22, 32 |
| Camera stop | 0 → 100–102% → 99.5–100% → target | 0, 18, 23, 30 |

Follow-through delays behind the driver (24 fps): torso 1–2 · head 2–4 · hands 3–6 ·
cable/soft accessory 4–8 · loose cloth 5–10 · rigid heavy load 2–5. **Vary the delay per event** —
a uniform offset on every key is what makes overlap look mechanical.

Motion blur: 180° shutter is the baseline (blur = 50% of per-frame travel). Drop to 90–144° when
engraved detail must stay legible; push to 216–270° for speed over detail. Blur never fixes a
wrong motion path.

## 7. Building it

`scripts/anim_lib.py` is the shared core — import it, don't retype the numbers. Every recipe in
`scripts/recipes/` is headless-safe (`blender -b file.blend -P recipe.py`) and runs in the Text
Editor unchanged.

```
anim_lib.py            key(), ease(), overshoot(), settle(), camera_rig(), aim(),
                       dolly_zoom(), frame_subject(), fov/mm conversion, timing helpers
recipes/hero_reveal.py      arc + push-in + settle on the 15 s beat structure
recipes/turntable.py        linear loop, N° over M seconds, seam-free
recipes/dolly_zoom.py       f/D held constant, keyed and driver versions
recipes/product_drop.py     real gravity timing + compression + damped settle
recipes/exploded_view.py    staggered offsets with follow-through
```

API details, enums and constraint setup: `references/bpy-api.md`.

## Before you render — checklist

- [ ] Sensor width set explicitly; focal length stated as full-frame or actual, not both
- [ ] Camera position, aim target and focus target are **three separate** objects
- [ ] Focus target sits on the hero surface (the logo), not at the object origin
- [ ] Playblast watched at full speed, half speed, and frame by frame
- [ ] Checked at every delivery aspect (16:9 / 9:16 / 1:1) — no tangents, no crops through the logo
- [ ] Camera settles before the product finishes; focus lands last
- [ ] Nothing starts or stops on exactly the same frame as anything else
- [ ] Hero hold is at least 1 s of near-stillness
- [ ] Rigid parts still at scale (1,1,1); no mesh interpenetration at contacts
- [ ] Motion paths checked for accidental corners, flat spots and hooks before contact
- [ ] Move ends 6–12 frames before the cut so the image can settle

## References

| File | Read it when |
|---|---|
| `references/cinematography.md` | Choosing lens, aperture, framing, screen direction, beat structure |
| `references/camera-moves.md` | Building any specific move — full easing and rig spec per move |
| `references/forced-perspective.md` | Forced perspective, dolly zoom, FOV math, monumental scale, distortion |
| `references/motion-principles.md` | 12 principles on hard surfaces, physics timing, weight, overshoot, blur |
| `references/blender-fcurves.md` | Interpolation, handles, easing curves, blocking→spline, floaty, gimbal |
| `references/bpy-api.md` | Writing the Python — exact API, enums, constraints, drivers, NLA |