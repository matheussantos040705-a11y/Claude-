#!/bin/bash
# Narração com a voz clonada (dicção limpa): uma frase por cena, tratamento leve e mixagem a -14 LUFS.
# uso: ./montar-clone.sh <pasta com f1..f8.wav> <saida.wav>
set -e
cd "$(dirname "$0")"
D=$1; OUT=$2
AT=(0.60 5.05 8.75 11.50 19.50 24.60 29.60 35.45)
IN=(); F=""; MIX=""
for i in "${!AT[@]}"; do
  IN+=(-i "$D/f$((i+1)).wav")
  F+="[$i]aresample=48000,adelay=$(python3 -c "print(int(${AT[$i]}*1000))"):all=1[s$i];"
  MIX+="[s$i]"
done
ffmpeg -y -loglevel error "${IN[@]}" -filter_complex \
 "${F}${MIX}amix=inputs=8:normalize=0,highpass=f=70,equalizer=f=180:t=q:w=1:g=1.5,equalizer=f=350:t=q:w=1.4:g=-2,equalizer=f=4500:t=q:w=1:g=2,equalizer=f=11000:t=h:w=0.7:g=2,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2,apad=whole_dur=45,atrim=0:45,pan=stereo|c0=c0|c1=c0[v]" \
 -map "[v]" -c:a pcm_f32le voz-clone.wav
ffmpeg -y -loglevel error -i ../audio2/trilha.wav -i voz-clone.wav -filter_complex \
 "[1]asplit[v1][v2];[0][v1]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=300[m];[m]volume=0.8[mm];[mm][v2]amix=inputs=2:normalize=0:weights='1 1.6',volume=0.4" \
 -ar 48000 -c:a pcm_f32le pre.wav
J=$(ffmpeg -i pre.wav -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
g() { echo "$J" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
ffmpeg -y -loglevel error -i pre.wav -af "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,apad=whole_dur=45" \
 -ar 48000 -c:a pcm_s16le "$OUT"
rm -f pre.wav
