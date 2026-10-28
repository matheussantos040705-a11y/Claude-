"""Corta os recortes aprovados, normaliza o áudio e gera clips.json (palavras + forma de onda por quadro)."""
import json, subprocess, os
import numpy as np
O = "../recortes/originais"
CLIPS = [
    dict(id="figueiredo", src="figueiredo-votam-mal_ROVmydiCiwk", a=101.50, b=112.95,
         nome="PAULO FIGUEIREDO", papel="influenciador, aliado de Eduardo Bolsonaro",
         fonte="live no YouTube, jun/2026 · exibida em telejornal (youtu.be/ROVmydiCiwk)", carimbo="MULHER VOTA MAL?"),
    dict(id="pietra1", src="pietra-voto_t15ErS3CcPY", a=111.60, b=118.10,
         nome="PIETRA BERTOLAZZI", papel="influenciadora antifeminista",
         fonte="YouTube (youtu.be/t15ErS3CcPY)", carimbo="CONTRA A DEMOCRACIA"),
    dict(id="pietra2", src="pietra-contra-tudo_ugQvr7wDCBU", a=301.15, b=313.15,
         nome="PIETRA BERTOLAZZI", papel="influenciadora antifeminista",
         fonte="YouTube (youtu.be/ugQvr7wDCBU)", carimbo="CONTRA TUDO"),
    dict(id="campopiano", src="campopiano-privilegiada_QlntmpWcEhU", a=220.85, b=239.25,
         nome="EDUARDA CAMPOPIANO", papel="deputada estadual eleita (PL-SP)",
         fonte="debate no YouTube (youtu.be/QlntmpWcEhU)", carimbo="PRIVILÉGIO?"),
]
os.makedirs("recortes", exist_ok=True)
for c in CLIPS:
    out = f"recortes/{c['id']}.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(c["a"]), "-to", str(c["b"]), "-i", f"{O}/{c['src']}.mp3",
                    "-af", "highpass=f=80,afade=t=in:d=0.03,areverse,afade=t=in:d=0.08,areverse,loudnorm=I=-18:TP=-2,aresample=48000",
                    "-ac", "1", out], check=True)
    x = np.frombuffer(subprocess.run(["ffmpeg", "-loglevel", "error", "-i", out, "-f", "s16le", "-ac", "1", "-ar", "48000", "-"],
                                     capture_output=True).stdout, "<i2").astype(float) / 32768
    hop = 1600  # 30 q/s
    env = [float(np.sqrt((x[i:i + hop] ** 2).mean())) for i in range(0, len(x), hop)]
    mx = max(env) or 1
    c["wave"] = [round(e / mx, 3) for e in env]
    c["dur"] = round(len(x) / 48000, 3)
    J = json.load(open(f"{O}/{c['src']}.json"))
    c["words"] = [(w[0].strip(), round(w[1] - c["a"], 2)) for s in J for w in s["words"] if w[1] >= c["a"] - 0.05 and w[2] <= c["b"] + 0.3]
    print(c["id"], c["dur"], " ".join(w for w, _ in c["words"]))
json.dump(CLIPS, open("clips.json", "w"), ensure_ascii=False)
