"""Desenho de som do vídeo do voto feminino (45 s), sincronizado com video/src/cues.json.

Gera sfx.wav (estéreo, 48 kHz): projetor de cinema ao fundo, carimbos, cédula na urna,
palavras caindo, lápis desenhando os retratos, contador de anos, máquina de escrever,
marcha e multidão, contador de eleitoras, megafone, impacto final.
"""
import json, os, sys
import numpy as np
from pedalboard import Pedalboard, Reverb, HighpassFilter, LowpassFilter, Compressor, Limiter, PeakFilter
from pedalboard.io import AudioFile

HERE = os.path.dirname(os.path.abspath(__file__))
cue = json.load(open(os.path.join(HERE, "..", "video", "src", "cues.json")))
SCENE = dict(date=0, law=5.2, sky=8.7, celina=11.4, alzira=19.6, bertha=24.6, data=29.6, voice=35.3, poster=39.9, end=45.0)
SR = 48000
DUR = 45.0
N = int(SR * DUR)
FPS = 30
rng = np.random.default_rng(1932)


def t(n): return np.arange(n) / SR
def env(n, a, d): x = t(n); return np.minimum(x / max(a, 1e-4), 1) * np.exp(-x / d)
def noise(n): return rng.standard_normal(n)
def lp(x, k): return np.convolve(x, np.ones(k) / k, "same") if k > 1 else x
def bp(x, lo_k, hi_k): return lp(x, lo_k) - lp(x, hi_k)


class Bus:
    def __init__(self): self.x = np.zeros((2, N), np.float32)
    def put(self, sig, at, gain=1.0, pan=0.0):
        i = int(round(at * SR))
        if i >= N: return
        if i < 0: sig = sig[-i:]; i = 0
        sig = sig[: N - i] * gain
        self.x[0, i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
        self.x[1, i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))
    def fx(self, board): self.x = board(self.x, SR); return self


# ---------------------------------------------------------------- sons
def stamp(k=1.0):
    """Carimbo: baque grave + estalo de papel + chacoalhar curto."""
    n = int(0.6 * SR); x = t(n)
    thud = np.sin(2 * np.pi * np.cumsum(55 + 90 * np.exp(-x / 0.02)) / SR) * env(n, 0.001, 0.12)
    slap = bp(noise(n), 2, 9) * env(n, 0.0005, 0.025)
    rattle = bp(noise(n), 3, 20) * env(n, 0.01, 0.06) * 0.3
    return np.tanh((thud * 1.4 + slap * 0.9 + rattle) * (0.8 + 0.4 * k)) * k

def whoosh(dur=0.5, bright=1.0):
    n = int(dur * SR); x = t(n)
    s = bp(noise(n), 2, int(30 / bright))
    shape = np.sin(np.pi * x / dur) ** 2
    return s * shape * 1.6

def paper_swish(dur):
    n = int(dur * SR); x = t(n)
    s = bp(noise(n), 2, 6) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 7 * x)))
    return s * np.sin(np.pi * x / dur) * 0.6

def box_thunk():
    n = int(0.5 * SR); x = t(n)
    body = sum(np.sin(2 * np.pi * f * x) * np.exp(-x / d) for f, d in ((130, 0.09), (210, 0.05), (340, 0.03)))
    return np.tanh(body * 1.2 + bp(noise(n), 2, 12) * env(n, 0.0005, 0.01))

def whistle_down(dur=0.32):
    n = int(dur * SR); x = t(n)
    f = np.linspace(1700, 500, n)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * x / dur) * 0.25 + whoosh(dur) * 0.4

def pencil(dur, seed):
    """Lápis no papel: traços curtos de ruído rouco, com pressão variando."""
    r = np.random.default_rng(seed)
    n = int(dur * SR); out = np.zeros(n); i = 0
    while i < n - 2000:
        L = int(r.uniform(0.08, 0.38) * SR)
        L = min(L, n - i)
        s = bp(r.standard_normal(L), 2, 7)
        grain = (r.random(L) > 0.6) * 1.0
        press = np.sin(np.pi * np.arange(L) / L) ** 0.6 * r.uniform(0.4, 1.0)
        out[i:i + L] += s * (0.6 + 0.4 * lp(grain, 40)) * press
        i += L + int(r.uniform(0.02, 0.15) * SR)
    return out * 0.5

def tick(f=2400, d=0.012):
    n = int(0.06 * SR); x = t(n)
    return (np.sin(2 * np.pi * f * x) * 0.6 + bp(noise(n), 1, 4) * 0.5) * env(n, 0.0002, d)

def flap():
    """Contador mecânico de placas (flip): estalo seco."""
    n = int(0.07 * SR)
    return (bp(noise(n), 1, 3) * 0.8 + np.sin(2 * np.pi * 900 * t(n)) * 0.3) * env(n, 0.0003, 0.008)

def typekey(r):
    n = int(0.09 * SR); x = t(n)
    click = bp(r.standard_normal(n), 1, 3) * env(n, 0.0002, 0.006)
    thock = np.sin(2 * np.pi * r.uniform(180, 260) * x) * env(n, 0.0005, 0.02) * 0.6
    return click + thock

def bell_ding():
    n = int(1.4 * SR); x = t(n)
    return sum(np.sin(2 * np.pi * f * x) * np.exp(-x / d) * a for f, d, a in ((2093, 0.6, 1), (4186, 0.25, 0.4), (5640, 0.12, 0.2))) * 0.5

def marker(dur):
    n = int(dur * SR); x = t(n)
    squeak = np.sin(2 * np.pi * np.cumsum(1100 + 300 * np.sin(2 * np.pi * 9 * x)) / SR) * 0.15
    return (bp(noise(n), 1, 4) * 0.4 + squeak) * np.sin(np.pi * x / dur)

def footstep(r):
    n = int(0.25 * SR); x = t(n)
    boot = np.sin(2 * np.pi * np.cumsum(70 + 60 * np.exp(-x / 0.01)) / SR) * env(n, 0.001, 0.05)
    grit = bp(r.standard_normal(n), 2, 10) * env(n, 0.001, 0.03)
    return boot + grit * 0.7

def crowd(dur, seed, cheer=False):
    """Multidão: muitas vozes como ruído com formantes, respirando."""
    r = np.random.default_rng(seed)
    n = int(dur * SR); x = t(n); out = np.zeros(n)
    for _ in range(24):
        f0 = r.uniform(170, 320) if r.random() > 0.3 else r.uniform(100, 160)
        vib = np.sin(2 * np.pi * r.uniform(3, 6) * x + r.uniform(0, 6))
        ph = np.cumsum(f0 * (1 + 0.03 * vib + (0.25 * x / dur if cheer else 0))) / SR
        v = np.sign(np.sin(2 * np.pi * ph)) * 0.3 + np.sin(2 * np.pi * ph)
        amp = lp(r.random(n) > 0.997, 6000) * 40 if not cheer else np.ones(n)
        out += lp(v, 3) * np.clip(amp, 0, 1) * r.uniform(0.3, 1)
    out += bp(r.standard_normal(n), 2, 25) * 2.0
    return out / 12

def boom(dur=2.5):
    n = int(dur * SR); x = t(n)
    sub = np.sin(2 * np.pi * np.cumsum(32 + 70 * np.exp(-x / 0.15)) / SR) * env(n, 0.002, 0.8)
    crack = bp(noise(n), 1, 6) * env(n, 0.0005, 0.04)
    return np.tanh(sub * 1.8 + crack)

def riser(dur):
    n = int(dur * SR); x = t(n)
    s = bp(noise(n), 2, 40) * (x / dur) ** 2.5
    tone = np.sin(2 * np.pi * np.cumsum(200 + 1400 * (x / dur) ** 2) / SR) * (x / dur) ** 3 * 0.25
    return (s + tone) * 1.2

def projector(dur):
    """Projetor: claque do obturador a 24 q/s + zumbido do motor."""
    n = int(dur * SR); x = t(n); out = np.zeros(n)
    c = bp(noise(int(0.006 * SR)), 1, 4) * env(int(0.006 * SR), 0.0002, 0.0015)
    for k in range(int(dur * 24)):
        i = int(k / 24 * SR + rng.normal(0, 0.0006) * SR)
        if 0 <= i < n - len(c): out[i:i + len(c)] += c * (0.7 + 0.3 * (k % 2))
    hum = (np.sin(2 * np.pi * 60 * x) + 0.4 * np.sin(2 * np.pi * 120 * x)) * 0.08
    return out + hum


# ---------------------------------------------------------------- linha do tempo
amb, hits, fol = Bus(), Bus(), Bus()

proj = projector(DUR) * np.minimum(1, (DUR - t(N)) / 1.0)
amb.put(proj, 0, 0.18)

# impactos (os mesmos de fx.tsx)
FALL = 0.3
IMPACTS = [(cue["date24"], 1, -0.2), (cue["dateFev"], 0.6, 0.3), (cue["date1932"], 1.2, -0.1),
           (cue["lawVoto"], 0.8, -0.3), (cue["lawLei"], 1, 0.3),
           (cue["skyNao"] + FALL, 1, -0.2), (cue["skyCaiu"] + FALL, 1, 0.0), (cue["skyCeu"] + FALL, 1.3, 0.2),
           (cue["berthaName"], 0.8, -0.2), (cue["berthaMilhares"], 0.7, 0.2), (cue["berthaMulheres"], 0.5, 0), (cue["berthaAteLei"], 0.7, 0.3),
           (cue["voiceUse"], 0.9, 0.3), (cue["voiceSeuVoto"], 0.8, -0.3), (cue["voiceESua"], 0.7, 0.1), (cue["voiceVoz"], 1.6, 0)]
for at, k, pan in IMPACTS:
    hits.put(stamp(k), at, 0.75, pan)

# palavras caindo do céu: assobio descendo antes de bater
for key in ("skyNao", "skyCaiu", "skyCeu"):
    fol.put(whistle_down(), cue[key] - 0.02, 0.6)

# trocas de cena: varrida
for name in ("law", "sky", "celina", "alzira", "bertha", "data", "voice", "poster"):
    fol.put(whoosh(0.55), SCENE[name] - 0.32, 0.55, rng.uniform(-0.4, 0.4))

# cédula caindo na urna
fol.put(paper_swish(cue["ballotLand"] - cue["ballotStart"] + 0.1), cue["ballotStart"], 0.7, 0.1)
hits.put(box_thunk(), cue["ballotLand"], 0.9)

# lápis desenhando os retratos
for (a, b, sd) in ((SCENE["celina"], 15.6, 1), (SCENE["alzira"], 22.2, 2), (SCENE["bertha"], 26.8, 3)):
    fol.put(pencil(b - a, sd), a + 0.1, 0.55, 0.15)

# ano rolando 1900 → 1927 (estalos de contador mecânico, desacelerando)
ys, ye = cue["celinaYearStart"], cue["celinaYearEnd"]
prev = 1900
for f in range(int(ys * FPS), int(ye * FPS) + 1):
    p = (f / FPS - ys) / (ye - ys); v = round(1900 + 27 * (1 - (1 - min(1, max(0, p))) ** 3))
    for _ in range(v - prev): fol.put(flap(), f / FPS, 0.5, -0.2)
    prev = v
fol.put(stamp(0.5), ye + 0.03, 0.4)
fol.put(flap(), SCENE["alzira"] + 10 / FPS, 0.6, -0.2)   # 1927 → 1928

# máquina de escrever no local + sininho
for start, text in ((cue["celinaPlace"], "MOSSORÓ · RIO GRANDE DO NORTE"), (cue["alziraPlace"], "LAJES · RIO GRANDE DO NORTE")):
    r = np.random.default_rng(int(start * 100))
    for c in range(0, len(text), 1):
        if text[c] == " ": continue
        fol.put(typekey(r), start + c / (1.5 * FPS) + r.normal(0, 0.006), 0.35, 0.3)
    fol.put(bell_ding(), start + len(text) / (1.5 * FPS) + 0.05, 0.18, 0.4)

# nome surgindo (traço de pena) e faixa vermelha (varrida curta + carimbo)
for key in ("celinaName", "alziraName"):
    fol.put(whoosh(0.7, 2.0), cue[key], 0.3, -0.3)
for key in ("celinaBadge", "alziraBadge"):
    fol.put(whoosh(0.35, 1.5), cue[key] - 0.05, 0.45, 0.2)
    hits.put(stamp(0.5), cue[key] + 0.35, 0.5, 0.2)
fol.put(marker(0.45), cue["alziraUnderline"], 0.5, -0.1)

# Bertha: marcha e multidão
r = np.random.default_rng(7)
b0, b1 = SCENE["bertha"], SCENE["data"]
step = 0.5
for k in range(int((b1 - b0) / step * 3)):
    tt = b0 + 0.2 + (k // 3) * step + r.normal(0, 0.03) + (k % 3) * 0.06
    gain = 0.28 * min(1, (tt - b0) / 1.2) * min(1, (b1 - tt) / 0.6)
    fol.put(footstep(r), tt, max(0, gain), r.uniform(-0.6, 0.6))
cr = crowd(b1 - b0 + 0.5, 11)
cr *= np.minimum(1, t(len(cr)) / 1.5) * np.minimum(1, (len(cr) / SR - t(len(cr))) / 0.8)
amb.put(cr, b0, 0.35)

# contador de eleitoras: um tique por pessoa acesa, subindo de tom
c0, c1 = cue["dataCountStart"], cue["dataCountEnd"]
prev = 0
for f in range(int(c0 * FPS), int(c1 * FPS) + 2):
    p = min(1, max(0, (f / FPS - c0) / (c1 - c0))); v = round(52 * (1 - (1 - p) ** 3))
    for j in range(v - prev):
        fol.put(tick(1200 + 30 * (prev + j)), f / FPS + j * 0.008, 0.4, -0.5 + (prev + j) % 10 / 10)
    prev = v
fol.put(bell_ding(), c1 + 0.05, 0.35)

# voz: multidão comemorando cresce até o "VOZ", estrondo, e respiro antes do pôster
ch = crowd(SCENE["poster"] - cue["voiceUse"] + 1.2, 21, cheer=True)
ch *= np.minimum(1, t(len(ch)) / 1.2) ** 2 * np.minimum(1, (len(ch) / SR - t(len(ch))) / 1.0)
amb.put(ch, cue["voiceUse"], 0.55)
hits.put(boom(), cue["voiceVoz"], 0.9)
fol.put(riser(0.9), SCENE["poster"] - 0.9, 0.4)
hits.put(boom(3.0), SCENE["poster"], 0.8)
fol.put(paper_swish(0.6), SCENE["poster"] + 0.05, 0.6, -0.2)

# fim da película: o rolo acaba (estalos soltos)
for k in range(6):
    fol.put(flap(), DUR - 0.9 + k * 0.12, 0.5 - k * 0.07)

# ---------------------------------------------------------------- mixagem
hits.fx(Pedalboard([Compressor(threshold_db=-12, ratio=3, attack_ms=2, release_ms=90), Reverb(room_size=0.35, wet_level=0.12, dry_level=1.0)]))
fol.fx(Pedalboard([HighpassFilter(cutoff_frequency_hz=90), Reverb(room_size=0.3, wet_level=0.1, dry_level=1.0)]))
amb.fx(Pedalboard([HighpassFilter(cutoff_frequency_hz=50), LowpassFilter(cutoff_frequency_hz=7000), Reverb(room_size=0.7, wet_level=0.25, dry_level=0.9)]))
mix = hits.x + fol.x * 0.9 + amb.x
mix = Pedalboard([PeakFilter(cutoff_frequency_hz=3000, gain_db=-1.5, q=1.0), Limiter(threshold_db=-2)])(mix, SR)
mix = mix / max(1e-9, np.abs(mix).max()) * 0.89
with AudioFile(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "sfx.wav"), "w", SR, 2, bit_depth=24) as f:
    f.write(mix.astype(np.float32))
print("ok")
