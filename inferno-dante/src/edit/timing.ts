import grid from "./beat-grid.json";

// Every cut sits on the beat grid of the music, described in
// src/edit/beat-grid.json (shared with scripts/mix-audio.py). The edit uses
// two pieces of the track back to back; edit beat 0 is the first beat of
// the first piece.
export const FPS = grid.fps;

const { beatSeconds, segments, dropBeat } = grid.music;
const EDIT_BEATS = segments.reduce((sum, [from, to]) => sum + (to - from), 0);

/** Frame of edit beat n. */
export const beat = (n: number) => Math.round(n * beatSeconds * FPS);

/** Edit beat where the music drops back in after the breakdown. */
export const DROP = dropBeat;

/** Frame where the music is cut and the logo comes in. */
export const END = beat(EDIT_BEATS);

export const DURATION_IN_FRAMES = END + Math.round(grid.logoSeconds * FPS);
