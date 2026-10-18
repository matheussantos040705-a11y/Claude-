import { noise2D } from "@remotion/noise";
import React from "react";
import { Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { cinzel, cormorant } from "../fonts";

// The title, flickering like a dying lamp in the dark, and the credits.
const EndTitleInner: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const flicker =
    frame < 22
      ? noise2D("title", frame * 1.7, 0) > -0.1
        ? 1
        : 0.15
      : 0.92 + 0.08 * noise2D("title-hold", frame * 0.2, 0);
  const out = interpolate(frame, [durationInFrames - 30, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      <Interactive.Div
        name="Inferno"
        style={{
          position: "absolute",
          left: -100,
          right: -100,
          top: 820,
          textAlign: "center",
          fontFamily: cinzel,
          fontWeight: 700,
          fontSize: 150,
          letterSpacing: "0.16em",
          color: "#efe6d6",
          textShadow: "0 0 50px rgba(170, 20, 0, 0.7), 0 0 120px rgba(120, 10, 0, 0.5)",
          opacity: flicker * out,
          scale: `${interpolate(frame, [0, durationInFrames], [1.0, 1.06])}`,
        }}
      >
        INFERNO
      </Interactive.Div>
      <Interactive.Div
        name="Dante Alighieri"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1015,
          textAlign: "center",
          fontFamily: cinzel,
          fontWeight: 600,
          fontSize: 38,
          letterSpacing: "0.55em",
          color: "#9c8f7c",
          opacity:
            interpolate(frame, [26, 50], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }) * out,
        }}
      >
        DANTE ALIGHIERI
      </Interactive.Div>
      <Interactive.Div
        name="Créditos"
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 1640,
          textAlign: "center",
          fontFamily: cormorant,
          fontStyle: "italic",
          fontSize: 30,
          lineHeight: 1.45,
          color: "#6f6658",
          opacity:
            interpolate(frame, [40, 60], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }) * out,
        }}
      >
        Gravuras de Gustave Doré (1861)
        <br />
        Música: “Hitman”, Kevin MacLeod (incompetech.com), CC BY 4.0
      </Interactive.Div>
    </>
  );
};

export const EndTitle = Interactive.create({
  Component: EndTitleInner,
  layout: "absolute-fill",
});
