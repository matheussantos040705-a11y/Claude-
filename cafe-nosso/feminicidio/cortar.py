"""Corta os recortes aprovados (feminicídio), normaliza o áudio e gera clips.json com a forma de onda por quadro."""
import json, subprocess, os
import numpy as np
O = "../recortes/originais"
CLIPS = [
    dict(id="camp1", src="campopiano-armadilha_msQrt122ynY", a=46.90, b=54.75,
         nome="EDUARDA CAMPOPIANO", papel="deputada estadual eleita (PL-SP)", fonte="YouTube (youtube.com/shorts/msQrt122ynY)", carimbo="ARMADILHA?",
         caps=[["“Feminicídio é uma armadilha semântica.", 0.16], ["Nenhuma mulher morre por ser mulher.", 2.5], ["A mulher morre porque o namorado não aceitou o fim do namoro.”", 4.2]]),
    dict(id="camp2", src="campopiano-nao-existe_1AxFA1uv2vc", a=30.80, b=36.75,
         nome="EDUARDA CAMPOPIANO", papel="deputada estadual eleita (PL-SP)", fonte="YouTube (youtu.be/1AxFA1uv2vc)", carimbo="NÃO EXISTE?",
         caps=[["“O feminicídio não existe.", 0.07], ["É uma tipificação que, primeiro, juridicamente, ela não funciona pra evitar que o crime aconteça.”", 1.35]]),
    dict(id="sen1", src="senado-sug44_cFyvNdWR7M8", a=1.25, b=10.85,
         nome="SENADO FEDERAL", papel="Comissão de Direitos Humanos · 2017", fonte="TV Senado (youtu.be/cFyvNdWR7M8)", carimbo="SUG 44/2017",
         caps=[["“Sugestão 44 de 2017, proveniente do programa de cidadania,", 0.13], ["que busca a extinção do termo feminicídio", 4.05], ["e a criação de agravante para qualquer crime passional.”", 6.03]]),
    dict(id="sen2", src="senado-sug44_cFyvNdWR7M8", a=137.85, b=153.75,
         nome="SENADO FEDERAL", papel="parecer da relatora · CDH", fonte="TV Senado (youtu.be/cFyvNdWR7M8)", carimbo="O QUE DIZ A LEI",
         caps=[["“…não é todo homicídio com vítima mulher que caracteriza o feminicídio.", 0.11], ["Para a ocorrência dessa figura qualificada, é indispensável que a morte se dê por razão de condição de sexo feminino,", 4.25], ["ou seja, em situação de violência doméstica e familiar", 10.01], ["ou em caso de menosprezo ou discriminação à condição de mulher.”", 12.45]]),
    dict(id="sen3", src="senado-sug44_cFyvNdWR7M8", a=522.20, b=523.10,
         nome="SENADO FEDERAL", papel="resultado da votação", fonte="TV Senado (youtu.be/cFyvNdWR7M8)", carimbo="REJEITADO",
         caps=[["“Rejeitado.”", 0.14]]),
]
os.makedirs("recortes", exist_ok=True)
for c in CLIPS:
    out = f"recortes/{c['id']}.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(c["a"]), "-to", str(c["b"]), "-i", f"{O}/{c['src']}.mp3",
                    "-af", "highpass=f=80,afade=t=in:d=0.03,areverse,afade=t=in:d=0.06,areverse,loudnorm=I=-18:TP=-2,aresample=48000",
                    "-ac", "1", out], check=True)
    x = np.frombuffer(subprocess.run(["ffmpeg", "-loglevel", "error", "-i", out, "-f", "s16le", "-ac", "1", "-ar", "48000", "-"],
                                     capture_output=True).stdout, "<i2").astype(float) / 32768
    env = [float(np.sqrt((x[i:i + 1600] ** 2).mean())) for i in range(0, len(x), 1600)]
    mx = max(env) or 1
    c["wave"] = [round(e / mx, 3) for e in env]
    c["dur"] = round(len(x) / 48000, 3)
    print(c["id"], c["dur"])
json.dump(CLIPS, open("clips.json", "w"), ensure_ascii=False)
