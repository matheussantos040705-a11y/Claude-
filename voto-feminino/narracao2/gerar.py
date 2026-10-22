"""Narração com Chatterbox Multilingual (pt), uma frase por arquivo."""
import sys, torch, torchaudio
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

torch.manual_seed(int(sys.argv[3]) if len(sys.argv) > 3 else 7)
model = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
ref = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != "-" else None
lines = [l.strip() for l in open(sys.argv[1], encoding="utf-8") if l.strip()]
outdir = sys.argv[4] if len(sys.argv) > 4 else "."
exag = float(sys.argv[5]) if len(sys.argv) > 5 else 0.55
cfg = float(sys.argv[6]) if len(sys.argv) > 6 else 0.4
for i, text in enumerate(lines, 1):
    wav = model.generate(text, language_id="pt", audio_prompt_path=ref, exaggeration=exag, cfg_weight=cfg)
    torchaudio.save(f"{outdir}/f{i}.wav", wav, model.sr)
    print(i, round(wav.shape[-1] / model.sr, 2), flush=True)
