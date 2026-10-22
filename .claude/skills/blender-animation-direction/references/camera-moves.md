# Camera moves — full specification

Every move below: what it says, how long it runs, how fast, how it eases, how it is rigged, and how
it fails. Numbers are **24–30 fps starting values**, not laws. Scale translation speeds to the
product's real size rather than to arbitrary world units.

**Preserve seconds across frame rates, never frame counts.** A 3 s move is 72 frames at 24 and 90
at 30 — it is the same move.

---

## The universal rig

```
CAM_Dolly          ← path / position. Follow Path or keyed location.
 └── CAM_Pan       ← yaw corrections
     └── CAM_Tilt  ← pitch corrections
         └── CAM_Shake  ← handheld / micro-motion, usually off for product
             └── Camera ← Damped Track → AIM_Target
                          dof.focus_object → FOCUS_Target
```

Three separate targets: **position** (dolly), **aim** (what it looks at), **focus** (what is sharp).
They are frequently *not* the same point. The aim can sit at the product's visual center while
focus sits on the logo 40 mm nearer the camera.

Use **Damped Track** for aim (shortest rotation, no up-axis twist) unless you specifically need a
locked horizon, in which case **Track To** with `up_axis='UP_Z'`. Track To is legacy and can twist
near singular configurations.

---

## 1. Slow orbit

| | |
|---|---|
| **Duration** | 2.5–5 s |
| **Speed** | 5–15°/s; 15–45° total |
| **Says** | Premium inspection, dimensionality, controlled luxury |
| **Preset** | 36° over 3.0 s = 12°/s |

**Rig:** orbit an Empty whose pivot is at the product's *visual* center — typically 5–15% above
bounding-box center for upright bottles and packaging. Rotate the pivot, parent the dolly to it.

**Easing:** ease the **path progress parameter**, not the individual XYZ channels. Independently
easing X, Y and Z produces a side-to-side wobble that no amount of handle tweaking fixes.
15–20% ease at each end.

**Fails when:** the pivot is at the mesh origin rather than the visual center, so the product
appears to swing rather than turn. Also when the orbit is a perfect circle at constant height —
add 5–15° of vertical component so it reads as a designed move, not a lathe.

---

## 2. Reveal arc

| | |
|---|---|
| **Duration** | 2–4 s |
| **Speed** | 15–30°/s; 35–90° total |
| **Says** | Silhouette/mystery resolving into the recognizable three-quarter hero |
| **Preset** | 60° over 2.5 s = 24°/s |

**Rig:** as orbit, plus a 5–15° vertical component. Start on a face that does *not* identify the
product; end on the three-quarter.

**Easing:** ease-in/out on path progress. Finish the arc **6–12 frames before the cut** so the image
can settle. A move that is still moving on the cut frame reads as an edit error.

**Fails when:** it is mechanically horizontal (see above), or when the end pose is not actually the
hero angle — the arc arrives somewhere merely adjacent to the good frame.

---

## 3. Turntable (looping)

| | |
|---|---|
| **Duration** | 8–15 s per 360° |
| **Speed** | 24–45°/s, **linear** |
| **Says** | Catalog inspection, technical overview |
| **Presets** | 360° / 12 s = 30°/s (slow) · 360° / 8 s = 45°/s (energetic) |

**Easing:** **Linear.** Interpolation `LINEAR`, extrapolation `LINEAR` for a seamless loop. Any
easing inside a loop creates a visible pulse at the seam.

If the turntable must start or stop on screen, add separate non-looping ease handles *before* and
*after* the looped section — do not ease the loop itself.

**Loop seam:** key frame 1 at 0° and frame N+1 at 360°, then render frames 1..N. Keying frame N at
360° duplicates a perceptually identical frame and produces a one-frame hitch on repeat.

**For a beauty film, do not use a full revolution.** Show 30–120°. A mandatory 360° is a catalog
convention, not a cinematic one.

---

## 4. Dolly-in

| | |
|---|---|
| **Duration** | 2–4 s |
| **Speed** | Move 5–20% of the starting camera distance per second; final image-size increase 15–40% |
| **Says** | Increasing importance, intimacy, detail |

A dolly **physically translates the camera**. It is not a focal-length zoom — the perspective
changes, which is the entire point. If you animate `lens` instead, you get a crop, not a move.

On a 100 mm lens use a smaller distance change than on 35 mm: framing tightens far faster on a long
lens for the same physical travel.

**Easing:** monotonic cubic S-curve. First 15–25% accelerating, middle 50–70% near constant, final
15–30% decelerating. **The end ease should be slightly longer than the start ease.**

**Fails when:** it is actually a zoom; or when it ends exactly on the cut frame with no settle.

---

## 5. Slow push-in

| | |
|---|---|
| **Duration** | 3–6 s |
| **Speed** | Product scale grows 3–8% of frame height per second |
| **Says** | Quiet confidence. The final-reveal and voiceover move. |

Begin slightly wider than expected, arrive at **65–80% frame height**, reserve **0.5–1.5 s of hold**
at the end. The hold is not optional — it is what the push was for.

**Easing:** as dolly-in but gentler; the deceleration should be almost imperceptible.

---

## 6. Arc + push-in — the standard hero reveal

| | |
|---|---|
| **Duration** | 2.5–4.5 s |
| **Speed** | 10–25°/s **plus** a 15–30% distance reduction |
| **Says** | The high-end three-quarter reveal. This is the workhorse. |

**Rig:** separate **path progress** from **look-at** animation. The orbit exposes the front face
while the push makes the logo dominant. These are two curves with different shapes on two
different parameters — not one blended motion.

**Easing:** orbit eased 15–20% at each end; push with a longer tail so the camera is still
*barely* closing when the rotation has already stopped. That small overlap is what makes the
arrival feel authored.

---

## 7. Crane / pedestal rise or fall

| | |
|---|---|
| **Duration** | 2–4 s |
| **Speed** | 0.15–0.5 product-heights/s; 0.5–1.5 product heights total |
| **Says** | Monumental reveal; detail → complete silhouette |

**Rig:** counter-tilt, or animate the aim target upward/downward by **50–80% of the camera's
vertical displacement**, so the product does not drift vertically out of frame.

Add a 5–15° arc component. A pure vertical translation looks like an elevator, not a crane.

**Fails when:** the target does not move at all (product slides down the frame) or moves 100%
(product is pinned dead center and the move reads as a zoom).

---

## 8. Parallax slide

| | |
|---|---|
| **Duration** | 2–4 s |
| **Speed** | 0.1–0.35 frame widths/s; 10–50% of camera-to-product distance total |
| **Says** | Depth, layered space, technical sophistication |

**Requires at least three depth planes:** foreground element, product, background. With two, there
is no parallax to see — it is just a pan.

A **longer lens needs a larger physical slide** to produce visible parallax. 24–50 mm makes the
effect much stronger for the same travel. See `forced-perspective.md` for why.

**Rig:** let the aim target counter-slide **5–20%** of camera travel if a perfectly locked center
feels robotic.

---

## 9. Rack focus

| | |
|---|---|
| **Duration** | 0.6–1.5 s energetic; 1.5–3 s luxury |
| **Says** | Redirects attention between depth layers without cutting |

**Rig:** animate `dof.focus_distance`, or move a `focus_object` Empty between two targets. The
Empty method is usually better — the endpoints stay attached to geometry if anything moves.

**Easing:** smoothstep or asymmetric S-curve, 20–30% ease into and out of the pull. The focus
should **leave the first subject decisively, travel fastest through the unusable middle, and land
gently.** A symmetric ease wastes screen time on a blurry midpoint.

**Hold each sharp endpoint for at least 8–12 frames.** A rack that arrives and immediately cuts
gives the eye nothing.

Requires f/1.8–f/2.8 for the planes to read as distinct.

---

## 10. Whip pan

| | |
|---|---|
| **Duration** | 6–16 frames (0.2–0.7 s) |
| **Speed** | 180–600°/s; 90–180° total |
| **Says** | Energy, or a blur-hidden transition. **Not** product inspection. |
| **Preset** | 120° over 8 frames = 360°/s |

**Easing:** very steep ease-in, brief high-speed center, steep ease-out — roughly 20/60/20%.
**Preserve the high center velocity.** A broad gentle S-curve turns a whip into an ordinary pan.

At 24 fps with a 180° shutter, exposure is 1/48 s; around 180°/s or faster the middle of the move
abstracts into blur, which is what hides the transition.

Match direction and blur across the edit or the cut will read as two unrelated whips.

---

## 11. Hero settle / hold

| | |
|---|---|
| **Duration** | 0.5–2 s (1.5–3 s for the final lockup) |
| **Speed** | Essentially 0°/s |
| **Says** | Recognition, logo readability, confidence |

**This is part of the move, not dead time.** Stop translation first, then let a tiny remaining
rotation or focus adjustment finish over 4–8 frames.

**Camera settle must be critically damped — no bounce.** Camera overshoot reads as operator error.
If you want any at all, keep it below **0.5% of travel or 0.2–0.5°**.

---

## Easing summary

| Element | Curve | Ease allocation | Note |
|---|---|---:|---|
| Beauty camera translation | Monotonic cubic S | 15–25% in / 15–30% out | End ease slightly longer than start |
| Orbit / arc | Ease-in/out on **path progress** | 15–20% each end | Never ease XYZ separately |
| Continuous turntable | **Linear** | 0% | Ease only outside the loop |
| Finite product reveal | Sharper S than camera | 8–15% in / 15–20% out | 2–4° overshoot over 6–10 frames is optional style; zero for precision brands |
| Camera settle | Critically damped | final 15–25% | No bounce, ever |
| Rack focus | Smoothstep / asymmetric S | 20–30% each end | Fast through the middle |
| Whip pan | Steep / fast / steep | ~20/60/20% | Keep center velocity high |
| Floating product | Low-amplitude sine | 3–6 s per cycle | ≤0.5–2% of product height, 0.2–1° roll |

**Do not put identical ease curves on everything.** Identical easing on camera, product, focus and
lights is the single clearest signature of procedural animation. Offset secondary events by
**3–8 frames**: camera begins → product follows → highlight travels → focus lands → hold.

---

## Product rotation (as distinct from camera orbit)

| | |
|---|---|
| **Duration** | 2–4 s |
| **Speed** | 10–30°/s; 20–60° total |
| **Says** | Controlled reveal without moving the set or background |

Ease the **product** more decisively than the camera — it should feel engineered, not heavy.

**Do not rotate product and camera equally in opposite directions.** The background parallax and
the surface reflections end up describing contradictory motions and the shot feels subtly wrong in
a way that is very hard to diagnose later.
