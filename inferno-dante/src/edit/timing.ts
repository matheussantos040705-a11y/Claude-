import grid from "./beat-grid.json";

// Every cut is placed on the beat grid of the music, measured in
// src/edit/beat-grid.json (shared with scripts/mix-audio.py).
export const FPS = grid.fps;
export const DURATION_IN_FRAMES = Math.round(grid.durationSeconds * FPS);

const { startInTrack, endInTrack, beatSeconds, dropInTrack } = grid.music;
const DROP_SECONDS = dropInTrack - startInTrack;
// The heavier half of the drop, where the snares come in.
const SNARES_SECONDS = DROP_SECONDS + 12.5 * beatSeconds;

const toFrame = (seconds: number) => Math.round(seconds * FPS);

/** Frame of beat n, counted from the drop (negative before it). */
export const beat = (n: number) => toFrame(DROP_SECONDS + n * beatSeconds);

/** Frame of beat k of the snare section. */
export const snare = (k: number) => toFrame(SNARES_SECONDS + k * beatSeconds);

/** Frame where the music is cut to black. */
export const END = toFrame(endInTrack - startInTrack);
