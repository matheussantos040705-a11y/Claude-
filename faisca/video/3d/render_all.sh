#!/bin/bash
# Renderiza as três tomadas; pode ser rodado de novo e continua de onde parou.
cd "$(dirname "$0")"
blender -b -P lata.py -- --shot D --out packshot.png --frame 1 --res 1080 1920 --samples 64 > log_D.txt 2>&1
blender -b -P lata.py -- --shot A --seq shotA --res 810 1440 --samples 40 > log_A.txt 2>&1
blender -b -P lata.py -- --shot B --seq shotB --res 810 1440 --samples 40 > log_B.txt 2>&1
echo FIM > fim.txt
