# Inferno — edit vertical

Edit sombria em formato vertical (1080×1920, 30 fps, 56 s) sobre o *Inferno*
de Dante, montada em [Remotion](https://www.remotion.dev) com as gravuras de
Gustave Doré, cortes na batida da música e desenho de som com correntes,
gemidos e gritos.

## Roteiro

| Trecho | O que acontece |
| --- | --- |
| 0–23 s | Tela preta, correntes arrastando. As gravuras surgem devagar (a selva escura, as almas no Aqueronte, o abismo) com a inscrição do portão: *Per me si va ne la città dolente…* Gemidos, choro, respiração de dor, batida de coração, lampejos subliminares. |
| 21–23 s | **LASCIATE · OGNE · SPERANZA**, uma palavra por batida, cada uma com o portão batendo. |
| 23 s | Drop: clarão, Caronte. Um corte a cada duas batidas (Minos, o turbilhão, Francesca, as Fúrias, os túmulos de fogo). |
| 33 s | Um corte por batida, nas caixas: Harpias, demônios, chuva de fogo, Caifás, ladrões e serpentes, Bertran de Born, os gigantes, o Cocito, Ugolino. |
| 48 s | Lúcifer no gelo, rugindo. Corte seco para o preto. |
| 52 s | Silêncio, uma última corrente, **INFERNO**. |

Cada plano tem movimento de câmera, punch de zoom, tremida, flash e separação
RGB no corte, além de tom de fogo, sangue, cinza ou gelo. Por cima de tudo há
textura de filme antigo (granulação, riscos, poeira, cintilação do projetor).

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
  InfernoEdit.tsx        a edit: cada plano e cada texto com seu tempo na batida
  edit/beat-grid.json    trecho da música, BPM e drop (lido também pelo mixador)
  edit/timing.ts         beat(n) e snare(k): quadros de cada batida
  edit/Shot.tsx          um plano: enquadramento, câmera, tom e efeitos de corte
  edit/Inscription.tsx   versos da inscrição com tradução
  edit/SlamWord.tsx      palavra batida na tela
  edit/EndTitle.tsx      título final e créditos
  components/            granulação, riscos de filme, vinheta, fumaça
scripts/
  mix-audio.py           baixa as fontes de áudio e mixa a trilha na grade de batidas
public/
  plates/                gravuras de Doré, recortadas e endireitadas
  inferno-audio.mp3      trilha final (música + efeitos)
```

## Créditos e licenças

- **Gravuras:** Gustave Doré, ilustrações para o *Inferno* (1861), domínio
  público. Digitalização da edição Cassell de 1866, Universidade de Toronto,
  via [archive.org](https://archive.org/details/dantesinferno00dantuoft).
- **Música:** "Hitman", Kevin MacLeod
  ([incompetech.com](https://incompetech.com)), licença
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Ao publicar,
  inclua na descrição: *Hitman — Kevin MacLeod (incompetech.com), Licensed
  under Creative Commons: By Attribution 4.0*.
- **Efeitos sonoros:** bibliotecas SSE Library, Red Library e The Designer's
  Choice no archive.org, todas CC0 (domínio público).
- **Fontes:** Cinzel e Cormorant Garamond, SIL Open Font License.
