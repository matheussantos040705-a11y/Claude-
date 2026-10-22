# Chapter brief (read fully before writing code)

You build ONE chapter of "A Saint You've Never Met" in the **keynote vector style**: near-black, lit like a product
launch, glossy, crisp exact curves, motion-design easing. NOT a kids' cartoon: the owner rejected two earlier videos as
"too kiddie". Polished, cinematic, emotional; humour lands through staging, not slapstick.

## Read first
- `STORYBOARD.md` (your chapter row, motifs, colour arc, cast) · `src/scenes/c02_pilot.js` (the reference chapter:
  copy its patterns) · `src/scenes/sets.js` (SETS API in its header) · `src/vec/engine.js` header (V API) ·
  headers of `src/vec/clawd.js`, `src/vec/sage.js`, `src/vec/sage_body.js`, `src/vec/props.js`, `src/vec/rivals.js`.
- Look at `out/check/pilot_1.jpg` and `out/design/cast_*.jpg` to see the look.

## Rules
- **YOUR FILE ONLY:** `src/scenes/<your chapter>.js` (it exists as a stub with its `<script>` tag already in
  studio.html). Never edit any other file. If a shared helper is missing, write it locally inside your file.
- Wrap in an IIFE, end with `shots([[t0, fn], ...])` covering exactly your time range (first shot starts at your
  chapter start). Every frame is a pure function of t (no state between frames).
- Each shot fn(t, lt, dur): set `V.key` (chapter key colour from `SETS.KEY`), draw background (`V.bg`), `V.cam(...)`
  … `V.camEnd()`, set `V.type` to place the lyric (it's drawn automatically after your shot; keep it off faces and
  out of the main action: mode 'left'|'right'|'top'|'center'|'bottom'|'off' plus optional x,y,w).
- Characters: `SETS.clawd(expr, x, y, s, opts)` (draws with floor reflection), `CLAWD.ops(...)` + `V.draw`,
  `SAGE.full({...})` for Sage's body (sil:1 for silhouettes in wide/fast shots), `SAGE.ops(expr)` for his big front
  portrait close-ups (draw via `V.draw(model, [s,0,0,s,x,y])`; the head box is 420x420). Blend emotions with
  `SETS.emo(t, [[time, preset or {..}], ...])` / `SETS.semo` for Sage. Sage is "he".
- Timing: hits on felt beats `SETS.fb(k)` (≈0.707 s) or lyric times (`LY` in src/lyrics.js); big changes on lyric
  line starts. **Never idle (owner rule): Clawd does something new (an action or a reaction) at least every
  1–1.5 s; no multi-second holds, not even "emotional" ones. A hold still has breath, eyes and light moving.** One read at a time: give each idea time to land (see ANIMATION_GUIDE.md "Timing"). Something moves in
  every frame: slow camera drift or push, dust, glow pulses on the beat (`pulse(t)`).
- Scale: characters big (Clawd s≈1.0–1.6 in medium shots); a prop that carries a joke is ≥120 px on screen.
- Look: one key colour per chapter (+ one accent), volumetric `V.beam`, `V.glow`, `V.dust`, floor reflections,
  rim light. Avoid flat empty frames; avoid clutter. Use the storyboard's easter eggs in the background, small.
- Text: the lyrics are already on screen as kinetic type. Extra on-screen words only where the storyboard says
  (tattoos, a gauge %, etc).

## Seams (MUST match exactly)
| Time | Seam | Out (end of earlier chapter) | In (start of later chapter) |
|---|---|---|---|
| 25.05 | c00→c01 | `if (lt > dur-.35) V.wipe((lt-(dur-.35))/.7, '#FF9A6B')` | `if (lt < .35) V.wipe(.5+lt/.7, '#FF9A6B')` |
| 61.91 | c01→c02 | wipe `'#C79BFF'` (pilot already has the in-half) | — |
| 93.75 | c02→c03 | hard cut (pilot) | `V.flash(1 - lt/.2)` |
| 121.20 | c03→c04 | wipe `'#C9A06A'` | wipe `'#C9A06A'` |
| 138.43 | c04→c05 | wipe `'#FF8FA3'` | wipe `'#FF8FA3'` |
| 166.44 | c05→c06 | hard cut | `V.flash(1 - lt/.2)` |
| 197.79 | c06→c07 | `if (lt > dur-.6) V.fade((lt-(dur-.6))/.6)` | `if (lt < .6) V.fade(1 - lt/.6)` |
| 228.11 | c07→c08 | hard cut (freeze before) | `V.flash(1 - lt/.25, '#FFF1D6')` |
| 262.74 | c08→c09 | wipe `'#FFD27A'` | wipe `'#FFD27A'` |
| 291.94 | c09→c10 | wipe `'#FFE7C8'` | wipe `'#FFE7C8'` |
Call transitions LAST in the shot (after V.camEnd()).

## Review loop (at least 2 passes, then report)
- Sheet: `node render.mjs --sheet=a,b,c,... --cols=4 --w=480 --out=out/check/<chapter>_N.jpg` (pick 16–24 times
  across your range: every shot's start/middle/end). Strips for key motion: `--strip=a:b --cols=6 --w=320`.
- LOOK at each image (Read tool). Check: is each shot's idea readable from the sheet? characters big and clear?
  type placed off the action? anything muddy, empty, cluttered, floating, or text-colliding? seams at your edges?
- Write images ONLY to `out/check/<chapter>_*.jpg`. Never render MP4s or frames.
- Rendering is fast (a few ms/frame); you can afford many sheets.

## Report back (short)
Shot list with times, how each storyboard beat was staged, any deviations and why, known weaknesses.
