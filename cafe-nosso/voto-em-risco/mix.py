"""Monta o áudio do vídeo "Querem tirar o seu voto": escolhe as tomadas da narração,
define a linha do tempo, sintetiza a trilha de tensão e os efeitos e mixa tudo a -14 LUFS.

Saídas: voto-em-risco.wav e vr-timeline.json (copiados para o projeto Remotion).
"""
import json, os, re, shutil, subprocess, sys, unicodedata
import numpy as np
from pedalboard import Pedalboard, Reverb, Compressor, Limiter, LowpassFilter, HighpassFilter
from pedalboard.io import AudioFile

HERE = os.path.dirname(os.path.abspath(__file__))
VID = os.path.join(HERE, "..", "..", "voto-feminino", "video")
SR = 48000
os.chdir(HERE)


def load(p):
    with AudioFile(p) as f:
        x = f.read(f.frames).mean(0)
        sr = f.samplerate
    if sr != SR:
        x = np.interp(np.arange(int(len(x) * SR / sr)) / SR, np.arange(len(x)) / sr, x)
    return x.astype(np.float32)

def trim(x, thr=0.01):
    e = np.convolve(np.abs(x), np.ones(480) / 480, "same")
    idx = np.where(e > thr * e.max())[0]
    return x[max(0, idx[0] - 1200): idx[-1] + 4800] if len(idx) else x

# ---------------------------------------------------------------- escolha das tomadas
ref = [l.strip() for l in open("narracao/frases.txt", encoding="utf-8") if l.strip()]
def norm(s):
    s = s.lower()
    for k, v in {"1932": "mil novecentos e trinta e dois", "2026": "dois mil e vinte e seis", "52%": "cinquenta e dois por cento", "52": "cinquenta e dois"}.items():
        s = s.replace(k, v)
    s = "".join(c for c in unicodedata.normalize("NFD", s) if not unicodedata.combining(c))
    return re.sub(r"[^a-z ]", " ", s).split()
def wer(a, b):
    d = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a) + 1): d[i][0] = i
    for j in range(len(b) + 1): d[0][j] = j
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            d[i][j] = min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (a[i-1] != b[j-1]))
    return d[-1][-1] / max(1, len(a))
sc = {}
for l in open("narracao/scores.txt"):
    p = l.split()
    if p and p[0].endswith(".wav"): sc[p[0]] = float(p[1])
tr = dict(l.rstrip("\n").split("|", 1) for l in open("narracao/trans.txt", encoding="utf-8") if "|" in l)
narr = {}
for i in range(1, 5):
    best = None
    for tk in ("t7", "t19", "t31"):
        k = f"{tk}/f{i}.wav"
        if k not in sc or k not in tr: continue
        s = sc[k] - 4 * wer(norm(ref[i - 1]), norm(tr[k]))
        if best is None or s > best[0]: best = (s, k)
    # 10% mais rápido (sem mudar o tom) para caber em ~70 s
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"narracao/{best[1]}", "-af", "atempo=1.1", "-ar", "48000", "narracao/_tmp.wav"], check=True)
    narr[f"n{i}"] = trim(load("narracao/_tmp.wav"))
    print(f"n{i}: {best[1]}  {tr[best[1]]}")

clips = {c["id"]: load(f"recortes/{c['id']}.wav") for c in json.load(open("clips.json"))}

# ---------------------------------------------------------------- linha do tempo
ORDER = [("clip", "figueiredo"), ("narr", "n1"), ("clip", "pietra1"), ("narr", "n2"), ("clip", "pietra2"),
         ("clip", "campopiano"), ("narr", "n3"), ("narr", "n4")]
GAP = 0.2
t = 0.3
segs = []
for kind, sid in ORDER:
    x = clips[sid] if kind == "clip" else narr[sid]
    segs.append(dict(type=kind, id=sid, start=t, dur=len(x) / SR))
    t += len(x) / SR + GAP
TOTAL = round(t + 2.0, 2)          # respiro final com a assinatura
for s in segs:                      # cada cena começa um pouco antes da fala
    s["from"] = round(max(0, s["start"] - 0.25), 3)
segs[0]["from"] = 0
N = int(TOTAL * SR)
print("total", TOTAL)

def t_(n): return np.arange(n) / SR
def env(n, a, d): x = t_(n); return np.minimum(x / max(a, 1e-4), 1) * np.exp(-x / d)
rng = np.random.default_rng(2026)
def noise(n): return rng.standard_normal(n)
def lp(x, k): return np.convolve(x, np.ones(k) / k, "same")

voice = np.zeros(N, np.float32)
for s in segs:
    x = clips[s["id"]] if s["type"] == "clip" else narr[s["id"]]
    i = int(s["start"] * SR); voice[i:i + len(x)] += x[: N - i]
voice_n = np.zeros(N, np.float32)   # só a narração (para o tratamento de voz)
for s in segs:
    if s["type"] == "narr":
        x = narr[s["id"]]; i = int(s["start"] * SR); voice_n[i:i + len(x)] += x[: N - i]
voice_c = voice - voice_n
voice_n = Pedalboard([HighpassFilter(cutoff_frequency_hz=75), Compressor(threshold_db=-20, ratio=2.5, attack_ms=8, release_ms=120)])(voice_n, SR)
voice_c = Pedalboard([HighpassFilter(cutoff_frequency_hz=90), LowpassFilter(cutoff_frequency_hz=9000)])(voice_c, SR)

# ---------------------------------------------------------------- trilha de tensão (Ré menor)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def saw(f, n, det):
    x = t_(n); return sum(2 * ((f * (1 + d) * x + rng.random()) % 1) - 1 for d in det) / len(det)
mus = np.zeros(N)
# drone grave que cresce até o fim
drone = (saw(hz(38), N, (-0.004, 0, 0.004)) + 0.6 * np.sin(2 * np.pi * hz(26) * t_(N)))
mus += lp(drone, 40) * (0.25 + 0.35 * t_(N) / TOTAL)
# pulso de semicolcheias (relógio), 96 BPM
step = 60 / 96 / 2
for k in range(int(TOTAL / step)):
    at = k * step; m = 62 if k % 8 < 6 else 65
    n = int(0.12 * SR); p = np.sin(2 * np.pi * hz(m) * t_(n)) * env(n, 0.002, 0.05)
    i = int(at * SR); mus[i:i + n] += p[: N - i] * (0.15 if k % 2 else 0.25)
# acorde final em Ré maior na assinatura
n4 = next(s for s in segs if s["id"] == "n4")
endc = int(n4["start"] * SR)
L = N - endc
chord = sum(saw(hz(m), L, (-0.006, 0, 0.006)) for m in (50, 54, 57, 62)) / 4
mus[endc:] = mus[endc:] * 0.3 + lp(chord, 6) * np.minimum(1, t_(L) / 0.8) * 0.5
mus *= np.minimum(1, (TOTAL - t_(N)) / 1.5)
mus = Pedalboard([LowpassFilter(cutoff_frequency_hz=5000), Reverb(room_size=0.7, wet_level=0.25)])(mus.astype(np.float32), SR)

# ---------------------------------------------------------------- efeitos
fx = np.zeros(N)
def put(sig, at, g=1.0):
    i = int(at * SR)
    if i < 0: sig = sig[-i:]; i = 0
    if i < N: fx[i:i + len(sig)] += sig[: N - i] * g
def stamp(k=1.0):
    n = int(0.5 * SR); x = t_(n)
    thud = np.sin(2 * np.pi * np.cumsum(55 + 90 * np.exp(-x / 0.02)) / SR) * env(n, 0.001, 0.12)
    return np.tanh((thud * 1.4 + (noise(n) - lp(noise(n), 9)) * env(n, 0.0005, 0.025)) * k)
def whoosh(d=0.5):
    n = int(d * SR); s = lp(noise(n), 2) - lp(noise(n), 30)
    return s * np.sin(np.pi * t_(n) / d) ** 2 * 1.5
def tape():
    """Clique de fita + chiado curto: entra o áudio original."""
    n = int(0.35 * SR); x = t_(n)
    click = (noise(n) - lp(noise(n), 3)) * env(n, 0.0002, 0.004) * 2
    hiss = (noise(n) - lp(noise(n), 4)) * 0.25 * np.exp(-x / 0.12)
    return click + hiss
def boom(d=2.0):
    n = int(d * SR); x = t_(n)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(32 + 70 * np.exp(-x / 0.15)) / SR) * env(n, 0.002, 0.7) * 1.8)
fps = 30
for s in segs:
    put(whoosh(0.4), s["start"] - 0.2, 0.35)
    if s["type"] == "clip":
        put(tape(), s["start"] - 0.12, 0.7)
        put(stamp(0.8), s["from"] + 0.9, 0.55)          # carimbo do recorte
dur_f = lambda s: (next((x["from"] for x in segs if x["from"] > s["from"]), TOTAL) - s["from"]) * fps
def hits(s, fr):
    for f in fr: put(stamp(), s["from"] + f / fps, 0.6)
S = {s["id"]: s for s in segs}
d = dur_f(S["n1"]); hits(S["n1"], [4, round(d * 0.42), round(d * 0.42) + 18])
d = dur_f(S["n2"]); hits(S["n2"], [9, round(d * 0.38) + 9, round(d * 0.66) + 9])
d = dur_f(S["n3"]); hits(S["n3"], [round(d * 0.12), round(d * 0.5)])
d = dur_f(S["n4"]); hits(S["n4"], [round(d * 0.42), round(d * 0.56)]); put(boom(), S["n4"]["from"] + round(d * 0.68) / fps, 0.8)
put(boom(2.5), S["n4"]["from"] + round(d * 0.86) / fps, 0.6)
# projetor ao fundo
proj = np.zeros(N); c = (noise(300) - lp(noise(300), 4)) * env(300, 0.0002, 0.0015)
for k in range(int(TOTAL * 24)):
    i = int(k / 24 * SR); proj[i:i + 300] += c[: max(0, N - i)]
fx += proj * 0.12
fx = Pedalboard([Reverb(room_size=0.35, wet_level=0.12)])(fx.astype(np.float32), SR)

# ---------------------------------------------------------------- mixagem com ducking
def envf(x, ms=40):
    k = int(SR * ms / 1000); e = np.convolve(np.abs(x), np.ones(k) / k, "same"); return e / (e.max() + 1e-9)
duck = 1 - 0.75 * np.clip(envf(voice, 60) * 4, 0, 1)
duck = np.convolve(duck, np.ones(int(0.25 * SR)) / int(0.25 * SR), "same")
mix = (voice_n * 1.0 + voice_c * 1.0) + mus * 0.22 * duck + fx * 0.35 * (0.5 + 0.5 * duck)
mix = np.stack([mix, mix]).astype(np.float32)
mix = Pedalboard([Compressor(threshold_db=-16, ratio=2, attack_ms=10, release_ms=150), Limiter(threshold_db=-1.5)])(mix, SR)
with AudioFile("pre.wav", "w", SR, 2, bit_depth=32) as f: f.write(mix)
J = subprocess.run(["ffmpeg", "-i", "pre.wav", "-af", "loudnorm=I=-14:TP=-1:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
J = json.loads(J[J.rindex("{"):J.rindex("}") + 1])
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "pre.wav", "-af",
                f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={J['input_i']}:measured_TP={J['input_tp']}:measured_LRA={J['input_lra']}:measured_thresh={J['input_thresh']}:offset={J['target_offset']}:linear=true",
                "-ar", "48000", "-c:a", "pcm_s16le", "voto-em-risco.wav"], check=True)
os.remove("pre.wav")
json.dump(dict(total=TOTAL, segments=[dict(type=s["type"], id=s["id"], **{"from": s["from"]}, dur=round(s["dur"], 3)) for s in segs]),
          open("vr-timeline.json", "w"), indent=1)
shutil.copy("voto-em-risco.wav", os.path.join(VID, "public", "audio", "voto-em-risco.wav"))
shutil.copy("vr-timeline.json", os.path.join(VID, "src", "vr-timeline.json"))
shutil.copy("clips.json", os.path.join(VID, "src", "vr-clips.json"))
print("ok")
