# Cinematography for product and hero animation

Lens, aperture, framing, screen direction and shot structure. Camera *movement* has its own file
(`camera-moves.md`); perspective *math* has another (`forced-perspective.md`).

---

## 1. Design backward from the hero frame

Before a single key: find the one angle where **silhouette, logo, controls, material response and
the key specular highlight** all read at once. That is the hero frame. Everything else — the move,
the beat, the lens, the light — is built to arrive there and hold.

Studios do not animate a camera and then hope a good frame appears. They pick the frame, then
design the approach into it.

Practical order:

1. Find the hero frame as a still.
2. Decide camera **distance** for the depth ratios you want.
3. Decide **focal length** to get the framing at that distance.
4. Decide where the camera *starts* so the move into the hero frame has a reason.
5. Only then animate.

---

## 2. Focal length

All values below are **full-frame equivalents** (36 mm sensor width). In Blender set
`sensor_width = 36.0` and `sensor_fit = 'HORIZONTAL'` explicitly, or these numbers are meaningless.

| Lens | Best for | Communicates | Failure mode |
|---|---|---|---|
| **100 mm macro** | Logos, knurling, watch mechanisms, fabric, droplets, print, jewelry | Precision, rarity, forensic detail, compression | Extremely shallow DOF at close magnification. A 100 mm macro has *less* DOF than a 50 mm macro at the same framing. Use f/5.6–f/11. |
| **85 mm** | Primary beauty packshot — cosmetics, bottles, watches, phones, footwear three-quarter | Premium, flattering, optically isolated, calm | Orbits can look flat: at a large camera radius, relative depth compresses and the move loses dimensionality. |
| **50 mm** | Neutral full-product view, moderate dolly, assembly animation | Honest, balanced, human-scale, unobtrusive | Not automatically "luxurious". Lighting and composition must supply the polish. |
| **35 mm** | Environmental product shots, strong parallax slides, product-in-context | Modern, energetic, spatial, slightly immersive | Near proximity exaggerates the leading edge. Keep straight-sided products away from frame edges. |
| **24 mm** | Dramatic low-angle reveal, exploded views, large machinery, deliberate foreground exaggeration | Scale, speed, immersion, aggression, larger-than-life | **Not a neutral packshot lens.** Distortion is the point; if it is not the point, do not use it. |

### Sensor conversion

To match field of view between sensors: `f₂ = f₁ · (s_w2 / s_w1)`.

| Full-frame | Super 35 / APS-C (≈1.5×) |
|---:|---:|
| 100 mm | ~67 mm |
| 85 mm | ~57 mm |
| 50 mm | ~33 mm |
| 35 mm | ~23 mm |
| 24 mm | ~16 mm |

Never copy a focal length between scenes with different film backs. 50 mm on a 24 mm-wide sensor
is dramatically tighter than 50 mm on 36 mm.

Conventional product imaging lives at **50–85 mm** full-frame, with **90–105 mm macro** for detail.
24–35 mm is reserved for environmental or deliberately dramatic work.

---

## 3. Aperture and depth of field

In CGI, sensor size matters chiefly because it fixes the lens/distance combination needed for a
composition. At equal framing and equal f-number, a larger format yields shallower-looking DOF
because it demands a longer lens or different position.

| Shot | Full-frame f-stop | Result |
|---|---:|---|
| Full product, clean packshot | **f/8–f/11** | Whole product readable |
| Three-quarter beauty | **f/4–f/5.6** | Front face sharp, rear edge softening |
| Premium shallow hero | **f/2.8–f/4** | Separation while keeping product identity |
| Macro insert | **f/5.6–f/11** | A manageable sharp slice; macro DOF may be millimetres |
| Stylized rack focus | **f/1.8–f/2.8** | Clearly distinct planes, visible bokeh |
| Wide environmental | **f/4–f/8** | Product and meaningful set both legible |

Rules that actually matter:

1. **Never default to f/1.4.** If the brand name, material boundary and silhouette cannot be read
   simultaneously, the DOF is too shallow. Full stop.
2. At macro distances, focus on **the feature that sells the product**, not automatically the
   nearest surface.
3. Focus stacking is unnecessary in CG, but its *visual* equivalent is useful: render f/5.6–f/8 and
   composite depth passes if the client wants both premium falloff and a completely sharp label.
4. **Check DOF at final delivery resolution.** Blur that reads as elegant on a large monitor can
   make a product unrecognizable at social-media size.
5. Set `dof.focus_object` to an Empty on the **hero surface** — a target at the product origin
   focuses behind the visible front face.

---

## 4. Composition

| Principle | Working value | Application |
|---|---:|---|
| **Rule of thirds** | Logo, cap, button or key highlight near a ⅓ intersection | Approach and feature shots |
| **Centered symmetry** | Center within 1–2% of frame center; verticals level within 0.2–0.5° | Precision, permanence, engineering, luxury. Bottles, watches, front-on electronics. |
| **Dynamic asymmetry** | Product center at 35–42% or 58–65% of frame width | Motion + a deliberate copy area. Pair with a diagonal highlight. |
| **Product room / headroom** | 5–10% of frame height above the silhouette; 4–8% below unless the pedestal matters | Avoid tangent contact with frame edges |
| **Negative space** | 30–45% of width for copy; 20–30% for pure breathing room | **Decide the copy side before animating.** Do not center the product and crop later. |
| **Hero product size** | 60–80% of frame height | Owns the frame while keeping silhouette and premium air |
| **Detail insert** | Feature at 70–110% of frame height | Cropping is fine only once the audience knows the whole product |
| **Leading lines** | Aim at the logo, the moving mechanism or the brightest highlight — not at geometric center | Pedestal edges, liquid streams, cables, shadow lines |
| **Lead / action room** | 10–25% more space in the direction of apparent travel | A rotating spout, opening lid or directional toe needs room ahead of it |
| **Delivery safety** | Logo ≥5% from edges, copy ~10% in; render 10–15% overscan | Multi-aspect reframes |

**Symmetry** for authority, precision and the final lockup. **Thirds/asymmetry** for movement,
feature demos and copy layouts. The standard progression is dynamic asymmetry during the reveal
resolving into a centered symmetrical hero.

---

## 5. Keeping the product in frame

A robust rig separates **four** jobs. Collapse them and you will be fighting the rig by frame 40.

1. **Path null** — where the camera travels
2. **Aim / target null** — where it looks
3. **Roll control** — prevents unwanted banking
4. **Focus target** — drives focal distance independently of aim

Setup values:

- Put the **orbit pivot** at the *visual* center — often 5–15% above bounding-box center for
  upright bottles and packaging.
- Put the **aim target** on the brand feature (logo, lens, button, cap), not at the transform origin.
- During a **crane**, animate the target by 50–80% of the camera's vertical displacement to control
  how much the product drifts in frame.
- On a **parallax slide**, let the aim target counter-slide 5–20% of camera travel if a perfectly
  locked center feels robotic.
- For a **push-in**, key the target only if the hero feature would drift.
- Preview at 16:9, 9:16 and 1:1; keep a 10–15% overscan master if reframing is expected.

**Auto-targeting is not enough.** It will happily hold a perfect center while the silhouette goes
tangent, the logo rotates away, or the pedestal edge kisses the frame border.

---

## 6. Screen direction and continuity

Establish a convention before animating and hold it:

- Choose the product's "front" and define a screen axis — e.g. feature reveals travel
  **left-to-right**, camera arcs stay **clockwise**.
- Keep successive camera positions on **one side of the axis** unless the crossing is intentional.
  The 180° rule preserves left/right relationships across cuts.
- If shot A exits moving right, shot B should enter or continue moving right.
- Keep orbit direction consistent. A clockwise orbit cut to an unexplained counter-clockwise orbit
  reads as a reversal, not as variety.
- **Match angular momentum, not just direction.** Cut from a 15°/s rightward arc into another
  10–20°/s rightward move — not into a static frame or a violent reversal.

To cross the axis legitimately: a centered neutral shot, a visible continuous crossing move, or
cover it with a whip pan, macro insert, flash, liquid wipe or full-frame blur.

**Camera orbit and product rotation compose.** If the camera moves clockwise while the product
rotates counter-clockwise, calculate the *net apparent* motion and check the silhouette frame by
frame — the two can cancel into a dead frame, or double into something too fast to read.

---

## 7. Beat structure

Short product films accelerate into one unmistakable hero image, then decelerate so the viewer can
register it. Typical short-form montage shots run 1–2.5 s, with 2–4 s for establishing or
recognition shots.

| Beat | 10 s | 15 s | 20 s | Action |
|---|---:|---:|---:|---|
| **1. Hook / abstraction** | 0–1.2 | 0–2 | 0–2.5 | Macro texture, silhouette, fast detail or unexpected angle. One decisive move; identity can be incomplete. |
| **2. Orientation** | →2.8 | →4.5 | →6 | Reveal category and form: 20–45° arc, slide or pull-back. |
| **3. Feature proof** | →5.2 | →8 | →11 | One or two inserts — mechanism, material, interface. ~1–2 s each. |
| **4. Build into hero** | →7.2 | →11.5 | →15 | Arc + push-in; product rotates into its optimal three-quarter; highlight travels the hero surface. |
| **5. Hero arrival** | →8.5 | →13 | →17 | Motion decelerates; logo faces camera; rack focus lands; silhouette and reflections resolve. |
| **6. Hero hold / lockup** | →10 | →15 | →20 | Hold 1.5–3 s with only micro-motion. Logo, tagline, CTA — no competing movement. |

### Worked 15-second cut

```
0.0 – 1.5    macro hook, 0.8 s parallax slide
1.5 – 4.0    45° reveal arc at 18°/s, easing over first and last 0.4 s
4.0 – 6.0    material/detail insert with a 1 s rack focus
6.0 – 8.0    second feature or assembly action
8.0 – 11.5   25° orbit at 7°/s plus a 20% dolly-in
11.5 – 12.5  product finishes a 10° rotation; camera settles first, focus lands second
12.5 – 15.0  symmetrical hero hold, logo and CTA
```

Note the order at 11.5–12.5: **camera stops, then focus lands.** Simultaneous arrival is what makes
an otherwise correct shot feel machine-generated.

---

## 8. The failure that looks like success

The most common way a technically clean product shot fails: **everything resolves at once.** The
camera reaches its mark, the product finishes rotating, focus snaps, the highlight peaks and the
logo appears — all on the same frame. It reads as automated, because it is.

Stagger by 3–8 frames: camera begins → product follows → highlight travels → focus lands →
composition holds. The hero moment is a *sequence* of small arrivals, not a single event.