import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// The fonts live in public/fonts (SIL Open Font License), so renders never
// depend on reaching Google Fonts.

// Cinzel: inscrições romanas, títulos e numerais.
export const cinzel = "Cinzel";
// Cinzel Decorative: o título final.
export const cinzelDecorative = "Cinzel Decorative";
// Cormorant Garamond itálico: os versos de Dante.
export const cormorant = "Cormorant Garamond";

loadFont({
  family: cinzel,
  url: staticFile("fonts/Cinzel-Variable.woff2"),
  weight: "400 900",
});
loadFont({
  family: cinzelDecorative,
  url: staticFile("fonts/CinzelDecorative-Bold.woff2"),
  weight: "700",
});
loadFont({
  family: cinzelDecorative,
  url: staticFile("fonts/CinzelDecorative-Black.woff2"),
  weight: "900",
});
loadFont({
  family: cormorant,
  url: staticFile("fonts/CormorantGaramond-Italic-Variable.woff2"),
  style: "italic",
  weight: "300 700",
});
