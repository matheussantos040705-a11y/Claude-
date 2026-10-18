# Inferno — motion graphic vertical

Motion graphic sombrio em formato vertical (1080×1920, 30 fps, ~50 s), inspirado
no *Inferno* da *Divina Comédia* de Dante Alighieri, feito em React com
[Remotion](https://www.remotion.dev). Tudo é procedural: nenhuma imagem ou
vídeo de banco, só SVG, CSS, ruído e uma trilha sintetizada em código.

## Roteiro

| Cena | Duração | O que acontece |
| --- | --- | --- |
| **Selva Oscura** (Canto I) | 8 s | Floresta de árvores mortas, névoa em camadas, os olhos das três feras se abrindo no escuro. *"Nel mezzo del cammin di nostra vita…"* |
| **Porta** (Canto III) | 9 s | O portão gótico em brasa, Dante e Virgílio em silhueta. *LASCIATE OGNE SPERANZA, VOI CH'INTRATE* acende letra por letra; a câmera mergulha na fornalha. |
| **Descida** | 18 s | Queda pelo funil dos nove círculos, cada um com sua cor e clima: a tempestade da Luxúria, a chuva da Gula, a chuva de fogo da Violência, a neve da Traição. |
| **Cocito** (Canto XXXIV) | 9 s | O fogo vira gelo. Lúcifer preso no lago congelado, asas batendo, três faces abrindo seis olhos. |
| **Estrelas** | 10 s | Saída da caverna para o céu: *"E quindi uscimmo a riveder le stelle."* Montanha do Purgatório, Vênus no horizonte, título final. |

Transições: fade, queimada de brasa (`src/transitions/emberBurn.tsx`) e clarão
de gelo (`src/transitions/iceFlash.tsx`). Granulação de filme e vinheta cobrem
o vídeo inteiro.

## Comandos

```console
npm i
npm run dev        # Remotion Studio, com cada cena como composição própria
npm run render     # gera out/inferno.mp4
npm run soundtrack # regenera public/inferno-soundtrack.mp3
```

## Estrutura

```
src/
  Inferno.tsx              composição principal (TransitionSeries + trilha)
  Root.tsx                 registro das composições
  fonts.ts                 Cinzel, Cinzel Decorative e Cormorant Garamond (locais)
  scenes/                  as cinco cenas
  components/              brasas, chamas, névoa, floresta, granulação, textos
  transitions/             emberBurn e iceFlash
scripts/
  generate-soundtrack.mjs  sintetizador da trilha, sincronizado às cenas
public/
  fonts/                   fontes (SIL Open Font License)
  inferno-soundtrack.mp3
```

## Trilha sonora

`scripts/generate-soundtrack.mjs` sintetiza o áudio do zero, sem amostras:
drone grave em Lá menor, vento, rosnados das feras, sinos a cada linha da
inscrição, uma batida de coração a cada círculo, estilhaço de gelo, as batidas
das asas de Lúcifer e um acorde de Lá maior para as estrelas. Os eventos são
marcados em quadros, então se mudar a duração de uma cena em `src/Inferno.tsx`,
ajuste `SCENE` no script e rode `npm run soundtrack`.

## Fontes

Cinzel, Cinzel Decorative e Cormorant Garamond ficam em `public/fonts/`, sob a
SIL Open Font License, para que a renderização não dependa do Google Fonts.
