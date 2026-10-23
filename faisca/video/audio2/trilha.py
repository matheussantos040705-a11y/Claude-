"""Trilha v2 do comercial FAÍSCA: trap/eletrônico a 90 BPM, com pedalboard para mixar.

Gera musica.wav e sfx.wav (estéreo, 48 kHz, 15 s).
Grade: a batida começa no corte para o respingo (1,667 s); cada tempo dura 2/3 s,
então os cortes 4,667 / 7,333 / 9,333 caem em colcheias.
"""
import sys
import numpy as np
from pedalboard import Pedalboard, Reverb, Compressor, Distortion, Limiter, LowpassFilter, HighpassFilter, Chorus, Delay
from pedalboard.io import AudioFile

SR = 48000
DUR = 15.0
N = int(SR * DUR)
T0 = 50 / 30            # início da batida (corte para o respingo)
BEAT = 2 / 3            # 90 BPM
CUT_HERO = 9 + 1 / 3    # lata assenta: impacto e cartão final
LOGO = 12.4             # assinatura sonora
rng = np.random.default_rng(15)


def t(n): return np.arange(n) / SR
def env(n, a, d): x = t(n); return np.minimum(x / max(a, 1e-4), 1) * np.exp(-x / d)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def beat(b): return T0 + b * BEAT


class Bus:
    def __init__(self): self.x = np.zeros((2, N), np.float32)
    def put(self, sig, at, gain=1.0, pan=0.0):
        i = int(round(at * SR))
        if i >= N or i + len(sig) <= 0: return
        if i < 0: sig = sig[-i:]; i = 0
        sig = sig[: N - i] * gain
        self.x[0, i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
        self.x[1, i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))
    def fx(self, board): self.x = board(self.x, SR); return self


def saw(f, n, det=(0,), phase_rand=True):
    x = t(n); out = np.zeros(n)
    for d in det:
        ph = rng.random() if phase_rand else 0
        out += 2 * ((f * (1 + d) * x + ph) % 1) - 1
    return out / len(det)

def noise(n): return rng.standard_normal(n)

# ---------------------------------------------------------------- instrumentos
def kick(n_s=0.5, punch=1.0):
    n = int(n_s * SR); x = t(n)
    f = 46 + 160 * np.exp(-x / 0.025) + 40 * np.exp(-x / 0.004)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.0008, 0.22)
    click = noise(n) * env(n, 0.0002, 0.003) * 0.6
    return np.tanh((body + click) * 1.8 * punch)

def snare():
    n = int(0.45 * SR); x = t(n)
    tone = np.sin(2 * np.pi * np.cumsum(190 + 60 * np.exp(-x / 0.02)) / SR) * env(n, 0.001, 0.06)
    nz = noise(n); nz = nz - np.convolve(nz, np.ones(6) / 6, "same")
    clap = sum(env(n, 0.0005, 0.01) * (x >= k * 0.009) for k in range(3)) * noise(n) * 0.5
    return tone * 0.8 + nz * env(n, 0.001, 0.09) * 0.6 + clap

def hat(open_=False, vel=1.0):
    n = int((0.3 if open_ else 0.05) * SR)
    s = noise(n); s = s - np.convolve(s, np.ones(3) / 3, "same")
    return s * env(n, 0.0003, 0.09 if open_ else 0.012) * 0.45 * vel

def b808(m, dur, glide_from=None):
    n = int(dur * SR); x = t(n)
    f = np.full(n, hz(m))
    if glide_from is not None:
        f = hz(m) + (hz(glide_from) - hz(m)) * np.exp(-x / 0.06)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    s = np.tanh(s * 2.2) * env(n, 0.002, dur * 0.8) * np.minimum(1, (dur - x) / 0.02)
    return s

def supersaw(ms, dur, cutoff=0.35):
    n = int(dur * SR)
    s = sum(saw(hz(m), n, (-0.011, -0.006, -0.002, 0.002, 0.006, 0.011)) for m in ms) / len(ms)
    # filtro passa-baixas simples (média móvel em cascata)
    k = max(1, int(1 / cutoff))
    for _ in range(2): s = np.convolve(s, np.ones(k) / k, "same")
    e = np.minimum(t(n) / 0.005, 1) * np.minimum(1, (dur - t(n)) / 0.03)
    return s * e

def pluck(m, dur=0.35):
    n = int(dur * SR); x = t(n); f = hz(m)
    s = (np.sin(2 * np.pi * f * x) + 0.5 * np.sin(2 * np.pi * 2 * f * x) * np.exp(-x / 0.05)
         + 0.25 * np.sin(2 * np.pi * 3.01 * f * x) * np.exp(-x / 0.03))
    return s * env(n, 0.001, 0.12)

def bell(m, dur=2.2):
    n = int(dur * SR); x = t(n); f = hz(m)
    return (np.sin(2 * np.pi * f * x) + 0.4 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x / 0.4)
            + 0.2 * np.sin(2 * np.pi * f * 5.4 * x) * np.exp(-x / 0.15)) * env(n, 0.001, 0.8)

def riser(dur, up=True):
    n = int(dur * SR); s = noise(n)
    out = np.zeros(n); acc = 0.0
    a = np.linspace(0.01, 0.5, n) if up else np.linspace(0.5, 0.01, n)
    for i in range(0, n, 64):  # passa-baixas que abre, em blocos (rápido)
        blk = s[i:i + 64]; aa = a[i]
        for j in range(len(blk)):
            acc += aa * (blk[j] - acc); out[i + j] = acc
    shape = np.linspace(0, 1, n) ** 2.2 if up else np.linspace(1, 0, n) ** 1.5
    return out * shape * 3

def sub_drop(dur=2.5):
    n = int(dur * SR); x = t(n)
    return np.sin(2 * np.pi * np.cumsum(30 + 90 * np.exp(-x / 0.25)) / SR) * env(n, 0.002, 0.9)


# ---------------------------------------------------------------- arranjo
drums, bass, synth, lead, fxm = Bus(), Bus(), Bus(), Bus(), Bus()

# Intro (0–1,667 s): pad escuro crescendo + batimento grave + riser; vácuo antes do drop.
pad_n = int((T0 - 0.08) * SR)
pad = supersaw((57, 60, 64), (T0 - 0.08), cutoff=0.08) * np.linspace(0.2, 1, pad_n) ** 2
synth.put(pad, 0, 0.35)
for k, at in enumerate((0.15, 0.85)):
    bass.put(b808(33, 0.4), at, 0.35 + 0.15 * k)
fxm.put(riser(T0 - 0.1), 0.0, 0.25)

# Progressão (4 tempos por acorde): Lá m, Fá, Dó, Sol
prog = [(45, (57, 60, 64)), (41, (53, 57, 60)), (48, (55, 60, 64)), (43, (55, 59, 62))]
end_beat = (CUT_HERO - T0) / BEAT        # 11,5 tempos
b = 0.0
while b < end_beat:
    root, chord = prog[int(b // 4) % 4]
    at = beat(b)
    bi = int(round(b * 2))                # índice em colcheias
    # bateria half-time: bumbo no 1 e no "e" do 2, caixa no 3
    if bi % 8 in (0, 3): drums.put(kick(), at, 1.0)
    if bi % 8 == 4: drums.put(snare(), at, 0.9)
    # chimbal em semicolcheias com rolos em fusas no fim de cada compasso
    for s16 in range(2):
        vel = 0.9 if s16 == 0 else 0.55
        drums.put(hat(vel=vel), at + s16 * BEAT / 4, 0.8, 0.25)
    if bi % 8 == 7:
        for r in range(6): drums.put(hat(vel=0.4 + 0.1 * r), at + r * BEAT / 12, 0.7, -0.2)
    # 808 seguindo a fundamental, com glide entre acordes
    if bi % 8 == 0:
        prev = prog[(int(b // 4) - 1) % 4][0]
        bass.put(b808(root - 12, BEAT * 3.4, glide_from=prev - 12 if b > 0 else None), at, 0.9)
    if bi % 8 == 6: bass.put(b808(root - 12 + 12, BEAT * 0.45), at, 0.45)
    # acordes de supersaw em colcheias (bombeando pelo sidechain do bumbo)
    synth.put(supersaw(chord, BEAT * 0.45, cutoff=0.4), at, 0.28, 0.0)
    synth.put(supersaw(chord, BEAT * 0.45, cutoff=0.4), at + BEAT / 2, 0.2, 0.0)
    b += 0.5

# Melodia de pluck (frase tropical) por cima a partir do 2º compasso
melody = [(4, 76), (4.5, 79), (5, 81), (5.75, 79), (6, 76), (6.5, 74), (7, 76),
          (8, 72), (8.5, 74), (9, 76), (9.5, 79), (10, 81), (10.75, 84), (11, 81)]
for bb, m in melody:
    lead.put(pluck(m), beat(bb), 0.32, 0.15)
    lead.put(pluck(m + 12), beat(bb) + 0.004, 0.08, -0.25)

# Transições: riser antes do corte do herói, impacto e descida
fxm.put(riser(1.4), CUT_HERO - 1.4, 0.3)
drums.put(kick(0.9, 1.3), CUT_HERO, 1.1)
bass.put(sub_drop(3.0), CUT_HERO, 0.9)
fxm.put(riser(1.6, up=False), CUT_HERO, 0.25)

# Cartão final: acorde aberto em Lá maior, groove leve e assinatura sonora
end_n = int((DUR - CUT_HERO) * SR)
endpad = supersaw((57, 61, 64, 69), DUR - CUT_HERO, cutoff=0.15) * np.exp(-t(end_n) / 2.5)
synth.put(endpad, CUT_HERO, 0.4)
for k in range(int((LOGO - CUT_HERO) / (BEAT / 2))):
    at = CUT_HERO + BEAT + k * BEAT / 2
    if at > LOGO - 0.2: break
    drums.put(hat(vel=0.6), at, 0.5, 0.3)
    if k % 4 == 0: drums.put(kick(0.4, 0.8), at, 0.55)
for k, m in enumerate((76, 80, 81, 88)):
    lead.put(bell(m), LOGO + k * 0.16, 0.4 if k < 3 else 0.22, -0.3 + 0.2 * k)
drums.put(kick(0.8, 1.2), LOGO + 0.48, 0.8)
synth.put(supersaw((57, 61, 64, 69, 73), 2.2, cutoff=0.3) * np.exp(-t(int(2.2 * SR)) / 0.8), LOGO + 0.48, 0.35)

# ---------------------------------------------------------------- mixagem por grupo
# sidechain: envelope do bumbo abaixa sintetizadores e baixo
kick_env = np.abs(drums.x[0])
kick_env = np.convolve(kick_env, np.ones(int(0.01 * SR)) / int(0.01 * SR), "same")
duck = 1 - 0.65 * np.clip(kick_env / (kick_env.max() + 1e-9) * 3, 0, 1)
duck = np.convolve(duck, np.ones(int(0.06 * SR)) / int(0.06 * SR), "same").astype(np.float32)
synth.x *= duck; lead.x *= 0.6 + 0.4 * duck

drums.fx(Pedalboard([LowpassFilter(cutoff_frequency_hz=11000), Compressor(threshold_db=-14, ratio=3, attack_ms=3, release_ms=80), Reverb(room_size=0.25, wet_level=0.08, dry_level=1.0)]))
bass.fx(Pedalboard([Distortion(drive_db=6), LowpassFilter(cutoff_frequency_hz=900), Compressor(threshold_db=-12, ratio=4)]))
synth.fx(Pedalboard([HighpassFilter(cutoff_frequency_hz=180), LowpassFilter(cutoff_frequency_hz=4200), Chorus(rate_hz=0.6, depth=0.3, mix=0.4), Reverb(room_size=0.7, wet_level=0.3, dry_level=0.8, width=1.0)]))
lead.fx(Pedalboard([Delay(delay_seconds=BEAT * 0.75, feedback=0.3, mix=0.25), Reverb(room_size=0.6, wet_level=0.25, dry_level=0.9)]))
fxm.fx(Pedalboard([HighpassFilter(cutoff_frequency_hz=300), LowpassFilter(cutoff_frequency_hz=6000), Reverb(room_size=0.8, wet_level=0.3)]))

mus = drums.x * 0.8 + bass.x * 0.9 + synth.x * 0.55 + lead.x * 0.9 + fxm.x * 0.35
fade = int(0.5 * SR); mus[:, -fade:] *= np.linspace(1, 0, fade)
mus = Pedalboard([Compressor(threshold_db=-10, ratio=2.5, attack_ms=10, release_ms=120), Limiter(threshold_db=-1.5)])(mus.astype(np.float32), SR)

# ---------------------------------------------------------------- efeitos
sfx = Bus()
def pssht():
    n = int(1.0 * SR); x = t(n)
    crack = np.zeros(n); c = int(0.006 * SR); crack[:c] = noise(c) * 2.5 * np.exp(-np.arange(c) / 60)
    pop = np.sin(2 * np.pi * 900 * x) * env(n, 0.0005, 0.01) * 0.6
    hiss = noise(n); hiss = hiss - np.convolve(hiss, np.ones(4) / 4, "same")
    hiss *= np.minimum(x / 0.008, 1) * np.exp(-x / 0.3) * 1.2
    return crack + pop + hiss
def fizz(dur, dens=320):
    n = int(dur * SR); s = np.zeros(n)
    for _ in range(int(dur * dens)):
        i = rng.integers(0, n - 400); L = rng.integers(80, 400)
        s[i:i + L] += noise(L) * np.exp(-np.arange(L) / (L / 5)) * rng.uniform(0.1, 1)
    s = s - np.convolve(s, np.ones(3) / 3, "same")
    return s * np.minimum(1, (dur - t(n)) / 0.5) * np.minimum(1, t(n) / 0.2)
def whoosh(dur=0.5, up=True):
    n = int(dur * SR); s = noise(n)
    k = 12; s = np.convolve(s, np.ones(k) / k, "same")
    return s * np.sin(np.pi * t(n) / dur) ** (2 if up else 1) * 4
def splash():
    n = int(1.4 * SR); x = t(n); s = noise(n)
    s = np.convolve(s, np.ones(5) / 5, "same") * np.exp(-x / 0.35) * np.minimum(x / 0.01, 1)
    drops = np.zeros(n)
    for _ in range(40):
        i = rng.integers(int(0.05 * SR), n - 3000); f = rng.uniform(900, 2400)
        drops[i:i + 3000] += np.sin(2 * np.pi * np.cumsum(np.linspace(f, f * 1.6, 3000)) / SR) * np.exp(-np.arange(3000) / 300) * 0.3
    return s * 1.5 + drops
def clink(m=98):
    n = int(0.7 * SR); x = t(n); f = hz(m)
    return sum(np.sin(2 * np.pi * f * r * x) * np.exp(-x / (0.25 / r)) for r in (1, 2.32, 4.25, 6.7)) * 0.35
def spark():
    n = int(0.35 * SR); x = t(n)
    buzz = np.sign(np.sin(2 * np.pi * np.cumsum(140 + 90 * np.sin(2 * np.pi * 41 * x)) / SR)) * 0.4
    crackle = noise(n) * (rng.random(n) > 0.96) * 2
    return (buzz + crackle) * np.exp(-x / 0.08)

sfx.put(fizz(1.4, 120), 0.1, 0.25)                 # gotas/gás ao fundo do macro
sfx.put(pssht(), 1.30, 1.0)                       # lata abrindo, logo antes do drop
sfx.put(whoosh(0.45), T0 - 0.35, 0.5, -0.3)
sfx.put(splash(), T0, 0.8)
sfx.put(fizz(2.8), T0 + 0.1, 0.3)
sfx.put(clink(98), 2.55, 0.45, 0.4); sfx.put(clink(101), 3.1, 0.35, -0.4); sfx.put(clink(96), 3.9, 0.3, 0.2)
sfx.put(spark(), 2.95, 0.5, 0.3)                  # "faísca!"
sfx.put(whoosh(0.5), 4.667 - 0.3, 0.55, 0.3)
sfx.put(splash(), 4.75, 0.35, -0.2)
sfx.put(whoosh(0.6), 7.333 - 0.35, 0.55, -0.3)
sfx.put(clink(94), 7.6, 0.3, 0.3)
sfx.put(whoosh(0.8, False), CUT_HERO - 0.1, 0.5)
sfx.put(spark(), LOGO - 0.05, 0.35, -0.2)
sfx.x = Pedalboard([Reverb(room_size=0.4, wet_level=0.15, dry_level=1.0), Limiter(threshold_db=-3)])(sfx.x, SR)

for path, data in ((sys.argv[1], mus), (sys.argv[2], sfx.x)):
    data = data / max(1e-9, np.abs(data).max()) * 0.89
    with AudioFile(path, "w", SR, 2, bit_depth=24) as f:
        f.write(data.astype(np.float32))
print("ok")
