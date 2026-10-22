// kit/audio.js: Audio synchronization, beat mapping, and rhythmic choreography helpers.
//
// These utilities lock animated motion, camera hits, and shot transitions to an audio track.
// All functions are deterministic pure functions of time t.

/**
 * Returns 0..1 progress through the current musical bar.
 * @param {number} t - Current video time in seconds
 * @param {number} beatsPerBar - Typically 4 (or 3 for waltz)
 */
function barProgress(t, beatsPerBar = 4) {
  const beat = (t - (PROJECT.offset || 0)) / (60 / PROJECT.bpm);
  return (beat % beatsPerBar + beatsPerBar) % beatsPerBar / beatsPerBar;
}

/**
 * Returns the current bar index (integer).
 */
function barNumber(t, beatsPerBar = 4) {
  const beat = (t - (PROJECT.offset || 0)) / (60 / PROJECT.bpm);
  return Math.floor(beat / beatsPerBar);
}

/**
 * Returns 1 on the exact downbeat of every N bars, then decays smoothly.
 * Great for camera hits, flashes, and big choreography impacts.
 * @param {number} t - Time in seconds
 * @param {number} barInterval - Every N bars (default: 1 = every bar)
 * @param {number} decay - Decay speed (higher = sharper snap)
 */
function downbeatHit(t, barInterval = 1, decay = 8) {
  const bar = barProgress(t, 4 * barInterval);
  return Math.exp(-bar * decay);
}

/**
 * Checks if current time is within [center - windowSec, center + windowSec].
 * Returns 0..1 peak at center. Useful for choreographing actions to specific audio events.
 */
function audioCue(t, cueTime, windowSec = 0.25) {
  const d = Math.abs(t - cueTime);
  if (d > windowSec) return 0;
  return Math.cos((d / windowSec) * (Math.PI / 2));
}

/**
 * Creates an envelope that rises before an audio hit (anticipation) and springs after it (reaction).
 * @param {number} t - Time in seconds
 * @param {number} hitTime - Exact timestamp of the musical drop / cymbal / lyric hit
 * @param {number} antDur - Anticipation duration before the hit (e.g. 0.3s)
 * @param {number} springDur - Reaction settle duration after the hit (e.g. 0.6s)
 */
function musicalImpact(t, hitTime, antDur = 0.25, springDur = 0.5) {
  if (t < hitTime - antDur || t > hitTime + springDur) return 0;
  if (t < hitTime) {
    // Anticipation: crouch or wind up
    const k = (t - (hitTime - antDur)) / antDur;
    return -Math.sin(k * Math.PI * 0.5) * 0.5;
  } else {
    // Reaction & spring overshoot
    const k = (t - hitTime) / springDur;
    return Math.exp(-k * 5) * Math.sin(k * Math.PI * 3);
  }
}
