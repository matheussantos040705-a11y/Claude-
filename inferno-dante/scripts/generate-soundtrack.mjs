// Synthesizes the soundtrack of the Inferno video, cue by cue, in sync with
// the scene timings in src/Inferno.tsx. No samples and no dependencies: every
// sound is built from oscillators, filtered noise and a small reverb.
//
//   node scripts/generate-soundtrack.mjs
//
// Writes public/inferno-soundtrack.mp3 (via ffmpeg) or, without ffmpeg,
// public/inferno-soundtrack.wav.

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FPS = 30;
const SR = 44100;
const TOTAL_FRAMES = 1516;
const DURATION = TOTAL_FRAMES / FPS;
const N = Math.ceil(DURATION * SR);
const TAU = Math.PI * 2;

// Absolute scene starts, in frames (see src/Inferno.tsx).
const SCENE = {
  selva: 0,
  porta: 220,
  descida: 460,
  cocito: 976,
  estrelas: 1216,
};
const sec = (frame) => frame / FPS;

const dryL = new Float32Array(N);
const dryR = new Float32Array(N);
const sendL = new Float32Array(N);
const sendR = new Float32Array(N);

// Deterministic randomness, so every run produces the same file.
const mulberry32 = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rand = mulberry32(1321);
const white = () => rand() * 2 - 1;

// Piecewise-linear automation: [[seconds, value], ...]
const automation = (points) => (t) => {
  if (t <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    if (t <= points[i][0]) {
      const [t0, v0] = points[i - 1];
      const [t1, v1] = points[i];
      return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
    }
  }
  return points[points.length - 1][1];
};

const add = (i, l, r, send = 0) => {
  if (i < 0 || i >= N) return;
  dryL[i] += l;
  dryR[i] += r;
  sendL[i] += l * send;
  sendR[i] += r * send;
};

// Chamberlin state-variable filter.
const svf = () => {
  let low = 0;
  let band = 0;
  return (input, cutoff, q = 0.7) => {
    const f = 2 * Math.sin((Math.PI * Math.min(cutoff, SR / 6)) / SR);
    low += f * band;
    const high = input - low - q * band;
    band += f * high;
    return { low, band, high };
  };
};

// ---------------------------------------------------------------- drones ---

// A warm, slightly detuned additive tone.
const drone = ({ freqs, gain, brightness, start = 0, end = DURATION, send = 0.25, wobble = 0.12 }) => {
  const i0 = Math.floor(start * SR);
  const i1 = Math.min(N, Math.floor(end * SR));
  const voices = [];
  freqs.forEach((f, v) => {
    [-1, 1].forEach((side) => {
      const phase = rand() * TAU;
      voices.push({
        f: f * (1 + side * 0.0018),
        pan: 0.5 + side * 0.35 * (v % 2 ? -1 : 1),
        lfo: phase,
        // One running phase per harmonic, so vibrato bends pitch without drift.
        phases: new Float64Array(7).map((_, k) => phase * (k + 1)),
      });
    });
  });
  for (let i = i0; i < i1; i++) {
    const t = i / SR;
    const g = gain(t);
    const b = brightness(t);
    let l = 0;
    let r = 0;
    for (const v of voices) {
      const vib = 1 + Math.sin(t * 0.37 * TAU + v.lfo) * 0.0015 * wobble * 10;
      const inc = (TAU * v.f * vib) / SR;
      let s = 0;
      for (let k = 1; k <= 7; k++) {
        v.phases[k - 1] += inc * k;
        s += (Math.sin(v.phases[k - 1]) / k) * Math.exp(-(k - 1) * (1.4 - b));
      }
      if (g <= 0) continue;
      l += s * (1 - v.pan);
      r += s * v.pan;
    }
    const swell = 0.8 + 0.2 * Math.sin(t * 0.11 * TAU);
    add(i, l * g * swell / voices.length, r * g * swell / voices.length, send);
  }
};

// Filtered noise with moving centre frequency: wind, breath, risers.
const noiseBed = ({ gain, cutoff, q = 0.9, start = 0, end = DURATION, send = 0.1, mode = "band" }) => {
  const fl = svf();
  const fr = svf();
  for (let i = Math.floor(start * SR); i < Math.min(N, Math.floor(end * SR)); i++) {
    const t = i / SR;
    const g = gain(t);
    const c = cutoff(t);
    const l = fl(white(), c, q)[mode];
    const r = fr(white(), c * 1.07, q)[mode];
    add(i, l * g, r * g, send);
  }
};

const brownRumble = ({ gain, start = 0, end = DURATION }) => {
  let b = 0;
  const lp = svf();
  for (let i = Math.floor(start * SR); i < Math.min(N, Math.floor(end * SR)); i++) {
    const t = i / SR;
    b = (b + 0.02 * white()) / 1.02;
    const s = lp(b * 3.5, 90, 0.8).low * gain(t);
    add(i, s, s, 0.05);
  }
};

// ----------------------------------------------------------------- events ---

const boom = (t0, { amp = 0.9, f0 = 110, f1 = 42, decay = 1.3, click = 0.4, send = 0.35 } = {}) => {
  const i0 = Math.floor(t0 * SR);
  const len = Math.floor((decay * 4 + 0.2) * SR);
  let phase = 0;
  const lp = svf();
  for (let j = 0; j < len; j++) {
    const dt = j / SR;
    const f = f1 + (f0 - f1) * Math.exp(-dt * 9);
    phase += (TAU * f) / SR;
    const body = Math.sin(phase) * Math.exp(-dt / decay);
    const transient = lp(white(), 900, 0.7).low * Math.exp(-dt * 28) * click;
    const s = (body + transient) * amp * Math.min(1, dt * 400);
    add(i0 + j, s, s, send);
  }
};

const heartbeat = (t0, amp) => {
  boom(t0, { amp, f0: 95, f1: 44, decay: 0.32, click: 0.25, send: 0.2 });
  boom(t0 + 0.19, { amp: amp * 0.6, f0: 80, f1: 40, decay: 0.28, click: 0.15, send: 0.2 });
};

// Inharmonic church-bell partials; long, beating decay.
const bell = (t0, f0, amp, { send = 0.5, pan = 0.5, length = 9 } = {}) => {
  const partials = [
    [0.5, 0.55, 9],
    [1, 1, 6.5],
    [1.19, 0.65, 5],
    [1.5, 0.45, 4.2],
    [2, 0.55, 3.6],
    [2.5, 0.32, 2.6],
    [2.67, 0.28, 2.3],
    [3.01, 0.22, 1.9],
    [4.17, 0.16, 1.3],
    [5.43, 0.09, 0.9],
  ];
  const i0 = Math.floor(t0 * SR);
  const len = Math.floor(length * SR);
  const phases = partials.map(() => rand() * TAU);
  for (let j = 0; j < len; j++) {
    const dt = j / SR;
    let s = 0;
    partials.forEach(([ratio, a, d], k) => {
      const f = f0 * ratio;
      s += a * Math.exp(-dt / d) * (Math.sin(TAU * f * dt + phases[k]) + 0.6 * Math.sin(TAU * f * 1.0021 * dt));
    });
    s += white() * Math.exp(-dt * 60) * 0.6;
    s *= amp * Math.min(1, dt * 2000) * 0.32;
    add(i0 + j, s * (1 - pan) * 2 * 0.7, s * pan * 2 * 0.7, send);
  }
};

const whoosh = (t0, dur, { amp = 0.35, f0 = 300, f1 = 2400, panFrom = 0.3, panTo = 0.7, send = 0.25 } = {}) => {
  const fl = svf();
  const i0 = Math.floor(t0 * SR);
  const len = Math.floor(dur * SR);
  for (let j = 0; j < len; j++) {
    const p = j / len;
    const shape = Math.sin(Math.PI * p) ** 2;
    const c = f0 * (f1 / f0) ** p;
    const s = fl(white(), c, 0.55).band * shape * amp;
    const pan = panFrom + (panTo - panFrom) * p;
    add(i0 + j, s * (1 - pan) * 1.4, s * pan * 1.4, send);
  }
};

const growl = (t0, dur, amp) => {
  const fl = svf();
  let b = 0;
  const i0 = Math.floor(t0 * SR);
  const len = Math.floor(dur * SR);
  for (let j = 0; j < len; j++) {
    const dt = j / SR;
    b = (b + 0.05 * white()) / 1.05;
    const flutter = 0.55 + 0.45 * Math.sin(TAU * (28 + 6 * Math.sin(dt * 3)) * dt);
    const shape = Math.min(1, dt / 0.35) * Math.min(1, (dur - dt) / 0.6);
    const s = fl(b * 6, 160, 0.4).band * flutter * shape * amp;
    add(i0 + j, s * 0.8, s, 0.3);
  }
};

const ping = (t0, f, amp, decay, pan) => {
  const i0 = Math.floor(t0 * SR);
  const len = Math.floor(decay * 6 * SR);
  for (let j = 0; j < len; j++) {
    const dt = j / SR;
    const s = (Math.sin(TAU * f * dt) + 0.3 * Math.sin(TAU * f * 2.76 * dt) * Math.exp(-dt * 6)) * Math.exp(-dt / decay) * amp * Math.min(1, dt * 3000);
    add(i0 + j, s * (1 - pan), s * pan, 0.8);
  }
};

const crackles = (start, end, perSecond, amp) => {
  const count = Math.floor((end - start) * perSecond);
  for (let c = 0; c < count; c++) {
    const t0 = start + rand() * (end - start);
    const a = amp * (0.3 + rand() ** 3 * 1.4);
    const pan = 0.2 + rand() * 0.6;
    const hp = svf();
    const i0 = Math.floor(t0 * SR);
    const len = Math.floor(0.012 * SR);
    for (let j = 0; j < len; j++) {
      const s = hp(white(), 2500 + rand() * 3000, 0.5).high * Math.exp(-j / (0.0025 * SR)) * a;
      add(i0 + j, s * (1 - pan), s * pan, 0.1);
    }
  }
};

const shatter = (t0, amp) => {
  const hp = svf();
  const i0 = Math.floor(t0 * SR);
  const len = Math.floor(2.5 * SR);
  for (let j = 0; j < len; j++) {
    const dt = j / SR;
    const s = hp(white(), 3200, 0.6).high * Math.exp(-dt * 3.2) * amp;
    add(i0 + j, s * (0.7 + 0.3 * Math.sin(dt * 40)), s * (0.7 - 0.3 * Math.sin(dt * 40)), 0.6);
  }
  for (let k = 0; k < 34; k++) {
    ping(t0 + rand() * 0.7, 1800 + rand() * 5200, amp * 0.18 * (0.4 + rand()), 0.06 + rand() * 0.35, rand());
  }
};

// ---------------------------------------------------------------- score ---

const tPorta = sec(SCENE.porta);
const tDescida = sec(SCENE.descida);
const tCocito = sec(SCENE.cocito);
const tEstrelas = sec(SCENE.estrelas);

// The low A that carries us through Hell, darkening as we descend.
drone({
  freqs: [55, 82.41, 110],
  gain: automation([
    [0, 0],
    [3, 0.75],
    [tPorta, 0.55],
    [tDescida, 0.34],
    [tCocito - 0.4, 0.46],
    [tCocito + 0.3, 0.16],
    [tEstrelas, 0.12],
    [tEstrelas + 3, 0],
  ]),
  brightness: automation([
    [0, 0.25],
    [tDescida, 0.45],
    [tCocito - 0.4, 0.8],
    [tCocito + 0.3, 0.2],
  ]),
  end: tEstrelas + 3.2,
});

// A semitone above it: the dissonance that tightens the descent.
drone({
  freqs: [58.27, 116.54],
  gain: automation([
    [tDescida, 0],
    [tDescida + 6, 0.08],
    [tCocito - 0.4, 0.22],
    [tCocito + 0.2, 0],
  ]),
  brightness: automation([[0, 0.6]]),
  start: tDescida,
  end: tCocito + 0.3,
});

// Wind in the dark wood, then the freezing gale of the wings.
noiseBed({
  gain: automation([
    [0, 0],
    [1.5, 0.16],
    [tPorta, 0.12],
    [tPorta + 1, 0.025],
    [tCocito, 0.02],
    [tCocito + 1, 0.09],
    [tEstrelas, 0.05],
    [tEstrelas + 3, 0.012],
    [DURATION, 0],
  ]),
  cutoff: (t) =>
    (t < tCocito ? 420 : 900) * (1 + 0.45 * Math.sin(t * 0.31 * TAU) + 0.25 * Math.sin(t * 0.83 * TAU)),
  q: 1.1,
  send: 0.15,
});

// The furnace: rumble and crackling fire from the gate down to the eighth circle.
brownRumble({
  gain: automation([
    [tPorta - 1, 0],
    [tPorta + 1, 0.45],
    [tDescida, 0.6],
    [tCocito - 0.3, 0.8],
    [tCocito + 0.2, 0.05],
    [tEstrelas, 0],
  ]),
  start: tPorta - 1,
  end: tEstrelas,
});
crackles(tPorta, tDescida, 18, 0.22);
crackles(tDescida, tCocito - 0.5, 10, 0.16);

// Riser through the nine circles.
noiseBed({
  gain: automation([
    [tDescida, 0],
    [tCocito - 0.5, 0.13],
    [tCocito - 0.05, 0.2],
    [tCocito, 0],
  ]),
  cutoff: automation([
    [tDescida, 220],
    [tCocito, 3800],
  ]),
  q: 0.6,
  start: tDescida,
  end: tCocito + 0.05,
  send: 0.3,
});

// Selva oscura: the three beasts growl as their eyes open.
growl(sec(40), 1.6, 0.6);
growl(sec(70), 2.0, 0.75);
growl(sec(105), 1.8, 0.7);

// The gate: a hit, then a bell for each burning line of the inscription.
boom(tPorta + 0.15, { amp: 0.8, f0: 100, f1: 40, decay: 1.8 });
bell(sec(SCENE.porta + 30), 98, 0.4, { pan: 0.45 });
bell(sec(SCENE.porta + 70), 98, 0.35, { pan: 0.55 });
bell(sec(SCENE.porta + 112), 73.4, 0.45, { pan: 0.5 });
whoosh(sec(SCENE.porta + 200), 2.4, { amp: 0.55, f0: 120, f1: 3200, send: 0.35 });

// The plunge into each circle, and the heartbeat as we land on it.
for (let k = 0; k < 9; k++) {
  const plunge = sec(SCENE.descida + k * 60);
  const land = sec(SCENE.descida + k * 60 + 24);
  whoosh(plunge, 0.85, { amp: 0.22 + k * 0.02, f0: 2600, f1: 260, panFrom: 0.5 + (k % 2 ? 0.2 : -0.2), panTo: 0.5 });
  heartbeat(land, 0.55 + k * 0.045);
}

// Cocytus: fire turns to ice.
shatter(sec(SCENE.cocito + 12), 0.45);
boom(sec(SCENE.cocito + 12), { amp: 0.6, f0: 90, f1: 40, decay: 2.0, click: 0.8, send: 0.5 });
drone({
  freqs: [880, 1318.5, 1760, 2093],
  gain: automation([
    [tCocito, 0],
    [tCocito + 2, 0.035],
    [tEstrelas, 0.03],
    [tEstrelas + 1.5, 0],
  ]),
  brightness: automation([[0, 0]]),
  start: tCocito,
  end: tEstrelas + 1.6,
  send: 0.8,
});
// Each downstroke of the six wings.
[45, 135, 225].forEach((f) =>
  whoosh(sec(SCENE.cocito + f) - 0.7, 1.4, { amp: 0.45, f0: 140, f1: 700, panFrom: 0.2, panTo: 0.8, send: 0.2 }),
);
// Three faces, six eyes.
boom(sec(SCENE.cocito + 55), { amp: 0.35, f0: 70, f1: 40, decay: 0.9, click: 0.2 });
boom(sec(SCENE.cocito + 78), { amp: 0.4, f0: 66, f1: 38, decay: 1.0, click: 0.2 });
boom(sec(SCENE.cocito + 105), { amp: 0.7, f0: 80, f1: 38, decay: 2.4, click: 0.6, send: 0.5 });
drone({
  freqs: [55, 58.27, 82.41],
  gain: automation([
    [sec(SCENE.cocito + 105), 0],
    [sec(SCENE.cocito + 108), 0.3],
    [tEstrelas, 0.08],
    [tEstrelas + 1, 0],
  ]),
  brightness: automation([[0, 1]]),
  start: sec(SCENE.cocito + 105),
  end: tEstrelas + 1.1,
});

// The stars: A major at last.
drone({
  freqs: [110, 164.81, 220, 277.18, 329.63, 440],
  gain: automation([
    [tEstrelas, 0],
    [tEstrelas + 3.5, 0.95],
    [sec(SCENE.estrelas + 188), 1.15],
    [DURATION - 2.2, 0.95],
    [DURATION, 0],
  ]),
  brightness: automation([
    [tEstrelas, 0.2],
    [sec(SCENE.estrelas + 188), 0.7],
  ]),
  start: tEstrelas,
  send: 0.6,
  wobble: 0.3,
});
const pentatonic = [880, 987.77, 1108.73, 1318.51, 1479.98, 1760];
for (let c = 0; c < 20; c++) {
  const t0 = tEstrelas + 1.2 + rand() * 7.5;
  ping(t0, pentatonic[Math.floor(rand() * pentatonic.length)], 0.05 + rand() * 0.05, 0.5 + rand() * 0.6, 0.15 + rand() * 0.7);
}
bell(sec(SCENE.estrelas + 188), 110, 0.55, { send: 0.9, length: 4.4 });
boom(sec(SCENE.estrelas + 188), { amp: 0.5, f0: 80, f1: 40, decay: 1.6, click: 0.1, send: 0.6 });

// ---------------------------------------------------------------- reverb ---

const reverb = (input, offset) => {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356].map((d) => ({
    buf: new Float32Array(d + offset),
    i: 0,
    store: 0,
  }));
  const allpasses = [556, 441, 341].map((d) => ({ buf: new Float32Array(d + offset), i: 0 }));
  const out = new Float32Array(N);
  const feedback = 0.86;
  const damp = 0.3;
  for (let n = 0; n < N; n++) {
    const x = input[n] * 0.12;
    let s = 0;
    for (const c of combs) {
      const y = c.buf[c.i];
      c.store = y * (1 - damp) + c.store * damp;
      c.buf[c.i] = x + c.store * feedback;
      c.i = (c.i + 1) % c.buf.length;
      s += y;
    }
    for (const a of allpasses) {
      const y = a.buf[a.i];
      a.buf[a.i] = s + y * 0.5;
      s = y - s * 0.5;
      a.i = (a.i + 1) % a.buf.length;
    }
    out[n] = s;
  }
  return out;
};

const wetL = reverb(sendL, 0);
const wetR = reverb(sendR, 23);

// ----------------------------------------------------------------- master ---

const outL = new Float32Array(N);
const outR = new Float32Array(N);
// Two-pole high-pass at ~32 Hz: sub rumble nobody hears only eats headroom.
const hpL = [svf(), svf()];
const hpR = [svf(), svf()];
let peak = 0;
for (let n = 0; n < N; n++) {
  const t = n / SR;
  const fade = Math.min(1, t / 0.05, (DURATION - t) / 1.2);
  const l = hpL[1](hpL[0](dryL[n] + wetL[n] * 1.6, 32, 1.2).high, 32, 1.2).high;
  const r = hpR[1](hpR[0](dryR[n] + wetR[n] * 1.6, 32, 1.2).high, 32, 1.2).high;
  outL[n] = Math.tanh(l * 0.63) * fade;
  outR[n] = Math.tanh(r * 0.63) * fade;
  peak = Math.max(peak, Math.abs(outL[n]), Math.abs(outR[n]));
}
const norm = 0.78 / peak;

const wav = Buffer.alloc(44 + N * 4);
wav.write("RIFF", 0);
wav.writeUInt32LE(36 + N * 4, 4);
wav.write("WAVE", 8);
wav.write("fmt ", 12);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(SR, 24);
wav.writeUInt32LE(SR * 4, 28);
wav.writeUInt16LE(4, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) {
  wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, outL[n] * norm)) * 32767), 44 + n * 4);
  wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, outR[n] * norm)) * 32767), 46 + n * 4);
}

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const tmp = mkdtempSync(join(tmpdir(), "inferno-"));
const wavPath = join(tmp, "inferno-soundtrack.wav");
writeFileSync(wavPath, wav);

const mp3Path = join(publicDir, "inferno-soundtrack.mp3");
const encoders = [
  ["ffmpeg", []],
  ["npx", ["remotion", "ffmpeg"]],
];
const encoded = encoders.some(([cmd, prefix]) => {
  const result = spawnSync(
    cmd,
    [...prefix, "-y", "-loglevel", "error", "-i", wavPath, "-codec:a", "libmp3lame", "-b:a", "192k", mp3Path],
    { stdio: "inherit" },
  );
  return result.status === 0;
});

if (encoded) {
  console.log(`Wrote ${mp3Path} (${DURATION.toFixed(2)} s, peak before normalizing ${peak.toFixed(3)})`);
} else {
  const fallback = join(publicDir, "inferno-soundtrack.wav");
  writeFileSync(fallback, wav);
  console.log(`ffmpeg not found; wrote ${fallback}. Point src/Inferno.tsx at it.`);
}
rmSync(tmp, { recursive: true, force: true });
