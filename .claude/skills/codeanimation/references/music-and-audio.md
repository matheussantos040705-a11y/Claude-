# Animating to Music & Audio

Music gives animated films natural rhythm, emotional drive, and narrative structure. This framework is engineered from the ground up for tight audiovisual synchronization.

---

## 1. Setup & Beat Mapping

### Step 1: Place the Audio File
Copy your audio track (MP3, WAV, AAC, M4A) into `assets/`, e.g., `assets/song.mp3`.

### Step 2: Determine BPM and Offset
1. **BPM (Beats Per Minute):** The song's tempo. (If unknown, tap tempo online or use DJ software/DAWs).
2. **Offset (seconds):** The exact timestamp where the first musical downbeat (Beat 1 of Bar 1) lands. If the music starts instantly on beat 1, `offset = 0`.
3. Configure `src/config.js`:
   ```javascript
   const PROJECT = {
     duration: 32,          // Total length of the video
     bpm: 124,              // Song tempo
     offset: 0.42,          // First downbeat at 0.42s
     audio: 'assets/song.mp3' // Audio file path
   };
   ```

---

## 2. Rhythmic Choreography Principles

### 1. Structure Shots to Musical Phrases
- In 4/4 music, musical ideas occur in 4-bar, 8-bar, or 16-bar phrases.
- At 120 BPM:
  - 1 beat = 0.50s
  - 1 bar (4 beats) = 2.00s
  - 4 bars = 8.00s
  - 8 bars = 16.00s
- **Rule of Staging:** Plan shot boundaries on bar lines. Cut to new angles or initiate transitions exactly as musical phrases change.

### 2. Lock Motion to the Pulse
Use the built-in rhythm helpers:
- `bpOf(t)`: Decimal beat progress.
- `beatN(t)`: Integer beat counter.
- `pulse(t, 6)`: Returns `1.0` on every beat, decaying exponentially.
- `pulse2(t, 6)`: Pulses on eighth notes.
- `downbeatHit(t, 2)`: Fires on the downbeat of every 2 bars.

Example: An idle bounce locked to the track:
```javascript
const bounce = pulse(t, 5);
const charY = groundY - bounce * 25; // Pops up on the beat, settles down
```

### 3. Anticipation Before Musical Hits
Never start an action on the beat hit. The **anticipation** must happen *before* the hit, so the impact lands squarely *on* the beat:
- If a snare or bass drop hits at `t = 4.0s`, begin the crouch/wind-up at `t = 3.75s` and execute the leap at `4.0s`.

---

## 4. Handling Lyrics and Dialogue: Show, Don't Subtitle

A common failure in AI-generated animation is plastering karaoke subtitles or dialogue transcriptions across the screen.

### The Golden Rule: Act the Meaning, Don't Write the Words
- **Visual Metaphor:** If the lyric mentions heartbreak, show a storm cloud with lightning or a dropping flower.
- **Character Pantomime:** If the voice says "I had no idea", show the character looking frantically left and right, shrugging with open palms, accompanied by a floating `?` emote.
- **Lyrical Pacing:** Sync facial expression switches (`emotions()`) to key vocal accents rather than trying to sync every single phoneme.
- **Calligraphic Sound Effects:** If an emphasis word is essential to the comedic timing, use `sfx("POW!", x, y, size, color, age)` or `letter()` as a painted comic-book impact mark, not a typographic subtitle.

---

## 5. Rendering & Encoding with Audio

When rendering the video:
```bash
# Render directly to MP4 with audio muxed:
node render.mjs --clip --out=out/music_video.mp4

# Or render frames in parallel with 4 workers, then encode with audio:
node render.mjs --frames --workers=4
node render.mjs --encode --audio=assets/song.mp3 --out=out/music_video.mp4
```
FFmpeg automatically aligns audio starting at `t = 0` and cuts cleanly at video duration with AAC 192k audio.
