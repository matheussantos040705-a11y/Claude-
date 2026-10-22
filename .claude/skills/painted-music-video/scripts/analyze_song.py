# /// script
# requires-python = ">=3.10,<3.14"
# dependencies = ["librosa>=0.10", "numpy", "soundfile", "scipy"]
# ///
"""Analyze a song for a coded music video.

  uv run analyze_song.py SONG.(mp3|m4a|wav) --project DIR [--srt LYRICS.srt]

Writes into DIR:  src/config.js, src/lyrics.js, analysis.json (bpm, offset, drops, sections, bar lines),
and copies the audio to assets/. If --srt is omitted, the SRT text track embedded in the file is used
(Suno exports carry one), else captions are skipped.
"""
import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import beatgrid  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio", type=Path)
    ap.add_argument("--project", type=Path, required=True)
    ap.add_argument("--srt", type=Path)
    a = ap.parse_args()
    import librosa
    import numpy as np
    from scipy.ndimage import uniform_filter1d
    from scipy.signal import find_peaks

    proj = a.project
    (proj / "src").mkdir(parents=True, exist_ok=True)
    (proj / "assets").mkdir(exist_ok=True)
    tmp = Path(tempfile.mkdtemp())
    wav = tmp / "a.wav"
    # opus-in-m4a etc. isn't readable by libsndfile: decode once with ffmpeg
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(a.audio), "-vn", "-ac", "1", "-ar", "22050", str(wav)], check=True)
    # audio for the renderer: mp3 is the most portable for ffmpeg muxing
    song = proj / "assets" / "song.mp3"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(a.audio), "-vn", "-c:a", "libmp3lame", "-b:a", "192k", str(song)], check=True)

    srt_text = ""
    if a.srt:
        srt_text = a.srt.read_text()
    else:
        out = tmp / "e.srt"
        r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(a.audio), "-map", "0:s:0", str(out)])
        if r.returncode == 0 and out.exists():
            srt_text = out.read_text()
    srt = beatgrid.parse_srt(srt_text) if srt_text else []

    y, sr = librosa.load(str(wav), sr=22050, mono=True)
    dur = len(y) / sr
    _, yp = librosa.effects.hpss(y)
    _, bf = librosa.beat.beat_track(y=yp, sr=sr, hop_length=512)
    beats = librosa.frames_to_time(bf, sr=sr, hop_length=512).tolist()
    period, offset, coh = beatgrid.fit_grid(beats)
    bpm = 60 / period

    rms = librosa.feature.rms(y=y, hop_length=512)[0]
    fps = sr / 512
    e1 = uniform_filter1d(rms, int(fps))
    past = np.concatenate([np.full(int(fps * 3), e1[0]), e1])[: len(e1)]
    rise = (e1 - past) / (np.percentile(rms, 95) + 1e-9)
    pk, _ = find_peaks(rise, height=0.35, distance=int(fps * 8))
    drops = [round(float(t), 2) for t in librosa.frames_to_time(pk, sr=sr, hop_length=512)]
    secs = beatgrid.sections(srt)

    (proj / "src" / "config.js").write_text(beatgrid.config_js(dur, bpm, offset, "assets/song.mp3"))
    (proj / "src" / "lyrics.js").write_text(beatgrid.lyrics_js(srt) if srt else "const LY = [];\n")
    info = dict(duration=round(dur, 3), bpm=round(bpm, 3), offset=round(offset, 3), coherence=round(coh, 3),
                beat=round(period, 5), energy_drops=drops, sections=secs, lyric_lines=sum(1 for x in srt if not x[2].startswith("[")),
                note="beat k at offset + k*beat; bar lines every 4 beats from offset; check drops vs section starts")
    (proj / "analysis.json").write_text(json.dumps(info, indent=1))
    print(json.dumps({k: info[k] for k in ("duration", "bpm", "offset", "coherence", "energy_drops", "lyric_lines")}))
    if coh < 0.6:
        print("WARNING: low beat coherence — tempo may vary or be half/double; check by ear", file=sys.stderr)
    if not srt:
        print("WARNING: no lyrics found — pass --srt or add timings by hand", file=sys.stderr)
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
