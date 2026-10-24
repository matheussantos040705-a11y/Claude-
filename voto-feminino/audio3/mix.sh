#!/bin/bash
# Mixagem final: voz clonada + trilha (com ducking) + efeitos sonoros, a -14 LUFS.
set -e
cd "$(dirname "$0")"
python3 sfx.py sfx.wav
V=../voz-usuario/voz-clone.wav
ffmpeg -y -loglevel error -i ../audio2/trilha.wav -i sfx.wav -i $V -filter_complex \
 "[2]asplit=3[v1][v2][v3];[0][v1]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=300[m];[1][v2]sidechaincompress=threshold=0.05:ratio=2.5:attack=10:release=200[s];[m]volume=0.75[mm];[s]volume=0.62[ss];[mm][ss][v3]amix=inputs=3:normalize=0:weights='1 1 1.6',volume=0.4" \
 -ar 48000 -c:a pcm_f32le pre.wav
J=$(ffmpeg -i pre.wav -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
g() { echo "$J" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
ffmpeg -y -loglevel error -i pre.wav -af "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,apad=whole_dur=45" \
 -ar 48000 -c:a pcm_s16le mix.wav
rm -f pre.wav
cp mix.wav ../video/public/audio/mix.wav
