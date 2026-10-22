#!/bin/bash
# Mixagem final: narração (take5) + trilha com ducking + efeitos, a -14 LUFS.
set -e
cd "$(dirname "$0")"
V=../voz/take5
sox $V/f2.wav f2c.wav trim 0 0.95 fade t 0 0 0.12   # corta o trecho inventado depois de "Uma faísca."
sox $V/f3.wav f3c.wav trim 0.05
ffmpeg -y -loglevel error -i $V/f1.wav -i f2c.wav -i f3c.wav -i $V/f4.wav -filter_complex \
 "[0]adelay=5000:all=1[a];[1]adelay=6400:all=1[b];[2]adelay=8100:all=1[c];[3]adelay=11500:all=1[d];[a][b][c][d]amix=inputs=4:normalize=0,aresample=48000,highpass=f=90,equalizer=f=3500:t=q:w=1:g=3,acompressor=threshold=-20dB:ratio=4:attack=5:release=80:makeup=4,apad=whole_dur=15,atrim=0:15,pan=stereo|c0=c0|c1=c0[v]" \
 -map "[v]" voz.wav
ffmpeg -y -loglevel error -i trilha.wav -i sfx.wav -i voz.wav -filter_complex \
 "[2]asplit[v1][v2];[0][v1]sidechaincompress=threshold=0.04:ratio=6:attack=10:release=250[m];[m]volume=0.8[mm];[1]volume=0.75[s];[mm][s][v2]amix=inputs=3:normalize=0:weights='1 1 1.6',volume=0.3" \
 -ar 48000 -c:a pcm_f32le pre.wav
J=$(ffmpeg -i pre.wav -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
g() { echo "$J" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
ffmpeg -y -loglevel error -i pre.wav -af "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" \
 -ar 48000 -c:a pcm_s16le mix.wav
rm -f pre.wav f2c.wav f3c.wav
cp mix.wav ../edit/public/audio/mix.wav
