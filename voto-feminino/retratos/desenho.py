"""Transforma uma foto antiga em retrato a lápis, em camadas para animar.

Gera: <nome>-linhas.png (contornos XDoG, tinta escura sobre transparente),
<nome>-sombra.png (sombreamento a grafite com hachura) e <nome>-papel.png
(o desenho completo sobre papel), todos 1000x1250.
"""
import sys, numpy as np, cv2

src, name = sys.argv[1], sys.argv[2]
W, H = 1000, 1250
img = cv2.imread(src, cv2.IMREAD_GRAYSCALE)
if len(sys.argv) > 3:                     # recorte opcional x0,y0,x1,y1
    x0, y0, x1, y1 = map(int, sys.argv[3].split(","))
    img = img[y0:y1, x0:x1]
# enquadra o rosto/busto: recorte central na proporção 4:5
h, w = img.shape
if w / h > W / H:
    nw = int(h * W / H); x0 = (w - nw) // 2; img = img[:, x0:x0 + nw]
else:
    nh = int(w * H / W); img = img[: nh]
img = cv2.resize(img, (W, H), interpolation=cv2.INTER_LANCZOS4)
img = cv2.GaussianBlur(img, (0, 0), 2.2)          # apaga a retícula da impressão antiga
img = cv2.fastNlMeansDenoising(img, None, 7, 7, 21)
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
g = clahe.apply(img).astype(np.float32)
lo, hi = np.percentile(g, 3), np.percentile(g, 97)
g = np.clip((g - lo) / (hi - lo), 0, 1)

# Contornos: diferença de gaussianas estendida (XDoG), como traço de grafite.
def xdog(x, s=2.0, k=1.6, p=20, eps=-0.015, phi=45):
    a = cv2.GaussianBlur(x, (0, 0), s); b = cv2.GaussianBlur(x, (0, 0), s * k)
    d = (1 + p) * a - p * b
    return np.where(d >= eps, 1.0, 1 + np.tanh(phi * (d - eps)))
lines = 1 - xdog(g, s=2.6, p=18, eps=-0.03, phi=30)
# tira os pontinhos soltos: só ficam traços com área razoável
mask = (lines > 0.35).astype(np.uint8)
n, lab, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
keep = np.zeros(n, bool); keep[1:] = stats[1:, cv2.CC_STAT_AREA] >= 60
lines = lines * keep[lab]
lines = np.clip(cv2.GaussianBlur(lines, (0, 0), 1.1) * 1.5, 0, 1)

# Tom: escuridão da foto em curva, modulada por traços de grafite a 45 graus
# (ruído borrado na diagonal), como sombreamento feito a lápis.
rng = np.random.default_rng(len(name))
yy, xx = np.mgrid[0:H, 0:W]
def strokes(angle, length):
    n = rng.random((H, W)).astype(np.float32)
    k = np.zeros((length, length), np.float32); c = length // 2
    cv2.line(k, (0, int(c + c * np.tan(np.radians(angle)))), (length - 1, int(c - c * np.tan(np.radians(angle)))), 1, 1)
    k /= k.sum()
    t = cv2.filter2D(n, -1, k)
    return np.clip((t - t.mean()) * 6 + 0.5, 0, 1)
s1, s2 = strokes(35, 25), strokes(-50, 19)
dark = np.clip((0.95 - g) / 0.8, 0, 1) ** 0.9
tone = dark * (0.55 + 0.45 * s1)
tone = np.maximum(tone, np.clip((0.4 - g) * 2.5, 0, 1) * (0.6 + 0.4 * s2))
shade = np.clip(tone * 0.95, 0, 1)

# Vinheta: o desenho some nas bordas, como esboço em papel.
cy, cx = H * 0.42, W * 0.5
r = np.sqrt(((xx - cx) / (W * 0.48)) ** 2 + ((yy - cy) / (H * 0.55)) ** 2)
fade = np.clip(1.3 - r, 0, 1) ** 1.35
grain = rng.normal(0, 1, (H, W)).astype(np.float32)
grain = cv2.GaussianBlur(grain, (0, 0), 0.8) * 0.08

graphite = np.array([38, 34, 32], np.float32)  # BGR, grafite levemente quente
def layer(alpha, fname):
    a = np.clip(alpha * fade + grain * alpha, 0, 1)
    out = np.zeros((H, W, 4), np.uint8)
    out[..., :3] = graphite
    out[..., 3] = (a * 255).astype(np.uint8)
    cv2.imwrite(fname, out)
    return a
la = layer(lines * 0.78, f"{name}-linhas.png")
sa = layer(shade, f"{name}-sombra.png")

paper = np.full((H, W, 3), (200, 227, 239), np.float32)  # papel creme (BGR)
total = np.clip(la + sa * 0.9, 0, 1)[..., None]
comp = paper * (1 - total) + graphite * total
cv2.imwrite(f"{name}-papel.png", comp.astype(np.uint8))
print("ok", name)
