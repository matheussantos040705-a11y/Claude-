# Forced perspective, lens math and the dolly zoom

Every formula here is implemented in `scripts/anim_lib.py`. Read this to know *which* formula;
call the library rather than retyping it.

---

## 1. The one fact that governs everything

For a pinhole/rectilinear camera, a point at camera-space `(X, Y, Z)` projects to:

```
x = f · X / Z        y = f · Y / Z
```

So for two objects of physical heights `H₁, H₂` at depths `Z₁, Z₂`, the ratio of their apparent
sizes is:

```
h₁ / h₂  =  (H₁ / H₂) · (Z₂ / Z₁)
```

**`f` cancels out.**

That is the whole subject in one line. Relative apparent size is controlled by physical size and
relative depth — **not by focal length**, as long as the camera does not move. A wide lens and a
long lens from the same position produce the *same perspective*; the long-lens image is simply a
crop of the same projection.

The causal chain people actually mean when they say "wide lenses distort":

```
short focal length → you stand closer for the same framing → stronger perspective
```

The lens did not do it. The distance did.

---

## 2. Near-feature exaggeration

Subject center at distance `D`, with a feature protruding `δ` toward the camera. That feature sits
at `D − δ`. Relative to an identically-sized feature on the subject plane, its magnification is:

```
E = D / (D − δ)
```

| D | δ | E | Effect |
|---:|---:|---:|---|
| 2000 mm | 100 mm | 1.053 | +5.3% — invisible |
| 1000 mm | 100 mm | 1.111 | +11% — subtle |
| 600 mm | 100 mm | 1.200 | +20% — noticeable |
| 400 mm | 100 mm | 1.333 | +33% — aggressive |
| 250 mm | 100 mm | 1.667 | +67% — caricature |

This is why moving 20 cm closer can change a product's apparent shape more than swapping lenses.

### The product equivalent of "nose enlargement"

| Product | Symptom at close range |
|---|---|
| Bottle / can | Near shoulder and cap grow; base and rear contour taper away |
| Car | Near headlight, grille corner or wheel dominates; rear quarter shrinks |
| Watch | Near lug, crown or bezel oversized; far side of case contracts |
| Shoe | Toe huge; heel recedes |
| Package | Near corner expands; a rectangular box becomes an aggressive wedge |
| Electronics | Near knob, lens barrel, screen corner or driver dominates |
| Furniture | Front leg disproportionately thick; rear legs converge and shrink |

### Fixing it

1. **Increase camera distance.**
2. Increase focal length to recover the framing.
3. Keep the geometry-sensitive face closer to parallel with the sensor.
4. Keep critical circular or branded details away from extreme frame edges.
5. Use **lens shift** rather than camera tilt when parallel verticals are required.
6. Do not expect barrel-distortion correction to undo it — this is viewpoint geometry, not optics.

For catalog or dimensional-reference imagery: **choose the camera distance first** based on
acceptable depth ratios, then pick the focal length for framing.

### Perspective distortion is not optical distortion

| Effect | Cause | Correctable by a lens profile? |
|---|---|---|
| Perspective enlargement / compression | Scene depths relative to camera position | **No** — not without reprojecting a new viewpoint |
| Barrel / pincushion | Lens maps rays non-rectilinearly | Usually, with a calibrated profile |
| Wide-angle edge stretching | Rectilinear projection of large off-axis angles | Not entirely — inherent to keeping straight lines straight |
| Fisheye | Deliberately non-rectilinear projection | Only by remapping, with heavy crop/stretch |

Blender's default perspective camera is an ideal rectilinear camera. It does **not** reproduce a
real lens's barrel distortion, chromatic aberration, breathing or edge softness. If you need those,
they are a compositing job.

---

## 3. Background compression

Subject at `D`, an equally-sized background object another `L` behind it (at `D + L`):

```
h_background / h_subject  =  D / (D + L)
```

With `L = 10 m`:

| Camera distance D | Ratio | Reading |
|---:|---:|---|
| 1 m | 0.091 | Background object looks tiny |
| 5 m | 0.333 | Clear depth separation |
| 20 m | 0.667 | Background crowds the subject — "compressed" |

The telephoto lens does not create compression. You **backed away** to use it at the same framing,
and the increased distance produced the compressed perspective.

**Consequence for parallax slides:** a longer lens needs a *larger* physical slide to show the same
parallax, because the depth ratios are already flattened. 24–50 mm gives much stronger parallax per
unit of travel.

---

## 4. Dolly zoom (Vertigo effect)

Hold the subject at constant screen size while camera distance — and therefore background
perspective — changes.

With `H` = subject height, `s` = sensor dimension, `q` = fraction of the sensor the subject fills:

```
q · s = f · H / D        ⟹        f / D = q · s / H = constant
```

Therefore between any two positions:

```
f₂ = f₁ · (D₂ / D₁)          D₂ = D₁ · (f₂ / f₁)
```

**Example:** camera moves 2 m → 5 m, starting at 24 mm.
`f₂ = 24 · (5/2) = 60 mm`.

Field-of-view form, holding scene width `W` at the subject plane constant:

```
W = 2 · D · tan(θ/2)
D = W / (2 · tan(θ/2))
θ = 2 · atan(W / (2D))
```

### What the background does

Background `L` behind the subject, relative to the locked subject:

```
R_bg = D / (D + L)
```

- **Dolly out + zoom in** — `D` increases, background **grows and crowds** the subject.
- **Dolly in + zoom out** — `D` decreases, background **shrinks and stretches away**.

The subject stays exactly the same size, but if it has real depth its *internal* perspective shifts
slightly. The formula strictly locks one chosen plane, not a volume. Pick that plane deliberately —
usually the hero face, not the object origin.

### Exact thin-lens version

For subject distance `u`, image distance `v`, magnification `m`:

```
1/f = 1/u + 1/v          m = v/u = f/(u − f)
```

Holding `m` constant gives `f = u · m/(1+m)` — still proportional to `u`. At normal cinematography
distances the pinhole approximation `m ≈ f/u` is sufficient.

### Implementation

1. Create a target Empty **on the lock plane**.
2. Constrain the camera to aim at it.
3. Animate camera distance along the camera–target line.
4. Drive or keyframe `camera.data.lens` from the distance ratio.
5. Assign the same (or a nearby) Empty as `dof.focus_object`.
6. **Verify in screen space**, not by trusting world distance.

`scripts/recipes/dolly_zoom.py` has both a keyed and a driver version.

---

## 5. Field of view ↔ focal length

```
θ  = 2 · atan(s / (2f))
f  = s / (2 · tan(θ/2))
```

Per axis, `s` is `sensor_width`, `sensor_height`, or `√(w² + h²)` for the diagonal.

Linear coverage at distance `D`:

```
W = 2 · D · tan(θ_h / 2)   =   D · s_w / f
```

**Worked:** 36 mm sensor, 24 mm lens → `θ_h = 2·atan(36/48) = 73.74°`.

### Equivalent focal length across sensors

```
f₁ / s_w1 = f₂ / s_w2        ⟹        f₂ = f₁ · (s_w2 / s_w1)

f_FF_equivalent = f · (36 mm / s_w)
```

Or by diagonal crop factor: `c = 43.27 / √(s_w² + s_h²)`, then `f_FF = c · f`.

**Always state whether a focal length is actual or full-frame-equivalent.** Unlabelled, the number
is ambiguous and someone will build the wrong shot from it.

---

## 6. Making a product monumental

Product of height `H_p` at depth `Z_p`; a scale reference (person, building, prop) of height `H_b`
at depth `Z_b`. Apparent ratio:

```
R = (H_p · Z_b) / (H_b · Z_p)
```

Solving for the required background distance:

```
Z_b = R · (H_b / H_p) · Z_p
```

That is the mathematical basis of forced perspective. To make a small product look enormous:

1. Put it **very close** to the camera — reduce `Z_p`.
2. Put recognizably-scaled objects **far** away — increase `Z_b`.
3. Lower the camera near the product's base.
4. Compose upward; keep the horizon low.
5. Use **18–28 mm** full-frame equivalent when strong exaggeration is wanted.
6. Let lower edges, wheels, feet or front corners enter the near foreground.
7. Keep the brand mark near the optical center if it must stay readable.
8. Use atmosphere, reduced contrast or softer distant detail to reinforce scale.
9. **Match lighting direction, shadow softness, texture scale and DOF.** Geometric alignment alone
   is never enough.
10. Avoid contradictory cues: enormous surface scratches, implausibly shallow DOF, background
    figures with the wrong eye line.

### Matching two objects to the same apparent height

```
H₁ / Z₁ = H₂ / Z₂        ⟹        Z₂ = Z₁ · (H₂ / H₁)
```

A 0.25 m miniature standing in for a 2 m object must be **eight times closer** to the camera.

**The illusion holds only from the designed camera position.** Any lateral camera movement exposes
the real depth arrangement through parallax. If the shot must move, it can only move *along* the
camera–subject axis, or the rig must be built so the alignment is maintained per-frame.

### Heroic focal lengths (full-frame equivalent)

| Intention | Lens | Placement |
|---|---:|---|
| Extreme monumental / exaggerated | 14–24 mm | Very low, very close; huge near base or front corner |
| Conventional wide heroic | 24–35 mm | Low angle, moderately close; powerful without becoming grotesque |
| Environmental product hero | 24–40 mm | Product dominates, surroundings still legible |
| Natural three-quarter hero | 50–100 mm | Faithful geometry; the honest product range |
| Luxury compressed portrait | 85–135 mm | Flat geometry, large background, shallow isolation |

There is no intrinsically heroic focal length. **Camera height, distance, tilt, composition and
lighting create the effect** — the lens only sets how much of it fits in frame.

---

## 7. Nodal point / entrance pupil

The perspective center of a real camera is the center of its **entrance pupil** — the apparent
image of the aperture seen from the front. This is commonly miscalled the "nodal point"; the
optical nodal points are usually *not* the correct pivot. **No-parallax point** is the accurate term.

- Translating the entrance pupil **changes perspective**.
- Rotating purely *around* it changes direction with **no translational parallax**.
- Rotating around the tripod socket or sensor plane translates the entrance pupil along an arc,
  which makes foreground and background edges slide against each other.

In an ideal renderer the camera object *is* the mathematical center of projection. So:

- **Rotate the Blender camera about its own origin** for a pure pan/tilt with no parallax.
- **Orbiting it around an external target is a translation** and correctly produces parallax.

This matters for stitched panoramas, multi-pass composites, repeatable turntable packshots, VFX
plate capture, motion-control moves with close foreground elements, and matching live-action plates
to a CG camera. The entrance pupil can shift when a zoom changes focal length or when internal
focusing moves — a measured no-parallax point is specific to lens, focal length and focus distance.

---

## 8. Animating focal length without it reading as a mistake

A focal-length change looks like an error when the subject drifts, focus breathes, the horizon
slides, or the zoom starts and stops with no motivation.

| Method | How to make it intentional |
|---|---|
| Visible optical zoom | Clear start and end, smooth acceleration; the changing frame size *is* the point |
| Dolly zoom | Hold `f/D` constant, lock the subject's screen position, synchronize focus |
| Slow emotional compression | Dolly back while lengthening the lens over several seconds; subject scale stays ~stable |
| Reveal into wide | Dolly in while shortening the lens — more environment appears without losing the subject |
| Hidden transition | Change during strong camera movement, an occlusion, a whip pan, a foreground wipe, or a cut |
| Stylized snap zoom | Fast and deliberately abrupt, supported by sound or editorial emphasis |

### Interpolate logarithmically

Image scale is proportional to focal length, so **equal focal-length increments are not equal
percentage changes**. A linear 24→120 mm ramp feels fast at the start and crawls at the end.

```
f(t) = f₀ · (f₁ / f₀) ^ s(t)          s(t): 0 → 1, smoothstep or eased F-curve
```

This gives constant *proportional* zoom speed, which is what the eye reads as even.

### Stabilize the diagnostic cues

- Lock the intended subject point.
- Animate focus deliberately — do not let it breathe.
- No unexplained `shift_x` / `shift_y` drift.
- Smooth velocity **and** acceleration.
- Preserve headroom / product clearance throughout.
- Preview the motion parallax, not just the start and end frames.
- Verify the **near surface** stays acceptably sharp, not the object origin.

When all of those agree, an animated lens reads as a designed transformation rather than a mistake.

---

## 9. Blender camera properties

| Property | Meaning / use |
|---|---|
| `data.type = 'PERSP'` | Rectilinear perspective |
| `data.lens` | Focal length in mm. **Keyframeable.** |
| `data.sensor_width` | Horizontal sensor size in mm. 36.0 = full frame. |
| `data.sensor_height` | Vertical; matters with vertical fit |
| `data.sensor_fit` | `'HORIZONTAL'` / `'VERTICAL'` / `'AUTO'`. **Set explicitly** for repeatable matching. |
| `data.shift_x`, `shift_y` | Off-center projection (lens shift) |
| `data.dof.use_dof` | Enable DOF |
| `data.dof.focus_object` | Focus target — **overrides** `focus_distance` |
| `data.dof.focus_distance` | Numeric focus, used only when no focus object |
| `data.dof.aperture_fstop` | Lower = stronger defocus. Default 2.8. |
| `data.dof.aperture_blades` | Polygonal bokeh blade count; 0 = circular |
| `data.dof.aperture_rotation` | Rotates polygonal bokeh |
| `data.dof.aperture_ratio` | Anamorphic bokeh; 1.0 = undistorted |

Blender defaults: 50 mm lens, 36×24 mm sensor, `AUTO` fit, DOF **off**, f/2.8, focus distance 10.

### Lens shift

Shift renders a larger off-center image and crops it. It changes framing **without** changing
camera position, focal length or depth ratios — so it can reposition vanishing points while keeping
verticals parallel. Use it for:

- Low product cameras that must keep parallel vertical edges
- Packaging and architecture
- Matching an offset live-action principal point
- Creating headroom without tilting

It does **not** produce the perspective change of an actual dolly. It is a reframe, not a move.
