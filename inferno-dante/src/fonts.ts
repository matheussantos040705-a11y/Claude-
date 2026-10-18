import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// The fonts live in public/fonts (SIL Open Font License), so renders never
// depend on reaching Google Fonts.

// Cinzel: the inscription, the slammed words and the title.
export const cinzel = "Cinzel";
// Cormorant Garamond italic: the translations and credits.
export const cormorant = "Cormorant Garamond";

loadFont({
  family: cinzel,
  url: staticFile("fonts/Cinzel-Variable.woff2"),
  weight: "400 900",
});
loadFont({
  family: cormorant,
  url: staticFile("fonts/CormorantGaramond-Italic-Variable.woff2"),
  style: "italic",
  weight: "300 700",
});
