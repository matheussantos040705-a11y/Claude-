#!/bin/bash
# Mixagem v2: narração (voz2/final) + música com ducking + efeitos, a -14 LUFS.
set -e
cd "$(dirname "$0")"
V=../voz2/final
ffmpeg -y -loglevel error -i $V/f1.wav -i $V/f2.wav -i $V/f3.wav -i $V/f4.wav -filter_complex \
 "[0]adelay=1800:all=1[a];[1]adelay=3000:all=1[b];[2]adelay=4780:all=1[c];[3]adelay=10000:all=1[d];[a][b][c][d]amix=inputs=4:normalize=0,aresample=48000,highpass=f=100,equalizer=f=250:t=q:w=1:g=-2,equalizer=f=4000:t=q:w=1:g=3,acompressor=threshold=-22dB:ratio=4:attack=4:release=70:makeup=5,aecho=0.8:0.5:35:0.12,apad=whole_dur=15,atrim=0:15,pan=stereo|c0=c0|c1=c0[v]" \
 -map "[v]" -c:a pcm_f32le voz.wav
ffmpeg -y -loglevel error -i musica.wav -i sfx.wav -i voz.wav -filter_complex \
 "[2]asplit[v1][v2];[0][v1]sidechaincompress=threshold=0.03:ratio=8:attack=8:release=220[m];[m]volume=0.75[mm];[1]volume=0.7[s];[mm][s][v2]amix=inputs=3:normalize=0:weights='1 1 1.8',volume=0.3" \
 -ar 48000 -c:a pcm_f32le pre.wav
J=$(ffmpeg -i pre.wav -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
g() { echo "$J" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
ffmpeg -y -loglevel error -i pre.wav -af "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" \
 -ar 48000 -c:a pcm_s16le mix.wav
rm -f pre.wav
cp mix.wav ../edit/public/audio/mix.wav
