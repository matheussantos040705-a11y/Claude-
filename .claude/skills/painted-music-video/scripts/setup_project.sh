#!/usr/bin/env bash
# setup_project.sh DIR — new coded-music-video project: ClaudeAnimationBase at the pinned commit + our overlay.
#   - clones the kit (MIT, JohnHeibel/ClaudeAnimationBase) at UPSTREAM_PIN, npm install
#   - adds src/cast.js (Pip, props, karaoke bar), wires lyrics/cast into studio.html, karaoke into timeline.js
#   - out/frames -> out/frames.noindex (keeps Spotlight from indexing thousands of frames)
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
DIR="${1:?usage: setup_project.sh DIR}"
PIN="$(cat "$HERE/UPSTREAM_PIN")"
[ -e "$DIR/studio.html" ] && { echo "$DIR already set up"; exit 0; }
git clone -q https://github.com/JohnHeibel/ClaudeAnimationBase.git "$DIR"
git -C "$DIR" checkout -q "$PIN"
(cd "$DIR" && npm install --silent)
cp "$HERE/template/src/cast.js" "$DIR/src/cast.js"
mkdir -p "$DIR/design" && cp "$HERE/template/design/style_tests.mjs" "$DIR/design/"   # G0 style stills
# vector styles: engine (self-disables when PROJECT.style is 'painted'), kinetic type, Clawd/props/rivals, shared sets
mkdir -p "$DIR/src/vec" "$DIR/src/scenes" && cp "$HERE"/template/src/vec/*.js "$DIR/src/vec/" && cp "$HERE/template/src/scenes/sets.js" "$DIR/src/scenes/" && cp "$HERE/template/CHAPTER_BRIEF.md" "$DIR/"
python3 - "$DIR" <<'PY'
import sys, pathlib
d = pathlib.Path(sys.argv[1])
s = (d / 'studio.html').read_text()
old = '<script src="src/scenes/demo.js"></script>'
assert old in s, 'studio.html layout changed upstream'
s = s.replace(old, '<script src="src/lyrics.js"></script>\n<script src="src/cast.js"></script>\n<!-- SCENES: one tag per chapter file, in song order -->')
s = s.replace('<script src="src/timeline.js"></script>', '<script src="src/timeline.js"></script>\n<script src="src/vec/engine.js"></script>\n<script src="src/vec/type.js"></script>')
s = s.replace('<script src="src/cast.js"></script>', '<script src="src/cast.js"></script>\n<script src="src/vec/vec.js"></script>\n<script src="src/vec/canvas.js"></script>\n<script src="src/vec/clawd.js"></script>\n<script src="src/vec/props.js"></script>\n<script src="src/vec/rivals.js"></script>\n<script src="src/scenes/sets.js"></script>')
(d / 'studio.html').write_text(s)
t = (d / 'src/timeline.js').read_text()
old = "    SHOTS[i][1](t, t - t0, end - t0);\n    CAM = null;\n"
assert old in t, 'timeline.js layout changed upstream'
t = t.replace(old, old + "    if (typeof karaoke === 'function') { boilSeed('karaoke'); karaoke(t); }\n")
(d / 'src/timeline.js').write_text(t)
PY
[ -f "$DIR/src/lyrics.js" ] || echo "const LY = [];" > "$DIR/src/lyrics.js"
mkdir -p "$DIR/out/frames.noindex" "$DIR/out/check" && ln -sfn frames.noindex "$DIR/out/frames"
echo "ready: $DIR  (next: uv run $HERE/scripts/analyze_song.py SONG --project $DIR)"
