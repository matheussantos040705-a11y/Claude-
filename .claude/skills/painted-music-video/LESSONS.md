# LESSONS: improvement log (newest first; read before every video)

Add a dated entry after each video: what broke, what fixed it, and what to try next. Promote a lesson into SKILL.md
once it has held for two videos.

## 2026-10-14 · "A Saint You've Never Met" (5:13, keynote vector style, first vector video)
**Worked**
- A vector engine on plain Canvas2D (engine.js) plus models of exact curves (vec.js) with SVG and canvas backends:
  approved design sheets animate unchanged, and frames take 1–30 ms (contact sheets are nearly free).
- Character design as its own stage with the owner: 4 rounds on the human, judged against the reference photo, and
  expression controls ("WALL-E": brows, lids, cheeks, gaze, mouth) instead of fixed faces.
- Two cast agents in parallel (the human's body and views; Clawd forms, rivals, props), then 9 chapter agents in
  parallel with CHAPTER_BRIEF.md. Each chapter took 2–5 min.
- Sending per-chapter clips with music while the rest renders (`render.mjs --clip --range=a:b`).
**Broke / fix**
- A `const PROJECT` isn't on `window`: check it with `typeof PROJECT`.
- SVG backend: gradient and clip ids collided (namespace them), and matrices were rounded to 1 decimal (use 5).
- The lyric type drew over wipes and fades: transitions are now queued and drawn after the type.
- zsh: `rm dir/*.jpg` on an empty dir fails the whole `&&` chain (no match). Use `find dir -name '*.jpg' -delete`.
- First ETA was 2.5–3 h; the real time from "go agentic" to the render was about 35 min. Estimate from the agents.
**Try next**
- Clawd has a front view only (no side or walk); the human's limbs are simple capsules; small props need push-ins.
- A reviewer agent across all chapters before the final render, for consistent scale and type placement.

## 2026-10-13 · "A Saint You've Never Met" (in progress; Suno, 5:13; style interview)
- The owner's two earlier videos felt **too kiddie**: watercolour boil plus bouncy mascots read as children's TV. Added
  `--style` (painted | editorial | keynote | geometric | hybrid) and the G0 interview. A vector style reverses the kit's
  look rules (no boil, plain bezier/parametric paths, kinetic type). Every choice has a flag, so `--auto` stays one command.
- People can't choose a style from adjectives. They chose by seeing `design/style_tests.mjs` (the same lyric moment in
  four looks). Show stills before asking about anything else visual.
- The fitted BPM came out at 169.84 with low coherence (0.51); the song is felt at about 85 (one lyric line = one bar ≈ 2.83 s).
  Expect double-time readings on sparse Suno ballads and check them against the line length.
- Keep the owner's photo and reusable character code in `PARENT/_shared/`, because song folders get deleted after upload.

## 2026-10-13 · zoo2 (first video; Suno song, 4:29.6, 94 BPM)
**Worked**
- Code-drawn frames beat AI generation decisively. The Deforum/SDXL-Turbo overnight attempt was choppy and melty and was rejected.
- Phase-fitting the beat grid. Librosa said 95.7 BPM, the truth was 94.0, and the drift would have been a full beat by about 35 s.
- Storyboard → 30 s pilot → approval → 9 parallel fork agents (5–8 min each) → seam sheet → render. That's about 30 min
  from approval to the final MP4.
- Exporting shared sets from the pilot (`window.SETS`) and pre-creating stub files and script tags, so no agent touched a shared file.
- The seam contract (matching wipe colours, flash on drops) gave 10 clean seams on the first try.

**Broke / fix**
- Pilot pass 1: characters tiny at camera zoom 1.0. Fix: zoom 1.3–1.5, unit 28–34 for leads.
- Whip pans showed bare paper because background rects only spanned W ± 900. Fix: size backgrounds to the widest camera x plus 1200.
- A scribble drawn as a zig-zag read as the letter "M". Fix: a looping path, `cos(a), sin(1.13a)`.
- A two-point curved `inkLine` doesn't render (found in c09). Fix: always give a midpoint.
- Props under the karaoke bar (y > 950) were hidden. Keep action above y ≈ 920.
- The big "(WE DO!)" caption revealed word by word. Fix: show big single-shout lines whole.
- QuickTime stalls were likely Spotlight indexing thousands of frames plus huge grainy MP4s. Fix: `out/frames.noindex`.

**Weak in the result (try next time)**
- Chorus "3D" is only parallax plus shake. Try more depth layers, scale-by-depth crowds and dolly-zoom moves.
- Small props (padlock, atoms, neighbours' props) are easy to miss. Rule: a prop that carries a joke is at least 120 px.
- Hands don't grip props. Add `handL`/`handR` hooks in `pip()` (they exist) and use them.
- Quality is uneven between agents. Have one reviewer agent pass over every chapter's sheet before the full render.
- Audio sync isn't verified numerically. Borrow video-studio's cross-correlation check (±20 ms).
