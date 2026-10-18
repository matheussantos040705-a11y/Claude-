import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, Track } from "remotion";
import { FilmDamage } from "./components/FilmDamage";
import { FilmGrain } from "./components/FilmGrain";
import { Fog } from "./components/Fog";
import { Vignette } from "./components/Vignette";
import { EndTitle } from "./edit/EndTitle";
import { Inscription } from "./edit/Inscription";
import { Shot } from "./edit/Shot";
import { SlamWord } from "./edit/SlamWord";
import { beat, DURATION_IN_FRAMES, END, snare } from "./edit/timing";

// Intro: slow engravings and the inscription over the gate, while the music
// barely breathes. Drop: a cut every two beats, then a cut on every snare.
export const InfernoEdit: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <Track name="Gravuras">
        <Shot name="Selva oscura" from={beat(-27)} durationInFrames={beat(-20) - beat(-27)} plate="selva" focusX={0.42} focusY={0.5} zoomFrom={1.0} zoomTo={1.14} fadeIn={40} fadeOut={8} />
        <Shot name="Aqueronte" from={beat(-20)} durationInFrames={beat(-14) - beat(-20)} plate="aqueronte" focusX={0.5} focusY={0.55} zoomFrom={1.02} zoomTo={1.12} panX={-140} fadeIn={10} fadeOut={8} />
        <Shot name="Abismo" from={beat(-14)} durationInFrames={beat(-8) - beat(-14)} plate="abismo" focusX={0.6} focusY={0.68} zoomFrom={1.0} zoomTo={1.18} panX={90} fadeIn={10} fadeOut={4} />
        <Shot name="Farinata" from={beat(-8)} durationInFrames={beat(-4) - beat(-8)} plate="farinata" tone="fire" focusX={0.38} focusY={0.7} zoomFrom={1.1} zoomTo={1.35} punch={0.08} pulses={[24, 48, 72]} />

        <Shot name="Caronte" from={beat(0)} durationInFrames={beat(2) - beat(0)} plate="caronte" tone="fire" focusX={0.5} focusY={0.42} punch={0.3} flash={1} shake={26} split={16} pulses={[beat(1) - beat(0)]} />
        <Shot name="Minos" from={beat(2)} durationInFrames={beat(4) - beat(2)} plate="minos" tone="blood" focusX={0.5} focusY={0.35} punch={0.2} flash={0.5} shake={16} split={10} pulses={[beat(3) - beat(2)]} />
        <Shot name="Turbilhão" from={beat(4)} durationInFrames={beat(6) - beat(4)} plate="turbilhao" focusX={0.62} focusY={0.4} punch={0.2} flash={0.5} shake={16} split={10} panX={-60} pulses={[beat(5) - beat(4)]} />
        <Shot name="Francesca" from={beat(6)} durationInFrames={beat(8) - beat(6)} plate="francesca" focusX={0.44} focusY={0.5} punch={0.2} flash={0.4} shake={14} split={10} pulses={[beat(7) - beat(6)]} />
        <Shot name="Fúrias" from={beat(8)} durationInFrames={beat(10) - beat(8)} plate="furias" tone="fire" focusX={0.5} focusY={0.25} panY={-240} punch={0.2} flash={0.5} shake={16} split={12} pulses={[beat(9) - beat(8)]} />
        <Shot name="Túmulos de fogo" from={beat(10)} durationInFrames={snare(0) - beat(10)} plate="tumulo" tone="fire" focusX={0.3} focusY={0.42} punch={0.2} flash={0.5} shake={16} split={12} pulses={[beat(11) - beat(10), beat(12) - beat(10)]} />

        <Shot name="Harpias" from={snare(0)} durationInFrames={snare(1) - snare(0)} plate="harpias" focusX={0.5} focusY={0.4} punch={0.22} flash={0.9} shake={24} split={18} />
        <Shot name="Demônio alado" from={snare(1)} durationInFrames={snare(2) - snare(1)} plate="demonio-alado" tone="fire" focusX={0.5} focusY={0.45} punch={0.18} flash={0.4} shake={18} split={12} />
        <Shot name="Chuva de fogo" from={snare(2)} durationInFrames={snare(3) - snare(2)} plate="chuva-de-fogo" tone="fire" focusX={0.6} focusY={0.5} punch={0.18} flash={0.4} shake={18} split={12} />
        <Shot name="Demônios" from={snare(3)} durationInFrames={snare(4) - snare(3)} plate="demonios" focusX={0.4} focusY={0.5} punch={0.18} shake={18} invert={3} />
        <Shot name="Demônios em luta" from={snare(4)} durationInFrames={snare(5) - snare(4)} plate="demonios-luta" tone="fire" focusX={0.5} focusY={0.4} punch={0.2} flash={0.6} shake={20} split={14} />
        <Shot name="Caifás" from={snare(5)} durationInFrames={snare(6) - snare(5)} plate="caifas" focusX={0.4} focusY={0.75} punch={0.18} flash={0.3} shake={16} split={10} />
        <Shot name="Ladrões" from={snare(6)} durationInFrames={snare(7) - snare(6)} plate="ladroes" tone="blood" focusX={0.5} focusY={0.5} punch={0.18} flash={0.4} shake={18} split={12} />
        <Shot name="Serpente" from={snare(7)} durationInFrames={snare(8) - snare(7)} plate="serpente" focusX={0.5} focusY={0.55} punch={0.18} shake={18} invert={2} />
        <Shot name="Cismáticos" from={snare(8)} durationInFrames={snare(9) - snare(8)} plate="cismaticos" tone="blood" focusX={0.35} focusY={0.6} punch={0.2} flash={0.5} shake={20} split={14} />
        <Shot name="Bertran de Born" from={snare(9)} durationInFrames={snare(10) - snare(9)} plate="bertran" tone="fire" focusX={0.6} focusY={0.3} punch={0.18} flash={0.3} shake={16} split={12} />
        <Shot name="Anteu" from={snare(10)} durationInFrames={snare(11) - snare(10)} plate="anteu" focusX={0.45} focusY={0.4} punch={0.2} flash={0.5} shake={22} split={14} />
        <Shot name="Farinata (detalhe)" from={snare(11)} durationInFrames={snare(12) - snare(11)} plate="farinata" tone="fire" focusX={0.36} focusY={0.76} zoomFrom={1.5} zoomTo={1.62} punch={0.15} shake={16} split={12} />
        <Shot name="Cocito" from={snare(12)} durationInFrames={snare(13) - snare(12)} plate="cocito" tone="ice" focusX={0.42} focusY={0.45} punch={0.2} flash={0.8} shake={20} split={14} />
        <Shot name="Ugolino no gelo" from={snare(13)} durationInFrames={snare(14) - snare(13)} plate="ugolino-gelo" tone="ice" focusX={0.55} focusY={0.55} punch={0.18} shake={18} split={12} />
        <Shot name="Ugolino na torre" from={snare(14)} durationInFrames={snare(15) - snare(14)} plate="ugolino-torre" focusX={0.45} focusY={0.55} punch={0.18} flash={0.3} shake={16} split={10} />
        <Shot name="Minos (detalhe)" from={snare(15)} durationInFrames={snare(16) - snare(15)} plate="minos" tone="blood" focusX={0.5} focusY={0.25} zoomFrom={1.6} zoomTo={1.72} punch={0.15} shake={20} invert={2} />
        <Shot name="Caronte (detalhe)" from={snare(16)} durationInFrames={snare(17) - snare(16)} plate="caronte" tone="fire" focusX={0.52} focusY={0.3} zoomFrom={1.7} zoomTo={1.84} punch={0.15} flash={0.4} shake={20} split={14} />
        <Shot name="Demônio alado (detalhe)" from={snare(17)} durationInFrames={snare(18) - snare(17)} plate="demonio-alado" tone="blood" focusX={0.5} focusY={0.4} zoomFrom={1.6} zoomTo={1.72} punch={0.15} shake={22} split={16} />
        <Shot name="Lúcifer" from={snare(18)} durationInFrames={END - snare(18)} plate="lucifer" tone="ice" focusX={0.42} focusY={0.42} zoomFrom={1.0} zoomTo={1.3} punch={0.25} flash={1} shake={12} split={18} pulses={[snare(19) - snare(18), snare(20) - snare(18), snare(21) - snare(18)]} />
      </Track>

      <Track name="Lampejos">
        <Shot name="Lampejo: Bertran" from={beat(-7)} durationInFrames={3} plate="bertran" focusX={0.6} focusY={0.3} zoomFrom={1.3} zoomTo={1.3} invert={3} />
        <Shot name="Lampejo: Ugolino" from={beat(-6)} durationInFrames={3} plate="ugolino-gelo" tone="blood" focusX={0.55} focusY={0.55} zoomFrom={1.4} zoomTo={1.4} split={22} />
        <Shot name="Lampejo: demônios" from={beat(-5)} durationInFrames={3} plate="demonios-luta" focusX={0.5} focusY={0.4} zoomFrom={1.3} zoomTo={1.3} invert={3} />
      </Track>

      <Sequence name="Fumaça" durationInFrames={beat(0)}>
        <Fog id="edit-smoke" seed={11} rgb={[0.55, 0.5, 0.45]} density={0.9} speedX={0.25} speedY={-0.8} opacity={0.12} />
      </Sequence>

      <Track name="Texto">
        <Inscription name="Per me si va… città dolente" from={beat(-25)} durationInFrames={beat(-20) - beat(-25) - 6} verse={"PER ME SI VA\nNE LA CITTÀ DOLENTE"} translation="por mim se vai à cidade dolente" />
        <Inscription name="Per me si va… etterno dolore" from={beat(-19)} durationInFrames={beat(-14) - beat(-19) - 6} verse={"PER ME SI VA\nNE L'ETTERNO DOLORE"} translation="por mim se vai à eterna dor" />
        <Inscription name="Per me si va… perduta gente" from={beat(-13)} durationInFrames={beat(-8) - beat(-13) - 6} verse={"PER ME SI VA\nTRA LA PERDUTA GENTE"} translation="por mim se vai entre a gente perdida" />
        <SlamWord name="Lasciate" from={beat(-3)} durationInFrames={beat(-2) - beat(-3)} word="LASCIATE" />
        <SlamWord name="Ogne" from={beat(-2)} durationInFrames={beat(-1) - beat(-2)} word="OGNE" size={210} />
        <SlamWord name="Speranza" from={beat(-1)} durationInFrames={beat(0) - beat(-1)} word="SPERANZA" />
        <EndTitle name="Título" from={END + 18} durationInFrames={DURATION_IN_FRAMES - END - 18} />
      </Track>

      <FilmDamage />
      <Vignette strength={0.9} />
      <FilmGrain id="edit-grain" opacity={0.16} />
      <Audio name="Trilha" src={staticFile("inferno-audio.mp3")} />
    </AbsoluteFill>
  );
};
