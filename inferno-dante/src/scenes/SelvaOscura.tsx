import React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Embers } from "../components/Embers";
import { Fog } from "../components/Fog";
import { ForestLayer } from "../components/Forest";
import { RevealWords } from "../components/RevealWords";
import { cinzel, cormorant } from "../fonts";

const FAR_TREES = [
  { x: 60, height: 900, thickness: 16 },
  { x: 210, height: 1050, thickness: 18 },
  { x: 380, height: 820, thickness: 14 },
  { x: 520, height: 980, thickness: 17 },
  { x: 690, height: 880, thickness: 15 },
  { x: 840, height: 1100, thickness: 19 },
  { x: 1000, height: 860, thickness: 15 },
];

const MID_TREES = [
  { x: -20, height: 1350, thickness: 34 },
  { x: 250, height: 1150, thickness: 26 },
  { x: 610, height: 1250, thickness: 28 },
  { x: 900, height: 1400, thickness: 36 },
];

const NEAR_TREES = [
  { x: -90, height: 1900, thickness: 70 },
  { x: 1150, height: 2000, thickness: 78 },
  { x: 140, height: 1500, thickness: 30 },
];

type EyesProps = {
  readonly x: number;
  readonly y: number;
  readonly gap: number;
  readonly size: number;
  readonly color: string;
  readonly openAt: number;
  readonly blinkAt: number;
  readonly closeAt: number;
};

// A pair of eyes in the undergrowth: the leopard, the lion and the she-wolf.
const Eyes: React.FC<EyesProps> = ({
  x,
  y,
  gap,
  size,
  color,
  openAt,
  blinkAt,
  closeAt,
}) => {
  const frame = useCurrentFrame();
  const open = interpolate(
    frame,
    [openAt, openAt + 8, blinkAt, blinkAt + 3, blinkAt + 7, closeAt, closeAt + 6],
    [0, 1, 1, 0.05, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const eye = (cx: number, tilt: number) => (
    <div
      style={{
        position: "absolute",
        left: cx - size / 2,
        top: y - size / 4,
        width: size,
        height: size / 2,
        borderRadius: "50% 50% 50% 50% / 80% 80% 20% 20%",
        background: `radial-gradient(ellipse at 50% 60%, #fff4c8 0%, ${color} 40%, rgba(0,0,0,0) 72%)`,
        boxShadow: `0 0 ${size}px ${size * 0.3}px ${color}`,
        scale: `1 ${open}`,
        rotate: `${tilt}deg`,
        opacity: open > 0.02 ? 1 : 0,
      }}
    />
  );

  return (
    <>
      {eye(x - gap / 2, 12)}
      {eye(x + gap / 2, -12)}
    </>
  );
};

const SelvaOscuraInner: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  return (
    <>
      {/* Cold, moonless sky with the faintest infernal glow below */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #05070a 0%, #0b1015 38%, #10161a 62%, #0a0c0d 100%)",
        }}
      />
      <Interactive.Div
        name="Brilho do abismo"
        style={{
          position: "absolute",
          left: -200,
          right: -200,
          top: 1000,
          height: 1100,
          background:
            "radial-gradient(ellipse 50% 45% at 50% 70%, rgba(150, 30, 10, 0.55) 0%, rgba(80, 12, 4, 0.25) 45%, rgba(0,0,0,0) 75%)",
          opacity: interpolate(frame, [0, durationInFrames], [0.15, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.45, 0, 0.55, 1),
          }),
        }}
      />

      {/* Far trees, lost in mist */}
      <Interactive.Div
        name="Árvores distantes"
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "50% 62%",
          scale: interpolate(frame, [0, durationInFrames], [1, 1.06], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <ForestLayer
          seed="far"
          trees={FAR_TREES}
          groundY={1180}
          width={width}
          height={height}
          color="#1b242b"
          blur={3}
        />
      </Interactive.Div>
      <Fog
        id="selva-fog-far"
        seed={7}
        rgb={[0.42, 0.5, 0.55]}
        density={1.1}
        speedX={0.35}
        opacity={0.42}
        top={500}
        height={900}
        mask="linear-gradient(180deg, transparent 0%, black 35%, black 70%, transparent 100%)"
      />

      {/* The three beasts watch from the dark */}
      <Eyes x={300} y={1020} gap={46} size={22} color="#c8d84a" openAt={40} blinkAt={95} closeAt={200} />
      <Eyes x={790} y={940} gap={70} size={30} color="#ff8a1c" openAt={70} blinkAt={150} closeAt={210} />
      <Eyes x={560} y={1120} gap={52} size={24} color="#e6e1b0" openAt={105} blinkAt={170} closeAt={215} />

      {/* Middle trees */}
      <Interactive.Div
        name="Árvores médias"
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "50% 62%",
          scale: interpolate(frame, [0, durationInFrames], [1, 1.13], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <ForestLayer
          seed="mid"
          trees={MID_TREES}
          groundY={1260}
          width={width}
          height={height}
          color="#0b1014"
          blur={1}
        />
      </Interactive.Div>
      <Fog
        id="selva-fog-mid"
        seed={21}
        rgb={[0.3, 0.36, 0.4]}
        density={1}
        speedX={-0.5}
        opacity={0.6}
        top={900}
        height={700}
        mask="linear-gradient(180deg, transparent 0%, black 40%, black 70%, transparent 100%)"
      />

      {/* Near trees frame the shot */}
      <Interactive.Div
        name="Árvores próximas"
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "50% 62%",
          scale: interpolate(frame, [0, durationInFrames], [1, 1.24], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <ForestLayer
          seed="near"
          trees={NEAR_TREES}
          groundY={1500}
          width={width}
          height={height}
          color="#020303"
        />
      </Interactive.Div>

      <Embers
        seed="selva"
        count={28}
        color="rgba(255, 90, 30, 0.9)"
        coreColor="#ffd9a0"
        minSize={2}
        maxSize={6}
        speed={1.1}
        drift={80}
        opacity={interpolate(frame, [40, 200], [0, 0.7], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
      />

      {/* Legibility veil behind the verse */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1150,
          height: 770,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 30%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      <Interactive.Div
        name="Canto I"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1290,
          textAlign: "center",
          fontFamily: cinzel,
          fontWeight: 600,
          fontSize: 40,
          letterSpacing: "0.5em",
          color: "#b5482a",
          opacity: interpolate(frame, [20, 50, 192, 212], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [20, 60], ["0px 20px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        CANTO I
      </Interactive.Div>
      <RevealWords
        name="Verso italiano"
        text={"Nel mezzo del cammin di nostra vita\nmi ritrovai per una selva oscura"}
        delay={40}
        stagger={5}
        style={{
          top: 1380,
          fontFamily: cormorant,
          fontStyle: "italic",
          fontWeight: 500,
          fontSize: 62,
          lineHeight: 1.18,
          color: "#efe3cc",
          opacity: interpolate(frame, [192, 214], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <RevealWords
        name="Tradução"
        text={"No meio do caminho de nossa vida,\nencontrei-me numa selva escura"}
        delay={88}
        stagger={3}
        glowColor="rgba(0, 0, 0, 0)"
        style={{
          top: 1565,
          fontFamily: cormorant,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 44,
          lineHeight: 1.25,
          color: "#9b9286",
          opacity: interpolate(frame, [192, 214], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </>
  );
};

export const SelvaOscura = Interactive.create({
  Component: SelvaOscuraInner,
  layout: "absolute-fill",
});
