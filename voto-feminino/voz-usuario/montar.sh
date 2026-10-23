#!/bin/bash
# Corta a gravação da usuária em 8 frases e posiciona cada uma no início da cena correspondente.
set -e
cd "$(dirname "$0")"
#        corte_ini corte_fim posição_no_vídeo
SEG=("1.70 5.95 0.55" "6.45 9.85 5.00" "9.85 12.75 8.70" "13.10 21.35 11.50"
     "22.20 27.70 19.50" "28.30 33.95 24.60" "34.45 39.60 30.10" "39.85 45.60 35.30")
IN=(); F=""; MIX=""
for i in "${!SEG[@]}"; do
  read a b at <<< "${SEG[$i]}"
  IN+=(-i limpo.wav)
  d=$(python3 -c "print(int($at*1000))")
  F+="[$i]atrim=$a:$b,asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st=$(python3 -c "print(round($b-$a-0.15,3))"):d=0.15,adelay=$d:all=1[s$i];"
  MIX+="[s$i]"
done
ffmpeg -y -loglevel error "${IN[@]}" -filter_complex "${F}${MIX}amix=inputs=${#SEG[@]}:normalize=0,apad=whole_dur=45,atrim=0:45,pan=stereo|c0=c0|c1=c0[v]" -map "[v]" -c:a pcm_f32le voz.wav
M=../audio2/trilha.wav
ffmpeg -y -loglevel error -i $M -i voz.wav -filter_complex \
 "[1]asplit[v1][v2];[0][v1]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=300[m];[m]volume=0.8[mm];[mm][v2]amix=inputs=2:normalize=0:weights='1 1.6',volume=0.4" \
 -ar 48000 -c:a pcm_f32le pre.wav
J=$(ffmpeg -i pre.wav -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
g() { echo "$J" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
ffmpeg -y -loglevel error -i pre.wav -af "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,apad=whole_dur=45" \
 -ar 48000 -c:a pcm_s16le mix.wav
rm -f pre.wav
