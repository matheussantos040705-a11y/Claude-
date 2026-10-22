"""Trilha original de 45 s: marcha construtivista sintetizada (numpy)."""
import numpy as np, wave, sys

SR = 48000
DUR = 45.0
BPM = 96
BEAT = 60 / BPM
N = int(SR * DUR)
rng = np.random.default_rng(1932)
L = np.zeros(N); R = np.zeros(N)

def env(n, a=0.005, d=0.3):
    t = np.arange(n) / SR
    e = np.minimum(t / a, 1.0) * np.exp(-t / d)
    return e

def put(sig, start, pan=0.0, gain=1.0):
    i = int(start * SR)
    if i >= N: return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * (1 - pan) ** 0.5
    R[i:i + len(sig)] += sig * (1 + pan) ** 0.5

def kick():
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 45 + 90 * np.exp(-t / 0.04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.18)

def snare(g=1.0):
    n = int(0.25 * SR); t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    noise = np.convolve(noise, [1, -0.85], 'same')
    body = np.sin(2 * np.pi * 190 * t)
    return (0.7 * noise * env(n, 0.001, 0.07) + 0.4 * body * env(n, 0.001, 0.05)) * g

def timpani(f0=73.4):
    n = int(1.8 * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f0 * k * t) / k**1.5 for k in (1, 1.5, 1.99, 2.44))
    return s * env(n, 0.004, 0.6) + 0.3 * rng.standard_normal(n) * env(n, 0.001, 0.02)

def lowpass(x, a):
    y = np.zeros_like(x); acc = 0.0
    for i in range(len(x)):
        acc += a * (x[i] - acc); y[i] = acc
    return y

def brass(freqs, dur, attack=0.06, rel=0.4):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.zeros(n)
    for f in freqs:
        for det in (-0.004, 0.0, 0.004):
            ph = (f * (1 + det) * t) % 1.0
            s += 2 * ph - 1
    s /= len(freqs) * 3
    s = lowpass(s, 0.08)
    e = np.minimum(t / attack, 1) * np.minimum(1, np.maximum(0, (dur - t) / rel))
    return s * e

def pad(freqs, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * t + 0.3 * np.sin(2 * np.pi * 0.2 * t)) for f in freqs) / len(freqs)
    e = np.minimum(t / 1.5, 1) * np.minimum(1, (dur - t) / 1.5)
    return s * e

hz = lambda m: 440 * 2 ** ((m - 69) / 12)
Am = [hz(45), hz(52), hz(57), hz(60)]          # lá menor
F  = [hz(41), hz(48), hz(53), hz(57)]
C  = [hz(48), hz(55), hz(60), hz(64)]          # dó maior (virada)
G  = [hz(43), hz(50), hz(55), hz(59)]

# Pad grave contínuo: menor até 29.6 s, maior a partir de "Hoje".
put(pad(Am, 15.0), 0.0, gain=0.10); put(pad(F, 15.0), 14.5, gain=0.10)
put(pad(C, 16.0), 29.2, gain=0.12)

# Marcha: entra leve, cresce.
t = 1.2
while t < 39.0:
    bar = int(t / BEAT) % 4
    level = 0.35 if t < 10.6 else (0.55 if t < 29.6 else 0.75)
    if bar in (0, 2): put(kick(), t, gain=0.9 * level)
    if bar in (1, 3): put(snare(), t, pan=0.1, gain=0.55 * level)
    if t > 10.6:                                 # rufos de caixa
        put(snare(0.35), t + BEAT * 0.5, pan=-0.1, gain=0.4 * level)
    if t > 24.2:
        put(snare(0.25), t + BEAT * 0.75, pan=0.15, gain=0.35 * level)
    t += BEAT

# Golpes de tímpano + metais nas viradas de cena.
hits = [(0.0, Am), (5.0, Am), (10.6, F), (19.2, Am), (24.2, F), (29.6, C), (35.2, G)]
for when, ch in hits:
    put(timpani(), when, gain=0.8)
    put(brass(ch, 1.1), when, gain=0.35)
# Acorde final, longo, em dó maior.
put(timpani(65.4), 39.0, gain=1.0)
put(brass(C + [hz(72)], 5.6, attack=0.04, rel=2.5), 39.0, gain=0.45)

mix = np.stack([L, R], 1)
mix /= np.abs(mix).max() * 1.12
fade = int(1.0 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
pcm = (mix * 32767).astype('<i2')
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("ok", DUR)
