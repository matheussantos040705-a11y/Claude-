#!/bin/bash
# Renderiza as quatro tomadas em sequência; pode ser rodado de novo e continua de onde parou.
cd "$(dirname "$0")"
for s in MACRO SPLASH FRUTA HERO; do
  blender -b -P cena.py -- --shot $s --seq ${s,,} --res 720 1280 --samples 26 > log_$s.txt 2>&1
done
echo FIM > fim.txt
