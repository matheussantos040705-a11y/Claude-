"""Escolhe a melhor tomada de cada frase: texto correto, naturalidade e entonação."""
import re, unicodedata, shutil, os
ref = [l.strip() for l in open('../../narracao/frases.txt', encoding='utf-8') if l.strip()]
num = {'1932': 'mil novecentos e trinta e dois', '1927': 'mil novecentos e vinte e sete',
       '24': 'vinte e quatro', '52%': 'cinquenta e dois por cento', '52': 'cinquenta e dois'}

def norm(s):
    s = s.lower()
    for k, v in num.items():
        s = s.replace(k, v)
    s = s.replace('selina', 'celina').replace('-', ' ')
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if not unicodedata.combining(c))
    return re.sub(r'[^a-z ]', '', s).split()

def wer(a, b):
    d = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a) + 1): d[i][0] = i
    for j in range(len(b) + 1): d[0][j] = j
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            d[i][j] = min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (a[i-1] != b[j-1]))
    return d[-1][-1] / max(1, len(a))

sc = {}
for l in open('scores.txt'):
    p = l.split()
    if p and p[0].endswith('.wav'): sc[p[0]] = (float(p[1]), float(p[3]))
tr = dict(l.rstrip('\n').split('|', 1) for l in open('trans.txt', encoding='utf-8'))
os.makedirs('final', exist_ok=True)
for i in range(1, 9):
    best = None
    for tk in ['t7', 't19', 't31']:
        k = f'{tk}/f{i}.wav'; u, v = sc[k]; w = wer(norm(ref[i-1]), norm(tr[k]))
        score = u + 0.12 * min(v, 5) - 0.15 * max(0, v - 6) - 4 * w
        print(f'f{i} {tk} UTMOS={u:.2f} tom={v:.2f} erro={w:.2f} -> {score:.2f}')
        if best is None or score > best[0]: best = (score, k)
    shutil.copy(best[1], f'final/f{i}.wav'); print('  escolhida:', best[1])
