---
name: music-video
description: Make a full-length music video for a song, drawn entirely from CODE (p5.js in headless Chrome: a hand-painted p5.brush cartoon, or crisp vector motion design via --style, ffmpeg for audio), with no AI image/video generation and no API spend beyond the Claude plan. Lyric-driven storyboard, phase-fitted beat grid, karaoke captions, a 30-second pilot gate, then chapters built in parallel by sub-agents. Use when asked to make, animate or storyboard a music video, lyric video or beat-synced animation, in ANY repo.
metadata:
  author: Sage Arbor
---

# music-video

## Subcommands (check these first)
| Invocation | Do this |
|---|---|
| `/music-video help`, `/music-video` with no song, or "how do I use this?" | Print the **Help** block below verbatim, then check prerequisites (`node -v`, `ffmpeg -version`, `uv --version`, Chrome present) and report each as ✅/❌ with the install command. Stop; don't start a video. |
| `/music-video lessons` | Print `LESSONS.md` (the newest entry in full, older entries as headings only). |
| `/music-video <song file> [lyrics.srt] [flags] [notes]` | Parse the **Flags** below, say in one line which gates are on and which choices are already set, then run the pipeline. |

**Help**
```
/music-video: turn a song into a beat-synced music video drawn entirely in code,
             from hand-painted cartoon to crisp marketing-style motion design.

USAGE
  /music-video ~/Downloads/song.mp3                     Suno files with embedded lyrics need nothing else
  /music-video ~/Downloads/song.mp3 lyrics.srt          other songs: give timed lyrics (.srt)
  /music-video song.mp3 "noir style, cat detective"     optional creative direction
  /music-video song.mp3 --auto --style=editorial --human=~/me.jpg --dir=~/musicVideos
                                                        fully automated: every choice set by flags
  /music-video help | lessons

FLAGS (default: stop at storyboard AND pilot for your approval)
  --skip=storyboard        don't wait on the storyboard; still wait on the pilot
  --skip=pilot             wait on the storyboard; don't wait on the pilot
  --skip=all  (or --auto)  no stops: song in, finished MP4 out, fully agentic
  --design                 MORE planning: adds a design stage (character model
                           sheets, palette swatches, one style frame per chapter)
                           and stops so you can iterate on the look before any
                           animation. Combine: --design --skip=pilot

CHOICES (unset ones are asked in a short interview; under --auto they take the default)
  --style=painted|editorial|keynote|geometric|hybrid
                           painted   = hand-painted watercolour cartoon (the original look)
                           editorial = warm paper, precise thin lines, serif type, calm
                           keynote   = near-black, glowing gradients, light beams, particles
                           geometric = Swiss grid, colour blocks, parametric curves, bold sans
                           hybrid    = editorial verses, keynote choruses
                           ask (default) = render one still per style and let you pick
                           auto default: editorial
  --lyrics=kinetic|bar|hooks|off   kinetic type / subtitle bar / hook lines only / none
                           (default: kinetic for vector styles, bar for painted)
  --density=bold|every-line|abstract
                           bold (default) = one strong image per 2–4 lines, extra gags as
                           background easter eggs; every-line = one gag per lyric line
  --human=PHOTO|pip        who plays "you": caricature from a photo, or the stock Pip
  --dir=PARENT             where song folders go (default ~/PROJECTS); PARENT/_shared/
                           keeps reusable things (your photo, your character) across videos
  --interview / --no-interview   force or skip the up-front interview (G0)

  Skipped gates are not skipped work: the artifact is still made and self-reviewed,
  and the choices it made are listed in DECISIONS.md for you to read afterwards.

WHAT HAPPENS (about 1.5–2 h with stops; about 45–60 min with --auto)
  1. Analyses the song: tempo, drops, sections, lyric timing
  1b. Interview: style stills + any unset choices, STOPS      (unless --auto / all set)
  2. Writes STORYBOARD.md and STOPS for your approval        (unless --skip)
  2b. With --design: model sheets + style frames, STOPS to iterate
  3. Builds a 30 s pilot clip and STOPS so you can watch it   (unless --skip)
  4. Builds the rest in parallel (sub-agents), checks every scene change
  5. Renders out/<song>_full.mp4 (1080p, H.264 + AAC), ready for YouTube

NEEDS   Node 20+, Google Chrome, ffmpeg, uv  (Mac: brew install node ffmpeg uv)
COST    no API spend; uses your Claude plan (a full song is a sizeable chunk of usage)
OUTPUT  a project folder (default ~/PROJECTS/<song>-video/, or --dir), outside any repo
AFTER   "add today's lessons to the music-video skill" makes the next video better
```

The finished example is the zoo2 video ("Please Select Your Ending", 4:30): about 100 shots, built in about 1 h 40 m wall clock.
`examples/zoo2/` has its storyboard, every chapter file and the making-of with timeline, tokens and cost. **Read
`LESSONS.md` before starting**: it is the improvement log, and it overrides anything here that it contradicts.

## Why code, not generation
Image models (Deforum, SDXL-Turbo img2img, etc.) re-guess every frame, which gives flicker, melting faces and bad hands.
Attempt 1 of zoo2 did that overnight and was rejected. Code-drawn frames are pure functions of song time:
smooth, on model and exactly on the beat. Cloud video models (Kling, Seedance, Veo) are the other route, at about $70–300 a song.

## Flags and gates
Parse flags from the arguments **and** from plain words: "no stops", "fully autonomous", "just make it" mean
`--skip=all`; "skip the storyboard approval" means `--skip=storyboard`; "let me see the characters first", "plan it
out more" mean `--design`. Values combine with commas (`--skip=storyboard,design`). Unknown flag: say so and stop.

| Gate | Default | When skipped |
|---|---|---|
| **G0 interview** | STOP when any choice below is unset | Under `--auto`/`--no-interview`, unset choices take their defaults and are logged to `DECISIONS.md`. |
| **G1 storyboard** | STOP | Write it, run one self-critique pass against the lyric sheet (one idea per line? every chorus a payoff? motif returns at the end?), then continue. |
| **G2 design** (only with `--design`) | STOP, iterate until approved | `--skip=design` keeps the stage but self-critiques the sheets instead of waiting. |
| **G3 pilot** | STOP | Still build the pilot (it creates the shared `SETS` the chapters need). Do **two** contact-sheet review passes and fix the usual first-pass bugs before continuing. |

**Choices** (`--style`, `--lyrics`, `--density`, `--human`, `--dir`; table in Help). Plain words count too: "clean",
"corporate", "marketing", "not kiddie", "crisp" mean a vector style (ask which, or `editorial` under `--auto`);
"like the zoo video", "hand-painted" mean `painted`. Record the final choices at the top of `STORYBOARD.md` and in
`src/config.js` as `PROJECT.style`, `PROJECT.lyrics`, so sub-agents inherit them.

A gate is only skipped when the user said so; when in doubt, stop. A STOP is real: end the turn and wait.
For every skipped gate, append to `DIR/DECISIONS.md`: the gate, what was decided, the alternatives you weighed,
and the paths of the images you reviewed. Link `DECISIONS.md` in the final report so the user can audit it.
Never skip the final ffprobe check and the lyric/frame spot check in step 8: those are verification, not approval.

## Pipeline (do these in order; the STOPs are real unless a flag skipped them)

1. **Project.** Make the project folder **outside** any repo: `PARENT/<song-slug>/` where PARENT is `--dir`
   (default `~/PROJECTS`), and move the song into its `assets/`. Put a reference photo (`--human`) in `PARENT/_shared/`.
   `bash ~/.claude/skills/music-video/scripts/setup_project.sh PARENT/<song-slug>`
   This clones ClaudeAnimationBase at `UPSTREAM_PIN`, adds `src/cast.js` (Pip, props, karaoke) and wires the karaoke in.
   It needs Node 20+, Chrome, ffmpeg, uv and git.
2. **Analyze.** `uv run ~/.claude/skills/music-video/scripts/analyze_song.py SONG --project DIR [--srt LYRICS.srt]`
   This writes `src/config.js` (phase-fitted bpm and offset), `src/lyrics.js` and `analysis.json`. **Never trust
   librosa's BPM.** Use the fitted value. Check `energy_drops` against the `[Chorus]` section starts. Suno exports
   embed an SRT track with `[Section]` tags; for other songs, get timings first (ask the user, or align with whisper).
   The fitted BPM can come out at double the felt tempo (low coherence, one lyric line = two "bars"): note the
   felt tempo in the storyboard and use `bt(2k)` for felt beats.
2b. **Interview (G0).** Skip it only when every choice is set or `--auto`/`--no-interview` was given. Otherwise:
   - **Style first, as pictures.** If `--style` is unset, render the comparison stills: `node design/style_tests.mjs`
     (copied in by setup) draws the SAME lyric moment in editorial, keynote, geometric and hybrid
     (`--line1/--line2/--stamp` set the words), into `out/design/style_test_*.jpg` and `style_tests_all.jpg`. Send
     them, plus one painted frame from the zoo2 example if the user hasn't seen it. People can't pick a style from words.
   - Then ask the remaining unset choices in **one** `AskUserQuestion` round (lyrics, density, human), plus the
     song-specific calls a storyboard can't make alone: how literally to show real brands or products, and
     how to show sensitive lyric lines (violence, scandal, real events).
   - **Reuse before redrawing:** if `PARENT/_shared/cast/` already has a character for this person (e.g. `<name>.js` +
     `<name>_body.js`, approved in an earlier video), copy those files into `src/vec/`, add their `<script>` tags after
     `vec.js`, and use them as-is (expression and pose controls included). Only redraw if the user asks for changes.
     After a new person is approved, copy their files into `PARENT/_shared/cast/` (with a line in `_shared/README.md`)
     so the next video reuses them.
   - With a new `--human` photo, look at it and write the caricature traits into `STORYBOARD.md` (head shape, hair or none,
     facial hair, brow, eyes, usual clothes). Draw from the traits; never trace or paste the photo into the video.
   **G0 — STOP** after sending the stills and questions. Combine answers into the choices, then go on.
3. **Read** `DIR/ANIMATION_GUIDE.md` (the kit's rules), `LESSONS.md` and one example chapter
   (`examples/zoo2/scenes/c01_pilot.js`) before writing anything. For a **vector style** (anything but `painted`), the
   guide's engine sections still apply (timeline, `shots()`, camera, easing, beat, review loop), but its look rules
   are reversed: see **Vector styles** below.
4. **Storyboard.** Write `DIR/STORYBOARD.md` (format: `examples/zoo2/STORYBOARD.md`) with the logline, cast,
   palette arc, motif, a chapter table for the whole song, and the pilot shot by shot with timed "reads".
   Image density follows `--density` (`bold`: one strong image per 2–4 lines, with the rest as background easter eggs;
   `every-line`: one per line, acted by characters). **G1 — STOP: show the user and wait for approval**
   (with `--skip=storyboard`/`all`: self-critique, log to `DECISIONS.md`, continue).
4b. **Design (only with `--design`).** Before any animation, settle the look as still images in `out/design/`:
   - `cast_<name>.jpg` model sheet per character: front, three-quarter and side view, 4 expressions
     (neutral, joy, fear, determination), 3 action poses from the storyboard, and a height line-up of the whole cast;
   - `palette.jpg`: swatch strip per chapter, showing the palette arc across the song;
   - `style_<chapter>.jpg`: one finished key frame per chapter at the storyboard's hero moment, lyrics on.
   Draw them with a throwaway `scenes/design.js` (a sheet-only chapter outside the song's time range) and
   `node render.mjs --sheet=...`; character code goes in `src/cast.js` additions that the chapters will reuse, so
   approved designs carry straight into the video. **G2 — STOP:** show the sheets; take notes ("bigger eyes",
   "warmer chorus palette"), re-render, repeat until the user approves. Then update `STORYBOARD.md` to match.
5. **Pilot.** Pick about 30 s that crosses a section boundary into a chorus. Build it as one chapter file with shared
   sets exported on `window.SETS` (see the end of `c01_pilot.js`). Check it with
   `node render.mjs --sheet=... --out=out/check/x.jpg` and `--strip=a:b`, and **look** at the images. The usual
   first-pass bugs: characters too small (push the camera in to 1.3–1.5×), background shapes not wide enough for
   whip pans, props hidden under the karaoke bar. For a vector style, build on `src/scenes/sets.js` (setup copies a
   working one: room, window, hallway, scroll, emotion blending; adapt it). Render `node render.mjs --clip --range=a:b --out=out/pilot.mp4`.
   **G3 — STOP: the user watches it and approves or gives changes** (with `--skip=pilot`/`all`: two review passes,
   log to `DECISIONS.md`, continue).
6. **Chapters in parallel.** Add stub files and their `<script>` tags in `studio.html` for every chapter first
   (an agent must never edit a shared file). Then launch one sub-agent per chapter (fork type, so it inherits
   this context). Give each one its time range, its lyric lines, its chapter brief from the storyboard,
   "YOUR FILE ONLY", the shared `SETS` and globals, and the **seam contract**:
   - between chapters, a transition with the SAME colours on both sides (painted: `brushWipe`, out `p<.5` in the last 0.3 s, in `.5+lt/.6`; vector: `V.wipe`, see CHAPTER_BRIEF.md);
   - into a chorus drop, a hard cut out and a flash in (`flash(1-lt/.18)` / `V.flash(1-lt/.2)`); vector chapter agents also get `CHAPTER_BRIEF.md`;
   - contact sheets go to `out/check/<chapter>_*.jpg` only, never `out/frames` or MP4s;
   - at least 2 review passes, then report the shot list and known weaknesses.
   Pair intro and outro in one agent so the ending rhymes with the opening.
   With `--design`, also give each agent its approved `out/design/style_<chapter>.jpg` as the look to match.
7. **Seams.** Render a sheet at each boundary ±0.04 and ±0.2 s and check that the wipe colours match and the flashes land.
7b. **Dead air.** After the frames exist, run `uv run ~/.claude/skills/music-video/scripts/motion_audit.py out/frames.noindex
   --thresh 1.0 --min 1.8` and look at every flagged span: an owner watching wants no stretch over ~1.5 s where the
   lead does nothing. Fix with the chapter's agent, re-render that range (`--frames --range=a:b` re-renders only
   missing frames: delete that range's frames first), re-encode.
8. **Render.** `node render.mjs --frames --workers=6`, then
   `node render.mjs --encode --audio=assets/song.mp3 --out=out/<song>_full.mp4`.
   Verify with ffprobe (duration ≈ song, 1920×1080, h264 + aac) and pull about 12 frames to check that the lyric
   matches the scene. Painted: about 0.1–0.6 s/frame (≈15 min for 4.5 min). Vector: a few ms/frame (JPEG encode dominates).
   While waiting, send finished chapters as clips: `node render.mjs --clip --range=a:b --out=out/clips/<ch>.mp4` (with audio).
9. **Log it.** Append what went wrong and what fixed it to `LESSONS.md` (dated). Copy the storyboard and chapter
   files into `examples/<song>/` if they're a better reference than zoo2. If this video improved the vector engine or
   cast (`src/vec/*.js`, `src/scenes/sets.js`), copy them back into `template/`. Write `MAKING-OF.md` with the timeline,
   tokens from `~/.claude/projects/<proj>/<session>.jsonl` usage fields (main plus `subagents/`), and API-equivalent cost.

## Vector styles (`--style=editorial|keynote|geometric|hybrid`)
The painted kit's look rules are reversed on purpose: these should look like a design team made them, not a kids' cartoon.
- **No boil, no brush.** Setup copies a working vector engine into `src/vec/` (wired into studio.html; active when
  `PROJECT.style` isn't `painted`): `engine.js` (Canvas2D frame + `V.*`: camera, bg, beam, glow, dust, reflect, layer,
  wipe/flash/fade/iris drawn after the lyrics), `type.js` (kinetic lyrics), `vec.js` + `canvas.js` (characters as models of exact
  curves with SVG (design sheets) and canvas (video) backends, so approved sheets animate unchanged), `clawd.js` (keynote Clawd: 9 emotions, baby/kid/grown/ghost forms, tattoos, HAL chest, hats), `props.js`, `rivals.js`.
- **Motion design, not cartoon acting.** Precise easing curves (`easeInOutCubic`, `backOut` used sparingly), shapes that
  morph and draw on, staggered reveals on the beat, slow camera moves and push-ins. Characters are simple and graphic
  and act with pose and timing, not squash and stretch.
- **Type is a design element.** With `--lyrics=kinetic`, lyrics are set in the layout and animated per word on the
  beat (fade, rise, mask-wipe, weight change). The hook word gets the accent colour. Set no more than one line
  big at a time; the karaoke bar is off.
- **Palette discipline.** 1 background, 1 ink, 1 accent per chapter (2 for the chorus), with the arc carried by the
  background. Use real black and white only in `keynote`.
- **Looks, from the style stills:** `editorial` (paper #F4EFE6, ink #1F1E1D, clay #D97757, serif display + tracked
  caps); `keynote` (radial near-black, gradient glass, volumetric beams, particles, rim-lit silhouettes, heavy sans);
  `geometric` (cream + navy/red/yellow/teal blocks, a 12-column grid, quarter circles, Helvetica-bold headlines);
  `hybrid` (editorial verses, keynote choruses, a hard diagonal or iris on the switch).

## House style for `painted` (from zoo2; change it per song)
- **Cast:** `pip()`, a human with hoodie, beanie, glasses and a pencil motif; `clawd()` with costume hats as the
  antagonist turned teammate; crowds are `pip()` with varied `hoodie`, `skin` and `pencil:false`.
- **Verses** are flat stage shots with a gentle camera. **Choruses** use parallax layers, push-ins, on-beat `shakeXY`,
  fireworks (`glow`) and painted `sfx()` hit words.
- **Captions:** the kit's guide says "no text"; music videos override that with the karaoke bar (`PROJECT.karaoke`).
  Keep scene text to one or two painted words, used once.
- **Beat helper:** `SETS.bt(k) = OFF + k*BEAT`. Put hits on `bt(k)` or on off-beats (`+BEAT/2`), and big changes on bar lines.
