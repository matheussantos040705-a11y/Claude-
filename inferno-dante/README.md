# Inferno — edit vertical

Edit sombria em formato vertical (1080×1920, 30 fps, 34 s) sobre o *Inferno*
de Dante, montada em [Remotion](https://www.remotion.dev). Segue o estilo de
uma edit de referência: phonk pesado, um corte por batida, detalhes de
esculturas e pinturas, silhuetas em névoa branca, um plano vermelho, quadros
em preto e branco puro e um logo final que troca de fonte quadro a quadro.

## Roteiro

| Batidas | O que acontece |
| --- | --- |
| 0–32 | Um corte a cada duas batidas: o *Ugolino* de Carpeaux em detalhes (rosto, filho, mãos, a escultura inteira), rostos craquelados de Van Cleve, os condenados e demônios de um seguidor de Bosch, o submundo em chamas de Brueghel, a Morte no *Juízo Final* de Van Eyck, Caronte e Minos de Doré. Uma transição empurra a imagem para cima com uma faixa preta. |
| 32–40 | Breakdown: *O Pensador* de Rodin e outros bronzes como silhuetas na névoa branca, sob correntes, gemidos e sussurros. **LASCIATE OGNE SPERANZA**. Dois quadros de limiar antes do drop. |
| 40–72 | O drop: um corte por batida pelos círculos (harpias, ladrões, cismáticos, serpentes, Bertran de Born), o *Mársias* de Permoser gritando em vermelho, os gigantes, Ugolino na torre, a chuva de fogo, as Fúrias, Lúcifer no gelo. |
| fim | Corte seco, flash e o logo **Inferno**, que pisca por várias fontes, borra de lado e assenta dentro de uma lente. |

## Comandos

```console
npm i
npm run dev      # Remotion Studio
npm run render   # gera out/inferno.mp4
npm run audio    # remixa public/inferno-audio.mp3 (precisa de python3, numpy e ffmpeg)
```

## Como está organizado

```
src/
  InfernoEdit.tsx        a edit: cada plano e texto com sua batida
  edit/beat-grid.json    BPM, trechos da música e drop (lido também pelo mixador)
  edit/timing.ts         beat(n): quadro de cada batida da edit
  edit/Shot.tsx          um plano: enquadramento, zoom, tom e transições
  edit/Quote.tsx         a frase sobre a névoa
  edit/EndLogo.tsx       o logo final
  components/            granulação, vinheta, névoa
scripts/
  mix-audio.py           baixa as fontes de áudio e mixa a trilha na grade de batidas
public/
  shots/                 detalhes recortados em 9:16 das obras do Met
  plates/                gravuras de Doré, recortadas e endireitadas
  fonts/                 fontes (OFL)
  inferno-audio.mp3      trilha final (música + efeitos)
```

## Créditos e licenças

- **Música:** "Chess Type Phonk Beat", K0i, Jesus Mus1c & Joyful,
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), via
  [archive.org](https://archive.org/details/project-03-30-1-hd-720p-medium-fr-30-d-minor-bpm-140).
  A edit usa dois trechos da faixa, emendados na batida. Ao publicar, inclua
  na descrição: *Música: "Chess Type Phonk Beat" — K0i, Jesus Mus1c & Joyful
  (CC BY 4.0), editada*.
- **Esculturas e pinturas:** The Metropolitan Museum of Art, Open Access
  (CC0): Carpeaux, *Ugolino and His Sons*; Rodin, *The Thinker* e
  *Despairing Adolescent*; Wyon, *Saint Michael Overcoming Satan*; Permoser,
  *Marsyas*; Van Eyck, *The Crucifixion; The Last Judgment*; Joos van Cleve,
  *The Last Judgment*; seguidor de Bosch, *Christ's Descent into Hell*; Jan
  Brueghel the Younger, *Aeneas and the Sibyl in the Underworld*.
- **Gravuras:** Gustave Doré, ilustrações para o *Inferno* (1861), domínio
  público, da edição Cassell de 1866 digitalizada pela Universidade de Toronto
  ([archive.org](https://archive.org/details/dantesinferno00dantuoft)).
- **Efeitos sonoros:** SSE Library, Red Library e The Designer's Choice no
  archive.org, CC0.
- **Fontes:** Cinzel, Cormorant Garamond, UnifrakturMaguntia, Pirata One,
  Metal Mania, Grenze Gotisch, New Rocker e Rubik Glitch, SIL Open Font
  License.
