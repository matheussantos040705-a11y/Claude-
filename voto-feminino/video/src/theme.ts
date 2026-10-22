import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Construtivismo à brasileira: papel envelhecido, tinta preta, vermelho de
// litografia, com verde e amarelo só como acento.
export const color = {
  paper: "#EFE3C8",
  paperDark: "#D9C9A6",
  ink: "#15110F",
  red: "#C8261E",
  redDark: "#8E1712",
  green: "#1E7A45",
  yellow: "#F2C230",
};

export const font = {
  display: "Big Shoulders",
  sans: "Work Sans",
  serif: "Instrument Serif",
  mono: "DM Mono",
};

loadFont({ family: font.display, url: staticFile("fonts/BigShoulders-Bold.ttf"), weight: "700" });
loadFont({ family: font.sans, url: staticFile("fonts/WorkSans-Bold.ttf"), weight: "700" });
loadFont({ family: font.sans, url: staticFile("fonts/WorkSans-Regular.ttf"), weight: "400" });
loadFont({ family: font.serif, url: staticFile("fonts/InstrumentSerif-Italic.ttf"), style: "italic" });
loadFont({ family: font.mono, url: staticFile("fonts/DMMono-Regular.ttf") });

// Início de cada cena, em segundos (casados com a narração).
export const scene = {
  date: 0,
  law: 5.0,
  sky: 8.0,
  celina: 10.6,
  alzira: 19.2,
  bertha: 24.2,
  data: 29.6,
  voice: 35.2,
  poster: 39.0,
  end: 45.0,
};
