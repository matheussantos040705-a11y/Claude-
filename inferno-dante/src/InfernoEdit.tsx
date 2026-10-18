import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, Track } from "remotion";
import { FilmGrain } from "./components/FilmGrain";
import { Vignette } from "./components/Vignette";
import { EndLogo } from "./edit/EndLogo";
import { Quote } from "./edit/Quote";
import { Shot } from "./edit/Shot";
import { beat, DURATION_IN_FRAMES, END } from "./edit/timing";

// A cut on every beat or every other beat. Marble and painted details first,
// silhouettes in white fog for the breakdown, then the drop through the
// circles of Hell down to Lucifer, and the logo.
export const InfernoEdit: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <Track name="Detalhes">
        <Shot name="Ugolino, rosto" from={beat(0)} durationInFrames={beat(2) - beat(0)} src="shots/ugolino-rosto.jpg" tone="statue" focusY={0.45} zoomTo={1.13} flash={0.5} />
        <Shot name="Ugolino, filho" from={beat(2)} durationInFrames={beat(4) - beat(2)} src="shots/ugolino-filho.jpg" tone="statue" focusY={0.4} />
        <Shot name="Ugolino, mãos" from={beat(4)} durationInFrames={beat(6) - beat(4)} src="shots/ugolino-maos.jpg" tone="statue" />
        <Shot name="Ugolino" from={beat(6)} durationInFrames={beat(8) - beat(6)} src="shots/ugolino.jpg" tone="statue" zoomFrom={1.0} zoomTo={1.06} />
        <Shot name="Olho" from={beat(8)} durationInFrames={beat(10) - beat(8)} src="shots/olho.jpg" tone="paint" focusX={0.4} zoomTo={1.14} />
        <Shot name="Rosto craquelado" from={beat(10)} durationInFrames={beat(12) - beat(10)} src="shots/rosto-craquele.jpg" tone="paint" />
        <Shot name="Condenados" from={beat(12)} durationInFrames={beat(14) - beat(12)} src="shots/condenados.jpg" tone="paint" />
        <Shot name="Fuga" from={beat(14)} durationInFrames={beat(16) - beat(14)} src="shots/fuga.jpg" tone="paint" focusX={0.4} slideOut={3} />
        <Shot name="Demônio" from={beat(16)} durationInFrames={beat(18) - beat(16)} src="shots/demonio.jpg" tone="paint" slideIn={3} />
        <Shot name="Nus" from={beat(18)} durationInFrames={beat(20) - beat(18)} src="shots/nus.jpg" tone="paint" />
        <Shot name="Céu de fogo" from={beat(20)} durationInFrames={beat(22) - beat(20)} src="shots/ceu-de-fogo.jpg" tone="paint" zoomFrom={1.06} zoomTo={1.14} />
        <Shot name="Cidade em chamas" from={beat(22)} durationInFrames={beat(24) - beat(22)} src="shots/cidade-em-chamas.jpg" tone="paint" />
        <Shot name="Juízo, inferno" from={beat(24)} durationInFrames={beat(26) - beat(24)} src="shots/juizo-inferno.jpg" tone="paint" />
        <Shot name="Morte" from={beat(26)} durationInFrames={beat(28) - beat(26)} src="shots/morte.jpg" tone="paint" focusY={0.45} />
        <Shot name="Caronte" from={beat(28)} durationInFrames={beat(30) - beat(28)} src="plates/caronte.jpg" tone="fire" focusY={0.42} />
        <Shot name="Mársias" from={beat(30)} durationInFrames={beat(31) - beat(30)} src="shots/marsias.jpg" tone="statue" />
        <Shot name="Minos" from={beat(31)} durationInFrames={beat(32) - beat(31)} src="plates/minos.jpg" tone="fire" focusY={0.35} />
      </Track>

      <Track name="Névoa">
        <Shot name="Pensador na névoa" from={beat(32)} durationInFrames={beat(34) - beat(32)} src="shots/pensador.jpg" tone="haze" zoomFrom={1.0} zoomTo={1.08} />
        <Shot name="Lança na névoa" from={beat(34)} durationInFrames={beat(36) - beat(34)} src="shots/lanca.jpg" tone="haze" />
        <Shot name="Desespero na névoa" from={beat(36)} durationInFrames={beat(38) - beat(36)} src="shots/desespero.jpg" tone="haze" />
        <Shot name="Pensador na névoa, rosto" from={beat(38)} durationInFrames={beat(39.5) - beat(38)} src="shots/pensador-rosto.jpg" tone="haze" />
        <Shot name="Limiar: grito" from={beat(39.5)} durationInFrames={2} src="shots/marsias-grito.jpg" tone="threshold" />
        <Shot name="Limiar: lança" from={beat(39.5) + 2} durationInFrames={2} src="shots/lanca.jpg" tone="threshold" />
      </Track>

      <Track name="Drop">
        <Shot name="Demônio alado" from={beat(40)} durationInFrames={beat(41) - beat(40)} src="plates/demonio-alado.jpg" tone="fire" focusY={0.45} flash={1} punch={0.12} shake={14} />
        <Shot name="Caos" from={beat(41)} durationInFrames={beat(42) - beat(41)} src="shots/caos.jpg" tone="paint" />
        <Shot name="Harpias" from={beat(42)} durationInFrames={beat(43) - beat(42)} src="plates/harpias.jpg" tone="ash" focusY={0.4} />
        <Shot name="Ugolino grita" from={beat(43)} durationInFrames={beat(44) - beat(43)} src="shots/ugolino-grito.jpg" tone="statue" />
        <Shot name="Ladrões" from={beat(44)} durationInFrames={beat(45) - beat(44)} src="plates/ladroes.jpg" tone="fire" />
        <Shot name="Eneias" from={beat(45)} durationInFrames={beat(46) - beat(45)} src="shots/eneias.jpg" tone="paint" />
        <Shot name="Cismáticos" from={beat(46)} durationInFrames={beat(47) - beat(46)} src="plates/cismaticos.jpg" tone="ash" focusX={0.35} focusY={0.6} />
        <Shot name="Pensador, rosto" from={beat(47)} durationInFrames={beat(48) - beat(47)} src="shots/pensador-rosto.jpg" tone="statue" />
        <Shot name="Serpente" from={beat(48)} durationInFrames={beat(50) - beat(48)} src="plates/serpente.jpg" tone="ash" focusY={0.55} slideOut={3} />
        <Shot name="Submundo" from={beat(50)} durationInFrames={beat(52) - beat(50)} src="shots/submundo.jpg" tone="paint" slideIn={3} />
        <Shot name="Bertran de Born" from={beat(52)} durationInFrames={beat(54) - beat(52)} src="plates/bertran.jpg" tone="fire" focusX={0.6} focusY={0.3} />
        <Shot name="Mársias em vermelho" from={beat(54)} durationInFrames={beat(56) - beat(54)} src="shots/marsias-grito.jpg" tone="red" zoomFrom={1.05} zoomTo={1.15} />
        <Shot name="Limiar: demônios" from={beat(56)} durationInFrames={2} src="plates/demonios-luta.jpg" tone="threshold" focusY={0.4} />
        <Shot name="Limiar: Ugolino" from={beat(56) + 2} durationInFrames={2} src="shots/ugolino-rosto.jpg" tone="threshold" />
        <Shot name="Farinata" from={beat(57)} durationInFrames={beat(58) - beat(57)} src="plates/farinata.jpg" tone="fire" focusX={0.38} focusY={0.7} flash={0.8} punch={0.1} shake={10} />
        <Shot name="Anteu" from={beat(58)} durationInFrames={beat(60) - beat(58)} src="plates/anteu.jpg" tone="ash" focusX={0.45} focusY={0.4} />
        <Shot name="Ugolino na torre" from={beat(60)} durationInFrames={beat(62) - beat(60)} src="plates/ugolino-torre.jpg" tone="ash" focusX={0.45} focusY={0.55} />
        <Shot name="Caifás" from={beat(62)} durationInFrames={beat(64) - beat(62)} src="plates/caifas.jpg" tone="ash" focusX={0.4} focusY={0.75} />
        <Shot name="Chuva de fogo" from={beat(64)} durationInFrames={beat(65) - beat(64)} src="plates/chuva-de-fogo.jpg" tone="fire" focusX={0.6} />
        <Shot name="Túmulos de fogo" from={beat(65)} durationInFrames={beat(66) - beat(65)} src="plates/tumulo.jpg" tone="fire" focusX={0.3} focusY={0.42} />
        <Shot name="Fúrias" from={beat(66)} durationInFrames={beat(68) - beat(66)} src="plates/furias.jpg" tone="fire" focusY={0.25} panY={-120} />
        <Shot name="Lúcifer" from={beat(68)} durationInFrames={END - beat(68)} src="plates/lucifer.jpg" tone="ice" focusX={0.42} focusY={0.42} zoomFrom={1.0} zoomTo={1.22} flash={0.6} />
      </Track>

      <Track name="Texto">
        <Quote name="Lasciate ogne speranza" from={beat(33)} durationInFrames={beat(39.5) - beat(33)} text="LASCIATE OGNE SPERANZA" />
        <EndLogo name="Logo" from={END} durationInFrames={DURATION_IN_FRAMES - END} />
      </Track>

      <Vignette strength={0.6} />
      <FilmGrain id="edit-grain" opacity={0.12} />
      <Audio name="Trilha" src={staticFile("inferno-audio.mp3")} />
    </AbsoluteFill>
  );
};
