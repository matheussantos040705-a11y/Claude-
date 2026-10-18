import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill, staticFile, useVideoConfig } from "remotion";
import { FilmGrain } from "./components/FilmGrain";
import { Vignette } from "./components/Vignette";
import { Cocito } from "./scenes/Cocito";
import { Descida } from "./scenes/Descida";
import { Estrelas } from "./scenes/Estrelas";
import { Porta } from "./scenes/Porta";
import { SelvaOscura } from "./scenes/SelvaOscura";
import { emberBurn } from "./transitions/emberBurn";
import { iceFlash } from "./transitions/iceFlash";

// Scene lengths (frames at 30 fps): 240 + 270 + 540 + 270 + 300,
// minus the transitions (20 + 30 + 24 + 30) = 1516 frames.
export const Inferno: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <TransitionSeries name="Cenas">
        <TransitionSeries.Sequence name="Selva Oscura" durationInFrames={8 * fps}>
          <SelvaOscura style={{ backgroundColor: "#000000" }} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence name="Porta do Inferno" durationInFrames={9 * fps}>
          <Porta style={{ backgroundColor: "#000000" }} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={emberBurn({ origin: "50% 79%" })}
          timing={linearTiming({ durationInFrames: 30 })}
        />
        <TransitionSeries.Sequence name="Descida" durationInFrames={18 * fps}>
          <Descida style={{ backgroundColor: "#000000" }} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={iceFlash()}
          timing={linearTiming({ durationInFrames: 24 })}
        />
        <TransitionSeries.Sequence name="Cocito" durationInFrames={9 * fps}>
          <Cocito style={{ backgroundColor: "#000000" }} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 30 })}
        />
        <TransitionSeries.Sequence name="Estrelas" durationInFrames={10 * fps}>
          <Estrelas style={{ backgroundColor: "#000000" }} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <Vignette strength={0.85} />
      <FilmGrain id="inferno-grain" opacity={0.1} />
      <Audio name="Trilha" src={staticFile("inferno-soundtrack.mp3")} />
    </AbsoluteFill>
  );
};
