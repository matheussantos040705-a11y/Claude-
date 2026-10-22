# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "pillow"]
# ///
"""Find dead stretches: low-motion spans in rendered frames.

  uv run motion_audit.py out/frames.noindex [--fps 24] [--min 2.0] [--thresh auto]

Compares frames 1/6 s apart (downscaled, grey) and prints spans of >= --min seconds whose motion stays under the
threshold (default: the 15th percentile of the whole video). The lyric type changes count as motion, so a flagged
span is truly still; an unflagged one can still be "only the words move": check those by eye.
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("frames", type=Path)
ap.add_argument("--fps", type=int, default=24)
ap.add_argument("--min", type=float, default=2.0)
ap.add_argument("--thresh", default="auto")
ap.add_argument("--ignore-top", type=float, default=0.33, help="ignore the top fraction (lyric type lives there)")
a = ap.parse_args()
files = sorted(a.frames.glob("f*.jpg"))
step = a.fps // 6
prev, t, scores = None, [], []
for i in range(0, len(files), step):
    im = np.asarray(Image.open(files[i]).convert("L").resize((160, 90)), dtype=np.float32)
    im = im[int(90 * a.ignore_top):]
    if prev is not None:
        t.append(i / a.fps); scores.append(float(np.abs(im - prev).mean()))
    prev = im
s = np.array(scores); th = np.percentile(s, 15) if a.thresh == "auto" else float(a.thresh)
print(f"{len(s)} samples, motion median {np.median(s):.2f}, threshold {th:.2f}")
run = None
for ti, v in zip(t + [1e9], list(s) + [1e9]):
    if v < th:
        run = run or ti
    else:
        if run is not None and ti - run >= a.min:
            print(f"  still {run:7.2f} – {ti:7.2f}  ({ti - run:.1f} s)")
        run = None
