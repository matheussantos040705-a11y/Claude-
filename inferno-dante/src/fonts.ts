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

// Display faces the end logo flickers through (subset to the letters of
// "INFERNO"/"inferno"), settling on the blackletter.
export const logoFonts = [
  "UnifrakturMaguntia",
  "Pirata One",
  "Metal Mania",
  "Grenze Gotisch",
  "New Rocker",
  "Rubik Glitch",
] as const;

const logoFiles: Record<(typeof logoFonts)[number], string> = {
  UnifrakturMaguntia: "UnifrakturMaguntia-logo.woff2",
  "Pirata One": "PirataOne-logo.woff2",
  "Metal Mania": "MetalMania-logo.woff2",
  "Grenze Gotisch": "GrenzeGotisch-logo.woff2",
  "New Rocker": "NewRocker-logo.woff2",
  "Rubik Glitch": "RubikGlitch-logo.woff2",
};

for (const family of logoFonts) {
  loadFont({ family, url: staticFile(`fonts/${logoFiles[family]}`) });
}
