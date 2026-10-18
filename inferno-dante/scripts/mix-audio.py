"""Mixes the soundtrack of the Inferno edit: the music plus every sound effect,
placed on the beat grid in src/edit/beat-grid.json.

    python3 scripts/mix-audio.py

Needs numpy and ffmpeg. Sources are downloaded once into .audio-cache/:
the music (CC BY 4.0) and the effects from public-domain
(CC0) sound libraries on archive.org. Writes public/inferno-audio.mp3.
"""

import json
import os
import subprocess
import urllib.parse
import urllib.request

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, ".audio-cache")
GRID = json.load(open(os.path.join(ROOT, "src", "edit", "beat-grid.json")))
MUSIC = GRID["music"]
SR = 48000
BEAT_SECONDS = GRID["music"]["beatSeconds"]
DURATION = sum(to - frm for frm, to in GRID["music"]["segments"]) * BEAT_SECONDS + GRID["logoSeconds"]
N = int(DURATION * SR)

# name -> (archive.org item, file path inside the item)
SOURCES = {
    "chains-drag": ("Red_Library_Metal", "R16-33-Chains Dragging.wav"),
    "chains-rattle": ("Designers-Choice-Collection-Chains", "CHAINS/MOVEMENT/CHAINMvmt-Blue Snowball Microphone, MCU_Chains, Rattling, Rustling_The Designer's Choice_GNRL2.wav"),
    "chains-drop": ("Designers-Choice-Collection-Chains", "CHAINS/HANDLE/CHAINHndl-Blue Snowball Microphone, CU_Chains, Pick Up, Drop_The Designer's Choice_GNRL2.wav"),
    "man-moans": ("Red_Library_Voices_Men_1", "R21-08-Man Moans.wav"),
    "man-groaning": ("Red_Library_Voices_Men_1", "R15-56-Man Groaning in Sleep.wav"),
    "zombies-moaning": ("Red_Library_Voices_Mixed", "R15-58-Zombies Moaning.wav"),
    "man-sobs": ("Red_Library_Voices_Men_1", "R21-33-Man Sobs.wav"),
    "howling-screaming": ("Red_Library_Voices_Men_1", "R15-61-Howling and Screaming.wav"),
    "man-whispers": ("Red_Library_Voices_Men_1", "R21-27-Man Whispers.wav"),
    "dying-man": ("SSE_Library_VOICES", "MALE/VOXMale_Wheezing of dying man who?s been shot_CS_USC.wav"),
    "demons-scream": ("SSE_Library_CREATURES", "ETHEREAL/CREAEthr_Many demons scream for Sinbad; nested loops_CS_USC.wav"),
    "painful-panting": ("SSE_Library_CREATURES", "HUMANOID/CREAHmn-WEREWOLF_Tired painful panting of a werewolf_CS_USC.wav"),
    "panic-distance": ("SSE_Library_CROWDS", "PANIC/CRWDPanic_Medium distance panic crowd screams as it_CS_USC.wav"),
    "woman-terror": ("Designers-Choice-Collection-Voices", "VOICES/SCREAM/VOXScrm-CU_Woman's Terrorized Scream_Nicholas Judy_TDC.wav"),
    "man-fall-scream": ("Designers-Choice-Collection-Voices", "VOICES/SCREAM/VOXScrm-CU_Man, Scream, Fall Into Distance_Nicholas Judy_TDC.wav"),
    "ominous-storm": ("SSE_Library_DESIGNED", "RUMBLE/DSGNRmbl_Low and ominous sound; gathering storm; Paramount_CS_USC.wav"),
    "fire-rumble": ("SSE_Library_FIRE", "BURNING/FIREBurn_Fire burning with rumble; without crackle_CS_USC.wav"),
    "fire-crackle": ("SSE_Library_FIRE", "BURNING/FIREBurn_Heavy fire crackle_CS_USC.wav"),
    "metal-door": ("Red_Library_Impacts", "R19-29-Banging, Open and Close Large Metal Door.wav"),
    "impact-sweeteners": ("Red_Library_Impacts", "R29-27-Short Impact Sweeteners.wav"),
    "whoosh-low": ("Designers-Choice-Collection-Designed", "DESIGNED/WHOOSH/DSGNWhsh-CU_Slow, Low Whoosh_Nicholas Judy_TDC.wav"),
    "whoosh-huge": ("Designers-Choice-Collection-Designed", "DESIGNED/WHOOSH/DSGNWhsh-CU_Swoosh, Huge, Windy_Nicholas Judy_TDC.wav"),
    "heartbeat": ("SSE_Library_HUMAN", "HEARTBEAT/HMNHart_Human heartbeat_CS_USC.wav"),
    "explosion-rumble": ("SSE_Library_EXPLOSIONS", "REAL/EXPLReal_Atomic bomb explosion then rumble_CS_USC.wav"),
}


def fetch(url, path):
    if not os.path.exists(path):
        os.makedirs(CACHE, exist_ok=True)
        print("downloading", os.path.basename(path))
        urllib.request.urlretrieve(url, path)
    return path


def decode(path):
    raw = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True,
        check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


_clips = {}


def clip(name):
    if name not in _clips:
        item, inner = SOURCES[name]
        url = f"https://archive.org/download/{item}/{urllib.parse.quote(inner)}"
        x = decode(fetch(url, os.path.join(CACHE, name + os.path.splitext(inner)[1])))
        _clips[name] = x / (np.abs(x).max() + 1e-9) * 0.89
    return _clips[name]


# ------------------------------------------------------------- processing ---

def lowpass(x, cutoff, order=2):
    spec = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    spec *= (1 / np.sqrt(1 + (f / cutoff) ** (2 * order)))[:, None]
    return np.fft.irfft(spec, n=len(x), axis=0)


def highpass(x, cutoff, order=2):
    spec = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    spec *= (1 / np.sqrt(1 + (cutoff / np.maximum(f, 1e-3)) ** (2 * order)))[:, None]
    return np.fft.irfft(spec, n=len(x), axis=0)


def repitch(x, rate):
    """rate < 1 slows the sound down and lowers its pitch."""
    if rate == 1:
        return x
    src = np.arange(len(x))
    dst = np.arange(0, len(x) - 1, rate)
    return np.stack([np.interp(dst, src, x[:, c]) for c in range(2)], axis=1)


def fade(x, fade_in=0.01, fade_out=0.05):
    x = x.copy()
    a, b = int(fade_in * SR), int(fade_out * SR)
    if a:
        x[:a] *= np.linspace(0, 1, a)[:, None]
    if b:
        x[-b:] *= np.linspace(1, 0, b)[:, None]
    return x


def pan(x, position):
    """position in -1 (left) .. 1 (right), equal power."""
    angle = (position + 1) * np.pi / 4
    mono = x.mean(axis=1)
    return np.stack([mono * np.cos(angle), mono * np.sin(angle)], axis=1) * np.sqrt(2)


dry = np.zeros((N, 2))
send = np.zeros((N, 2))


def place(at, x, gain_db=0.0, reverb=0.0, envelope=None):
    i = int(at * SR)
    if i >= N:
        return
    x = x[: N - i] * 10 ** (gain_db / 20)
    if envelope is not None:
        t = np.arange(len(x)) / SR
        x = x * np.interp(t, *zip(*envelope))[:, None]
    dry[i : i + len(x)] += x * (1 - reverb * 0.5)
    send[i : i + len(x)] += x * reverb


def sfx(name, at, start=0.0, length=None, gain=0.0, reverb=0.0, rate=1.0, lp=None, hp=None,
        position=None, reverse=False, fade_in=0.01, fade_out=0.08, envelope=None):
    x = clip(name)
    a = int(start * SR)
    b = len(x) if length is None else min(len(x), a + int(length * SR * rate))
    x = x[a:b]
    if reverse:
        x = x[::-1]
    x = repitch(x, rate)
    if lp:
        x = lowpass(x, lp)
    if hp:
        x = highpass(x, hp)
    if position is not None:
        x = pan(x, position)
    place(at, fade(x, fade_in, fade_out), gain, reverb, envelope)


# ------------------------------------------------------------------ timing ---

BEAT = MUSIC["beatSeconds"]
FIRST = MUSIC["firstBeatInTrack"]
EDIT_BEATS = sum(to - frm for frm, to in MUSIC["segments"])
END = EDIT_BEATS * BEAT  # the music is cut here and the logo comes in
DROP = MUSIC["dropBeat"]


def beat(n):
    """Edit time, in seconds, of edit beat n."""
    return n * BEAT


# ------------------------------------------------------------------ music ---

# Splice the pieces of the track back to back. Each splice sits a hair before
# the beat, so the transient that lands on it stays intact.
track = decode(fetch(MUSIC["url"], os.path.join(CACHE, MUSIC["file"])))
pre = 0.015
at = 0.0
for i, (frm, to) in enumerate(MUSIC["segments"]):
    start = FIRST + frm * BEAT - (pre if i else 0)
    piece = track[int(start * SR) : int((FIRST + to * BEAT - pre) * SR)]
    place(at - (pre if i else 0), fade(piece, 0.01 if i else 0.005, 0.01))
    at += (to - frm) * BEAT

# ------------------------------------------------------------ the details ---

sfx("chains-drag", 0.0, 0.0, 2 * BEAT * 4, gain=-15, reverb=0.3, fade_out=0.6)
sfx("chains-drop", 0.0, 0.15, 0.9, gain=-9, reverb=0.3)
sfx("man-groaning", beat(6), 0.0, 3.0, gain=-15, reverb=0.5, rate=0.9, lp=3000)
sfx("howling-screaming", beat(14), 0.0, 3.0, gain=-19, reverb=0.6, lp=3500, position=-0.3)
sfx("panic-distance", beat(24), 2.0, 3.5, gain=-21, reverb=0.75, lp=3000, fade_in=0.4, fade_out=0.8)
sfx("whoosh-low", beat(26), 0.0, 2.0, gain=-15, rate=0.8, lp=1200)

# ----------------------------------------------- the breakdown: in the fog ---

sfx("chains-drag", beat(32), 7.25, 3.4, gain=-5, reverb=0.4, fade_in=0.1, fade_out=0.4)
sfx("man-moans", beat(32) + 0.3, 2.7, 3.2, gain=-9, reverb=0.65, lp=3000, position=0.3)
sfx("zombies-moaning", beat(33), 1.0, 3.0, gain=-12, reverb=0.7, rate=0.82, lp=2400, fade_in=0.5, fade_out=0.6)
sfx("man-whispers", beat(32), 0.0, 3.4, gain=-17, reverb=0.6, position=-0.45)
sfx("heartbeat", beat(36), 0.0, 1.7, gain=-6, lp=900, fade_out=0.3)
sfx("impact-sweeteners", beat(39.5), 5.75, 0.8, gain=-7, reverb=0.4)
sfx("whoosh-huge", beat(DROP) - 1.4, reverse=True, gain=-7, fade_in=0.2, fade_out=0.01)

# ---------------------------------------------------------------- the drop ---

sfx("explosion-rumble", beat(DROP), 0.0, 4.0, gain=-5, lp=260, fade_out=1.6)
sfx("chains-drop", beat(DROP), 0.15, 1.0, gain=-5, reverb=0.35)
sfx("woman-terror", beat(DROP) + 0.08, 0.0, 3.0, gain=-16, reverb=0.75, rate=0.9, lp=4000, position=0.3)
sfx("howling-screaming", beat(43), 0.0, 1.4, gain=-15, reverb=0.4)
# Marsyas, in red: the scream.
sfx("man-fall-scream", beat(54), 0.0, 1.7, gain=-7, reverb=0.5, rate=0.85, lp=5000, fade_out=0.25)
sfx("impact-sweeteners", beat(56), 8.25, 0.7, gain=-6, reverb=0.3)
sfx("chains-drop", beat(56), 0.15, 0.6, gain=-8, reverb=0.3)
sfx("explosion-rumble", beat(57), 0.0, 2.0, gain=-9, lp=240, fade_out=1.0)
sfx("man-sobs", beat(60), 4.4, 1.7, gain=-15, reverb=0.6, position=0.25)
# Lucifer roars, his wings beat.
sfx("demons-scream", beat(68), 30.0, END - beat(68), gain=-7, reverb=0.6, rate=0.5, lp=1100, fade_in=0.3, fade_out=0.03)
for k in (0.3, 1.2):
    sfx("whoosh-low", beat(68) + k, 0.0, 1.4, gain=-10, rate=0.7, lp=900)

# --------------------------------------------------------------- the logo ---

sfx("metal-door", END, 0.35, 1.8, gain=-1, reverb=0.9)
sfx("explosion-rumble", END, 0.0, 3.0, gain=-4, lp=220, fade_out=1.5)
sfx("chains-drop", END, 0.15, 1.0, gain=-6, reverb=0.6)
sfx("chains-drag", END + 1.3, 7.25, 1.9, gain=-13, reverb=0.55, fade_in=0.2, fade_out=0.7)

# ---------------------------------------------------------------- reverb ---

def cavern_ir(seconds=3.6, rt60=3.0):
    rng = np.random.default_rng(1321)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    decay = np.exp(-6.9 * t / rt60)
    ir = rng.standard_normal((n, 2)) * decay[:, None]
    # Darker as it decays: stone absorbs the highs.
    ir = lowpass(ir, 5000) * 0.6 + lowpass(ir, 1200) * 0.4
    ir[: int(0.025 * SR)] = 0  # pre-delay
    return ir / np.sqrt((ir ** 2).sum(axis=0))


def convolve(x, ir):
    size = 1 << int(np.ceil(np.log2(len(x) + len(ir))))
    out = np.fft.irfft(np.fft.rfft(x, size, axis=0) * np.fft.rfft(ir, size, axis=0), size, axis=0)
    return out[: len(x)]


wet = convolve(send, cavern_ir()) * 0.9
mix = dry + wet

# ---------------------------------------------------------------- master ---

mix = highpass(mix, 28)
target = 10 ** (-1.0 / 20)
drive = 1.15
# Gentle saturation, then a fixed level that lands near -13.5 LUFS, like
# the reference edit.
mix = np.tanh(mix * drive / (np.abs(mix).max() + 1e-9)) / np.tanh(drive)
mix *= target * 10 ** (-1.8 / 20)

out = os.path.join(ROOT, "public", "inferno-audio.mp3")
pcm = (np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes()
subprocess.run(
    ["ffmpeg", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-",
     "-codec:a", "libmp3lame", "-b:a", "192k", out],
    input=pcm,
    check=True,
)
print("wrote", out, f"({DURATION} s)")
