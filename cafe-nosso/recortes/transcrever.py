"""Transcreve os áudios originais com marcação de tempo (segmentos e palavras)."""
import sys, os, json
from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8")
for p in sys.argv[1:]:
    out = os.path.splitext(p)[0]
    segs, _ = m.transcribe(p, language="pt", word_timestamps=True, vad_filter=True)
    segs = list(segs)
    with open(out + ".txt", "w", encoding="utf-8") as f:
        for s in segs:
            f.write(f"[{s.start:7.2f} - {s.end:7.2f}] {s.text.strip()}\n")
    json.dump([{"start": s.start, "end": s.end, "text": s.text,
                "words": [(w.word, w.start, w.end) for w in s.words]} for s in segs],
              open(out + ".json", "w", encoding="utf-8"), ensure_ascii=False)
    print("ok", p, flush=True)
