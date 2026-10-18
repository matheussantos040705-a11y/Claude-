"""Mixes the soundtrack of the Inferno edit: the music plus every sound effect,
placed on the beat grid in src/edit/beat-grid.json.

    python3 scripts/mix-audio.py

Needs numpy and ffmpeg. Sources are downloaded once into .audio-cache/:
the music from incompetech.com (CC BY 4.0) and the effects from public-domain
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
DURATION = GRID["durationSeconds"]
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

MS = MUSIC["startInTrack"]
BEAT = MUSIC["beatSeconds"]
DROP = MUSIC["dropInTrack"] - MS  # edit seconds
END = MUSIC["endInTrack"] - MS


def beat(n):
    """Edit time of beat n, counted from the drop (negative before it)."""
    return DROP + n * BEAT


SNARES = DROP + 12.5 * BEAT  # second, heavier half of the drop

# ------------------------------------------------------------------ music ---

music_path = fetch(MUSIC["url"], os.path.join(CACHE, MUSIC["file"]))
music = decode(music_path)[int(MS * SR) : int(MUSIC["endInTrack"] * SR)]
music = fade(music, 0.4, 0.015)
place(0, music, gain_db=0)
# Let the last hit ring out into the cavern after the hard cut.
place(END - 0.6, fade(music[-int(0.6 * SR):], 0.2, 0.01), gain_db=-6, reverb=1.0)

# ------------------------------------------------------- intro: the gate ---

# Darkness: chains dragging across stone, a storm gathering below.
sfx("ominous-storm", 0.0, gain=-10, lp=500, fade_in=2.5, fade_out=0.3,
    envelope=[(0, 1), (beat(-4) - 0.0, 1), (beat(-4) + 0.4, 0.35), (DROP, 0.35)])
sfx("chains-drag", 0.15, 0.0, 9.5, gain=-3, reverb=0.35)
sfx("man-whispers", 0.6, 0.0, 11.0, gain=-17, reverb=0.6, position=-0.45, lp=6000)

# Selva oscura: a single moan far away.
sfx("man-moans", 3.2, 2.7, 5.4, gain=-12, reverb=0.65, lp=2800, position=0.35)

# Acheron: the crowd of the damned at the shore, chains shifting.
sfx("zombies-moaning", beat(-20) + 0.2, gain=-8, reverb=0.7, rate=0.82, lp=2400, fade_in=1.2, fade_out=1.5)
sfx("chains-rattle", beat(-19), 10.0, 6.0, gain=-14, reverb=0.45, position=-0.3, fade_in=0.8, fade_out=1.0)
sfx("man-sobs", beat(-16), 4.4, 5.5, gain=-15, reverb=0.55, position=-0.4, lp=3500)

# The abyss: panting in pain, groaning, a heartbeat.
sfx("painful-panting", beat(-14) + 0.3, 50.0, 7.0, gain=-11, reverb=0.3, position=0.25, fade_in=0.6, fade_out=1.0)
sfx("man-groaning", beat(-13), 0.0, 8.0, gain=-14, reverb=0.55, rate=0.9, lp=3000, position=-0.2, fade_in=0.4, fade_out=1.2)
sfx("heartbeat", beat(-8), 0.0, 4.0, gain=-5, lp=900, fade_out=0.6)

# The damned rise toward the gate: a wall of screams, swelling.
sfx("demons-scream", beat(-8), 5.0, 6.4, gain=-12, reverb=0.7, rate=0.7, lp=1800, fade_in=2.5, fade_out=0.05,
    envelope=[(0, 0.3), (3.0, 1.0), (6.0, 1.0)])

# Subliminal flashes in the flicker sequence.
for n, start in zip((-7, -6, -5), (5.75, 8.25, 12.0)):
    sfx("impact-sweeteners", beat(n), start, 1.2, gain=-8, reverb=0.4)

# LASCIATE / OGNE / SPERANZA: the gate slams once per word.
for n in (-3, -2, -1):
    sfx("metal-door", beat(n), 0.35, 1.6, gain=-1, reverb=0.55, lp=6000)
    sfx("chains-drop", beat(n), 0.15, 0.9, gain=-6, reverb=0.3)
sfx("whoosh-huge", DROP - 2.3, reverse=True, gain=-6, fade_in=0.3, fade_out=0.01)

# ----------------------------------------------------------- the drop ---

sfx("explosion-rumble", DROP, 0.0, 5.0, gain=-3, lp=260, fade_out=2.0)
sfx("chains-drop", DROP, 0.15, 1.2, gain=-3, reverb=0.35)
sfx("woman-terror", DROP + 0.1, 0.0, 4.5, gain=-12, reverb=0.75, rate=0.9, lp=4000, position=0.3)
sfx("fire-rumble", DROP, 3.0, END - DROP, gain=-17, lp=1400, fade_in=1.0, fade_out=0.05)

# Second circle, the storm of the lustful.
sfx("whoosh-huge", beat(4), gain=-9, reverb=0.3)
sfx("howling-screaming", beat(4), 0.0, 5.5, gain=-14, reverb=0.65, lp=3500, position=-0.35)
# The Furies shriek from the tower.
sfx("demons-scream", beat(8), 20.0, 2.6, gain=-14, reverb=0.5, position=0.35)
sfx("fire-crackle", beat(10), 0.0, 2.2, gain=-12)
for n in (2, 6):
    sfx("chains-drop", beat(n), 0.15, 0.9, gain=-9, reverb=0.25)

# Heavier half: screams buried in the music, chains on the accents.
sfx("man-fall-scream", SNARES + BEAT, gain=-12, reverb=0.45, rate=0.95)
for k in (4, 8, 12):
    sfx("chains-drop", SNARES + k * BEAT, 0.15, 0.8, gain=-10, reverb=0.25)
sfx("dying-man", SNARES + 9 * BEAT, 6.5, 2.4, gain=-12, reverb=0.4, position=-0.2)
sfx("panic-distance", SNARES + 11 * BEAT, 2.0, 5.5, gain=-17, reverb=0.8, lp=3000, fade_in=0.8, fade_out=1.0)
sfx("man-sobs", SNARES + 14 * BEAT, 4.4, 3.2, gain=-12, reverb=0.6, position=0.25)

# Lucifer: the emperor of the woeful realm roars, his wings beat.
LUCIFER = SNARES + 18 * BEAT
sfx("demons-scream", LUCIFER, 30.0, END - LUCIFER, gain=-6, reverb=0.6, rate=0.5, lp=1100, fade_in=0.4, fade_out=0.05)
for k in (0.4, 2.0):
    sfx("whoosh-low", LUCIFER + k, 0.0, 2.2, gain=-8, rate=0.7, lp=900)

# ---------------------------------------------------------------- ending ---

sfx("metal-door", END, 0.35, 1.8, gain=0, reverb=0.9)
sfx("explosion-rumble", END, 0.0, 3.0, gain=-4, lp=220, fade_out=1.5)
sfx("chains-drop", END, 0.15, 1.0, gain=-5, reverb=0.6)
sfx("chains-drag", END + 1.1, 7.25, 2.6, gain=-9, reverb=0.55, fade_in=0.2, fade_out=0.8)
sfx("man-moans", END + 2.9, 9.4, 2.4, gain=-20, reverb=0.85, lp=2200, position=-0.3)

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
drive = 1.6
mix = np.tanh(mix * drive / (np.abs(mix).max() + 1e-9)) * target / np.tanh(drive)

out = os.path.join(ROOT, "public", "inferno-audio.mp3")
pcm = (np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes()
subprocess.run(
    ["ffmpeg", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-",
     "-codec:a", "libmp3lame", "-b:a", "192k", out],
    input=pcm,
    check=True,
)
print("wrote", out, f"({DURATION} s)")
