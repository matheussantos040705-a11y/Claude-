"""Trilha cinematográfica de 45 s em MIDI, tocada pelo FluidSynth com o FluidR3_GM.

Lá menor contido até "Hoje" (29,9 s), dó maior esperançoso depois, e o acorde
final caindo na revelação do pôster (39,9 s).
"""
import mido

BPM = 72.18                      # 12 compassos de 4/4 = 39,9 s
TPB = 480
mid = mido.MidiFile(ticks_per_beat=TPB)
tempo = mido.bpm2tempo(BPM)

def track(name, ch, program, vol):
    t = mido.MidiTrack(); mid.tracks.append(t)
    t.append(mido.MetaMessage('track_name', name=name, time=0))
    t.append(mido.MetaMessage('set_tempo', tempo=tempo, time=0))
    t.append(mido.Message('program_change', channel=ch, program=program, time=0))
    t.append(mido.Message('control_change', channel=ch, control=7, value=vol, time=0))
    t.append(mido.Message('control_change', channel=ch, control=91, value=90, time=0))  # reverb
    return t

def notes(t, ch, events):
    """events: (início em tempos, duração em tempos, nota, velocity). Converte para delta-ticks."""
    msgs = []
    for start, dur, n, v in events:
        msgs.append((int(start * TPB), 'note_on', n, v))
        msgs.append((int((start + dur) * TPB) - 1, 'note_off', n, 0))
    msgs.sort(key=lambda m: (m[0], m[1] == 'note_on'))
    now = 0
    for tick, kind, n, v in msgs:
        t.append(mido.Message(kind, channel=ch, note=n, velocity=v, time=tick - now)); now = tick

def cc(t, ch, points):
    """Expressão (CC11) em rampa: [(tempo, valor), ...]."""
    now = 0; prev = None
    for i in range(len(points) - 1):
        (b0, v0), (b1, v1) = points[i], points[i + 1]
        steps = max(1, int((b1 - b0) * 4))
        for s in range(steps):
            tick = int((b0 + (b1 - b0) * s / steps) * TPB)
            val = int(v0 + (v1 - v0) * s / steps)
            if val != prev:
                t.append(mido.Message('control_change', channel=ch, control=11, value=val, time=tick - now)); now = tick; prev = val

N = {'A2':45,'C3':48,'D3':50,'E3':52,'F2':41,'F3':53,'G2':43,'G3':55,'A3':57,'B3':59,'C4':60,'D4':62,'E4':64,'F4':65,'G4':67,'A4':69,'B4':71,'C5':72,'D5':74,'E5':76,'G5':79,'C2':36,'A1':33,'F1':29,'G1':31,'E2':40}
chords = ['Am','Am','F','C','G','Am','F','C','G','C','G','F','C','C']   # 14 compassos
voicing = {'Am':['A3','C4','E4'], 'F':['F3','A3','C4'], 'C':['G3','C4','E4'], 'G':['G3','B3','D4']}
bass = {'Am':'A1','F':'F1','C':'C2','G':'G1'}

# Piano: arpejos em colcheias, entram já no começo.
pno = track('piano', 0, 0, 92)
ev = []
for bar, ch in enumerate(chords):
    tones = [N[x] for x in voicing[ch]]
    pat = [tones[0] - 12, tones[0], tones[1], tones[2], tones[1] + 12, tones[2], tones[1], tones[0]]
    if bar >= 12: pat = [tones[0] - 12, tones[0], tones[1], tones[2]] + [tones[2] + 12] * 0
    vel = 46 if bar < 6 else (58 if bar < 9 else 66)
    for i, n in enumerate(pat):
        ev.append((bar * 4 + i * 0.5, 0.9, n, vel - (6 if i % 2 else 0)))
    if bar == 12: ev.append((48, 7.5, N['C5'], 60)); ev.append((48, 7.5, N['E4'], 55))
notes(pno, 0, ev)

# Cordas: tapete que cresce; entram no compasso 3.
st = track('cordas', 1, 48, 100)
cc(st, 1, [(0, 30), (8, 30), (24, 70), (36, 92), (48, 110), (52, 100), (56, 20)])
notes(st, 1, [(bar * 4, 4, N[x], 70) for bar, ch in enumerate(chords) if bar >= 2 for x in voicing[ch]]
             + [(bar * 4, 4, N[voicing[ch][2]] + 12, 60) for bar, ch in enumerate(chords) if bar >= 9])

# Violoncelo + contrabaixo: fundamental longa.
vc = track('violoncelo', 2, 42, 95)
notes(vc, 2, [(bar * 4, 4, N[bass[ch]] + 12, 62) for bar, ch in enumerate(chords)])
cb = track('contrabaixo', 3, 43, 85)
notes(cb, 3, [(bar * 4, 4, N[bass[ch]], 58) for bar, ch in enumerate(chords) if bar >= 4])

# Trompa: tema em lá menor (compassos 7-9) e resposta em dó maior (10-12).
hn = track('trompa', 4, 60, 88)
melody = [(24, 1.5, 'A3'), (25.5, 0.5, 'C4'), (26, 2, 'E4'),
          (28, 1.5, 'F3'), (29.5, 0.5, 'A3'), (30, 2, 'C4'),
          (32, 2, 'B3'), (34, 2, 'D4'),
          (36, 1, 'E4'), (37, 1, 'G4'), (38, 2, 'C5'),
          (40, 1, 'D5'), (41, 1, 'B4'), (42, 2, 'G4'),
          (44, 1.5, 'A4'), (45.5, 0.5, 'G4'), (46, 2, 'F4'),
          (48, 7.5, 'E4')]
notes(hn, 4, [(s, d, N[n], 74 if s < 36 else 86) for s, d, n in melody])

# Tímpanos nos marcos: início, Celina (11,6 s), "Hoje" (29,9 s) e pôster (39,9 s).
tp = track('timpanos', 9, 0, 110)
beat = lambda sec: sec * BPM / 60
hits = [(0, 'A1', 70), (beat(11.6), 'A1', 64), (beat(29.9), 'C2', 92), (48, 'C2', 110)]
ev = []
for b, n, v in hits:
    for k in range(6):                       # rufo curto que termina no golpe
        ev.append((b - 0.5 + k * 0.083, 0.08, 47, int(v * 0.35)))
    ev.append((b, 1.5, 47, v))
notes(tp, 9, [e for e in ev if e[0] >= 0])

mid.save('/home/user/Claude-/voto-feminino/audio2/trilha.mid')
print('ok', round(mid.length, 2), 's')
