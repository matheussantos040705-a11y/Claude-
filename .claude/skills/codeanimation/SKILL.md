---
name: codeanimation
description: Create hand-painted 2D animated videos and motion graphics with p5.js and p5.brush. Use for character animation, visual explainers, or music-synchronized clips with storyboards, frame review, and MP4 export.
license: MIT
metadata:
  opencode/slash: "true"
---

Runtime requirements: Platform-agnostic. Runs in any coding environment or terminal with Node.js 20+, Google Chrome (or Chromium), and ffmpeg.

# Code Animation

This skill produces short, hand-crafted 2D animated videos and motion graphics rendered frame-by-frame with [p5.js](https://p5js.org) and [p5.brush](https://github.com/acamposuribe/p5.brush).

The aesthetic is physical and organic: boiling ink outlines, soft watercolor washes that bleed into the paper grain, additive glows, and calm, eased motion. Every frame is a deterministic pure function of time `t`, allowing instant seeking in the browser studio and fast parallel rendering to MP4 via headless Chrome and FFmpeg.

---

## The Three Core Goals

1. **Handmade:** Looks painted by hand on paper. Uses flat wash colors, bleeding watercolor fills, boiling linework (12 fps), and organic paper tooth. No sterile 3D projections, digital gradients, or vector flash shapes.
2. **Alive:** Constant subtle secondary motion: cameras gently push or drift, characters breathe on a beat, vegetation sways, and linework boils. A completely frozen frame reads as a bug.
3. **One Piece:** A cohesive short film or sequence planned as a whole. Scenes connect with deliberate transitions (brush wipes, irises, whip pans, cuts on action). Every visual element resolves.

---

## Invocation & Subcommands

Use the harness’s skill invocation syntax (for example `$codeanimation` in Codex or `/codeanimation` in Claude Code), or ask to use codeanimation in plain language. Resolve `<skill_dir>` to the directory containing this file. The slash commands below describe agent intents, not standalone shell commands.

When invoked with a command, the assistant routes directly to the requested mode:

### 1. Scaffolding a New Project
```text
/codeanimation scaffold <path> [--aspect=16:9|9:16|1:1] [--duration=10] [--bpm=120] [--audio=path]
```
- **Behavior:** The agent immediately runs the scaffolding script, creates directory structure, sets up `package.json`, `studio.html`, `src/config.js`, `src/scenes/main.js`, runs `npm install`, and verifies the setup:
  ```bash
  node <skill_dir>/kit/scaffold.mjs <path> [options]
  cd <path> && npm install
  ```

### 2. Visual Review & Checking
```text
/codeanimation review [sheet|strip|crop] [times...]
```
- **Behavior:** Runs headless checks (`render.mjs --sheet=...` or `--strip=...`) and inspects the resulting image files to audit poses, contacts, and transitions.

### 3. Rendering Final Video
```text
/codeanimation render [--out=path.mp4] [--workers=4]
```
- **Behavior:** Renders the active project to MP4 with FFmpeg audio muxing.

### 4. End-to-End Creative Direction
```text
/codeanimation [concept, character description, or song brief]
```
- **Behavior:** Begins the full creative pipeline: storyboards in `STORYBOARD.md`, designs character/visual rigs, codes scenes shot by shot, checks frames with contact sheets, and renders to MP4.

---

## Workflow

### 1. Ingest & Define the Vision
From the user's prompt, source brief, or script:
- **Core Subject:** Character narrative, music video, technical explainer, or motion graphic.
- **Audio & Rhythm:** If music or voiceover is provided, determine the BPM (tempo) and the first downbeat offset (in seconds).
- **Format:** Choose the aspect ratio in `src/config.js`:
  - `16:9` (1920×1080) for widescreen desktop / YouTube.
  - `9:16` (1080×1920) for vertical shorts / TikTok / Reels.
  - `1:1` (1080×1080) for square social loops.

### 2. Storyboard (`STORYBOARD.md`)
Write `STORYBOARD.md` before coding any scene:

```markdown
# Storyboard: [Title]

Logline: [One sentence summarizing the concept or story arc]
Format: [16:9 | 9:16 | 1:1], [duration]s, [bpm] BPM
Audio: [assets/audio.mp3 | None]
Palette: [Base paper, ink, and 3-5 accent colors]

## Shots
- Shot A (0.0s – 4.5s) [Transition in: Iris open]
  - Visual: [What is visible]
  - Event: [The focal action that occurs]
  - Reaction: [How the subject responds]
  - Reads:
    - 0.0s – 1.2s: Viewer finds the setting and character
    - 1.2s – 2.5s: The event occurs
    - 2.5s – 4.5s: Reaction registers, settles, and prepares for cut
  - Transition out: [Brush wipe]
```

**Timing Rule:** List the **reads** (what the viewer must find, process, and understand). Give each read dedicated time. Move quickly through actions, but hold time on reactions and consequences.

### 3. Setup Project
Run the scaffolding script in your target workspace directory:
```bash
node /path/to/skill/kit/scaffold.mjs [target_dir] --aspect=16:9 --bpm=120 --duration=12
```
Run rendering commands from the generated project directory, after `npm install`. The bundled `kit/` is a template, not a complete runnable project.

### 4. Rig the Subject
- **Characters:** Use `src/characters/actor.js` as a reference or create a custom rig using `src/characters/template.js` (see [characters.md](references/characters.md)). Define silhouette, drawn key views (`front`, `3/4`, `side`, `back`), facial states, and prop attachment hooks (`armL`, `armR`, `draw`).
- **Technical Explainers:** Define visual metaphors (nodes, conduits, packages, gears, waveforms) using `paint()`, `ribbon()`, `through()`, and `glow()` (see [explainers.md](references/explainers.md)).

### 5. Build Shot-by-Shot
In `src/scenes/`:
- Wrap each scene in an IIFE.
- Register shots in time order: `shots([[t0, fnA], [t1, fnB], ...])`.
- Each shot function signature: `fn(t, lt, dur)`
  - `t`: Total elapsed video time in seconds.
  - `lt`: Time elapsed within this shot (`t - t0`).
  - `dur`: Length of this shot.
- **Rule of Purity:** Do not store mutable global state across frames. Everything must compute deterministically from `t`.

```javascript
(() => {
  function shotA(t, lt, dur) {
    camBegin(W / 2 + 10 * Math.sin(lt * 0.4), H / 2, 1.0 + 0.01 * lt);
    
    // Background
    paint(rectPts(-200, -200, W + 400, H + 400), { wash: PAL.night, ink: null });
    
    // Character / Subject
    const mood = emotions(lt, [[0, 'happy'], [2.0, 'excited']]);
    actor(W / 2, H * 0.85, 26, mood);
    
    const focusPoint = toScreen(W / 2, H * 0.85 - 100);
    camEnd();
    
    // Transitions (screen space)
    if (lt < 0.4) iris(...focusPoint, lerp(0, 1600, easeIn(lt / 0.4)));
    if (lt > dur - 0.3) brushWipe((lt - (dur - 0.3)) / 0.6);
  }

  shots([[0, shotA]]);
})();
```

### 6. Visual Review Loop
Inspect your animation at multiple levels using headless Chrome:

```bash
# 1. Contact Sheet: Check storytelling and pose timing across the scene
node render.mjs --sheet=0.5,1.5,2.5,3.5 --cols=4 --w=360 --out=out/check/sheet.jpg

# 2. Frame Strip: Check transitions, takes, jumps, or turns frame-by-frame
node render.mjs --strip=1.8:2.4 --cols=6 --w=320 --out=out/check/strip.jpg

# 3. High-Res Crop: Verify face expressions, contact points, or hands
node render.mjs --sheet=2.0 --crop=860,650,400,400 --w=600 --out=out/check/crop.jpg
```

**What to check:**
- Is the focal event obvious from the contact sheet alone?
- Does every action have anticipation before and follow-through after?
- Are contacts solid (feet on the ground, props held in hands)?
- Does the linework boil consistently without unseeded jitter on still items?
- Do transitions cleanly bridge every shot boundary?

### 7. Render Final MP4
```bash
# Direct clip render (muxes audio from config.js if specified):
node render.mjs --clip --out=out/video.mp4

# Parallel frame rendering for long videos, followed by encoding:
node render.mjs --frames --workers=4
node render.mjs --encode --audio=assets/song.mp3 --out=out/video.mp4
```

---

## Core Rules

1. **No Raw Text Subtitles:** Do not transcribe spoken dialogue or lyrics onto the screen in typographic fonts. Act out meanings through pantomime, facial expressions, visual metaphors, or hand-painted comic sound marks (`sfx()`, `letter()`).
2. **Model the Viewer's Eye:** Sequence reads one at a time. The eye needs 0.3–0.5s to find an object, and 0.5–1.0s to register an emotional reaction.
3. **Seed Every Element with `boilSeed(key)`:** Prevent moving objects from shifting the random stream of static objects.
4. **Transition at Every Seam:** Always enter the first shot, bridge shot boundaries, and exit the final shot with an iris, wipe, pan, or cut on action.
5. **Lock to the Beat:** When music is present, set `PROJECT.bpm` and align choreography, camera hits, and shot cuts to musical bar lines and downbeats.

---

## Detailed References

- [Craft & Animation Principles](references/craft.md): The 12 principles in code, watercolor and ink rules, and timing models.
- [Character Design & Rigging](references/characters.md): Creating custom characters and personified objects.
- [Music & Audio Sync](references/music-and-audio.md): Working with audio tracks, BPM locking, and lyric choreography.
- [Technical & Explainer Animations](references/explainers.md): Data pipelines, system diagrams, and algorithmic visualizations.
- [Aspect Ratios & Framing](references/formats.md): 16:9 widescreen, 9:16 vertical shorts, and 1:1 square.
