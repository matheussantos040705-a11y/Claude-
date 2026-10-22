"""Trilha e efeitos do comercial FAÍSCA (15 s, 120 BPM), sintetizados em numpy.

Gera trilha.wav (música) e sfx.wav (efeitos), ambos estéreo 48 kHz.
Estrutura: 0-2 s atmosfera + lata abrindo; 2-5 s construção com riser;
5 s drop; 8 s segunda parte; 11 s impacto; 13 s assinatura sonora.
"""
import sys, wave
import numpy as np

SR = 48000
DUR = 15.0
BEAT = 0.5
N = int(SR * DUR)
rng = np.random.default_rng(2026)


class Bus:
    def __init__(self):
        self.L = np.zeros(N); self.R = np.zeros(N)

    def put(self, sig, at, gain=1.0, pan=0.0):
        i = int(at * SR)
        if i >= N: return
        sig = sig[: N - i] * gain
        self.L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
        self.R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))

    def write(self, path, peak=0.9):
        mix = np.stack([self.L, self.R], 1)
        mix *= peak / max(1e-9, np.abs(mix).max())
        with wave.open(path, "wb") as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((mix * 32767).astype("<i2").tobytes())


def t(n): return np.arange(n) / SR
def env(n, a, d): x = t(n); return np.minimum(x / max(a, 1e-4), 1) * np.exp(-x / d)
def onepole(x, a):
    """Passa-baixas simples; `a` pode ser um vetor (filtro que abre)."""
    y = np.empty_like(x); acc = 0.0
    a = np.broadcast_to(a, x.shape)
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc); y[i] = acc
    return y
def saw(f, n, det=(0,)):
    x = t(n); return sum(2 * ((f * (1 + d) * x) % 1) - 1 for d in det) / len(det)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---------------------------------------------------------------- música
mus = Bus()
# Atmosfera: acorde de Lá menor com serras desafinadas, filtro abrindo até o drop.
pad_n = int(5.2 * SR)
pad = sum(saw(hz(m), pad_n, (-0.006, 0, 0.006)) for m in (57, 60, 64, 69)) / 4
pad = onepole(pad, np.linspace(0.005, 0.08, pad_n)) * np.minimum(t(pad_n) / 1.2, 1) * np.minimum(1, (5.2 - t(pad_n)) / 0.3)
mus.put(pad, 0, 0.5, -0.2); mus.put(pad, 0.01, 0.5, 0.2)

def kick():
    n = int(0.4 * SR); x = t(n); f = 48 + 120 * np.exp(-x / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.16)
def clap():
    n = int(0.25 * SR); s = rng.standard_normal(n); s = s - onepole(s, 0.25)
    e = sum(env(n, 0.001, 0.012) * (t(n) >= k * 0.011) for k in range(3)) + env(n, 0.001, 0.08)
    return s * e * 0.6
def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR); s = rng.standard_normal(n); s = s - onepole(s, 0.6)
    return s * env(n, 0.0005, 0.08 if open_ else 0.018) * 0.5
def bass(m, dur):
    n = int(dur * SR); s = saw(hz(m), n, (-0.004, 0.004)) + 0.6 * np.sin(2 * np.pi * hz(m - 12) * t(n))
    return onepole(s, 0.02 + 0.12 * env(n, 0.002, 0.08)) * env(n, 0.003, 0.35)
def stab(ms, dur=0.35):
    n = int(dur * SR); s = sum(saw(hz(m), n, (-0.008, 0, 0.008)) for m in ms) / len(ms)
    return onepole(s, 0.25) * env(n, 0.002, 0.12)

# Construção (2-5 s): chimbal em colcheias que cresce + riser de ruído.
for k in range(12):
    at = 2.0 + k * 0.25
    mus.put(hat(), at, 0.3 + 0.5 * k / 12, 0.3)
rn = int(3.0 * SR); riser = rng.standard_normal(rn)
riser = onepole(riser, np.linspace(0.01, 0.6, rn)) * np.linspace(0, 1, rn) ** 2
mus.put(riser, 2.0, 0.35)

# Drop (5-11 s): batida 4x4, palmas no 2 e no 4, baixo em colcheias, stabs.
prog = [45, 45, 41, 43]          # Lá, Lá, Fá, Sol
chords = {45: (57, 60, 64), 41: (53, 57, 60), 43: (55, 59, 62)}
for b in range(12):               # 12 tempos = 6 s
    at = 5.0 + b * BEAT
    root = prog[(b // 4) % 4] if b < 8 else prog[2 + (b - 8) // 2]
    mus.put(kick(), at, 1.0)
    if b % 2: mus.put(clap(), at, 0.7, 0.05)
    mus.put(hat(), at + 0.25, 0.45, 0.35); mus.put(hat(b % 4 == 3), at + 0.125 if b % 2 else at + 0.375, 0.25, -0.35)
    mus.put(bass(root, 0.24), at, 0.55); mus.put(bass(root + 12 if b % 2 else root, 0.22), at + 0.25, 0.4)
    if b % 4 == 0: mus.put(stab(chords[root]), at, 0.35, -0.1)
    if b % 4 == 2: mus.put(stab(chords[root]), at + 0.25, 0.25, 0.15)

# Impacto em 11 s e cauda: sub grave + acorde aberto em Lá maior (virada brilhante).
sub_n = int(2.0 * SR); sub = np.sin(2 * np.pi * np.cumsum(40 + 60 * np.exp(-t(sub_n) / 0.2)) / SR) * env(sub_n, 0.002, 0.7)
mus.put(sub, 11.0, 0.9)
end_n = int(4.0 * SR)
endpad = sum(saw(hz(m), end_n, (-0.006, 0, 0.006)) for m in (57, 61, 64, 69, 73)) / 5
endpad = onepole(endpad, 0.05) * np.minimum(t(end_n) / 0.05, 1) * np.exp(-t(end_n) / 1.6)
mus.put(endpad, 11.0, 0.55)

# Assinatura sonora (13 s): três notas de sino subindo, Mi-Sol#-Lá.
def bell(m, dur=1.6):
    n = int(dur * SR); x = t(n); f = hz(m)
    return (np.sin(2 * np.pi * f * x) + 0.35 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x / 0.3)) * env(n, 0.002, 0.6)
for k, m in enumerate((76, 80, 81)):
    mus.put(bell(m), 13.0 + k * 0.18, 0.45, -0.2 + 0.2 * k)

fade = int(0.6 * SR); mus.L[-fade:] *= np.linspace(1, 0, fade); mus.R[-fade:] *= np.linspace(1, 0, fade)

# ---------------------------------------------------------------- efeitos
fx = Bus()
def pssht():
    n = int(0.9 * SR); s = rng.standard_normal(n)
    crack = np.zeros(n); crack[: int(0.004 * SR)] = rng.standard_normal(int(0.004 * SR)) * 3
    hiss = (s - onepole(s, 0.35)) * np.minimum(t(n) / 0.01, 1) * np.exp(-t(n) / 0.35)
    return crack + hiss
def fizz(dur):
    n = int(dur * SR); s = np.zeros(n)
    for _ in range(int(dur * 260)):
        i = rng.integers(0, n - 300); s[i:i + 300] += rng.standard_normal(300) * np.exp(-np.arange(300) / 40) * rng.uniform(0.2, 1)
    s = s - onepole(s, 0.5)
    return s * np.minimum(1, (dur - t(n)) / 0.6)
def whoosh(dur=0.6, up=True):
    n = int(dur * SR); s = rng.standard_normal(n)
    a = np.linspace(0.02, 0.5, n) if up else np.linspace(0.5, 0.02, n)
    return onepole(s, a) * np.sin(np.pi * t(n) / dur) ** 2
def zap(dur=0.45):
    n = int(dur * SR); x = t(n)
    f = 90 + 900 * rng.random(n).cumsum() % 1
    buzz = np.sign(np.sin(2 * np.pi * np.cumsum(180 + 120 * np.sin(2 * np.pi * 37 * x)) / SR))
    crackle = rng.standard_normal(n) * (rng.random(n) > 0.97)
    return (0.5 * buzz + crackle * 2) * np.exp(-x / 0.12) * (1 + 0 * f)
def clink(m=96):
    n = int(0.5 * SR); x = t(n); f = hz(m)
    return sum(np.sin(2 * np.pi * f * r * x) * np.exp(-x / (0.15 / r)) for r in (1, 2.4, 3.9)) * 0.4

fx.put(pssht(), 0.25, 1.0)
fx.put(fizz(3.0), 0.4, 0.35)
fx.put(zap(), 0.85, 0.7, 0.2)
fx.put(whoosh(0.5), 1.75, 0.6, -0.3)
fx.put(clink(96), 2.9, 0.5, 0.4); fx.put(clink(99), 3.4, 0.4, -0.4)
fx.put(whoosh(0.7), 4.4, 0.7, 0.3)
fx.put(zap(0.6), 6.4, 0.8, -0.1)
fx.put(whoosh(0.5, False), 7.8, 0.6, -0.2)
fx.put(fizz(2.5), 8.2, 0.3)
fx.put(whoosh(0.6), 10.6, 0.8)
fx.put(zap(0.35), 13.0, 0.5, 0.2)

mus.write(sys.argv[1]); fx.write(sys.argv[2])
print("ok")
