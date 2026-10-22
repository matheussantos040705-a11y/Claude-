"""Pure-stdlib helpers (unit-tested): constant-tempo fit, SRT parsing, lyrics.js rendering.

Why phase-fit: librosa's beat_track tempo estimate was 95.7 BPM on zoo2; the true grid was 94.0. A 1.8% error
drifts a full beat off within ~35 s, so every later hit lands wrong. Fitting period + phase by maximising the
circular coherence of the detected beat times recovers the real grid.
"""
import cmath
import json
import math
import re


def fit_grid(beats, lo=0.30, hi=1.20, step=0.0001):
    """Return (period_s, offset_s, coherence) for the constant grid offset + k*period best matching `beats`.

    Searches beat periods in [lo, hi] s (50–200 BPM). Coherence is |mean(exp(2πi·t/P))| in 0..1.
    Half/double-time ambiguity: prefers the period nearest 0.5–0.75 s when coherences are within 2%.
    """
    if len(beats) < 4:
        raise ValueError("need at least 4 beats")
    best = []
    p = lo
    while p <= hi:
        z = sum(cmath.exp(2j * math.pi * t / p) for t in beats) / len(beats)
        best.append((abs(z), p, cmath.phase(z)))
        p += step
    top = max(b[0] for b in best)
    near = [b for b in best if b[0] >= top * 0.98]
    coh, period, ph = min(near, key=lambda b: abs(b[1] - 0.62)) if near else max(best)
    offset = (ph / (2 * math.pi) * period) % period
    # Refine: the coarse step leaves a small period error that accumulates over hundreds of beats. Assign each
    # beat its grid index, drop outliers (> 1/4 beat off), and least-squares fit t = offset + period * n.
    for _ in range(3):
        pts = [(round((t - offset) / period), t) for t in beats]
        pts = [(n, t) for n, t in pts if abs(t - offset - n * period) < period / 4]
        m = len(pts)
        sn = sum(n for n, _ in pts); st = sum(t for _, t in pts)
        snn = sum(n * n for n, _ in pts); snt = sum(n * t for n, t in pts)
        period = (m * snt - sn * st) / (m * snn - sn * sn)
        offset = (st - period * sn) / m
    return period, offset % period, coh


def parse_srt(text):
    """[(start, end, text)] including [Section] tags (zero-length lines kept)."""
    out = []
    for block in text.strip().split("\n\n"):
        rows = block.strip().split("\n")
        if len(rows) < 3 or " --> " not in rows[1]:
            continue
        a, b = rows[1].split(" --> ")
        out.append((_ts(a), _ts(b), " ".join(rows[2:]).strip()))
    return out


def _ts(x):
    h, m, s = x.strip().replace(",", ".").split(":")
    return int(h) * 3600 + int(m) * 60 + float(s)


def sections(srt):
    """[(start, name)] from '[Chorus]'-style tags (description tags like '[Beeps]' included; filter by name)."""
    return [(a, t[1:-1]) for a, b, t in srt if t.startswith("[") and t.endswith("]")]


def lyrics_js(srt):
    """JS source for `const LY = [[start, end, text], ...]` (tags dropped; zero-length shouts get 1 s)."""
    rows = []
    for a, b, t in srt:
        if t.startswith("["):
            continue
        if b - a < 0.05:
            b = a + 1.0
        rows.append(f"  {json.dumps([round(a, 2), round(b, 2), t])}")
    return "// lyrics.js: [start, end, text] from the song's SRT.\nconst LY = [\n" + ",\n".join(rows) + "\n];\n"


def config_js(duration, bpm, offset, audio):
    return ("// config.js: written by analyze_song.py (bpm/offset are phase-fitted to the beat track).\n"
            f"const PROJECT = {{ duration: {duration:.2f}, bpm: {bpm:.2f}, offset: {offset:.3f}, "
            f"audio: '{audio}', karaoke: true }};\n")
